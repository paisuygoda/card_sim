import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NationPanel } from '../NationPanel';
import type { Nation } from '@core/domain/models';
import {
  createMockNation,
  createBuffState,
  createDebuffState,
  createDeadState,
  createDefenseBuffState,
  createProsperityState,
} from '@ui/__tests__/fixtures';

// -----------------------------------------------------------------------
// テストデータ（共有フィクスチャ使用）
// -----------------------------------------------------------------------

/** テスト用の勝利閾値 */
const TEST_POWER_WIN_THRESHOLD = 1000;

// ステートデータ
const buffState = createBuffState();
const debuffState = createDebuffState();
const neutralState = createDeadState();
const buffDefenseState = createDefenseBuffState({ stacks: 2, duration: 2 });
const permanentStackedState = createProsperityState();

// 国家データ
const mockPlayerNation = createMockNation({
  nationId: 'player',
  name: 'テスト王国',
  power: 300,
  remainingActions: 2,
});

const mockNPCNation = createMockNation({
  nationId: 'npc1',
  name: 'CPU帝国',
  isNPC: true,
  power: 300,
  remainingActions: 2,
});

// -----------------------------------------------------------------------
// テストスイート
// -----------------------------------------------------------------------

describe('NationPanel', () => {
  // --------------------------------------------------------------------
  // 1. 国力ゲージ - HTML構造
  // --------------------------------------------------------------------
  describe('国力ゲージ - HTML構造', () => {
    it('国力ゲージコンテナが正しくレンダリングされる（threshold有効時）', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gaugeContainer = container.querySelector<HTMLElement>('.power-gauge');
      expect(gaugeContainer).not.toBeNull();
    });

    it('国力ゲージのフィルが正しくレンダリングされる（data-testid含む）', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gaugeFill = container.querySelector<HTMLElement>('.power-gauge-fill');
      expect(gaugeFill).not.toBeNull();
      // data-testid属性も設定されていること
      expect(gaugeFill?.getAttribute('data-testid')).toBe('power-gauge-fill');
    });
  });

  // --------------------------------------------------------------------
  // 2. 国力ゲージ - 幅の計算
  // --------------------------------------------------------------------
  describe('国力ゲージ - 幅の計算', () => {
    it('1. power=300, powerWinThreshold=1000 のとき power-gauge-fill の幅が 30%', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      // フォールスグリーン防止: まず要素の存在を明示的にアサート
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('30%');
    });

    it('2. power=1200, powerWinThreshold=1000 のとき幅が 100%（超過しない）', () => {
      const overPowerNation: Nation = { ...mockPlayerNation, power: 1200 };
      const { container } = render(
        <NationPanel nation={overPowerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('100%');
    });

    it('TC2-3: power=0, powerWinThreshold=1000 のとき幅が 0%（下限値）', () => {
      const zeroPowerNation: Nation = { ...mockPlayerNation, power: 0 };
      const { container } = render(
        <NationPanel nation={zeroPowerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('0%');
    });

    it('TC2-4: power=500, powerWinThreshold=1000 のとき幅が 50%（中間値）', () => {
      const halfPowerNation: Nation = { ...mockPlayerNation, power: 500 };
      const { container } = render(
        <NationPanel nation={halfPowerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('50%');
    });

    it('境界値: 負の国力（power=-100）のとき幅が0%に丸められる', () => {
      const negativePowerNation: Nation = { ...mockPlayerNation, power: -100 };
      const { container } = render(
        <NationPanel nation={negativePowerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      // 負の値は0%として扱われる
      expect(gauge!.style.width).toBe('0%');
    });
  });

  // --------------------------------------------------------------------
  // 3. powerWinThreshold=null のときゲージ非表示
  // --------------------------------------------------------------------
  describe('powerWinThreshold=null のときゲージ非表示', () => {
    it('3. powerWinThreshold=null のとき power-gauge-fill 要素が存在しない', () => {
      // 前提: threshold=1000 のときゲージが存在することを確認（偽グリーン検出）
      const { container: withThreshold } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      expect(withThreshold.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]')).not.toBeNull();

      // 本題: null のときゲージが消えること
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      expect(container.querySelector('[data-testid="power-gauge-fill"]')).toBeNull();
    });

    it('TC3-1: powerWinThreshold=null のとき .power-gauge 要素も存在しない', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      expect(container.querySelector('.power-gauge')).toBeNull();
    });
  });

  // --------------------------------------------------------------------
  // 4. CSSクラス適用確認
  // --------------------------------------------------------------------
  describe('CSSクラス適用確認', () => {
    it('TC4-1: .power-gauge のCSSクラスが正しく適用されている', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gaugeContainer = container.querySelector<HTMLElement>('.power-gauge');
      expect(gaugeContainer).not.toBeNull();
      expect(gaugeContainer!.className).toBe('power-gauge');
    });

    it('TC4-2: .power-gauge-fill のCSSクラスが正しく適用されている', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );
      const gaugeFill = container.querySelector<HTMLElement>('.power-gauge-fill');
      expect(gaugeFill).not.toBeNull();
      expect(gaugeFill!.className).toBe('power-gauge-fill');
    });
  });

  // --------------------------------------------------------------------
  // 5. 国力変動時のゲージ更新
  // --------------------------------------------------------------------
  describe('国力変動時のゲージ更新', () => {
    it('TC5-1: 国力増加時にゲージ幅が正しく更新される', () => {
      const initialNation: Nation = { ...mockPlayerNation, power: 300 };
      const { container, rerender } = render(
        <NationPanel nation={initialNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );

      // 初期状態: 30%
      let gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('30%');

      // 国力増加: 600 (60%)
      const updatedNation: Nation = { ...mockPlayerNation, power: 600 };
      rerender(
        <NationPanel nation={updatedNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );

      gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('60%');
    });

    it('TC5-2: 国力減少時にゲージ幅が正しく更新される', () => {
      const initialNation: Nation = { ...mockPlayerNation, power: 800 };
      const { container, rerender } = render(
        <NationPanel nation={initialNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );

      // 初期状態: 80%
      let gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('80%');

      // 国力減少: 200 (20%)
      const updatedNation: Nation = { ...mockPlayerNation, power: 200 };
      rerender(
        <NationPanel nation={updatedNation} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
      );

      gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect(gauge!.style.width).toBe('20%');
    });
  });

  // --------------------------------------------------------------------
  // 6. プレイヤー/CPU バッジ
  // --------------------------------------------------------------------
  describe('プレイヤー/CPU バッジ', () => {
    it('4. isNPC=false のとき「プレイヤー」バッジが表示される', () => {
      render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      expect(screen.getByText('プレイヤー')).toBeInTheDocument();
    });

    it('5. isNPC=true のとき「CPU」バッジが表示される', () => {
      render(
        <NationPanel nation={mockNPCNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      expect(screen.getByText('CPU')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 7. 手番ハイライト
  // --------------------------------------------------------------------
  describe('手番ハイライト', () => {
    it('6. isCurrentTurn=true のとき .nation-panel に current-turn クラスが付与される', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={true} powerWinThreshold={null} />
      );
      const panel = container.querySelector('.nation-panel');
      expect(panel).not.toBeNull();
      expect((panel as HTMLElement).classList.contains('current-turn')).toBe(true);
    });

    it('7. isCurrentTurn=false のとき .nation-panel に current-turn クラスが付与されない', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      const panel = container.querySelector('.nation-panel');
      expect(panel).not.toBeNull();
      expect((panel as HTMLElement).classList.contains('current-turn')).toBe(false);
    });
  });

  // --------------------------------------------------------------------
  // 8. 基本情報表示
  // --------------------------------------------------------------------
  describe('基本情報表示', () => {
    it('8. nation.name が表示される', () => {
      render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      expect(screen.getByText('テスト王国')).toBeInTheDocument();
    });

    it('9. nation.power の数値が表示される', () => {
      render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      // 「国力: 300」のような形式で表示されることを確認
      expect(screen.getByText(/国力.*300/)).toBeInTheDocument();
    });

    it('10. nation.remainingActions の数値が表示される', () => {
      render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      // 「残り内政: 2」のような形式で表示されることを確認
      expect(screen.getByText(/残り内政.*2/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 9. 国力ゲージの色ロジック (Task 2-3-2)
  // --------------------------------------------------------------------
  describe('国力ゲージの色ロジック', () => {
    /**
     * ヘルパー関数: rgb(r, g, b) 形式を #rrggbb 形式に変換
     * ブラウザDOMでは色が rgb() 形式で返されるため、比較用にHex変換する
     */
    function rgbToHex(rgb: string): string {
      const result = rgb.match(/\d+/g);
      if (!result || result.length < 3) return '';
      const [r, g, b] = result.map(Number);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * ヘルパー関数: ゲージ要素の背景色を取得してHex形式で返す
     */
    function getGaugeColor(container: HTMLElement): string {
      const gauge = container.querySelector('[data-testid="power-gauge-fill"]') as HTMLElement;
      expect(gauge).not.toBeNull(); // 偽グリーン防止
      const bgColor = gauge.style.backgroundColor;
      return rgbToHex(bgColor);
    }

    // ------------------------------------------------------------------
    // TC1: 進捗率90%以上で緑色（#4caf50）
    // ------------------------------------------------------------------
    describe('TC1: 進捗率90%以上で緑色', () => {
      it('TC1-1: 進捗率90%（境界値下限）で緑色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 900 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#4caf50');
      });

      it('TC1-2: 進捗率95%（中間値）で緑色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 950 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#4caf50');
      });

      it('TC1-3: 進捗率100%（上限値）で緑色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 1000 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#4caf50');
      });

      it('TC1-4: 進捗率100%超過で緑色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 1200 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#4caf50');
      });
    });

    // ------------------------------------------------------------------
    // TC2: 進捗率60%～89%で青色（#2196f3）
    // ------------------------------------------------------------------
    describe('TC2: 進捗率60%～89%で青色', () => {
      it('TC2-1: 進捗率60%（境界値下限）で青色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 600 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#2196f3');
      });

      it('TC2-2: 進捗率75%（中間値）で青色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 750 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#2196f3');
      });

      it('TC2-3: 進捗率89%（境界値上限）で青色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 890 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#2196f3');
      });
    });

    // ------------------------------------------------------------------
    // TC3: 進捗率30%～59%でオレンジ（#ff9800）
    // ------------------------------------------------------------------
    describe('TC3: 進捗率30%～59%でオレンジ', () => {
      it('TC3-1: 進捗率30%（境界値下限）でオレンジ', () => {
        const nation: Nation = { ...mockPlayerNation, power: 300 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#ff9800');
      });

      it('TC3-2: 進捗率45%（中間値）でオレンジ', () => {
        const nation: Nation = { ...mockPlayerNation, power: 450 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#ff9800');
      });

      it('TC3-3: 進捗率59%（境界値上限）でオレンジ', () => {
        const nation: Nation = { ...mockPlayerNation, power: 590 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#ff9800');
      });
    });

    // ------------------------------------------------------------------
    // TC4: 進捗率0%～29%で赤色（#f44336）
    // ------------------------------------------------------------------
    describe('TC4: 進捗率0%～29%で赤色', () => {
      it('TC4-1: 進捗率0%（下限値）で赤色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 0 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#f44336');
      });

      it('TC4-2: 進捗率15%（中間値）で赤色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 150 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#f44336');
      });

      it('TC4-3: 進捗率29%（境界値上限）で赤色', () => {
        const nation: Nation = { ...mockPlayerNation, power: 290 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#f44336');
      });
    });

    // ------------------------------------------------------------------
    // TC5: 境界値の厳密なテスト
    // ------------------------------------------------------------------
    describe('TC5: 境界値の厳密なテスト', () => {
      it('TC5-1: 29% vs 30%の境界（赤→オレンジ）', () => {
        // 29%: 赤色
        const nation29: Nation = { ...mockPlayerNation, power: 290 };
        const { container: container29 } = render(
          <NationPanel nation={nation29} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container29)).toBe('#f44336');

        // 30%: オレンジ
        const nation30: Nation = { ...mockPlayerNation, power: 300 };
        const { container: container30 } = render(
          <NationPanel nation={nation30} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container30)).toBe('#ff9800');
      });

      it('TC5-2: 59% vs 60%の境界（オレンジ→青）', () => {
        // 59%: オレンジ
        const nation59: Nation = { ...mockPlayerNation, power: 590 };
        const { container: container59 } = render(
          <NationPanel nation={nation59} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container59)).toBe('#ff9800');

        // 60%: 青色
        const nation60: Nation = { ...mockPlayerNation, power: 600 };
        const { container: container60 } = render(
          <NationPanel nation={nation60} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container60)).toBe('#2196f3');
      });

      it('TC5-3: 89% vs 90%の境界（青→緑）', () => {
        // 89%: 青色
        const nation89: Nation = { ...mockPlayerNation, power: 890 };
        const { container: container89 } = render(
          <NationPanel nation={nation89} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container89)).toBe('#2196f3');

        // 90%: 緑色
        const nation90: Nation = { ...mockPlayerNation, power: 900 };
        const { container: container90 } = render(
          <NationPanel nation={nation90} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container90)).toBe('#4caf50');
      });
    });

    // ------------------------------------------------------------------
    // TC6: 小数点を含む進捗率
    // ------------------------------------------------------------------
    describe('TC6: 小数点を含む進捗率', () => {
      it('TC6-1: 59.5%（オレンジ域）', () => {
        const nation: Nation = { ...mockPlayerNation, power: 595 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#ff9800');
      });

      it('TC6-2: 60.5%（青域）', () => {
        const nation: Nation = { ...mockPlayerNation, power: 605 };
        const { container } = render(
          <NationPanel nation={nation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        const color = getGaugeColor(container);
        expect(color).toBe('#2196f3');
      });
    });

    // ------------------------------------------------------------------
    // TC8: 国力変動時の色の更新
    // ------------------------------------------------------------------
    describe('TC8: 国力変動時の色の更新', () => {
      it('TC8-1: 国力増加に伴う色の変更（赤→オレンジ）', () => {
        const initialNation: Nation = { ...mockPlayerNation, power: 200 };
        const { container, rerender } = render(
          <NationPanel nation={initialNation} isCurrentTurn={false} powerWinThreshold={1000} />
        );

        // 初期状態: 20% → 赤色
        expect(getGaugeColor(container)).toBe('#f44336');

        // 国力増加: 40% → オレンジ
        const updatedNation: Nation = { ...mockPlayerNation, power: 400 };
        rerender(
          <NationPanel nation={updatedNation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container)).toBe('#ff9800');
      });

      it('TC8-2: 国力減少に伴う色の変更（青→オレンジ）', () => {
        const initialNation: Nation = { ...mockPlayerNation, power: 700 };
        const { container, rerender } = render(
          <NationPanel nation={initialNation} isCurrentTurn={false} powerWinThreshold={1000} />
        );

        // 初期状態: 70% → 青色
        expect(getGaugeColor(container)).toBe('#2196f3');

        // 国力減少: 35% → オレンジ
        const updatedNation: Nation = { ...mockPlayerNation, power: 350 };
        rerender(
          <NationPanel nation={updatedNation} isCurrentTurn={false} powerWinThreshold={1000} />
        );
        expect(getGaugeColor(container)).toBe('#ff9800');
      });
    });
  });

  // --------------------------------------------------------------------
  // 10. 国家ステート表示（StateIconList統合） - Task 3-1-5
  // --------------------------------------------------------------------
  describe('国家ステート表示（StateIconList統合）', () => {
    // ------------------------------------------------------------------
    // TC 10-1: 基本レンダリング
    // ------------------------------------------------------------------
    describe('TC 10-1: 基本レンダリング', () => {
      it('TC 10-1-1: ステートがない場合（空配列）は何も表示されない', () => {
        const nationWithoutStates: Nation = { ...mockPlayerNation, states: [] };
        render(
          <NationPanel nation={nationWithoutStates} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListコンポーネントが存在しない（role="list"が存在しない）
        const list = screen.queryByRole('list');
        expect(list).toBeNull();
      });

      it('TC 10-1-2: 単一ステートが表示される', () => {
        const nationWithOneState: Nation = { ...mockPlayerNation, states: [buffState] };
        render(
          <NationPanel nation={nationWithOneState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListコンポーネントが存在する
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        // listitemが1つ存在する
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(1);

        // アイコン絵文字（⚔️）が表示される
        expect(screen.getByText('⚔️')).toBeInTheDocument();
      });

      it('TC 10-1-3: 複数ステート (3個) が表示される', () => {
        const nationWithMultipleStates: Nation = {
          ...mockPlayerNation,
          states: [buffState, debuffState, neutralState],
        };
        render(
          <NationPanel nation={nationWithMultipleStates} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListコンポーネントが存在する
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        // listitemが3つ存在する
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(3);

        // 各アイコン絵文字が表示される
        expect(screen.getByText('⚔️')).toBeInTheDocument(); // attackPowerUp
        expect(screen.getByText('🗡️')).toBeInTheDocument(); // attackPowerDown
        expect(screen.getByText('💀')).toBeInTheDocument(); // dead
      });

      it('TC 10-1-4: 多数のステート (5個以上) が表示される', () => {
        const nationWithManyStates: Nation = {
          ...mockPlayerNation,
          states: [buffState, debuffState, neutralState, buffDefenseState, permanentStackedState],
        };
        render(
          <NationPanel nation={nationWithManyStates} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListコンポーネントが存在する
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        // listitemが5つ存在する
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(5);
      });
    });

    // ------------------------------------------------------------------
    // TC 10-2: レイアウト確認
    // ------------------------------------------------------------------
    describe('TC 10-2: レイアウト確認', () => {
      it('TC 10-2-1: ステート表示が残り内政の下に配置される', () => {
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState] };
        const { container } = render(
          <NationPanel nation={nationWithState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // 「残り内政」のテキストが存在する
        expect(screen.getByText(/残り内政.*2/)).toBeInTheDocument();

        // StateIconListコンポーネントが存在する
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        // DOM順序で「残り内政」の後にStateIconListが配置されることを確認
        const nationPanel = container.querySelector('.nation-panel');
        expect(nationPanel).not.toBeNull();

        // テキストノードを含む全ての子要素を取得
        const children = Array.from(nationPanel!.childNodes);
        
        // 「残り内政」を含む要素のインデックスを見つける
        const remainingActionsIndex = children.findIndex(
          (node) => node.textContent?.includes('残り内政')
        );

        // StateIconList（role="list"）のインデックスを見つける
        const stateListIndex = children.findIndex(
          (node) => (node as HTMLElement).querySelector?.('[role="list"]')
        );

        // StateIconListが「残り内政」より後に配置されていることを確認
        expect(stateListIndex).toBeGreaterThan(remainingActionsIndex);
      });

      it('TC 10-2-2: CSSクラス名が正しく適用される', () => {
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState] };
        render(
          <NationPanel nation={nationWithState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListコンポーネントが存在する
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        // StateIconListのクラス名が正しい
        expect(list.classList.contains('state-icon-list')).toBe(true);
      });
    });

    // ------------------------------------------------------------------
    // TC 10-3: ホバー機能
    // ------------------------------------------------------------------
    describe('TC 10-3: ホバー機能', () => {
      it('TC 10-3-1: ステートアイコンホバー時にツールチップが表示される', async () => {
        const user = userEvent.setup();
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState] };
        render(
          <NationPanel nation={nationWithState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // アイコンを取得
        const icon = screen.getByText('⚔️');

        // ホバー
        await user.hover(icon);

        // ツールチップが表示される
        expect(screen.getByText('攻撃力上昇')).toBeInTheDocument();
        expect(screen.getByText(/残りターン:\s*3/)).toBeInTheDocument();
      });

      it('TC 10-3-2: ホバー解除時にツールチップが消える', async () => {
        const user = userEvent.setup();
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState] };
        render(
          <NationPanel nation={nationWithState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // アイコンを取得
        const icon = screen.getByText('⚔️');

        // ホバー
        await user.hover(icon);
        expect(screen.getByText('攻撃力上昇')).toBeInTheDocument();

        // ホバー解除
        await user.unhover(icon);

        // ツールチップが消える
        expect(screen.queryByText('攻撃力上昇')).not.toBeInTheDocument();
      });

      it('TC 10-3-3: スタック情報が正しく表示される', async () => {
        const user = userEvent.setup();
        const nationWithStackedState: Nation = { ...mockPlayerNation, states: [debuffState] };
        render(
          <NationPanel nation={nationWithStackedState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // アイコンを取得（debuffStateのアイコンは🗡️）
        const icon = screen.getByText('🗡️');

        // ホバー
        await user.hover(icon);

        // スタック情報が表示される（バッジとツールチップの両方を確認）
        expect(screen.getByText('5')).toBeInTheDocument(); // バッジの数字
        expect(screen.getByText(/スタック:\s*5/)).toBeInTheDocument(); // ツールチップ
      });
    });

    // ------------------------------------------------------------------
    // TC 10-4: StateIconListとの統合
    // ------------------------------------------------------------------
    describe('TC 10-4: StateIconListとの統合', () => {
      it('TC 10-4-1: StateIconListに正しいpropsが渡される', () => {
        const nationWithStates: Nation = {
          ...mockPlayerNation,
          states: [buffState, debuffState],
        };
        render(
          <NationPanel nation={nationWithStates} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListが正しくレンダリングされる
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        // listitemが2つ存在する（配列の順序が維持される）
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);

        // 各アイコンが表示される
        expect(screen.getByText('⚔️')).toBeInTheDocument();
        expect(screen.getByText('🗡️')).toBeInTheDocument();
      });

      it('TC 10-4-2: 空配列の場合にStateIconListがレンダリングされない', () => {
        const nationWithoutStates: Nation = { ...mockPlayerNation, states: [] };
        render(
          <NationPanel nation={nationWithoutStates} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListコンポーネントがDOM上に存在しない
        const list = screen.queryByRole('list');
        expect(list).toBeNull();
      });
    });

    // ------------------------------------------------------------------
    // TC 10-5: 既存機能との共存
    // ------------------------------------------------------------------
    describe('TC 10-5: 既存機能との共存', () => {
      it('TC 10-5-1: ステート表示追加後も既存の国力表示が正常に動作する', () => {
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState], power: 300 };
        render(
          <NationPanel nation={nationWithState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // 国力が正しく表示される
        expect(screen.getByText(/国力.*300/)).toBeInTheDocument();

        // ステート表示も正常に表示される
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getByText('⚔️')).toBeInTheDocument();
      });

      it('TC 10-5-2: ステート表示追加後も既存の国力ゲージが正常に動作する', () => {
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState], power: 300 };
        const { container } = render(
          <NationPanel nation={nationWithState} isCurrentTurn={false} powerWinThreshold={TEST_POWER_WIN_THRESHOLD} />
        );

        // 国力ゲージが正しく表示される
        const gauge = container.querySelector<HTMLElement>('[data-testid="power-gauge-fill"]');
        expect(gauge).not.toBeNull();
        expect(gauge!.style.width).toBe('30%');

        // ステート表示も正常に表示される
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getByText('⚔️')).toBeInTheDocument();
      });

      it('TC 10-5-3: ステート表示追加後も既存のプレイヤー/CPUバッジが正常に動作する', () => {
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState], isNPC: false };
        render(
          <NationPanel nation={nationWithState} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // 「プレイヤー」バッジが表示される
        expect(screen.getByText('プレイヤー')).toBeInTheDocument();

        // ステート表示も正常に表示される
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getByText('⚔️')).toBeInTheDocument();
      });

      it('TC 10-5-4: ステート表示追加後も既存の手番ハイライトが正常に動作する', () => {
        const nationWithState: Nation = { ...mockPlayerNation, states: [buffState] };
        const { container } = render(
          <NationPanel nation={nationWithState} isCurrentTurn={true} powerWinThreshold={null} />
        );

        // .nation-panel に current-turn クラスが付与される
        const panel = container.querySelector('.nation-panel');
        expect(panel).not.toBeNull();
        expect((panel as HTMLElement).classList.contains('current-turn')).toBe(true);

        // ステート表示も正常に表示される
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getByText('⚔️')).toBeInTheDocument();
      });
    });

    // ------------------------------------------------------------------
    // TC 10-6: ステート変動時の更新
    // ------------------------------------------------------------------
    describe('TC 10-6: ステート変動時の更新', () => {
      it('TC 10-6-1: ステートが追加された場合の表示更新', () => {
        const initialNation: Nation = { ...mockPlayerNation, states: [] };
        const { rerender } = render(
          <NationPanel nation={initialNation} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // 初期状態ではStateIconListが表示されない
        expect(screen.queryByRole('list')).toBeNull();

        // ステートを追加
        const updatedNation: Nation = { ...mockPlayerNation, states: [buffState] };
        rerender(
          <NationPanel nation={updatedNation} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListが表示される
        expect(screen.getByRole('list')).toBeInTheDocument();

        // アイコンが1つ表示される
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(1);
        expect(screen.getByText('⚔️')).toBeInTheDocument();
      });

      it('TC 10-6-2: ステートが削除された場合の表示更新', () => {
        const initialNation: Nation = {
          ...mockPlayerNation,
          states: [buffState, debuffState],
        };
        const { rerender } = render(
          <NationPanel nation={initialNation} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // 初期状態ではアイコンが2つ表示される
        let items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);

        // ステートを1つ削除
        const updatedNation: Nation = { ...mockPlayerNation, states: [buffState] };
        rerender(
          <NationPanel nation={updatedNation} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // アイコンが1つ表示される
        items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(1);
        expect(screen.getByText('⚔️')).toBeInTheDocument();
        expect(screen.queryByText('🗡️')).not.toBeInTheDocument();
      });

      it('TC 10-6-3: 全てのステートが削除された場合の非表示', () => {
        const initialNation: Nation = { ...mockPlayerNation, states: [buffState] };
        const { rerender } = render(
          <NationPanel nation={initialNation} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // 初期状態ではStateIconListが表示される
        expect(screen.getByRole('list')).toBeInTheDocument();

        // 全てのステートを削除
        const updatedNation: Nation = { ...mockPlayerNation, states: [] };
        rerender(
          <NationPanel nation={updatedNation} isCurrentTurn={false} powerWinThreshold={null} />
        );

        // StateIconListが非表示になる
        expect(screen.queryByRole('list')).toBeNull();
      });
    });
  });
});
