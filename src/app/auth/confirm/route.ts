import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const allowedOtpTypes = new Set<EmailOtpType>(['invite', 'recovery'])

function getSafeNextPath(requestedNextPath: string | null) {
  return requestedNextPath?.startsWith('/') && !requestedNextPath.startsWith('//')
    ? requestedNextPath
    : '/members/students'
}

function getPasswordUpdateUrl(request: NextRequest, nextPath: string, status?: string) {
  const url = new URL('/password-update', request.url)
  url.searchParams.set('next', nextPath)

  if (status) {
    url.searchParams.set('status', status)
  }

  return url
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'))

  if (!tokenHash || !type || !allowedOtpTypes.has(type)) {
    return NextResponse.redirect(getPasswordUpdateUrl(request, nextPath, 'invalid_link'))
  }

  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.redirect(getPasswordUpdateUrl(request, nextPath, 'setup_required'))
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (error) {
    return NextResponse.redirect(getPasswordUpdateUrl(request, nextPath, 'invalid_link'))
  }

  return NextResponse.redirect(getPasswordUpdateUrl(request, nextPath))
}
