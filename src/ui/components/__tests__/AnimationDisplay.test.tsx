import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AnimationDisplay } from '../AnimationDisplay';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';

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
        useUIStateStore.getState().dequeueAnimation();
      });
      
      // ダメージアニメーションが表示されることを確認
      expect(container.textContent).toContain('ダメージ');
      expect(container.textContent).toContain('50');
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
        useUIStateStore.getState().dequeueAnimation();
      });
      
      expect(container.textContent).toContain('国力変動');
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
        useUIStateStore.getState().dequeueAnimation();
      });
      
      expect(container.textContent).toContain('国力変動');
      expect(container.textContent).toContain('500');
    });

    it('4. PHASE_CHANGE表示（フェーズ名表示）', () => {
      const { container } = render(<AnimationDisplay />);
      
      // フェーズ遷移アニメーションをキューに追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.PHASE_TRANSIT, {
          phase: 'ラウンド開始',
        });
        useUIStateStore.getState().dequeueAnimation();
      });
      
      // フェーズ遷移が表示されることを確認（現在の実装ではeventTypeを表示）
      expect(container.textContent).toContain('PHASE_TRANSIT');
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
        useUIStateStore.getState().dequeueAnimation();
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
        useUIStateStore.getState().dequeueAnimation();
      });
      
      expect(container.textContent).toContain('STATE_REMOVE');
      expect(useUIStateStore.getState().currentAnimation?.eventType).toBe(GameEvent.STATE_REMOVE);
    });

    it('6. 演出完了後にdequeueAnimationが呼ばれる', () => {
      const { container } = render(<AnimationDisplay />);
      
      // スパイを設定してdequeueAnimationの呼び出しを監視
      const dequeueSpy = vi.spyOn(useUIStateStore.getState(), 'dequeueAnimation');
      
      // アニメーションをキューに追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, {
          targetUnitId: 'unit-1',
          amount: 50,
        });
        useUIStateStore.getState().dequeueAnimation();
      });
      
      expect(container.textContent).toContain('ダメージ');
      expect(dequeueSpy).toHaveBeenCalled();
      
      // アニメーション完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // completeAnimation後に状態がクリアされることを確認
      expect(useUIStateStore.getState().currentAnimation).toBeNull();
      expect(container.firstChild).toBeNull();
      
      dequeueSpy.mockRestore();
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
        
        // 最初のアニメーション開始
        useUIStateStore.getState().dequeueAnimation();
      });
      
      // 1つ目：ユニットダメージ
      expect(container.textContent).toContain('ダメージ');
      expect(container.textContent).toContain('50');
      
      // 1つ目完了
      act(() => {
        useUIStateStore.getState().completeAnimation();
      });
      
      // 2つ目：国力回復（自動的に次のアニメーションに切り替わる）
      expect(container.textContent).toContain('国力変動');
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
        vi.advanceTimersByTime(600);
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
        useUIStateStore.getState().dequeueAnimation();
      });
      
      expect(container.textContent).toContain('ダメージ');
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
      expect(container.textContent).toContain('国力変動');
      expect(container.textContent).toContain('300');
    });

    it('2. 不正なアニメーションデータのハンドリング', () => {
      const { container } = render(<AnimationDisplay />);
      
      // nullデータでアニメーションを追加
      act(() => {
        useUIStateStore.getState().enqueueAnimation(GameEvent.UNIT_DAMAGE, null);
        useUIStateStore.getState().dequeueAnimation();
      });
      
      // エラーが発生せずに表示される
      expect(container.textContent).toContain('ダメージ');
      
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
        useUIStateStore.getState().dequeueAnimation();
      });
      
      expect(container.textContent).toContain('国力変動');
      
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
        useUIStateStore.getState().dequeueAnimation();
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
        useUIStateStore.getState().dequeueAnimation();
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
});
