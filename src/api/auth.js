import client from './client'

export const register = (data) => client.post('/auth/register', data)
export const login = (data) => client.post('/auth/login', data)
export const logout = () => client.post('/auth/logout')
export const getMe = () => client.get('/auth/me')
export const updateMe = (data) => {
  if (data.avatar instanceof File) {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) form.append(k, v) })
    return client.post('/auth/me', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  }
  return client.patch('/auth/me', data)
}
export const updatePassword = (data) => client.patch('/auth/password', data)
export const deleteAccount = () => client.delete('/auth/me')
