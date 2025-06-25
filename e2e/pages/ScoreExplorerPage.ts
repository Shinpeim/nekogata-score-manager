import { type Locator, type Page, expect } from '@playwright/test';

export class ScoreExplorerPage {
  readonly page: Page;
  readonly chartsTab: Locator;
  readonly setlistsTab: Locator;
  readonly selectAllCheckbox: Locator;
  readonly createNewButton: Locator;
  readonly importButton: Locator;
  readonly titleDesktop: Locator;

  constructor(page: Page) {
    this.page = page;
    
    this.chartsTab = page.getByTestId('charts-tab');
    this.setlistsTab = page.getByTestId('setlists-tab');
    
    this.selectAllCheckbox = page.getByTestId('select-all-checkbox');
    
    this.createNewButton = page.getByTestId('explorer-create-new-button');
    this.importButton = page.getByTestId('explorer-import-button');
    
    // サイドバーのタイトル領域（楽譜タブ）を確認
    this.titleDesktop = page.locator('aside').getByText('楽譜');
  }

  async clickCreateNew() {
    // 可視性を確認してから通常クリック
    await expect(this.createNewButton).toBeVisible({ timeout: 10000 });
    await expect(this.createNewButton).toBeEnabled();
    await this.createNewButton.click();
  }

  async clickImport() {
    // 可視性と操作可能性を確認してから通常クリック
    await expect(this.importButton).toBeVisible({ timeout: 10000 });
    await expect(this.importButton).toBeEnabled();
    await this.importButton.click();
  }

  async clickSelectAll() {
    await expect(this.selectAllCheckbox).toBeVisible();
    await expect(this.selectAllCheckbox).toBeEnabled();
    await this.selectAllCheckbox.click();
  }

  getChartCheckbox(index: number) {
    return this.page.getByTestId(`chart-checkbox-${index}`);
  }

  getChartItem(index: number) {
    return this.page.getByTestId(`chart-item-${index}`);
  }

  async selectChart(index: number) {
    // 可視性を確認してから通常クリック
    const checkbox = this.getChartCheckbox(index);
    await expect(checkbox).toBeVisible();
    await checkbox.click();
  }

  async clickChart(index: number) {
    await this.getChartItem(index).click();
  }

  getSelectionStatus() {
    // サイドバー内のテキストを直接探す
    return this.page.locator('aside >> text=件選択中');
  }

  async openActionDropdown() {
    const actionButton = this.page.getByTestId('action-dropdown-button');
    await expect(actionButton).toBeVisible();
    await actionButton.click();
  }

  async clickExportOption() {
    const exportButton = this.page.locator('button:has-text("エクスポート")');
    await expect(exportButton).toBeVisible();
    await exportButton.click();
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
    await this.page.getByTestId('explorer-import-button').click({ force: true });
  }


  async clickDuplicateSelected() {
    const duplicateButton = this.page.locator('button:has-text("複製")');
    await expect(duplicateButton).toBeVisible();
    await duplicateButton.click();
  }

  async clickDeleteSelected() {
    const deleteButton = this.page.locator('button:has-text("削除")');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
  }

  async getChartItemCount() {
    const chartItems = this.page.locator('[data-testid^="chart-item-"]');
    return await chartItems.count();
  }

  getSpecificTitleLocator(title: string) {
    // サイドバー内で検索
    return this.page.locator('aside').locator(`text=${title}`);
  }
}