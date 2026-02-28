import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ActionScreen } from '../ActionScreen';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import type { Nation } from '@core/domain/models/Nation';
import type { Unit } from '@core/domain/models/Unit';
import type { GameState } from '@core/domain/models/GameState';
import { GamePhase } from '@core/domain/models/GamePhase';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import type { AnimationQueueItem } from '@store/useUIStateStore';

// -----------------------------------------------------------------------
// モック設定
// -----------------------------------------------------------------------

/**
 * MasterData をモック
 * UnitCard が MasterData.getSkill を使用するため、テスト実行時にクラッシュしないよう差し替える
 */
vi.mock('@core/domain/master', () => ({
  MasterData: {
    getSkill: vi.fn((id: string) => ({
      skillId: id,
      name: `スキル(${id})`,
    })),
    getUnit: vi.fn((baseUnitId: string, ownerNationId: string) => ({
      baseUnitId,
      unitId: `${ownerNationId}-${baseUnitId}`,
      ownerNationId,
      name: baseUnitId,
      maxHP: 100,
      currentHP: 100,
      attack: 50,
      skillId: 'normalAttack',
      states: [],
    })),
    getStage: vi.fn((stageId: number) => ({
      stageId,
      stageName: `ステージ${stageId}`,
      powerWinThreshold: 1000,
    })),
  },
}));

/**
 * useGameStateStore をモック
 * 各テストで vi.mocked(...).mockImplementation() を使ってストア状態を差し替える
 */
vi.mock('@store/useGameStateStore', () => ({
  useGameStateStore: vi.fn(),
}));

/**
 * useUIStateStore をモック
 * 各テストで vi.mocked(...).mockImplementation() を使ってストア状態を差し替える
 */
vi.mock('@store/useUIStateStore', () => ({
  useUIStateStore: vi.fn(),
}));

// -----------------------------------------------------------------------
// テストデータヘルパー
// -----------------------------------------------------------------------

/** テスト用ユニットを生成するファクトリ */
const createMockUnit = (
  name: string,
  ownerNationId: string,
  overrides: Partial<Unit> = {}
): Unit => ({
  baseUnitId: 'infantry',
  unitId: `${ownerNationId}-infantry`,
  ownerNationId,
  name,
  maxHP: 100,
  currentHP: 100,
  attack: 50,
  skillId: 'normalAttack',
  states: [],
  ...overrides,
});

/** テスト用国家を生成するファクトリ */
const createMockNation = (nationId: string, overrides: Partial<Nation> = {}): Nation => ({
  nationId,
  name: `国家_${nationId}`,
  isNPC: false,
  power: 500,
  remainingActions: 2,
  states: [],
  units: [null, null, null, null, null, null, null, null],
  graveyard: [],
  domesticCommands: [],
  actionCommands: [],
  targetMilitaryRatio: 0.5,
  aggressiveness: 0.5,
  hostileNationIds: [],
  ...overrides,
});

/**
 * テスト用 GameState を生成するヘルパー関数
 */
const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  stageId: 1,
  commandNum: 3,
  currentRound: 2,
  roundLimit: 10,
  nations: [],
  currentTurnPlayer: 0,
  currentPhase: GamePhase.ACTION,
  currentTarget: null,
  stateQueue: [],
  effectQueue: [],
  battleContext: null,
  ...overrides,
});

/** テスト用にGameStateストアを指定の gameState で初期化するヘルパー */
const mockStoreWith = (gameState: GameState | null): void => {
  vi.mocked(useGameStateStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: (state: any) => any) => selector({ gameState })
  );
};

/** テスト用にUIStateストアを指定の animationQueue で初期化するヘルパー */
const mockUIStoreWith = (state: { animationQueue: AnimationQueueItem[] }): void => {
  vi.mocked(useUIStateStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: (s: any) => any) => selector(state)
  );
};

// -----------------------------------------------------------------------
// ActionScreen テスト
// -----------------------------------------------------------------------

