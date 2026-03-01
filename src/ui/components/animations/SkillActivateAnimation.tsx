import React from 'react';
import { SkillActivateData } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import { getUnitName } from './helpers';
import styles from './SkillActivateAnimation.module.css';

/**
 * SkillActivateAnimation - SKILL_ACTIVATE イベントの演出コンポーネント
 *
 * スキル発動演出を表示する。
 * animation-overlay ラッパーなし。
 */
export const SkillActivateAnimation: React.FC<AnimationRendererProps> = ({ data, gameState }) => {
  if (!data) return null;
  const d = data as SkillActivateData;
  if (!d.skillName || !d.attackerId) return null;

  const attackerName = getUnitName(gameState, d.attackerId);
  const visualTypeClass = d.skillVisualType
    ? styles[`animation-skill-${d.skillVisualType.toLowerCase()}`] ?? ''
    : '';

  return (
    <div
      className={[styles['animation-skill'], visualTypeClass].filter(Boolean).join(' ')}
      data-testid="skill-display"
      data-visual-type={d.skillVisualType ?? 'default'}
    >
      <span className={styles['skill-label']}>SKILL ACTIVATE</span>
      <span className={styles['skill-name']} data-testid="skill-name">
        {d.skillName}
      </span>
      {attackerName && (
        <span className={styles['skill-attacker']} data-testid="skill-attacker">
          {attackerName}
        </span>
      )}
    </div>
  );
};
