import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getCompanyMembershipStatusLabel, isAccessibleCompanyStatus } from '@/lib/admin/companyMembershipStatus'
import { getCompanyPublicStatusLabel, isPublishedCompanyPublicStatus } from '@/lib/admin/companyPublicStatus'

export const dynamic = 'force-dynamic'

type AdminCompaniesPageProps = {
  searchParams?: Promise<{ status?: string }>
}

type Company = {
  company_name: string
  contact_email: string
  contact_name: string
  contract_end_date: string | null
  id: string
  membership_status: string
  next_check_date: string | null
  plan_name: string | null
  public_status: string
  updated_at: string
}

const statusMessages: Record<string, string> = {
  delete_not_found: '削除対象の企業が見つかりませんでした。',
  deleted: '企業を削除しました。',
}

export default async function AdminCompaniesPage({ searchParams }: AdminCompaniesPageProps) {
  const params = await searchParams
  const message = params?.status ? statusMessages[params.status] : null
  const { adminClient } = await requireAdmin()
  const { data: companies, error } = await adminClient
    .from('companies')
    .select(
      'id, company_name, contact_name, contact_email, membership_status, public_status, plan_name, contract_end_date, next_check_date, updated_at',
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
      {message ? <div className="admin-notice">{message}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>企業</th>
              <th>担当者</th>
              <th>ステータス</th>
              <th>学生向け</th>
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
                  <span className={`status-pill ${!isAccessibleCompanyStatus(company.membership_status) ? 'blocked' : ''}`}>
                    {getCompanyMembershipStatusLabel(company.membership_status)}
                  </span>
                </td>
                <td>
                  <span className={`status-pill ${!isPublishedCompanyPublicStatus(company.public_status || 'draft') ? 'blocked' : ''}`}>
                    {getCompanyPublicStatusLabel(company.public_status || 'draft')}
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
