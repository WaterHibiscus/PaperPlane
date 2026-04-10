import config from './config.js'
import {
	clearAuthSession,
	getAccessToken,
	getAuthSession,
	getRefreshToken,
	setAuthSession,
} from './storage.js'

let refreshPromise = null
const COMPRESS_THRESHOLD = 2 * 1024 * 1024
const COMPRESS_QUALITY = 65

function buildError(message, response) {
	const error = new Error(message || 'Request failed')
	error.response = response || null
	return error
}

function getLocalFileSize(filePath) {
	return new Promise(resolve => {
		if (!filePath || typeof uni === 'undefined' || typeof uni.getFileInfo !== 'function') {
			resolve(null)
			return
		}
		uni.getFileInfo({
			filePath,
			success: res => {
				resolve(Number(res?.size || 0))
			},
			fail: () => {
				resolve(null)
			},
		})
	})
}

function compressImageOnce(filePath, quality = COMPRESS_QUALITY) {
	return new Promise(resolve => {
		if (!filePath || typeof uni === 'undefined' || typeof uni.compressImage !== 'function') {
			resolve(filePath)
			return
		}
		uni.compressImage({
			src: filePath,
			quality,
			success: res => {
				resolve(res?.tempFilePath || filePath)
			},
			fail: () => {
				resolve(filePath)
			},
		})
	})
}

async function prepareImageForUpload(filePath) {
	const size = await getLocalFileSize(filePath)
	if (typeof size !== 'number' || size <= 0 || size < COMPRESS_THRESHOLD) {
		return filePath
	}

	const compressedPath = await compressImageOnce(filePath, COMPRESS_QUALITY)
	if (!compressedPath || compressedPath === filePath) {
		return filePath
	}

	const compressedSize = await getLocalFileSize(compressedPath)
	if (typeof compressedSize !== 'number' || compressedSize <= 0) {
		return filePath
	}

	return compressedSize < size ? compressedPath : filePath
}

function toErrorMessage(payload, fallback = 'Request failed') {
	if (payload && typeof payload === 'object' && payload.message) {
		return payload.message
	}
	return fallback
}

function isUnauthorized(error) {
	return Number(error?.response?.statusCode || 0) === 401
}

function getAuthHeaders() {
	const token = getAccessToken()
	if (!token) return {}
	return {
		Authorization: `Bearer ${token}`,
	}
}

