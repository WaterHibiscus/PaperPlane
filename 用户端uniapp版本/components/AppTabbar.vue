<template>
	<view :class="['tabbar-shell', themeClass]" :style="tabbarStyle">
		<view v-if="overlayVisible" class="transition-mask">
			<view class="mask-core">
				<image class="mask-plane-image" :src="maskPlane" mode="aspectFit" />
				<text class="mask-text">{{ maskText }}</text>
			</view>
		</view>

		<svg class="curved-bg" viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true">
			<path :d="tabbarPath"></path>
		</svg>

		<view class="curved-bubble" aria-hidden="true">
			<image
				v-if="activeTab.iconType === 'image'"
				class="bubble-icon-image"
				:src="getTabIcon(activeTab, true)"
				mode="aspectFit"
			/>
			<text v-else class="bubble-icon-text">{{ activeTab.icon }}</text>
		</view>

		<view
			v-for="item in tabs"
			:key="item.key"
			:class="['curved-item', { active: activeIndex === getTabIndex(item.key) }]"
			@tap="switchTo(item)"
		>
			<view class="item-inner">
				<image
					v-if="item.iconType === 'image'"
					class="item-icon-image"
					:src="getTabIcon(item, activeIndex === getTabIndex(item.key))"
					mode="aspectFit"
				/>
				<text v-else class="item-icon-text">{{ item.icon }}</text>
				<text class="item-label">{{ item.label }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		active: {
			type: String,
			default: 'home',
		},
		theme: {
			type: String,
			default: 'light',
		},
	},
	data() {
		return {
			tabs: [
				{ key: 'home', label: '首页', iconType: 'image', icon: '/static/images/首页.png', activeIcon: '/static/images/首页选中.png', path: '/pages/home/index' },
				{ key: 'discover', label: '发现', iconType: 'image', icon: '/static/images/雷达.png', activeIcon: '/static/images/雷达选中.png', path: '/pages/discover/index' },
				{ key: 'throw', label: '投掷', iconType: 'image', icon: '/static/images/投掷.png', activeIcon: '/static/images/投掷选中.png', path: '/pages/throw/index' },
				{ key: 'trending', label: '热门', iconType: 'image', icon: '/static/images/热门.png', activeIcon: '/static/images/热门选中.png', path: '/pages/trending/index' },
				{ key: 'mine', label: '我的', iconType: 'image', icon: '/static/images/设置.png', activeIcon: '/static/images/设置.png', path: '/pages/mine/index' },
			],
			maskPlane: '/static/images/投掷选中.png',
			maskText: '纸飞机正在穿过这片风场',
			notchWidth: 26,
			notchDepth: 28,
			notchCurve: 7,
			visualActive: 'home',
			overlayVisible: false,
			navigating: false,
			navigationTimer: null,
		}
	},
	computed: {
		themeClass() {
			return this.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		activeIndex() {
			const index = this.tabs.findIndex(item => item.key === this.visualActive)
			return index === -1 ? 0 : index
		},
		activeTab() {
			return this.tabs[this.activeIndex] || this.tabs[0]
		},
		notchMargin() {
			return this.notchWidth / 2
		},
		activePercent() {
			return ((this.activeIndex + 0.5) / this.tabs.length) * 100
		},
		activeX() {
			return this.clamp(this.activePercent, this.notchMargin, 100 - this.notchMargin)
		},
		tabbarStyle() {
			return {
				'--active-x': `${this.activeX}%`,
				'--tab-count': this.tabs.length,
			}
		},
		tabbarPath() {
			const width = 100
			const height = 64
			const x = this.activeX
			const left = x - this.notchWidth / 2
			const right = x + this.notchWidth / 2
			return `
				M 0 0
				L ${left - this.notchCurve} 0
				C ${left + this.notchCurve} 0, ${left + this.notchCurve} ${this.notchDepth}, ${x} ${this.notchDepth}
				C ${right - this.notchCurve} ${this.notchDepth}, ${right - this.notchCurve} 0, ${right + this.notchCurve} 0
				L ${width} 0
				L ${width} ${height}
				L 0 ${height}
				Z
			`
		},
	},
	watch: {
		active: {
			immediate: true,
			handler(value) {
				if (!this.navigating) {
					this.visualActive = value || 'home'
				}
			},
		},
	},
	beforeUnmount() {
		this.clearNavigationTimer()
	},
	beforeDestroy() {
		this.clearNavigationTimer()
	},
	methods: {
		getTabIcon(item, isActive) {
			if (!item) return ''
			if (item.iconType !== 'image') return item.icon
			return isActive ? item.activeIcon || item.icon : item.icon
		},
		getTabIndex(key) {
			const index = this.tabs.findIndex(item => item.key === key)
			return index === -1 ? 0 : index
		},
		clamp(value, min, max) {
			return Math.min(Math.max(value, min), max)
		},
		clearNavigationTimer() {
			if (this.navigationTimer) {
				clearTimeout(this.navigationTimer)
				this.navigationTimer = null
			}
		},
		switchTo(item) {
			if (!item || item.key === this.active || this.navigating) return

			this.navigating = true
			this.visualActive = item.key
			this.overlayVisible = true
			this.clearNavigationTimer()

			this.navigationTimer = setTimeout(() => {
				uni.reLaunch({
					url: item.path,
				})
			}, 420)
		},
	},
}
</script>

