import client from './client'

export const getConversations = () => client.get('/conversations')
export const getUnreadCount = () => client.get('/conversations/unread')
export const findOrCreateConversation = (userUuid) => client.post('/conversations', { user_uuid: userUuid })
export const getMessages = (convUuid) => client.get(`/conversations/${convUuid}/messages`)
export const sendMessage = (convUuid, body) => client.post(`/conversations/${convUuid}/messages`, { body })
