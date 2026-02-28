import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { beforeAttackStep } from '../BattleLogic';
import { GameState, Unit, Nation, Skill, SkillVisualType, TargetPattern, EffectType, EffectTarget, EffectVisualType, ValueType, GamePhase } from '../../models';
import { IGameUIBridge, GameEvent } from '../../../infrastructure/IGameUIBridge';
import { MasterData } from '../../master';

/**
 * BattleLogic: preEffectsロジック検証テスト
 * 
 * 目的: BattleLogic.tsのbeforeAttackStep()内のpreEffects処理が正しく動作することを検証
 * テスト設計書: .github/tasks/タスク2-5/tests/タスク2-5-3.md
 */

describe('BattleLogic - preEffects統合テスト', () => {
  let mockBridge: IGameUIBridge;
  let eventLog: Array<{ event: GameEvent; data: any }>;
  let gameState: GameState;

  // テスト用スキル定義
  const TEST_SKILL_SELF_BUFF: Skill = {
    skillId: "test-skill-self-buff",
    name: "自己強化攻撃",
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT,
    preEffects: [
      {
        target: 'SELF',
        effect: {
          effectType: EffectType.UNIT_HP_GAIN,
          visualType: EffectVisualType.HEAL,
          target: EffectTarget.SELF_UNIT,
          valueType: ValueType.FIXED,
          value: 10,
        }
      }
    ],
    damageRate: 1.0,
    powerStealRate: 0.1,
    unitEffects: [],
    nationEffects: [],
  };

  const TEST_SKILL_TARGET_DAMAGE: Skill = {
    skillId: "test-skill-target-damage",
    name: "先制ダメージ攻撃",
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT,
    preEffects: [
      {
        target: 'TARGET',
        effect: {
          effectType: EffectType.UNIT_HP_LOSS,
          visualType: EffectVisualType.DAMAGE,
          target: EffectTarget.TARGET_UNIT,
          valueType: ValueType.FIXED,
          value: 20,
        }
      }
    ],
    damageRate: 1.0,
    powerStealRate: 0.1,
    unitEffects: [],
    nationEffects: [],
  };

  const TEST_SKILL_MULTIPLE_PRE_EFFECTS: Skill = {
    skillId: "test-skill-multiple",
    name: "複合効果攻撃",
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT,
    preEffects: [
      {
        target: 'SELF',
        effect: {
          effectType: EffectType.UNIT_HP_GAIN,
          visualType: EffectVisualType.HEAL,
          target: EffectTarget.SELF_UNIT,
          valueType: ValueType.FIXED,
          value: 10,
        }
      },
      {
        target: 'TARGET',
        effect: {
          effectType: EffectType.UNIT_HP_LOSS,
          visualType: EffectVisualType.DAMAGE,
          target: EffectTarget.TARGET_UNIT,
          valueType: ValueType.FIXED,
          value: 15,
        }
      }
    ],
    damageRate: 1.0,
    powerStealRate: 0.1,
    unitEffects: [],
    nationEffects: [],
  };

  const TEST_SKILL_EMPTY_PRE_EFFECTS: Skill = {
    skillId: "test-skill-empty",
    name: "通常攻撃",
    skillVisualType: SkillVisualType.ATTACK,
    priority: 0,
    targetPattern: TargetPattern.FRONT,
    preEffects: [],
    damageRate: 1.0,
    powerStealRate: 0.1,
    unitEffects: [],
    nationEffects: [],
  };

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
      maxHP: 100,
      currentHP: 100,
      attack: 100,
      skillId: 'normalAttack',
      states: [],
    };

    const defenderUnit: Unit = {
      baseUnitId: 'defender',
      unitId: 'nation-b-defender',
      ownerNationId: 'nation-b',
      name: '防御者',
      maxHP: 100,
      currentHP: 100,
      attack: 50,
      skillId: 'normalAttack',
      states: [],
    };

    const attackerNation: Nation = {
      nationId: 'nation-a',
      name: '攻撃国',
      isNPC: false,
      power: 1000,
      remainingActions: 3,
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
      power: 1000,
      remainingActions: 3,
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
      gameState.battleContext!.currentAttacker!.currentHP = 50;
      const initialHP = gameState.battleContext!.currentAttacker!.currentHP;

      // beforeAttackStepを実行
      await beforeAttackStep(
        gameState,
        mockBridge
      );

      // UNIT_HEALイベントが発火されたことを確認
      const healEvents = eventLog.filter(e => e.event === GameEvent.UNIT_HEAL);
      expect(healEvents.length).toBeGreaterThan(0);
      expect(healEvents[0].data.targetUnitId).toBe('nation-a-attacker');
      expect(healEvents[0].data.amount).toBe(10);

      // 攻撃者のHPが回復していることを確認
      expect(gameState.battleContext!.currentAttacker!.currentHP).toBe(initialHP + 10);
    });
  });

  describe('TC2: TARGET対象のpreEffect実行', () => {
    it('preEffectsのTARGET対象効果が攻撃前に実行され、対象のHPが減少する', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_TARGET_DAMAGE);

      const initialHP = gameState.battleContext!.targetUnits[0]!.currentHP;

      // beforeAttackStepを実行
      await beforeAttackStep(
        gameState,
        mockBridge
      );

      // UNIT_DAMAGEイベントが発火されたことを確認
      const damageEvents = eventLog.filter(e => e.event === GameEvent.UNIT_DAMAGE);
      expect(damageEvents.length).toBeGreaterThan(0);
      expect(damageEvents[0].data.targetUnitId).toBe('nation-b-defender');
      expect(damageEvents[0].data.amount).toBe(20);

      // 対象のHPが減少していることを確認
      expect(gameState.battleContext!.targetUnits[0]!.currentHP).toBe(initialHP - 20);
    });
  });

  describe('TC3: 複数preEffectsの順序実行', () => {
    it('複数のpreEffectsが配列順に実行され、正しいイベントが順番に発火する', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_MULTIPLE_PRE_EFFECTS);

      // 攻撃者のHPを減らしておく
      gameState.battleContext!.currentAttacker!.currentHP = 50;
      const initialHP = gameState.battleContext!.currentAttacker!.currentHP;
      const initialTargetHP = gameState.battleContext!.targetUnits[0]!.currentHP;

      // beforeAttackStepを実行
      await beforeAttackStep(
        gameState,
        mockBridge
      );

      // イベントログから順序を確認
      expect(eventLog.length).toBeGreaterThanOrEqual(2);

      // 1つ目: UNIT_HEAL（SELF）
      const firstEvent = eventLog[0];
      expect(firstEvent.event).toBe(GameEvent.UNIT_HEAL);
      expect(firstEvent.data.targetUnitId).toBe('nation-a-attacker');
      expect(firstEvent.data.amount).toBe(10);

      // 2つ目: UNIT_DAMAGE（TARGET）
      const secondEvent = eventLog[1];
      expect(secondEvent.event).toBe(GameEvent.UNIT_DAMAGE);
      expect(secondEvent.data.targetUnitId).toBe('nation-b-defender');
      expect(secondEvent.data.amount).toBe(15);

      // 両方の効果が適用されていることを確認
      expect(gameState.battleContext!.currentAttacker!.currentHP).toBe(initialHP + 10);
      expect(gameState.battleContext!.targetUnits[0]!.currentHP).toBe(initialTargetHP - 15);
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
        maxHP: 100,
        currentHP: 100,
        attack: 50,
        skillId: 'normalAttack',
        states: [],
      };

      gameState.nations[1].units[1] = defender2;
      gameState.battleContext!.targetUnits.push(defender2);

      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_TARGET_DAMAGE);

      // beforeAttackStepを実行
      await beforeAttackStep(
        gameState,
        mockBridge
      );

      // UNIT_DAMAGEイベントが2回発火されたことを確認
      const damageEvents = eventLog.filter(e => e.event === GameEvent.UNIT_DAMAGE);
      expect(damageEvents.length).toBe(2);

      // 両対象がダメージを受けていることを確認
      expect(gameState.battleContext!.targetUnits[0]!.currentHP).toBe(80);
      expect(gameState.battleContext!.targetUnits[1]!.currentHP).toBe(80);
    });
  });

  describe('TC5: preEffectsが空配列の場合', () => {
    it('preEffectsが空の場合でもエラーにならず、イベントも発火しない', async () => {
      // MasterData.getSkillをモック化
      vi.spyOn(MasterData, 'getSkill').mockReturnValue(TEST_SKILL_EMPTY_PRE_EFFECTS);

      // beforeAttackStepを実行
      await beforeAttackStep(
        gameState,
        mockBridge
      );

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
      await beforeAttackStep(
        gameState,
        mockBridge
      );

      // notifyGameEventが呼ばれたことを確認
      expect(notifyCallCount).toBeGreaterThan(0);
      // awaitが正しく動作していることを確認（例外なく完了）
      expect(mockBridge.notifyGameEvent).toHaveBeenCalled();
    });
  });
});
