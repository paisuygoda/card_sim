# Task 1-5: コマンド情報の詳細表示（CommandPanel 改善）

## 概要
`CommandPanel` にコスト表示・実行可否判定・効果説明表示・ホバー詳細を追加する。

---

## 1. 実装前に必要な型定義・データモデルの変更

### `Command` 型への表示用フィールド追加
**ファイル**: `src/core/domain/models/Command.ts`

```typescript
export interface Command {
  // ... 既存フィールド ...
  
  // ↓ 追加（UI表示用オプションフィールド）
  description?: string;  // 例: "ユニット1体を自国に召喚する"
}
```

**根拠**: `copilot-instructions.md` の「UI表示のための型定義追加は可」に該当。  
コアロジック（`validateCommand`, `EffectExecutor` 等）はこのフィールドを参照しないため、追加による影響はない。

### `CommandMaster` へのメタデータ追記
**ファイル**: `src/core/domain/master/CommandMaster.ts`

既存の全コマンドエントリに `description` を追加する（オプションフィールドのため、未記述でも型エラーにならない）。

例:
```typescript
"train": {
  commandId: "train",
  name: "訓練",
  description: "国力を消費してユニットの攻撃力を強化する",  // 追加
  // ...
}
```

---

## 2. 実装手順

### Step 1: テストを先に書く
**ファイル**: `src/ui/components/__tests__/CommandPanel.test.tsx`（新規作成）

テストケース：
- コマンドリストが全件表示される
- 各コマンドに `name` が表示される
- 各コマンドに `costPower` が表示される（例: `「国力: 10」`）
- `costAction > 0` のとき行動コストが表示される（例: `「行動: 1」`）
- `currentPower >= costPower` かつ `remainingActions >= costAction` のとき、ボタンが有効（`disabled=false`）
- `currentPower < costPower` のとき、ボタンが無効（`disabled=true`）でスタイルが変わる
- `remainingActions < costAction` のとき、ボタンが無効
- `disabled=true` Props のとき、全ボタンが無効
- ボタンクリックで `onCommandSelect(command)` が呼ばれる
- `description` が存在するとき、`title` 属性に設定される

### Step 2: `CommandPanel` の Props 拡張
**ファイル**: `src/ui/components/CommandPanel.tsx`

Props に実行可否判定に必要な情報を追加：

```typescript
interface CommandPanelProps {
  commands: Command[];
  onCommandSelect: (command: Command) => void;
  disabled?: boolean;
  currentPower: number;        // 追加: 国力（コスト判定用）
  remainingActions: number;    // 追加: 残り内政回数（コスト判定用）
}
```

**実行可否判定ロジック**:
```typescript
const canExecute = (command: Command): boolean => {
  if (disabled) return false;
  if (command.costPower > currentPower) return false;
  if (command.costAction > remainingActions) return false;
  return true;
};
```

### Step 3: 表示実装

各コマンドボタンの表示構造：
```
CommandButton
├── commandName          command.name
├── costInfo
│   ├── powerCost        "国力: {costPower}"
│   └── actionCost       "行動: {costAction}" （costAction > 0 の場合のみ）
└── [title属性]          command.description（ホバーでツールチップ表示）
```

実行不可時のスタイル：
- `disabled` 属性でボタンを無効化
- CSSクラス `command-button--disabled` で視覚的に薄表示

```tsx
<button
  key={command.commandId}
  onClick={() => canExecute(command) && onCommandSelect(command)}
  disabled={!canExecute(command)}
  className={`command-button ${!canExecute(command) ? 'command-button--disabled' : ''}`}
  title={command.description}
>
  <span className="command-name">{command.name}</span>
  <span className="command-cost">
    国力: {command.costPower}
    {command.costAction > 0 && ` / 行動: ${command.costAction}`}
  </span>
</button>
```

### Step 4: `DomesticScreen` からの Props 渡し
**ファイル**: `src/ui/features/DomesticScreen.tsx`

```typescript
<CommandPanel
  commands={currentNation.domesticCommands || []}
  onCommandSelect={handleCommandSelect}
  disabled={isSelecting}
  currentPower={currentNation.power}          // 追加
  remainingActions={currentNation.remainingActions}  // 追加
/>
```

### Step 5: `CommandMaster` への description 追記
**ファイル**: `src/core/domain/master/CommandMaster.ts`

既存コマンド全件に `description` を追記する。各コマンドの `effects` 配列を参照して自然言語の説明を作成する。

---

## 3. 実装時の注意点・制約

- **実行可否判定はUI層のみで行う**。コアロジックの `validateCommand` は既存のバリデーション用であり変更しない。UI層の「表示上の実行可否」と、コアロジックの実際の実行バリデーションは別物として扱う
- `costAction=0` のコマンドは行動コスト表示を省略する（`costAction > 0` の場合のみ表示）
- `DomesticScreen` の既存テスト（`DomesticScreen.test.tsx`）では `CommandPanel` をモック化しているため、`CommandPanel` の Props 変更が既存テストに影響しない。ただし `DomesticScreen.tsx` での `CommandPanel` の呼び出し変更により、モックの型チェックが必要な場合は確認すること
- 行動コマンド（`actionCommands`）を表示する画面がある場合（`BattleScreen` 等）でも同様の変更が必要。Phase 1 スコープでは `DomesticScreen` のみ対応し、他は TODO コメントを追加する

---

## 4. テスト観点

| # | テスト内容 | 優先度 |
|---|-----------|--------|
| T1 | コマンド名が表示される | 🔴必須 |
| T2 | `costPower` が表示される | 🔴必須 |
| T3 | `costAction > 0` のとき行動コストが表示される | 🔴必須 |
| T4 | `costAction = 0` のとき行動コストが表示されない | 🟡推奨 |
| T5 | 国力不足でボタンが `disabled` になる | 🔴必須 |
| T6 | 行動回数不足でボタンが `disabled` になる | 🔴必須 |
| T7 | 両コスト充足時にボタンが有効 | 🔴必須 |
| T8 | `disabled=true` Props で全ボタン無効 | 🔴必須 |
| T9 | ボタンクリックで `onCommandSelect` が呼ばれる | 🔴必須 |
| T10 | `description` がある場合、`title` 属性に設定される | 🟡推奨 |
| T11 | 不可能なコマンドをクリックしても `onCommandSelect` が呼ばれない | 🔴必須 |

---

## 5. 完了条件

- [ ] `Command` 型に `description?: string` が追加されている
- [ ] `CommandMaster` の全コマンドに `description` が記述されている（オプションのため部分的でも可）
- [ ] `CommandPanel` が `currentPower`, `remainingActions` を受け取る
- [ ] 国力/行動回数不足のコマンドが視覚的に無効化される
- [ ] 各コマンドにコスト（国力、行動）が表示される
- [ ] `description` がホバー時に表示される（`title` 属性）
- [ ] `DomesticScreen` が正しい Props を `CommandPanel` に渡している
- [ ] TypeScript コンパイルエラーがない
- [ ] 全テストがパスしている（既存の `DomesticScreen.test.tsx` も含む）
