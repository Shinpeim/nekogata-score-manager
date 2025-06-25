import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';

test.describe('Nekogata Score Manager - 基本動作テスト', () => {
  test('アプリケーションが正常に起動する', async ({ page }) => {
    const homePage = new HomePage(page);
    
    // アプリケーションにアクセス
    await homePage.goto();
    
    // タイトルが正しいことを確認
    await expect(page).toHaveTitle('Nekogata Score Manager');
    
    // ヘッダーが表示されていることを確認
    await expect(homePage.header).toBeVisible();
    
    // ヘッダーにアプリ名が含まれていることを確認
    await expect(homePage.appTitle).toContainText('Nekogata Score Manager');
  });

  test('初期画面でウェルカムメッセージが表示される', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    // ウェルカムメッセージの確認
    await expect(homePage.getEmptyStateMessage()).toBeVisible();
    await expect(homePage.getWelcomeMessage()).toBeVisible();
    
    // 「Score Explorerを開く」ボタンが表示されていることを確認
    await expect(homePage.openExplorerButton).toBeVisible();
  });

  test('Score Explorerの開閉が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page);
    
    await homePage.goto();
    
    // モバイル以外のビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開くボタンをクリック
    await homePage.clickOpenExplorer();
    
    // Score Explorerが表示されることを確認（タブがDOMに存在することで判定）
    await expect(scoreExplorerPage.chartsTab).toBeAttached();
    
    // ヘッダーのトグルボタンをクリックして閉じる
    await homePage.toggleExplorer();
    
    // CSS遷移の完了を待つ
    await page.waitForTimeout(500);
    
    // Score Explorerが非表示になることを確認
    // サイドバーの幅が0になり、overflow-hiddenが適用されることを確認
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/overflow-hidden/);
  });
});