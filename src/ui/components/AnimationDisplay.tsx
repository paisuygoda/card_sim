import React, { useEffect, useState } from 'react';
import { useAnimation } from '@ui/hooks/useAnimation';
import { useUIStateStore } from '@store/useUIStateStore';
import { useGameStateStore } from '@store/useGameStateStore';
import {
  GameEvent,
  UnitHPEventData,
  SkillActivateData,
  PowerEventData,
  PhaseTransitData,
  StateEventData,
  CommandExecuteData,
  GameEventDataMap,
} from '@core/infrastructure/IGameUIBridge';
import { GamePhase, SkillVisualType, GameState } from '@core/domain/models';

/**
 * AnimationDisplay - アニメーション表示コンポーネント
 *
 * ゲーム内の各種アニメーションを表示
 * 演出完了後にストアに通知
 */

/** イベント種別ごとのアニメーション持続時間（ms） */
export const ANIMATION_DURATION: Partial<Record<GameEvent, number>> = {
  [GameEvent.UNIT_DAMAGE]:    800,
  [GameEvent.SKILL_ACTIVATE]: 1200,
  [GameEvent.UNIT_DESTROY]:   1000,
  [GameEvent.POWER_DAMAGE]:   1000,
  [GameEvent.POWER_HEAL]:     1000,
  [GameEvent.PHASE_TRANSIT]:  1500,
  [GameEvent.STATE_REMOVE]:   1000,
  [GameEvent.COMMAND_EXECUTE]: 1000,
};

/** デフォルトアニメーション持続時間（ms） */
const DEFAULT_ANIMATION_DURATION = 500;

/** 許可されるvisualType値 */
const VALID_VISUAL_TYPES = ['BUFF', 'DEBUFF', 'NONE'] as const;

/**
 * visualTypeが有効な値かチェック
 * @param visualType - チェック対象の値
 * @returns 有効な値の場合true
 */
function isValidVisualType(visualType: string | undefined): boolean {
  if (!visualType) return false;
  const normalized = visualType.toUpperCase();
  return VALID_VISUAL_TYPES.includes(normalized as any);
}

/**
 * ステートイベント共通のアニメーションプロパティを取得
 * @param data - ステートイベントデータ
 * @param eventType - 'add' または 'remove'
 * @param gameState - ゲーム状態
 * @returns クラス名とターゲット名
 */
