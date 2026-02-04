/**
 * CLI Test Tool - ゲームロジックのコンソールテスト
 * 
 * 使い方:
 * npm run cli-test
 * 
 * または:
 * npx tsx src/cli-test.ts
 */

import * as readline from 'readline';
import { GameManager } from './core/application/GameManager';
import { IGameUIBridge, AnimationEvent, InputRequest } from './core/infrastructure/IGameUIBridge';
import { Stage, Command, GamePhase } from './core/domain/models';
import {
  createMiniTestStage,
  createTwoNationTestStage,
  createThreeNationTestStage,
} from './test-data-helper';

/**
 * CLI用のUIブリッジ実装
 * コンソールログで情報を表示し、標準入力でプレイヤー入力を受け取る
 */
class CLIBridge implements IGameUIBridge {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async playAnimation(eventType: AnimationEvent, data: any): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎬 アニメーション: ${eventType}`);
    
    switch (eventType) {
      case AnimationEvent.PHASE_TRANSIT:
        console.log(`📍 フェーズ遷移: ${data.phase}`);
        break;
      case AnimationEvent.UNIT_DAMAGE:
        console.log(`⚔️  ダメージ: ${data.targetName} に ${data.damage} ダメージ`);
        break;
      case AnimationEvent.POWER_CHANGE:
        console.log(`💰 国力変動: ${data.nationName} ${data.amount > 0 ? '+' : ''}${data.amount}`);
        break;
      case AnimationEvent.STATE_ADD:
        console.log(`✨ ステート付与: ${data.targetName} に ${data.stateName}`);
        break;
      case AnimationEvent.STATE_REMOVE:
        console.log(`🗑️  ステート削除: ${data.targetName} から ${data.stateName}`);
        break;
      case AnimationEvent.UNIT_SUMMON:
        console.log(`🎭 ユニット召喚: ${data.unitName}`);
        break;
      case AnimationEvent.UNIT_DESTROY:
        console.log(`💀 ユニット破壊: ${data.unitName}`);
        break;
      case AnimationEvent.SKILL_ACTIVATE:
        console.log(`🌟 スキル発動: ${data.unitName} の ${data.skillName}`);
        break;
      case AnimationEvent.COMMAND_EXECUTE:
        console.log(`📋 コマンド実行: ${data.commandName}`);
        break;
      case AnimationEvent.BATTLE_START:
        console.log(`⚔️  戦闘開始: ${data.attackerName} vs ${data.defenderName}`);
        break;
      case AnimationEvent.BATTLE_END:
        console.log(`🏁 戦闘終了`);
        break;
      default:
        console.log(`データ: ${JSON.stringify(data, null, 2)}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 少し待機（読みやすさのため）
    await this.delay(300);
  }

  async waitPlayerInput<T = any>(requestType: InputRequest, context: any): Promise<T> {
    console.log('\n┌────────────────────────────────────┐');
    console.log('│ 🎮 プレイヤー入力待ち               │');
    console.log('└────────────────────────────────────┘');

    switch (requestType) {
      case InputRequest.SELECT_COMMAND:
        return await this.selectCommand(context);
      case InputRequest.SELECT_TARGET:
        return await this.selectTarget(context);
      case InputRequest.CONFIRM:
        return await this.confirm(context);
      default:
        console.log(`未対応の入力タイプ: ${requestType}`);
        return {} as T;
    }
  }

  updateGameState(gameState: any): void {
    console.log('\n📊 ゲーム状態更新');
    console.log(`   ラウンド: ${gameState.currentRound}/${gameState.roundLimit}`);
    console.log(`   フェーズ: ${gameState.currentPhase}`);
    console.log(`   手番: 国家${gameState.currentTurnPlayer + 1}`);
    
    // 各国家の状態を表示
    console.log('\n   国家状態:');
    gameState.nations.forEach((nation: any, index: number) => {
      const isCurrent = index === gameState.currentTurnPlayer;
      const marker = isCurrent ? '👉' : '  ';
      console.log(`   ${marker} ${nation.name}: 国力${nation.power} / 残り内政${nation.remainingActions}`);
    });
    console.log('');
  }

  log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const prefix = {
      info: 'ℹ️ ',
      warning: '⚠️ ',
      error: '❌',
    }[level];
    console.log(`${prefix} ${message}`);
  }

  private async selectCommand(context: any): Promise<any> {
    const { commands, nation } = context;

    console.log(`\n${nation.name} のコマンド選択:`);
    console.log('─────────────────────────────────────');
    
    commands.forEach((cmd: Command, index: number) => {
      console.log(`  [${index + 1}] ${cmd.name} (${cmd.commandType})`);
    });

    const answer = await this.question('\n番号を入力してください: ');
    const selectedIndex = parseInt(answer) - 1;

    if (selectedIndex >= 0 && selectedIndex < commands.length) {
      return commands[selectedIndex];
    } else {
      console.log('無効な選択です。最初のコマンドを選択します。');
      return commands[0];
    }
  }

  private async selectTarget(context: any): Promise<any> {
    const { targets, message } = context;

    console.log(`\n${message || 'ターゲット選択'}:`);
    console.log('─────────────────────────────────────');
    
    targets.forEach((target: any, index: number) => {
      console.log(`  [${index + 1}] ${target.name || target}`);
    });

    const answer = await this.question('\n番号を入力してください: ');
    const selectedIndex = parseInt(answer) - 1;

    if (selectedIndex >= 0 && selectedIndex < targets.length) {
      return targets[selectedIndex];
    } else {
      console.log('無効な選択です。最初のターゲットを選択します。');
      return targets[0];
    }
  }

  private async confirm(context: any): Promise<any> {
    const { message } = context;
    console.log(`\n${message}`);
    const answer = await this.question('続行しますか？ (y/n): ');
    return answer.toLowerCase() === 'y';
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  close(): void {
    this.rl.close();
  }
}

