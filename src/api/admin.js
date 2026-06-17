import client from './client'

// Morph class names the backend uses for the `filter[type]` param / reportable_type
export const REPORTABLE_TYPES = {
  post: 'App\\Models\\Post',
  comment: 'App\\Models\\Comment',
  user: 'App\\Models\\User',
}

// ── Reports moderation ──
export const getAdminReports = ({ status, type, page = 1, perPage = 25 } = {}) => {
  const params = { page, per_page: perPage, sort: '-created_at' }
  if (status) params['filter[status]'] = status
  if (type) params['filter[type]'] = REPORTABLE_TYPES[type] ?? type
  return client.get('/admin/reports', { params })
}
export const getAdminReport = (uuid) => client.get(`/admin/reports/${uuid}`)
export const reviewReport = (uuid) => client.post(`/admin/reports/${uuid}/review`)
export const resolveReport = (uuid, resolution_note) =>
  client.post(`/admin/reports/${uuid}/resolve`, { resolution_note })
export const dismissReport = (uuid, resolution_note) =>
  client.post(`/admin/reports/${uuid}/dismiss`, { resolution_note })

// ── Users management ──
export const getAdminUsers = ({ search, role, banned, page = 1, perPage = 25 } = {}) => {
  const params = { page, per_page: perPage, sort: '-created_at' }
  if (search) params['filter[search]'] = search
  if (role) params['filter[role]'] = role
  if (banned) params['filter[banned]'] = 1
  return client.get('/admin/users', { params })
}
export const banUser = (uuid, { reason, expires_at } = {}) =>
  client.post(`/admin/users/${uuid}/ban`, { reason, expires_at: expires_at || null })
export const unbanUser = (uuid) => client.post(`/admin/users/${uuid}/unban`)
export const assignRole = (uuid, role) => client.post(`/admin/users/${uuid}/role`, { role })
