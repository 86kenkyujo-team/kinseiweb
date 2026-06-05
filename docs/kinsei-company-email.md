# Kinsei company access email

企業登録・再送時のログイン案内メールは、Supabase標準メールを使わず、Kinsei名義のメールとして送信します。

## Required Vercel environment variables

Production に以下を設定してください。

```text
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=https://www.kinsei-inc.com
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

任意で送信元を変更する場合だけ、以下も設定できます。

```text
KINSEI_EMAIL_FROM=Kinsei <no-reply@kinsei-inc.com>
```

未設定の場合は `Kinsei <no-reply@kinsei-inc.com>` を使います。

## Resend domain setup

Resend側で `kinsei-inc.com` またはメール送信用サブドメインを認証してください。
DNSにはResendが提示する SPF / DKIM / MX などのレコードを追加します。

認証が完了して `RESEND_API_KEY` をVercelに設定すると、企業登録・再送時に以下の流れになります。

1. Supabase Admin APIでログイン設定リンクだけを生成
2. メール本文には `https://www.kinsei-inc.com/auth/confirm` の自社ドメインURLを掲載
3. `/auth/confirm` でtokenを検証
4. `/password-update` で企業担当者がパスワードを設定

## Fallback behavior

`RESEND_API_KEY` が無い場合、Supabase標準メールには戻しません。
管理画面に設定不足メッセージを出し、Supabase丸出しのメールが送られないようにしています。
