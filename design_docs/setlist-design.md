# セットリスト機能設計

## 概要

コード譜管理アプリ「Nekogata Score Manager」にセットリスト機能を追加する。
既存の楽譜管理機能を拡張し、ライブやセッション用の楽譜セットを作成・管理できるようにする。

## UI設計

### 1. [楽譜]タブ（既存機能拡張）

```
┌─[楽譜]─[セットリスト]─────────┐
│ Score Explorer                │
├─────────────────────────────┤
│ ☑ 一括選択    ⚙3件選択中    │  ← ActionDropdownに「セットリスト作成」追加
│                             │
│ ☑ Song A (Key: C)          │
│   Artist: John             │
│ ☑ Song B (Key: G)          │
│   Artist: Jane             │
│ ☐ Song C (Key: Am)         │
│   Artist: Bob              │
│                             │
│ [新規作成] [インポート]      │
└─────────────────────────────┘
```

**ActionDropdown追加項目**：
- エクスポート（既存）
- 削除（既存）
- 複製（既存）
- **→ セットリスト作成**（新規）

### 2. [セットリスト]タブ（新規）

```
┌─[楽譜]─[セットリスト]─────────┐
│ ▼ Live Set 2024-06      [×] │  ← セットリスト選択+削除
│   (3曲)                     │
├─────────────────────────────┤
│ ⋮⋮ 1. Song D (Key: F)      │  ← D&D取っ手+順序番号
│      Artist: John          │
│ ⋮⋮ 2. Song E (Key: C)      │
│      Artist: Jane          │
│ ⋮⋮ 3. Song F (Key: G)      │
│      Artist: Bob           │
│                             │
│ ※セットリスト未選択時は     │
│ 「セットリストを選択して     │
│  ください」表示             │
└─────────────────────────────┘
```

### 3. セットリスト選択ドロップダウン

```
┌─ セットリスト選択 ────────┐
│ ✓ Live Set 2024-06  [×] │  ← 現在選択中+削除ボタン
│   アコースティック   [×] │
│   練習用セット      [×] │
│   (セットリストなし)    │  ← 未選択状態
└─────────────────────────┘
```

**並び順**: セットリスト名の昇順（日本語・英語混在対応）

### 4. セットリスト作成フロー

1. [楽譜]タブで複数楽譜選択
2. ActionDropdown → [セットリスト作成]
3. **インライン入力**：「セットリスト名: [入力フィールド]」
4. Enter/保存 → セットリスト作成 → [セットリスト]タブに自動切り替え

## データモデル設計

### SetList型定義

```typescript
interface SetList {
  id: string;                    // ユニークID（'setlist-' + timestamp + random）
  name: string;                  // セットリスト名
  chartIds: string[];            // 楽譜IDの配列（順序を保持）
  createdAt: Date;               // 作成日時
}

interface SetListLibrary {
  [key: string]: SetList;        // SetList.idをキーとした辞書
}
```

### 既存型との関係

- `ChordChart`: 既存の楽譜データ型（変更なし）
- `SetList.chartIds`: `ChordChart.id`の配列として参照関係を構築

## 技術的設計

### 1. Zustandストア設計

```typescript
// 新規ストア: src/stores/setListStore.ts
interface SetListState {
  setLists: SetListLibrary;
  currentSetListId: string | null;
  
  // アクション
  createSetList: (name: string, chartIds: string[]) => Promise<void>;
  deleteSetList: (id: string) => Promise<void>;
  updateSetListOrder: (id: string, newChartIds: string[]) => Promise<void>;
  setCurrentSetList: (id: string | null) => void;
  loadFromStorage: () => Promise<void>;
}
```

### 2. LocalForage設計

```typescript
// 保存キー
const SETLIST_STORAGE_KEY = 'nekogata-setlists';

// 保存データ構造
interface StoredSetListData {
  version: string;              // マイグレーション用
  setLists: SetListLibrary;
  currentSetListId: string | null;
}
```

### 3. Dropbox同期設計

```typescript
// 同期ファイル名
const SETLIST_SYNC_FILENAME = 'setlists.json';

// 同期対象データ
interface SyncSetListData {
  version: string;
  setLists: SetListLibrary;
  syncedAt: string;             // ISO 8601形式
}

// 同期機能統合
// 既存のsyncStoreを拡張してセットリストデータも同期対象に含める
interface SyncState {
  // 既存のcharts同期機能
  charts: ChordLibrary;
  // 新規追加：セットリスト同期機能
  setLists: SetListLibrary;
  // ... 他の既存機能
}
```

