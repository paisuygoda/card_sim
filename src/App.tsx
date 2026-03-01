import { useGameStateStore } from '@store/useGameStateStore';
import { AnimationDisplay } from '@ui/components/AnimationDisplay';
import { LogPanel } from '@ui/components/LogPanel';
import { useGameInitializer } from './GameInitializer';
import { GameRouter } from './GameRouter';
import './App.css';

/**
 * App - アプリケーションのルートコンポーネント
 *
 * 責務: グローバルレイアウト（ヘッダー + メイン + サイドバー）のみ。
 * ゲーム初期化は useGameInitializer、画面切り替えは GameRouter に委譲。
 */
function App() {
  const gameState = useGameStateStore((state) => state.gameState);
  const {
    selectedStage,
    handleStageSelect,
    handleReturnToSelect,
    handleReplay,
  } = useGameInitializer();

  // ステージ未選択時はステージ選択画面のみ表示（サイドバー不要）
  if (selectedStage === null) {
    return (
      <div className="app">
        <GameRouter
          selectedStage={selectedStage}
          onStageSelect={handleStageSelect}
          onReturnToSelect={handleReturnToSelect}
          onReplay={handleReplay}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>国家運営シミュレーションゲーム</h1>
      </header>
      <main className="app-main">
        <GameRouter
          selectedStage={selectedStage}
          onStageSelect={handleStageSelect}
          onReturnToSelect={handleReturnToSelect}
          onReplay={handleReplay}
        />
        <div data-testid="animation-display">
          <AnimationDisplay />
        </div>
      </main>
      <aside className="app-sidebar">
        <LogPanel />
        {import.meta.env.DEV && (
          <details>
            <summary>デバッグ: gameState</summary>
            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '400px' }}>
              {JSON.stringify(gameState, null, 2)}
            </pre>
          </details>
        )}
      </aside>
    </div>
  );
}

export default App;
