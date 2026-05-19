<template>
	<view :class="['app-page', 'scan-page', themeClass]">
		<view class="scan-nav">
			<view class="nav-btn" @tap="goBack">
				<image class="nav-icon-image" :src="backIcon" mode="aspectFit" />
			</view>
			<view class="nav-center">
				<text class="nav-kicker">Plane Code</text>
				<text class="nav-title">扫描纸条条码</text>
			</view>
			<view class="nav-placeholder"></view>
		</view>

		<view class="scan-shell">
			<view class="scan-card">
				<view v-if="scannerAvailable" class="camera-wrap">
					<view id="html5qr-reader" class="qr-reader"></view>
					<view class="scan-frame">
						<view class="frame-corner corner-tl"></view>
						<view class="frame-corner corner-tr"></view>
						<view class="frame-corner corner-bl"></view>
						<view class="frame-corner corner-br"></view>
					</view>
				</view>
				<view v-else class="unsupported-state">
					<text class="unsupported-title">{{ unsupportedTitle }}</text>
					<text class="unsupported-desc">{{ unsupportedDesc }}</text>
				</view>

				<text class="scan-status">{{ scanStatus }}</text>
			</view>

			<view class="manual-card">
				<text class="manual-title">手动输入编号</text>
				<input
					v-model="manualCode"
					class="manual-input"
					placeholder="粘贴纸条编号或条码内容"
					placeholder-class="placeholder-text"
				/>
				<view class="manual-btn" @tap="submitManualCode">
					<text>打开纸条</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { appState, syncThemeWindow } from '../../common/app-state.js'
import { parseScannedPlaneId } from '../../common/plane-code.js'
import { uiIcons } from '../../common/ui-icons.js'

function loadHtml5QrcodeScript() {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return Promise.reject(new Error('browser only'))
	}
	if (window.Html5Qrcode) {
		return Promise.resolve(window.Html5Qrcode)
	}
	if (window.__html5QrcodePromise) {
		return window.__html5QrcodePromise
	}

	window.__html5QrcodePromise = new Promise((resolve, reject) => {
		const existed = document.querySelector(`script[data-html5-qrcode="1"]`)
		if (existed) {
			existed.addEventListener('load', () => resolve(window.Html5Qrcode), { once: true })
			existed.addEventListener('error', () => reject(new Error('load html5-qrcode failed')), { once: true })
			return
		}

		const script = document.createElement('script')
		script.src = `${window.location.origin}/static/vendor/html5-qrcode.min.js`
		script.async = true
		script.defer = true
		script.dataset.html5Qrcode = '1'
		script.onload = () => resolve(window.Html5Qrcode)
		script.onerror = () => reject(new Error('load html5-qrcode failed'))
		document.head.appendChild(script)
	})

	return window.__html5QrcodePromise
}

