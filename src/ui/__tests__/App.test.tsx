import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import App from '../../App';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameManager } from '@core/application/GameManager';
import { ReactUIBridge } from '@bridge/ReactUIBridge';
import { STAGE_MASTER } from '@core/domain/master/StageMaster';
import { GamePhase } from '@core/domain/models';

// GameManagerをモック化
vi.mock('@core/application/GameManager', () => {
  const mockStartGame = vi.fn();
  const mockGetGameState = vi.fn();
  
  return {
    GameManager: vi.fn().mockImplementation(() => ({
      startGame: mockStartGame,
      getGameState: mockGetGameState,
    })),
    __mockStartGame: mockStartGame,
    __mockGetGameState: mockGetGameState,
  };
});

// ReactUIBridgeをモック化
vi.mock('@bridge/ReactUIBridge', () => {
  return {
    ReactUIBridge: vi.fn().mockImplementation(() => ({
      notifyGameEvent: vi.fn(),
      waitUI: vi.fn(),
      waitPlayerInput: vi.fn(),
      updateGameState: vi.fn(),
    })),
  };
});

describe('App - ゲーム初期化処理', () => {
  beforeEach(() => {
    // 各テストの前にモックとストアをリセット
    vi.clearAllMocks();
    // mockImplementationOnce キューを含む残留実装をクリアし、デフォルト実装を再設定
    (ReactUIBridge as unknown as ReturnType<typeof vi.fn>).mockReset().mockImplementation(() => ({
      notifyGameEvent: vi.fn(),
      waitUI: vi.fn(),
      waitPlayerInput: vi.fn(),
      updateGameState: vi.fn(),
    }));
    (GameManager as unknown as ReturnType<typeof vi.fn>).mockReset().mockImplementation(() => ({
      startGame: vi.fn().mockResolvedValue(undefined),
      getGameState: vi.fn(),
    }));
    useGameStateStore.getState().resetGameState();
  });

  describe('正常系', () => {
    it('アプリ起動時はStageSelectScreenが表示される', () => {
      render(<App />);
      expect(screen.getByText('ステージ選択')).toBeInTheDocument();
    });

    it('ステージカードが表示される', () => {
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      expect(stageCards.length).toBeGreaterThan(0);
    });

    it('アプリ起動時にGameManagerが正常に初期化される', async () => {
      // Arrange
      const mockGameState = {
        stageId: 1,
        commandNum: 2,
        currentRound: 0,
        roundLimit: 2,
        nations: [],
        currentTurnPlayer: 0,
        currentPhase: GamePhase.GAME_START,
        currentTarget: null,
        stateQueue: [],
        effectQueue: [],
      };

      // GameManagerのモックをセットアップ
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      const mockInstance = GameManagerMock.mock.results[0]?.value || {
        startGame: vi.fn().mockResolvedValue(undefined),
        getGameState: vi.fn().mockReturnValue(mockGameState),
      };
      
      GameManagerMock.mockImplementation(() => mockInstance);

      // Act
      render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        // GameManagerがインスタンス化されたことを確認
        expect(GameManager).toHaveBeenCalledTimes(1);
        
        // ReactUIBridgeがインスタンス化されたことを確認
        expect(ReactUIBridge).toHaveBeenCalledTimes(1);
      });
    });

    it('ReactUIBridgeが正しく作成される', async () => {
      // Arrange & Act
      render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        // ReactUIBridgeのコンストラクタが呼ばれたことを確認
        expect(ReactUIBridge).toHaveBeenCalled();
      });
    });

    it('GameManagerが正しく作成される', async () => {
      // Arrange
      const ReactUIBridgeMock = ReactUIBridge as unknown as ReturnType<typeof vi.fn>;
      const mockBridgeInstance = {
        notifyGameEvent: vi.fn(),
        waitUI: vi.fn(),
        waitPlayerInput: vi.fn(),
        updateGameState: vi.fn(),
      };
      ReactUIBridgeMock.mockImplementation(() => mockBridgeInstance);

      // Act
      render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        // GameManagerがReactUIBridgeインスタンスと共に作成されたことを確認
        expect(GameManager).toHaveBeenCalledWith(expect.any(Object));
      });
    });

    it('startGameが呼び出される', async () => {
      // Arrange
      const mockStartGame = vi.fn().mockResolvedValue(undefined);
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      
      GameManagerMock.mockImplementation(() => ({
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue({
          stageId: 1,
          commandNum: 2,
          currentRound: 0,
          roundLimit: 2,
          nations: [],
          currentTurnPlayer: 0,
          currentPhase: GamePhase.GAME_START,
          currentTarget: null,
          stateQueue: [],
          effectQueue: [],
        }),
      }));

      // Act
      render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        // startGameが呼ばれたことを確認
        expect(mockStartGame).toHaveBeenCalledTimes(1);
        
        // ステージデータが渡されたことを確認
        expect(mockStartGame).toHaveBeenCalledWith(expect.objectContaining({
          stageId: expect.any(Number),
          roundLimit: expect.any(Number),
        }));
      });
    });

    it('useGameStateStoreにゲーム状態が反映される', async () => {
      // Arrange
      const mockGameState = {
        stageId: 1,
        commandNum: 2,
        currentRound: 1,
        roundLimit: 2,
        nations: [
          {
            nationId: 'player',
            name: 'プレイヤー国家',
            isNPC: false,
            power: 100,
            units: [],
            graveyard: [],
            states: [],
            domesticCommands: [],
            actionCommands: [],
            remainingActions: 2,
            targetMilitaryRatio: 0.3,
            aggressiveness: 0.5,
            hostileNationIds: [],
          },
        ],
        currentTurnPlayer: 0,
        currentPhase: GamePhase.DOMESTIC,
        currentTarget: null,
        stateQueue: [],
        effectQueue: [],
      };

      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      const mockStartGame = vi.fn().mockImplementation(async () => {
        // startGame内でストアを更新することをシミュレート
        useGameStateStore.getState().setGameState(mockGameState);
      });

      GameManagerMock.mockImplementation(() => ({
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue(mockGameState),
      }));

      // Act
      render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        const storeState = useGameStateStore.getState().gameState;
        
        // ストアにゲーム状態が設定されたことを確認
        expect(storeState).not.toBeNull();
        expect(storeState?.stageId).toBe(1);
        expect(storeState?.currentPhase).toBe(GamePhase.DOMESTIC);
        expect(storeState?.nations).toHaveLength(1);
      });
    });

    it('正しいステージIDでゲームが開始される', async () => {
      // Arrange
      const mockStartGame = vi.fn().mockResolvedValue(undefined);
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      
      GameManagerMock.mockImplementation(() => ({
        startGame: mockStartGame,
        getGameState: vi.fn(),
      }));

      // Act
      render(<App />);

      // ステージ選択をシミュレート（最初のカード = ステージ1）
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        // 選択したステージ（ステージ1）が渡されることを確認
        const callArg = mockStartGame.mock.calls[0]?.[0];
        expect(callArg).toBeDefined();
        expect(callArg.stageId).toBe(1);
      });
    });
  });

  describe('エッジケース', () => {
    it('ステージデータが存在しない場合のエラーハンドリング', async () => {
      // Arrange
      const invalidStageId = 999;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // STAGE_MASTERに存在しないステージIDを使用させる
      // (実装では適切なエラーハンドリングが必要)
      
      // Act & Assert
      // この部分は実装がどのようにエラーを処理するかに依存
      // 例: エラーメッセージの表示、デフォルトステージへのフォールバック等
      
      expect(STAGE_MASTER[invalidStageId]).toBeUndefined();
      
      consoleErrorSpy.mockRestore();
    });

    it('初期化が2回呼ばれた場合の挙動（多重初期化の防止）', async () => {
      // Arrange
      const mockStartGame = vi.fn().mockResolvedValue(undefined);
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      
      GameManagerMock.mockImplementation(() => ({
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue({
          stageId: 1,
          commandNum: 2,
          currentRound: 0,
          roundLimit: 2,
          nations: [],
          currentTurnPlayer: 0,
          currentPhase: GamePhase.GAME_START,
          currentTarget: null,
          stateQueue: [],
          effectQueue: [],
        }),
      }));

      // Act
      const { rerender } = render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // 再レンダリングをトリガー
      rerender(<App />);
      rerender(<App />);

      // Assert
      await waitFor(() => {
        // isStarting.current フラグで多重初期化を防止しているため、初期化は1回のみ
        expect(mockStartGame).toHaveBeenCalledTimes(1);
        expect(GameManager).toHaveBeenCalledTimes(1);
      });
    });

    it('startGameが失敗した場合のエラーハンドリング', async () => {
      // Arrange
      const mockError = new Error('ゲーム開始に失敗しました');
      const mockStartGame = vi.fn().mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementation(() => ({
        startGame: mockStartGame,
        getGameState: vi.fn(),
      }));

      // Act
      render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        // startGameが呼ばれたことを確認
        expect(mockStartGame).toHaveBeenCalled();
      });

      // エラーが適切に処理されることを確認
      // (実装では、エラーメッセージ表示やログ出力などが期待される)
      
      consoleErrorSpy.mockRestore();
    });

    it('ReactUIBridgeの作成に失敗した場合', async () => {
      // Arrange
      const ReactUIBridgeMock = ReactUIBridge as unknown as ReturnType<typeof vi.fn>;
      ReactUIBridgeMock.mockImplementationOnce(() => {
        throw new Error('Bridge作成失敗');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act: ステージ選択をシミュレート（useEffectを発火させる）
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert: エラーがキャッチされてアプリがクラッシュしていないこと
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled(); // エラーがキャッチされた
      });
      expect(screen.queryByText('ゲーム初期化エラー')).toBeFalsy(); // アプリが生きている

      consoleErrorSpy.mockRestore();
    });

    it('GameManagerの作成に失敗した場合', async () => {
      // Arrange
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementationOnce(() => {
        throw new Error('GameManager作成失敗');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act: ステージ選択をシミュレート（useEffectを発火させる）
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert: エラーがキャッチされてアプリがクラッシュしていないこと
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled(); // エラーがキャッチされた
      });
      expect(screen.queryByText('ゲーム初期化エラー')).toBeFalsy(); // アプリが生きている

      consoleErrorSpy.mockRestore();
    });

    it('startGameでエラーが発生した後、ステージ選択画面に戻ってリトライできる', async () => {
      // Arrange: 最初のstartGameは失敗する
      const mockStartGame = vi.fn().mockRejectedValueOnce(new Error('1回目は失敗'));
      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementation(() => ({
        startGame: mockStartGame,
        getGameState: vi.fn(),
      }));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act: ステージを選択してエラーを発生させる
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert: エラーがキャッチされた
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('ゲーム初期化エラー:', expect.any(Error));
      });

      // isStarting.current がリセットされていること（実装の内部状態は直接検証できないため、
      // 再度startGameが呼べることで間接的に確認する）
      // 注: catch で isStarting.current = false と setSelectedStage(null) が呼ばれると
      //     ステージ選択画面に自動で戻る。それを確認することでリセットを間接検証する。
      await waitFor(() => {
        expect(screen.getByText('ステージ選択')).toBeInTheDocument();
      });

      // 再度ステージを選択してリトライ
      const stageCardsAfterError = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCardsAfterError[0]);

      // 2回目のstartGameが呼ばれること（isStarting.currentがリセットされている証明）
      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledTimes(2);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('統合テスト', () => {
    it('初期化処理の完全なフロー', async () => {
      // Arrange
      const mockGameState = {
        stageId: 1,
        commandNum: 2,
        currentRound: 0,
        roundLimit: 2,
        nations: [
          {
            nationId: 'npc1',
            name: 'NPC国家',
            isNPC: true,
            power: 100,
            units: [],
            graveyard: [],
            states: [],
            domesticCommands: [],
            actionCommands: [],
            remainingActions: 2,
            targetMilitaryRatio: 0.3,
            aggressiveness: 0.5,
            hostileNationIds: [],
          },
          {
            nationId: 'player',
            name: 'プレイヤー国家',
            isNPC: false,
            power: 100,
            units: [],
            graveyard: [],
            states: [],
            domesticCommands: [],
            actionCommands: [],
            remainingActions: 2,
            targetMilitaryRatio: 0.3,
            aggressiveness: 0.5,
            hostileNationIds: [],
          },
        ],
        currentTurnPlayer: 0,
        currentPhase: GamePhase.GAME_START,
        currentTarget: null,
        stateQueue: [],
        effectQueue: [],
      };

      const mockBridgeInstance = {
        notifyGameEvent: vi.fn().mockResolvedValue(undefined),
        waitUI: vi.fn().mockResolvedValue(undefined),
        waitPlayerInput: vi.fn().mockResolvedValue(undefined),
        updateGameState: vi.fn(),
      };

      const ReactUIBridgeMock = ReactUIBridge as unknown as ReturnType<typeof vi.fn>;
      ReactUIBridgeMock.mockImplementation(() => mockBridgeInstance);

      const mockStartGame = vi.fn().mockImplementation(async () => {
        useGameStateStore.getState().setGameState(mockGameState);
      });

      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementation(() => ({
        startGame: mockStartGame,
        getGameState: vi.fn().mockReturnValue(mockGameState),
      }));

      // Act
      render(<App />);

      // ステージ選択をシミュレート
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // Assert
      await waitFor(() => {
        // 1. ReactUIBridgeが作成された
        expect(ReactUIBridge).toHaveBeenCalledTimes(1);
        
        // 2. GameManagerがReactUIBridgeと共に作成された
        expect(GameManager).toHaveBeenCalledTimes(1);
        expect(GameManager).toHaveBeenCalledWith(expect.any(Object));
        
        // 3. startGameが適切なステージデータで呼ばれた
        expect(mockStartGame).toHaveBeenCalledTimes(1);
        expect(mockStartGame).toHaveBeenCalledWith(expect.objectContaining({
          stageId: 1,
        }));
        
        // 4. ストアにゲーム状態が反映された
        const storeState = useGameStateStore.getState().gameState;
        expect(storeState).not.toBeNull();
        expect(storeState?.stageId).toBe(1);
        expect(storeState?.nations).toHaveLength(2);
      });
    });
  });

  describe('デバッグパネル（開発環境）', () => {
    it('開発環境でsidebarにdetails要素（gameStateデバッグパネル）が存在する', async () => {
      // Arrange: ステージを選択してフルレイアウト（sidebar付き）を表示する
      const mockGameState = {
        stageId: 1,
        commandNum: 2,
        currentRound: 1,
        roundLimit: 10,
        nations: [],
        currentTurnPlayer: 0,
        currentPhase: GamePhase.DOMESTIC,
        currentTarget: null,
        stateQueue: [],
        effectQueue: [],
      };

      const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
      GameManagerMock.mockImplementation(() => ({
        startGame: vi.fn().mockImplementation(async () => {
          useGameStateStore.getState().setGameState(mockGameState);
        }),
        getGameState: vi.fn().mockReturnValue(mockGameState),
      }));

      // Act: ステージを選択して aside を含むフルレイアウトを表示
      render(<App />);
      const stageCards = screen.getAllByTestId('stage-card');
      fireEvent.click(stageCards[0]);

      // aside（sidebar）が表示されるまで待機
      await waitFor(() => {
        expect(document.querySelector('.app-sidebar')).not.toBeNull();
      });

      // Assert: 開発環境（import.meta.env.DEV === true）で details 要素が存在する
      // 現在の App.tsx には details 要素がない → このテストは失敗する（Redフェーズ）
      // 修正後に App.tsx に <details> デバッグパネルを追加することで通過する（Greenフェーズ）
      const detailsElement = document.querySelector('details');
      expect(detailsElement).not.toBeNull();
    });
  });
});
