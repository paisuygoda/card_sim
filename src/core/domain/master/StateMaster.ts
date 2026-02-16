import { State, StateVisualType } from '../models/State';
import { GamePhase } from '../models/GamePhase';
import { EFFECT_MASTER } from './EffectMaster';
import { EffectType, EffectTarget, ValueType, EffectVisualType } from '../models/Effect';

export const STATE_MASTER: Record<string, State> = {
  // 攻撃力上昇ステート
    "attackPowerUp": {
        stateId: "attackPowerUp",
        name: '攻撃力上昇',
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
    return {
        ...baseState,
        unitId,
        ownerNationId,
    };
}