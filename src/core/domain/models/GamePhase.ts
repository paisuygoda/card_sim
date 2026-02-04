/**
 * ゲームフェーズの列挙型
 * ゲーム内のどの段階で効果が発動するかを定義
 */
export enum GamePhase {
  /** ゲーム開始時 */
  GAME_START = 'GAME_START',
  /** ラウンド開始時 */
  ROUND_START = 'ROUND_START',
  /** ターン開始時 */
  TURN_START = 'TURN_START',
  /** 内政フェーズ */
  DOMESTIC = 'DOMESTIC',
  /** 行動判断フェーズ（NPC専用） */
  ACTION_DECISION = 'ACTION_DECISION',
  /** 戦闘開始時 */
  BATTLE_START = 'BATTLE_START',
  /** 攻撃開始時 */
  ATTACK_START = 'ATTACK_START',
  /** 攻撃直前 */
  BEFORE_ATTACK = 'BEFORE_ATTACK',
  /** 攻撃直後 */
  AFTER_ATTACK = 'AFTER_ATTACK',
  /** 攻撃終了時 */
  ATTACK_END = 'ATTACK_END',
  /** 戦闘終了時 */
  BATTLE_END = 'BATTLE_END',
  /** 行動フェーズ */
  ACTION = 'ACTION',
  /** ターン終了時 */
  TURN_END = 'TURN_END',
  /** ラウンド終了時 */
  ROUND_END = 'ROUND_END',
  /** ゲーム終了時 */
  GAME_END = 'GAME_END',
}
