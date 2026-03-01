import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitCard } from '../UnitCard';
import type { Unit } from '@core/domain/models';
import { getStateIcon } from '@core/domain/master';
import {
  createMockUnit,
  createBuffState,
  createDebuffState,
  createDeadState,
  createDefenseBuffState,
  createProsperityState,
} from '@ui/__tests__/fixtures';

/**
 * UnitCard コンポーネント テスト
 *
 * TDD 赤フェーズ：以下の機能が未実装のため、全テストが失敗することを期待する
 *  - unit.skill.name バグ修正 → MasterData.getSkill(unit.skillId).name
 *  - HPバー表示（幅・色）
 *  - maxHP=0 の除算ゼロ対策
 *  - ポジション表示（前衛/中衛/後衛/ベンチ）
 *  - 戦闘不能表示（currentHP=0）
 */

// -----------------------------------------------------------------------
// テストデータ（共有フィクスチャ使用）
// -----------------------------------------------------------------------

/** StateIconListのデフォルト最大表示数 */
const DEFAULT_MAX_DISPLAY = 5;

/** 基本的なユニット（HP 60%） */
const mockUnit = createMockUnit({
  baseUnitId: 'testUnit',
  unitId: 'nation1-testUnit',
  name: 'テストユニット',
  currentHP: 60,
  attack: 30,
});

// ステート表示テスト用のモックデータ
const buffState = createBuffState();
const debuffState = createDebuffState();
const deadState = createDeadState();
const defenseBuffState = createDefenseBuffState({ stacks: 2, duration: 2 });
const prosperityState = createProsperityState();

// -----------------------------------------------------------------------
// テストスイート
// -----------------------------------------------------------------------

