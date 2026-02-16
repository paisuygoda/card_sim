import { Nation } from '../models/Nation';
import { COMMAND_MASTER } from './CommandMaster';


export const NATION_MASTER: Record<string, Nation> = {
  // プレイヤー国家
  "player": {
    nationId: "player",
    name: 'プレイヤー王国',
    isNPC: false,
    power: 100,
    remainingActions: 2,
    states: [],
    units: [
      null, // 前衛
      null, // 中衛
      null, // 後衛
      null,
      null,
      null,
      null,
      null,
    ],
    graveyard: [],
    domesticCommands: [
      COMMAND_MASTER["getTax"],
      COMMAND_MASTER["militaryBuildUp"],
      COMMAND_MASTER["summonInfantry"],
    ],
    actionCommands: [
      COMMAND_MASTER["battle"],
      COMMAND_MASTER["training"],],
    targetMilitaryRatio: 0.5,
    aggressiveness: 0.5,
    hostileNationIds: ["npc1", "npc2"],
  },
  // NPC国家1
  "npc1": {
    nationId: "npc1",
    name: '帝国',
    isNPC: true,
    power: 80,
    remainingActions: 2,
    states: [],
    units: [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    graveyard: [],
    domesticCommands: [
      COMMAND_MASTER["getTax"],
      COMMAND_MASTER["militaryBuildUp"],
    ],
    actionCommands: [
      COMMAND_MASTER["training"],],
    targetMilitaryRatio: 0.6,
    aggressiveness: 0.7,
    hostileNationIds: ["player"],
  },
  // NPC国家2
  "npc2": {
    nationId: "npc2",
    name: '連邦',
    isNPC: true,
    power: 90,
    remainingActions: 2,
    states: [],
    units: [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    graveyard: [],
    domesticCommands: [
      COMMAND_MASTER["getTax"],
      COMMAND_MASTER["militaryBuildUp"],
    ],
    actionCommands: [
      COMMAND_MASTER["training"],],
    targetMilitaryRatio: 0.4,
    aggressiveness: 0.3,
    hostileNationIds: ["player"],
  },
} as const;
