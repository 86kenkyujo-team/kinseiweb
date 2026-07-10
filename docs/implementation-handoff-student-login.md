# 次チャット引き継ぎメモ: 学生ログインありMVP

作成日: 2026-07-07  
目的: 次のチャットで迷わず実装に入るための申し送り

## 1. 最重要方針

実装の正本は以下。

- `docs/student-login-mvp-spec.md`

以前の `docs/detailed-specification-design.md` は「学生ログインなし」前提が含まれるため、実装時は正本にしない。

## 2. 今回の決定

- 初期実装から学生ログインを入れる。
- 学生プロフィールは近世側が登録・管理する。
- 学生はログイン後、自分のプロフィールを確認できる。
- 学生自身によるプロフィール編集は初期対象外。
- 学生は企業一覧・企業詳細・求人情報を見られる。
- 企業へ連絡する際は、ログイン中の学生プロフィール情報を反映したメール本文を生成する。
- 初期は学生本人のメールアプリを開く `mailto:` 方式。
- サイト側では「メール作成導線を利用した履歴」を保存する。
- 企業への自動メール送信、送信完了検知、サイト内応募管理は初期対象外。

## 3. 既存実装で使うもの

- Supabase server client: `src/lib/supabase/server.ts`
- Supabase browser client: `src/lib/supabase/client.ts`
- Supabase admin client: `src/lib/supabase/admin.ts`
- 管理者判定: `src/lib/admin/auth.ts`
- 既存ログインフォーム: `src/components/LoginForm.tsx`
- 既存パスワード更新: `src/components/PasswordUpdateForm.tsx`
- 企業管理: `src/app/admin/companies`
- 学生管理: `src/app/admin/students`
- 企業会員DB: `src/app/members/students`
- 既存DB migration: `supabase/migrations/20260504000000_member_schema.sql`
- 既存管理者RLS: `supabase/migrations/20260505102000_add_admin_rls_policies.sql`

## 4. 最初に作るDB migration

新規migrationで行うこと。

1. `students` に学生ログイン用カラムを追加
2. `companies` に学生向け公開項目を追加
3. `job_posts` を作成
4. `student_company_contacts` を作成
5. RLSを追加
6. 管理者用policyを追加
7. `updated_at` triggerを必要なテーブルに追加

詳細カラムは `docs/student-login-mvp-spec.md` の「8. DB設計案」を参照。

## 5. 実装順

1. DB migration
2. 学生ログインページ `/student/login`
3. 学生プロフィールページ `/student/profile`
4. 管理画面の学生Auth紐づけ
5. 企業公開項目の管理画面追加
6. 求人管理画面 `/admin/job-posts`
7. 企業一覧 `/companies`
8. 企業詳細 `/companies/[companyId]`
9. プロフィール付きメール生成処理
10. `student_company_contacts` への履歴保存
11. CTAとヘッダー導線調整
12. スマホ確認
13. `npm run build`

## 6. ルーティング案

- 学生ログイン: `/student/login`
- 学生プロフィール: `/student/profile`
- 学生連絡履歴: `/student/contacts`
- 企業一覧: `/companies`
- 企業詳細: `/companies/[companyId]`
- 求人詳細: 初期は作らず企業詳細内に表示
- 求人管理: `/admin/job-posts`
- 連絡履歴管理: `/admin/student-contacts`

## 7. 実装時の注意

- 既存の企業ログイン `/login` は壊さない。
- 既存の企業会員DB `/members/students` は壊さない。
- 学生ログインは企業ログインと画面を分ける。
- `companies.contact_email` は企業ログイン担当者用として扱う。
- 学生向け公開メールは `companies.public_contact_email` または `job_posts.contact_email` を使う。
- `mailto:` は送信完了を検知できないため、履歴名は「送信履歴」ではなく「連絡導線利用履歴」とする。
- `mailto:` は本文が長すぎると壊れる可能性があるため、メール本文は1,500〜2,000文字程度に抑える。
- サーバー側でログイン確認、同意確認、履歴保存、`mailto:` 生成を行い、クライアント側でメールアプリを開く。
- 未ログイン時に連絡CTAを押した場合は `/student/login?next=...` に送る。
- 学生本人は自分のプロフィールだけ見られるようにRLSを組む。
- 学生本人によるプロフィール更新は初期では禁止する。

## 8. 現在の未コミット状態

現時点で確認できている未コミット変更:

- `src/app/members/students/styles.css`: 既存のCSS表示調整。今回の仕様整理では触っていない。
- `docs/hearing-gap-implementation-plan.md`: 以前作成したヒアリング差分計画。
- `docs/detailed-specification-design.md`: 以前作成した詳細仕様。ログインなし前提が含まれるため旧扱い。
- `docs/student-login-mvp-spec.md`: 今回作成した正本仕様。
- `docs/implementation-handoff-student-login.md`: この引き継ぎメモ。

## 9. 完了条件

次チャットで実装に入る場合、まず `docs/student-login-mvp-spec.md` を読み、上記実装順で進める。

最終的には以下を確認する。

- 学生がログインできる。
- 学生が自分のプロフィールを確認できる。
- 学生が企業一覧と企業詳細を見られる。
- 学生がプロフィール入りメール本文を生成できる。
- 連絡導線利用履歴がDBに残る。
- 管理者が企業公開情報と求人情報を管理できる。
- 既存企業会員DBが壊れていない。
- `npm run build` が通る。
