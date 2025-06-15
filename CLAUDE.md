# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## what is this software
このリポジトリでは、コード譜の作成・閲覧・管理ができるソフトウェアを作りたいです。

このソフトウェアでは、以下の機能を実装したいと考えています。

- コード譜の作成
- コード譜の編集
- コード譜の閲覧

このソフトウェアの動作環境としては、以下の要件を満たす必要があります。
- ブラウザで動作すること
- モバイルデバイスでの利用を考慮すること
- バックエンドを必要としないこと
- オフラインでも利用可能であること
- ユーザーデータの保存はローカルストレージを使用すること
- ユーザーインターフェースはシンプルで直感的であること

## gitの扱い方

main ブランチに直接コミットはせず、作業単位ごとにブランチを切り、GitHub上でPullRequestを送ること。

リポジトリに変更をコミットする前にTODO.mdを更新すること

コミットログは日本語で書いて

## 作業ログの残し方

- todoをTODO.mdに書いて管理してください

## testing

このプロジェクトでは必ずテストを書くこと

## lint

コミットするコードはlintに通っている必要がある

## build

コミットするコードは必ずビルドできる必要がある

## UI Design Guidelines / デザインガイドライン

### Color Palette / カラーパレット

Nekogata Score Managerでは、統一感があり直感的なユーザーインターフェースを提供するため、以下のカラーパレットを使用します。

#### Custom Color Palette / カスタムカラーパレット

**Slate系 (基本UI)**
- `bg-slate-50`: ページ全体の背景色
- `bg-slate-100`, `bg-slate-200`: セカンダリ背景、ホバー状態
- `bg-slate-300`: 無効状態のボタン
- `text-slate-600`, `text-slate-700`, `text-slate-900`: テキスト階層
- `border-slate-200`, `border-slate-300`: 境界線

#### Accent Colors / アクセントカラー (3色限定)

**Teal (#85B0B7) - メイン機能**
- メイン操作ボタン（新規作成、編集、保存）
- 選択状態の背景
- プライマリアクション

**Sage (#BDD0CA) - セカンダリ機能**
- インポート、確定ボタン
- 情報表示、成功状態
- セカンダリアクション

**Coral (#EE5840) - 削除・エラー**
- 削除ボタン
- エラー状態の背景
- 警告・注意表示

#### 使用ルール

1. **機能による色分け**
   - Teal (#85B0B7): メイン機能（作成、編集、保存）
   - Sage (#BDD0CA): セカンダリ機能（インポート、情報表示）
   - Coral (#EE5840): 削除・エラー系

2. **カスタムカラー実装**
   ```css
   /* Tailwindのarbitrary valuesを使用 */
   bg-[#85B0B7] hover:bg-[#6B9CA5] text-white    /* Teal */
   bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 /* Sage */
   bg-[#EE5840] hover:bg-[#D14A2E] text-white     /* Coral */
   ```

3. **アクセシビリティ**
   - 背景とテキストのコントラスト比4.5:1以上を確保
   - 色だけでなく形状やテキストでも情報を伝達

4. **一貫性**
   - 同じ機能には常に同じ色を使用
   - ホバー状態は10-15%暗くした色を使用

### Typography / タイポグラフィ

- 見出し: `text-lg font-semibold text-slate-900`
- 本文: `text-sm text-slate-700`
- 補助テキスト: `text-xs text-slate-500`
- ボタンテキスト: `text-sm font-medium`

### Spacing / スペーシング

- 要素間の基本スペース: `gap-2`, `gap-3`
- セクション間: `space-y-4`
- パディング: `px-3 py-2` (ボタン), `p-4` (カード)

この色彩設計により、ユーザーは直感的に各要素の機能を理解でき、一貫性のある操作体験を得ることができます。