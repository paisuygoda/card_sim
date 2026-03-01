/**
 * テストフィクスチャ
 * テストデータ生成用のファクトリ関数を一元管理
 */
export { createMockUnit, createMockUnitWithIndex, createMockGraveyardUnit } from './units';
export { createMockNation, createMockNPCNation } from './nations';
export {
  createMockState,
  createBuffState,
  createDebuffState,
  createDeadState,
  createDefenseBuffState,
  createProsperityState,
} from './states';
export { createMockCommand } from './commands';
export { createMockEffect } from './effects';
export { createMockGameState } from './gameState';
export { createMockBattleContext } from './battleContext';
