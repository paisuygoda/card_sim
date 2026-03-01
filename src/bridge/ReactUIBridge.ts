import { IGameUIBridge, GameEvent, InputRequest, GameEventDataMap } from '@core/infrastructure/IGameUIBridge';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameState, Command } from '@core/domain/models';

/**
 * ReactUIBridge - React UI との連携実装
 * 
 * IGameUIBridgeの本番実装
 * Zustandストアと連携してReactコンポーネントに状態を反映
 * 
 * 設計思想:
 * - notifyGameEvent: キューに積むだけで即座にreturn（ロジックの進行を妨げない）
 * - UI側: キューを監視して独立に演出を処理
 * - waitUI: キューが空になるまで待機（同期ポイント）
 */
export class ReactUIBridge implements IGameUIBridge {
  /**
   * 演出の実行
   * イベントをキューに追加するだけで即座にreturn
   * 演出の実行はUI側が行う
   * 
   * @param eventType イベント種類
   * @param data 演出データ
   */
  async notifyGameEvent<T extends GameEvent>(
    eventType: T,
    data: GameEventDataMap[T]
  ): Promise<void> {
    // Zustandストアのキューにイベントを追加
    useUIStateStore.getState().enqueueAnimation(eventType, data);
    
    // 即座にreturn（演出完了を待たない）
  }

  /**
   * UI処理完了の待機
   * アニメーションキューが空になるまで待機
   * これがゲームロジックとUIの同期ポイント
   * 
   * Zustand の subscribe を使ったイベント駆動型待機で、
   * ポーリングによる不必要なCPU消費を排除している。
   */
  async waitUI(): Promise<void> {
    // 既にキューが空で再生中でもなければ即座にreturn
    const state = useUIStateStore.getState();
    if (!state.hasAnimationInQueue() && !state.isAnimationPlaying()) {
      return;
    }

    return new Promise<void>((resolve) => {
      const unsubscribe = useUIStateStore.subscribe((state) => {
        if (!state.hasAnimationInQueue() && !state.isAnimationPlaying()) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * プレイヤーの入力待ち
   * @param requestType 入力要求種類
   * @param context 入力コンテキスト
   * @returns 選択されたコマンド
   */
  async waitPlayerInput(
    requestType: InputRequest,
    context: any
  ): Promise<Command> {
    // Zustandストアに入力要求を送信し、完了を待機
    const result = await useUIStateStore.getState().startInput<Command>(
      requestType,
      context
    );
    return result;
  }

  /**
   * ゲーム状態の更新通知
   * @param gameState 現在のゲーム状態
   */
  updateGameState(gameState: GameState): void {
    // 深いコピーを生成してZustandに渡す
    // GameManagerやBattleLogicはgameStateをin-placeで変異させるため、
    // nations[i].units[j].currentHP などのネストされた変更はシャローコピーでは検知されない。
    // React.memoはpropsの参照比較（Object.is）を使うため、
    // structuredCloneで全ネストオブジェクトに新しい参照を付与して再レンダリングを確実にする。
    useGameStateStore.getState().setGameState(structuredClone(gameState));
  }

  /**
   * ログメッセージの表示
   * @param message ログメッセージ
   * @param level ログレベル
   */
  log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    // Zustandストアにログを追加
    useUIStateStore.getState().addLog(message, level);
    
    // 開発環境ではコンソールにも出力
    if (import.meta.env.DEV) {
      const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
      logFn(`[ReactUIBridge][${level}] ${message}`);
    }
  }
}
