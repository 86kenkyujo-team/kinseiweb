'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function getSafeNextPath(requestedNextPath: string | null) {
  return requestedNextPath?.startsWith('/') && !requestedNextPath.startsWith('//')
    ? requestedNextPath
    : '/members/students'
}

export function PasswordResetRequestForm() {
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get('next'))
  const loginHref =
    nextPath === '/admin'
      ? '/admin/login?next=/admin'
      : `/login?next=${encodeURIComponent(nextPath)}`
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const destinationLabel = nextPath === '/admin' ? '管理画面' : '企業会員ページ'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-update?next=${encodeURIComponent(nextPath)}`,
      })

      if (resetError) {
        setError('再設定メールを送信できませんでした。時間をおいて再度お試しください。')
        return
      }

      setSentEmail(email)
    } catch {
      setError('Supabase Authに接続できません。ネットワークまたはログイン設定を確認してください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sentEmail) {
    return (
      <div className="login-card">
        <div>
          <p className="eyebrow">Password Reset</p>
          <h1>メールを確認してください</h1>
          <p className="lead">
            {sentEmail} 宛にパスワード再設定リンクを送信しました。
            リンクを開いて新しいパスワードを登録してください。
          </p>
        </div>
        <Link className="secondary-link" href={loginHref}>
          ログイン画面へ戻る
        </Link>
      </div>
    )
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Password Reset</p>
        <h1>パスワード再設定</h1>
        <p className="lead">
          登録済みのメールアドレスを入力してください。
          {destinationLabel} に戻れる再設定リンクを送信します。
        </p>
      </div>

      <label>
        <span>メールアドレス</span>
        <input
          autoComplete="email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="company@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      {error ? <p className="error-message">{error}</p> : null}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? '送信中...' : '再設定メールを送る'}
      </button>

      <Link className="login-helper-link" href={loginHref}>
        ログイン画面へ戻る
      </Link>
    </form>
  )
}
