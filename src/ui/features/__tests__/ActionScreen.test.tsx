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
import {
  createMockUnit as createFixtureUnit,
  createMockNation as createFixtureNation,
  createMockGameState as createFixtureGameState,
} from '@ui/__tests__/fixtures';

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

// -----------------------------------------------------------------------
// テストデータヘルパー（共有フィクスチャベース）
// -----------------------------------------------------------------------

/** テスト用ユニットを生成するファクトリ */
const createMockUnit = (
  name: string,
  ownerNationId: string,
  overrides: Partial<Unit> = {}
): Unit => createFixtureUnit({
  ownerNationId,
  name,
  unitId: `${ownerNationId}-infantry`,
  ...overrides,
});

/** テスト用国家を生成するファクトリ */
const createMockNation = (nationId: string, overrides: Partial<Nation> = {}): Nation =>
  createFixtureNation({
    nationId,
    name: `国家_${nationId}`,
    ...overrides,
  });

/**
 * テスト用 GameState を生成するヘルパー関数
 */
const createMockGameState = (overrides: Partial<GameState> = {}): GameState =>
  createFixtureGameState({
    currentRound: 2,
    currentPhase: GamePhase.ACTION,
    ...overrides,
  });

/** テスト用にGameStateストアを指定の gameState で初期化するヘルパー */
const mockStoreWith = (gameState: GameState | null): void => {
  useGameStateStore.setState({ gameState });
};

/** テスト用にUIStateストアを指定の animationQueue で初期化するヘルパー */
const mockUIStoreWith = (state: { animationQueue: AnimationQueueItem[] }): void => {
  useUIStateStore.setState(state);
};

// -----------------------------------------------------------------------
// ActionScreen テスト
// -----------------------------------------------------------------------

describe('ActionScreen', () => {
  beforeEach(() => {
    useGameStateStore.setState({ gameState: null });
    useUIStateStore.setState({ animationQueue: [] });
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
              commandTarget: 'nation_b',
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
              commandTarget: 'nation_b',
            },
          },
          {
            eventType: GameEvent.COMMAND_EXECUTE,
            data: {
              commandName: '諜報活動',
              commandType: 'INTELLIGENCE',
              commandTarget: 'nation_c',
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
