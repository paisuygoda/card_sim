import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameBoard } from '@ui/components/GameBoard';
import { AnimationDisplay } from '@ui/components/AnimationDisplay';
import { DomesticScreen } from '@ui/features/DomesticScreen';
import { BattleScreen } from '@ui/features/BattleScreen';
import { GameEndScreen } from '@ui/features/GameEndScreen';
import { StageSelectScreen } from '@ui/features/StageSelectScreen';
import { GamePhase } from '@core/domain/models';
import { Stage } from '@core/domain/models/Stage';
import { GameManager } from '@core/application/GameManager';
import { ReactUIBridge } from '@bridge/ReactUIBridge';
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

  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  // 同一ステージの再プレイ用カウンター（インクリメントでuseEffectを再発火）
  const [gameKey, setGameKey] = useState(0);
  // 多重初期化防止用のフラグ
  const isStarting = useRef(false);

  const handleStageSelect = useCallback((stage: Stage) => {
    setSelectedStage(stage);
  }, []);

  const handleReturnToSelect = useCallback(() => {
    isStarting.current = false;
    setSelectedStage(null);
  }, []);

  const handleReplay = useCallback(() => {
    isStarting.current = false;
    setGameKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (selectedStage === null) return;
    if (isStarting.current) return;
    isStarting.current = true;

    let cancelled = false;

    // ゲーム初期化処理
    const startGame = async () => {
      try {
        // 1. ReactUIBridgeのインスタンス作成
        const bridge = new ReactUIBridge();

        // 2. GameManagerのインスタンス作成
        const gameManager = new GameManager(bridge);

        // 3. ゲームの開始（クリーンアップ済みなら何もしない）
        if (!cancelled) {
          await gameManager.startGame(selectedStage);
        }
      } catch (error) {
        console.error('ゲーム初期化エラー:', error);
        // エラー時はフラグをリセットしてステージ選択に戻る（リトライ可能）
        isStarting.current = false;
        if (!cancelled) {
          setSelectedStage(null);
        }
      }
    };

    startGame();

    // クリーンアップ: 孤立した非同期処理の無効化 + React StrictMode 対応
    return () => {
      cancelled = true;
      isStarting.current = false;
    };
  }, [selectedStage, gameKey]);

  // ステージ未選択時はステージ選択画面を表示
  if (selectedStage === null) {
    return (
      <div className="app">
        <StageSelectScreen onStageSelect={handleStageSelect} />
      </div>
    );
  }

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
      return <GameEndScreen onReturnToSelect={handleReturnToSelect} onReplay={handleReplay} />;
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
