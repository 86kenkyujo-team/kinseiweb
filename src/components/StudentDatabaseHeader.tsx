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

  return (
    <header className="student-db-header">
      <Link className="student-db-brand" href="/index.html">
        <span>K</span>
        近世 KINSEI
      </Link>
      <nav aria-label="学生データベース">
        <Link href="/index.html">TOP</Link>
        <Link aria-current={active === 'public' ? 'page' : undefined} href="/students">
          公開DB
        </Link>
        <Link aria-current={active === 'members' ? 'page' : undefined} href="/members/students">
          企業会員DB
        </Link>
        <Link href="/index.html#contact">お問い合わせ</Link>
        {isLoggedIn ? (
          <LogoutButton />
        ) : (
          <Link
            aria-current={active === 'login' ? 'page' : undefined}
            className="student-db-login-link"
            href="/login?next=/members/students"
          >
            ログイン
          </Link>
        )}
      </nav>
    </header>
  )
}
