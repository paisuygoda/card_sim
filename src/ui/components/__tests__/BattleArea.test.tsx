import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BattleArea } from '../BattleArea';
import { createMockUnitWithIndex, createMockNation } from '@ui/__tests__/fixtures';

/**
 * BattleArea コンポーネント テスト
 *
 * TDD 赤フェーズ：以下の機能が未実装のため、全テストが失敗することを期待する
 *  - selectableUnitIndices プロップの受け取りと UnitCard への伝達
 *  - selectedUnitIndex プロップの受け取りと UnitCard への伝達
 *  - 選択不可ユニットのクリック抑制
 */

// -----------------------------------------------------------------------
// テストデータ（共有フィクスチャ使用）
// -----------------------------------------------------------------------

/** テスト用国家（前衛・中衛・後衛・ベンチ2体の5ユニット構成） */
const mockNation = createMockNation({
  nationId: 'nation1',
  remainingActions: 2,
  units: [
    createMockUnitWithIndex(0, { currentHP: 80, attack: 30 }), // 前衛
    createMockUnitWithIndex(1, { currentHP: 80, attack: 30 }), // 中衛
    createMockUnitWithIndex(2, { currentHP: 80, attack: 30 }), // 後衛
    createMockUnitWithIndex(3, { currentHP: 80, attack: 30 }), // ベンチ1
    createMockUnitWithIndex(4, { currentHP: 80, attack: 30 }), // ベンチ2
  ],
});

// -----------------------------------------------------------------------
// BattleArea - ユニット選択UI（統合テスト）
// -----------------------------------------------------------------------

