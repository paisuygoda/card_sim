import React from 'react';
import { Command, Nation } from '@core/domain/models';

/**
 * CommandPanel - コマンド選択パネル
 * 
 * 内政コマンドや行動コマンドの選択UIを提供
 */

interface CommandPanelProps {
  commands: Command[];
  onCommandSelect: (command: Command) => void;
  disabled?: boolean;
  nation: Nation;
}

export const CommandPanel: React.FC<CommandPanelProps> = React.memo((
  {
    commands,
    onCommandSelect,
    disabled = false,
    nation,
  }
) => {
  return (
    <div className="command-panel">
      <h3>コマンド選択</h3>
      <div className="command-list">
        {commands.map((command) => {
          const nullCount = nation.units.filter((u) => u === null).length;
          const isDisabled =
            disabled ||
            nation.remainingActions < command.costAction ||
            nation.power < command.costPower ||
            nullCount < command.unitSpace;

          return (
            <button
              key={command.commandId}
              onClick={() => onCommandSelect(command)}
              disabled={isDisabled}
              className="command-button"
              title={command.description}
            >
              {command.name}
              {command.costAction > 0 && (
                <span className="command-cost-action"> 行動:{command.costAction}</span>
              )}
              {command.costPower > 0 && (
                <span className="command-cost-power"> 国力:{command.costPower}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

CommandPanel.displayName = 'CommandPanel';
