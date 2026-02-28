# 国家運営シミュレーションゲーム

React + TypeScriptで実装された国家運営シミュレーションゲームです。

## 開発環境のセットアップ

### 必要なもの
- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

### ビルド

```bash
npm run build
```

### テスト

#### ユニットテスト

```bash
npm test
```

#### CLIテストツール

コンソールでゲームロジックをテストできます：

```bash
# 通常モード（プレイヤー入力あり）
npm run play

# 自動プレイモード（デバッグ用）
AUTO_PLAY=true npm run play

# ステージ選択
STAGE_TYPE=mini npm run play      # ミニステージ（1ラウンド）
STAGE_TYPE=two npm run play       # 2国家対戦（5ラウンド）
STAGE_TYPE=three npm run play     # 3国家対戦（10ラウンド）

# 組み合わせ
AUTO_PLAY=true STAGE_TYPE=two npm run play
```

## プロジェクト構造

詳細は [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) を参照してください。

```
src/
├── core/        # ゲームロジック（React非依存）
│   ├── domain/
│   │   ├── models/    # 型定義
│   │   ├── logic/     # 計算関数群 + effects/
│   │   └── master/    # マスターデータ
│   ├── application/   # GameManager（ゲーム進行制御）
│   └── infrastructure/# IGameUIBridge
├── bridge/      # UI連携（ReactUIBridge）
├── store/       # 状態管理（Zustand）
├── ui/          # Reactコンポーネント
│   ├── components/   # 共通パーツ
│   ├── features/     # 画面単位
│   ├── hooks/        # カスタムフック
│   └── utils/        # UIユーティリティ
├── App.tsx      # ルートコンポーネント
├── cli-test.ts  # CLIテストツール
└── main.tsx     # エントリーポイント
```

## 設計思想

### 非同期連携アーキテクチャ

ゲームロジックとUIを完全に分離し、`async/await`で演出を待機します：

- **Logic Layer**: 純粋関数による計算処理
- **Process Layer**: async/awaitによるゲーム進行制御
- **Bridge Layer**: UI連携インターフェース（`IGameUIBridge`）
- **UI Layer**: React コンポーネント

詳細は `.github/copilot-instructions.md` と `docs/詳細設計書.md` を参照してください。

## 開発ガイドライン

1. **ゲームロジック（core/）からReactを直接インポートしない**
2. **すべての数値計算はGameMathを経由する**
3. **ステート処理はStateExecutorを経由する**
4. **UI演出はIGameUIBridgeを経由する**
5. **テスト駆動開発（TDD）を徹底する**

## ライセンス

MIT
