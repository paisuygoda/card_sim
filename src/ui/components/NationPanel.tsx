import React from 'react';
import { Nation } from '@core/domain/models';

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

export const NationPanel: React.FC<NationPanelProps> = React.memo(({ nation, isCurrentTurn, powerWinThreshold }) => {
  const gaugeWidth =
    powerWinThreshold !== null
      ? `${Math.min((nation.power / powerWinThreshold) * 100, 100)}%`
      : null;

  return (
    <div className={`nation-panel${isCurrentTurn ? ' current-turn' : ''}`}>
      <div className="nation-header">
        <h2>{nation.name}</h2>
        <span className="nation-badge">{nation.isNPC ? 'CPU' : 'プレイヤー'}</span>
      </div>
      <p>国力: {nation.power}</p>
      {gaugeWidth !== null && (
        <div className="power-gauge">
          <div
            data-testid="power-gauge-fill"
            className="power-gauge-fill"
            style={{ width: gaugeWidth }}
          />
        </div>
      )}
      <p>残り内政: {nation.remainingActions}</p>
    </div>
  );
});

NationPanel.displayName = 'NationPanel';
