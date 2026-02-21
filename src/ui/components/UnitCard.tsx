import React from 'react';
import { Unit } from '@core/domain/models';
import { MasterData } from '@core/domain/master';

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

/** ポジションを日本語ラベルに変換 */
const POSITION_LABEL: Record<UnitCardProps['position'], string> = {
  front: '前衛',
  mid: '中衛',
  back: '後衛',
  bench: 'ベンチ',
};

/** HPの割合に応じた背景色を返す */
function getHpColor(ratio: number): string {
  if (ratio > 66) return 'green';
  if (ratio >= 33) return 'yellow';
  return 'red';
}

export const UnitCard: React.FC<UnitCardProps> = React.memo(({ unit, position, onClick }) => {
  if (!unit) {
    return (
      <div
        className="unit-card empty"
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
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
      className={`unit-card${isDefeated ? ' disabled' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
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
          className="hp-bar-fill"
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
      {/* TODO: ステート表示 */}
    </div>
  );
});

UnitCard.displayName = 'UnitCard';
