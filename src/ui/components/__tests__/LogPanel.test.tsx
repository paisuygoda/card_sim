import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useUIStateStore } from '@store/useUIStateStore';
import { LogPanel } from '../LogPanel';

describe('LogPanel', () => {
  beforeEach(() => {
    useUIStateStore.setState({ logs: [] });
  });

  it('「ログ」ヘッダーが表示される', () => {
    render(<LogPanel />);
    expect(screen.getByText('ログ')).toBeInTheDocument();
  });

  it('ログが空の場合はログエントリーが表示されない', () => {
    render(<LogPanel />);
    expect(document.querySelectorAll('.log-entry').length).toBe(0);
  });

  it('ログエントリーが表示される', () => {
    useUIStateStore.setState({
      logs: [
        { id: 1, message: 'テストログ1', level: 'info', timestamp: Date.now() },
        { id: 2, message: 'テストログ2', level: 'warning', timestamp: Date.now() },
      ],
    });

    render(<LogPanel />);
    expect(screen.getByText('テストログ1')).toBeInTheDocument();
    expect(screen.getByText('テストログ2')).toBeInTheDocument();
  });

  it('直近10件のみ表示される', () => {
    const logs = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      message: `ログ${i + 1}`,
      level: 'info' as const,
      timestamp: Date.now() + i,
    }));
    useUIStateStore.setState({ logs });

    render(<LogPanel />);
    // 最初の5件は表示されない
    expect(screen.queryByText('ログ1')).not.toBeInTheDocument();
    expect(screen.queryByText('ログ5')).not.toBeInTheDocument();
    // 直近10件が表示される
    expect(screen.getByText('ログ6')).toBeInTheDocument();
    expect(screen.getByText('ログ15')).toBeInTheDocument();
  });

  it('ログレベルに応じたCSSクラスが付与される', () => {
    useUIStateStore.setState({
      logs: [
        { id: 1, message: 'info msg', level: 'info', timestamp: Date.now() },
        { id: 2, message: 'warning msg', level: 'warning', timestamp: Date.now() },
        { id: 3, message: 'error msg', level: 'error', timestamp: Date.now() },
      ],
    });

    render(<LogPanel />);

    const entries = document.querySelectorAll('.log-entry');
    expect(entries[0].classList.contains('info')).toBe(true);
    expect(entries[1].classList.contains('warning')).toBe(true);
    expect(entries[2].classList.contains('error')).toBe(true);
  });
});
