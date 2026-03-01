import React from 'react';
import { StateEventData, GameEvent } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import { getStateAnimationProps } from './helpers';
import styles from './StateChangeAnimation.module.css';

/**
 * StateChangeAnimation - STATE_ADD / STATE_REMOVE イベントの演出コンポーネント
 *
 * ステート付与・削除の演出を表示する。
 *
 * @param eventType 呼び出し元から渡される実際のイベントタイプ（STATE_ADD or STATE_REMOVE）
 */
export const StateChangeAnimation: React.FC<
  AnimationRendererProps & { eventType: GameEvent }
> = ({ data, gameState, eventType }) => {
  if (!data) return null;
  const d = data as StateEventData;

  const isAdd = eventType === GameEvent.STATE_ADD;
  const mode = isAdd ? 'add' : 'remove';
  const props = getStateAnimationProps(d, mode, gameState);
  if (!props) return null;

  const testId = isAdd ? 'state-add-display' : 'state-remove-display';
  const label = isAdd ? 'STATE_ADD' : 'STATE_REMOVE';

  return (
    <div
      className={props.className}
      data-testid={testId}
      data-visual-type={d.visualType || undefined}
    >
      <span className={styles['state-label']}>{label}</span>
      <span className={styles['state-name']} data-testid="state-name">
        {d.stateId}
      </span>
      {props.targetName && (
        <span className={styles['state-target']} data-testid="state-target-name">
          {props.targetName}
        </span>
      )}
    </div>
  );
};
