import { GameState, GamePhase, Stage, Command } from '../domain/models';
import { MasterData } from '../domain/master';
import { IGameUIBridge, GameEvent, InputRequest } from '../infrastructure/IGameUIBridge';
import { executeEffect, selectNPCCommand, selectNPCAction, executeStateProcessing, executeBattle, decrementAllStateDurations } from '../domain/logic';

/**
 * GameManager - ゲーム進行制御
 * 
 * 設計書3章に基づき、ゲーム全体の進行をasync/awaitで管理
 * UIとの連携はIGameUIBridgeを通じて行う
 */
export class GameManager {
  private gameState: GameState;
  private bridge: IGameUIBridge;

  constructor(bridge: IGameUIBridge) {
    this.bridge = bridge;
    this.gameState = this.createInitialGameState();
  }

  /**
   * ゲーム開始（設計書3.1）
   * @param stage ステージデータ
   */
  async startGame(stage: Stage): Promise<void> {
    // 1. ゲーム開始フェーズ
    await this.gameStartPhase(stage);

    // 2. ラウンド処理ループ
    while (this.gameState.currentRound < this.gameState.roundLimit) {
      await this.executeRound();

      // 勝利条件チェック：滅亡していない国家が1つだけの場合は終了
      const aliveNations = this.gameState.nations.filter(
        (nation) => !nation.states.some((s) => s.stateId === 'nationDestroyed')
      );
      if (aliveNations.length <= 1) {
        await this.bridge.notifyGameEvent(GameEvent.PHASE_TRANSIT, {
          phase: 'EARLY_VICTORY'
        });
        break;
      }
    }

    // 3. ゲーム終了フェーズ
    await this.gameEndPhase();
  }

  /**
   * ゲーム開始フェーズ（設計書3.1.1）
   * @param stage ステージデータ
   */
  private async gameStartPhase(stage: Stage): Promise<void> {
    // フェーズ遷移通知
    this.gameState.currentPhase = GamePhase.GAME_START;
    await this.bridge.notifyGameEvent(GameEvent.PHASE_TRANSIT, {
      phase: GamePhase.GAME_START,
    });

    // 1. ステージデータ読み込み
    this.gameState.stageId = stage.stageId;
    this.gameState.roundLimit = stage.roundLimit;
    this.gameState.commandNum = stage.baseDomesticActions;
    this.gameState.currentRound = 0;
    this.gameState.currentTurnPlayer = 0;

    // 2. 国家データを初期化（ディープコピー）
    this.gameState.nations = stage.initialNations.map((nation) => ({
      ...nation,
      units: [...nation.units],
      graveyard: [...nation.graveyard],
      states: nation.states.map((s) => ({ ...s })),
      domesticCommands: [...nation.domesticCommands],
      actionCommands: [...nation.actionCommands],
    }));

    // 3. UIに通知
    this.bridge.updateGameState(this.gameState);
  }

  /**
   * ラウンド処理（設計書3.2）
   */
  private async executeRound(): Promise<void> {
    // 1. ラウンド開始フェーズ
    await this.roundStartPhase();

    // 2. 各国家のターン処理
    await this.executeNationTurns();

    // 3. ラウンド終了フェーズ
    await this.roundEndPhase();
  }

  /**
   * ラウンド開始フェーズ（設計書3.2.1）
   */
  private async roundStartPhase(): Promise<void> {
    // フェーズ遷移通知
    this.gameState.currentPhase = GamePhase.ROUND_START;
    await this.bridge.notifyGameEvent(GameEvent.PHASE_TRANSIT, {
      phase: GamePhase.ROUND_START,
    });

    // 1. ラウンド数インクリメント
    this.gameState.currentRound++;

    // 2. 手番初期化
    this.gameState.currentTurnPlayer = 0;

    // 3. 内政回数設定
    for (const nation of this.gameState.nations) {
      nation.remainingActions = this.gameState.commandNum;
    }

    // 4. ステート処理実行
      await executeStateProcessing(this.gameState, GamePhase.ROUND_START, this.bridge);

    // UIに通知
    this.bridge.updateGameState(this.gameState);

    await this.bridge.waitUI(); 
  }

  /**
   * 各国家のターン処理（設計書3.2.2）
   */
  private async executeNationTurns(): Promise<void> {
    for (let i = 0; i < this.gameState.nations.length; i++) {
      this.gameState.currentTurnPlayer = i;
      const nation = this.gameState.nations[i];

      // 滅亡チェック
      const isDestroyed = nation.states.some((s) => s.stateId === 'nationDestroyed');
      if (isDestroyed) {
        continue;
      }

      // ターン処理実行
      await this.executeTurn(i);
    }
  }

