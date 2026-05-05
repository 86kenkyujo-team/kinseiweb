'use client'

import { useRouter } from 'next/navigation'
import { clearSessionLifetime } from '@/lib/auth/sessionLifetime'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearSessionLifetime()
    router.push('/login')
    router.refresh()
  }

  return (
    <button className="logout-button" onClick={handleLogout} type="button">
      ログアウト
    </button>
  )
}
