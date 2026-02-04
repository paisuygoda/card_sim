import React, { useEffect } from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameBoard } from '@ui/components/GameBoard';
import { AnimationDisplay } from '@ui/components/AnimationDisplay';
import { DomesticScreen } from '@ui/features/DomesticScreen';
import { BattleScreen } from '@ui/features/BattleScreen';
import { GameEndScreen } from '@ui/features/GameEndScreen';
import { GamePhase } from '@core/domain/models';
import './App.css';

/**
 * App - アプリケーションのルートコンポーネント
 * 
 * ゲーム全体の表示制御とルーティング
 */

function App() {
  const gameState = useGameStateStore((state) => state.gameState);
  const input = useUIStateStore((state) => state.input);
  const logs = useUIStateStore((state) => state.logs);

  // TODO: 実装
  // - ゲーム初期化処理
  // - フェーズに応じた画面表示
  // - アニメーション表示

  useEffect(() => {
    // ゲーム初期化処理
    // TODO: GameManagerの初期化
    // TODO: ステージデータの読み込み
    // TODO: ゲーム開始
  }, []);

  // フェーズに応じた画面を表示
  const renderScreen = () => {
    if (!gameState) {
      return (
        <div className="loading-screen">
          <h1>国家運営シミュレーションゲーム</h1>
          <p>読み込み中...</p>
        </div>
      );
    }

    // ゲーム終了
    if (gameState.currentPhase === GamePhase.GAME_END) {
      return <GameEndScreen />;
    }

    // 内政フェーズでプレイヤー入力待ち
    if (gameState.currentPhase === GamePhase.DOMESTIC && input?.isWaiting) {
      return <DomesticScreen />;
    }

    // 戦闘フェーズ
    if (
      gameState.currentPhase === GamePhase.BATTLE_START ||
      gameState.currentPhase === GamePhase.ATTACK_START ||
      gameState.currentPhase === GamePhase.BATTLE_END
    ) {
      return <BattleScreen />;
    }

    // デフォルトはゲームボード表示
    return <GameBoard />;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>国家運営シミュレーションゲーム</h1>
      </header>
      <main className="app-main">
        {renderScreen()}
        <AnimationDisplay />
      </main>
      <aside className="app-sidebar">
        <div className="log-panel">
          <h3>ログ</h3>
          <div className="log-list">
            {logs.slice(-10).map((log) => (
              <div key={log.id} className={`log-entry ${log.level}`}>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
