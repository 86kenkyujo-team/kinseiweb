import type { Metadata } from 'next'
import { AuthSessionManager } from '@/components/AuthSessionManager'
import './globals.css'

export const metadata: Metadata = {
  title: '近世 KINSEI',
  description: '近世 KINSEI 公式サイト',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <AuthSessionManager />
        {children}
      </body>
    </html>
  )
}
