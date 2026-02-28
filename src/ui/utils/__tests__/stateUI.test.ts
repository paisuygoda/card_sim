import { describe, test, expect } from 'vitest';
import { getStateCategoryColor } from '../stateUI';

/**
 * UI層ユーティリティ: ステートカテゴリ色取得関数のテスト
 */
describe('stateUI', () => {
  describe('getStateCategoryColor', () => {
    test('バフ系ステートで緑色が返る', () => {
      const buffStates = ['attackPowerUp', 'prosperity'];
      const expectedColor = '#4caf50';

      buffStates.forEach(stateId => {
        const color = getStateCategoryColor(stateId);
        expect(color).toBe(expectedColor);
      });
    });

    test('デバフ系ステートで赤色が返る', () => {
      const debuffStates = ['attackPowerDown'];
      const expectedColor = '#f44336';

      debuffStates.forEach(stateId => {
        const color = getStateCategoryColor(stateId);
        expect(color).toBe(expectedColor);
      });
    });

    test('中立系ステートでグレー色が返る', () => {
      const neutralStates = ['dead', 'nationDestroyed'];
      const expectedColor = '#9e9e9e';

      neutralStates.forEach(stateId => {
        const color = getStateCategoryColor(stateId);
        expect(color).toBe(expectedColor);
      });
    });

    test('存在しないステートIDでデフォルト色が返る', () => {
      const invalidIds = ['nonexistentState', '', 'xyz123'];
      const defaultColor = '#9e9e9e';

      invalidIds.forEach(invalidId => {
        const color = getStateCategoryColor(invalidId);
        expect(color).toBe(defaultColor);
      });
    });

    test('カラーコードが正しいフォーマット', () => {
      const testStates = ['attackPowerUp', 'attackPowerDown', 'dead'];
      // カラーコード形式: #RRGGBB
      const colorCodePattern = /^#[0-9a-fA-F]{6}$/;

      testStates.forEach(stateId => {
        const color = getStateCategoryColor(stateId);
        expect(color).toMatch(colorCodePattern);
      });
    });
  });
});
