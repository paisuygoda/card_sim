import React from 'react';
import styles from './GenericAnimation.module.css';

/**
 * GenericAnimation - 未登録イベントタイプのフォールバック演出
 */
export const GenericAnimation: React.FC<{ eventType: string }> = ({ eventType }) => {
  return (
    <div className={styles['animation-overlay']}>
      <div className="animation generic">
        <p>{eventType}</p>
      </div>
    </div>
  );
};
