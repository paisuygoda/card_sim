import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from '../GameBoard';
import { GamePhase } from '@core/domain/models';
import type { GameState, Nation } from '@core/domain/models';

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
};

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
});
