import { randomId } from './utils.js'

const KEYS = {
	theme: 'paperplane_theme',
	currentLocation: 'paperplane_current_location',
	myPlaneIds: 'paperplane_my_plane_ids',
	fueledPlaneIds: 'paperplane_fueled_plane_ids',
	recalledPlaneIds: 'paperplane_recalled_plane_ids',
	locationCache: 'paperplane_location_cache',
	profileName: 'paperplane_profile_name',
	profileAvatar: 'paperplane_profile_avatar',
	profileGender: 'paperplane_profile_gender',
	profileBio: 'paperplane_profile_bio',
	authUsers: 'paperplane_auth_users',
	authSession: 'paperplane_auth_session',
	voterKey: 'paperplane_voter_key',
	throwDraft: 'paperplane_throw_draft',
	mockLocations: 'paperplane_mock_locations_v1',
	mockPlanes: 'paperplane_mock_planes_v1',
	mockComments: 'paperplane_mock_comments_v1',
	mockAttitudes: 'paperplane_mock_attitudes_v1',
	apiBaseUrl: 'api_base_url',
}

const memoryStore = {
	theme: 'light',
	currentLocation: '',
	myPlaneIds: [],
	fueledPlaneIds: [],
	recalledPlaneIds: [],
	locationCache: [],
	profileName: 'paperplane_user',
	profileAvatar: '',
	profileGender: 'secret',
	profileBio: 'Say something to the campus breeze.',
	authUsers: [],
	authSession: null,
	voterKey: '',
	throwDraft: null,
}

function cloneArray(input) {
	return Array.isArray(input) ? [...input] : []
}

function canUseSyncStorage() {
	return typeof uni !== 'undefined'
		&& typeof uni.getStorageSync === 'function'
		&& typeof uni.setStorageSync === 'function'
}

function parseMaybeJson(value) {
	if (typeof value !== 'string') return value
	const text = value.trim()
	if (!text) return value
	if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) {
		return value
	}
	try {
		return JSON.parse(text)
	} catch (error) {
		return value
	}
}

function canUseLocalStorage() {
	if (typeof window === 'undefined') return false
	try {
		return Boolean(window.localStorage)
	} catch (error) {
		return false
	}
}

function readLocalStorage(key) {
	if (!canUseLocalStorage()) return undefined
	try {
		const value = window.localStorage.getItem(key)
		if (value === null) return undefined
		return parseMaybeJson(value)
	} catch (error) {
		return undefined
	}
}

function writeLocalStorage(key, value) {
	if (!canUseLocalStorage()) return
	try {
		const output = typeof value === 'string' ? value : JSON.stringify(value)
		window.localStorage.setItem(key, output)
	} catch (error) {
		// ignore localStorage write failures
	}
}

function removeLocalStorage(key) {
	if (!canUseLocalStorage()) return
	try {
		window.localStorage.removeItem(key)
	} catch (error) {
		// ignore localStorage remove failures
	}
}

function readStorage(key) {
	if (canUseSyncStorage()) {
		try {
			const value = uni.getStorageSync(key)
			if (value !== '') return parseMaybeJson(value)
		} catch (error) {
			// ignore uni read failures and fallback to localStorage
		}
	}
	return readLocalStorage(key)
}

function writeStorage(key, value) {
	if (canUseSyncStorage()) {
		try {
			uni.setStorageSync(key, value)
		} catch (error) {
			// ignore uni write failures
		}
	}
	writeLocalStorage(key, value)
}

function removeStorage(key) {
	if (typeof uni !== 'undefined' && typeof uni.removeStorageSync === 'function') {
		try {
			uni.removeStorageSync(key)
		} catch (error) {
			// ignore uni remove failures
		}
	}
	removeLocalStorage(key)
}

