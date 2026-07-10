# 次チャット実装指示書: 学生ログインありMVP

作成日: 2026-07-07  
対象リポジトリ: `/Users/kyoshiro42/Desktop/ codex_projects/kinseiweb`  
目的: 次のチャットでそのまま実装に入るための指示書

## 1. 最初に読む資料

次のチャットでは、まず以下を読むこと。

1. `DESIGN.md`
2. `docs/student-login-mvp-spec.md`
3. `docs/implementation-handoff-student-login.md`
4. `docs/admin-requirements.md`
5. `docs/supabase-schema-rls.md`

実装の正本は `docs/student-login-mvp-spec.md` とする。

`docs/detailed-specification-design.md` と `docs/hearing-gap-implementation-plan.md` は旧整理を含むため、実装判断では正本にしない。

## 2. 今回実装すること

学生ログインありMVPを実装する。

初期実装のゴールは以下。

- 学生がログインできる。
- 学生が近世側で登録された自分のプロフィールを確認できる。
- 学生が企業一覧を見られる。
- 学生が企業詳細と求人情報を見られる。
- 学生がプロフィール情報入りのメール本文を確認できる。
- 同意後、学生本人のメールアプリで企業へ連絡できる。
- サイト側に「連絡導線利用履歴」が残る。
- 管理者が企業公開情報と求人情報を管理できる。
- 既存の企業ログイン、企業会員DB、管理画面を壊さない。

## 3. 実装方針

### 3.1 学生ログイン

- 学生ログインURLは `/student/login`。
- 企業ログイン `/login` とは画面を分ける。
- Supabase Auth は既存のものを使う。
- 学生ユーザーは `students.auth_user_id` に紐づける。
- 学生ログイン後は `/student/profile` に遷移する。
- `next` がある場合はログイン後に元のページへ戻す。

### 3.2 学生プロフィール

- URLは `/student/profile`。
- 学生本人は自分のプロフィールだけ確認できる。
- 初期実装では学生本人による編集は作らない。
- 内容修正依頼は `mailto:` などの軽い導線でよい。

### 3.3 企業一覧・企業詳細

- 企業一覧URLは `/companies`。
- 企業詳細URLは `/companies/[companyId]`。
- 未ログインでも企業一覧・企業詳細・求人情報は閲覧可能にする。
- プロフィール付き連絡CTAは学生ログイン必須にする。
- 未ログイン時にCTAを押したら `/student/login?next=...` へ送る。

### 3.4 求人情報

- 初期実装では求人詳細ページは作らない。
- 求人情報は企業詳細ページ内に表示する。
- 求人管理は `/admin/job-posts` に追加する。
- 求人登録・編集は近世管理者のみ可能。
- 企業側が求人を登録する機能は初期では作らない。

### 3.5 プロフィール付き企業連絡

- 初期は企業への自動メール送信は行わない。
- ログイン済み学生のプロフィール情報を使って `mailto:` の件名・本文を生成する。
- 本文生成前に、共有される内容と同意チェックを表示する。
- 同意後、`student_company_contacts` に履歴を保存する。
- その後、学生のメールアプリを開く。
- `mailto:` では送信完了を検知できないため、履歴は「送信完了」ではなく「連絡導線利用履歴」として扱う。
- `mailto:` の本文は長すぎると壊れるため、1,500〜2,000文字程度に抑える。

## 4. DB変更

新規migrationを作成する。

### 4.1 `students` に追加

- `auth_user_id uuid`
- `login_email text`
- `login_status text`
- `profile_share_status text`
- `profile_confirmed_at timestamptz`
- `profile_share_consent_at timestamptz`

`login_status` 候補:

- `not_invited`
- `invited`
- `active`
- `suspended`

`profile_share_status` 候補:

- `disabled`
- `enabled`

### 4.2 `companies` に追加

- `logo_url text`
- `industry_category text`
- `company_description text`
- `public_website_url text`
- `public_contact_email text`
- `public_location text`
- `public_tags text[]`
- `public_status text`
- `sort_order integer`

注意:

- `companies.contact_email` は既存の企業ログイン担当者用。
- 学生向けに公開するメールは `public_contact_email` を使う。

### 4.3 `job_posts` を新規作成

必要カラム:

- `id uuid`
- `company_id uuid`
- `title text`
- `summary text`
- `description text`
- `job_type text`
- `target_grade text`
- `location text`
- `work_style text`
- `reward text`
- `requirements text`
- `welcome_points text`
- `tags text[]`
- `contact_email text`
- `publication_status text`
- `published_at timestamptz`
- `closed_at timestamptz`
- `admin_note text`
- `created_at timestamptz`
- `updated_at timestamptz`

### 4.4 `student_company_contacts` を新規作成

必要カラム:

- `id uuid`
- `student_id uuid`
- `company_id uuid`
- `job_post_id uuid`
- `contact_email text`
- `mail_subject text`
- `mail_body_snapshot text`
- `profile_snapshot jsonb`
- `consent_at timestamptz`
- `status text`
- `created_at timestamptz`
- `updated_at timestamptz`

## 5. RLS / 権限

必ずRLSを設定する。

