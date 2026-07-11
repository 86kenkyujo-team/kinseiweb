import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'

type StudentDatabaseHeaderProps = {
  active?: 'companies' | 'login' | 'members' | 'public' | 'student'
  logoutRedirectTo?: string
}

type HeaderNavigationProps = {
  active?: StudentDatabaseHeaderProps['active']
  isLoggedIn: boolean
  logoutRedirectTo: string
  memberDatabaseHref: string
  studentHref: string
}

function HeaderNavigation({
  active,
  isLoggedIn,
  logoutRedirectTo,
  memberDatabaseHref,
  studentHref,
}: HeaderNavigationProps) {
  return (
    <>
      <Link href="/">TOP</Link>
      <Link href="/index.html#cases">実績・事例</Link>
      <Link href="/sponsors_list.html">協賛企業</Link>
      <Link href="/sponsor.html">企業の方へ</Link>
      <Link href="/index.html#members">メンバー</Link>
      <Link aria-current={active === 'companies' ? 'page' : undefined} href="/companies">
        企業を探す
      </Link>
      <Link aria-current={active === 'public' ? 'page' : undefined} href="/students">
        学生プロフィールを見る
      </Link>
      <Link
        aria-current={active === 'members' || active === 'login' ? 'page' : undefined}
        className="student-db-login-link"
        href={memberDatabaseHref}
      >
        企業ログイン
      </Link>
      <Link
        aria-current={active === 'student' ? 'page' : undefined}
        className="student-db-login-link"
        href={studentHref}
      >
        {isLoggedIn ? 'マイページ' : '学生ログイン'}
      </Link>
      <Link href="/index.html#contact">お問い合わせ</Link>
      {isLoggedIn ? <LogoutButton redirectTo={logoutRedirectTo} /> : null}
    </>
  )
}

export async function StudentDatabaseHeader({ active, logoutRedirectTo = '/login' }: StudentDatabaseHeaderProps) {
  const supabase = await createClient()
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
  const isLoggedIn = Boolean(data.user)
  const memberDatabaseHref = isLoggedIn ? '/members/students' : '/login?next=/members/students'
  const studentHref = isLoggedIn ? '/student/profile' : '/student/login'

  return (
    <header className="student-db-header">
      <Link className="student-db-brand" href="/index.html">
        <span>K</span>
        <strong>近世 KINSEI</strong>
      </Link>
      <nav className="student-db-desktop-nav" aria-label="学生プロフィール">
        <HeaderNavigation
          active={active}
          isLoggedIn={isLoggedIn}
          logoutRedirectTo={logoutRedirectTo}
          memberDatabaseHref={memberDatabaseHref}
          studentHref={studentHref}
        />
      </nav>
      <details className="student-db-menu">
        <summary className="student-db-menu-button" aria-label="メニューを開く">
          <span />
          <span />
          <span />
        </summary>
        <nav aria-label="学生プロフィール">
          <HeaderNavigation
            active={active}
            isLoggedIn={isLoggedIn}
            logoutRedirectTo={logoutRedirectTo}
            memberDatabaseHref={memberDatabaseHref}
            studentHref={studentHref}
          />
        </nav>
      </details>
    </header>
  )
}
