<template>
	<view :class="['plane-card', 'glass-card', themeClass, rankToneClass, { 'with-media': previewImage }]" @tap="handleSelect">
		<view class="rank-rail">
			<view :class="['rank-orb', { top: rank <= 3 }]">
				<text class="rank-number">{{ formattedRank }}</text>
			</view>
			<view class="rank-line"></view>
		</view>

		<view class="card-main">
			<view class="card-topline">
				<view class="tag-cluster">
					<mood-tag :mood="plane.mood" />
					<view class="location-pill">
						<text>{{ plane.locationTag }}</text>
					</view>
					<view class="heat-pill">
						<text>{{ heatLabel }}</text>
					</view>
				</view>

				<view class="time-cluster">
					<text class="time">{{ compactTime }}</text>
					<text class="header-author">{{ authorText }}</text>
				</view>
			</view>

			<view class="card-body">
				<view class="copy-block">
					<text class="content-text">{{ plane.content }}</text>
					<view class="meta-row">
						<text>{{ getHeatScore(plane) }} 分热度</text>
						<text>·</text>
						<text>{{ remainText }}</text>
					</view>
				</view>

				<view v-if="previewImage" class="media-tile">
					<image class="media-image" :src="previewImage" mode="aspectFill" lazy-load />
					<view class="media-overlay">
						<text class="media-count">{{ extraImageCount > 0 ? `+${extraImageCount}` : '图片' }}</text>
					</view>
				</view>
			</view>

			<view class="card-footer">
				<view class="stat-pill">
					<text class="stat-value">{{ plane.pickCount }}</text>
					<text class="stat-label">拾取</text>
				</view>
				<view class="stat-pill">
					<text class="stat-value">{{ plane.likeCount }}</text>
					<text class="stat-label">点赞</text>
				</view>
				<view class="stat-pill">
					<text class="stat-value">{{ plane.commentCount }}</text>
					<text class="stat-label">评论</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import MoodTag from './MoodTag.vue'
import { appState } from '../common/app-state.js'
import { getAssetUrl } from '../common/api.js'
import { getPlaneAuthorLabel, getRemainingShort } from '../common/utils.js'

export default {
	components: {
		MoodTag,
	},
	props: {
		plane: {
			type: Object,
			required: true,
		},
		rank: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		themeClass() {
			return appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		formattedRank() {
			return String(this.rank || 0).padStart(2, '0')
		},
		rankToneClass() {
			if (this.rank === 1) return 'rank-top-1'
			if (this.rank === 2) return 'rank-top-2'
			if (this.rank === 3) return 'rank-top-3'
			return 'rank-plain'
		},
		compactTime() {
			if (!this.plane?.createTime) return ''
			const date = new Date(this.plane.createTime)
			const month = `${date.getMonth() + 1}`.padStart(2, '0')
			const day = `${date.getDate()}`.padStart(2, '0')
			const hour = `${date.getHours()}`.padStart(2, '0')
			const minute = `${date.getMinutes()}`.padStart(2, '0')
			return `${month}/${day} ${hour}:${minute}`
		},
		remainText() {
			return getRemainingShort(this.plane.expireTime)
		},
		authorText() {
			return getPlaneAuthorLabel(this.plane)
		},
		previewImage() {
			return this.plane?.imageUrls?.length ? getAssetUrl(this.plane.imageUrls[0]) : ''
		},
		extraImageCount() {
			return Math.max((this.plane?.imageUrls?.length || 0) - 1, 0)
		},
		heatLabel() {
			const score = this.getHeatScore(this.plane)
			if (score >= 36) return '全场焦点'
			if (score >= 22) return '高热'
			if (score >= 10) return '升温中'
			if (score > 0) return '上榜中'
			return '待升温'
		},
	},
	methods: {
		getHeatScore(plane) {
			return Number(plane?.likeCount || 0) * 2 + Number(plane?.pickCount || 0)
		},
		handleSelect() {
			this.$emit('select', this.plane)
		},
	},
}
</script>

<style scoped>
.plane-card {
	display: flex;
	gap: 20rpx;
	padding: 24rpx 24rpx 22rpx;
	margin-bottom: 18rpx;
}

.rank-rail {
	width: 84rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-shrink: 0;
	padding-top: 4rpx;
}

.rank-orb {
	width: 70rpx;
	height: 70rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.8);
	border: 2rpx solid rgba(28, 36, 40, 0.06);
	box-shadow: 0 10rpx 18rpx rgba(31, 36, 40, 0.05);
}

