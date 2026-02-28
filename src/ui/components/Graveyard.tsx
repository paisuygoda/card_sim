import React from 'react';
import { Unit } from '@core/domain/models';
import { UnitCard } from './UnitCard';
import './Graveyard.css';

/**
 * Graveyard - 墓地表示コンポーネント
 *
 * 死亡したユニットを墓地として表示する
 */

interface GraveyardProps {
  /** 墓地ユニット配列 */
  graveyard: Unit[];
  /** 国家名（ラベル表示用） */
  nationName: string;
}

export const Graveyard: React.FC<GraveyardProps> = React.memo(({ 
  graveyard = [],  // デフォルト引数で [] を設定（null/undefined対策）
  nationName 
}) => {
  return (
    <div className="graveyard" data-testid="graveyard-container">
      <div className="graveyard-header">
        <h3 data-testid="graveyard-title">
          {nationName ? `${nationName}の墓地` : '墓地'}
        </h3>
        <span data-testid="graveyard-count" className="graveyard-count">
          ({graveyard.length})
        </span>
      </div>

      <div data-testid="graveyard-units" className="graveyard-units">
        {graveyard.length === 0 ? (
          <p data-testid="graveyard-empty-message" className="graveyard-empty">
            墓地は空です
          </p>
        ) : (
          graveyard.map((unit) => (
            <UnitCard
              key={unit.unitId}
              unit={unit}
              position="graveyard"
              isGraveyard={true}
            />
          ))
        )}
      </div>
    </div>
  );
});

Graveyard.displayName = 'Graveyard';
