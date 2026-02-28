import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AnimationDisplay } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * AnimationDisplayコンポーネント 簡易テスト
 */

describe('AnimationDisplay - Simple Test', () => {
  beforeEach(() => {
    // Zustandストアの初期化
    useUIStateStore.setState({
      animationQueue: [],
      currentAnimation: null,
      input: null,
      logs: [],
    });
  });

  it('アニメーションキューが空の場合、何も表示されない', () => {
    const { container } = render(<AnimationDisplay />);
    
    expect(container.firstChild).toBeNull();
  });

  it('currentAnimationがセットされると表示される', () => {
    const { container } = render(<AnimationDisplay />);
    
    // 直接currentAnimationを設定
    act(() => {
      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.UNIT_DAMAGE,
          data: { targetUnitId: 'unit-1', amount: 50 },
          isPlaying: true,
        },
      });
    });
    
    // アニメーションが表示されることを確認
    expect(container.textContent).toContain('−');
    expect(container.textContent).toContain('50');
  });

  it('enqueueとdequeueでアニメーションが表示される', () => {
    const { container } = render(<AnimationDisplay />);
    
    act(() => {
      useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_HEAL, {
        nationId: 'nation-1',
        amount: 300,
      });
      useUIStateStore.getState().dequeueAnimation();
    });
    
    // アニメーションが表示されることを確認
    expect(container.textContent).toContain('国力');
    expect(container.textContent).toContain('+');
    expect(container.textContent).toContain('300');
  });
});
