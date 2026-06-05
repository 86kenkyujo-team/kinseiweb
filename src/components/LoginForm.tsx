'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { initializeSessionLifetime } from '@/lib/auth/sessionLifetime'
import { createClient } from '@/lib/supabase/client'

type LoginFormProps = {
  defaultNextPath?: string
  eyebrow?: string
  forgotPasswordHref?: string
  lead?: string
  submitLabel?: string
  title?: string
}

export function LoginForm({
  defaultNextPath = '/members/students',
  eyebrow = 'Company Member Login',
  forgotPasswordHref = '/password-reset?next=/members/students',
  lead = 'ログイン設定リンクで登録したメールアドレスとパスワードでログインしてください。',
  submitLabel = 'ログイン',
  title = '企業会員ログイン',
}: LoginFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedNextPath = searchParams.get('next')
  const nextPath =
    requestedNextPath?.startsWith('/') && !requestedNextPath.startsWith('//')
      ? requestedNextPath
      : defaultNextPath
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    router.prefetch(nextPath)
  }, [nextPath, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('メールアドレスまたはパスワードが正しくありません。')
        return
      }

      const userId = data.user?.id

      if (userId) {
        initializeSessionLifetime(userId)
      }

      router.replace(nextPath)
    } catch {
      setError('Supabase Authに接続できません。ネットワークまたはログイン設定を確認してください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
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

      <label>
        <span>パスワード</span>
        <input
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="パスワード"
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="error-message">{error}</p> : null}

      <button className={isSubmitting ? 'is-loading' : undefined} disabled={isSubmitting} type="submit">
        <span className="login-button-label">{isSubmitting ? '確認中...' : submitLabel}</span>
      </button>

      <a className="login-helper-link" href={forgotPasswordHref}>
        パスワードを再設定する
      </a>
    </form>
  )
}
