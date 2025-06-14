# アプリケーション名変更 - 2025-06-14

## 目的
アプリケーション名を「Nekogata Score Manager」に変更する。

## 実装内容

### 変更対象ファイル
1. **index.html** - HTMLドキュメントタイトル
2. **vite.config.ts** - PWA設定（name, short_name）
3. **src/layouts/MainLayout.tsx** - メインUIヘッダー

### 変更詳細

#### 1. HTMLドキュメントタイトル (index.html:7)
```html
<!-- 変更前 -->
<title>Vite + React + TS</title>

<!-- 変更後 -->
<title>Nekogata Score Manager</title>
```

#### 2. PWA設定 (vite.config.ts:13-14)
```typescript
// 変更前
manifest: {
  name: 'Chord Chart App',
  short_name: 'ChordChart',
  // ...
}

// 変更後
manifest: {
  name: 'Nekogata Score Manager',
  short_name: 'NekogataScore',
  // ...
}
```

#### 3. メインUIヘッダー (MainLayout.tsx:46)
```tsx
<!-- 変更前 -->
<h1 className="text-xl font-semibold text-gray-900">Chord Chart</h1>

<!-- 変更後 -->
<h1 className="text-xl font-semibold text-gray-900">Nekogata Score Manager</h1>
```

## 検証結果
- ✅ Lint: 問題なし
- ✅ Build: 正常にビルド完了
- ✅ Tests: 98テスト全て成功

## 影響範囲
- ブラウザタブのタイトル表示
- PWAアプリ名とショートカット名
- メインアプリケーションヘッダー表示
- package.jsonの名前は開発用のため変更せず維持

## 完了
アプリケーション名の変更が完了し、すべてのテストが通過しました。