function rawRequest({ url, method = 'GET', data, headers = {} }) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${config.baseURL}${url}`,
			method,
			data,
			header: headers,
			timeout: config.timeout,
			success: res => {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					resolve(res.data)
					return
				}
				reject(buildError(toErrorMessage(res.data), res))
			},
			fail: err => {
				reject(buildError(err.errMsg || 'Network error', err))
			},
		})
	})
}

function persistRefreshedSession(payload) {
	const current = getAuthSession() || {}
	setAuthSession({
		...current,
		accessToken: payload?.accessToken || '',
		refreshToken: payload?.refreshToken || '',
		expiresIn: Number(payload?.expiresIn || 0),
		user: payload?.user || current.user || null,
		loginAt: current.loginAt || new Date().toISOString(),
	})
}

async function tryRefreshToken() {
	const refreshToken = getRefreshToken()
	if (!refreshToken) return false

	if (!refreshPromise) {
		refreshPromise = (async () => {
			try {
				const payload = await rawRequest({
					url: '/user-auth/refresh-token',
					method: 'POST',
					data: { refreshToken },
					headers: {},
				})
				persistRefreshedSession(payload)
				return true
			} catch (error) {
				clearAuthSession()
				return false
			} finally {
				refreshPromise = null
			}
		})()
	}

	return refreshPromise
}

async function request({ url, method = 'GET', data, retryOnAuth = true, attachAuth = true }) {
	const headers = attachAuth ? getAuthHeaders() : {}
	try {
		return await rawRequest({ url, method, data, headers })
	} catch (error) {
		if (retryOnAuth && attachAuth && isUnauthorized(error)) {
			const refreshed = await tryRefreshToken()
			if (refreshed) {
				return request({
					url,
					method,
					data,
					retryOnAuth: false,
					attachAuth,
				})
			}

			if (!getAccessToken()) {
				throw buildError('Please login first', error.response || error)
			}
			throw buildError('Session expired, please login again', error.response || error)
		}
		throw error
	}
}

function rawUploadFile({ url, filePath, name = 'file', headers = {} }) {
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: `${config.baseURL}${url}`,
			filePath,
			name,
			header: headers,
			timeout: config.uploadTimeout || config.timeout,
			success: res => {
				let payload = {}
				try {
					payload = JSON.parse(res.data || '{}')
				} catch (error) {
					// keep payload as empty object
				}

				if (res.statusCode >= 200 && res.statusCode < 300) {
					resolve(payload)
					return
				}
				reject(buildError(toErrorMessage(payload, 'Upload failed'), { ...res, data: payload }))
			},
			fail: err => {
				const errMsg = err?.errMsg || 'Upload failed'
				if (/timeout/i.test(errMsg)) {
					reject(buildError('上传超时，请检查网络后重试，或压缩图片后再上传', err))
					return
				}
				reject(buildError(errMsg, err))
			},
		})
	})
}

async function uploadFile({ url, filePath, name = 'file', retryOnAuth = true, attachAuth = true }) {
	const headers = attachAuth ? getAuthHeaders() : {}
	try {
		return await rawUploadFile({ url, filePath, name, headers })
	} catch (error) {
		if (retryOnAuth && attachAuth && isUnauthorized(error)) {
			const refreshed = await tryRefreshToken()
			if (refreshed) {
				return uploadFile({
					url,
					filePath,
					name,
					retryOnAuth: false,
					attachAuth,
				})
			}
			if (!getAccessToken()) {
				throw buildError('Please login first', error.response || error)
			}
			throw buildError('Session expired, please login again', error.response || error)
		}
		throw error
	}
}

function toQueryString(params = {}) {
	const pairs = Object.entries(params)
		.filter(([, value]) => value !== undefined && value !== null && value !== '')
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
	if (!pairs.length) return ''
	return `?${pairs.join('&')}`
}

function getAssetBaseUrl() {
	return config.baseURL.replace(/\/api$/, '')
}

export function getAssetUrl(path) {
	if (!path) return ''
	if (/^(https?:)?\/\//.test(path) || /^data:/.test(path) || /^blob:/.test(path)) {
		return path
	}
	if (/^[a-zA-Z]:\\/.test(path)) {
		return path
	}
	if (path.startsWith('/static/')) {
		return path
	}
	if (path.startsWith('/')) {
		return `${getAssetBaseUrl()}${path}`
	}
	return `${getAssetBaseUrl()}/${path}`
}

export function getLocations() {
	return request({ url: '/locations' })
}

export function throwPlane(data) {
	return request({ url: '/planes', method: 'POST', data })
}

export async function uploadPlaneImage(filePath, options = {}) {
	const uploadPath = await prepareImageForUpload(filePath)
	const data = await uploadFile({
		url: '/uploads/images',
		filePath: uploadPath,
		name: 'file',
	})
	return data.url
}

export function getPlanes(location) {
	return request({ url: '/planes', data: { location } })
}

export function getPlaneDetail(id) {
	return request({ url: `/planes/${id}` })
}

export function likePlane(id) {
	return request({ url: `/planes/${id}/like`, method: 'POST' })
}

export function reportPlane(id) {
	return request({ url: `/planes/${id}/report`, method: 'POST' })
}

export function recallPlane(id) {
	return request({ url: `/planes/${id}/recall`, method: 'POST' })
}

export function destroyPlane(id) {
	return request({ url: `/planes/${id}/destroy`, method: 'POST' })
}

export function getPlaneAttitudes(id, voterKey) {
	return request({ url: `/planes/${id}/attitudes`, data: { voterKey } })
}

export function votePlaneAttitude(id, optionKey, voterKey) {
	return request({ url: `/planes/${id}/attitudes`, method: 'POST', data: { optionKey, voterKey } })
}

export function getRandomPlane() {
	return request({ url: '/planes/random' })
}

export async function getHomeHeadlinePhrases() {
	const data = await request({ url: '/home/headlines' })
	if (Array.isArray(data)) return data
	if (Array.isArray(data?.phrases)) return data.phrases
	return []
}

export function getTrendingPlanes() {
	return request({ url: '/planes/trending' })
}

export function getMyPlanes(ids) {
	return request({ url: '/planes/mine', method: 'POST', data: { ids } })
}

export function getComments(planeId) {
	return request({ url: `/planes/${planeId}/comments` })
}

export function addComment(planeId, payload) {
	const data = typeof payload === 'string'
		? { reply: payload }
		: payload
	return request({ url: `/planes/${planeId}/comments`, method: 'POST', data })
}

export function getMyThrownPlanes(params = {}) {
	return request({
		url: `/planes/mine/thrown${toQueryString(params)}`,
	})
}

export function getMyFueledPlanes(params = {}) {
	return request({
		url: `/planes/mine/fueled${toQueryString(params)}`,
	})
}

export function getMyPickedPlanes(params = {}) {
	return request({
		url: `/planes/mine/picked${toQueryString(params)}`,
	})
}

export function getMyProfile() {
	return request({
		url: '/users/me/profile',
	})
}

export function updateMyProfile(data) {
	return request({
		url: '/users/me/profile',
		method: 'PUT',
		data,
	})
}

export async function uploadMyAvatar(filePath, options = {}) {
	const uploadPath = await prepareImageForUpload(filePath)
	const data = await uploadFile({
		url: '/users/me/avatar',
		filePath: uploadPath,
		name: 'file',
	})
	return data.url
}
