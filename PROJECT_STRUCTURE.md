# 国家運営シミュレーションゲーム - プロジェクト構造

## 概要

本プロジェクトは、詳細設計書に基づいた国家運営シミュレーションゲームのReact実装です。
ゲームロジック（Core）とUI（React）を厳格に分離し、非同期連携アーキテクチャを採用しています。

## ディレクトリ構造

```
src/
├── core/                         # ゲームエンジン（React非依存）
│   ├── domain/
│   │   ├── models/               # 型定義・エンティティ
│   │   │   ├── BattleContext.ts
│   │   │   ├── Command.ts        # Command, CommandType, CommandVisualType, CommandTargetType
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
│   │   ├── logic/                # 純粋関数ロジック
│   │   │   ├── BattleLogic.ts        # 戦闘処理
│   │   │   ├── EffectExecutor.ts     # 効果実行ディスパッチャー
│   │   │   ├── GameMath.ts           # 数値計算（切り上げ・上下限）
│   │   │   ├── NationManager.ts      # 国家管理
│   │   │   ├── NPCLogic.ts           # NPC思考
│   │   │   ├── PriorityManager.ts    # 優先順位管理
│   │   │   ├── StateExecutor.ts      # ステート処理
│   │   │   ├── UnitManager.ts        # ユニット管理
│   │   │   ├── index.ts
│   │   │   └── effects/             # 効果種別ごとの実装
│   │   │       ├── actionEffects.ts
│   │   │       ├── commandEffects.ts
│   │   │       ├── powerEffects.ts
│   │   │       ├── stateEffects.ts
│   │   │       ├── unitAttackEffects.ts
│   │   │       ├── unitHPEffects.ts
│   │   │       ├── unitSummonEffects.ts
│   │   │       └── index.ts
│   │   └── master/               # マスターデータ定義
│   │       ├── CommandMaster.ts
│   │       ├── EffectMaster.ts
│   │       ├── NationMaster.ts
│   │       ├── SkillMaster.ts
│   │       ├── StageMaster.ts
│   │       ├── StateMaster.ts
│   │       ├── UnitMaster.ts
│   │       └── index.ts          # MasterData オブジェクト、getStateIcon/getStateCategory等
│   ├── application/
│   │   ├── GameManager.ts        # ゲーム進行制御（async/await）
│   │   └── index.ts
│   └── infrastructure/
│       ├── IGameUIBridge.ts      # Bridge インターフェース、GameEvent enum、InputRequest enum、各データ型
│       └── index.ts
│
├── bridge/
│   ├── ReactUIBridge.ts          # IGameUIBridge 本番実装（Zustand連携）
│   └── index.ts
│
├── store/                        # 状態管理（Zustand）
│   ├── useGameStateStore.ts      # ゲーム状態（GameState）
│   ├── useUIStateStore.ts        # UI状態（animationQueue, currentAnimation, input, logs）
│   └── index.ts
│
├── ui/                           # React UIコンポーネント
│   ├── components/               # 共通コンポーネント
│   │   ├── AnimationDisplay.tsx      # アニメーション表示（イベント種別ごとの演出描画）
│   │   ├── BattleArea.tsx            # 戦闘エリア（前衛・中衛・後衛・ベンチ配置）
│   │   ├── CommandPanel.tsx          # コマンド選択パネル
│   │   ├── GameBoard.tsx             # ゲームボード全体レイアウト
│   │   ├── Graveyard.tsx / .css      # 墓地表示
│   │   ├── NationPanel.tsx           # 国家情報パネル（国力ゲージ付き）
│   │   ├── PhaseDisplay.tsx          # フェーズ表示
│   │   ├── StateIcon.tsx / .css      # ステートアイコン
│   │   ├── StateIconList.tsx / .css  # ステートアイコンリスト
│   │   ├── StateTooltip.tsx / .css   # ステートツールチップ
│   │   ├── UnitCard.tsx              # ユニットカード（HPバー付き）
│   │   └── index.ts
│   ├── features/                 # 画面単位コンポーネント
│   │   ├── ActionScreen.tsx          # 行動フェーズ画面
│   │   ├── BattleScreen.tsx          # 戦闘画面
│   │   ├── DomesticScreen.tsx        # 内政画面（コマンド→ターゲット選択の多段階UI）
│   │   ├── GameEndScreen.tsx         # ゲーム終了画面
│   │   ├── StageSelectScreen.tsx     # ステージ選択画面
│   │   └── index.ts
│   ├── hooks/                    # カスタムフック
│   │   ├── useAnimation.ts          # アニメーション管理
│   │   ├── useGameActions.ts        # ゲーム操作（※現在未使用）
│   │   └── index.ts
│   ├── utils/                    # UIユーティリティ
│   │   ├── stateUI.ts                # ステートカテゴリ色取得
│   │   └── index.ts
│   └── index.ts
│
├── App.tsx                       # ルートコンポーネント（初期化・画面切替・ログ表示）
├── App.css                       # 全コンポーネントのスタイル（1,020行）
├── cli-test.ts                   # CLIテストツール（npm run play）
├── main.tsx                      # エントリーポイント
└── index.css                     # グローバルスタイル
```

