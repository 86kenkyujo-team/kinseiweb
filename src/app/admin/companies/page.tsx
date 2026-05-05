import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

type Company = {
  company_name: string
  contact_email: string
  contact_name: string
  contract_end_date: string | null
  id: string
  membership_status: string
  next_check_date: string | null
  plan_name: string | null
  updated_at: string
}

function isBlockedStatus(status: string) {
  return !['active', 'trial'].includes(status)
}

export default async function AdminCompaniesPage() {
  const { adminClient } = await requireAdmin()
  const { data: companies, error } = await adminClient
    .from('companies')
    .select(
      'id, company_name, contact_name, contact_email, membership_status, plan_name, contract_end_date, next_check_date, updated_at',
    )
    .order('updated_at', { ascending: false })
    .returns<Company[]>()

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Companies</p>
          <h1>企業管理</h1>
          <span>外部で確認した契約状況を登録し、企業DBの閲覧可否を管理します。</span>
        </div>
        <Link className="admin-button" href="/admin/companies/new">
          企業を登録
        </Link>
      </section>

      {error ? <div className="admin-notice">{error.message}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>企業</th>
              <th>担当者</th>
              <th>ステータス</th>
              <th>契約</th>
              <th>次回確認</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {companies?.map((company) => (
              <tr key={company.id}>
                <td>
                  <strong>{company.company_name}</strong>
                  <small>{company.plan_name || 'プラン未設定'}</small>
                </td>
                <td>
                  {company.contact_name}
                  <small>{company.contact_email}</small>
                </td>
                <td>
                  <span className={`status-pill ${isBlockedStatus(company.membership_status) ? 'blocked' : ''}`}>
                    {company.membership_status}
                  </span>
                </td>
                <td>{company.contract_end_date || '終了日未設定'}</td>
                <td>{company.next_check_date || '未設定'}</td>
                <td>
                  <Link href={`/admin/companies/${company.id}`}>詳細</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!companies?.length ? <p className="admin-empty">企業データがありません。</p> : null}
      </div>
    </>
  )
}
