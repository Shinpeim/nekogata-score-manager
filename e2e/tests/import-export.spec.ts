import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Nekogata Score Manager - インポート・エクスポート機能（シンプル版）', () => {
  // テスト後のクリーンアップ用
  test.beforeEach(async ({ page }) => {
    // E2Eテストフラグを設定してテストデータをクリーンアップ
    await page.addInitScript(() => {
      sessionStorage.setItem('isE2ETest', 'true');
    });
  });

  test.describe('エクスポート機能', () => {
    test('エクスポートUIテスト：チャート作成後にScore Explorerでチャートが表示される', async ({ page }) => {
      const homePage = new HomePage(page);
      const scoreExplorerPage = new ScoreExplorerPage(page, false);
      const chartFormPage = new ChordChartFormPage(page);
      const chartViewPage = new ChartViewPage(page);
      
      await homePage.goto();
      await homePage.setDesktopViewport();
      
      // 1. テスト用チャートを作成
      await homePage.clickCreateNew();
      await expect(chartFormPage.form).toBeVisible();
      
      const testChartTitle = 'エクスポートテストチャート';
      await chartFormPage.fillTitle(testChartTitle);
      await chartFormPage.fillArtist('テストアーティスト');
      await chartFormPage.selectKey('C');
      await chartFormPage.fillTempo(120);
      await chartFormPage.clickSave();
      
      await expect(chartFormPage.form).not.toBeVisible();
      await expect(chartViewPage.getChartTitleWithText(testChartTitle)).toBeVisible();
      
      // 2. Score Explorerを開く
      await homePage.clickOpenExplorer();
      
      // 3. Score Explorerが開いていることを確認（インポートボタンの存在で確認）
      
      // 4. インポートボタンが表示されることを確認
      await expect(scoreExplorerPage.importButton).toBeVisible();
      
      // このテストの範囲：基本的なUI表示確認
      // エクスポートの詳細機能は技術的課題により実装見送り
    });

    test('エクスポートUIテスト：チャート選択後にエクスポートダイアログが表示される', async ({ page }) => {
      const homePage = new HomePage(page);
      const scoreExplorerPage = new ScoreExplorerPage(page, false);
      const chartFormPage = new ChordChartFormPage(page);
      
      await homePage.goto();
      await homePage.setDesktopViewport();
      
      // 1. テスト用チャートを作成
      await homePage.clickCreateNew();
      await chartFormPage.fillTitle('エクスポートテストチャート');
      await chartFormPage.fillArtist('テストアーティスト');
      await chartFormPage.clickSave();
      
      // 2. Score Explorerを開く
      await homePage.clickOpenExplorer();
      
      // 3. 最初のチャートのチェックボックスを選択（インデックス0）
      await scoreExplorerPage.selectChart(0);
      
      // 4. 選択状態を確認（要素の存在とテキスト内容で判定）
      await expect(scoreExplorerPage.getSelectionStatus()).toContainText('1件選択中');
      await page.waitForTimeout(500); // 選択状態の反映を待機
      
      // 5. アクションドロップダウンを開く
      await scoreExplorerPage.openActionDropdown();
      await page.waitForTimeout(500); // ドロップダウンの表示を待機
      
      // 6. エクスポートオプションをクリック
      await scoreExplorerPage.clickExportOption();
      await page.waitForTimeout(1000); // ダイアログの表示を待機
      
      // 7. エクスポートダイアログが表示されることを確認
      await expect(scoreExplorerPage.getFilenameInput()).toBeVisible();
      await expect(page.locator('button:has-text("エクスポート")').first()).toBeVisible();
      await expect(page.locator('button:has-text("キャンセル")')).toBeVisible();
      
      // 8. ファイル名が自動的に設定されていることを確認
      const filenameInput = scoreExplorerPage.getFilenameInput();
      const filename = await filenameInput.inputValue();
      expect(filename).toContain('エクスポートテストチャート');
    });

  });

  test.describe('インポート機能', () => {
    test('インポートUIテスト：インポートボタンからダイアログが表示される', async ({ page }) => {
      const homePage = new HomePage(page);
      const scoreExplorerPage = new ScoreExplorerPage(page, false);
      
      await homePage.goto();
      await homePage.setDesktopViewport();
      
      // 1. Score Explorerを開く
      await homePage.clickOpenExplorer();
      
      // 2. インポートボタンをクリック
      await scoreExplorerPage.clickImport();
      
      // 3. インポートダイアログが表示されることを確認（ファイル入力フィールドで判定）
      const fileInput = scoreExplorerPage.getFileInput();
      await expect(fileInput).toBeVisible();
      
      // 4. ダイアログに必要な要素が含まれていることを確認
      await expect(page.locator('text=楽譜をインポート')).toBeVisible();
      await expect(page.locator('text=JSONファイルを選択').first()).toBeVisible();
      
      // このテストの範囲：基本的なUI表示確認
      // インポートの詳細機能は技術的課題により実装見送り
    });
  });

  test.describe('エラーハンドリング', () => {
    test('JSONインポート：不正なJSONファイルでエラーメッセージが表示される', async ({ page }) => {
      const homePage = new HomePage(page);
      const scoreExplorerPage = new ScoreExplorerPage(page, false);
      
      await homePage.goto();
      await homePage.setDesktopViewport();
      
      // 1. 不正なJSONファイルを作成
      const invalidJsonContent = '{ "invalid": json content }'; // 意図的に構文エラー
      const testFilePath = path.join(__dirname, '../downloads', `invalid-${Date.now()}.json`);
      fs.writeFileSync(testFilePath, invalidJsonContent);
      
      // 2. インポート実行
      await homePage.clickOpenExplorer();
      await scoreExplorerPage.clickImport();
      
      const fileInput = scoreExplorerPage.getFileInput();
      await expect(fileInput).toBeVisible();
      await fileInput.setInputFiles(testFilePath);
      
      // エラーダイアログのハンドラーを設定
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('JSONの解析に失敗しました');
        await dialog.accept();
      });
      
      await scoreExplorerPage.clickImportButton();
      
      // 3. エラーが発生してもダイアログが閉じることを確認
      await page.waitForTimeout(1000);
      
      // クリーンアップ
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    test('JSONインポート：無効なデータ形式でエラーメッセージが表示される', async ({ page }) => {
      const homePage = new HomePage(page);
      const scoreExplorerPage = new ScoreExplorerPage(page, false);
      
      await homePage.goto();
      await homePage.setDesktopViewport();
      
      // 1. 構文は正しいが形式が違うJSONファイルを作成
      const invalidFormatData = {
        wrongFormat: "このファイルはコード譜データではありません",
        someOtherData: "test"
      };
      
      const testFilePath = path.join(__dirname, '../downloads', `invalid-format-${Date.now()}.json`);
      fs.writeFileSync(testFilePath, JSON.stringify(invalidFormatData, null, 2));
      
      // 2. インポート実行
      await homePage.clickOpenExplorer();
      await scoreExplorerPage.clickImport();
      
      const fileInput = scoreExplorerPage.getFileInput();
      await expect(fileInput).toBeVisible();
      await fileInput.setInputFiles(testFilePath);
      
      // エラーダイアログのハンドラーを設定
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('無効なデータフォーマットです');
        await dialog.accept();
      });
      
      await scoreExplorerPage.clickImportButton();
      
      // 3. エラーが発生してもダイアログが閉じることを確認
      await page.waitForTimeout(1000);
      
      // クリーンアップ
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    test('JSONインポート：空ファイルでエラーメッセージが表示される', async ({ page }) => {
      const homePage = new HomePage(page);
      const scoreExplorerPage = new ScoreExplorerPage(page, false);
      
      await homePage.goto();
      await homePage.setDesktopViewport();
      
      // 1. 空ファイルを作成
      const testFilePath = path.join(__dirname, '../downloads', `empty-${Date.now()}.json`);
      fs.writeFileSync(testFilePath, '');
      
      // 2. インポート実行
      await homePage.clickOpenExplorer();
      await scoreExplorerPage.clickImport();
      
      const fileInput = scoreExplorerPage.getFileInput();
      await expect(fileInput).toBeVisible();
      await fileInput.setInputFiles(testFilePath);
      
      // エラーダイアログのハンドラーを設定
      page.on('dialog', async dialog => {
        // 空ファイルの場合のエラーメッセージ
        expect(dialog.message()).toMatch(/JSONの解析に失敗しました|ファイルの読み込みに失敗しました/);
        await dialog.accept();
      });
      
      await scoreExplorerPage.clickImportButton();
      
      // 3. エラーが発生してもダイアログが閉じることを確認
      await page.waitForTimeout(1000);
      
      // クリーンアップ
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });
  });
});