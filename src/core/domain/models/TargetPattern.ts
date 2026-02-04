/**
 * 攻撃対象パターンの列挙型
 * スキルがどの範囲・位置を攻撃するかを定義
 */
export enum TargetPattern {
  /** 前衛単体 */
  FRONT = 'FRONT',
  /** 中衛単体 */
  MID = 'MID',
  /** 後衛単体 */
  BACK = 'BACK',
  /** 前衛・中衛 */
  FRONT_MID = 'FRONT_MID',
  /** 中衛・後衛 */
  MID_BACK = 'MID_BACK',
  /** 前衛・後衛 */
  FRONT_BACK = 'FRONT_BACK',
  /** 全体 */
  ALL = 'ALL',
}
