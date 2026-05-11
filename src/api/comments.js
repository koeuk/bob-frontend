import client from './client'

export const createComment = (postUuid, data) => client.post(`/posts/${postUuid}/comments`, data)
export const deleteComment = (uuid) => client.delete(`/comments/${uuid}`)
export const likeComment = (uuid, type = 'like') => client.post(`/comments/${uuid}/like`, { type })
