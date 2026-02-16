/**
 * CLI Test Tool - ゲームロジックのコンソールテスト
 * 
 * 使い方:
 * npm run play                    # 通常モード（プレイヤー入力）
 * AUTO_PLAY=true npm run play     # 自動プレイモード
 * STAGE_TYPE=mini npm run play    # ステージ選択
 * 
 * または:
 * npx tsx src/cli-test.ts
 */

import * as readline from 'readline';
import { GameManager } from './core/application/GameManager';
import { IGameUIBridge, GameEvent, InputRequest, GameEventDataMap } from './core/infrastructure/IGameUIBridge';
import { Stage, Command } from './core/domain/models';
import { STAGE_MASTER } from './core/domain/master/StageMaster';

/**
 * CLI用のUIブリッジ実装
 * コンソールログで情報を表示し、標準入力でプレイヤー入力を受け取る
 */
class CLIBridge implements IGameUIBridge {
  private rl: readline.Interface;
  private autoPlay: boolean;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.autoPlay = process.env.AUTO_PLAY === 'true';
  }

  async notifyGameEvent<T extends GameEvent>(
    eventType: T,
    data: GameEventDataMap[T]
  ): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎬 アニメーション: ${eventType}`);
    
    switch (eventType) {
      case GameEvent.PHASE_TRANSIT:
        if ('phase' in data) {
          console.log(`📍 フェーズ遷移: ${data.phase}`);
        }
        break;
      case GameEvent.UNIT_DAMAGE:
        if ('targetUnitId' in data && 'amount' in data) {
          console.log(`⚔️  ダメージ: ${data.targetUnitId} に ${data.amount} ダメージ`);
        }
        break;
      case GameEvent.POWER_HEAL:
        if ('nationId' in data && 'amount' in data) {
          console.log(`💰 国力変動: ${data.nationId} +${-data.amount}`);
        }
        break;
      case GameEvent.POWER_DAMAGE:
        if ('nationId' in data && 'amount' in data) {
          console.log(`💰 国力変動: ${data.nationId} -${data.amount}`);
        }
        break;
      case GameEvent.STATE_ADD:
        if ('stateId' in data) {
          const targetId = 'targetUnitId' in data ? data.targetUnitId : 'targetNationId' in data ? data.targetNationId : '';
          console.log(`✨ ステート付与: ${targetId} に ${data.stateId}`);
        }
        break;
      case GameEvent.STATE_REMOVE:
        if ('stateId' in data) {
          const targetId = 'targetUnitId' in data ? data.targetUnitId : 'targetNationId' in data ? data.targetNationId : '';
          console.log(`🗑️  ステート削除: ${targetId} から ${data.stateId}`);
        }
        break;
      case GameEvent.UNIT_SUMMON:
        if ('unitId' in data) {
          console.log(`🎭 ユニット召喚: ${data.unitId}`);
        }
        break;
      case GameEvent.UNIT_DESTROY:
        if ('unitId' in data) {
          console.log(`💀 ユニット破壊: ${data.unitId}`);
        }
        break;
      case GameEvent.SKILL_ACTIVATE:
        if ('attackerId' in data && 'skillId' in data) {
          console.log(`🌟 スキル発動: ${data.attackerId} の ${data.skillId}`);
        }
        break;
      case GameEvent.COMMAND_EXECUTE:
        if ('commandName' in data) {
          console.log(`📋 コマンド実行: ${data.commandName}`);
        }
        break;
      case GameEvent.BATTLE_START:
        if ('attackerNationId' in data && 'defenderNationId' in data) {
          console.log(`⚔️  戦闘開始: ${data.attackerNationId} vs ${data.defenderNationId}`);
        }
        break;
      case GameEvent.BATTLE_END:
        console.log(`🏁 戦闘終了`);
        break;
      case GameEvent.GAME_END:
        console.log(`🏁 ゲーム終了`);
        break;
      default:
        console.log(`データ: ${JSON.stringify(data, null, 2)}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  async waitUI (): Promise<void> {
    // 少し待機（読みやすさのため）
    await this.delay(1000);
    return;
  }

  async waitPlayerInput(requestType: InputRequest, context: any): Promise<Command> {
    console.log('\n┌────────────────────────────────────┐');
    console.log('│ 🎮 プレイヤー入力待ち               │');
    console.log('└────────────────────────────────────┘');

    switch (requestType) {
      case InputRequest.SELECT_COMMAND:
        return await this.selectCommand(context);
      case InputRequest.SELECT_TARGET:
        return await this.selectTarget(context);
      case InputRequest.CONFIRM:
        return await this.confirm(context);
      default:
        console.log(`未対応の入力タイプ: ${requestType}`);
        return {} as Command;
    }
  }

  updateGameState(gameState: any): void {
    console.log('\n📊 ゲーム状態更新');
    console.log(`   ラウンド: ${gameState.currentRound}/${gameState.roundLimit}`);
    console.log(`   フェーズ: ${gameState.currentPhase}`);
    console.log(`   手番: ${gameState.nations[gameState.currentTurnPlayer].name}`);
    
    // 各国家の状態を表示
    console.log('\n   国家状態:');
    gameState.nations.forEach((nation: any, index: number) => {
      const isCurrent = index === gameState.currentTurnPlayer;
      const marker = isCurrent ? '👉' : '  ';
      console.log(`   ${marker} ${nation.name}: 国力${nation.power} / 戦線 ${nation.units[0]?.name || 'なし'}/${nation.units[1]?.name || 'なし'}/${nation.units[2]?.name || 'なし'}/ / 残り内政${nation.remainingActions}`);
    });
    console.log('');
  }

  log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const prefix = {
      info: 'ℹ️ ',
      warning: '⚠️ ',
      error: '❌',
    }[level];
    console.log(`${prefix} ${message}`);
  }

  private async selectCommand(context: any): Promise<any> {
    const { commands, nation, gameState } = context;

    console.log(`\n${nation.name} のコマンド選択:`);
    console.log('─────────────────────────────────────');
    
    commands.forEach((cmd: Command, index: number) => {
      console.log(`  [${index + 1}] ${cmd.name} (${cmd.commandType})`);
    });

    let selectedCommand: Command;
    
    if (this.autoPlay) {
      console.log('\n🤖 自動プレイモード: 最初のコマンドを選択');
      await this.delay(500);
      selectedCommand = commands[0];
    } else {
      const answer = await this.question('\n番号を入力してください: ');
      const selectedIndex = parseInt(answer) - 1;

      if (selectedIndex >= 0 && selectedIndex < commands.length) {
        selectedCommand = commands[selectedIndex];
      } else {
        console.log('無効な選択です。最初のコマンドを選択します。');
        selectedCommand = commands[0];
      }
    }

    // targetTypeに応じて対象選択処理を追加
    if (selectedCommand.targetType === 'ENEMY_NATION' || 
        selectedCommand.targetType === 'SELF_UNIT' || 
        selectedCommand.targetType === 'ENEMY_UNIT') {
      const targetId = await this.selectTargetForCommand(selectedCommand, nation, gameState);
      return { ...selectedCommand, targetId };
    }

    return selectedCommand;
  }

  private async selectTargetForCommand(command: Command, nation: any, gameState: any): Promise<string> {
    console.log(`\n${command.name} の対象選択:`);
    console.log('─────────────────────────────────────');

    if (command.targetType === 'ENEMY_NATION') {
      // 敵国家を選択
      const enemyNations = gameState.nations.filter((n: any) => n.nationId !== nation.nationId);
      enemyNations.forEach((n: any, index: number) => {
        console.log(`  [${index + 1}] ${n.name} (国力: ${n.power})`);
      });

      if (this.autoPlay) {
        console.log('\n🤖 自動プレイモード: 最初の敵国を選択');
        await this.delay(300);
        return enemyNations[0].nationId;
      }

      const answer = await this.question('\n番号を入力してください: ');
      const selectedIndex = parseInt(answer) - 1;
      
      if (selectedIndex >= 0 && selectedIndex < enemyNations.length) {
        return enemyNations[selectedIndex].nationId;
      }
      return enemyNations[0].nationId;

    } else if (command.targetType === 'SELF_UNIT') {
      // 自国ユニットを選択
      const selfUnits = nation.units.filter((u: any) => u !== null);
      selfUnits.forEach((u: any, index: number) => {
        console.log(`  [${index + 1}] ${u.name} (HP: ${u.currentHP}/${u.maxHP})`);
      });

      if (this.autoPlay) {
        console.log('\n🤖 自動プレイモード: 最初のユニットを選択');
        await this.delay(300);
        return selfUnits[0].unitId;
      }

      const answer = await this.question('\n番号を入力してください: ');
      const selectedIndex = parseInt(answer) - 1;
      
      if (selectedIndex >= 0 && selectedIndex < selfUnits.length) {
        return selfUnits[selectedIndex].unitId;
      }
      return selfUnits[0].unitId;

    } else if (command.targetType === 'ENEMY_UNIT') {
      // 敵国ユニットを選択
      const enemyNations = gameState.nations.filter((n: any) => n.nationId !== nation.nationId);
      const enemyUnits: any[] = [];
      
      enemyNations.forEach((n: any) => {
        n.units.filter((u: any) => u !== null).forEach((u: any) => {
          enemyUnits.push({ ...u, nationName: n.name });
        });
      });

      enemyUnits.forEach((u: any, index: number) => {
        console.log(`  [${index + 1}] ${u.name} (${u.nationName}) (HP: ${u.currentHP}/${u.maxHP})`);
      });

      if (this.autoPlay) {
        console.log('\n🤖 自動プレイモード: 最初の敵ユニットを選択');
        await this.delay(300);
        return enemyUnits[0].unitId;
      }

      const answer = await this.question('\n番号を入力してください: ');
      const selectedIndex = parseInt(answer) - 1;
      
      if (selectedIndex >= 0 && selectedIndex < enemyUnits.length) {
        return enemyUnits[selectedIndex].unitId;
      }
      return enemyUnits[0].unitId;
    }

    return '';
  }

  private async selectTarget(context: any): Promise<any> {
    const { targets, message } = context;

    console.log(`\n${message || 'ターゲット選択'}:`);
    console.log('─────────────────────────────────────');
    
    targets.forEach((target: any, index: number) => {
      console.log(`  [${index + 1}] ${target.name || target}`);
    });

    const answer = await this.question('\n番号を入力してください: ');
    const selectedIndex = parseInt(answer) - 1;

    if (selectedIndex >= 0 && selectedIndex < targets.length) {
      return targets[selectedIndex];
    } else {
      console.log('無効な選択です。最初のターゲットを選択します。');
      return targets[0];
    }
  }

  private async confirm(context: any): Promise<any> {
    const { message } = context;
    console.log(`\n${message}`);
    const answer = await this.question('続行しますか？ (y/n): ');
    return answer.toLowerCase() === 'y';
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  close(): void {
    this.rl.close();
  }
}

