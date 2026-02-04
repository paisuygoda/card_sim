import { Command } from './Command';
import { Effect } from './Effect';
import { GamePhase } from './GamePhase';
import { Nation } from './Nation';
import { State } from './State';

/**
 * ゲーム管理データ構造
 * ゲーム全体の状態を管理
 */
export interface GameState {
  /** 現在のステージID */
  stageId: number;
  /** 内政回数 */
  commandNum: number;

  /** 現在ラウンド数 */
  currentRound: number;
  /** 決着ラウンド数 */
  roundLimit: number;

  /** 全国家データ配列（手番順） */
  nations: Nation[];

  /** 現在手番プレイヤー */
  currentTurnPlayer: number;
  /** 現在フェーズ */
  currentPhase: GamePhase;
  /** 現在処理中のコマンド */
  currentCommand?: Command;
  /** 現在処理中のターゲット国家IDまたはユニットID（null含む） */
  currentTarget: number | null;

  /** ステート処理キュー */
  stateQueue: State[];
  /** 効果処理キュー */
  effectQueue: Effect[];
}
