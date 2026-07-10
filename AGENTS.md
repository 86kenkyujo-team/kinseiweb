# KINSEI Web 作業ルール

## 基本方針

- 既存の `DESIGN.md` をUIの基準として優先する。
- App Router / Server Components / Server Actions の既存構成に合わせる。
- Supabase Auth、RLS、管理画面の既存分離を壊さない。
- 企業ログイン `/login`、企業会員DB `/members/students`、管理画面 `/admin` は既存機能として維持する。

## 学生ログインMVP

- 実装判断の正本は `docs/student-login-mvp-spec.md`。
- 学生ログインは `/student/login`、学生プロフィールは `/student/profile`、企業一覧は `/companies`。
- 学生から企業への連絡は自動送信ではなく、プロフィール情報入り `mailto:` を生成する。
- 履歴は送信完了ではなく `student_company_contacts` の「連絡導線利用履歴」として扱う。
- 企業ログイン担当者メール `companies.contact_email` は学生向け公開メールとして使わない。

## 検証

- LP / フロントエンド作業ではPCと390px前後のスマホ表示を確認する。
- DBや認証を触る変更では `npm run build` を実行し、RLSと既存導線への影響を確認する。
