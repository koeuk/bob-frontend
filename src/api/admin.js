import client from './client'

// Dashboard
export const getAdminDashboard = () => client.get('/admin/dashboard')

// Users
export const getAdminUsers = (params) => client.get('/admin/users', { params })
export const getAdminUser = (uuid) => client.get(`/admin/users/${uuid}`)
export const createAdminUser = (data) => client.post('/admin/users', data)
export const updateAdminUser = (uuid, data) => client.patch(`/admin/users/${uuid}`, data)
export const deleteAdminUser = (uuid) => client.delete(`/admin/users/${uuid}`)
export const banUser = (uuid, data) => client.post(`/admin/users/${uuid}/ban`, data)
export const unbanUser = (uuid) => client.post(`/admin/users/${uuid}/unban`)
export const assignRole = (uuid, role) => client.post(`/admin/users/${uuid}/role`, { role })

// Posts
export const getAdminPosts = (params) => client.get('/admin/posts', { params })
export const getAdminPost = (uuid) => client.get(`/admin/posts/${uuid}`)
export const updateAdminPost = (uuid, data) => client.patch(`/admin/posts/${uuid}`, data)
export const deleteAdminPost = (uuid) => client.delete(`/admin/posts/${uuid}`)
export const flagAdminPost = (uuid, data) => client.patch(`/admin/posts/${uuid}/flag`, data)

// Comments
export const getAdminComments = (params) => client.get('/admin/comments', { params })
export const updateAdminComment = (uuid, data) => client.patch(`/admin/comments/${uuid}`, data)
export const deleteAdminComment = (uuid) => client.delete(`/admin/comments/${uuid}`)

// Reports
export const getAdminReports = (params) => client.get('/admin/reports', { params })
export const getAdminReport = (uuid) => client.get(`/admin/reports/${uuid}`)
export const reviewReport = (uuid) => client.post(`/admin/reports/${uuid}/review`)
export const resolveReport = (uuid, data) => client.post(`/admin/reports/${uuid}/resolve`, data)
export const dismissReport = (uuid, data) => client.post(`/admin/reports/${uuid}/dismiss`, data)

// Bans
export const getAdminBans = (params) => client.get('/admin/bans', { params })
export const createBan = (data) => client.post('/admin/bans', data)
export const deleteBan = (uuid) => client.delete(`/admin/bans/${uuid}`)

// Pages
export const getAdminPages = (params) => client.get('/admin/pages', { params })
export const createAdminPage = (data) => client.post('/admin/pages', data)
export const updateAdminPage = (uuid, data) => client.patch(`/admin/pages/${uuid}`, data)
export const deleteAdminPage = (uuid) => client.delete(`/admin/pages/${uuid}`)

// Settings
export const getAdminSettings = () => client.get('/admin/settings')
export const updateAdminSettings = (data) => client.patch('/admin/settings', data)

// Activity Logs
export const getActivityLogs = (params) => client.get('/admin/activity-logs', { params })
