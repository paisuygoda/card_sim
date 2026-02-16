/**
 * ステート付与・除去効果の実装
 * 設計書4.3のステート付与処理仕様を実装
 * 効果処理は../StateExecutor.tsで管理
 */

import { Effect, Unit, Nation, State } from '../../models';
import { IGameUIBridge, GameEvent } from '../../../infrastructure/IGameUIBridge';
import { MasterData } from '../../master';

/**
 * ステート付与効果を実行
 * 設計書4.3のステート付与処理フローに従う
 * 
 * @param effect 効果データ
 * @param target 対象（ユニットまたは国家）
 * @param bridge UIブリッジ
 */
export async function executeAddStateEffect(
  effect: Effect,
  target: Unit | Nation,
  bridge: IGameUIBridge
): Promise<void> {
  // effect.valueはステートIDを表す
  const stateId = String(effect.value);
  const targetId = 'nationId' in target ? target.nationId : target.unitId as string;
  const nationId = 'nationId' in target ? target.nationId : target.ownerNationId as string;

  // 1. マスターデータから付与予定のステート情報を取得
  const masterState = MasterData.getState(stateId, targetId, nationId);
  if (!masterState) {
    console.warn(`State ${stateId} not found`);
    return;
  }

  // 2. 付与対象がすでにこのステートを持っているかチェック
  const existingStateIndex = target.states.findIndex((s) => s.stateId === stateId);

  if (existingStateIndex === -1) {
    // 2-1. 持っていない場合：排他ステートチェック後に付与
    if (await checkAndHandleExclusiveStates(target, masterState)) {
      // 排他チェックOK：付与処理続行
      // ディープコピーを作成して付与
      const newState = deepCopyState(masterState);
      newState.unitId = targetId;
      newState.ownerNationId = nationId;
      target.states.push(newState);

      // UI通知
      await notifyStateChange(target, stateId, 'add', bridge, effect.visualType);
    }
    // 排他チェックで中断された場合は何もしない
  } else {
    // 3. すでに持っている場合：ステート更新処理
    const existingState = target.states[existingStateIndex];
    refreshState(existingState, masterState);

    // UI通知（更新）
    await notifyStateChange(target, stateId, 'refresh', bridge, effect.visualType);
  }
}
/**
 * ステート付与効果を実行
 * 設計書4.3のステート付与処理フローに従う
 * 
 * @param target 対象（ユニットまたは国家）
 * @param stateId 効果ID
 */
export async function addState(
  target: Unit | Nation,
  stateId: string,
): Promise<void> {
  const targetId = 'nationId' in target ? target.nationId : target.unitId as string;
  const nationId = 'nationId' in target ? target.nationId : target.ownerNationId as string;

  // 1. マスターデータから付与予定のステート情報を取得
  const masterState = MasterData.getState(stateId, targetId, nationId);
  if (!masterState) {
    console.warn(`State ${stateId} not found`);
    return;
  }

  // 2. 付与対象がすでにこのステートを持っているかチェック
  const existingStateIndex = target.states.findIndex((s) => s.stateId === stateId);

  if (existingStateIndex === -1) {
    // 2-1. 持っていない場合：排他ステートチェック後に付与
    if (await checkAndHandleExclusiveStates(target, masterState)) {
      // 排他チェックOK：付与処理続行
      // ディープコピーを作成して付与
      const newState = deepCopyState(masterState);
      newState.unitId = targetId;
      newState.ownerNationId = nationId;
      target.states.push(newState);
    }
    // 排他チェックで中断された場合は何もしない
  } else {
    // 3. すでに持っている場合：ステート更新処理
    const existingState = target.states[existingStateIndex];
    refreshState(existingState, masterState);
  }
}

/**
 * ステート除去効果を実行
 * @param effect 効果データ
 * @param target 対象（ユニットまたは国家）
 * @param bridge UIブリッジ
 */
export async function executeRemoveState(
  effect: Effect,
  target: Unit | Nation,
  bridge: IGameUIBridge
): Promise<void> {
  // effect.valueはステートIDを表す
  const stateId = String(effect.value);

  // 該当ステートを検索して除去
  if (removeState(target, stateId)) {
    // 削除成功した場合のみUI通知
    await notifyStateChange(target, stateId, 'remove', bridge, effect.visualType);
  }
}

/**
 * 排他ステートのチェックと処理
 * 設計書4.3の排他ステート処理仕様に従う
 * 
 * @param target 付与対象（ユニットまたは国家）
 * @param newState 付与予定のステート
 * @param bridge UIブリッジ
 * @param visualType 演出タイプ
 * @returns true: 付与可、false: 付与不可
 */
