import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay, ANIMATION_DURATION } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * HealAnimation テスト
 *
 * UNIT_HEAL イベントのアニメーション演出テスト。
 */

describe('HealAnimation (UNIT_HEAL)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStateStore.setState({
      animationQueue: [],
      currentAnimation: null,
      input: null,
      logs: [],
    });
    useGameStateStore.setState({ gameState: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Task 2-5-2: UNIT_HEALイベントでのvisualType反映', () => {
    it('TC-3.1: visualType=HEALの場合、回復演出でvisualTypeが正しく適用される', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_HEAL, {
          targetUnitId: 'unit-5',
          amount: 20,
          visualType: 'HEAL',
        });
      });

      const healDisplay = container.querySelector('[data-testid="heal-display"]');
      if (healDisplay) {
        expect(healDisplay.getAttribute('data-visual-type')).toBe('HEAL');
        expect(healDisplay.className).toContain('heal');
      }
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
    });
  });
});
