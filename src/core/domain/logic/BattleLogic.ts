import { BattleContext, GameState, Unit, Nation, GamePhase } from '../models';
import { IGameUIBridge, GameEvent } from '../../infrastructure/IGameUIBridge';
import { findNationById } from './NationManager';
import { calculateUnitEffectiveAttack } from './UnitManager';
import { executeStateProcessing } from './StateExecutor';
import { executeEffect } from './EffectExecutor';
import { safeMultiply, safeSubtract, safeAdd } from './GameMath';
import { MasterData } from '../master';
import { applyUnitDamage } from './effects';

/**
 * BattleLogic - 戦闘ロジック
 * 
 * 設計書3.3.5に基づき、戦闘フェーズの処理を実行
 */

/**
 * 戦闘フェーズ全体の実行（設計書3.3.5.1）
 * @param gameState ゲーム状態
 * @param attackerNationId 攻撃側国家ID
 * @param defenderNationId 防御側国家ID
 * @param bridge UIブリッジ
 */
export async function executeBattle(
  gameState: GameState,
  attackerNationId: string,
  defenderNationId: string,
  bridge: IGameUIBridge
): Promise<void> {
  // 戦闘コンテキストを初期化
  const battleContext: BattleContext = {
    attackerNationId,
    defenderNationId,
    attackOrder: [],
    currentAttackIndex: 0,
    targetUnits: [],
    targetIndex: 0,
    pendingPowerDamage: 0,
  };

  // 戦闘開始通知
  await bridge.notifyGameEvent(GameEvent.BATTLE_START, {
    attackerNationId,
    defenderNationId,
  });

  const attackerNation = findNationById(gameState, battleContext.attackerNationId);
  const defenderNation = findNationById(gameState, battleContext.defenderNationId);
    if (!attackerNation || !defenderNation) {
    bridge.log('Invalid nation IDs in battle context', 'error');
    return;
  }

  // 1. 戦闘開始ステップ
  await battleStartStep(attackerNation, defenderNation, gameState, battleContext, bridge);

  // 2. 各ユニットの攻撃処理
  await executeUnitAttacks(attackerNation, defenderNation, gameState, battleContext, bridge);

  // 3. 戦闘終了ステップ
  await battleEndStep(attackerNation, defenderNation, gameState, battleContext, bridge);

  // 戦闘終了通知
  await bridge.notifyGameEvent(GameEvent.BATTLE_END, {
    attackerNationId,
    defenderNationId,
  });
}

/**
 * 戦闘開始ステップ（設計書3.3.5.2）
 * @param attackerNation 攻撃側国家
 * @param defenderNation 防御側国家
 * @param gameState ゲーム状態
 * @param battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function battleStartStep(
  attackerNation: Nation,
  defenderNation: Nation,
  gameState: GameState,
  battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  // 2. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.BATTLE_START, bridge);

  // 3. 攻撃順序決定

  if (!attackerNation || !defenderNation) {
    bridge.log('Invalid nation IDs in battle context', 'error');
    return;
  }

  battleContext.attackOrder = determineAttackOrder(attackerNation, defenderNation);
}

/**
 * 攻撃順序を決定（設計書3.3.5.2）
 * スキル優先度 → ポジション → 所属国家の順
 * @param attackerNation 攻撃側国家
 * @param defenderNation 防御側国家
 * @returns 攻撃順序配列
 */