.rank-orb.top {
	background: linear-gradient(135deg, var(--accent), var(--accent-2));
	border-color: transparent;
	box-shadow: 0 14rpx 24rpx rgba(47, 158, 116, 0.2);
}

.rank-number {
	font-size: 24rpx;
	font-weight: 700;
	color: var(--ink);
}

.rank-orb.top .rank-number {
	color: #ffffff;
}

.rank-line {
	flex: 1;
	width: 4rpx;
	margin-top: 12rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, rgba(47, 158, 116, 0.28), rgba(47, 158, 116, 0));
}

.card-main {
	flex: 1;
	min-width: 0;
}

.card-topline {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}

.tag-cluster {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10rpx;
	min-width: 0;
	flex: 1;
}

.location-pill,
.heat-pill {
	display: inline-flex;
	align-items: center;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.62);
	font-size: 20rpx;
	color: var(--muted);
}

.heat-pill {
	background: rgba(47, 158, 116, 0.12);
	color: var(--accent);
}

.time-cluster {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8rpx;
	flex-shrink: 0;
	max-width: 220rpx;
}

.time,
.header-author,
.meta-row {
	font-size: 20rpx;
	color: var(--muted);
}

.header-author {
	max-width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.card-body {
	display: flex;
	gap: 18rpx;
	margin-top: 18rpx;
}

.copy-block {
	flex: 1;
	min-width: 0;
}

.content-text {
	display: -webkit-box;
	font-size: 28rpx;
	line-height: 1.62;
	color: var(--ink);
	word-break: break-word;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
}

.meta-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8rpx;
	margin-top: 14rpx;
}

.media-tile {
	position: relative;
	width: 124rpx;
	height: 124rpx;
	flex-shrink: 0;
	border-radius: 24rpx;
	overflow: hidden;
	background: rgba(238, 241, 239, 0.92);
	box-shadow: 0 12rpx 20rpx rgba(31, 36, 40, 0.08);
}

.media-image {
	width: 100%;
	height: 100%;
}

.media-overlay {
	position: absolute;
	left: 10rpx;
	right: 10rpx;
	bottom: 10rpx;
	display: flex;
	justify-content: flex-end;
}

.media-count {
	padding: 6rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(15, 20, 22, 0.54);
	font-size: 18rpx;
	color: rgba(255, 255, 255, 0.94);
}

.card-footer {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-top: 18rpx;
}

.stat-pill {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 12rpx;
	border-radius: 16rpx;
	background: rgba(255, 255, 255, 0.56);
	border: 2rpx solid var(--border);
}

.stat-value {
	font-size: 22rpx;
	font-weight: 700;
	color: var(--ink);
}

.stat-label {
	font-size: 18rpx;
	color: var(--muted);
}

.theme-dark .rank-orb {
	background: rgba(255, 255, 255, 0.06);
	border-color: rgba(230, 237, 241, 0.06);
}

.theme-dark .location-pill,
.theme-dark .stat-pill,
.theme-dark .media-tile {
	background: rgba(255, 255, 255, 0.05);
}

.theme-dark .heat-pill {
	background: rgba(54, 192, 141, 0.16);
}

.theme-dark .media-count {
	background: rgba(0, 0, 0, 0.42);
}
</style>
