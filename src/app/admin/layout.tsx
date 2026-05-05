import Link from 'next/link'
import './styles.css'

const navItems = [
  { href: '/admin', label: 'ダッシュボード' },
  { href: '/admin/companies', label: '企業管理' },
  { href: '/admin/students', label: '学生管理' },
  { href: '/admin/requests', label: '面談リクエスト' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link className="admin-brand" href="/admin">
          KINSEI Admin
          <span>運営専用ページ</span>
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  )
}