function hydrateMemoryStore() {
	const theme = readStorage(KEYS.theme)
	if (typeof theme === 'string' && theme) memoryStore.theme = theme

	const currentLocation = readStorage(KEYS.currentLocation)
	if (typeof currentLocation === 'string') memoryStore.currentLocation = currentLocation

	const myPlaneIds = readStorage(KEYS.myPlaneIds)
	if (Array.isArray(myPlaneIds)) memoryStore.myPlaneIds = cloneArray(myPlaneIds)

	const fueledPlaneIds = readStorage(KEYS.fueledPlaneIds)
	if (Array.isArray(fueledPlaneIds)) memoryStore.fueledPlaneIds = cloneArray(fueledPlaneIds)

	const recalledPlaneIds = readStorage(KEYS.recalledPlaneIds)
	if (Array.isArray(recalledPlaneIds)) memoryStore.recalledPlaneIds = cloneArray(recalledPlaneIds)

	const locationCache = readStorage(KEYS.locationCache)
	if (Array.isArray(locationCache)) memoryStore.locationCache = cloneArray(locationCache)

	const profileName = readStorage(KEYS.profileName)
	if (typeof profileName === 'string' && profileName.trim()) memoryStore.profileName = profileName

	const profileAvatar = readStorage(KEYS.profileAvatar)
	if (typeof profileAvatar === 'string') memoryStore.profileAvatar = profileAvatar

	const profileGender = readStorage(KEYS.profileGender)
	if (typeof profileGender === 'string' && profileGender) memoryStore.profileGender = profileGender

	const profileBio = readStorage(KEYS.profileBio)
	if (typeof profileBio === 'string' && profileBio.trim()) memoryStore.profileBio = profileBio

	const authUsers = readStorage(KEYS.authUsers)
	if (Array.isArray(authUsers)) memoryStore.authUsers = cloneArray(authUsers)

	const authSession = readStorage(KEYS.authSession)
	if (authSession && typeof authSession === 'object') memoryStore.authSession = { ...authSession }

	const voterKey = readStorage(KEYS.voterKey)
	if (typeof voterKey === 'string' && voterKey) memoryStore.voterKey = voterKey

	const throwDraft = readStorage(KEYS.throwDraft)
	if (throwDraft && typeof throwDraft === 'object') memoryStore.throwDraft = throwDraft
}

hydrateMemoryStore()

export function clearAllLocalData() {
	if (typeof uni !== 'undefined' && typeof uni.clearStorageSync === 'function') {
		try {
			uni.clearStorageSync()
		} catch (error) {
			// ignore global storage cleanup failures
		}
	}

	memoryStore.theme = 'light'
	memoryStore.currentLocation = ''
	memoryStore.myPlaneIds = []
	memoryStore.fueledPlaneIds = []
	memoryStore.recalledPlaneIds = []
	memoryStore.locationCache = []
	memoryStore.profileName = 'paperplane_user'
	memoryStore.profileAvatar = ''
	memoryStore.profileGender = 'secret'
	memoryStore.profileBio = 'Say something to the campus breeze.'
	memoryStore.authUsers = []
	memoryStore.authSession = null
	memoryStore.voterKey = ''
	memoryStore.throwDraft = null
}

export function getTheme() {
	return memoryStore.theme || 'light'
}

export function setTheme(theme) {
	memoryStore.theme = theme || 'light'
	writeStorage(KEYS.theme, memoryStore.theme)
}

export function getCurrentLocation() {
	return memoryStore.currentLocation || ''
}

export function setCurrentLocation(name) {
	memoryStore.currentLocation = name || ''
	writeStorage(KEYS.currentLocation, memoryStore.currentLocation)
}

export function getMyPlaneIds() {
	return cloneArray(memoryStore.myPlaneIds)
}

export function saveMyPlaneId(id) {
	if (!id) return
	const current = getMyPlaneIds().filter(item => item !== id)
	current.unshift(id)
	memoryStore.myPlaneIds = current.slice(0, 100)
	writeStorage(KEYS.myPlaneIds, memoryStore.myPlaneIds)
}

export function removeMyPlaneId(id) {
	memoryStore.myPlaneIds = getMyPlaneIds().filter(item => item !== id)
	writeStorage(KEYS.myPlaneIds, memoryStore.myPlaneIds)
}

export function getRecalledPlaneIds() {
	return cloneArray(memoryStore.recalledPlaneIds)
}

export function saveRecalledPlaneId(id) {
	if (!id) return
	const current = getRecalledPlaneIds().filter(item => item !== id)
	current.unshift(id)
	memoryStore.recalledPlaneIds = current.slice(0, 100)
	writeStorage(KEYS.recalledPlaneIds, memoryStore.recalledPlaneIds)
}

