import client, { buildFormData, MULTIPART } from './client'

export const register      = (data) => client.post('/auth/register', data)
export const login         = (data) => client.post('/auth/login', data)
export const logout        = ()     => client.post('/auth/logout')
export const getMe         = ()     => client.get('/auth/me')
export const updatePassword = (data) => client.patch('/auth/password', data)
export const deleteAccount = ()     => client.delete('/auth/me')

export const updateMe = (data) => {
  if (data.avatar instanceof File || data.cover instanceof File)
    return client.post('/auth/me', buildFormData(data), MULTIPART)
  return client.patch('/auth/me', data)
}

export const getGoogleAuthUrl = () => {
  const apiOrigin = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')

  return `${apiOrigin}/auth/google/redirect`
}
