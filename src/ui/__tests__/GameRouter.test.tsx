import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameManager } from '@core/application/GameManager';
import { ReactUIBridge } from '@bridge/ReactUIBridge';
import { GamePhase } from '@core/domain/models';
import { createMockGameState, createMockNation } from './fixtures';

// GameManagerをモック化
vi.mock('@core/application/GameManager', () => {
  return {
    GameManager: vi.fn().mockImplementation(function() { return {
      startGame: vi.fn().mockResolvedValue(undefined),
      getGameState: vi.fn(),
    }; }),
  };
});

// ReactUIBridgeをモック化
vi.mock('@bridge/ReactUIBridge', () => {
  return {
    ReactUIBridge: vi.fn().mockImplementation(function() { return {
      notifyGameEvent: vi.fn(),
      waitUI: vi.fn(),
      waitPlayerInput: vi.fn(),
      updateGameState: vi.fn(),
    }; }),
  };
});

/**
 * GameRouter（画面遷移）のテスト
 *
 * App.tsx 経由でレンダリングし、GamePhase に応じた画面切り替えを検証する。
 */
describe('GameRouter - 画面遷移テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ReactUIBridge as unknown as ReturnType<typeof vi.fn>).mockReset().mockImplementation(function() { return {
      notifyGameEvent: vi.fn(),
      waitUI: vi.fn(),
      waitPlayerInput: vi.fn(),
      updateGameState: vi.fn(),
    }; });
    (GameManager as unknown as ReturnType<typeof vi.fn>).mockReset().mockImplementation(function() { return {
      startGame: vi.fn().mockResolvedValue(undefined),
      getGameState: vi.fn(),
    }; });
    useGameStateStore.getState().resetGameState();
  });

  /** ステージを選択してゲーム画面に遷移するヘルパー */
  async function selectStageAndWait(gameState: ReturnType<typeof createMockGameState>) {
    const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
    GameManagerMock.mockImplementation(function() { return {
      startGame: vi.fn().mockImplementation(async () => {
        useGameStateStore.getState().setGameState(gameState);
      }),
      getGameState: vi.fn().mockReturnValue(gameState),
    }; });

    const user = userEvent.setup();
    render(<App />);
    const stageCards = screen.getAllByTestId('stage-card');
    await user.click(stageCards[0]);
  }

  describe('ステージ選択画面', () => {
    it('アプリ起動時はStageSelectScreenが表示される', () => {
      render(<App />);
      expect(screen.getByText('ステージ選択')).toBeInTheDocument();
    });

    it('ステージカードが表示される', () => {
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      expect(stageCards.length).toBeGreaterThan(0);
    });
  });

  describe('ACTIONフェーズ', () => {
    it('ACTIONフェーズでActionScreenが表示される', async () => {
      await selectStageAndWait(createMockGameState({ commandNum: 2, currentPhase: GamePhase.ACTION }));

      await waitFor(() => {
        expect(screen.getByTestId('action-screen')).toBeInTheDocument();
      });
    });

    it('ACTIONフェーズでもAnimationDisplayが表示される', async () => {
      await selectStageAndWait(createMockGameState({ commandNum: 2, currentPhase: GamePhase.ACTION }));

      await waitFor(() => {
        expect(screen.getByTestId('action-screen')).toBeInTheDocument();
        expect(screen.getByTestId('animation-display')).toBeInTheDocument();
      });
    });
  });

  describe('GAME_STARTフェーズ（デフォルト: GameBoard）', () => {
    it('GAME_STARTフェーズでGameBoardが表示される', async () => {
      await selectStageAndWait(
        createMockGameState({ commandNum: 2, currentRound: 0, currentPhase: GamePhase.GAME_START })
      );

      await waitFor(() => {
        expect(screen.getByTestId('game-board')).toBeInTheDocument();
        expect(screen.queryByTestId('action-screen')).not.toBeInTheDocument();
      });
    });
  });

  describe('BATTLE_STARTフェーズ', () => {
    it('BATTLE_STARTフェーズでBattleScreenが表示される', async () => {
      await selectStageAndWait(createMockGameState({ commandNum: 2, currentPhase: GamePhase.BATTLE_START }));

      await waitFor(() => {
        expect(screen.getByTestId('battle-screen')).toBeInTheDocument();
        expect(screen.queryByTestId('action-screen')).not.toBeInTheDocument();
      });
    });
  });

  describe('DOMESTICフェーズ（入力待ち）', () => {
    it('DOMESTICフェーズ+入力待ちでDomesticScreenが表示される', async () => {
      const mockGameState = createMockGameState({
        commandNum: 2,
        nations: [
          createMockNation({ power: 100, remainingActions: 2 }),
        ],
      });

      useUIStateStore.setState({ input: { requestType: 'COMMAND' as any, context: null, isWaiting: true } });
      await selectStageAndWait(mockGameState);

      await waitFor(() => {
        expect(screen.getByTestId('domestic-screen')).toBeInTheDocument();
        expect(screen.queryByTestId('action-screen')).not.toBeInTheDocument();
      });
    });
  });

  describe('GAME_ENDフェーズ', () => {
    it('GAME_ENDフェーズでGameEndScreenが表示される', async () => {
      await selectStageAndWait(
        createMockGameState({
          commandNum: 2,
          currentRound: 10,
          currentPhase: GamePhase.GAME_END,
          nations: [createMockNation({ power: 100, remainingActions: 2, units: [] })],
        })
      );

      await waitFor(() => {
        expect(screen.getByTestId('game-end-screen')).toBeInTheDocument();
        expect(screen.queryByTestId('action-screen')).not.toBeInTheDocument();
      });
    });
  });

  describe('gameStateがnullの場合', () => {
    it('ステージ選択前はStageSelectScreenが表示される', () => {
      render(<App />);
      expect(screen.getByText('ステージ選択')).toBeInTheDocument();
      expect(screen.queryByTestId('action-screen')).not.toBeInTheDocument();
    });
  });

  describe('回帰テスト', () => {
    it('DOMESTICフェーズの表示に影響がない', async () => {
      const mockGameState = createMockGameState({
        commandNum: 2,
        nations: [createMockNation({ power: 100, remainingActions: 2 })],
      });

      useUIStateStore.setState({ input: { requestType: 'COMMAND' as any, context: null, isWaiting: true } });
      await selectStageAndWait(mockGameState);

      await waitFor(() => {
        expect(screen.getByTestId('domestic-screen')).toBeInTheDocument();
      });
    });

    it('BATTLEフェーズの表示に影響がない', async () => {
      await selectStageAndWait(createMockGameState({ commandNum: 2, currentPhase: GamePhase.BATTLE_START }));

      await waitFor(() => {
        expect(screen.getByTestId('battle-screen')).toBeInTheDocument();
      });
    });
  });
});
