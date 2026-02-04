import { Effect } from './Effect';
import { GamePhase } from './GamePhase';

/**
 * ステートデータ構造
 * 国家またはユニットに付与される持続効果
 */
export interface State {
  /** ステートID */
  stateId: number;
  /** ステート名 */
  name: string;

  /** 所持ユニットID（国家ステートの場合は0） */
  unitId: number;
  /** 所属国家ID */
  ownerNationId: number;

  /** スタック数（null = スタック不可） */
  stacks: number | null;
  /** 残りターン数（null = 永続） */
  duration: number | null;
  /** 発動タイミング配列 */
  triggerTimings: GamePhase[];
  /** 残り発動回数（null = 無制限） */
  remainings: number | null;

  /** 効果配列（配列順に処理） */
  effects: Effect[];

  /**
   * 排他ステートの配列
   * [0]: 上位排他、[1]: 同位排他、[2]: 下位排他
   */
  excludes: number[][];
}
