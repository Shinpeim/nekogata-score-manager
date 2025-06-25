import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';
import { ScoreExplorerPage } from '../pages/ScoreExplorerPage';

test.describe('Nekogata Score Manager - コード編集機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // LocalStorageをクリアして各テストを独立させる
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('セクション追加と命名の基本操作が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // 基本チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('セクション操作テスト');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // 初期状態：デフォルトで「イントロ」セクションが1つある
    const initialSectionCount = await chartEditorPage.getSectionCount();
    expect(initialSectionCount).toBe(1);

    // セクション追加
    await chartEditorPage.clickAddSection();
    await chartEditorPage.waitForSectionToAppear(2);

    const updatedSectionCount = await chartEditorPage.getSectionCount();
    expect(updatedSectionCount).toBe(2);

    // セクション名を設定
    await chartEditorPage.setSectionName(1, 'Aメロ');
    
    // セクション名が正しく設定されたことを確認
    const sectionName = await chartEditorPage.getSectionName(1);
    expect(sectionName).toBe('Aメロ');

    // さらにセクション追加
    await chartEditorPage.clickAddSection();
    await chartEditorPage.waitForSectionToAppear(3);
    await chartEditorPage.setSectionName(2, 'Bメロ');

    // 全セクション名を確認
    const allSectionNames = await chartEditorPage.getAllSectionNames();
    expect(allSectionNames).toEqual(['イントロ', 'Aメロ', 'Bメロ']);

    // 保存
    await chartEditorPage.clickSave();
    await page.waitForTimeout(2000); // 画面遷移を待機
    await chartViewPage.waitForChartToLoad();

    // セクション名が表示されていることを確認
    await expect(page.locator('text=【イントロ】')).toBeVisible();
    await expect(page.locator('text=【Aメロ】')).toBeVisible();
    await expect(page.locator('text=【Bメロ】')).toBeVisible();
  });

  test('コード入力と編集の基本操作が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // 基本チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('コード入力テスト');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // 最初のセクション（イントロ）にコードを追加
    const sectionIndex = 0;
    
    // コード追加
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'C', '1');
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'Am', '1');
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'F', '1');
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'G', '1');

    // コード名が正しく設定されたことを確認
    const chords = await chartEditorPage.getAllChordsInSection(sectionIndex);
    expect(chords).toEqual(['C', 'Am', 'F', 'G']);

    // エディター内でコードが正しく入力されていることを確認
    const sectionChords = await chartEditorPage.getAllChordsInSection(sectionIndex);
    expect(sectionChords).toEqual(['C', 'Am', 'F', 'G']);
    
    // テスト完了（編集内容が正しく設定されていることを確認済み）
    // 保存機能のテストは他のテストケースでカバーされる
  });

  test('複数セクションでのコード進行作成の完全フローが動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // 基本チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('完全コード進行テスト');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // セクション構成: イントロ、Aメロ、Bメロ、サビを作成
    await chartEditorPage.clickAddSection();
    await chartEditorPage.waitForSectionToAppear(2);
    await chartEditorPage.setSectionName(1, 'Aメロ');

    await chartEditorPage.clickAddSection();
    await chartEditorPage.waitForSectionToAppear(3);
    await chartEditorPage.setSectionName(2, 'Bメロ');

    await chartEditorPage.clickAddSection();
    await chartEditorPage.waitForSectionToAppear(4);
    await chartEditorPage.setSectionName(3, 'サビ');

    // 各セクションにコード進行を入力
    // イントロ: C - Am - F - G
    await chartEditorPage.addChordToSectionWithDuration(0, 'C', '1');
    await chartEditorPage.addChordToSectionWithDuration(0, 'Am', '1');
    await chartEditorPage.addChordToSectionWithDuration(0, 'F', '1');
    await chartEditorPage.addChordToSectionWithDuration(0, 'G', '1');

    // Aメロ: Am - F - C - G
    await chartEditorPage.addChordToSectionWithDuration(1, 'Am', '1');
    await chartEditorPage.addChordToSectionWithDuration(1, 'F', '1');
    await chartEditorPage.addChordToSectionWithDuration(1, 'C', '1');
    await chartEditorPage.addChordToSectionWithDuration(1, 'G', '1');

    // Bメロ: Dm - G - Em - Am
    await chartEditorPage.addChordToSectionWithDuration(2, 'Dm', '1');
    await chartEditorPage.addChordToSectionWithDuration(2, 'G', '1');
    await chartEditorPage.addChordToSectionWithDuration(2, 'Em', '1');
    await chartEditorPage.addChordToSectionWithDuration(2, 'Am', '1');

    // サビ: F - G - Em - Am - F - G - C
    await chartEditorPage.addChordToSectionWithDuration(3, 'F', '1');
    await chartEditorPage.addChordToSectionWithDuration(3, 'G', '1');
    await chartEditorPage.addChordToSectionWithDuration(3, 'Em', '1');
    await chartEditorPage.addChordToSectionWithDuration(3, 'Am', '1');
    await chartEditorPage.addChordToSectionWithDuration(3, 'F', '1');
    await chartEditorPage.addChordToSectionWithDuration(3, 'G', '1');
    await chartEditorPage.addChordToSectionWithDuration(3, 'C', '1');

    // 全体の構成を確認
    const allSectionNames = await chartEditorPage.getAllSectionNames();
    expect(allSectionNames).toEqual(['イントロ', 'Aメロ', 'Bメロ', 'サビ']);

    const introChords = await chartEditorPage.getAllChordsInSection(0);
    expect(introChords).toEqual(['C', 'Am', 'F', 'G']);

    const verseChords = await chartEditorPage.getAllChordsInSection(1);
    expect(verseChords).toEqual(['Am', 'F', 'C', 'G']);

    const bridgeChords = await chartEditorPage.getAllChordsInSection(2);
    expect(bridgeChords).toEqual(['Dm', 'G', 'Em', 'Am']);

    const chorusChords = await chartEditorPage.getAllChordsInSection(3);
    expect(chorusChords).toEqual(['F', 'G', 'Em', 'Am', 'F', 'G', 'C']);

    // 保存
    await chartEditorPage.clickSave();
    await page.waitForTimeout(2000); // 画面遷移を待機
    await chartViewPage.waitForChartToLoad();

    // 保存後の表示確認
    await expect(page.locator('text=【イントロ】')).toBeVisible();
    await expect(page.locator('text=【Aメロ】')).toBeVisible();
    await expect(page.locator('text=【Bメロ】')).toBeVisible();
    await expect(page.locator('text=【サビ】')).toBeVisible();

    // 各セクションの代表的なコードが表示されていることを確認
    const chartContent = page.locator('[data-testid="chart-content"]');
    
    // イントロのコード（C-Am-F-G）
    await expect(chartContent.getByText('C').first()).toBeVisible();
    await expect(chartContent.getByText('A').first()).toBeVisible();
    await expect(chartContent.getByText('m').first()).toBeVisible();
    
    // Bメロの特徴的なコード（Dm, Em）
    await expect(chartContent.getByText('D').first()).toBeVisible();
    await expect(chartContent.getByText('E').first()).toBeVisible();
    
    // サビの最後のコード（C）も確認
    const allCs = await chartContent.getByText('C').count();
    expect(allCs).toBeGreaterThanOrEqual(2); // イントロとサビの最後にCがある
  });

  test('セクション削除機能が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // 基本チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('セクション削除テスト');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // セクションを3つ作成
    await chartEditorPage.clickAddSection();
    await chartEditorPage.setSectionName(1, 'Aメロ');
    await chartEditorPage.clickAddSection();
    await chartEditorPage.setSectionName(2, 'Bメロ');

    // 削除前の状態確認
    let sectionNames = await chartEditorPage.getAllSectionNames();
    expect(sectionNames).toEqual(['イントロ', 'Aメロ', 'Bメロ']);

    // 真ん中のセクション（Aメロ）を削除
    await chartEditorPage.deleteSectionByIndex(1);
    await chartEditorPage.waitForSectionToAppear(2);

    // 削除後の確認
    sectionNames = await chartEditorPage.getAllSectionNames();
    expect(sectionNames).toEqual(['イントロ', 'Bメロ']);

    // 保存して確認
    await chartEditorPage.clickSave();
    await page.waitForTimeout(2000); // 画面遷移を待機
    await chartViewPage.waitForChartToLoad();

    await expect(page.locator('text=【イントロ】')).toBeVisible();
    await expect(page.locator('text=【Bメロ】')).toBeVisible();
    await expect(page.locator('text=【Aメロ】')).not.toBeVisible();
  });

  test('コード削除機能が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // 基本チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('コード削除テスト');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // コードを4つ追加
    const sectionIndex = 0;
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'C', '1');
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'Am', '1');
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'F', '1');
    await chartEditorPage.addChordToSectionWithDuration(sectionIndex, 'G', '1');

    // 削除前の状態確認
    let chords = await chartEditorPage.getAllChordsInSection(sectionIndex);
    expect(chords).toEqual(['C', 'Am', 'F', 'G']);

    // 真ん中のコード（Am、インデックス1）を削除
    await chartEditorPage.deleteChord(sectionIndex, 1);
    
    // 削除後のコード数変化を待機
    await page.waitForFunction(
      ([sectionIndex]) => {
        const sections = document.querySelectorAll('[data-section-card]');
        const targetSection = sections[sectionIndex];
        return targetSection ? targetSection.querySelectorAll('[data-chord-item]').length === 3 : false;
      },
      [sectionIndex],
      { timeout: 5000 }
    );

    // 削除後の確認
    chords = await chartEditorPage.getAllChordsInSection(sectionIndex);
    expect(chords).toEqual(['C', 'F', 'G']); // Amが削除されて、C, F, Gが残るはず

    // 保存して確認
    await chartEditorPage.clickSave();
    await page.waitForTimeout(2000); // 画面遷移を待機
    await chartViewPage.waitForChartToLoad();

    // 保存後のビューモードで正しく表示されていることを確認
    const chartContent = page.locator('[data-testid="chart-content"]');
    await expect(chartContent.locator('text="C"').first()).toBeVisible();
    await expect(chartContent.locator('text="F"').first()).toBeVisible();
    await expect(chartContent.locator('text="G"').first()).toBeVisible();
    
    // セクション表示の確認
    await expect(page.locator('text=【イントロ】')).toBeVisible();
    
    // 削除されたAmコードが含まれていないことを確認
    // チャート表示エリア全体のテキストを取得してAmが含まれていないことを確認
    const chartText = await chartContent.textContent();
    expect(chartText).not.toContain('Am');
  });

  test('メモ機能の編集が動作する', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // 基本チャート作成
    await homePage.goto();
    // Score Explorerを開いて新規作成
    const scoreExplorerPage = new ScoreExplorerPage(page, false);
    await homePage.setDesktopViewport();
    await homePage.clickOpenExplorer();
    await scoreExplorerPage.clickCreateNew();
    await chartFormPage.fillTitle('メモ編集テスト');
    await chartFormPage.clickSave();

    // 新規作成後は直接編集画面に遷移
    await chartEditorPage.waitForEditorToLoad();

    // メモを追加
    const testNotes = 'このコード進行はキーCのダイアトニックコードを基本としています。\nサビ部分では少し複雑な進行を使用。';
    await chartEditorPage.setNotes(testNotes);

    // メモが設定されたことを確認
    const notes = await chartEditorPage.getNotes();
    expect(notes).toBe(testNotes);

    // 保存
    await chartEditorPage.clickSave();
    await page.waitForTimeout(2000); // 画面遷移を待機
    await chartViewPage.waitForChartToLoad();

    // 保存後にメモが表示されていることを確認
    await expect(page.locator('text=ダイアトニックコード')).toBeVisible();
  });
});