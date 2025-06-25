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
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    
    await homePage.goto();
    
    // モバイル以外のビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開くボタンをクリック
    await homePage.clickOpenExplorer();
    
    // Score Explorerが表示されることを確認（タブがDOMに存在することで判定）
    await expect(scoreExplorerPage.chartsTab).toBeAttached();
    
    // ヘッダーのトグルボタンをクリックして閉じる
    await homePage.toggleExplorer();
    
    // Score Explorerが非表示になることを確認（デスクトップビューの場合）
    await expect(scoreExplorerPage.titleDesktop).not.toBeVisible();
  });
});