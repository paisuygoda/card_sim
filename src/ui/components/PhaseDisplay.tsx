import React, { useState, useEffect } from 'react';
import { GamePhase } from '@core/domain/models';
import { getPhaseDisplayName } from '../utils';
import styles from './PhaseDisplay.module.css';

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
    <div className={[styles['phase-display'], isChanging && 'phase-changing'].filter(Boolean).join(' ')}>
      <p>ラウンド: {roundDisplay}</p>
      <p>手番: {turnDisplay}</p>
      <p>フェーズ: {getPhaseDisplayName(currentPhase)}</p>
    </div>
  );
});

PhaseDisplay.displayName = 'PhaseDisplay';
