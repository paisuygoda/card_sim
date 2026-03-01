import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateTooltip } from '../StateTooltip';
import {
  createBuffState,
  createDebuffState,
  createProsperityState,
  createMockState,
} from '@ui/__tests__/fixtures';

/**
 * StateTooltip コンポーネント テスト
 *
 * TDD 赤フェーズ：以下の機能が未実装のため、全テストが失敗することを期待する
 *  - StateTooltipコンポーネントの実装
 *  - ステート名の表示
 *  - 効果説明の表示（StateMaster.getStateDescriptionを使用）
 *  - スタック数情報の表示
 *  - 残りターン数の表示
 *  - 永続ステートの特別表示
 *  - 画面外にはみ出さない位置調整ロジック
 *  - アクセシビリティ対応（role="tooltip", aria-live="polite"）
 */

// ========================================================================
// テストデータ（共有フィクスチャ使用）
// ========================================================================

const buffState = createBuffState();
const debuffStackedState = createDebuffState();
const permanentState = createProsperityState({ stacks: null });
const permanentStackedState = createProsperityState();
const expiringState = createBuffState({ duration: 0 });
const unknownState = createMockState({ stateId: 'unknownState', name: '不明', duration: 1 });
const singleStackState = createBuffState({ stacks: 1 });

// ========================================================================
// テストユーティリティ
// ========================================================================

/**
 * ツールチップの表示位置を取得
 */
function getTooltipPosition(tooltip: HTMLElement) {
  const style = window.getComputedStyle(tooltip);
  return {
    top: parseFloat(style.top),
    left: parseFloat(style.left),
  };
}

/**
 * ツールチップが画面内に収まっているか確認
 */
