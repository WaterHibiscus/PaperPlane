<template>
	<view class="barcode-shell">
		<svg
			v-if="barPath"
			class="barcode-svg"
			:viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
			preserveAspectRatio="none"
			shape-rendering="crispEdges"
			aria-hidden="true"
		>
			<rect x="0" y="0" :width="viewBoxWidth" :height="viewBoxHeight" fill="#ffffff"></rect>
			<path :d="barPath" fill="#111111"></path>
		</svg>
		<view v-else class="barcode-empty"></view>
	</view>
</template>

<script>
const CODE128_PATTERNS = [
	'212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
	'221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
	'221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
	'212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
	'231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
	'231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
	'314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
	'112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
	'111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
	'214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
	'114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]

const START_CODE_B = 104
const STOP_CODE = 106
const QUIET_WIDTH = 14
const VIEW_BOX_HEIGHT = 120

function normalizeValue(value) {
	return String(value || '').trim()
}

function toCode128BValue(char) {
	const code = char.charCodeAt(0)
	if (code < 32 || code > 126) return -1
	return code - 32
}

function buildCodeSequence(value) {
	const text = normalizeValue(value)
	if (!text) return []

	const charValues = []
	for (let index = 0; index < text.length; index += 1) {
		const nextValue = toCode128BValue(text[index])
		if (nextValue < 0) return []
		charValues.push(nextValue)
	}

	let checksum = START_CODE_B
	charValues.forEach((item, index) => {
		checksum += item * (index + 1)
	})
	checksum %= 103

	return [START_CODE_B, ...charValues, checksum, STOP_CODE]
}

function buildSegments(value) {
	const sequence = buildCodeSequence(value)
	if (!sequence.length) return []

	const segments = [{ width: QUIET_WIDTH, isBar: false }]
	sequence.forEach((code, sequenceIndex) => {
		const pattern = CODE128_PATTERNS[code]
		if (!pattern) return
		for (let index = 0; index < pattern.length; index += 1) {
			segments.push({
				width: Number(pattern[index]) || 0,
				isBar: index % 2 === 0,
			})
		}
		if (sequenceIndex === sequence.length - 1) {
			segments.push({ width: QUIET_WIDTH, isBar: false })
		}
	})

	return segments.filter(item => item.width > 0)
}

function buildBarPath(segments, height) {
	let cursor = 0
	const commands = []
	segments.forEach(segment => {
		if (segment.isBar) {
			commands.push(`M${cursor} 0H${cursor + segment.width}V${height}H${cursor}Z`)
		}
		cursor += segment.width
	})

	return {
		path: commands.join(''),
		width: cursor,
	}
}

export default {
	name: 'Code128Barcode',
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	computed: {
		segments() {
			return buildSegments(this.value)
		},
		viewBoxHeight() {
			return VIEW_BOX_HEIGHT
		},
		viewBoxWidth() {
			return buildBarPath(this.segments, this.viewBoxHeight).width || 1
		},
		barPath() {
			return buildBarPath(this.segments, this.viewBoxHeight).path
		},
	},
}
</script>

<style scoped>
.barcode-shell {
	width: 100%;
	padding: 24rpx;
	border-radius: 22rpx;
	background: #ffffff;
	box-sizing: border-box;
}

.barcode-svg {
	display: block;
	width: 100%;
	height: 220rpx;
}

.barcode-empty {
	width: 100%;
	height: 220rpx;
	background: #f3f5f7;
	border-radius: 14rpx;
}
</style>
