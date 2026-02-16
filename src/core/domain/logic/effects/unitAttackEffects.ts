/**
 * ユニット攻撃力増減効果の実装
 */

import { Effect, Unit, EffectType, ValueType } from '../../models';
import { safeAdd, safeSubtract, calculatePercentage } from '../GameMath';

/**
 * ユニット攻撃力増減効果を実行
 * @param effect 効果データ
 * @param targetUnit 対象ユニット
 */
export async function executeUnitAttackChange(
  effect: Effect,
  targetUnit: Unit
): Promise<void> {
  let changeAmount = 0;

  // 効果値の種類に応じて変化量を計算
  switch (effect.valueType) {
    case ValueType.FIXED:
      changeAmount = effect.value;
      break;
    case ValueType.PERCENTAGE:
      changeAmount = calculatePercentage(targetUnit.attack, effect.value);
      break;
    case ValueType.ATTACK_BASED:
      changeAmount = calculatePercentage(targetUnit.attack, effect.value);
      break;
    case ValueType.HP_BASED:
      changeAmount = calculatePercentage(targetUnit.currentHP, effect.value);
      break;
    default:
      changeAmount = effect.value;
  }

  // 効果タイプに応じて加算/減算
  if (effect.effectType === EffectType.UNIT_ATTACK_GAIN) {
    targetUnit.attack = safeAdd(targetUnit.attack, changeAmount);
  } else if (effect.effectType === EffectType.UNIT_ATTACK_LOSS) {
    targetUnit.attack = safeSubtract(targetUnit.attack, changeAmount);
  }
}
