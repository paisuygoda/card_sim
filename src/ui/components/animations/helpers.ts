import { GameState } from '@core/domain/models';
import { getPhaseDisplayName } from '../../utils';
import { StateEventData } from '@core/infrastructure/IGameUIBridge';
import styles from './StateChangeAnimation.module.css';

/**
 * アニメーション表示用ヘルパー関数群
 *
 * AnimationDisplay から分離し、各アニメーションコンポーネントでも再利用可能にする。
 */

/** 許可されるvisualType値 */
const VALID_VISUAL_TYPES = ['BUFF', 'DEBUFF', 'NONE'] as const;

/**
 * visualTypeが有効な値かチェック
 */
export function isValidVisualType(visualType: string | undefined): boolean {
  if (!visualType) return false;
  const normalized = visualType.toUpperCase();
  return VALID_VISUAL_TYPES.includes(normalized as any);
}

/**
 * ステートイベント共通のアニメーションプロパティを取得
 */
export function getStateAnimationProps(
  data: StateEventData,
  eventType: 'add' | 'remove',
  gameState: GameState | null
): { className: string; targetName: string } | null {
  if (!data.stateId || !data.stateId.trim()) return null;

  const baseClass = styles[`animation-state-${eventType}`] ?? `animation-state-${eventType}`;
  const visualTypeClass =
    data.visualType &&
    data.visualType !== 'NONE' &&
    isValidVisualType(data.visualType)
      ? styles[`animation-state-${eventType}--${data.visualType.toLowerCase()}`] ?? ''
      : '';
  const className = [baseClass, visualTypeClass].filter(Boolean).join(' ');

  let targetName = '';
  if (data.targetUnitId && gameState) {
    targetName = getUnitName(gameState, data.targetUnitId);
  } else if (data.targetNationId && gameState) {
    const nation = gameState.nations.find(
      (n) => n.nationId === data.targetNationId
    );
    targetName = nation?.name ?? '';
  }

  return { className, targetName };
}

export { getPhaseDisplayName };

/**
 * ユニットIDから名前を取得するヘルパー関数
 */
export function getUnitName(
  gameState: GameState | null,
  unitId: string,
  includeGraveyard = false
): string {
  if (!gameState) return '';

  const allUnits = includeGraveyard
    ? gameState.nations.flatMap((n) => [...n.units, ...n.graveyard])
    : gameState.nations.flatMap((n) => n.units);

  return allUnits.find((u) => u?.unitId === unitId)?.name ?? '';
}
