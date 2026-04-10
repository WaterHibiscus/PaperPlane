<template>
	<view v-if="visible" :class="['detail-open-overlay', themeClass]">
		<view class="overlay-aura aura-left"></view>
		<view class="overlay-aura aura-right"></view>
		<view class="overlay-grid"></view>

		<view class="transition-stage">
			<view class="burst-ring ring-a"></view>
			<view class="burst-ring ring-b"></view>
			<view class="burst-ring ring-c"></view>

			<view class="plane-stage">
				<view class="wing wing-left"></view>
				<view class="wing wing-right"></view>
				<view class="plane-body">
					<image class="plane-glyph-image" :src="planeIcon" mode="aspectFit" />
				</view>
			</view>

			<view class="sheet-stack">
				<view class="sheet layer-back"></view>
				<view class="sheet layer-mid"></view>
				<view class="sheet layer-front">
					<view class="sheet-pin"></view>
					<view class="sheet-lines">
						<view class="sheet-line short"></view>
						<view class="sheet-line full"></view>
						<view class="sheet-line full"></view>
						<view class="sheet-line medium"></view>
					</view>
				</view>
			</view>
		</view>

		<view class="transition-copy">
			<text class="transition-title">{{ title }}</text>
			<text class="transition-subtitle">{{ subtitle }}</text>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		visible: {
			type: Boolean,
			default: false,
		},
		theme: {
			type: String,
			default: 'light',
		},
		title: {
			type: String,
			default: '\u7EB8\u98DE\u673A\u6B63\u5728\u6253\u5F00',
		},
		subtitle: {
			type: String,
			default: '\u98CE\u91CC\u7684\u6298\u75D5\u6B63\u5728\u5C55\u5F00\u6210\u4E00\u5F20\u4FE1\u7B3A',
		},
	},
	data() {
		return {
			planeIcon: '/static/images/投掷选中.png',
		}
	},
	computed: {
		themeClass() {
			return this.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
	},
}
</script>

<style scoped>
.detail-open-overlay {
	position: fixed;
	inset: 0;
	z-index: 88;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background:
		radial-gradient(circle at 18% 18%, rgba(47, 158, 116, 0.2), transparent 28%),
		radial-gradient(circle at 82% 16%, rgba(242, 122, 75, 0.14), transparent 24%),
		linear-gradient(180deg, rgba(247, 242, 233, 0.92), rgba(238, 244, 241, 0.96));
	backdrop-filter: blur(18rpx);
	overflow: hidden;
}

.theme-dark.detail-open-overlay {
	background:
		radial-gradient(circle at 18% 18%, rgba(47, 158, 116, 0.16), transparent 28%),
		radial-gradient(circle at 82% 16%, rgba(242, 122, 75, 0.08), transparent 24%),
		linear-gradient(180deg, rgba(14, 18, 21, 0.94), rgba(18, 26, 30, 0.98));
}

.overlay-aura {
	position: absolute;
	border-radius: 50%;
	filter: blur(26rpx);
	opacity: 0.72;
}

.aura-left {
	left: 8%;
	top: 16%;
	width: 320rpx;
	height: 320rpx;
	background: radial-gradient(circle, rgba(47, 158, 116, 0.2), transparent 72%);
}

.aura-right {
	right: 10%;
	bottom: 18%;
	width: 260rpx;
	height: 260rpx;
	background: radial-gradient(circle, rgba(242, 122, 75, 0.16), transparent 72%);
}

.overlay-grid {
	position: absolute;
	inset: 0;
	background-image:
		linear-gradient(rgba(47, 158, 116, 0.04) 2rpx, transparent 2rpx),
		linear-gradient(90deg, rgba(47, 158, 116, 0.04) 2rpx, transparent 2rpx);
	background-size: 88rpx 88rpx;
	opacity: 0.55;
}

.transition-stage {
	position: relative;
	width: 420rpx;
	height: 360rpx;
}

.burst-ring {
	position: absolute;
	left: 50%;
	top: 50%;
	border-radius: 50%;
	border: 2rpx dashed rgba(47, 158, 116, 0.16);
	transform: translate(-50%, -50%);
	animation: ring-open 0.8s ease-out both;
}

.ring-a {
	width: 220rpx;
	height: 220rpx;
	animation-delay: 0.02s;
}

.ring-b {
	width: 300rpx;
	height: 300rpx;
	animation-delay: 0.08s;
}

