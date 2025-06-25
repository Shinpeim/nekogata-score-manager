import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';

test.describe('Nekogata Score Manager - 移調機能テスト (音楽アプリの核心機能)', () => {
  test.beforeEach(async ({ page }) => {
    // Google API関連の包括的ネットワークブロック
    await page.route('**/*googleapis.com/**', route => route.abort());
    await page.route('**/*accounts.google.com/**', route => route.abort());
    await page.route('**/*gstatic.com/**', route => route.abort());
    await page.route('**/*google.com/**', route => route.abort());
    
    // LocalStorageをクリアして各テストを独立させる
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      // E2EテストフラグをsessionStorageで設定（Google Drive同期無効化）
      sessionStorage.setItem('__playwright_test__', 'true');
    });
  });

  test('基本移調テスト: C→G移調でコード確認(C-Am-F-G → G-Em-C-D)', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // チャート作成（Cキー）
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('移調テスト基本');
    await chartFormPage.selectKey('C'); // Cキーで作成
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // コード進行を入力: C - Am - F - G
    const sectionIndex = 0;
    
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 1);
    await chartEditorPage.setChordName(sectionIndex, 0, 'C');
    await chartEditorPage.setChordDuration(sectionIndex, 0, '4');
    
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 2);
    await chartEditorPage.setChordName(sectionIndex, 1, 'Am');
    await chartEditorPage.setChordDuration(sectionIndex, 1, '4');
    
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 3);
    await chartEditorPage.setChordName(sectionIndex, 2, 'F');
    await chartEditorPage.setChordDuration(sectionIndex, 2, '4');
    
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 4);
    await chartEditorPage.setChordName(sectionIndex, 3, 'G');
    await chartEditorPage.setChordDuration(sectionIndex, 3, '4');

    // 初期コード確認: C - Am - F - G
    let chordOrder = await chartEditorPage.getChordOrderInSection(sectionIndex);
    expect(chordOrder).toEqual(['C', 'Am', 'F', 'G']);

    // キーをCからGに変更（移調機能実行）
    const keySelect = page.locator('#key-select');
    await keySelect.selectOption('G');

    // 移調確認ダイアログが表示されることを確認
    const transposeDialog = page.locator('text=キーの変更');
    await expect(transposeDialog).toBeVisible();

    // 移調ダイアログの内容確認
    await expect(page.locator('text=コードも一緒に移調しますか？')).toBeVisible();

    // 「はい、コードも一緒に移調する」ボタンをクリック
    const transposeButton = page.locator('button:has-text("はい、コードも一緒に移調する")');
    await expect(transposeButton).toBeVisible();
    
    console.log('移調ボタンをクリック中...');
    await transposeButton.click({ force: true });
    console.log('移調ボタンクリック完了');

    // 移調ダイアログが閉じるまで待機
    await expect(page.locator('text=キーの変更')).not.toBeVisible();

    // 移調処理が完了するまで待機
    await page.waitForFunction(() => {
      const keySelect = document.querySelector('#key-select') as HTMLSelectElement;
      return keySelect && keySelect.value === 'G';
    }, { timeout: 10000 });

    // Wait for transpose operation to complete by checking the chord values
    await page.waitForFunction(() => {
      const firstChord = document.querySelector('[data-chord-item] input[placeholder*="コード名"]') as HTMLInputElement;
      return firstChord && firstChord.value === 'G';
    }, { timeout: 5000 });
    
    // 移調が実際に実行されたかチェック
    await page.waitForFunction(() => {
      const keySelect = document.querySelector('#key-select') as HTMLSelectElement;
      return keySelect && keySelect.value === 'G';
    }, { timeout: 10000 });

    // 移調後のコード確認: G - Em - C - D
    chordOrder = await chartEditorPage.getChordOrderInSection(sectionIndex);
    console.log('移調後のコード順序:', chordOrder);
    expect(chordOrder).toEqual(['G', 'Em', 'C', 'D']);

    // 保存して永続化確認
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();

    // 表示モードでの確認
    const displayedChords = await chartViewPage.getAllDisplayedChords();
    expect(displayedChords).toEqual(['G', 'Em', 'C', 'D']);

    // キー表示も変更されていることを確認
    const chartKey = page.getByTestId('chart-key');
    await expect(chartKey).toContainText('G');
  });

  test('複数キー移調テスト: C→G→D→A→E の連続移調検証', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // チャート作成（Cキー）
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('連続移調テスト');
    await chartFormPage.selectKey('C');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // シンプルなコード進行を入力: C - F
    const sectionIndex = 0;
    
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 1);
    await chartEditorPage.setChordName(sectionIndex, 0, 'C');
    await chartEditorPage.setChordDuration(sectionIndex, 0, '4');
    
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 2);
    await chartEditorPage.setChordName(sectionIndex, 1, 'F');
    await chartEditorPage.setChordDuration(sectionIndex, 1, '4');

    // 移調のテストケース定義
    const transposeTests = [
      { fromKey: 'C', toKey: 'G', expectedChords: ['G', 'C'] },
      { fromKey: 'G', toKey: 'D', expectedChords: ['D', 'G'] },
      { fromKey: 'D', toKey: 'A', expectedChords: ['A', 'D'] },
      { fromKey: 'A', toKey: 'E', expectedChords: ['E', 'A'] }
    ];

    // 連続移調実行
    for (const testCase of transposeTests) {
      console.log(`Transposing from ${testCase.fromKey} to ${testCase.toKey}`);
      
      // キー変更
      const keySelect = page.locator('#key-select');
      await keySelect.selectOption(testCase.toKey);

      // 移調確認ダイアログで移調実行
      const transposeButton = page.locator('button:has-text("はい、コードも一緒に移調する")');
      await transposeButton.click();

      // 移調ダイアログが閉じるまで待機
      await expect(page.locator('text=キーの変更')).not.toBeVisible();

      // 移調処理が完了するまで待機
      await page.waitForFunction((key) => {
        const keySelect = document.querySelector('#key-select') as HTMLSelectElement;
        return keySelect && keySelect.value === key;
      }, testCase.toKey, { timeout: 10000 });

      // Wait for DOM to update by checking the first chord changes
      await page.waitForFunction((expectedFirstChord) => {
        const firstChord = document.querySelector('[data-chord-item] input[placeholder*="コード名"]') as HTMLInputElement;
        return firstChord && firstChord.value === expectedFirstChord;
      }, testCase.expectedChords[0], { timeout: 5000 });

      // 移調後のコード確認
      const chordOrder = await chartEditorPage.getChordOrderInSection(sectionIndex);
      expect(chordOrder).toEqual(testCase.expectedChords);
    }

    // 保存して最終確認
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();

    // 最終的にEキーのE-Aコード進行になっていることを確認
    const displayedChords = await chartViewPage.getAllDisplayedChords();
    expect(displayedChords).toEqual(['E', 'A']);

    const chartKey = page.getByTestId('chart-key');
    await expect(chartKey).toContainText('E');
  });

  test('移調後の表示・保存・復元の完全フロー検証', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('移調永続化テスト');
    await chartFormPage.selectKey('C');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    const sectionIndex = 0;
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 1);
    await chartEditorPage.setChordName(sectionIndex, 0, 'Dm');
    await chartEditorPage.setChordDuration(sectionIndex, 0, '4');
    
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 2);
    await chartEditorPage.setChordName(sectionIndex, 1, 'G7');
    await chartEditorPage.setChordDuration(sectionIndex, 1, '4');

    // A移調実行
    const keySelect = page.locator('#key-select');
    await keySelect.selectOption('A');
    
    const transposeButton = page.locator('button:has-text("はい、コードも一緒に移調する")');
    await transposeButton.click();

    // 移調ダイアログが閉じるまで待機
    await expect(page.locator('text=キーの変更')).not.toBeVisible();

    // 移調処理が完了するまで待機
    await page.waitForFunction(() => {
      const keySelect = document.querySelector('#key-select') as HTMLSelectElement;
      return keySelect && keySelect.value === 'A';
    }, { timeout: 10000 });

    // Wait for DOM to update by checking the first chord changes to Bm
    await page.waitForFunction(() => {
      const firstChord = document.querySelector('[data-chord-item] input[placeholder*="コード名"]') as HTMLInputElement;
      return firstChord && firstChord.value === 'Bm';
    }, { timeout: 5000 });

    // 移調後確認: Dm→Bm, G7→E7
    let chordOrder = await chartEditorPage.getChordOrderInSection(sectionIndex);
    expect(chordOrder).toEqual(['Bm', 'E7']);

    // 保存
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();

    // ページリロードして永続化確認
    await page.reload();
    await chartViewPage.waitForChartToLoad();

    // リロード後のデータ確認
    const displayedChords = await chartViewPage.getAllDisplayedChords();
    expect(displayedChords).toEqual(['Bm', 'E7']);

    const chartKey = page.getByTestId('chart-key');
    await expect(chartKey).toContainText('A');

    // 再編集で移調された状態が正しく読み込まれることを確認
    await chartViewPage.clickEdit();
    await chartEditorPage.waitForEditorToLoad();
    
    // コードが読み込まれるまで待機
    await chartEditorPage.waitForChordToAppear(sectionIndex, 2);

    chordOrder = await chartEditorPage.getChordOrderInSection(sectionIndex);
    expect(chordOrder).toEqual(['Bm', 'E7']);

    // キー設定も正しいことを確認
    const currentKey = await page.locator('#key-select').inputValue();
    expect(currentKey).toBe('A');
  });

  test('移調キャンセル機能: キーのみ変更でコードは変更されない', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('移調キャンセルテスト');
    await chartFormPage.selectKey('C');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    const sectionIndex = 0;
    await chartEditorPage.addChordToSection(sectionIndex);
    await chartEditorPage.waitForChordToAppear(sectionIndex, 1);
    await chartEditorPage.setChordName(sectionIndex, 0, 'C');

    // キー変更
    const keySelect = page.locator('#key-select');
    await keySelect.selectOption('F');
    
    // 「いいえ、キーのみ変更する」をクリック
    const keyOnlyButton = page.locator('button:has-text("いいえ、キーのみ変更する")');
    await keyOnlyButton.click();

    // 移調ダイアログが閉じるまで待機
    await expect(page.locator('text=キーの変更')).not.toBeVisible();

    // キー変更が完了するまで待機
    await page.waitForFunction(() => {
      const keySelect = document.querySelector('#key-select') as HTMLSelectElement;
      return keySelect && keySelect.value === 'F';
    }, { timeout: 10000 });

    // Wait for key selector to update
    await page.waitForFunction(() => {
      const keySelect = document.querySelector('#key-select') as HTMLSelectElement;
      return keySelect && keySelect.value === 'F';
    }, { timeout: 5000 });

    // コードは変更されていないことを確認
    const chordOrder = await chartEditorPage.getChordOrderInSection(sectionIndex);
    expect(chordOrder).toEqual(['C']); // 元のまま

    // キーは変更されていることを確認
    const currentKey = await keySelect.inputValue();
    expect(currentKey).toBe('F');

    // 保存して確認
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();

    const displayedChords = await chartViewPage.getAllDisplayedChords();
    expect(displayedChords).toEqual(['C']);

    const chartKey = page.getByTestId('chart-key');
    await expect(chartKey).toContainText('F');
  });
});