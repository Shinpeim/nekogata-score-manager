# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview
This is "Nekogata Score Manager", a chord chart management application built as a Progressive Web App (PWA) for creating, editing, and managing musical chord charts entirely in the browser.

**Core Features:**
- コード譜の作成・編集・閲覧
- 移調機能（楽曲キーの変更）
- インポート・エクスポート機能
- ドラッグ&ドロップによる並び替え
- オフライン対応（PWA）
- モバイル対応（レスポンシブデザイン）

**Technical Requirements:**
- Browser-only operation (no backend)
- Local storage using LocalForage
- Mobile-first responsive design
- Offline capability via PWA

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server with HMR
npm run build        # TypeScript compilation + Vite production build
npm run lint         # ESLint code quality check
npm test             # Run all tests with Vitest
npm run test:ui      # Run tests with UI interface
npm run test:coverage # Run tests with coverage report
npm run preview      # Preview production build locally
```

### Single Test Execution
```bash
npx vitest run path/to/test.test.ts              # Run specific test file
npx vitest run --grep "test name pattern"        # Run tests matching pattern
npx vitest run src/utils/__tests__/export.test.ts       # Example: run export tests
npx vitest run src/utils/__tests__/import.test.ts       # Example: run import tests
```

## Architecture Overview

### State Management
分離されたZustandストアによる責務別アーキテクチャ：
- **chartDataStore**: データのみ管理（charts, currentChartId）
- **chartCrudStore**: CRUD操作とLocalForage永続化 
- **syncStore**: Google Drive同期機能専用
- **統合フック**: `useChartManagement`で既存コンポーネントとの互換性維持
- **サービス層**: 依存性注入によるビジネスロジック分離（chartCrudService）

### Component Architecture
```
MainLayout (orchestrates layout)
├── Header (navigation, actions)
├── ScoreExplorer (chart library sidebar)
├── ChordChart (display mode)
├── ChordChartEditor (edit mode)
└── Various dialogs (Import/Export/Transpose)
```

### Key Utilities Organization
- **Music Theory**: `musicConstants.ts`, `transpose.ts`, `chordParsing.ts`
- **Data Management**: `storage.ts`, `migration.ts`, `chartMigration.ts`
- **Validation**: `chordValidation.ts`
- **Chart Operations**: `chordCreation.ts`, `export.ts`, `importFunctions.ts`
- **UI Helpers**: `lineBreakHelpers.ts`, `chordCopyPaste.ts`
- **Sync System**: `utils/sync/` (Google Drive同期、認証、デバイス管理)

### Data Models
```typescript
ChordChart: { id, title, artist, key, tempo, timeSignature, sections[], tags[], notes, version? }
ChordSection: { id, name, chords[], beatsPerBar, barsCount }
Chord: { name, root, base?, duration?, isLineBreak? }
```

### Custom Hooks Pattern
- **State Integration**: `useChartManagement` (統合フック), `useChartSync` (同期統合)
- **UI Logic**: `useResponsiveBars` (レスポンシブ計算), `useWakeLock` (スクリーンロック)
- **Chart Operations**: `useChordOperations` (コード操作), `useSectionOperations` (セクション管理)

## Development Workflow

### Git Workflow
- main ブランチに直接コミットはせず、作業単位ごとにブランチを切り、GitHub上でPullRequestを送ること
- コミットログは日本語で書いて
- リポジトリに変更をコミットする前にTODO.mdを更新すること

### Quality Requirements
- **Testing**: このプロジェクトでは必ずテストを書くこと
- **Linting**: コミットするコードはlintに通っている必要がある  
- **Building**: コミットするコードは必ずビルドできる必要がある
- **E2E Testing**: E2Eテストが存在する場合は実行して確認すること
- **Pre-commit validation**: `npm test && npm run lint && npm run build && npm run test:e2e` を確認してからコミット

### Task Management
- todoをTODO.mdに書いて管理してください
- Claude Code sessions should use TodoWrite/TodoRead tools for task tracking

## Code Organization Patterns

`Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any` が出てしまなわいように、anyの利用は避ける

### Utility Function Structure
When adding new utilities, follow the established patterns:
- **Music-related constants**: Add to `musicConstants.ts`
- **Chord operations**: Use appropriate specialized files (`chordParsing.ts`, `chordValidation.ts`, etc.)
- **Data operations**: Use `storage.ts` or create new focused utility files
- **Component helpers**: Create focused utility files with clear single responsibilities

### Component Design Patterns
- Use custom hooks for complex logic extraction
- Follow the store-first pattern for state management
- Implement responsive design using `useResponsiveBars` pattern
- Use drag-and-drop with @dnd-kit following established patterns

### Testing Patterns  
- Test files mirror source structure: `src/utils/example.ts` → `src/utils/__tests__/example.test.ts`
- Use React Testing Library for component tests
- Mock external dependencies (LocalForage, clipboard APIs)
- Test both success and error scenarios

## UI Design Guidelines / デザインガイドライン

### Color Palette / カラーパレット

Nekogata Score Managerでは、統一感があり直感的なユーザーインターフェースを提供するため、以下のカラーパレットを使用します。

#### Custom Color Palette / カスタムカラーパレット

**Slate系 (基本UI)**
- `bg-slate-50`: ページ全体の背景色
- `bg-slate-100`, `bg-slate-200`: セカンダリ背景、ホバー状態
- `bg-slate-300`: 無効状態のボタン
- `text-slate-600`, `text-slate-700`, `text-slate-900`: テキスト階層
- `border-slate-200`, `border-slate-300`: 境界線

#### Accent Colors / アクセントカラー (3色限定)

**Teal (#85B0B7) - メイン機能**
- メイン操作ボタン（新規作成、編集、保存）
- 選択状態の背景
- プライマリアクション

**Sage (#BDD0CA) - セカンダリ機能**
- インポート、確定ボタン
- 情報表示、成功状態
- セカンダリアクション

**Coral (#EE5840) - 削除・エラー**
- 削除ボタン
- エラー状態の背景
- 警告・注意表示

#### 使用ルール

1. **機能による色分け**
   - Teal (#85B0B7): メイン機能（作成、編集、保存）
   - Sage (#BDD0CA): セカンダリ機能（インポート、情報表示）
   - Coral (#EE5840): 削除・エラー系

2. **カスタムカラー実装**
   ```css
   /* Tailwindのarbitrary valuesを使用 */
   bg-[#85B0B7] hover:bg-[#6B9CA5] text-white    /* Teal */
   bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 /* Sage */
   bg-[#EE5840] hover:bg-[#D14A2E] text-white     /* Coral */
   ```

3. **アクセシビリティ**
   - 背景とテキストのコントラスト比4.5:1以上を確保
   - 色だけでなく形状やテキストでも情報を伝達

4. **一貫性**
   - 同じ機能には常に同じ色を使用
   - ホバー状態は10-15%暗くした色を使用

### Typography / タイポグラフィ

- 見出し: `text-lg font-semibold text-slate-900`
- 本文: `text-sm text-slate-700`
- 補助テキスト: `text-xs text-slate-500`
- ボタンテキスト: `text-sm font-medium`

### Spacing / スペーシング

- 要素間の基本スペース: `gap-2`, `gap-3`
- セクション間: `space-y-4`
- パディング: `px-3 py-2` (ボタン), `p-4` (カード)

この色彩設計により、ユーザーは直感的に各要素の機能を理解でき、一貫性のある操作体験を得ることができます。