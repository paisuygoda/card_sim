import { Effect, GameState, Unit, Nation, EffectType, EffectTarget } from '../models';
import { IGameUIBridge } from '../../infrastructure/IGameUIBridge';
import {
  executePowerChange,
  executeActionChange,
  executeUnitHPChange,
  executeUnitAttackChange,
  executeAddStateEffect,
  executeRemoveState,
  executeSummonUnit,
  executeMoveUnit,
  executeDestroyUnitEffect,
  executeReviveLatestUnit,
} from './effects';
import { executeAddCommand, executeRemoveCommand } from './effects/commandEffects';
import { findNationById } from './NationManager';
import { findUnitById } from './UnitManager';

/**
 * EffectExecutor - 効果実行エンジン
 * 
 * 設計書2.9に基づき、各効果タイプに対応した処理を実行
 * すべての効果処理はこのモジュールを通して実行される
 */

/**
 * 効果を実行
 * @param effect 実行する効果
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 * @param context 追加コンテキスト（発動者、選択対象）
 */
export async function executeEffect(
  effect: Effect,
  gameState: GameState,
  bridge: IGameUIBridge,
  context?: {
    selfId?: string;
    selectedId?: string;
  },
): Promise<void> {
  // 対象を解決
  const targets = resolveEffectTargets(effect, gameState, context);

  // 効果タイプに応じて処理を実行
  for (const targetId of targets) {
    await executeEffectOnTarget(effect, gameState, bridge, targetId);
  }
}

/**
 * 効果対象を解決
 * @param effect 効果データ
 * @param gameState ゲーム状態
 * @param context コンテキスト
 * @returns 対象のリスト（ユニットまたは国家）
 */
function resolveEffectTargets(
  effect: Effect,
  gameState: GameState,
  context?: {
    selfId?: string;
    selectedId?: string;
  }
): Array<string> {
  const targets: Array<string> = [];

  switch (effect.target) {
    case EffectTarget.SELF_UNIT:
      if (context?.selfId) targets.push(context.selfId);
      break;

    case EffectTarget.SELF_NATION:
      if (context?.selfId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (nation) targets.push(nation.nationId);
      }
      break;

    case EffectTarget.TARGET_UNIT:
      if (context?.selectedId) targets.push(context.selectedId);
      break;

    case EffectTarget.TARGET_NATION:
      if (context?.selectedId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selectedId || n.nationId === context.selectedId!.split('-')[0]);
        if (nation) targets.push(nation.nationId);
      }
      break;

    case EffectTarget.SELF_BATTLELINE:
      if (context?.selfId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (nation) targets.push(...nation.units.slice(0, 3).filter((u): u is Unit => u !== null).map((u) => u.unitId!));
      }
      break;

    case EffectTarget.SELF_BENCH:
      if (context?.selfId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (nation) targets.push(...nation.units.slice(3).filter((u): u is Unit => u !== null).map((u) => u.unitId!));
      }
      break;

    case EffectTarget.SELF_ALL_UNITS:
      if (context?.selfId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (nation) targets.push(...nation.units.filter((u): u is Unit => u !== null).map((u) => u.unitId!));
      }
      break;

    case EffectTarget.TARGET_BATTLELINE:
      if (context?.selectedId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selectedId || n.nationId === context.selectedId!.split('-')[0]);
        if (nation) {
          targets.push(...nation.units.slice(0, 3).filter((u): u is Unit => u !== null).map((u) => u.unitId!));
        }
      }
      break;

    case EffectTarget.TARGET_BENCH:
      if (context?.selectedId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selectedId || n.nationId === context.selectedId!.split('-')[0]);
        if (nation) {
          targets.push(...nation.units.slice(3).filter((u): u is Unit => u !== null).map((u) => u.unitId!));
        }
      }
      break;

    case EffectTarget.TARGET_ALL_UNITS:
      if (context?.selectedId) {
        const nation = gameState.nations.find((n) => n.nationId === context.selectedId || n.nationId === context.selectedId!.split('-')[0]);
        if (nation) {
          targets.push(...nation.units.filter((u): u is Unit => u !== null).map((u) => u.unitId!));
        }
      }
      break;

    case EffectTarget.ALL_ENEMY_BATTLELINE:
      if (context?.selfId) {
        const ownerNation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (ownerNation) {
          gameState.nations
            .filter((n) => ownerNation.hostileNationIds.includes(n.nationId))
            .forEach((n) => targets.push(...n.units.slice(0, 3).filter((u): u is Unit => u !== null).map((u) => u.unitId!)));
        }
      }
      break;

    case EffectTarget.ALL_ENEMY_BENCH:
      if (context?.selfId) {
        const ownerNation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (ownerNation) {
          gameState.nations
            .filter((n) => ownerNation.hostileNationIds.includes(n.nationId))
            .forEach((n) => targets.push(...n.units.slice(3).filter((u): u is Unit => u !== null).map((u) => u.unitId!)));
        }
      }
      break;

    case EffectTarget.ALL_ENEMY_UNITS:
      if (context?.selfId) {
        const ownerNation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (ownerNation) {
          gameState.nations
            .filter((n) => ownerNation.hostileNationIds.includes(n.nationId))
            .forEach((n) => targets.push(...n.units.filter((u): u is Unit => u !== null).map((u) => u.unitId!)));
        }
      }
      break;

    case EffectTarget.ALL_ENEMY_NATION:
      if (context?.selfId) {
        const ownerNation = gameState.nations.find((n) => n.nationId === context.selfId || n.nationId === context.selfId!.split('-')[0]);
        if (ownerNation) {
          targets.push(
            ...gameState.nations.filter((n) => ownerNation.hostileNationIds.includes(n.nationId)).map((n) => n.nationId)
          );
        }
      }
      break;

    case EffectTarget.ALL_BATTLELINE:
      gameState.nations.forEach((n) => targets.push(...n.units.slice(0, 3).filter((u): u is Unit => u !== null).map((u) => u.unitId!)));
      break;

    case EffectTarget.ALL_BENCH:
      gameState.nations.forEach((n) => targets.push(...n.units.slice(3).filter((u): u is Unit => u !== null).map((u) => u.unitId!)));
      break;

    case EffectTarget.ALL_UNITS:
      gameState.nations.forEach((n) => targets.push(...n.units.filter((u): u is Unit => u !== null).map((u) => u.unitId!)));
      break;

    case EffectTarget.ALL_NATIONS:
      targets.push(...gameState.nations.map((n) => n.nationId));
      break;
  }

  return targets;
}

