import client from './client'

export const getFeed = (page = 1, seed, q = '') => client.get(`/feed?page=${page}&seed=${seed}${q ? `&q=${encodeURIComponent(q)}` : ''}`)
export const getMyPosts = () => client.get('/posts/mine')
export const getPost = (uuid) => client.get(`/posts/${uuid}`)
export const createPost = (data) => {
  const form = new FormData()
  if (data.body) form.append('body', data.body)
  if (data.feeling) form.append('feeling', data.feeling)
  if (data.visibility) form.append('visibility', data.visibility)
  ;(data.images ?? []).forEach((file) => form.append('images[]', file))
  return client.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const updatePost = (uuid, data) => {
  const form = new FormData()
  if (data.body) form.append('body', data.body)
  if (data.feeling) form.append('feeling', data.feeling)
  if (data.visibility) form.append('visibility', data.visibility)
  ;(data.keepImages ?? []).forEach((url) => form.append('keep_images[]', url))
  ;(data.newImages ?? []).forEach((file) => form.append('new_images[]', file))
  return client.post(`/posts/${uuid}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const deletePost = (uuid) => client.delete(`/posts/${uuid}`)
export const likePost = (uuid, type = 'like') => client.post(`/posts/${uuid}/like`, { type })