function getStateAnimationProps(
  data: StateEventData,
  eventType: 'add' | 'remove',
  gameState: GameState | null
): { className: string; targetName: string } | null {
  // stateIdのバリデーション（空白のみの文字列を除外）
  if (!data.stateId || !data.stateId.trim()) return null;

  // visualTypeに応じたCSSクラスを生成
  const visualTypeClass =
    data.visualType &&
    data.visualType !== 'NONE' &&
    isValidVisualType(data.visualType)
      ? `animation-state-${eventType}--${data.visualType.toLowerCase()}`
      : '';
  const className = `animation-state-${eventType} ${visualTypeClass}`.trim();

  // ターゲット名を取得（ユニットまたは国家）
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

/**
 * GamePhaseを日本語表示名に変換
 * @param phase - GamePhase列挙型の値または特殊文字列
 * @returns 日本語フェーズ名
 */
function getPhaseDisplayName(phase: GamePhase | 'EARLY_VICTORY' | string): string {
  const phaseMap: Record<string, string> = {
    // ゲーム進行フェーズ
    [GamePhase.GAME_START]: 'ゲーム開始',
    [GamePhase.ROUND_START]: 'ラウンド開始',
    [GamePhase.TURN_START]: 'ターン開始',
    [GamePhase.DOMESTIC]: '内政フェーズ',
    [GamePhase.ACTION_DECISION]: '行動判断',
    [GamePhase.BATTLE_START]: '戦闘開始',
    [GamePhase.ATTACK_START]: '攻撃開始',
    [GamePhase.BEFORE_ATTACK]: '攻撃直前',
    [GamePhase.AFTER_ATTACK]: '攻撃直後',
    [GamePhase.ATTACK_END]: '攻撃終了',
    [GamePhase.BATTLE_END]: '戦闘終了',
    [GamePhase.ACTION]: '行動フェーズ',
    [GamePhase.TURN_END]: 'ターン終了',
    [GamePhase.ROUND_END]: 'ラウンド終了',
    [GamePhase.GAME_END]: 'ゲーム終了',
    // 常時フェーズ（演出では通常使用しないが念のため定義）
    [GamePhase.ALWAYS]: '常時',
    [GamePhase.SCOUT_CALCULATION]: '軍事力計算',
    [GamePhase.BATTLE_CALCULATION]: '戦闘計算',
    // 特殊条件
    'EARLY_VICTORY': '早期勝利',
  };
  return phaseMap[phase] || phase;
}

/**
 * ユニットIDから名前を取得するヘルパー関数（パフォーマンス最適化）
 * @param gameState - ゲーム状態
 * @param unitId - ユニットID
 * @param includeGraveyard - 墓地も検索するか（デフォルト: false）
 * @returns ユニット名（見つからない場合は空文字列）
 */
function getUnitName(
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

export const AnimationDisplay: React.FC = () => {
  const { animation, isAnimating, onAnimationComplete } = useAnimation();
  const animationQueue = useUIStateStore((state) => state.animationQueue);
  const dequeueAnimation = useUIStateStore((state) => state.dequeueAnimation);
  const gameState = useGameStateStore((state) => state.gameState);

  // レンダリングエラー時にonAnimationCompleteを呼ぶためのフラグ
  const [hasRenderError, setHasRenderError] = useState(false);

  // レンダリングエラー発生時にonAnimationCompleteを呼び出してデッドロックを防ぐ
  useEffect(() => {
    if (hasRenderError && isAnimating) {
      onAnimationComplete();
      setHasRenderError(false);
    }
  }, [hasRenderError, isAnimating, onAnimationComplete]);

  // キューにアニメーションがあり、再生中でない場合は自動でdequeue
  // （ReactUIBridge.waitUI() のデッドロックを防ぐ）
  useEffect(() => {
    if (animationQueue.length > 0 && !isAnimating) {
      dequeueAnimation();
    }
  }, [animationQueue, isAnimating, dequeueAnimation]);

  // isAnimatingがtrueになった時、イベント種別ごとの持続時間後にonAnimationCompleteを自動呼び出し
  // animationを依存配列に含めることで同じアニメーションで二重実行しない
  useEffect(() => {
    if (!isAnimating || !animation) return;

    const duration = ANIMATION_DURATION[animation.eventType] ?? DEFAULT_ANIMATION_DURATION;
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [animation, isAnimating, onAnimationComplete]);

  if (!isAnimating || !animation) {
    return null;
  }

  try {
    switch (animation.eventType) {
      // COMMAND_EXECUTE: コマンド実行演出
      case GameEvent.COMMAND_EXECUTE: {
        if (!animation.data) return null;
        const data = animation.data as CommandExecuteData;
        
        // commandNameは必須（空白文字列もNG）
        if (!data.commandName || !data.commandName.trim()) return null;
        
        // visualTypeに応じたCSSクラスを生成（空文字列はundefined扱い）
        const visualTypeClass = (data.commandVisualType && data.commandVisualType !== '')
          ? `animation-command-execute--${data.commandVisualType.toLowerCase()}`
          : '';
        const className = `animation-command-execute ${visualTypeClass}`.trim();
        
        return (
          <div 
            className={className}
            data-testid="command-execute-display"
            data-visual-type={data.commandVisualType || undefined}
          >
            <span className="command-label">COMMAND</span>
            <span className="command-name" data-testid="command-name">
              {data.commandName}
            </span>
            {data.commandTarget && (
              <span className="command-target" data-testid="command-target">
                対象: {data.commandTarget}
              </span>
            )}
          </div>
        );
      }

      // UNIT_DAMAGE: ダメージフロートアップ（animation-overlay ラッパーなし）
      case GameEvent.UNIT_DAMAGE: {
        if (!animation.data) return null;
        const data = animation.data as UnitHPEventData;
        if (typeof data.amount !== 'number') return null;
        const targetName = getUnitName(gameState, data.targetUnitId);
        
        // visualTypeに応じたCSSクラスを生成
        const visualTypeClass = (data.visualType && data.visualType !== '')
          ? `animation-damage--${data.visualType.toLowerCase()}`
          : '';
        const className = `animation-damage ${visualTypeClass}`.trim();
        
        return (
          <div 
            className={className} 
            data-testid="damage-display"
            data-visual-type={data.visualType ?? undefined}
          >
            {targetName && (
              <span className="damage-target" data-testid="damage-target-name">
                {targetName}
              </span>
            )}
            <span className="damage-amount" data-testid="damage-amount">
              −{data.amount}
            </span>
          </div>
        );
      }

      // UNIT_HEAL: 回復演出（animation-overlay ラッパーなし）
      case GameEvent.UNIT_HEAL: {
        if (!animation.data) return null;
        const data = animation.data as UnitHPEventData;
        if (typeof data.amount !== 'number') return null;
        const targetName = getUnitName(gameState, data.targetUnitId);
        
        // visualTypeに応じたCSSクラスを生成
        const visualTypeClass = (data.visualType && data.visualType !== '')
          ? `animation-heal--${data.visualType.toLowerCase()}`
          : '';
        const className = `animation-heal ${visualTypeClass}`.trim();
        
        return (
          <div 
            className={className} 
            data-testid="heal-display"
            data-visual-type={data.visualType ?? undefined}
          >
            {targetName && (
              <span className="heal-target" data-testid="heal-target-name">
                {targetName}
              </span>
            )}
            <span className="heal-amount" data-testid="heal-amount">
              +{data.amount}
            </span>
          </div>
        );
      }

      // SKILL_ACTIVATE: スキル発動演出（animation-overlay ラッパーなし）
      case GameEvent.SKILL_ACTIVATE: {
        if (!animation.data) return null;
        const data = animation.data as SkillActivateData;
        if (!data.skillName || !data.attackerId) return null;
        const attackerName = getUnitName(gameState, data.attackerId);
        const visualTypeClass = data.skillVisualType
          ? `animation-skill-${data.skillVisualType.toLowerCase()}`
          : '';
        return (
          <div 
            className={`animation-skill ${visualTypeClass}`}
            data-testid="skill-display"
            data-visual-type={data.skillVisualType ?? 'default'}
          >
            <span className="skill-label">SKILL ACTIVATE</span>
            <span className="skill-name" data-testid="skill-name">
              {data.skillName}
            </span>
            {attackerName && (
              <span className="skill-attacker" data-testid="skill-attacker">
                {attackerName}
              </span>
            )}
          </div>
        );
      }

      // UNIT_DESTROY: 死亡演出（animation-overlay ラッパーなし）
      // TODO: Task 2-2-5 - unitHPEffects.ts での UNIT_DESTROY イベント発火が実装されるまでデッドコード
      case GameEvent.UNIT_DESTROY: {
        if (!animation.data) return null;
        const data = animation.data as GameEventDataMap[GameEvent.UNIT_DESTROY];
        const destroyedName = getUnitName(gameState, data.unitId, true) || data.unitId || '';
        return (
          <div className="animation-destroy" data-testid="unit-destroy-display">
            <span className="destroy-name" data-testid="destroy-unit-name">
              {destroyedName}
            </span>
            <span className="destroy-label">撃破</span>
          </div>
        );
      }

      // POWER_DAMAGE / POWER_HEAL: 国力変動（animation-overlay ラッパーあり）
      case GameEvent.POWER_DAMAGE:
      case GameEvent.POWER_HEAL: {
        if (!animation.data) return null;
        const data = animation.data as PowerEventData;
        if (typeof data.amount !== 'number') return null;
        
        // キューに残っている国力変動イベントを確認（最適化）
        const pendingPowerEvents = animationQueue.filter(
          (anim) => anim.eventType === GameEvent.POWER_DAMAGE || anim.eventType === GameEvent.POWER_HEAL
        );
        
        // 3つ以上の国力変動が同時に発生している場合は要約表示
        if (pendingPowerEvents.length >= 2) {
          const totalEvents = pendingPowerEvents.length + 1; // 現在のアニメーション + キュー内
          return (
            <div className="animation-overlay">
              <div className="power-float summary">
                <span className="amount" data-testid="power-summary">
                  {totalEvents}国が同時に国力変動
                </span>
              </div>
            </div>
          );
        }
        
        // 通常表示（単一または2つまで）
        const nationName = gameState?.nations
          .find((n) => n.nationId === data.nationId)
          ?.name ?? '';
        const isDamage = animation.eventType === GameEvent.POWER_DAMAGE;
        
        return (
          <div className="animation-overlay">
            <div className={`power-float ${isDamage ? 'damage' : 'heal'}`}>
              {nationName && (
                <span className="nation-name" data-testid="power-nation-name">
                  {nationName}
                </span>
              )}
              <span className="amount" data-testid="power-amount">
                {isDamage ? '−' : '+'}{data.amount} 国力
              </span>
            </div>
          </div>
        );
      }

      // PHASE_TRANSIT: フェーズ遷移演出（animation-overlay ラッパーなし）
      case GameEvent.PHASE_TRANSIT: {
        if (!animation.data) return null;
        const data = animation.data as PhaseTransitData;
        if (!data.phase) return null;
        const displayName = getPhaseDisplayName(data.phase);
        
        return (
          <div className="phase-transit-overlay" data-testid="phase-transit-display">
            <span className="phase-name" data-testid="phase-name">
              {displayName}
            </span>
          </div>
        );
      }

      // STATE_ADD: ステート付与演出
      case GameEvent.STATE_ADD: {
        if (!animation.data) return null;
        const data = animation.data as StateEventData;
        const props = getStateAnimationProps(data, 'add', gameState);
        if (!props) return null;

        return (
          <div
            className={props.className}
            data-testid="state-add-display"
            data-visual-type={data.visualType || undefined}
          >
            <span className="state-label">STATE_ADD</span>
            <span className="state-name" data-testid="state-name">
              {data.stateId}
            </span>
            {props.targetName && (
              <span className="state-target" data-testid="state-target-name">
                {props.targetName}
              </span>
            )}
          </div>
        );
      }

      // STATE_REMOVE: ステート削除演出
      case GameEvent.STATE_REMOVE: {
        if (!animation.data) return null;
        const data = animation.data as StateEventData;
        const props = getStateAnimationProps(data, 'remove', gameState);
        if (!props) return null;

        return (
          <div
            className={props.className}
            data-testid="state-remove-display"
            data-visual-type={data.visualType || undefined}
          >
            <span className="state-label">STATE_REMOVE</span>
            <span className="state-name" data-testid="state-name">
              {data.stateId}
            </span>
            {props.targetName && (
              <span className="state-target" data-testid="state-target-name">
                {props.targetName}
              </span>
            )}
          </div>
        );
      }

      // デフォルト
      default:
        return (
          <div className="animation-overlay">
            <div className="animation generic">
              <p>{animation.eventType}</p>
            </div>
          </div>
        );
    }
  } catch (error) {
    console.error('アニメーション表示エラー:', error);
    setHasRenderError(true);
    return null;
  }
};
