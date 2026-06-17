import axios from 'axios'

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/api`,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('token')
      localStorage.removeItem('token')
      if (hadToken) window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }

export const buildFormData = (data) => {
  const form = new FormData()
  for (const [key, val] of Object.entries(data)) {
    if (val == null) continue
    if (Array.isArray(val)) val.forEach((v) => form.append(`${key}[]`, v))
    else form.append(key, val)
  }
  return form
}

export default client
