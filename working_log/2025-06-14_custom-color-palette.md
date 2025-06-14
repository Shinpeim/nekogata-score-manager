# 2025-06-14 Custom Color Palette Implementation

## 概要

UIの色が「ガチャガチャしている」という問題を解決するため、指定された3色のカスタムカラーパレットに統一しました。

## 新しいカラーパレット

### 3色限定のカスタムカラー

1. **Teal (#85B0B7)** - メイン機能
   - 新規作成、編集、保存ボタン
   - 選択状態のチェックボックス
   - プライマリアクション
   - ホバー時: #6B9CA5

2. **Sage (#BDD0CA)** - セカンダリ機能
   - インポート、確定ボタン
   - タグ、情報表示
   - セクション追加ボタン
   - ホバー時: #A4C2B5
   - テキスト色: slate-800（コントラスト確保）

3. **Coral (#EE5840)** - 削除・エラー
   - 削除ボタン
   - エラー表示
   - 警告・注意表示
   - ホバー時: #D14A2E

## 変更内容

### CLAUDE.mdへのガイドライン追加
- カスタムカラーパレットの定義
- Tailwindのarbitrary values使用方法
- 機能別色分けルール
- アクセシビリティガイドライン

### 変更されたファイル

1. **MainLayout.tsx**
   - blue系 → Teal (#85B0B7)
   - emerald/purple系 → Sage (#BDD0CA)
   - indigo系 → Teal (#85B0B7)
   - rose系 → Coral (#EE5840)

2. **ImportDialog.tsx**
   - インポートボタン: emerald → Sage (#BDD0CA)

3. **ChordChartForm.tsx**
   - 作成/更新ボタン: blue → Teal (#85B0B7)
   - エラー表示: rose → Coral (#EE5840)

4. **ChordChart.tsx**
   - 編集ボタン: blue → Teal (#85B0B7)
   - 削除ボタン: rose → Coral (#EE5840)

5. **ChordChartEditor.tsx**
   - 保存ボタン: blue → Teal (#85B0B7)
   - セクション追加: emerald → Sage (#BDD0CA)
   - 削除ボタン: rose → Coral (#EE5840)

6. **BpmIndicator.tsx**
   - アクティブ状態: blue → Teal (#85B0B7)

## 実装の詳細

### Tailwind Arbitrary Values
```css
/* カスタムカラーの実装例 */
bg-[#85B0B7] hover:bg-[#6B9CA5] text-white    /* Teal */
bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 /* Sage */
bg-[#EE5840] hover:bg-[#D14A2E] text-white     /* Coral */
```

### 統一されたルール
- 同じ機能には必ず同じ色を使用
- ホバー状態は10-15%暗い色
- テキストとのコントラスト比4.5:1以上を確保
- Sage色では白文字が読みづらいため、slate-800を使用

## 結果

- 以前: 5色以上（blue, emerald, indigo, rose, purple）が混在
- 現在: 3色のみで統一感のあるデザイン
- より洗練され、機能別に直感的な色分けを実現