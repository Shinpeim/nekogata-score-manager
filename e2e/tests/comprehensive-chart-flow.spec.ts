import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';

test.describe('Nekogata Score Manager - 包括的なチャート作成フロー', () => {
  test('完全なチャート情報を入力して作成する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    
    await homePage.goto();
    
    // 新規作成ボタンをクリック
    await homePage.clickCreateNew();
    
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
    
    // チャートが正しく表示されることを確認
    await expect(chartViewPage.getChartTitleWithText('サンプル楽曲')).toBeVisible();
  });

  test('必須項目のバリデーションが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    
    await homePage.goto();
    
    // 新規作成ボタンをクリック
    await homePage.clickCreateNew();
    
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
    const chartFormPage = new ChordChartFormPage(page);
    
    await homePage.goto();
    await homePage.clickCreateNew();
    
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