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
    title: 'チュートリアル',
    description: '基本を学ぶ入門ステージ。2国間の国力争いで勝利を目指せ。',
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
    title: '三国鼎立',
    description: '3つの国家が覇権を争う中級ステージ。外交と内政のバランスが鍵。',
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
    title: '乱世の覇者',
    description: '制限ラウンド内に最大国力を目指す上級ステージ。あらゆる手段で頂点へ。',
  },
} as const;
