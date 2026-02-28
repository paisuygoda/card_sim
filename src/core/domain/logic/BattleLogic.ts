import { GameState, Unit, Nation, GamePhase } from '../models';
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
 * ユニットが死亡状態か判定するヘルパー関数（パフォーマンス最適化）
 * @param unit - 対象ユニット
 * @returns 死亡ステートを持つ場合true
 */
function isDead(unit: Unit | null): boolean {
  if (!unit) return false;
  return unit.states.some(s => s.stateId === 'dead');
}

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
  // 戦闘コンテキストをgameStateに直接設定（UIが即時参照できるよう通知前に設定）
  gameState.battleContext = {
    attackerNationId,
    defenderNationId,
    attackOrder: [],
    currentAttackIndex: 0,
    targetUnits: [],
    targetIndex: 0,
    pendingPowerDamage: 0,
  };
  bridge.updateGameState(gameState);

  // 戦闘開始通知
  await bridge.notifyGameEvent(GameEvent.BATTLE_START, {
    attackerNationId,
    defenderNationId,
  });

  const attackerNation = findNationById(gameState, gameState.battleContext!.attackerNationId);
  const defenderNation = findNationById(gameState, gameState.battleContext!.defenderNationId);
  if (!attackerNation || !defenderNation) {
    bridge.log('Invalid nation IDs in battle context', 'error');
    return;
  }

  // 1. 戦闘開始ステップ
  await battleStartStep(attackerNation, defenderNation, gameState, bridge);

  // 2. 各ユニットの攻撃処理
  await executeUnitAttacks(attackerNation, defenderNation, gameState, bridge);

  // 3. 戦闘終了ステップ
  await battleEndStep(attackerNation, defenderNation, gameState, bridge);

  // 戦闘終了通知
  await bridge.notifyGameEvent(GameEvent.BATTLE_END, {
    attackerNationId,
    defenderNationId,
  });
  gameState.battleContext = null;
  bridge.updateGameState(gameState);
}

