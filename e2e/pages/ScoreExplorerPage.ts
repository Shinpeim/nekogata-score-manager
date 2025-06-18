import { type Locator, type Page, expect } from '@playwright/test';

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
    
    this.selectAllCheckbox = page.getByTestId('select-all-checkbox').first();
    
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
    await expect(this.selectAllCheckbox).toBeAttached();
    await this.selectAllCheckbox.evaluate(el => (el as HTMLElement).click());
  }

  getChartCheckbox(index: number) {
    return this.page.getByTestId(`chart-checkbox-${index}`).first();
  }

  getChartItem(index: number) {
    return this.page.getByTestId(`chart-item-${index}`).first();
  }

  async selectChart(index: number) {
    // DOM要素の存在を確認してからJavaScript経由でクリック
    await expect(this.getChartCheckbox(index)).toBeAttached();
    await this.getChartCheckbox(index).evaluate(el => (el as HTMLElement).click());
  }

  async clickChart(index: number) {
    await this.getChartItem(index).click();
  }

  getSelectionStatus() {
    return this.page.locator('text=件選択中').first();
  }

  async openActionDropdown() {
    const actionButton = this.page.locator('[title="アクション"]').first();
    await expect(actionButton).toBeAttached();
    await actionButton.evaluate(el => (el as HTMLElement).click());
  }

  async clickExportOption() {
    const exportButton = this.page.locator('button:has-text("エクスポート")').first();
    await expect(exportButton).toBeAttached();
    await exportButton.evaluate(el => (el as HTMLElement).click());
  }

  getExportDialog() {
    return this.page.locator('[role="dialog"]:has-text("エクスポート")');
  }

  getFilenameInput() {
    return this.page.locator('#filename');
  }

  async clickExportButton() {
    await this.page.locator('button:has-text("エクスポート")').click();
  }

  getImportDialog() {
    return this.page.locator('.fixed.inset-0:has-text("インポート")').first();
  }

  getFileInput() {
    return this.page.locator('input[type="file"][accept=".json"]');
  }

  async clickImportButton() {
    await this.page.getByTestId('import-button').click({ force: true });
  }
}