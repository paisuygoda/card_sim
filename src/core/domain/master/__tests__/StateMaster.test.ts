import { describe, test, expect } from 'vitest';
import { STATE_MASTER, setupState, getStateDescription, getStateIcon, getStateCategory } from '../StateMaster';

/**
 * Task 3-1-1: StateMaster拡張 + ヘルパー関数実装 - ユニットテスト
 * 
 * テスト設計書: .github/tasks/国家ステート表示/tests/Task3-1-1.md
 */

// 既存のステートIDリスト（テストデータ駆動に使用）
const existingStateIds = ['attackPowerUp', 'attackPowerDown', 'prosperity', 'dead', 'nationDestroyed'];

describe('StateMaster', () => {
  // ===========================================
  // 2.1 StateMasterData型テスト
  // ===========================================
  describe('StateMasterData型', () => {
    // Test Case 2-1-1
    test('全ステートにdescriptionが定義されている', () => {
      existingStateIds.forEach(stateId => {
        const state = STATE_MASTER[stateId];
        
        // descriptionが存在する
        expect(state).toHaveProperty('description');
        expect((state as any).description).toBeDefined();
        
        // 空文字でない
        expect((state as any).description).not.toBe('');
        
        // 合理的な長さ（5文字以上）
        expect((state as any).description.length).toBeGreaterThanOrEqual(5);
      });
    });

    // Test Case 2-1-2
    test('全ステートにiconが定義されている', () => {
      existingStateIds.forEach(stateId => {
        const state = STATE_MASTER[stateId];
        
        // iconが存在する
        expect(state).toHaveProperty('icon');
        expect((state as any).icon).toBeDefined();
        
        // 空文字でない
        expect((state as any).icon).not.toBe('');
        
        // 絵文字である（1-4文字のUnicode文字列）
        expect((state as any).icon.length).toBeGreaterThanOrEqual(1);
        expect((state as any).icon.length).toBeLessThanOrEqual(4);
      });
    });

    // Test Case 2-1-3
    test('descriptionとiconのマッピングが推奨仕様に準拠', () => {
      // UI設計書§6.2の推奨絵文字マッピング
      const recommendedIcons: Record<string, string> = {
        attackPowerUp: '⚔️',
        attackPowerDown: '🗡️',
        prosperity: '🌟',
        dead: '💀',
        nationDestroyed: '⚰️',
      };

      Object.entries(recommendedIcons).forEach(([stateId, expectedIcon]) => {
        const state = STATE_MASTER[stateId];
        expect((state as any).icon).toBe(expectedIcon);
      });

      // descriptionが効果を適切に説明している（非空チェックのみ、内容は柔軟）
      existingStateIds.forEach(stateId => {
        const description = (STATE_MASTER[stateId] as any).description;
        expect(description).toBeTruthy();
        expect(typeof description).toBe('string');
      });
    });
  });

  // ===========================================
  // 2.2 getStateDescription関数テスト
  // ===========================================
  describe('getStateDescription', () => {
    // Test Case 2-2-1
    test('既存ステートIDで正しい説明が返る', () => {
      const testCases = [
        'attackPowerUp',
        'prosperity',
        'dead',
      ];

      testCases.forEach(stateId => {
        const description = getStateDescription(stateId);
        const expectedDescription = (STATE_MASTER[stateId] as any).description;
        
        expect(description).toBe(expectedDescription);
        expect(description).toBeTruthy();
      });
    });

    // Test Case 2-2-2
    test('存在しないステートIDでデフォルト値が返る', () => {
      const invalidIds = ['nonexistentState', '', 'undefined', 'xyz123'];
      const defaultDescription = '不明なステート';

      invalidIds.forEach(invalidId => {
        const description = getStateDescription(invalidId);
        expect(description).toBe(defaultDescription);
      });
    });

    // Test Case 2-2-3
    test('大文字小文字の区別', () => {
      // 正確なステートID
      const validDescription = getStateDescription('attackPowerUp');
      expect(validDescription).not.toBe('不明なステート');
      
      // 大文字小文字が異なる
      const invalidDescription1 = getStateDescription('AttackPowerUp');
      const invalidDescription2 = getStateDescription('attackpowerup');
      const invalidDescription3 = getStateDescription('ATTACKPOWERUP');
      
      expect(invalidDescription1).toBe('不明なステート');
      expect(invalidDescription2).toBe('不明なステート');
      expect(invalidDescription3).toBe('不明なステート');
    });
  });

  // ===========================================
  // 2.3 getStateIcon関数テスト
  // ===========================================
  describe('getStateIcon', () => {
    // Test Case 2-3-1
    test('既存ステートIDで正しいアイコンが返る', () => {
      const testCases = [
        'attackPowerUp',
        'prosperity',
        'nationDestroyed',
      ];

      testCases.forEach(stateId => {
        const icon = getStateIcon(stateId);
        const expectedIcon = (STATE_MASTER[stateId] as any).icon;
        
        expect(icon).toBe(expectedIcon);
        expect(icon).toBeTruthy();
      });
    });

    // Test Case 2-3-2
    test('存在しないステートIDでデフォルトアイコンが返る', () => {
      const invalidIds = ['nonexistentState', '', 'xyz'];
      const defaultIcon = '❓';

      invalidIds.forEach(invalidId => {
        const icon = getStateIcon(invalidId);
        expect(icon).toBe(defaultIcon);
      });
    });

    // Test Case 2-3-3
    test('アイコンが絵文字形式', () => {
      existingStateIds.forEach(stateId => {
        const icon = getStateIcon(stateId);
        
        // 絵文字である（1-4文字のUnicode文字列）
        expect(icon.length).toBeGreaterThanOrEqual(1);
        expect(icon.length).toBeLessThanOrEqual(4);
        
        // 制御文字やASCII文字のみではない（簡易チェック）
        // 絵文字はcode pointが高い値を持つ
        const hasHighCodePoint = [...icon].some(char => char.codePointAt(0)! > 127);
        expect(hasHighCodePoint).toBe(true);
      });
    });
  });

  // ===========================================
  // 2.4 getStateCategory関数テスト
  // ===========================================
  describe('getStateCategory', () => {
    // Test Case 2-4-1
    test('バフ系ステートで"buff"が返る', () => {
      const buffStates = ['attackPowerUp', 'prosperity'];
      const expectedCategory = 'buff';

      buffStates.forEach(stateId => {
        const category = getStateCategory(stateId);
        expect(category).toBe(expectedCategory);
      });
    });

    // Test Case 2-4-2
    test('デバフ系ステートで"debuff"が返る', () => {
      const debuffStates = ['attackPowerDown'];
      const expectedCategory = 'debuff';

      debuffStates.forEach(stateId => {
        const category = getStateCategory(stateId);
        expect(category).toBe(expectedCategory);
      });
    });

    // Test Case 2-4-3
    test('中立系ステートで"neutral"が返る', () => {
      const neutralStates = ['dead', 'nationDestroyed'];
      const expectedCategory = 'neutral';

      neutralStates.forEach(stateId => {
        const category = getStateCategory(stateId);
        expect(category).toBe(expectedCategory);
      });
    });

    // Test Case 2-4-4
    test('存在しないステートIDでデフォルトカテゴリ"neutral"が返る', () => {
      const invalidIds = ['nonexistentState', '', 'xyz123'];
      const defaultCategory = 'neutral';

      invalidIds.forEach(invalidId => {
        const category = getStateCategory(invalidId);
        expect(category).toBe(defaultCategory);
      });
    });
  });

  // ===========================================
  // 2.5 setupState関数の互換性テスト
  // ===========================================
  describe('setupState関数の互換性', () => {
    // Test Case 2-5-1
    test('拡張後もsetupStateが正常動作する', () => {
      const state = setupState('attackPowerUp', 'unit_001', 'nation_player');

      // State型のオブジェクトが返る
      expect(state).toBeDefined();
      expect(state.stateId).toBe('attackPowerUp');
      
      // unitIdとownerNationIdが正しく設定される
      expect(state.unitId).toBe('unit_001');
      expect(state.ownerNationId).toBe('nation_player');
      
      // 全ての既存フィールドが正しく設定される
      expect(state.name).toBe('攻撃力上昇');
      expect(state.stacks).toBeNull();
      expect(state.duration).toBe(3);
      expect(state.triggerTimings).toBeDefined();
      expect(state.effects).toBeDefined();
      expect(state.excludes).toBeDefined();
      
      // descriptionとiconは含まれない（State型には存在しないため）
      expect(state).not.toHaveProperty('description');
      expect(state).not.toHaveProperty('icon');
    });

    // Test Case 2-5-2
    test('型の互換性', () => {
      // TypeScriptコンパイルがパスすることを確認
      // 実行時にはエラーが発生しないことを確認
      expect(() => {
        existingStateIds.forEach(stateId => {
          const state = setupState(stateId, `unit_${stateId}`, 'nation_test');
          expect(state.stateId).toBe(stateId);
        });
      }).not.toThrow();
    });
  });
});
