import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TargetUnitSelectView } from '../TargetUnitSelectView';
import { createMockNation, createMockUnit } from '@ui/__tests__/fixtures';

// BattleArea のモック
vi.mock('@ui/components/BattleArea', () => ({
  BattleArea: ({ nation, onUnitClick }: any) => (
    <div data-testid="battle-area">
      <div data-testid="nation-name">{nation.name}</div>
      {nation.units.map((unit: any, i: number) =>
        unit ? (
          <button key={i} data-testid={`unit-${i}`} onClick={() => onUnitClick?.(i)}>
            {unit.name}
          </button>
        ) : null,
      )}
    </div>
  ),
}));

describe('TargetUnitSelectView', () => {
  const nation = createMockNation({
    nationId: 'player',
    name: 'テスト国家',
    units: [
      createMockUnit({ unitId: 'u1', name: '戦士' }),
      createMockUnit({ unitId: 'u2', name: '魔法使い' }),
      null, null, null, null, null, null,
    ],
  });

  it('メッセージ・ユニット・キャンセルボタンを表示する', () => {
    render(
      <TargetUnitSelectView
        targetNation={nation}
        message="自国のユニットを選択してください"
        onUnitSelect={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('自国のユニットを選択してください')).toBeInTheDocument();
    expect(screen.getByTestId('nation-name')).toHaveTextContent('テスト国家');
    expect(screen.getByText('戦士')).toBeInTheDocument();
    expect(screen.getByText('魔法使い')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('ユニットクリックで onUnitSelect が呼ばれる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <TargetUnitSelectView
        targetNation={nation}
        message="ユニットを選択"
        onUnitSelect={onSelect}
        onCancel={() => {}}
      />,
    );
    await user.click(screen.getByTestId('unit-0'));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('キャンセルクリックで onCancel が呼ばれる', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <TargetUnitSelectView
        targetNation={nation}
        message="ユニットを選択"
        onUnitSelect={() => {}}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByText('キャンセル'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
