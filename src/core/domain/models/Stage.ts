import { Nation } from './Nation';

/**
 * ステージデータ構造
 * 初期状態やゲーム設定を決める情報
 */
export interface Stage {
  /** ステージ識別子 */
  stageId: number;
  /** 決着ラウンド数 */
  roundLimit: number;
  /** 決着国力（未使用の場合はnull） */
  powerWinThreshold: number | null;
  /** 各国家の初期状態データ */
  initialNations: Nation[];
  /** 各国家の基礎内政回数 */
  baseDomesticActions: number;
  /** ステージ表示タイトル */
  title?: string;
  /** ステージ説明文 */
  description?: string;
}
