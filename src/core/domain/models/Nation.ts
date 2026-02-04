import { Command } from './Command';
import { State } from './State';
import { Unit } from './Unit';

/**
 * 国家データ構造
 * プレイヤーおよびNPCが操作する運営主体
 */
export interface Nation {
  /** 国家ID（手番順と一致） */
  nationId: number;
  /** 国家名（表示用） */
  name: string;
  /** NPC国家かどうか */
  isNPC: boolean;

  /** 国力 */
  power: number;
  /** 現在ターンの残り内政回数 */
  remainingActions: number;

  /** 国家ステート配列（付与順＝優先順位） */
  states: State[];

  /**
   * 全ユニット配列（順序に意味あり）
   * インデックス0: 前衛、1: 中衛、2: 後衛、3～7: ベンチ
   */
  units: (Unit | null)[];
  /** 墓地ユニット配列（順序に意味なし） */
  graveyard: Unit[];

  /** 使用可能な内政コマンド */
  domesticCommands: Command[];
  /** 使用可能な行動コマンド */
  actionCommands: Command[];

  /** 目標軍事力比率（NPC思考用） */
  targetMilitaryRatio: number;
  /** 好戦度（NPC思考用） */
  aggressiveness: number;
  /** 敵対国家ID配列 */
  hostileNationIds: number[];
}
