import React from 'react';
import { useAnimation } from '@ui/hooks/useAnimation';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * AnimationDisplay - アニメーション表示コンポーネント
 * 
 * ゲーム内の各種アニメーションを表示
 * 演出完了後にストアに通知
 */

export const AnimationDisplay: React.FC = () => {
  const { animation, isAnimating, onAnimationComplete } = useAnimation();

  // TODO: 実装
  // - アニメーション種類に応じた演出を表示
  // - CSS Transition/Animationを使った演出
  // - 演出完了後にonAnimationCompleteを呼び出し

  if (!isAnimating || !animation) {
    return null;
  }

  const renderAnimation = () => {
    switch (animation.eventType) {
      case GameEvent.UNIT_DAMAGE:
        return (
          <div className="animation damage">
            <p>ダメージ: {animation.data.damage}</p>
          </div>
        );
      case GameEvent.POWER_CHANGE:
        return (
          <div className="animation power-change">
            <p>国力変動: {animation.data.amount}</p>
          </div>
        );
      case GameEvent.SKILL_ACTIVATE:
        return (
          <div className="animation skill">
            <p>スキル発動: {animation.data.skillName}</p>
          </div>
        );
      default:
        return (
          <div className="animation generic">
            <p>{animation.eventType}</p>
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
