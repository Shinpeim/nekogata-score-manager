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

リポジトリに変更をコミットする前にTODO.mdとworking_logを更新すること

## 作業ログの残し方

- todoをTODO.mdに書いて管理してください
- 作業ログを working_log ディレクトリに残してください 

## testing

このプロジェクトでは必ずテストを書くこと

## lint

コミットするコードはlintに通っている必要がある