import client from './client'

export const getMyReports = (page = 1) => client.get(`/reports/mine?page=${page}`)
export const createReport = (data) => client.post('/reports', data)
