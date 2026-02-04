import { State, Unit, Nation } from '../models';

/**
 * StateManager - ステート管理
 * 
 * 設計書4.3に基づき、ステートの付与・削除・更新を管理
 */

/**
 * ステート付与処理
 * 設計書4.3のフローに従ってステート付与を行う
 * 
 * @param target 付与対象（ユニットまたは国家）
 * @param stateId 付与予定のステートID
 * @param masterStates ステートマスターデータ
 * @returns 付与成功/失敗
 */
export function addState(
  target: Unit | Nation,
  stateId: number,
  masterStates: Map<number, State>
): boolean {
  // TODO: 実装
  // 1. マスターデータから取得
  // 2. すでに持っていない場合：
  //    - 上位排他チェック → 付与中断
  //    - 同位排他チェック → 既存削除して付与中断
  //    - 下位排他チェック → 既存削除して付与続行
  //    - ディープコピーして付与
  // 3. すでに持っている場合：
  //    - スタック数・残りターン数・残り発動回数を更新
  return false;
}

/**
 * ステート削除処理
 * @param target 対象（ユニットまたは国家）
 * @param stateId 削除するステートID
 * @returns 削除成功/失敗
 */
export function removeState(
  target: Unit | Nation,
  stateId: number
): boolean {
  // TODO: 実装
  return false;
}

/**
 * 排他ステートのチェックと処理
 * @param target 対象（ユニットまたは国家）
 * @param newState 付与予定のステート
 * @returns 付与可否（true: 付与可、false: 付与不可）
 */
export function checkExclusiveStates(
  target: Unit | Nation,
  newState: State
): boolean {
  // TODO: 実装
  // excludes[0]: 上位排他
  // excludes[1]: 同位排他
  // excludes[2]: 下位排他
  return true;
}

/**
 * ステート更新処理（既存ステートのリフレッシュ）
 * @param existingState 既存のステート
 * @param masterState マスターデータのステート
 */
export function refreshState(existingState: State, masterState: State): void {
  // TODO: 実装
  // スタック数・残りターン数・残り発動回数をマスターデータの値で更新
}

/**
 * ターン終了時のステート減衰処理
 * @param target 対象（ユニットまたは国家）
 */
export function decrementStateDurations(target: Unit | Nation): void {
  // TODO: 実装
  // 残りターン数をデクリメント、0になったら削除
}
