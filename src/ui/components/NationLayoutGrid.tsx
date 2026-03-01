import React from 'react';
import { NationPanel } from './NationPanel';
import { BattleArea } from './BattleArea';
import { Graveyard } from './Graveyard';
import type { Nation } from '@core/domain/models';
import type { Unit } from '@core/domain/models';

/**
 * 国家ごとのレイアウト情報
 */
export interface NationEntry {
  /** 表示する国家 */
  nation: Nation;
  /** 表示ラベル（例: '攻撃側', '防御側', nation.name）*/
  label: string;
  /** data-testid 属性値（省略時は `nation-section-${nation.nationId}`）*/
  testId?: string;
  /** ラッパー div の追加 className */
  divClassName?: string;
  /** NationPanel の isCurrentTurn に渡す値（省略時 false）*/
  isCurrentTurn?: boolean;
}

export interface NationLayoutGridProps {
  /** 表示する国家エントリーの配列 */
  nations: NationEntry[];
  /** パワー勝利条件（null の場合は非表示）*/
  powerWinThreshold: number | null;
  /** 現在攻撃中のユニット（BattleArea へ渡す）*/
  currentAttacker?: Unit;
  /** 墓地を表示するか（省略時 false）*/
  showGraveyard?: boolean;
  /** ラッパー div の className */
  layoutClassName?: string;
}

/**
 * NationLayoutGrid - 国家パネルの共通グリッドレイアウト
 *
 * BattleScreen・ActionScreen で共通使用される国家 + ユニット表示エリア。
 */
export const NationLayoutGrid: React.FC<NationLayoutGridProps> = ({
  nations,
  powerWinThreshold,
  currentAttacker,
  showGraveyard = false,
  layoutClassName,
}) => {
  return (
    <div className={layoutClassName} data-testid="nation-layout-grid">
      {nations.map(({ nation, label, testId, divClassName, isCurrentTurn }) => (
        <div
          key={nation.nationId}
          className={divClassName}
          data-testid={testId ?? `nation-section-${nation.nationId}`}
        >
          <h3>{label}</h3>
          <NationPanel
            nation={nation}
            isCurrentTurn={isCurrentTurn ?? false}
            powerWinThreshold={powerWinThreshold}
          />
          <BattleArea
            nation={nation}
            currentAttacker={currentAttacker}
          />
          {showGraveyard && (
            <Graveyard graveyard={nation.graveyard} nationName={nation.name} />
          )}
        </div>
      ))}
    </div>
  );
};
