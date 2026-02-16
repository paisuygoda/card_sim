/**
 * 内政回数増減効果の実装
 */

import { Effect, Nation, EffectType, ValueType } from '../../models';
import { safeAdd, safeSubtract, calculatePercentage } from '../GameMath';

/**
 * 内政回数増減効果を実行
 * @param effect 効果データ
 * @param targetNation 対象国家
 */
export async function executeActionChange(
  effect: Effect,
  targetNation: Nation,
): Promise<void> {
  let changeAmount = 0;

  // 効果値の種類に応じて変化量を計算
  switch (effect.valueType) {
    case ValueType.FIXED:
      changeAmount = effect.value;
      break;
    case ValueType.PERCENTAGE:
      changeAmount = calculatePercentage(targetNation.remainingActions, effect.value);
      break;
    default:
      changeAmount = effect.value;
  }

  // 効果タイプに応じて加算/減算
  if (effect.effectType === EffectType.ACTION_GAIN) {
    targetNation.remainingActions = safeAdd(targetNation.remainingActions, changeAmount);
  } else if (effect.effectType === EffectType.ACTION_LOSS) {
    targetNation.remainingActions = safeSubtract(targetNation.remainingActions, changeAmount);
  }
}
