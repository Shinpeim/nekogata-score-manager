import { test, expect } from '@playwright/test';
import { createChart, deleteAllCharts } from './helpers/chord-helpers';

test.describe('フォントサイズ調整機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await deleteAllCharts(page);
  });

  test.afterEach(async ({ page }) => {
    await deleteAllCharts(page);
  });

  test('新規チャートでフォントサイズを調整できる', async ({ page }) => {
    // 新規チャート作成
    await createChart(page, {
      title: 'フォントサイズテスト',
      artist: 'テストアーティスト',
      key: 'C'
    });

    // デフォルトフォントサイズの確認（表示画面）
    await expect(page.getByText('14px')).toBeVisible();

    // フォントサイズを大きくする
    await page.getByRole('button', { name: '文字サイズを大きくする' }).click();
    await expect(page.getByText('16px')).toBeVisible();

    // さらに大きくする
    await page.getByRole('button', { name: '文字サイズを大きくする' }).click();
    await expect(page.getByText('18px')).toBeVisible();

    // フォントサイズを小さくする
    await page.getByRole('button', { name: '文字サイズを小さくする' }).click();
    await expect(page.getByText('16px')).toBeVisible();

    // ページをリロードしても設定が維持されることを確認
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('16px')).toBeVisible();
  });

  test('最大・最小フォントサイズの制限', async ({ page }) => {
    // 新規チャート作成
    await createChart(page, {
      title: 'フォントサイズ制限テスト',
      artist: 'テストアーティスト',
      key: 'C'
    });

    // 最小サイズまで小さくする（表示画面）
    for (let i = 0; i < 10; i++) {
      const decreaseButton = page.getByRole('button', { name: '文字サイズを小さくする' });
      const isDisabled = await decreaseButton.isDisabled();
      if (isDisabled) break;
      await decreaseButton.click();
    }

    // 最小サイズ（10px）に到達
    await expect(page.getByText('10px')).toBeVisible();
    await expect(page.getByRole('button', { name: '文字サイズを小さくする' })).toBeDisabled();

    // 最大サイズまで大きくする
    for (let i = 0; i < 20; i++) {
      const increaseButton = page.getByRole('button', { name: '文字サイズを大きくする' });
      const isDisabled = await increaseButton.isDisabled();
      if (isDisabled) break;
      await increaseButton.click();
    }

    // 最大サイズ（24px）に到達
    await expect(page.getByText('24px')).toBeVisible();
    await expect(page.getByRole('button', { name: '文字サイズを大きくする' })).toBeDisabled();
  });

  test('フォントサイズがコード表示に反映される', async ({ page }) => {
    // チャート作成
    await createChart(page, {
      title: 'コード表示テスト',
      artist: 'テストアーティスト',
      key: 'C'
    });

    // 編集モードでコードを追加
    await page.getByRole('button', { name: '編集' }).click();
    
    // セクション追加
    await page.getByRole('button', { name: 'セクション追加' }).click();
    
    // コード追加
    await page.getByTestId('add-chord-button').click();
    await page.getByPlaceholder('コード名').fill('C');
    await page.getByPlaceholder('拍数').fill('4');
    
    // 保存して表示モードに戻る
    await page.getByRole('button', { name: '保存' }).click();
    
    // 表示画面でフォントサイズを18pxに変更
    await page.getByRole('button', { name: '文字サイズを大きくする' }).click();
    await page.getByRole('button', { name: '文字サイズを大きくする' }).click();
    
    // 表示されたコードのフォントサイズを確認
    const chordDisplay = page.getByText('C').first();
    await expect(chordDisplay).toHaveCSS('font-size', '18px');
  });

  test('エクスポート・インポートでフォントサイズが保持される', async ({ page }) => {
    // チャート作成
    await createChart(page, {
      title: 'エクスポートテスト',
      artist: 'テストアーティスト',
      key: 'C'
    });

    // 表示画面でフォントサイズを20pxに設定
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: '文字サイズを大きくする' }).click();
    }
    await expect(page.getByText('20px')).toBeVisible();

    // エクスポート
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'エクスポート' }).click();
    await page.getByRole('button', { name: 'エクスポート' }).last().click();
    const download = await downloadPromise;
    
    // ダウンロードされたファイルの内容を確認
    const downloadPath = await download.path();
    if (downloadPath) {
      // E2Eテストではファイル内容の検証はスキップ（Playwrightの制約）
      // fontSizeの保持はインポート後に確認する
    }

    // チャートを削除してからインポート
    await deleteAllCharts(page);

    // インポート
    await page.getByRole('button', { name: 'インポート' }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(await download.path());
    await page.getByRole('button', { name: 'インポート実行' }).click();
    
    // インポート後のフォントサイズを確認（表示画面）
    await page.getByText('エクスポートテスト').click();
    await expect(page.getByText('20px')).toBeVisible();
  });
});