/**
 * ユニットHP増減効果の実装
 */

import { Effect, Unit, EffectType, ValueType } from '../../models';
import { IGameUIBridge, GameEvent } from '../../../infrastructure/IGameUIBridge';
import { safeAdd, safeSubtract, calculatePercentage, clamp } from '../GameMath';
import { hasState } from '../UnitManager';
import { addState } from './stateEffects';


/**
 * ユニットHP増減効果を実行
 * @param effect 効果データ
 * @param targetUnit 対象ユニット
 * @param bridge UIブリッジ
 */
export async function executeUnitHPChange(
  effect: Effect,
  targetUnit: Unit,
  bridge: IGameUIBridge
): Promise<void> {
  let changeAmount = 0;

  // 効果値の種類に応じて変化量を計算
  switch (effect.valueType) {
    case ValueType.FIXED:
      changeAmount = effect.value;
      break;
    case ValueType.PERCENTAGE:
      if (effect.effectType === EffectType.UNIT_MAX_HP_GAIN || effect.effectType === EffectType.UNIT_MAX_HP_LOSS) {
        changeAmount = calculatePercentage(targetUnit.maxHP, effect.value);
      } else {
        changeAmount = calculatePercentage(targetUnit.currentHP, effect.value);
      }
      break;
    case ValueType.HP_BASED:
      changeAmount = calculatePercentage(targetUnit.maxHP, effect.value);
      break;
    case ValueType.ATTACK_BASED:
      changeAmount = calculatePercentage(targetUnit.attack, effect.value);
      break;
    default:
      changeAmount = effect.value;
  }

  const oldHP = targetUnit.currentHP;
  const oldMaxHP = targetUnit.maxHP;

  // 効果タイプに応じて処理を分岐
  switch (effect.effectType) {
    case EffectType.UNIT_MAX_HP_GAIN:
      targetUnit.maxHP = safeAdd(targetUnit.maxHP, changeAmount);
      targetUnit.currentHP = safeAdd(targetUnit.currentHP, changeAmount);
      break;
    case EffectType.UNIT_MAX_HP_LOSS:
      targetUnit.maxHP = safeSubtract(targetUnit.maxHP, changeAmount);
      // 現在HPが最大HPを超えないように調整
      targetUnit.currentHP = clamp(targetUnit.currentHP, 0, targetUnit.maxHP);
      break;
    case EffectType.UNIT_HP_GAIN:
      await applyUnitDamage(targetUnit, -changeAmount);
      break;
    case EffectType.UNIT_HP_LOSS:
      await applyUnitDamage(targetUnit, changeAmount);
      break;
  }

  // UI通知
  let gameEvent: GameEvent;
  switch (effect.effectType) {
    case EffectType.UNIT_MAX_HP_GAIN:
      gameEvent = GameEvent.UNIT_MAX_HP_GAIN;
      break;
    case EffectType.UNIT_MAX_HP_LOSS:
      gameEvent = GameEvent.UNIT_MAX_HP_LOSS;
      break;
    case EffectType.UNIT_HP_GAIN:
      gameEvent = GameEvent.UNIT_HEAL;
      break;
    case EffectType.UNIT_HP_LOSS:
      gameEvent = GameEvent.UNIT_DAMAGE;
      break;
    default:
      gameEvent = GameEvent.UNIT_DAMAGE;
  }
  const diff = [EffectType.UNIT_MAX_HP_GAIN, EffectType.UNIT_MAX_HP_LOSS].includes(effect.effectType)
    ? targetUnit.maxHP - oldMaxHP
    : targetUnit.currentHP - oldHP;
    
  await bridge.notifyGameEvent(gameEvent, {
    targetUnitId: targetUnit.unitId || '',
    amount: Math.abs(diff),
    visualType: effect.visualType,
  });
}

/**
 * ユニットダメージ処理（設計書4.5）
 * HPの増減と死亡判定を行う
 * 
 * @param unit 対象ユニット
 * @param damage ダメージ量（負数で回復）
 * @param gameState ゲーム状態
 * @param _bridge UIブリッジ (将来の拡張用)
 * @returns ユニットが死亡したかどうか
 */
export async function applyUnitDamage(
  unit: Unit,
  damage: number,
): Promise<boolean> {
  // 1. 現在HPに指定値を加算
  const newHP = unit.currentHP - damage;
  
  // 2. 加算後のHPが最大HPを超える場合、最大HPに設定
  if (newHP > unit.maxHP) {
    unit.currentHP = unit.maxHP;
    return false;
  }
  
  // 3. 加算後のHPが0未満の場合
  if (newHP <= 0) {
    unit.currentHP = 0;
    
    // 死亡ステート付与を試みる
    addState(unit, 'dead');
    return hasState(unit, 'dead');
  }
  
  // 通常のダメージ
  unit.currentHP = newHP;
  return false;
}