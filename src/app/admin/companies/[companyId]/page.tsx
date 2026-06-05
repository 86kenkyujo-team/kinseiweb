import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  companyMembershipStatusOptions,
  getCompanyMembershipStatusDescription,
  getCompanyMembershipStatusLabel,
  isAccessibleCompanyStatus,
} from '@/lib/admin/companyMembershipStatus'
import { deleteCompany, resendCompanyInvite, updateCompany } from '../actions'

export const dynamic = 'force-dynamic'

type CompanyDetailPageProps = {
  params: Promise<{ companyId: string }>
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  created: '企業を登録し、Kinsei名義のログイン設定メールを送信しました。',
  created_existing_user: '企業を登録し、既存アカウントへKinsei名義のログイン設定メールを送信しました。',
  error: '企業情報を更新できませんでした。',
  auth_user_lookup_error: '既存のログインアカウントを確認できませんでした。時間をおいて再度お試しください。',
  custom_email_error: 'Kinsei名義のログイン案内メールを送信できませんでした。Resendの送信元ドメイン設定を確認してください。',
  delete_confirm_required: '削除する場合は確認チェックを入れてください。',
  delete_error: '企業を削除できませんでした。関連データを確認して、時間をおいて再度お試しください。',
  delete_name_mismatch: '入力した企業名が一致しません。削除する企業名を正確に入力してください。',
  email_service_missing: 'Kinsei名義のログイン案内メール送信には Vercel の RESEND_API_KEY 設定が必要です。',
  invite_email_invalid: 'メールアドレスが無効と判定されました。実在する企業メールアドレスを入力してください。',
  invite_error: 'ログイン設定リンクを作成できませんでした。',
  invite_sent: 'Kinsei名義のログイン設定メールを再送しました。',
  password_reset_error: '既存アカウント用のログイン設定リンクを作成できませんでした。',
  password_reset_sent: '既存アカウントへKinsei名義のログイン設定メールを送信しました。',
  service_key_missing: 'ログイン案内の送信には Vercel の SUPABASE_SECRET_KEY 設定が必要です。',
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
  const isAccessible = isAccessibleCompanyStatus(company.membership_status)

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Company Detail</p>
          <h1>{company.company_name}</h1>
          <span>契約状況の台帳、企業会員DBの閲覧可否、ログイン案内を管理します。</span>
        </div>
        <Link className="admin-button secondary" href="/admin/companies">
          一覧へ戻る
        </Link>
      </section>

      {message ? <div className="admin-notice">{message}</div> : null}

      <section className="admin-panel">
        <h2>現在の閲覧状態</h2>
        <div className="admin-status-summary">
          <span className={`status-pill ${!isAccessible ? 'blocked' : ''}`}>
            {getCompanyMembershipStatusLabel(company.membership_status)}
          </span>
          <p>{getCompanyMembershipStatusDescription(company.membership_status)}</p>
        </div>
      </section>

      <form action={updateCompany} className="admin-form">
        <input name="companyId" type="hidden" value={company.id} />
        <input name="previousStatus" type="hidden" value={company.membership_status} />
        <div className="admin-form-grid">
          <div className="admin-form-section full">
            <p>基本情報</p>
            <span>企業名と担当者情報です。担当者メールアドレスはログイン案内の再送にも使います。</span>
          </div>
          <label>
            <span className="admin-label-text">企業名</span>
            <span className="admin-field-hint">管理画面と企業会員DBで表示する会社名です。</span>
            <input name="companyName" required defaultValue={company.company_name} />
          </label>
          <label>
            <span className="admin-label-text">担当者名</span>
            <span className="admin-field-hint">企業側の主担当者です。</span>
            <input name="contactName" required defaultValue={company.contact_name} />
          </label>
          <label>
            <span className="admin-label-text">担当者メールアドレス</span>
            <span className="admin-field-hint">招待メールまたはパスワード再設定メールの宛先です。</span>
            <input name="contactEmail" required type="email" defaultValue={company.contact_email} />
          </label>
          <label>
            <span className="admin-label-text">閲覧状態</span>
            <span className="admin-field-hint">「トライアル中」「閲覧可能」の企業だけが学生DBを閲覧できます。</span>
            <select name="membershipStatus" required defaultValue={company.membership_status}>
              {companyMembershipStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}（{option.description}）
                </option>
              ))}
            </select>
          </label>

          <div className="admin-form-section full">
            <p>契約・確認スケジュール</p>
            <span>契約状況、終了日、次回確認日など、運営側で見る情報です。</span>
          </div>
          <label>
            <span className="admin-label-text">プラン名</span>
            <span className="admin-field-hint">例: Standard / Pro / 月額プラン など</span>
            <input name="planName" defaultValue={company.plan_name || ''} />
          </label>
          <label>
            <span className="admin-label-text">契約開始日</span>
            <input name="contractStartDate" type="date" defaultValue={company.contract_start_date || ''} />
          </label>
          <label>
            <span className="admin-label-text">契約終了日</span>
            <span className="admin-field-hint">終了日が未定の場合は空欄で大丈夫です。</span>
            <input name="contractEndDate" type="date" defaultValue={company.contract_end_date || ''} />
          </label>
          <label>
            <span className="admin-label-text">次回確認日</span>
            <span className="admin-field-hint">支払い・継続確認など、次に見る日を入れます。</span>
            <input name="nextCheckDate" type="date" defaultValue={company.next_check_date || ''} />
          </label>
          <label className="full">
            <span className="admin-label-text">契約状況メモ</span>
            <span className="admin-field-hint">外部で確認した契約・サブスク状況を残します。</span>
            <textarea name="contractStatusNote" defaultValue={company.contract_status_note || ''} />
          </label>

          <div className="admin-form-section full">
            <p>変更メモ・運営メモ</p>
            <span>閲覧状態を変えた理由や、社内共有用のメモを残せます。</span>
          </div>
          <label className="full">
            <span className="admin-label-text">閲覧状態変更メモ</span>
            <span className="admin-field-hint">閲覧状態を切り替えた理由を残せます。変更がない場合は空欄で大丈夫です。</span>
            <textarea name="statusNote" />
          </label>
          <label className="full">
            <span className="admin-label-text">運営メモ</span>
            <span className="admin-field-hint">対応履歴、注意点、社内で見ておきたい情報を自由に残せます。</span>
            <textarea name="adminNote" defaultValue={company.admin_note || ''} />
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="submit">更新する</button>
        </div>
      </form>

      <section className="admin-panel">
        <h2>ログイン案内</h2>
        <p>
          企業担当者がリンクを見失った場合は、担当者メールアドレスへKinsei名義のログイン設定メールを再送します。
          既存アカウントにも同じ案内文で送信します。
        </p>
        <form action={resendCompanyInvite} className="admin-inline-form">
          <input name="companyId" type="hidden" value={company.id} />
          <input name="companyName" type="hidden" value={company.company_name} />
          <input name="contactEmail" type="hidden" value={company.contact_email} />
          <input name="contactName" type="hidden" value={company.contact_name} />
          <button type="submit">ログイン案内を再送</button>
        </form>
      </section>

      <section className="admin-panel danger">
        <h2>企業を削除</h2>
        <p>
          この企業、関連する面談依頼、閲覧状態の履歴を削除します。ログインアカウント自体は削除しません。
        </p>
        <form action={deleteCompany} className="admin-delete-form">
          <input name="companyId" type="hidden" value={company.id} />
          <input name="companyName" type="hidden" value={company.company_name} />
          <label>
            <span className="admin-label-text">削除する企業名</span>
            <span className="admin-field-hint">確認のため「{company.company_name}」と入力してください。</span>
            <input name="companyNameConfirmation" required />
          </label>
          <label className="admin-check-row">
            <input name="confirmDelete" type="checkbox" />
            <span>この企業を削除することを確認しました。</span>
          </label>
          <button className="admin-danger-button" type="submit">
            企業を削除
          </button>
        </form>
      </section>
    </>
  )
}
