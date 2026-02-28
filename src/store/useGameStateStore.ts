import { create } from 'zustand';
import { GameState, GamePhase } from '@core/domain/models';

/**
 * useGameStateStore - ゲーム状態管理
 * 
 * ReactとCoreが共有する現在のゲーム状態を管理
 * ゲームエンジンから更新され、UIコンポーネントが参照する
 */

interface GameStateStore {
  /** 現在のゲーム状態 */
  gameState: GameState | null;

  /** ゲーム状態を更新 */
  setGameState: (gameState: GameState) => void;

  /** ゲーム状態をリセット */
  resetGameState: () => void;

  /** 特定フィールドを部分更新 */
  updateGameState: (partial: Partial<GameState>) => void;
}

const initialGameState: GameState = {
  stageId: 0,
  commandNum: 0,
  currentRound: 0,
  roundLimit: 0,
  nations: [],
  currentTurnPlayer: 0,
  currentPhase: GamePhase.GAME_START,
  currentTarget: null,
  stateQueue: [],
  effectQueue: [],
  battleContext: null,
};

export const useGameStateStore = create<GameStateStore>((set) => ({
  gameState: null,

  setGameState: (gameState: GameState) => {
    set({ gameState });
  },

  resetGameState: () => {
    set({ gameState: { ...initialGameState } });
  },

  updateGameState: (partial: Partial<GameState>) => {
    set((state) => ({
      gameState: state.gameState
        ? { ...state.gameState, ...partial }
        : null,
    }));
  },
}));
