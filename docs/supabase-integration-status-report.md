# Supabase 連携状況レポート

作成日: 2026-07-07

## 結論

今回追加した学生ログインMVP用の Supabase migration は、2026-07-07 に接続先DBへ適用済みです。

ローカルのコード実装と `npm run build` は通っており、適用後の `/companies` など新規カラム・新規テーブルを読む画面もローカルでDBエラーなく表示できることを確認しました。

## 確認できたこと

- `.env.local` には Supabase 接続用の環境変数が設定されています。
- ローカルから Supabase への読み取り接続は、権限付き実行では到達できました。
- 接続先DBでは、今回追加した以下がまだ存在しません。
  - `students.auth_user_id`
  - `students.login_email`
  - `students.login_status`
  - `students.profile_share_status`
  - `companies.logo_url`
  - `companies.industry_category`
  - `companies.company_description`
  - `companies.public_contact_email`
  - `companies.public_status`
  - `companies.sort_order`
  - `public.job_posts`
  - `public.student_company_contacts`

確認時の代表エラー:

```text
students_login_columns: ERROR column students.auth_user_id does not exist
companies_public_columns: ERROR column companies.logo_url does not exist
job_posts_table: ERROR Could not find the table 'public.job_posts' in the schema cache
student_company_contacts_table: ERROR Could not find the table 'public.student_company_contacts' in the schema cache
```

## 実施したこと

1. Supabase CLI / psql の有無を確認
   - `supabase` CLI: なし
   - `psql`: なし

2. 既存 `.env.local` の Supabase 接続情報を使って、読み取りクエリでスキーマ状態を確認
   - サンドボックス内では外部通信が `fetch failed`
   - 権限付き実行では接続でき、スキーマ未適用が確認できました

3. Chrome で Supabase Dashboard を開いて SQL Editor へアクセスを試行
   - 対象URL: Supabase Dashboard の対象プロジェクト SQL Editor
   - Supabase側で未ログインだったため、GitHubログイン画面に遷移
   - GitHubのユーザー名/パスワード入力画面に到達したため、そこで停止

## 停止理由

GitHubログインが必要になり、ユーザー本人の認証情報入力が必要な画面に到達したためです。

ここから先は、本人ログインまたはSupabase CLI / Management API用の適切な権限が必要です。

## 次に必要な作業

### 方法A: Supabase Dashboard で適用

1. ChromeでSupabase/GitHubへログインする
2. 対象プロジェクトの SQL Editor を開く
3. `supabase/migrations/20260707090000_student_login_mvp.sql` のSQLを実行する
4. 実行後、以下の画面を確認する
   - `/companies`
   - `/student/login`
   - `/student/profile`
   - `/admin/job-posts`
   - `/admin/student-contacts`

### 方法B: CLIで適用

1. Supabase CLI を使える環境を用意する
2. プロジェクトへログイン/リンクする
3. migration を適用する
4. `npm run build` とローカル表示確認を行う

## 現在のコード状態

- 今回のコード変更はローカル未コミットです。
- GitHubへ push していません。
- Vercel本番へ反映されていません。
- `npm run build` は成功しています。

## 注意点

Supabase migration を適用しないまま今回のコードを本番反映すると、新規カラム・新規テーブルが存在しないため、学生向け企業一覧や求人管理などでDBエラーが出ます。

公開順としては以下が安全です。

1. Supabase migration 適用
2. ローカルで新規ページのDBエラーが消えることを確認
3. 必要なら管理画面で企業公開情報・求人を登録
4. commit / push
5. Vercel production deploy確認

## 2026-07-07 追記

- Supabase公式 changelog を確認し、2026-04-28 の「新規テーブルが Data API / GraphQL API に自動公開されない」変更が今回の migration に関係し得ることを確認しました。
- `supabase/migrations/20260707090000_student_login_mvp.sql` に、公開企業一覧で必要な `companies` の公開列と、学生本人プロフィール取得に必要な `students` / `student_member_profiles` の明示的な `grant` を追加しました。
- 変更後に `npm run build` を再実行し、成功しました。
- Chrome で Supabase SQL Editor を開き直しましたが、Supabase は未ログインでした。
- 「Continue with GitHub」まで進めたところ、GitHub のユーザー名/パスワード入力画面に到達したため、ここで停止しています。

次に進めるには、Chrome上でGitHubログインを完了してください。ログイン後にこちらへ「ログインできた」と伝えてもらえれば、SQL Editorで migration 適用、DBスキーマ再確認、ローカル画面確認まで続行します。

## 2026-07-07 追記2

- ユーザーから「ログインできた」と連絡を受け、Codex が操作中の Chrome タブで Supabase SQL Editor を再読み込みしました。
- しかし、Codex 側のタブでは引き続き Supabase 未ログイン扱いでした。
- もう一度「Continue with GitHub」を押して OAuth を再試行しましたが、GitHub のユーザー名/パスワード入力画面に戻りました。
- そのため、ログインが別ブラウザまたは別Chromeプロファイルで完了している可能性があります。

次は、Codex が開いている Chrome タブ上で GitHub/Supabase ログインを完了する必要があります。ログイン完了後、同じタブで Supabase SQL Editor が表示されている状態になれば、migration 適用を再開できます。

