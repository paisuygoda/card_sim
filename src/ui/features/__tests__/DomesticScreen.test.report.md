# DomesticScreen テスト実装レポート

## 概要
`DomesticScreen`コンポーネントの入力完了処理に関する包括的なテストスイートを作成しました。

## 作成したテストケース

### 正常系テスト（6個）

#### 1. プレイヤーターンの場合、CommandPanelが表示される
- **目的**: プレイヤーのターンで適切にCommandPanelが表示されることを確認
- **検証内容**: `command-panel`要素が存在し、「コマンド選択」テキストが表示される

#### 2. 選択可能なコマンド一覧が正しく表示される
- **目的**: 国家が持つ`domesticCommands`が全て表示されることを確認
- **検証内容**: 3つのモックコマンド（訓練、募兵、開発）がそれぞれボタンとして表示される

#### 3. コマンドを選択すると、そのコマンドIDが取得される
- **目的**: ボタンクリック時に選択されたコマンドが識別できることを確認
- **検証内容**: コマンドボタンをクリックすると、`console.log`に正しいコマンドIDが出力される

#### 4. コマンド選択後、completeInputが呼ばれる
- **目的**: コマンド選択時に`completeInput`が呼び出されることを確認
- **検証内容**: `completeInput`のモック関数が呼び出される
- **現状**: 実装未完了のため、テストは失敗する（期待通り）

#### 5. 選択されたコマンドが正しく引数として渡される
- **目的**: `completeInput`に正しいコマンドオブジェクトが渡されることを確認
- **検証内容**: 選択されたコマンドの`commandId`と`name`が一致する
- **現状**: 実装未完了のため、テストは失敗する（期待通り）

#### 6. NPC国家のターンの場合、CommandPanelが表示されない
- **目的**: NPCターンでは入力UIを非表示にすることを確認
- **検証内容**: `currentTurnPlayer`がNPC国家を指す場合、CommandPanelが表示されない
- **現状**: 実装未完了のため、NPCターンでも表示されてしまう（テスト失敗）

### エッジケーステスト（4個）

#### 1. コマンドが存在しない場合のハンドリング
- **目的**: `domesticCommands`が空配列の場合でもエラーが発生しないことを確認
- **検証内容**: コマンドボタンが0件で、UIが正常に表示される

#### 2. completeInputが失敗した場合のエラーハンドリング
- **目的**: 入力完了処理でエラーが発生してもアプリがクラッシュしないことを確認
- **検証内容**: `completeInput`が例外を投げても、適切にハンドリングされる

#### 3. 複数回コマンドを選択した場合（最初の1回のみ有効）
- **目的**: 連続クリックによる重複入力を防止することを確認
- **検証内容**: `completeInput`が1回だけ呼ばれ、2回目以降は無視される
- **現状**: 実装未完了のため、検証できない

#### 4. フェーズが変わった場合の処理
- **目的**: 内政フェーズ以外でDomesticScreenが表示された場合の動作を確認
- **検証内容**: フェーズが`BATTLE`など他のフェーズの場合、適切に対応する
- **現状**: 現在の実装では、フェーズに関係なく表示される

### 統合テスト（3個）

#### 1. gameStateがnullの場合、何も表示しない
- **目的**: ゲーム状態が未初期化の場合の安全性を確認
- **検証内容**: `gameState`が`null`のとき、何も描画されない

#### 2. inputStateがnullの場合、何も表示しない
- **目的**: 入力待ち状態が未設定の場合の安全性を確認
- **検証内容**: `input`が`null`のとき、何も描画されない

#### 3. 国家名が正しく表示される
- **目的**: ゲーム状態から正しく国家情報が取得されることを確認
- **検証内容**: `currentTurnPlayer`の国家名が画面に表示される

## テストの構造

### モック設定
- **CommandPanel**: コマンドボタンを持つシンプルなモックコンポーネント
- **BattleArea**: 国家名を表示するだけのモックコンポーネント
- **GameState**: 2つの国家（プレイヤーとNPC）を含む完全なモックデータ
- **InputState**: `SELECT_DOMESTIC_COMMAND`リクエストのモック

