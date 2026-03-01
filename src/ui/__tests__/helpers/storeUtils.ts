import type { GameState } from '@core/domain/models';
import type { AnimationQueueItem } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { InputRequest } from '@core/infrastructure/IGameUIBridge';

/**
 * ゲーム状態ストアをセットアップ
 */
export const setupGameState = (gameState: GameState | null): void => {
  useGameStateStore.setState({ gameState });
};

/**
 * UI状態ストアをセットアップ
 */
export const setupUIState = (overrides: {
  animationQueue?: AnimationQueueItem[];
  currentAnimation?: ReturnType<typeof useUIStateStore.getState>['currentAnimation'];
  input?: ReturnType<typeof useUIStateStore.getState>['input'];
  logs?: ReturnType<typeof useUIStateStore.getState>['logs'];
} = {}): void => {
  useUIStateStore.setState({
    animationQueue: [],
    currentAnimation: null,
    input: null,
    logs: [],
    ...overrides,
  });
};

/**
 * 入力待ち状態をセットアップ
 */
export const setupInputWaiting = (
  requestType: InputRequest,
  context: Record<string, unknown> = {},
): void => {
  useUIStateStore.setState({
    input: {
      requestType,
      context,
      isWaiting: true,
    },
  });
};

/**
 * 両ストアをリセット
 */
export const resetStores = (): void => {
  useGameStateStore.setState({ gameState: null });
  useUIStateStore.setState({
    animationQueue: [],
    currentAnimation: null,
    input: null,
    logs: [],
  });
};
