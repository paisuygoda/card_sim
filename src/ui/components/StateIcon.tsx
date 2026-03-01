import React, { useRef, useState, useEffect } from 'react';
import { State } from '@core/domain/models';
import { getStateIcon, getStateCategory } from '@core/domain/master';
import styles from './StateIcon.module.css';

/** スタック数アニメーションの持続時間（ms） */
const STACK_ANIMATION_DURATION = 400;

/** スタック数表示の上限値 */
const MAX_DISPLAY_STACKS = 99;

export interface StateIconProps {
  /** 表示するステートデータ */
  state: State;
  /** ホバー時のコールバック（ツールチップ表示用） */
  onHover?: (stateId: string | null) => void;
  /** 削除アニメーション中フラグ */
  removing?: boolean;
}

export const StateIcon: React.FC<StateIconProps> = ({ state, onHover, removing = false }) => {
  const icon = getStateIcon(state.stateId);
  const category = getStateCategory(state.stateId);
  const prevStacks = useRef<number | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // スタック数変化検知
  useEffect(() => {
    // 既存のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 初回レンダリング時はアニメーションを発動させない
    if (prevStacks.current !== null && state.stacks !== null) {
      if (state.stacks > prevStacks.current) {
        // 増加アニメーション
        setAnimationClass('stack-increase');
        timerRef.current = setTimeout(() => {
          setAnimationClass('');
          timerRef.current = null;
        }, STACK_ANIMATION_DURATION);
      } else if (state.stacks < prevStacks.current) {
        // 減少アニメーション
        setAnimationClass('stack-decrease');
        timerRef.current = setTimeout(() => {
          setAnimationClass('');
          timerRef.current = null;
        }, STACK_ANIMATION_DURATION);
      }
    }
    prevStacks.current = state.stacks;

    // クリーンアップ関数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.stacks]);

  // aria-label構築
  const ariaLabel = [
    state.name,
    state.stacks !== null ? `スタック${state.stacks}` : null,
    state.duration === null ? '永続' : null,
  ]
    .filter(Boolean)
    .join(' ');

  // スタック数表示（MAX_DISPLAY_STACKS+対応）
  const displayStack =
    state.stacks !== null && state.stacks > MAX_DISPLAY_STACKS
      ? `${MAX_DISPLAY_STACKS}+`
      : state.stacks;

  return (
    <div
      className={[styles['state-icon'], styles[category], removing && styles.removing].filter(Boolean).join(' ')}
      role="img"
      tabIndex={0}
      aria-label={ariaLabel}
      data-testid="state-icon"
      onMouseEnter={() => onHover?.(state.stateId)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(state.stateId)}
      onBlur={() => onHover?.(null)}
    >
      {/* アイコン絵文字 */}
      {icon}

      {/* スタック数バッジ */}
      {state.stacks !== null && (
        <span
          className={[styles['state-icon-badge'], animationClass && styles[animationClass]].filter(Boolean).join(' ')}
          data-testid="stack-badge"
          aria-label={`スタック数: ${state.stacks}`}
        >
          {displayStack}
        </span>
      )}

      {/* 永続マーカー */}
      {state.duration === null && (
        <span className={styles['state-icon-permanent']}>∞</span>
      )}
    </div>
  );
};
