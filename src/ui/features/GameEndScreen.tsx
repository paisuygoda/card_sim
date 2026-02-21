import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';

/**
 * GameEndScreenProps
 */
interface GameEndScreenProps {
  onReturnToSelect?: () => void;
  onReplay?: () => void;
}

/**
 * GameEndScreen - ゲーム終了画面
 *
 * ゲーム終了時の結果表示
 * 勝者、各国家の最終国力など
 */

export const GameEndScreen: React.FC<GameEndScreenProps> = ({ onReturnToSelect, onReplay }) => {
  const gameState = useGameStateStore((state) => state.gameState);

  if (!gameState) {
    return null;
  }

  // 勝者を決定（国力最大の国家）
  const winner = gameState.nations.reduce((prev, current) => {
    return current.power > prev.power ? current : prev;
  });

  return (
    <div className="game-end-screen">
      <h1>ゲーム終了</h1>
      <h2>勝者: {winner.name}</h2>
      <div className="final-results">
        <h3>最終結果</h3>
        {gameState.nations.map((nation) => (
          <div key={nation.nationId} className="nation-result">
            <p>
              {nation.name}: 国力 {nation.power}
            </p>
          </div>
        ))}
      </div>
      {onReturnToSelect && (
        <button onClick={onReturnToSelect}>
          ステージ選択に戻る
        </button>
      )}
      {onReplay && (
        <button onClick={onReplay}>
          もう一度プレイ
        </button>
      )}
    </div>
  );
};
