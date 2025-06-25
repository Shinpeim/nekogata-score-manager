import { type Locator, type Page, expect } from '@playwright/test';

export class ScoreExplorerPage {
  readonly page: Page;
  readonly isMobile: boolean;
  readonly title: Locator;
  readonly titleMobile: Locator;
  readonly titleDesktop: Locator;
  readonly chartsTab: Locator;
  readonly setlistsTab: Locator;
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
    
    this.chartsTab = page.getByTestId(`charts-tab-${isMobile ? 'mobile' : 'desktop'}`);
    this.setlistsTab = page.getByTestId(`setlists-tab-${isMobile ? 'mobile' : 'desktop'}`);
    
    this.selectAllCheckbox = page.getByTestId(`select-all-checkbox-${isMobile ? 'mobile' : 'desktop'}`);
    
    this.createNewButtonMobile = page.getByTestId('explorer-create-new-button-mobile');
    this.createNewButtonDesktop = page.getByTestId('explorer-create-new-button-desktop');
    this.createNewButton = isMobile ? this.createNewButtonMobile : this.createNewButtonDesktop;
    
    this.importButtonMobile = page.getByTestId('explorer-import-button-mobile');
    this.importButtonDesktop = page.getByTestId('explorer-import-button-desktop');
    this.importButton = isMobile ? this.importButtonMobile : this.importButtonDesktop;
  }

  async clickCreateNew() {
    // 条件付きレンダリングになったため、可視性を確認してから通常クリック
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
    // デバイス別のdata-testidで一意に取得
    return this.page.getByTestId(`chart-checkbox-${index}-${this.isMobile ? 'mobile' : 'desktop'}`);
  }

  getChartItem(index: number) {
    // デバイス別のdata-testidで一意に取得
    return this.page.getByTestId(`chart-item-${index}-${this.isMobile ? 'mobile' : 'desktop'}`);
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
    // デバイスに応じて適切な要素を選択
    if (this.isMobile) {
      return this.page.locator('.md\\:hidden >> text=件選択中');
    } else {
      return this.page.locator('.hidden.md\\:block >> text=件選択中');
    }
  }

  async openActionDropdown() {
    const actionButton = this.page.getByTestId(`action-dropdown-button-${this.isMobile ? 'mobile' : 'desktop'}`);
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
    const testId = this.isMobile ? 'explorer-import-button-mobile' : 'explorer-import-button-desktop';
    await this.page.getByTestId(testId).click({ force: true });
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
    const chartItems = this.page.locator(`[data-testid^="chart-item-"][data-testid$="-${this.isMobile ? 'mobile' : 'desktop'}"]`);
    return await chartItems.count();
  }

  getSpecificTitleLocator(title: string) {
    // デバイスに応じて適切な要素内で検索
    if (this.isMobile) {
      return this.page.locator('.md\\:hidden').locator(`text=${title}`);
    } else {
      return this.page.locator('.hidden.md\\:block').locator(`text=${title}`);
    }
  }
}