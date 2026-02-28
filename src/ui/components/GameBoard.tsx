import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { MasterData } from '@core/domain/master';
import { NationPanel } from './NationPanel';
import { BattleArea } from './BattleArea';
import { PhaseDisplay } from './PhaseDisplay';
import { Graveyard } from './Graveyard';

/**
 * GameBoard - ゲームボード全体表示コンポーネント
 * 
 * ゲーム全体のレイアウトを管理
 * 各国家パネル、フェーズ表示などを配置
 */

export const GameBoard: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);
  let stage = null;
  try {
    if (gameState) {
      stage = MasterData.getStage(gameState.stageId);
    }
  } catch {
    stage = null;
  }

  // TODO: 実装
  // - 各国家のNationPanelを表示
  // - PhaseDisplayを表示
  // - 戦闘エリアの表示（必要に応じて）

  if (!gameState) {
    return (
      <div className="game-board" data-testid="game-board">
        <p>ゲームが開始されていません</p>
      </div>
    );
  }

  return (
    <div className="game-board" data-testid="game-board">
      <PhaseDisplay
        currentPhase={gameState.currentPhase}
        currentRound={gameState.currentRound}
        currentTurnPlayer={gameState.currentTurnPlayer}
        maxRound={gameState.roundLimit}
        currentNationName={gameState.nations[gameState.currentTurnPlayer]?.name}
      />
      <div className="nations">
        {gameState.nations.map((nation, index) => (
          <div key={nation.nationId} className="nation-section">
            <NationPanel
              nation={nation}
              isCurrentTurn={index === gameState.currentTurnPlayer}
              powerWinThreshold={stage?.powerWinThreshold ?? null}
            />
            <BattleArea nation={nation} />
            <Graveyard graveyard={nation.graveyard} nationName={nation.name} />
          </div>
        ))}
      </div>
    </div>
  );
};
