import { Nation, GameState, GamePhase, EffectType, Effect, EffectTarget, ValueType } from '../models';
import { calculateUnitMilitaryPower } from './UnitManager';

/**
 * NationManager - 国家管理
 * 
 */

/**
 *  gameState内の全国家を走査し、指定IDの国家を取得
 * @param gameState ゲーム状態
 * @param nationId 国家ID
 * @returns 国家またはnull
 */
export function findNationById(
  gameState: GameState,
  nationId: string
): Nation | null {
  for (const nation of gameState.nations) {
    if (nation.nationId === nationId) {
      return nation;
    }
  }
  return null;
} 

/**
 * 軍事力を計算（設計書3.3.3）
 * 前線に出ているユニットのHPと攻撃力の合計 * ステート補正
 * @param nation 対象国家
 * @returns 軍事力
 */
export function calculateMilitaryPower(nation: Nation): number {
  // 前線（インデックス0～2）のユニットの軍事力を合計
  let totalPower = 0;
  
  for (let i = 0; i < 3; i++) {
    const unit = nation.units[i];
    if (unit !== null) {
      totalPower += calculateUnitMilitaryPower(unit);
    }
  }
  
  // triggerTimingsにSCOUT_CALCULATIONを含むステートを抽出し、補正値を計算
  const scoutEffects = nation.states.filter(state => state.triggerTimings.includes(GamePhase.SCOUT_CALCULATION))
    .reduce((effects, state) => {
    return effects.concat(state.effects.filter(effect => [EffectType.MILITARY_POWER_BUFF, EffectType.MILITARY_POWER_DEBUFF].includes(effect.effectType) && effect.target === EffectTarget.SELF_NATION));
  }, [] as Effect[]);
  const stateMultiplier = scoutEffects.filter(effect => effect.valueType === ValueType.PERCENTAGE).reduce((acc, effect) => acc * (effect.effectType === EffectType.MILITARY_POWER_BUFF ? (1.0 + effect.value) : (1.0 - effect.value)), 1.0);
  const stateFlatBonus = scoutEffects.filter(effect => effect.valueType === ValueType.FIXED).reduce((acc, effect) => acc + (effect.effectType === EffectType.MILITARY_POWER_BUFF ? effect.value : -effect.value), 0);
  
  
  return Math.floor(totalPower * stateMultiplier + stateFlatBonus);
}