- 学生本人判定は `students.auth_user_id = auth.uid()`。
- 学生本人は自分の `students` と `student_member_profiles` のみ閲覧可能。
- 学生本人によるプロフィール更新は初期では不可。
- 公開企業は `public_status = 'published'` のみ公開。
- 公開求人は `publication_status = 'published'` かつ企業が公開中のものだけ公開。
- `student_company_contacts` は学生本人のみ insert / select 可能。
- 管理者は全件管理可能。
- 企業ユーザーは初期では `student_company_contacts` を見られなくてよい。

## 6. 追加・変更する主なファイル

想定追加:

- `supabase/migrations/YYYYMMDDHHMMSS_student_login_mvp.sql`
- `src/app/student/login/page.tsx`
- `src/app/student/profile/page.tsx`
- `src/app/student/contacts/page.tsx`
- `src/app/student/styles.css`
- `src/app/companies/page.tsx`
- `src/app/companies/[companyId]/page.tsx`
- `src/app/companies/styles.css`
- `src/app/admin/job-posts/page.tsx`
- `src/app/admin/job-posts/new/page.tsx`
- `src/app/admin/job-posts/[jobPostId]/edit/page.tsx`
- `src/app/admin/job-posts/actions.ts`
- `src/app/admin/student-contacts/page.tsx`
- `src/lib/student/auth.ts`
- `src/lib/student/contactMail.ts`

想定変更:

- `src/app/admin/layout.tsx`
- `src/app/admin/students/StudentForm.tsx`
- `src/app/admin/students/actions.ts`
- `src/app/admin/companies/page.tsx`
- `src/app/admin/companies/[companyId]/page.tsx`
- `src/app/admin/companies/actions.ts`
- `src/components/StudentDatabaseHeader.tsx`
- 必要に応じて `src/components/LoginForm.tsx`

## 7. 実装順

この順で進めること。

1. 現状確認
   - `git status --short`
   - 既存の未コミット変更を把握する
2. DB migration 作成
3. RLS / 管理者policy追加
4. 学生認証ヘルパー追加
5. 学生ログインページ追加
6. 学生プロフィール確認ページ追加
7. 管理画面の学生Auth紐づけ追加
8. 企業公開項目を管理画面へ追加
9. 求人管理画面追加
10. 企業一覧ページ追加
11. 企業詳細ページ追加
12. プロフィール付きメール生成処理追加
13. 連絡導線利用履歴保存処理追加
14. 学生連絡履歴ページ追加
15. ヘッダー・CTA導線調整
16. スマホ390px前後で表示確認
17. `npm run build`

## 8. 既存機能を壊さないための注意

- `/login` は企業ログインとして維持する。
- `/members/students` は企業会員DBとして維持する。
- `/admin` は既存管理画面として維持する。
- `interview_requests` は既存の企業から学生への面談リクエスト機能として残す。
- 学生から企業への連絡履歴は `student_company_contacts` に分ける。
- 既存の `companies.contact_email` を学生向け公開メールとして流用しない。
- 学生本人が他の学生の非公開プロフィールを見られないようにする。
- 企業ユーザーと学生ユーザーが同じAuth基盤を使っても、権限判定は必ず分ける。

## 9. 完了条件

以下を満たしたら実装完了。

- 学生が `/student/login` からログインできる。
- 学生が `/student/profile` で自分のプロフィールを確認できる。
- 学生は他学生の非公開情報を見られない。
- 管理者が学生ログイン用Authを紐づけられる。
- 管理者が企業公開情報を登録・編集できる。
- 管理者が求人情報を登録・編集できる。
- `/companies` に公開企業だけが表示される。
- `/companies/[companyId]` に公開求人だけが表示される。
- 未ログインで連絡CTAを押すと学生ログインへ誘導される。
- ログイン済み学生がプロフィール入りメール本文を確認できる。
- 同意後にメールアプリを開ける。
- `student_company_contacts` に履歴が保存される。
- 既存の企業ログインと企業会員DBが動く。
- 管理画面が動く。
- スマホ390px前後で崩れない。
- `npm run build` が通る。

## 10. 現在の未コミット状態

現時点では以下が未コミット。

- `src/app/members/students/styles.css`
  - 既存の学生DB画面のCSS表示調整。今回の仕様整理では触っていない。
- `docs/detailed-specification-design.md`
  - 旧仕様。学生ログインなし前提が含まれるため、実装時は正本にしない。
- `docs/hearing-gap-implementation-plan.md`
  - ヒアリング差分の旧整理。
- `docs/student-login-mvp-spec.md`
  - 学生ログインありMVPの正本仕様。
- `docs/implementation-handoff-student-login.md`
  - 次チャット用の引き継ぎメモ。
- `docs/next-chat-implementation-instructions.md`
  - この実装指示書。

## 11. 次チャットに渡す文言

次のチャットでは以下をそのまま送ればよい。

```text
/Users/kyoshiro42/Desktop/ codex_projects/kinseiweb のリポジトリで、docs/next-chat-implementation-instructions.md を読んで、学生ログインありMVPの実装に入ってください。

実装の正本は docs/student-login-mvp-spec.md です。
既存の企業ログイン /login、企業会員DB /members/students、管理画面 /admin は壊さないでください。
まずはDB migrationから進めて、最後に npm run build まで確認してください。
```
