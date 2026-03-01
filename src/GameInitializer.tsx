import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage } from '@core/domain/models/Stage';
import { GameManager } from '@core/application/GameManager';
import { ReactUIBridge } from '@bridge/ReactUIBridge';

/**
 * useGameInitializer - ゲーム初期化ロジックを管理するカスタムフック
 *
 * 責務:
 * - ステージ選択状態の管理
 * - GameManager / ReactUIBridge の生成
 * - ゲーム開始（startGame）の実行
 * - 多重初期化防止
 * - エラー時のリカバリ（ステージ選択画面への復帰）
 */
export function useGameInitializer() {
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

  return {
    selectedStage,
    handleStageSelect,
    handleReturnToSelect,
    handleReplay,
  };
}
