import client from './client'

export const sendFriendRequest  = (receiverUuid) => client.post('/friend-requests', { receiver_uuid: receiverUuid })
export const acceptFriendRequest = (id)          => client.post(`/friend-requests/${id}/accept`)
export const declineFriendRequest = (id)         => client.post(`/friend-requests/${id}/decline`)
export const cancelFriendRequest = (id)          => client.delete(`/friend-requests/${id}`)
