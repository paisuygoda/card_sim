import { Stage } from '../models/Stage';
import { NATION_MASTER } from './NationMaster';

export const STAGE_MASTER: Record<number, Stage> = {
  // 初級ステージ
  1: {
    stageId: 1,
    roundLimit: 2,
    powerWinThreshold: 500,
    initialNations: [
      NATION_MASTER["npc1"],
      NATION_MASTER["player"],
    ],
    baseDomesticActions: 2,
  },
  // 中級ステージ
  2: {
    stageId: 2,
    roundLimit: 15,
    powerWinThreshold: 1000,
    initialNations: [
      NATION_MASTER["npc1"],
      NATION_MASTER["npc2"],
      NATION_MASTER["player"],
    ],
    baseDomesticActions: 3,
  },
  // 上級ステージ（国力制限なし）
  3: {
    stageId: 3,
    roundLimit: 20,
    powerWinThreshold: null,
    initialNations: [
      NATION_MASTER["npc1"],
      NATION_MASTER["npc2"],
      NATION_MASTER["player"],
    ],
    baseDomesticActions: 3,
  },
} as const;
