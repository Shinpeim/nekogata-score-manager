# Nekogata Score Manager

Nekogata Score Manager は、ブラウザ上で動作するコード譜管理アプリケーションです。楽曲のコード譜を作成・編集・管理し、移調機能やインポート・エクスポート機能を提供します。

実際のプロダクトは以下のURLで動いています。

https://nekogata-score-manager.netlify.app/

## プロジェクトについて

このプロジェクトは、Shinpei Maruyamaが実際に欲しいと思っていたコード譜管理アプリケーションを、VibeCoding（Claude Codeを使った開発）の練習を兼ねて作成したものです。自分自身のニーズに基づいて設計されており、実用性を重視した機能構成になっています。

**注意**: このアプリケーションは実験的なプロジェクトです。データの保存・復元、機能の継続性、セキュリティなど、いかなる保証も提供されません。重要なデータのバックアップは各自で行い、自己責任でご利用ください。

## 主要機能

- **コード譜の作成・編集・閲覧**: 直感的なインターフェースでコード譜を管理
- **移調機能**: 楽曲キーの変更が簡単に行えます
- **インポート・エクスポート**: データのバックアップや他のユーザーとの楽譜共有に
- **ドラッグ&ドロップ**: コードやセクションの並び替えが簡単
- **オフライン対応**: PWA（Progressive Web App）として動作
- **レスポンシブデザイン**: モバイル・デスクトップ両対応

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Storage**: LocalForage（ブラウザローカルストレージ）
- **Testing**: Vitest + React Testing Library + Playwright
- **PWA**: Workbox
- **Drag & Drop**: @dnd-kit

## セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd claude-code-playground

# 依存関係をインストール
npm install

# 環境変数を設定（オプション）
cp .env.example .env
# .envファイルを編集してDropboxのクライアントIDを設定

# 開発サーバーを起動
npm run dev
```

### Dropbox同期機能の設定（オプション）

同期機能を使用する場合は、Dropbox APIアプリの設定が必要です。

1. [Dropbox App Console](https://www.dropbox.com/developers/apps) にアクセス
2. "Create app" をクリック
3. 設定項目：
   - **API**: "Scoped access" を選択
   - **Access**: "App folder" を選択（推奨）
   - **App name**: 任意の名前を入力
4. アプリ作成後の設定：
   - **App key** をコピー
   - **Permissions** タブで以下を有効化：
     - `files.content.write`
     - `files.content.read`
   - **Redirect URIs** に以下を追加：
     - 開発環境: `http://localhost:5173/auth/callback`
     - 本番環境: `https://your-domain.com/auth/callback`
5. `.env` ファイルに App key を設定：
   ```
   VITE_DROPBOX_CLIENT_ID=your-dropbox-app-key-here
   ```

## 開発コマンド

### 基本コマンド
```bash
npm run dev          # 開発サーバーを起動（HMR対応）
npm run build        # TypeScriptコンパイル + Vite本番ビルド
npm run lint         # ESLintでコード品質チェック
npm test             # Vitestでテスト実行
npm run test:ui      # テストUIインターフェース
npm run test:coverage # カバレッジ付きテスト実行
npm run preview      # 本番ビルドをローカルでプレビュー
```

### E2Eテスト
```bash
npm run test:e2e         # E2Eテスト実行（ヘッドレスモード）
npm run test:e2e:headless # E2Eテスト（明示的にヘッドレス）
npm run test:e2e:headed  # E2Eテスト（ブラウザUI表示）
npm run test:e2e:ui      # PlaywrightのUIモードでE2Eテスト
```

### 静的解析
```bash
npm run knip         # 未使用コード検出
```

### 単体テスト実行例
```bash
# 特定のテストファイルを実行
npx vitest run src/utils/__tests__/export.test.ts

# パターンマッチでテスト実行
npx vitest run --grep "test name pattern"

# 特定のE2Eテストを実行
npx playwright test chart-creation.spec.ts --reporter=list
```

## 品質管理

このプロジェクトでは以下の品質管理ツールを使用しています：

- **ESLint**: コード品質とスタイルの統一
- **TypeScript**: 型安全性の確保
- **Vitest**: 単体テスト・統合テスト
- **Playwright**: E2Eテスト
- **Knip**: 未使用コード検出

## ログ設定

環境変数`VITE_LOG_LEVEL`でログレベルを制御できます：

```bash
# エラーのみ出力（本番環境推奨）
VITE_LOG_LEVEL=ERROR npm run dev

# 警告以上を出力
VITE_LOG_LEVEL=WARN npm run dev

# 情報ログ以上を出力（開発環境デフォルト）
VITE_LOG_LEVEL=INFO npm run dev

# デバッグログ含む全て出力
VITE_LOG_LEVEL=DEBUG npm run dev
```

## ライセンス

このプロジェクトはCreative Commons Attribution-NonCommercial 4.0 International License（CC BY-NC 4.0）の下で公開されています。

**個人・学習・研究目的での利用は自由**ですが、**商用利用は禁止**されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

第三者ライブラリのライセンス情報については、[LICENSE-THIRD-PARTY.md](LICENSE-THIRD-PARTY.md)を参照してください。
