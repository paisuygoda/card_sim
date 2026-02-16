import { Command, CommandType, CommandVisualType, CommandTargetType } from '../models/Command';
import { EFFECT_MASTER } from './EffectMaster';
import { EffectType, EffectTarget, ValueType, EffectVisualType } from '../models/Effect';


export const COMMAND_MASTER: Record<string, Command> = {
  // 内政：徴税
  "getTax": {
    commandId: "getTax",
    commandType: CommandType.DOMESTIC,
    name: '徴税',
    commandVisualType: CommandVisualType.DOMESTIC,
    costAction: 1,
    costPower: 0,
    unitSpace: 0,
    targetType: CommandTargetType.SELF_NATION,
    effects: [
      EFFECT_MASTER["consumeAction"],
      EFFECT_MASTER["powerGain50"],
    ],
  },
  // 内政：軍備増強
  "militaryBuildUp": {
    commandId: "militaryBuildUp",
    commandType: CommandType.DOMESTIC,
    name: '軍備増強',
    commandVisualType: CommandVisualType.DOMESTIC,
    costAction: 1,
    costPower: 50,
    unitSpace: 0,
    targetType: CommandTargetType.SELF_NATION,
    effects: [
      EFFECT_MASTER["consumeAction"],
      EFFECT_MASTER["powerLoss50"],
      {
        effectType: EffectType.UNIT_MAX_HP_GAIN,
        visualType: EffectVisualType.NONE,
        target: EffectTarget.SELF_ALL_UNITS,
        valueType: ValueType.FIXED,
        value: 20,
      },
      {
        effectType: EffectType.UNIT_HP_GAIN,
        visualType: EffectVisualType.NONE,
        target: EffectTarget.SELF_ALL_UNITS,
        valueType: ValueType.FIXED,
        value: 20,
      },
      {
        effectType: EffectType.UNIT_ATTACK_GAIN,
        visualType: EffectVisualType.NONE,
        target: EffectTarget.SELF_ALL_UNITS,
        valueType: ValueType.FIXED,
        value: 20,
      },
    ],
  },
  // 内政：歩兵召喚
  "summonInfantry": {
    commandId: "summonInfantry",
    commandType: CommandType.DOMESTIC,
    name: '歩兵召喚',
    commandVisualType: CommandVisualType.DOMESTIC,
    costAction: 1,
    costPower: 50,
    unitSpace: 1,
    targetType: CommandTargetType.SELF_NATION,
    effects: [
      EFFECT_MASTER["consumeAction"],
      EFFECT_MASTER["powerLoss50"],
      EFFECT_MASTER["summonInfantry"],
    ],
  },
  // 戦闘
  "battle": {
    commandId: "battle",
    commandType: CommandType.BATTLE,
    name: '戦闘',
    commandVisualType: CommandVisualType.ACTION,
    costAction: 0,
    costPower: 0,
    unitSpace: 0,
    targetType: CommandTargetType.ENEMY_NATION,
    effects: [],
  },
  // 行動：訓練
  "training": {
    commandId: "training",
    commandType: CommandType.ACTION,
    name: '訓練',
    commandVisualType: CommandVisualType.ACTION,
    costAction: 0,
    costPower: 0,
    unitSpace: 0,
    targetType: CommandTargetType.SELF_NATION,
    effects: [
      {
        effectType: EffectType.UNIT_ATTACK_GAIN,
        visualType: EffectVisualType.NONE,
        target: EffectTarget.SELF_ALL_UNITS,
        valueType: ValueType.PERCENTAGE,
        value: 10,
      },
    ],
  },
} as const;
