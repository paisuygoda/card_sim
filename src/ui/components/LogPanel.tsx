import { useUIStateStore } from '@store/useUIStateStore';

/**
 * LogPanel - ゲームログの表示パネル
 *
 * 責務:
 * - UIステートストアからログを購読
 * - 直近10件のログをレベル別に表示
 */
export function LogPanel() {
  const logs = useUIStateStore((state) => state.logs);

  return (
    <div className="log-panel">
      <h3>ログ</h3>
      <div className="log-list">
        {logs.slice(-10).map((log) => (
          <div key={log.id} className={`log-entry ${log.level}`}>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
