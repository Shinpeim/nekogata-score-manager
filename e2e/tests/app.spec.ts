import { test, expect } from '@playwright/test';

test.describe('Nekogata Score Manager - 基本動作テスト', () => {
  test('アプリケーションが正常に起動する', async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('/');
    
    // タイトルが正しいことを確認
    await expect(page).toHaveTitle('Nekogata Score Manager');
    
    // ヘッダーが表示されていることを確認
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // ヘッダーにアプリ名が含まれていることを確認
    await expect(header).toContainText('Nekogata Score Manager');
  });

  test('初期画面でウェルカムメッセージが表示される', async ({ page }) => {
    await page.goto('/');
    
    // ウェルカムメッセージの確認
    await expect(page.locator('text=コード譜がありません')).toBeVisible();
    await expect(page.locator('text=まずは新しいコード譜を作成するか、既存のファイルをインポートしてみましょう')).toBeVisible();
    
    // メインコンテンツエリア内のボタンを確認（Score Explorer内のボタンとの混在を避ける）
    const mainContent = page.locator('main');
    
    // 「新規作成」ボタンが表示されていることを確認
    const createButton = mainContent.locator('button:has-text("新規作成")');
    await expect(createButton).toBeVisible();
    
    // 「インポート」ボタンが表示されていることを確認
    const importButton = mainContent.locator('button:has-text("インポート")');
    await expect(importButton).toBeVisible();
    
    // 「Score Explorerを開く」ボタンが表示されていることを確認
    const explorerButton = mainContent.locator('button:has-text("Score Explorerを開く")');
    await expect(explorerButton).toBeVisible();
  });

  test('Score Explorerの開閉が動作する', async ({ page }) => {
    await page.goto('/');
    
    // モバイル以外のビューポートでテスト
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Score Explorerを開くボタンをクリック
    await page.locator('button:has-text("Score Explorerを開く")').click();
    
    // Score Explorerが表示されることを確認
    const scoreExplorer = page.locator('text=Score Explorer').first();
    await expect(scoreExplorer).toBeVisible();
    
    // 閉じるボタンが存在する場合はクリック
    const closeButton = page.locator('[aria-label="Score Explorerを閉じる"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      // Score Explorerが非表示になることを確認
      await expect(scoreExplorer).not.toBeVisible();
    }
  });
});