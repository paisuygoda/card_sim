# Task 1-3: ユニット基本情報の表示（UnitCard 改善）

## 概要
`UnitCard.tsx` のランタイムクラッシュバグを最優先で修正し、HPバー・ポジション表示・スキル情報表示を実装する。

---

## 1. 実装前に必要な型定義・データモデルの変更

**型定義の変更は不要。**

- `Unit.skillId: string`（既存）→ `MasterData.getSkill(unit.skillId)` でルックアップ
- `Skill.name`, `Skill.targetPattern`, `Skill.damageRate` はすべて既存フィールド
- `Unit.currentHP`, `Unit.maxHP`, `Unit.attack` はすべて既存フィールド

---

## 2. 実装手順

### Step 1: テストを先に書く
**ファイル**: `src/ui/components/__tests__/UnitCard.test.tsx`（新規作成）

テストケース：
- `unit=null` のとき「空」が表示される
- `unit.name='足軽'` が表示される
- `unit.currentHP=70`, `unit.maxHP=100` のとき `70 / 100` が表示される
- HPバーの幅が `70%` に相当する値を持つ（`style.width` または `aria-valuenow`）
- `unit.attack=15` が表示される
- `unit.skillId='normalAttack'` のとき「通常攻撃」が表示される
- `position='front'` のとき「前衛」が表示される
- `position='bench'` のとき「ベンチ」が表示される
- `unit.skillId` に対応するスキルが `SKILL_MASTER` に存在しない場合、クラッシュせずフォールバック表示される
- `onClick` が呼ばれる

### Step 2: バグ修正（最優先）
**ファイル**: `src/ui/components/UnitCard.tsx`

**現在のバグ**:
```typescript
// ❌ Unit 型に skill プロパティは存在しない
<p>スキル: {unit.skill.name}</p>
```

**修正方法**:
```typescript
import { MasterData } from '@core/domain/master';

// ✅ skillId からスキルをルックアップ
const skill = MasterData.getSkill(unit.skillId);
<p>スキル: {skill.name}</p>
```

**ただし `MasterData.getSkill` は存在しないIDで例外を投げる**ため、フォールバック処理が必要：
```typescript
const getSkillName = (skillId: string): string => {
  try {
    return MasterData.getSkill(skillId).name;
  } catch {
    return skillId; // フォールバック: スキルID文字列をそのまま表示
  }
};
```

### Step 3: HPバーの実装
```tsx
<div className="hp-bar-container" role="progressbar" aria-valuenow={unit.currentHP} aria-valuemax={unit.maxHP}>
  <div
    className="hp-bar"
    style={{ width: `${(unit.currentHP / unit.maxHP) * 100}%` }}
  />
</div>
```

HP割合に応じた色変化（CSS クラス）:
- 100%〜50%: `hp-bar--high`（緑）
- 49%〜25%: `hp-bar--mid`（黄）
- 24%〜0%: `hp-bar--low`（赤）

### Step 4: ポジション表示の実装

```typescript
const positionLabelMap: Record<UnitCardProps['position'], string> = {
  front: '前衛',
  mid: '中衛',
  back: '後衛',
  bench: 'ベンチ',
};
```

ポジションバッジとしてカードの左上に表示する。

### Step 5: スキル情報のホバー表示（詳細）

スキル詳細は `title` 属性またはカスタムツールチップで表示する。
Phase 1 スコープ内では `title` 属性による HTML ネイティブツールチップで十分。

```tsx
<p
  className="unit-skill"
  title={`ダメージ倍率: ${skill.damageRate} / 対象: ${skill.targetPattern}`}
>
  スキル: {skill.name}
</p>
```

### Step 6: 完成形のコンポーネント構造

```
UnitCard
├── positionBadge        "前衛" / "中衛" / "後衛" / "ベンチ"
├── unitName             unit.name
├── hpSection
│   ├── hpText           "{currentHP} / {maxHP}"
│   └── hpBar            幅 = (currentHP / maxHP) * 100%
├── attackText           "攻撃力: {attack}"
└── skillText            "スキル: {skillName}"（hoverでdamageRate/target表示）
```

---

## 3. 実装時の注意点・制約

- `MasterData` は `@core/domain/master` からインポート可（`src/ui/` → `src/core/` は許可されている）
- `MasterData.getSkill` は `SKILL_MASTER` から取得するため、マスターデータに存在しないIDの場合は例外が発生する。UI層ではクラッシュさせず try-catch でフォールバックすること
- HPバーの幅計算で `maxHP=0` の場合（異常データ）に `NaN` が出ないよう `maxHP > 0` チェックを行う
  ```typescript
  const hpPercent = unit.maxHP > 0 ? (unit.currentHP / unit.maxHP) * 100 : 0;
  ```
- `Unit.states` の表示は Phase 1 スコープ外（TODO コメントとして残す）

---

## 4. テスト観点

| # | テスト内容 | 優先度 |
|---|-----------|--------|
| T1 | `unit=null` で空スロット表示 | 🔴必須 |
| T2 | ユニット名が表示される | 🔴必須 |
| T3 | HP数値（`70 / 100` 形式）が表示される | 🔴必須 |
| T4 | HPバーの幅が HP 割合に比例する | 🔴必須 |
| T5 | 攻撃力が表示される | 🔴必須 |
| T6 | `skillId='normalAttack'` → 「通常攻撃」が表示される | 🔴必須 |
| T7 | `position='front'` → 「前衛」が表示される | 🔴必須 |
| T8 | 存在しない `skillId` でクラッシュしない（フォールバック表示） | 🔴必須 |
| T9 | `maxHP=0` の異常データで `NaN%` が出ない | 🟡推奨 |
| T10 | `onClick` ハンドラが呼ばれる | 🟡推奨 |

---

## 5. 完了条件

- [ ] `unit.skill.name` のランタイムクラッシュが解消されている
- [ ] `MasterData.getSkill(unit.skillId)` でスキル名を正しく表示する
- [ ] 存在しない skillId の場合にクラッシュしない
- [ ] HPバーが現在HP割合で幅変化する
- [ ] HPバーがHP割合に応じて色変化する（緑/黄/赤）
- [ ] ポジション（前衛/中衛/後衛/ベンチ）が表示される
- [ ] TypeScript コンパイルエラーがない
- [ ] 全テストがパスしている
