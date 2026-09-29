const configuredVersion = import.meta.env.VITE_APP_VERSION?.trim()

export const frontendVersion = configuredVersion || 'dev'