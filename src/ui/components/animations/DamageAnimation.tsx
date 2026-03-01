import React from 'react';
import { UnitHPEventData } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import { getUnitName } from './helpers';
import styles from './DamageAnimation.module.css';

/**
 * DamageAnimation - UNIT_DAMAGE イベントの演出コンポーネント
 *
 * ダメージフロートアップを表示する。
 * animation-overlay ラッパーなし。
 */
export const DamageAnimation: React.FC<AnimationRendererProps> = ({ data, gameState }) => {
  if (!data) return null;
  const d = data as UnitHPEventData;
  if (typeof d.amount !== 'number') return null;

  const targetName = getUnitName(gameState, d.targetUnitId);

  const visualTypeClass =
    d.visualType && d.visualType !== ''
      ? styles[`animation-damage--${d.visualType.toLowerCase()}`] ?? ''
      : '';
  const className = [styles['animation-damage'], visualTypeClass].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      data-testid="damage-display"
      data-visual-type={d.visualType ?? undefined}
    >
      {targetName && (
        <span className={styles['damage-target']} data-testid="damage-target-name">
          {targetName}
        </span>
      )}
      <span className={styles['damage-amount']} data-testid="damage-amount">
        −{d.amount}
      </span>
    </div>
  );
};
