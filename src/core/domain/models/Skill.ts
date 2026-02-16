import { Effect } from './Effect';
import { TargetPattern } from './TargetPattern';

/**
 * スキルの演出種類を定義する列挙型
 */
export enum SkillVisualType {
  /** ダメージ演出 */
  ATTACK = 'ATTACK',
}

/**
 * スキルデータ構造
 * ユニットが戦闘時に使用する攻撃行動の詳細
 */
export interface Skill {
  /** スキルID */
  skillId: string;
  /** スキル名 */
  name: string;
  /** スキル演出種類 */
  skillVisualType: SkillVisualType;

  /** 発動優先度（高いほど先） */
  priority: number;
  /** 攻撃対象指定 */
  targetPattern: TargetPattern;

  /** 攻撃前効果 */
  preEffects: {target: 'SELF' | 'TARGET', effect: Effect}[];
  /** ユニットダメージ倍率 */
  damageRate: number;
  /** 国力奪取倍率 */
  powerStealRate: number;
  /** ユニット追加効果 */
  unitEffects: Effect[];
  /** 国家追加効果 */
  nationEffects: Effect[];
}
