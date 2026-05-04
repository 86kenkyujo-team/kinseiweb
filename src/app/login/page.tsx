import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/LoginForm'
import { getSupabaseBrowserEnv } from '@/lib/supabase/config'
import './styles.css'

export default function LoginPage() {
  const { isConfigured } = getSupabaseBrowserEnv()

  return (
    <main className="login-page">
      <section className="login-hero">
        <Link className="brand" href="/index.html">
          <span>K</span>
          近世 KINSEI
        </Link>
        <div>
          <p className="eyebrow">Student Database</p>
          <h2>詳細情報は、契約中の企業会員だけに。</h2>
          <p>
            価値観、志望理由の深掘り、意思決定の軸、将来像、面談リクエストを安全に扱うためのログイン画面です。
          </p>
        </div>
      </section>

      <section className="login-panel">
        {isConfigured ? (
          <Suspense fallback={<div className="login-card">ログインフォームを読み込んでいます。</div>}>
            <LoginForm />
          </Suspense>
        ) : (
          <div className="login-card">
            <p className="eyebrow">Setup Required</p>
            <h1>Supabase設定待ち</h1>
            <p className="lead">
              `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定するとログインできます。
            </p>
            <Link className="secondary-link" href="/students.html">
              公開DBへ戻る
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
