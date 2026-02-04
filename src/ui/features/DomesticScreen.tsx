import React, { useState } from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { CommandPanel } from '@ui/components/CommandPanel';
import { BattleArea } from '@ui/components/BattleArea';
import { Command } from '@core/domain/models';

/**
 * DomesticScreen - 内政画面
 * 
 * 内政フェーズでのプレイヤー操作を提供
 * コマンド選択、ユニット配置など
 */

export const DomesticScreen: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);
  const input = useUIStateStore((state) => state.input);
  const completeInput = useUIStateStore((state) => state.completeInput);

  // TODO: 実装
  // - 選択可能な内政コマンドを表示
  // - プレイヤーのコマンド選択を待つ
  // - 選択されたコマンドをcompleteInputで返す

  const handleCommandSelect = (command: Command) => {
    // TODO: 実装
    // completeInput(command);
    console.log('Command selected:', command);
  };

  if (!gameState || !input) {
    return null;
  }

  const currentNation = gameState.nations[gameState.currentTurnPlayer];

  return (
    <div className="domestic-screen">
      <h2>内政フェーズ - {currentNation.name}</h2>
      <BattleArea nation={currentNation} />
      <CommandPanel
        commands={currentNation.domesticCommands}
        onCommandSelect={handleCommandSelect}
      />
    </div>
  );
};
