import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateIconList } from '../StateIconList';
import type { State } from '@core/domain/models';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { useUIStateStore } from '@store/useUIStateStore';
import {
  createBuffState,
  createDebuffState,
  createDeadState,
  createProsperityState,
  createDefenseBuffState,
  createMockState,
} from '@ui/__tests__/fixtures';

/**
 * StateIconList コンポーネント テスト
 *
 * TDD 赤フェーズ：以下の機能が未実装のため、全テストが失敗することを期待する
 *  - StateIconListコンポーネントの実装
 *  - ステート配列の横並び表示
 *  - 最大表示数の制御（maxDisplay）
 *  - 超過分の"+N"表示
 *  - ホバー時のStateTooltip表示
 *  - onStateHoverコールバック
 *  - スクロール対応
 *  - アクセシビリティ対応（role="list", role="listitem"）
 */

// ========================================================================
// テストデータ（共有フィクスチャ使用）
// ========================================================================

const buffState = createBuffState();
const debuffState = createDebuffState();
const neutralState = createDeadState();
const permanentStackedState = createProsperityState();
const buffDefenseState = createDefenseBuffState({ stacks: 2, duration: 2 });

/** 大量のステート生成ヘルパー */
function generateStates(count: number): State[] {
  return Array.from({ length: count }, (_, i) =>
    createMockState({
      stateId: `state${i}`,
      name: `ステート${i}`,
      stacks: i % 3 === 0 ? i : null,
      duration: i % 2 === 0 ? i : null,
    })
  );
}

// ========================================================================
// テストスイート
// ========================================================================

