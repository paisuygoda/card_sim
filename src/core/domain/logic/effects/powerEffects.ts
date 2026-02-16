/**
 * 国力増減効果の実装
 */

import { Effect, Nation, EffectType, ValueType } from '../../models';
import { GameEvent, IGameUIBridge } from '../../../infrastructure/IGameUIBridge';
import { safeAdd, safeSubtract, calculatePercentage } from '../GameMath';

/**
 * 国力増減効果を実行
 * @param effect 効果データ
 * @param targetNation 対象国家
 * @param bridge UIブリッジ
 */
export async function executePowerChange(
  effect: Effect,
  targetNation: Nation,
  bridge: IGameUIBridge
): Promise<void> {
  let changeAmount = 0;

  // 効果値の種類に応じて変化量を計算
  switch (effect.valueType) {
    case ValueType.FIXED:
      changeAmount = effect.value;
      break;
    case ValueType.PERCENTAGE:
      changeAmount = calculatePercentage(targetNation.power, effect.value);
      break;
    case ValueType.POWER_BASED:
      changeAmount = calculatePercentage(targetNation.power, effect.value);
      break;
    default:
      changeAmount = effect.value;
  }

  const oldPower = targetNation.power;

  // 効果タイプに応じて加算/減算
  if (effect.effectType === EffectType.POWER_GAIN) {
    targetNation.power = safeAdd(targetNation.power, changeAmount);
  } else if (effect.effectType === EffectType.POWER_LOSS) {
    targetNation.power = safeSubtract(targetNation.power, changeAmount);
  }

  // UI通知
  await bridge.notifyGameEvent(
    effect.effectType === EffectType.POWER_GAIN ? GameEvent.POWER_HEAL : GameEvent.POWER_DAMAGE,
    {
      nationId: targetNation.nationId,
      diffValue: targetNation.power - oldPower,
      visualType: effect.visualType,
    }
  );
}
