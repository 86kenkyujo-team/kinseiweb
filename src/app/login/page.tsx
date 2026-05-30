import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/LoginForm'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { getSupabaseBrowserEnv } from '@/lib/supabase/config'
import './styles.css'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const { isConfigured } = getSupabaseBrowserEnv()

  return (
    <main className="login-page">
      <StudentDatabaseHeader active="login" />
      <section className="login-hero">
        <div>
          <p className="eyebrow">Company Member Access</p>
          <h2>
            学生の実績を
            <br />
            採用判断に変える。
          </h2>
          <p>
            価値観、キャリア軸、志望理由の深掘り、面談リクエストまで。
            会員限定の学生詳細ページで、次に会うべき学生を見つけられます。
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
            <Link className="secondary-link" href="/students">
              公開中の学生プロフィールを見る
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
