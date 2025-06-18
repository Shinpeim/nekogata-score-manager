import { type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly header: Locator;
  readonly appTitle: Locator;
  readonly createNewButton: Locator;
  readonly importButton: Locator;
  readonly openExplorerButton: Locator;
  readonly explorerToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('header');
    this.appTitle = page.getByTestId('app-title');
    this.createNewButton = page.getByTestId('create-new-button');
    this.importButton = page.getByTestId('import-button');
    this.openExplorerButton = page.getByTestId('open-explorer-button');
    this.explorerToggle = page.getByTestId('explorer-toggle');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickCreateNew() {
    await this.createNewButton.click();
  }

  async clickImport() {
    await this.importButton.click();
  }

  async clickOpenExplorer() {
    await this.openExplorerButton.click();
  }

  async toggleExplorer() {
    await this.explorerToggle.click();
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  getEmptyStateMessage() {
    return this.page.locator('text=コード譜がありません');
  }

  getWelcomeMessage() {
    return this.page.locator('text=まずは新しいコード譜を作成するか、既存のファイルをインポートしてみましょう');
  }
}