export function removeRecalledPlaneId(id) {
	memoryStore.recalledPlaneIds = getRecalledPlaneIds().filter(item => item !== id)
	writeStorage(KEYS.recalledPlaneIds, memoryStore.recalledPlaneIds)
}

export function getFueledPlaneIds() {
	return cloneArray(memoryStore.fueledPlaneIds)
}

export function saveFueledPlaneId(id) {
	if (!id) return
	const current = getFueledPlaneIds().filter(item => item !== id)
	current.unshift(id)
	memoryStore.fueledPlaneIds = current.slice(0, 100)
	writeStorage(KEYS.fueledPlaneIds, memoryStore.fueledPlaneIds)
}

export function removeFueledPlaneId(id) {
	memoryStore.fueledPlaneIds = getFueledPlaneIds().filter(item => item !== id)
	writeStorage(KEYS.fueledPlaneIds, memoryStore.fueledPlaneIds)
}

export function getLocationCache() {
	return cloneArray(memoryStore.locationCache)
}

export function setLocationCache(locations) {
	memoryStore.locationCache = cloneArray(locations)
	writeStorage(KEYS.locationCache, memoryStore.locationCache)
}

export function getProfileName() {
	return memoryStore.profileName || 'paperplane_user'
}

export function setProfileName(name) {
	memoryStore.profileName = (name || '').trim() || 'paperplane_user'
	writeStorage(KEYS.profileName, memoryStore.profileName)
}

export function getProfileAvatar() {
	return memoryStore.profileAvatar || ''
}

export function setProfileAvatar(avatar) {
	memoryStore.profileAvatar = avatar || ''
	writeStorage(KEYS.profileAvatar, memoryStore.profileAvatar)
}

export function getProfileGender() {
	return memoryStore.profileGender || 'secret'
}

export function setProfileGender(gender) {
	memoryStore.profileGender = gender || 'secret'
	writeStorage(KEYS.profileGender, memoryStore.profileGender)
}

export function getProfileBio() {
	return memoryStore.profileBio || 'Say something to the campus breeze.'
}

export function setProfileBio(bio) {
	memoryStore.profileBio = (bio || '').trim() || 'Say something to the campus breeze.'
	writeStorage(KEYS.profileBio, memoryStore.profileBio)
}

export function getAuthUsers() {
	return cloneArray(memoryStore.authUsers)
}

export function saveAuthUsers(users) {
	memoryStore.authUsers = cloneArray(users)
	writeStorage(KEYS.authUsers, memoryStore.authUsers)
}

export function getAuthSession() {
	let session = memoryStore.authSession
	if (!session || typeof session !== 'object') {
		const stored = readStorage(KEYS.authSession)
		if (stored && typeof stored === 'object') {
			session = { ...stored }
			memoryStore.authSession = session
		}
	}
	if (!session || typeof session !== 'object') return null
	if (!session.accessToken && !session.refreshToken) return null
	return {
		...session,
	}
}

export function setAuthSession(session) {
	if (!session) {
		clearAuthSession()
		return
	}
	memoryStore.authSession = {
		...session,
	}
	writeStorage(KEYS.authSession, memoryStore.authSession)
}

export function clearAuthSession() {
	memoryStore.authSession = null
	removeStorage(KEYS.authSession)
}

export function getAccessToken() {
	return getAuthSession()?.accessToken || ''
}

export function getRefreshToken() {
	return getAuthSession()?.refreshToken || ''
}

export function setAuthSessionUser(user) {
	const session = getAuthSession()
	if (!session) return
	setAuthSession({
		...session,
		user: user || null,
	})
}

export function getVoterKey() {
	if (!memoryStore.voterKey) {
		memoryStore.voterKey = randomId('voter')
		writeStorage(KEYS.voterKey, memoryStore.voterKey)
	}
	return memoryStore.voterKey
}

export function getThrowDraft() {
	return memoryStore.throwDraft || null
}

export function setThrowDraft(draft) {
	memoryStore.throwDraft = draft || null
	if (memoryStore.throwDraft) {
		writeStorage(KEYS.throwDraft, memoryStore.throwDraft)
		return
	}
	removeStorage(KEYS.throwDraft)
}

export function clearThrowDraft() {
	memoryStore.throwDraft = null
	removeStorage(KEYS.throwDraft)
}
