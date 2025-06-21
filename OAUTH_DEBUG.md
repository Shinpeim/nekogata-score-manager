# OAuth デバッグガイド

## 現在の問題
- `client_secret is missing` エラーが発生
- PKCEフローを使用しているのに、client_secretが要求されている

## デバッグログの確認方法

1. ブラウザの開発者ツールを開く
2. Consoleタブで以下のログを確認：
   - `Auth URL params:` - 認証リクエストのパラメータ
   - `Token exchange request:` - トークン交換リクエストの詳細
   - `Token exchange error:` - エラーの詳細情報

## Google Cloud Console で確認すべき項目

1. **OAuth 2.0 クライアントの種類**
   - 「ウェブアプリケーション」が選択されているか確認
   - 「シングルページアプリケーション」や「公開クライアント」の設定があるか確認

2. **承認済みのリダイレクト URI**
   - 本番環境: `https://your-domain.netlify.app/auth/callback`
   - 開発環境: `http://localhost:5173/auth/callback`
   - 末尾のスラッシュの有無に注意

3. **PKCE サポート**
   - Google OAuth 2.0 の設定で PKCE が有効になっているか確認
   - クライアントの種類によってはPKCEがサポートされない場合がある

## 可能な解決策

### 1. クライアントタイプの確認
Google Cloud Consoleで、OAuth 2.0クライアントが「ウェブアプリケーション」として設定されている場合、PKCEを使わない通常のフローに切り替える必要があるかもしれません。

### 2. Implicit Flow への切り替え
SPAの場合、以下のようにImplicit Flowを使用する方法もあります：
```typescript
// response_type を 'token' に変更
response_type: 'token',
// code_challenge と code_challenge_method を削除
```

### 3. Google Identity Services への移行
新しいGoogle Identity Services (GIS) ライブラリを使用する方法も検討できます。

## 次のステップ

1. デバッグログを確認して、実際に送信されているパラメータを確認
2. Google Cloud Console の設定を確認
3. 必要に応じて認証フローを調整