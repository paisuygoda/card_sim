import { create } from 'zustand';
import { AnimationEvent, InputRequest } from '@core/infrastructure/IGameUIBridge';

/**
 * useUIStateStore - UI状態管理
 * 
 * アニメーション状態、入力待ち状態、ログなど
 * UI固有の状態を管理
 */

interface AnimationState {
  eventType: AnimationEvent;
  data: any;
  isPlaying: boolean;
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
  /** アニメーション状態 */
  animation: AnimationState | null;

  /** 入力待ち状態 */
  input: InputState | null;

  /** ログエントリー */
  logs: LogEntry[];

  /** アニメーション開始 */
  startAnimation: (eventType: AnimationEvent, data: any) => Promise<void>;

  /** アニメーション完了 */
  completeAnimation: () => void;

  /** 入力要求開始 */
  startInput: <T = any>(requestType: InputRequest, context: any) => Promise<T>;

  /** 入力完了 */
  completeInput: <T = any>(value: T) => void;

  /** ログ追加 */
  addLog: (message: string, level?: 'info' | 'warning' | 'error') => void;

  /** ログクリア */
  clearLogs: () => void;
}

let animationResolve: (() => void) | null = null;
let inputResolve: ((value: any) => void) | null = null;
let logIdCounter = 0;

export const useUIStateStore = create<UIStateStore>((set, get) => ({
  animation: null,
  input: null,
  logs: [],

  startAnimation: async (eventType: AnimationEvent, data: any) => {
    return new Promise<void>((resolve) => {
      animationResolve = resolve;
      set({
        animation: {
          eventType,
          data,
          isPlaying: true,
        },
      });
    });
  },

  completeAnimation: () => {
    if (animationResolve) {
      animationResolve();
      animationResolve = null;
    }
    set({ animation: null });
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
