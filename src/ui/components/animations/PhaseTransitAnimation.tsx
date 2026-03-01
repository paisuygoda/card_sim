import React from 'react';
import { PhaseTransitData } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import { getPhaseDisplayName } from './helpers';
import styles from './PhaseTransitAnimation.module.css';

/**
 * PhaseTransitAnimation - PHASE_TRANSIT イベントの演出コンポーネント
 *
 * フェーズ遷移演出を表示する。
 * animation-overlay ラッパーなし。
 */
export const PhaseTransitAnimation: React.FC<AnimationRendererProps> = ({ data }) => {
  if (!data) return null;
  const d = data as PhaseTransitData;
  if (!d.phase) return null;

  const displayName = getPhaseDisplayName(d.phase);

  return (
    <div className={styles['phase-transit-overlay']} data-testid="phase-transit-display">
      <span className={styles['phase-name']} data-testid="phase-name">
        {displayName}
      </span>
    </div>
  );
};