export default {
	data() {
		return {
			appState,
			backIcon: uiIcons.back,
			manualCode: '',
			scanStatus: '将纸条条形码对准取景框',
			scannerAvailable: true,
			unsupportedTitle: '当前浏览器不支持直接扫码',
			unsupportedDesc: '可以手动输入纸条编号或条码内容继续打开详情。',
			scanLocked: false,
			html5QrCode: null,
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
	},
	onShow() {
		syncThemeWindow(this.appState.theme)
	},
	onReady() {
		this.initScanner()
	},
	onHide() {
		this.stopScanner()
	},
	onUnload() {
		this.stopScanner()
	},
	methods: {
		goBack() {
			uni.navigateBack({
				fail: () => {
					uni.switchTab({
						url: '/pages/mine/index',
					})
				},
			})
		},
		async initScanner() {
			// #ifndef H5
			this.scanStatus = '当前环境不支持浏览器扫码'
			return
			// #endif

			if (typeof window !== 'undefined' && window.isSecureContext === false) {
				this.scannerAvailable = false
				this.scanStatus = '当前页面不是安全上下文，无法打开相机'
				this.unsupportedTitle = '浏览器拦截了本地相机权限'
				this.unsupportedDesc = '手机浏览器通过 http://局域网IP 访问本地项目时，相机会被浏览器安全策略拦截。要直接扫码，需要 HTTPS，或在原生 App 内使用扫码。'
				return
			}

			try {
				const Html5Qrcode = await loadHtml5QrcodeScript()
				if (!Html5Qrcode || typeof Html5Qrcode !== 'function') {
					this.scannerAvailable = false
					this.scanStatus = '扫码组件加载失败，请手动输入编号'
					this.unsupportedTitle = '扫码组件加载失败'
					this.unsupportedDesc = '浏览器没有成功加载扫码脚本，可以先手动输入编号。'
					return
				}

				await this.$nextTick()
				this.html5QrCode = new Html5Qrcode('html5qr-reader')
				const config = {
					fps: 10,
					qrbox: { width: 320, height: 170 },
					aspectRatio: 1.777778,
					disableFlip: false,
				}
					if (window.Html5QrcodeSupportedFormats?.CODE_128 && window.Html5QrcodeSupportedFormats?.QR_CODE) {
						config.formatsToSupport = [
							window.Html5QrcodeSupportedFormats.CODE_128,
							window.Html5QrcodeSupportedFormats.QR_CODE,
						]
					}

				const onSuccess = decodedText => {
					if (this.scanLocked) return
					this.handleScannedValue(decodedText)
				}

				try {
					await this.html5QrCode.start(
						{ facingMode: 'environment' },
						config,
						onSuccess,
						() => {}
					)
				} catch (primaryError) {
					const cameras = typeof Html5Qrcode.getCameras === 'function'
						? await Html5Qrcode.getCameras()
						: []
					if (!cameras.length) throw primaryError
					await this.html5QrCode.start(
						{ deviceId: { exact: cameras[0].id } },
						config,
						onSuccess,
						() => {}
					)
				}

				this.scannerAvailable = true
				this.scanStatus = '将纸条条形码对准取景框'
			} catch (error) {
				this.scannerAvailable = false
				this.scanStatus = error?.message || '无法打开相机扫码，请手动输入编号'
				this.unsupportedTitle = '无法打开相机扫码'
				this.unsupportedDesc = this.scanStatus
			}
		},
		async stopScanner() {
			if (!this.html5QrCode) return
			try {
				if (typeof this.html5QrCode.isScanning === 'function' ? this.html5QrCode.isScanning : true) {
					await this.html5QrCode.stop()
				}
			} catch (error) {
				// ignore scanner stop failures
			}
			try {
				if (typeof this.html5QrCode.clear === 'function') {
					this.html5QrCode.clear()
				}
			} catch (error) {
				// ignore DOM cleanup failures
			}
			this.html5QrCode = null
		},
		handleScannedValue(rawValue) {
			const planeId = parseScannedPlaneId(rawValue)
			if (!planeId) {
				this.scanStatus = '未识别到有效纸条条码'
				return
			}

			this.scanLocked = true
			this.stopScanner()
			uni.redirectTo({
				url: `/pages/detail/index?id=${planeId}`,
			})
		},
		submitManualCode() {
			const planeId = parseScannedPlaneId(this.manualCode)
			if (!planeId) {
				uni.showToast({
					title: '请输入有效纸条编号',
					icon: 'none',
				})
				return
			}

			this.stopScanner()
			uni.redirectTo({
				url: `/pages/detail/index?id=${planeId}`,
			})
		},
	},
}
</script>

<style scoped>
.scan-page {
	padding-top: 0;
	min-height: 100vh;
}

.scan-nav {
	position: sticky;
	top: 0;
	z-index: 20;
	margin: 0 -28rpx;
	padding: calc(env(safe-area-inset-top) + 20rpx) 28rpx 18rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(247, 242, 233, 0.92);
	backdrop-filter: blur(16rpx);
	border-bottom: 2rpx solid rgba(28, 36, 40, 0.05);
}

.theme-dark .scan-nav {
	background: rgba(15, 20, 22, 0.9);
	border-bottom-color: rgba(230, 237, 241, 0.08);
}

.nav-btn,
.nav-placeholder {
	width: 68rpx;
	height: 68rpx;
	flex-shrink: 0;
}

.nav-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 18rpx;
	border: 2rpx solid var(--border);
}

