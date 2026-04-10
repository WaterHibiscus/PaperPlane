<template>
	<view v-if="visible" :class="['page-transition', themeClass]">
		<view class="transition-aura aura-left"></view>
		<view class="transition-aura aura-right"></view>
		<view class="transition-core">
			<view class="plane-track">
				<view class="track-line line-one"></view>
				<view class="track-line line-two"></view>
				<view class="track-line line-three"></view>
				<image class="plane-icon-image" :src="planeIcon" mode="aspectFit" />
			</view>
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
			default: '正在抵达下一页',
		},
		subtitle: {
			type: String,
			default: '纸飞机正在穿过这片风场',
		},
	},
	computed: {
		themeClass() {
			return this.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
	},
	data() {
		return {
			planeIcon: '/static/images/投掷选中.png',
		}
	},
}
</script>

<style scoped>
.page-transition {
	position: fixed;
	inset: 0;
	z-index: 80;
	display: flex;
	align-items: center;
	justify-content: center;
	background:
		radial-gradient(circle at 18% 18%, rgba(47, 158, 116, 0.2), transparent 28%),
		radial-gradient(circle at 82% 12%, rgba(242, 122, 75, 0.18), transparent 24%),
		linear-gradient(180deg, rgba(247, 242, 233, 0.88), rgba(238, 244, 241, 0.94));
	backdrop-filter: blur(20rpx);
	animation: loader-fade 0.48s ease both;
}

.theme-dark.page-transition {
	background:
		radial-gradient(circle at 18% 18%, rgba(92, 110, 123, 0.2), transparent 28%),
		radial-gradient(circle at 82% 12%, rgba(103, 86, 76, 0.18), transparent 24%),
		linear-gradient(180deg, rgba(15, 20, 22, 0.92), rgba(17, 26, 29, 0.96));
}

.transition-aura {
	position: absolute;
	width: 320rpx;
	height: 320rpx;
	border-radius: 50%;
	filter: blur(18rpx);
	opacity: 0.72;
}

.aura-left {
	left: 8%;
	top: 16%;
	background: radial-gradient(circle, rgba(47, 158, 116, 0.18), transparent 70%);
}

.aura-right {
	right: 10%;
	bottom: 20%;
	background: radial-gradient(circle, rgba(242, 122, 75, 0.16), transparent 70%);
}

.transition-core {
	position: relative;
	z-index: 1;
	width: 420rpx;
	padding: 40rpx 36rpx;
	border-radius: 36rpx;
	text-align: center;
	background: rgba(255, 255, 255, 0.7);
	border: 2rpx solid rgba(28, 36, 40, 0.06);
	box-shadow: 0 24rpx 56rpx rgba(31, 36, 40, 0.14);
}

.theme-dark .transition-core {
	background: rgba(20, 28, 32, 0.74);
	border-color: rgba(230, 237, 241, 0.06);
	box-shadow: 0 24rpx 56rpx rgba(0, 0, 0, 0.24);
}

.plane-track {
	position: relative;
	height: 112rpx;
	margin-bottom: 20rpx;
}

.track-line {
	position: absolute;
	left: 50%;
	height: 4rpx;
	border-radius: 999rpx;
	background: linear-gradient(90deg, transparent, rgba(47, 158, 116, 0.65), rgba(242, 122, 75, 0.65), transparent);
	transform: translateX(-50%);
	animation: track-flow 1.2s linear infinite;
}

.line-one {
	top: 26rpx;
	width: 220rpx;
	opacity: 0.52;
}

.line-two {
	top: 54rpx;
	width: 280rpx;
	animation-duration: 1.5s;
}

.line-three {
	top: 82rpx;
	width: 180rpx;
	opacity: 0.5;
	animation-duration: 1.35s;
}

.plane-icon-image {
	position: absolute;
	left: 50%;
	top: 12rpx;
	width: 54rpx;
	height: 54rpx;
	transform: translateX(-50%);
	animation: plane-fly 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.transition-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: var(--ink);
}

.transition-subtitle {
	display: block;
	margin-top: 12rpx;
	font-size: 22rpx;
	line-height: 1.6;
	color: var(--muted);
}

@keyframes plane-fly {
	0% {
		transform: translateX(-50%) translateY(12rpx) scale(0.94) rotate(-8deg);
		opacity: 0.3;
	}
	35% {
		opacity: 1;
	}
	100% {
		transform: translateX(-50%) translateY(-10rpx) scale(1.04) rotate(0deg);
		opacity: 1;
	}
}

@keyframes track-flow {
	from {
		transform: translateX(-50%) translateX(28rpx);
		opacity: 0.18;
	}
	50% {
		opacity: 0.75;
	}
	to {
		transform: translateX(-50%) translateX(-28rpx);
		opacity: 0.18;
	}
}

@keyframes loader-fade {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
</style>
