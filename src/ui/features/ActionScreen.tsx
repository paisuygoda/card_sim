import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { NationPanel } from '@ui/components/NationPanel';
import { BattleArea } from '@ui/components/BattleArea';
import { MasterData } from '@core/domain/master';
import type { Nation } from '@core/domain/models';
import { GameEvent, CommandExecuteData } from '@core/infrastructure/IGameUIBridge';

/**
 * ActionScreen - 行動フェーズ画面
 *
 * 行動フェーズでのコマンド実行演出を表示
 * 全国家の状態とターゲットのハイライト表示
 */

export const ActionScreen: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);
  const animationQueue = useUIStateStore((state) => state.animationQueue);

  if (!gameState) {
    return null;
  }

  // ステージ設定からパワー勝利条件を取得
  let stage = null;
  try {
    stage = MasterData.getStage(gameState.stageId);
  } catch {
    stage = null;
  }
  const powerWinThreshold = stage?.powerWinThreshold ?? null;

  // 現在実行中のCOMMAND_EXECUTEイベントを取得
  const currentCommand = animationQueue.find(
    (anim) => anim.eventType === GameEvent.COMMAND_EXECUTE
  );
  const commandData = currentCommand?.data as CommandExecuteData | undefined;

  /**
   * 指定国家がコマンドのターゲットか判定
   */
  const isTargetNation = (nation: Nation): boolean => {
    if (!commandData || !commandData.commandTarget) return false;
    return commandData.commandTarget === nation.nationId;
  };

  return (
    <div className="action-screen" data-testid="action-screen">
      <h2>行動フェーズ</h2>
      <div className="action-layout">
        {gameState.nations.map((nation) => {
          const isTarget = isTargetNation(nation);
          return (
            <div
              key={nation.nationId}
              className={`nation-section ${isTarget ? 'highlighted' : ''}`}
              data-testid={`nation-section-${nation.nationId}`}
            >
              <h3>{nation.name}</h3>
              <NationPanel
                nation={nation}
                isCurrentTurn={false}
                powerWinThreshold={powerWinThreshold}
              />
              <BattleArea
                nation={nation}
                currentAttacker={undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
