const BARCODE_PREFIX = 'PP'
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const SHORT_CODE_LENGTH = 10
const SHORT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function normalizeText(value) {
	return String(value || '').trim()
}

function toCompactGuid(value) {
	return normalizeText(value)
		.replace(/[^0-9a-fA-F]/g, '')
		.toUpperCase()
}

function hexToBytes(hex) {
	const compact = toCompactGuid(hex)
	if (compact.length !== 32) return []
	const bytes = []
	for (let index = 0; index < compact.length; index += 2) {
		bytes.push(parseInt(compact.slice(index, index + 2), 16))
	}
	return bytes
}

function bytesToHex(bytes) {
	return bytes.map(item => item.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function encodeBase32(bytes) {
	let buffer = 0
	let bitsLeft = 0
	let output = ''

	bytes.forEach(byte => {
		buffer = (buffer << 8) | byte
		bitsLeft += 8
		while (bitsLeft >= 5) {
			output += BASE32_ALPHABET[(buffer >> (bitsLeft - 5)) & 31]
			bitsLeft -= 5
		}
	})

	if (bitsLeft > 0) {
		output += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31]
	}

	return output
}

function decodeBase32(text) {
	const source = normalizeText(text).toUpperCase().replace(/=+$/g, '')
	if (!source) return []

	let buffer = 0
	let bitsLeft = 0
	const bytes = []

	for (let index = 0; index < source.length; index += 1) {
		const value = BASE32_ALPHABET.indexOf(source[index])
		if (value < 0) return []
		buffer = (buffer << 5) | value
		bitsLeft += 5
		if (bitsLeft >= 8) {
			bytes.push((buffer >> (bitsLeft - 8)) & 255)
			bitsLeft -= 8
		}
	}

	return bytes
}

function toBarcodePayload(value) {
	const bytes = hexToBytes(value)
	if (bytes.length !== 16) return ''
	return `${BARCODE_PREFIX}${encodeBase32(bytes)}`
}

function fromBarcodePayload(value) {
	const source = normalizeText(value).toUpperCase()
	if (!source.startsWith(BARCODE_PREFIX)) return ''
	const body = source.slice(BARCODE_PREFIX.length)
	const bytes = decodeBase32(body)
	if (bytes.length !== 16) return ''
	return formatPlaneId(bytesToHex(bytes)).toLowerCase()
}

export function formatPlaneId(value) {
	const compact = toCompactGuid(value)
	if (compact.length !== 32) return ''
	return [
		compact.slice(0, 8),
		compact.slice(8, 12),
		compact.slice(12, 16),
		compact.slice(16, 20),
		compact.slice(20),
	].join('-')
}

export function buildPlaneBarcodeValue(value) {
	return toBarcodePayload(value)
}

export function parseScannedPlaneId(value) {
	const source = normalizeText(value).toUpperCase()
	if (!source) return ''

	const compactDecoded = fromBarcodePayload(source)
	if (compactDecoded) return compactDecoded

	const legacyMatch = source.match(/^PP([0-9A-F]{32})$/)
	if (legacyMatch) {
		return formatPlaneId(legacyMatch[1]).toLowerCase()
	}

	const guidMatch = source.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)
	if (guidMatch) {
		return source.toLowerCase()
	}

	const compactToken = source.replace(/[^A-Z0-9]/g, '')
	if (compactToken.length === SHORT_CODE_LENGTH && [...compactToken].every(char => SHORT_CODE_ALPHABET.includes(char))) {
		return compactToken
	}

	const prefixedShortCode = compactToken.match(new RegExp(`^PP([${SHORT_CODE_ALPHABET}]{${SHORT_CODE_LENGTH}})$`))
	if (prefixedShortCode) {
		return prefixedShortCode[1]
	}

	return ''
}
