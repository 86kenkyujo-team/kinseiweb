'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type AdminNavLinkProps = {
  href: string
  label: string
}

export function AdminNavLink({ href, label }: AdminNavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))

  return (
    <Link aria-current={isActive ? 'page' : undefined} href={href}>
      {label}
    </Link>
  )
}
