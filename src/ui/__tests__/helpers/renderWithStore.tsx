import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { GameState } from '@core/domain/models';
import type { AnimationQueueItem } from '@store/useUIStateStore';
import { InputRequest } from '@core/infrastructure/IGameUIBridge';
import { setupGameState, setupUIState, setupInputWaiting } from './storeUtils';

/**
 * renderWithStoreのオプション
 */
interface StoreRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** 初期ゲーム状態 */
  gameState?: GameState | null;
  /** アニメーションキュー */
  animationQueue?: AnimationQueueItem[];
  /** 入力待ちリクエスト種別 */
  inputRequest?: InputRequest;
  /** 入力待ちコンテキスト */
  inputContext?: Record<string, unknown>;
}

/**
 * Zustandストアを初期化した状態でコンポーネントをレンダリング
 *
 * 実ストアの setState を使用するため、vi.mock は不要。
 * テスト間分離は beforeEach での resetStores() で保証する。
 */
export const renderWithStore = (
  ui: React.ReactElement,
  options: StoreRenderOptions = {},
): RenderResult => {
  const {
    gameState = null,
    animationQueue,
    inputRequest,
    inputContext,
    ...renderOptions
  } = options;

  // ストアセットアップ
  setupGameState(gameState);
  setupUIState({ animationQueue });
  if (inputRequest) {
    setupInputWaiting(inputRequest, inputContext ?? {});
  }

  return render(ui, renderOptions);
};
