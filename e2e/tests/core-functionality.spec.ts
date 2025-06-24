import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';

test.describe('Nekogata Score Manager - コア機能テスト', () => {
  test('チャート作成→表示→編集→保存の基本フローが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // Step 1: チャート作成
    await homePage.goto();
    await homePage.clickCreateNew();
    
    await expect(chartFormPage.form).toBeVisible();
    await chartFormPage.fillBasicInfo({
      title: 'コア機能テスト',
      artist: 'テストアーティスト',
      key: 'D',
      tempo: 120,
      timeSignature: '4/4',
      notes: 'コア機能のテストです'
    });
    await chartFormPage.clickSave();
    
    // Step 2: チャート表示確認
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText('コア機能テスト');
    await expect(chartViewPage.chartArtist).toContainText('テストアーティスト');
    await expect(chartViewPage.chartKey).toContainText('キー: D');
    await expect(chartViewPage.chartTimeSignature).toContainText('拍子: 4/4');
    await expect(chartViewPage.chartNotes).toBeVisible();
    await expect(chartViewPage.chartNotes).toContainText('コア機能のテストです');
    
    // Step 3: 編集モードに切り替え
    await chartViewPage.clickEdit();
    
    // Step 4: エディター表示確認
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('コード譜を編集');
    await expect(chartEditorPage.saveButton).toBeVisible();
    await expect(chartEditorPage.cancelButton).toBeVisible();
    
    // Step 5: 編集を保存
    await chartEditorPage.clickSave();
    
    // Step 6: ビューモードに戻ることを確認
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText('コア機能テスト');
  });

  test('チャートの複製機能が動作する（Score Explorer経由）', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    
    // デスクトップビューポートに設定（モバイル環境での問題を回避）
    await homePage.goto();
    await homePage.setDesktopViewport();
    
    // チャート作成
    await homePage.clickCreateNew();
    
    await chartFormPage.fillBasicInfo({
      title: '複製テスト',
      artist: 'オリジナル'
    });
    await chartFormPage.clickSave();
    
    // 複製実行
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText('複製テスト');
    
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // 複製前のチャート数を記録（デスクトップScore Explorerのみ）
    const initialItemCount = await scoreExplorerPage.getChartItemCount();
    
    // チャートを選択
    await scoreExplorerPage.selectChart(0);
    
    // 選択状態を確認（デバッグ用）
    const selectionStatus = await scoreExplorerPage.getSelectionStatus().textContent();
    console.log('Selection status:', selectionStatus);
    
    // Score Explorerから複製を実行
    await scoreExplorerPage.clickActionDropdown();
    await scoreExplorerPage.clickDuplicateSelected();
    
    // 複製が完了したことを確認（少し待機）
    await page.waitForTimeout(1000);
    
    // Score Explorer内で複製されたチャートを確認
    // 複製された結果チャート数が1つ増えていることを確認
    const finalItemCount = await scoreExplorerPage.getChartItemCount();
    expect(finalItemCount).toBe(initialItemCount + 1);
    
    // 複製されたタイトル「複製テスト (コピー)」が1個存在することを確認
    const duplicatedTitles = scoreExplorerPage.getSpecificTitleLocator('複製テスト (コピー)');
    const duplicatedCount = await duplicatedTitles.count();
    expect(duplicatedCount).toBe(1);
  });

  test('編集キャンセル機能が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // チャート作成
    await homePage.goto();
    await homePage.clickCreateNew();
    
    await chartFormPage.fillBasicInfo({
      title: 'キャンセルテスト',
      artist: 'テストアーティスト'
    });
    await chartFormPage.clickSave();
    
    // 編集モードに入る
    await chartViewPage.waitForChartToLoad();
    const originalTitle = await chartViewPage.chartTitle.textContent();
    await chartViewPage.clickEdit();
    
    // エディターでキャンセル
    await chartEditorPage.waitForEditorToLoad();
    await chartEditorPage.clickCancel();
    
    // ビューモードに戻り、変更が保存されていないことを確認
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toHaveText(originalTitle || '');
  });

  test('デフォルトセクションを持つチャートの表示が正しく動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    
    // 最小限の情報でチャート作成
    await homePage.goto();
    await homePage.clickCreateNew();
    
    await chartFormPage.fillTitle('デフォルトチャート');
    await chartFormPage.clickSave();
    
    // デフォルトセクションが表示されることを確認
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText('デフォルトチャート');
    
    // デフォルトで「イントロ」セクションが作成されることを確認
    await expect(chartViewPage.chartContent).toBeVisible();
    
    // セクション名「イントロ」が表示されていることを確認
    await expect(page.locator('text=【イントロ】')).toBeVisible();
  });
});