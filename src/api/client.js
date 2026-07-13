import axios from 'axios'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

const client = axios.create({
  baseURL: `${API_ORIGIN}/api`,
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
      // Reset in-memory auth state too, not just localStorage, so the app never
      // sits in an "authenticated" state with no token if the redirect is
      // delayed or suppressed by a caller. Imported lazily to avoid a cycle.
      import('../store/authStore').then((m) => m.default.getState().logout?.())
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
