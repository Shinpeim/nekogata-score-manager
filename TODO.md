# TODO

> 📝 **注意**: 完了済みのタスクは [TODO_DONE.md](./TODO_DONE.md) に移動されました。

## 次期実装予定の機能

### 最優先機能: Google Drive同期
- [x] **複数環境でのスコア同期機能** (推定工数: 2-3週間)
  - [x] 基盤層実装
    - [x] Google API Console設定 (プロジェクト作成、OAuth 2.0設定) ※.env.exampleファイル作成済み
    - [x] 認証フロー実装 (GoogleAuthProvider、トークン管理)
    - [x] 同期アダプター層 (ISyncAdapter、GoogleDriveSyncAdapter)
  - [x] 同期ロジック実装
    - [x] タイムスタンプ管理 (lastSyncedAt、lastModifiedAt、deviceId)
    - [x] コンフリクト検出 (後勝ち戦略、警告表示)
    - [x] 同期実行フロー (pull → compare → warn → push)
  - [x] UI/UX実装
    - [x] 同期状態表示 (SyncStatusIndicator、最終同期時刻)
    - [x] コンフリクト警告ダイアログ (上書き前プレビュー、バックアップオプション)
    - [x] 設定画面 (同期有効/無効、アカウント連携状態、手動同期)
  - [x] エラーハンドリング・テスト
    - [x] ネットワーク/認証エラー対応、リトライ機構
    - [x] MockSyncAdapter実装、コンフリクトシナリオテスト
  - [x] ストア統合・実装完了
    - [x] ~~chordChartStoreへの同期機能統合~~ → **ストア分離対応済み** (PR#88)
      - [x] chordChartStore分離 (396行→256行)
      - [x] syncStore新規作成 (132行、19テスト)
      - [x] 責務分離による保守性向上
    - [x] **ストア間連携実装** (2024-12-16完了)
      - [x] SyncResult型にmergedChartsフィールド追加
      - [x] chordChartStoreにapplySyncedCharts()とイベント機能追加
      - [x] SyncManagerでmergedCharts返却対応
      - [x] useChartSyncカスタムフック作成（手動+自動同期）
    - [x] **残り実装タスク** 
      - [x] Header/MainLayoutへの同期UI追加  
      - [x] App.tsxでの同期初期化処理
      - [x] 初回認証フロー実装
      - [x] Google Drive API認証エラーの修正（フォルダ作成処理）

### 高優先度（上のものほど優先度が高い）
- [ ] exportするときにjsonがインデントされていて、ヒューマンリーダブルではあるんだけど無駄なので余計な空白はなしにしてほしいな
- [ ] モバイル環境で使っている時に、インプットにフォーカスされたりするとそこにズームインしてしまう。常に同じサイズで使いたい
- [ ] リロードすると、開いていた楽譜ファイルとは違う楽譜ファイルが開いた状態になる。最後に開いていた譜面を覚えていてほしい。
- [ ] Score Explorerの楽譜一覧のソート機能を作りたい(名前、作成日時、更新日時それぞれに対して昇順、降順)
- [ ] コード譜の検索・フィルタリング機能

### 中優先度
- [ ] PWAアイコンの作成・設定
- [ ] エクスポート機能（PDF、テキスト等）
- [ ] コード譜のバックアップ・復元機能

### 低優先度
- [ ] オフライン対応の詳細実装
- [ ] ダークモード対応
- [ ] 楽器別表示設定

---

## 📈 進捗状況

- **完了済みタスク**: [TODO_DONE.md](./TODO_DONE.md) を参照
- **現在のタスク数**: 4件
- **最優先度**: 高優先度タスク（エクスポート最適化、モバイルズーム対策、楽譜記憶機能、ソート機能）
- **同期機能進捗**: ✅ 実装完了

### 🎯 現在の状況（2025-06-17時点）
- ✅ **PR#88**: chordChartStore分離完了（ストア責務分離）
- ✅ **PR#89**: syncStore-chordChartStore連携実装完了
- ✅ **PR#102**: Google Drive同期UI統合完了
- ✅ **chordChartStoreリファクタリング**: 338行ストアを3ストアに分離（chartDataStore、chartCrudStore、useChartManagement統合フック）
- ✅ **Google Drive同期機能実装完了**: 認証エラー修正（フォルダ自動作成処理）
- 📋 **進捗**: 同期機能の全実装完了（基盤・ロジック・ストア連携・UI統合・エラーハンドリング）