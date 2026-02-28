import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
// TDD Red フェーズ: Graveyard.tsx 未作成のため、
// このテストは初回実行時に全て失敗することを期待する
// @ts-expect-error - TDD Red フェーズのため未実装
import { Graveyard } from '../Graveyard';
import { Unit } from '@core/domain/models';

/**
 * Graveyard コンポーネント テスト
 *
 * TDD 赤フェーズ：以下の機能が未実装のため、全テストが失敗することを期待する
 *  - Graveyard.tsx の作成
 *  - Props（graveyard, nationName）の受け取り
 *  - 墓地ユニットの表示（UnitCardを流用）
 *  - 墓地が空の場合のメッセージ表示
 *  - UnitCard への isGraveyard, position props の追加
 */

// -----------------------------------------------------------------------
// テストデータ
// -----------------------------------------------------------------------

// テストデータ定数
const GRAVEYARD_UNIT_DEFAULT_MAX_HP = 100;
const GRAVEYARD_UNIT_DEFAULT_ATTACK = 30;
const GRAVEYARD_UNIT_CURRENT_HP = 0; // 墓地ユニットは常に死亡

/**
 * テスト用の墓地ユニット生成関数
 * @param index ユニット番号
 * @returns 墓地用ユニット（currentHP=0）
 */
const createMockUnit = (index: number): Unit => ({
  baseUnitId: `graveyardUnit${index}`,
  unitId: `nation1-graveyardUnit${index}`,
  ownerNationId: 'nation1',
  name: `墓地ユニット${index}`,
  maxHP: GRAVEYARD_UNIT_DEFAULT_MAX_HP,
  currentHP: GRAVEYARD_UNIT_CURRENT_HP,
  attack: GRAVEYARD_UNIT_DEFAULT_ATTACK,
  skillId: 'normalAttack',
  states: [],
});

// -----------------------------------------------------------------------
// TC-GY-1: 基本レンダリング
// -----------------------------------------------------------------------

describe('TC-GY-1: 基本レンダリング', () => {
  /**
   * TC-GY-1-1: 国家名が正しく表示される
   *
   * Given: graveyard=[3体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 「テスト王国の墓地」が表示される
   */
  it('TC-GY-1-1: 国家名が正しく表示される', () => {
    const graveyard = [createMockUnit(0), createMockUnit(1), createMockUnit(2)];

    render(<Graveyard graveyard={graveyard} nationName="テスト王国" />);

    // ヘッダーに国家名を含むタイトルが表示される
    const title = screen.getByTestId('graveyard-title');
    expect(title).toHaveTextContent('テスト王国の墓地');
  });

  /**
   * TC-GY-1-2: ユニット数が正しく表示される（3体）
   *
   * Given: graveyard=[3体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 「(3)」が表示される
   */
  it('TC-GY-1-2: ユニット数が正しく表示される（3体）', () => {
    const graveyard = [createMockUnit(0), createMockUnit(1), createMockUnit(2)];

    render(<Graveyard graveyard={graveyard} nationName="テスト王国" />);

    // ユニット数が表示される
    const count = screen.getByTestId('graveyard-count');
    expect(count).toHaveTextContent('(3)');
  });

  /**
   * TC-GY-1-3: 墓地ユニットが全て表示される
   *
   * Given: graveyard=[3体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 3つのUnitCardが表示される
   */
  it('TC-GY-1-3: 墓地ユニットが全て表示される', () => {
    const graveyard = [createMockUnit(0), createMockUnit(1), createMockUnit(2)];

    const { container } = render(
      <Graveyard graveyard={graveyard} nationName="テスト王国" />
    );

    // 3つのUnitCardが存在する
    const unitCards = container.querySelectorAll('.unit-card');
    expect(unitCards).toHaveLength(3);
  });

  /**
   * TC-GY-1-4: 各UnitCardに `isGraveyard={true}` が渡される
   *
   * Given: graveyard=[3体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 全てのUnitCardが `.graveyard-unit` クラスを持つ
   */
  it('TC-GY-1-4: 各UnitCardに `isGraveyard={true}` が渡される', () => {
    const graveyard = [createMockUnit(0), createMockUnit(1), createMockUnit(2)];

    const { container } = render(
      <Graveyard graveyard={graveyard} nationName="テスト王国" />
    );

    // 全てのUnitCardが .graveyard-unit クラスを持つ
    const graveyardUnits = container.querySelectorAll('.unit-card.graveyard-unit');
    expect(graveyardUnits).toHaveLength(3);
  });

  /**
   * TC-GY-1-5: 各UnitCardに `position="graveyard"` が渡される
   *
   * Given: graveyard=[3体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 全てのUnitCardが data-unit-position="graveyard" 属性を持つ
   */
  it('TC-GY-1-5: 各UnitCardに `position="graveyard"` が渡される', () => {
    const graveyard = [createMockUnit(0), createMockUnit(1), createMockUnit(2)];

    const { container } = render(
      <Graveyard graveyard={graveyard} nationName="テスト王国" />
    );

    // 全てのUnitCardが data-unit-position="graveyard" を持つ
    const graveyardCards = container.querySelectorAll('[data-unit-position="graveyard"]');
    expect(graveyardCards).toHaveLength(3);
  });
});

// -----------------------------------------------------------------------
// TC-GY-2: 境界値 - 空の墓地
// -----------------------------------------------------------------------

