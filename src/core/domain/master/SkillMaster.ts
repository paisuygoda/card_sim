import { Skill, SkillVisualType } from '../models/Skill';
import { TargetPattern } from '../models/TargetPattern';
import { EFFECT_MASTER } from './EffectMaster';

export const SKILL_MASTER: Record<string, Skill> = {
  // 通常攻撃
  "normalAttack": {
    skillId: "normalAttack",
    name: '通常攻撃',
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT,
    preEffects: [],
    damageRate: 1.0,
    powerStealRate: 0.1,
    unitEffects: [],
    nationEffects: [],
  },
  // 範囲攻撃
  "areaAttack": {
    skillId: "areaAttack",
    name: '範囲攻撃',
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT_MID,
    preEffects: [],
    damageRate: 0.8,
    powerStealRate: 0.15,
    unitEffects: [],
    nationEffects: [],
  },
  // 自己回復攻撃
  "absorptionAttack": {
    skillId: "absorptionAttack",
    name: '吸収攻撃',
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT,
    preEffects: [],
    damageRate: 0.9,
    powerStealRate: 0.1,
    unitEffects: [EFFECT_MASTER[1003]],
    nationEffects: [],
  },
} as const;
