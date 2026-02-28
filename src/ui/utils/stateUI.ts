import { getStateCategory } from '@/core/domain/master';

/**
 * ステートカテゴリの色を取得
 * @param stateId ステートID
 * @returns カテゴリ色（バフ: #4caf50, デバフ: #f44336, 中立: #9e9e9e）
 */
export function getStateCategoryColor(stateId: string): string {
  const category = getStateCategory(stateId);
  switch (category) {
    case 'buff':
      return '#4caf50';
    case 'debuff':
      return '#f44336';
    case 'neutral':
      return '#9e9e9e';
  }
}