export function determineAttackOrder(
  attackerNation: Nation,
  defenderNation: Nation
): Unit[] {
  // 1. 両国の前線ユニット（インデックス0～2）を収集
  const frontlineUnits: Array<{ unit: Unit; position: number; isAttacker: boolean }> = [];

  for (let i = 0; i < 3; i++) {
    const attackerUnit = attackerNation.units[i];
    if (attackerUnit && !attackerUnit.states.some(s => s.stateId === 'dead')) {
      frontlineUnits.push({ unit: attackerUnit, position: i, isAttacker: true });
    }

    const defenderUnit = defenderNation.units[i];
    if (defenderUnit && !defenderUnit.states.some(s => s.stateId === 'dead')) {
      frontlineUnits.push({ unit: defenderUnit, position: i, isAttacker: false });
    }
  }

  // 2. ソート: スキル優先度降順 → ポジション降順 → 攻撃側優先
  frontlineUnits.sort((a, b) => {
    const skillA = MasterData.getSkill(a.unit.skillId);
    const skillB = MasterData.getSkill(b.unit.skillId);

    // スキル優先度で比較（高い方が先）
    if (skillA.priority !== skillB.priority) {
      return skillB.priority - skillA.priority;
    }

    // ポジションで比較（後衛 > 中衛 > 前衛 = 2 > 1 > 0）
    if (a.position !== b.position) {
      return b.position - a.position;
    }

    // 所属国家で比較（攻撃側が先）
    if (a.isAttacker !== b.isAttacker) {
      return a.isAttacker ? -1 : 1;
    }

    return 0;
  });

  return frontlineUnits.map(item => item.unit);
}

/**
 * 各ユニットの攻撃処理（設計書3.3.5.3）
 * @param attackerNation 攻撃側国家
 * @param defenderNation 防御側国家
 * @param gameState ゲーム状態
 * @param battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function executeUnitAttacks(
  attackerNation: Nation,
  defenderNation: Nation,
  gameState: GameState,
  battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  // 攻撃順序配列の各ユニットについて攻撃処理を実行
  while (battleContext.currentAttackIndex < battleContext.attackOrder.length) {
    // 1. 攻撃開始ステップ
    await attackStartStep(gameState, battleContext, bridge);

    // 攻撃者が設定されていない場合（全員死亡等）
    if (!battleContext.currentAttacker) {
      break;
    }

    // 2. 攻撃対象決定ステップ
    battleContext.targetUnits = determineTargets(battleContext.currentAttacker, attackerNation, defenderNation);

    // スキル発動通知
    const activatingSkill = MasterData.getSkill(battleContext.currentAttacker.skillId);
    await bridge.notifyGameEvent(GameEvent.SKILL_ACTIVATE, {
      attackerId: battleContext.currentAttacker.unitId!,
      skillId: battleContext.currentAttacker.skillId,
      skillName: activatingSkill.name,
      targets: battleContext.targetUnits.map(t => t?.unitId ?? null),
    });

    // 3. 攻撃直前ステップ
    await beforeAttackStep(gameState, battleContext, bridge);

    // 4. ユニットダメージステップ, 国力ダメージステップ
    battleContext.targetIndex = 0;
    await unitDamageStep(attackerNation, defenderNation, gameState, battleContext, bridge);

    // 6. 攻撃直後ステップ
    await afterAttackStep(gameState, battleContext, bridge);

    // 7. 攻撃終了ステップ
    await attackEndStep(gameState, battleContext, bridge);

    // 次の攻撃者へ
    battleContext.currentAttackIndex++;
    battleContext.currentAttacker = undefined;
  }
}

/**
 * 攻撃開始ステップ（設計書3.3.5.3.1）
 * @param gameState ゲーム状態
 * @param battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function attackStartStep(
  gameState: GameState,
  battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  // 1. 攻撃順序配列から攻撃者を取得
  // 死亡ユニットはスキップ
  while (battleContext.currentAttackIndex < battleContext.attackOrder.length) {
    const attacker = battleContext.attackOrder[battleContext.currentAttackIndex];
    
    // 死亡ステートチェック
    if (attacker.states.some(s => s.stateId === 'dead')) {
      battleContext.currentAttackIndex++;
      continue;
    }

    // 2. 攻撃中ユニットとして設定
    battleContext.currentAttacker = attacker;
    break;
  }

  // 全てスキップされた場合
  if (!battleContext.currentAttacker) {
    return;
  }

  // 3. 被攻撃ユニットインデックスをリセット
  battleContext.targetIndex = 0;

  // 4. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.ATTACK_START, bridge);
}

/**
 * 攻撃対象決定ステップ（設計書3.3.5.3.2）
 * @param attacker 攻撃者
 * @param attackerNation 攻撃側国家
 * @param defenderNation 防御側国家
 * @returns 被攻撃ユニット配列
 */
