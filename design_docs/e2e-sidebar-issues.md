# E2Eテスト - サイドバー（ScoreExplorer）の構造的問題と対応策

## 問題の概要

Nekogata Score Managerのサイドバー（ScoreExplorer）は、モバイル用とデスクトップ用の2つのインスタンスがDOM上に同時存在することで、E2Eテストが非常に脆弱になっている。

## 現在の実装構造

### サイドバーの二重実装

**MainLayout.tsx での実装:**
```typescript
{/* Mobile Score Explorer overlay - 条件付きレンダリング */}
{explorerOpen && (
  <ScoreExplorer isMobile={true} onClose={() => setExplorerOpen(false)} />
)}

{/* Desktop Score Explorer - CSS制御 */}
<aside className={`${explorerOpen ? 'block' : 'hidden'} w-80 ...`}>
  <ScoreExplorer isMobile={false} />
</aside>
```

**問題点:**
- **モバイル版**: 条件付きレンダリング（完全マウント/アンマウント）
- **デスクトップ版**: CSS制御（`block`/`hidden`）で常にDOM存在
- 同じ`data-testid`を持つ要素がDOM上に重複存在

## E2Eテストでの具体的問題

### 1. 要素重複によるセレクタの不安定性

**危険な実装例:**
```typescript
// どちらの要素が選択されるか不確定
this.chartsTab = page.getByTestId('charts-tab').first();
this.createNewButton = page.getByTestId('explorer-create-new-button').first();
```

### 2. 脆弱なセレクタ戦略

**現在の問題:**
- `.first()`メソッドに過度に依存
- CSS構造依存セレクタ（`.fixed.inset-0.flex.z-40.md\\:hidden`）
- インデックスベースの要素特定
- テキストコンテンツ依存の選択

### 3. タイミング問題

**不安定な待機パターン:**
```typescript
await page.waitForTimeout(500);  // 固定待機
await page.waitForTimeout(1000); // 環境依存
```

### 4. 状態確認の不備

```typescript
// 存在確認のみで操作可能性を検証していない
await expect(this.createNewButton).toBeAttached({ timeout: 10000 });
```

## 詳細分析

### DOM構造の競合

1. **要素の重複存在**
   - 同じ機能の要素が2つのコンテキストに存在
   - デバイス判定ロジックが環境・画面サイズに依存
   - CSS `md:hidden` クラスによる表示制御がJavaScript動作と競合

2. **セレクタの曖昧性**
   - `data-testid` の重複
   - レスポンシブ状態での要素の可視性判定が困難
   - デバイス固有要素の特定が不安定

### テストの脆弱性パターン

1. **高リスク箇所**
   - チャート選択: `await page.click('[data-testid="chart-checkbox-0"]')`
   - ボタンクリック: `.first()` 依存のセレクタ
   - ダイアログハンドリング: タイミング競合

2. **中リスク箇所**
   - タブ切り替え: CSS クラス依存の状態確認
   - Import/Export 操作: JavaScript 経由のクリック処理

## 対応策

### 短期対応（既存構造維持）

#### 1. セレクタの明確化
```typescript
// デバイス固有のdata-testidを使用
data-testid="explorer-create-new-button-mobile"
data-testid="explorer-create-new-button-desktop"
```

#### 2. 状態確認の強化
```typescript
// 存在 + 可視性 + 操作可能性を確認
await expect(this.createNewButton).toBeVisible();
await expect(this.createNewButton).toBeEnabled();
```

#### 3. 待機戦略の改善
```typescript
// 固定待機から条件待機へ
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

### 中期対応（構造改善）

#### 1. DOM制御の統一
```typescript
// デスクトップ版も条件付きレンダリングに変更
{explorerOpen && <ScoreExplorer isMobile={false} />}
```

#### 2. テストデータの独立性
```typescript
// インデックス依存からユニークID使用へ
const uniqueChartId = `test-chart-${Date.now()}`;
```

#### 3. Page Object の改善
```typescript
// より堅牢なセレクタ戦略
async selectChartByTitle(title: string) {
  const selector = this.isMobile 
    ? `[data-testid="mobile-chart"][data-title="${title}"]`
    : `[data-testid="desktop-chart"][data-title="${title}"]`;
  await this.page.locator(selector).click();
}
```

### 長期対応（アーキテクチャ見直し）

#### 1. 単一コンポーネント設計
- レスポンシブCSS による表示制御統一
- JavaScript による動的スタイル切り替え削除
- DOM構造の一元化

#### 2. テスト用属性の整備
```typescript
// ユニークで安定したテスト属性
data-testid="score-explorer"
data-device="mobile|desktop"
data-state="open|closed"
```

#### 3. Component Level Testing の強化
- ユニットテストでロジック検証
- E2Eテストは統合シナリオに集中
- Visual Regression Testing の導入

## 実装優先度

### High Priority（即時対応）
1. 既存テストの安定化（セレクタ明確化）
2. 待機戦略の改善
3. 状態確認の強化

### Medium Priority（1-2週間）
1. DOM制御統一の検討
2. Page Object パターンの改善
3. テストデータ独立性の確保

### Low Priority（長期計画）
1. アーキテクチャ全体見直し
2. コンポーネントレベルテスト強化
3. Visual Testing 導入

## 関連ファイル

### 主要コンポーネント
- `src/layouts/MainLayout.tsx` - メインレイアウト管理
- `src/layouts/ScoreExplorer.tsx` - サイドバーコンテンツ
- `src/layouts/Header.tsx` - サイドバー開閉制御

### E2Eテスト
- `e2e/pages/ScoreExplorerPage.ts` - Page Object
- `e2e/tests/app.spec.ts` - メインテストスイート
- `e2e/tests/setlist-creation.spec.ts` - セットリスト作成テスト

### 設定ファイル
- `playwright.config.ts` - Playwright設定
- `e2e/global-setup.ts` - テスト初期化

## 参考情報

### 現在の脆弱性指標
- 固定待機使用箇所: 15+ 箇所
- `.first()` 依存セレクタ: 8+ 箇所
- インデックス依存操作: 10+ 箇所
- テキスト依存セレクタ: 5+ 箇所

### 成功指標
- E2Eテスト成功率: 現在 ~75% → 目標 95%+
- テスト実行時間: 現在 ~3分 → 目標 2分以内
- フレーキネス率: 現在 ~20% → 目標 5%以内

この問題への対応により、E2Eテストの安定性と保守性を大幅に向上させることができる。