import { type Locator, type Page } from '@playwright/test';

export class ChartViewPage {
  readonly page: Page;
  readonly chartViewer: Locator;
  readonly chartTitle: Locator;
  readonly chartArtist: Locator;
  readonly chartKey: Locator;
  readonly chartTimeSignature: Locator;
  readonly chartTags: Locator;
  readonly chartContent: Locator;
  readonly chartNotes: Locator;
  readonly chartActions: Locator;
  readonly editButton: Locator;
  readonly duplicateButton: Locator;
  readonly deleteButton: Locator;
  readonly emptySections: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chartViewer = page.getByTestId('chart-viewer');
    this.chartTitle = page.getByTestId('chart-title');
    this.chartArtist = page.getByTestId('chart-artist');
    this.chartKey = page.getByTestId('chart-key');
    this.chartTimeSignature = page.getByTestId('chart-time-signature');
    this.chartTags = page.getByTestId('chart-tags');
    this.chartContent = page.getByTestId('chart-content');
    this.chartNotes = page.getByTestId('chart-notes');
    this.chartActions = page.getByTestId('chart-actions');
    this.editButton = page.getByTestId('edit-button');
    this.duplicateButton = page.getByTestId('duplicate-button');
    this.deleteButton = page.getByTestId('delete-button');
    this.emptySections = page.getByTestId('empty-sections');
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async clickDuplicate() {
    await this.duplicateButton.click();
  }

  async clickDelete() {
    await this.deleteButton.click();
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
    await this.chartViewer.waitFor({ state: 'visible', timeout: 5000 });
  }

  async isChartDisplayed(title: string) {
    const chartTitle = this.getChartTitleWithText(title);
    return await chartTitle.isVisible();
  }
}