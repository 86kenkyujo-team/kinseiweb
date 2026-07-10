import type { Metadata } from 'next'
import { AuthSessionManager } from '@/components/AuthSessionManager'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kinsei-inc.com'),
  verification: {
    google: 'wIUM2xr9X1XNtKbgpjje-siH7ghWVqdwT_x0t3SQju0',
  },
  title: {
    default: '近世 KINSEI',
    template: '%s | 近世 KINSEI',
  },
  description:
    'KINSEIは、学生の挑戦と実績を可視化し、企業との最適な出会いをつくるキャリアプラットフォームです。',
  openGraph: {
    siteName: 'KINSEI',
    locale: 'ja_JP',
    type: 'website',
    images: ['/assets/images/hero-people-0518.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/assets/images/hero-people-0518.png'],
  },
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
