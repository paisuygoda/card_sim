import { IGameUIBridge, AnimationEvent, InputRequest } from '@core/infrastructure/IGameUIBridge';

/**
 * MockUIBridge - 開発・デバッグ用モック実装
 * 
 * UI未実装時のテスト用
 * 一定時間待機してコンソール出力するだけの簡易実装
 */
export class MockUIBridge implements IGameUIBridge {
  private animationDelay: number;

  constructor(animationDelay: number = 500) {
    this.animationDelay = animationDelay;
  }

  /**
   * 演出の実行と待機（モック：一定時間待機）
   * @param eventType イベント種類
   * @param data 演出データ
   */
  async playAnimation(eventType: AnimationEvent, data: any): Promise<void> {
    console.log(`[MockUIBridge] playAnimation: ${eventType}`, data);
    await this.delay(this.animationDelay);
  }

  /**
   * プレイヤーの入力待ち（モック：自動選択）
   * @param requestType 入力要求種類
   * @param context 入力コンテキスト
   */
  async waitPlayerInput<T = any>(
    requestType: InputRequest,
    context: any
  ): Promise<T> {
    console.log(`[MockUIBridge] waitPlayerInput: ${requestType}`, context);
    await this.delay(1000);
    
    // TODO: 実装（モック応答）
    // コンテキストから適当な選択肢を返す
    return {} as T;
  }

  /**
   * ゲーム状態の更新通知（モック：コンソール出力のみ）
   * @param gameState 現在のゲーム状態
   */
  updateGameState(gameState: any): void {
    console.log('[MockUIBridge] updateGameState', {
      round: gameState.currentRound,
      phase: gameState.currentPhase,
      turnPlayer: gameState.currentTurnPlayer,
    });
  }

  /**
   * ログメッセージの表示（モック：コンソール出力のみ）
   * @param message ログメッセージ
   * @param level ログレベル
   */
  log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const prefix = `[MockUIBridge][${level.toUpperCase()}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warning':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * 待機用ヘルパー
   * @param ms 待機時間（ミリ秒）
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
