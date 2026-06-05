'use client'

import { useMemo, useState } from 'react'
import type { CompanyAccessLinkFlash } from '@/lib/admin/companyAccessLinkFlash'

type CompanyAccessLinkPanelProps = {
  link: CompanyAccessLinkFlash
}

function getChatMessage(link: CompanyAccessLinkFlash) {
  return `${link.companyName}
${link.contactName} 様

Kinsei企業会員DBのログイン設定リンクをお送りします。
下記リンクからパスワードを設定すると、学生データベースをご利用いただけます。

${link.actionLink}

リンクの有効期限が切れた場合は、Kinsei運営までご連絡ください。`
}

export function CompanyAccessLinkPanel({ link }: CompanyAccessLinkPanelProps) {
  const [copyStatus, setCopyStatus] = useState('')
  const chatMessage = useMemo(() => getChatMessage(link), [link])

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(successMessage)
    } catch {
      setCopyStatus('コピーできませんでした。URLを選択してコピーしてください。')
    }
  }

  return (
    <section className="admin-panel admin-link-panel">
      <div className="admin-link-panel-heading">
        <div>
          <p>Access Link</p>
          <h2>ログイン設定リンクを発行しました</h2>
          <span>{link.contactEmail} の担当者へ、チャットなどでこのリンクを送ってください。</span>
        </div>
        <span className="status-pill">15分表示</span>
      </div>

      <label className="admin-copy-field">
        <span className="admin-label-text">ログイン設定リンク</span>
        <input className="admin-copy-input" readOnly value={link.actionLink} />
      </label>

      <label className="admin-copy-field">
        <span className="admin-label-text">チャット用メッセージ</span>
        <textarea className="admin-copy-message" readOnly value={chatMessage} />
      </label>

      <div className="admin-copy-actions">
        <button className="admin-button" onClick={() => copyText(link.actionLink, 'リンクをコピーしました。')} type="button">
          リンクをコピー
        </button>
        <button className="admin-button secondary" onClick={() => copyText(chatMessage, 'チャット用メッセージをコピーしました。')} type="button">
          文面ごとコピー
        </button>
      </div>

      {copyStatus ? <p className="admin-copy-status">{copyStatus}</p> : null}
    </section>
  )
}
