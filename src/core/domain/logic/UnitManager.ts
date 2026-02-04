import { Unit, Nation, GameState } from '../models';

/**
 * UnitManager - ユニット管理
 * 
 * 設計書4.5に基づき、ユニットのダメージ処理・死亡処理を管理
 */

/**
 * ユニットダメージ処理（設計書4.5）
 * HPの増減と死亡判定を行う
 * 
 * @param unit 対象ユニット
 * @param damage ダメージ量（負数で回復）
 * @param gameState ゲーム状態
 * @param masterStates ステートマスターデータ
 * @returns ユニットが死亡したかどうか
 */
export function applyUnitDamage(
  unit: Unit,
  damage: number,
  gameState: GameState,
  masterStates: Map<number, any>
): boolean {
  // TODO: 実装
  // 1. 現在HPに指定値を加算
  // 2. 加算後のHPが最大HPを超える場合、最大HPに設定
  // 3. 加算後のHPが0未満の場合：
  //    - 現在HPを0に設定
  //    - 死亡ステート付与を試みる
  //    - 死亡ステートが付与された場合、墓地に移動
  // 4. 死亡したかどうかを返す
  return false;
}

/**
 * ユニットを墓地に移動
 * @param unit 対象ユニット
 * @param nation 所属国家
 */
export function moveUnitToGraveyard(unit: Unit, nation: Nation): void {
  // TODO: 実装
  // 1. ユニット配列から削除（該当位置をnullに）
  // 2. 墓地配列にpush
}

/**
 * ユニットを蘇生
 * @param unit 対象ユニット
 * @param nation 所属国家
 * @param position 配置位置（0: 前衛、1: 中衛、2: 後衛、3～7: ベンチ）
 * @returns 蘇生成功/失敗
 */
export function reviveUnit(
  unit: Unit,
  nation: Nation,
  position: number
): boolean {
  // TODO: 実装
  // 1. 墓地から削除
  // 2. 指定位置が空いていればユニット配列に配置
  // 3. HPを最大HPに戻す
  return false;
}

/**
 * ユニットの位置を移動
 * @param unit 対象ユニット
 * @param nation 所属国家
 * @param newPosition 新しい位置
 * @returns 移動成功/失敗
 */
export function moveUnit(
  unit: Unit,
  nation: Nation,
  newPosition: number
): boolean {
  // TODO: 実装
  return false;
}

/**
 * 軍事力を計算（設計書3.3.3）
 * 前線に出ているユニットのHPと攻撃力の合計 * ステート補正
 * @param nation 対象国家
 * @returns 軍事力
 */
export function calculateMilitaryPower(nation: Nation): number {
  // TODO: 実装
  // 前線（インデックス0～2）のユニットのHP+攻撃力の合計
  // ステート補正を掛ける
  return 0;
}
