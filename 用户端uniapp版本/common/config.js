const API_PORT = 5000
const API_PREFIX = '/api'

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

function resolveBaseURL() {
	// #ifdef H5
	return getH5DefaultBaseURL()
	// #endif

	// #ifndef H5
	return `http://192.168.3.34:${API_PORT}${API_PREFIX}`
	// #endif
}

const config = {
	baseURL: resolveBaseURL(),
	timeout: REQUEST_TIMEOUT,
	uploadTimeout: UPLOAD_TIMEOUT,
}

export default config
