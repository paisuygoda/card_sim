import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { NationLayoutGrid } from '@ui/components/NationLayoutGrid';
import { MasterData } from '@core/domain/master';
import type { BattleContext } from '@core/domain/models/BattleContext';
import type { NationEntry } from '@ui/components/NationLayoutGrid';
import styles from './BattleScreen.module.css';

/**
 * BattleScreen - 戦闘画面
 *
 * 戦闘フェーズでの演出を表示
 * 攻撃側・防御側のユニット配置、攻撃演出など
 */

export const BattleScreen: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);

  if (!gameState) {
    return null;
  }

  const battleContext: BattleContext | null = gameState.battleContext;

  let stage = null;
  try {
    stage = MasterData.getStage(gameState.stageId);
  } catch {
    stage = null;
  }
  const powerWinThreshold = stage?.powerWinThreshold ?? null;

  const attackerNation = battleContext
    ? gameState.nations.find((n) => n.nationId === battleContext.attackerNationId)
    : undefined;
  const defenderNation = battleContext
    ? gameState.nations.find((n) => n.nationId === battleContext.defenderNationId)
    : undefined;

  // battleContextがある場合は攻撃側・防御側のレイアウト、ない場合は全国家を並べる
  const nations: NationEntry[] = attackerNation && defenderNation
    ? [
        { nation: attackerNation, label: '攻撃側', testId: 'attacker-side', divClassName: 'attacker-side', isCurrentTurn: true },
        { nation: defenderNation, label: '防御側', testId: 'defender-side', divClassName: 'defender-side', isCurrentTurn: false },
      ]
    : gameState.nations.map((nation, index) => ({
        nation,
        label: nation.name,
        testId: `nation-side-${index}`,
        divClassName: 'defender-side',
        isCurrentTurn: false,
      }));

  return (
    <div className={styles['battle-screen']} data-testid="battle-screen">
      <h2>戦闘フェーズ</h2>
      <NationLayoutGrid
        nations={nations}
        powerWinThreshold={powerWinThreshold}
        currentAttacker={battleContext?.currentAttacker}
        showGraveyard
        layoutClassName={styles['battle-layout']}
      />
    </div>
  );
};
