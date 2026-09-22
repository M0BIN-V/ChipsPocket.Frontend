const ACCESS_TOKEN_KEY = 'chipspocket.accessToken'
const EXPIRES_AT_KEY = 'chipspocket.expiresAt'

export const authStorage = {
  getAccessToken(): string | null {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)
    const expirationTime = expiresAt ? Date.parse(expiresAt) : Number.NaN

    if (!accessToken || !expiresAt || Number.isNaN(expirationTime) || expirationTime <= Date.now()) {
      if (accessToken || expiresAt) this.clear()
      return null
    }

    return accessToken
  },
  set(accessToken: string, expiresAt: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(EXPIRES_AT_KEY, expiresAt)
  },
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
  },
}
