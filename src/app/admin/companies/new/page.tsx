import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { companyMembershipStatusOptions } from '@/lib/admin/companyMembershipStatus'
import { createCompany } from '../actions'

export const dynamic = 'force-dynamic'

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
  await requireAdmin()

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
          <div className="admin-form-section full">
            <p>基本情報</p>
            <span>企業名と担当者情報です。担当者メールアドレス宛に招待メールが送られます。</span>
          </div>
          <label>
            <span className="admin-label-text">企業名</span>
            <span className="admin-field-hint">管理画面と企業会員DBで表示する会社名です。</span>
            <input name="companyName" required />
          </label>
          <label>
            <span className="admin-label-text">担当者名</span>
            <span className="admin-field-hint">ログイン案内を受け取る企業側の担当者です。</span>
            <input name="contactName" required />
          </label>
          <label>
            <span className="admin-label-text">担当者メールアドレス</span>
            <span className="admin-field-hint">このメールに招待リンクが送信されます。</span>
            <input name="contactEmail" required type="email" />
          </label>
          <label>
            <span className="admin-label-text">閲覧状態</span>
            <span className="admin-field-hint">企業が学生DBを閲覧できるかを決めます。保存値はそのままです。</span>
            <select name="membershipStatus" required defaultValue="trial">
              {companyMembershipStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}（{option.description}）
                </option>
              ))}
            </select>
          </label>

          <div className="admin-form-section full">
            <p>契約・確認スケジュール</p>
            <span>外部決済や契約台帳で確認した内容を、運営用のメモとして残します。</span>
          </div>
          <label>
            <span className="admin-label-text">プラン名</span>
            <span className="admin-field-hint">例: Standard / Pro / 月額プラン など</span>
            <input name="planName" placeholder="例: Standard" />
          </label>
          <label>
            <span className="admin-label-text">契約開始日</span>
            <input name="contractStartDate" type="date" />
          </label>
          <label>
            <span className="admin-label-text">契約終了日</span>
            <span className="admin-field-hint">終了日が未定の場合は空欄で大丈夫です。</span>
            <input name="contractEndDate" type="date" />
          </label>
          <label>
            <span className="admin-label-text">次回確認日</span>
            <span className="admin-field-hint">支払い・継続確認など、次に見る日を入れます。</span>
            <input name="nextCheckDate" type="date" />
          </label>
          <label className="full">
            <span className="admin-label-text">契約状況メモ</span>
            <span className="admin-field-hint">外部で確認した契約・サブスク状況を残します。</span>
            <textarea name="contractStatusNote" placeholder="例: Stripeで月額契約を確認済み。次回更新日は..." />
          </label>

          <div className="admin-form-section full">
            <p>運営メモ</p>
            <span>社内共有用のメモです。企業側には表示されません。</span>
          </div>
          <label className="full">
            <span className="admin-label-text">運営メモ</span>
            <span className="admin-field-hint">対応履歴、注意点、社内で見ておきたい情報を自由に残せます。</span>
            <textarea name="adminNote" placeholder="例: 初回面談済み。担当は..." />
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="submit">登録して招待を送る</button>
        </div>
      </form>
    </>
  )
}
