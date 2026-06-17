import client from './client'

export const REPORTABLE_TYPES = {
  post:    'App\\Models\\Post',
  comment: 'App\\Models\\Comment',
  user:    'App\\Models\\User',
}

export const getAdminReports = ({ status, type, page = 1, perPage = 25 } = {}) =>
  client.get('/admin/reports', {
    params: {
      page,
      per_page: perPage,
      sort: '-created_at',
      ...(status && { 'filter[status]': status }),
      ...(type   && { 'filter[type]': REPORTABLE_TYPES[type] ?? type }),
    },
  })

export const getAdminReport = (uuid)              => client.get(`/admin/reports/${uuid}`)
export const reviewReport   = (uuid)              => client.post(`/admin/reports/${uuid}/review`)
export const resolveReport  = (uuid, note)        => client.post(`/admin/reports/${uuid}/resolve`, { resolution_note: note })
export const dismissReport  = (uuid, note)        => client.post(`/admin/reports/${uuid}/dismiss`, { resolution_note: note })

export const getAdminUsers = ({ search, role, banned, page = 1, perPage = 25 } = {}) =>
  client.get('/admin/users', {
    params: {
      page,
      per_page: perPage,
      sort: '-created_at',
      ...(search && { 'filter[search]': search }),
      ...(role   && { 'filter[role]': role }),
      ...(banned && { 'filter[banned]': 1 }),
    },
  })

export const banUser    = (uuid, { reason, expires_at } = {}) =>
  client.post(`/admin/users/${uuid}/ban`, { reason, expires_at: expires_at || null })
export const unbanUser  = (uuid)         => client.post(`/admin/users/${uuid}/unban`)
export const assignRole = (uuid, role)   => client.post(`/admin/users/${uuid}/role`, { role })
