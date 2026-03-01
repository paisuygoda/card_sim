import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import styles from './GameEndScreen.module.css';

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

  // finalRankingはGameManager.gameEndPhaseで設定される（国力降順）
  // 未設定の場合はフォールバックとして国力順でソートする
  const finalRanking =
    gameState.finalRanking ?? [...gameState.nations].sort((a, b) => b.power - a.power);

  const winner = finalRanking[0];

  if (!winner) {
    return null;
  }

  return (
    <div className={styles['game-end-screen']} data-testid="game-end-screen">
      <h1>ゲーム終了</h1>
      <h2>勝者: {winner.name}</h2>
      <div className="final-results">
        <h3>最終結果</h3>
        {finalRanking.map((nation, index) => (
          <div key={nation.nationId} className="nation-result">
            <p>
              {index + 1}位 {nation.name}: 国力 {nation.power}
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
