import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { GameBoard } from '@ui/components/GameBoard';
import { ActionScreen } from '@ui/features/ActionScreen';
import { DomesticScreen } from '@ui/features/DomesticScreen';
import { BattleScreen } from '@ui/features/BattleScreen';
import { GameEndScreen } from '@ui/features/GameEndScreen';
import { StageSelectScreen } from '@ui/features/StageSelectScreen';
import { GamePhase } from '@core/domain/models';
import { Stage } from '@core/domain/models/Stage';

interface GameRouterProps {
  /** 選択済みステージ（null ならステージ選択画面を表示） */
  selectedStage: Stage | null;
  /** ステージ選択コールバック */
  onStageSelect: (stage: Stage) => void;
  /** ステージ選択画面に戻るコールバック */
  onReturnToSelect: () => void;
  /** リプレイコールバック */
  onReplay: () => void;
}

/**
 * GameRouter - ゲームフェーズに応じた画面切り替え専任コンポーネント
 *
 * 責務:
 * - GamePhase に基づく画面コンポーネントの選択・描画
 * - ステージ未選択時の StageSelectScreen 表示
 * - ローディング画面の表示
 */
export function GameRouter({
  selectedStage,
  onStageSelect,
  onReturnToSelect,
  onReplay,
}: GameRouterProps) {
  const gameState = useGameStateStore((state) => state.gameState);
  const input = useUIStateStore((state) => state.input);

  // ステージ未選択時はステージ選択画面を表示
  if (selectedStage === null) {
    return <StageSelectScreen onStageSelect={onStageSelect} />;
  }

  // ゲーム状態がまだ無い場合はローディング表示
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
    return <GameEndScreen onReturnToSelect={onReturnToSelect} onReplay={onReplay} />;
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

  // 行動フェーズ
  if (gameState.currentPhase === GamePhase.ACTION) {
    return <ActionScreen />;
  }

  // デフォルトはゲームボード表示
  return <GameBoard />;
}
