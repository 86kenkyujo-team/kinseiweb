'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { initializeSessionLifetime } from '@/lib/auth/sessionLifetime'
import { createClient } from '@/lib/supabase/client'

function getSafeNextPath(requestedNextPath: string | null) {
  return requestedNextPath?.startsWith('/') && !requestedNextPath.startsWith('//')
    ? requestedNextPath
    : '/members/students'
}

export function PasswordUpdateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get('next'))
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkRecoverySession() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        if (!data.session) {
          setError('再設定リンクが無効、または有効期限切れです。もう一度メールを送信してください。')
          return
        }

        setIsReady(true)
      } catch {
        if (isMounted) {
          setError('Supabase Authに接続できません。ネットワークまたはログイン設定を確認してください。')
        }
      }
    }

    checkRecoverySession()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください。')
      return
    }

    if (password !== passwordConfirmation) {
      setError('確認用パスワードが一致しません。')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError('パスワードを更新できませんでした。別のパスワードで再度お試しください。')
        return
      }

      if (data.user?.id) {
        initializeSessionLifetime(data.user.id)
      }

      router.replace(nextPath)
    } catch {
      setError('パスワードを更新できませんでした。時間をおいて再度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">New Password</p>
        <h1>新しいパスワード</h1>
        <p className="lead">今後ログインに使うパスワードを設定してください。</p>
      </div>

      <label>
        <span>新しいパスワード</span>
        <input
          autoComplete="new-password"
          disabled={!isReady || isSubmitting}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="8文字以上"
          required
          type="password"
          value={password}
        />
      </label>

      <label>
        <span>新しいパスワード（確認）</span>
        <input
          autoComplete="new-password"
          disabled={!isReady || isSubmitting}
          minLength={8}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          placeholder="もう一度入力"
          required
          type="password"
          value={passwordConfirmation}
        />
      </label>

      {error ? <p className="error-message">{error}</p> : null}

      <button disabled={!isReady || isSubmitting} type="submit">
        {isSubmitting ? '更新中...' : 'パスワードを更新する'}
      </button>
    </form>
  )
}
