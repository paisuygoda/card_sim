import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay, ANIMATION_DURATION } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

/**
 * CommandAnimation テスト
 *
 * COMMAND_EXECUTE イベントのアニメーション演出テスト。
 */

describe('CommandAnimation (COMMAND_EXECUTE)', () => {
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

  describe('正常系テスト (7個)', () => {
    it('Test 1: 基本表示（visualTypeなし）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '外交工作',
          commandType: 'DIPLOMACY',
        });
      });

      const display = screen.getByTestId('command-execute-display');
      expect(display).toBeTruthy();

      const commandName = screen.getByTestId('command-name');
      expect(commandName.textContent).toBe('外交工作');

      expect(display.getAttribute('data-visual-type')).toBeNull();

      expect(display.className).toContain('animation-command-execute');
      expect(display.className).not.toContain('animation-command-execute--');
    });

    it('Test 2: 友好的コマンド（FRIENDLY）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '支援要請',
          commandType: 'SUPPORT',
          commandVisualType: 'FRIENDLY',
        });
      });

      const display = screen.getByTestId('command-execute-display');

      expect(display.getAttribute('data-visual-type')).toBe('FRIENDLY');
      expect(display.className).toContain('animation-command-execute');
      expect(display.className).toContain('animation-command-execute--friendly');
      expect(screen.getByTestId('command-name').textContent).toBe('支援要請');
    });

    it('Test 3: 敵対的コマンド（HOSTILE）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '諜報活動',
          commandType: 'ESPIONAGE',
          commandVisualType: 'HOSTILE',
        });
      });

      const display = screen.getByTestId('command-execute-display');

      expect(display.getAttribute('data-visual-type')).toBe('HOSTILE');
      expect(display.className).toContain('animation-command-execute');
      expect(display.className).toContain('animation-command-execute--hostile');
      expect(screen.getByTestId('command-name').textContent).toBe('諜報活動');
    });

    it('Test 4: 中立的コマンド（NEUTRAL）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '市場調査',
          commandType: 'INVESTIGATION',
          commandVisualType: 'NEUTRAL',
        });
      });

      const display = screen.getByTestId('command-execute-display');

      expect(display.getAttribute('data-visual-type')).toBe('NEUTRAL');
      expect(display.className).toContain('animation-command-execute');
      expect(display.className).toContain('animation-command-execute--neutral');
      expect(screen.getByTestId('command-name').textContent).toBe('市場調査');
    });

    it('Test 5: ターゲットありコマンド', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '外交工作',
          commandType: 'DIPLOMACY',
          commandVisualType: 'FRIENDLY',
          commandTarget: '共和国',
        });
      });

      const targetElement = screen.getByTestId('command-target');
      expect(targetElement).toBeTruthy();
      expect(targetElement.textContent).toBe('対象: 共和国');
      expect(screen.getByTestId('command-name').textContent).toBe('外交工作');
    });

    it('Test 6: アニメーション持続時間の確認', () => {
      expect(ANIMATION_DURATION[GameEvent.COMMAND_EXECUTE]).toBe(1000);
    });

    it('Test 7: 演出完了後の自動dequeue', async () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '外交工作',
          commandType: 'DIPLOMACY',
        });
      });

      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      expect(useUIStateStore.getState().isAnimationPlaying()).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.COMMAND_EXECUTE]! + 100);
      });

      expect(useUIStateStore.getState().currentAnimation).toBeNull();
      expect(useUIStateStore.getState().isAnimationPlaying()).toBe(false);
    });
  });

  describe('エッジケーステスト (3個)', () => {
    it('Edge 1: commandNameが空文字列の場合、何も表示されない', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '',
          commandType: 'DIPLOMACY',
        });
      });

      const display = screen.queryByTestId('command-execute-display');
      expect(display).toBeNull();
    });

    it('Edge 2: 必須データが欠落している場合、何も表示されない', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandType: 'DIPLOMACY',
        } as any);
      });

      const display = screen.queryByTestId('command-execute-display');
      expect(display).toBeNull();
    });

    it('Edge 3: 不明なvisualTypeでもエラーにならず表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
          commandName: '未知の操作',
          commandType: 'UNKNOWN',
          commandVisualType: 'MAGIC',
        });
      });

      const display = screen.getByTestId('command-execute-display');
      expect(display).toBeTruthy();
      expect(display.getAttribute('data-visual-type')).toBe('MAGIC');
      expect(display.className).toContain('animation-command-execute');
      expect(display.className).toContain('animation-command-execute--magic');
      expect(screen.getByTestId('command-name').textContent).toBe('未知の操作');
    });
  });
});
