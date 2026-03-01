import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { NationLayoutGrid } from '@ui/components/NationLayoutGrid';
import { MasterData } from '@core/domain/master';
import type { NationEntry } from '@ui/components/NationLayoutGrid';
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

  const nations: NationEntry[] = gameState.nations.map((nation) => {
    const isTarget = commandData?.commandTarget === nation.nationId;
    return {
      nation,
      label: nation.name,
      divClassName: `nation-section${isTarget ? ' highlighted' : ''}`,
    };
  });

  return (
    <div className="action-screen" data-testid="action-screen">
      <h2>行動フェーズ</h2>
      <NationLayoutGrid
        nations={nations}
        powerWinThreshold={powerWinThreshold}
        layoutClassName="action-layout"
      />
    </div>
  );
};
