import React, { useEffect, useState } from 'react';
import { useAnimation } from '@ui/hooks/useAnimation';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { getAnimationRenderer } from './animations';

/**
 * AnimationDisplay - アニメーション表示コンポーネント（ディスパッチャー）
 *
 * レジストリから適切なアニメーションコンポーネントを取得して描画する薄いラッパー。
 * 各イベントの描画ロジックは `./animations/` 以下の個別コンポーネントに分離されている。
 *
 * 責務:
 * - アニメーションキューの自動dequeue
 * - イベント種別ごとの持続時間管理と自動完了
 * - レンダリングエラーのハンドリング（デッドロック防止）
 * - 適切なアニメーションコンポーネントへのディスパッチ
 */

/** イベント種別ごとのアニメーション持続時間（ms） */
export const ANIMATION_DURATION: Partial<Record<GameEvent, number>> = {
  [GameEvent.UNIT_DAMAGE]:     800,
  [GameEvent.SKILL_ACTIVATE]:  1200,
  [GameEvent.UNIT_DESTROY]:    1000,
  [GameEvent.POWER_DAMAGE]:    1000,
  [GameEvent.POWER_HEAL]:      1000,
  [GameEvent.PHASE_TRANSIT]:   1500,
  [GameEvent.STATE_REMOVE]:    1000,
  [GameEvent.COMMAND_EXECUTE]: 1000,
};

/** デフォルトアニメーション持続時間（ms） */
const DEFAULT_ANIMATION_DURATION = 500;

export const AnimationDisplay: React.FC = () => {
  const { animation, isAnimating, onAnimationComplete } = useAnimation();
  const animationQueue = useUIStateStore((state) => state.animationQueue);
  const dequeueAnimation = useUIStateStore((state) => state.dequeueAnimation);
  const gameState = useGameStateStore((state) => state.gameState);

  // レンダリングエラー時にonAnimationCompleteを呼ぶためのフラグ
  const [hasRenderError, setHasRenderError] = useState(false);

  // レンダリングエラー発生時にonAnimationCompleteを呼び出してデッドロックを防ぐ
  useEffect(() => {
    if (hasRenderError && isAnimating) {
      onAnimationComplete();
      setHasRenderError(false);
    }
  }, [hasRenderError, isAnimating, onAnimationComplete]);

  // キューにアニメーションがあり、再生中でない場合は自動でdequeue
  // （ReactUIBridge.waitUI() のデッドロックを防ぐ）
  useEffect(() => {
    if (animationQueue.length > 0 && !isAnimating) {
      dequeueAnimation();
    }
  }, [animationQueue, isAnimating, dequeueAnimation]);

  // isAnimatingがtrueになった時、イベント種別ごとの持続時間後にonAnimationCompleteを自動呼び出し
  // animationを依存配列に含めることで同じアニメーションで二重実行しない
  useEffect(() => {
    if (!isAnimating || !animation) return;

    const duration = ANIMATION_DURATION[animation.eventType] ?? DEFAULT_ANIMATION_DURATION;
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [animation, isAnimating, onAnimationComplete]);

  if (!isAnimating || !animation) {
    return null;
  }

  try {
    const AnimRenderer = getAnimationRenderer(animation.eventType);
    return (
      <AnimRenderer
        data={animation.data}
        gameState={gameState}
        animationQueue={animationQueue}
        eventType={animation.eventType}
      />
    );
  } catch (error) {
    console.error('アニメーション表示エラー:', error);
    setHasRenderError(true);
    return null;
  }
};
