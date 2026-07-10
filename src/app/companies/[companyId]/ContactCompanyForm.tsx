'use client'

import { useState, useTransition } from 'react'
import { createCompanyContactMailto } from './actions'

type ContactCompanyFormProps = {
  body: string
  companyId: string
  contactEmail: string | null
  disabledReason?: string
  jobPostId?: string
  subject: string
}

export function ContactCompanyForm({
  body,
  companyId,
  contactEmail,
  disabledReason,
  jobPostId,
  subject,
}: ContactCompanyFormProps) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isConsented, setIsConsented] = useState(false)

  function handleSubmit(formData: FormData) {
    setError('')

    startTransition(async () => {
      const result = await createCompanyContactMailto(formData)

      if (!result.ok) {
        setError(result.error)
        return
      }

      window.location.href = result.mailtoUrl
    })
  }

  return (
    <form action={handleSubmit} className="company-contact-form">
      <input name="companyId" type="hidden" value={companyId} />
      {jobPostId ? <input name="jobPostId" type="hidden" value={jobPostId} /> : null}

      <div className="contact-preview-grid">
        <label>
          <span>宛先</span>
          <input readOnly value={contactEmail || '公開メール未設定'} />
        </label>
        <label>
          <span>件名</span>
          <input readOnly value={subject} />
        </label>
        <label className="full">
          <span>メール本文プレビュー</span>
          <textarea readOnly value={body} />
        </label>
      </div>

      <div className="shared-profile-box">
        <span>共有される主なプロフィール項目</span>
        <p>氏名、大学・学部、学年、活動エリア、志望業界、プロフィール概要、キャリア軸、ログイン用メールアドレス</p>
      </div>

      <label className="company-consent-row">
        <input
          checked={isConsented}
          disabled={Boolean(disabledReason || !contactEmail) || isPending}
          name="profileConsent"
          onChange={(event) => setIsConsented(event.target.checked)}
          type="checkbox"
        />
        <span>近世に登録されている私のプロフィール情報を、選択した企業への連絡内容に含めることに同意します。</span>
      </label>

      {disabledReason ? <p className="company-contact-error">{disabledReason}</p> : null}
      {error ? <p className="company-contact-error">{error}</p> : null}

      <button disabled={!isConsented || Boolean(disabledReason || !contactEmail) || isPending} type="submit">
        {isPending ? '履歴を保存中...' : 'メールアプリを開く'}
      </button>
    </form>
  )
}
