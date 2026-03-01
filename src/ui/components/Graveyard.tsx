import React, { useState } from 'react';
import { Unit } from '@core/domain/models';
import { UnitCard } from './UnitCard';
import styles from './Graveyard.module.css';

/**
 * Graveyard - 墓地表示コンポーネント
 *
 * 死亡したユニットを墓地として表示する。
 * ヘッダーをクリックすることでアコーディオン形式に開閉できる。
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
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.graveyard} data-testid="graveyard-container">
      <div
        className={styles['graveyard-header']}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        aria-expanded={isOpen}
        data-testid="graveyard-toggle"
      >
        <h3 data-testid="graveyard-title">
          {nationName ? `${nationName}の墓地` : '墓地'}
        </h3>
        <span data-testid="graveyard-count" className={styles['graveyard-count']}>
          ({graveyard.length})
        </span>
        <span className={styles['graveyard-toggle-icon']} aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div data-testid="graveyard-units" className={styles['graveyard-units']}>
          {graveyard.length === 0 ? (
            <p data-testid="graveyard-empty-message" className={styles['graveyard-empty']}>
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
      )}
    </div>
  );
});

Graveyard.displayName = 'Graveyard';
