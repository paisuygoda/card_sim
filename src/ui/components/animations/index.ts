import React from 'react';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';
import { DamageAnimation } from './DamageAnimation';
import { HealAnimation } from './HealAnimation';
import { SkillActivateAnimation } from './SkillActivateAnimation';
import { DestroyAnimation } from './DestroyAnimation';
import { PowerChangeAnimation } from './PowerChangeAnimation';
import { PhaseTransitAnimation } from './PhaseTransitAnimation';
import { StateChangeAnimation } from './StateChangeAnimation';
import { CommandAnimation } from './CommandAnimation';
import { GenericAnimation } from './GenericAnimation';

/**
 * アニメーションレジストリ
 *
 * GameEvent → 描画コンポーネントのマッピング。
 * eventType に応じた描画コンポーネントを返す関数を定義する。
 *
 * POWER_DAMAGE/POWER_HEAL と STATE_ADD/STATE_REMOVE は
 * 同一コンポーネントで eventType を渡す必要があるため、
 * ラッパー関数として登録する。
 */
export const ANIMATION_REGISTRY: Record<
  string,
  React.FC<AnimationRendererProps & { eventType: GameEvent }>
> = {
  [GameEvent.UNIT_DAMAGE]: DamageAnimation,
  [GameEvent.UNIT_HEAL]: HealAnimation,
  [GameEvent.SKILL_ACTIVATE]: SkillActivateAnimation,
  [GameEvent.UNIT_DESTROY]: DestroyAnimation,
  [GameEvent.POWER_DAMAGE]: PowerChangeAnimation,
  [GameEvent.POWER_HEAL]: PowerChangeAnimation,
  [GameEvent.PHASE_TRANSIT]: PhaseTransitAnimation,
  [GameEvent.STATE_ADD]: StateChangeAnimation,
  [GameEvent.STATE_REMOVE]: StateChangeAnimation,
  [GameEvent.COMMAND_EXECUTE]: CommandAnimation,
};

/**
 * イベントタイプに対応するアニメーションコンポーネントを取得
 *
 * 登録されていないイベントタイプの場合は GenericAnimation を返す。
 */
export function getAnimationRenderer(
  eventType: GameEvent
): React.FC<AnimationRendererProps & { eventType: GameEvent }> {
  return ANIMATION_REGISTRY[eventType] ?? GenericAnimation;
}

// 型・ヘルパーの再エクスポート
export type { AnimationRendererProps } from './types';
export {
  getPhaseDisplayName,
  getStateAnimationProps,
  getUnitName,
  isValidVisualType,
} from './helpers';

// 個別コンポーネントの再エクスポート
export { DamageAnimation } from './DamageAnimation';
export { HealAnimation } from './HealAnimation';
export { SkillActivateAnimation } from './SkillActivateAnimation';
export { DestroyAnimation } from './DestroyAnimation';
export { PowerChangeAnimation } from './PowerChangeAnimation';
export { PhaseTransitAnimation } from './PhaseTransitAnimation';
export { StateChangeAnimation } from './StateChangeAnimation';
export { CommandAnimation } from './CommandAnimation';
export { GenericAnimation } from './GenericAnimation';
