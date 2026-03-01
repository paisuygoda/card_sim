import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommandPanel } from '../CommandPanel';
import type { Command, Nation } from '@core/domain/models';
import {
  createMockCommand,
  createMockNation,
  createMockUnit,
} from '@ui/__tests__/fixtures';

const CP = CommandPanel;

// -----------------------------------------------------------------------
// テストデータ（共有フィクスチャ使用）
// -----------------------------------------------------------------------

/** 基本コマンド（costAction=2, costPower=500） */
const mockCommand = createMockCommand({
  commandId: 'cmd-1',
  name: 'テストコマンド',
  costAction: 2,
  costPower: 500,
});

/** 国力コスト 0 のコマンド */
const mockCommandZeroPower: Command = {
  ...mockCommand,
  commandId: 'cmd-zero-power',
  name: '国力0コマンド',
  costPower: 0,
};

/** description 付きコマンド */
const mockCommandWithDesc: Command = {
  ...mockCommand,
  commandId: 'cmd-with-desc',
  name: '説明付きコマンド',
  description: 'コマンドの説明テキスト',
};

/** description なしコマンド */
const mockCommandNoDesc: Command = {
  ...mockCommand,
  commandId: 'cmd-no-desc',
  name: '説明なしコマンド',
};

/** 十分なリソースを持つ国家（power=1000, remainingActions=3） */
const mockNationSufficient = createMockNation({
  nationId: 'nation1',
  power: 1000,
});

/** 内政回数が 0 の国家 */
const mockNationNoActions: Nation = {
  ...mockNationSufficient,
  remainingActions: 0,
};

/** 国力不足の国家（power=100 < costPower=500） */
const mockNationLowPower: Nation = {
  ...mockNationSufficient,
  power: 100,
};

/** 非null ユニット（unitSpace チェック用） */
const mockUnit = createMockUnit({
  unitId: 'nation1infantry1',
  baseUnitId: 'infantry',
  name: '歩兵',
  attack: 20,
  skillId: 'skill1',
});

// -----------------------------------------------------------------------
// テストスイート
// -----------------------------------------------------------------------

