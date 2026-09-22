export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  expiresAt: string
}

export interface MeResponse {
  id: string
  username: string
  email: string | null
}

export interface ValidationProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}
