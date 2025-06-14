# 初期状態を空のコード譜に変更

**日付**: 2025-06-14  
**対応者**: Claude Code  
**PR**: #11  
**ブランチ**: fix/empty-initial-state  
**タスク**: 初期状態を空のコード譜に変更（サンプル楽譜を削除）

## 概要

アプリケーションの初期状態を改善し、初回ユーザーにとってより直感的な体験を提供するため、サンプル楽譜を削除して空の状態から開始するよう変更しました。

## 課題

### Before（問題点）
- 初回起動時にサンプル楽譜が2つ表示される
- ユーザーが作成した楽譜との区別がつかない
- 不要なサンプルデータがユーザーの楽譜リストを汚染
- 新規ユーザーが何をすべきか分からない

### After（解決後）
- 初回起動時は完全に空の状態
- 新規作成への明確な誘導メッセージ
- ユーザーが作成した楽譜のみが表示される
- 直感的で分かりやすいファーストエクスペリエンス

## 実装内容

### 1. サンプルデータの削除
**ファイル**: `src/data/sampleCharts.ts`

```typescript
// Before: 2つのサンプル楽譜（Let It Be, Wonderwall）
export const sampleCharts: ChordChart[] = [
  // ... 87行のサンプルデータ
];

// After: 空の配列
export const sampleCharts: ChordChart[] = [];
```

### 2. 空の状態UI改善
**ファイル**: `src/components/ChordChart.tsx`

```typescript
// Before
<h3>コード譜が選択されていません</h3>
<p>左のサイドバーからコード譜を選択してください</p>

// After  
<h3>コード譜がありません</h3>
<p>まずは新しいコード譜を作成してみましょう</p>
<button onClick={onCreateNew}>新規作成</button>
```

### 3. 新規作成機能の統合
**新規コンポーネント**: `ChordChartWithForm`

```typescript
const ChordChartWithForm: React.FC<ChordChartProps> = (props) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const handleCreateNew = () => {
    if (props.onCreateNew) {
      props.onCreateNew();
    } else {
      setShowCreateForm(true);
    }
  };

  return (
    <>
      <ChordChart {...props} onCreateNew={handleCreateNew} />
      {showCreateForm && (
        <ChordChartForm onSave={handleCreateChart} onCancel={handleCancelCreate} />
      )}
    </>
  );
};
```

## テスト修正

### 表示メッセージの更新
**ファイル**: `src/components/__tests__/ChordChart.test.tsx`

```typescript
// 期待されるメッセージを新しいものに更新
expect(screen.getByText('コード譜がありません')).toBeInTheDocument();
expect(screen.getByText('まずは新しいコード譜を作成してみましょう')).toBeInTheDocument();
```

### ストア統合テストの修正
**ファイル**: `src/stores/__tests__/chordChartStore.test.ts`

```typescript
// サンプルデータが空になったことに対応
it('should load empty data when storage is empty and no sample data', async () => {
  // ...
  expect(Object.keys(state.charts).length).toBe(0);
  expect(state.currentChartId).toBeNull();
});
```

## UX設計の考慮点

### ユーザージャーニーの改善
1. **初回起動**：空の状態で「新規作成」ボタンが目立つ位置に配置
2. **作成促進**：分かりやすいメッセージでアクション誘導
3. **一貫性**：MainLayoutの新規作成機能と統合

### アクセシビリティ配慮
- 明確なアクションボタン
- 理解しやすいメッセージング
- 直感的なフロー設計

## 技術的な実装詳細

### コンポーネント設計
- **責任分離**：ChordChartは表示、ChordChartWithFormは状態管理
- **再利用性**：既存のChordChartFormコンポーネントを活用
- **柔軟性**：onCreateNewプロップで外部制御も可能

### 状態管理
- 既存のZustandストア設計をそのまま活用
- 空のsampleChartsでも正常に動作する設計
- エラーハンドリングも既存の仕組みを継承

## パフォーマンス影響

### 改善点
- **初期読み込み軽量化**：サンプルデータ削除により初期バンドルサイズ削減
- **メモリ使用量削減**：不要なサンプルオブジェクトがメモリに残らない
- **ストレージ効率化**：localforageに無駄なデータが保存されない

## テスト結果

```
Test Files: 6 passed (6)
Tests: 84 passed (84)
Duration: 1.14s

✅ すべてのテストがパス
✅ 既存機能への影響なし
✅ 新機能の動作確認済み
```

## 今後の改善点

### 短期的改善
1. **オンボーディング強化**：初回ユーザー向けのツアー機能
2. **テンプレート機能**：よく使われるコード進行のテンプレート提供
3. **インポート機能**：他の形式からのコード譜インポート

### 長期的改善
1. **ユーザーガイド**：チュートリアル動画やヘルプドキュメント
2. **サンプル表示オプション**：設定でサンプル表示を選択可能に
3. **クイックスタート**：よく使われる楽曲のテンプレート集

## まとめ

本実装により、初回ユーザーにとってより直感的で分かりやすいアプリケーションを実現しました。サンプルデータの削除により、ユーザーが作成した楽譜のみが表示され、明確な新規作成の誘導により、スムーズなオンボーディング体験を提供できます。

全84テストがパスしており、既存機能への影響もなく、安全にリリース可能な状態です。