  /**
   * ラウンド終了フェーズ（設計書3.2.3）
   */
  private async roundEndPhase(): Promise<void> {
    // フェーズ遷移通知
    this.gameState.currentPhase = GamePhase.ROUND_END;
    await this.bridge.notifyGameEvent(GameEvent.PHASE_TRANSIT, {
      phase: GamePhase.ROUND_END,
    });

    // 1. 滅亡判定（国力が0の国家に滅亡ステートを付与）
    for (const nation of this.gameState.nations) {
      if (nation.power <= 0 && !nation.states.some((s) => s.stateId === 'nationDestroyed')) {
        nation.states.push(MasterData.getState('nationDestroyed', nation.nationId, nation.nationId));

        await this.bridge.notifyGameEvent(GameEvent.STATE_ADD, {
          targetNationId: nation.nationId,
          stateId: 'nationDestroyed',
        });
      }
    }

    // 4. ステート処理実行
      await executeStateProcessing(this.gameState, GamePhase.ROUND_END, this.bridge);

    // UIに通知
    this.bridge.updateGameState(this.gameState);

    await this.bridge.waitUI();
  }

  /**
   * ターン処理（設計書3.3）
   * @param nationIndex 国家インデックス
   */
  private async executeTurn(nationIndex: number): Promise<void> {
    const nation = this.gameState.nations[nationIndex];

    await this.bridge.notifyGameEvent(GameEvent.PHASE_TRANSIT, {
      phase: 'TURN_START_NOTIFY',
    });

    // 1. ターン開始フェーズ
    await this.turnStartPhase();

    // 2. 内政フェーズ
    const actionCommand = await this.domesticPhase(nationIndex);

    // 3. 返却されたコマンドに応じてフェーズ遷移
    if (actionCommand) {
      if (actionCommand.commandType === 'BATTLE') {
        // 戦闘フェーズへ
        await this.battlePhase(nation.nationId, actionCommand.targetId!);
      } else if (actionCommand.commandType === 'ACTION') {
        // 行動フェーズへ
        await this.actionPhase(actionCommand);
      }
    }

    // 4. ターン終了フェーズ
    await this.turnEndPhase();
  }

  /**
   * ターン開始フェーズ（設計書3.3.1）
   */
  private async turnStartPhase(): Promise<void> {
    this.gameState.currentPhase = GamePhase.TURN_START;
    // 4. ステート処理実行
    await executeStateProcessing(this.gameState, GamePhase.TURN_START, this.bridge);
    this.bridge.updateGameState(this.gameState);

    await this.bridge.waitUI();
  }

  /**
   * 内政フェーズ（設計書3.3.2）
   * @param nationIndex 国家インデックス
   * @returns 戦闘/行動フェーズで使用するコマンド、またはnull
   */
  private async domesticPhase(nationIndex: number): Promise<Command> {
    this.gameState.currentPhase = GamePhase.DOMESTIC;
    this.bridge.updateGameState(this.gameState);

    const nation = this.gameState.nations[nationIndex];

    // プレイヤーかNPCかで処理を振り分け
    if (nation.isNPC) {
      return await this.npcDomesticPhase(nationIndex);
    } else {
      return await this.playerDomesticPhase(nationIndex);
    }
  }

  /**
   * プレイヤー内政処理
   * @param nationIndex 国家インデックス
   * @returns 行動コマンド（DOMESTIC以外）
   */
  private async playerDomesticPhase(nationIndex: number): Promise<Command> {
    const nation = this.gameState.nations[nationIndex];

    // 内政コマンドを繰り返し実行
    while (true) {
      // 1. コマンド入力待ち（UI側で完全なコマンドが組み立てられる）
      const availableCommands = [...nation.domesticCommands, ...nation.actionCommands];
      const selectedCommand = await this.bridge.waitPlayerInput(
        InputRequest.SELECT_COMMAND,
        {
          commands: availableCommands,
          nation,
          gameState: this.gameState,
        }
      ) as Command;

      // 2. コマンドタイプを確認
      if (selectedCommand.commandType !== 'DOMESTIC') {
        // DOMESTIC以外の場合はコマンドを返却（ここでは実行せず、行動フェーズで実行）
        return selectedCommand;
      }

      // 3. 内政コマンドの場合は実行
      await this.executeCommand(selectedCommand);

    // 4. ステート処理実行
      await executeStateProcessing(this.gameState, GamePhase.DOMESTIC, this.bridge);

      this.bridge.updateGameState(this.gameState);
      await this.bridge.waitUI();
    }
  }

