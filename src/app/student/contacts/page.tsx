import Link from 'next/link'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { requireStudent } from '@/lib/student/auth'
import '../styles.css'

export const dynamic = 'force-dynamic'

type StudentContact = {
  companies: { company_name: string } | { company_name: string }[] | null
  contact_email: string
  created_at: string
  id: string
  job_posts: { title: string } | { title: string }[] | null
  status: string
}

function nestedLabel(value: StudentContact['companies'] | StudentContact['job_posts'], key: 'company_name' | 'title') {
  const item = Array.isArray(value) ? value[0] : value

  if (!item || typeof item !== 'object') {
    return ''
  }

  return String((item as Record<string, string | undefined>)[key] || '')
}

export default async function StudentContactsPage() {
  const context = await requireStudent('/student/contacts')

  if (!context.isConfigured || !context.student) {
    return (
      <main className="student-page">
        <StudentDatabaseHeader active="student" logoutRedirectTo="/student/login" />
        <section className="student-setup">
          <p>Account Setup</p>
          <h1>連絡履歴を表示できません</h1>
          <span>学生プロフィールの紐づけをKINSEI運営へ確認してください。</span>
        </section>
      </main>
    )
  }

  const { data: contacts, error } = await context.studentClient
    .from('student_company_contacts')
    .select(
      `
        id,
        contact_email,
        status,
        created_at,
        companies (
          company_name
        ),
        job_posts (
          title
        )
      `,
    )
    .eq('student_id', context.student.id)
    .order('created_at', { ascending: false })
    .returns<StudentContact[]>()

  return (
    <main className="student-page">
      <StudentDatabaseHeader active="student" logoutRedirectTo="/student/login" />

      <section className="student-hero compact">
        <div>
          <p>Contact History</p>
          <h1>連絡導線利用履歴</h1>
          <span>メールアプリを開いた履歴です。メール送信完了の履歴ではありません。</span>
        </div>
        <div className="student-hero-actions">
          <Link href="/companies">企業を探す</Link>
          <Link href="/student/profile">プロフィールへ戻る</Link>
        </div>
      </section>

      {error ? <div className="student-notice">{error.message}</div> : null}

      <section className="student-history-list">
        {contacts?.map((contact) => (
          <article className="student-history-item" key={contact.id}>
            <div>
              <span>{new Date(contact.created_at).toLocaleString('ja-JP')}</span>
              <h2>{nestedLabel(contact.companies, 'company_name') || '企業名未設定'}</h2>
              <p>{nestedLabel(contact.job_posts, 'title') || '企業単位の連絡'}</p>
            </div>
            <div>
              <strong>{contact.contact_email}</strong>
              <span>{contact.status === 'mail_client_opened' ? 'メール作成済み' : contact.status}</span>
            </div>
          </article>
        ))}
        {!contacts?.length ? (
          <div className="student-empty">
            <h2>連絡履歴はまだありません</h2>
            <p>企業詳細ページからプロフィール情報を添えたメール作成導線を利用すると、ここに履歴が残ります。</p>
            <Link href="/companies">企業を探す</Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}
