import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay, ANIMATION_DURATION } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { SkillVisualType } from '@core/domain/models';
import { createMockGameState, createMockNation, createMockUnit } from '@ui/__tests__/fixtures';

/**
 * SkillActivateAnimation テスト
 *
 * SKILL_ACTIVATE イベントのアニメーション演出テスト。
 */

describe('SkillActivateAnimation (SKILL_ACTIVATE)', () => {
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

  describe('Task 2-2-4: SKILL_ACTIVATE スキル発動演出', () => {
    it('1. SKILL_ACTIVATE イベントで skill-display が表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
        });
      });

      expect(screen.getByTestId('skill-display')).toBeTruthy();
    });

    it('2. skill-name に skillName が表示される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
        });
      });

      expect(screen.getByTestId('skill-name').textContent).toBe('ファイアボール');
    });

    it('3. gameState に攻撃者ユニットが存在する場合、skill-attacker に攻撃者名が表示される', () => {
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
                  name: '勇者アレン',
                  attack: 20,
                  skillId: 'skill1',
                }),
              ],
            }),
          ],
        }),
      });

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
        });
      });

      expect(screen.getByTestId('skill-attacker').textContent).toBe('勇者アレン');
    });

    it('4. 攻撃者ユニットが存在しない場合、skill-attacker は表示されない', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'nonexistent-attacker',
          skillName: 'ファイアボール',
        });
      });

      expect(screen.queryByTestId('skill-attacker')).toBeNull();
      expect(screen.getByTestId('skill-display')).toBeTruthy();
    });

    it('5. SKILL_ACTIVATE の持続時間が 1200ms（1199ms後は未完了、1200ms後に completeAnimation が呼ばれる）', async () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
        });
      });

      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.SKILL_ACTIVATE]! - 1);
      });
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
    });

    it('6. animation-overlay クラスが SKILL_ACTIVATE 時に付与されない', () => {
      const { container } = render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
        });
      });

      expect(screen.getByTestId('skill-display')).toBeTruthy();
      expect(container.querySelector('.animation-overlay')).toBeNull();
    });
  });

  describe('Task 2-5-1: SkillVisualType演出実装', () => {
    it('TC1: skillVisualType="ATTACK"時に専用クラスとdata属性が適用される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
          skillId: 'skill-fireball',
          targets: ['unit-2'],
          skillVisualType: SkillVisualType.ATTACK,
        });
      });

      const skillDisplay = screen.getByTestId('skill-display');
      expect(skillDisplay).toHaveAttribute('data-visual-type', 'ATTACK');
      expect(skillDisplay).toHaveClass('animation-skill-attack');
      expect(skillDisplay).toHaveClass('animation-skill');
    });

    it('TC2: skillVisualTypeが未定義の場合も正常に表示される（後方互換性）', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
          skillId: 'skill-fireball',
          targets: ['unit-2'],
        });
      });

      const skillDisplay = screen.getByTestId('skill-display');
      expect(skillDisplay).toHaveAttribute('data-visual-type', 'default');
      expect(skillDisplay).not.toHaveClass('animation-skill-attack');
      expect(skillDisplay).toHaveClass('animation-skill');
      expect(screen.getByTestId('skill-name')).toHaveTextContent('ファイアボール');
    });

    it('TC3: skillVisualType="ATTACK"時のスタイルが適用される', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: '斬撃',
          skillId: 'skill-slash',
          targets: ['unit-2'],
          skillVisualType: SkillVisualType.ATTACK,
        });
      });

      const skillDisplay = screen.getByTestId('skill-display');
      expect(skillDisplay).toHaveClass('animation-skill-attack');
      expect(skillDisplay).toHaveClass('animation-skill');
    });

    it('TC4: 将来の拡張 - 未知のskillVisualTypeでも表示が壊れない', () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: '神秘の魔法',
          skillId: 'skill-unknown',
          targets: ['unit-2'],
          skillVisualType: 'BUFF' as SkillVisualType,
        });
      });

      const skillDisplay = screen.getByTestId('skill-display');
      expect(skillDisplay).toBeInTheDocument();
      expect(skillDisplay).toHaveAttribute('data-visual-type', 'BUFF');
      expect(skillDisplay).toHaveClass('animation-skill-buff');
      expect(screen.getByTestId('skill-name')).toHaveTextContent('神秘の魔法');
    });
  });
});
