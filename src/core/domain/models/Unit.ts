import { State } from './State';

/**
 * ユニットデータ構造
 * 国家に所属する戦力単位
 */
export interface Unit {
  /** ユニット基本ID */
  baseUnitId: string;
  /** ユニットID */
  unitId?: string;
  /** 所属国家ID */
  ownerNationId?: string;
  /** ユニット名 */
  name: string;

  /** 最大HP */
  maxHP: number;
  /** 現在HP */
  currentHP: number;
  /** 攻撃力 */
  attack: number;

  /** 保有スキルID */
  skillId: string;

  /** ユニットステート配列（付与順） */
  states: State[];

  /** 開発用メモ */
    memo?: string;
}

export const validateUnitMaster = (unit: Unit): boolean => {
  if (!unit.baseUnitId || !unit.name || unit.maxHP <= 0 || unit.attack < 0 || !unit.skillId) {
    return false;
  }

  if (unit.currentHP < 0 || unit.currentHP > unit.maxHP) {
    return false;
  }

  // IDから国家・ユニット識別子が抽出できるようbaseUnitIdに"-"と"_"が含まれていないことを保証
  if (unit.baseUnitId.includes('-') || unit.baseUnitId.includes('_')) {
    return false;
  }

  return true;
}

export const validateUnitInstance = (unit: Unit): boolean => {
  if (!unit.unitId || !unit.ownerNationId) {
    return false;
  }

  return validateUnitMaster(unit);
}