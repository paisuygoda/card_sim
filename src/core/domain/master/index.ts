import { Command, Effect, Nation, Skill, State, Unit } from "../models";
import { COMMAND_MASTER } from "./CommandMaster";
import { EFFECT_MASTER } from "./EffectMaster";
import { NATION_MASTER } from "./NationMaster";
import { SKILL_MASTER } from "./SkillMaster";
import { STATE_MASTER } from "./StateMaster";
import { UNIT_MASTER } from "./UnitMaster";

export const MasterData = {
    getCommand: (id: string): Command => {
        const command = COMMAND_MASTER[id];
        if (!command) throw new Error(`Command ID ${id} not found`);
        return command;
    },
    getEffect: (id: string): Effect => {
        const effect = EFFECT_MASTER[id];
        if (!effect) throw new Error(`Effect ID ${id} not found`);
        return effect;
    },
    getNation: (id: string): Nation => {
        const nation = NATION_MASTER[id];
        if (!nation) throw new Error(`Nation ID ${id} not found`);
        return nation;
    },
    getSkill: (id: string): Skill => {
        const skill = SKILL_MASTER[id];
        if (!skill) throw new Error(`Skill ID ${id} not found`);
        return skill;
    },
    getState: (stateId: string, unitId: string, ownerNationId: string): State => {
        const baseState = STATE_MASTER[stateId];
        if (!baseState) throw new Error(`State ID ${stateId} not found`);
        return {
            ...baseState,
            unitId,
            ownerNationId,
        };
    },
    getUnit: (baseUnitId: string, ownerNationId: string): Unit => {
        const baseUnit = UNIT_MASTER[baseUnitId];
        if (!baseUnit) throw new Error(`Unit ID ${baseUnitId} not found`);
        return {
            ...baseUnit,
            unitId: `${ownerNationId}-${baseUnitId}`,
            ownerNationId: ownerNationId,
        };
    },
};