  /**
   * NPC内政処理
   * @param nationIndex 国家インデックス
   * @returns 行動コマンド
   */
  private async npcDomesticPhase(nationIndex: number): Promise<Command> {
    const nation = this.gameState.nations[nationIndex];

    // 内政コマンドを繰り返し実行
    while (true) {
      // 1. コマンド選択
      const selectedCommand = await selectNPCCommand(this.gameState, nation);

      // 2. 実行可能なコマンドがない場合は行動コマンドを選択して返却
      if (!selectedCommand) {
        return selectNPCAction(this.gameState, nation);
      }

      // 3. コマンド実行
      await this.executeCommand(selectedCommand);

    // 4. ステート処理実行
    await executeStateProcessing(this.gameState, GamePhase.DOMESTIC, this.bridge);

      this.bridge.updateGameState(this.gameState);
      await this.bridge.waitUI();
    }
  }

  /**
   * 戦闘フェーズ（設計書3.3.5）
   * @param attackerId 攻撃側国家ID
   * @param defenderId 防御側国家ID
   */
  private async battlePhase(
    attackerId: string,
    defenderId: string
  ): Promise<void> {
    // フェーズ遷移通知
    this.gameState.currentPhase = GamePhase.BATTLE_START;
    await this.bridge.notifyGameEvent(GameEvent.PHASE_TRANSIT, {
      phase: GamePhase.BATTLE_START,
    });

    // BattleLogicを呼び出して戦闘処理を実行
    await executeBattle(this.gameState, attackerId, defenderId, this.bridge);

    // UIに通知
    this.bridge.updateGameState(this.gameState);
    await this.bridge.waitUI();
  }

  /**
   * 行動フェーズ（設計書3.3.4）
   * @param command 実行するコマンド
   */
  private async actionPhase(command: Command): Promise<void> {
    this.gameState.currentPhase = GamePhase.ACTION;
    
    // 1. コマンド効果実行
    await this.executeCommand(command);

    // 4. ステート処理実行
      await executeStateProcessing(this.gameState, GamePhase.ACTION, this.bridge);
      await this.bridge.waitUI();
  }

  /**
   * ターン終了フェーズ（設計書3.3.6）
   */
  private async turnEndPhase(): Promise<void> {
    this.gameState.currentPhase = GamePhase.TURN_END;
    
    // 1. ステート処理実行
    await executeStateProcessing(this.gameState, GamePhase.TURN_END, this.bridge);

    // 2. ステート残りターン数減算
    const currentNationId = this.gameState.nations[this.gameState.currentTurnPlayer].nationId;
    await decrementAllStateDurations(currentNationId, this.gameState, this.bridge);

    this.bridge.updateGameState(this.gameState);

    await this.bridge.waitUI();
  }

  /**
   * ゲーム終了フェーズ（設計書3.1.3）
   */
  private async gameEndPhase(): Promise<void> {
    this.gameState.currentPhase = GamePhase.GAME_END;

    // 1. 勝者決定（国力最大の国家）
    // 同点の場合は手番順で優先（設計書3.1.3）
    const sortedNations = [...this.gameState.nations].sort(
      (a, b) => b.power - a.power
    );

    // 2. finalRankingをGameStateに設定
    this.gameState.finalRanking = sortedNations;

    // 3. UIに結果通知
    await this.bridge.notifyGameEvent(GameEvent.GAME_END, {
        finalRanking: sortedNations
    });

    this.bridge.updateGameState(this.gameState);
    
    await this.bridge.waitUI(); // UIの結果表示を待機
  }

  /**
   * コマンド実行
   * @param command 実行するコマンド
   */
  private async executeCommand(command: Command): Promise<void> {
    // コマンド実行通知
    await this.bridge.notifyGameEvent(GameEvent.COMMAND_EXECUTE, {
      commandName: command.name,
      commandType: command.commandType,
      commandVisualType: command.commandVisualType,
      commandTargetType: command.targetType,
      commandTarget: command.targetId,
    });

    for (const effect of command.effects) {
      await executeEffect(effect, this.gameState, this.bridge, {"selfId": this.gameState.nations[this.gameState.currentTurnPlayer].nationId, "selectedId": command.targetId});
    }

    await this.bridge.updateGameState(this.gameState);
  }

  /**
   * 初期ゲーム状態の生成
   */
  private createInitialGameState(): GameState {
    return {
      stageId: 0,
      commandNum: 0,
      currentRound: 0,
      roundLimit: 0,
      nations: [],
      currentTurnPlayer: 0,
      currentPhase: GamePhase.GAME_START,
      currentTarget: null,
      stateQueue: [],
      effectQueue: [],
      battleContext: null,
    };
  }

  /**
   * 現在のゲーム状態を取得
   */
  getGameState(): GameState {
    return this.gameState;
  }
}
