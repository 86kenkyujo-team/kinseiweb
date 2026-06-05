import Link from 'next/link'
import { Suspense } from 'react'
import { PasswordResetRequestForm } from '@/components/PasswordResetRequestForm'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { getSupabaseBrowserEnv } from '@/lib/supabase/config'
import '../login/styles.css'

export const dynamic = 'force-dynamic'

export default function PasswordResetPage() {
  const { isConfigured } = getSupabaseBrowserEnv()

  return (
    <main className="login-page password-page">
      <StudentDatabaseHeader active="login" />
      <section className="login-hero">
        <div>
          <p className="eyebrow">Account Recovery</p>
          <h2>
            登録済みの
            <br />
            パスワードを再設定。
          </h2>
          <p>
            メールに届く再設定リンクから、新しいパスワードを登録できます。
            企業会員ページ、管理画面のどちらにも対応しています。
          </p>
        </div>
      </section>

      <section className="login-panel">
        {isConfigured ? (
          <Suspense fallback={<div className="login-card">フォームを読み込んでいます。</div>}>
            <PasswordResetRequestForm />
          </Suspense>
        ) : (
          <div className="login-card">
            <p className="eyebrow">Setup Required</p>
            <h1>Supabase設定待ち</h1>
            <p className="lead">
              `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定すると再設定メールを送信できます。
            </p>
            <Link className="secondary-link" href="/login?next=/members/students">
              ログイン画面へ戻る
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
