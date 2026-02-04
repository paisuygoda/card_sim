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
}

export const NationPanel: React.FC<NationPanelProps> = ({ nation, isCurrentTurn }) => {
  // TODO: 実装
  // - 国家名
  // - 国力
  // - 残り内政回数
  // - 国家ステート
  // - 現在手番の場合はハイライト

  return (
    <div className={`nation-panel ${isCurrentTurn ? 'current-turn' : ''}`}>
      <h2>{nation.name}</h2>
      <p>国力: {nation.power}</p>
      <p>残り内政: {nation.remainingActions}</p>
      {/* TODO: ステート表示 */}
    </div>
  );
};
