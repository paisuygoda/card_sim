import { Skill } from './Skill';
import { State } from './State';

/**
 * ユニットデータ構造
 * 国家に所属する戦力単位
 */
export interface Unit {
  /** ユニットID */
  unitId: number;
  /** 所属国家ID */
  ownerNationId: number;
  /** ユニット名 */
  name: string;

  /** 最大HP */
  maxHP: number;
  /** 現在HP */
  currentHP: number;
  /** 攻撃力 */
  attack: number;

  /** 保有スキル */
  skill: Skill;
  /** ユニットステート配列（付与順） */
  states: State[];
}
