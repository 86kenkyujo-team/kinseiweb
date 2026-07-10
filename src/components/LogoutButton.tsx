'use client'

import { useRouter } from 'next/navigation'
import { clearSessionLifetime } from '@/lib/auth/sessionLifetime'
import { createClient } from '@/lib/supabase/client'

type LogoutButtonProps = {
  redirectTo?: string
}

export function LogoutButton({ redirectTo = '/login' }: LogoutButtonProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearSessionLifetime()
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <button className="logout-button" onClick={handleLogout} type="button">
      ログアウト
    </button>
  )
}
