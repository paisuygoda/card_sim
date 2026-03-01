import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from '../GameBoard';
import { GamePhase } from '@core/domain/models';
import type { GameState, Nation } from '@core/domain/models';
import { useGameStateStore } from '@store/useGameStateStore';
import {
  createMockNation,
  createMockNPCNation,
  createMockGameState,
  createMockGraveyardUnit,
} from '@ui/__tests__/fixtures';

/**
 * GameBoard コンポーネント テスト
 *
 * テスト対象のロジック：
 *  1. gameState が null のとき「ゲームが開始されていません」を表示する null 分岐
 *  2. gameState が存在するとき PhaseDisplay を描画する props マッピング
 *  3. gameState.nations の各国家ごとに NationPanel を描画する配列アクセス
 *
 * GameBoard は useGameStateStore でストアからデータを取得するため、
 * 実ストアの setState でテストデータを設定する。
 */

// -----------------------------------------------------------------------
// テストデータ（共有フィクスチャ使用）
// -----------------------------------------------------------------------

const mockNation1: Nation = createMockNation({
  nationId: 'nation1',
  name: '帝国',
  power: 100,
  remainingActions: 3,
});

const mockNation2: Nation = createMockNPCNation({
  nationId: 'nation2',
  name: '連邦',
  power: 80,
  remainingActions: 2,
});

const mockGameState: GameState = createMockGameState({
  currentRound: 2,
  roundLimit: 5,
  nations: [mockNation1, mockNation2],
  currentPhase: GamePhase.DOMESTIC,
});

// -----------------------------------------------------------------------
// テストヘルパー: 墓地ユニット生成
// -----------------------------------------------------------------------

const createGraveyardUnits = (count: number, ownerNationId: string = 'nation1') =>
  Array.from({ length: count }, (_, i) => createMockGraveyardUnit(i + 1, { ownerNationId }));

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
    useGameStateStore.setState({ gameState: null });
  });

  // --------------------------------------------------------------------
  // 1. null 分岐
  // --------------------------------------------------------------------
  describe('gameState が null の場合', () => {
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
      useGameStateStore.setState({ gameState: mockGameState });
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
      useGameStateStore.setState({ gameState: mockGameState });
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
      useGameStateStore.setState({ gameState: emptyNationsState });

      const { container } = render(<GameBoard />);
      const panels = container.querySelectorAll('.nation-panel');
      expect(panels).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // TC-GB-GY: Graveyard統合
  // -----------------------------------------------------------------------
  describe('TC-GB-GY: Graveyard統合', () => {
    describe('TC-GB-GY-1: Graveyardコンポーネントの存在確認', () => {
      it('TC-GB-GY-1-1: 単一国家でGraveyardが表示される', () => {
        const nationWithGraveyard = createNationWithGraveyard(mockNation1, 2);
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [nationWithGraveyard] },
        });

        const { container } = render(<GameBoard />);
        const graveyards = container.querySelectorAll('.graveyard');
        expect(graveyards).toHaveLength(1);
      });

      it('TC-GB-GY-1-2: 複数国家でそれぞれGraveyardが表示される', () => {
        const nation1WithGraveyard = createNationWithGraveyard(mockNation1, 1);
        const nation2WithGraveyard = createNationWithGraveyard(mockNation2, 2);
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [nation1WithGraveyard, nation2WithGraveyard] },
        });

        const { container } = render(<GameBoard />);
        const graveyards = container.querySelectorAll('.graveyard');
        expect(graveyards).toHaveLength(2);
      });

      it('TC-GB-GY-1-3: 墓地が空でもGraveyardが表示される', () => {
        const nationWithEmptyGraveyard = createNationWithGraveyard(mockNation1, 0);
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [nationWithEmptyGraveyard] },
        });

        render(<GameBoard />);
        const graveyardContainer = screen.getByTestId('graveyard-container');
        expect(graveyardContainer).toBeInTheDocument();
        expect(screen.getByTestId('graveyard-empty-message')).toBeInTheDocument();
      });
    });

    describe('TC-GB-GY-2: Props渡しの検証', () => {
      it('TC-GB-GY-2-1: 国家名が正しく渡される', () => {
        const testNation: Nation = {
          ...mockNation1,
          name: 'テスト王国',
          graveyard: [],
        };
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [testNation] },
        });

        render(<GameBoard />);
        const title = screen.getByTestId('graveyard-title');
        expect(title).toHaveTextContent('テスト王国の墓地');
      });

      it('TC-GB-GY-2-2: 墓地ユニット数が正しく表示される', () => {
        const nationWith3Graveyard = createNationWithGraveyard(mockNation1, 3);
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [nationWith3Graveyard] },
        });

        render(<GameBoard />);
        const count = screen.getByTestId('graveyard-count');
        expect(count).toHaveTextContent('(3)');
      });

      it('TC-GB-GY-2-3: 複数国家で異なる墓地内容が表示される', () => {
        const nation1WithGraveyard = createNationWithGraveyard(mockNation1, 1);
        const nation2WithGraveyard = createNationWithGraveyard(mockNation2, 2);
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [nation1WithGraveyard, nation2WithGraveyard] },
        });

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

    describe('TC-GB-GY-3: 配置位置の検証', () => {
      it('TC-GB-GY-3-1: nation-section内に配置される', () => {
        const nationWithGraveyard = createNationWithGraveyard(mockNation1, 0);
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [nationWithGraveyard] },
        });

        const { container } = render(<GameBoard />);
        const nationSection = container.querySelector('.nation-section');
        expect(nationSection).not.toBeNull();

        const graveyardInSection = nationSection?.querySelector('.graveyard');
        expect(graveyardInSection).not.toBeNull();
      });

      it('TC-GB-GY-3-2: BattleAreaの後に配置される', () => {
        const nationWithGraveyard = createNationWithGraveyard(mockNation1, 0);
        useGameStateStore.setState({
          gameState: { ...mockGameState, nations: [nationWithGraveyard] },
        });

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
