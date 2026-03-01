import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay, ANIMATION_DURATION } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { createMockGameState, createMockNation, createMockUnit } from '@ui/__tests__/fixtures';

/**
 * DamageAnimation テスト
 *
 * UNIT_DAMAGE イベントのアニメーション演出テスト。
 * AnimationDisplay 経由で統合テストを実施する。
 */

describe('DamageAnimation (UNIT_DAMAGE)', () => {
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

  describe('Task 2-2-3: UNIT_DAMAGE ダメージフロートアップ表示', () => {
    it('1. UNIT_DAMAGE イベントで damage-display が表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
      });

      expect(screen.getByTestId('damage-display')).toBeTruthy();
    });

    it('2. damage-amount に −{amount} 形式（全角マイナス）で表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 75,
        });
      });

      expect(screen.getByTestId('damage-amount').textContent).toBe('−75');
    });

    it('3. gameState にターゲットユニットが存在する場合、damage-target-name にユニット名が表示される', () => {
      render(<AnimationDisplay />);

      useGameStateStore.setState({
        gameState: createMockGameState({
          stageId: 0,
          commandNum: 0,
          currentPhase: 'GAME_START' as any,
          nations: [
            createMockNation({
              nationId: 'nation-1',
              power: 1000,
              units: [
                createMockUnit({
                  unitId: 'unit-1',
                  baseUnitId: 'testunit',
                  ownerNationId: 'nation-1',
                  name: 'テストユニット',
                  currentHP: 50,
                  attack: 10,
                  skillId: 'skill1',
                }),
              ],
            }),
          ],
        }),
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 30,
        });
      });

      expect(screen.getByTestId('damage-target-name').textContent).toBe('テストユニット');
    });

    it('4. ターゲットユニットが存在しない場合、damage-target-name は表示されない', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'nonexistent-unit',
          amount: 20,
        });
      });

      expect(screen.queryByTestId('damage-target-name')).toBeNull();
      expect(screen.getByTestId('damage-display')).toBeTruthy();
    });

    it('5. UNIT_DAMAGE の持続時間が 800ms（799ms後は未完了、800ms後に completeAnimation が呼ばれる）', async () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
      });

      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.UNIT_DAMAGE]! - 1);
      });
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
    });

    it('6. animation-overlay クラスが UNIT_DAMAGE 時に付与されない', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
      });

      expect(screen.getByTestId('damage-display')).toBeTruthy();
      expect(container.querySelector('.animation-overlay')).toBeNull();
    });
  });

  describe('Task 2-5-2: visualType反映', () => {
    it('TC-1.1: visualType=DAMAGEの場合、適切なdata属性とCSSクラスが適用される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
          visualType: 'DAMAGE',
        });
      });

      const damageDisplay = screen.getByTestId('damage-display');
      expect(damageDisplay).toBeTruthy();
      expect(damageDisplay.getAttribute('data-visual-type')).toBe('DAMAGE');
      expect(damageDisplay.className).toContain('animation-damage');
      expect(damageDisplay.className).toContain('animation-damage--damage');
    });

    it('TC-1.2: visualType=BUFFの場合、バフ効果によるダメージが視覚的に区別される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-2',
          amount: 30,
          visualType: 'BUFF',
        });
      });

      const damageDisplay = screen.getByTestId('damage-display');
      expect(damageDisplay).toBeTruthy();
      expect(damageDisplay.getAttribute('data-visual-type')).toBe('BUFF');
      expect(damageDisplay.className).toContain('animation-damage');
      expect(damageDisplay.className).toContain('animation-damage--buff');
    });

    it('TC-1.3: visualType=DEBUFFの場合、デバフ効果によるダメージが視覚的に区別される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-3',
          amount: 40,
          visualType: 'DEBUFF',
        });
      });

      const damageDisplay = screen.getByTestId('damage-display');
      expect(damageDisplay).toBeTruthy();
      expect(damageDisplay.getAttribute('data-visual-type')).toBe('DEBUFF');
      expect(damageDisplay.className).toContain('animation-damage');
      expect(damageDisplay.className).toContain('animation-damage--debuff');
    });

    it('TC-1.4: visualTypeが未指定の場合、後方互換性を保つ（モディファイアなし）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-4',
          amount: 25,
        });
      });

      const damageDisplay = screen.getByTestId('damage-display');
      expect(damageDisplay).toBeTruthy();
      const visualTypeAttr = damageDisplay.getAttribute('data-visual-type');
      expect(visualTypeAttr === null || visualTypeAttr === 'undefined').toBe(true);
      expect(damageDisplay.className).toContain('animation-damage');
      expect(damageDisplay.className).not.toContain('animation-damage--');
    });

    it('TC-4.1: 複数の異なるvisualTypeイベントが連続して正しく切り替わる', async () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-6',
          amount: 10,
          visualType: 'DAMAGE',
        });
      });

      let damageDisplay = screen.getByTestId('damage-display');
      expect(damageDisplay.getAttribute('data-visual-type')).toBe('DAMAGE');
      expect(damageDisplay.className).toContain('animation-damage--damage');

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-7',
          amount: 15,
          visualType: 'BUFF',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.UNIT_DAMAGE]! + 100);
      });

      damageDisplay = screen.getByTestId('damage-display');
      expect(damageDisplay.getAttribute('data-visual-type')).toBe('BUFF');
      expect(damageDisplay.className).toContain('animation-damage--buff');
    });

    it('TC-4.2: visualTypeフィールドが空文字列の場合でもエラーが発生しない', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-8',
          amount: 5,
          visualType: '',
        });
      });

      const damageDisplay = screen.getByTestId('damage-display');
      expect(damageDisplay).toBeTruthy();
      expect(damageDisplay.className).toContain('animation-damage');

      expect(() => {
        render(<AnimationDisplay />);
      }).not.toThrow();
    });
  });
});
