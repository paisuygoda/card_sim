/**
 * IGameUIBridge - UI連携インターフェース
 * 
 * 設計書5.2に基づき、ロジック側からUIへの通知と演出待機を実現
 * ゲームエンジンはこのインターフェースを通じてUIと非同期連携する
 */

/**
 * アニメーションイベント種類
 */
export enum AnimationEvent {
  /** フェーズ遷移 */
  PHASE_TRANSIT = 'PHASE_TRANSIT',
  /** ユニットダメージ */
  UNIT_DAMAGE = 'UNIT_DAMAGE',
  /** 国力変動 */
  POWER_CHANGE = 'POWER_CHANGE',
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
 * ゲームUIブリッジインターフェース
 */
export interface IGameUIBridge {
  /**
   * 演出の実行と待機
   * UIに演出を指示し、演出完了まで待機する
   * 
   * @param eventType イベント種類
   * @param data 演出に必要なデータ
   * @returns 演出完了を示すPromise
   */
  playAnimation(eventType: AnimationEvent, data: any): Promise<void>;

  /**
   * プレイヤーの入力待ち
   * UIにプレイヤー入力を要求し、入力完了まで待機する
   * 
   * @param requestType 入力要求種類
   * @param context 入力に必要なコンテキスト（選択可能なコマンドリストなど）
   * @returns プレイヤーの選択結果
   */
  waitPlayerInput<T = any>(requestType: InputRequest, context: any): Promise<T>;

  /**
   * ゲーム状態の更新通知
   * UIに現在のゲーム状態を通知（演出なし）
   * 
   * @param gameState 現在のゲーム状態
   */
  updateGameState(gameState: any): void;

  /**
   * ログメッセージの表示
   * UIにログメッセージを表示
   * 
   * @param message ログメッセージ
   * @param level ログレベル（'info' | 'warning' | 'error'）
   */
  log(message: string, level?: 'info' | 'warning' | 'error'): void;
}
