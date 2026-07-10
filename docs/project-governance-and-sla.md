# KINSEI Web プロジェクト運用範囲・SLO/SLA方針

作成日: 2026-07-07

この文書は、KINSEI Web の学生ログインMVPと既存の企業会員DB/管理画面について、「どこまで何をするか」を明確にするための運用・品質・セキュリティ基準です。法的な契約SLAではなく、運営と開発で共有する内部SLO/運用基準として扱います。

参考:

- PMI: PMBOK Guide, Project Management Institute - https://www.pmi.org/standards/pmbok
- OWASP Top 10 - https://owasp.org/www-project-top-ten/
- OWASP ASVS - https://owasp.org/www-project-application-security-verification-standard/
- Supabase: Securing your API - https://supabase.com/docs/guides/api/securing-your-api
- Supabase: Row Level Security - https://supabase.com/docs/guides/database/postgres/row-level-security

## 1. 目的

KINSEI Web は、学生プロフィール、企業会員DB、学生から企業への連絡導線を安全に提供する。学生ログインMVPでは、学生が自分の登録プロフィールを確認し、同意のうえで企業へメール本文を生成するところまでを対象とする。

## 2. 対象範囲

対象:

- TOPページから学生ログイン導線が直感的に分かるUI
- 学生ログイン `/student/login`
- 学生プロフィール確認 `/student/profile`
- 学生の連絡履歴 `/student/contacts`
- 学生向け企業一覧 `/companies`
- 企業詳細・求人確認 `/companies/[companyId]`
- 管理画面での学生、企業、求人、連絡履歴管理
- Supabase Auth / Database / RLS / Data API 権限
- Vercel / GitHub / Supabase を前提にしたリリース手順

対象外:

- `mailto:` 起動後のメール送信完了、到達、返信の保証
- 企業への自動メール送信、応募管理、DM、決済、推薦アルゴリズム
- 学生本人によるプロフィール編集/承認ワークフロー
- 法務判断、職業紹介許認可、掲載同意書の最終判断
- Vercel / Supabase / GitHub 自体の外部障害の復旧保証

## 3. 責任分界

| 項目 | 主担当 | 補助 | 備考 |
| --- | --- | --- | --- |
| サイト運営判断 | KINSEI運営 | 開発 | 掲載可否、学生/企業情報の正確性 |
| 機能実装 | 開発 | KINSEI運営 | 要件確認、受入判定 |
| DB schema / RLS | 開発 | KINSEI運営 | 本番適用は承認後 |
| 環境変数/secret管理 | KINSEI運営/開発 | Vercel/Supabase | service key はサーバー専用 |
| 監視/障害一次確認 | KINSEI運営 | 開発 | ログ・画面再現・影響確認 |
| 外部基盤障害 | Vercel/Supabase/GitHub | KINSEI運営 | ベンダーステータス確認 |

## 4. サービスレベル目標

| 区分 | 目標 |
| --- | --- |
| 可用性 | 月次 99.0% 目標。外部基盤障害、計画停止、未承認変更は除外 |
| P0: 個人情報露出/認証突破 | 検知後すぐに公開停止または権限遮断。24時間以内に一次報告 |
| P1: ログイン不可/主要導線停止 | 営業時間内4時間以内に一次確認。復旧目標24時間以内 |
| P2: 管理画面の一部不具合 | 2営業日以内に一次回答 |
| P3: 表示崩れ/文言調整 | 次回通常リリースで対応 |
| RTO | 24時間以内から開始 |
| RPO | Supabase/Vercelの利用プランとバックアップ状態に依存。初期目標24時間以内 |
| 問い合わせ応答 | 通常2営業日以内、ログイン/個人情報系は1営業日以内 |

## 5. セキュリティ基準

- `SUPABASE_SECRET_KEY` / service role key はサーバー側でのみ使う。
- `NEXT_PUBLIC_` へ secret を置かない。
- Data API は `GRANT` と RLS の両方で制御する。
- 公開ページは公開に必要な列だけを取得する。
- 学生の `auth_user_id`、`login_email`、共有同意状態などは一般Data APIへ出さない。
- 求人の `admin_note` と連絡先メールは匿名ユーザーへ出さない。
- 学生の連絡履歴作成は、サーバーアクションで本人、同意、公開企業/求人を検証してから保存する。
- 一時データを作成した場合は、削除確認までをテスト完了条件に含める。

## 6. 変更管理

本番反映の標準順序:

1. ローカルで実装
2. `npm run lint`
3. `npm run build`
4. ローカルE2E
5. Supabase migration の影響確認
6. 必要に応じて DB migration と Vercel deploy の順序を決定
7. commit / push
8. Vercel production deploy
9. 本番URLと主要導線を確認
10. 変更内容、検証結果、既知リスクを記録

DBとアプリの互換性が崩れる変更では、DBだけ先に適用しない。DB権限を先に締める場合は、現行本番コードへの影響を明記して承認を取る。

## 7. 受入基準

- TOPページで学生ログイン導線が明確に見える。
- `/student/login` からログインできる。
- `/student/profile` で本人プロフィールを確認できる。
- `/companies` に公開企業のみ表示される。
- `/companies/[companyId]` に公開求人のみ表示される。
- 学生が同意した場合だけ、プロフィール入りメール本文と連絡履歴が作成される。
- 未ログイン時はログインへ誘導される。
- 管理画面の既存企業会員DB導線を壊さない。
- `npm run lint` と `npm run build` が通る。
- Data APIで内部列が匿名/一般ユーザーへ露出しない。

## 8. リスク台帳

| リスク | 重要度 | 対応 |
| --- | --- | --- |
| DB migration だけ先に進み、Vercel本番コードと不整合になる | 高 | DB/アプリを同一リリース単位で管理 |
| Data APIの列権限が広く、RLSで守れない列が露出する | 高 | 列GRANTを最小化し、service role経由に分離 |
| `mailto:` 後の送信完了を履歴と誤認する | 中 | 「メール作成導線利用履歴」と明記 |
| 外部基盤障害 | 中 | ベンダーステータス確認、運営への一次報告 |
| 学生プロフィールの誤情報 | 中 | 初期は運営修正依頼フローで対応 |

## 9. インシデント対応

P0/P1時の基本手順:

1. 影響範囲を確認する。
2. 必要なら公開停止、該当RLS/GRANTの遮断、Vercel rollback を行う。
3. 一時データやログを保全する。
4. 原因、影響範囲、暫定対応、恒久対応を記録する。
5. 再発防止策を migration / test / 運用手順へ反映する。

## 10. リリース判定

本番公開してよい状態:

- DB migration とアプリコードの順序が決まっている
- service role key が Vercel 本番環境に設定済み
- `npm run lint` 成功
- `npm run build` 成功
- 主要導線E2E成功
- Data APIで内部列が取得できないことを確認
- ロールバック手順が明記されている
