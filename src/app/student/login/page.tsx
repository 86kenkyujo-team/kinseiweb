import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/LoginForm'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { getSupabaseBrowserEnv } from '@/lib/supabase/config'
import '../../login/styles.css'

export const dynamic = 'force-dynamic'

export default function StudentLoginPage() {
  const { isConfigured } = getSupabaseBrowserEnv()

  return (
    <main className="login-page">
      <StudentDatabaseHeader active="student" logoutRedirectTo="/student/login" />
      <section className="login-hero">
        <div>
          <p className="eyebrow">Student Access</p>
          <h2>
            登録プロフィールを
            <br />
            確認して企業へ。
          </h2>
          <p>
            KINSEI運営が登録したプロフィールを確認し、同意した内容を添えて企業へ連絡できます。
          </p>
        </div>
      </section>

      <section className="login-panel">
        {isConfigured ? (
          <Suspense fallback={<div className="login-card">ログインフォームを読み込んでいます。</div>}>
            <LoginForm
              defaultNextPath="/student/profile"
              eyebrow="Student Login"
              forgotPasswordHref="/password-reset?next=/student/profile"
              lead="KINSEI運営から案内されたメールアドレスとパスワードでログインしてください。"
              submitLabel="学生マイページへログイン"
              title="学生ログイン"
            />
          </Suspense>
        ) : (
          <div className="login-card">
            <p className="eyebrow">Setup Required</p>
            <h1>Supabase設定待ち</h1>
            <p className="lead">
              `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定するとログインできます。
            </p>
            <Link className="secondary-link" href="/companies">
              企業一覧を見る
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