describe('StateIconList', () => {
  // ----------------------------------------------------------------------
  // カテゴリ1: 基本レンダリング
  // ----------------------------------------------------------------------
  describe('カテゴリ1: 基本レンダリング', () => {
    it('TC 1-1: 空配列の場合、何も表示されない', () => {
      render(<StateIconList states={[]} />);

      // role="list" が存在しない
      const list = screen.queryByRole('list');
      expect(list).toBeNull();
    });

    it('TC 1-2: 単一ステートの表示', () => {
      render(<StateIconList states={[buffState]} />);

      // role="list" のコンテナが存在
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      // listitem が1つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(1);

      // StateIconのアイコン絵文字が表示される
      expect(screen.getByText('⚔️')).toBeInTheDocument();
    });

    it('TC 1-3: 複数ステートの表示', () => {
      render(<StateIconList states={[buffState, debuffState, neutralState]} />);

      // listitem が3つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      // 各アイコン絵文字が表示される
      expect(screen.getByText('⚔️')).toBeInTheDocument(); // attackPowerUp
      expect(screen.getByText('🗡️')).toBeInTheDocument(); // attackPowerDown
      expect(screen.getByText('💀')).toBeInTheDocument(); // dead
    });
  });

  // ----------------------------------------------------------------------
  // カテゴリ2: 最大表示数制御
  // ----------------------------------------------------------------------
  describe('カテゴリ2: 最大表示数制御', () => {
    const fiveStates = [
      buffState,
      debuffState,
      neutralState,
      permanentStackedState,
      buffDefenseState,
    ];

    it('TC 2-1: maxDisplay未指定時は全件表示', () => {
      render(<StateIconList states={fiveStates} />);

      // listitem が5つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(5);

      // 超過表示なし
      const overflow = screen.queryByText(/^\+\d+$/);
      expect(overflow).toBeNull();
    });

    it('TC 2-2: maxDisplay指定時の表示制限', () => {
      render(<StateIconList states={fiveStates} maxDisplay={3} />);

      // listitem が3つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      // "+2" の超過表示が存在
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('TC 2-3: ステート数 = maxDisplay', () => {
      const threeStates = [buffState, debuffState, neutralState];
      render(<StateIconList states={threeStates} maxDisplay={3} />);

      // listitem が3つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      // 超過表示なし
      const overflow = screen.queryByText(/^\+\d+$/);
      expect(overflow).toBeNull();
    });

    it('TC 2-4: ステート数 < maxDisplay', () => {
      const twoStates = [buffState, debuffState];
      render(<StateIconList states={twoStates} maxDisplay={5} />);

      // listitem が2つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);

      // 超過表示なし
      const overflow = screen.queryByText(/^\+\d+$/);
      expect(overflow).toBeNull();
    });

    it('TC 2-5: maxDisplay = 0の処理', () => {
      const threeStates = [buffState, debuffState, neutralState];
      render(<StateIconList states={threeStates} maxDisplay={0} />);

      // listitem が0
      const items = screen.queryAllByRole('listitem');
      expect(items).toHaveLength(0);

      // "+3" のみ表示
      expect(screen.getByText('+3')).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------------
  // カテゴリ3: ツールチップ表示
  // ----------------------------------------------------------------------
  describe('カテゴリ3: ツールチップ表示', () => {
    it('TC 3-1: ホバー時にStateTooltipが表示される', async () => {
      const user = userEvent.setup();
      render(<StateIconList states={[buffState]} />);

      // 最初のStateIconにホバー
      const icon = screen.getByRole('img');
      await user.hover(icon);

      // StateTooltipが表示される（role="tooltip"）
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();

      // ステート名が含まれる
      expect(tooltip).toHaveTextContent('攻撃力上昇');
    });

    it('TC 3-2: ホバー解除時にツールチップが非表示', async () => {
      const user = userEvent.setup();
      render(<StateIconList states={[buffState]} />);

      const icon = screen.getByRole('img');

      // ホバー
      await user.hover(icon);
      expect(await screen.findByRole('tooltip')).toBeInTheDocument();

      // アンホバー
      await user.unhover(icon);

      // ツールチップが消える
      const tooltip = screen.queryByRole('tooltip');
      expect(tooltip).toBeNull();
    });

    it('TC 3-3: ホバー対象切り替え時のツールチップ更新', async () => {
      const user = userEvent.setup();
      render(<StateIconList states={[buffState, debuffState]} />);

      const icons = screen.getAllByRole('img');

      // 1つ目にホバー
      await user.hover(icons[0]);
      let tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('攻撃力上昇');

      // 2つ目にホバー
      await user.hover(icons[1]);
      tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('攻撃力低下');
    });
  });

  // ----------------------------------------------------------------------
  // カテゴリ4: コールバック動作
  // ----------------------------------------------------------------------
  describe('カテゴリ4: コールバック動作', () => {
    it('TC 4-1: onStateHoverが呼ばれる（ホバー時）', async () => {
      const user = userEvent.setup();
      const mockOnStateHover = vi.fn();

      render(<StateIconList states={[buffState]} onStateHover={mockOnStateHover} />);

      const icon = screen.getByRole('img');
      await user.hover(icon);

      // onStateHover(buffState) が呼ばれる
      expect(mockOnStateHover).toHaveBeenCalledWith(buffState);
    });

    it('TC 4-2: onStateHoverが呼ばれる（アンホバー時）', async () => {
      const user = userEvent.setup();
      const mockOnStateHover = vi.fn();

      render(<StateIconList states={[buffState]} onStateHover={mockOnStateHover} />);

      const icon = screen.getByRole('img');
      await user.hover(icon);
      await user.unhover(icon);

      // onStateHover(null) が呼ばれる
      expect(mockOnStateHover).toHaveBeenCalledWith(null);
    });

    it('TC 4-3: onStateHover未指定時もエラーが出ない', async () => {
      const user = userEvent.setup();

      // エラーが発生しないことを確認
      expect(() => {
        render(<StateIconList states={[buffState]} />);
      }).not.toThrow();

      const icon = screen.getByRole('img');

      // ホバー操作もエラーなく動作
      await expect(user.hover(icon)).resolves.not.toThrow();
      await expect(user.unhover(icon)).resolves.not.toThrow();
    });
  });

  // ----------------------------------------------------------------------
  // カテゴリ5: エッジケースと特殊状況
  // ----------------------------------------------------------------------
  describe('カテゴリ5: エッジケースと特殊状況', () => {
    it('TC 5-1: 多数のステート（15個）の処理', () => {
      const manyStates = generateStates(15);
      const { container } = render(<StateIconList states={manyStates} />);

      // listitem が15個
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(15);

      // コンテナにstate-icon-listクラスが設定されている（overflow-x: auto が CSS で定義されている）
      const list = container.querySelector('[role="list"]');
      expect(list).not.toBeNull();
      expect(list).toHaveClass('state-icon-list');
    });

    it('TC 5-2: 永続ステートと期限ステートの混在', () => {
      render(
        <StateIconList states={[permanentStackedState, buffState, debuffState]} />
      );

      // 各ステートのアイコンが表示される
      expect(screen.getByText('🌟')).toBeInTheDocument(); // prosperity
      expect(screen.getByText('⚔️')).toBeInTheDocument(); // attackPowerUp
      expect(screen.getByText('🗡️')).toBeInTheDocument(); // attackPowerDown

      // 永続マーカー（∞）が表示される
      const permanentMarkers = screen.getAllByText('∞');
      expect(permanentMarkers.length).toBeGreaterThan(0);
    });

    it('TC 5-3: スタック数が異なるステートの混在', () => {
      render(
        <StateIconList
          states={[debuffState, buffState, buffDefenseState]}
        />
      );

      // スタックありのステートのバッジが表示される
      expect(screen.getByText('5')).toBeInTheDocument(); // debuffState
      expect(screen.getByText('2')).toBeInTheDocument(); // buffDefenseState

      // スタックなしのステートはバッジなし
      const badges = screen.getAllByTestId('stack-badge');
      expect(badges).toHaveLength(2); // debuffStateとbuffDefenseStateのみ
    });
  });

  // ----------------------------------------------------------------------
  // カテゴリ6: アクセシビリティ
  // ----------------------------------------------------------------------
  describe('カテゴリ6: アクセシビリティ', () => {
    it('TC 6-1: role属性が適切に設定されている', () => {
      render(<StateIconList states={[buffState, debuffState]} />);

      // コンテナにrole="list"
      expect(screen.getByRole('list')).toBeInTheDocument();

      // 各アイテムにrole="listitem"
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('TC 6-2: 超過表示にaria-labelが設定されている', () => {
      const fiveStates = [
        buffState,
        debuffState,
        neutralState,
        permanentStackedState,
        buffDefenseState,
      ];

      render(<StateIconList states={fiveStates} maxDisplay={3} />);

      // "+2"要素を取得
      const overflow = screen.getByText('+2');
      expect(overflow).toBeInTheDocument();

      // aria-labelに適切な説明がある
      const ariaLabel = overflow.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/残り.*2/);
    });

    it('TC 6-3: キーボードナビゲーション（tab移動）', async () => {
      const user = userEvent.setup();
      render(<StateIconList states={[buffState, debuffState]} />);

      const icons = screen.getAllByRole('img');

      // 最初のアイコンにフォーカス
      await user.tab();
      expect(icons[0]).toHaveFocus();

      // 次のアイコンにフォーカス
      await user.tab();
      expect(icons[1]).toHaveFocus();
    });
  });

  // ----------------------------------------------------------------------
  // カテゴリ7: ステート削除演出（フェードアウト）
  // ----------------------------------------------------------------------
  describe('カテゴリ7: ステート削除演出（フェードアウト）', () => {
    beforeEach(() => {
      useUIStateStore.setState({ currentAnimation: null });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('TC 7-1: STATE_REMOVEイベント検知時にremovingクラスが適用される', async () => {
      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'attackPowerUp' },
          isPlaying: true,
        },
      });

      const { container } = render(<StateIconList states={[buffState]} />);

      // StateIconにremovingクラスが適用されている
      const stateIcon = container.querySelector('[data-testid="state-icon"]');
      expect(stateIcon).toHaveClass('removing');
    });

    it('TC 7-2: 800ms後にremovingクラスが削除される', async () => {
      vi.useFakeTimers();

      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'attackPowerUp' },
          isPlaying: true,
        },
      });

      const { container } = render(<StateIconList states={[buffState]} />);

      // 最初はremovingクラスが適用されている
      let stateIcon = container.querySelector('[data-testid="state-icon"]');
      expect(stateIcon).toHaveClass('removing');

      // 800ms経過
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // removingクラスが削除されている
      stateIcon = container.querySelector('[data-testid="state-icon"]');
      expect(stateIcon).not.toHaveClass('removing');
    });

    it('TC 7-3: 複数ステート同時削除時も正しく動作する', async () => {
      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'attackPowerUp' },
          isPlaying: true,
        },
      });

      const { container, rerender } = render(
        <StateIconList states={[buffState, debuffState, neutralState]} />
      );

      // 最初のステートにremovingクラスが適用されている
      let stateIcons = container.querySelectorAll('[data-testid="state-icon"]');
      expect(stateIcons[0]).toHaveClass('removing');
      expect(stateIcons[1]).not.toHaveClass('removing');
      expect(stateIcons[2]).not.toHaveClass('removing');

      // 2つ目のステートの削除イベント発火（setStateでcurrentAnimationを更新）
      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'attackPowerDown' },
          isPlaying: true,
        },
      });

      rerender(<StateIconList states={[buffState, debuffState, neutralState]} />);

      // 2つのステートにremovingクラスが適用されている
      stateIcons = container.querySelectorAll('[data-testid="state-icon"]');
      expect(stateIcons[0]).toHaveClass('removing');
      expect(stateIcons[1]).toHaveClass('removing');
      expect(stateIcons[2]).not.toHaveClass('removing');
    });

    it('TC 7-4: 削除対象でないステートは影響を受けない', async () => {
      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'attackPowerUp' },
          isPlaying: true,
        },
      });

      const { container } = render(
        <StateIconList states={[buffState, debuffState]} />
      );

      const stateIcons = container.querySelectorAll('[data-testid="state-icon"]');
      
      // buffStateにはremovingクラスが適用されている
      expect(stateIcons[0]).toHaveClass('removing');
      
      // debuffStateには適用されていない
      expect(stateIcons[1]).not.toHaveClass('removing');
    });

    it('TC 7-5: 存在しないステートIDの削除イベントを無視', async () => {
      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'unknownState' }, // 存在しないステートID
          isPlaying: true,
        },
      });

      // エラーが発生しないことを確認
      expect(() => {
        render(<StateIconList states={[buffState]} />);
      }).not.toThrow();

      const { container } = render(<StateIconList states={[buffState]} />);
      const stateIcon = container.querySelector('[data-testid="state-icon"]');
      
      // buffStateにはremovingクラスが適用されていない
      expect(stateIcon).not.toHaveClass('removing');
    });

    it('TC 7-6: アニメーション中に同じステートの削除イベントが再発火してもエラーなし', async () => {
      vi.useFakeTimers();

      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'attackPowerUp' },
          isPlaying: true,
        },
      });

      const { container, rerender } = render(<StateIconList states={[buffState]} />);

      // 最初のremovingクラス適用
      let stateIcon = container.querySelector('[data-testid="state-icon"]');
      expect(stateIcon).toHaveClass('removing');

      // 400ms経過
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // 同じステートの削除イベントを再発火（setStateで更新）
      useUIStateStore.setState({
        currentAnimation: {
          eventType: GameEvent.STATE_REMOVE,
          data: { stateId: 'attackPowerUp' },
          isPlaying: true,
        },
      });
      
      // エラーが発生しないことを確認
      expect(() => {
        rerender(<StateIconList states={[buffState]} />);
      }).not.toThrow();

      // 800ms経過（合計1200ms）
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // removingクラスは削除されている
      stateIcon = container.querySelector('[data-testid="state-icon"]');
      expect(stateIcon).not.toHaveClass('removing');
    });
  });
});
