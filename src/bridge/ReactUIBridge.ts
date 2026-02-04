import { IGameUIBridge, AnimationEvent, InputRequest } from '@core/infrastructure/IGameUIBridge';

/**
 * ReactUIBridge - React UI との連携実装
 * 
 * IGameUIBridgeの本番実装
 * Zustandストアと連携してReactコンポーネントに状態を反映し、
 * 演出完了を待機する
 */
export class ReactUIBridge implements IGameUIBridge {
  /**
   * 演出の実行と待機
   * @param eventType イベント種類
   * @param data 演出データ
   */
  async playAnimation(eventType: AnimationEvent, data: any): Promise<void> {
    // TODO: 実装
    // 1. Zustandストアにアニメーションイベントを送信
    // 2. アニメーション完了を示すPromiseを生成
    // 3. UIからの完了通知を待つ
    console.log(`[ReactUIBridge] playAnimation: ${eventType}`, data);
  }

  /**
   * プレイヤーの入力待ち
   * @param requestType 入力要求種類
   * @param context 入力コンテキスト
   */
  async waitPlayerInput<T = any>(
    requestType: InputRequest,
    context: any
  ): Promise<T> {
    // TODO: 実装
    // 1. Zustandストアに入力要求を送信
    // 2. 入力完了を示すPromiseを生成
    // 3. UIからの入力を待つ
    console.log(`[ReactUIBridge] waitPlayerInput: ${requestType}`, context);
    return {} as T;
  }

  /**
   * ゲーム状態の更新通知
   * @param gameState 現在のゲーム状態
   */
  updateGameState(gameState: any): void {
    // TODO: 実装
    // Zustandストアのゲーム状態を更新
    console.log('[ReactUIBridge] updateGameState', gameState);
  }

  /**
   * ログメッセージの表示
   * @param message ログメッセージ
   * @param level ログレベル
   */
  log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    // TODO: 実装
    // Zustandストアにログを追加
    console.log(`[ReactUIBridge][${level}] ${message}`);
  }
}
