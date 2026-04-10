import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
})

// Locations
export const getLocations = () => api.get('/locations')

// Planes
export const throwPlane = (data) => api.post('/planes', data)
export const getPlanes = (location) => api.get('/planes', { params: { location } })
export const getPlaneDetail = (id) => api.get(`/planes/${id}`)
export const likePlane = (id) => api.post(`/planes/${id}/like`)
export const reportPlane = (id) => api.post(`/planes/${id}/report`)
export const getRandomPlane = () => api.get('/planes/random')
export const getTrendingPlanes = () => api.get('/planes/trending')
export const getMyPlanes = (ids) => api.post('/planes/mine', { ids })

// Comments
export const getComments = (planeId) => api.get(`/planes/${planeId}/comments`)
export const addComment = (planeId, reply) => api.post(`/planes/${planeId}/comments`, { reply })

export default api
