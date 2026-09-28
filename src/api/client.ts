import axios from 'axios'
import { authStorage } from './authStorage'

export const API_URL = import.meta.env.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = authStorage.getAccessToken()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) authStorage.clear()
    return Promise.reject(error)
  },
)
