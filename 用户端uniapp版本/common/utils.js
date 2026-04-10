export function formatTime(dateStr) {
	if (!dateStr) return ''
	const date = new Date(dateStr)
	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')
	const hour = `${date.getHours()}`.padStart(2, '0')
	const minute = `${date.getMinutes()}`.padStart(2, '0')
	const second = `${date.getSeconds()}`.padStart(2, '0')
	return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}

export function timeAgo(dateStr) {
	return formatTime(dateStr)
}

export function getRemainingText(expireTime) {
	return formatTime(expireTime)
}

export function getRemainingShort(expireTime) {
	return formatTime(expireTime)
}

export function isExpired(expireTime) {
	return new Date(expireTime).getTime() <= Date.now()
}

export function getPlaneAuthorLabel(plane) {
	if (!plane) return ''
	if (plane.isAnonymous !== false) return '匿名投掷'
	return plane.authorName || '实名发布'
}

export function randomId(prefix = 'id') {
	return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function safeJsonParse(value, fallback) {
	if (!value) return fallback
	try {
		return JSON.parse(value)
	} catch (error) {
		return fallback
	}
}
