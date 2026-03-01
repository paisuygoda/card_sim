import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * PowerChangeAnimation テスト
 *
 * POWER_DAMAGE / POWER_HEAL イベントのアニメーション演出テスト。
 */

describe('PowerChangeAnimation (POWER_DAMAGE / POWER_HEAL)', () => {
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

  describe('複数国家同時変動の最適化', () => {
    it('キューに3つ以上の国力変動イベントがある場合、要約表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_DAMAGE, {
          nationId: 'nation-1',
          amount: 100,
        });
      });

      act(() => {
        useUIStateStore.setState({
          animationQueue: [
            { eventType: GameEvent.POWER_HEAL, data: { nationId: 'nation-2', amount: 200 } },
            { eventType: GameEvent.POWER_DAMAGE, data: { nationId: 'nation-3', amount: 150 } },
          ],
        });
      });

      const summary = screen.getByTestId('power-summary');
      expect(summary).toBeTruthy();
      expect(summary.textContent).toBe('3国が同時に国力変動');
    });

    it('キューに2つ以下の国力変動イベントがある場合、通常表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useGameStateStore.setState({
          gameState: {
            nations: [
              { nationId: 'nation-1', name: 'テスト王国' },
            ],
          } as any,
        });
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_DAMAGE, {
          nationId: 'nation-1',
          amount: 100,
        });
      });

      act(() => {
        useUIStateStore.setState({
          animationQueue: [
            { eventType: GameEvent.POWER_HEAL, data: { nationId: 'nation-2', amount: 200 } },
          ],
        });
      });

      const nationName = screen.getByTestId('power-nation-name');
      expect(nationName).toBeTruthy();
      expect(nationName.textContent).toBe('テスト王国');

      const amount = screen.getByTestId('power-amount');
      expect(amount).toBeTruthy();
      expect(amount.textContent).toContain('100');
    });
  });
});
