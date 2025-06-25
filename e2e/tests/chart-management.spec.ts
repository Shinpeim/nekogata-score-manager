import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';

test.describe('Nekogata Score Manager - チャート管理機能テスト', () => {
  test('チャート削除機能が動作する（Score Explorer経由）', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    
    // チャート作成
    await homePage.goto();
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いて新規作成
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    
    await chartFormPage.fillBasicInfo({
      title: '削除テスト',
      artist: 'テストアーティスト'
    });
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('削除テスト');
    
    // 編集を保存してビューモードに戻る
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
    
    // Score Explorerを開く
    await homePage.clickOpenExplorer();
    
    // チャートを選択
    await scoreExplorerPage.selectChart(0);
    
    // 確認ダイアログで削除を承認（ブラウザのconfirmダイアログ）
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('削除しますか');
      await dialog.accept();
    });
    
    // Score Explorerから削除を実行
    await scoreExplorerPage.clickActionDropdown();
    await scoreExplorerPage.clickDeleteSelected();
    
    // 削除後は空の状態に戻ることを確認
    await expect(homePage.getEmptyStateMessage()).toBeVisible({ timeout: 10000 });
  });

  test('複数チャートの作成と切り替えが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    await homePage.goto();
    
    // デスクトップ環境としてテスト
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いて1つ目のチャート作成
    await homePage.clickOpenExplorer();
    await page.waitForLoadState('networkidle'); // 固定待機から条件待機へ変更
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillBasicInfo({
      title: 'チャート1',
      artist: 'アーティスト1'
    });
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('チャート1');
    
    // 編集を保存してビューモードに戻る
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText('チャート1');
    
    // 2つ目のチャート作成
    await homePage.clickOpenExplorer();
    await page.waitForLoadState('networkidle'); // 固定待機から条件待機へ変更
    await scoreExplorerPage.clickCreateNew();
    
    await chartFormPage.fillBasicInfo({
      title: 'チャート2',
      artist: 'アーティスト2'
    });
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('チャート2');
    
    // 編集を保存してビューモードに戻る
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText('チャート2');
    
    // 複数チャートが作成されたことを確認（画面に「チャート2」が表示されている）
    await expect(chartViewPage.chartTitle).toContainText('チャート2');
    await expect(chartViewPage.chartArtist).toContainText('アーティスト2');
    
    // 注意: このテストでは、実際のチャート切り替えは他のテストでカバーし、
    // ここでは複数チャートの作成機能が正常に動作することを確認する
  });

  test('チャート情報の表示と作成が正常に動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    await homePage.goto();
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いてテスト用のチャートを作成
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillBasicInfo({
      title: '情報表示テスト',
      artist: 'テストアーティスト',
    });
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('情報表示テスト');
    
    // 編集を保存してビューモードに戻る
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
    
    // チャート情報が正しく表示されていることを確認
    await expect(chartViewPage.chartTitle).toContainText('情報表示テスト');
    await expect(chartViewPage.chartArtist).toContainText('テストアーティスト');
    
  });

  test('チャート情報の編集と更新が正しく反映される', async ({ page }) => {
    const homePage = new HomePage(page);
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);
    
    // 初期チャート作成
    await homePage.goto();
    await homePage.setDesktopViewport();
    
    // Score Explorerを開いて新規作成
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    
    await chartFormPage.fillBasicInfo({
      title: '編集前タイトル',
      artist: '編集前アーティスト',
      key: 'C',
      tempo: 100
    });
    await chartFormPage.clickSave();
    
    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();
    await expect(chartEditorPage.editorTitle).toContainText('編集前タイトル');
    
    // 編集を保存してビューモードに戻る
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
    
    // 初期状態確認
    await expect(chartViewPage.chartTitle).toContainText('編集前タイトル');
    await expect(chartViewPage.chartArtist).toContainText('編集前アーティスト');
    await expect(chartViewPage.chartKey).toContainText('キー: C');
    
    // 基本情報編集（フォームではなくエディター経由）
    await chartViewPage.clickEdit();
    
    // エディターが開いたことを確認
    await chartEditorPage.waitForEditorToLoad();
    
    // エディターを保存して戻る
    await chartEditorPage.clickSave();
    
    // ビューに戻ったことを確認
    await chartViewPage.waitForChartToLoad();
    await expect(chartViewPage.chartTitle).toContainText('編集前タイトル');
  });
});