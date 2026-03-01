import type { Effect } from '@core/domain/models';
import { EffectType, EffectVisualType, EffectTarget, ValueType } from '@core/domain/models';

/**
 * テスト用エフェクトファクトリ
 */
export const createMockEffect = (overrides: Partial<Effect> = {}): Effect => ({
  effectType: EffectType.POWER_GAIN,
  visualType: EffectVisualType.BUFF,
  target: EffectTarget.SELF_NATION,
  valueType: ValueType.FIXED,
  value: 10,
  ...overrides,
});
