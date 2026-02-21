import React, { useEffect } from 'react';
import { useAnimation } from '@ui/hooks/useAnimation';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * AnimationDisplay - アニメーション表示コンポーネント
 * 
 * ゲーム内の各種アニメーションを表示
 * 演出完了後にストアに通知
 */

export const AnimationDisplay: React.FC = () => {
  const { animation, isAnimating, onAnimationComplete } = useAnimation();
  const animationQueue = useUIStateStore((state) => state.animationQueue);
  const dequeueAnimation = useUIStateStore((state) => state.dequeueAnimation);

  // キューにアニメーションがあり、再生中でない場合は自動でdequeue
  // （ReactUIBridge.waitUI() のデッドロックを防ぐ）
  useEffect(() => {
    if (animationQueue.length > 0 && !isAnimating) {
      dequeueAnimation();
    }
  }, [animationQueue, isAnimating, dequeueAnimation]);

  // isAnimatingがtrueになった時、500ms後にonAnimationCompleteを自動呼び出し
  // animationを依存配列に含めることで同じアニメーションで二重実行しない
  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 500);

    return () => clearTimeout(timer);
  }, [animation, isAnimating, onAnimationComplete]);

  if (!isAnimating || !animation) {
    return null;
  }

  // データの安全な取得（nullチェック）
  const getData = () => {
    return animation.data || {};
  };

  const renderAnimation = () => {
    try {
      const data = getData();
      
      switch (animation.eventType) {
        case GameEvent.UNIT_DAMAGE:
          return (
            <div className="animation damage">
              <p>ダメージ: {data.amount ?? 0}</p>
            </div>
          );
        case GameEvent.POWER_DAMAGE:
        case GameEvent.POWER_HEAL:
          return (
            <div className="animation power-change">
              <p>国力変動: {data.amount ?? 0}</p>
            </div>
          );
        case GameEvent.SKILL_ACTIVATE:
          return (
            <div className="animation skill">
              <p>スキル発動: {data.skillName ?? 'Unknown'}</p>
            </div>
          );
        default:
          return (
            <div className="animation generic">
              <p>{animation.eventType}</p>
            </div>
          );
      }
    } catch (error) {
      console.error('アニメーション表示エラー:', error);
      return (
        <div className="animation error">
          <p>エラー</p>
        </div>
      );
    }
  };

  return (
    <div className="animation-overlay">
      {renderAnimation()}
    </div>
  );
};