/**
 * 戦闘開始ステップ（設計書3.3.5.2）
 * @param attackerNation 攻撃側国家
 * @param defenderNation 防御側国家
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 */
export async function battleStartStep(
  attackerNation: Nation,
  defenderNation: Nation,
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
  const ctx = gameState.battleContext!;

  // 2. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.BATTLE_START, bridge);

  // 3. 攻撃順序決定
  ctx.attackOrder = determineAttackOrder(attackerNation, defenderNation);
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
    if (attackerUnit && !isDead(attackerUnit)) {
      frontlineUnits.push({ unit: attackerUnit, position: i, isAttacker: true });
    }

    const defenderUnit = defenderNation.units[i];
    if (defenderUnit && !isDead(defenderUnit)) {
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
 * @param bridge UIブリッジ
 */
export async function executeUnitAttacks(
  attackerNation: Nation,
  defenderNation: Nation,
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
  const ctx = gameState.battleContext!;

  // 攻撃順序配列の各ユニットについて攻撃処理を実行
  while (ctx.currentAttackIndex < ctx.attackOrder.length) {
    // 1. 攻撃開始ステップ
    await attackStartStep(gameState, bridge);

    // 攻撃者が設定されていない場合（全員死亡等）
    if (!ctx.currentAttacker) {
      break;
    }

    // 2. 攻撃対象決定ステップ
    ctx.targetUnits = determineTargets(ctx.currentAttacker, attackerNation, defenderNation);

    // スキル発動通知
    const activatingSkill = MasterData.getSkill(ctx.currentAttacker.skillId);
    await bridge.notifyGameEvent(GameEvent.SKILL_ACTIVATE, {
      attackerId: ctx.currentAttacker.unitId!,
      skillId: ctx.currentAttacker.skillId,
      skillName: activatingSkill.name,
      targets: ctx.targetUnits.map(t => t?.unitId ?? null),
      skillVisualType: activatingSkill.skillVisualType,
    });

    // 3. 攻撃直前ステップ
    await beforeAttackStep(gameState, bridge);

    // 4. ユニットダメージステップ, 国力ダメージステップ
    ctx.targetIndex = 0;
    await unitDamageStep(attackerNation, gameState, bridge);

    // 6. 攻撃直後ステップ
    await afterAttackStep(gameState, bridge);

    // 7. 攻撃終了ステップ
    await attackEndStep(gameState, bridge);

    // 次の攻撃者へ
    ctx.currentAttackIndex++;
    ctx.currentAttacker = undefined;
    bridge.updateGameState(gameState);
  }
}

/**
 * 攻撃開始ステップ（設計書3.3.5.3.1）
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 */
export async function attackStartStep(
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
  const ctx = gameState.battleContext!;

  // 1. 攻撃順序配列から攻撃者を取得
  // 死亡ユニットはスキップ
  while (ctx.currentAttackIndex < ctx.attackOrder.length) {
    const attacker = ctx.attackOrder[ctx.currentAttackIndex];
    
    // 死亡ステートチェック
    if (isDead(attacker)) {
      ctx.currentAttackIndex++;
      continue;
    }

    // 2. 攻撃中ユニットとして設定
    ctx.currentAttacker = attacker;
    bridge.updateGameState(gameState);
    break;
  }

  // 全てスキップされた場合
  if (!ctx.currentAttacker) {
    return;
  }

  // 3. 被攻撃ユニットインデックスをリセット
  ctx.targetIndex = 0;

  // 4. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.ATTACK_START, bridge);
}

/**
 * 攻撃範囲に応じた対象インデックス配列を取得（内部ヘルパー）
 * @param pattern ターゲットパターン
 * @returns インデックス配列
 */
function getTargetIndices(pattern: string): number[] {
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
}

/**
 * 対象範囲をシフトする（内部ヘルパー）
 * @param indices 元のインデックス配列
 * @param offset シフト量（正=後ろ、負=前）
 * @returns シフト後のインデックス配列
 */
function shiftIndices(indices: number[], offset: number): number[] {
  return indices.map(i => i + offset).filter(i => i >= 0 && i < 3);
}

/**
 * 指定インデックス範囲に生存ユニットがいるかチェック（内部ヘルパー）
 * @param nation 対象国家
 * @param indices チェックするインデックス配列
 * @returns 生存ユニットが1体でもいればtrue
 */
function hasAliveUnitAt(nation: Nation, indices: number[]): boolean {
  return indices.some(i => {
    const unit = nation.units[i];
    return unit !== null && !isDead(unit);
  });
}

/**
 * 指定インデックス範囲から被攻撃ユニット配列を構築（内部ヘルパー）
 * @param nation 対象国家
 * @param indices 対象インデックス配列
 * @returns ユニット配列（生存ユニットまたはnull）
 */
function buildTargetArray(nation: Nation, indices: number[]): (Unit | null)[] {
  return indices.map(i => {
    const unit = nation.units[i];
    return (unit && !isDead(unit)) ? unit : null;
  });
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
  const baseIndices = getTargetIndices(skill.targetPattern);
  const targetArrayLength = baseIndices.length;

  // 前線に生存ユニットがいない場合は空配列
  if (!hasAliveUnitAt(targetNation, [0, 1, 2])) {
    return new Array(targetArrayLength).fill(null);
  }

  // 攻撃対象の優先順位: 正規位置 → 後ろ+1 → 後ろ+2 → 前-1 → 前-2
  const candidateOffsets = [0, 1, 2, -1, -2];
  
  for (const offset of candidateOffsets) {
    const shiftedIndices = shiftIndices(baseIndices, offset);
    if (shiftedIndices.length > 0 && hasAliveUnitAt(targetNation, shiftedIndices)) {
      return buildTargetArray(targetNation, shiftedIndices);
    }
  }

  // どこにもいない場合はnull埋め
  return new Array(targetArrayLength).fill(null);
}

/**
 * 攻撃直前ステップ（設計書3.3.5.3.3）
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 */
export async function beforeAttackStep(
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
  const ctx = gameState.battleContext!;
  if (!ctx.currentAttacker) return;

  const skill = MasterData.getSkill(ctx.currentAttacker.skillId);

  // 1. スキルに攻撃前効果が設定されている場合はその処理を実行
  for (const effect of skill.preEffects) {
    if (effect.target === 'SELF') {
      await executeEffect(effect.effect, gameState, bridge, {
        selfId: ctx.currentAttacker.unitId,
      });
    } else if (effect.target === 'TARGET') {
      for (const target of ctx.targetUnits) {
        if (target) {
          await executeEffect(effect.effect, gameState, bridge, {
            selfId: ctx.currentAttacker.unitId,
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
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 */
export async function unitDamageStep(
  attackerNation: Nation,
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
  const ctx = gameState.battleContext!;
  if (!ctx.currentAttacker) return;

  const skill = MasterData.getSkill(ctx.currentAttacker.skillId);
  const attackPower = calculateUnitEffectiveAttack(ctx.currentAttacker);

  // 被攻撃ユニット配列をループ
  while (ctx.targetIndex < ctx.targetUnits.length) {
    const target = ctx.targetUnits[ctx.targetIndex];

    // 1. 処理対象確認
    if (target !== null) {
      // 2. ダメージ計算
      const damage = safeMultiply(attackPower, skill.damageRate);

      // 3. HPから減算
      applyUnitDamage(target, damage);
      bridge.updateGameState(gameState);

      // 4. UIにDAMAGE_EVENTを送信
      await bridge.notifyGameEvent(GameEvent.UNIT_DAMAGE, {
        targetUnitId: target.unitId!,
        amount: damage,
      });

      // 5. スキルにユニット追加効果が設定されている場合はその処理を行う
      for (const effect of skill.unitEffects) {
        await executeEffect(effect, gameState, bridge, {
          selfId: ctx.currentAttacker.unitId,
          selectedId: target.unitId,
        });
      }
    }

    if (ctx.currentAttacker.ownerNationId === attackerNation.nationId) {
      // 国力奪取計算
      let hpLossRate = 1.0; // ポジションが空の場合は1

      if (target !== null) {
        // HP損失率 = (最大HP - 現在HP) / 最大HP
        hpLossRate = target.maxHP > 0 
          ? (target.maxHP - target.currentHP) / target.maxHP 
          : 0;
      }

      // 国力ダメージ = 攻撃力 × 国力奪取率 × HP損失率
      const powerDamage = safeMultiply(
        safeMultiply(attackPower, skill.powerStealRate),
        hpLossRate
      );

      // 暫定国力奪取量に加算
      ctx.pendingPowerDamage = safeAdd(
        ctx.pendingPowerDamage,
        powerDamage
      );
    }

    // 6. スキルに国家追加効果が設定されている場合はその処理を行う
    for (const effect of skill.nationEffects) {
      await executeEffect(effect, gameState, bridge, {
        selfId: attackerNation.nationId,
        selectedId: ctx.defenderNationId.toString(),
      });
    }

    // 7. 被攻撃ユニットインデックスをインクリメント
    ctx.targetIndex++;
  }
}

/**
 * 攻撃直後ステップ（設計書3.3.5.3.6）
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 */
export async function afterAttackStep(
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
  // 1. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.AFTER_ATTACK, bridge);
}

/**
 * 攻撃終了ステップ（設計書3.3.5.3.7）
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 */
export async function attackEndStep(
  gameState: GameState,
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
 * @param bridge UIブリッジ
 */
export async function battleEndStep(
  attackerNation: Nation,
  defenderNation: Nation,
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
  const ctx = gameState.battleContext!;

  // 1. 国力ダメージ確定
  const actualDamage = Math.min(defenderNation.power, ctx.pendingPowerDamage);
  defenderNation.power = safeSubtract(defenderNation.power, actualDamage);
  attackerNation.power = safeAdd(attackerNation.power, actualDamage);
  bridge.updateGameState(gameState);

  // 2. UIにPOWER_DAMAGE_EVENTを送信
  await bridge.notifyGameEvent(GameEvent.POWER_DAMAGE, {
    nationId: ctx.defenderNationId,
    amount: actualDamage,
  });
  await bridge.notifyGameEvent(GameEvent.POWER_HEAL, {
    nationId: ctx.attackerNationId,
    amount: actualDamage,
  });

  // 3. ステート処理実行
  await executeStateProcessing(gameState, GamePhase.BATTLE_END, bridge);
}
