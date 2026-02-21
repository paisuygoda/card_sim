import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PhaseDisplay } from '../PhaseDisplay';
import { GamePhase } from '@core/domain/models';

/**
 * PhaseDisplay コンポーネント テスト
 *
 * TDD 赤フェーズ：以下の機能が未実装のため、大半のテストが失敗することを期待する
 *  - maxRound props の追加（「ラウンド x/y」形式表示）
 *  - currentNationName props の追加（手番国家名を番号でなく名前で表示）
 *  - フェーズ遷移時のアニメーション用CSSクラス付与（useState + useEffect + setTimeout）
 *
 * NOTE: 新規 props (maxRound, currentNationName) は PhaseDisplayProps に未定義のため
 *       `as any` キャストでコンパイルエラーを回避してテストを実行する。
 */

// -----------------------------------------------------------------------
// ヘルパー：新インターフェースを先取りしたレンダリングラッパー
// -----------------------------------------------------------------------

type PhaseDisplayTestProps = {
  currentPhase: GamePhase;
  currentRound: number;
  currentTurnPlayer: number;
  maxRound?: number;
  currentNationName?: string;
};

/**
 * 将来の props インターフェースを先取りしてレンダリングする。
 * TDD赤フェーズ中は `as any` キャストで未定義 props のTS型エラーを回避する。
 */
const renderPhaseDisplay = (props: PhaseDisplayTestProps) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<PhaseDisplay {...(props as any)} />);

// -----------------------------------------------------------------------
// テストスイート
// -----------------------------------------------------------------------

describe('PhaseDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --------------------------------------------------------------------
  // 1. ラウンド表示（x/y 形式）
  // --------------------------------------------------------------------
  describe('ラウンド表示', () => {
    it('1. round=2, maxRound=5 のとき「2/5」または「2 / 5」形式で両方の数値が表示される', () => {
      const { container } = renderPhaseDisplay({
        currentPhase: GamePhase.DOMESTIC,
        currentRound: 2,
        currentTurnPlayer: 0,
        maxRound: 5,
      });

      // ラウンド表示部分に「2」と「5」が「/」で繋がれた形式で表示されること
      // 例: "ラウンド: 2/5", "2 / 5", "ラウンド 2/5" など
      expect(container.textContent).toMatch(/2\s*\/\s*5/);
    });

    it('2. maxRound が渡されない場合でもクラッシュしない', () => {
      expect(() =>
        renderPhaseDisplay({
          currentPhase: GamePhase.DOMESTIC,
          currentRound: 1,
          currentTurnPlayer: 0,
          // maxRound を省略
        })
      ).not.toThrow();
    });
  });

  // --------------------------------------------------------------------
  // 2. 手番国家名表示
  // --------------------------------------------------------------------
  describe('手番国家名表示', () => {
    it('3. currentNationName="帝国" のとき「帝国」が表示される', () => {
      renderPhaseDisplay({
        currentPhase: GamePhase.DOMESTIC,
        currentRound: 1,
        currentTurnPlayer: 0,
        currentNationName: '帝国',
      });

      // 手番表示エリアに国家名「帝国」が表示されること
      expect(screen.getByText(/帝国/)).toBeInTheDocument();
    });

    it('4. currentNationName が渡されない場合でもクラッシュしない', () => {
      expect(() =>
        renderPhaseDisplay({
          currentPhase: GamePhase.DOMESTIC,
          currentRound: 1,
          currentTurnPlayer: 0,
          // currentNationName を省略
        })
      ).not.toThrow();
    });
  });

  // --------------------------------------------------------------------
  // 3. フェーズ名の日本語表示
  // --------------------------------------------------------------------
  describe('フェーズ名の日本語表示', () => {
    it('5a. DOMESTIC フェーズのとき「内政フェーズ」が表示される', () => {
      renderPhaseDisplay({
        currentPhase: GamePhase.DOMESTIC,
        currentRound: 1,
        currentTurnPlayer: 0,
      });

      expect(screen.getByText(/内政フェーズ/)).toBeInTheDocument();
    });

    it('5b. BATTLE_START フェーズのとき「戦闘開始」が表示される', () => {
      renderPhaseDisplay({
        currentPhase: GamePhase.BATTLE_START,
        currentRound: 1,
        currentTurnPlayer: 0,
      });

      expect(screen.getByText(/戦闘開始/)).toBeInTheDocument();
    });

    it('5c. ROUND_END フェーズのとき「ラウンド終了」が表示される', () => {
      renderPhaseDisplay({
        currentPhase: GamePhase.ROUND_END,
        currentRound: 1,
        currentTurnPlayer: 0,
      });

      expect(screen.getByText(/ラウンド終了/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 4. フェーズ遷移アニメーション
  // --------------------------------------------------------------------
  describe('フェーズ遷移アニメーション', () => {
    it('6. フェーズが変化したとき、アニメーション用CSSクラスが一時的に付与される', () => {
      const { container, rerender } = renderPhaseDisplay({
        currentPhase: GamePhase.DOMESTIC,
        currentRound: 1,
        currentTurnPlayer: 0,
      });

      // フェーズを DOMESTIC → BATTLE_START に変更
      act(() => {
        rerender(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <PhaseDisplay
            {...({
              currentPhase: GamePhase.BATTLE_START,
              currentRound: 1,
              currentTurnPlayer: 0,
            } as any)}
          />
        );
      });

      // フェーズ変化直後：アニメーション用CSSクラスが付与されていること
      const phaseDisplay = container.querySelector('.phase-display');
      const hasAnimationClass =
        phaseDisplay?.classList.contains('phase-changing') ||
        phaseDisplay?.classList.contains('phase-transition');
      expect(hasAnimationClass).toBe(true);
    });

    it('7. アニメーション終了後（タイマー経過後）、アニメーション用CSSクラスが除去される', () => {
      const { container, rerender } = renderPhaseDisplay({
        currentPhase: GamePhase.DOMESTIC,
        currentRound: 1,
        currentTurnPlayer: 0,
      });

      // フェーズを変更してアニメーション開始
      act(() => {
        rerender(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <PhaseDisplay
            {...({
              currentPhase: GamePhase.BATTLE_START,
              currentRound: 1,
              currentTurnPlayer: 0,
            } as any)}
          />
        );
      });

      // アニメーション開始直後：クラスが付与されていることを確認（前提条件）
      const phaseDisplayBefore = container.querySelector('.phase-display');
      const hasClass =
        phaseDisplayBefore?.classList.contains('phase-changing') ||
        phaseDisplayBefore?.classList.contains('phase-transition');
      expect(hasClass).toBe(true);

      // タイマーをすべて進めてアニメーション終了
      act(() => {
        vi.runAllTimers();
      });

      // アニメーション終了後：CSSクラスが除去されていること
      const phaseDisplay = container.querySelector('.phase-display');
      const hasAnimationClass =
        phaseDisplay?.classList.contains('phase-changing') ||
        phaseDisplay?.classList.contains('phase-transition');
      expect(hasAnimationClass).toBe(false);
    });
  });
});
