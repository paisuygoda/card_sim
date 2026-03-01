import React from 'react';
import { BattleArea } from '@ui/components/BattleArea';
import { Nation } from '@core/domain/models';

interface TargetUnitSelectViewProps {
  targetNation: Nation;
  message: string;
  onUnitSelect: (unitIndex: number) => void;
  onCancel: () => void;
}

/**
 * TargetUnitSelectView - ユニット選択画面
 * 
 * 自国ユニットまたは敵国ユニットの選択UI。
 * SELF_UNIT コマンドでは自国の、ENEMY_UNIT コマンドでは敵国のユニットを表示する。
 */
export const TargetUnitSelectView: React.FC<TargetUnitSelectViewProps> = ({
  targetNation,
  message,
  onUnitSelect,
  onCancel,
}) => {
  return (
    <div className="unit-select-panel">
      <h3>{message}</h3>
      <BattleArea nation={targetNation} onUnitClick={onUnitSelect} />
      <button className="target-cancel-button" onClick={onCancel}>
        キャンセル
      </button>
    </div>
  );
};
