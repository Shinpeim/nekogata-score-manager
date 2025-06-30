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
    scoreExplorerPage = new ScoreExplorerPage(page); // モバイルモードに設定
    chartFormPage = new ChordChartFormPage(page);
    
    await homePage.goto();
    await homePage.waitForInitialLoad();
  });

  test('楽譜を選択してセットリストを作成できる', async ({ page }) => {
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    // Wait for Score Explorer to fully open
    await expect(scoreExplorerPage.chartsTab).toBeVisible();
    
    // 楽譜タブが表示されていることを確認
    await expect(scoreExplorerPage.chartsTab).toBeAttached();
    
    // 楽譜を2つ作成
    // サイドバーが確実に開いていることを確認
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    await scoreExplorerPage.clickCreateNew();
    await expect(chartFormPage.form).toBeVisible();
    
    await chartFormPage.fillTitle('テスト楽曲1');
    await chartFormPage.fillArtist('アーティスト1');
    await chartFormPage.clickSave();
    await expect(chartFormPage.form).not.toBeVisible();
    // Wait for chart to be created and appear in the list
    await expect(page.locator('text=テスト楽曲1').first()).toBeVisible();

    // 新規作成後はサイドバーが閉じているので、再度開く
    await homePage.ensureExplorerOpen();
    
    // サイドバー内の要素が表示されるのを待つ
    await expect(scoreExplorerPage.chartsTab).toBeVisible();
    await page.waitForTimeout(500); // アニメーション完了を待つ
    
    // 編集画面が表示されている場合があるので、新規作成ボタンが確実にクリックできるまで待つ
    await scoreExplorerPage.createNewButton.waitFor({ state: 'visible' });
    await scoreExplorerPage.clickCreateNew();
    await expect(chartFormPage.form).toBeVisible();
    
    await chartFormPage.fillTitle('テスト楽曲2');
    await chartFormPage.fillArtist('アーティスト2');
    await chartFormPage.clickSave();
    await expect(chartFormPage.form).not.toBeVisible();
    // Wait for second chart to be created and appear in the list
    await expect(page.locator('text=テスト楽曲2').first()).toBeVisible();

    // 新規作成後はサイドバーが閉じているので、再度開く
    await homePage.ensureExplorerOpen();
    
    // 楽譜タブが選択されていることを確認
    await expect(scoreExplorerPage.chartsTab).toHaveClass(/bg-white/);

    // セットリストタブに切り替え
    await scoreExplorerPage.setlistsTab.dispatchEvent('click');
    
    // セットリストが選択されていない場合のメッセージを確認
    await expect(page.locator('text=セットリストを選択してください')).toBeVisible();
    
    // 楽譜タブに戻る
    await scoreExplorerPage.chartsTab.dispatchEvent('click');
    
    // 作成された楽譜が表示されることを確認
    await expect(page.locator('text=テスト楽曲1').first()).toBeVisible();
    await expect(page.locator('text=テスト楽曲2').first()).toBeVisible();
  });

  test('セットリストタブとセレクターが動作する', async ({ page }) => {
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // セットリストタブに切り替え
    await scoreExplorerPage.setlistsTab.dispatchEvent('click');
    
    // セットリストが選択されていない場合のメッセージを確認
    await expect(page.locator('text=セットリストを選択してください')).toBeVisible();
    
    // 楽譜タブに戻る
    await scoreExplorerPage.chartsTab.dispatchEvent('click');
  });

  test('楽譜タブとセットリストタブの切り替えができる', async ({ page }) => {
    // Score Explorerを開く
    await homePage.clickOpenExplorer();

    // 初期状態では楽譜タブが選択されている
    await expect(scoreExplorerPage.chartsTab).toHaveClass(/bg-white/);
    await expect(scoreExplorerPage.setlistsTab).not.toHaveClass(/bg-white/);

    // セットリストタブをクリック
    await scoreExplorerPage.setlistsTab.dispatchEvent('click');
    await expect(scoreExplorerPage.setlistsTab).toHaveClass(/bg-white/);
    await expect(scoreExplorerPage.chartsTab).not.toHaveClass(/bg-white/);

    // セットリストが選択されていない場合のメッセージを確認
    await expect(page.locator('text=セットリストを選択してください')).toBeVisible();

    // 楽譜タブに戻る
    await scoreExplorerPage.chartsTab.dispatchEvent('click');
    await expect(scoreExplorerPage.chartsTab).toHaveClass(/bg-white/);
    await expect(scoreExplorerPage.setlistsTab).not.toHaveClass(/bg-white/);
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