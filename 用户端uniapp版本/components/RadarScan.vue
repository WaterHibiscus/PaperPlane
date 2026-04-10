<template>
	<view class="radar-wrapper">
		<view class="radar">
			<view class="radar-ring ring-one"></view>
			<view class="radar-ring ring-two"></view>
			<view class="radar-ring ring-three"></view>
			<view class="radar-sweep"></view>
			<view class="radar-center"></view>
			<view class="radar-beacon"></view>
		</view>
		<text class="radar-text">正在扫描附近的纸飞机...</text>
	</view>
</template>

<script>
export default {}
</script>

<style scoped>
.radar-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 56rpx 0 36rpx;
}

.radar {
	position: relative;
	width: 360rpx;
	height: 360rpx;
	border-radius: 50%;
	background:
		radial-gradient(circle at center, rgba(47, 158, 116, 0.2), transparent 55%),
		radial-gradient(circle at center, rgba(242, 122, 75, 0.12), transparent 72%);
	border: 2rpx solid rgba(47, 158, 116, 0.18);
	overflow: hidden;
}

.radar-ring {
	position: absolute;
	border-radius: 50%;
	border: 2rpx dashed rgba(47, 158, 116, 0.3);
}

.ring-one {
	inset: 30rpx;
}

.ring-two {
	inset: 78rpx;
}

.ring-three {
	inset: 126rpx;
}

.radar-sweep {
	position: absolute;
	inset: 0;
	border-radius: 50%;
	background: conic-gradient(from 0deg, transparent 0deg, rgba(47, 158, 116, 0.35) 70deg, transparent 70deg);
	animation: sweep 2.6s linear infinite;
}

.radar-center {
	position: absolute;
	left: 168rpx;
	top: 168rpx;
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0 16rpx rgba(47, 158, 116, 0.5);
}

.radar-beacon {
	position: absolute;
	top: 82rpx;
	right: 94rpx;
	width: 18rpx;
	height: 18rpx;
	border-radius: 50%;
	background: var(--accent-2);
	animation: beacon 2.4s ease-in-out infinite;
}

.radar-text {
	margin-top: 28rpx;
	font-size: 24rpx;
	color: var(--muted);
}

@keyframes sweep {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@keyframes beacon {
	0%, 100% {
		transform: scale(1);
		opacity: 0.6;
	}
	50% {
		transform: scale(1.6);
		opacity: 1;
	}
}
</style>
