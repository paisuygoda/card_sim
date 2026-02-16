import { GameState, Nation, Command } from '../models';
import { executeEffect } from './EffectExecutor';
import { calculateMilitaryPower } from './NationManager';

/**
 * NPCLogic - NPC思考ロジック
 * 
 * 設計書3.3.2、3.3.3に基づき、NPCの行動判断を実行
 */

/**
 * NPC内政フェーズの処理（設計書3.3.2）
 * @param gameState ゲーム状態
 * @param npcNation NPC国家
 * @returns 選択されたコマンド（nullの場合は実行可能なコマンドがない）
 */
export async function selectNPCCommand(
  gameState: GameState,
  npcNation: Nation
): Promise<Command | null> {
  // 1. 実行可能な内政コマンドを列挙
    const nullCount = npcNation.units.filter(u => u === null).length;
  const availableCommands = npcNation.domesticCommands.filter((cmd) => {
    return npcNation.remainingActions >= cmd.costAction && 
           npcNation.power >= cmd.costPower &&
           nullCount >= cmd.unitSpace;
  });

  // 2. 実行可能なコマンドがない場合はnullを返す
  if (availableCommands.length === 0) {
    return null;
  }

  // 3. 選択可能な内政コマンド全てについてプレビュー実行し、スコアを計算
  const commandScores: Array<{ command: Command; score: number }> = [];
  
  for (const command of availableCommands) {
    const score = await previewCommand(gameState, command, npcNation.nationId);
    commandScores.push({ command, score });
  }

  // 4. スコアが最も高いコマンドを選択
  commandScores.sort((a, b) => b.score - a.score);
  return commandScores[0].command;
}

/**
 * NPC行動判断の処理（設計書3.3.3）
 * @param gameState ゲーム状態
 * @param npcNation NPC国家
 * @returns 選択されたコマンド（戦闘コマンド or 行動コマンド）
 */
export async function selectNPCAction(
  gameState: GameState,
  npcNation: Nation
): Promise<Command> {
  // 1. 敵対国IDの配列に含まれている国家の中で、最も軍事力の差が大きい国家を候補国として選ぶ
  const hostileNations = gameState.nations.filter(
    (n) => npcNation.hostileNationIds.includes(n.nationId)
  );

  if (hostileNations.length === 0) {
    // 敵対国家がいない場合は行動コマンドを選択
    return await selectBestActionCommand(gameState, npcNation);
  }

  const selfMilitary = calculateMilitaryPower(npcNation);
  
  let candidateNation: Nation | null = null;
  let maxMilitaryDiff = -Infinity;

  for (const hostile of hostileNations) {
    const hostileMilitary = calculateMilitaryPower(hostile);
    const diff = selfMilitary - hostileMilitary;
    if (diff > maxMilitaryDiff) {
      maxMilitaryDiff = diff;
      candidateNation = hostile;
    }
  }

  // 2. 自国の軍事力 * 好戦度 > 候補国の軍事力の場合、候補国を戦闘対象国として決定
  if (candidateNation) {
    const candidateMilitary = calculateMilitaryPower(candidateNation);
    
    if (selfMilitary * npcNation.aggressiveness > candidateMilitary) {
      // 戦闘コマンドを返却（targetIdに候補国のnationIdを設定）
      const battleCommand = npcNation.actionCommands.find(cmd => cmd.commandType === 'BATTLE');
      if (battleCommand) {
        return {
          ...battleCommand,
          targetId: candidateNation.nationId,
        };
      }
    }
  }

  // 3. そうでない場合、選択可能な行動コマンド全てについてプレビューし、最高スコアのコマンドを選択
  return await selectBestActionCommand(gameState, npcNation);
}

/**
 * 最適な行動コマンドを選択
 * @param gameState ゲーム状態
 * @param npcNation NPC国家
 * @returns 選択されたコマンド
 */
async function selectBestActionCommand(
  gameState: GameState,
  npcNation: Nation
): Promise<Command> {
  // 選択可能な行動コマンド全てについてプレビュー実行し、スコアを計算
  const actionCommands = npcNation.actionCommands.filter(cmd => cmd.commandType === 'ACTION');
  
  if (actionCommands.length === 0) {
    // 行動コマンドがない場合は最初のコマンドを返す
    return npcNation.actionCommands[0];
  }

  const commandScores: Array<{ command: Command; score: number }> = [];
  
  for (const command of actionCommands) {
    const score = await previewCommand(gameState, command, npcNation.nationId);
    commandScores.push({ command, score });
  }

  // スコアが最も高いコマンドを選択
  commandScores.sort((a, b) => b.score - a.score);
  return commandScores[0].command;
}

/**
 * コマンド優先度スコアを計算
 * 国力 * 目標軍事力比率 + 前線ユニットのHP・攻撃力合計
 * @param nation 対象国家
 * @returns 優先度スコア
 */
export function calculateCommandPriorityScore(nation: Nation): number {
  // 1. 国力 * 目標軍事力比率
  const powerScore = nation.power * nation.targetMilitaryRatio;

  // 2. 前線ユニット（インデックス0～2）のHP・攻撃力合計
  const frontlineUnits = nation.units.slice(0, 3).filter((u): u is NonNullable<typeof u> => u !== null);
  const militaryScore = frontlineUnits.reduce(
    (sum, unit) => sum + (unit.maxHP + unit.attack) * unit.currentHP / unit.maxHP,
    0
  );

  return powerScore + militaryScore;
}

/**
 * コマンドをプレビュー実行して評価
 * @param gameState ゲーム状態
 * @param command プレビューするコマンド
 * @param nationId 対象国家ID
 * @returns プレビュー後のスコア
 */
export async function previewCommand(
  gameState: GameState,
  command: Command,
  nationId: string
): Promise<number> {
  // 1. ゲーム状態をディープコピー
  const previewState = deepCopyGameState(gameState);

  // 2. ディープコピーの中でコマンドを実行(演出なし)
  const nullBridge = createPreviewBridge();

  for (const effect of command.effects) {
    await executeEffect(
      effect,
      previewState,
      nullBridge,
      { selfId: nationId, selectedId: command.targetId },
    );
  }

  // 3. 実行後のスコアを計算
  const previewNation = previewState.nations.find(n => n.nationId === nationId);
  if (!previewNation) {
    return 0;
  }

  return calculateCommandPriorityScore(previewNation);
}

/**
 * ゲーム状態のディープコピーを作成
 */
function deepCopyGameState(gameState: GameState): GameState {
  return JSON.parse(JSON.stringify(gameState));
}

/**
 * プレビュー用のダミーブリッジを作成
 */
function createPreviewBridge() {
  return {
    updateGameState: () => {},
    notifyGameEvent: async () => {},
    waitPlayerInput: async () => { throw new Error('waitPlayerInput should not be called in preview mode'); },
    waitUI: async () => {},
    log: () => {},
  };
}
