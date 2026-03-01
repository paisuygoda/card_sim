import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { GamePhase } from '@core/domain/models';
import { createMockGameState, createMockNation, createMockUnit } from '@ui/__tests__/fixtures';

/**
 * StateChangeAnimation テスト
 *
 * STATE_ADD / STATE_REMOVE イベントのアニメーション演出テスト。
 */

describe('StateChangeAnimation (STATE_ADD / STATE_REMOVE)', () => {
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

  describe('Task 2-5-2: STATE_ADDイベントでのvisualType反映', () => {
    it('TC-2.1: visualType=BUFFの場合、バフステート付与の演出が正しく表示される', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_ADD, {
          targetUnitId: 'unit-1',
          stateId: 'state-buff-1',
          visualType: 'BUFF',
        });
      });

      const stateAddDisplay = screen.getByTestId('state-add-display');
      expect(stateAddDisplay).toBeTruthy();
      expect(stateAddDisplay.getAttribute('data-visual-type')).toBe('BUFF');
      expect(stateAddDisplay.className).toContain('animation-state-add');
      expect(stateAddDisplay.className).toContain('animation-state-add--buff');
      expect(container.textContent).toContain('state-buff-1');
    });

    it('TC-2.2: visualType=DEBUFFの場合、デバフステート付与の演出が正しく表示される', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_ADD, {
          targetNationId: 'nation-1',
          stateId: 'state-debuff-1',
          visualType: 'DEBUFF',
        });
      });

      const stateAddDisplay = screen.getByTestId('state-add-display');
      expect(stateAddDisplay).toBeTruthy();
      expect(stateAddDisplay.getAttribute('data-visual-type')).toBe('DEBUFF');
      expect(stateAddDisplay.className).toContain('animation-state-add');
      expect(stateAddDisplay.className).toContain('animation-state-add--debuff');
      expect(container.textContent).toContain('state-debuff-1');
    });

    it('TC-2.3: visualType=NONEの場合、デフォルトスタイルが適用される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_ADD, {
          targetUnitId: 'unit-2',
          stateId: 'state-none-1',
          visualType: 'NONE',
        });
      });

      const stateAddDisplay = screen.getByTestId('state-add-display');
      expect(stateAddDisplay).toBeTruthy();
      expect(stateAddDisplay.getAttribute('data-visual-type')).toBe('NONE');
      expect(stateAddDisplay.className).toContain('animation-state-add');
      expect(stateAddDisplay.className).not.toContain('animation-state-add--buff');
      expect(stateAddDisplay.className).not.toContain('animation-state-add--debuff');
    });
  });

  describe('Task 2-5-2 section 2-6: STATE_REMOVEイベントでのvisualType反映とターゲット名表示', () => {
    it('TC-2-6-1: visualType=BUFFの場合、BUFFステート削除演出が正しく表示される', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetUnitId: 'unit-1',
          stateId: 'buff-power-up',
          visualType: 'BUFF',
        });
      });

      const stateRemoveDisplay = screen.getByTestId('state-remove-display');
      expect(stateRemoveDisplay).toBeTruthy();
      expect(stateRemoveDisplay.getAttribute('data-visual-type')).toBe('BUFF');
      expect(stateRemoveDisplay.className).toContain('animation-state-remove');
      expect(stateRemoveDisplay.className).toContain('animation-state-remove--buff');
      expect(container.textContent).toContain('buff-power-up');
    });

    it('TC-2-6-2: visualType=DEBUFFの場合、DEBUFFステート削除演出が正しく表示される', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetNationId: 'nation-1',
          stateId: 'debuff-poison',
          visualType: 'DEBUFF',
        });
      });

      const stateRemoveDisplay = screen.getByTestId('state-remove-display');
      expect(stateRemoveDisplay).toBeTruthy();
      expect(stateRemoveDisplay.getAttribute('data-visual-type')).toBe('DEBUFF');
      expect(stateRemoveDisplay.className).toContain('animation-state-remove');
      expect(stateRemoveDisplay.className).toContain('animation-state-remove--debuff');
      expect(container.textContent).toContain('debuff-poison');
    });

    it('TC-2-6-3: visualType=NONEの場合、デフォルトスタイルが適用される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetUnitId: 'unit-2',
          stateId: 'state-neutral',
          visualType: 'NONE',
        });
      });

      const stateRemoveDisplay = screen.getByTestId('state-remove-display');
      expect(stateRemoveDisplay).toBeTruthy();
      expect(stateRemoveDisplay.getAttribute('data-visual-type')).toBe('NONE');
      expect(stateRemoveDisplay.className).toContain('animation-state-remove');
      expect(stateRemoveDisplay.className).not.toContain('animation-state-remove--buff');
      expect(stateRemoveDisplay.className).not.toContain('animation-state-remove--debuff');
    });

    it('TC-2-6-4: ユニットターゲットの名前が正しく表示される', () => {
      render(<AnimationDisplay />);

      useGameStateStore.setState({
        gameState: createMockGameState({
          currentPhase: GamePhase.BATTLE_START,
          nations: [
            createMockNation({
              nationId: 'nation-test',
              power: 1000,
              units: [
                createMockUnit({
                  baseUnitId: 'unit-hero',
                  unitId: 'hero-001',
                  ownerNationId: 'nation-test',
                  name: '勇者',
                  attack: 50,
                  skillId: 'skill-attack',
                }),
              ],
            }),
          ],
        }),
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetUnitId: 'hero-001',
          stateId: 'state-x',
          visualType: 'BUFF',
        });
      });

      const targetName = screen.getByTestId('state-target-name');
      expect(targetName).toBeTruthy();
      expect(targetName.textContent).toBe('勇者');
    });

    it('TC-2-6-5: 国家ターゲットの名前が正しく表示される', () => {
      render(<AnimationDisplay />);

      useGameStateStore.setState({
        gameState: createMockGameState({
          currentPhase: GamePhase.BATTLE_START,
          nations: [
            createMockNation({
              nationId: 'nation-a',
              name: '帝国',
              power: 1500,
              units: [],
            }),
          ],
        }),
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetNationId: 'nation-a',
          stateId: 'state-y',
          visualType: 'DEBUFF',
        });
      });

      const targetName = screen.getByTestId('state-target-name');
      expect(targetName).toBeTruthy();
      expect(targetName.textContent).toBe('帝国');
    });

    it('TC-2-6-E1: visualTypeがundefinedの場合、デフォルトスタイルが適用される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetUnitId: 'unit-3',
          stateId: 'state-z',
        });
      });

      const stateRemoveDisplay = screen.getByTestId('state-remove-display');
      expect(stateRemoveDisplay).toBeTruthy();
      expect(stateRemoveDisplay.className).toContain('animation-state-remove');
      expect(stateRemoveDisplay.className).not.toContain('animation-state-remove--buff');
      expect(stateRemoveDisplay.className).not.toContain('animation-state-remove--debuff');
    });

    it('TC-2-6-E2: ターゲットが存在しない場合、名前が非表示になる', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetUnitId: 'nonexistent-unit',
          stateId: 'state-w',
          visualType: 'BUFF',
        });
      });

      const stateRemoveDisplay = screen.getByTestId('state-remove-display');
      expect(stateRemoveDisplay).toBeTruthy();
      const targetName = screen.queryByTestId('state-target-name');
      expect(targetName).toBeNull();
    });

    it('TC-2-6-E3: stateIdが空の場合、nullを返しエラーが発生しない', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetUnitId: 'unit-4',
          stateId: '',
          visualType: 'BUFF',
        });
      });

      const stateRemoveDisplay = screen.queryByTestId('state-remove-display');
      expect(stateRemoveDisplay).toBeNull();
    });
  });
});
