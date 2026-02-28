import { Command, Nation, GamePhase, SkillVisualType } from '../domain/models';
/**
 * IGameUIBridge - UI連携インターフェース
 * 
 * 設計書5.2に基づき、ロジック側からUIへの通知と演出待機を実現
 * ゲームエンジンはこのインターフェースを通じてUIと非同期連携する
 */

/**
 * アニメーションイベント種類
 */
export enum GameEvent {
  /** フェーズ遷移 */
  PHASE_TRANSIT = 'PHASE_TRANSIT',
  /** ユニットダメージ */
  UNIT_DAMAGE = 'UNIT_DAMAGE',
  /** ユニット回復 */
  UNIT_HEAL = 'UNIT_HEAL',
  /** ユニット最大HP増強 */
  UNIT_MAX_HP_GAIN = 'UNIT_MAX_HP_GAIN',
  /** ユニット最大HP減少 */
  UNIT_MAX_HP_LOSS = 'UNIT_MAX_HP_LOSS',
  /** 国力ダメージ */
  POWER_DAMAGE = 'POWER_DAMAGE',
  /** 国力回復 */
  POWER_HEAL = 'POWER_HEAL',
  /** ユニット攻撃力増強 */
  UNIT_ATTACK_BUFF = 'UNIT_ATTACK_BUFF',
  /** ユニット攻撃力減衰 */
  UNIT_ATTACK_DEBUFF = 'UNIT_ATTACK_DEBUFF',
  /** ステート付与 */
  STATE_ADD = 'STATE_ADD',
  /** ステート削除 */
  STATE_REMOVE = 'STATE_REMOVE',
  /** ユニット召喚 */
  UNIT_SUMMON = 'UNIT_SUMMON',
  /** ユニット破壊 */
  UNIT_DESTROY = 'UNIT_DESTROY',
  /** スキル発動 */
  SKILL_ACTIVATE = 'SKILL_ACTIVATE',
  /** コマンド実行 */
  COMMAND_EXECUTE = 'COMMAND_EXECUTE',
  /** 戦闘開始 */
  BATTLE_START = 'BATTLE_START',
  /** 戦闘終了 */
  BATTLE_END = 'BATTLE_END',
  /** ゲーム終了 */
  GAME_END = 'GAME_END',
}

/**
 * プレイヤー入力要求種類
 */
export enum InputRequest {
  /** コマンド選択 */
  SELECT_COMMAND = 'SELECT_COMMAND',
  /** ターゲット選択 */
  SELECT_TARGET = 'SELECT_TARGET',
  /** 確認待ち */
  CONFIRM = 'CONFIRM',
}

/**
 * ゲームイベントデータの型定義
 */

/** フェーズ遷移イベントデータ */
export type PhaseTransitData = {
  phase: GamePhase | 'EARLY_VICTORY';
};

/** ユニットダメージ・回復イベントデータ */
export type UnitHPEventData = {
  targetUnitId: string;
  amount: number;
  visualType?: string;
};

/** 国力増減イベントデータ */
export type PowerEventData = {
  nationId: string;
  amount: number;
  visualType?: string;
};

/** ステート付与・削除イベントデータ */
export type StateEventData = {
  targetUnitId?: string;
  targetNationId?: string;
  stateId: string;
  visualType?: string;
};

/** スキル発動イベントデータ */
export type SkillActivateData = {
  attackerId: string;
  skillId: string;
  skillName: string;
  targets: (string | null)[];
  skillVisualType?: SkillVisualType;
};

/** コマンド実行イベントデータ */
export type CommandExecuteData = {
  commandName: string;
  commandType: string;
  commandVisualType?: string;
  commandTargetType?: string;
  commandTarget?: string;
};

/** 戦闘開始・終了イベントデータ */
export type BattleEventData = {
  attackerNationId: string;
  defenderNationId: string;
};

/**ゲーム終了イベントデータ */
export type GameEndEventData = {
  finalRanking: Nation[];
};

/**
 * イベントタイプとデータ型のマッピング
 */
export type GameEventDataMap = {
  [GameEvent.PHASE_TRANSIT]: PhaseTransitData;
  [GameEvent.UNIT_DAMAGE]: UnitHPEventData;
  [GameEvent.UNIT_HEAL]: UnitHPEventData;
  [GameEvent.UNIT_MAX_HP_GAIN]: UnitHPEventData;
  [GameEvent.UNIT_MAX_HP_LOSS]: UnitHPEventData;
  [GameEvent.POWER_DAMAGE]: PowerEventData;
  [GameEvent.POWER_HEAL]: PowerEventData;
  [GameEvent.UNIT_ATTACK_BUFF]: UnitHPEventData;
  [GameEvent.UNIT_ATTACK_DEBUFF]: UnitHPEventData;
  [GameEvent.STATE_ADD]: StateEventData;
  [GameEvent.STATE_REMOVE]: StateEventData;
  [GameEvent.UNIT_SUMMON]: { unitId: string; visualType?: string };
  [GameEvent.UNIT_DESTROY]: { unitId: string; visualType?: string };
  [GameEvent.SKILL_ACTIVATE]: SkillActivateData;
  [GameEvent.COMMAND_EXECUTE]: CommandExecuteData;
  [GameEvent.BATTLE_START]: BattleEventData;
  [GameEvent.BATTLE_END]: BattleEventData;
  [GameEvent.GAME_END]: GameEndEventData;
};

/**
 * すべてのイベントデータの共用体型
 */
export type GameEventData = GameEventDataMap[GameEvent];

/**
 * ゲームUIブリッジインターフェース
 */
export interface IGameUIBridge {
  /**
   * 演出の実行と待機
   * UIに演出を指示し、演出完了まで待機する
   * 
   * @param eventType イベント種類
   * @param data 演出に必要なデータ（イベントタイプに応じた型）
   * @returns 演出完了を示すPromise
   */
  notifyGameEvent<T extends GameEvent>(eventType: T, data: GameEventDataMap[T]): Promise<void>;

  /**
   * UI処理完了の待機
   * UI側での全ての処理（アニメーションなど）が完了するまで待機する
   * 
   * @returns UI処理完了を示すPromise
   */
  waitUI(): Promise<void>;

  /**
   * プレイヤーの入力待ち
   * UIにプレイヤー入力を要求し、入力完了まで待機する
   * 
   * @param requestType 入力要求種類
   * @param context 入力に必要なコンテキスト（選択可能なコマンドリストなど）
   * @returns 入力結果（Command等）
   */
  waitPlayerInput(requestType: InputRequest, context: any): Promise<Command>;

  /**
   * ゲーム状態の更新通知
   * UIに現在のゲーム状態を通知（演出なし）
   * 
   * @param gameState 現在のゲーム状態
   */
  updateGameState(gameState: any): void;

  /**
   * 開発用デバッグログ
   * ゲームエンジン内部のエラーやデバッグ情報のみを出力
   * ゲームイベントは notifyGameEvent や updateGameState で通知すること
   * 
   * @param message デバッグメッセージ
   * @param level ログレベル（'info' | 'warning' | 'error'）
   */
  log(message: string, level?: 'info' | 'warning' | 'error'): void;
}