### テストデータ
- **mockCommands**: 3つの内政コマンド（訓練、募兵、開発）
- **createMockGameState()**: プレイヤー/NPCターンを切り替え可能なゲーム状態生成関数
- **createInputState()**: 内政コマンド選択の入力状態生成関数

## 実装で対応が必要な箇所

### 1. コマンド選択時の`completeInput`呼び出し
[DomesticScreen.tsx](src/ui/features/DomesticScreen.tsx#L26-L29)
```typescript
const handleCommandSelect = (command: Command) => {
  // TODO: 実装
  // completeInput(command);
  console.log('Command selected:', command);
};
```

**修正案**:
```typescript
const handleCommandSelect = (command: Command) => {
  completeInput(command);
};
```

### 2. NPCターンでのCommandPanel非表示
現在、NPCターンでもCommandPanelが表示されます。

**修正案**:
```typescript
return (
  <div className="domestic-screen">
    <h2>内政フェーズ - {currentNation.name}</h2>
    <BattleArea nation={currentNation} />
    {!currentNation.isNPC && (
      <CommandPanel
        commands={currentNation.domesticCommands}
        onCommandSelect={handleCommandSelect}
      />
    )}
    {currentNation.isNPC && (
      <div className="npc-thinking">NPC思考中...</div>
    )}
  </div>
);
```

### 3. 重複選択の防止
連続クリックによる重複入力を防止する仕組みが必要です。

**修正案**:
```typescript
const [isProcessing, setIsProcessing] = useState(false);

const handleCommandSelect = (command: Command) => {
  if (isProcessing) return;
  setIsProcessing(true);
  completeInput(command);
};
```

### 4. エラーハンドリング
`completeInput`呼び出し時のエラーハンドリングを追加。

**修正案**:
```typescript
const handleCommandSelect = (command: Command) => {
  try {
    if (isProcessing) return;
    setIsProcessing(true);
    completeInput(command);
  } catch (error) {
    console.error('Failed to complete input:', error);
    setIsProcessing(false);
  }
};
```

## テストの実行状態

現在のテストは**Red状態**（失敗）です。これは期待通りの状態で、TDD（テスト駆動開発）のアプローチに従っています。

### 失敗するテスト（実装後に成功すべき）
- ✗ テスト4: コマンド選択後、completeInputが呼ばれる
- ✗ テスト5: 選択されたコマンドが正しく引数として渡される
- ✗ テスト6: NPC国家のターンの場合、CommandPanelが表示されない
- ✗ エッジケース3: 複数回コマンドを選択した場合（最初の1回のみ有効）

### 成功するテスト（既に動作している）
- ✓ テスト1: プレイヤーターンの場合、CommandPanelが表示される
- ✓ テスト2: 選択可能なコマンド一覧が正しく表示される
- ✓ テスト3: コマンドを選択すると、そのコマンドIDが取得される
- ✓ エッジケース1: コマンドが存在しない場合のハンドリング
- ✓ 統合テスト1-3: 状態管理の基本動作

## 次のステップ

1. **実装フェーズ**: 上記の修正案を参考に、`DomesticScreen.tsx`を実装
2. **テスト実行**: 実装後、全てのテストがGreen（成功）になることを確認
3. **リファクタリング**: テストが通った後、コードの品質を向上

## 補足: アーキテクチャとの整合性

本テストは、プロジェクトの「非同期連携アーキテクチャ」に準拠しています：

- **Logic Layer**: コマンド選択はUIイベント
- **Bridge Layer**: `completeInput` → `ReactUIBridge.resolvePlayerInput` → `GameManager`のPromise解決
- **Process Layer**: GameManagerが`await`から再開し、選択されたコマンドを実行

これにより、ユーザーの入力を待ってからゲームロジックが進行する、人間に優しいゲーム進行が実現されます。
