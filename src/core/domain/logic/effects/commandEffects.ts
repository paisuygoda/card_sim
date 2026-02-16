/**
 * コマンド追加・除去効果の実装
 */

import { Effect, Nation } from '../../models';
import { MasterData } from '../../master';

/**
 * コマンド追加効果を実行
 * @param effect 効果データ
 * @param targetNation 対象国家
 */
export async function executeAddCommand(
  effect: Effect,
  targetNation: Nation,
): Promise<void> {
  // effect.valueはコマンドIDを表す
  const commandId = String(effect.value);
  const commandTemplate = MasterData.getCommand(commandId);

  if (!commandTemplate) {
    console.warn(`Command ${commandId} not found`);
    return;
  }

  // コマンドのコピーを作成して追加
  const newCommand = { ...commandTemplate };

  // コマンドタイプに応じて適切な配列に追加
  if (commandTemplate.commandType === 'DOMESTIC') {
    targetNation.domesticCommands.push(newCommand);
  } else {
    targetNation.actionCommands.push(newCommand);
  }
}

/**
 * コマンド除去効果を実行
 * @param effect 効果データ
 * @param targetNation 対象国家
 */
export async function executeRemoveCommand(
  effect: Effect,
  targetNation: Nation,
): Promise<void> {
  // effect.valueはコマンドIDを表す
  const commandId = String(effect.value);

  // 内政コマンドから検索
  let commandIndex = targetNation.domesticCommands.findIndex((c) => c.commandId === commandId);
  let commandType: 'domestic' | 'action' = 'domestic';

  if (commandIndex === -1) {
    // 行動コマンドから検索
    commandIndex = targetNation.actionCommands.findIndex((c) => c.commandId === commandId);
    commandType = 'action';
  }

  if (commandIndex !== -1) {
    // コマンドを除去
    if (commandType === 'domestic') {
      targetNation.domesticCommands.splice(commandIndex, 1);
    } else {
      targetNation.actionCommands.splice(commandIndex, 1);
    }
  }
}
