import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NationPanel } from '../NationPanel';
import { Nation } from '@core/domain/models';

// -----------------------------------------------------------------------
// テストデータ
// -----------------------------------------------------------------------

/** プレイヤー国家 (power=300, remainingActions=2) */
const mockPlayerNation: Nation = {
  nationId: 'player',
  name: 'テスト王国',
  isNPC: false,
  power: 300,
  remainingActions: 2,
  states: [],
  units: [null, null, null, null, null, null, null, null],
  graveyard: [],
  domesticCommands: [],
  actionCommands: [],
  targetMilitaryRatio: 0.5,
  aggressiveness: 0.5,
  hostileNationIds: [],
};

/** CPU国家 */
const mockNPCNation: Nation = {
  ...mockPlayerNation,
  nationId: 'npc1',
  name: 'CPU帝国',
  isNPC: true,
};

// -----------------------------------------------------------------------
// テストスイート
// -----------------------------------------------------------------------

describe('NationPanel', () => {
  // --------------------------------------------------------------------
  // 1. 国力ゲージ
  // --------------------------------------------------------------------
  describe('国力ゲージ', () => {
    it('1. power=300, powerWinThreshold=1000 のとき power-gauge-fill の幅が 30%', () => {
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={1000} />
      );
      const gauge = container.querySelector('[data-testid="power-gauge-fill"]');
      // フォールスグリーン防止: まず要素の存在を明示的にアサート
      expect(gauge).not.toBeNull();
      expect((gauge as HTMLElement).style.width).toBe('30%');
    });

    it('2. power=1200, powerWinThreshold=1000 のとき幅が 100%（超過しない）', () => {
      const overPowerNation: Nation = { ...mockPlayerNation, power: 1200 };
      const { container } = render(
        <NationPanel nation={overPowerNation} isCurrentTurn={false} powerWinThreshold={1000} />
      );
      const gauge = container.querySelector('[data-testid="power-gauge-fill"]');
      expect(gauge).not.toBeNull();
      expect((gauge as HTMLElement).style.width).toBe('100%');
    });
  });

  // --------------------------------------------------------------------
  // 2. powerWinThreshold=null のときゲージ非表示
  // --------------------------------------------------------------------
  describe('powerWinThreshold=null のときゲージ非表示', () => {
    it('3. powerWinThreshold=null のとき power-gauge-fill 要素が存在しない', () => {
      // 前提: threshold=1000 のときゲージが存在することを確認（偽グリーン検出）
      const { container: withThreshold } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={1000} />
      );
      expect(withThreshold.querySelector('[data-testid="power-gauge-fill"]')).not.toBeNull();

      // 本題: null のときゲージが消えること
      const { container } = render(
        <NationPanel nation={mockPlayerNation} isCurrentTurn={false} powerWinThreshold={null} />
      );
      expect(container.querySelector('[data-testid="power-gauge-fill"]')).toBeNull();
    });
  });

  // --------------------------------------------------------------------
  // 3. プレイヤー/CPU バッジ
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
  // 4. 手番ハイライト
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
  // 5. 基本情報表示
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
});
