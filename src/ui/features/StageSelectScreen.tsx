import React from 'react';
import { STAGE_MASTER } from '@core/domain/master/StageMaster';
import { Stage } from '@core/domain/models/Stage';
import styles from './StageSelectScreen.module.css';

/**
 * StageSelectScreenProps
 */
interface StageSelectScreenProps {
  onStageSelect: (stage: Stage) => void;
}

const getDifficulty = (stageId: number): number => Math.min(stageId, 3);

/**
 * StageSelectScreen - ステージ選択画面
 *
 * StageMaster に定義されたステージ一覧を表示し、
 * プレイヤーがプレイするステージを選択できる
 */
export const StageSelectScreen = React.memo(function StageSelectScreen({
  onStageSelect,
}: StageSelectScreenProps) {
  const stages = Object.values(STAGE_MASTER).sort((a, b) => a.stageId - b.stageId);

  return (
    <div className={styles['stage-select-screen']}>
      <header className={styles['stage-select-header']}>
        <h1 className={styles['stage-select-heading']}>ステージ選択</h1>
        <p className={styles['stage-select-subtitle']}>舞台を選び、覇道を歩め</p>
      </header>
      <div className={styles['stage-list']}>
        {stages.map((stage, index) => {
          const difficulty = getDifficulty(stage.stageId);
          return (
            <div
              key={stage.stageId}
              data-testid="stage-card"
              className={styles['stage-card']}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onStageSelect(stage)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStageSelect(stage);
                }
              }}
            >
              <div className={styles['stage-card-header']}>
                <span className={styles['stage-number-badge']}>{stage.stageId}</span>
                <div className={styles['stage-difficulty']} aria-label={`難易度${difficulty}`}>
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={[styles['difficulty-star'], n <= difficulty && styles.filled].filter(Boolean).join(' ')}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div data-testid="stage-title" className={styles['stage-title']}>
                {stage.title ?? `ステージ${stage.stageId}`}
              </div>
              {stage.description && (
                <div className={styles['stage-description']}>{stage.description}</div>
              )}
              <div className={styles['stage-info']}>
                <span className={styles['stage-info-item']}>
                  <span className={styles['stage-info-icon']} aria-hidden="true">⚔</span>
                  <span>ラウンド</span>
                  <span data-testid="stage-round-limit">{stage.roundLimit}</span>
                </span>
                <span className={styles['stage-info-item']}>
                  <span className={styles['stage-info-icon']} aria-hidden="true">⛩</span>
                  <span>国家</span>
                  <span data-testid="stage-nation-count">
                    {stage.initialNations.length}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
