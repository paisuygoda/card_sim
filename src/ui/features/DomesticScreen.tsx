import React, { useEffect, useCallback } from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { useUIStateStore } from '@store/useUIStateStore';
import { Command, CommandTargetType } from '@core/domain/models';
import { Nation } from '@core/domain/models';
import { useDomesticReducer } from './domestic/useDomesticReducer';
import { CommandSelectView } from './domestic/CommandSelectView';
import { TargetNationSelectView } from './domestic/TargetNationSelectView';
import { TargetUnitSelectView } from './domestic/TargetUnitSelectView';
import styles from './DomesticScreen.module.css';

/**
 * DomesticScreen - 内政画面（コンテナコンポーネント）
 * 
 * useReducer による明示的な状態遷移管理を行い、
 * モードに応じたサブコンポーネントへ描画を委譲する。
 */
export const DomesticScreen: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);
  const input = useUIStateStore((state) => state.input);
  const completeInput = useUIStateStore((state) => state.completeInput);

  const [state, dispatch] = useDomesticReducer();

  // フェーズが変わった場合のクリーンアップ
  useEffect(() => {
    return () => {
      dispatch({ type: 'RESET' });
    };
  }, [gameState?.currentPhase]);

  const handleCommandSelect = useCallback((command: Command) => {
    dispatch({ type: 'SELECT_COMMAND', command });

    // ターゲット不要なコマンドは直接送信
    if (
      command.targetType !== CommandTargetType.SELF_UNIT &&
      command.targetType !== CommandTargetType.ENEMY_NATION &&
      command.targetType !== CommandTargetType.ALL_ENEMY_NATIONS &&
      command.targetType !== CommandTargetType.ENEMY_UNIT
    ) {
      try {
        completeInput(command);
      } catch (error) {
        console.error('Failed to complete input:', error);
        dispatch({ type: 'RESET' });
      }
    }
  }, [completeInput, dispatch]);

  const handleTargetSelect = useCallback((targetNation: Nation) => {
    if (state.mode !== 'TARGET_NATION_SELECT') {
      return;
    }
    const { pendingCommand } = state;

    dispatch({ type: 'SELECT_NATION', nation: targetNation });

    // ENEMY_UNIT コマンド → ユニット選択へ遷移するだけ（送信はまだ）
    if (pendingCommand.targetType === CommandTargetType.ENEMY_UNIT) {
      return;
    }

    // ENEMY_NATION / ALL_ENEMY_NATIONS → 即送信
    try {
      const commandWithTarget: Command = { ...pendingCommand, targetId: targetNation.nationId };
      completeInput(commandWithTarget);
    } catch (error) {
      console.error('Failed to complete input with target:', error);
      dispatch({ type: 'RESET' });
    }
  }, [state, completeInput, dispatch]);

  const handleUnitSelect = useCallback((unitIndex: number) => {
    if (state.mode !== 'TARGET_UNIT_SELECT' || !gameState) {
      return;
    }

    const { pendingCommand, unitSelectMode } = state;
    const currentNation = gameState.nations[gameState.currentTurnPlayer];

    // 選択対象の国家を決定
    let targetNation: Nation;
    let command: Command;

    if (unitSelectMode === 'SELF') {
      targetNation = currentNation;
      command = pendingCommand;
    } else {
      // ENEMY モード
      targetNation = state.targetNation;
      // input.context.commands から ENEMY_UNIT コマンドを見つける
      const enemyUnitCommand = input?.context?.commands?.find(
        (cmd: Command) => cmd.targetType === CommandTargetType.ENEMY_UNIT
      );
      if (!enemyUnitCommand) {
        console.error('No ENEMY_UNIT command found');
        dispatch({ type: 'RESET' });
        return;
      }
      command = enemyUnitCommand;
    }

    const selectedUnit = targetNation.units[unitIndex];
    if (!selectedUnit) {
      dispatch({ type: 'RESET' });
      return;
    }

    dispatch({ type: 'SELECT_UNIT', unitIndex });

    try {
      const commandWithTarget: Command = { ...command, targetId: selectedUnit.unitId };
      completeInput(commandWithTarget);
    } catch (error) {
      console.error('Failed to complete input with unit target:', error);
      dispatch({ type: 'RESET' });
    }
  }, [state, gameState, input, completeInput, dispatch]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
  }, [dispatch]);

  if (!gameState || !input) {
    return null;
  }

  const currentNation = gameState.nations[gameState.currentTurnPlayer];

  // NPC国家のターンの場合
  if (currentNation.isNPC) {
    return (
      <div className={styles['domestic-screen']}>
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

  // --- モードに応じたビュー切り替え ---

  const renderContent = () => {
    switch (state.mode) {
      case 'TARGET_UNIT_SELECT': {
        const displayNation = state.unitSelectMode === 'SELF'
          ? currentNation
          : state.targetNation;

        if (!displayNation) {
          console.error('No valid target nation for unit selection');
          dispatch({ type: 'RESET' });
          return null;
        }

        const message = state.unitSelectMode === 'SELF'
          ? '自国のユニットを選択してください'
          : `${displayNation.name}のユニットを選択してください`;

        return (
          <TargetUnitSelectView
            targetNation={displayNation}
            message={message}
            onUnitSelect={handleUnitSelect}
            onCancel={handleCancel}
          />
        );
      }

      case 'TARGET_NATION_SELECT':
        return (
          <TargetNationSelectView
            currentNation={currentNation}
            enemyNations={enemyNations}
            onTargetSelect={handleTargetSelect}
            onCancel={handleCancel}
          />
        );

      case 'COMMAND_SELECT':
      default:
        return (
          <CommandSelectView
            currentNation={currentNation}
            commands={input.context?.commands || currentNation.domesticCommands || []}
            onCommandSelect={handleCommandSelect}
            disabled={state.mode === 'COMMAND_SELECT' && state.isSubmitting}
          />
        );
    }
  };

  return (
    <div className={styles['domestic-screen']} data-testid="domestic-screen">
      <h2>内政フェーズ - {currentNation.name}</h2>
      {renderContent()}
    </div>
  );
};
