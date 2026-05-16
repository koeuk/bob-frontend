import client from './client'

export const getConversations = () => client.get('/conversations')
export const getUnreadCount = () => client.get('/conversations/unread')
export const findOrCreateConversation = (userUuid) => client.post('/conversations', { user_uuid: userUuid })
export const getMessages = (convUuid) => client.get(`/conversations/${convUuid}/messages`)
export const sendMessage = (convUuid, body, images = []) => {
  const form = new FormData()
  if (body) form.append('body', body)
  images.forEach(img => form.append('images[]', img))
  return client.post(`/conversations/${convUuid}/messages`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
