import { Effect } from './Effect';
import { TargetPattern } from './TargetPattern';

/**
 * スキルデータ構造
 * ユニットが戦闘時に使用する攻撃行動の詳細
 */
export interface Skill {
  /** スキルID */
  skillId: number;
  /** スキル名 */
  name: string;

  /** 発動優先度（高いほど先） */
  priority: number;
  /** 攻撃対象指定 */
  targetPattern: TargetPattern;

  /** 攻撃前効果 */
  preEffects: Effect[];
  /** ユニットダメージ倍率 */
  damageRate: number;
  /** 国力奪取倍率 */
  powerStealRate: number;
  /** ユニット追加効果 */
  unitEffects: Effect[];
  /** 国家追加効果 */
  nationEffects: Effect[];
}
