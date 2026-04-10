import { uiIcons } from './ui-icons.js'

export const moodMetaMap = {
	happy: { label: '开心', icon: uiIcons.emotion, color: '#ff7b7b' },
	sad: { label: '难过', icon: uiIcons.emotion, color: '#6aa7ff' },
	calm: { label: '平静', icon: uiIcons.emotion, color: '#36b37e' },
	angry: { label: '吐槽', icon: uiIcons.emotion, color: '#ff9f1c' },
	love: { label: '心动', icon: uiIcons.emotion, color: '#ff6fb1' },
}

export const moodOptions = [
	{ text: '开心', value: 'happy', icon: uiIcons.emotion },
	{ text: '难过', value: 'sad', icon: uiIcons.emotion },
	{ text: '平静', value: 'calm', icon: uiIcons.emotion },
	{ text: '吐槽', value: 'angry', icon: uiIcons.emotion },
	{ text: '心动', value: 'love', icon: uiIcons.emotion },
]

export const moodFilters = [
	{ label: '全部', value: 'all' },
	{ label: '开心', value: 'happy' },
	{ label: '难过', value: 'sad' },
	{ label: '平静', value: 'calm' },
	{ label: '吐槽', value: 'angry' },
	{ label: '心动', value: 'love' },
]

export const expireOptions = [
	{ text: '2小时', value: 2 },
	{ text: '24小时', value: 24 },
	{ text: '48小时', value: 48 },
]

export function getMoodMeta(mood) {
	return moodMetaMap[mood] || {
		label: mood || '未知',
		icon: uiIcons.emotion,
		color: '#909399',
	}
}
