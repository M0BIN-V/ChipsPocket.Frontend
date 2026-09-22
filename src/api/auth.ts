import { apiClient } from './client'
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '../features/auth/auth.types'

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', request)
  return response.data
}

export async function register(request: RegisterRequest): Promise<void> {
  await apiClient.post('/api/auth/register', request)
}

export async function getMe(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>('/api/auth/me')
  return response.data
}
