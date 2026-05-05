import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { resendCompanyInvite, updateCompany } from '../actions'

export const dynamic = 'force-dynamic'

type CompanyDetailPageProps = {
  params: Promise<{ companyId: string }>
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  created: '企業を登録し、招待メールを送信しました。',
  error: '企業情報を更新できませんでした。',
  invite_error: '招待メールを再送できませんでした。',
  invite_sent: '招待メールを再送しました。',
  updated: '企業情報を更新しました。',
}

export default async function CompanyDetailPage({ params, searchParams }: CompanyDetailPageProps) {
  const { companyId } = await params
  const query = await searchParams
  const { adminClient } = await requireAdmin()
  const { data: company } = await adminClient
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle()

  if (!company) {
    notFound()
  }

  const message = query?.status ? statusMessages[query.status] : null

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Company Detail</p>
          <h1>{company.company_name}</h1>
          <span>契約状況の台帳と、企業会員DBの閲覧可否を管理します。</span>
        </div>
        <Link className="admin-button secondary" href="/admin/companies">
          一覧へ戻る
        </Link>
      </section>

      {message ? <div className="admin-notice">{message}</div> : null}

      <form action={updateCompany} className="admin-form">
        <input name="companyId" type="hidden" value={company.id} />
        <input name="previousStatus" type="hidden" value={company.membership_status} />
        <div className="admin-form-grid">
          <label>
            企業名
            <input name="companyName" required defaultValue={company.company_name} />
          </label>
          <label>
            担当者名
            <input name="contactName" required defaultValue={company.contact_name} />
          </label>
          <label>
            担当者メールアドレス
            <input name="contactEmail" required type="email" defaultValue={company.contact_email} />
          </label>
          <label>
            会員ステータス
            <select name="membershipStatus" required defaultValue={company.membership_status}>
              <option value="trial">trial</option>
              <option value="active">active</option>
              <option value="past_due">past_due</option>
              <option value="suspended">suspended</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <label>
            プラン名
            <input name="planName" defaultValue={company.plan_name || ''} />
          </label>
          <label>
            契約開始日
            <input name="contractStartDate" type="date" defaultValue={company.contract_start_date || ''} />
          </label>
          <label>
            契約終了日
            <input name="contractEndDate" type="date" defaultValue={company.contract_end_date || ''} />
          </label>
          <label>
            次回確認日
            <input name="nextCheckDate" type="date" defaultValue={company.next_check_date || ''} />
          </label>
          <label className="full">
            契約状況メモ
            <textarea name="contractStatusNote" defaultValue={company.contract_status_note || ''} />
          </label>
          <label className="full">
            ステータス変更メモ
            <textarea name="statusNote" />
          </label>
          <label className="full">
            運営メモ
            <textarea name="adminNote" defaultValue={company.admin_note || ''} />
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="submit">更新する</button>
        </div>
      </form>

      <section className="admin-panel">
        <h2>招待リンク</h2>
        <p>企業担当者がリンクを見失った場合は、担当者メールアドレスへ招待メールを再送します。</p>
        <form action={resendCompanyInvite} className="admin-inline-form">
          <input name="companyId" type="hidden" value={company.id} />
          <input name="contactEmail" type="hidden" value={company.contact_email} />
          <button type="submit">招待メールを再送</button>
        </form>
      </section>
    </>
  )
}
