import { useEffect, useCallback } from 'react';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * useAnimation - アニメーション管理カスタムフック
 * 
 * アニメーションの実行・完了を管理
 * UIコンポーネントから使用
 */

export function useAnimation() {
  const animation = useUIStateStore((state) => state.animation);
  const completeAnimation = useUIStateStore((state) => state.completeAnimation);

  /**
   * アニメーションが完了したことを通知
   */
  const onAnimationComplete = useCallback(() => {
    completeAnimation();
  }, [completeAnimation]);

  /**
   * 特定のアニメーションイベントかどうかをチェック
   */
  const isAnimationType = useCallback(
    (eventType: GameEvent) => {
      return animation?.eventType === eventType;
    },
    [animation]
  );

  return {
    animation,
    isAnimating: animation?.isPlaying ?? false,
    onAnimationComplete,
    isAnimationType,
  };
}

/**
 * useAnimationEffect - アニメーション実行時の副作用フック
 * 
 * 特定のアニメーションイベントを監視し、
 * 自動的に完了処理を実行する
 * 
 * @param eventType 監視するイベント種類
 * @param onAnimate アニメーション実行時のコールバック
 * @param duration アニメーション時間（ms）
 */
export function useAnimationEffect(
  eventType: GameEvent,
  onAnimate: (data: any) => void,
  duration: number = 500
) {
  const { animation, onAnimationComplete } = useAnimation();

  useEffect(() => {
    if (animation?.eventType === eventType && animation.isPlaying) {
      onAnimate(animation.data);
      
      // 指定時間後に自動完了
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [animation, eventType, onAnimate, duration, onAnimationComplete]);
}
