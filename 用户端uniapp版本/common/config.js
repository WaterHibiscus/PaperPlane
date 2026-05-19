const API_PORT = 5000
const API_PREFIX = '/api'
const API_BASE_URL_STORAGE_KEY = 'paperplane_api_base_url'
const DEFAULT_NON_H5_HOST = '172.0.0.1'

const REQUEST_TIMEOUT = 10000
const UPLOAD_TIMEOUT = 300000

function getH5DefaultBaseURL() {
	if (typeof window === 'undefined' || !window.location) {
		return `http://localhost:${API_PORT}${API_PREFIX}`
	}
	const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
	const hostname = window.location.hostname || 'localhost'
	return `${protocol}//${hostname}:${API_PORT}${API_PREFIX}`
}

function normalizeConfiguredBaseURL(value) {
	const normalized = String(value || '').trim().replace(/\/+$/, '')
	if (!normalized) return ''
	if (/^https?:\/\//i.test(normalized)) {
		return normalized.endsWith(API_PREFIX) ? normalized : `${normalized}${API_PREFIX}`
	}
	return ''
}

function getStoredBaseURL() {
	if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') {
		return ''
	}
	return normalizeConfiguredBaseURL(uni.getStorageSync(API_BASE_URL_STORAGE_KEY))
}

function resolveBaseURL() {
	// #ifdef H5
	return getH5DefaultBaseURL()
	// #endif

	// #ifndef H5
	return getStoredBaseURL() || `http://${DEFAULT_NON_H5_HOST}:${API_PORT}${API_PREFIX}`
	// #endif
}

const config = {
	baseURL: resolveBaseURL(),
	timeout: REQUEST_TIMEOUT,
	uploadTimeout: UPLOAD_TIMEOUT,
}

export default config
