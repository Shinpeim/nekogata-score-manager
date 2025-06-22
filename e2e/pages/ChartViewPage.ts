import { type Locator, type Page } from '@playwright/test';

export class ChartViewPage {
  readonly page: Page;
  readonly chartViewer: Locator;
  readonly chartTitle: Locator;
  readonly chartArtist: Locator;
  readonly chartKey: Locator;
  readonly chartTimeSignature: Locator;
  readonly chartTags: Locator;
  readonly chartContent: Locator;
  readonly chartNotes: Locator;
  readonly chartActions: Locator;
  readonly editButton: Locator;
  readonly emptySections: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chartViewer = page.getByTestId('chart-viewer');
    this.chartTitle = page.getByTestId('chart-title');
    this.chartArtist = page.getByTestId('chart-artist');
    this.chartKey = page.getByTestId('chart-key');
    this.chartTimeSignature = page.getByTestId('chart-time-signature');
    this.chartTags = page.getByTestId('chart-tags');
    this.chartContent = page.getByTestId('chart-content');
    this.chartNotes = page.getByTestId('chart-notes');
    this.chartActions = page.getByTestId('chart-actions');
    this.editButton = page.getByTestId('edit-button');
    this.emptySections = page.getByTestId('empty-sections');
  }

  async clickEdit() {
    await this.editButton.click();
  }

  getChartTitleWithText(title: string) {
    return this.page.locator('h2').filter({ hasText: title });
  }

  getSection(sectionId: string) {
    return this.page.getByTestId(`section-${sectionId}`);
  }

  getSectionName(sectionId: string) {
    return this.page.getByTestId(`section-name-${sectionId}`);
  }

  async waitForChartToLoad() {
    await this.chartViewer.waitFor({ state: 'visible', timeout: 15000 });
  }

  async isChartDisplayed(title: string) {
    const chartTitle = this.getChartTitleWithText(title);
    return await chartTitle.isVisible();
  }

  // 分離表示されたコード名を結合して取得
  async getAllDisplayedChords(): Promise<string[]> {
    const chartContent = this.page.locator('[data-testid="chart-content"]');
    // コード要素を特定（コードクラスまたはflexコンテナ）
    const chordContainers = chartContent.locator('.flex.flex-col.justify-center, .flex.flex-col.justify-start').filter({
      has: this.page.locator('.text-xs.font-medium')
    });
    const chordCount = await chordContainers.count();
    
    const chords: string[] = [];
    for (let i = 0; i < chordCount; i++) {
      const chordContainer = chordContainers.nth(i);
      const chordSpan = chordContainer.locator('.text-xs.font-medium');
      
      // 分離表示の場合、個別のspan要素を取得して結合
      const spanElements = chordSpan.locator('span');
      const spanCount = await spanElements.count();
      
      let chordName = '';
      for (let j = 0; j < spanCount; j++) {
        const spanText = await spanElements.nth(j).textContent();
        if (spanText) {
          chordName += spanText;
        }
      }
      
      // ベース音部分も取得（/C など）
      const baseSpan = chordSpan.locator('.text-slate-500');
      const baseCount = await baseSpan.count();
      if (baseCount > 0) {
        const baseText = await baseSpan.textContent();
        if (baseText) {
          chordName += baseText;
        }
      }
      
      if (chordName.trim()) {
        chords.push(chordName.trim());
      }
    }
    
    return chords;
  }
}