import React, { useState, useEffect } from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { CommandPanel } from '@ui/components/CommandPanel';
import { BattleArea } from '@ui/components/BattleArea';
import { Command, CommandTargetType } from '@core/domain/models';
import { Nation } from '@core/domain/models';

/**
 * DomesticScreen - 内政画面
 * 
 * 内政フェーズでのプレイヤー操作を提供
 * コマンド選択、ユニット配置など
 */

export const DomesticScreen: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);
  const input = useUIStateStore((state) => state.input);
  const completeInput = useUIStateStore((state) => state.completeInput);

  // 重複選択を防止するフラグ
  const [isSelecting, setIsSelecting] = useState(false);
  // ターゲット選択待ちのコマンド（ENEMY_NATION系）
  const [pendingCommand, setPendingCommand] = useState<Command | null>(null);

  // フェーズが変わった場合のクリーンアップ
  useEffect(() => {
    return () => {
      setIsSelecting(false);
      setPendingCommand(null);
    };
  }, [gameState?.currentPhase]);

  const handleCommandSelect = (command: Command) => {
    // 既に選択済みの場合は無視
    if (isSelecting) {
      return;
    }

    // 敵国家を対象とするコマンドはターゲット選択UIを挟む
    if (
      command.targetType === CommandTargetType.ENEMY_NATION ||
      command.targetType === CommandTargetType.ALL_ENEMY_NATIONS
    ) {
      setPendingCommand(command);
      return;
    }

    try {
      // 重複選択を防止
      setIsSelecting(true);
      
      // ログ出力
      console.log('Command selected:', command);
      
      // UIStateStoreのcompleteInputを呼び出し
      completeInput(command);
    } catch (error) {
      // エラーハンドリング
      console.error('Failed to complete input:', error);
      // エラー時はフラグをリセット
      setIsSelecting(false);
    }
  };

  const handleTargetSelect = (targetNation: Nation) => {
    if (!pendingCommand || isSelecting) {
      return;
    }
    try {
      setIsSelecting(true);
      const commandWithTarget: Command = { ...pendingCommand, targetId: targetNation.nationId };
      console.log('Command with target selected:', commandWithTarget);
      setPendingCommand(null);
      completeInput(commandWithTarget);
    } catch (error) {
      console.error('Failed to complete input with target:', error);
      setIsSelecting(false);
    }
  };

  const handleTargetCancel = () => {
    setPendingCommand(null);
  };

  if (!gameState || !input) {
    return null;
  }

  const currentNation = gameState.nations[gameState.currentTurnPlayer];

  // NPC国家のターンの場合
  if (currentNation.isNPC) {
    return (
      <div className="domestic-screen">
        <p>NPC思考中...</p>
      </div>
    );
  }

  // 生存している敵国家一覧
  const enemyNations = gameState.nations.filter(
    (nation) =>
      nation.nationId !== currentNation.nationId &&
      !nation.states.some((s) => s.stateId === 'nationDestroyed')
  );

  // ターゲット選択モード
  if (pendingCommand) {
    return (
      <div className="domestic-screen">
        <h2>内政フェーズ - {currentNation.name}</h2>
        <BattleArea nation={currentNation} />
        <div className="target-select-panel">
          <h3>攻撃対象を選択してください</h3>
          <div className="target-select-buttons">
            {enemyNations.map((nation) => (
              <button
                key={nation.nationId}
                className="target-select-button"
                onClick={() => handleTargetSelect(nation)}
              >
                {nation.name}
              </button>
            ))}
          </div>
          <button className="target-cancel-button" onClick={handleTargetCancel}>
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="domestic-screen">
      <h2>内政フェーズ - {currentNation.name}</h2>
      <BattleArea nation={currentNation} />
      <CommandPanel
        commands={input.context?.commands || currentNation.domesticCommands || []}
        onCommandSelect={handleCommandSelect}
        disabled={isSelecting}
        nation={currentNation}
      />
    </div>
  );
};
