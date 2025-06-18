import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';

test.describe('Nekogata Score Manager - チャート作成機能', () => {
  test('新規チャートの作成フローが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    
    // アプリケーションにアクセス
    await homePage.goto();
    
    // 新規作成ボタンをクリック
    await homePage.clickCreateNew();
    
    // チャート作成フォームが表示されることを確認
    await expect(chartFormPage.form).toBeVisible();
    
    // タイトルを入力
    await chartFormPage.fillTitle('テストチャート');
    
    // 作成ボタンをクリック
    await chartFormPage.clickSave();
    
    // フォームが閉じられることを確認
    await expect(chartFormPage.form).not.toBeVisible();
    
    // タイトルが表示されていることを確認（チャートが作成された）
    await expect(chartViewPage.getChartTitle('テストチャート')).toBeVisible();
  });

  test('フォームのキャンセルが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    
    await homePage.goto();
    
    // 新規作成ボタンをクリック
    await homePage.clickCreateNew();
    
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
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    
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
    
    // 作成されたチャートが表示されていることを確認
    await expect(chartViewPage.getChartTitle('Explorer テストチャート')).toBeVisible();
  });
});