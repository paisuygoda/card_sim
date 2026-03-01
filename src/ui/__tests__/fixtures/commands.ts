import type { Command } from '@core/domain/models';
import { CommandType, CommandVisualType, CommandTargetType } from '@core/domain/models';

/**
 * テスト用コマンドファクトリ
 */
export const createMockCommand = (overrides: Partial<Command> = {}): Command => ({
  commandId: 'cmd1',
  commandType: CommandType.DOMESTIC,
  name: 'テストコマンド',
  commandVisualType: CommandVisualType.DOMESTIC,
  costAction: 1,
  costPower: 10,
  unitSpace: 0,
  targetType: CommandTargetType.SELF_NATION,
  effects: [],
  ...overrides,
});
