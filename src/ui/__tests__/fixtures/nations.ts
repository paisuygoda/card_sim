import type { Nation } from '@core/domain/models';

/**
 * テスト用国家ファクトリ
 */
export const createMockNation = (overrides: Partial<Nation> = {}): Nation => ({
  nationId: 'player',
  name: 'テスト国家',
  isNPC: false,
  power: 500,
  remainingActions: 3,
  states: [],
  units: [null, null, null, null, null, null, null, null],
  graveyard: [],
  domesticCommands: [],
  actionCommands: [],
  targetMilitaryRatio: 0.5,
  aggressiveness: 0.5,
  hostileNationIds: [],
  ...overrides,
});

/**
 * NPC国家のプリセット
 */
export const createMockNPCNation = (overrides: Partial<Nation> = {}): Nation =>
  createMockNation({
    nationId: 'npc1',
    name: 'NPC国家',
    isNPC: true,
    power: 300,
    ...overrides,
  });
