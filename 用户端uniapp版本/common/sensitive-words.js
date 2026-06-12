import { getSensitiveWords } from './api.js'

const RULE_CACHE_TTL_MS = 5 * 60 * 1000
const ruleCache = new Map()

function normalizeText(value) {
	return String(value || '').trim().toLowerCase()
}

function normalizeMode(mode) {
	return String(mode || 'CONTAINS').trim().toUpperCase()
}

function normalizeScope(scope) {
	return String(scope || '').trim().toUpperCase()
}

function splitScopes(scopeText) {
	return String(scopeText || '')
		.split(',')
		.map(item => normalizeScope(item))
		.filter(Boolean)
}

function normalizeRule(raw) {
	const word = String(raw?.word ?? raw?.Word ?? '').trim()
	const matchMode = normalizeMode(raw?.matchMode ?? raw?.MatchMode)
	const scopes = splitScopes(raw?.scope ?? raw?.Scope)

	return {
		word,
		wordNormalized: normalizeText(word),
		matchMode,
		scopes,
	}
}

function isCacheFresh(entry) {
	if (!entry) return false
	return Date.now() - entry.timestamp <= RULE_CACHE_TTL_MS
}

export async function fetchSensitiveWordRules(scope, options = {}) {
	const normalizedScope = normalizeScope(scope)
	const cacheKey = normalizedScope || 'ALL'
	const forceRefresh = Boolean(options?.forceRefresh)
	const cached = ruleCache.get(cacheKey)

	if (!forceRefresh && isCacheFresh(cached)) {
		return cached.rules
	}

	try {
		const data = await getSensitiveWords(normalizedScope || undefined)
		const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
		const rules = list.map(normalizeRule).filter(item => item.wordNormalized)

		ruleCache.set(cacheKey, {
			timestamp: Date.now(),
			rules,
		})

		return rules
	} catch (error) {
		if (cached?.rules) return cached.rules
		throw error
	}
}

function isRuleMatched(normalizedText, rule) {
	if (!normalizedText || !rule?.wordNormalized) return false
	if (rule.matchMode === 'EXACT') {
		return normalizedText === rule.wordNormalized
	}
	return normalizedText.includes(rule.wordNormalized)
}

export function findMatchedSensitiveWord(content, rules = [], scope = '') {
	const normalizedText = normalizeText(content)
	if (!normalizedText || !Array.isArray(rules) || !rules.length) {
		return null
	}

	const normalizedScope = normalizeScope(scope)
	for (const rule of rules) {
		if (normalizedScope && Array.isArray(rule.scopes) && rule.scopes.length > 0 && !rule.scopes.includes(normalizedScope)) {
			continue
		}
		if (isRuleMatched(normalizedText, rule)) {
			return rule
		}
	}

	return null
}
