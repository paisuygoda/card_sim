import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from '../GameBoard';
import { GamePhase } from '@core/domain/models';
import type { GameState, Nation, Unit } from '@core/domain/models';

/**
 * GameBoard コンポーネント テスト
 *
 * テスト対象のロジック：
 *  1. gameState が null のとき「ゲームが開始されていません」を表示する null 分岐
 *  2. gameState が存在するとき PhaseDisplay を描画する props マッピング
 *  3. gameState.nations の各国家ごとに NationPanel を描画する配列アクセス
 *
 * GameBoard は useGameStateStore でストアからデータを取得するため、
 * vi.mock で useGameStateStore をモックしてテストを実行する。
 */

// -----------------------------------------------------------------------
// useGameStateStore をモック
// -----------------------------------------------------------------------

vi.mock('@store/useGameStateStore', () => ({
  useGameStateStore: vi.fn(),
}));

import { useGameStateStore } from '@store/useGameStateStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedStore = vi.mocked(useGameStateStore) as unknown as ReturnType<typeof vi.fn>;

// -----------------------------------------------------------------------
// テストデータ
// -----------------------------------------------------------------------

const mockNation1: Nation = {
  nationId: 'nation1',
  name: '帝国',
  isNPC: false,
  power: 100,
  remainingActions: 3,
  states: [],
  units: [null, null, null, null, null, null, null, null],
  graveyard: [],
  domesticCommands: [],
  actionCommands: [],
  targetMilitaryRatio: 0.5,
  aggressiveness: 0.5,
  hostileNationIds: [],
};

