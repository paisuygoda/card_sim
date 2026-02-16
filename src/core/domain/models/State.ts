import { Effect } from './Effect';
import { GamePhase } from './GamePhase';

/**
 * ステートの演出種類を定義する列挙型
 */
export enum StateVisualType {
  /** 演出なし */
  NONE = 'NONE',
  /** ダメージ演出 */
  DAMAGE = 'DAMAGE',
}

/**
 * ステートデータ構造
 * 国家またはユニットに付与される持続効果
 */
export interface State {
  /** ステートID */
  stateId: string;
  /** ステート名 */
  name: string;
  /** ステート演出種類 */
  stateVisualType: StateVisualType;

  /** 所持ユニットID（国家ステートの場合は0） */
  unitId?: string;
  /** 所属国家ID */
  ownerNationId?: string;

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
  excludes: string[][];
}