function isTooltipInViewport(tooltip: HTMLElement): boolean {
  const rect = tooltip.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

// ========================================================================
// テスト本体
// ========================================================================

describe('StateTooltip', () => {
  // ========================================================================
  // 2.1 基本レンダリング
  // ========================================================================
  describe('基本レンダリング', () => {
    it('Test Case 2-1-1: stateがnullの場合、ツールチップが表示されない', () => {
      render(<StateTooltip state={null} position={{ x: 100, y: 100 }} />);

      // ツールチップ要素が存在しない
      const tooltip = screen.queryByRole('tooltip');
      expect(tooltip).toBeNull();
    });

    it('Test Case 2-1-2: stateが存在する場合、ツールチップが表示される', () => {
      render(<StateTooltip state={buffState} position={{ x: 100, y: 100 }} />);

      // ツールチップ要素が表示される
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });

    it('Test Case 2-1-3: ツールチップにARIA属性が設定される', () => {
      render(<StateTooltip state={buffState} position={{ x: 100, y: 100 }} />);

      const tooltip = screen.getByRole('tooltip');
      // aria-live="polite" が設定されている
      expect(tooltip).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ========================================================================
  // 2.2 表示内容 - ステート名
  // ========================================================================
  describe('表示内容 - ステート名', () => {
    it('Test Case 2-2-1: ステート名が太字で表示される', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 100, y: 100 }} />
      );

      // ステート名が表示される
      expect(screen.getByText('攻撃力上昇')).toBeInTheDocument();

      // タイトル要素に .state-tooltip-title クラスが適用されている
      const title = container.querySelector('.state-tooltip-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('攻撃力上昇');
    });
  });

  // ========================================================================
  // 2.3 表示内容 - 効果説明
  // ========================================================================
  describe('表示内容 - 効果説明', () => {
    it('Test Case 2-3-1: 効果説明が正しく表示される', () => {
      render(<StateTooltip state={buffState} position={{ x: 100, y: 100 }} />);

      // StateMaster.getStateDescription から取得した説明が表示される
      // attackPowerUp の description: '攻撃力が20%上昇する'
      expect(screen.getByText(/攻撃力が20%上昇する/)).toBeInTheDocument();
    });

    it('Test Case 2-3-2: 未定義ステートの場合「不明なステート」と表示される', () => {
      render(<StateTooltip state={unknownState} position={{ x: 100, y: 100 }} />);

      // 未定義ステートのフォールバック
      expect(screen.getByText(/不明なステート/)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 2.4 表示内容 - スタック数情報
  // ========================================================================
  describe('表示内容 - スタック数情報', () => {
    it('Test Case 2-4-1: スタック数がnullの場合「なし」と表示される', () => {
      render(<StateTooltip state={buffState} position={{ x: 100, y: 100 }} />);

      // buffState.stacks === null
      expect(screen.getByText(/スタック:\s*なし/)).toBeInTheDocument();
    });

    it('Test Case 2-4-2: スタック数が1の場合、数値が表示される', () => {
      render(<StateTooltip state={singleStackState} position={{ x: 100, y: 100 }} />);

      // singleStackState.stacks === 1
      expect(screen.getByText(/スタック:\s*1/)).toBeInTheDocument();
    });

    it('Test Case 2-4-3: スタック数が複数の場合、正しく表示される', () => {
      render(<StateTooltip state={debuffStackedState} position={{ x: 100, y: 100 }} />);

      // debuffStackedState.stacks === 5
      expect(screen.getByText(/スタック:\s*5/)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 2.5 表示内容 - 残りターン数
  // ========================================================================
  describe('表示内容 - 残りターン数', () => {
    it('Test Case 2-5-1: durationが正数の場合、ターン数が表示される', () => {
      render(<StateTooltip state={buffState} position={{ x: 100, y: 100 }} />);

      // buffState.duration === 3
      expect(screen.getByText(/残りターン:\s*3/)).toBeInTheDocument();
    });

    it('Test Case 2-5-2: durationがnullの場合「永続」と表示される', () => {
      render(<StateTooltip state={permanentState} position={{ x: 100, y: 100 }} />);

      // permanentState.duration === null
      expect(screen.getByText(/残りターン:\s*永続/)).toBeInTheDocument();
    });

    it('Test Case 2-5-3: durationが0の場合「0」と表示される（境界値）', () => {
      render(<StateTooltip state={expiringState} position={{ x: 100, y: 100 }} />);

      // expiringState.duration === 0
      expect(screen.getByText(/残りターン:\s*0/)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 2.6 位置調整ロジック
  // ========================================================================
  describe('位置調整ロジック', () => {
    beforeEach(() => {
      // 画面サイズを固定（テストの安定性のため）
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    it('Test Case 2-6-1: 通常時、アイコンの上部中央に表示される', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 200, y: 300 }} />
      );

      const tooltip = container.querySelector('.state-tooltip') as HTMLElement;
      expect(tooltip).toBeInTheDocument();

      // ツールチップが position.y より上に表示される
      const { top } = getTooltipPosition(tooltip);
      expect(top).toBeLessThan(300);
    });

    it('Test Case 2-6-2: 画面上端に近い場合、アイコンの下部に表示される', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 200, y: 50 }} />
      );

      const tooltip = container.querySelector('.state-tooltip') as HTMLElement;
      expect(tooltip).toBeInTheDocument();

      // ツールチップが position.y より下に表示される
      // （画面上端に近いため、下部に調整される）
      const { top } = getTooltipPosition(tooltip);
      expect(top).toBeGreaterThanOrEqual(50);
    });

    it('Test Case 2-6-3: 画面左端に近い場合、左にはみ出さない', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 30, y: 300 }} />
      );

      const tooltip = container.querySelector('.state-tooltip') as HTMLElement;
      expect(tooltip).toBeInTheDocument();

      const { left } = getTooltipPosition(tooltip);
      // 左端の最小値が0以上になる
      expect(left).toBeGreaterThanOrEqual(0);
    });

    it('Test Case 2-6-4: 画面右端に近い場合、右にはみ出さない', () => {
      const { container } = render(
        <StateTooltip 
          state={buffState} 
          position={{ x: window.innerWidth - 30, y: 300 }} 
        />
      );

      const tooltip = container.querySelector('.state-tooltip') as HTMLElement;
      expect(tooltip).toBeInTheDocument();

      // ツールチップが画面内に収まっている
      expect(isTooltipInViewport(tooltip)).toBe(true);
    });
  });

  // ========================================================================
  // 2.7 複合ケース
  // ========================================================================
  describe('複合ケース', () => {
    it('Test Case 2-7-1: スタックあり＋永続ステート', () => {
      render(
        <StateTooltip 
          state={permanentStackedState} 
          position={{ x: 200, y: 300 }} 
        />
      );

      // ステート名が表示される
      expect(screen.getByText('繁栄')).toBeInTheDocument();

      // 効果説明が表示される
      expect(screen.getByText(/ターン開始時に国力が50増加する/)).toBeInTheDocument();

      // スタック数が表示される
      expect(screen.getByText(/スタック:\s*3/)).toBeInTheDocument();

      // 永続が表示される
      expect(screen.getByText(/残りターン:\s*永続/)).toBeInTheDocument();
    });

    it('Test Case 2-7-2: 画面隅（左上）での位置調整', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 30, y: 50 }} />
      );

      const tooltip = container.querySelector('.state-tooltip') as HTMLElement;
      expect(tooltip).toBeInTheDocument();

      // ツールチップが画面内に収まっている
      expect(isTooltipInViewport(tooltip)).toBe(true);

      const { top, left } = getTooltipPosition(tooltip);
      // 左端と上端の両方の制約が適用される
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // 2.8 スタイリング
  // ========================================================================
  describe('スタイリング', () => {
    it('Test Case 2-8-1: 正しいCSSクラスが適用される', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 100, y: 100 }} />
      );

      // ツールチップに .state-tooltip クラスが適用される
      const tooltip = container.querySelector('.state-tooltip');
      expect(tooltip).toBeInTheDocument();

      // タイトルに .state-tooltip-title クラスが適用される
      const title = container.querySelector('.state-tooltip-title');
      expect(title).toBeInTheDocument();

      // メタ情報に .state-tooltip-meta クラスが適用される
      const meta = container.querySelector('.state-tooltip-meta');
      expect(meta).toBeInTheDocument();
    });

    it('Test Case 2-8-2: pointer-events: none が設定される', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 100, y: 100 }} />
      );

      const tooltip = container.querySelector('.state-tooltip') as HTMLElement;
      expect(tooltip).toBeInTheDocument();

      // pointer-events: none が設定されている
      const style = window.getComputedStyle(tooltip);
      expect(style.pointerEvents).toBe('none');
    });

    it('Test Case 2-8-3: z-indexが高く設定される', () => {
      const { container } = render(
        <StateTooltip state={buffState} position={{ x: 100, y: 100 }} />
      );

      const tooltip = container.querySelector('.state-tooltip') as HTMLElement;
      expect(tooltip).toBeInTheDocument();

      // z-index: 1000 が設定されている
      const style = window.getComputedStyle(tooltip);
      expect(parseInt(style.zIndex)).toBeGreaterThanOrEqual(1000);
    });
  });
});