**同期タイミング**：
- セットリスト作成時
- セットリスト削除時
- セットリスト順序変更時

### 4. コンポーネント設計

#### 新規コンポーネント

```
src/components/
├── SetListTab.tsx              // セットリストタブのメインコンポーネント
├── SetListSelector.tsx         // セットリスト選択ドロップダウン
├── SetListChartItem.tsx        // セットリスト内の楽譜アイテム（D&D対応）
└── SetListCreationForm.tsx     // セットリスト作成フォーム（インライン）
```

#### 既存コンポーネント拡張

```
src/layouts/
├── ScoreExplorer.tsx           // タブ機能追加
└── ActionDropdown.tsx          // セットリスト作成アクション追加
```

## 実装計画

### Phase 1: 基盤実装（Week 1）

1. **データモデル実装**
   - `src/types/setList.ts`作成
   - SetList型定義

2. **Zustandストア実装**
   - `src/stores/setListStore.ts`作成
   - 基本CRUD操作実装

3. **LocalForage連携**
   - `src/utils/setListStorage.ts`作成
   - 永続化機能実装

### Phase 2: UI基礎実装（Week 2）

4. **タブ機能追加**
   - ScoreExplorerにタブ切り替え機能追加
   - セットリストタブの基本構造実装

5. **セットリスト選択機能**
   - SetListSelector.tsxコンポーネント作成
   - ドロップダウンUI実装（名前昇順ソート）

6. **セットリスト作成機能**
   - ActionDropdownにセットリスト作成追加
   - インライン作成フォーム実装

7. **Dropbox同期連携**
   - 既存syncStoreにセットリスト同期機能追加
   - セットリストデータの同期タイミング実装

### Phase 3: 高度な機能実装（Week 3）

8. **D&D機能実装**
   - @dnd-kitによる順序変更機能
   - SetListChartItem.tsxコンポーネント作成

9. **セットリスト表示機能**
   - セットリスト内楽譜一覧表示
   - 楽譜クリック→表示切り替え連携

10. **削除機能実装**
    - セットリスト削除機能
    - 確認ダイアログ実装

### Phase 4: 統合・テスト・最適化（Week 4）

11. **テスト実装**
    - ユニットテスト作成
    - E2Eテスト追加

12. **モバイル対応**
    - レスポンシブデザイン調整
    - モバイルでのD&D操作最適化

13. **パフォーマンス最適化**
    - 大量セットリスト時の最適化
    - メモリ使用量最適化

## 操作フロー

### セットリスト作成
1. [楽譜]タブで楽譜を複数選択
2. ActionDropdown → [セットリスト作成]
3. セットリスト名入力
4. Enter → セットリスト作成完了
5. [セットリスト]タブに自動切り替え

### セットリスト表示・操作
1. [セットリスト]タブ選択
2. ドロップダウンでセットリスト選択
3. セットリスト内楽譜一覧表示
4. D&Dで順序変更
5. 楽譜クリック → メイン表示切り替え

### セットリスト削除
1. セットリスト選択ドロップダウン展開
2. 削除したいセットリストの[×]ボタンクリック
3. 確認ダイアログ → 削除実行

## UI/UXの配慮事項

### レスポンシブデザイン
- モバイルでもD&D操作が快適
- タブ切り替えがタッチデバイスで操作しやすい
- セットリスト選択ドロップダウンのタッチ対応

### アクセシビリティ
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 適切なaria-label設定

### パフォーマンス
- 大量セットリスト時の仮想化検討
- D&D操作時のスムーズなアニメーション
- 楽譜表示切り替えの高速化

## 将来の拡張可能性

### セットリスト機能拡張
- セットリスト複製機能
- セットリストエクスポート・インポート
- セットリスト編集機能（楽譜追加・削除）の復活検討

### 高度な機能
- セットリスト共有機能
- セットリスト統計（演奏時間等）
- セットリストテンプレート機能

---

この設計により、既存機能を損なうことなく、直感的で使いやすいセットリスト機能を追加できます。