/**
 * 単一の対象に対して効果を実行
 * @param effect 効果データ
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 * @param target 対象（ユニットまたは国家）
 */
async function executeEffectOnTarget(
  effect: Effect,
  gameState: GameState,
  bridge: IGameUIBridge,
  targetId: string,
): Promise<void> {
  let target: Unit | Nation | null = null;

  switch (effect.effectType) {
    case EffectType.POWER_GAIN:
    case EffectType.POWER_LOSS:
      target = findNationById(gameState, targetId);
      if (target) {
        await executePowerChange(effect, target, bridge);
      }
      break;

    case EffectType.ACTION_GAIN:
    case EffectType.ACTION_LOSS:
      target = findNationById(gameState, targetId);
      if (target) {
        await executeActionChange(effect, target);
      }
      break;

    case EffectType.UNIT_MAX_HP_GAIN:
    case EffectType.UNIT_MAX_HP_LOSS:
    case EffectType.UNIT_HP_GAIN:
    case EffectType.UNIT_HP_LOSS:
      target = findUnitById(gameState, targetId);
      if (target) {
        await executeUnitHPChange(effect, target, bridge);
      }
      break;

    case EffectType.UNIT_ATTACK_GAIN:
    case EffectType.UNIT_ATTACK_LOSS:
      target = findUnitById(gameState, targetId);
      if (target) {
        await executeUnitAttackChange(effect, target);
      }
      break;

    case EffectType.ADD_STATE:
      target = findUnitById(gameState, targetId);
      if (!target) {
        target = findNationById(gameState, targetId);
      }
      if (target) {
        await executeAddStateEffect(effect, target, bridge);
      }
      break;

    case EffectType.REMOVE_STATE:
      target = findUnitById(gameState, targetId);
      if (!target) {
        target = findNationById(gameState, targetId);
      }
      if (target) {
        await executeRemoveState(effect, target, bridge);
      }
      break;

    case EffectType.SUMMON_UNIT:
      target = findNationById(gameState, targetId);
      if (target) {
        await executeSummonUnit(effect, target);
      }
      break;

    case EffectType.MOVE_UNIT:
      target = findUnitById(gameState, targetId);
      if (target) {
        await executeMoveUnit(effect, gameState, target);
      }
      break;

    case EffectType.DESTROY_UNIT:
      target = findUnitById(gameState, targetId);
      if (target) {
        await executeDestroyUnitEffect(effect, gameState, target);
      }
      break;

    case EffectType.REVIVE_UNIT:
      target = findNationById(gameState, targetId);
      if (target) {
        await executeReviveLatestUnit(effect, target);
      }
      break;

    case EffectType.ADD_COMMAND:
      target = findNationById(gameState, targetId);
      if (target) {
        await executeAddCommand(effect, target);
      }
      break;

    case EffectType.REMOVE_COMMAND:
      target = findNationById(gameState, targetId);
      if (target) {
        await executeRemoveCommand(effect, target);
      }
      break;
  }
}

