import React from 'react';
import { UnitHPEventData } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import { getUnitName } from './helpers';
import styles from './HealAnimation.module.css';

/**
 * HealAnimation - UNIT_HEAL イベントの演出コンポーネント
 *
 * 回復演出を表示する。
 * animation-overlay ラッパーなし。
 */
export const HealAnimation: React.FC<AnimationRendererProps> = ({ data, gameState }) => {
  if (!data) return null;
  const d = data as UnitHPEventData;
  if (typeof d.amount !== 'number') return null;

  const targetName = getUnitName(gameState, d.targetUnitId);

  const visualTypeClass =
    d.visualType && d.visualType !== ''
      ? styles[`animation-heal--${d.visualType.toLowerCase()}`] ?? ''
      : '';
  const className = [styles['animation-heal'], visualTypeClass].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      data-testid="heal-display"
      data-visual-type={d.visualType ?? undefined}
    >
      {targetName && (
        <span className={styles['heal-target']} data-testid="heal-target-name">
          {targetName}
        </span>
      )}
      <span className={styles['heal-amount']} data-testid="heal-amount">
        +{d.amount}
      </span>
    </div>
  );
};
