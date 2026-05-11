import client from './client'

export const getUser = (uuid) => client.get(`/users/${uuid}`)