<style scoped>
.tabbar-shell {
	position: fixed;
	left: calc(24rpx + env(safe-area-inset-left));
	right: calc(24rpx + env(safe-area-inset-right));
	bottom: calc(18rpx + env(safe-area-inset-bottom));
	height: 112rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	z-index: 30;
}

.transition-mask {
	position: fixed;
	inset: 0;
	z-index: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(247, 242, 233, 0.34);
	backdrop-filter: blur(10rpx);
	animation: mask-fade 0.22s ease both;
}

.theme-dark .transition-mask {
	background: rgba(15, 20, 22, 0.38);
}

.mask-core {
	padding: 26rpx 30rpx;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.78);
	border: 2rpx solid var(--border);
	box-shadow: 0 20rpx 46rpx rgba(31, 36, 40, 0.14);
	display: flex;
	align-items: center;
	gap: 14rpx;
}

.theme-dark .mask-core {
	background: rgba(20, 28, 32, 0.8);
	box-shadow: 0 20rpx 46rpx rgba(0, 0, 0, 0.22);
}

.mask-plane-image {
	width: 34rpx;
	height: 34rpx;
	animation: plane-pulse 0.9s ease-in-out infinite;
}

.mask-text {
	font-size: 24rpx;
	color: var(--ink);
}

.curved-bg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	filter: drop-shadow(0 18rpx 28rpx rgba(0, 0, 0, 0.12));
}

.curved-bg path {
	fill: rgba(255, 255, 255, 0.94);
	stroke: var(--border);
	stroke-width: 0.6;
}

.theme-dark .curved-bg {
	filter: drop-shadow(0 18rpx 30rpx rgba(0, 0, 0, 0.28));
}

.theme-dark .curved-bg path {
	fill: rgba(18, 26, 30, 0.94);
}

.curved-bubble {
	position: absolute;
	top: -48rpx;
	left: var(--active-x);
	width: 104rpx;
	height: 104rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.94);
	border: 2rpx solid var(--border);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--accent);
	transform: translateX(-50%);
	transition: left 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
	box-shadow: 0 22rpx 36rpx rgba(31, 36, 40, 0.24);
	pointer-events: none;
	z-index: 2;
}

.theme-dark .curved-bubble {
	background: rgba(18, 26, 30, 0.94);
	border-color: rgba(255, 255, 255, 0.08);
	box-shadow: 0 22rpx 40rpx rgba(0, 0, 0, 0.28);
}

.curved-bubble::after {
	content: '';
	position: absolute;
	inset: 12rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(47, 158, 116, 0.25);
	pointer-events: none;
}

.bubble-icon-image {
	width: 46rpx;
	height: 46rpx;
}

.bubble-icon-text {
	font-size: 38rpx;
	line-height: 1;
}

.curved-item {
	flex: 1;
	height: 100%;
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--muted);
	transition: color 0.2s ease;
}

.item-inner {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	transition: transform 0.3s ease, opacity 0.2s ease;
}

.item-icon-image {
	width: 34rpx;
	height: 34rpx;
}

.item-icon-text {
	font-size: 34rpx;
	line-height: 1;
}

.item-label {
	font-size: 18rpx;
	line-height: 1;
	color: currentColor;
}

.curved-item.active {
	color: var(--accent);
}

.curved-item.active .item-inner {
	opacity: 0;
	transform: translateY(16rpx);
}

@keyframes mask-fade {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes plane-pulse {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-4rpx);
	}
}
</style>