import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { BattleArea } from '@ui/components/BattleArea';
import { NationPanel } from '@ui/components/NationPanel';
import { MasterData } from '@core/domain/master';
import type { BattleContext } from '@core/domain/models/BattleContext';

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
  const nationsToShow = attackerNation && defenderNation
    ? [
        { nation: attackerNation, label: '攻撃側', testId: 'attacker-side', isAttacker: true },
        { nation: defenderNation, label: '防御側', testId: 'defender-side', isAttacker: false },
      ]
    : gameState.nations.map((nation, index) => ({
        nation,
        label: nation.name,
        testId: `nation-side-${index}`,
        isAttacker: false,
      }));

  return (
    <div className="battle-screen" data-testid="battle-screen">
      <h2>戦闘フェーズ</h2>
      <div className="battle-layout">
        {nationsToShow.map(({ nation, label, testId, isAttacker }) => (
          <div key={nation.nationId} className={isAttacker ? 'attacker-side' : 'defender-side'} data-testid={testId}>
            <h3>{label}</h3>
            <NationPanel
              nation={nation}
              isCurrentTurn={isAttacker}
              powerWinThreshold={powerWinThreshold}
            />
            <BattleArea
              nation={nation}
              currentAttacker={battleContext?.currentAttacker}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
