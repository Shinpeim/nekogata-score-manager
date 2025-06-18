import { type Locator, type Page } from '@playwright/test';

export class ChartEditorPage {
  readonly page: Page;
  readonly chartEditor: Locator;
  readonly editorTitle: Locator;
  readonly editorActions: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  
  // Section operations
  readonly addSectionButton: Locator;
  readonly sectionsContainer: Locator;
  
  // Notes textarea
  readonly notesTextarea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chartEditor = page.getByTestId('chart-editor');
    this.editorTitle = page.getByTestId('editor-title');
    this.editorActions = page.getByTestId('editor-actions');
    this.cancelButton = page.getByTestId('editor-cancel-button');
    this.saveButton = page.getByTestId('editor-save-button');
    
    // Section operations
    this.addSectionButton = page.locator('button:has-text("セクション追加")');
    this.sectionsContainer = page.locator('.mb-8').filter({ hasText: 'セクション' }).first();
    
    // Notes textarea
    this.notesTextarea = page.locator('#notes-textarea');
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

  // Section operations
  async clickAddSection() {
    await this.addSectionButton.click();
  }

  async getSectionCount() {
    const sections = await this.page.locator('[data-section-card]').count();
    return sections;
  }

  async getSectionById(sectionId: string) {
    return this.page.locator(`[data-section-card="${sectionId}"]`);
  }

  getSectionByIndex(index: number) {
    return this.page.locator('[data-section-card]').nth(index);
  }

  async getSectionName(sectionIndex: number): Promise<string> {
    const section = this.getSectionByIndex(sectionIndex);
    const nameInput = section.locator('input[placeholder*="セクション名"], input[value]').first();
    return await nameInput.inputValue();
  }

  async setSectionName(sectionIndex: number, name: string) {
    const section = this.getSectionByIndex(sectionIndex);
    const nameInput = section.locator('input[placeholder*="セクション名"], input[value]').first();
    await nameInput.fill(name);
    await nameInput.press('Enter'); // セクション名を確定
  }

  async deleteSectionByIndex(sectionIndex: number) {
    const section = this.getSectionByIndex(sectionIndex);
    const deleteButton = section.locator('button:has-text("削除"), button[title*="削除"]').first();
    await deleteButton.click();
  }

  async duplicateSectionByIndex(sectionIndex: number) {
    const section = this.getSectionByIndex(sectionIndex);
    const duplicateButton = section.locator('button:has-text("複製"), button[title*="複製"]').first();
    await duplicateButton.click();
  }

  // Chord operations
  async addChordToSection(sectionIndex: number) {
    const section = this.getSectionByIndex(sectionIndex);
    const addChordButton = section.getByTestId('add-chord-button');
    await addChordButton.click();
  }

  async getChordCount(sectionIndex: number) {
    const section = this.getSectionByIndex(sectionIndex);
    const chords = await section.locator('[data-chord-item]').count();
    return chords;
  }

  async setChordName(sectionIndex: number, chordIndex: number, chordName: string) {
    const section = this.getSectionByIndex(sectionIndex);
    // コード名専用のinputを取得（placeholderで識別）
    const chordInput = section.locator('[data-chord-item]').nth(chordIndex).locator('input[placeholder="コード名"]');
    await chordInput.clear(); // 既存値をクリア
    await chordInput.fill(chordName);
    await chordInput.press('Enter'); // コード名を確定
    await this.page.waitForTimeout(100); // 入力確定を待機
  }

  async getChordName(sectionIndex: number, chordIndex: number): Promise<string> {
    const section = this.getSectionByIndex(sectionIndex);
    // コード名専用のinputを取得（placeholderで識別）
    const chordInput = section.locator('[data-chord-item]').nth(chordIndex).locator('input[placeholder="コード名"]');
    return await chordInput.inputValue();
  }

  getChordByIndex(sectionIndex: number, chordIndex: number) {
    const section = this.getSectionByIndex(sectionIndex);
    return section.locator('[data-chord-item]').nth(chordIndex);
  }

  async deleteChord(sectionIndex: number, chordIndex: number) {
    const section = this.getSectionByIndex(sectionIndex);
    const chord = section.locator('[data-chord-item]').nth(chordIndex);
    const deleteButton = chord.getByTestId('delete-chord-button');
    await deleteButton.click();
  }

  async insertLineBreakAfterChord(sectionIndex: number, chordIndex: number) {
    const section = this.getSectionByIndex(sectionIndex);
    const chord = section.locator('[data-chord-item]').nth(chordIndex);
    const lineBreakButton = chord.locator('button:has-text("改行"), button[title*="改行"]').first();
    await lineBreakButton.click();
  }

  // Chart content verification
  async getAllSectionNames(): Promise<string[]> {
    const sections = await this.page.locator('[data-section-card]').count();
    const names: string[] = [];
    
    for (let i = 0; i < sections; i++) {
      const name = await this.getSectionName(i);
      names.push(name);
    }
    
    return names;
  }

