import React from 'react';
import { CommandExecuteData } from '@core/infrastructure/IGameUIBridge';
import { AnimationRendererProps } from './types';

/**
 * CommandAnimation - COMMAND_EXECUTE イベントの演出コンポーネント
 *
 * コマンド実行演出を表示する。
 */
export const CommandAnimation: React.FC<AnimationRendererProps> = ({ data }) => {
  if (!data) return null;
  const d = data as CommandExecuteData;

  // commandNameは必須（空白文字列もNG）
  if (!d.commandName || !d.commandName.trim()) return null;

  const visualTypeClass =
    d.commandVisualType && d.commandVisualType !== ''
      ? `animation-command-execute--${d.commandVisualType.toLowerCase()}`
      : '';
  const className = `animation-command-execute ${visualTypeClass}`.trim();

  return (
    <div
      className={className}
      data-testid="command-execute-display"
      data-visual-type={d.commandVisualType || undefined}
    >
      <span className="command-label">COMMAND</span>
      <span className="command-name" data-testid="command-name">
        {d.commandName}
      </span>
      {d.commandTarget && (
        <span className="command-target" data-testid="command-target">
          対象: {d.commandTarget}
        </span>
      )}
    </div>
  );
};
