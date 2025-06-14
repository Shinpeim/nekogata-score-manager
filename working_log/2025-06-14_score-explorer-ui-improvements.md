# Score Explorer UI/UX改善

## 実装日時
2025-06-14

## 実装内容

### Gmail風一括選択UI
1. **一括選択チェックボックス**
   - 「全て選択」テキストボタンをチェックボックスに置き換え
   - 全選択時は✓、部分選択時は中間状態（indeterminate）、未選択時は空のチェックボックス表示
   - 「一括選択」ラベルを横に配置してUIの意図を明確化

### プルダウン式アクションボタン
1. **アクション統合**
   - 「選択したチャートを削除」「選択したチャートをエクスポート」の個別ボタンを削除
   - プルダウン式「アクション」ボタンに統合
   - ドロップダウンアイコンのみでコンパクトなUI

2. **状態管理改善**
   - アクションボタンを常に表示
   - 未選択時はグレーアウトして無効化
   - 選択件数表示も常時表示（未選択時は「未選択」）
   - 要素の出現・消失によるレイアウト変動を解消

3. **操作性向上**
   - 外側クリックでプルダウンが閉じる機能実装
   - useEffect + useRefによるイベントハンドリング

### レイアウト最適化
1. **Score Explorer横幅拡張**
   - デスクトップ版の横幅を256px（w-64）から320px（w-80）に拡張
   - より多くの情報を表示可能に

2. **不要なUI要素削除**
   - 「選択解除」ボタンを削除（一括選択チェックボックスで代替）
   - 冗長なアクションボタンを統合

## 技術的な実装

### 新規追加された状態管理
```typescript
const [showActionsDropdown, setShowActionsDropdown] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
```

### 外側クリック検出
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowActionsDropdown(false);
    }
  };
  // ...
}, [showActionsDropdown]);
```

### 動的スタイル制御
- 選択状態に応じたボタンの色・状態制御
- disabled属性とカーソルスタイルの組み合わせ
- 中間状態（indeterminate）チェックボックスの実装

## ファイル変更
- `src/layouts/MainLayout.tsx`: 大幅なUI改修
  - モバイル・デスクトップ両対応
  - 状態管理ロジックの追加
  - レイアウト最適化

## その他の改善
- ユーザビリティの大幅向上
- 視覚的一貫性の確保
- アクセシビリティ（title属性、適切なaria-label）

## 今後の課題
- カラーパレットの統一
- アニメーション効果の追加
- さらなるユーザビリティ向上