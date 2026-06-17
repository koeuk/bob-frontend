import client, { buildFormData, MULTIPART } from './client'

export const getFeed = (page = 1, seed, q = '') =>
  client.get('/feed', { params: { page, ...(seed != null && { seed }), ...(q && { q }) } })

export const getMyPosts = () => client.get('/posts/mine')
export const getPost = (uuid) => client.get(`/posts/${uuid}`)

export const createPost = (data) =>
  client.post('/posts', buildFormData({
    ...(data.body      && { body: data.body }),
    ...(data.feeling   && { feeling: data.feeling }),
    ...(data.visibility && { visibility: data.visibility }),
    ...(data.shared_post_id && { shared_post_id: data.shared_post_id }),
    images: data.images ?? [],
  }), MULTIPART)

export const updatePost = (uuid, data) =>
  client.post(`/posts/${uuid}`, buildFormData({
    ...(data.body      && { body: data.body }),
    ...(data.feeling   && { feeling: data.feeling }),
    ...(data.visibility && { visibility: data.visibility }),
    keep_images: data.keepImages ?? [],
    new_images:  data.newImages  ?? [],
  }), MULTIPART)

export const deletePost = (uuid) => client.delete(`/posts/${uuid}`)
export const likePost = (uuid, type = 'like') => client.post(`/posts/${uuid}/like`, { type })
