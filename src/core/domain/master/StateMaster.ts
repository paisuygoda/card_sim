import { State, StateVisualType } from '../models/State';
import { GamePhase } from '../models/GamePhase';
import { EFFECT_MASTER } from './EffectMaster';
import { EffectType, EffectTarget, ValueType, EffectVisualType } from '../models/Effect';

/**
 * ステートマスタデータ型
 * State型を拡張し、説明文とアイコンを追加
 */
export interface StateMasterData extends Omit<State, 'unitId' | 'ownerNationId'> {
  /** ステートの効果説明文（ツールチップに表示） */
  description: string;
  /** ステートアイコン（絵文字） */
  icon: string;
}

export const STATE_MASTER: Record<string, StateMasterData> = {
  // 攻撃力上昇ステート
    "attackPowerUp": {
        stateId: "attackPowerUp",
        name: '攻撃力上昇',
        description: '攻撃力が20%上昇する',
        icon: '⚔️',
        stateVisualType: StateVisualType.NONE,
        stacks: null,
        duration: 3,
        triggerTimings: [GamePhase.BATTLE_CALCULATION],
        remainings: null,
        effects: [
            {
                effectType: EffectType.UNIT_ATTACK_BUFF,
                visualType: EffectVisualType.NONE,
                target: EffectTarget.SELF_UNIT,
                valueType: ValueType.PERCENTAGE,
                value: 20,
            },
        ],
        excludes: [[], ["attackPowerDown"], []], // 同位排他: 攻撃力低下と排他
    },
    // 攻撃力低下ステート
    "attackPowerDown": {
        stateId: "attackPowerDown",
        name: '攻撃力低下',
        description: '攻撃力が15%低下する',
        icon: '🗡️',
        stateVisualType: StateVisualType.NONE,
        stacks: null,
        duration: 2,
        triggerTimings: [GamePhase.BATTLE_CALCULATION],
        remainings: null,
        effects: [
            {
                effectType: EffectType.UNIT_ATTACK_DEBUFF,
                visualType: EffectVisualType.NONE,
                target: EffectTarget.SELF_UNIT,
                valueType: ValueType.PERCENTAGE,
                value: 15,
            },
        ],
        excludes: [[], ["attackPowerUp"], []],
    },
    // 国力増加ステート（ターン開始時）
    "prosperity": {
        stateId: "prosperity",
        name: '繁栄',
        description: 'ターン開始時に国力が50増加する',
        icon: '🌟',
        stateVisualType: StateVisualType.NONE,
        stacks: null, // スタック不可
        duration: null, // 永続
        triggerTimings: [GamePhase.TURN_START],
        remainings: null,
        effects: [EFFECT_MASTER["powerGain50"]],
        excludes: [[], [], []],
    },
    // 死亡ステート
        "dead": {
        stateId: "dead",
        name: '死亡',
        description: 'ユニットが死亡している',
        icon: '💀',
        stateVisualType: StateVisualType.NONE,
        stacks: null,
        duration: null,
        triggerTimings: [],
        remainings: null,
        effects: [],
        excludes: [[], [], []],
    },
    // 滅亡ステート
    "nationDestroyed": {
        stateId: "nationDestroyed",
        name: '滅亡',
        description: '国家が滅亡している',
        icon: '⚰️',
        stateVisualType: StateVisualType.NONE,
        stacks: null,
        duration: null,
        triggerTimings: [],
        remainings: null,
        effects: [],
        excludes: [[], [], []],
    },

} as const;

export const setupState = (stateId: string, unitId: string, ownerNationId: string): State => {
    const baseState = STATE_MASTER[stateId];
    const { description, icon, ...stateFields } = baseState;
    return {
        ...stateFields,
        unitId,
        ownerNationId,
    };
}

/**
 * ステートカテゴリ
 */
export enum StateCategory {
  BUFF = 'buff',
  DEBUFF = 'debuff',
  NEUTRAL = 'neutral'
}

/**
 * ステートIDとカテゴリのマッピング
 */
const STATE_CATEGORY_MAP: Record<string, StateCategory> = {
  attackPowerUp: StateCategory.BUFF,
  attackPowerDown: StateCategory.DEBUFF,
  prosperity: StateCategory.BUFF,
  dead: StateCategory.NEUTRAL,
  nationDestroyed: StateCategory.NEUTRAL,
};

/**
 * ステート説明を取得
 * @param stateId ステートID
 * @returns ステート説明文。存在しない場合は"不明なステート"
 */
export function getStateDescription(stateId: string): string {
  const state = STATE_MASTER[stateId];
  return state?.description ?? '不明なステート';
}

/**
 * ステートアイコンを取得
 * @param stateId ステートID
 * @returns ステートアイコン絵文字。存在しない場合は"❓"
 */
export function getStateIcon(stateId: string): string {
  const state = STATE_MASTER[stateId];
  return state?.icon ?? '❓';
}

/**
 * ステートカテゴリを取得
 * @param stateId ステートID
 * @returns ステートカテゴリ（'buff' | 'debuff' | 'neutral'）
 */
export function getStateCategory(stateId: string): 'buff' | 'debuff' | 'neutral' {
  const category = STATE_CATEGORY_MAP[stateId] ?? StateCategory.NEUTRAL;
  return category;
}