'use client'

import { useMemo, useState } from 'react'
import type { StudentAccessLinkFlash } from '@/lib/admin/studentAccessLinkFlash'

type StudentAccessLinkPanelProps = {
  link: StudentAccessLinkFlash
}

function getChatMessage(link: StudentAccessLinkFlash) {
  return `${link.studentDisplayName} さん

KINSEI学生マイページのログイン設定リンクをお送りします。
下記リンクからパスワードを設定すると、登録プロフィールの確認と企業への連絡導線をご利用いただけます。

${link.actionLink}

リンクの有効期限が切れた場合は、KINSEI運営までご連絡ください。`
}

export function StudentAccessLinkPanel({ link }: StudentAccessLinkPanelProps) {
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
          <p>Student Access Link</p>
          <h2>学生ログイン設定リンクを発行しました</h2>
          <span>{link.contactEmail} 宛に送る文面としてコピーできます。</span>
        </div>
        <span className="status-pill">15分表示</span>
      </div>

      <label className="admin-copy-field">
        <span className="admin-label-text">ログイン設定リンク</span>
        <input className="admin-copy-input" readOnly value={link.actionLink} />
      </label>

      <label className="admin-copy-field">
        <span className="admin-label-text">学生送信用メッセージ</span>
        <textarea className="admin-copy-message" readOnly value={chatMessage} />
      </label>

      <div className="admin-copy-actions">
        <button className="admin-button" onClick={() => copyText(link.actionLink, 'リンクをコピーしました。')} type="button">
          リンクをコピー
        </button>
        <button className="admin-button secondary" onClick={() => copyText(chatMessage, '学生送信用メッセージをコピーしました。')} type="button">
          文面ごとコピー
        </button>
      </div>

      {copyStatus ? <p className="admin-copy-status">{copyStatus}</p> : null}
    </section>
  )
}
