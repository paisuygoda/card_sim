import { useCallback } from 'react';
import { GameManager } from '@core/application/GameManager';
import { Stage, Command } from '@core/domain/models';
import { useGameStateStore } from '@store/useGameStateStore';

/**
 * useGameActions - ゲーム操作用カスタムフック
 * 
 * GameManagerへの操作をラップし、
 * Reactコンポーネントから使いやすい形で提供
 */

let gameManagerInstance: GameManager | null = null;

export function useGameActions() {
  const setGameState = useGameStateStore((state) => state.setGameState);

  /**
   * ゲームマネージャーを初期化
   * @param bridge UIブリッジ
   */
  const initializeGameManager = useCallback((bridge: any) => {
    // TODO: 実装
    // gameManagerInstance = new GameManager(bridge);
  }, []);

  /**
   * ゲームを開始
   * @param stage ステージデータ
   */
  const startGame = useCallback(
    async (stage: Stage) => {
      // TODO: 実装
      // if (!gameManagerInstance) {
      //   throw new Error('GameManager not initialized');
      // }
      // await gameManagerInstance.startGame(stage);
    },
    []
  );

  /**
   * コマンドを実行
   * @param command 実行するコマンド
   */
  const executeCommand = useCallback(
    async (command: Command) => {
      // TODO: 実装
    },
    []
  );

  /**
   * 現在のゲーム状態を取得
   */
  const getCurrentGameState = useCallback(() => {
    // TODO: 実装
    // return gameManagerInstance?.getGameState() || null;
    return null;
  }, []);

  return {
    initializeGameManager,
    startGame,
    executeCommand,
    getCurrentGameState,
  };
}