.nav-icon-image {
	width: 34rpx;
	height: 34rpx;
	display: block;
}

.nav-center {
	flex: 1;
	min-width: 0;
	margin: 0 18rpx;
	text-align: center;
}

.nav-kicker {
	display: block;
	font-size: 18rpx;
	letter-spacing: 3rpx;
	color: var(--muted);
}

.nav-title {
	display: block;
	margin-top: 6rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: var(--ink);
}

.scan-shell {
	padding: 28rpx 0 48rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.scan-card,
.manual-card {
	padding: 24rpx;
	border-radius: 28rpx;
	background: rgba(255, 255, 255, 0.82);
	border: 2rpx solid rgba(28, 36, 40, 0.05);
}

.theme-dark .scan-card,
.theme-dark .manual-card {
	background: rgba(255, 255, 255, 0.05);
	border-color: rgba(230, 237, 241, 0.08);
}

.camera-wrap {
	position: relative;
	height: 720rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: rgba(18, 22, 24, 0.94);
}

.qr-reader {
	width: 100%;
	height: 100%;
}

.qr-reader :deep(video) {
	width: 100% !important;
	height: 100% !important;
	object-fit: cover !important;
}

.qr-reader :deep(canvas) {
	display: none !important;
}

.qr-reader :deep(img) {
	display: none !important;
}

.scan-frame {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 420rpx;
	height: 220rpx;
	transform: translate(-50%, -50%);
	border: 2rpx solid rgba(255, 255, 255, 0.14);
	border-radius: 24rpx;
	pointer-events: none;
}

.frame-corner {
	position: absolute;
	width: 36rpx;
	height: 36rpx;
	border-color: #42c38d;
	border-style: solid;
}

.corner-tl {
	left: -2rpx;
	top: -2rpx;
	border-width: 6rpx 0 0 6rpx;
	border-top-left-radius: 22rpx;
}

.corner-tr {
	right: -2rpx;
	top: -2rpx;
	border-width: 6rpx 6rpx 0 0;
	border-top-right-radius: 22rpx;
}

.corner-bl {
	left: -2rpx;
	bottom: -2rpx;
	border-width: 0 0 6rpx 6rpx;
	border-bottom-left-radius: 22rpx;
}

.corner-br {
	right: -2rpx;
	bottom: -2rpx;
	border-width: 0 6rpx 6rpx 0;
	border-bottom-right-radius: 22rpx;
}

.unsupported-state {
	padding: 40rpx 12rpx;
	text-align: center;
}

.unsupported-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: var(--ink);
}

.unsupported-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 22rpx;
	line-height: 1.6;
	color: var(--muted);
}

.scan-status {
	display: block;
	margin-top: 18rpx;
	font-size: 22rpx;
	line-height: 1.6;
	color: var(--muted);
	text-align: center;
}

.manual-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: var(--ink);
}

.manual-input {
	width: 100%;
	height: 88rpx;
	margin-top: 18rpx;
	padding: 0 22rpx;
	border-radius: 20rpx;
	background: rgba(247, 245, 241, 0.92);
	font-size: 24rpx;
	color: var(--ink);
}

.theme-dark .manual-input {
	background: rgba(255, 255, 255, 0.05);
	border: 2rpx solid rgba(230, 237, 241, 0.08);
}

.manual-btn {
	margin-top: 18rpx;
	height: 88rpx;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #31bc7d, #1f9d69);
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 700;
}
</style>
