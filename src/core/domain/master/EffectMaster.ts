import { Effect, EffectType, EffectTarget, ValueType, EffectVisualType } from '../models/Effect';

export const EFFECT_MASTER: Record<string, Effect> = {
  // 内政回数消費
  "consumeAction": {
    effectType: EffectType.ACTION_LOSS,
    visualType: EffectVisualType.NONE,
    target: EffectTarget.SELF_NATION,
    valueType: ValueType.FIXED,
    value: 1,
  },
  // 国力増加効果
  "powerGain50": {
    effectType: EffectType.POWER_GAIN,
    visualType: EffectVisualType.BUFF,
    target: EffectTarget.SELF_NATION,
    valueType: ValueType.FIXED,
    value: 50,
  },
  // 国力増加効果
  "powerLoss50": {
    effectType: EffectType.POWER_LOSS,
    visualType: EffectVisualType.DEBUFF,
    target: EffectTarget.SELF_NATION,
    valueType: ValueType.FIXED,
    value: 50,
  },
  // 単体ダメージ効果
  "attackDamage": {
    effectType: EffectType.UNIT_HP_LOSS,
    visualType: EffectVisualType.DAMAGE,
    target: EffectTarget.TARGET_UNIT,
    valueType: ValueType.ATTACK_BASED,
    value: 1.0,
  },
  // 自身のHP回復効果
  "selfHeal30": {
    effectType: EffectType.UNIT_HP_GAIN,
    visualType: EffectVisualType.HEAL,
    target: EffectTarget.SELF_UNIT,
    valueType: ValueType.FIXED,
    value: 30,
  },
  // 歩兵召喚
  "summonInfantry": {
    effectType: EffectType.SUMMON_UNIT,
    visualType: EffectVisualType.SUMMON,
    target: EffectTarget.SELF_NATION,
    valueType: ValueType.FIXED,
    value: 1,
    effectDetail: "infantry"
  },
} as const;