## 2026-07-07 追記3

- Chrome の `86kenkyujo.com` プロファイル側に開いていた Supabase ダッシュボードを Codex から再取得し、SQL Editor に到達しました。
- ユーザー承認後、`supabase/migrations/20260707090000_student_login_mvp.sql` を SQL Editor で実行しました。
- Supabase SQL Editor の結果は `Success. No rows returned` でした。
- 適用後、Supabase API 経由で以下が正常に見えることを確認しました。
  - `students` の学生ログイン関連カラム
  - `companies` の学生向け公開カラム
  - `job_posts`
  - `student_company_contacts`
  - anon での公開企業一覧 select
- `localhost:3000` で Next.js dev server を起動し、以下を確認しました。
  - `/companies`: 200、DBカラムエラーなし
  - `/student/login`: 200
  - `/student/profile`: 未ログイン時 `/student/login?next=%2Fstudent%2Fprofile` へ 307
  - `/admin/job-posts`: 未ログイン時 `/admin/login?next=/admin` へ 307
  - `/admin/student-contacts`: 未ログイン時 `/admin/login?next=/admin` へ 307

残タスクは、必要に応じた管理画面データ登録、commit / push / deploy です。現時点ではコード変更はまだローカル未コミットで、GitHub / Vercel 本番には反映していません。

## 2026-07-07 追記4: ローカルE2Eテスト

ユーザー承認のもと、本番Supabase DBに `TEST_Codex_20260707133244` の一時データを作成して、ローカルアプリから実運用に近いフローを確認しました。

確認した内容:

- 学生ログインフォームで一時学生Authユーザーとしてログインできる
- `/student/profile` に一時学生プロフィールが表示される
- `/companies` に一時公開企業が表示される
- 企業詳細ページに一時求人が表示される
- 求人側の連絡フォームでプロフィール共有同意チェック後、連絡履歴を保存できる
- `/student/contacts` に保存された連絡履歴が表示される
- 各画面で console error は出ていない

削除確認:

- E2E後、一時連絡履歴が1件作成されたことを確認
- その後、以下の一時データを削除
  - 連絡履歴
  - 求人
  - 学生詳細プロフィール
  - 学生
  - 企業
  - Supabase Authユーザー
- 削除後の検証で `contacts: 0`, `jobPosts: 0`, `students: 0`, `companies: 0` を確認
- `/companies` の画面上にも `TEST_Codex_20260707133244` が残っていないことを確認

追加確認:

- `npm run build` は成功
- `npm run lint` は `next lint` が Next 16 環境で `Invalid project directory provided ... /lint` となり失敗。現時点ではコード起因ではなく、lint script側の見直しが必要です。

## 2026-07-07 追記5: セキュリティ/PMBOK観点の追加確認

SLA相当の範囲定義とPMBOK観点の運用整理として、以下を追加しました。

- `docs/project-governance-and-sla.md`
- `docs/security-governance-test-report-20260707.md`

セキュリティレビューでは、Supabase Data API の権限が広く、UIでは見せていない内部列が直接API経由で取得できる可能性を確認しました。

実際に匿名キーで読み取り確認した結果:

```text
anon_students_sensitive 200 {"rows":1,"sampleKeys":["id","login_email","auth_user_id","profile_share_status"]}
anon_companies_sensitive 200 {"rows":0,"sampleKeys":[]}
anon_job_posts_sensitive 200 {"rows":0,"sampleKeys":[]}
```

判定:

- `students.login_email` / `students.auth_user_id` / `students.profile_share_status` が匿名Data APIで取得可能だったため、重大リスクとして扱います。
- `companies` と `job_posts` は対象行が0件でしたが、権限エラーではなく200のため、公開行がある場合に内部列へ到達できる余地があります。

ローカル側で実施した対策:

- 管理画面CRUDを、管理者判定後のサーバー側 service role 利用へ寄せました。
- 学生本人プロフィールの内部列取得を service role 経由へ寄せました。
- 企業詳細の匿名公開クエリから連絡先メール列を外しました。
- 連絡履歴作成を、直接Data API insertではなく server action 検証後の service role insert へ寄せました。
- 企業会員DBの会員判定を service role 経由へ寄せました。
- 追加 migration `supabase/migrations/20260707150000_harden_student_login_mvp_permissions.sql` を作成しました。
- `npm run lint` を Next 16 / ESLint 9 向けに修正し、成功する状態にしました。

検証:

- `npm run lint`: 成功。残警告は `<img>` の `next/image` 推奨のみ。
- `npm run build`: 成功。

停止理由:

追加した権限強化 migration は、まだ本番Supabaseへ適用していません。理由は、Vercel本番には今回の service role 対応コードが未deployであり、DB権限だけを先に締めると現行本番の企業会員DB導線を壊す可能性があるためです。

現在の状態:

- 既存学生ログインMVP migration: 本番Supabase適用済み
- 権限強化 migration: ローカル作成済み、未適用
- ローカルコード: 修正済み、未コミット
- GitHub push / Vercel deploy: 未実施