## アーキテクチャの特徴

### 1. レイヤー分離

- **Core Layer（ゲームエンジン）**: React非依存の純粋なロジック
  - `domain/models`: エンティティ型定義
  - `domain/logic`: 純粋関数群 + `effects/` で効果種別ごとの処理
  - `domain/master`: マスターデータ（ステージ・ユニット・スキル・ステート・コマンド等）
  - `application`: ゲーム進行制御（async/await）
  - `infrastructure`: 外部接続インターフェース

- **Bridge Layer（UI連携）**: CoreとUIの橋渡し
  - `IGameUIBridge`インターフェースの実装
  - 演出完了待機、プレイヤー入力待機

- **Store Layer（状態管理）**: ReactとCoreの共有状態
  - Zustandによる状態管理
  - ゲーム状態（`useGameStateStore`）とUI状態（`useUIStateStore`）の分離

- **UI Layer（React）**: ユーザーインターフェース
  - `components/`: 再利用可能な共通パーツ
  - `features/`: 画面単位のコンポーネント
  - `hooks/`: カスタムフック
  - `utils/`: UIユーティリティ

### 2. 非同期連携アーキテクチャ

ゲームロジックは`async/await`でUI演出を待機：

```
GameManager → bridge.notifyGameEvent() → ReactUIBridge → useUIStateStore.enqueueAnimation()
                                                        → AnimationDisplay がタイマーで自動完了
GameManager → bridge.waitUI()          → ReactUIBridge → キューが空になるまで待機
GameManager → bridge.waitPlayerInput() → ReactUIBridge → useUIStateStore.startInput() → DomesticScreen → completeInput()
```

### 3. 依存性の逆転

- Core層は**UI層を知らない**
- CoreはIGameUIBridgeインターフェースに依存
- BridgeがReactの具象実装を提供

## 実装状況

### 実装済み
- ゲーム進行の基本フロー（ゲーム開始→ラウンド→ターン→フェーズ遷移→ゲーム終了）
- 型定義（`core/domain/models` 全ファイル）
- マスターデータ定義（`core/domain/master` 全ファイル）
- ロジック関数群（GameMath, BattleLogic, EffectExecutor, StateExecutor, UnitManager, NPCLogic, PriorityManager, NationManager）
- 効果処理（`effects/` 7種別）
- IGameUIBridgeインターフェースとReactUIBridge実装
- Zustand状態管理（gameState / uiState）
- 全画面コンポーネント（StageSelect, Domestic, Battle, Action, GameEnd）
- UIコンポーネント群（AnimationDisplay, BattleArea, CommandPanel, GameBoard, Graveyard, NationPanel, PhaseDisplay, StateIcon/List/Tooltip, UnitCard）
- CLIテストツール（`npm run play`）
- UIコンポーネントテスト（18ファイル, 約9,600行）
