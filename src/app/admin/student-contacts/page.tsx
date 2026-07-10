import { requireAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

type StudentContact = {
  companies: { company_name: string } | { company_name: string }[] | null
  contact_email: string
  created_at: string
  id: string
  job_posts: { title: string } | { title: string }[] | null
  mail_subject: string
  profile_snapshot: {
    display_name?: string
    faculty?: string
    grade?: string
    real_name?: string | null
  } | null
  status: string
  students: { display_name: string } | { display_name: string }[] | null
}

function firstName(value: StudentContact['companies'] | StudentContact['job_posts'] | StudentContact['students'], key: 'company_name' | 'display_name' | 'title') {
  const item = Array.isArray(value) ? value[0] : value

  if (!item || typeof item !== 'object') {
    return ''
  }

  return String((item as Record<string, string | undefined>)[key] || '')
}

export default async function AdminStudentContactsPage() {
  const { adminClient } = await requireAdmin()
  const { data: contacts, error } = await adminClient
    .from('student_company_contacts')
    .select(
      `
        id,
        contact_email,
        mail_subject,
        profile_snapshot,
        status,
        created_at,
        students (
          display_name
        ),
        companies (
          company_name
        ),
        job_posts (
          title
        )
      `,
    )
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<StudentContact[]>()

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Student Contacts</p>
          <h1>連絡導線利用履歴</h1>
          <span>学生がプロフィール情報を添えたメール作成導線を利用した履歴です。</span>
        </div>
      </section>

      {error ? <div className="admin-notice">{error.message}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>日時</th>
              <th>学生</th>
              <th>企業</th>
              <th>求人</th>
              <th>宛先</th>
              <th>件名</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact.id}>
                <td>{new Date(contact.created_at).toLocaleString('ja-JP')}</td>
                <td>
                  <strong>
                    {contact.profile_snapshot?.real_name ||
                      contact.profile_snapshot?.display_name ||
                      firstName(contact.students, 'display_name') ||
                      '学生名未設定'}
                  </strong>
                  <small>
                    {[contact.profile_snapshot?.faculty, contact.profile_snapshot?.grade].filter(Boolean).join(' / ') || contact.id}
                  </small>
                </td>
                <td>{firstName(contact.companies, 'company_name') || '企業名未設定'}</td>
                <td>{firstName(contact.job_posts, 'title') || '企業単位の連絡'}</td>
                <td>{contact.contact_email}</td>
                <td>{contact.mail_subject}</td>
                <td>
                  <span className="status-pill">
                    {contact.status === 'mail_client_opened' ? 'メール作成済み' : contact.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!contacts?.length ? <p className="admin-empty">連絡導線利用履歴はまだありません。</p> : null}
      </div>
    </>
  )
}
