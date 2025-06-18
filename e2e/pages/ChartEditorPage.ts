import { type Locator, type Page } from '@playwright/test';

export class ChartEditorPage {
  readonly page: Page;
  readonly chartEditor: Locator;
  readonly editorTitle: Locator;
  readonly editorActions: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chartEditor = page.getByTestId('chart-editor');
    this.editorTitle = page.getByTestId('editor-title');
    this.editorActions = page.getByTestId('editor-actions');
    this.cancelButton = page.getByTestId('editor-cancel-button');
    this.saveButton = page.getByTestId('editor-save-button');
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async isSaveButtonEnabled() {
    return await this.saveButton.isEnabled();
  }

  async waitForEditorToLoad() {
    await this.chartEditor.waitFor({ state: 'visible', timeout: 5000 });
  }

  async isEditorVisible() {
    return await this.chartEditor.isVisible();
  }
}