import { Unit, GameState, GamePhase, EffectType, Effect, EffectTarget, ValueType } from '../models';

/**
 * UnitManager - ユニット管理
 * 
 * 設計書4.5に基づき、ユニットのダメージ処理・死亡処理を管理
 */

/**
 * ユニット軍事力を計算（設計書3.3.3）
 * ユニットのHPと攻撃力の合計 * ステート補正
 * @param unit 対象ユニット
 * @returns 軍事力
 */
export function calculateUnitMilitaryPower(unit: Unit): number {
  // 基礎軍事力
  let basePower = (unit.maxHP + unit.attack) * unit.currentHP / unit.maxHP;
  
  // ステート補正を計算
  // triggerTimingsにSCOUT_CALCULATIONを含むステートを抽出し、補正値を計算
  const scoutEffects = unit.states.filter(state => state.triggerTimings.includes(GamePhase.SCOUT_CALCULATION))
    .reduce((effects, state) => {
    return effects.concat(state.effects.filter(effect => [EffectType.MILITARY_POWER_BUFF, EffectType.MILITARY_POWER_DEBUFF].includes(effect.effectType) && effect.target === EffectTarget.SELF_UNIT));
  }, [] as Effect[]);
  const stateMultiplier = scoutEffects.filter(effect => effect.valueType === ValueType.PERCENTAGE).reduce((acc, effect) => acc * (effect.effectType === EffectType.MILITARY_POWER_BUFF ? (1.0 + effect.value) : (1.0 - effect.value)), 1.0);
  const stateFlatBonus = scoutEffects.filter(effect => effect.valueType === ValueType.FIXED).reduce((acc, effect) => acc + (effect.effectType === EffectType.MILITARY_POWER_BUFF ? effect.value : -effect.value), 0);
  
  // ステート補正を適用
  return Math.floor(basePower * stateMultiplier + stateFlatBonus);
}

/**
 * ユニットの実攻撃力を計算
 * ステート補正を考慮
 * @param unit 対象ユニット
 * @returns 実攻撃力
 */
export function calculateUnitEffectiveAttack(unit: Unit): number {
  let effectiveAttack = unit.attack;
  
  // ステート補正を計算
  const attackBuffEffects = unit.states.filter(state => state.triggerTimings.includes(GamePhase.BATTLE_CALCULATION))
    .reduce((effects, state) => {
    return effects.concat(state.effects.filter(effect => [EffectType.UNIT_ATTACK_BUFF, EffectType.UNIT_ATTACK_DEBUFF].includes(effect.effectType) && effect.target === EffectTarget.SELF_UNIT));
  }, [] as Effect[]);
  
  const attackMultiplier = attackBuffEffects.filter(effect => effect.valueType === ValueType.PERCENTAGE).reduce((acc, effect) => acc * (effect.effectType === EffectType.UNIT_ATTACK_BUFF ? (1.0 + effect.value) : (1.0 - effect.value)), 1.0);
  const attackFlatBonus = attackBuffEffects.filter(effect => effect.valueType === ValueType.FIXED).reduce((acc, effect) => acc + (effect.effectType === EffectType.UNIT_ATTACK_BUFF ? effect.value : -effect.value), 0);
  
  effectiveAttack = Math.floor(effectiveAttack * attackMultiplier + attackFlatBonus);
  
  return Math.max(0, effectiveAttack);
}
/**
 *  gameState内の全ユニットを走査し、指定IDのユニットを取得
 * @param gameState ゲーム状態
 * @param unitId ユニットID
 * @returns ユニットまたはnull
 */
export function findUnitById(
  gameState: GameState,
  unitId: string
): Unit | null {
  for (const nation of gameState.nations) {
    for (const unit of nation.units) {
      if (unit && unit.unitId === unitId) {
        return unit;
      }
    }
  }
  return null;
} 

/**
 * ユニットがステートを持っているか
 * @param unit 対象ユニット
 * @param stateId ステートID
 * @returns ステートを持っているか
 */
export function hasState(unit: Unit, stateId: string): boolean {
  return unit.states.some(state => state.stateId === stateId);
}

export const extractNationIdFromUnitId = (unitId: string): string | null => {
  const parts = unitId.split('-');
  if (parts.length < 2) {
    return null;
  }
  return parts[0];
}
