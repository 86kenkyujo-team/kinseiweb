# ナビゲーション設計メモ

作成日: 2026-05-21

## 目的

TOP リデザイン後の静的 HTML ページと、Next.js で実装している学生データベース・企業会員データベースを、本番運用で迷わない導線に統一する。

この整理は Supabase の接続や RLS を変更するものではない。既に存在する Next.js の実運用ページへ、静的ページ側のリンクを正しく接続するための仕様である。

## 基本方針

- マーケティングページは当面、既存の静的 HTML を活かす。
- 学生データベースと企業会員データベースは Next.js 側を実運用の正とする。
- `students.html` と `members-students-demo.html` は旧静的デモとして扱い、グローバル導線からは直接見せない。
- 本番相当のローカル確認は `npm run dev` で行う。

## 正式な遷移先

| 表示名 | 正式な遷移先 | 役割 |
| --- | --- | --- |
| KINSEI ロゴ | `/index.html` | TOP へ戻る |
| サービス | `/index.html#features` | TOP 内のサービス説明 |
| 仕組み | `/index.html#process` | TOP 内の利用フロー |
| 実績・事例 | `/index.html#cases` | TOP 内の事例 |
| 協賛企業 | `/sponsors_list.html` | 協賛企業一覧 |
| 企業の方へ | `/sponsor.html` | 企業向け導入ページ |
| メンバー | `/index.html#members` | TOP 内のメンター・メンバー紹介 |
| 学生DBを見る | `/students` | Next.js の公開学生 DB |
| 企業会員DB | `/login?next=/members/students` | ログイン後、企業会員 DB へ遷移 |
| お問い合わせ | `/index.html#contact` | TOP 内のお問い合わせ |

## ページごとの役割

### 静的 HTML

- `/index.html`: TOP リデザイン本体
- `/sponsor.html`: 企業向け導入ページ
- `/sponsors_list.html`: 協賛企業一覧

### Next.js

- `/students`: Supabase の `students` から公開学生を取得する公開 DB
- `/login`: Supabase Auth によるログイン
- `/members/students`: 有効な企業会員だけが閲覧できる会員 DB
- `/membership-inactive`: 会員ステータス無効時の案内
- `/admin`: 運営管理画面

## 旧静的デモの扱い

- `/students.html`: 旧静的学生 DB ページ。Next.js 本番では `/students` へリダイレクトする。
- `/members-students-demo.html`: 旧静的企業会員 DB デモ。Next.js 本番では `/login?next=/members/students` へリダイレクトする。

旧デモを残す場合も、TOP やフッターなどの主要導線からは実運用ページへ接続する。

## ローカル確認

静的サーバーでは Next.js のルートや Supabase 認証が動かないため、本番相当の確認は以下で行う。

```bash
npm run dev
```

確認対象:

- `http://localhost:3000/index.html`
- `http://localhost:3000/students`
- `http://localhost:3000/login?next=/members/students`
- `http://localhost:3000/sponsor.html`
- `http://localhost:3000/sponsors_list.html`