describe('ActionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Test 1: gameStateがnullの場合、何も表示しない
  // -----------------------------------------------------------------------
  describe('Test 1: gameStateがnullの場合、何も表示しない', () => {
    it('gameStateがnullの場合、何も表示しない', () => {
      mockStoreWith(null);
      mockUIStoreWith({ animationQueue: [] });

      render(<ActionScreen />);

      // action-screen が表示されない
      expect(screen.queryByTestId('action-screen')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Test 2: 全国家が表示される
  // -----------------------------------------------------------------------
  describe('Test 2: 全国家が表示される', () => {
    it('全国家が表示される', () => {
      const nationA = createMockNation('nation_a', { name: '国家A' });
      const nationB = createMockNation('nation_b', { name: '国家B' });
      const nationC = createMockNation('nation_c', { name: '国家C' });
      const gameState = createMockGameState({
        nations: [nationA, nationB, nationC],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({ animationQueue: [] });

      render(<ActionScreen />);

      expect(screen.getByTestId('action-screen')).toBeInTheDocument();
      const sectionA = screen.getByTestId('nation-section-nation_a');
      const sectionB = screen.getByTestId('nation-section-nation_b');
      const sectionC = screen.getByTestId('nation-section-nation_c');
      expect(sectionA).toBeInTheDocument();
      expect(sectionB).toBeInTheDocument();
      expect(sectionC).toBeInTheDocument();
      // 各セクション内のh3に国家名が表示される
      expect(within(sectionA).getByRole('heading', { level: 3, name: '国家A' })).toBeInTheDocument();
      expect(within(sectionB).getByRole('heading', { level: 3, name: '国家B' })).toBeInTheDocument();
      expect(within(sectionC).getByRole('heading', { level: 3, name: '国家C' })).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Test 3: NationPanelとBattleAreaが各国家に表示される
  // -----------------------------------------------------------------------
  describe('Test 3: NationPanelとBattleAreaが各国家に表示される', () => {
    it('NationPanelとBattleAreaが各国家に表示される', () => {
      const unit = createMockUnit('歩兵隊', 'nation_a');
      const nationA = createMockNation('nation_a', {
        name: '国家A',
        units: [unit, null, null, null, null, null, null, null],
      });
      const gameState = createMockGameState({
        nations: [nationA],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({ animationQueue: [] });

      render(<ActionScreen />);

      const nationSection = screen.getByTestId('nation-section-nation_a');
      // BattleAreaにユニットが表示される
      expect(within(nationSection).getByText('歩兵隊')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Test 4: ターゲット国家にhighlightedクラスが付与される
  // -----------------------------------------------------------------------
  describe('Test 4: ターゲット国家にhighlightedクラスが付与される', () => {
    it('ターゲット国家にhighlightedクラスが付与される', () => {
      const nationA = createMockNation('nation_a', { name: '国家A' });
      const nationB = createMockNation('nation_b', { name: '国家B' });
      const gameState = createMockGameState({
        nations: [nationA, nationB],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({
        animationQueue: [
          {
            eventType: GameEvent.COMMAND_EXECUTE,
            data: {
              commandName: '外交工作',
              commandType: 'DIPLOMACY',
              commandTarget: '国家B',
            },
          },
        ],
      });

      render(<ActionScreen />);

      const sectionA = screen.getByTestId('nation-section-nation_a');
      const sectionB = screen.getByTestId('nation-section-nation_b');

      expect(sectionA).not.toHaveClass('highlighted');
      expect(sectionB).toHaveClass('highlighted');
    });
  });

  // -----------------------------------------------------------------------
  // Test 5: animationQueueが空の場合、ハイライトなし
  // -----------------------------------------------------------------------
  describe('Test 5: animationQueueが空の場合、ハイライトなし', () => {
    it('animationQueueが空の場合、ハイライトなし', () => {
      const nationA = createMockNation('nation_a', { name: '国家A' });
      const nationB = createMockNation('nation_b', { name: '国家B' });
      const gameState = createMockGameState({
        nations: [nationA, nationB],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({ animationQueue: [] });

      render(<ActionScreen />);

      const sectionA = screen.getByTestId('nation-section-nation_a');
      const sectionB = screen.getByTestId('nation-section-nation_b');

      expect(sectionA).not.toHaveClass('highlighted');
      expect(sectionB).not.toHaveClass('highlighted');
    });
  });

  // -----------------------------------------------------------------------
  // Test 6: COMMAND_EXECUTEイベント以外は無視される
  // -----------------------------------------------------------------------
  describe('Test 6: COMMAND_EXECUTEイベント以外は無視される', () => {
    it('COMMAND_EXECUTEイベント以外は無視される', () => {
      const nationA = createMockNation('nation_a', { name: '国家A' });
      const gameState = createMockGameState({
        nations: [nationA],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({
        animationQueue: [
          {
            eventType: GameEvent.UNIT_DAMAGE,
            data: {
              targetUnitId: 'nation_a-infantry',
              amount: 30,
            },
          },
        ],
      });

      render(<ActionScreen />);

      const sectionA = screen.getByTestId('nation-section-nation_a');
      expect(sectionA).not.toHaveClass('highlighted');
    });
  });

  // -----------------------------------------------------------------------
  // Test 7: 複数のCOMMAND_EXECUTEイベントがある場合、最初のものを使用
  // -----------------------------------------------------------------------
  describe('Test 7: 複数のCOMMAND_EXECUTEイベントがある場合、最初のものを使用', () => {
    it('複数のCOMMAND_EXECUTEイベントがある場合、最初のものを使用', () => {
      const nationA = createMockNation('nation_a', { name: '国家A' });
      const nationB = createMockNation('nation_b', { name: '国家B' });
      const nationC = createMockNation('nation_c', { name: '国家C' });
      const gameState = createMockGameState({
        nations: [nationA, nationB, nationC],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({
        animationQueue: [
          {
            eventType: GameEvent.COMMAND_EXECUTE,
            data: {
              commandName: '外交工作',
              commandType: 'DIPLOMACY',
              commandTarget: '国家B',
            },
          },
          {
            eventType: GameEvent.COMMAND_EXECUTE,
            data: {
              commandName: '諜報活動',
              commandType: 'INTELLIGENCE',
              commandTarget: '国家C',
            },
          },
        ],
      });

      render(<ActionScreen />);

      const sectionA = screen.getByTestId('nation-section-nation_a');
      const sectionB = screen.getByTestId('nation-section-nation_b');
      const sectionC = screen.getByTestId('nation-section-nation_c');

      expect(sectionA).not.toHaveClass('highlighted');
      expect(sectionB).toHaveClass('highlighted');
      expect(sectionC).not.toHaveClass('highlighted');
    });
  });

  // -----------------------------------------------------------------------
  // Test 8: commandTargetがundefinedの場合、ハイライトなし
  // -----------------------------------------------------------------------
  describe('Test 8: commandTargetがundefinedの場合、ハイライトなし', () => {
    it('commandTargetがundefinedの場合、ハイライトなし', () => {
      const nationA = createMockNation('nation_a', { name: '国家A' });
      const gameState = createMockGameState({
        nations: [nationA],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({
        animationQueue: [
          {
            eventType: GameEvent.COMMAND_EXECUTE,
            data: {
              commandName: '内政強化',
              commandType: 'DOMESTIC',
            },
          },
        ],
      });

      render(<ActionScreen />);

      const sectionA = screen.getByTestId('nation-section-nation_a');
      expect(sectionA).not.toHaveClass('highlighted');
    });
  });

  // -----------------------------------------------------------------------
  // Test 9: commandTargetが国家名と一致しない場合、ハイライトなし
  // -----------------------------------------------------------------------
  describe('Test 9: commandTargetが国家名と一致しない場合、ハイライトなし', () => {
    it('commandTargetが国家名と一致しない場合、ハイライトなし', () => {
      const nationA = createMockNation('nation_a', { name: '国家A' });
      const nationB = createMockNation('nation_b', { name: '国家B' });
      const gameState = createMockGameState({
        nations: [nationA, nationB],
      });
      mockStoreWith(gameState);
      mockUIStoreWith({
        animationQueue: [
          {
            eventType: GameEvent.COMMAND_EXECUTE,
            data: {
              commandName: '外交工作',
              commandType: 'DIPLOMACY',
              commandTarget: '存在しない国家',
            },
          },
        ],
      });

      render(<ActionScreen />);

      const sectionA = screen.getByTestId('nation-section-nation_a');
      const sectionB = screen.getByTestId('nation-section-nation_b');

      expect(sectionA).not.toHaveClass('highlighted');
      expect(sectionB).not.toHaveClass('highlighted');
    });
  });
});
