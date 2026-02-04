import React from 'react';
import { Nation } from '@core/domain/models';
import { UnitCard } from './UnitCard';

/**
 * BattleArea - 戦闘エリア表示コンポーネント
 * 
 * 前衛・中衛・後衛のユニット配置を表示
 */

interface BattleAreaProps {
  nation: Nation;
  onUnitClick?: (unitIndex: number) => void;
}

export const BattleArea: React.FC<BattleAreaProps> = ({ nation, onUnitClick }) => {
  // TODO: 実装
  // - 前衛（インデックス0）
  // - 中衛（インデックス1）
  // - 後衛（インデックス2）
  // - ベンチ（インデックス3～7）を別エリアに表示

  const frontUnit = nation.units[0];
  const midUnit = nation.units[1];
  const backUnit = nation.units[2];
  const benchUnits = nation.units.slice(3, 8);

  return (
    <div className="battle-area">
      <div className="frontline">
        <UnitCard
          unit={frontUnit}
          position="front"
          onClick={() => onUnitClick?.(0)}
        />
        <UnitCard
          unit={midUnit}
          position="mid"
          onClick={() => onUnitClick?.(1)}
        />
        <UnitCard
          unit={backUnit}
          position="back"
          onClick={() => onUnitClick?.(2)}
        />
      </div>
      <div className="bench">
        {benchUnits.map((unit, index) => (
          <UnitCard
            key={index}
            unit={unit}
            position="bench"
            onClick={() => onUnitClick?.(3 + index)}
          />
        ))}
      </div>
    </div>
  );
};
