import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandSelectView } from '../CommandSelectView';
import { createMockNation, createMockCommand } from '@ui/__tests__/fixtures';

// CommandPanel のモック
vi.mock('@ui/components/CommandPanel', () => ({
  CommandPanel: ({ commands, onCommandSelect, disabled }: any) => (
    <div data-testid="command-panel">
      {commands.map((cmd: any) => (
        <button
          key={cmd.commandId}
          data-testid={`command-${cmd.commandId}`}
          onClick={() => onCommandSelect(cmd)}
          disabled={disabled}
        >
          {cmd.name}
        </button>
      ))}
    </div>
  ),
}));

// BattleArea のモック
vi.mock('@ui/components/BattleArea', () => ({
  BattleArea: ({ nation }: any) => (
    <div data-testid="battle-area">{nation.name}</div>
  ),
}));

describe('CommandSelectView', () => {
  const nation = createMockNation({ nationId: 'player', name: 'テスト国家' });
  const commands = [
    createMockCommand({ commandId: 'cmd1', name: 'コマンド1' }),
    createMockCommand({ commandId: 'cmd2', name: 'コマンド2' }),
  ];

  it('BattleArea とコマンドパネルを表示する', () => {
    render(
      <CommandSelectView
        currentNation={nation}
        commands={commands}
        onCommandSelect={() => {}}
        disabled={false}
      />,
    );
    expect(screen.getByTestId('battle-area')).toBeInTheDocument();
    expect(screen.getByTestId('command-panel')).toBeInTheDocument();
    expect(screen.getByText('コマンド1')).toBeInTheDocument();
    expect(screen.getByText('コマンド2')).toBeInTheDocument();
  });

  it('コマンドクリックで onCommandSelect が呼ばれる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CommandSelectView
        currentNation={nation}
        commands={commands}
        onCommandSelect={onSelect}
        disabled={false}
      />,
    );
    await user.click(screen.getByTestId('command-cmd1'));
    expect(onSelect).toHaveBeenCalledWith(commands[0]);
  });

  it('disabled=true のときボタンが無効化される', () => {
    render(
      <CommandSelectView
        currentNation={nation}
        commands={commands}
        onCommandSelect={() => {}}
        disabled={true}
      />,
    );
    const btn = screen.getByTestId('command-cmd1');
    expect(btn).toBeDisabled();
  });
});
