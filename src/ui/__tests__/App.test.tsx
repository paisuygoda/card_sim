import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useGameStateStore } from '@store/useGameStateStore';
import { GameManager } from '@core/application/GameManager';
import { ReactUIBridge } from '@bridge/ReactUIBridge';
import { GamePhase } from '@core/domain/models';
import { createMockGameState } from './fixtures';

// GameManagerをモック化
vi.mock('@core/application/GameManager', () => {
  return {
    GameManager: vi.fn().mockImplementation(function() { return {
      startGame: vi.fn().mockResolvedValue(undefined),
      getGameState: vi.fn(),
    }; }),
  };
});

// ReactUIBridgeをモック化
vi.mock('@bridge/ReactUIBridge', () => {
  return {
    ReactUIBridge: vi.fn().mockImplementation(function() { return {
      notifyGameEvent: vi.fn(),
      waitUI: vi.fn(),
      waitPlayerInput: vi.fn(),
      updateGameState: vi.fn(),
    }; }),
  };
});

/**
 * App - レイアウト統合テスト
 *
 * App.tsx はグローバルレイアウト（ヘッダー + メイン + サイドバー）のみを担当する。
 * 初期化ロジックのテストは GameInitializer.test.tsx、
 * 画面遷移のテストは GameRouter.test.tsx を参照。
 */
describe('App - レイアウト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ReactUIBridge as unknown as ReturnType<typeof vi.fn>).mockReset().mockImplementation(function() { return {
      notifyGameEvent: vi.fn(),
      waitUI: vi.fn(),
      waitPlayerInput: vi.fn(),
      updateGameState: vi.fn(),
    }; });
    (GameManager as unknown as ReturnType<typeof vi.fn>).mockReset().mockImplementation(function() { return {
      startGame: vi.fn().mockResolvedValue(undefined),
      getGameState: vi.fn(),
    }; });
    useGameStateStore.getState().resetGameState();
  });

  /** ステージを選択してフルレイアウトを表示するヘルパー */
  async function renderWithFullLayout(gameState?: ReturnType<typeof createMockGameState>) {
    const gs = gameState ?? createMockGameState({ commandNum: 2 });
    const GameManagerMock = GameManager as unknown as ReturnType<typeof vi.fn>;
    GameManagerMock.mockImplementation(function() { return {
      startGame: vi.fn().mockImplementation(async () => {
        useGameStateStore.getState().setGameState(gs);
      }),
      getGameState: vi.fn().mockReturnValue(gs),
    }; });

    const user = userEvent.setup();
    render(<App />);
    const stageCards = screen.getAllByTestId('stage-card');
    await user.click(stageCards[0]);
    return user;
  }

  it('ステージ選択前は .app コンテナのみが表示される', () => {
    render(<App />);
    expect(document.querySelector('.app')).not.toBeNull();
    // サイドバーは表示されない
    expect(document.querySelector('.app-sidebar')).toBeNull();
  });

  it('ゲーム開始後はヘッダー・メイン・サイドバーが表示される', async () => {
    await renderWithFullLayout();

    await waitFor(() => {
      expect(document.querySelector('.app-header')).not.toBeNull();
      expect(document.querySelector('.app-main')).not.toBeNull();
      expect(document.querySelector('.app-sidebar')).not.toBeNull();
    });
  });

  it('ヘッダーにタイトルが表示される', async () => {
    await renderWithFullLayout();

    await waitFor(() => {
      const header = document.querySelector('.app-header');
      expect(header).not.toBeNull();
      expect(header?.textContent).toContain('国家運営シミュレーションゲーム');
    });
  });

  it('サイドバーにログパネルが表示される', async () => {
    await renderWithFullLayout();

    await waitFor(() => {
      const sidebar = document.querySelector('.app-sidebar');
      expect(sidebar).not.toBeNull();
      expect(sidebar?.querySelector('.log-panel')).not.toBeNull();
    });
  });

  it('AnimationDisplayが表示される', async () => {
    await renderWithFullLayout();

    await waitFor(() => {
      expect(screen.getByTestId('animation-display')).toBeInTheDocument();
    });
  });

  describe('デバッグパネル（開発環境）', () => {
    it('開発環境でsidebarにdetails要素（gameStateデバッグパネル）が存在する', async () => {
      await renderWithFullLayout();

      await waitFor(() => {
        expect(document.querySelector('.app-sidebar')).not.toBeNull();
      });

      const detailsElement = document.querySelector('details');
      expect(detailsElement).not.toBeNull();
    });
  });
});
