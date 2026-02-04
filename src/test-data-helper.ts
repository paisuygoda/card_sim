/**
 * テストデータ生成ヘルパー
 * 
 * ゲームロジックのテスト用に簡単なステージ、国家、ユニットデータを生成
 */

import {
  Stage,
  Nation,
  Unit,
  Skill,
  Command,
  State,
  Effect,
  TargetPattern,
  CommandType,
  EffectType,
  EffectTarget,
  ValueType,
  VisualType,
  GamePhase,
} from './core/domain/models';

/**
 * 簡単なスキルを生成
 */
export function createSimpleSkill(
  skillId: number,
  name: string,
  priority: number = 50,
  damageRate: number = 1.0,
  targetPattern: TargetPattern = TargetPattern.FRONT
): Skill {
  return {
    skillId,
    name,
    priority,
    targetPattern,
    preEffects: [],
    damageRate,
    powerStealRate: 0.5, // HP損失の50%を国力奪取
    unitEffects: [],
    nationEffects: [],
  };
}

/**
 * 簡単なユニットを生成
 */
export function createSimpleUnit(
  unitId: number,
  ownerNationId: number,
  name: string,
  hp: number = 100,
  attack: number = 10,
  skillPriority: number = 50
): Unit {
  return {
    unitId,
    ownerNationId,
    name,
    maxHP: hp,
    currentHP: hp,
    attack,
    skill: createSimpleSkill(unitId * 100, `${name}の攻撃`, skillPriority),
    states: [],
  };
}

/**
 * 簡単な内政コマンドを生成
 */
export function createDomesticCommand(
  commandId: number,
  name: string,
  powerGain: number
): Command {
  return {
    commandId,
    commandType: CommandType.DOMESTIC,
    name,
    effects: [
      {
        effectType: EffectType.POWER_GAIN,
        visualType: VisualType.NONE,
        target: EffectTarget.SELF_NATION,
        valueType: ValueType.FIXED,
        value: powerGain,
      },
    ],
  };
}

/**
 * 戦闘コマンドを生成
 */
export function createBattleCommand(commandId: number): Command {
  return {
    commandId,
    commandType: CommandType.BATTLE,
    name: '戦闘',
    effects: [],
  };
}

/**
 * 簡単な国家を生成
 */
export function createSimpleNation(
  nationId: number,
  name: string,
  isNPC: boolean = false,
  initialPower: number = 1000
): Nation {
  // 3つのユニット（前衛・中衛・後衛）+ 5つのベンチ枠
  const units: (Unit | null)[] = [
    createSimpleUnit(nationId * 10 + 1, nationId, `${name}前衛`, 100, 15, 60),
    createSimpleUnit(nationId * 10 + 2, nationId, `${name}中衛`, 80, 12, 50),
    createSimpleUnit(nationId * 10 + 3, nationId, `${name}後衛`, 60, 20, 70),
    null, // ベンチ
    null,
    null,
    null,
    null,
  ];

  const domesticCommands: Command[] = [
    createDomesticCommand(nationId * 100 + 1, '徴税', 100),
    createDomesticCommand(nationId * 100 + 2, '交易', 150),
    createDomesticCommand(nationId * 100 + 3, '開拓', 200),
    createBattleCommand(nationId * 100 + 10),
  ];

  return {
    nationId,
    name,
    isNPC,
    power: initialPower,
    remainingActions: 3,
    states: [],
    units,
    graveyard: [],
    domesticCommands,
    actionCommands: [createBattleCommand(nationId * 100 + 20)],
    targetMilitaryRatio: 0.3,
    aggressiveness: 1.2,
    hostileNationIds: [], // 後で設定
  };
}

/**
 * 2国家対戦のテストステージを生成
 */
export function createTwoNationTestStage(): Stage {
  const nation1 = createSimpleNation(0, 'プレイヤー国', false, 1000);
  const nation2 = createSimpleNation(1, 'NPC国', true, 1000);

  // 敵対関係を設定
  nation1.hostileNationIds = [1];
  nation2.hostileNationIds = [0];

  return {
    stageId: 1,
    roundLimit: 5,
    powerWinThreshold: null,
    baseDomesticActions: 3,
    initialNations: [nation1, nation2],
  };
}

/**
 * 3国家対戦のテストステージを生成
 */
export function createThreeNationTestStage(): Stage {
  const nation1 = createSimpleNation(0, 'プレイヤー国', false, 1000);
  const nation2 = createSimpleNation(1, 'NPC国A', true, 800);
  const nation3 = createSimpleNation(2, 'NPC国B', true, 1200);

  // 敵対関係を設定
  nation1.hostileNationIds = [1, 2];
  nation2.hostileNationIds = [0, 2];
  nation3.hostileNationIds = [0, 1];

  return {
    stageId: 2,
    roundLimit: 10,
    powerWinThreshold: null,
    baseDomesticActions: 3,
    initialNations: [nation1, nation2, nation3],
  };
}

/**
 * 簡易デバッグ用：1ラウンドだけのミニステージ
 */
export function createMiniTestStage(): Stage {
  const nation1 = createSimpleNation(0, 'プレイヤー', false, 500);
  const nation2 = createSimpleNation(1, 'NPC', true, 500);

  nation1.hostileNationIds = [1];
  nation2.hostileNationIds = [0];

  // ユニットを簡略化（前衛のみ）
  nation1.units = [
    createSimpleUnit(1, 0, '勇者', 50, 10),
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];

  nation2.units = [
    createSimpleUnit(2, 1, '魔王', 50, 10),
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];

  return {
    stageId: 999,
    roundLimit: 1,
    powerWinThreshold: null,
    baseDomesticActions: 1,
    initialNations: [nation1, nation2],
  };
}
