'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function AdminShellMotion() {
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    const startTimerId = window.setTimeout(() => {
      setIsChanging(true)
    }, 0)
    const endTimerId = window.setTimeout(() => {
      setIsChanging(false)
    }, 260)

    return () => {
      window.clearTimeout(startTimerId)
      window.clearTimeout(endTimerId)
    }
  }, [pathname])

  useEffect(() => {
    if (isChanging) {
      document.documentElement.dataset.adminNavigating = 'true'
      return
    }

    delete document.documentElement.dataset.adminNavigating
  }, [isChanging])

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.adminNavigating
    }
  }, [])

  return <div aria-hidden="true" className={`admin-route-progress${isChanging ? ' active' : ''}`} />
}