describe('UnitCard', () => {
  // --------------------------------------------------------------------
  // 1. スキル名表示
  // --------------------------------------------------------------------
  describe('スキル名表示', () => {
    it('1. スキルIDから正しいスキル名を取得して表示する', () => {
      // normalAttack → '通常攻撃' (SkillMaster に定義済み)
      render(<UnitCard unit={mockUnit} position="front" />);

      expect(screen.getByText('通常攻撃')).toBeInTheDocument();
    });

    it('2. 存在しないスキルIDでもクラッシュしない（フォールバック表示）', () => {
      const unitWithInvalidSkill: Unit = {
        ...mockUnit,
        skillId: 'nonExistentSkillId',
      };

      // エラーをスローせずにレンダリングできることを確認
      expect(() =>
        render(<UnitCard unit={unitWithInvalidSkill} position="front" />)
      ).not.toThrow();
    });
  });

  // --------------------------------------------------------------------
  // 2. HPバー表示
  // --------------------------------------------------------------------
  describe('HPバー表示', () => {
    it('3. currentHP / maxHP の割合がバーの幅スタイルに反映される（60% → width:60%）', () => {
      // currentHP=60, maxHP=100 → width: '60%'
      const { container } = render(<UnitCard unit={mockUnit} position="front" />);

      const hpBar = container.querySelector('.hp-bar-fill, [data-testid="hp-bar-fill"]');
      expect(hpBar).not.toBeNull();
      expect((hpBar as HTMLElement).style.width).toBe('60%');
    });

    it('4. HP が 66% 超の場合、バーが緑色（green）になる', () => {
      const highHpUnit: Unit = { ...mockUnit, currentHP: 80, maxHP: 100 };
      const { container } = render(<UnitCard unit={highHpUnit} position="front" />);

      const hpBar = container.querySelector('.hp-bar-fill, [data-testid="hp-bar-fill"]');
      expect(hpBar).not.toBeNull();
      const style = (hpBar as HTMLElement).style;
      // backgroundColor が green 系の色、もしくはクラス名で判別
      const hasGreen =
        style.backgroundColor === 'green' ||
        style.backgroundColor === '#4caf50' ||
        (hpBar as HTMLElement).classList.contains('hp-green');
      expect(hasGreen).toBe(true);
    });

    it('5. HP が 33〜66% の場合、バーが黄色（yellow）になる', () => {
      const midHpUnit: Unit = { ...mockUnit, currentHP: 50, maxHP: 100 };
      const { container } = render(<UnitCard unit={midHpUnit} position="front" />);

      const hpBar = container.querySelector('.hp-bar-fill, [data-testid="hp-bar-fill"]');
      expect(hpBar).not.toBeNull();
      const style = (hpBar as HTMLElement).style;
      const hasYellow =
        style.backgroundColor === 'yellow' ||
        style.backgroundColor === '#ffeb3b' ||
        (hpBar as HTMLElement).classList.contains('hp-yellow');
      expect(hasYellow).toBe(true);
    });

    it('6. HP が 33% 未満の場合、バーが赤色（red）になる', () => {
      const lowHpUnit: Unit = { ...mockUnit, currentHP: 20, maxHP: 100 };
      const { container } = render(<UnitCard unit={lowHpUnit} position="front" />);

      const hpBar = container.querySelector('.hp-bar-fill, [data-testid="hp-bar-fill"]');
      expect(hpBar).not.toBeNull();
      const style = (hpBar as HTMLElement).style;
      const hasRed =
        style.backgroundColor === 'red' ||
        style.backgroundColor === '#f44336' ||
        (hpBar as HTMLElement).classList.contains('hp-red');
      expect(hasRed).toBe(true);
    });

    it('7. maxHP=0 でもクラッシュせず、バー幅を 0% として扱う', () => {
      const zeroMaxHpUnit: Unit = { ...mockUnit, maxHP: 0, currentHP: 0 };

      expect(() =>
        render(<UnitCard unit={zeroMaxHpUnit} position="front" />)
      ).not.toThrow();

      const { container } = render(<UnitCard unit={zeroMaxHpUnit} position="front" />);
      const hpBar = container.querySelector('[data-testid="hp-bar-fill"]');
      expect(hpBar).not.toBeNull(); // HPバーの存在を強制
      if (hpBar) {
        expect((hpBar as HTMLElement).style.width).toBe('0%');
      }
    });
  });

  // --------------------------------------------------------------------
  // 3. 戦闘不能表示
  // --------------------------------------------------------------------
  describe('戦闘不能表示', () => {
    it('8. currentHP=0 の場合、戦闘不能として視覚的に区別される', () => {
      const defeatedUnit: Unit = { ...mockUnit, currentHP: 0 };
      const { container } = render(<UnitCard unit={defeatedUnit} position="front" />);

      // 「戦闘不能」テキストが表示されるか、disabled クラスが付与されるかどちらか
      const hasDisabledVisual =
        screen.queryByText('戦闘不能') !== null ||
        container.querySelector('.disabled, [data-defeated="true"]') !== null;
      expect(hasDisabledVisual).toBe(true);
    });
  });

  // --------------------------------------------------------------------
  // 4. ポジション表示
  // --------------------------------------------------------------------
  describe('ポジション表示', () => {
    it('9a. position="front" のとき「前衛」が表示される', () => {
      render(<UnitCard unit={mockUnit} position="front" />);
      expect(screen.getByText('前衛')).toBeInTheDocument();
    });

    it('9b. position="mid" のとき「中衛」が表示される', () => {
      render(<UnitCard unit={mockUnit} position="mid" />);
      expect(screen.getByText('中衛')).toBeInTheDocument();
    });

    it('9c. position="back" のとき「後衛」が表示される', () => {
      render(<UnitCard unit={mockUnit} position="back" />);
      expect(screen.getByText('後衛')).toBeInTheDocument();
    });

    it('9d. position="bench" のとき「ベンチ」が表示される', () => {
      render(<UnitCard unit={mockUnit} position="bench" />);
      expect(screen.getByText('ベンチ')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 5. null ユニット（既存動作の確認）
  // --------------------------------------------------------------------
  describe('null ユニット', () => {
    it('10. unit=null のとき「空」と表示される（既存動作を維持）', () => {
      render(<UnitCard unit={null} position="front" />);
      expect(screen.getByText('空')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 6. ステート表示
  // --------------------------------------------------------------------
  describe('ステート表示', () => {
    /**
     * TC 3-2-2-1: ステートが付与されていない場合（空配列）
     * 期待: StateIconListが表示されない
     */
    it('TC 3-2-2-1: ステートが付与されていない場合（空配列）', () => {
      const unitWithNoStates: Unit = { ...mockUnit, states: [] };
      render(<UnitCard unit={unitWithNoStates} position="front" />);

      // StateIconListが表示されない（role="list"が存在しない）
      const list = screen.queryByRole('list');
      expect(list).toBeNull();
    });

    /**
     * TC 3-2-2-2: 単一ステートが表示される
     * 期待: 1つのアイコンが表示される
     */
    it('TC 3-2-2-2: 単一ステートが表示される', () => {
      const unitWithSingleState: Unit = { ...mockUnit, states: [buffState] };
      render(<UnitCard unit={unitWithSingleState} position="front" />);

      // StateIconListが表示される
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      // listitemが1つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(1);

      // ⚔️アイコンが表示される
      screen.getByText(getStateIcon('attackPowerUp'));
    });

    /**
     * TC 3-2-2-3: 複数ステートが表示される
     * 期待: すべてのアイコンが表示される
     */
    it('TC 3-2-2-3: 複数ステートが表示される', () => {
      const unitWithMultipleStates: Unit = {
        ...mockUnit,
        states: [buffState, defenseBuffState, deadState],
      };
      render(<UnitCard unit={unitWithMultipleStates} position="front" />);

      // listitemが3つ
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      // 各アイコン絵文字が表示される
      screen.getByText(getStateIcon('attackPowerUp'));
      screen.getByText(getStateIcon('defensePowerUp'));
      screen.getByText(getStateIcon('dead'));
    });

    /**
     * TC 3-2-2-4: スタック数付きステートが表示される
     * 期待: スタック数バッジ"⁽⁵⁾"が表示される
     */
    it('TC 3-2-2-4: スタック数付きステートが表示される', () => {
      const unitWithStackedState: Unit = { ...mockUnit, states: [debuffState] };
      render(<UnitCard unit={unitWithStackedState} position="front" />);

      // アイコン🗡️が表示される
      screen.getByText(getStateIcon('attackPowerDown'));

      // スタック数バッジ"5"が表示される
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    /**
     * TC 3-2-2-5: 永続ステートが表示される
     * 期待: 永続マーカー"⁽-⁾"が表示される
     */
    it('TC 3-2-2-5: 永続ステートが表示される', () => {
      const unitWithPermanentState: Unit = { ...mockUnit, states: [deadState] };
      render(<UnitCard unit={unitWithPermanentState} position="front" />);

      // アイコン💀が表示される
      screen.getByText(getStateIcon('dead'));

      // 永続マーカー"∞"が表示される
      expect(screen.getByText('∞')).toBeInTheDocument();
    });

    /**
     * TC 3-2-2-6: 死亡ステートが正しく表示される
     * 期待: 「戦闘不能」テキストとともに💀アイコンが表示される
     */
    it('TC 3-2-2-6: 死亡ステートが正しく表示される', () => {
      const unitWithDeadState: Unit = {
        ...mockUnit,
        currentHP: 0, // 戦闘不能
        states: [deadState],
      };
      render(<UnitCard unit={unitWithDeadState} position="front" />);

      // 「戦闘不能」テキストが表示される（既存機能）
      expect(screen.getByText('戦闘不能')).toBeInTheDocument();

      // 💀アイコンがStateIconListに表示される（新機能）
      screen.getByText(getStateIcon('dead'));

      // StateIconListが正しくレンダリングされる
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    /**
     * TC 3-2-2-7: ホバー時にツールチップが表示される
     * 期待: role="tooltip"要素が表示され、ステート名が表示される
     */
    it('TC 3-2-2-7: ホバー時にツールチップが表示される', async () => {
      const user = userEvent.setup();
      const unitWithState: Unit = { ...mockUnit, states: [buffState] };
      render(<UnitCard unit={unitWithState} position="front" />);

      // role="img"のアイコンにホバー
      const icon = screen.getByRole('img');
      await user.hover(icon);

      // role="tooltip"要素が表示される
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();

      // ツールチップにステート名「攻撃力上昇」が含まれる
      expect(tooltip).toHaveTextContent('攻撃力上昇');
    });

    /**
     * TC 3-2-2-8: 6個以上のステートで+Nバッジが表示される（maxDisplay=5）
     * 期待: 5個のアイコンと"+1"バッジが表示される
     */
    it('TC 3-2-2-8: 6個以上のステートで+Nバッジが表示される（maxDisplay=5）', () => {
      const sixStates: State[] = [
        buffState,
        debuffState,
        defenseBuffState,
        prosperityState,
        deadState,
        { ...buffState, stateId: 'extra1', name: '追加1' },
      ];
      const unitWithManyStates: Unit = { ...mockUnit, states: sixStates };
      render(<UnitCard unit={unitWithManyStates} position="front" />);

      // listitemが5つ（最大表示数）
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(DEFAULT_MAX_DISPLAY);

      // "+1"バッジが表示される
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 6. ユニット選択UI - 選択可能状態の表示
  // --------------------------------------------------------------------
  describe('選択可能状態の表示 (TC-UC-1)', () => {
    /**
     * TC-UC-1-1: isSelectable={true} の場合、.selectable クラスが付与される
     */
    it('TC-UC-1-1: isSelectable={true} の場合、.selectable クラスが付与される', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={true} onClick={vi.fn()} />
      );

      const card = container.querySelector('.unit-card');
      expect(card).toHaveClass('selectable');
    });

    /**
     * TC-UC-1-2: isSelectable={false} の場合、.selectable クラスが付与されない
     */
    it('TC-UC-1-2: isSelectable={false} の場合、.selectable クラスが付与されない', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={false} onClick={vi.fn()} />
      );

      const card = container.querySelector('.unit-card');
      expect(card).not.toHaveClass('selectable');
    });

    /**
     * TC-UC-1-3: isSelectable 未指定の場合、.selectable クラスが付与されない
     */
    it('TC-UC-1-3: isSelectable 未指定の場合、.selectable クラスが付与されない', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" onClick={vi.fn()} />
      );

      const card = container.querySelector('.unit-card');
      expect(card).not.toHaveClass('selectable');
    });
  });

  // --------------------------------------------------------------------
  // 7. ユニット選択UI - 選択中状態の表示
  // --------------------------------------------------------------------
  describe('選択中状態の表示 (TC-UC-2)', () => {
    /**
     * TC-UC-2-1: isSelected={true} の場合、.selected クラスが付与される
     */
    it('TC-UC-2-1: isSelected={true} の場合、.selected クラスが付与される', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelected={true} onClick={vi.fn()} />
      );

      const card = container.querySelector('.unit-card');
      expect(card).toHaveClass('selected');
    });

    /**
     * TC-UC-2-2: isSelected={true} の場合、チェックマーク（✓）が表示される
     */
    it('TC-UC-2-2: isSelected={true} の場合、チェックマーク（✓）が表示される', () => {
      render(
        <UnitCard unit={mockUnit} position="front" isSelected={true} onClick={vi.fn()} />
      );

      // チェックマーク要素が存在する（テキスト "✓" または .selected-mark クラス）
      const checkMark = screen.queryByText('✓');
      expect(checkMark).toBeInTheDocument();
    });

    /**
     * TC-UC-2-3: isSelected={false} の場合、.selected クラスが付与されず、チェックマークも表示されない
     */
    it('TC-UC-2-3: isSelected={false} の場合、.selected クラスが付与されず、チェックマークも表示されない', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelected={false} onClick={vi.fn()} />
      );

      const card = container.querySelector('.unit-card');
      expect(card).not.toHaveClass('selected');

      const checkMark = screen.queryByText('✓');
      expect(checkMark).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 8. ユニット選択UI - クリック動作の制御
  // --------------------------------------------------------------------
  describe('クリック動作の制御 (TC-UC-3)', () => {
    /**
     * TC-UC-3-1: isSelectable={true} かつ onClick 指定時、クリックでコールバックが呼ばれる
     */
    it('TC-UC-3-1: isSelectable={true} かつ onClick 指定時、クリックでコールバックが呼ばれる', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(
        <UnitCard unit={mockUnit} position="front" isSelectable={true} onClick={mockOnClick} />
      );

      const card = screen.getByText('テストユニット').closest('.unit-card') as HTMLElement;
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    /**
     * TC-UC-3-2: isSelectable={false} かつ onClick 指定時、クリックしてもコールバックが呼ばれない
     */
    it('TC-UC-3-2: isSelectable={false} かつ onClick 指定時、クリックしてもコールバックが呼ばれない', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(
        <UnitCard unit={mockUnit} position="front" isSelectable={false} onClick={mockOnClick} />
      );

      const card = screen.getByText('テストユニット').closest('.unit-card') as HTMLElement;
      await user.click(card);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    /**
     * TC-UC-3-3: onClick 未指定時、isSelectable に関わらずエラーが発生しない
     */
    it('TC-UC-3-3: onClick 未指定時、isSelectable に関わらずエラーが発生しない', async () => {
      const user = userEvent.setup();

      // isSelectable: true のケース
      const { container: container1 } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={true} />
      );
      const card1 = container1.querySelector('.unit-card') as HTMLElement;
      await expect(user.click(card1)).resolves.not.toThrow();

      // isSelectable: false のケース
      const { container: container2 } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={false} />
      );
      const card2 = container2.querySelector('.unit-card') as HTMLElement;
      await expect(user.click(card2)).resolves.not.toThrow();
    });
  });

  // --------------------------------------------------------------------
  // 9. ユニット選択UI - キーボード操作（Enter/Space）
  // --------------------------------------------------------------------
  describe('キーボード操作（Enter/Space） (TC-UC-4)', () => {
    /**
     * TC-UC-4-1: isSelectable={true} のとき、Enter キーで onClick が呼ばれる
     */
    it('TC-UC-4-1: isSelectable={true} のとき、Enter キーで onClick が呼ばれる', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={true} onClick={mockOnClick} />
      );

      const card = container.querySelector('.unit-card') as HTMLElement;
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    /**
     * TC-UC-4-2: isSelectable={true} のとき、Space キーで onClick が呼ばれる
     */
    it('TC-UC-4-2: isSelectable={true} のとき、Space キーで onClick が呼ばれる', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={true} onClick={mockOnClick} />
      );

      const card = container.querySelector('.unit-card') as HTMLElement;
      card.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    /**
     * TC-UC-4-3: isSelectable={false} のとき、Enter/Space キーを押してもコールバックが呼ばれない
     */
    it('TC-UC-4-3: isSelectable={false} のとき、Enter/Space キーを押してもコールバックが呼ばれない', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={false} onClick={mockOnClick} />
      );

      const card = container.querySelector('.unit-card') as HTMLElement;
      card.focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    /**
     * TC-UC-4-4: onClick 未指定時、Enter/Space キーを押してもエラーが発生しない
     */
    it('TC-UC-4-4: onClick 未指定時、Enter/Space キーを押してもエラーが発生しない', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={true} />
      );

      const card = container.querySelector('.unit-card') as HTMLElement;
      card.focus();
      await expect(user.keyboard('{Enter}')).resolves.not.toThrow();
      await expect(user.keyboard(' ')).resolves.not.toThrow();
    });
  });

  // --------------------------------------------------------------------
  // 10. ユニット選択UI - 複合状態
  // --------------------------------------------------------------------
  describe('複合状態 (TC-UC-5)', () => {
    /**
     * TC-UC-5-1: isSelectable={true} かつ isSelected={true} の場合、両方のクラスが付与される
     */
    it('TC-UC-5-1: isSelectable={true} かつ isSelected={true} の場合、両方のクラスが付与される', () => {
      const { container } = render(
        <UnitCard
          unit={mockUnit}
          position="front"
          isSelectable={true}
          isSelected={true}
          onClick={vi.fn()}
        />
      );

      const card = container.querySelector('.unit-card');
      expect(card).toHaveClass('selectable');
      expect(card).toHaveClass('selected');
    });

    /**
     * TC-UC-5-2: isCurrentAttacker={true} と isSelected={true} が同時に存在する場合、両方のクラスが付与される
     */
    it('TC-UC-5-2: isCurrentAttacker={true} と isSelected={true} が同時に存在する場合、両方のクラスが付与される', () => {
      const { container } = render(
        <UnitCard
          unit={mockUnit}
          position="front"
          isCurrentAttacker={true}
          isSelected={true}
          onClick={vi.fn()}
        />
      );

      const card = container.querySelector('.unit-card');
      expect(card).toHaveClass('current-attacker');
      expect(card).toHaveClass('selected');
    });
  });

  // --------------------------------------------------------------------
  // 11. ユニット選択UI - アクセシビリティ
  // --------------------------------------------------------------------
  describe('アクセシビリティ (TC-UC-6)', () => {
    /**
     * TC-UC-6-1: onClick 存在時、role="button" と tabIndex={0} が設定される
     */
    it('TC-UC-6-1: onClick 存在時、role="button" と tabIndex={0} が設定される', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" onClick={vi.fn()} />
      );

      const card = container.querySelector('.unit-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    /**
     * TC-UC-6-2: onClick 存在時かつ isSelectable={false}、aria-disabled="true" が設定される
     */
    it('TC-UC-6-2: onClick 存在時かつ isSelectable={false}、aria-disabled="true" が設定される', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" isSelectable={false} onClick={vi.fn()} />
      );

      const card = container.querySelector('.unit-card');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });

    /**
     * TC-UC-6-3: onClick 未指定時、role と tabIndex が設定されない
     */
    it('TC-UC-6-3: onClick 未指定時、role と tabIndex が設定されない', () => {
      const { container } = render(
        <UnitCard unit={mockUnit} position="front" />
      );

      const card = container.querySelector('.unit-card');
      expect(card).not.toHaveAttribute('role');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });
});
