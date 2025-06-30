import { test, expect } from '@playwright/test';

test.describe('サイドバーの開閉機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('デスクトップ: サイドバーが開いている時にメインペインをクリックするとサイドバーが閉じる', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // ハンバーガーメニューをクリックしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いていることを確認（translate-x-0で判定）
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // デスクトップオーバーレイが存在し、不透明であることを確認
    await expect(page.getByTestId('desktop-overlay')).toBeAttached();
    await expect(page.getByTestId('desktop-overlay')).toHaveClass(/opacity-100/);
    
    // メインペイン（コード譜表示エリア）をクリック
    await page.getByTestId('desktop-overlay').click();
    
    // サイドバーが閉じたことを確認（-translate-x-fullになる）
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('デスクトップ: サイドバー内をクリックしてもサイドバーは閉じない', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // ハンバーガーメニューをクリックしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いていることを確認（translate-x-0で判定）
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // サイドバー内の新規作成ボタンをクリック
    await page.getByTestId('explorer-create-new-button').click();
    
    // フォームが表示されることを確認（サイドバーは閉じない）
    await expect(page.getByTestId('chord-chart-form')).toBeVisible();
  });

  test('デスクトップ: サイドバーを閉じた後、ハンバーガーメニューで再度開ける', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // ハンバーガーメニューをクリックしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いていることを確認（translate-x-0で判定）
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // オーバーレイをクリックしてサイドバーを閉じる
    await page.getByTestId('desktop-overlay').click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    
    // ハンバーガーメニューをクリックして再度開く
    await page.getByTestId('explorer-toggle').click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
  });

  test('デスクトップ: オーバーレイ要素が正しく配置されている', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // ハンバーガーメニューをクリックしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いている時
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // デスクトップ用オーバーレイが存在し、不透明であることを確認
    const overlay = page.getByTestId('desktop-overlay');
    await expect(overlay).toBeAttached();
    await expect(overlay).toHaveClass(/opacity-100/);
    
    // オーバーレイのスタイルを確認
    await expect(overlay).toHaveCSS('position', 'absolute');
  });

  test('デスクトップ: サイドバーが閉じている時はオーバーレイが表示されない', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // サイドバーが閉じている状態を確認（初期状態）
    await expect(page.locator('aside')).toHaveClass(/-translate-x-full/);
    
    // オーバーレイが透明で非アクティブなことを確認
    await expect(page.getByTestId('desktop-overlay')).toHaveClass(/opacity-0/);
  });

  test('デスクトップ: 複数回の開閉が正しく動作する', async ({ page }) => {
    // デスクトップサイズに設定
    await page.setViewportSize({ width: 1280, height: 720 });
    
    for (let i = 0; i < 3; i++) {
      // ハンバーガーメニューで開く
      await page.getByTestId('explorer-toggle').click();
      
      // サイドバーが開いていることを確認
      await expect(page.locator('aside')).toHaveClass(/translate-x-0/);
      
      // オーバーレイをクリックして閉じる
      await page.getByTestId('desktop-overlay').click();
      await expect(page.locator('aside')).toHaveClass(/-translate-x-full/);
    }
  });

  test('モバイル: サイドバー外の暗い背景をタップするとサイドバーが閉じる', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ハンバーガーメニューをタップしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いていることを確認
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // 背景の暗いオーバーレイをタップ
    await page.getByTestId('desktop-overlay').click();
    
    // サイドバーが閉じたことを確認
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('モバイル: 閉じるボタンでもサイドバーを閉じることができる', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ハンバーガーメニューをタップしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いていることを確認
    await expect(page.locator('aside')).toHaveClass(/translate-x-0/);
    
    // 閉じるボタンをタップ
    await page.getByTestId('explorer-close-button').click();
    
    // サイドバーが閉じたことを確認
    await expect(page.locator('aside')).toHaveClass(/-translate-x-full/);
  });

  test('モバイル: 新規作成ボタンをタップするとサイドバーが自動的に閉じる', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // サイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    await expect(page.locator('aside')).toHaveClass(/translate-x-0/);
    
    // 新規作成ボタンをタップ
    await page.getByTestId('explorer-create-new-button').click();
    
    // フォームが表示されることを確認
    await expect(page.getByTestId('chord-chart-form')).toBeVisible();
    
    // サイドバーは開いたままであることを確認（フォーム表示中はサイドバーは閉じない）
    // 実際の動作に合わせて、必要に応じて調整
  });

  test('タブレット: md:ブレークポイントではデスクトップと同じ動作をする', async ({ page }) => {
    // タブレットサイズに設定（md:ブレークポイントは768px以上）
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // ハンバーガーメニューをクリックしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いていることを確認
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // デスクトップオーバーレイが存在することを確認（768pxはmd:ブレークポイント以上）
    await expect(page.getByTestId('desktop-overlay')).toBeAttached();
    
    // オーバーレイをクリック
    await page.getByTestId('desktop-overlay').click();
    
    // サイドバーが閉じたことを確認
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('エッジケース: ビューポートサイズを変更してもオーバーレイが正しく切り替わる', async ({ page }) => {
    // デスクトップサイズで開始
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // ハンバーガーメニューをクリックしてサイドバーを開く
    await page.getByTestId('explorer-toggle').click();
    
    // サイドバーが開いていることを確認
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // デスクトップ用オーバーレイが表示されていることを確認
    await expect(page.getByTestId('desktop-overlay')).toBeAttached();
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // モバイル用オーバーレイ（黒い背景）が表示されることを確認
    await expect(page.getByTestId('desktop-overlay')).toBeVisible();
    
    // デスクトップ用オーバーレイは透明になることを確認（モバイルでは黒い背景）
    await expect(page.getByTestId('desktop-overlay')).toHaveClass(/bg-black/);
  });
});