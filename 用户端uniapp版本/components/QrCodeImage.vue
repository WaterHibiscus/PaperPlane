<template>
	<view class="qr-shell">
		<view v-if="moduleCount > 0" class="qr-grid" :style="gridStyle">
			<view
				v-for="(dark, index) in qrCells"
				:key="index"
				:class="['qr-cell', dark ? 'dark' : 'light']"
			></view>
		</view>
		<view v-else class="qr-empty"></view>
	</view>
</template>

<script>
import * as qrcodeModule from '../common/vendor/qrcode-generator.js'

const DEFAULT_SIZE = 260
const MIN_SIZE = 180
const MAX_SIZE = 280
const QUIET_ZONE_SIZE = 4

function resolveQrcodeFactory() {
	if (typeof qrcodeModule === 'function') return qrcodeModule
	if (typeof qrcodeModule?.default === 'function') return qrcodeModule.default
	if (typeof qrcodeModule?.qrcode === 'function') return qrcodeModule.qrcode
	if (typeof qrcodeModule?.default?.default === 'function') return qrcodeModule.default.default
	if (typeof qrcodeModule?.default?.qrcode === 'function') return qrcodeModule.default.qrcode
	return null
}

const createQr = resolveQrcodeFactory()

function getDisplaySizePx() {
	try {
		if (typeof uni === 'undefined' || typeof uni.getSystemInfoSync !== 'function') {
			return DEFAULT_SIZE
		}
		const info = uni.getSystemInfoSync() || {}
		const width = Number(info.windowWidth || 360)
		return Math.max(Math.min(width - 132, MAX_SIZE), MIN_SIZE)
	} catch (error) {
		return DEFAULT_SIZE
	}
}

function normalizeValue(value) {
	return String(value || '').trim()
}

function buildQrMatrix(value) {
	const text = normalizeValue(value)
	if (!text || typeof createQr !== 'function') return null

	try {
		const qr = createQr(0, 'M')
		qr.addData(text)
		qr.make()

		const count = qr.getModuleCount()
		const fullCount = count + QUIET_ZONE_SIZE * 2
		const cells = new Array(fullCount * fullCount)

		let pointer = 0
		for (let row = 0; row < fullCount; row += 1) {
			for (let col = 0; col < fullCount; col += 1) {
				const sourceRow = row - QUIET_ZONE_SIZE
				const sourceCol = col - QUIET_ZONE_SIZE
				if (sourceRow < 0 || sourceCol < 0 || sourceRow >= count || sourceCol >= count) {
					cells[pointer] = false
				} else {
					cells[pointer] = Boolean(qr.isDark(sourceRow, sourceCol))
				}
				pointer += 1
			}
		}

		return {
			count: fullCount,
			cells,
		}
	} catch (error) {
		return null
	}
}

export default {
	name: 'QrCodeImage',
	props: {
		value: {
			type: String,
			default: '',
		},
		visible: {
			type: Boolean,
			default: true,
		},
	},
	data() {
		return {
			displaySizePx: getDisplaySizePx(),
		}
	},
	computed: {
		hasValue() {
			return Boolean(normalizeValue(this.value))
		},
		matrix() {
			return buildQrMatrix(this.value)
		},
		moduleCount() {
			return Number(this.matrix?.count || 0)
		},
		qrCells() {
			return Array.isArray(this.matrix?.cells) ? this.matrix.cells : []
		},
		gridStyle() {
			return {
				width: `${this.displaySizePx}px`,
				height: `${this.displaySizePx}px`,
				gridTemplateColumns: `repeat(${this.moduleCount}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${this.moduleCount}, minmax(0, 1fr))`,
			}
		},
	},
	methods: {
		refresh() {
			// Keep method for API compatibility with parent component.
		},
	},
}
</script>

<style scoped>
.qr-shell {
	padding: 18rpx;
	border-radius: 22rpx;
	background: #ffffff;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
}

.qr-grid {
	display: grid;
	background: #ffffff;
	border-radius: 10rpx;
	overflow: hidden;
	flex-shrink: 0;
}

.qr-cell {
	min-width: 0;
	min-height: 0;
}

.qr-cell.dark {
	background: #111111;
}

.qr-cell.light {
	background: #ffffff;
}

.qr-empty {
	width: 220px;
	height: 220px;
	border-radius: 16rpx;
	background: #f3f5f7;
}
</style>
