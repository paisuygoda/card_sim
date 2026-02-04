import React from 'react';
import { Unit } from '@core/domain/models';

/**
 * UnitCard - ユニットカード表示コンポーネント
 * 
 * ユニットの情報を表示するカード
 */

interface UnitCardProps {
  unit: Unit | null;
  position: 'front' | 'mid' | 'back' | 'bench';
  onClick?: () => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, position, onClick }) => {
  // TODO: 実装
  // - ユニット名
  // - HP（現在/最大）
  // - 攻撃力
  // - スキル名
  // - ステート表示

  if (!unit) {
    return (
      <div className="unit-card empty" onClick={onClick}>
        <p>空</p>
      </div>
    );
  }

  return (
    <div className="unit-card" onClick={onClick}>
      <h3>{unit.name}</h3>
      <p>HP: {unit.currentHP} / {unit.maxHP}</p>
      <p>攻撃力: {unit.attack}</p>
      <p>スキル: {unit.skill.name}</p>
      {/* TODO: ステート表示 */}
    </div>
  );
};
