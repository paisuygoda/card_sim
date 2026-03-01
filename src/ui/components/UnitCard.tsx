import React from 'react';
import { Unit } from '@core/domain/models';
import { MasterData } from '@core/domain/master';
import { StateIconList } from './StateIconList';
import styles from './UnitCard.module.css';

/**
 * UnitCard - ユニットカード表示コンポーネント
 *
 * ユニットの情報を表示するカード
 */

interface UnitCardProps {
  unit: Unit | null;
  position: 'front' | 'mid' | 'back' | 'bench' | 'graveyard';
  /** true のとき data-testid="current-attacker" を付与してハイライト */
  isCurrentAttacker?: boolean;
  onClick?: () => void;
  /** このユニットが選択可能かどうか */
  isSelectable?: boolean;
  /** このユニットが現在選択中かどうか */
  isSelected?: boolean;
  /** 墓地ユニットかどうか */
  isGraveyard?: boolean;
}

/** ポジションを日本語ラベルに変換 */
const POSITION_LABEL: Record<UnitCardProps['position'], string> = {
  front: '前衛',
  mid: '中衛',
  back: '後衛',
  bench: 'ベンチ',
  graveyard: '墓地',
};

/** カードUIに表示可能な状態アイコンの最大数 */
const MAX_DISPLAYED_STATES = 5;

/** HPの割合に応じた背景色を返す */
function getHpColor(ratio: number): string {
  if (ratio > 66) return 'green';
  if (ratio >= 33) return 'yellow';
  return 'red';
}

export const UnitCard: React.FC<UnitCardProps> = React.memo(({ unit, position, isCurrentAttacker = false, onClick, isSelectable = false, isSelected = false, isGraveyard = false }) => {
  // クリックハンドラ: isSelectable が false の場合は onClick を呼び出さない
  const handleClick = () => {
    if (isSelectable && onClick) {
      onClick();
    }
  };

  // キーボードハンドラ: Enter または Space キーで onClick を発火
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSelectable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  if (!unit) {
    return (
      <div
        className={[styles['unit-card'], styles.empty, isSelectable && styles.selectable, isGraveyard && styles['graveyard-unit']].filter(Boolean).join(' ')}
        data-unit-position={position}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && isSelectable ? 0 : undefined}
        aria-disabled={onClick ? !isSelectable : undefined}
      >
        <p>空</p>
      </div>
    );
  }

  // スキル名取得（無効IDでもクラッシュしない）
  let skillName = '不明なスキル';
  try {
    skillName = MasterData.getSkill(unit.skillId).name;
  } catch {
    skillName = `スキル(${unit.skillId})`;
  }

  // HPバー計算（maxHP=0 の場合は 0% として扱う）
  const hpRatio =
    unit.maxHP === 0
      ? 0
      : Math.min(Math.max((unit.currentHP / unit.maxHP) * 100, 0), 100);

  // currentHP が 0 以下（負値含む）を戦闘不能として扱う
  const isDefeated = unit.currentHP <= 0;

  return (
    <div
      className={[styles['unit-card'], isDefeated && styles.disabled, isCurrentAttacker && styles['current-attacker'], isSelectable && styles.selectable, isSelected && styles.selected, isGraveyard && styles['graveyard-unit']].filter(Boolean).join(' ')}
      data-testid={isCurrentAttacker ? 'current-attacker' : undefined}
      data-unitid={unit.unitId}
      data-unit-position={position}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-disabled={onClick ? !isSelectable : undefined}
    >
      {isSelected && <span className={styles['selected-mark']}>✓</span>}
      <h3>{unit.name}</h3>
      <p>{POSITION_LABEL[position]}</p>
      <p>HP: {unit.currentHP} / {unit.maxHP}</p>
      {/* HPバー */}
      <div
        className="hp-bar"
        role="progressbar"
        aria-valuenow={unit.currentHP}
        aria-valuemin={0}
        aria-valuemax={unit.maxHP}
        aria-label={`HP: ${unit.currentHP} / ${unit.maxHP}`}
      >
        <div
          className={styles['hp-bar-fill']}
          data-testid="hp-bar-fill"
          style={{
            width: `${hpRatio}%`,
            backgroundColor: getHpColor(hpRatio),
          }}
        />
      </div>
      {isDefeated && <p>戦闘不能</p>}
      <p>攻撃力: {unit.attack}</p>
      <p>スキル: <span>{skillName}</span></p>
      <StateIconList states={unit.states} maxDisplay={MAX_DISPLAYED_STATES} />
    </div>
  );
});

UnitCard.displayName = 'UnitCard';
