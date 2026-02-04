import { GameState, Nation, Command } from '../models';

/**
 * NPCLogic - NPC思考ロジック
 * 
 * 設計書3.3.2、3.3.3に基づき、NPCの行動判断を実行
 */

/**
 * NPC内政フェーズの処理（設計書3.3.2）
 * @param gameState ゲーム状態
 * @param npcNation NPC国家
 * @returns 選択されたコマンド（nullの場合は終了）
 */
export function selectDomesticCommand(
  gameState: GameState,
  npcNation: Nation
): Command | null {
  // TODO: 実装
  // 1. 選択可能な内政コマンドをプレビュー
  // 2. コマンド優先度スコアを計算
  // 3. 最も高いスコアのコマンドを選択
  return null;
}

/**
 * NPC行動判断フェーズの処理（設計書3.3.3）
 * @param gameState ゲーム状態
 * @param npcNation NPC国家
 * @returns 選択された行動（戦闘対象国家ID or 行動コマンド）
 */
export function selectAction(
  gameState: GameState,
  npcNation: Nation
): { type: 'battle'; targetNationId: number } | { type: 'action'; command: Command } {
  // TODO: 実装
  // 1. 敵対国の中で最も軍事力が近い国家を選択
  // 2. 自国軍事力 * 好戦度 > 敵国軍事力 なら戦闘
  // 3. そうでなければ行動コマンドを選択
  return { type: 'action', command: {} as Command };
}

/**
 * コマンド優先度スコアを計算
 * 国力 * 目標軍事力比率 + 前線ユニットのHP・攻撃力合計
 * @param nation 対象国家
 * @returns 優先度スコア
 */
export function calculateCommandPriorityScore(nation: Nation): number {
  // TODO: 実装
  return 0;
}

/**
 * コマンドをプレビュー実行して評価
 * @param gameState ゲーム状態のディープコピー
 * @param command プレビューするコマンド
 * @param nation 対象国家
 * @returns プレビュー後のスコア
 */
export function previewCommand(
  gameState: GameState,
  command: Command,
  nation: Nation
): number {
  // TODO: 実装
  // 1. ゲーム状態をディープコピー
  // 2. コマンドを実行
  // 3. 実行後のスコアを計算
  return 0;
}
