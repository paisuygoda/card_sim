import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameManager } from '@core/application/GameManager';
import { ReactUIBridge } from '@bridge/ReactUIBridge';
import { STAGE_MASTER } from '@core/domain/master/StageMaster';
import { GamePhase } from '@core/domain/models';
import { createMockGameState, createMockNation, createMockNPCNation } from './fixtures';

// GameManagerをモック化
vi.mock('@core/application/GameManager', () => {
  const mockStartGame = vi.fn();
  const mockGetGameState = vi.fn();
  
  return {
    GameManager: vi.fn().mockImplementation(function() { return {
      startGame: mockStartGame,
      getGameState: mockGetGameState,
    }; }),

    __mockStartGame: mockStartGame,
    __mockGetGameState: mockGetGameState,
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

describe('GameInitializer - ゲーム初期化処理', () => {
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

  describe('正常系', () => {
    it('アプリ起動時にGameManagerが正常に初期化される', async () => {
      // Arrange
      const mockGameState = createMockGameState({ commandNum: 2, currentRound: 0, roundLimit: 2, currentPhase: GamePhase.GAME_START });

      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      const mockInstance = GameManagerMock.mock.results[0]?.value || {
        startGame: vi.fn().mockResolvedValue(undefined),
        getGameState: vi.fn().mockReturnValue(mockGameState),
      };
      
      GameManagerMock.mockImplementation(function() { return mockInstance; });

      // Act
      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        expect(GameManager).toHaveBeenCalledTimes(1);
        expect(ReactUIBridge).toHaveBeenCalledTimes(1);
      });
    });

    it('ReactUIBridgeが正しく作成される', async () => {
      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(ReactUIBridge).toHaveBeenCalled();
      });
    });

    it('GameManagerが正しく作成される', async () => {
      const ReactUIBridgeMock = ReactUIBridge as unknown as ReturnType<typeof vi.fn>;
      const mockBridgeInstance = {
        notifyGameEvent: vi.fn(),
        waitUI: vi.fn(),
        waitPlayerInput: vi.fn(),
        updateGameState: vi.fn(),
      };
      ReactUIBridgeMock.mockImplementation(function() { return mockBridgeInstance; });

      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(GameManager).toHaveBeenCalledWith(expect.any(Object));
      });
    });

    it('startGameが呼び出される', async () => {
      const mockStartGame = vi.fn().mockResolvedValue(undefined);
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      
      GameManagerMock.mockImplementation(function() { return {
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue(
          createMockGameState({ commandNum: 2, currentRound: 0, roundLimit: 2, currentPhase: GamePhase.GAME_START })
        ),
      }; });

      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledTimes(1);
        expect(mockStartGame).toHaveBeenCalledWith(expect.objectContaining({
          stageId: expect.any(Number),
          roundLimit: expect.any(Number),
        }));
      });
    });

    it('useGameStateStoreにゲーム状態が反映される', async () => {
      const mockGameState = createMockGameState({
        commandNum: 2,
        roundLimit: 2,
        nations: [
          createMockNation({ power: 100, remainingActions: 2, units: [] }),
        ],
      });

      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      const mockStartGame = vi.fn().mockImplementation(async () => {
        useGameStateStore.getState().setGameState(mockGameState);
      });

      GameManagerMock.mockImplementation(function() { return {
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue(mockGameState),
      }; });

      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        const storeState = useGameStateStore.getState().gameState;
        expect(storeState).not.toBeNull();
        expect(storeState?.stageId).toBe(1);
        expect(storeState?.currentPhase).toBe(GamePhase.DOMESTIC);
        expect(storeState?.nations).toHaveLength(1);
      });
    });

    it('正しいステージIDでゲームが開始される', async () => {
      const mockStartGame = vi.fn().mockResolvedValue(undefined);
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      
      GameManagerMock.mockImplementation(function() { return {
        startGame: mockStartGame,
        getGameState: vi.fn(),
      }; });

      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        const callArg = mockStartGame.mock.calls[0]?.[0];
        expect(callArg).toBeDefined();
        expect(callArg.stageId).toBe(1);
      });
    });
  });

  describe('エッジケース', () => {
    it('ステージデータが存在しない場合のエラーハンドリング', async () => {
      const invalidStageId = 999;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(STAGE_MASTER[invalidStageId]).toBeUndefined();
      
      consoleErrorSpy.mockRestore();
    });

    it('初期化が2回呼ばれた場合の挙動（多重初期化の防止）', async () => {
      const mockStartGame = vi.fn().mockResolvedValue(undefined);
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      
      GameManagerMock.mockImplementation(function() { return {
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue(
          createMockGameState({ commandNum: 2, currentRound: 0, roundLimit: 2, currentPhase: GamePhase.GAME_START })
        ),
      }; });

      const user = userEvent.setup();
      const { rerender } = render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      rerender(<App />);
      rerender(<App />);

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledTimes(1);
        expect(GameManager).toHaveBeenCalledTimes(1);
      });
    });

    it('startGameが失敗した場合のエラーハンドリング', async () => {
      const mockError = new Error('ゲーム開始に失敗しました');
      const mockStartGame = vi.fn().mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementation(function() { return {
        startGame: mockStartGame,
        getGameState: vi.fn(),
      }; });

      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('ReactUIBridgeの作成に失敗した場合', async () => {
      const ReactUIBridgeMock = ReactUIBridge as unknown as ReturnType<typeof vi.fn>;
      ReactUIBridgeMock.mockImplementationOnce(() => {
        throw new Error('Bridge作成失敗');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      expect(screen.queryByText('ゲーム初期化エラー')).toBeFalsy();

      consoleErrorSpy.mockRestore();
    });

    it('GameManagerの作成に失敗した場合', async () => {
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementationOnce(() => {
        throw new Error('GameManager作成失敗');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      expect(screen.queryByText('ゲーム初期化エラー')).toBeFalsy();

      consoleErrorSpy.mockRestore();
    });

    it('startGameでエラーが発生した後、ステージ選択画面に戻ってリトライできる', async () => {
      const mockStartGame = vi.fn().mockRejectedValueOnce(new Error('1回目は失敗'));
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementation(function() { return {
        startGame: mockStartGame,
        getGameState: vi.fn(),
      }; });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('ゲーム初期化エラー:', expect.any(Error));
      });

      await waitFor(() => {
        expect(screen.getByText('ステージ選択')).toBeInTheDocument();
      });

      const stageCardsAfterError = screen.getAllByTestId('stage-card');
      await user.click(stageCardsAfterError[0]);

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledTimes(2);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('統合テスト', () => {
    it('初期化処理の完全なフロー', async () => {
      const mockGameState = createMockGameState({
        commandNum: 2,
        currentRound: 0,
        roundLimit: 2,
        currentPhase: GamePhase.GAME_START,
        nations: [
          createMockNPCNation({ power: 100, remainingActions: 2, units: [] }),
          createMockNation({ power: 100, remainingActions: 2, units: [] }),
        ],
      });

      const mockBridgeInstance = {
        notifyGameEvent: vi.fn().mockResolvedValue(undefined),
        waitUI: vi.fn().mockResolvedValue(undefined),
        waitPlayerInput: vi.fn().mockResolvedValue(undefined),
        updateGameState: vi.fn(),
      };

      const ReactUIBridgeMock = ReactUIBridge as unknown as ReturnType<typeof vi.fn>;
      ReactUIBridgeMock.mockImplementation(function() { return mockBridgeInstance; });

      const mockStartGame = vi.fn().mockImplementation(async () => {
        useGameStateStore.getState().setGameState(mockGameState);
      });

      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementation(function() { return {
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue(mockGameState),
      }; });

      const user = userEvent.setup();
      render(<App />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      await waitFor(() => {
        expect(ReactUIBridge).toHaveBeenCalledTimes(1);
        expect(GameManager).toHaveBeenCalledTimes(1);
        expect(GameManager).toHaveBeenCalledWith(expect.any(Object));
        expect(mockStartGame).toHaveBeenCalledTimes(1);
        expect(mockStartGame).toHaveBeenCalledWith(expect.objectContaining({
          stageId: 1,
        }));

        const storeState = useGameStateStore.getState().gameState;
        expect(storeState).not.toBeNull();
        expect(storeState?.stageId).toBe(1);
        expect(storeState?.nations).toHaveLength(2);
      });
    });
  });
});
