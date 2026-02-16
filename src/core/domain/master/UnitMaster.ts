import { Unit } from "../models/Unit";

export const UNIT_MASTER: Record<string, Unit> = {
  "infantry": {
    baseUnitId: "infantry",
    name: "歩兵",
    maxHP: 100,
    currentHP: 100,
    attack: 50,
    skillId: "normalAttack",
    states: [],
  },
  "archer": {
    baseUnitId: "archer",
    name: "弓兵",
    maxHP: 80,
    currentHP: 80,
    attack: 60,
    skillId: "areaAttack",
    states: [],
  },
  "knight": {
    baseUnitId: "knight",
    name: "騎士",
    maxHP: 120,
    currentHP: 120,
    attack: 70,
    skillId: "absorptionAttack",
    states: [],
  },
} as const;