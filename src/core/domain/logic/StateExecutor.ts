import { GameState, GamePhase, State, Unit, Nation } from '../models';
import { IGameUIBridge } from '../../infrastructure/IGameUIBridge';
import { createStateQueue } from './PriorityManager';
import { executeEffect } from './EffectExecutor';
import { decrementStateDurations } from './effects/stateEffects';

/**
 * StateExecutor - ステート効果処理エンジン
 * 
 * 設計書4.4のステート処理仕様を実装
 * 各フェーズでのステート効果の実行を管理する
 * 付与・除去処理はeffects/stateEffects.tsに実装
 */

/**
 * ステート処理を実行
 * 設計書4.4に基づき、優先順位に従ってステート効果を処理
 * 
 * @param gameState ゲーム状態
 * @param currentPhase 現在のフェーズ
 * @param bridge UIブリッジ
 */
export async function executeStateProcessing(
  gameState: GameState,
  currentPhase: GamePhase,
  bridge: IGameUIBridge,
  subjectId?: string
): Promise<void> {
  // 1. 優先順位ルールに基づきステート処理キューを作成
  const stateQueue = createStateQueue(gameState, currentPhase);

  // 2. キューが空になるまでループ
  for (const state of stateQueue) {
    // 2-1. 対象ステートの発動タイミングに現在フェーズが含まれているかチェック
    if (!state.triggerTimings.includes(currentPhase)) {
      continue;
    }

    // 2-2. ステートの所有者を取得
    const owner = findStateOwner(gameState, state);
    if (!owner) {
      console.warn(`State owner not found for state ${state.stateId}`);
      continue;
    }

    // 2-3. ステートの効果配列を先頭から順に実行
    for (const effect of state.effects) {
      await executeEffect(effect, gameState, bridge, {
        selfId: state.unitId || state.ownerNationId,
        selectedId: subjectId,
      });
    }

    // 2-4. 残り発動回数をデクリメント
    if (state.remainings !== null) {
      state.remainings -= 1;

      // 0になった場合、ステートを削除
      if (state.remainings <= 0) {
        removeStateFromOwner(owner, state.stateId);
      }
    }
  }
}

/**
 * ターン終了時のステート減衰処理を対象国家・その全ユニットに適用
 * 
 * @param nationId 対象国家ID
 * @param gameState ゲーム状態
 * @param bridge UIブリッジ
 */
export async function decrementAllStateDurations(
  nationId: string,
  gameState: GameState,
  bridge: IGameUIBridge
): Promise<void> {
    const nation = gameState.nations.find(n => n.nationId === nationId);
    if (nation) {
      // 国家ステートの減衰
      await decrementStateDurations(nation, bridge);

      // ユニットステートの減衰
      for (const unit of nation.units) {
        if (unit) {
          await decrementStateDurations(unit, bridge);
        }
      }
    }
}

/**
 * ステートの所有者を検索
 * 
 * @param gameState ゲーム状態
 * @param state ステート
 * @returns 所有者（ユニットまたは国家）
 */
function findStateOwner(
  gameState: GameState,
  state: State
): Unit | Nation | null {
  // ユニットIDが設定されている場合、ユニットを検索
  if (state.unitId) {
    for (const nation of gameState.nations) {
      for (const unit of nation.units) {
        if (unit && unit.unitId === state.unitId) {
          return unit;
        }
      }
      for (const unit of nation.graveyard) {
        if (unit.unitId === state.unitId) {
          return unit;
        }
      }
    }
  }

  // 国家IDが設定されている場合、国家を検索
  if (state.ownerNationId) {
    const nation = gameState.nations.find(
      (n) => n.nationId === state.ownerNationId
    );
    if (nation) {
      return nation;
    }
  }

  return null;
}

/**
 * 所有者からステートを削除
 * 
 * @param owner 所有者（ユニットまたは国家）
 * @param stateId 削除するステートID
 */
function removeStateFromOwner(
  owner: Unit | Nation,
  stateId: string
): void {
  const stateIndex = owner.states.findIndex((s) => s.stateId === stateId);
  if (stateIndex !== -1) {
    owner.states.splice(stateIndex, 1);
  }
}
