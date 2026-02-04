import { Effect } from './Effect';

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
 * コマンドデータ構造
 * プレイヤーまたはNPCが実行する行動
 */
export interface Command {
  /** コマンドID */
  commandId: number;
  /** コマンド種類 */
  commandType: CommandType;
  /** コマンド名 */
  name: string;

  /** 効果配列（順番に処理） */
  effects: Effect[];
}