export function determineTargets(
  attacker: Unit,
  attackerNation: Nation,
  defenderNation: Nation
): (Unit | null)[] {
  const targetNation = attacker.ownerNationId === attackerNation.nationId ? defenderNation : attackerNation;
  const skill = MasterData.getSkill(attacker.skillId);
  const targetPattern = skill.targetPattern;

  // 攻撃範囲に応じた対象インデックス配列を取得
  const getTargetIndices = (pattern: string): number[] => {
    switch (pattern) {
      case 'FRONT': return [0];
      case 'MID': return [1];
      case 'BACK': return [2];
      case 'FRONT_MID': return [0, 1];
      case 'MID_BACK': return [1, 2];
      case 'FRONT_BACK': return [0, 2];
      case 'ALL': return [0, 1, 2];
      default: return [0];
    }
  };

  // 対象範囲をシフトする
  const shiftIndices = (indices: number[], offset: number): number[] => {
    return indices.map(i => i + offset).filter(i => i >= 0 && i < 3);
  };

  // 指定インデックス範囲に生存ユニットがいるかチェック
  const hasAliveUnit = (indices: number[]): boolean => {
    return indices.some(i => {
      const unit = targetNation.units[i];
      return unit !== null && !unit.states.some(s => s.stateId === 'dead');
    });
  };

  // 指定インデックス範囲から被攻撃ユニット配列を構築
  const buildTargetArray = (indices: number[]): (Unit | null)[] => {
    return indices.map(i => {
      const unit = targetNation.units[i];
      if (unit && !unit.states.some(s => s.stateId === 'dead')) {
        return unit;
      }
      return null;
    });
  };

  const baseIndices = getTargetIndices(targetPattern);
  const targetArrayLength = baseIndices.length;

  // 前線に生存ユニットがいない場合は空配列
  const hasFrontlineUnit = [0, 1, 2].some(i => {
    const unit = targetNation.units[i];
    return unit !== null && !unit.states.some(s => s.stateId === 'dead');
  });

  if (!hasFrontlineUnit) {
    return new Array(targetArrayLength).fill(null);
  }

  // 正規対象を確認
  if (hasAliveUnit(baseIndices)) {
    return buildTargetArray(baseIndices);
  }

  // 1つ後ろ
  const back1 = shiftIndices(baseIndices, 1);
  if (back1.length > 0 && hasAliveUnit(back1)) {
    return buildTargetArray(back1);
  }

  // 2つ後ろ
  const back2 = shiftIndices(baseIndices, 2);
  if (back2.length > 0 && hasAliveUnit(back2)) {
    return buildTargetArray(back2);
  }

  // 1つ手前
  const front1 = shiftIndices(baseIndices, -1);
  if (front1.length > 0 && hasAliveUnit(front1)) {
    return buildTargetArray(front1);
  }

  // 2つ手前
  const front2 = shiftIndices(baseIndices, -2);
  if (front2.length > 0 && hasAliveUnit(front2)) {
    return buildTargetArray(front2);
  }

  // どこにもいない場合はnull埋め
  return new Array(targetArrayLength).fill(null);
}

