import { State } from '@core/domain/models';
import { getStateDescription } from '@core/domain/master';
import './StateTooltip.css';

/**
 * StateTooltip Props
 */
interface StateTooltipProps {
  /** 表示するステートデータ（nullの場合は非表示） */
  state: State | null;
  /** ツールチップの表示位置（アイコンの座標） */
  position: { x: number; y: number };
}

// 定数定義
const TOOLTIP_OFFSET = 10; // アイコンとツールチップの間隔
const ICON_HEIGHT = 32; // StateIconのサイズ
const TOOLTIP_HEIGHT = 150; // 概算値
const TOOLTIP_WIDTH = 250; // max-widthと同じ

/**
 * StateTooltip コンポーネント
 * 
 * ステートアイコンのホバー時に詳細情報を表示するツールチップ
 * 
 * @param props - StateTooltipProps
 * @returns ツールチップ要素（state が null の場合は null）
 */
export function StateTooltip({ state, position }: StateTooltipProps) {
  // 入力検証
  if (!state || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return null;
  }

  // SSR/テスト環境対応
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // 位置計算
  let top = position.y - TOOLTIP_HEIGHT - TOOLTIP_OFFSET;
  let left = position.x;

  // 画面上端チェック
  if (top < 0) {
    top = position.y + ICON_HEIGHT + TOOLTIP_OFFSET;
  }

  // 画面下端チェック（上端補正後に再確認）
  if (top + TOOLTIP_HEIGHT > windowHeight) {
    top = Math.max(0, windowHeight - TOOLTIP_HEIGHT);
  }

  // 画面左右端チェック（transform: translateX(-50%) を考慮）
  const halfWidth = TOOLTIP_WIDTH / 2;
  if (left < halfWidth) {
    left = halfWidth;
  }
  if (left > windowWidth - halfWidth) {
    left = windowWidth - halfWidth;
  }

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
    zIndex: 1000,
  };

  // 表示内容
  const description = getStateDescription(state.stateId);
  const stackText = state.stacks !== null ? `${state.stacks}` : 'なし';
  const durationText = state.duration !== null ? `${state.duration}` : '永続';

  return (
    <div
      className="state-tooltip"
      role="tooltip"
      aria-live="polite"
      style={tooltipStyle}
    >
      <div className="state-tooltip-title">{state.name}</div>
      <div className="state-tooltip-effects">{description}</div>
      <div className="state-tooltip-meta">
        <div>スタック: {stackText}</div>
        <div>残りターン: {durationText}</div>
      </div>
    </div>
  );
}
