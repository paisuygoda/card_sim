import { GamePhase } from '@core/domain/models';

/**
 * GamePhase の日本語表示名マップ
 *
 * PhaseDisplay と AnimationDisplay で共通利用する。
 * 'EARLY_VICTORY' は GamePhase 列挙値に存在しないため文字列リテラルとして含む。
 */
export const PHASE_DISPLAY_NAMES: Record<string, string> = {
  [GamePhase.GAME_START]: 'ゲーム開始',
  [GamePhase.ROUND_START]: 'ラウンド開始',
  [GamePhase.TURN_START]: 'ターン開始',
  [GamePhase.DOMESTIC]: '内政フェーズ',
  [GamePhase.ACTION_DECISION]: '行動判断',
  [GamePhase.BATTLE_START]: '戦闘開始',
  [GamePhase.ATTACK_START]: '攻撃開始',
  [GamePhase.BEFORE_ATTACK]: '攻撃直前',
  [GamePhase.AFTER_ATTACK]: '攻撃直後',
  [GamePhase.ATTACK_END]: '攻撃終了',
  [GamePhase.BATTLE_END]: '戦闘終了',
  [GamePhase.ACTION]: '行動フェーズ',
  [GamePhase.TURN_END]: 'ターン終了',
  [GamePhase.ROUND_END]: 'ラウンド終了',
  [GamePhase.GAME_END]: 'ゲーム終了',
  [GamePhase.ALWAYS]: '常時',
  [GamePhase.SCOUT_CALCULATION]: '軍事力計算',
  [GamePhase.BATTLE_CALCULATION]: '戦闘計算',
  EARLY_VICTORY: '早期勝利',
};

/**
 * GamePhase（または文字列）を日本語表示名に変換する
 */
export function getPhaseDisplayName(phase: GamePhase | string): string {
  return PHASE_DISPLAY_NAMES[phase] ?? phase;
}
