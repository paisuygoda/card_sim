import { Effect, validateEffect } from './Effect';

/**
 * コマンド種類の列挙型
 */
export enum CommandType {
  /** 内政コマンド */
  DOMESTIC = 'DOMESTIC',
  /** 戦闘コマンド */
  BATTLE = 'BATTLE',
  /** 行動コマンド */
  ACTION = 'ACTION',
}

/**
 * コマンドの演出種類を定義する列挙型
 */
export enum CommandVisualType {
  /** 内政演出 */
  DOMESTIC = 'DOMESTIC',
  /** 戦闘演出 */
  BATTLE = 'BATTLE',
  /** 行動演出 */
  ACTION = 'ACTION',
}

/**
 * コマンドターゲット種類の列挙型
 */
export enum CommandTargetType {
  /** 自身 */
  SELF_NATION = 'SELF_NATION',
  /** 敵国 */
  ENEMY_NATION = 'ENEMY_NATION',
  /** 全敵国 */
  ALL_ENEMY_NATIONS = 'ALL_ENEMY_NATIONS',
  /** 全国家 */
  ALL_NATIONS = 'ALL_NATIONS',
  /** 自国ユニット */
  SELF_UNIT = 'SELF_UNIT',
  /** 敵国ユニット */
  ENEMY_UNIT = 'ENEMY_UNIT',
}

/**
 * コマンドデータ構造
 * プレイヤーまたはNPCが実行する行動
 */
export interface Command {
  /** コマンドID */
  commandId: string;
  /** コマンド種類 */
  commandType: CommandType;
  /** コマンド名 */
  name: string;
  /** コマンド演出種類 */
  commandVisualType: CommandVisualType;
  costAction: number;
  costPower: number;
  unitSpace: number;
  targetType: CommandTargetType;
  targetId?: string;

  /** 効果配列（順番に処理） */
  effects: Effect[];
}

export const validateCommand = (command: Command): boolean => {
  if (!command.commandId || !command.name) {
    return false;
  }
  if (!Object.values(CommandType).includes(command.commandType)) {
    return false;
  }
  if (!Object.values(CommandVisualType).includes(command.commandVisualType)) {
    return false;
  }
  if (!Object.values(CommandTargetType).includes(command.targetType)) {
    return false;
  }
  // 対象選択が必要なコマンドで、targetIdが未設定の場合は無効
  const requiresTargetId = [
    CommandTargetType.SELF_UNIT,
    CommandTargetType.ENEMY_UNIT,
    CommandTargetType.ENEMY_NATION
  ];
  if (requiresTargetId.includes(command.targetType) && !command.targetId) {
    return false;
  }

  // effectsの妥当性チェック
  for (const effect of command.effects) {
    if (!validateEffect(effect)) {
      return false;
    }
  }
  return true;
}