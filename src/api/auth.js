import client from './client'

export const register = (data) => client.post('/auth/register', data)
export const login = (data) => client.post('/auth/login', data)
export const logout = () => client.post('/auth/logout')
export const getMe = () => client.get('/auth/me')
export const updateMe = (data) => client.patch('/auth/me', data)
export const updatePassword = (data) => client.patch('/auth/password', data)
export const deleteAccount = () => client.delete('/auth/me')
