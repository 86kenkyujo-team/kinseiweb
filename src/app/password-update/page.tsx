import { Suspense } from 'react'
import { PasswordUpdateForm } from '@/components/PasswordUpdateForm'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import '../login/styles.css'

export const dynamic = 'force-dynamic'

export default function PasswordUpdatePage() {
  return (
    <main className="login-page password-page">
      <StudentDatabaseHeader active="login" />
      <section className="login-hero">
        <div>
          <p className="eyebrow">Account Recovery</p>
          <h2>
            新しい
            <br />
            パスワードを登録。
          </h2>
          <p>
            メールの再設定リンクから開いた場合のみ、ここで新しいパスワードを保存できます。
          </p>
        </div>
      </section>

      <section className="login-panel">
        <Suspense fallback={<div className="login-card">フォームを読み込んでいます。</div>}>
          <PasswordUpdateForm />
        </Suspense>
      </section>
    </main>
  )
}
