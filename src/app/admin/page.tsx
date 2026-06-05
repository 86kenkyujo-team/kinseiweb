import Link from 'next/link'
import { getAdminContext } from '@/lib/admin/auth'
import { getCompanyMembershipStatusLabel } from '@/lib/admin/companyMembershipStatus'
import { getStudentPublicationStatusLabel } from '@/lib/admin/studentPublicationStatus'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type MetricResult = {
  count: number | null
}

function metricValue(result: MetricResult) {
  return result.count ?? 0
}

export default async function AdminDashboardPage() {
  const { adminClient, adminUser, isConfigured, user } = await getAdminContext()

  if (!isConfigured || !adminClient) {
    return (
      <section className="admin-panel">
        <h1>管理画面の設定が未完了です</h1>
        <p>
          `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定してください。
        </p>
      </section>
    )
  }

  if (!user) {
    redirect('/admin/login?next=/admin')
  }

  if (!adminUser) {
    redirect('/membership-inactive')
  }

  const [
    publishedStudents,
    draftStudents,
    activeCompanies,
    pastDueCompanies,
    newRequests,
    recentStudents,
    recentCompanies,
  ] = await Promise.all([
    adminClient.from('students').select('id', { count: 'exact', head: true }).eq('publication_status', 'published'),
    adminClient.from('students').select('id', { count: 'exact', head: true }).eq('publication_status', 'draft'),
    adminClient.from('companies').select('id', { count: 'exact', head: true }).in('membership_status', ['active', 'trial']),
    adminClient.from('companies').select('id', { count: 'exact', head: true }).eq('membership_status', 'past_due'),
    adminClient.from('interview_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    adminClient
      .from('students')
      .select('id, display_name, publication_status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
    adminClient
      .from('companies')
      .select('id, company_name, membership_status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Dashboard</p>
          <h1>運営状況</h1>
          <span>学生DB、企業契約ステータス、面談リクエストをここから確認します。</span>
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-metric">
          <strong>{metricValue(publishedStudents)}</strong>
          <span>公開中学生</span>
        </div>
        <div className="admin-metric">
          <strong>{metricValue(draftStudents)}</strong>
          <span>下書き学生</span>
        </div>
        <div className="admin-metric">
          <strong>{metricValue(activeCompanies)}</strong>
          <span>閲覧可能企業</span>
        </div>
        <div className="admin-metric">
          <strong>{metricValue(newRequests)}</strong>
          <span>新規リクエスト</span>
        </div>
      </section>

      {metricValue(pastDueCompanies) > 0 ? (
        <div className="admin-notice">
          支払い確認待ちの企業が {metricValue(pastDueCompanies)} 件あります。
        </div>
      ) : null}

      <section className="admin-panel">
        <h2>最近更新された学生</h2>
        <div className="admin-list">
          {recentStudents.data?.map((student) => (
            <Link href={`/admin/students/${student.id}/edit`} key={student.id}>
              <span>
                {student.display_name}
                <small>{getStudentPublicationStatusLabel(student.publication_status)}</small>
              </span>
              <strong>編集</strong>
            </Link>
          ))}
          {!recentStudents.data?.length ? <p className="admin-empty">学生データがありません。</p> : null}
        </div>
      </section>

      <section className="admin-panel">
        <h2>最近登録・更新された企業</h2>
        <div className="admin-list">
          {recentCompanies.data?.map((company) => (
            <Link href={`/admin/companies/${company.id}`} key={company.id}>
              <span>
                {company.company_name}
                <small>{getCompanyMembershipStatusLabel(company.membership_status)}</small>
              </span>
              <strong>確認</strong>
            </Link>
          ))}
          {!recentCompanies.data?.length ? <p className="admin-empty">企業データがありません。</p> : null}
        </div>
      </section>
    </>
  )
}
