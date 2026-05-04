# Supabase テーブル設計・RLS 方針

作成日: 2026-05-04  
対象: 企業会員限定 学生データベース MVP

## 1. 方針

学生詳細情報を安全に扱うため、公開情報と会員限定情報をテーブルレベルで分ける。

- `students`: 公開ページでも使える学生の基本情報
- `student_member_profiles`: 有効な企業会員だけが見られる詳細情報
- `companies`: 企業アカウントと会員状態
- `interview_requests`: 面談リクエスト

RLS は全テーブルで有効化する。管理者による登録・編集は初期実装では Supabase 管理画面または service role を使うサーバー処理で行い、ブラウザから直接編集できるポリシーは作らない。

## 2. 会員判定

閲覧可能な会員ステータス:

- `active`
- `trial`

閲覧不可:

- `past_due`
- `suspended`
- `cancelled`

判定は `private.is_active_company_member()` に集約する。会員判定用の関数は公開 API の exposed schema に置かず、`private` schema に置く。

## 3. RLS ポリシー概要

| テーブル | 操作 | 許可対象 | 条件 |
| --- | --- | --- | --- |
| `companies` | select | authenticated | 自分の企業レコードのみ |
| `students` | select | anon / authenticated | `publication_status = 'published'` |
| `student_member_profiles` | select | authenticated | 有効な企業会員、かつ公開中の学生 |
| `interview_requests` | insert | authenticated | 自社のリクエスト、有効な企業会員、公開中の学生 |
| `interview_requests` | select | authenticated | 自社のリクエストのみ |

## 4. 実装SQL

実装SQLは以下にまとめる。

- [supabase-member-schema.sql](./supabase-member-schema.sql)

## 5. 運用メモ

企業アカウント発行時は、以下の 2 ステップを行う。

1. Supabase Auth でメールアドレス + パスワードのユーザーを作成する
2. `companies` に `auth_user_id` と企業情報、`membership_status` を登録する

企業を停止する場合は、`companies.membership_status` を `suspended` または `cancelled` に変更する。ログイン自体はできても、会員限定詳細データは取得できなくなる。

## 6. 実装時の注意

- `service_role` キーはブラウザに出さない
- 会員限定情報を `students` に混ぜない
- `student_member_profiles` は未ログインユーザーに SELECT させない
- Next.js 側でもルート保護を行い、DB 側の RLS と二重に守る
- 面談リクエストの通知は MVP 後に Resend、Slack、Notion などへ接続する
