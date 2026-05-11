import client from './client'

export const getNotifications = () => client.get('/notifications')
export const markRead = (id) => client.post(`/notifications/${id}/read`)
export const markAllRead = () => client.post('/notifications/read-all')
