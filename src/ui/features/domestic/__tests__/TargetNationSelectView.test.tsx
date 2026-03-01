import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TargetNationSelectView } from '../TargetNationSelectView';
import { createMockNation } from '@ui/__tests__/fixtures';

// BattleArea のモック
vi.mock('@ui/components/BattleArea', () => ({
  BattleArea: ({ nation }: any) => (
    <div data-testid="battle-area">{nation.name}</div>
  ),
}));

describe('TargetNationSelectView', () => {
  const currentNation = createMockNation({ nationId: 'player', name: 'プレイヤー' });
  const enemies = [
    createMockNation({ nationId: 'enemy1', name: '敵国A' }),
    createMockNation({ nationId: 'enemy2', name: '敵国B' }),
  ];

  it('自国 BattleArea と敵国ボタンが表示される', () => {
    render(
      <TargetNationSelectView
        currentNation={currentNation}
        enemyNations={enemies}
        onTargetSelect={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByTestId('battle-area')).toHaveTextContent('プレイヤー');
    expect(screen.getByText('攻撃対象を選択してください')).toBeInTheDocument();
    expect(screen.getByText('敵国A')).toBeInTheDocument();
    expect(screen.getByText('敵国B')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('敵国ボタンをクリックすると onTargetSelect が呼ばれる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <TargetNationSelectView
        currentNation={currentNation}
        enemyNations={enemies}
        onTargetSelect={onSelect}
        onCancel={() => {}}
      />,
    );
    await user.click(screen.getByText('敵国A'));
    expect(onSelect).toHaveBeenCalledWith(enemies[0]);
  });

  it('キャンセルクリックで onCancel が呼ばれる', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <TargetNationSelectView
        currentNation={currentNation}
        enemyNations={enemies}
        onTargetSelect={() => {}}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByText('キャンセル'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
