import { chromium } from '@playwright/test';

async function globalSetup() {
  // E2Eテスト用の環境変数を設定
  process.env.VITE_E2E_TEST = 'true';
  
  // ブラウザコンテキストのデフォルト設定
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  // Google APIへのアクセスをブロック
  await context.route('**/*googleapis.com/**', route => route.abort());
  await context.route('**/*accounts.google.com/**', route => route.abort());
  await context.route('**/*gstatic.com/**', route => route.abort());
  
  await browser.close();
  
  console.log('E2Eテスト環境のセットアップ完了');
}

export default globalSetup;