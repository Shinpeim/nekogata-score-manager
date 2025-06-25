import { type Locator, type Page, expect } from '@playwright/test';

export class ScoreExplorerPage {
  readonly page: Page;
  readonly isMobile: boolean;
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
    this.isMobile = isMobile;
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
    // DOM上にボタンが存在することを確認してからJavaScriptでクリック
    await expect(this.createNewButton).toBeAttached({ timeout: 10000 });
    await this.createNewButton.evaluate(el => (el as HTMLElement).click());
  }

  async clickImport() {
    // DOM上にボタンが存在することを確認してからJavaScriptでクリック
    await expect(this.importButton).toBeAttached({ timeout: 10000 });
    await this.importButton.evaluate(el => (el as HTMLElement).click());
  }

  async clickSelectAll() {
    await expect(this.selectAllCheckbox).toBeAttached();
    await this.selectAllCheckbox.evaluate(el => (el as HTMLElement).click());
  }

  getChartCheckbox(index: number) {
    // isMobileに応じて適切な要素を取得
    const selector = `[data-testid="chart-checkbox-${index}"]`;
    return this.isMobile 
      ? this.page.locator('.fixed.inset-0.flex.z-40.md\\:hidden').locator(selector)
      : this.page.locator('aside').locator(selector);
  }

  getChartItem(index: number) {
    // isMobileに応じて適切な要素を取得
    const selector = `[data-testid="chart-item-${index}"]`;
    return this.isMobile 
      ? this.page.locator('.fixed.inset-0.flex.z-40.md\\:hidden').locator(selector)
      : this.page.locator('aside').locator(selector);
  }

  async selectChart(index: number) {
    // DOM要素の存在を確認してからJavaScript経由でクリック
    const checkbox = this.getChartCheckbox(index);
    await expect(checkbox).toBeAttached();
    await checkbox.evaluate(el => (el as HTMLElement).click());
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
    const testId = this.isMobile ? 'explorer-import-button-mobile' : 'explorer-import-button-desktop';
    await this.page.getByTestId(testId).click({ force: true });
  }

  async clickActionDropdown() {
    const container = this.isMobile 
      ? this.page.locator('.fixed.inset-0.flex.z-40.md\\:hidden')
      : this.page.locator('aside');
    const actionButton = container.locator('[title="アクション"]');
    await expect(actionButton).toBeAttached();
    await actionButton.evaluate(el => (el as HTMLElement).click());
  }

  async clickDuplicateSelected() {
    const container = this.isMobile 
      ? this.page.locator('.fixed.inset-0.flex.z-40.md\\:hidden')
      : this.page.locator('aside');
    const duplicateButton = container.locator('button:has-text("複製")');
    await expect(duplicateButton).toBeAttached();
    await duplicateButton.evaluate(el => (el as HTMLElement).click());
  }

  async clickDeleteSelected() {
    const container = this.isMobile 
      ? this.page.locator('.fixed.inset-0.flex.z-40.md\\:hidden')
      : this.page.locator('aside');
    const deleteButton = container.locator('button:has-text("削除")');
    await expect(deleteButton).toBeAttached();
    await deleteButton.evaluate(el => (el as HTMLElement).click());
  }

  async getChartItemCount() {
    const container = this.isMobile 
      ? this.page.locator('.fixed.inset-0.flex.z-40.md\\:hidden')
      : this.page.locator('aside');
    const chartItems = container.locator('[data-testid^="chart-item-"]');
    return await chartItems.count();
  }

  getSpecificTitleLocator(title: string) {
    const container = this.isMobile 
      ? this.page.locator('.fixed.inset-0.flex.z-40.md\\:hidden')
      : this.page.locator('aside');
    return container.locator(`text=${title}`);
  }
}