/**
 * テスト用のステージデータを生成
 */
function createTestStage(): Stage {
  // 環境変数またはコマンドライン引数でステージを選択可能
  const stageType = process.env.STAGE_TYPE || 'mini';

  switch (stageType) {
    case 'mini':
      console.log('📦 ミニステージ（1ラウンド、2国家）を使用します');
      return createMiniTestStage();
    case 'two':
      console.log('📦 2国家対戦ステージを使用します');
      return createTwoNationTestStage();
    case 'three':
      console.log('📦 3国家対戦ステージを使用します');
      return createThreeNationTestStage();
    default:
      console.log('📦 デフォルトでミニステージを使用します');
      return createMiniTestStage();
  }
}

/**
 * メイン処理
 */
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  国家運営シミュレーションゲーム - CLI テスト   ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('📖 ステージ選択方法:');
  console.log('   STAGE_TYPE=mini npm run cli-test    # ミニステージ（デフォルト）');
  console.log('   STAGE_TYPE=two npm run cli-test     # 2国家対戦');
  console.log('   STAGE_TYPE=three npm run cli-test   # 3国家対戦');
  console.log('');

  const bridge = new CLIBridge();

  try {
    // GameManagerの初期化
    console.log('🎮 ゲームマネージャーを初期化中...\n');
    const gameManager = new GameManager(bridge);

    // テストステージの作成
    console.log('🗺️  テストステージを作成中...\n');
    const testStage = createTestStage();

    // ゲーム開始
    console.log('🚀 ゲームを開始します！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await gameManager.startGame(testStage);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ゲーム終了！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 最終結果を表示
    const finalState = gameManager.getGameState();
    console.log('📊 最終結果:');
    finalState.nations.forEach((nation, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`   ${medal} ${nation.name}: 国力 ${nation.power}`);
    });

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('   メッセージ:', error.message);
      console.error('   スタック:', error.stack);
    }
  } finally {
    bridge.close();
    console.log('\n👋 終了します\n');
    process.exit(0);
  }
}

// 実行
main().catch((error) => {
  console.error('致命的なエラー:', error);
  process.exit(1);
});
