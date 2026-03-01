import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StageSelectScreen } from '../StageSelectScreen';
import { GameEndScreen } from '../GameEndScreen';
import { useGameStateStore } from '@store/useGameStateStore';
import { createMockNation, createMockNPCNation, createMockGameState } from '@ui/__tests__/fixtures';

// -----------------------------------------------------------------------
// モック設定
// -----------------------------------------------------------------------

/**
 * STAGE_MASTER をモック
 * - ステージ1: title あり（「チュートリアル」）、2国参加、5ラウンド
 * - ステージ2: title なし（フォールバック「ステージ2」）、3国参加、15ラウンド
 */
vi.mock('@core/domain/master/StageMaster', () => ({
  STAGE_MASTER: {
    1: {
      stageId: 1,
      roundLimit: 5,
      powerWinThreshold: 500,
      initialNations: [
        { nationId: 'npc1' },
        { nationId: 'player' },
      ],
      baseDomesticActions: 2,
      title: 'チュートリアル',
      description: '基本を学ぶ入門ステージ',
    },
    2: {
      stageId: 2,
      roundLimit: 15,
      powerWinThreshold: 1000,
      initialNations: [
        { nationId: 'npc1' },
        { nationId: 'npc2' },
        { nationId: 'player' },
      ],
      baseDomesticActions: 3,
      // title なし → フォールバック表示を期待
    },
  },
}));

// -----------------------------------------------------------------------
// StageSelectScreen テスト
// -----------------------------------------------------------------------

/**
 * StageSelectScreen コンポーネントのテスト
 *
 * TDD 赤フェーズ: StageSelectScreen はまだ未実装のため、全テストが失敗することを期待する
 */
describe('StageSelectScreen', () => {
  const mockOnStageSelect = vi.fn();

  beforeEach(() => {
    mockOnStageSelect.mockClear();
  });

  // --------------------------------------------------------------------
  // 1. ステージ一覧表示
  // --------------------------------------------------------------------
  describe('ステージ一覧表示', () => {
    it('1. StageMasterに定義されたステージ数（2件）だけカードが表示される', () => {
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      // 偽グリーン防止: getAllByTestId は要素が存在しない場合エラーを投げる
      const stageCards = screen.getAllByTestId('stage-card');
      expect(stageCards).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------
  // 2. ステージタイトル表示
  // --------------------------------------------------------------------
  describe('ステージタイトル表示', () => {
    it('2a. title が定義されている場合はそのタイトルが data-testid="stage-title" に表示される', () => {
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      // 前提: stage-title 要素が2つ存在することを確認（偽グリーン検出）
      const titles = screen.getAllByTestId('stage-title');
      expect(titles).toHaveLength(2);

      // ステージ1には title: 'チュートリアル' があるのでそのまま表示
      expect(titles[0]).toHaveTextContent('チュートリアル');
    });

    it('2b. title が定義されていない場合は「ステージN」のフォールバックが表示される', () => {
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      const titles = screen.getAllByTestId('stage-title');
      expect(titles).toHaveLength(2);

      // ステージ2には title がないので「ステージ2」と表示される
      expect(titles[1]).toHaveTextContent('ステージ2');
    });
  });

  // --------------------------------------------------------------------
  // 3. ラウンド数表示
  // --------------------------------------------------------------------
  describe('ラウンド数表示', () => {
    it('3. 各ステージの roundLimit が data-testid="stage-round-limit" に表示される', () => {
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      const roundLimits = screen.getAllByTestId('stage-round-limit');
      expect(roundLimits).toHaveLength(2);
      expect(roundLimits[0]).toHaveTextContent('5');   // ステージ1: roundLimit=5
      expect(roundLimits[1]).toHaveTextContent('15');  // ステージ2: roundLimit=15
    });
  });

  // --------------------------------------------------------------------
  // 4. 参加国家数表示
  // --------------------------------------------------------------------
  describe('参加国家数表示', () => {
    it('4. 各ステージの参加国家数（initialNations.length）が data-testid="stage-nation-count" に表示される', () => {
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      const nationCounts = screen.getAllByTestId('stage-nation-count');
      expect(nationCounts).toHaveLength(2);
      expect(nationCounts[0]).toHaveTextContent('2');  // ステージ1: 2国
      expect(nationCounts[1]).toHaveTextContent('3');  // ステージ2: 3国
    });
  });

  // --------------------------------------------------------------------
  // 5 & 6. ステージ選択コールバック
  // --------------------------------------------------------------------
  describe('ステージ選択コールバック', () => {
    it('5. ステージカードをクリックすると onStageSelect が呼ばれる', async () => {
      const user = userEvent.setup();
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      const stageCards = screen.getAllByTestId('stage-card');
      await user.click(stageCards[0]);

      // 偽グリーン防止: vi.fn() で呼び出し回数を厳密に検証
      expect(mockOnStageSelect).toHaveBeenCalledTimes(1);
    });

    it('6. クリックしたステージのオブジェクトが onStageSelect に渡される', async () => {
      const user = userEvent.setup();
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      const stageCards = screen.getAllByTestId('stage-card');
      // 2枚目（ステージ2）をクリック
      await user.click(stageCards[1]);

      // 偽グリーン防止: 渡されたオブジェクトの stageId と roundLimit を厳密に検証
      expect(mockOnStageSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          stageId: 2,
          roundLimit: 15,
        })
      );
    });
  });

  // --------------------------------------------------------------------
  // 9 & 10. キーボード操作
  // --------------------------------------------------------------------
  describe('キーボード操作', () => {
    it('9. ステージカードにフォーカスしてEnterキーを押すとonStageSelectが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      const stageCards = screen.getAllByTestId('stage-card');
      stageCards[0].focus();
      await user.keyboard('{Enter}');

      expect(mockOnStageSelect).toHaveBeenCalledTimes(1);
    });

    it('10. ステージカードにフォーカスしてスペースキーを押すとonStageSelectが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<StageSelectScreen onStageSelect={mockOnStageSelect} />);

      const stageCards = screen.getAllByTestId('stage-card');
      stageCards[0].focus();
      await user.keyboard(' ');

      expect(mockOnStageSelect).toHaveBeenCalledTimes(1);
    });
  });
});

