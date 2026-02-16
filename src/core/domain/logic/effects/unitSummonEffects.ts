/**
 * ユニット召喚・破壊・蘇生・移動効果の実装
 */

import { Effect, GameState, Unit, Nation } from '../../models';
import { MasterData } from '../../master';

/**
 * ユニット召喚効果を実行
 * @param effect 効果データ
 * @param gameState ゲーム状態
 * @param targetNation 対象国家
 * @param bridge UIブリッジ
 */
export async function executeSummonUnit(
  effect: Effect,
  targetNation: Nation,
): Promise<void> {
  const unitBaseId = String(effect.effectDetail);
  const newUnit = MasterData.getUnit(unitBaseId, targetNation.nationId);

  if (!newUnit) {
    console.warn(`Unit ${unitBaseId} not found`);
    return;
  }
  
  // targetNationにbaseUnitIdが同じユニットが既に存在する場合、unitIdがユニークになるよう末尾に"_数字"を付与
  const numOfSameUnit = targetNation.units.filter(u => u !== null && u.baseUnitId === unitBaseId).length + 1;
  if (numOfSameUnit > 1) {
    newUnit.unitId = `${newUnit.unitId}_${numOfSameUnit}`;
  }

  // ベンチに追加（nullの最初の要素を置き換え、なければ末尾に追加）
  const firstNullIndex = targetNation.units.findIndex(u => u === null);
  if (firstNullIndex !== -1) {
    targetNation.units[firstNullIndex] = newUnit;
  } else {
    targetNation.units.push(newUnit);
  }
}

/**
 * ユニット破壊効果を実行
 * @param effect 効果データ
 * @param gameState ゲーム状態
 * @param targetUnit 対象ユニット
 * @param bridge UIブリッジ
 */
export async function executeDestroyUnitEffect(
  _effect: Effect,
  gameState: GameState,
  targetUnit: Unit,
): Promise<void> {
  // 所有国家を検索
  const ownerNation = gameState.nations.find((n) => n.nationId === targetUnit.ownerNationId);
  if (!ownerNation) {
    console.warn(`Owner nation ${targetUnit.ownerNationId} not found`);
    return;
  }

  // ユニット配列から除去
  executeDestroyUnit(targetUnit, ownerNation);
}

/**
 * ユニット破壊効果を実行
 * @param targetUnit 対象ユニット
 * @param ownerNation 所有国家
 */
export async function executeDestroyUnit(
  targetUnit: Unit,
  ownerNation: Nation,
): Promise<void> {

  // ユニット配列から除去
  const unitIndex = ownerNation.units.findIndex((u) => u !== null && u.unitId === targetUnit.unitId);
  if (unitIndex !== -1) {
    ownerNation.units.splice(unitIndex, 1);
    // 墓地に追加
    ownerNation.graveyard.push(targetUnit);
  }
}

/**
 * ユニット蘇生効果を実行
 * @param effect 効果データ
 * @param targetNation 対象国家
 */
export async function executeReviveLatestUnit(
  _effect: Effect,
  targetNation: Nation,
): Promise<void> {
  // 墓地が空なら何もしない
  if (targetNation.graveyard.length === 0) {
    return;
  }

  // 墓地の最後のユニットを蘇生
  const revivedUnit = targetNation.graveyard.pop()!;
  
  // 死亡ステートを削除しHPを全快にして復活
  revivedUnit.states = revivedUnit.states.filter(s => s.stateId !== 'dead');
  revivedUnit.currentHP = revivedUnit.maxHP;
  
  // ベンチに追加（nullの最初の要素を置き換え、なければ末尾に追加）
  const firstNullIndex = targetNation.units.findIndex(u => u === null);
  if (firstNullIndex !== -1) {
    targetNation.units[firstNullIndex] = revivedUnit;
  } else {
    targetNation.units.push(revivedUnit);
  }
}

/**
 * ユニット移動効果を実行
 * @param effect 効果データ
 * @param gameState ゲーム状態
 * @param targetUnit 対象ユニット
 */
export async function executeMoveUnit(
  effect: Effect,
  gameState: GameState,
  targetUnit: Unit,
): Promise<void> {
  // 所有国家を検索
  const ownerNation = gameState.nations.find((n) => n.nationId === targetUnit.ownerNationId);
  if (!ownerNation) {
    console.warn(`Owner nation ${targetUnit.ownerNationId} not found`);
    return;
  }

  // 現在の位置を取得
  const currentIndex = ownerNation.units.findIndex((u) => u !== null && u.unitId === targetUnit.unitId);
  if (currentIndex === -1) {
    console.warn(`Unit ${targetUnit.unitId} not found in units array`);
    return;
  }

  // effect.valueは移動先のインデックス（負の値の場合は相対移動）
  let targetIndex: number;
  if (effect.value < 0) {
    // 相対移動（例: -1で1つ前に）
    targetIndex = currentIndex + effect.value;
  } else {
    // 絶対移動
    targetIndex = effect.value;
  }

  // 範囲チェック
  targetIndex = Math.max(0, Math.min(targetIndex, ownerNation.units.length - 1));

  // 移動先のユニットと入れ替え
  const temp = ownerNation.units[targetIndex];
  ownerNation.units[targetIndex] = targetUnit;
  ownerNation.units[currentIndex] = temp;
}
