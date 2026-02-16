import { Unit } from './Unit';

/**
 * 戦闘管理データ構造
 * 戦闘フェーズ中の状態を管理
 */
export interface BattleContext {
  /** 攻撃側国家ID */
  attackerNationId: string;
  /** 防御側国家ID */
  defenderNationId: string;

  /** 攻撃順序配列 */
  attackOrder: Unit[];
  /** 現在処理中の攻撃インデックス */
  currentAttackIndex: number;

  /** 攻撃中ユニット */
  currentAttacker?: Unit;
  /** 被攻撃ユニット配列（null含む） */
  targetUnits: (Unit | null)[];
  /** 現在処理中の被攻撃ユニットインデックス */
  targetIndex: number;

  /** 暫定国力奪取量 */
  pendingPowerDamage: number;
}
