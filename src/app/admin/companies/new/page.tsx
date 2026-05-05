import Link from 'next/link'
import { createCompany } from '../actions'

type NewCompanyPageProps = {
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  company_error: '企業情報を作成できませんでした。',
  duplicate: 'このメールアドレスの企業はすでに登録されています。',
  invite_error: '招待メールを送信できませんでした。',
  service_key_missing: '企業招待メールの送信には Vercel の SUPABASE_SERVICE_ROLE_KEY 設定が必要です。',
}

export default async function NewCompanyPage({ searchParams }: NewCompanyPageProps) {
  const params = await searchParams
  const message = params?.status ? statusMessages[params.status] : null

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>New Company</p>
          <h1>企業を登録</h1>
          <span>担当者メールアドレスへ招待リンクを送り、企業側でパスワードを設定します。</span>
        </div>
        <Link className="admin-button secondary" href="/admin/companies">
          一覧へ戻る
        </Link>
      </section>

      {message ? <div className="admin-notice">{message}</div> : null}

      <form action={createCompany} className="admin-form">
        <div className="admin-form-grid">
          <label>
            企業名
            <input name="companyName" required />
          </label>
          <label>
            担当者名
            <input name="contactName" required />
          </label>
          <label>
            担当者メールアドレス
            <input name="contactEmail" required type="email" />
          </label>
          <label>
            会員ステータス
            <select name="membershipStatus" required defaultValue="trial">
              <option value="trial">trial</option>
              <option value="active">active</option>
              <option value="past_due">past_due</option>
              <option value="suspended">suspended</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <label>
            プラン名
            <input name="planName" placeholder="例: Standard" />
          </label>
          <label>
            契約開始日
            <input name="contractStartDate" type="date" />
          </label>
          <label>
            契約終了日
            <input name="contractEndDate" type="date" />
          </label>
          <label>
            次回確認日
            <input name="nextCheckDate" type="date" />
          </label>
          <label className="full">
            契約状況メモ
            <textarea name="contractStatusNote" placeholder="外部で確認した契約・サブスク状況" />
          </label>
          <label className="full">
            運営メモ
            <textarea name="adminNote" />
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="submit">登録して招待を送る</button>
        </div>
      </form>
    </>
  )
}