  async getAllChordsInSection(sectionIndex: number): Promise<string[]> {
    const chordCount = await this.getChordCount(sectionIndex);
    const chords: string[] = [];
    
    for (let i = 0; i < chordCount; i++) {
      const chord = await this.getChordName(sectionIndex, i);
      chords.push(chord);
    }
    
    return chords;
  }

  // Notes operations
  async setNotes(notes: string) {
    await this.notesTextarea.fill(notes);
  }

  async getNotes(): Promise<string> {
    return await this.notesTextarea.inputValue();
  }

  // Wait helpers
  async waitForSectionToAppear(expectedCount: number) {
    await this.page.waitForFunction(
      (count) => document.querySelectorAll('[data-section-card]').length === count,
      expectedCount,
      { timeout: 5000 }
    );
  }

  async waitForChordToAppear(sectionIndex: number, expectedCount: number) {
    await this.page.waitForFunction(
      ([sectionIndex, count]) => {
        const sections = document.querySelectorAll('[data-section-card]');
        const targetSection = sections[sectionIndex];
        return targetSection ? targetSection.querySelectorAll('[data-chord-item]').length === count : false;
      },
      [sectionIndex, expectedCount],
      { timeout: 5000 }
    );
  }

  // ドラッグ&ドロップ操作用メソッド
  async dragChordToPosition(fromSectionIndex: number, fromChordIndex: number, toSectionIndex: number, toChordIndex: number) {
    const sourceChord = this.getChordByIndex(fromSectionIndex, fromChordIndex);
    const targetChord = this.getChordByIndex(toSectionIndex, toChordIndex);
    
    // ドラッグハンドルを取得（⋮⋮ボタン）
    const dragHandle = sourceChord.locator('button[title="ドラッグして移動"]');
    
    // より詳細なマウス操作でドラッグ&ドロップを実行
    const sourceBoundingBox = await dragHandle.boundingBox();
    const targetBoundingBox = await targetChord.boundingBox();
    
    if (sourceBoundingBox && targetBoundingBox) {
      // マウスイベントによるドラッグ操作
      await this.page.mouse.move(sourceBoundingBox.x + sourceBoundingBox.width / 2, sourceBoundingBox.y + sourceBoundingBox.height / 2);
      await this.page.mouse.down();
      await this.page.waitForTimeout(200);
      await this.page.mouse.move(targetBoundingBox.x + targetBoundingBox.width / 2, targetBoundingBox.y + targetBoundingBox.height / 2, { steps: 5 });
      await this.page.waitForTimeout(200);
      await this.page.mouse.up();
    }
    
    // ドロップ完了を待機
    await this.page.waitForTimeout(800);
  }

  async dragSectionToPosition(fromSectionIndex: number, toSectionIndex: number) {
    const sourceSection = this.getSectionByIndex(fromSectionIndex);
    const targetSection = this.getSectionByIndex(toSectionIndex);
    
    // セクションのドラッグハンドル（SVGアイコン）を取得
    const dragHandle = sourceSection.locator('svg').first();
    
    // より詳細なマウス操作でドラッグ&ドロップを実行
    const sourceBoundingBox = await dragHandle.boundingBox();
    const targetBoundingBox = await targetSection.boundingBox();
    
    if (sourceBoundingBox && targetBoundingBox) {
      // マウスイベントによるドラッグ操作
      await this.page.mouse.move(sourceBoundingBox.x + sourceBoundingBox.width / 2, sourceBoundingBox.y + sourceBoundingBox.height / 2);
      await this.page.mouse.down();
      await this.page.waitForTimeout(200);
      await this.page.mouse.move(targetBoundingBox.x + targetBoundingBox.width / 2, targetBoundingBox.y + targetBoundingBox.height / 2, { steps: 5 });
      await this.page.waitForTimeout(200);
      await this.page.mouse.up();
    }
    
    // ドロップ完了を待機
    await this.page.waitForTimeout(800);
  }

  // ドラッグ&ドロップ後の順序確認用メソッド
  async getChordOrderInSection(sectionIndex: number): Promise<string[]> {
    const section = this.getSectionByIndex(sectionIndex);
    
    // 改行ではないコードアイテムのみを取得
    const chordItems = section.locator('[data-chord-item]').filter({
      hasNot: this.page.locator('text=改行')
    });
    
    const count = await chordItems.count();
    const chords: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // 各コードアイテム内のコード名入力フィールドを取得
      const chordInput = chordItems.nth(i).locator('input[placeholder="コード名"]');
      const value = await chordInput.inputValue();
      if (value && value.trim()) {
        chords.push(value.trim());
      }
    }
    return chords;
  }

  async getSectionOrder(): Promise<string[]> {
    return await this.getAllSectionNames();
  }
}