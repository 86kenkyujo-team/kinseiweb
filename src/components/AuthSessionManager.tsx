'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowserEnv } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/client'
import {
  clearSessionLifetime,
  getSessionExpirationReason,
  initializeSessionLifetime,
  markSessionActivity,
} from '@/lib/auth/sessionLifetime'

const ACTIVITY_THROTTLE_MS = 60 * 1000
const SESSION_CHECK_INTERVAL_MS = 60 * 1000
const ACTIVITY_EVENTS = ['click', 'keydown', 'pointerdown', 'scroll', 'touchstart'] as const

export function AuthSessionManager() {
  const pathname = usePathname()
  const router = useRouter()
  const isSigningOutRef = useRef(false)
  const lastActivityWriteRef = useRef(0)

  useEffect(() => {
    if (!getSupabaseBrowserEnv().isConfigured) {
      return
    }

    const supabase = createClient()

    async function signOutExpiredSession() {
      if (isSigningOutRef.current) {
        return
      }

      isSigningOutRef.current = true
      clearSessionLifetime()
      await supabase.auth.signOut()

      if (pathname?.startsWith('/members')) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      } else {
        router.refresh()
      }
    }

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user.id

      if (!userId) {
        clearSessionLifetime()
        return
      }

      const expirationReason = getSessionExpirationReason(userId)

      if (expirationReason) {
        await signOutExpiredSession()
      }
    }

    async function recordActivity() {
      const now = Date.now()

      if (now - lastActivityWriteRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }

      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user.id

      if (!userId) {
        clearSessionLifetime()
        return
      }

      const expirationReason = getSessionExpirationReason(userId, now)

      if (expirationReason) {
        await signOutExpiredSession()
        return
      }

      lastActivityWriteRef.current = now
      markSessionActivity(userId, now)
    }

    checkSession()

    const intervalId = window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS)

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearSessionLifetime()
        return
      }

      if (session?.user.id && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        initializeSessionLifetime(session.user.id)
      }
    })

    return () => {
      window.clearInterval(intervalId)
      subscription.unsubscribe()

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity)
      })
    }
  }, [pathname, router])

  return null
}
