import React from 'react';
import {
  PowerEventData,
  GameEvent,
} from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import styles from './PowerChangeAnimation.module.css';

/**
 * PowerChangeAnimation - POWER_DAMAGE / POWER_HEAL イベントの演出コンポーネント
 *
 * 国力変動を表示する。animation-overlay ラッパーあり。
 * キューに3つ以上の国力変動がある場合は要約表示を行う。
 *
 * @param eventType 呼び出し元から渡される実際のイベントタイプ（POWER_DAMAGE or POWER_HEAL）
 */
export const PowerChangeAnimation: React.FC<
  AnimationRendererProps & { eventType: GameEvent }
> = ({ data, gameState, animationQueue, eventType }) => {
  if (!data) return null;
  const d = data as PowerEventData;
  if (typeof d.amount !== 'number') return null;

  // キューに残っている国力変動イベントを確認
  const pendingPowerEvents = animationQueue.filter(
    (anim) =>
      anim.eventType === GameEvent.POWER_DAMAGE ||
      anim.eventType === GameEvent.POWER_HEAL
  );

  // 3つ以上の国力変動が同時に発生している場合は要約表示
  if (pendingPowerEvents.length >= 2) {
    const totalEvents = pendingPowerEvents.length + 1;
    return (
      <div className={styles['animation-overlay']}>
        <div className={[styles['power-float'], styles.summary].join(' ')}>
          <span className={styles.amount} data-testid="power-summary">
            {totalEvents}国が同時に国力変動
          </span>
        </div>
      </div>
    );
  }

  // 通常表示
  const nationName =
    gameState?.nations.find((n) => n.nationId === d.nationId)?.name ?? '';
  const isDamage = eventType === GameEvent.POWER_DAMAGE;

  return (
    <div className={styles['animation-overlay']}>
      <div className={[styles['power-float'], isDamage ? styles.damage : styles.heal].join(' ')}>
        {nationName && (
          <span className={styles['nation-name']} data-testid="power-nation-name">
            {nationName}
          </span>
        )}
        <span className={styles.amount} data-testid="power-amount">
          {isDamage ? '−' : '+'}
          {d.amount} 国力
        </span>
      </div>
    </div>
  );
};
