import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay, ANIMATION_DURATION } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * PhaseTransitAnimation テスト
 *
 * PHASE_TRANSIT イベントのアニメーション演出テスト。
 */

describe('PhaseTransitAnimation (PHASE_TRANSIT)', () => {
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

  describe('1. フェーズ名の日本語表示テスト', () => {
    it('1-1. PHASE_TRANSIT イベントで専用の演出が表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'GAME_START',
        });
      });

      expect(screen.getByTestId('phase-transit-display')).toBeTruthy();
      const genericAnimation = document.querySelector('.animation.generic');
      expect(genericAnimation).toBeNull();
    });

    it('1-2. フェーズ名が日本語でマッピングされて表示される（基本ケース）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'GAME_START',
        });
      });
      expect(screen.getByTestId('phase-name').textContent).toBe('ゲーム開始');

      act(() => {
        useUIStateStore.getState().completeAnimation();
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'DOMESTIC',
        });
      });
      expect(screen.getByTestId('phase-name').textContent).toBe('内政フェーズ');

      act(() => {
        useUIStateStore.getState().completeAnimation();
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'BATTLE_START',
        });
      });
      expect(screen.getByTestId('phase-name').textContent).toBe('戦闘開始');

      act(() => {
        useUIStateStore.getState().completeAnimation();
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'BATTLE_END',
        });
      });
      expect(screen.getByTestId('phase-name').textContent).toBe('戦闘終了');

      act(() => {
        useUIStateStore.getState().completeAnimation();
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'GAME_END',
        });
      });
      expect(screen.getByTestId('phase-name').textContent).toBe('ゲーム終了');
    });

    it('1-3. 未定義フェーズの場合、元の文字列がそのまま表示される（フォールバック）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'UNKNOWN_PHASE',
        });
      });

      expect(screen.getByTestId('phase-name').textContent).toBe('UNKNOWN_PHASE');
      expect(screen.getByTestId('phase-name').textContent).not.toBe('');
      expect(screen.getByTestId('phase-name').textContent).not.toBe('null');
      expect(screen.getByTestId('phase-name').textContent).not.toBe('undefined');
    });
  });

  describe('2. 適切なCSSクラス適用のテスト', () => {
    it('2-1. phase-transit-overlayクラスが適用される', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'ROUND_START',
        });
      });

      const overlay = container.querySelector('.phase-transit-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay).toBeTruthy();
      expect(screen.getByTestId('phase-transit-display')).toBe(overlay);
    });

    it('2-2. animation-overlayクラスが付与されない（専用レイアウト）', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'GAME_START',
        });
      });

      expect(container.querySelector('.animation-overlay')).toBeNull();
      expect(container.querySelector('.phase-transit-overlay')).not.toBeNull();
    });
  });

  describe('3. アニメーション時間のテスト', () => {
    it('3-1. ANIMATION_DURATIONに1500msが設定されている', () => {
      expect(ANIMATION_DURATION[GameEvent.PHASE_TRANSIT]).toBe(1500);
    });

    it('3-2. 1500ms後に自動的にcompleteAnimationが呼ばれる', async () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'ROUND_START',
        });
      });

      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.PHASE_TRANSIT);

      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.PHASE_TRANSIT]! - 1);
      });
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
    });
  });

  describe('4. データ未定義時のフォールバックテスト', () => {
    it('4-1. dataがnullの場合、何も表示されない', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, null);
      });

      expect(screen.queryByTestId('phase-transit-display')).toBeNull();
      expect(container.firstChild).toBeNull();

      expect(() => {
        render(<AnimationDisplay />);
      }).not.toThrow();
    });

    it('4-2. data.phaseが存在しない場合のハンドリング', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {} as any);
      });

      expect(screen.queryByTestId('phase-transit-display')).toBeNull();

      expect(() => {
        render(<AnimationDisplay />);
      }).not.toThrow();
    });
  });
});
