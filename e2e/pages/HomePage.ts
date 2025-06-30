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

  async waitForInitialLoad() {
    // ページの初期読み込み完了を待つ
    await this.page.waitForLoadState('networkidle');
    // ヘッダーが表示されるまで待つ（app-titleは非表示なのでヘッダーで判定）
    await this.header.waitFor({ state: 'visible', timeout: 5000 });
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
    
    // Score Explorerが開くのを待つ（幅が0より大きくなるのを待つ）
    const sidebar = this.page.locator('aside');
    await sidebar.waitFor({ state: 'attached' }); // DOMに存在することを確認
    await sidebar.evaluate((el) => {
      return new Promise((resolve) => {
        // 既に開いている場合のチェック
        const currentWidth = parseInt(window.getComputedStyle(el).width, 10);
        if (currentWidth > 0) {
          resolve(true);
          return;
        }
        
        // MutationObserverで変更を監視
        const observer = new MutationObserver(() => {
          const width = parseInt(window.getComputedStyle(el).width, 10);
          if (width > 0) {
            observer.disconnect();
            resolve(true);
          }
        });
        observer.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
        
        // タイムアウト設定（フォールバック）
        setTimeout(() => {
          observer.disconnect();
          resolve(true);
        }, 3000);
      });
    });
  }

  async toggleExplorer() {
    await this.explorerToggle.dispatchEvent('click');
  }
  
  async ensureExplorerOpen() {
    // サイドバーのtransformで判定する方法に変更
    const sidebar = this.page.locator('aside');
    
    // Score Explorerが開いているか確認（translateX(0)かどうか）
    const isOpen = await sidebar.evaluate((el) => {
      const transform = window.getComputedStyle(el).transform;
      // translate-x-0の場合、transformは'none'または'matrix(1, 0, 0, 1, 0, 0)'
      return transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)';
    });
    
    if (!isOpen) {
      await this.explorerToggle.click();
      
      // サイドバーが開くまで待つ（translateX(0)になるまで）
      await sidebar.waitFor({
        state: 'visible',
        timeout: 5000
      });
      
      // アニメーション完了を待つ
      await this.page.waitForTimeout(300); // transition-duration-300
    }
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
    // Wait for viewport change to take effect by checking actual viewport size
    await this.page.waitForFunction(
      ({ expectedWidth, expectedHeight }) => {
        return window.innerWidth >= expectedWidth && window.innerHeight >= expectedHeight;
      },
      { expectedWidth: 1280, expectedHeight: 720 },
      { timeout: 5000 }
    );
  }

  getEmptyStateMessage() {
    return this.page.locator('text=コード譜がありません');
  }

  getWelcomeMessage() {
    return this.page.locator('text=Score Explorerを開いて、新しいコード譜を作成したり既存のファイルをインポートしてみましょう');
  }
}