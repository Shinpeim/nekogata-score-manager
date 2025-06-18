import { type Page } from '@playwright/test';

export class ChartViewPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getChartTitle(title: string) {
    return this.page.locator('h2').filter({ hasText: title });
  }

  getChartArtist(artist: string) {
    return this.page.locator('text=' + artist);
  }

  getChartKey() {
    return this.page.locator('[data-testid="chart-key"]');
  }

  getChartTempo() {
    return this.page.locator('[data-testid="chart-tempo"]');
  }

  getChartTimeSignature() {
    return this.page.locator('[data-testid="chart-time-signature"]');
  }

  getChartTags() {
    return this.page.locator('[data-testid="chart-tags"]');
  }

  getChartNotes() {
    return this.page.locator('[data-testid="chart-notes"]');
  }

  async waitForChartToLoad() {
    // チャートのタイトルが表示されるまで待機
    await this.page.waitForSelector('h2', { timeout: 5000 });
  }

  async isChartDisplayed(title: string) {
    const chartTitle = this.getChartTitle(title);
    return await chartTitle.isVisible();
  }
}