import type { GameState } from '@core/domain/models';
import { GamePhase } from '@core/domain/models';

/**
 * テスト用GameStateファクトリ
 */
export const createMockGameState = (
  overrides: Partial<GameState> = {},
): GameState => ({
  stageId: 1,
  commandNum: 3,
  currentRound: 1,
  roundLimit: 10,
  nations: [],
  currentTurnPlayer: 0,
  currentPhase: GamePhase.DOMESTIC,
  currentTarget: null,
  stateQueue: [],
  effectQueue: [],
  battleContext: null,
  ...overrides,
});
