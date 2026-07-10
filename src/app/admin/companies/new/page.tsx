import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { companyMembershipStatusOptions } from '@/lib/admin/companyMembershipStatus'
import { companyPublicStatusOptions } from '@/lib/admin/companyPublicStatus'
import { createCompany } from '../actions'

export const dynamic = 'force-dynamic'

type NewCompanyPageProps = {
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  auth_user_duplicate_company: 'このメールアドレスのログインアカウントは、すでに別の企業に紐づいています。',
  auth_user_lookup_error: '既存のログインアカウントを確認できませんでした。時間をおいて再度お試しください。',
  company_error: '企業情報を作成できませんでした。',
  duplicate: 'このメールアドレスの企業はすでに登録されています。',
  invite_email_invalid: 'メールアドレスが無効と判定されました。実在する企業メールアドレスを入力してください。',
  invite_error: 'ログイン設定リンクを発行できませんでした。',
  password_reset_error: '既存アカウント用のログイン設定リンクを発行できませんでした。',
  service_key_missing: 'ログイン設定リンクの発行には Vercel の SUPABASE_SECRET_KEY 設定が必要です。',
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
          <span>担当者メールアドレスでログイン設定リンクを発行し、画面でコピーできます。</span>
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
            <span>
              企業名と担当者情報です。新規・既存アカウントどちらも、登録後に画面上でログイン設定リンクをコピーできます。
            </span>
          </div>
          <label>
            <span className="admin-label-text">企業名</span>
            <span className="admin-field-hint">管理画面と企業会員DBで表示する会社名です。</span>
            <input name="companyName" required />
          </label>
          <label>
            <span className="admin-label-text">担当者名</span>
            <span className="admin-field-hint">ログイン設定リンクを共有する企業側の担当者です。</span>
            <input name="contactName" required />
          </label>
          <label>
            <span className="admin-label-text">担当者メールアドレス</span>
            <span className="admin-field-hint">ログインアカウントとして使うメールアドレスです。リンクは登録後に画面で発行されます。</span>
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
            <p>学生向け公開情報</p>
            <span>学生が見る企業一覧・企業詳細で表示する情報です。担当者メールとは分けて管理します。</span>
          </div>
          <label>
            <span className="admin-label-text">学生向け公開状態</span>
            <select name="publicStatus" required defaultValue="draft">
              {companyPublicStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}（{option.description}）
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="admin-label-text">表示順</span>
            <span className="admin-field-hint">小さい数字ほど先に表示します。</span>
            <input name="sortOrder" inputMode="numeric" type="number" defaultValue="100" />
          </label>
          <label>
            <span className="admin-label-text">企業ロゴURL</span>
            <input name="logoUrl" placeholder="https://example.com/logo.png" />
          </label>
          <label>
            <span className="admin-label-text">業界カテゴリ</span>
            <input name="industryCategory" placeholder="例: IT / 人材 / 広告" />
          </label>
          <label className="full">
            <span className="admin-label-text">学生向け企業説明</span>
            <textarea name="companyDescription" placeholder="学生に向けて事業内容や募集背景を説明します。" />
          </label>
          <label>
            <span className="admin-label-text">公開用公式サイトURL</span>
            <input name="publicWebsiteUrl" placeholder="https://example.com" />
          </label>
          <label>
            <span className="admin-label-text">学生向け公開メール</span>
            <span className="admin-field-hint">学生が連絡する宛先です。担当者ログインメールとは別にしてください。</span>
            <input name="publicContactEmail" type="email" placeholder="recruit@example.com" />
          </label>
          <label>
            <span className="admin-label-text">所在地・勤務地概要</span>
            <input name="publicLocation" placeholder="例: 大阪 / 東京 / フルリモート" />
          </label>
          <label>
            <span className="admin-label-text">表示タグ</span>
            <span className="admin-field-hint">複数ある場合はカンマ区切りで入力できます。</span>
            <input name="publicTags" placeholder="例: 長期インターン, 新規事業, 裁量大" />
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
          <button type="submit">登録してリンクを発行</button>
        </div>
      </form>
    </>
  )
}
