import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/LoginForm'
import { getSupabaseBrowserEnv } from '@/lib/supabase/config'
import './styles.css'

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  const { isConfigured } = getSupabaseBrowserEnv()

  return (
    <section className="admin-login-page">
      <div className="admin-login-copy">
        <p>Admin Access</p>
        <h1>運営管理画面へログイン</h1>
        <span>
          学生情報、企業会員、面談リクエストを管理する運営担当者専用の入口です。
        </span>
      </div>

      {isConfigured ? (
        <Suspense fallback={<div className="login-card">ログインフォームを読み込んでいます。</div>}>
          <LoginForm
            defaultNextPath="/admin"
            eyebrow="Admin Login"
            forgotPasswordHref="/password-reset?next=/admin"
            lead="運営担当者として登録済みのメールアドレスとパスワードでログインしてください。"
            submitLabel="管理画面へログイン"
            title="管理画面ログイン"
            titleLevel="h2"
          />
        </Suspense>
      ) : (
        <div className="login-card">
          <p className="eyebrow">Setup Required</p>
          <h2>Supabase設定待ち</h2>
          <p className="lead">
            `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定すると管理者ログインを利用できます。
          </p>
          <Link className="secondary-link" href="/">
            TOPへ戻る
          </Link>
        </div>
      )}
    </section>
  )
}
