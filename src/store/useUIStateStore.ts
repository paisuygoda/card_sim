import { create } from 'zustand';
import { GameEvent, InputRequest } from '@core/infrastructure/IGameUIBridge';

/**
 * useUIStateStore - UI状態管理
 * 
 * アニメーション状態、入力待ち状態、ログなど
 * UI固有の状態を管理
 */

interface AnimationState {
  eventType: GameEvent;
  data: any;
  isPlaying: boolean;
}

interface AnimationQueueItem {
  eventType: GameEvent;
  data: any;
}

interface InputState<T = any> {
  requestType: InputRequest;
  context: any;
  isWaiting: boolean;
  resolve?: (value: T) => void;
}

interface LogEntry {
  id: number;
  message: string;
  level: 'info' | 'warning' | 'error';
  timestamp: number;
}

interface UIStateStore {
  /** アニメーションキュー */
  animationQueue: AnimationQueueItem[];

  /** 現在再生中のアニメーション */
  currentAnimation: AnimationState | null;

  /** 入力待ち状態 */
  input: InputState | null;

  /** ログエントリー */
  logs: LogEntry[];

  /** アニメーションをキューに追加 */
  enqueueAnimation: (eventType: GameEvent, data: any) => void;

  /** キューから次のアニメーションを取得して再生開始 */
  dequeueAnimation: () => void;

  /** 現在のアニメーション完了 */
  completeAnimation: () => void;

  /** キューにアニメーションがあるか */
  hasAnimationInQueue: () => boolean;

  /** アニメーション再生中か */
  isAnimationPlaying: () => boolean;

  /** 入力要求開始 */
  startInput: <T = any>(requestType: InputRequest, context: any) => Promise<T>;

  /** 入力完了 */
  completeInput: <T = any>(value: T) => void;

  /** ログ追加 */
  addLog: (message: string, level?: 'info' | 'warning' | 'error') => void;

  /** ログクリア */
  clearLogs: () => void;
}

let inputResolve: ((value: any) => void) | null = null;
let logIdCounter = 0;

export const useUIStateStore = create<UIStateStore>((set, get) => ({
  animationQueue: [],
  currentAnimation: null,
  input: null,
  logs: [],

  enqueueAnimation: (eventType: GameEvent, data: any) => {
    set((state) => ({
      animationQueue: [...state.animationQueue, { eventType, data }],
    }));
  },

  dequeueAnimation: () => {
    const state = get();
    if (state.animationQueue.length === 0 || state.currentAnimation?.isPlaying) {
      return;
    }

    const nextAnimation = state.animationQueue[0];
    set((state) => ({
      animationQueue: state.animationQueue.slice(1),
      currentAnimation: {
        eventType: nextAnimation.eventType,
        data: nextAnimation.data,
        isPlaying: true,
      },
    }));
  },

  completeAnimation: () => {
    set({ currentAnimation: null });
    // 次のアニメーションがあれば自動的に開始
    const state = get();
    if (state.animationQueue.length > 0) {
      state.dequeueAnimation();
    }
  },

  hasAnimationInQueue: () => {
    return get().animationQueue.length > 0;
  },

  isAnimationPlaying: () => {
    return get().currentAnimation?.isPlaying ?? false;
  },

  startInput: async <T = any>(requestType: InputRequest, context: any) => {
    return new Promise<T>((resolve) => {
      inputResolve = resolve;
      set({
        input: {
          requestType,
          context,
          isWaiting: true,
          resolve,
        },
      });
    });
  },

  completeInput: <T = any>(value: T) => {
    if (inputResolve) {
      inputResolve(value);
      inputResolve = null;
    }
    set({ input: null });
  },

  addLog: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    const newLog: LogEntry = {
      id: logIdCounter++,
      message,
      level,
      timestamp: Date.now(),
    };
    set((state) => ({
      logs: [...state.logs, newLog],
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },
}));
