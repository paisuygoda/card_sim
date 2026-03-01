import type { BattleContext, Unit } from '@core/domain/models';

/**
 * テスト用BattleContextファクトリ
 */
export const createMockBattleContext = (
  overrides: Partial<BattleContext> = {},
): BattleContext => ({
  attackerNationId: 'nation_a',
  defenderNationId: 'nation_b',
  attackOrder: [] as Unit[],
  currentAttackIndex: 0,
  currentAttacker: undefined,
  targetUnits: [],
  targetIndex: 0,
  pendingPowerDamage: 0,
  ...overrides,
});
