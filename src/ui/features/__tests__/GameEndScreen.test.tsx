import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameEndScreen } from '../GameEndScreen';
import { useGameStateStore } from '@store/useGameStateStore';
import { createMockNation, createMockNPCNation, createMockGameState } from '@ui/__tests__/fixtures';

/**
 * GameEndScreen テスト
 *
 * S-4リファクタリング: 勝者判定ロジックを GameManager 側に移設し、
 * GameState.finalRanking を参照するように変更
 */
describe('GameEndScreen', () => {
  // -----------------------------------------------------------------------
  // 1. gameState が null の場合
  // -----------------------------------------------------------------------
  describe('gameState が null の場合', () => {
    it('1. gameState が null のとき何もレンダリングされない', () => {
      useGameStateStore.setState({ gameState: null });
      const { container } = render(<GameEndScreen />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  // -----------------------------------------------------------------------
  // 2. finalRanking が設定されている場合（正常系）
  // -----------------------------------------------------------------------
  describe('finalRanking が GameState に設定されている場合', () => {
    const player = createMockNation({
      nationId: 'player',
      name: 'プレイヤー国家',
      power: 500,
    });
    const npc1 = createMockNPCNation({
      nationId: 'npc1',
      name: 'NPC国家A',
      power: 300,
    });
    const npc2 = createMockNPCNation({
      nationId: 'npc2',
      name: 'NPC国家B',
      power: 100,
    });

    beforeEach(() => {
      // finalRanking は GameManager が降順でセットする
      useGameStateStore.setState({
        gameState: createMockGameState({
          nations: [player, npc1, npc2],
          finalRanking: [player, npc1, npc2],
        }),
      });
    });

    it('2a. ゲーム終了画面が表示される', () => {
      render(<GameEndScreen />);
      expect(screen.getByTestId('game-end-screen')).toBeInTheDocument();
    });

    it('2b. finalRanking[0] の国家が勝者として表示される', () => {
      render(<GameEndScreen />);
      expect(screen.getByText('勝者: プレイヤー国家')).toBeInTheDocument();
    });

    it('2c. finalRanking の全国家が順位付きで表示される', () => {
      render(<GameEndScreen />);
      expect(screen.getByText(/1位.*プレイヤー国家/)).toBeInTheDocument();
      expect(screen.getByText(/2位.*NPC国家A/)).toBeInTheDocument();
      expect(screen.getByText(/3位.*NPC国家B/)).toBeInTheDocument();
    });

    it('2d. 各国家の国力が表示される', () => {
      render(<GameEndScreen />);
      expect(screen.getByText(/プレイヤー国家.*500/)).toBeInTheDocument();
      expect(screen.getByText(/NPC国家A.*300/)).toBeInTheDocument();
      expect(screen.getByText(/NPC国家B.*100/)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 3. finalRanking が未設定の場合（フォールバック）
  // -----------------------------------------------------------------------
  describe('finalRanking が未設定の場合（フォールバック）', () => {
    const highPowerNation = createMockNation({
      nationId: 'player',
      name: '高国力国家',
      power: 800,
    });
    const lowPowerNation = createMockNPCNation({
      nationId: 'npc1',
      name: '低国力国家',
      power: 200,
    });

    beforeEach(() => {
      // finalRanking なし（旧バージョンとの互換性確認）
      useGameStateStore.setState({
        gameState: createMockGameState({
          nations: [lowPowerNation, highPowerNation], // 意図的に逆順
          finalRanking: undefined,
        }),
      });
    });

    it('3a. finalRanking が未設定でも国力降順でフォールバック表示される', () => {
      render(<GameEndScreen />);
      expect(screen.getByText('勝者: 高国力国家')).toBeInTheDocument();
    });

    it('3b. フォールバック時も全国家が表示される', () => {
      render(<GameEndScreen />);
      expect(screen.getAllByText(/高国力国家/).length).toBeGreaterThan(0);
      expect(screen.getByText(/低国力国家/)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 4. 同国力の場合は手番順で決まる（GameManager側のロジック確認）
  // -----------------------------------------------------------------------
  describe('finalRanking が同国力の国家を含む場合', () => {
    const firstTurnNation = createMockNation({
      nationId: 'player',
      name: '先手国家',
      power: 500,
    });
    const secondTurnNation = createMockNPCNation({
      nationId: 'npc1',
      name: '後手国家',
      power: 500,
    });

    beforeEach(() => {
      // GameManager が手番順で決定した finalRanking を直接渡す
      useGameStateStore.setState({
        gameState: createMockGameState({
          nations: [firstTurnNation, secondTurnNation],
          // 同国力で GameManager が手番順（インデックス順）でソートした結果
          finalRanking: [firstTurnNation, secondTurnNation],
        }),
      });
    });

    it('4. finalRanking に従って先手国家が勝者として表示される', () => {
      render(<GameEndScreen />);
      expect(screen.getByText('勝者: 先手国家')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 5. nations が空の場合
  // -----------------------------------------------------------------------
  describe('nations が空の場合', () => {
    it('5. nations が空かつ finalRanking も空のとき何もレンダリングされない', () => {
      useGameStateStore.setState({
        gameState: createMockGameState({
          nations: [],
          finalRanking: [],
        }),
      });
      const { container } = render(<GameEndScreen />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
