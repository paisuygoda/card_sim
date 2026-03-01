import type { Unit } from '@core/domain/models';

/**
 * テスト用ユニットファクトリ
 * デフォルト値を持ちつつ、overridesで任意プロパティを上書き可能
 */
export const createMockUnit = (overrides: Partial<Unit> = {}): Unit => ({
  baseUnitId: 'infantry',
  unitId: 'nation1-infantry',
  ownerNationId: 'nation1',
  name: 'テストユニット',
  maxHP: 100,
  currentHP: 100,
  attack: 50,
  skillId: 'normalAttack',
  states: [],
  ...overrides,
});

/**
 * インデックス付きユニット生成
 * BattleAreaテスト等で連番ユニットを複数生成する場合に使用
 */
export const createMockUnitWithIndex = (
  index: number,
  overrides: Partial<Unit> = {},
): Unit =>
  createMockUnit({
    baseUnitId: `unit${index}`,
    unitId: `nation1-unit${index}`,
    name: `ユニット${index}`,
    ...overrides,
  });

/**
 * 墓地用ユニット（HP 0）
 */
export const createMockGraveyardUnit = (
  index: number,
  overrides: Partial<Unit> = {},
): Unit =>
  createMockUnit({
    baseUnitId: `graveyardUnit${index}`,
    unitId: `${overrides.ownerNationId ?? 'nation1'}-graveyardUnit${index}`,
    ownerNationId: overrides.ownerNationId ?? 'nation1',
    name: `墓地ユニット${index}`,
    currentHP: 0,
    ...overrides,
  });
