import { describe, it, expect } from 'vitest';
import { isCommandExecutable } from '../CommandLogic';
import { Command, CommandType, CommandTargetType, CommandVisualType } from '../../models/Command';
import { Nation } from '../../models/Nation';

/**
 * CommandLogic ユニットテスト
 * 対象: isCommandExecutable()
 */

/** テスト用の最小コマンドを生成するヘルパー */
const makeCommand = (
  overrides: Partial<Pick<Command, 'costAction' | 'costPower' | 'unitSpace'>>
): Command => ({
  commandId: 'cmd-test',
  commandType: CommandType.DOMESTIC,
  name: 'テストコマンド',
  commandVisualType: CommandVisualType.DOMESTIC,
  costAction: 1,
  costPower: 0,
  unitSpace: 0,
  targetType: CommandTargetType.SELF_NATION,
  effects: [],
  ...overrides,
});

/** テスト用の最小国家を生成するヘルパー */
const makeNation = (
  overrides: Partial<Pick<Nation, 'remainingActions' | 'power' | 'units'>>
): Nation => ({
  nationId: 'nation-test',
  name: 'テスト国家',
  isNPC: false,
  power: 10,
  remainingActions: 2,
  states: [],
  units: [null, null, null, null, null, null, null, null],
  graveyard: [],
  domesticCommands: [],
  actionCommands: [],
  targetMilitaryRatio: 0.5,
  aggressiveness: 0.5,
  hostileNationIds: [],
  ...overrides,
});

describe('isCommandExecutable', () => {
  describe('行動回数 (costAction)', () => {
    it('残り行動回数 >= costAction のとき実行可能', () => {
      const command = makeCommand({ costAction: 2 });
      const nation = makeNation({ remainingActions: 2 });
      expect(isCommandExecutable(command, nation)).toBe(true);
    });

    it('残り行動回数 < costAction のとき実行不可', () => {
      const command = makeCommand({ costAction: 3 });
      const nation = makeNation({ remainingActions: 2 });
      expect(isCommandExecutable(command, nation)).toBe(false);
    });
  });

  describe('国力 (costPower)', () => {
    it('国力 >= costPower のとき実行可能', () => {
      const command = makeCommand({ costPower: 5 });
      const nation = makeNation({ power: 5 });
      expect(isCommandExecutable(command, nation)).toBe(true);
    });

    it('国力 < costPower のとき実行不可', () => {
      const command = makeCommand({ costPower: 6 });
      const nation = makeNation({ power: 5 });
      expect(isCommandExecutable(command, nation)).toBe(false);
    });
  });

  describe('空きスロット数 (unitSpace)', () => {
    it('空きスロット数 >= unitSpace のとき実行可能', () => {
      const command = makeCommand({ unitSpace: 2 });
      // units[0], units[1] が埋まっていて残り6スロットが null
      const nation = makeNation({
        units: [{} as any, {} as any, null, null, null, null, null, null],
      });
      expect(isCommandExecutable(command, nation)).toBe(true);
    });

    it('空きスロット数 < unitSpace のとき実行不可', () => {
      const command = makeCommand({ unitSpace: 3 });
      // null が 2 つだけ
      const nation = makeNation({
        units: [{} as any, {} as any, {} as any, {} as any, {} as any, {} as any, null, null],
      });
      expect(isCommandExecutable(command, nation)).toBe(false);
    });

    it('unitSpace が 0 のとき空きスロットに関わらず実行可能', () => {
      const command = makeCommand({ unitSpace: 0 });
      // すべてのスロットが埋まっている
      const units = Array(8).fill({} as any);
      const nation = makeNation({ units });
      expect(isCommandExecutable(command, nation)).toBe(true);
    });
  });

  describe('複合条件', () => {
    it('全条件を満たすとき実行可能', () => {
      const command = makeCommand({ costAction: 1, costPower: 3, unitSpace: 1 });
      const nation = makeNation({ remainingActions: 2, power: 5, units: [null, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any] });
      expect(isCommandExecutable(command, nation)).toBe(true);
    });

    it('一つでも条件を満たさないとき実行不可', () => {
      // costPower だけ足りない
      const command = makeCommand({ costAction: 1, costPower: 10, unitSpace: 0 });
      const nation = makeNation({ remainingActions: 2, power: 5 });
      expect(isCommandExecutable(command, nation)).toBe(false);
    });
  });
});
