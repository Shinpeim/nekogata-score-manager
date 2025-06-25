import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';

test.describe('Nekogata Score Manager - チャート作成機能', () => {
  test('新規チャートの作成フローが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // アプリケーションにアクセス
    await homePage.goto();
    
    // Score Explorerを開くボタンをクリック
    await homePage.clickOpenExplorer();
    
    // Score Explorer内の新規作成ボタンをクリック
    await scoreExplorerPage.clickCreateNew();
    
    // チャート作成フォームが表示されることを確認
    await expect(chartFormPage.form).toBeVisible();
    
    // タイトルを入力
    await chartFormPage.fillTitle('テストチャート');
    
    // 作成ボタンをクリック
    await chartFormPage.clickSave();
    
    // フォームが閉じられることを確認
    await expect(chartFormPage.form).not.toBeVisible();
    
    // 編集画面に遷移することを確認（新機能）
    // Wait for navigation to editor
    await page.waitForLoadState('networkidle');
    await expect(chartEditorPage.chartEditor).toBeVisible({ timeout: 10000 });
    
    // エディターのタイトルが正しく表示されることを確認
    await expect(chartEditorPage.editorTitle).toContainText('テストチャート');
  });

  test('フォームのキャンセルが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page);
    const chartFormPage = new ChordChartFormPage(page);
    
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    await homePage.goto();
    
    // Score Explorerを開くボタンをクリック
    await homePage.clickOpenExplorer();
    
    // Score Explorer内の新規作成ボタンをクリック
    await scoreExplorerPage.clickCreateNew();
    
    // チャート作成フォームが表示されることを確認
    await expect(chartFormPage.form).toBeVisible();
    
    // キャンセルボタンをクリック
    await chartFormPage.clickCancel();
    
    // フォームが閉じられることを確認
    await expect(chartFormPage.form).not.toBeVisible();
    
    // 初期画面に戻ることを確認
    await expect(homePage.getEmptyStateMessage()).toBeVisible();
  });

  test('Score Explorerからのチャート作成が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    await homePage.goto();
    
    // デスクトップビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // Score Explorer内の新規作成ボタンをクリック
    await scoreExplorerPage.clickCreateNew();
    
    // チャート作成フォームが表示されることを確認
    await expect(chartFormPage.form).toBeVisible();
    
    // タイトルを入力
    await chartFormPage.fillTitle('Explorer テストチャート');
    
    // 作成ボタンをクリック
    await chartFormPage.clickSave();
    
    // フォームが閉じられることを確認
    await expect(chartFormPage.form).not.toBeVisible();
    
    // 編集画面に遷移することを確認（新機能）
    // Wait for navigation to editor
    await page.waitForLoadState('networkidle');
    await expect(chartEditorPage.chartEditor).toBeVisible({ timeout: 10000 });
    
    // エディターのタイトルが正しく表示されることを確認
    await expect(chartEditorPage.editorTitle).toContainText('Explorer テストチャート');
  });
});