import { Command } from '@core/domain/models/Command';
import { Nation } from '@core/domain/models/Nation';

/**
 * コマンドの実行可否を判定する純粋関数。
 *
 * @param command - 対象コマンド
 * @param nation  - コマンドを実行しようとしている国家
 * @returns 実行可能であれば true
 */
export function isCommandExecutable(command: Command, nation: Nation): boolean {
  const nullCount = nation.units.filter((u) => u === null).length;
  return (
    nation.remainingActions >= command.costAction &&
    nation.power >= command.costPower &&
    nullCount >= command.unitSpace
  );
}
