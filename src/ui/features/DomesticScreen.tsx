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

// ユニット選択モードの種類
type UnitSelectionMode = 'SELF' | 'ENEMY' | null;

export const DomesticScreen: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);
  const input = useUIStateStore((state) => state.input);
  const completeInput = useUIStateStore((state) => state.completeInput);

  // 重複選択を防止するフラグ
  const [isSelecting, setIsSelecting] = useState(false);
  // ターゲット選択待ちのコマンド（ENEMY_NATION系）
  const [pendingCommand, setPendingCommand] = useState<Command | null>(null);
  // ユニット選択モード
  const [selectingUnitTarget, setSelectingUnitTarget] = useState<UnitSelectionMode>(null);
  // ENEMY_UNITコマンド用：選択された敵国を保持
  const [selectedEnemyNation, setSelectedEnemyNation] = useState<Nation | null>(null);

  // フェーズが変わった場合のクリーンアップ
  useEffect(() => {
    return () => {
      setIsSelecting(false);
      setPendingCommand(null);
      setSelectingUnitTarget(null);
      setSelectedEnemyNation(null);
    };
  }, [gameState?.currentPhase]);

  const handleCommandSelect = (command: Command) => {
    // 既に選択済みの場合は無視
    if (isSelecting) {
      return;
    }

    // ユニットを対象とするコマンドはユニット選択UIを挟む
    if (command.targetType === CommandTargetType.SELF_UNIT) {
      setPendingCommand(command);
      setSelectingUnitTarget('SELF');
      return;
    }

    // 敵国家を対象とするコマンド、または敵ユニットを対象とするコマンドは
    // まず敵国選択UIを挟む（2段階UI）
    if (
      command.targetType === CommandTargetType.ENEMY_NATION ||
      command.targetType === CommandTargetType.ALL_ENEMY_NATIONS ||
      command.targetType === CommandTargetType.ENEMY_UNIT
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

    // ENEMY_UNITコマンドの場合は、国を保存してユニット選択モードへ遷移
    if (pendingCommand.targetType === CommandTargetType.ENEMY_UNIT) {
      setSelectedEnemyNation(targetNation);
      setPendingCommand(null); // 国家選択は完了
      return;
    }

    // 既存の国家選択処理（ENEMY_NATION等）
    try {
      setIsSelecting(true);
      const commandWithTarget: Command = { ...pendingCommand, targetId: targetNation.nationId };
      console.log('Command with target selected:', commandWithTarget);
      setPendingCommand(null);
      completeInput(commandWithTarget);
    } catch (error) {
      console.error('Failed to complete input with target:', error);
      setIsSelecting(false);
      setPendingCommand(null);
    }
  };

  const handleUnitSelect = (unitIndex: number) => {
    if (isSelecting || !gameState) {
      return;
    }

    // 現在のターンのプレイヤー国家
    const currentNation = gameState.nations[gameState.currentTurnPlayer];

    // 選択対象の国家を決定
    // 自国ユニット選択の場合：pendingCommandがあり、selectingUnitTargetが'SELF'
    // 敵国ユニット選択の場合：selectedEnemyNationがある
    let targetNation: Nation | undefined;
    let command: Command | null = null;

    if (selectingUnitTarget === 'SELF' && pendingCommand) {
      targetNation = currentNation;
      command = pendingCommand;
    } else if (selectedEnemyNation) {
      targetNation = selectedEnemyNation;
      // ENEMY_UNITコマンドを再構築（pendingCommandからの情報を使用）
      // selectedEnemyNationがある時点で敵ユニット選択モードのはず
      const enemyUnitCommand = input?.context?.commands?.find(
        (cmd: Command) => cmd.targetType === CommandTargetType.ENEMY_UNIT
      );
      if (!enemyUnitCommand) {
        console.error('No ENEMY_UNIT command found');
        setSelectedEnemyNation(null);
        setIsSelecting(false);
        return;
      }
      command = enemyUnitCommand;
    }

    if (!targetNation || !command) {
      console.warn('Invalid state for unit selection');
      setPendingCommand(null);
      setSelectingUnitTarget(null);
      setSelectedEnemyNation(null);
      setIsSelecting(false);
      return;
    }

    const selectedUnit = targetNation.units[unitIndex];
    
    // ユニットが存在しない場合は無視
    if (!selectedUnit) {
      console.warn('Selected unit does not exist');
      setPendingCommand(null);
      setSelectingUnitTarget(null);
      setSelectedEnemyNation(null);
      setIsSelecting(false);
      return;
    }

    try {
      setIsSelecting(true);
      const commandWithTarget: Command = { 
        ...command, 
        targetId: selectedUnit.unitId 
      };
      console.log('Command with unit target selected:', commandWithTarget);
      
      // 状態リセット
      setPendingCommand(null);
      setSelectingUnitTarget(null);
      setSelectedEnemyNation(null);
      
      completeInput(commandWithTarget);
    } catch (error) {
      console.error('Failed to complete input with unit target:', error);
      setIsSelecting(false);
      setPendingCommand(null);
      setSelectingUnitTarget(null);
      setSelectedEnemyNation(null);
    }
  };

  const handleTargetCancel = () => {
    setPendingCommand(null);
    setSelectingUnitTarget(null);
    setSelectedEnemyNation(null);
    setIsSelecting(false);
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

  // ユニット選択モード（自国または敵国）
  if (selectingUnitTarget || selectedEnemyNation) {
    const displayNation = selectingUnitTarget === 'SELF' 
      ? currentNation 
      : selectedEnemyNation;
    
    // 敵国不在時のクラッシュ防止
    if (!displayNation) {
      console.error('No valid target nation for unit selection');
      handleTargetCancel();
      return null;
    }

    const message = selectingUnitTarget === 'SELF' 
      ? '自国のユニットを選択してください' 
      : `${displayNation.name}のユニットを選択してください`;

    return (
      <div className="domestic-screen">
        <h2>内政フェーズ - {currentNation.name}</h2>
        <div className="unit-select-panel">
          <h3>{message}</h3>
          <BattleArea nation={displayNation} onUnitClick={handleUnitSelect} />
          <button className="target-cancel-button" onClick={handleTargetCancel}>
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  // ターゲット選択モード（国家選択）
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
    <div className="domestic-screen" data-testid="domestic-screen">
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