describe('CommandPanel', () => {
  // --------------------------------------------------------------------
  // 1. 既存機能維持：コマンド名表示
  // --------------------------------------------------------------------
  describe('コマンド名表示', () => {
    it('1. コマンド名がボタン内に表示される', () => {
      render(
        <CP
          commands={[mockCommand]}
          onCommandSelect={vi.fn()}
          nation={mockNationSufficient}
        />
      );
      expect(screen.getByRole('button', { name: /テストコマンド/ })).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 2. コスト表示
  // --------------------------------------------------------------------
  describe('コスト表示', () => {
    it('2. costAction=2 のとき、ボタン内に内政回数コスト「2」が表示される', () => {
      render(
        <CP
          commands={[mockCommand]}
          onCommandSelect={vi.fn()}
          nation={mockNationSufficient}
        />
      );
      const button = screen.getByRole('button', { name: /テストコマンド/ });
      // 「内政:2」「行動:2」「2回」等のコスト情報が表示されることを確認
      // 現在の実装（コマンド名のみ）では "2" を含まないためテストは失敗する
      expect(button.textContent).toContain('2');
    });

    it('3. costPower=500 のとき、ボタン内に国力コスト「500」が表示される', () => {
      render(
        <CP
          commands={[mockCommand]}
          onCommandSelect={vi.fn()}
          nation={mockNationSufficient}
        />
      );
      const button = screen.getByRole('button', { name: /テストコマンド/ });
      // 「国力:500」「500」等のコスト情報が表示されることを確認
      // 現在の実装（コマンド名のみ）では "500" を含まないためテストは失敗する
      expect(button.textContent).toContain('500');
    });

    it('4. costPower=0 のとき、ボタンが正しくレンダリングされる（クラッシュしない）', () => {
      expect(() =>
        render(
          <CP
            commands={[mockCommandZeroPower]}
            onCommandSelect={vi.fn()}
            nation={mockNationSufficient}
          />
        )
      ).not.toThrow();

      expect(screen.getByRole('button', { name: /国力0コマンド/ })).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------
  // 3. 実行可否判定（disabled）
  // --------------------------------------------------------------------
  describe('実行可否判定', () => {
    it('5. remainingActions=0, costAction=1 のときボタンが disabled になる', () => {
      const cmdCost1: Command = {
        ...mockCommand,
        commandId: 'cmd-cost1',
        costAction: 1,
      };
      render(
        <CP
          commands={[cmdCost1]}
          onCommandSelect={vi.fn()}
          nation={mockNationNoActions}
        />
      );
      const button = screen.getByRole('button', { name: /テストコマンド/ });
      expect(button).toBeDisabled();
    });

    it('6. power=100, costPower=500 のときボタンが disabled になる', () => {
      render(
        <CP
          commands={[mockCommand]}
          onCommandSelect={vi.fn()}
          nation={mockNationLowPower}
        />
      );
      const button = screen.getByRole('button', { name: /テストコマンド/ });
      expect(button).toBeDisabled();
    });

    it('7. 十分な内政回数・国力があるとき、ボタンが disabled でない', () => {
      render(
        <CP
          commands={[mockCommand]}
          onCommandSelect={vi.fn()}
          nation={mockNationSufficient}
        />
      );
      const button = screen.getByRole('button', { name: /テストコマンド/ });
      expect(button).not.toBeDisabled();
    });

    it('10. unitSpace=1 かつ units が全て非null（空き枠ゼロ）のとき、ボタンが disabled になる', () => {
      const cmdUnitSpace1: Command = {
        ...mockCommand,
        commandId: 'cmd-unit-space-full',
        unitSpace: 1,
      };
      const nationFullUnits: Nation = {
        ...mockNationSufficient,
        units: [mockUnit, mockUnit, mockUnit, mockUnit, mockUnit, mockUnit, mockUnit, mockUnit],
      };
      render(
        <CP
          commands={[cmdUnitSpace1]}
          onCommandSelect={vi.fn()}
          nation={nationFullUnits}
        />
      );
      const button = screen.getByRole('button', { name: /テストコマンド/ });
      expect(button).toBeDisabled();
    });

    it('11. unitSpace=1 かつ units に null が含まれる（空き枠あり）とき、ボタンが disabled でない', () => {
      const cmdUnitSpace1: Command = {
        ...mockCommand,
        commandId: 'cmd-unit-space-ok',
        unitSpace: 1,
      };
      // mockNationSufficient の units は全て null のため空き枠あり（nullCount=8 >= unitSpace=1）
      render(
        <CP
          commands={[cmdUnitSpace1]}
          onCommandSelect={vi.fn()}
          nation={mockNationSufficient}
        />
      );
      const button = screen.getByRole('button', { name: /テストコマンド/ });
      expect(button).not.toBeDisabled();
    });
  });

  // --------------------------------------------------------------------
  // 4. ホバー時詳細表示（description）
  // --------------------------------------------------------------------
  describe('ホバー時詳細表示', () => {
    it('8. description が存在するとき、title 属性または aria 属性に説明文が含まれる', () => {
      render(
        <CP
          commands={[mockCommandWithDesc]}
          onCommandSelect={vi.fn()}
          nation={mockNationSufficient}
        />
      );
      const button = screen.getByRole('button', { name: /説明付きコマンド/ });

      const title = button.getAttribute('title') ?? '';
      const ariaDesc = button.getAttribute('aria-description') ?? '';
      const ariaLabel = button.getAttribute('aria-label') ?? '';

      const hasDescription =
        title.includes('コマンドの説明テキスト') ||
        ariaDesc.includes('コマンドの説明テキスト') ||
        ariaLabel.includes('コマンドの説明テキスト');

      expect(hasDescription).toBe(true);
    });

    it('9. description が未設定でもクラッシュしない', () => {
      expect(() =>
        render(
          <CP
            commands={[mockCommandNoDesc]}
            onCommandSelect={vi.fn()}
            nation={mockNationSufficient}
          />
        )
      ).not.toThrow();
    });
  });
});
