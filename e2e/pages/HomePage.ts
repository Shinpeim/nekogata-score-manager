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
    // E2EテストフラグをsessionStorageで設定（Google Drive同期無効化）
    await this.page.evaluate(() => {
      sessionStorage.setItem('__playwright_test__', 'true');
    });
  }

  async clickCreateNew() {
    await this.createNewButton.click();
  }

  async clickImport() {
    await this.importButton.click();
  }

  async clickOpenExplorer() {
    // EmptyChartPlaceholderのopen-explorer-buttonがある場合はそれを使用
    // そうでなければヘッダーのexplorer-toggleを使用
    try {
      if (await this.openExplorerButton.isVisible({ timeout: 1000 })) {
        await this.openExplorerButton.click();
      } else {
        await this.explorerToggle.click();
      }
    } catch {
      // フォールバック: explorer-toggleを使用
      await this.explorerToggle.click();
    }
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
    return this.page.locator('text=Score Explorerを開いて、新しいコード譜を作成したり既存のファイルをインポートしてみましょう');
  }
}