async function checkAndHandleExclusiveStates(
  target: Unit | Nation,
  newState: State,
): Promise<boolean> {
  const excludes = newState.excludes;

  // 1. 上位排他チェック（排他配列の0行目）
  if (excludes[0] && excludes[0].length > 0) {
    for (const upperExclusiveId of excludes[0]) {
      if (target.states.some((s) => s.stateId === upperExclusiveId)) {
        // 上位排他ステートが存在する場合、付与中断
        return false;
      }
    }
  }

  // 2. 同位排他チェック（排他配列の1行目）
  if (excludes[1] && excludes[1].length > 0) {
    const sameExclusiveStates = target.states.filter((s) =>
      excludes[1].includes(s.stateId)
    );

    if (sameExclusiveStates.length > 0) {
      // 同位排他ステートが存在する場合
      for (const sameState of sameExclusiveStates) {
        if (sameState.stacks === null || sameState.stacks === 1) {
          // スタック不可 or スタック数が1の場合、ステートを削除
          await removeState(target, sameState.stateId);
        } else {
          // スタック数を1減らす
          sameState.stacks -= 1;
        }
      }
      // 付与予定のステートは付与せずに処理中断
      return false;
    }
  }

  // 3. 下位排他チェック（排他配列の2行目）
  if (excludes[2] && excludes[2].length > 0) {
    const lowerExclusiveStates = target.states.filter((s) =>
      excludes[2].includes(s.stateId)
    );

    if (lowerExclusiveStates.length > 0) {
      // 下位排他ステートが存在する場合、すべて削除
      for (const lowerState of lowerExclusiveStates) {
        await removeState(target, lowerState.stateId);
      }
      // 付与処理は続行
    }
  }

  return true;
}

/**
 * ステート更新処理（既存ステートのリフレッシュ）
 * 設計書4.3の更新処理仕様に従う
 * 
 * @param existingState 既存のステート
 * @param masterState マスターデータのステート
 */
function refreshState(existingState: State, masterState: State): void {
  // 1. スタック数がnullでない場合、インクリメント
  if (existingState.stacks !== null && masterState.stacks !== null) {
    existingState.stacks += 1;
  }

  // 2. 残りターン数がnullでない場合、マスターデータの値を代入
  if (existingState.duration !== null && masterState.duration !== null && masterState.duration > existingState.duration) {
    existingState.duration = masterState.duration;
  }

  // 3. 残り発動回数がnullでない場合、マスターデータの値を代入
  if (existingState.remainings !== null && masterState.remainings !== null && masterState.remainings > existingState.remainings) {
    existingState.remainings = masterState.remainings;
  }
}

/**
 * ターン終了時のステート減衰処理
 * 残りターン数をデクリメントし、0になったら削除
 * 
 * @param target 対象（ユニットまたは国家）
 * @param bridge UIブリッジ（削除通知用）
 */
export async function decrementStateDurations(
  target: Unit | Nation,
  bridge: IGameUIBridge
): Promise<void> {
  const statesToRemove: string[] = [];

  for (const state of target.states) {
    if (state.duration !== null) {
      state.duration -= 1;
      if (state.duration <= 0) {
        statesToRemove.push(state.stateId);
      }
    }
  }

  // 削除対象のステートを削除
  for (const stateId of statesToRemove) {
    if (removeState(target, stateId)) {
      await notifyStateChange(target, stateId, 'remove', bridge);
    }
  }
}

/**
 * ステート削除処理（内部関数）
 * 
 * @param target 対象（ユニットまたは国家）
 * @param stateId 削除するステートID
 * @returns 削除成功/失敗
 */
function removeState(
  target: Unit | Nation,
  stateId: string
): boolean {
  const stateIndex = target.states.findIndex((s) => s.stateId === stateId);
  if (stateIndex !== -1) {
    target.states.splice(stateIndex, 1);
    return true;
  }
  return false;
}

/**
 * UI通知ヘルパー
 */
async function notifyStateChange(
  target: Unit | Nation,
  stateId: string,
  action: 'add' | 'remove' | 'refresh',
  bridge: IGameUIBridge,
  visualType?: string
): Promise<void> {
  const eventType =
    action === 'add'
      ? GameEvent.STATE_ADD
      : action === 'remove'
      ? GameEvent.STATE_REMOVE
      : GameEvent.STATE_ADD; // refreshは追加と同じ扱い

  if ('unitId' in target) {
    // ユニットの場合
    await bridge.notifyGameEvent(eventType, {
      targetUnitId: target.unitId,
      stateId: stateId,
      visualType: visualType,
    });
  } else {
    // 国家の場合
    await bridge.notifyGameEvent(eventType, {
      targetNationId: (target as Nation).nationId,
      stateId: stateId,
      visualType: visualType,
    });
  }
}

/**
 * ステートのディープコピー
 */
function deepCopyState(state: State): State {
  return {
    ...state,
    triggerTimings: [...state.triggerTimings],
    effects: state.effects.map((e) => ({ ...e })),
    excludes: state.excludes.map((arr) => [...arr]),
  };
}
