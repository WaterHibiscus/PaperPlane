import config from './config.js'
import { setProfileAvatar, setProfileBio, setProfileGender, setProfileName } from './app-state.js'
import {
	clearAuthSession,
	getAccessToken,
	getAuthSession,
	getRefreshToken,
	setAuthSession,
	setAuthSessionUser,
} from './storage.js'

function normalizeText(value) {
	return String(value || '').trim()
}

function normalizePhone(value) {
	return normalizeText(value).replace(/\s+/g, '')
}

function normalizeStudentId(value) {
	return normalizeText(value).replace(/\s+/g, '').toUpperCase()
}

function buildError(message, response) {
	const error = new Error(message || '请求失败')
	error.response = response || null
	return error
}

function request({ url, method = 'GET', data, token = '' }) {
	const headers = {}
	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	return new Promise((resolve, reject) => {
		uni.request({
			url: `${config.baseURL}${url}`,
			method,
			data,
			timeout: config.timeout,
			header: headers,
			success: res => {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					resolve(res.data)
					return
				}
				reject(buildError(res.data?.message || '请求失败', res))
			},
			fail: err => {
				reject(buildError(err.errMsg || '网络异常', err))
			},
		})
	})
}

function normalizeUser(user) {
	if (!user) return null
	return {
		userId: user.userId || user.id || '',
		username: normalizeText(user.username) || '纸飞机同学',
		avatarUrl: user.avatarUrl || '',
		gender: user.gender || 'secret',
		bio: user.bio || '',
		phone: user.phone || '',
		studentId: user.studentId || '',
	}
}

function applyUserProfile(user) {
	if (!user) return
	setProfileName(user.username)
	setProfileAvatar(user.avatarUrl || '')
	setProfileGender(user.gender || 'secret')
	setProfileBio(user.bio || '')
}

function persistSession(payload) {
	const user = normalizeUser(payload?.user)
	const session = {
		accessToken: payload?.accessToken || '',
		refreshToken: payload?.refreshToken || '',
		expiresIn: Number(payload?.expiresIn || 0),
		loginAt: new Date().toISOString(),
		user,
	}
	setAuthSession(session)
	applyUserProfile(user)
	return session
}

export function getCurrentSession() {
	return getAuthSession()
}

export function isLoggedIn() {
	return Boolean(getAccessToken())
}

export function getSessionAccount() {
	const session = getAuthSession()
	if (!session?.accessToken) return null
	const user = session?.user || {}
	return {
		...user,
		accountId: user.userId || '',
		loginAt: session.loginAt,
	}
}

export async function fetchCaptcha() {
	return request({
		url: '/user-auth/captcha',
	})
}

export async function registerAccount(payload) {
	const username = normalizeText(payload.username)
	const phone = normalizePhone(payload.phone)
	const studentId = normalizeStudentId(payload.studentId)
	const password = normalizeText(payload.password)
	const captchaId = normalizeText(payload.captchaId)
	const captchaCode = normalizeText(payload.captchaCode).toUpperCase()

	return request({
		url: '/user-auth/register',
		method: 'POST',
		data: {
			username,
			phone,
			studentId,
			password,
			captchaId,
			captchaCode,
		},
	})
}

export async function loginAccount(payload) {
	const credential = normalizeText(payload.credential)
	const password = normalizeText(payload.password)
	const captchaId = normalizeText(payload.captchaId)
	const captchaCode = normalizeText(payload.captchaCode).toUpperCase()
	const response = await request({
		url: '/user-auth/login',
		method: 'POST',
		data: {
			credential,
			password,
			captchaId,
			captchaCode,
		},
	})

	return persistSession(response)
}

export async function refreshAccountToken() {
	const refreshToken = getRefreshToken()
	if (!refreshToken) {
		throw new Error('登录已过期，请重新登录')
	}
	const response = await request({
		url: '/user-auth/refresh-token',
		method: 'POST',
		data: {
			refreshToken,
		},
	})
	return persistSession(response)
}

export async function fetchCurrentUser() {
	let token = getAccessToken()
	if (!token) return null

	try {
		const user = await request({
			url: '/user-auth/me',
			token,
		})
		const normalized = normalizeUser(user)
		setAuthSessionUser(normalized)
		applyUserProfile(normalized)
		return normalized
	} catch (error) {
		const statusCode = Number(error?.response?.statusCode || 0)
		if (statusCode !== 401) {
			throw error
		}

		try {
			await refreshAccountToken()
			token = getAccessToken()
			if (!token) return null
			const user = await request({
				url: '/user-auth/me',
				token,
			})
			const normalized = normalizeUser(user)
			setAuthSessionUser(normalized)
			applyUserProfile(normalized)
			return normalized
		} catch (refreshError) {
			clearAuthSession()
			return null
		}
	}
}

export async function logoutAccount() {
	const token = getAccessToken()
	const refreshToken = getRefreshToken()
	if (token) {
		try {
			await request({
				url: '/user-auth/logout',
				method: 'POST',
				data: refreshToken ? { refreshToken } : {},
				token,
			})
		} catch (error) {
			// ignore backend logout failures, always clear local session
		}
	}
	clearAuthSession()
}

export function setSessionFromAuthResponse(payload) {
	return persistSession(payload)
}
