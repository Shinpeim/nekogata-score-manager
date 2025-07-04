import { type Locator, type Page } from '@playwright/test';

export class ChartViewPage {
  readonly page: Page;
  readonly chartViewer: Locator;
  readonly chartTitle: Locator;
  readonly chartArtist: Locator;
  readonly chartKey: Locator;
  readonly chartTimeSignature: Locator;
  readonly chartContent: Locator;
  readonly chartNotes: Locator;
  readonly chartActions: Locator;
  readonly emptySections: Locator;
  readonly explorerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chartViewer = page.getByTestId('chart-viewer');
    this.chartTitle = page.getByTestId('chart-title');
    this.chartArtist = page.getByTestId('chart-artist');
    this.chartKey = page.getByTestId('chart-key');
    this.chartTimeSignature = page.getByTestId('chart-time-signature');
    this.chartContent = page.getByTestId('chart-content');
    this.chartNotes = page.getByTestId('chart-notes');
    this.chartActions = page.getByTestId('chart-actions');
    this.emptySections = page.getByTestId('empty-sections');
    this.explorerButton = page.getByTestId('menu-button');
  }

  async clickEdit(chartIndex?: number) {
    // Score Explorerを開く
    const explorerToggle = this.page.getByTestId('explorer-toggle');
    
    if (await explorerToggle.isVisible()) {
      const buttonText = await explorerToggle.textContent();
      
      if (buttonText?.includes('>')) {
        // Score Explorerが閉じているので開く
        await explorerToggle.click();
        
        // Score Explorerが開くのを待つ（サイドバーの幅が0より大きくなるのを待つ）
        const sidebar = this.page.locator('aside');
        await sidebar.waitFor({ state: 'visible' });
        await this.page.waitForFunction(
          () => {
            const aside = document.querySelector('aside');
            if (!aside) return false;
            const width = parseInt(window.getComputedStyle(aside).width, 10);
            return width > 0;
          },
          { timeout: 5000 }
        );
      }
    }
    
    // DOM操作で編集ボタンを直接クリック（visibility の問題を回避）
    const editButtonClicked = await this.page.evaluate((index) => {
      // 編集ボタンを探す
      const editButtons = document.querySelectorAll('[data-testid^="edit-chart-"]') as NodeListOf<HTMLElement>;
      
      if (editButtons.length === 0) {
        return false;
      }
      
      // インデックスが指定されていない場合は最初のボタン（現在選択されているチャート）
      const targetIndex = index !== undefined ? index : 0;
      
      if (targetIndex >= editButtons.length) {
        console.error(`Edit button index ${targetIndex} not found. Available buttons: ${editButtons.length}`);
        return false;
      }
      
      const editButton = editButtons[targetIndex];
      
      if (editButton) {
        // 直接クリックイベントを発火
        editButton.click();
        return true;
      }
      
      return false;
    }, chartIndex);
    
    if (!editButtonClicked) {
      throw new Error(`Edit button not found in DOM (index: ${chartIndex ?? 0})`);
    }
    
    // 編集画面に遷移するまで待機（編集エディタの表示を待つ）
    await this.page.waitForSelector('[data-testid="chart-editor"]', { state: 'visible', timeout: 5000 });
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
      has: this.page.locator('.font-medium.leading-none')
    });
    const chordCount = await chordContainers.count();
    
    const chords: string[] = [];
    for (let i = 0; i < chordCount; i++) {
      const chordContainer = chordContainers.nth(i);
      const chordSpan = chordContainer.locator('.font-medium.leading-none');
      
      // 分離表示の場合、個別のspan要素を取得して結合
      const spanElements = chordSpan.locator('span');
      const spanCount = await spanElements.count();
      
      let chordName = '';
      if (spanCount > 0) {
        // span要素がある場合（ルート音とクオリティが分離）
        for (let j = 0; j < spanCount; j++) {
          const spanText = await spanElements.nth(j).textContent();
          if (spanText && !spanText.startsWith('/')) {
            chordName += spanText;
          }
        }
      } else {
        // span要素がない場合（単純なコード名）
        const directText = await chordSpan.textContent();
        if (directText) {
          chordName = directText;
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