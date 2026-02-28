import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { beforeAttackStep } from '../BattleLogic';
import { GameState, Unit, Nation, Skill, SkillVisualType, TargetPattern, EffectType, EffectTarget, EffectVisualType, ValueType, GamePhase } from '../../models';
import { IGameUIBridge, GameEvent } from '../../../infrastructure/IGameUIBridge';
import { MasterData } from '../../master';

/**
 * BattleLogic: preEffectsロジック検証テスト（改善版）
 * 
 * 目的: BattleLogic.tsのbeforeAttackStep()内のpreEffects処理が正しく動作することを検証
 * テスト設計書: .github/tasks/タスク2-5/tests/タスク2-5-3.md
 * 
 * 改善点:
 * - マジックナンバーを定数化
 * - ヘルパー関数によるアサーションの共通化
 * - モックのクリーンアップを追加
 */

describe('BattleLogic - preEffects統合テスト', () => {
  // テスト用定数
  const TEST_HP_HEAL_AMOUNT = 10;
  const TEST_HP_DAMAGE_AMOUNT = 20;
  const TEST_HP_MULTIPLE_DAMAGE_AMOUNT = 15;
  const TEST_INITIAL_HP = 100;
  const TEST_ATTACK_VALUE = 100;
  const TEST_REDUCED_HP = 50;
  const TEST_NATION_POWER = 1000;
  const TEST_REMAINING_ACTIONS = 3;

  let mockBridge: IGameUIBridge;
  let eventLog: Array<{ event: GameEvent; data: any }>;
  let gameState: GameState;

  // ヘルパー関数: 回復イベントの検証
  const expectUnitHealEvent = (targetUnitId: string, amount: number) => {
    const healEvents = eventLog.filter(e => e.event === GameEvent.UNIT_HEAL);
    expect(healEvents.length).toBeGreaterThan(0);
    expect(healEvents[0].data.targetUnitId).toBe(targetUnitId);
    expect(healEvents[0].data.amount).toBe(amount);
  };

  // ヘルパー関数: ダメージイベントの検証
  const expectUnitDamageEvent = (targetUnitId: string, amount: number) => {
    const damageEvents = eventLog.filter(e => e.event === GameEvent.UNIT_DAMAGE);
    expect(damageEvents.length).toBeGreaterThan(0);
    expect(damageEvents[0].data.targetUnitId).toBe(targetUnitId);
    expect(damageEvents[0].data.amount).toBe(amount);
  };

  // ヘルパー関数: テスト用スキル生成
  const createTestSkill = (params: Partial<Skill> & { skillId: string }): Skill => ({
    name: 'テストスキル',
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT,
    preEffects: [],
    damageRate: 1.0,
    powerStealRate: 0.1,
    unitEffects: [],
    nationEffects: [],
    ...params,
  });

  // テスト用スキル定義
  const TEST_SKILL_SELF_BUFF: Skill = createTestSkill({
    skillId: "test-skill-self-buff",
    name: "自己強化攻撃",
    preEffects: [
      {
        target: 'SELF',
        effect: {
          effectType: EffectType.UNIT_HP_GAIN,
          visualType: EffectVisualType.HEAL,
          target: EffectTarget.SELF_UNIT,
          valueType: ValueType.FIXED,
          value: TEST_HP_HEAL_AMOUNT,
        }
      }
    ],
  });

  const TEST_SKILL_TARGET_DAMAGE: Skill = createTestSkill({
    skillId: "test-skill-target-damage",
    name: "先制ダメージ攻撃",
    preEffects: [
      {
        target: 'TARGET',
        effect: {
          effectType: EffectType.UNIT_HP_LOSS,
          visualType: EffectVisualType.DAMAGE,
          target: EffectTarget.TARGET_UNIT,
          valueType: ValueType.FIXED,
          value: TEST_HP_DAMAGE_AMOUNT,
        }
      }
    ],
  });

  const TEST_SKILL_MULTIPLE_PRE_EFFECTS: Skill = createTestSkill({
    skillId: "test-skill-multiple",
    name: "複合効果攻撃",
    preEffects: [
      {
        target: 'SELF',
        effect: {
          effectType: EffectType.UNIT_HP_GAIN,
          visualType: EffectVisualType.HEAL,
          target: EffectTarget.SELF_UNIT,
          valueType: ValueType.FIXED,
          value: TEST_HP_HEAL_AMOUNT,
        }
      },
      {
        target: 'TARGET',
        effect: {
          effectType: EffectType.UNIT_HP_LOSS,
          visualType: EffectVisualType.DAMAGE,
          target: EffectTarget.TARGET_UNIT,
          valueType: ValueType.FIXED,
          value: TEST_HP_MULTIPLE_DAMAGE_AMOUNT,
        }
      }
    ],
  });

  const TEST_SKILL_EMPTY_PRE_EFFECTS: Skill = createTestSkill({
    skillId: "test-skill-empty",
    name: "通常攻撃",
    preEffects: [],
  });

  beforeEach(() => {
    // イベントログのリセット
    eventLog = [];

    // モックUIBridgeの作成
    mockBridge = {
      notifyGameEvent: vi.fn(async (eventType, data) => {
        eventLog.push({ event: eventType, data });
      }),
      waitUI: vi.fn(async () => {}),
      waitPlayerInput: vi.fn(async () => ({} as any)),
      updateGameState: vi.fn(),
      log: vi.fn(),
    };

    // テスト用GameStateの初期化
    const attackerUnit: Unit = {
      baseUnitId: 'attacker',
      unitId: 'nation-a-attacker',
      ownerNationId: 'nation-a',
      name: '攻撃者',
      maxHP: TEST_INITIAL_HP,
      currentHP: TEST_INITIAL_HP,
      attack: TEST_ATTACK_VALUE,
      skillId: 'normalAttack',
      states: [],
    };

    const defenderUnit: Unit = {
      baseUnitId: 'defender',
      unitId: 'nation-b-defender',
      ownerNationId: 'nation-b',
      name: '防御者',
      maxHP: TEST_INITIAL_HP,
      currentHP: TEST_INITIAL_HP,
      attack: 50,
      skillId: 'normalAttack',
      states: [],
    };

    const attackerNation: Nation = {
      nationId: 'nation-a',
      name: '攻撃国',
      isNPC: false,
      power: TEST_NATION_POWER,
      remainingActions: TEST_REMAINING_ACTIONS,
      states: [],
      units: [attackerUnit, null, null, null, null, null, null, null],
      graveyard: [],
      domesticCommands: [],
      actionCommands: [],
      targetMilitaryRatio: 0.3,
      aggressiveness: 0.5,
      hostileNationIds: [],
    };

    const defenderNation: Nation = {
      nationId: 'nation-b',
      name: '防御国',
      isNPC: true,
      power: TEST_NATION_POWER,
      remainingActions: TEST_REMAINING_ACTIONS,
      states: [],
      units: [defenderUnit, null, null, null, null, null, null, null],
      graveyard: [],
      domesticCommands: [],
      actionCommands: [],
      targetMilitaryRatio: 0.3,
      aggressiveness: 0.5,
      hostileNationIds: [],
    };

    gameState = {
      stageId: 1,
      commandNum: 3,
      currentRound: 1,
      roundLimit: 10,
      nations: [attackerNation, defenderNation],
      currentTurnPlayer: 0,
      currentPhase: GamePhase.BATTLE_START,
      currentTarget: null,
      stateQueue: [],
      effectQueue: [],
      battleContext: {
        attackerNationId: 'nation-a',
        defenderNationId: 'nation-b',
        attackOrder: [],
        currentAttackIndex: 0,
        currentAttacker: attackerUnit,
        targetUnits: [defenderUnit],
        targetIndex: 0,
        pendingPowerDamage: 0,
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC1: SELF対象のpreEffect実行', () => {
    it('preEffectsのSELF対象効果が攻撃前に実行され、HPが回復する', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_SELF_BUFF);

      // 攻撃者のHPを減らしておく
      gameState.battleContext!.currentAttacker!.currentHP = TEST_REDUCED_HP;
      const initialHP = gameState.battleContext!.currentAttacker!.currentHP;

      // beforeAttackStepを実行
      await beforeAttackStep(gameState, mockBridge);

      // UNIT_HEALイベントが発火されたことを確認
      expectUnitHealEvent('nation-a-attacker', TEST_HP_HEAL_AMOUNT);

      // 攻撃者のHPが回復していることを確認
      expect(gameState.battleContext!.currentAttacker!.currentHP).toBe(initialHP + TEST_HP_HEAL_AMOUNT);
    });
  });

  describe('TC2: TARGET対象のpreEffect実行', () => {
    it('preEffectsのTARGET対象効果が攻撃前に実行され、対象のHPが減少する', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_TARGET_DAMAGE);

      const initialHP = gameState.battleContext!.targetUnits[0]!.currentHP;

      // beforeAttackStepを実行
      await beforeAttackStep(gameState, mockBridge);

      // UNIT_DAMAGEイベントが発火されたことを確認
      expectUnitDamageEvent('nation-b-defender', TEST_HP_DAMAGE_AMOUNT);

      // 対象のHPが減少していることを確認
      expect(gameState.battleContext!.targetUnits[0]!.currentHP).toBe(initialHP - TEST_HP_DAMAGE_AMOUNT);
    });
  });

  describe('TC3: 複数preEffectsの順序実行', () => {
    it('複数のpreEffectsが配列順に実行され、正しいイベントが順番に発火する', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_MULTIPLE_PRE_EFFECTS);

      // 攻撃者のHPを減らしておく
      gameState.battleContext!.currentAttacker!.currentHP = TEST_REDUCED_HP;
      const initialHP = gameState.battleContext!.currentAttacker!.currentHP;
      const initialTargetHP = gameState.battleContext!.targetUnits[0]!.currentHP;

      // beforeAttackStepを実行
      await beforeAttackStep(gameState, mockBridge);

      // イベントログから順序を確認
      expect(eventLog.length).toBeGreaterThanOrEqual(2);

      // 1つ目: UNIT_HEAL（SELF）
      const firstEvent = eventLog[0];
      expect(firstEvent.event).toBe(GameEvent.UNIT_HEAL);
      expect(firstEvent.data.targetUnitId).toBe('nation-a-attacker');
      expect(firstEvent.data.amount).toBe(TEST_HP_HEAL_AMOUNT);

      // 2つ目: UNIT_DAMAGE（TARGET）
      const secondEvent = eventLog[1];
      expect(secondEvent.event).toBe(GameEvent.UNIT_DAMAGE);
      expect(secondEvent.data.targetUnitId).toBe('nation-b-defender');
      expect(secondEvent.data.amount).toBe(TEST_HP_MULTIPLE_DAMAGE_AMOUNT);

      // 両方の効果が適用されていることを確認
      expect(gameState.battleContext!.currentAttacker!.currentHP).toBe(initialHP + TEST_HP_HEAL_AMOUNT);
      expect(gameState.battleContext!.targetUnits[0]!.currentHP).toBe(initialTargetHP - TEST_HP_MULTIPLE_DAMAGE_AMOUNT);
    });
  });

  describe('TC4: 複数の対象ユニットへのTARGET効果', () => {
    it('複数ターゲットに対してpreEffectが各ターゲットに適用される', async () => {
      // 2体目のdefenderを追加
      const defender2: Unit = {
        baseUnitId: 'defender2',
        unitId: 'nation-b-defender2',
        ownerNationId: 'nation-b',
        name: '防御者2',
        maxHP: TEST_INITIAL_HP,
        currentHP: TEST_INITIAL_HP,
        attack: 50,
        skillId: 'normalAttack',
        states: [],
      };

      gameState.nations[1].units[1] = defender2;
      gameState.battleContext!.targetUnits.push(defender2);

      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_TARGET_DAMAGE);

      // beforeAttackStepを実行
      await beforeAttackStep(gameState, mockBridge);

      // UNIT_DAMAGEイベントが2回発火されたことを確認
      const damageEvents = eventLog.filter(e => e.event === GameEvent.UNIT_DAMAGE);
      expect(damageEvents.length).toBe(2);

      // 両対象がダメージを受けていることを確認
      expect(gameState.battleContext!.targetUnits[0]!.currentHP).toBe(TEST_INITIAL_HP - TEST_HP_DAMAGE_AMOUNT);
      expect(gameState.battleContext!.targetUnits[1]!.currentHP).toBe(TEST_INITIAL_HP - TEST_HP_DAMAGE_AMOUNT);
    });
  });

  describe('TC5: preEffectsが空配列の場合', () => {
    it('preEffectsが空の場合でもエラーにならず、イベントも発火しない', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_EMPTY_PRE_EFFECTS);

      // beforeAttackStepを実行
      await beforeAttackStep(gameState, mockBridge);

      // preEffect関連のイベントが発火していないことを確認
      const healEvents = eventLog.filter(e => e.event === GameEvent.UNIT_HEAL);
      const damageEvents = eventLog.filter(e => e.event === GameEvent.UNIT_DAMAGE);
      expect(healEvents.length).toBe(0);
      expect(damageEvents.length).toBe(0);

      // エラーが発生していないこと（例外が発生しないこと）を確認
      expect(mockBridge.log).not.toHaveBeenCalledWith(expect.anything(), 'error');
    });
  });

  describe('TC6: UI通知のawait動作確認', () => {
    it('各preEffect実行でnotifyGameEventが呼ばれ、awaitで待機する', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_TARGET_DAMAGE);

      let notifyCallCount = 0;
      mockBridge.notifyGameEvent = vi.fn(async (eventType, data) => {
        notifyCallCount++;
        eventLog.push({ event: eventType, data });
        // 演出待機をシミュレート（実際のUIでは演出完了まで待機）
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // beforeAttackStepを実行
      await beforeAttackStep(gameState, mockBridge);

      // notifyGameEventが呼ばれたことを確認
      expect(notifyCallCount).toBeGreaterThan(0);
      // awaitが正しく動作していることを確認（例外なく完了）
      expect(mockBridge.notifyGameEvent).toHaveBeenCalled();
    });
  });
});
