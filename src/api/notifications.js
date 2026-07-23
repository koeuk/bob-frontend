import client from './client'

// The endpoint paginates at 20; callers that only need the newest can omit page.
export const getNotifications = (page = 1) => client.get('/notifications', { params: { page } })
export const markRead = (id) => client.post(`/notifications/${id}/read`)
export const markAllRead = () => client.post('/notifications/read-all')