// -----------------------------------------------------------------------
// GameEndScreen - ステージ選択に戻るボタン
// -----------------------------------------------------------------------

/**
 * GameEndScreen の onReturnToSelect 追加に関するテスト
 *
 * TDD 赤フェーズ: onReturnToSelect props と「ステージ選択に戻る」ボタンは未実装
 */
describe('GameEndScreen - ステージ選択に戻る', () => {
  beforeEach(() => {
    useGameStateStore.setState({
      gameState: createMockGameState({
        currentRound: 5,
        roundLimit: 5,
        currentPhase: 'GAME_END' as any,
        nations: [
          createMockNation({
            nationId: 'player',
            name: 'プレイヤー国家',
            power: 300,
            remainingActions: 0,
          }),
          createMockNPCNation({
            nationId: 'npc1',
            name: 'NPC国家',
            power: 150,
            remainingActions: 0,
          }),
        ],
      }),
    });
  });

  it('7. onReturnToSelect が渡されたとき「ステージ選択に戻る」ボタンが表示される', () => {
    const mockOnReturnToSelect = vi.fn();
    render(<GameEndScreen onReturnToSelect={mockOnReturnToSelect} />);

    expect(
      screen.getByRole('button', { name: 'ステージ選択に戻る' })
    ).toBeInTheDocument();
  });

  it('8. 「ステージ選択に戻る」ボタンをクリックすると onReturnToSelect が呼ばれる', async () => {
    const user = userEvent.setup();
    const mockOnReturnToSelect = vi.fn();
    render(<GameEndScreen onReturnToSelect={mockOnReturnToSelect} />);

    const button = screen.getByRole('button', { name: 'ステージ選択に戻る' });
    await user.click(button);

    // 偽グリーン防止: vi.fn() で呼び出し回数を厳密に検証
    expect(mockOnReturnToSelect).toHaveBeenCalledTimes(1);
  });
});
