import { describe, it, expect } from 'vitest';
import { domesticReducer, INITIAL_STATE, DomesticState } from '../useDomesticReducer';
import { createMockCommand } from '@ui/__tests__/fixtures';
import { createMockNation } from '@ui/__tests__/fixtures';
import { CommandTargetType } from '@core/domain/models';

describe('domesticReducer', () => {
  describe('COMMAND_SELECT モードからの遷移', () => {
    it('SELF_NATION コマンド → isSubmitting: true', () => {
      const command = createMockCommand({ targetType: CommandTargetType.SELF_NATION });
      const next = domesticReducer(INITIAL_STATE, { type: 'SELECT_COMMAND', command });
      expect(next).toEqual({ mode: 'COMMAND_SELECT', isSubmitting: true });
    });

    it('SELF_UNIT コマンド → TARGET_UNIT_SELECT (SELF)', () => {
      const command = createMockCommand({ targetType: CommandTargetType.SELF_UNIT });
      const next = domesticReducer(INITIAL_STATE, { type: 'SELECT_COMMAND', command });
      expect(next.mode).toBe('TARGET_UNIT_SELECT');
      if (next.mode === 'TARGET_UNIT_SELECT') {
        expect(next.pendingCommand).toBe(command);
        expect(next.unitSelectMode).toBe('SELF');
      }
    });

    it('ENEMY_NATION コマンド → TARGET_NATION_SELECT', () => {
      const command = createMockCommand({ targetType: CommandTargetType.ENEMY_NATION });
      const next = domesticReducer(INITIAL_STATE, { type: 'SELECT_COMMAND', command });
      expect(next.mode).toBe('TARGET_NATION_SELECT');
      if (next.mode === 'TARGET_NATION_SELECT') {
        expect(next.pendingCommand).toBe(command);
      }
    });

    it('ALL_ENEMY_NATIONS コマンド → TARGET_NATION_SELECT', () => {
      const command = createMockCommand({ targetType: CommandTargetType.ALL_ENEMY_NATIONS });
      const next = domesticReducer(INITIAL_STATE, { type: 'SELECT_COMMAND', command });
      expect(next.mode).toBe('TARGET_NATION_SELECT');
    });

    it('ENEMY_UNIT コマンド → TARGET_NATION_SELECT', () => {
      const command = createMockCommand({ targetType: CommandTargetType.ENEMY_UNIT });
      const next = domesticReducer(INITIAL_STATE, { type: 'SELECT_COMMAND', command });
      expect(next.mode).toBe('TARGET_NATION_SELECT');
    });

    it('isSubmitting: true の場合はコマンド選択を無視', () => {
      const state: DomesticState = { mode: 'COMMAND_SELECT', isSubmitting: true };
      const command = createMockCommand();
      const next = domesticReducer(state, { type: 'SELECT_COMMAND', command });
      expect(next).toBe(state); // 同一参照
    });

    it('COMMAND_SELECT 以外のモードでは SELECT_COMMAND を無視', () => {
      const command = createMockCommand({ targetType: CommandTargetType.ENEMY_NATION });
      const state: DomesticState = { mode: 'TARGET_NATION_SELECT', pendingCommand: command };
      const newCommand = createMockCommand();
      const next = domesticReducer(state, { type: 'SELECT_COMMAND', command: newCommand });
      expect(next).toBe(state);
    });
  });

  describe('TARGET_NATION_SELECT モードからの遷移', () => {
    const enemyNationCmd = createMockCommand({ targetType: CommandTargetType.ENEMY_NATION });
    const enemyUnitCmd = createMockCommand({ targetType: CommandTargetType.ENEMY_UNIT });
    const nation = createMockNation({ nationId: 'enemy', name: '敵国' });

    it('ENEMY_NATION コマンド + 国家選択 → SUBMITTING', () => {
      const state: DomesticState = { mode: 'TARGET_NATION_SELECT', pendingCommand: enemyNationCmd };
      const next = domesticReducer(state, { type: 'SELECT_NATION', nation });
      expect(next.mode).toBe('SUBMITTING');
    });

    it('ENEMY_UNIT コマンド + 国家選択 → TARGET_UNIT_SELECT (ENEMY)', () => {
      const state: DomesticState = { mode: 'TARGET_NATION_SELECT', pendingCommand: enemyUnitCmd };
      const next = domesticReducer(state, { type: 'SELECT_NATION', nation });
      expect(next.mode).toBe('TARGET_UNIT_SELECT');
      if (next.mode === 'TARGET_UNIT_SELECT') {
        expect(next.pendingCommand).toBe(enemyUnitCmd);
        expect(next.targetNation).toBe(nation);
        expect(next.unitSelectMode).toBe('ENEMY');
      }
    });

    it('TARGET_NATION_SELECT 以外のモードでは SELECT_NATION を無視', () => {
      const next = domesticReducer(INITIAL_STATE, { type: 'SELECT_NATION', nation });
      expect(next).toBe(INITIAL_STATE);
    });
  });

  describe('TARGET_UNIT_SELECT モードからの遷移', () => {
    it('ユニット選択 → SUBMITTING', () => {
      const command = createMockCommand({ targetType: CommandTargetType.SELF_UNIT });
      const nation = createMockNation();
      const state: DomesticState = {
        mode: 'TARGET_UNIT_SELECT',
        pendingCommand: command,
        targetNation: nation,
        unitSelectMode: 'SELF',
      };
      const next = domesticReducer(state, { type: 'SELECT_UNIT', unitIndex: 0 });
      expect(next.mode).toBe('SUBMITTING');
    });

    it('TARGET_UNIT_SELECT 以外のモードでは SELECT_UNIT を無視', () => {
      const next = domesticReducer(INITIAL_STATE, { type: 'SELECT_UNIT', unitIndex: 0 });
      expect(next).toBe(INITIAL_STATE);
    });
  });

  describe('CANCEL / RESET', () => {
    it('CANCEL で初期状態に戻る', () => {
      const command = createMockCommand({ targetType: CommandTargetType.ENEMY_NATION });
      const state: DomesticState = { mode: 'TARGET_NATION_SELECT', pendingCommand: command };
      const next = domesticReducer(state, { type: 'CANCEL' });
      expect(next).toEqual(INITIAL_STATE);
    });

    it('RESET で初期状態に戻る', () => {
      const state: DomesticState = { mode: 'SUBMITTING' };
      const next = domesticReducer(state, { type: 'RESET' });
      expect(next).toEqual(INITIAL_STATE);
    });
  });
});
