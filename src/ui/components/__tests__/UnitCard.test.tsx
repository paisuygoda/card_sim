import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnitCard } from '../UnitCard';
import { Unit } from '@core/domain/models';

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
// テストデータ
// -----------------------------------------------------------------------

/** 基本的なユニット（HP 60%） */
const mockUnit: Unit = {
  baseUnitId: 'testUnit',
  unitId: 'nation1-testUnit',
  ownerNationId: 'nation1',
  name: 'テストユニット',
  maxHP: 100,
  currentHP: 60,
  attack: 30,
  skillId: 'normalAttack', // SkillMaster に存在するID
  states: [],
};

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
});
