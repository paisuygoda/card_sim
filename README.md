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

```bash
npm test
```

### CLIテスト（ゲームロジックのコンソールテスト）

UI実装前にゲームロジックをテストするための簡易CLIツール：

```bash
npm run cli-test
```

コンソール上でゲームの進行を確認し、プレイヤー入力を標準入力で行えます。
ロジック実装のデバッグに活用してください。

## プロジェクト構造

詳細は [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) を参照してください。

```
src/
├── core/        # ゲームロジック（React非依存）
├── bridge/      # UI連携
├── store/       # 状態管理（Zustand）
├── ui/          # Reactコンポーネント
├── App.tsx      # ルートコンポーネント
└── main.tsx     # エントリーポイント
```

## 設計思想

### 非同期連携アーキテクチャ

ゲームロジックとUIを完全に分離し、`async/await`で演出を待機します：

- **Logic Layer**: 純粋関数による計算処理
- **Process Layer**: async/awaitによるゲーム進行制御
- **Bridge Layer**: UI連携インターフェース
- **UI Layer**: React コンポーネント

詳細は `.github/copilot-instructions.md` と `docs/詳細設計書.md` を参照してください。

## 開発ガイドライン

1. **ゲームロジック（core/）からReactを直接インポートしない**
2. **すべての数値計算はGameMathを経由する**
3. **ステート処理はStateManagerを経由する**
4. **UI演出はIGameUIBridgeを経由する**
5. **テスト駆動開発（TDD）を徹底する**

## ライセンス

MIT
