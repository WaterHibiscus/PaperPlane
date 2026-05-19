import { reactive } from 'vue'
import { getLocations, getMoodConfigs } from './api.js'
import { getMoodOptions, setMoodConfigs } from './moods.js'
import {
	getCurrentLocation,
	getLocationCache,
	getProfileAvatar,
	getProfileBio,
	getProfileGender,
	getProfileName,
	getTheme,
	setCurrentLocation as persistCurrentLocation,
	setLocationCache,
	setProfileAvatar as persistProfileAvatar,
	setProfileBio as persistProfileBio,
	setProfileGender as persistProfileGender,
	setProfileName as persistProfileName,
	setTheme as persistTheme,
} from './storage.js'

export const appState = reactive({
	theme: getTheme(),
	currentLocation: getCurrentLocation(),
	locations: getLocationCache(),
	moodConfigs: getMoodOptions(),
	profileName: getProfileName(),
	profileAvatar: getProfileAvatar(),
	profileGender: getProfileGender(),
	profileBio: getProfileBio(),
})

const THEME_WINDOW_STYLE = {
	light: {
		backgroundColor: '#F7F2E9',
		backgroundColorTop: '#F7F2E9',
		backgroundColorBottom: '#EEF4F1',
		frontColor: '#000000',
		statusBarStyle: 'dark',
	},
	dark: {
		backgroundColor: '#0F1416',
		backgroundColorTop: '#0F1416',
		backgroundColorBottom: '#111A1D',
		frontColor: '#ffffff',
		statusBarStyle: 'light',
	},
}

function getWindowStyle(theme) {
	return theme === 'dark' ? THEME_WINDOW_STYLE.dark : THEME_WINDOW_STYLE.light
}

function syncDocumentBackground(style) {
	if (typeof document === 'undefined') return
	document.documentElement.style.backgroundColor = style.backgroundColor
	if (document.body) {
		document.body.style.backgroundColor = style.backgroundColor
	}
}

function hasActivePage() {
	if (typeof getCurrentPages !== 'function') return false
	try {
		const pages = getCurrentPages()
		return Array.isArray(pages) && pages.length > 0
	} catch (error) {
		return false
	}
}

function safelyInvokeUniApi(invoke) {
	try {
		const result = invoke()
		if (result && typeof result.catch === 'function') {
			result.catch(() => {
				// ignore async api failures
			})
		}
	} catch (error) {
		// ignore sync api failures
	}
}

export function syncThemeWindow(theme = appState.theme) {
	const style = getWindowStyle(theme)
	syncDocumentBackground(style)

	if (typeof uni !== 'undefined') {
		if (typeof uni.setBackgroundColor === 'function') {
			safelyInvokeUniApi(() =>
				uni.setBackgroundColor({
					backgroundColor: style.backgroundColor,
					backgroundColorTop: style.backgroundColorTop,
					backgroundColorBottom: style.backgroundColorBottom,
				})
			)
		}

		if (typeof uni.setNavigationBarColor === 'function' && hasActivePage()) {
			safelyInvokeUniApi(() =>
				uni.setNavigationBarColor({
					frontColor: style.frontColor,
					backgroundColor: style.backgroundColor,
					animation: {
						duration: 0,
						timingFunc: 'linear',
					},
				})
			)
		}
	}

	if (typeof plus !== 'undefined' && plus.navigator) {
		try {
			if (typeof plus.navigator.setStatusBarBackground === 'function') {
				plus.navigator.setStatusBarBackground(style.backgroundColorTop)
			}
			if (typeof plus.navigator.setStatusBarStyle === 'function') {
				plus.navigator.setStatusBarStyle(style.statusBarStyle)
			}
		} catch (error) {
			// ignore status bar sync failures
		}
	}
}

export function toggleTheme() {
	appState.theme = appState.theme === 'dark' ? 'light' : 'dark'
	persistTheme(appState.theme)
	syncThemeWindow(appState.theme)
	return appState.theme
}

export function setCurrentLocation(name) {
	appState.currentLocation = name || ''
	persistCurrentLocation(appState.currentLocation)
}

export async function fetchLocations() {
	const locations = await getLocations()
	appState.locations = locations || []
	setLocationCache(appState.locations)
	return appState.locations
}

export async function fetchMoodConfigs() {
	const moods = await getMoodConfigs()
	setMoodConfigs(moods)
	appState.moodConfigs = getMoodOptions()
	return appState.moodConfigs
}

export function setProfileName(name) {
	appState.profileName = (name || '').trim() || '纸飞机同学'
	persistProfileName(appState.profileName)
	return appState.profileName
}

export function setProfileAvatar(avatar) {
	appState.profileAvatar = avatar || ''
	persistProfileAvatar(appState.profileAvatar)
	return appState.profileAvatar
}

export function setProfileGender(gender) {
	appState.profileGender = gender || 'secret'
	persistProfileGender(appState.profileGender)
	return appState.profileGender
}

export function setProfileBio(bio) {
	appState.profileBio = (bio || '').trim() || '把想说的话折进纸飞机里。'
	persistProfileBio(appState.profileBio)
	return appState.profileBio
}

syncThemeWindow(appState.theme)

