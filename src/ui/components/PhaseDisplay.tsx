import React from 'react';
import { GamePhase } from '@core/domain/models';

/**
 * PhaseDisplay - フェーズ表示コンポーネント
 * 
 * 現在のゲームフェーズを表示
 */

interface PhaseDisplayProps {
  currentPhase: GamePhase;
  currentRound: number;
  currentTurnPlayer: number;
}

const phaseNameMap: Record<GamePhase, string> = {
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
};

export const PhaseDisplay: React.FC<PhaseDisplayProps> = ({
  currentPhase,
  currentRound,
  currentTurnPlayer,
}) => {
  // TODO: 実装
  // - 現在のラウンド数
  // - 現在の手番プレイヤー
  // - 現在のフェーズ

  return (
    <div className="phase-display">
      <p>ラウンド: {currentRound}</p>
      <p>手番: 国家{currentTurnPlayer + 1}</p>
      <p>フェーズ: {phaseNameMap[currentPhase]}</p>
    </div>
  );
};
