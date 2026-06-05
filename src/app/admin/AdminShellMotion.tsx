'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function AdminShellMotion() {
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    setIsChanging(true)
    const timerId = window.setTimeout(() => {
      setIsChanging(false)
    }, 260)

    return () => {
      window.clearTimeout(timerId)
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