const mockNation2: Nation = {
  nationId: 'nation2',
  name: '連邦',
  isNPC: true,
  power: 80,
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

const mockGameState: GameState = {
  stageId: 1,
  commandNum: 3,
  currentRound: 2,
  roundLimit: 5,
  nations: [mockNation1, mockNation2],
  currentTurnPlayer: 0,
  currentPhase: GamePhase.DOMESTIC,
  currentTarget: null,
  stateQueue: [],
  effectQueue: [],
  battleContext: null,
};

// -----------------------------------------------------------------------
// テストヘルパー: 墓地ユニット生成
// -----------------------------------------------------------------------

const createGraveyardUnit = (index: number, ownerNationId: string = 'nation1'): Unit => ({
  baseUnitId: `graveyardUnit${index}`,
  unitId: `${ownerNationId}-graveyardUnit${index}`,
  ownerNationId,
  name: `墓地ユニット${index}`,
  maxHP: 100,
  currentHP: 0,
  attack: 30,
  skillId: 'normalAttack',
  states: [],
});

const createGraveyardUnits = (count: number, ownerNationId: string = 'nation1'): Unit[] =>
  Array.from({ length: count }, (_, i) => createGraveyardUnit(i + 1, ownerNationId));

const createNationWithGraveyard = (
  baseNation: Nation,
  graveyardCount: number
): Nation => ({
  ...baseNation,
  graveyard: createGraveyardUnits(graveyardCount, baseNation.nationId),
});

// -----------------------------------------------------------------------
// テストスイート
// -----------------------------------------------------------------------

describe('GameBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------
  // 1. null 分岐
  // --------------------------------------------------------------------
  describe('gameState が null の場合', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedStore.mockImplementation((selector: any) => selector({ gameState: null }));
    });

    it('1. 「ゲームが開始されていません」が表示される', () => {
      render(<GameBoard />);
      expect(screen.getByText('ゲームが開始されていません')).toBeInTheDocument();
    });

    it('2. phase-display クラスの要素は描画されない', () => {
      const { container } = render(<GameBoard />);
      expect(container.querySelector('.phase-display')).toBeNull();
    });
  });

  // --------------------------------------------------------------------
  // 2. PhaseDisplay の描画（props マッピング）
  // --------------------------------------------------------------------
  describe('gameState が存在する場合 - PhaseDisplay', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedStore.mockImplementation((selector: any) => selector({ gameState: mockGameState }));
    });

    it('3. phase-display クラスの要素が描画される', () => {
      const { container } = render(<GameBoard />);
      expect(container.querySelector('.phase-display')).not.toBeNull();
    });

    it('4. 「ゲームが開始されていません」は表示されない', () => {
      render(<GameBoard />);
      expect(screen.queryByText('ゲームが開始されていません')).toBeNull();
    });
  });

  // --------------------------------------------------------------------
  // 3. NationPanel の描画（配列アクセス）
  // --------------------------------------------------------------------
  describe('gameState が存在する場合 - NationPanel', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedStore.mockImplementation((selector: any) => selector({ gameState: mockGameState }));
    });

    it('5. nations の数だけ nation-panel クラスの要素が描画される', () => {
      const { container } = render(<GameBoard />);
      const panels = container.querySelectorAll('.nation-panel');
      expect(panels).toHaveLength(mockGameState.nations.length);
    });

    it('6. 各国家の名前が表示される', () => {
      render(<GameBoard />);
      expect(screen.getByText('帝国')).toBeInTheDocument();
      expect(screen.getByText('連邦')).toBeInTheDocument();
    });

    it('7. 現在手番（currentTurnPlayer=0）の国家パネルに current-turn クラスが付与される', () => {
      const { container } = render(<GameBoard />);
      const currentTurnPanel = container.querySelector('.nation-panel.current-turn');
      expect(currentTurnPanel).not.toBeNull();
      expect(currentTurnPanel?.textContent).toContain('帝国');
    });

    it('8. nations が空配列の場合、nation-panel クラスの要素が描画されない', () => {
      const emptyNationsState: GameState = { ...mockGameState, nations: [] };
      mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
        selector({ gameState: emptyNationsState })
      );

      const { container } = render(<GameBoard />);
      const panels = container.querySelectorAll('.nation-panel');
      expect(panels).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // TC-GB-GY: Graveyard統合
  // タスク3-6-2: GameBoardへのGraveyard統合
  // -----------------------------------------------------------------------
  describe('TC-GB-GY: Graveyard統合', () => {
    // --------------------------------------------------------------------
    // TC-GB-GY-1: Graveyardコンポーネントの存在確認
    // --------------------------------------------------------------------
    describe('TC-GB-GY-1: Graveyardコンポーネントの存在確認', () => {
      it('TC-GB-GY-1-1: 単一国家でGraveyardが表示される', () => {
        // 2体の墓地ユニットで検証
        const nationWithGraveyard = createNationWithGraveyard(mockNation1, 2);
        const stateWithGraveyard: GameState = {
          ...mockGameState,
          nations: [nationWithGraveyard],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWithGraveyard })
        );

        const { container } = render(<GameBoard />);
        const graveyards = container.querySelectorAll('.graveyard');
        expect(graveyards).toHaveLength(1);
      });

      it('TC-GB-GY-1-2: 複数国家でそれぞれGraveyardが表示される', () => {
        // 2国家に異なる数の墓地ユニット（1体と2体）で検証
        const nation1WithGraveyard = createNationWithGraveyard(mockNation1, 1);
        const nation2WithGraveyard = createNationWithGraveyard(mockNation2, 2);
        const stateWithMultipleGraveyards: GameState = {
          ...mockGameState,
          nations: [nation1WithGraveyard, nation2WithGraveyard],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWithMultipleGraveyards })
        );

        const { container } = render(<GameBoard />);
        const graveyards = container.querySelectorAll('.graveyard');
        expect(graveyards).toHaveLength(2);
      });

      it('TC-GB-GY-1-3: 墓地が空でもGraveyardが表示される', () => {
        // 空の墓地で検証
        const nationWithEmptyGraveyard = createNationWithGraveyard(mockNation1, 0);
        const stateWithEmptyGraveyard: GameState = {
          ...mockGameState,
          nations: [nationWithEmptyGraveyard],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWithEmptyGraveyard })
        );

        render(<GameBoard />);
        const graveyardContainer = screen.getByTestId('graveyard-container');
        expect(graveyardContainer).toBeInTheDocument();
        expect(screen.getByTestId('graveyard-empty-message')).toBeInTheDocument();
      });
    });

    // --------------------------------------------------------------------
    // TC-GB-GY-2: Props渡しの検証
    // --------------------------------------------------------------------
    describe('TC-GB-GY-2: Props渡しの検証', () => {
      it('TC-GB-GY-2-1: 国家名が正しく渡される', () => {
        // カスタム国家名で検証
        const testNation: Nation = {
          ...mockNation1,
          name: 'テスト王国',
          graveyard: [],
        };
        const stateWithTestNation: GameState = {
          ...mockGameState,
          nations: [testNation],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWithTestNation })
        );

        render(<GameBoard />);
        const title = screen.getByTestId('graveyard-title');
        expect(title).toHaveTextContent('テスト王国の墓地');
      });

      it('TC-GB-GY-2-2: 墓地ユニット数が正しく表示される', () => {
        // 3体の墓地ユニットで検証
        const nationWith3Graveyard = createNationWithGraveyard(mockNation1, 3);
        const stateWith3Graveyard: GameState = {
          ...mockGameState,
          nations: [nationWith3Graveyard],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWith3Graveyard })
        );

        render(<GameBoard />);
        const count = screen.getByTestId('graveyard-count');
        expect(count).toHaveTextContent('(3)');
      });

      it('TC-GB-GY-2-3: 複数国家で異なる墓地内容が表示される', () => {
        // 2国家に異なる墓地数（1体と2体）で検証
        const nation1WithGraveyard = createNationWithGraveyard(mockNation1, 1);
        const nation2WithGraveyard = createNationWithGraveyard(mockNation2, 2);
        const stateWithDifferentGraveyards: GameState = {
          ...mockGameState,
          nations: [nation1WithGraveyard, nation2WithGraveyard],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWithDifferentGraveyards })
        );

        render(<GameBoard />);
        const titles = screen.getAllByTestId('graveyard-title');
        expect(titles).toHaveLength(2);
        expect(titles[0]).toHaveTextContent('帝国の墓地');
        expect(titles[1]).toHaveTextContent('連邦の墓地');

        const counts = screen.getAllByTestId('graveyard-count');
        expect(counts).toHaveLength(2);
        expect(counts[0]).toHaveTextContent('(1)');
        expect(counts[1]).toHaveTextContent('(2)');
      });
    });

    // --------------------------------------------------------------------
    // TC-GB-GY-3: 配置位置の検証
    // --------------------------------------------------------------------
    describe('TC-GB-GY-3: 配置位置の検証', () => {
      it('TC-GB-GY-3-1: nation-section内に配置される', () => {
        // nation-section内の配置を検証
        const nationWithGraveyard = createNationWithGraveyard(mockNation1, 0);
        const stateWithGraveyard: GameState = {
          ...mockGameState,
          nations: [nationWithGraveyard],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWithGraveyard })
        );

        const { container } = render(<GameBoard />);
        const nationSection = container.querySelector('.nation-section');
        expect(nationSection).not.toBeNull();

        const graveyardInSection = nationSection?.querySelector('.graveyard');
        expect(graveyardInSection).not.toBeNull();
      });

      it('TC-GB-GY-3-2: BattleAreaの後に配置される', () => {
        // BattleAreaの直後の配置を検証
        const nationWithGraveyard = createNationWithGraveyard(mockNation1, 0);
        const stateWithGraveyard: GameState = {
          ...mockGameState,
          nations: [nationWithGraveyard],
        };

        mockedStore.mockImplementation((selector: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          selector({ gameState: stateWithGraveyard })
        );

        const { container } = render(<GameBoard />);
        const battleArea = container.querySelector('.battle-area');
        expect(battleArea).not.toBeNull();

        const nextSibling = battleArea?.nextElementSibling;
        expect(nextSibling).not.toBeNull();
        expect(nextSibling?.classList.contains('graveyard')).toBe(true);
      });
    });
  });
});
