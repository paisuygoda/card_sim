import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StateIcon } from '../StateIcon';
import { State, StateVisualType } from '@core/domain/models';

/**
 * StateIcon コンポーネント テスト
 *
 * TDD 赤フェーズ：以下の機能が未実装のため、全テストが失敗することを期待する
 *  - StateIconコンポーネントの実装
 *  - アイコン表示（StateMaster.getStateIconを使用）
 *  - スタック数バッジ表示
 *  - 永続ステートマーカー（∞）表示
 *  - カテゴリー別ボーダー色
 *  - ホバー/フォーカスインタラクション
 *  - アクセシビリティ対応（ARIA属性）
 */

// ========================================================================
// テストデータ
// ========================================================================

/** バフ系・期限付き・スタックなし */
const buffState: State = {
  stateId: 'attackPowerUp',
  name: '攻撃力上昇',
  stateVisualType: StateVisualType.NONE,
  stacks: null,
  duration: 3,
  triggerTimings: [],
  remainings: null,
  effects: [],
  excludes: [[], [], []],
};

/** デバフ系・スタックあり */
const debuffStackedState: State = {
  stateId: 'attackPowerDown',
  name: '攻撃力低下',
  stateVisualType: StateVisualType.NONE,
  stacks: 5,
  duration: 2,
  triggerTimings: [],
  remainings: null,
  effects: [],
  excludes: [[], [], []],
};

/** 中立系・永続 */
const neutralPermanentState: State = {
  stateId: 'dead',
  name: '死亡',
  stateVisualType: StateVisualType.NONE,
  stacks: null,
  duration: null,
  triggerTimings: [],
  remainings: null,
  effects: [],
  excludes: [[], [], []],
};

/** スタック&永続 */
const permanentStackedState: State = {
  stateId: 'prosperity',
  name: '繁栄',
  stateVisualType: StateVisualType.NONE,
  stacks: 3,
  duration: null,
  triggerTimings: [],
  remainings: null,
  effects: [],
  excludes: [[], [], []],
};

/** スタック数99（境界値） */
const stack99State: State = {
  stateId: 'attackPowerUp',
  name: '攻撃力上昇',
  stateVisualType: StateVisualType.NONE,
  stacks: 99,
  duration: 3,
  triggerTimings: [],
  remainings: null,
  effects: [],
  excludes: [[], [], []],
};

/** スタック数150（99+表示） */
const stack150State: State = {
  stateId: 'attackPowerUp',
  name: '攻撃力上昇',
  stateVisualType: StateVisualType.NONE,
  stacks: 150,
  duration: 3,
  triggerTimings: [],
  remainings: null,
  effects: [],
  excludes: [[], [], []],
};

// ========================================================================
// テストスイート
// ========================================================================