describe('TC-GY-2: 境界値 - 空の墓地', () => {
  /**
   * TC-GY-2-1: 墓地が空の場合、メッセージが表示される
   *
   * Given: graveyard=[], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 「墓地は空です」が表示される
   */
  it('TC-GY-2-1: 墓地が空の場合、メッセージが表示される', () => {
    render(<Graveyard graveyard={[]} nationName="テスト王国" />);

    // 空メッセージが表示される
    const emptyMessage = screen.getByTestId('graveyard-empty-message');
    expect(emptyMessage).toHaveTextContent('墓地は空です');
  });

  /**
   * TC-GY-2-2: 墓地が空の場合、ユニット数が「(0)」
   *
   * Given: graveyard=[], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 「(0)」が表示される
   */
  it('TC-GY-2-2: 墓地が空の場合、ユニット数が「(0)」', () => {
    render(<Graveyard graveyard={[]} nationName="テスト王国" />);

    // ユニット数が (0) として表示される
    const count = screen.getByTestId('graveyard-count');
    expect(count).toHaveTextContent('(0)');
  });

  /**
   * TC-GY-2-3: 墓地が空の場合、UnitCardは表示されない
   *
   * Given: graveyard=[], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: UnitCardが0個
   */
  it('TC-GY-2-3: 墓地が空の場合、UnitCardは表示されない', () => {
    const { container } = render(
      <Graveyard graveyard={[]} nationName="テスト王国" />
    );

    // UnitCardが存在しない
    const unitCards = container.querySelectorAll('.unit-card');
    expect(unitCards).toHaveLength(0);
  });
});

// -----------------------------------------------------------------------
// TC-GY-3: 境界値 - 1ユニット
// -----------------------------------------------------------------------

describe('TC-GY-3: 境界値 - 1ユニット', () => {
  /**
   * TC-GY-3-1: 墓地に1ユニットある場合、カードが1つ表示
   *
   * Given: graveyard=[1体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: UnitCardが1個表示される
   */
  it('TC-GY-3-1: 墓地に1ユニットある場合、カードが1つ表示', () => {
    const graveyard = [createMockUnit(0)];

    const { container } = render(
      <Graveyard graveyard={graveyard} nationName="テスト王国" />
    );

    // 1つのUnitCardが存在する
    const unitCards = container.querySelectorAll('.unit-card');
    expect(unitCards).toHaveLength(1);
  });

  /**
   * TC-GY-3-2: 墓地に1ユニットある場合、ユニット数が「(1)」
   *
   * Given: graveyard=[1体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 「(1)」が表示される
   */
  it('TC-GY-3-2: 墓地に1ユニットある場合、ユニット数が「(1)」', () => {
    const graveyard = [createMockUnit(0)];

    render(<Graveyard graveyard={graveyard} nationName="テスト王国" />);

    // ユニット数が (1) として表示される
    const count = screen.getByTestId('graveyard-count');
    expect(count).toHaveTextContent('(1)');
  });

  /**
   * TC-GY-3-3: 墓地に1ユニットある場合、空メッセージは非表示
   *
   * Given: graveyard=[1体], nationName='テスト王国'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 「墓地は空です」が表示されない
   */
  it('TC-GY-3-3: 墓地に1ユニットある場合、空メッセージは非表示', () => {
    const graveyard = [createMockUnit(0)];

    render(<Graveyard graveyard={graveyard} nationName="テスト王国" />);

    // 空メッセージが存在しない
    const emptyMessage = screen.queryByTestId('graveyard-empty-message');
    expect(emptyMessage).not.toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------
// TC-GY-4: 境界値 - 複数ユニット
// -----------------------------------------------------------------------

describe('TC-GY-4: 境界値 - 複数ユニット', () => {
  /**
   * TC-GY-4-1: 墓地に5ユニットある場合、カードが5つ表示
   *
   * Given: graveyard=[5体], nationName='エルフの森'
   * When: Graveyardコンポーネントをレンダリング
   * Then: UnitCardが5個表示される
   */
  it('TC-GY-4-1: 墓地に5ユニットある場合、カードが5つ表示', () => {
    const graveyard = Array.from({ length: 5 }, (_, i) => createMockUnit(i));

    const { container } = render(
      <Graveyard graveyard={graveyard} nationName="エルフの森" />
    );

    // 5つのUnitCardが存在する
    const unitCards = container.querySelectorAll('.unit-card');
    expect(unitCards).toHaveLength(5);
  });

  /**
   * TC-GY-4-2: 墓地に5ユニットある場合、ユニット数が「(5)」
   *
   * Given: graveyard=[5体], nationName='エルフの森'
   * When: Graveyardコンポーネントをレンダリング
   * Then: 「(5)」が表示される
   */
  it('TC-GY-4-2: 墓地に5ユニットある場合、ユニット数が「(5)」', () => {
    const graveyard = Array.from({ length: 5 }, (_, i) => createMockUnit(i));

    render(<Graveyard graveyard={graveyard} nationName="エルフの森" />);

    // ユニット数が (5) として表示される
    const count = screen.getByTestId('graveyard-count');
    expect(count).toHaveTextContent('(5)');
  });

  /**
   * TC-GY-4-3: 各ユニットのunitIdがkeyとして使用される（警告なし）
   *
   * Given: graveyard=[5体], nationName='エルフの森'
   * When: Graveyardコンポーネントをレンダリング
   * Then: React key警告が発生しない
   *
   * 検証方法: Console.errorスパイでReactの警告メッセージを監視
   */
  it('TC-GY-4-3: 各ユニットのunitIdがkeyとして使用される（警告なし）', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const graveyard = Array.from({ length: 5 }, (_, i) => createMockUnit(i));
    render(<Graveyard graveyard={graveyard} nationName="エルフの森" />);

    // React key警告がないことを確認
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/Each child in a list should have a unique "key" prop/)
    );

    consoleErrorSpy.mockRestore();
  });
});
