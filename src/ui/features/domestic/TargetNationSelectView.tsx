import React from 'react';
import { BattleArea } from '@ui/components/BattleArea';
import { Nation } from '@core/domain/models';

interface TargetNationSelectViewProps {
  currentNation: Nation;
  enemyNations: Nation[];
  onTargetSelect: (nation: Nation) => void;
  onCancel: () => void;
}

/**
 * TargetNationSelectView - 敵国選択画面
 * 
 * 攻撃対象の敵国を選択するUI。
 * ENEMY_NATION / ALL_ENEMY_NATIONS / ENEMY_UNIT コマンド選択後に表示される。
 */
export const TargetNationSelectView: React.FC<TargetNationSelectViewProps> = ({
  currentNation,
  enemyNations,
  onTargetSelect,
  onCancel,
}) => {
  return (
    <>
      <BattleArea nation={currentNation} />
      <div className="target-select-panel">
        <h3>攻撃対象を選択してください</h3>
        <div className="target-select-buttons">
          {enemyNations.map((nation) => (
            <button
              key={nation.nationId}
              className="target-select-button"
              onClick={() => onTargetSelect(nation)}
            >
              {nation.name}
            </button>
          ))}
        </div>
        <button className="target-cancel-button" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </>
  );
};
