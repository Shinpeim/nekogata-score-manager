import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';

test.describe('Nekogata Score Manager - 包括的なチャート作成フロー', () => {
  test('完全なチャート情報を入力して作成する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, true);
    const chartFormPage = new ChordChartFormPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    await homePage.goto();
    
    // Score Explorerを開くボタンをクリック
    await homePage.clickOpenExplorer();
    
    // Score Explorer内の新規作成ボタンをクリック
    await scoreExplorerPage.clickCreateNew();
    
    // フォームが表示されることを確認
    await expect(chartFormPage.form).toBeVisible();
    
    // 完全な楽曲情報を入力
    await chartFormPage.fillBasicInfo({
      title: 'サンプル楽曲',
      artist: 'テストアーティスト',
      key: 'G',
      tempo: 140,
      timeSignature: '3/4',
      notes: 'イントロはアルペジオで開始'
    });
    
    // 作成ボタンをクリック
    await chartFormPage.clickSave();
    
    // フォームが閉じられることを確認
    await expect(chartFormPage.form).not.toBeVisible();
    
    // 編集画面に遷移することを確認（新機能）
    await page.waitForTimeout(2000); // 画面遷移を待機（非同期処理のため長めに設定）
    await expect(chartEditorPage.chartEditor).toBeVisible({ timeout: 10000 });
    
    // エディターのタイトルが正しく表示されることを確認
    await expect(chartEditorPage.editorTitle).toContainText('サンプル楽曲');
  });

  test('必須項目のバリデーションが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    
    await homePage.goto();
    
    // デスクトップビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // Score Explorer内の新規作成ボタンをクリック
    await scoreExplorerPage.clickCreateNew();
    
    // フォームが表示されることを確認
    await expect(chartFormPage.form).toBeVisible();
    
    // タイトルを空にする
    await chartFormPage.fillTitle('');
    
    // 作成ボタンをクリック
    await chartFormPage.clickSave();
    
    // エラーメッセージが表示されることを確認（バリデーション実装による）
    // Note: 実際のバリデーションエラーの表示方法に応じて調整が必要
    
    // フォームが依然として表示されていることを確認
    await expect(chartFormPage.form).toBeVisible();
  });

  test('フォームの各入力フィールドが正常に動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    
    await homePage.goto();
    
    // デスクトップビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // Score Explorer内の新規作成ボタンをクリック
    await scoreExplorerPage.clickCreateNew();
    
    // 各フィールドの入力テスト
    await chartFormPage.fillTitle('フィールドテスト');
    await expect(chartFormPage.titleInput).toHaveValue('フィールドテスト');
    
    await chartFormPage.fillArtist('テストアーティスト');
    await expect(chartFormPage.artistInput).toHaveValue('テストアーティスト');
    
    await chartFormPage.selectKey('D');
    await expect(chartFormPage.keySelect).toHaveValue('D');
    
    await chartFormPage.fillTempo(180);
    await expect(chartFormPage.tempoInput).toHaveValue('180');
    
    await chartFormPage.selectTimeSignature('6/8');
    await expect(chartFormPage.timeSignatureSelect).toHaveValue('6/8');
    
    
    await chartFormPage.fillNotes('テスト用のメモです');
    await expect(chartFormPage.notesTextarea).toHaveValue('テスト用のメモです');
    
    // キャンセルボタンで閉じる
    await chartFormPage.clickCancel();
    await expect(chartFormPage.form).not.toBeVisible();
  });
});