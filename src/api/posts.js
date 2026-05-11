import client from './client'

export const getFeed = (page = 1) => client.get(`/feed?page=${page}`)
export const getMyPosts = (page = 1) => client.get(`/posts/mine?page=${page}`)
export const getPost = (uuid) => client.get(`/posts/${uuid}`)
export const createPost = (data) => client.post('/posts', data)
export const deletePost = (uuid) => client.delete(`/posts/${uuid}`)
export const likePost = (uuid, type = 'like') => client.post(`/posts/${uuid}/like`, { type })
