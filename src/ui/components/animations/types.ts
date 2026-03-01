import { GameState } from '@core/domain/models';
import { AnimationQueueItem } from '@store/useUIStateStore';

/**
 * 個別アニメーションコンポーネント共通のProps
 *
 * AnimationDisplayから各アニメーションコンポーネントに渡されるデータ。
 * data の型はイベント種別ごとに異なるため any を使用。
 */
export interface AnimationRendererProps {
  /** イベントデータ */
  data: any;
  /** 現在のゲーム状態（ユニット名・国家名の解決に使用） */
  gameState: GameState | null;
  /** アニメーションキュー（国力変動の要約表示判定に使用） */
  animationQueue: AnimationQueueItem[];
}
