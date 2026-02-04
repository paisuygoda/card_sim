import { GameState, State, GamePhase, Nation, Unit } from '../models';

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
  // TODO: 実装
  // 1. 国家の優先順位順にソート
  // 2. 各国家内で国家ステート → ユニットステートの順に収集
  // 3. 各ステートの発動タイミングに現在フェーズが含まれているものだけを抽出
  return [];
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
  // TODO: 実装
  // 現在ターンプレイヤーを先頭に、以降は順送り
  return [];
}

/**
 * 国家内のステートを優先順位順に収集
 * @param nation 対象国家
 * @returns ステート配列（国家ステート → ユニットステート順）
 */
export function collectStatesFromNation(nation: Nation): State[] {
  // TODO: 実装
  // 1. 国家ステート
  // 2. ユニット配列の昇順でユニットステート
  return [];
}
