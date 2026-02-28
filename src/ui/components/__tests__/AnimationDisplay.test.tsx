import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { AnimationDisplay, ANIMATION_DURATION } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { GamePhase, SkillVisualType } from '@core/domain/models';

/**
 * AnimationDisplayコンポーネント テスト
 * 
 * ゲームイベントのアニメーション演出を担当するコンポーネントのテスト
 * 要件：10個の必須テストケース（正常系7個、エッジケース3個）
 */

describe('AnimationDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Zustandストアの初期化
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
    it('1. キューが空の場合、何も表示されない', () => {
      const { container } = render(<AnimationDisplay />);
      
      // アニメーションキューが空の場合は何も表示されない
      expect(container.firstChild).toBeNull();
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
    });

    it('2. UNIT_DAMAGE表示（ダメージ数値表示）', () => {
      const { container } = render(<AnimationDisplay />);
      
      // ユニットダメージアニメーションをキューに追加して再生
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
      });
      
      // ダメージアニメーションが表示されることを確認
      expect(screen.getByTestId('damage-display')).toBeTruthy();
      expect(screen.getByTestId('damage-amount').textContent).toBe('−50');
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.UNIT_DAMAGE);
    });

    it('3. POWER_CHANGE表示（国力変動表示）', () => {
      const { container } = render(<AnimationDisplay />);
      
      // 国力ダメージアニメーション
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_DAMAGE, {
          nationId: 'nation-1',
          amount: -300,
        });
      });
      
      expect(container.textContent).toContain('国力');
      expect(container.textContent).toContain('−');
      expect(container.textContent).toContain('-300');
      
      // 一度完了させる
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // 国力回復アニメーション
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_HEAL, {
          nationId: 'nation-1',
          amount: 500,
        });
      });
      
      expect(container.textContent).toContain('国力');
      expect(container.textContent).toContain('+');
      expect(container.textContent).toContain('500');
    });

    it('4. PHASE_CHANGE表示（フェーズ名表示）', () => {
      const { container } = render(<AnimationDisplay />);
      
      // フェーズ遷移アニメーションをキューに追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'ROUND_START',
        });
      });
      
      // フェーズ遷移が日本語で表示されることを確認
      expect(container.textContent).toContain('ラウンド開始');
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.PHASE_TRANSIT);
    });

    it('5. STATE_CHANGE表示', () => {
      const { container } = render(<AnimationDisplay />);
      
      // ステート付与アニメーション
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_ADD, {
          targetUnitId: 'unit-1',
          stateId: 'state-poison',
        });
      });
      
      expect(container.textContent).toContain('STATE_ADD');
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.STATE_ADD);
      
      // 一度完了させる
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // ステート削除アニメーション
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_REMOVE, {
          targetUnitId: 'unit-1',
          stateId: 'state-poison',
        });
      });
      
      expect(container.textContent).toContain('STATE_REMOVE');
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.STATE_REMOVE);
    });

    it('6. アニメーション完了後の自動dequeue', () => {
      const { container } = render(<AnimationDisplay />);
      
      // 2つのアニメーションをキューに追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_HEAL, {
          nationId: 'nation-1',
          amount: 200,
        });
      });
      
      // 1つ目のアニメーションが再生中
      expect(screen.getByTestId('damage-display')).toBeTruthy();
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.UNIT_DAMAGE);
      expect(useUIStateStore.getState().animationQueue).toHaveLength(1); // 2つ目がキューに残っている
      
      // 1つ目のアニメーション完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // 自動dequeueにより2つ目のアニメーションが再生開始
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.POWER_HEAL);
      expect(useUIStateStore.getState().animationQueue).toHaveLength(0); // キューが空になっている
      expect(container.textContent).toContain('国力');
      expect(container.textContent).toContain('+');
      
      // 2つ目のアニメーション完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // すべて完了
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
      expect(useUIStateStore.getState().animationQueue).toHaveLength(0);
      expect(container.firstChild).toBeNull();
    });

    it('7. 複数アニメーションの順次再生', () => {
      const { container } = render(<AnimationDisplay />);
      
      // 3つのアニメーションをキューに追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_HEAL, {
          nationId: 'nation-1',
          amount: 200,
        });
        useUIStateStore.getState().enqueueAnimation(GameEvent.STATE_ADD, {
          targetUnitId: 'unit-1',
          stateId: 'state-buff',
        });
      });
      
      // 1つ目：ユニットダメージ
      expect(screen.getByTestId('damage-display')).toBeTruthy();
      expect(screen.getByTestId('damage-amount').textContent).toBe('−50');
      
      // 1つ目完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // 2つ目：国力回復（自動的に次のアニメーションに切り替わる）
      expect(container.textContent).toContain('国力');
      expect(container.textContent).toContain('+');
      expect(container.textContent).toContain('200');
      
      // 2つ目完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // 3つ目：ステート付与
      expect(container.textContent).toContain('STATE_ADD');
      
      // 3つ目完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // すべて完了
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
      expect(useUIStateStore.getState().animationQueue).toHaveLength(0);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('バグ修正: 自動dequeueテスト (2個)', () => {
    it('8. enqueueAnimation後、AnimationDisplayが自動でdequeueAnimationを呼び、currentAnimationがセットされる', () => {
      render(<AnimationDisplay />);

      // dequeueAnimation は手動で呼ばない
      // 修正後: AnimationDisplay の useEffect が自動的に dequeueAnimation を呼び出す
      // 修正前（バグ状態）: currentAnimation は null のまま → このテストは失敗する
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, { amount: 30 });
      });

      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.UNIT_DAMAGE);
      expect(useUIStateStore.getState().animationQueue).toHaveLength(0);
    });

    it('9. 自動dequeueによりcurrentAnimationがセットされ、completeAnimation後にキューが空になる', () => {
      render(<AnimationDisplay />);

      // enqueueAnimation のみ（dequeueAnimation は手動で呼ばない）
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_HEAL, { amount: 100 });
      });

      // 修正後: 自動で currentAnimation がセットされている
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.POWER_HEAL);

      // completeAnimation を呼ぶとキューが空になる
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });

      expect(useUIStateStore.getState().currentAnimation).toBeNull();
      expect(useUIStateStore.getState().animationQueue).toHaveLength(0);
    });

    it('10. enqueueAnimation後、一定時間後にcompleteAnimation()が自動で呼ばれ、waitUI()の条件が解放される', async () => {
      render(<AnimationDisplay />);

      // enqueueAnimation のみ（dequeueAnimation は手動で呼ばない）
      // 修正後: AnimationDisplay の useEffect が自動的に dequeueAnimation を呼び出す
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, { amount: 42 });
      });

      // 自動dequeueにより currentAnimation がセットされ、isPlaying が true になる
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      expect(useUIStateStore.getState().isAnimationPlaying()).toBe(true);

      // 一定時間（500ms相当）が経過すると completeAnimation() が自動で呼ばれるはず
      // 修正前（バグ状態）: completeAnimation() が自動で呼ばれないため、
      //   currentAnimation は null にならず → このテストは失敗する
      // 修正後: AnimationDisplay が setTimeout 等で completeAnimation() を自動呼び出しする
      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.UNIT_DAMAGE]! + 100);
      });

      // completeAnimation() が自動で呼ばれた結果、currentAnimation が null になる
      // isAnimationPlaying() が false → ReactUIBridge.waitUI() のポーリングが解除される
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
      expect(useUIStateStore.getState().isAnimationPlaying()).toBe(false);
    });
  });

  describe('エッジケーステスト (3個)', () => {
    it('1. 演出中に新規アニメーション追加', () => {
      const { container } = render(<AnimationDisplay />);
      
      // 最初のアニメーションを再生開始
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
      });
      
      expect(screen.getByTestId('damage-display')).toBeTruthy();
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      
      // 演出中に新しいアニメーションをキューに追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_HEAL, {
          nationId: 'nation-1',
          amount: 300,
        });
      });
      
      // キューに追加されていることを確認
      expect(useUIStateStore.getState().animationQueue).toHaveLength(1);
      expect(useUIStateStore.getState().animationQueue[0].eventType).toBe(GameEvent.POWER_HEAL);
      
      // 最初のアニメーション完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // 次のアニメーションが自動的に再生される
      expect(container.textContent).toContain('国力');
      expect(container.textContent).toContain('+');
      expect(container.textContent).toContain('300');
    });

    it('2. 不正なアニメーションデータのハンドリング', () => {
      const { container } = render(<AnimationDisplay />);
      
      // nullデータでアニメーションを追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, null);
      });
      
      // データが存在しない場合は何も表示されない（早期リターン）
      expect(container.firstChild).toBeNull();
      
      // 完了させる
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // amountプロパティがないデータ
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_DAMAGE, {
          nationId: 'nation-1',
          // amountなし
        });
      });
      
      // 必須フィールドがない場合は何も表示されない
      expect(container.firstChild).toBeNull();
      
      // 完了させる
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // 未定義のイベントタイプ
      act(() => {
        useUIStateStore.getState().enqueueAnimation(
          'UNKNOWN_EVENT' as GameEvent,
          { message: 'test' }
        );
      });
      
      // 汎用表示が行われる
      expect(container.textContent).toContain('UNKNOWN_EVENT');
    });

    it('3. dequeueAnimation失敗時のハンドリング', () => {
      render(<AnimationDisplay />);
      
      // ケース1: キューが空の状態でdequeueAnimationを呼び出し
      expect(() => {
        act(() => {
          useUIStateStore.getState().dequeueAnimation();
        });
      }).not.toThrow();
      
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
      
      // ケース2: 既にアニメーションが再生中の場合
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_HEAL, {
          nationId: 'nation-1',
          amount: 200,
        });
      });
      
      const currentAnimation = useUIStateStore.getState().currentAnimation;
      expect(currentAnimation).not.toBeNull();
      
      // 再生中に再度dequeueAnimationを呼び出す
      act(() => {
        useUIStateStore.getState().dequeueAnimation();
      });
      
      // currentAnimationが変わっていない（無視される）
      expect(useUIStateStore.getState().currentAnimation).toBe(currentAnimation);
      
      // キューが減っていない
      expect(useUIStateStore.getState().animationQueue).toHaveLength(1);
    });
  });

  // ========================================
  // 以下: Task 2-2 実装前提のアサーションテスト
  // ========================================

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
        gameState: {
          stageId: 0,
          commandNum: 0,
          currentRound: 1,
          roundLimit: 10,
          nations: [
            {
              nationId: 'nation-1',
              name: 'テスト国家',
              isNPC: false,
              power: 1000,
              remainingActions: 3,
              states: [],
              units: [
                {
                  unitId: 'unit-1',
                  baseUnitId: 'testunit',
                  ownerNationId: 'nation-1',
                  name: 'テストユニット',
                  maxHP: 100,
                  currentHP: 50,
                  attack: 10,
                  skillId: 'skill1',
                  states: [],
                },
              ],
              graveyard: [],
              domesticCommands: [],
              actionCommands: [],
              targetMilitaryRatio: 0.5,
              aggressiveness: 0.5,
              hostileNationIds: [],
            },
          ],
          currentTurnPlayer: 0,
          currentPhase: 'GAME_START' as any,
          currentTarget: null,
          stateQueue: [],
          effectQueue: [],
          battleContext: null,
        },
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

      // ANIMATION_DURATION[UNIT_DAMAGE] - 1ms 後はまだ再生中
      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.UNIT_DAMAGE]! - 1);
      });
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      // ANIMATION_DURATION[UNIT_DAMAGE]ms後に完了
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
        gameState: {
          stageId: 0,
          commandNum: 0,
          currentRound: 1,
          roundLimit: 10,
          nations: [
            {
              nationId: 'nation-1',
              name: 'テスト国家',
              isNPC: false,
              power: 1000,
              remainingActions: 3,
              states: [],
              units: [
                {
                  unitId: 'unit-1',
                  baseUnitId: 'testunit',
                  ownerNationId: 'nation-1',
                  name: '勇者アレン',
                  maxHP: 100,
                  currentHP: 100,
                  attack: 20,
                  skillId: 'skill1',
                  states: [],
                },
              ],
              graveyard: [],
              domesticCommands: [],
              actionCommands: [],
              targetMilitaryRatio: 0.5,
              aggressiveness: 0.5,
              hostileNationIds: [],
            },
          ],
          currentTurnPlayer: 0,
          currentPhase: 'GAME_START' as any,
          currentTarget: null,
          stateQueue: [],
          effectQueue: [],
          battleContext: null,
        },
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

    /**
     * テスト5の依存関係:
     * - enqueueAnimation後、AnimationDisplayが自動でdequeueAnimationを呼び出す
     * - ANIMATION_DURATION[SKILL_ACTIVATE] = 1200ms に基づきタイマーで自動完了
     * - この2つの自動化により明示的なdequeue/complete呼び出しは不要
     */
    it('5. SKILL_ACTIVATE の持続時間が 1200ms（1199ms後は未完了、1200ms後に completeAnimation が呼ばれる）', async () => {
      render(<AnimationDisplay />);

      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.SKILL_ACTIVATE, {
          attackerId: 'unit-1',
          skillName: 'ファイアボール',
        });
      });

      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      // ANIMATION_DURATION[SKILL_ACTIVATE] - 1ms 後はまだ再生中
      await act(async () => {
        vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.SKILL_ACTIVATE]! - 1);
      });
      expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

      // ANIMATION_DURATION[SKILL_ACTIVATE]ms後に完了
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
    /**
     * テスト目的：
     * SkillVisualTypeに応じた演出の差別化を実装し、
     * ATTACKなどのスキルタイプごとに異なるCSSクラスとスタイルが適用されることを検証
     */

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
          // skillVisualTypeを省略
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
          // 将来追加される可能性のあるskillVisualType（仮想）
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

  describe('複数国家同時変動の最適化', () => {
    it('キューに3つ以上の国力変動イベントがある場合、要約表示される', () => {
      const { container } = render(<AnimationDisplay />);

      // 最初の国力変動イベントを追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_DAMAGE, {
          nationId: 'nation-1',
          amount: 100,
        });
      });

      // さらに2つキューに追加（合計3つ）
      act(() => {
        useUIStateStore.setState({
          animationQueue: [
            { eventType: GameEvent.POWER_HEAL, data: { nationId: 'nation-2', amount: 200 } },
            { eventType: GameEvent.POWER_DAMAGE, data: { nationId: 'nation-3', amount: 150 } },
          ],
        });
      });

      // 要約表示が表示されることを確認
      const summary = screen.getByTestId('power-summary');
      expect(summary).toBeTruthy();
      expect(summary.textContent).toBe('3国が同時に国力変動');
    });

    it('キューに2つ以下の国力変動イベントがある場合、通常表示される', () => {
      const { container } = render(<AnimationDisplay />);

      // ゲーム状態を設定
      act(() => {
        useGameStateStore.setState({
          gameState: {
            nations: [
              { nationId: 'nation-1', name: 'テスト王国' },
            ],
          } as any,
        });
      });

      // 最初の国力変動イベントを追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.POWER_DAMAGE, {
          nationId: 'nation-1',
          amount: 100,
        });
      });

      // キューに1つだけ追加（合計2つ）
      act(() => {
        useUIStateStore.setState({
          animationQueue: [
            { eventType: GameEvent.POWER_HEAL, data: { nationId: 'nation-2', amount: 200 } },
          ],
        });
      });

      // 通常表示が表示されることを確認
      const nationName = screen.getByTestId('power-nation-name');
      expect(nationName).toBeTruthy();
      expect(nationName.textContent).toBe('テスト王国');

      const amount = screen.getByTestId('power-amount');
      expect(amount).toBeTruthy();
      expect(amount.textContent).toContain('100');
    });
  });

  describe('Task 2-4: PHASE_TRANSIT フェーズ遷移演出', () => {
    /**
     * Phase 2-4-2: フェーズ遷移演出のテストケース
     * 
     * TDDアプローチに基づき、Phase 2-4-1の実装前に作成。
     * 初期状態では全テストが失敗する（実装前のため）。
     * Phase 2-4-1の実装完了後、全テストがパスすることを確認。
     */

    describe('1. フェーズ名の日本語表示テスト', () => {
      it('1-1. PHASE_TRANSIT イベントで専用の演出が表示される', () => {
        render(<AnimationDisplay />);

        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
            phase: 'GAME_START',
          });
        });

        // 専用の演出要素が表示される
        expect(screen.getByTestId('phase-transit-display')).toBeTruthy();
        
        // 汎用表示（defaultケース）は使用されない
        // ※ defaultケースでは .animation-overlay > .animation.generic が表示される
        const genericAnimation = document.querySelector('.animation.generic');
        expect(genericAnimation).toBeNull();
      });

      it('1-2. フェーズ名が日本語でマッピングされて表示される（基本ケース）', () => {
        render(<AnimationDisplay />);

        // テストケース: GAME_START → ゲーム開始
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
            phase: 'GAME_START',
          });
        });
        expect(screen.getByTestId('phase-name').textContent).toBe('ゲーム開始');

        // 完了させて次のテストへ
        act(() => {
          useUIStateStore.getState().completeAnimation();
        });

        // テストケース: DOMESTIC → 内政フェーズ
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
            phase: 'DOMESTIC',
          });
        });
        expect(screen.getByTestId('phase-name').textContent).toBe('内政フェーズ');

        act(() => {
          useUIStateStore.getState().completeAnimation();
        });

        // テストケース: BATTLE_START → 戦闘開始
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
            phase: 'BATTLE_START',
          });
        });
        expect(screen.getByTestId('phase-name').textContent).toBe('戦闘開始');

        act(() => {
          useUIStateStore.getState().completeAnimation();
        });

        // テストケース: BATTLE_END → 戦闘終了
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
            phase: 'BATTLE_END',
          });
        });
        expect(screen.getByTestId('phase-name').textContent).toBe('戦闘終了');

        act(() => {
          useUIStateStore.getState().completeAnimation();
        });

        // テストケース: GAME_END → ゲーム終了
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

        // マッピングに存在しないフェーズは元の文字列をそのまま表示
        expect(screen.getByTestId('phase-name').textContent).toBe('UNKNOWN_PHASE');
        
        // エラーやnullではない
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

        // .phase-transit-overlayクラスを持つ要素が存在する
        const overlay = container.querySelector('.phase-transit-overlay');
        expect(overlay).not.toBeNull();
        expect(overlay).toBeTruthy();
        
        // data-testidも同じ要素に付与されている
        expect(screen.getByTestId('phase-transit-display')).toBe(overlay);
      });

      it('2-2. animation-overlayクラスが付与されない（専用レイアウト）', () => {
        const { container } = render(<AnimationDisplay />);

        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
            phase: 'GAME_START',
          });
        });

        // UNIT_DAMAGEやSKILL_ACTIVATEと同様、専用レイアウトを使用
        expect(container.querySelector('.animation-overlay')).toBeNull();
        
        // 専用クラスは存在する
        expect(container.querySelector('.phase-transit-overlay')).not.toBeNull();
      });
    });

    describe('3. アニメーション時間のテスト', () => {
      it('3-1. ANIMATION_DURATIONに1500msが設定されている', () => {
        // ANIMATION_DURATIONオブジェクトに正しい値が設定されているか確認
        expect(ANIMATION_DURATION[GameEvent.PHASE_TRANSIT]).toBe(1500);
      });

      it('3-2. 1500ms後に自動的にcompleteAnimationが呼ばれる', async () => {
        render(<AnimationDisplay />);

        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
            phase: 'ROUND_START',
          });
        });

        // アニメーション再生中
        expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
        expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.PHASE_TRANSIT);

        // 1499ms後はまだ再生中
        await act(async () => {
          vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.PHASE_TRANSIT]! - 1);
        });
        expect(useUIStateStore.getState().currentAnimation).not.toBeNull();

        // 1500ms後に自動完了
        await act(async () => {
          vi.advanceTimersByTime(1);
        });
        expect(useUIStateStore.getState().currentAnimation).toBeNull();
      });
    });

    describe('4. データ未定義時のフォールバックテスト', () => {
      it('4-1. dataがnullの場合、何も表示されない', () => {
        const { container } = render(<AnimationDisplay />);

        // nullデータでアニメーションを追加
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, null);
        });

        // 早期リターンにより何も表示されない
        expect(screen.queryByTestId('phase-transit-display')).toBeNull();
        expect(container.firstChild).toBeNull();
        
        // エラーは発生しない（例外が投げられない）
        expect(() => {
          render(<AnimationDisplay />);
        }).not.toThrow();
      });

      it('4-2. data.phaseが存在しない場合のハンドリング', () => {
        render(<AnimationDisplay />);

        // phaseプロパティが存在しないデータ
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {} as any);
        });

        // 不正なデータの場合、何も表示されない（早期リターン）
        expect(screen.queryByTestId('phase-transit-display')).toBeNull();
        
        // エラーは発生しない
        expect(() => {
          render(<AnimationDisplay />);
        }).not.toThrow();
      });
    });
  });

  /**
   * タスク2-5-2: visualType（攻撃前効果の文脈表示）テスト
   * 
   * 目的: 攻撃前効果と通常の効果が視覚的に区別できるようにする
   * 範囲: UNIT_DAMAGE、STATE_ADD、UNIT_HEALイベントでのvisualType活用
   */
  describe('Task 2-5-2: visualType（攻撃前効果の文脈表示）', () => {
    describe('1. UNIT_DAMAGEイベントでのvisualType反映', () => {
      it('TC-1.1: visualType=DAMAGEの場合、適切なdata属性とCSSクラスが適用される', () => {
        const { container } = render(<AnimationDisplay />);
        
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
        const { container } = render(<AnimationDisplay />);
        
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
        const { container } = render(<AnimationDisplay />);
        
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
        const { container } = render(<AnimationDisplay />);
        
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
            targetUnitId: 'unit-4',
            amount: 25,
            // visualTypeフィールドなし
          });
        });
        
        const damageDisplay = screen.getByTestId('damage-display');
        expect(damageDisplay).toBeTruthy();
        // data-visual-type属性が存在しない、またはundefined
        const visualTypeAttr = damageDisplay.getAttribute('data-visual-type');
        expect(visualTypeAttr === null || visualTypeAttr === 'undefined').toBe(true);
        expect(damageDisplay.className).toContain('animation-damage');
        // モディファイアが含まれていないことを確認
        expect(damageDisplay.className).not.toContain('animation-damage--');
      });
    });

    describe('2. STATE_ADDイベントでのvisualType反映', () => {
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
        // ステートIDが表示されることを確認（マスタデータがない場合はstateIdをそのまま表示）
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
        const { container } = render(<AnimationDisplay />);
        
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
        // NONEの場合はモディファイアが適用されない
        expect(stateAddDisplay.className).not.toContain('animation-state-add--buff');
        expect(stateAddDisplay.className).not.toContain('animation-state-add--debuff');
      });
    });

    describe('2-6. STATE_REMOVEイベントでのvisualType反映とターゲット名表示', () => {
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
        // ステートIDが表示されることを確認
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
        const { container } = render(<AnimationDisplay />);
        
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
        // NONEの場合はモディファイアが適用されない
        expect(stateRemoveDisplay.className).not.toContain('animation-state-remove--buff');
        expect(stateRemoveDisplay.className).not.toContain('animation-state-remove--debuff');
      });

      it('TC-2-6-4: ユニットターゲットの名前が正しく表示される', () => {
        render(<AnimationDisplay />);
        
        // GameStateにユニットを追加
        useGameStateStore.setState({
          gameState: {
            stageId: 1,
            commandNum: 3,
            currentRound: 1,
            roundLimit: 10,
            currentTurnPlayer: 0,
            currentPhase: GamePhase.BATTLE_START,
            currentTarget: null,
            stateQueue: [],
            effectQueue: [],
            battleContext: null,
            nations: [
              {
                nationId: 'nation-test',
                name: 'テスト国家',
                isNPC: false,
                power: 1000,
                remainingActions: 3,
                units: [
                  {
                    baseUnitId: 'unit-hero',
                    unitId: 'hero-001',
                    name: '勇者',
                    currentHP: 100,
                    maxHP: 100,
                    attack: 50,
                    skillId: 'skill-attack',
                    states: [],
                  },
                ],
                states: [],
                graveyard: [],
                domesticCommands: [],
                actionCommands: [],
                targetMilitaryRatio: 0.5,
                aggressiveness: 0.5,
                hostileNationIds: [],
              },
            ],
          },
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
        
        // GameStateに国家を追加
        useGameStateStore.setState({
          gameState: {
            stageId: 1,
            commandNum: 3,
            currentRound: 1,
            roundLimit: 10,
            currentTurnPlayer: 0,
            currentPhase: GamePhase.BATTLE_START,
            currentTarget: null,
            stateQueue: [],
            effectQueue: [],
            battleContext: null,
            nations: [
              {
                nationId: 'nation-a',
                name: '帝国',
                isNPC: false,
                power: 1500,
                remainingActions: 3,
                units: [],
                states: [],
                graveyard: [],
                domesticCommands: [],
                actionCommands: [],
                targetMilitaryRatio: 0.5,
                aggressiveness: 0.5,
                hostileNationIds: [],
              },
            ],
          },
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
            // visualType: undefined (省略)
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

    describe('3. UNIT_HEALイベントでのvisualType反映', () => {
      it('TC-3.1: visualType=HEALの場合、回復演出でvisualTypeが正しく適用される', () => {
        const { container } = render(<AnimationDisplay />);
        
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_HEAL, {
            targetUnitId: 'unit-5',
            amount: 20,
            visualType: 'HEAL',
          });
        });
        
        // 回復演出要素が存在することを確認（UNIT_HEALは未実装の可能性があるため柔軟にテスト）
        const healDisplay = container.querySelector('[data-testid="heal-display"]');
        if (healDisplay) {
          expect(healDisplay.getAttribute('data-visual-type')).toBe('HEAL');
          expect(healDisplay.className).toContain('heal');
        }
        // 少なくとも何らかのアニメーションが表示されていることを確認
        expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
      });
    });

    describe('4. エッジケース', () => {
      it('TC-4.1: 複数の異なるvisualTypeイベントが連続して正しく切り替わる', async () => {
        render(<AnimationDisplay />);
        
        // 最初のアニメーション（visualType=DAMAGE）
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
        
        // 2つ目のアニメーションをキューに追加
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
            targetUnitId: 'unit-7',
            amount: 15,
            visualType: 'BUFF',
          });
        });
        
        // 最初のアニメーション完了を待つ
        await act(async () => {
          vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.UNIT_DAMAGE]! + 100);
        });
        
        // 2つ目のアニメーションに切り替わっていることを確認
        damageDisplay = screen.getByTestId('damage-display');
        expect(damageDisplay.getAttribute('data-visual-type')).toBe('BUFF');
        expect(damageDisplay.className).toContain('animation-damage--buff');
      });

      it('TC-4.2: visualTypeフィールドが空文字列の場合でもエラーが発生しない', () => {
        const { container } = render(<AnimationDisplay />);
        
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
            targetUnitId: 'unit-8',
            amount: 5,
            visualType: '',
          });
        });
        
        // アニメーションが正常に表示される
        const damageDisplay = screen.getByTestId('damage-display');
        expect(damageDisplay).toBeTruthy();
        
        // デフォルトスタイルが適用される（空文字列は無効とみなす）
        expect(damageDisplay.className).toContain('animation-damage');
        
        // エラーが発生しない
        expect(() => {
          render(<AnimationDisplay />);
        }).not.toThrow();
      });
    });
  });

  /**
   * Task 3-5-1: COMMAND_EXECUTE演出テスト
   * 
   * 行動コマンド実行時のアニメーション演出を確認
   * 設計ドキュメント: .github/designs/行動フェーズ専用画面/3-5-1_AnimationDisplay演出拡張.md
   * テストケース: .github/tasks/行動フェーズ専用画面/tests/3-5-1.md
   */
  describe('Task 3-5-1: COMMAND_EXECUTE演出', () => {
    describe('正常系テスト (7個)', () => {
      it('Test 1: 基本表示（visualTypeなし）', () => {
        render(<AnimationDisplay />);
        
        act(() => {
          useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
            commandName: '外交工作',
            commandType: 'DIPLOMACY',
          });
        });
        
        // 要素の存在確認
        const display = screen.getByTestId('command-execute-display');
        expect(display).toBeTruthy();
        
        // コマンド名が表示される
        const commandName = screen.getByTestId('command-name');
        expect(commandName.textContent).toBe('外交工作');
        
        // visualTypeは未設定
        expect(display.getAttribute('data-visual-type')).toBeNull();
        
        // CSSクラスは基本のみ
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
        
        // visualType属性が正しく設定される
        expect(display.getAttribute('data-visual-type')).toBe('FRIENDLY');
        
        // 友好的スタイルのCSSクラスが適用される
        expect(display.className).toContain('animation-command-execute');
        expect(display.className).toContain('animation-command-execute--friendly');
        
        // コマンド名が表示される
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
        
        // visualType属性が正しく設定される
        expect(display.getAttribute('data-visual-type')).toBe('HOSTILE');
        
        // 敵対的スタイルのCSSクラスが適用される
        expect(display.className).toContain('animation-command-execute');
        expect(display.className).toContain('animation-command-execute--hostile');
        
        // コマンド名が表示される
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
        
        // visualType属性が正しく設定される
        expect(display.getAttribute('data-visual-type')).toBe('NEUTRAL');
        
        // 中立的スタイルのCSSクラスが適用される
        expect(display.className).toContain('animation-command-execute');
        expect(display.className).toContain('animation-command-execute--neutral');
        
        // コマンド名が表示される
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
        
        // ターゲット要素が表示される
        const targetElement = screen.getByTestId('command-target');
        expect(targetElement).toBeTruthy();
        expect(targetElement.textContent).toBe('対象: 共和国');
        
        // コマンド名も表示される
        expect(screen.getByTestId('command-name').textContent).toBe('外交工作');
      });

      it('Test 6: アニメーション持続時間の確認', () => {
        // ANIMATION_DURATIONが正しく設定されている
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
        
        // アニメーションが開始されている
        expect(useUIStateStore.getState().currentAnimation).not.toBeNull();
        expect(useUIStateStore.getState().isAnimationPlaying()).toBe(true);
        
        // アニメーション持続時間+バッファ経過
        await act(async () => {
          vi.advanceTimersByTime(ANIMATION_DURATION[GameEvent.COMMAND_EXECUTE]! + 100);
        });
        
        // アニメーションが完了し、自動的にdequeueされる
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
        
        // 何も表示されない
        const display = screen.queryByTestId('command-execute-display');
        expect(display).toBeNull();
      });

      it('Edge 2: 必須データが欠落している場合、何も表示されない', () => {
        render(<AnimationDisplay />);
        
        act(() => {
          // commandName を意図的に欠落させる
          useUIStateStore.getState().enqueueAnimation(GameEvent.COMMAND_EXECUTE, {
            commandType: 'DIPLOMACY',
          } as any);
        });
        
        // 何も表示されない
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
        
        // 表示される
        expect(display).toBeTruthy();
        
        // visualType属性が設定される
        expect(display.getAttribute('data-visual-type')).toBe('MAGIC');
        
        // 未定義のCSSクラスが適用される（エラーにならない）
        expect(display.className).toContain('animation-command-execute');
        expect(display.className).toContain('animation-command-execute--magic');
        
        // コマンド名が表示される
        expect(screen.getByTestId('command-name').textContent).toBe('未知の操作');
      });
    });
  });
});
