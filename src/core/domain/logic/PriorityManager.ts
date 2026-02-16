import { GameState, State, GamePhase, Nation } from '../models';

/**
 * PriorityManager - 優先順位管理
 * 
 * 設計書4.2に基づき、以下のルールで優先順位を決定：
 * 1. 国家の優先順位（現在ターンプレイヤー → 次のターンプレイヤー...）
 * 2. 同一国家内での優先順位（国家ステート → ユニット配列の昇順）
 * 3. 発動者内での優先順位（ステート配列の先頭から順に）
 */

/**
 * ステート処理キューを作成
 * 優先順位に基づいてステートを並べたキューを生成
 * @param gameState 現在のゲーム状態
 * @param currentPhase 現在のフェーズ
 * @returns ステート処理キュー
 */
export function createStateQueue(
  gameState: GameState,
  currentPhase: GamePhase
): State[] {
  // 1. 国家の優先順位順にソート
  const sortedNations = sortNationsByPriority(
    gameState.nations,
    gameState.currentTurnPlayer
  );

  // 2. 各国家内で国家ステート → ユニットステートの順に収集
  const allStates: State[] = [];
  for (const nation of sortedNations) {
    const states = collectStatesFromNation(nation);
    allStates.push(...states);
  }

  // 3. 各ステートの発動タイミングに現在フェーズが含まれているものだけを抽出
  return allStates.filter(state => 
    state.triggerTimings.includes(currentPhase)
  );
}

/**
 * 国家の優先順位順にソート
 * @param nations 全国家配列
 * @param currentTurnPlayer 現在の手番プレイヤー
 * @returns ソート済み国家配列
 */
export function sortNationsByPriority(
  nations: Nation[],
  currentTurnPlayer: number
): Nation[] {
  // 現在ターンプレイヤーを先頭に、以降は順送り
  const sortedNations: Nation[] = [];
  const nationCount = nations.length;
  
  for (let i = 0; i < nationCount; i++) {
    const nationIndex = (currentTurnPlayer + i) % nationCount;
    sortedNations.push(nations[nationIndex]);
  }
  
  return sortedNations;
}

/**
 * 国家内のステートを優先順位順に収集
 * @param nation 対象国家
 * @returns ステート配列（国家ステート → ユニットステート順）
 */
export function collectStatesFromNation(nation: Nation): State[] {
  const states: State[] = [];
  
  // 1. 国家ステート
  states.push(...nation.states);
  
  // 2. ユニット配列の昇順でユニットステート
  for (const unit of nation.units) {
    if (unit !== null) {
    states.push(...unit.states);
    }
  }
  
  return states;
}
