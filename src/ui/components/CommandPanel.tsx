import React from 'react';
import { Command } from '@core/domain/models';

/**
 * CommandPanel - コマンド選択パネル
 * 
 * 内政コマンドや行動コマンドの選択UIを提供
 */

interface CommandPanelProps {
  commands: Command[];
  onCommandSelect: (command: Command) => void;
  disabled?: boolean;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  commands,
  onCommandSelect,
  disabled = false,
}) => {
  // TODO: 実装
  // - コマンドリストを表示
  // - 各コマンドをボタンとして表示
  // - クリック時にonCommandSelectを呼び出し

  return (
    <div className="command-panel">
      <h3>コマンド選択</h3>
      <div className="command-list">
        {commands.map((command) => (
          <button
            key={command.commandId}
            onClick={() => onCommandSelect(command)}
            disabled={disabled}
            className="command-button"
          >
            {command.name}
          </button>
        ))}
      </div>
    </div>
  );
};
