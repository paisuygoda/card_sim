import React, { useState, useEffect } from 'react';
import { State } from '@core/domain/models';
import { GameEvent } from '@core/infrastructure/IGameUIBridge';
import { useUIStateStore } from '@store/useUIStateStore';
import { StateIcon } from './StateIcon';
import { StateTooltip } from './StateTooltip';
import './StateIconList.css';

export interface StateIconListProps {
  /** 表示するステート配列 */
  states: State[];
  /** 最大表示数（省略時は全件表示） */
  maxDisplay?: number;
  /** ホバー時のコールバック */
  onStateHover?: (state: State | null) => void;
}

/**
 * StateIconList コンポーネント
 * 
 * ステート配列を受け取り、StateIconとStateTooltipを組み合わせてリスト表示する
 * 
 * @param props - StateIconListProps
 * @returns ステートアイコンリスト（statesが空の場合はnull）
 */
export const StateIconList: React.FC<StateIconListProps> = ({
  states,
  maxDisplay,
  onStateHover,
}) => {
  const [hoveredState, setHoveredState] = useState<State | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [removingStateIds, setRemovingStateIds] = useState<Set<string>>(new Set());
  
  // AnimationQueueを購読し、STATE_REMOVEイベントを検知
  const currentAnimation = useUIStateStore((state) => state.currentAnimation);

  useEffect(() => {
    if (currentAnimation?.eventType === GameEvent.STATE_REMOVE) {
      const data = currentAnimation.data as { stateId: string };
      const stateId = data.stateId;
      
      // removingStateIdsに追加
      setRemovingStateIds((prev) => new Set(prev).add(stateId));
      
      // 800ms後に削除
      const timer = setTimeout(() => {
        setRemovingStateIds((prev) => {
          const next = new Set(prev);
          next.delete(stateId);
          return next;
        });
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [currentAnimation]);

  // 空配列の場合は何も表示しない
  if (states.length === 0) {
    return null;
  }

  // 表示するステートを決定
  const displayStates = maxDisplay !== undefined 
    ? states.slice(0, maxDisplay) 
    : states;
  const overflowCount = maxDisplay !== undefined 
    ? Math.max(0, states.length - maxDisplay) 
    : 0;

  // ホバーハンドラ
  const handleStateHover = (stateId: string | null, event?: React.MouseEvent) => {
    if (stateId === null) {
      setHoveredState(null);
      onStateHover?.(null);
      return;
    }

    const state = states.find(s => s.stateId === stateId);
    if (state && event) {
      setHoveredState(state);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      onStateHover?.(state);
    }
  };

  return (
    <>
      <div className="state-icon-list" role="list">
        {displayStates.map((state) => (
          <div 
            key={state.stateId} 
            role="listitem"
            onMouseEnter={(e) => handleStateHover(state.stateId, e)}
            onMouseLeave={() => handleStateHover(null)}
          >
            <StateIcon
              state={state}
              removing={removingStateIds.has(state.stateId)}
              onHover={(stateId) => {
                // StateIconからのホバーイベントは座標情報がないため、
                // ラッパーdivのイベントで処理
              }}
            />
          </div>
        ))}

        {overflowCount > 0 && (
          <div
            className="state-icon-overflow"
            aria-label={`残り${overflowCount}件のステート`}
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {hoveredState && (
        <StateTooltip state={hoveredState} position={tooltipPosition} />
      )}
    </>
  );
};
