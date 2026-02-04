import React from 'react';
import { useGameStateStore } from '@store/useGameStateStore';
import { BattleArea } from '@ui/components/BattleArea';

/**
 * BattleScreen - 戦闘画面
 * 
 * 戦闘フェーズでの演出を表示
 * 攻撃側・防御側のユニット配置、攻撃演出など
 */

export const BattleScreen: React.FC = () => {
  const gameState = useGameStateStore((state) => state.gameState);

  // TODO: 実装
  // - 攻撃側国家の表示
  // - 防御側国家の表示
  // - 攻撃演出
  // - ダメージ表示

  if (!gameState) {
    return null;
  }

  // 戦闘コンテキストがあれば取得（実装時に追加）
  // const battleContext = ...;

  return (
    <div className="battle-screen">
      <h2>戦闘フェーズ</h2>
      <div className="battle-layout">
        <div className="attacker-side">
          <h3>攻撃側</h3>
          {/* TODO: 攻撃側国家のBattleAreaを表示 */}
        </div>
        <div className="defender-side">
          <h3>防御側</h3>
          {/* TODO: 防御側国家のBattleAreaを表示 */}
        </div>
      </div>
    </div>
  );
};
