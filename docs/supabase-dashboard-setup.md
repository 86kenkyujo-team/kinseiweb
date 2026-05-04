# Supabase Dashboard セットアップ手順

作成日: 2026-05-04  
対象: 企業会員限定 学生データベース MVP

## 1. プロジェクト作成

Supabase Dashboard で新規プロジェクトを作成する。

推奨名:

- `kinseiweb`

作成後、Project Settings から以下を控える。

- Project URL
- Publishable Key

## 2. SQL 適用

Supabase Dashboard の SQL Editor で、以下の順番で実行する。

1. `supabase/migrations/20260504000000_member_schema.sql`
2. `supabase/seed/sample-students.sql`

1つ目は本番用のテーブル、関数、RLS ポリシーを作る。2つ目は画面確認用のサンプル学生データを入れる。

## 3. 企業アカウント作成

Authentication > Users から企業用ユーザーを作成する。

設定:

- Email: 企業担当者メールアドレス
- Password: 運営側で初期パスワードを設定
- Auto Confirm User: 有効

作成後、ユーザーの `id` を控える。

## 4. `companies` 登録

SQL Editor で以下を実行する。`auth_user_id` は Authentication で作成したユーザーIDに置き換える。

```sql
insert into public.companies (
  auth_user_id,
  company_name,
  contact_name,
  contact_email,
  membership_status,
  plan_name
) values (
  'AUTH_USER_ID_HERE',
  'サンプル株式会社',
  '山田 太郎',
  'company@example.com',
  'active',
  'student_db_mvp'
);
```

閲覧可能にする場合は `membership_status` を `active` または `trial` にする。

閲覧停止にする場合は `past_due`、`suspended`、`cancelled` のいずれかにする。

## 5. ローカル環境変数

`.env.local` を作成し、Supabase の値を設定する。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxxxx
```

設定後、dev server を再起動する。

```bash
npm run dev
```

## 6. 確認項目

- `/login` で企業アカウントとしてログインできる
- `active` または `trial` の企業は `/members/students` を閲覧できる
- `suspended` の企業は `/membership-inactive` に誘導される
- 会員限定プロフィールが表示される
- 面談リクエストフォームを送信すると `interview_requests` に保存される

## 7. 本番反映

Vercel の Project Settings > Environment Variables に以下を追加する。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

追加後、再デプロイする。
