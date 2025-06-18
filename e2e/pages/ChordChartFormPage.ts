import { type Locator, type Page } from '@playwright/test';

export class ChordChartFormPage {
  readonly page: Page;
  readonly form: Locator;
  readonly titleInput: Locator;
  readonly artistInput: Locator;
  readonly keySelect: Locator;
  readonly tempoInput: Locator;
  readonly timeSignatureSelect: Locator;
  readonly tagsInput: Locator;
  readonly notesTextarea: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('chord-chart-form');
    this.titleInput = page.getByTestId('title-input');
    this.artistInput = page.locator('#artist');
    this.keySelect = page.locator('#key');
    this.tempoInput = page.locator('#tempo');
    this.timeSignatureSelect = page.locator('#timeSignature');
    this.tagsInput = page.locator('#tags');
    this.notesTextarea = page.locator('#notes');
    this.cancelButton = page.getByTestId('cancel-button');
    this.saveButton = page.getByTestId('save-button');
  }

  async fillTitle(title: string) {
    await this.titleInput.clear();
    await this.titleInput.fill(title);
  }

  async fillArtist(artist: string) {
    await this.artistInput.clear();
    await this.artistInput.fill(artist);
  }

  async selectKey(key: string) {
    await this.keySelect.selectOption(key);
  }

  async fillTempo(tempo: number) {
    await this.tempoInput.clear();
    await this.tempoInput.fill(tempo.toString());
  }

  async selectTimeSignature(timeSignature: string) {
    await this.timeSignatureSelect.selectOption(timeSignature);
  }

  async fillTags(tags: string) {
    await this.tagsInput.clear();
    await this.tagsInput.fill(tags);
  }

  async fillNotes(notes: string) {
    await this.notesTextarea.clear();
    await this.notesTextarea.fill(notes);
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async fillBasicInfo(data: {
    title?: string;
    artist?: string;
    key?: string;
    tempo?: number;
    timeSignature?: string;
    tags?: string;
    notes?: string;
  }) {
    if (data.title !== undefined) await this.fillTitle(data.title);
    if (data.artist !== undefined) await this.fillArtist(data.artist);
    if (data.key !== undefined) await this.selectKey(data.key);
    if (data.tempo !== undefined) await this.fillTempo(data.tempo);
    if (data.timeSignature !== undefined) await this.selectTimeSignature(data.timeSignature);
    if (data.tags !== undefined) await this.fillTags(data.tags);
    if (data.notes !== undefined) await this.fillNotes(data.notes);
  }

  getFormTitle() {
    return this.page.locator('h2').filter({ hasText: /コード譜を/ });
  }

  getErrorMessages() {
    return this.page.locator('ul li').filter({ hasText: /.+/ });
  }
}