.ring-c {
	width: 380rpx;
	height: 380rpx;
	animation-delay: 0.14s;
}

.plane-stage {
	position: absolute;
	left: 50%;
	top: 40rpx;
	width: 164rpx;
	height: 130rpx;
	margin-left: -82rpx;
	z-index: 3;
	animation: plane-release 0.76s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.wing {
	position: absolute;
	top: 24rpx;
	width: 82rpx;
	height: 62rpx;
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(230, 237, 241, 0.88));
	border: 2rpx solid rgba(28, 36, 40, 0.05);
	box-shadow: 0 12rpx 24rpx rgba(31, 36, 40, 0.1);
}

.wing-left {
	left: 0;
	clip-path: polygon(0 18%, 100% 0, 68% 100%);
	transform: rotate(-8deg);
}

.wing-right {
	right: 0;
	clip-path: polygon(0 0, 100% 18%, 34% 100%);
	transform: rotate(8deg);
}

.plane-body {
	position: absolute;
	left: 50%;
	top: 0;
	width: 72rpx;
	height: 120rpx;
	margin-left: -36rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(223, 232, 238, 0.92));
	border: 2rpx solid rgba(28, 36, 40, 0.05);
	box-shadow: 0 14rpx 28rpx rgba(31, 36, 40, 0.12);
	display: flex;
	align-items: center;
	justify-content: center;
}

.plane-glyph-image {
	width: 44rpx;
	height: 44rpx;
	transform: rotate(-18deg);
}

.sheet-stack {
	position: absolute;
	left: 50%;
	top: 132rpx;
	width: 280rpx;
	height: 194rpx;
	margin-left: -140rpx;
}

.sheet {
	position: absolute;
	inset: 0;
	border-radius: 30rpx;
	border: 2rpx solid rgba(28, 36, 40, 0.05);
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.74), transparent 16%),
		linear-gradient(165deg, rgba(255, 255, 255, 0.94), rgba(249, 244, 235, 0.98) 72%);
	box-shadow: 0 18rpx 34rpx rgba(31, 36, 40, 0.12);
}

.layer-back {
	transform: translateY(20rpx) rotate(-4deg);
	opacity: 0.42;
}

.layer-mid {
	transform: translateY(10rpx) rotate(2deg);
	opacity: 0.72;
}

.layer-front {
	opacity: 0;
	transform: translateY(26rpx) scale(0.88) rotate(-6deg);
	overflow: hidden;
	animation: letter-rise 0.84s 0.14s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.sheet-pin {
	position: absolute;
	left: 18rpx;
	top: 12rpx;
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.82), rgba(210, 65, 71, 0.96) 42%, rgba(134, 23, 34, 1) 100%);
	box-shadow: 0 4rpx 10rpx rgba(124, 34, 41, 0.24);
}

.sheet-lines {
	position: absolute;
	left: 20rpx;
	right: 20rpx;
	top: 30rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.sheet-line {
	height: 10rpx;
	border-radius: 999rpx;
	background: rgba(129, 150, 176, 0.18);
}

.short {
	width: 66%;
	margin-left: 28rpx;
}

.full {
	width: 100%;
}

.medium {
	width: 82%;
}

.transition-copy {
	position: relative;
	z-index: 1;
	margin-top: 24rpx;
	text-align: center;
}

.transition-title {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	color: var(--ink);
}

.transition-subtitle {
	display: block;
	margin-top: 10rpx;
	font-size: 22rpx;
	line-height: 1.6;
	color: var(--muted);
	max-width: 480rpx;
	text-align: center;
}

@keyframes ring-open {
	0% {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.82);
	}
	100% {
		opacity: 0.62;
		transform: translate(-50%, -50%) scale(1);
	}
}

@keyframes plane-release {
	0% {
		opacity: 1;
		transform: translateY(0) scale(1) rotate(0deg);
	}
	55% {
		opacity: 1;
	}
	100% {
		opacity: 0;
		transform: translateY(-46rpx) scale(0.46) rotate(18deg);
	}
}

@keyframes letter-rise {
	0% {
		opacity: 0;
		transform: translateY(26rpx) scale(0.88) rotate(-6deg);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1) rotate(0deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.burst-ring,
	.plane-stage,
	.layer-front {
		animation: none !important;
	}

	.plane-stage {
		opacity: 0;
	}

	.layer-front {
		opacity: 1;
		transform: translateY(0) scale(1) rotate(0deg);
	}
}
</style>
