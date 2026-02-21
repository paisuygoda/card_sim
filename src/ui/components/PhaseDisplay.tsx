import React, { useState, useEffect } from 'react';
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
  /** 最大ラウンド数。指定時は「currentRound/maxRound」形式で表示 */
  maxRound?: number;
  /** 現在手番の国家名。指定時は国家名を表示 */
  currentNationName?: string;
}

const phaseNameMap: Partial<Record<GamePhase, string>> = {
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

export const PhaseDisplay: React.FC<PhaseDisplayProps> = React.memo(({
  currentPhase,
  currentRound,
  currentTurnPlayer,
  maxRound,
  currentNationName,
}) => {
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setIsChanging(true);
    const timer = setTimeout(() => setIsChanging(false), 500);
    return () => clearTimeout(timer);
  }, [currentPhase]);

  const roundDisplay =
    maxRound !== undefined ? `${currentRound}/${maxRound}` : `${currentRound}`;

  const turnDisplay =
    currentNationName !== undefined
      ? currentNationName
      : `国家${currentTurnPlayer + 1}`;

  return (
    <div className={`phase-display${isChanging ? ' phase-changing' : ''}`}>
      <p>ラウンド: {roundDisplay}</p>
      <p>手番: {turnDisplay}</p>
      <p>フェーズ: {phaseNameMap[currentPhase] ?? currentPhase}</p>
    </div>
  );
});

PhaseDisplay.displayName = 'PhaseDisplay';
