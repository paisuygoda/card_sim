import type { State } from '@core/domain/models';
import { StateVisualType } from '@core/domain/models';

/**
 * テスト用ステートファクトリ
 */
export const createMockState = (overrides: Partial<State> = {}): State => ({
  stateId: 'testState',
  name: 'テストステート',
  stateVisualType: StateVisualType.NONE,
  stacks: null,
  duration: null,
  triggerTimings: [],
  remainings: null,
  effects: [],
  excludes: [[], [], []],
  ...overrides,
});

// ===== プリセットステート =====

/** バフステート（攻撃力上昇・残り3ターン） */
export const createBuffState = (overrides: Partial<State> = {}): State =>
  createMockState({
    stateId: 'attackPowerUp',
    name: '攻撃力上昇',
    duration: 3,
    ...overrides,
  });

/** デバフステート（攻撃力低下・スタック5・残り2ターン） */
export const createDebuffState = (overrides: Partial<State> = {}): State =>
  createMockState({
    stateId: 'attackPowerDown',
    name: '攻撃力低下',
    stacks: 5,
    duration: 2,
    ...overrides,
  });

/** 死亡ステート（永続・スタック不可） */
export const createDeadState = (overrides: Partial<State> = {}): State =>
  createMockState({
    stateId: 'dead',
    name: '死亡',
    ...overrides,
  });

/** 防御バフステート（防御力上昇・残り3ターン） */
export const createDefenseBuffState = (overrides: Partial<State> = {}): State =>
  createMockState({
    stateId: 'defensePowerUp',
    name: '防御力上昇',
    duration: 3,
    ...overrides,
  });

/** 永続スタック付きステート（繁栄・スタック3） */
export const createProsperityState = (overrides: Partial<State> = {}): State =>
  createMockState({
    stateId: 'prosperity',
    name: '繁栄',
    stacks: 3,
    ...overrides,
  });
