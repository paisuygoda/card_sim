import React from 'react';
import { CommandPanel } from '@ui/components/CommandPanel';
import { BattleArea } from '@ui/components/BattleArea';
import { Command, Nation } from '@core/domain/models';

interface CommandSelectViewProps {
  currentNation: Nation;
  commands: Command[];
  onCommandSelect: (command: Command) => void;
  disabled: boolean;
}

/**
 * CommandSelectView - コマンド選択画面
 * 
 * 内政フェーズのデフォルト画面。コマンド一覧を表示し、選択を受け付ける。
 */
export const CommandSelectView: React.FC<CommandSelectViewProps> = ({
  currentNation,
  commands,
  onCommandSelect,
  disabled,
}) => {
  return (
    <>
      <BattleArea nation={currentNation} />
      <CommandPanel
        commands={commands}
        onCommandSelect={onCommandSelect}
        disabled={disabled}
        nation={currentNation}
      />
    </>
  );
};
