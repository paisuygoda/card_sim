import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BattleScreen } from '../BattleScreen';
import { useGameStateStore } from '@store/useGameStateStore';
import type { Nation } from '@core/domain/models/Nation';
import type { Unit } from '@core/domain/models/Unit';
import type { BattleContext } from '@core/domain/models/BattleContext';
import type { GameState } from '@core/domain/models/GameState';
import { GamePhase } from '@core/domain/models/GamePhase';
import {
  createMockUnit as createFixtureUnit,
  createMockNation as createFixtureNation,
  createMockBattleContext as createFixtureBattleContext,
  createMockGameState,
  createMockGraveyardUnit,
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

/** テスト用 BattleContext を生成するファクトリ */
const createMockBattleContext = (overrides: Partial<BattleContext> = {}): BattleContext =>
  createFixtureBattleContext(overrides);

/**
 * 戦闘中の GameState モックを生成するヘルパー関数
 */
const createMockGameStateWithBattle = (
  battleContext: BattleContext | null,
  nations: Nation[] = []
): GameState => createMockGameState({
  currentRound: 2,
  nations,
  currentPhase: GamePhase.BATTLE_START,
  battleContext,
});

/** テスト用にストアを指定の gameState で初期化するヘルパー */
const mockStoreWith = (gameState: GameState): void => {
  useGameStateStore.setState({ gameState });
};

// -----------------------------------------------------------------------
// BattleScreen テスト
// -----------------------------------------------------------------------

describe('BattleScreen', () => {
  beforeEach(() => {
    useGameStateStore.setState({ gameState: null });
  });

  // -----------------------------------------------------------------------
  // T1: battleContext null 時の表示
  // -----------------------------------------------------------------------
  describe('T1: battleContextがnullの場合の表示', () => {
    it('battleContextがnullの場合、battle-screenが表示されないかローディング表示になる', () => {
      const gameStateWithoutBattle = createMockGameStateWithBattle(null);
      mockStoreWith(gameStateWithoutBattle);

      render(<BattleScreen />);

      // battleContextがnullのため攻撃側・防御側エリアがレンダリングされない
      // 要素の「不在」を検証するため、不在時に例外をスローするgetByTestIdではなく
      // 見つからない場合にnullを返すqueryByTestIdを使用する
      expect(screen.queryByTestId('attacker-side')).not.toBeInTheDocument();
      expect(screen.queryByTestId('defender-side')).not.toBeInTheDocument();

      // battle-screen コンテナが存在する場合も、内部に攻撃側・防御側コンテンツを持たない
      const battleScreen = screen.queryByTestId('battle-screen');
      if (battleScreen !== null) {
        expect(within(battleScreen).queryByTestId('attacker-side')).not.toBeInTheDocument();
        expect(within(battleScreen).queryByTestId('defender-side')).not.toBeInTheDocument();
      }
    });
  });

  // -----------------------------------------------------------------------
  // T2: 攻撃側・防御側エリアの表示
  // -----------------------------------------------------------------------
  describe('T2: 攻撃側・防御側エリアの表示', () => {
    it('battleContextが設定されている場合、攻撃側と防御側のエリアが表示される', () => {
      const attackerNation = createMockNation('nation_a', { name: '攻撃国' });
      const defenderNation = createMockNation('nation_b', { name: '防御国' });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      // data-testid="attacker-side" と data-testid="defender-side" が存在する
      expect(screen.getByTestId('attacker-side')).toBeInTheDocument();
      expect(screen.getByTestId('defender-side')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // T3: 攻撃側ユニットの表示
  // -----------------------------------------------------------------------
  describe('T3: 攻撃側ユニットの表示', () => {
    it('攻撃側エリアに攻撃側国家のユニットが表示される', () => {
      const attackerUnit = createMockUnit('攻撃歩兵', 'nation_a');
      const attackerNation = createMockNation('nation_a', {
        name: '攻撃国',
        units: [attackerUnit, null, null, null, null, null, null, null],
      });
      const defenderNation = createMockNation('nation_b', { name: '防御国' });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      // attacker-side の中に攻撃側ユニット名が表示されている
      const attackerSide = screen.getByTestId('attacker-side');
      expect(attackerSide).toBeInTheDocument();
      expect(within(attackerSide).getByText('攻撃歩兵')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // T4: 防御側ユニットの表示
  // -----------------------------------------------------------------------
  describe('T4: 防御側ユニットの表示', () => {
    it('防御側エリアに防御側国家のユニットが表示される', () => {
      const defenderUnit = createMockUnit('防御弓兵', 'nation_b');
      const attackerNation = createMockNation('nation_a', { name: '攻撃国' });
      const defenderNation = createMockNation('nation_b', {
        name: '防御国',
        units: [defenderUnit, null, null, null, null, null, null, null],
      });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      // defender-side の中に防御側ユニット名が表示されている
      const defenderSide = screen.getByTestId('defender-side');
      expect(defenderSide).toBeInTheDocument();
      expect(within(defenderSide).getByText('防御弓兵')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // T5: 現在攻撃者のハイライト
  // -----------------------------------------------------------------------
  describe('T5: 現在攻撃者のハイライト', () => {
    it('currentAttackerが設定されている場合、該当ユニットがハイライトされる', () => {
      const attackerUnit = createMockUnit('攻撃歩兵', 'nation_a');
      const attackerNation = createMockNation('nation_a', {
        name: '攻撃国',
        units: [attackerUnit, null, null, null, null, null, null, null],
      });
      const defenderNation = createMockNation('nation_b', { name: '防御国' });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
        currentAttacker: attackerUnit,
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      // data-testid="current-attacker" が 1 つだけ存在する
      const highlightedElements = screen.getAllByTestId('current-attacker');
      expect(highlightedElements).toHaveLength(1);
      expect(highlightedElements[0]).toHaveAttribute('data-unitid', attackerUnit.unitId);
    });
  });

  // -----------------------------------------------------------------------
  // T6: 攻撃者なし時のハイライトなし
  // -----------------------------------------------------------------------
  describe('T6: currentAttackerがundefinedの場合のハイライトなし', () => {
    it('currentAttackerがundefinedの場合、ハイライトされるユニットは存在しない', () => {
      const attackerUnit = createMockUnit('攻撃歩兵', 'nation_a');
      const attackerNation = createMockNation('nation_a', {
        name: '攻撃国',
        units: [attackerUnit, null, null, null, null, null, null, null],
      });
      const defenderNation = createMockNation('nation_b', { name: '防御国' });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
        currentAttacker: undefined,
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      // 前提：攻撃側エリアとユニットが表示されていること（コンポーネントが正常動作していることを確認）
      // この前提がないと、実装が空の場合でも誤ってパスしてしまう（false positive）
      const attackerSide = screen.getByTestId('attacker-side');
      expect(within(attackerSide).getByText('攻撃歩兵')).toBeInTheDocument();

      // ハイライト要素は 0 件
      const highlightedElements = screen.queryAllByTestId('current-attacker');
      expect(highlightedElements).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // T7: Graveyard 表示
  // -----------------------------------------------------------------------
  describe('T7: 墓地の表示', () => {
    it('TC-BS-GY-1: 攻撃側に墓地ユニットがある場合、attacker-side内にGraveyardが表示される', () => {
      const graveyardUnit = createMockGraveyardUnit(0, { ownerNationId: 'nation_a' });
      const attackerNation = createMockNation('nation_a', {
        name: '攻撃国',
        graveyard: [graveyardUnit],
      });
      const defenderNation = createMockNation('nation_b', { name: '防御国' });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      const attackerSide = screen.getByTestId('attacker-side');
      const graveyard = within(attackerSide).getByTestId('graveyard-container');
      expect(graveyard).toBeInTheDocument();
    });

    it('TC-BS-GY-2: 墓地が空の場合でもGraveyardが表示される', () => {
      const attackerNation = createMockNation('nation_a', {
        name: '攻撃国',
        graveyard: [],
      });
      const defenderNation = createMockNation('nation_b', {
        name: '防御国',
        graveyard: [],
      });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      const graveyards = screen.getAllByTestId('graveyard-container');
      expect(graveyards).toHaveLength(2);
    });

    it('TC-BS-GY-3: 国家名が正しく墓地タイトルに表示される', () => {
      const attackerNation = createMockNation('nation_a', {
        name: '攻撃国',
        graveyard: [],
      });
      const defenderNation = createMockNation('nation_b', {
        name: '防御国',
        graveyard: [],
      });
      const battleContext = createMockBattleContext({
        attackerNationId: 'nation_a',
        defenderNationId: 'nation_b',
      });
      const gameState = createMockGameStateWithBattle(battleContext, [
        attackerNation,
        defenderNation,
      ]);
      mockStoreWith(gameState);

      render(<BattleScreen />);

      const titles = screen.getAllByTestId('graveyard-title');
      expect(titles[0]).toHaveTextContent('攻撃国の墓地');
      expect(titles[1]).toHaveTextContent('防御国の墓地');
    });
  });
});
