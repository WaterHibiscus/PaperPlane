const DEFAULT_THROW_EXPIRE_OPTIONS = [
	{ text: '2小时', value: 2, sortOrder: 10, isActive: true },
	{ text: '24小时', value: 24, sortOrder: 20, isActive: true },
	{ text: '48小时', value: 48, sortOrder: 30, isActive: true },
]

let runtimeThrowExpireOptions = normalizeExpireOptions(DEFAULT_THROW_EXPIRE_OPTIONS)

function normalizeText(value) {
	return String(value || '').trim()
}

function toBoolean(value, fallback = false) {
	if (typeof value === 'boolean') return value
	if (value === 'true') return true
	if (value === 'false') return false
	return fallback
}

function normalizeExpireOption(item, index = 0) {
	if (!item || typeof item !== 'object') return null

	const rawValue = Number(item.value ?? item.hours ?? item.Value ?? item.Hours)
	if (!Number.isInteger(rawValue)) return null
	const value = Math.min(168, Math.max(1, rawValue))

	const label = normalizeText(item.text || item.label || item.Text || item.Label) || `${value}小时`
	const rawSortOrder = Number(item.sortOrder ?? item.SortOrder)
	const sortOrder = Number.isFinite(rawSortOrder) ? rawSortOrder : index * 10

	return {
		text: label,
		value,
		sortOrder,
		isActive: toBoolean(item.isActive ?? item.IsActive, true),
	}
}

function normalizeExpireOptions(items) {
	const source = Array.isArray(items) ? items : []
	const fallbackSource = source.length ? source : DEFAULT_THROW_EXPIRE_OPTIONS
	const unique = new Map()

	fallbackSource.forEach((item, index) => {
		const normalized = normalizeExpireOption(item, index)
		if (!normalized || unique.has(normalized.value)) return
		unique.set(normalized.value, normalized)
	})

	const list = Array.from(unique.values())
	if (!list.length) {
		return DEFAULT_THROW_EXPIRE_OPTIONS.map((item, index) => normalizeExpireOption(item, index)).filter(Boolean)
	}

	return list
		.sort((left, right) => {
			const sortDiff = Number(left.sortOrder || 0) - Number(right.sortOrder || 0)
			if (sortDiff !== 0) return sortDiff
			return Number(left.value || 0) - Number(right.value || 0)
		})
}

export function setThrowExpireOptions(items) {
	runtimeThrowExpireOptions = normalizeExpireOptions(items)
}

export function getThrowExpireOptions() {
	return runtimeThrowExpireOptions
		.filter(item => item.isActive)
		.map(item => ({ ...item }))
}
