'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { initializeSessionLifetime } from '@/lib/auth/sessionLifetime'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedNextPath = searchParams.get('next')
  const nextPath =
    requestedNextPath?.startsWith('/') && !requestedNextPath.startsWith('//')
      ? requestedNextPath
      : '/members/students'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setError('ログイン設定がまだ完了していません。運営側の設定を確認してください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Company Member Login</p>
        <h1>企業会員ログイン</h1>
        <p className="lead">
          招待メールで設定したメールアドレスとパスワードでログインしてください。
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

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? '確認中...' : 'ログイン'}
      </button>
    </form>
  )
}
