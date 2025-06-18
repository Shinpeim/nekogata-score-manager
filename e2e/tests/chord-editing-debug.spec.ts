import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ChordChartFormPage } from '../pages/ChordChartFormPage';
import { ChartViewPage } from '../pages/ChartViewPage';
import { ChartEditorPage } from '../pages/ChartEditorPage';

test.describe('Chord Editing Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('デバッグ: エディター基本構造の確認', async ({ page }) => {
    const homePage = new HomePage(page);
    const chartFormPage = new ChordChartFormPage(page);
    const chartViewPage = new ChartViewPage(page);
    const chartEditorPage = new ChartEditorPage(page);

    // 基本チャート作成
    await homePage.goto();
    await homePage.clickCreateNew();
    await chartFormPage.fillTitle('デバッグテスト');
    await chartFormPage.clickSave();

    // 編集モードに入る
    await chartViewPage.waitForChartToLoad();
    await chartViewPage.clickEdit();
    await chartEditorPage.waitForEditorToLoad();

    // セクション数を確認
    const sectionCount = await chartEditorPage.getSectionCount();
    console.log('Section count:', sectionCount);
    expect(sectionCount).toBeGreaterThanOrEqual(1);

    // セクション要素のdata-section-card属性を確認
    const sectionElements = await page.locator('[data-section-card]').all();
    console.log('Found sections with data-section-card:', sectionElements.length);

    // コード追加ボタンの存在確認
    const addChordButtons = await page.getByTestId('add-chord-button').all();
    console.log('Found add-chord buttons:', addChordButtons.length);

    if (addChordButtons.length > 0) {
      // 最初のセクションでコード追加を試行
      await chartEditorPage.addChordToSection(0);
      
      // コード要素の追加を待機
      await chartEditorPage.waitForChordToAppear(0, 1);
      
      const chordElements = await page.locator('[data-chord-item]').all();
      console.log('Found chord items after adding:', chordElements.length);
      
      if (chordElements.length > 0) {
        // コード名入力を試行
        const firstChord = chordElements[0];
        const chordInput = firstChord.locator('input').first();
        
        if (await chordInput.isVisible()) {
          await chordInput.fill('C');
          await chordInput.press('Enter');
          
          // 入力結果を確認
          const chordValue = await chordInput.inputValue();
          console.log('Chord input value:', chordValue);
          expect(chordValue).toBe('C');
        } else {
          console.log('Chord input not visible');
        }
      }
    }

    // 保存を試行
    await chartEditorPage.clickSave();
    await chartViewPage.waitForChartToLoad();
  });
});