/**
 * テスト用のステージデータを選択
 */
function selectTestStage(): Stage {
  // 環境変数またはコマンドライン引数でステージを選択可能
  const stageId = parseInt(process.env.STAGE_ID || '1');

  const stage = STAGE_MASTER[stageId];
  if (!stage) {
    console.log(`⚠️  ステージID ${stageId} が見つかりません。ステージ1を使用します。`);
    return STAGE_MASTER[1];
  }

  console.log(`📦 ステージ${stageId}を使用します`);
  console.log(`   - ラウンド制限: ${stage.roundLimit}`);
  console.log(`   - 国家数: ${stage.initialNations.length}`);
  console.log(`   - 勝利条件: ${stage.powerWinThreshold ? `国力${stage.powerWinThreshold}` : 'ラウンド終了時の最高国力'}`);
  
  return stage;
}

/**
 * メイン処理
 */
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  国家運営シミュレーションゲーム - CLI テスト   ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('📖 使い方:');
  console.log('   npm run play                      # 通常モード');
  console.log('   AUTO_PLAY=true npm run play       # 自動プレイ');
  console.log('');
  console.log('📖 ステージ選択:');
  console.log('   STAGE_ID=1 npm run play           # 初級ステージ（デフォルト）');
  console.log('   STAGE_ID=2 npm run play           # 中級ステージ');
  console.log('   STAGE_ID=3 npm run play           # 上級ステージ');
  console.log('');

  const bridge = new CLIBridge();

  try {
    // GameManagerの初期化
    console.log('🎮 ゲームマネージャーを初期化中...\n');
    const gameManager = new GameManager(bridge);

    // テストステージの選択
    console.log('🗺️  テストステージを選択中...\n');
    const testStage = selectTestStage();

    // ゲーム開始
    console.log('🚀 ゲームを開始します！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await gameManager.startGame(testStage);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ゲーム終了！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 最終結果を表示
    const finalState = gameManager.getGameState();
    console.log('📊 最終結果:');
    finalState.nations.forEach((nation, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`   ${medal} ${nation.name}: 国力 ${nation.power}`);
    });

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('   メッセージ:', error.message);
      console.error('   スタック:', error.stack);
    }
  } finally {
    bridge.close();
    console.log('\n👋 終了します\n');
    process.exit(0);
  }
}

// 実行
main().catch((error) => {
  console.error('致命的なエラー:', error);
  process.exit(1);
});
