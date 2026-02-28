import React from 'react';
import { Nation, Unit } from '@core/domain/models';
import { UnitCard } from './UnitCard';

/**
 * BattleArea - 戦闘エリア表示コンポーネント
 *
 * 前衛・中衛・後衛のユニット配置を表示
 */

interface BattleAreaProps {
  nation: Nation;
  /** 現在攻撃中のユニット（ハイライト対象） */
  currentAttacker?: Unit;
  onUnitClick?: (unitIndex: number) => void;
  /** 選択可能なユニットのインデックス配列 */
  selectableUnitIndices?: number[];
  /** 現在選択中のユニットインデックス（存在する場合） */
  selectedUnitIndex?: number | null;
}

export const BattleArea: React.FC<BattleAreaProps> = ({ nation, currentAttacker, onUnitClick, selectableUnitIndices, selectedUnitIndex }) => {
  const frontUnit = nation.units[0] ?? null;
  const midUnit = nation.units[1] ?? null;
  const backUnit = nation.units[2] ?? null;
  const benchUnits = nation.units.slice(3, 8);

  /** unitId が currentAttacker と一致するかで現攻撃者判定 */
  const isCurrentAttacker = (unit: Unit | null): boolean =>
    unit !== null &&
    currentAttacker !== undefined &&
    unit.unitId === currentAttacker.unitId;

  /** 選択可能判定 */
  const isSelectable = (index: number): boolean =>
    selectableUnitIndices !== undefined &&
    selectableUnitIndices.includes(index);

  /** 選択中判定 */
  const isSelected = (index: number): boolean =>
    selectedUnitIndex !== undefined &&
    selectedUnitIndex !== null &&
    selectedUnitIndex === index;

  return (
    <div className="battle-area">
      <div className="frontline">
        <UnitCard
          unit={frontUnit}
          position="front"
          isCurrentAttacker={isCurrentAttacker(frontUnit)}
          onClick={() => onUnitClick?.(0)}
          isSelectable={isSelectable(0)}
          isSelected={isSelected(0)}
        />
        <UnitCard
          unit={midUnit}
          position="mid"
          isCurrentAttacker={isCurrentAttacker(midUnit)}
          onClick={() => onUnitClick?.(1)}
          isSelectable={isSelectable(1)}
          isSelected={isSelected(1)}
        />
        <UnitCard
          unit={backUnit}
          position="back"
          isCurrentAttacker={isCurrentAttacker(backUnit)}
          onClick={() => onUnitClick?.(2)}
          isSelectable={isSelectable(2)}
          isSelected={isSelected(2)}
        />
      </div>
      <div className="bench">
        {benchUnits.map((unit, index) => (
          <UnitCard
            key={index}
            unit={unit}
            position="bench"
            isCurrentAttacker={isCurrentAttacker(unit)}
            onClick={() => onUnitClick?.(3 + index)}
            isSelectable={isSelectable(3 + index)}
            isSelected={isSelected(3 + index)}
          />
        ))}
      </div>
    </div>
  );
};
