import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'

type StudentDatabaseHeaderProps = {
  active?: 'public' | 'members' | 'login'
}

export async function StudentDatabaseHeader({ active }: StudentDatabaseHeaderProps) {
  const supabase = await createClient()
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
  const isLoggedIn = Boolean(data.user)
  const memberDatabaseHref = isLoggedIn ? '/members/students' : '/login?next=/members/students'

  return (
    <header className="student-db-header">
      <Link className="student-db-brand" href="/index.html">
        <span>K</span>
        <strong>近世 KINSEI</strong>
      </Link>
      <details className="student-db-menu">
        <summary className="student-db-menu-button" aria-label="メニューを開く">
          <span />
          <span />
          <span />
        </summary>
        <nav aria-label="学生プロフィール">
          <Link href="/">TOP</Link>
          <Link href="/index.html#cases">実績・事例</Link>
          <Link href="/sponsors_list.html">協賛企業</Link>
          <Link href="/sponsor.html">企業の方へ</Link>
          <Link href="/index.html#members">メンバー</Link>
          <Link aria-current={active === 'public' ? 'page' : undefined} href="/students">
            学生プロフィールを見る
          </Link>
          <Link
            aria-current={active === 'members' || active === 'login' ? 'page' : undefined}
            className="student-db-login-link"
            href={memberDatabaseHref}
          >
            ログイン
          </Link>
          <Link href="/index.html#contact">お問い合わせ</Link>
          {isLoggedIn ? <LogoutButton /> : null}
        </nav>
      </details>
    </header>
  )
}
