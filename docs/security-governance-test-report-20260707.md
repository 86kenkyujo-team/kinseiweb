# セキュリティ・PMBOK観点テストレポート

作成日: 2026-07-07

## 結論

ローカルコードは、学生ログインMVPのセキュリティ強化に合わせて修正済みです。`npm run lint` と `npm run build` は成功しました。

ただし、本番Supabase Data APIで匿名キーから `students` の内部列を読めることを確認したため、本番操作はここで停止しています。DB権限だけを先に締めると、まだ本番へdeployしていない現在のローカルコードとの差分により、既存の企業会員DB導線を壊す可能性があります。

## 現在の状態

| 項目 | 状態 |
| --- | --- |
| ローカルコード | 修正済み、未コミット |
| GitHub push | 未実施 |
| Vercel deploy | 未実施 |
| 既存学生ログインMVP migration | 本番Supabaseへ適用済み |
| 権限強化 migration | ローカルに作成済み、まだ本番未適用 |
| テスト用一時データ | 前回E2E後に削除済み |

## サブエージェントレビュー

- セキュリティ/RLSレビュー: `students` のログイン関連列、`job_posts.admin_note/contact_email`、`student_company_contacts` 直接insert権限が広いと指摘。
- PMBOK/SLAレビュー: 運用責任、SLO、変更管理、RACI、ロールバック、インシデント対応の独立文書が不足と指摘。

対応として、以下を追加/修正しました。

- `docs/project-governance-and-sla.md`
- `supabase/migrations/20260707150000_harden_student_login_mvp_permissions.sql`
- service role 経由で管理/本人/連絡先取得を行うコード修正
- ESLint flat config と `npm run lint` の修正

## 実施したセキュリティ修正

### 1. 管理画面

管理者判定は通常セッションで行い、判定後の管理CRUDはサーバー側 service role を使うように変更しました。

対象:

- `src/lib/admin/auth.ts`

狙い:

- 一般 `authenticated` ロールに管理用の広い `grant all` を持たせない。
- 管理画面の権限はアプリ側の `requireAdmin()` と server-side secret に閉じる。

### 2. 学生本人プロフィール

学生本人のセッション確認後、学生プロフィールの内部列は service role で取得するように変更しました。

対象:

- `src/lib/student/auth.ts`

狙い:

- `students.auth_user_id`
- `students.login_email`
- `students.login_status`
- `students.profile_share_status`
- `students.profile_confirmed_at`
- `students.profile_share_consent_at`

これらを一般Data APIへ広く公開しない。

### 3. 企業詳細/連絡先

未ログイン/匿名閲覧の企業詳細クエリから連絡先メール列を外しました。ログイン済み学生にメール本文プレビューを出す場合のみ、サーバー側で連絡先を取得します。

対象:

- `src/app/companies/[companyId]/page.tsx`
- `src/app/companies/[companyId]/actions.ts`

狙い:

- `companies.public_contact_email`
- `job_posts.contact_email`
- `job_posts.admin_note`

これらを匿名Data APIへ出さない。

### 4. 連絡履歴作成

`student_company_contacts` の直接insert権限に頼らず、server action 側で本人、同意、公開企業、公開求人を検証してから service role で保存する形に変更しました。

狙い:

- 任意の `mail_body_snapshot` / `profile_snapshot` を直接APIで作られるリスクを下げる。

### 5. 企業会員DB

企業会員判定に必要な `companies.membership_status` は、通常Data APIではなくサーバー側 service role で確認する形に変更しました。

対象:

- `src/app/members/students/page.tsx`
- `src/app/members/students/actions.ts`

## 追加した権限強化 migration

追加ファイル:

- `supabase/migrations/20260707150000_harden_student_login_mvp_permissions.sql`

内容:

- `students` / `companies` / `job_posts` / `student_company_contacts` / `interview_requests` の広い権限をrevoke
- 公開閲覧に必要な列だけ再grant
- `companies.public_contact_email` を匿名/一般Data APIからrevoke
- `student_company_contacts` のinsertを一般Data APIから外す
- 今後の public schema 新規テーブル/関数のデフォルト公開を抑制

この migration は、まだ本番Supabaseへ適用していません。

## Data API確認結果

読み取りだけで確認しました。secret値は出力していません。

```text
anon_students_sensitive 200 {"rows":1,"sampleKeys":["id","login_email","auth_user_id","profile_share_status"]}
anon_companies_sensitive 200 {"rows":0,"sampleKeys":[]}
anon_job_posts_sensitive 200 {"rows":0,"sampleKeys":[]}
```

判定:

- `students` は匿名キーで内部列が取得可能なため、重大リスク。
- `companies` と `job_posts` は今回0行でしたが、エラーではなく200のため、公開行がある場合は対象列へ到達できる可能性があります。

## コマンド検証

```text
npm run lint: 成功
npm run build: 成功
```

lintの残警告:

- `<img>` を `next/image` に置き換える推奨警告が9件
- 既存表示方針に関わるため、今回のセキュリティ修正では未対応

## 停止理由

本番Supabaseには既に学生ログインMVP migration が適用済みですが、Vercel本番には今回のservice role対応コードがまだdeployされていません。

この状態で権限強化 migration だけを本番DBへ適用すると、現行本番コードの `/members/students` などが `companies.membership_status` を通常Data APIで読めず、既存導線を壊す可能性があります。

したがって、本番DBへの追加SQL適用、GitHub push、Vercel deploy は未実行で停止しています。

## 推奨リリース手順

安全な順序:

1. `SUPABASE_SECRET_KEY` が Vercel production に設定済みか確認
2. 今回のコードをcommit
3. GitHubへpush
4. Vercel previewまたはproduction buildを確認
5. 権限強化 migration を本番Supabaseへ適用
6. Vercel productionへdeploy
7. Data API再検証
   - `students.login_email` / `auth_user_id` が匿名で取得不可
   - `job_posts.admin_note/contact_email` が匿名で取得不可
   - `student_company_contacts` が直接insert不可
8. ローカルまたは本番で一時データE2Eを再実施
9. 一時データ削除確認

緊急遮断を優先する場合:

- 権限強化 migration を先に適用する。
- その場合、現行本番アプリの一部導線が壊れる可能性を許容する。
- 直後にVercel deployまで進める必要がある。

## 未解決/次の判断

- 本番DBの権限強化 migration をいつ適用するか。
- 同時にVercelへdeployするか。
- 既存公開学生データの `login_email` / `auth_user_id` 露出影響をどう扱うか。
- `<img>` 警告を次回UI最適化で `next/image` に寄せるか。
