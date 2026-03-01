import React from 'react';
import { Nation } from '@core/domain/models';
import { StateIconList } from './StateIconList';
import styles from './NationPanel.module.css';

/**
 * NationPanel - 国家情報表示パネル
 *
 * 国家の国力、残り内政回数、ステートなどを表示
 */

interface NationPanelProps {
  nation: Nation;
  isCurrentTurn: boolean;
  powerWinThreshold: number | null;
}

/**
 * 進捗率に応じたゲージの色を取得
 * @param progressPercent 進捗率（0～100）
 * @returns 色コード（rgb形式）
 */
function getPowerColor(progressPercent: number): string {
  // jsdomがrgb形式で色を返すため、rgb形式で設定する
  if (progressPercent >= 90) return 'rgb(76, 175, 80)'; // 緑 #4caf50
  if (progressPercent >= 60) return 'rgb(33, 150, 243)'; // 青 #2196f3
  if (progressPercent >= 30) return 'rgb(255, 152, 0)'; // オレンジ #ff9800
  return 'rgb(244, 67, 54)'; // 赤 #f44336
}

export const NationPanel: React.FC<NationPanelProps> = React.memo(({ nation, isCurrentTurn, powerWinThreshold }) => {
  const progressPercent =
    powerWinThreshold !== null
      ? Math.min(Math.max((nation.power / powerWinThreshold) * 100, 0), 100)
      : 0;
  
  const gaugeWidth =
    powerWinThreshold !== null
      ? `${progressPercent}%`
      : null;

  return (
    <div className={[styles['nation-panel'], isCurrentTurn && styles['current-turn']].filter(Boolean).join(' ')}>
      <div className="nation-header">
        <h2>{nation.name}</h2>
        <span className="nation-badge">{nation.isNPC ? 'CPU' : 'プレイヤー'}</span>
      </div>
      <p>国力: {nation.power}</p>
      {gaugeWidth !== null && (
        <div className={styles['power-gauge']}>
          <div
            data-testid="power-gauge-fill"
            className={styles['power-gauge-fill']}
            style={{ 
              width: gaugeWidth,
              backgroundColor: getPowerColor(progressPercent)
            }}
          />
        </div>
      )}
      <p>残り内政: {nation.remainingActions}</p>
      {nation.states.length > 0 && (
        <div className="nation-states">
          <StateIconList states={nation.states} />
        </div>
      )}
    </div>
  );
});

NationPanel.displayName = 'NationPanel';
