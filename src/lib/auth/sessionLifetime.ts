export const SESSION_INACTIVITY_LIMIT_MS = 60 * 60 * 1000
export const SESSION_MAX_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

const SESSION_LIFETIME_KEY = 'kinsei.auth.sessionLifetime'

type SessionLifetime = {
  lastActivityAt: number
  loginAt: number
  userId: string
}

function readSessionLifetime(): SessionLifetime | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedValue = window.localStorage.getItem(SESSION_LIFETIME_KEY)

  if (!storedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue) as SessionLifetime

    if (
      typeof parsedValue.userId !== 'string' ||
      typeof parsedValue.loginAt !== 'number' ||
      typeof parsedValue.lastActivityAt !== 'number'
    ) {
      return null
    }

    return parsedValue
  } catch {
    return null
  }
}

function writeSessionLifetime(sessionLifetime: SessionLifetime) {
  window.localStorage.setItem(SESSION_LIFETIME_KEY, JSON.stringify(sessionLifetime))
}

export function clearSessionLifetime() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(SESSION_LIFETIME_KEY)
}

export function initializeSessionLifetime(userId: string, now = Date.now()) {
  if (typeof window === 'undefined') {
    return
  }

  const currentValue = readSessionLifetime()

  writeSessionLifetime({
    lastActivityAt: now,
    loginAt: currentValue?.userId === userId ? currentValue.loginAt : now,
    userId,
  })
}

export function markSessionActivity(userId: string, now = Date.now()) {
  if (typeof window === 'undefined') {
    return
  }

  const currentValue = readSessionLifetime()

  writeSessionLifetime({
    lastActivityAt: now,
    loginAt: currentValue?.userId === userId ? currentValue.loginAt : now,
    userId,
  })
}

export function getSessionExpirationReason(userId: string, now = Date.now()) {
  const currentValue = readSessionLifetime()

  if (!currentValue || currentValue.userId !== userId) {
    initializeSessionLifetime(userId, now)
    return null
  }

  if (now - currentValue.loginAt >= SESSION_MAX_LIFETIME_MS) {
    return 'max_lifetime'
  }

  if (now - currentValue.lastActivityAt >= SESSION_INACTIVITY_LIMIT_MS) {
    return 'inactivity'
  }

  return null
}
