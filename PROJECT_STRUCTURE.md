# 国家運営シミュレーションゲーム - プロジェクト構造

## 概要

本プロジェクトは、詳細設計書に基づいた国家運営シミュレーションゲームのReact実装です。
ゲームロジック（Core）とUI（React）を厳格に分離し、非同期連携アーキテクチャを採用しています。

## ディレクトリ構造

```
src/
├── core/                     # ゲームエンジン（React非依存）
│   ├── domain/               # ドメインロジック
│   │   ├── models/           # 型定義・エンティティ
│   │   │   ├── BattleContext.ts
│   │   │   ├── Command.ts
│   │   │   ├── Effect.ts
│   │   │   ├── GamePhase.ts
│   │   │   ├── GameState.ts
│   │   │   ├── Nation.ts
│   │   │   ├── Skill.ts
│   │   │   ├── Stage.ts
│   │   │   ├── State.ts
│   │   │   ├── TargetPattern.ts
│   │   │   ├── Unit.ts
│   │   │   └── index.ts
│   │   └── logic/            # 純粋関数ロジック
│   │       ├── BattleLogic.ts      # 戦闘処理
│   │       ├── EffectExecutor.ts   # 効果実行
│   │       ├── GameMath.ts         # 数値計算
│   │       ├── NPCLogic.ts         # NPC思考
│   │       ├── PriorityManager.ts  # 優先順位管理
│   │       ├── StateManager.ts     # ステート管理
│   │       ├── UnitManager.ts      # ユニット管理
│   │       └── index.ts
│   ├── application/          # アプリケーション層
│   │   ├── GameManager.ts    # ゲーム進行制御（async/await）
│   │   └── index.ts
│   └── infrastructure/       # インフラストラクチャ層
│       ├── IGameUIBridge.ts  # UI連携インターフェース
│       └── index.ts
│
├── bridge/                   # UI連携実装
│   ├── ReactUIBridge.ts      # 本番用実装（Zustand連携）
│   ├── MockUIBridge.ts       # 開発・デバッグ用モック
│   └── index.ts
│
├── store/                    # 状態管理（Zustand）
│   ├── useGameStateStore.ts  # ゲーム状態
│   ├── useUIStateStore.ts    # UI状態（アニメーション、入力待ちなど）
│   └── index.ts
│
├── ui/                       # React UIコンポーネント
│   ├── components/           # 共通コンポーネント
│   │   ├── AnimationDisplay.tsx  # アニメーション表示
│   │   ├── BattleArea.tsx        # 戦闘エリア
│   │   ├── CommandPanel.tsx      # コマンドパネル
│   │   ├── GameBoard.tsx         # ゲームボード
│   │   ├── NationPanel.tsx       # 国家パネル
│   │   ├── PhaseDisplay.tsx      # フェーズ表示
│   │   ├── UnitCard.tsx          # ユニットカード
│   │   └── index.ts
│   ├── features/             # 画面単位コンポーネント
│   │   ├── BattleScreen.tsx      # 戦闘画面
│   │   ├── DomesticScreen.tsx    # 内政画面
│   │   ├── GameEndScreen.tsx     # ゲーム終了画面
│   │   └── index.ts
│   ├── hooks/                # カスタムフック
│   │   ├── useAnimation.ts       # アニメーション管理
│   │   ├── useGameActions.ts     # ゲーム操作
│   │   └── index.ts
│   └── index.ts
│
├── App.tsx                   # ルートコンポーネント
├── App.css                   # アプリケーションスタイル
├── main.tsx                  # エントリーポイント
└── index.css                 # グローバルスタイル
```

## アーキテクチャの特徴

### 1. レイヤー分離

- **Core Layer（ゲームエンジン）**: React非依存の純粋なロジック
  - `domain`: エンティティと純粋関数
  - `application`: ゲーム進行制御（async/await）
  - `infrastructure`: 外部接続インターフェース

- **Bridge Layer（UI連携）**: CoreとUIの橋渡し
  - `IGameUIBridge`インターフェースの実装
  - 演出完了待機、プレイヤー入力待機

- **Store Layer（状態管理）**: ReactとCoreの共有状態
  - Zustandによる状態管理
  - ゲーム状態とUI状態の分離

- **UI Layer（React）**: ユーザーインターフェース
  - コンポーネント、画面、カスタムフック

### 2. 非同期連携アーキテクチャ

ゲームロジックは`async/await`でUI演出を待機：

```typescript
// GameManagerの例
async executeCommand(command: Command) {
  // 効果を実行
  for (const effect of command.effects) {
    await executeEffect(effect, gameState, bridge);
    // ↑ bridge.playAnimation()でUI演出完了を待つ
  }
}
```

### 3. 依存性の逆転

- Core層は**UI層を知らない**
- CoreはIGameUIBridgeインターフェースに依存
- BridgeがReactの具象実装を提供

## 開発の進め方

### フェーズ1: モデルとロジック実装
1. `core/domain/logic`の各関数を実装
2. テスト駆動で各ロジックを検証
3. MockUIBridgeでゲームフローを確認

### フェーズ2: UI連携
1. ReactUIBridgeの実装
2. Zustandストアとの連携
3. アニメーション実装

### フェーズ3: UIコンポーネント
1. 各コンポーネントの実装
2. スタイリング
3. ユーザー操作の実装

## 実装済み項目

✅ プロジェクト初期化（package.json、tsconfig.json等）
✅ 型定義（core/domain/models）
✅ ロジック関数の骨格（core/domain/logic）
✅ GameManagerの骨格（core/application）
✅ IGameUIBridgeインターフェース
✅ Bridge実装（ReactUIBridge、MockUIBridge）
✅ 状態管理（Zustand stores）
✅ カスタムフック（useGameActions、useAnimation）
✅ UIコンポーネント骨格
✅ 画面コンポーネント骨格
✅ App.tsxとエントリーポイント

## 次のステップ

各ファイルの`// TODO: 実装`コメントに従って、具体的な実装を進めてください。

1. **数値計算（GameMath.ts）**: 最も基礎的な処理から実装
2. **ステート管理（StateManager.ts）**: ゲームの核となる仕組み
3. **効果実行（EffectExecutor.ts）**: 各効果タイプの処理
4. **戦闘ロジック（BattleLogic.ts）**: 戦闘フローの実装
5. **GameManager**: 各フェーズの統合
6. **UI連携**: ReactUIBridgeとストアの統合

実装時は必ずテストを先に書き、TDDで進めてください。