describe('StateIcon', () => {
  // ----------------------------------------------------------------------
  // 2-1. 基本レンダリング
  // ----------------------------------------------------------------------
  describe('基本レンダリング', () => {
    it('Test Case 2-1-1: アイコン絵文字が正しく表示される', () => {
      // attackPowerUp → '⚔️' (StateMasterに定義済み)
      render(<StateIcon state={buffState} />);

      // アイコン絵文字が表示される
      expect(screen.getByText('⚔️')).toBeInTheDocument();
    });

    it('Test Case 2-1-2: ステート名がaria-labelに含まれる', () => {
      render(<StateIcon state={buffState} />);

      // role="img" を持つ要素が存在
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();

      // aria-label にステート名が含まれる
      const ariaLabel = icon.getAttribute('aria-label');
      expect(ariaLabel).toContain('攻撃力上昇');
    });

    it('Test Case 2-1-3: カテゴリー別のボーダー色 - バフ系（緑）', () => {
      const { container } = render(<StateIcon state={buffState} />);

      const icon = container.querySelector('.state-icon');
      expect(icon).not.toBeNull();

      // buffクラスが存在するか、またはborder-colorが緑系
      const hasBuff =
        (icon as HTMLElement).classList.contains('buff') ||
        (icon as HTMLElement).style.borderColor === 'rgb(76, 175, 80)' || // #4caf50
        (icon as HTMLElement).style.borderColor === '#4caf50';

      expect(hasBuff).toBe(true);
    });

    it('Test Case 2-1-4: カテゴリー別のボーダー色 - デバフ系（赤）', () => {
      const { container } = render(<StateIcon state={debuffStackedState} />);

      const icon = container.querySelector('.state-icon');
      expect(icon).not.toBeNull();

      // debuffクラスが存在するか、またはborder-colorが赤系
      const hasDebuff =
        (icon as HTMLElement).classList.contains('debuff') ||
        (icon as HTMLElement).style.borderColor === 'rgb(244, 67, 54)' || // #f44336
        (icon as HTMLElement).style.borderColor === '#f44336';

      expect(hasDebuff).toBe(true);
    });

    it('Test Case 2-1-5: カテゴリー別のボーダー色 - 中立系（グレー）', () => {
      const { container } = render(<StateIcon state={neutralPermanentState} />);

      const icon = container.querySelector('.state-icon');
      expect(icon).not.toBeNull();

      // neutralクラスが存在するか、またはborder-colorがグレー系
      const hasNeutral =
        (icon as HTMLElement).classList.contains('neutral') ||
        (icon as HTMLElement).style.borderColor === 'rgb(158, 158, 158)' || // #9e9e9e
        (icon as HTMLElement).style.borderColor === '#9e9e9e';

      expect(hasNeutral).toBe(true);
    });
  });

  // ----------------------------------------------------------------------
  // 2-2. スタック数バッジ表示
  // ----------------------------------------------------------------------
  describe('スタック数バッジ表示', () => {
    it('Test Case 2-2-1: スタック数がnullの場合、バッジが表示されない', () => {
      render(<StateIcon state={buffState} />);

      // バッジが存在しない
      const badge = screen.queryByTestId('stack-badge');
      expect(badge).toBeNull();
    });

    it('Test Case 2-2-2: スタック数が1桁の場合、そのまま表示される', () => {
      render(<StateIcon state={debuffStackedState} />);

      // スタック数5が表示される
      expect(screen.getByText('5')).toBeInTheDocument();

      // aria-labelにスタック情報が含まれる
      const icon = screen.getByRole('img');
      const ariaLabel = icon.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/スタック.*5/);
    });

    it('Test Case 2-2-3: スタック数が2桁の場合、そのまま表示される', () => {
      const stack12State: State = {
        ...buffState,
        stacks: 12,
      };

      render(<StateIcon state={stack12State} />);

      // スタック数12が表示される
      expect(screen.getByText('12')).toBeInTheDocument();

      // aria-labelにスタック情報が含まれる
      const icon = screen.getByRole('img');
      const ariaLabel = icon.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/スタック.*12/);
    });

    it('Test Case 2-2-4: スタック数が100以上の場合、"99+"と表示される', () => {
      render(<StateIcon state={stack150State} />);

      // "99+"が表示される
      expect(screen.getByText('99+')).toBeInTheDocument();

      // aria-labelには実際のスタック数が含まれる
      const icon = screen.getByRole('img');
      const ariaLabel = icon.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/スタック.*150/);
    });

    it('Test Case 2-2-5: スタック数が99の場合、"99"と表示される（境界値）', () => {
      render(<StateIcon state={stack99State} />);

      // "99"が表示される（"99+"ではない）
      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.queryByText('99+')).toBeNull();
    });
  });

  // ----------------------------------------------------------------------
  // 2-3. 永続マーカー表示
  // ----------------------------------------------------------------------
  describe('永続マーカー表示', () => {
    it('Test Case 2-3-1: duration が null の場合、∞マークが表示される', () => {
      render(<StateIcon state={neutralPermanentState} />);

      // ∞マークが表示される
      expect(screen.getByText('∞')).toBeInTheDocument();

      // aria-labelに"永続"が含まれる
      const icon = screen.getByRole('img');
      const ariaLabel = icon.getAttribute('aria-label');
      expect(ariaLabel).toContain('永続');
    });

    it('Test Case 2-3-2: duration が数値の場合、∞マークが表示されない', () => {
      render(<StateIcon state={buffState} />);

      // ∞マークが存在しない
      expect(screen.queryByText('∞')).toBeNull();
    });

    it('Test Case 2-3-3: スタック数と永続マークが同時に表示される', () => {
      render(<StateIcon state={permanentStackedState} />);

      // スタック数が表示される
      expect(screen.getByText('3')).toBeInTheDocument();

      // ∞マークが表示される
      expect(screen.getByText('∞')).toBeInTheDocument();

      // aria-labelに両方の情報が含まれる
      const icon = screen.getByRole('img');
      const ariaLabel = icon.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/スタック.*3/);
      expect(ariaLabel).toContain('永続');
    });
  });

  // ----------------------------------------------------------------------
  // 2-4. ホバーインタラクション
  // ----------------------------------------------------------------------
  describe('ホバーインタラクション', () => {
    it('Test Case 2-4-1: マウスホバー時にonHoverコールバックが呼ばれる', () => {
      const mockOnHover = vi.fn();
      render(<StateIcon state={buffState} onHover={mockOnHover} />);

      const icon = screen.getByRole('img');

      // マウスエンター → stateIdが渡される
      fireEvent.mouseEnter(icon);
      expect(mockOnHover).toHaveBeenCalledWith('attackPowerUp');

      // マウスリーブ → nullが渡される
      fireEvent.mouseLeave(icon);
      expect(mockOnHover).toHaveBeenCalledWith(null);
    });

    it('Test Case 2-4-2: フォーカス時にonHoverコールバックが呼ばれる（アクセシビリティ）', () => {
      const mockOnHover = vi.fn();
      render(<StateIcon state={buffState} onHover={mockOnHover} />);

      const icon = screen.getByRole('img');

      // フォーカス → stateIdが渡される
      icon.focus();
      expect(mockOnHover).toHaveBeenCalledWith('attackPowerUp');

      // ブラー → nullが渡される
      icon.blur();
      expect(mockOnHover).toHaveBeenCalledWith(null);
    });

    it('Test Case 2-4-3: onHover が未指定でもクラッシュしない', () => {
      // onHoverを渡さずにレンダリング
      expect(() => render(<StateIcon state={buffState} />)).not.toThrow();

      const icon = screen.getByRole('img');

      // ホバーしてもエラーが発生しない
      expect(() => {
        fireEvent.mouseEnter(icon);
        fireEvent.mouseLeave(icon);
      }).not.toThrow();
    });
  });

  // ----------------------------------------------------------------------
  // 2-5. アクセシビリティ
  // ----------------------------------------------------------------------
  describe('アクセシビリティ', () => {
    it('Test Case 2-5-1: role="img" が設定されている', () => {
      render(<StateIcon state={buffState} />);

      // role="img"でアイコンを取得できる
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
    });

    it('Test Case 2-5-2: tabIndex={0} が設定されている', () => {
      render(<StateIcon state={buffState} />);

      const icon = screen.getByRole('img');

      // tabIndexが0に設定されている
      expect(icon.getAttribute('tabindex')).toBe('0');
    });

    it('Test Case 2-5-3: aria-labelにステート情報が含まれる', () => {
      render(<StateIcon state={permanentStackedState} />);

      const icon = screen.getByRole('img');
      const ariaLabel = icon.getAttribute('aria-label');

      // ステート名が含まれる
      expect(ariaLabel).toContain('繁栄');

      // スタック情報が含まれる
      expect(ariaLabel).toMatch(/スタック.*3/);

      // 永続情報が含まれる
      expect(ariaLabel).toContain('永続');
    });
  });

  // ----------------------------------------------------------------------
  // 2-6. スタック数変更アニメーション
  // ----------------------------------------------------------------------
  describe('スタック数変更アニメーション', () => {
    it('Test Case 2-6-1: スタック数増加時のアニメーション', () => {
      // 初期: スタック数3
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 3 }} />);
      const badge = screen.getByTestId('stack-badge');
      expect(badge.textContent).toBe('3');

      // スタック数を5に増加
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);

      // stack-increaseクラスが適用される
      expect(badge.className).toContain('stack-increase');
      expect(badge.textContent).toBe('5');
    });

    it('Test Case 2-6-2: スタック数減少時のアニメーション', () => {
      // 初期: スタック数5
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);
      const badge = screen.getByTestId('stack-badge');
      expect(badge.textContent).toBe('5');

      // スタック数を2に減少
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 2 }} />);

      // stack-decreaseクラスが適用される
      expect(badge.className).toContain('stack-decrease');
      expect(badge.textContent).toBe('2');
    });

    it('Test Case 2-6-3: 初回レンダリング時はアニメーションなし', () => {
      // 初回レンダリング
      render(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);
      const badge = screen.getByTestId('stack-badge');

      // アニメーションクラスが適用されていない
      expect(badge.className).not.toContain('stack-increase');
      expect(badge.className).not.toContain('stack-decrease');
    });

    it('Test Case 2-6-4: スタック数が変化しない場合はアニメーションなし', () => {
      // 初期: スタック数5
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);
      const badge = screen.getByTestId('stack-badge');

      // 同じスタック数で再レンダリング
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);

      // アニメーションクラスが適用されていない
      expect(badge.className).not.toContain('stack-increase');
      expect(badge.className).not.toContain('stack-decrease');
    });

    it('Test Case 2-6-5: アニメーション完了後のクラス削除', async () => {
      // 初期: スタック数3
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 3 }} />);
      const badge = screen.getByTestId('stack-badge');

      // スタック数を5に増加
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);
      expect(badge.className).toContain('stack-increase');

      // 400ms後にクラスが削除される
      await new Promise((resolve) => setTimeout(resolve, 450));

      expect(badge.className).not.toContain('stack-increase');
    });

    it('Test Case 2-6-6: スタック数99+表示時の動作', () => {
      // 初期: スタック数100（表示は"99+"）
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 100 }} />);
      const badge = screen.getByTestId('stack-badge');
      expect(badge.textContent).toBe('99+');

      // スタック数をさらに150に増加（表示は"99+"のまま）
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 150 }} />);

      // 内部的にスタック数が変化しているのでアニメーションは発動する
      expect(badge.className).toContain('stack-increase');
      expect(badge.textContent).toBe('99+');
    });

    it('Test Case 2-6-7: 99から100への変化（境界値）', () => {
      // 初期: スタック数99（表示は"99"）
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 99 }} />);
      const badge = screen.getByTestId('stack-badge');
      expect(badge.textContent).toBe('99');

      // スタック数を100に増加（表示は"99+"）
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 100 }} />);

      // アニメーションが発動し、表示も変化
      expect(badge.className).toContain('stack-increase');
      expect(badge.textContent).toBe('99+');
    });

    it('Test Case 2-6-8: 連続したスタック数変更', () => {
      // 初期: スタック数3
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 3 }} />);
      const badge = screen.getByTestId('stack-badge');

      // 増加: 3 → 5
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);
      expect(badge.className).toContain('stack-increase');

      // すぐに減少: 5 → 2
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: 2 }} />);

      // 最新のアニメーションが適用される
      expect(badge.className).toContain('stack-decrease');
      expect(badge.className).not.toContain('stack-increase');
    });

    it('Test Case 2-6-9: スタックがnullから数値に変化', () => {
      // 初期: スタックnull（バッジなし）
      const { rerender } = render(<StateIcon state={{ ...buffState, stacks: null }} />);
      expect(screen.queryByTestId('stack-badge')).toBeNull();

      // スタック数を3に設定（バッジ表示）
      rerender(<StateIcon state={{ ...buffState, stacks: 3 }} />);

      const badge = screen.getByTestId('stack-badge');
      expect(badge.textContent).toBe('3');

      // 初回表示なのでアニメーションは発動しない
      expect(badge.className).not.toContain('stack-increase');
    });

    it('Test Case 2-6-10: スタックが数値からnullに変化', () => {
      // 初期: スタック数5
      const { rerender } = render(<StateIcon state={{ ...debuffStackedState, stacks: 5 }} />);
      expect(screen.getByTestId('stack-badge')).toBeInTheDocument();

      // スタックをnullに変更（バッジ削除）
      rerender(<StateIcon state={{ ...debuffStackedState, stacks: null }} />);

      // バッジが削除される
      expect(screen.queryByTestId('stack-badge')).toBeNull();
    });
  });
});