describe('BattleArea - ユニット選択UI', () => {
  // --------------------------------------------------------------------
  // TC-BA-1: 選択可能ユニットのフィルタリング
  // --------------------------------------------------------------------
  describe('選択可能ユニットのフィルタリング (TC-BA-1)', () => {
    /**
     * TC-BA-1-1: selectableUnitIndices={[0, 2]} の場合、インデックス 0 と 2 のユニットに isSelectable={true} が渡される
     */
    it('TC-BA-1-1: selectableUnitIndices={[0, 2]} の場合、インデックス 0 と 2 のユニットに isSelectable={true} が渡される', () => {
      const { container } = render(
        <BattleArea
          nation={mockNation}
          onUnitClick={vi.fn()}
          selectableUnitIndices={[0, 2]}
        />
      );

      // 前衛（index=0）と後衛（index=2）に .selectable クラスが付与される
      const cards = container.querySelectorAll('.unit-card');
      expect(cards[0]).toHaveClass('selectable'); // 前衛
      expect(cards[1]).not.toHaveClass('selectable'); // 中衛
      expect(cards[2]).toHaveClass('selectable'); // 後衛
    });

    /**
     * TC-BA-1-2: selectableUnitIndices={[]} の場合、全ユニットに isSelectable={false} が渡される
     */
    it('TC-BA-1-2: selectableUnitIndices={[]} の場合、全ユニットに isSelectable={false} が渡される', () => {
      const { container } = render(
        <BattleArea
          nation={mockNation}
          onUnitClick={vi.fn()}
          selectableUnitIndices={[]}
        />
      );

      // どのユニットにも .selectable クラスが付与されない
      const selectableCards = container.querySelectorAll('.unit-card.selectable');
      expect(selectableCards).toHaveLength(0);
    });

    /**
     * TC-BA-1-3: selectableUnitIndices 未指定の場合、全ユニットに isSelectable={false} が渡される
     */
    it('TC-BA-1-3: selectableUnitIndices 未指定の場合、全ユニットに isSelectable={false} が渡される', () => {
      const { container } = render(
        <BattleArea nation={mockNation} onUnitClick={vi.fn()} />
      );

      // どのユニットにも .selectable クラスが付与されない
      const selectableCards = container.querySelectorAll('.unit-card.selectable');
      expect(selectableCards).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------
  // TC-BA-2: 選択中ユニットの伝達
  // --------------------------------------------------------------------
  describe('選択中ユニットの伝達 (TC-BA-2)', () => {
    /**
     * TC-BA-2-1: selectedUnitIndex={1} の場合、インデックス 1 のユニットに isSelected={true} が渡される
     */
    it('TC-BA-2-1: selectedUnitIndex={1} の場合、インデックス 1 のユニットに isSelected={true} が渡される', () => {
      const { container } = render(
        <BattleArea
          nation={mockNation}
          onUnitClick={vi.fn()}
          selectedUnitIndex={1}
        />
      );

      // 中衛（index=1）にのみ .selected クラスが付与される
      const cards = container.querySelectorAll('.unit-card');
      expect(cards[0]).not.toHaveClass('selected'); // 前衛
      expect(cards[1]).toHaveClass('selected'); // 中衛
      expect(cards[2]).not.toHaveClass('selected'); // 後衛
    });

    /**
     * TC-BA-2-2: selectedUnitIndex={null} の場合、全ユニットに isSelected={false} が渡される
     */
    it('TC-BA-2-2: selectedUnitIndex={null} の場合、全ユニットに isSelected={false} が渡される', () => {
      const { container } = render(
        <BattleArea
          nation={mockNation}
          onUnitClick={vi.fn()}
          selectedUnitIndex={null}
        />
      );

      // どのユニットにも .selected クラスが付与されない
      const selectedCards = container.querySelectorAll('.unit-card.selected');
      expect(selectedCards).toHaveLength(0);
    });

    /**
     * TC-BA-2-3: selectedUnitIndex 未指定の場合、全ユニットに isSelected={false} が渡される
     */
    it('TC-BA-2-3: selectedUnitIndex 未指定の場合、全ユニットに isSelected={false} が渡される', () => {
      const { container } = render(
        <BattleArea nation={mockNation} onUnitClick={vi.fn()} />
      );

      // どのユニットにも .selected クラスが付与されない
      const selectedCards = container.querySelectorAll('.unit-card.selected');
      expect(selectedCards).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------
  // TC-BA-3: クリックコールバックの伝達
  // --------------------------------------------------------------------
  describe('クリックコールバックの伝達 (TC-BA-3)', () => {
    /**
     * TC-BA-3-1: 前衛ユニット（index=0）をクリックすると、onUnitClick(0) が呼ばれる
     */
    it('TC-BA-3-1: 前衛ユニット（index=0）をクリックすると、onUnitClick(0) が呼ばれる', async () => {
      const user = userEvent.setup();
      const mockOnUnitClick = vi.fn();
      render(
        <BattleArea
          nation={mockNation}
          onUnitClick={mockOnUnitClick}
          selectableUnitIndices={[0]}
        />
      );

      const frontUnitCard = screen.getByText('ユニット0').closest('.unit-card') as HTMLElement;
      await user.click(frontUnitCard);

      expect(mockOnUnitClick).toHaveBeenCalledTimes(1);
      expect(mockOnUnitClick).toHaveBeenCalledWith(0);
    });

    /**
     * TC-BA-3-2: ベンチユニット（index=4）をクリックすると、onUnitClick(4) が呼ばれる
     */
    it('TC-BA-3-2: ベンチユニット（index=4）をクリックすると、onUnitClick(4) が呼ばれる', async () => {
      const user = userEvent.setup();
      const mockOnUnitClick = vi.fn();
      render(
        <BattleArea
          nation={mockNation}
          onUnitClick={mockOnUnitClick}
          selectableUnitIndices={[4]}
        />
      );

      const benchUnitCard = screen.getByText('ユニット4').closest('.unit-card') as HTMLElement;
      await user.click(benchUnitCard);

      expect(mockOnUnitClick).toHaveBeenCalledTimes(1);
      expect(mockOnUnitClick).toHaveBeenCalledWith(4);
    });

    /**
     * TC-BA-3-3: 選択不可（selectableUnitIndices に含まれない）ユニットをクリックしても、onUnitClick は呼ばれない
     */
    it('TC-BA-3-3: 選択不可（selectableUnitIndices に含まれない）ユニットをクリックしても、onUnitClick は呼ばれない', async () => {
      const user = userEvent.setup();
      const mockOnUnitClick = vi.fn();
      render(
        <BattleArea
          nation={mockNation}
          onUnitClick={mockOnUnitClick}
          selectableUnitIndices={[0]} // 前衛のみ選択可能
        />
      );

      // 中衛（index=1）をクリック → 選択不可なのでコールバックは呼ばれない
      const midUnitCard = screen.getByText('ユニット1').closest('.unit-card') as HTMLElement;
      await user.click(midUnitCard);

      expect(mockOnUnitClick).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------
  // TC-BA-4: 複合条件
  // --------------------------------------------------------------------
  describe('複合条件 (TC-BA-4)', () => {
    /**
     * TC-BA-4-1: currentAttacker と selectableUnitIndices が重複する場合、両方のプロップが正しく渡される
     */
    it('TC-BA-4-1: currentAttacker と selectableUnitIndices が重複する場合、両方のプロップが正しく渡される', () => {
      const currentAttacker = mockNation.units[0] || undefined; // 前衛が攻撃者
      const { container } = render(
        <BattleArea
          nation={mockNation}
          currentAttacker={currentAttacker}
          onUnitClick={vi.fn()}
          selectableUnitIndices={[0, 1]} // 前衛と中衛が選択可能
        />
      );

      const cards = container.querySelectorAll('.unit-card');
      // 前衛: currentAttacker かつ selectable
      expect(cards[0]).toHaveClass('current-attacker');
      expect(cards[0]).toHaveClass('selectable');

      // 中衛: selectable のみ
      expect(cards[1]).not.toHaveClass('current-attacker');
      expect(cards[1]).toHaveClass('selectable');
    });

    /**
     * TC-BA-4-2: selectedUnitIndex と currentAttacker が同じユニットの場合、両方のプロップが正しく渡される
     */
    it('TC-BA-4-2: selectedUnitIndex と currentAttacker が同じユニットの場合、両方のプロップが正しく渡される', () => {
      const currentAttacker = mockNation.units[0] || undefined; // 前衛が攻撃者
      const { container } = render(
        <BattleArea
          nation={mockNation}
          currentAttacker={currentAttacker}
          onUnitClick={vi.fn()}
          selectedUnitIndex={0} // 前衛が選択中
        />
      );

      const cards = container.querySelectorAll('.unit-card');
      // 前衛: currentAttacker かつ selected
      expect(cards[0]).toHaveClass('current-attacker');
      expect(cards[0]).toHaveClass('selected');
    });
  });
});
