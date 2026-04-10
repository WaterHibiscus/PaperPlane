<template>
	<view class="mood-tag" :style="{ borderColor: meta.color, color: meta.color }">
		<image class="mood-icon-image" :src="meta.icon" mode="aspectFit" />
		<text class="mood-text">{{ meta.label }}</text>
	</view>
</template>

<script>
import { getMoodMeta } from '../common/moods.js'

export default {
	props: {
		mood: {
			type: String,
			default: 'calm',
		},
	},
	computed: {
		meta() {
			return getMoodMeta(this.mood)
		},
	},
}
</script>

<style scoped>
.mood-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	border: 2rpx solid currentColor;
	background: rgba(255, 255, 255, 0.7);
}

.mood-icon-image {
	width: 22rpx;
	height: 22rpx;
	margin-right: 8rpx;
	flex-shrink: 0;
}

.mood-text {
	font-size: 22rpx;
	line-height: 1;
}
</style>
