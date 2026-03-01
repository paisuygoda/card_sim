import { useReducer } from 'react';
import { Command, CommandTargetType } from '@core/domain/models';
import { Nation } from '@core/domain/models';

/**
 * DomesticScreen の状態を表す判別共用体型
 * 各モードに必要なデータを明示的に保持する
 */
export type DomesticState =
  | { mode: 'COMMAND_SELECT'; isSubmitting: boolean }
  | { mode: 'TARGET_NATION_SELECT'; pendingCommand: Command }
  | { mode: 'TARGET_UNIT_SELECT'; pendingCommand: Command; targetNation: Nation; unitSelectMode: 'SELF' | 'ENEMY' }
  | { mode: 'SUBMITTING' };

/**
 * DomesticScreen で発生するアクションの型
 */
export type DomesticAction =
  | { type: 'SELECT_COMMAND'; command: Command }
  | { type: 'SELECT_NATION'; nation: Nation }
  | { type: 'SELECT_UNIT'; unitIndex: number }
  | { type: 'CANCEL' }
  | { type: 'SUBMIT' }
  | { type: 'RESET' };

export const INITIAL_STATE: DomesticState = { mode: 'COMMAND_SELECT', isSubmitting: false };

/**
 * DomesticScreen の状態遷移を純粋関数で定義
 */
export function domesticReducer(state: DomesticState, action: DomesticAction): DomesticState {
  switch (action.type) {
    case 'SELECT_COMMAND': {
      if (state.mode !== 'COMMAND_SELECT' || state.isSubmitting) {
        return state;
      }
      const { command } = action;

      // 自国ユニット選択が必要なコマンド
      if (command.targetType === CommandTargetType.SELF_UNIT) {
        return {
          mode: 'TARGET_UNIT_SELECT',
          pendingCommand: command,
          targetNation: null as unknown as Nation, // 自国は後でpropsから取得
          unitSelectMode: 'SELF',
        };
      }

      // 敵国選択が必要なコマンド（国家 or ユニット）
      if (
        command.targetType === CommandTargetType.ENEMY_NATION ||
        command.targetType === CommandTargetType.ALL_ENEMY_NATIONS ||
        command.targetType === CommandTargetType.ENEMY_UNIT
      ) {
        return {
          mode: 'TARGET_NATION_SELECT',
          pendingCommand: command,
        };
      }

      // ターゲット不要 → 即送信
      return { mode: 'COMMAND_SELECT', isSubmitting: true };
    }

    case 'SELECT_NATION': {
      if (state.mode !== 'TARGET_NATION_SELECT') {
        return state;
      }
      const { pendingCommand } = state;

      // ENEMY_UNIT コマンド → ユニット選択へ遷移
      if (pendingCommand.targetType === CommandTargetType.ENEMY_UNIT) {
        return {
          mode: 'TARGET_UNIT_SELECT',
          pendingCommand,
          targetNation: action.nation,
          unitSelectMode: 'ENEMY',
        };
      }

      // ENEMY_NATION / ALL_ENEMY_NATIONS → 即送信
      return { mode: 'SUBMITTING' };
    }

    case 'SELECT_UNIT': {
      if (state.mode !== 'TARGET_UNIT_SELECT') {
        return state;
      }
      return { mode: 'SUBMITTING' };
    }

    case 'CANCEL':
      return INITIAL_STATE;

    case 'SUBMIT':
      return { mode: 'SUBMITTING' };

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
}

export function useDomesticReducer() {
  return useReducer(domesticReducer, INITIAL_STATE);
}