/**
 * 攻撃直前ステップ（設計書3.3.5.3.3）
 * @param gameState ゲーム状態
 * @param battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function beforeAttackStep(
  gameState: GameState,
  battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  if (!battleContext.currentAttacker) return;

  const skill = MasterData.getSkill(battleContext.currentAttacker.skillId);

  // 1. スキルに攻撃前効果が設定されている場合はその処理を実行
  for (const effect of skill.preEffects) {
    if (effect.target === 'SELF') {
      await executeEffect(effect.effect, gameState, bridge, {
        selfId: battleContext.currentAttacker.unitId,
      });
    } else if (effect.target === 'TARGET') {
      for (const target of battleContext.targetUnits) {
        if (target) {
          await executeEffect(effect.effect, gameState, bridge, {
            selfId: battleContext.currentAttacker.unitId,
            selectedId: target.unitId,
          });
        }
      }
    }
  }

  // 2. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.BEFORE_ATTACK, bridge);
}

/**
 * ユニットダメージステップ（設計書3.3.5.3.4）
 * @param attackerNation 攻撃側国家
 * @param defenderNation 防御側国家
 * @param gameState ゲーム状態
 * @param battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function unitDamageStep(
  attackerNation: Nation,
  _defenderNation: Nation,
  gameState: GameState,
  battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  if (!battleContext.currentAttacker) return;

  const skill = MasterData.getSkill(battleContext.currentAttacker.skillId);
  const attackPower = calculateUnitEffectiveAttack(battleContext.currentAttacker);

  // 被攻撃ユニット配列をループ
  while (battleContext.targetIndex < battleContext.targetUnits.length) {
    const target = battleContext.targetUnits[battleContext.targetIndex];

    // 1. 処理対象確認
    if (target !== null) {
      // 2. ダメージ計算
      const damage = safeMultiply(attackPower, skill.damageRate);

      // 3. HPから減算
      applyUnitDamage(target, damage);

      // 4. UIにDAMAGE_EVENTを送信
      await bridge.notifyGameEvent(GameEvent.UNIT_DAMAGE, {
        targetUnitId: target.unitId!,
        amount: damage,
      });

      // 5. スキルにユニット追加効果が設定されている場合はその処理を行う
      for (const effect of skill.unitEffects) {
        await executeEffect(effect, gameState, bridge, {
          selfId: battleContext.currentAttacker.unitId,
          selectedId: target.unitId,
        });
      }
    }

    if (battleContext.currentAttacker.ownerNationId === attackerNation.nationId) {

      //国力奪取計算
      let hpLossRate = 1.0; // ポジションが空の場合は1

      if (target !== null) {
        // HP損失率 = (最大HP - 現在HP) / 最大HP
        hpLossRate = (target.maxHP - target.currentHP) / target.maxHP;
      }

      // 国力ダメージ = 攻撃力 × 国力奨取率 × HP損失率
      const powerDamage = safeMultiply(
        safeMultiply(attackPower, skill.powerStealRate),
        hpLossRate
      );

      // 暂定国力奨取量に加算
      battleContext.pendingPowerDamage = safeAdd(
        battleContext.pendingPowerDamage,
        powerDamage
      );
    }

    // 3. スキルに国家追加効果が設定されている場合はその処理を行う
    for (const effect of skill.nationEffects) {
      await executeEffect(effect, gameState, bridge, {
        selfId: attackerNation.nationId,
        selectedId: battleContext.defenderNationId.toString(),
      });
    }

    // 6. 被攻撃ユニットインデックスをインクリメント
    battleContext.targetIndex++;
  }
}

/**
 * 攻撃直後ステップ（設計書3.3.5.3.6）
 * @param gameState ゲーム状態
 * @param _battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function afterAttackStep(
  gameState: GameState,
  _battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  // 1. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.AFTER_ATTACK, bridge);
}

/**
 * 攻撃終了ステップ（設計書3.3.5.3.7）
 * @param gameState ゲーム状態
 * @param _battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function attackEndStep(
  gameState: GameState,
  _battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  // 1. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.ATTACK_END, bridge);
}

/**
 * 戦闘終了ステップ（設計書3.3.5.4）
 * @param attackerNation 攻撃側国家
 * @param defenderNation 防御側国家
 * @param gameState ゲーム状態
 * @param battleContext 戦闘コンテキスト
 * @param bridge UIブリッジ
 */
export async function battleEndStep(
  attackerNation: Nation,
  defenderNation: Nation,
  gameState: GameState,
  battleContext: BattleContext,
  bridge: IGameUIBridge
): Promise<void> {
  // 1. 国力ダメージ確定
  const actualDamage = Math.min(defenderNation.power, battleContext.pendingPowerDamage);
  defenderNation.power = safeSubtract(defenderNation.power, actualDamage);
  attackerNation.power = safeAdd(attackerNation.power, actualDamage);

  // 2. UIにPOWER_DAMAGE_EVENTを送信
  await bridge.notifyGameEvent(GameEvent.POWER_DAMAGE, {
    nationId: battleContext.defenderNationId,
    amount: actualDamage,
  });
  await bridge.notifyGameEvent(GameEvent.POWER_HEAL, {
    nationId: battleContext.attackerNationId,
    amount: -actualDamage,
  });

  // 3. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.BATTLE_END, bridge);
}
