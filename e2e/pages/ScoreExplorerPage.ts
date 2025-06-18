import { type Locator, type Page } from '@playwright/test';

export class ScoreExplorerPage {
  readonly page: Page;
  readonly title: Locator;
  readonly titleMobile: Locator;
  readonly titleDesktop: Locator;
  readonly selectAllCheckbox: Locator;
  readonly createNewButton: Locator;
  readonly createNewButtonMobile: Locator;
  readonly createNewButtonDesktop: Locator;
  readonly importButton: Locator;
  readonly importButtonMobile: Locator;
  readonly importButtonDesktop: Locator;

  constructor(page: Page, isMobile: boolean = false) {
    this.page = page;
    this.titleMobile = page.getByTestId('score-explorer-title-mobile');
    this.titleDesktop = page.getByTestId('score-explorer-title-desktop');
    this.title = isMobile ? this.titleMobile : this.titleDesktop;
    
    this.selectAllCheckbox = page.getByTestId('select-all-checkbox');
    
    this.createNewButtonMobile = page.getByTestId('explorer-create-new-button-mobile');
    this.createNewButtonDesktop = page.getByTestId('explorer-create-new-button-desktop');
    this.createNewButton = isMobile ? this.createNewButtonMobile : this.createNewButtonDesktop;
    
    this.importButtonMobile = page.getByTestId('explorer-import-button-mobile');
    this.importButtonDesktop = page.getByTestId('explorer-import-button-desktop');
    this.importButton = isMobile ? this.importButtonMobile : this.importButtonDesktop;
  }

  async clickCreateNew() {
    await this.createNewButton.click();
  }

  async clickImport() {
    await this.importButton.click();
  }

  async clickSelectAll() {
    await this.selectAllCheckbox.click();
  }

  getChartCheckbox(chartId: string) {
    return this.page.getByTestId(`chart-checkbox-${chartId}`);
  }

  getChartItem(chartId: string) {
    return this.page.getByTestId(`chart-item-${chartId}`);
  }

  async selectChart(chartId: string) {
    await this.getChartCheckbox(chartId).click();
  }

  async clickChart(chartId: string) {
    await this.getChartItem(chartId).click();
  }

  getSelectionStatus() {
    return this.page.locator('text=件選択中');
  }
}