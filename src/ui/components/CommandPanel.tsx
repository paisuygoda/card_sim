import React from 'react';
import { Command, Nation } from '@core/domain/models';
import { isCommandExecutable } from '@core/domain/logic/CommandLogic';
import styles from './CommandPanel.module.css';

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
    <div className={styles['command-panel']}>
      <h3>コマンド選択</h3>
      <div className={styles['command-list']}>
        {commands.map((command) => {
          const isDisabled = disabled || !isCommandExecutable(command, nation);

          return (
            <button
              key={command.commandId}
              onClick={() => onCommandSelect(command)}
              disabled={isDisabled}
              className={styles['command-button']}
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
