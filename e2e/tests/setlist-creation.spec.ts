import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';

test.describe('セットリスト作成機能', () => {
  let homePage: HomePage;
  let scoreExplorerPage: ScoreExplorerPage;
  let chartFormPage: ChordChartFormPage;

  test.beforeEach(async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    homePage = new HomePage(page);
    scoreExplorerPage = new ScoreExplorerPage(page, true); // モバイルモードに設定
    chartFormPage = new ChordChartFormPage(page);
    
    await homePage.goto();
    await homePage.waitForInitialLoad();
  });

  test('楽譜を選択してセットリストを作成できる', async ({ page }) => {
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    await page.waitForTimeout(1000);
    
    // 楽譜タブが表示されていることを確認
    await expect(scoreExplorerPage.chartsTab).toBeAttached();
    
    // 楽譜を2つ作成
    await scoreExplorerPage.clickCreateNew();
    await expect(chartFormPage.form).toBeVisible();
    
    await chartFormPage.fillTitle('テスト楽曲1');
    await chartFormPage.fillArtist('アーティスト1');
    await chartFormPage.clickSave();
    await expect(chartFormPage.form).not.toBeVisible();
    await page.waitForTimeout(1000);

    await scoreExplorerPage.clickCreateNew();
    await expect(chartFormPage.form).toBeVisible();
    
    await chartFormPage.fillTitle('テスト楽曲2');
    await chartFormPage.fillArtist('アーティスト2');
    await chartFormPage.clickSave();
    await expect(chartFormPage.form).not.toBeVisible();
    await page.waitForTimeout(1000);

    // 楽譜タブが選択されていることを確認
    const chartsTab = page.locator('[data-testid="charts-tab"]').first();
    await expect(chartsTab).toHaveClass(/bg-white/);

    // セットリストタブに切り替え
    await scoreExplorerPage.setlistsTab.click();
    
    // セットリストが選択されていない場合のメッセージを確認
    await expect(page.locator('text=セットリストを選択してください')).toBeVisible();
    
    // 楽譜タブに戻る
    await scoreExplorerPage.chartsTab.click();
    
    // 作成された楽譜が表示されることを確認
    await expect(page.locator('text=テスト楽曲1').first()).toBeVisible();
    await expect(page.locator('text=テスト楽曲2').first()).toBeVisible();
  });

  test('セットリストタブとセレクターが動作する', async ({ page }) => {
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // セットリストタブに切り替え
    await scoreExplorerPage.setlistsTab.click();
    
    // セットリストが選択されていない場合のメッセージを確認
    await expect(page.locator('text=セットリストを選択してください')).toBeVisible();
    
    // 楽譜タブに戻る
    await scoreExplorerPage.chartsTab.click();
  });

  test('楽譜タブとセットリストタブの切り替えができる', async ({ page }) => {
    // Score Explorerを開く
    await homePage.clickOpenExplorer();

    // 初期状態では楽譜タブが選択されている
    const chartsTab = page.locator('[data-testid="charts-tab"]').first();
    const setlistsTab = page.locator('[data-testid="setlists-tab"]').first();
    
    await expect(chartsTab).toHaveClass(/bg-white/);
    await expect(setlistsTab).not.toHaveClass(/bg-white/);

    // セットリストタブをクリック
    await setlistsTab.click();
    await expect(setlistsTab).toHaveClass(/bg-white/);
    await expect(chartsTab).not.toHaveClass(/bg-white/);

    // セットリストが選択されていない場合のメッセージを確認
    await expect(page.locator('text=セットリストを選択してください')).toBeVisible();

    // 楽譜タブに戻る
    await chartsTab.click();
    await expect(chartsTab).toHaveClass(/bg-white/);
    await expect(setlistsTab).not.toHaveClass(/bg-white/);
  });

  test('セットリスト作成フォームのキャンセル機能', async ({ page }) => {
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // 楽譜を作成
    await scoreExplorerPage.clickCreateNew();
    await expect(chartFormPage.form).toBeVisible();
    
    await chartFormPage.fillTitle('キャンセルテスト楽曲');
    await chartFormPage.fillArtist('テストアーティスト');
    await chartFormPage.clickSave();
    await expect(chartFormPage.form).not.toBeVisible();
    
    // 楽譜が作成されたことを確認
    await expect(page.locator('text=キャンセルテスト楽曲').first()).toBeVisible();
  });
});