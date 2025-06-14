# 拍子に応じた小節拍数とコード表示幅の修正

## 作業日時
2025-06-14

## 対応内容

### 問題
- 拍子を3/4に変更しても、1小節の拍数が4拍のまま表示される
- コードの表示幅が常に25%固定で、拍子に応じて変わらない
- 既存データで拍子とbeatsPerBarが不整合になっている

### 解決策

#### 1. 拍子変更時の自動更新機能
- `ChordChartEditor.tsx`の`handleBasicInfoChange`で拍子変更を検知
- 拍子が変更された際に全セクションの`beatsPerBar`を自動更新

#### 2. 表示時の動的計算
- `ChordChart.tsx`の`renderChordGrid`で拍子から正しい拍数を計算
- セクションの`beatsPerBar`が古い値の場合、拍子から再計算してフォールバック

#### 3. データ作成時の拍数設定
- `chordUtils.ts`の`createEmptySection`に`timeSignature`パラメータを追加
- 新規セクション作成時に拍子に応じた正しい`beatsPerBar`を設定

#### 4. 既存データの自動移行
- `migrateChartData`関数を追加して既存データを修正
- `storage.ts`のデータ読み込み時に自動的に移行処理を実行

### 技術的詳細

#### 修正されたファイル
- `src/components/ChordChart.tsx`: 表示時の拍数計算修正
- `src/components/ChordChartEditor.tsx`: 拍子変更時の更新処理追加
- `src/utils/chordUtils.ts`: セクション作成とデータ移行処理
- `src/utils/storage.ts`: 読み込み時の自動移行
- `src/utils/__tests__/storage.test.ts`: テスト修正

#### 表示幅の計算式
```typescript
const widthPercentage = (chordDuration / beatsPerBar) * 100;
```

- 3/4拍子: 1拍=33.33%, 2拍=66.67%, 3拍=100%
- 4/4拍子: 1拍=25%, 2拍=50%, 3拍=75%, 4拍=100%

### テスト結果
- 全84テスト通過
- ESLintエラーなし
- TypeScriptエラーなし

### PR情報
- ブランチ: `fix/time-signature-beats`
- PR番号: #13
- マージ済み

## 学習・改善点
- 既存データの移行処理の重要性を再認識
- 表示時のフォールバック処理で古いデータも正しく表示できる
- 拍子変更時の連動処理でUXが向上