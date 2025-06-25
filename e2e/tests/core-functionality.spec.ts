import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';

test.describe('Nekogata Score Manager - コア機能テスト', () => {
  test('チャート作成→表示→編集→保存の基本フローが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // Step 1: チャート作成
    await homePage.goto();
    
    // デスクトップビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いて新規作成
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    
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
    
    // Step 2: 新規作成後は直接編集画面に遷移する
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('コア機能テスト');
    
    // Step 4: エディター要素の確認
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
    const chartEditorPage = new ChartEditorPage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    
    // デスクトップビューポートに設定（モバイル環境での問題を回避）
    await homePage.goto();
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いて新規作成
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    
    await chartFormPage.fillBasicInfo({
      title: '複製テスト',
      artist: 'オリジナル'
    });
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('複製テスト');
    
    // 編集を保存してビューモードに戻る
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
    
    // Score Explorerを開く
    await homePage.ensureExplorerOpen();
    
    // 複製前のチャート数を記録（デスクトップScore Explorerのみ）
    const initialItemCount = await scoreExplorerPage.getChartItemCount();
    
    // チャートを選択
    await scoreExplorerPage.selectChart(0);
    
    // 選択状態を確認（デバッグ用）
    const selectionStatus = await scoreExplorerPage.getSelectionStatus().textContent();
    console.log('Selection status:', selectionStatus);
    
    // Score Explorerから複製を実行
    await scoreExplorerPage.openActionDropdown();
    await scoreExplorerPage.clickDuplicateSelected();
    
    // Wait for duplication to complete by checking the item count increases
    await page.waitForFunction((initialCount) => {
      const items = document.querySelectorAll('[data-testid^="chart-item-"][data-testid$="-desktop"]');
      return items.length > initialCount;
    }, initialItemCount, { timeout: 5000 });
    
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
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // チャート作成
    await homePage.goto();
    
    // デスクトップビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いて新規作成
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    
    await chartFormPage.fillBasicInfo({
      title: 'キャンセルテスト',
      artist: 'テストアーティスト'
    });
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    const originalTitle = 'キャンセルテスト';
    
    // エディターでキャンセル
    await chartEditorPage.clickCancel();
    
    // ビューモードに戻り、変更が保存されていないことを確認
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText(originalTitle);
  });

  test('デフォルトセクションを持つチャートの表示が正しく動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // 最小限の情報でチャート作成
    await homePage.goto();
    
    // デスクトップビューポートでテスト
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いて新規作成
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    
    await chartFormPage.fillTitle('デフォルトチャート');
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('デフォルトチャート');
    
    // 編集を保存してビューモードに戻る
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
    
    // デフォルトセクションが表示されることを確認
    await expect(chartViewPage.chartTitle).toContainText('デフォルトチャート');
    
    // デフォルトで「イントロ」セクションが作成されることを確認
    await expect(chartViewPage.chartContent).toBeVisible();
    
    // セクション名「イントロ」が表示されていることを確認
    await expect(page.locator('text=【イントロ】')).toBeVisible();
  });
});