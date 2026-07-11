# KINSEI テスト不合格項目 ローカル修正結果

修正日: 2026-07-11

対象: [`current-test-execution-report-20260710.md`](./current-test-execution-report-20260710.md) のFAIL 28件

範囲: ローカル修正、接続先Supabaseへのmigration適用、DB/RLS再検証。GitHub push・Vercelデプロイはこの記録時点では未実施。

## 修正内容

| 対象ID | ローカル修正 |
| --- | --- |
| NV-002〜NV-005、PW-019 | PC用ナビゲーションをモバイルの`details`から分離し、企業・学生ログイン、マイページ、ログアウトを常時操作可能にした。 |
| PW-010 | `status=invalid_link` / `setup_required` を先に判定し、既存セッションがあってもパスワード更新フォームを無効化した。 |
| ST-015、ST-016、CT-037、CT-038、MB-001、MB-002、MB-009、MB-010、SC-005〜SC-008、SC-018、SC-019 | 非公開列を直接参照していたRLS式をSecurity Definer判定関数へ移し、列権限を緩めず本人・有効企業の判定ができるmigrationを追加した。 |
| AS-022、AS-023 | `student-media` bucketと管理者Storage policyを再作成できる冪等migrationを追加した。 |
| AH-012 | 面談リクエスト更新後に対象行を取得し、0件なら成功扱いにしないよう変更した。 |
| QA-004、QA-007 | 企業詳細・管理フォームの子要素に`min-width: 0`、入力欄に幅制約を追加し、390px表示の横はみ出しを解消した。 |
| QA-014 | 管理者ログインフォームのタイトルを`h2`にできるようにし、ページの`h1`を1件にした。 |
| QA-018 | PC/モバイルナビ、CTA、フッター等の主要操作領域を44px以上に調整した。 |
| QA-026 | 読み込み失敗時に頭文字へ切り替える`SafeImage`を企業ロゴ・公開学生画像に導入した。 |

追加対応:

- GAP-05: 連絡導線利用時に学生の`profile_share_consent_at`も保存するよう変更。
- GAP-08: 協賛企業一覧の仮企業名・仮ロゴを削除し、掲載許諾前は「掲載準備中」と表示。

## ローカル再検証

- `npm run build`: 成功。
- `npm run lint`: エラー0、既存方針の`img`関連警告6件。
- `git diff --check`: 問題なし。
- PC `/students`: デスクトップナビ10項目を表示、横はみ出しなし、エラーオーバーレイなし。
- 390px相当: `/`、`/companies`、`/students`、`/admin/login`、`/sponsor.html`、`/sponsors_list.html`で横はみ出しなし。
- 上記6ページの表示中主要リンク・ボタン・メニューは44px未満0件。
- `/admin/login`: `h1` 1件。
- 無効な`/password-update`: エラー表示、入力欄と更新ボタンを無効化。
- `/sponsors_list.html`: 仮企業文字列なし、掲載準備中表示あり。

## Supabase適用結果

- `20260711090000_repair_student_rls_and_storage.sql`: Productionへ適用成功。
- `student-media` bucket: 作成済み。
- RLS・Storage再テスト: 32/32件合格。
- テスト後の残件: 学生0、企業0、求人0、連絡履歴0、Authユーザー0。

仕様決定待ちのCO-027、CO-028（求人掲載期間）は今回変更していない。
