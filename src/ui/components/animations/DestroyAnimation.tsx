import React from 'react';
import { GameEventDataMap, GameEvent } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import { getUnitName } from './helpers';
import styles from './DestroyAnimation.module.css';

/**
 * DestroyAnimation - UNIT_DESTROY イベントの演出コンポーネント
 *
 * ユニット撃破演出を表示する。
 * animation-overlay ラッパーなし。
 */
export const DestroyAnimation: React.FC<AnimationRendererProps> = ({ data, gameState }) => {
  if (!data) return null;
  const d = data as GameEventDataMap[GameEvent.UNIT_DESTROY];
  const destroyedName = getUnitName(gameState, d.unitId, true) || d.unitId || '';

  return (
    <div className={styles['animation-destroy']} data-testid="unit-destroy-display">
      <span className={styles['destroy-name']} data-testid="destroy-unit-name">
        {destroyedName}
      </span>
      <span className={styles['destroy-label']}>撃破</span>
    </div>
  );
};
