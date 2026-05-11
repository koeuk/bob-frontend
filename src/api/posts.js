import client from './client'

export const getFeed = (page = 1) => client.get(`/feed?page=${page}`)
export const getMyPosts = (page = 1) => client.get(`/posts/mine?page=${page}`)
export const getPost = (uuid) => client.get(`/posts/${uuid}`)
export const createPost = (data) => {
  const form = new FormData()
  form.append('body', data.body)
  if (data.image) form.append('image', data.image)
  if (data.feeling) form.append('feeling', data.feeling)
  return client.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const deletePost = (uuid) => client.delete(`/posts/${uuid}`)
export const likePost = (uuid, type = 'like') => client.post(`/posts/${uuid}/like`, { type })
