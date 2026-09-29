import { apiClient } from './client'

interface BackendVersionResponse {
  version: string
}

let backendVersionRequest: Promise<string> | null = null

export function getBackendVersion(): Promise<string> {
  if (!backendVersionRequest) {
    backendVersionRequest = apiClient.get<BackendVersionResponse>('/api/version').then((response) => {
      const version = response.data.version.trim()
      if (!version) throw new Error('Backend version is empty.')
      return version
    })
  }

  return backendVersionRequest
}