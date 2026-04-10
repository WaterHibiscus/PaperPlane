<template>
	<view :class="['app-page', 'with-tabbar', 'trending-page', themeClass]">
		<view class="trending-atmosphere">
			<view class="trend-orb orb-left"></view>
			<view class="trend-orb orb-right"></view>
			<view class="trend-path path-one"></view>
			<view class="trend-path path-two"></view>
		</view>

		<view class="trend-hero">
			<view class="hero-copy">
				<text class="hero-kicker">Campus Heatboard</text>
				<text class="hero-title">今天大家最常接住的纸飞机</text>
				<text class="hero-subtitle">{{ heroSubtitle }}</text>
			</view>

			<view class="hero-ticket">
				<text class="hero-ticket-label">实时在榜</text>
				<text class="hero-ticket-value">{{ planes.length }}</text>
				<text class="hero-ticket-note">{{ loading ? '热度正在刷新' : hottestLocationText }}</text>
			</view>

			<view class="hero-metrics">
				<view class="metric-pill">
					<text class="metric-value">{{ totalHeat }}</text>
					<text class="metric-label">累计热度</text>
				</view>
				<view class="metric-pill soft">
					<text class="metric-value">{{ photoPlaneCount }}</text>
					<text class="metric-label">带图纸条</text>
				</view>
				<view class="metric-pill soft">
					<text class="metric-value">{{ hotPlaneCount }}</text>
					<text class="metric-label">有效热榜</text>
				</view>
			</view>

			<view class="hero-actions">
				<view class="refresh-pill" @tap="loadTrending">
					<image class="refresh-icon-image" :src="icons.trendingActive" mode="aspectFit" />
					<text>{{ loading ? '刷新中...' : '刷新热榜' }}</text>
				</view>
				<text class="hero-action-note">点赞权重更高，拾取紧随其后</text>
			</view>
		</view>

		<view v-if="loading && !planes.length" class="trend-empty glass-card">
			<text class="empty-title">热榜生成中</text>
			<text class="empty-desc">正在整理这阵风里最常被接住的纸飞机。</text>
		</view>

		<view v-else-if="!planes.length" class="trend-empty glass-card">
			<text class="empty-title">这里还没有热起来</text>
			<text class="empty-desc">等第一批点赞和拾取出现后，热榜就会在这里慢慢发光。</text>
		</view>

		<view v-else class="trend-board">
			<view class="spotlight-card" @tap="openDetail(featuredEntry.plane)">
				<view class="spotlight-copy">
					<view class="spotlight-topline">
						<view class="spotlight-rank">
							<text class="spotlight-rank-kicker">TOP 1</text>
							<text class="spotlight-rank-label">{{ getHeatLabel(featuredEntry.plane, featuredEntry.rank) }}</text>
						</view>
						<view class="spotlight-meta">
							<view class="spotlight-mood" :style="{ color: getPlaneMood(featuredEntry.plane).color, borderColor: `${getPlaneMood(featuredEntry.plane).color}33` }">
								<image class="spotlight-mood-icon" :src="getPlaneMood(featuredEntry.plane).icon" mode="aspectFit" />
								<text>{{ getPlaneMood(featuredEntry.plane).label }}</text>
							</view>
							<text class="spotlight-time">{{ formatPlaneTime(featuredEntry.plane.createTime) }}</text>
						</view>
					</view>

					<text class="spotlight-title">{{ featuredTitle }}</text>
					<text class="spotlight-content">{{ featuredEntry.plane.content }}</text>

					<view class="spotlight-ribbons">
						<text class="spotlight-ribbon">{{ featuredEntry.plane.locationTag }}</text>
						<text class="spotlight-ribbon">{{ getPlaneAuthorLabelText(featuredEntry.plane) }}</text>
						<text v-if="featuredEntry.plane.imageUrls && featuredEntry.plane.imageUrls.length" class="spotlight-ribbon">{{ featuredEntry.plane.imageUrls.length }} 张图片</text>
					</view>

					<view class="spotlight-stats">
						<view class="spotlight-stat">
							<text class="spotlight-stat-value">{{ featuredEntry.plane.pickCount || 0 }}</text>
							<text class="spotlight-stat-label">拾取</text>
						</view>
						<view class="spotlight-stat">
							<text class="spotlight-stat-value">{{ featuredEntry.plane.likeCount || 0 }}</text>
							<text class="spotlight-stat-label">点赞</text>
						</view>
						<view class="spotlight-stat">
							<text class="spotlight-stat-value">{{ featuredEntry.plane.commentCount || 0 }}</text>
							<text class="spotlight-stat-label">评论</text>
						</view>
					</view>
				</view>

				<view class="spotlight-side">
					<image
						v-if="featuredImage"
						class="spotlight-image"
						:src="featuredImage"
						mode="aspectFill"
						lazy-load
					/>
					<view v-else class="spotlight-stamp" :style="{ color: getPlaneMood(featuredEntry.plane).color, borderColor: `${getPlaneMood(featuredEntry.plane).color}48` }">
						<text class="spotlight-stamp-rank">#1</text>
						<image class="spotlight-stamp-icon" :src="getPlaneMood(featuredEntry.plane).icon" mode="aspectFit" />
					</view>
					<text class="spotlight-heat">{{ getHeatScore(featuredEntry.plane) }} 分热度</text>
				</view>
			</view>

			<view v-if="podiumEntries.length" class="podium-strip">
				<view
					v-for="entry in podiumEntries"
					:key="entry.plane.id"
					class="podium-card glass-card"
					@tap="openDetail(entry.plane)"
				>
					<text class="podium-rank">TOP {{ entry.rank }}</text>
					<text class="podium-location">{{ entry.plane.locationTag }}</text>
					<text class="podium-content">{{ entry.plane.content }}</text>
					<view class="podium-meta">
						<text>{{ getPlaneMood(entry.plane).label }}</text>
						<text>·</text>
						<text>{{ getHeatScore(entry.plane) }} 分</text>
					</view>
				</view>
			</view>

			<view class="ranking-section">
				<view class="ranking-head">
					<view>
						<text class="ranking-kicker">Ranking List</text>
						<text class="ranking-title">完整榜单 Top 50</text>
					</view>
					<text class="ranking-note">{{ rankedEntries.length ? `${rankedEntries.length} 架继续上榜` : '前面的高热纸条已经包揽榜面' }}</text>
				</view>

				<view v-if="rankedEntries.length" class="plane-list">
					<plane-card
						v-for="entry in rankedEntries"
						:key="entry.plane.id"
						:plane="entry.plane"
						:rank="entry.rank"
						@select="openDetail"
					/>
				</view>
			</view>
		</view>

		<detail-open-transition :visible="detailOpenVisible" :theme="appState.theme" />
		<page-transition :visible="pageTransitionVisible" :theme="appState.theme" />
		<app-tabbar active="trending" :theme="appState.theme" />
	</view>
</template>

<script>
import AppTabbar from '../../components/AppTabbar.vue'
import DetailOpenTransition from '../../components/DetailOpenTransition.vue'
import PageTransition from '../../components/PageTransition.vue'
import PlaneCard from '../../components/PlaneCard.vue'
import { appState } from '../../common/app-state.js'
import { getAssetUrl, getTrendingPlanes } from '../../common/api.js'
import detailOpenTransitionMixin from '../../common/detail-open-transition.js'
import pageTransitionMixin from '../../common/page-transition.js'
import { getMoodMeta } from '../../common/moods.js'
import { getPlaneAuthorLabel } from '../../common/utils.js'
import { uiIcons } from '../../common/ui-icons.js'

export default {
	mixins: [pageTransitionMixin, detailOpenTransitionMixin],
	components: {
		AppTabbar,
		DetailOpenTransition,
		PageTransition,
		PlaneCard,
	},
	data() {
		return {
			appState,
			icons: uiIcons,
			planes: [],
			loading: false,
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		scoredEntries() {
			return this.planes.map((plane, index) => ({
				plane,
				rank: index + 1,
				score: this.getHeatScore(plane),
			}))
		},
		featuredEntry() {
			return this.scoredEntries[0] || null
		},
		podiumEntries() {
			return this.scoredEntries.slice(1, 3)
		},
		rankedEntries() {
			return this.scoredEntries.slice(3)
		},
		hotPlaneCount() {
			return this.scoredEntries.filter(entry => entry.score > 0).length
		},
		featuredImage() {
			return this.featuredEntry?.plane?.imageUrls?.length ? getAssetUrl(this.featuredEntry.plane.imageUrls[0]) : ''
		},
		totalHeat() {
			return this.scoredEntries.reduce((total, entry) => total + entry.score, 0)
		},
		photoPlaneCount() {
			return this.planes.filter(plane => plane.imageUrls && plane.imageUrls.length).length
		},
		hottestLocationText() {
			if (!this.planes.length) return '热度会在这里实时更新'
			const counter = this.planes.reduce((result, plane) => {
				const key = plane.locationTag || '未知地点'
				result[key] = (result[key] || 0) + this.getHeatScore(plane)
				return result
			}, {})
			const location = Object.keys(counter).sort((left, right) => counter[right] - counter[left])[0] || '校园风场'
			return `${location} 热度最高`
		},
		heroSubtitle() {
			if (!this.planes.length) {
				return '把今天最常被接住、被回应的纸飞机，整理成一张校园热榜。'
			}
			return `${this.hottestLocationText}，这阵风里最常被接住的纸条都在这里。`
		},
		featuredTitle() {
			if (!this.featuredEntry?.plane) return ''
			if (this.featuredImage) {
				return `${this.featuredEntry.plane.locationTag} 的这一封，正在被很多人停下来读`
			}
			return `今天最热的一架，从 ${this.featuredEntry.plane.locationTag} 起飞`
		},
	},
	onShow() {
		this.loadTrending()
	},
	methods: {
		async loadTrending() {
			this.loading = true
			try {
				this.planes = await getTrendingPlanes()
			} catch (error) {
				uni.showToast({
					title: error.message || '加载失败',
					icon: 'none',
				})
				this.planes = []
			} finally {
				this.loading = false
			}
		},
		getPlaneMood(plane) {
			return getMoodMeta(plane?.mood)
		},
		getPlaneAuthorLabelText(plane) {
			return getPlaneAuthorLabel(plane)
		},
		getHeatScore(plane) {
			return Number(plane?.likeCount || 0) * 2 + Number(plane?.pickCount || 0)
		},
		getHeatLabel(plane, rank = 0) {
			const score = this.getHeatScore(plane)
			if (rank === 1) return score > 0 ? '当前榜首' : '暂列榜首'
			if (score >= 36) return '全场焦点'
			if (score >= 22) return '高热上升'
			if (score >= 10) return '持续升温'
			if (score > 0) return '已经被接住'
			return '等待升温'
		},
		formatPlaneTime(time) {
			if (!time) return ''
			const date = new Date(time)
			const month = `${date.getMonth() + 1}`.padStart(2, '0')
			const day = `${date.getDate()}`.padStart(2, '0')
			const hour = `${date.getHours()}`.padStart(2, '0')
			const minute = `${date.getMinutes()}`.padStart(2, '0')
			return `${month}/${day} ${hour}:${minute}`
		},
		openDetail(plane) {
			this.openPlaneDetail(plane.id)
		},
	},
}
</script>

<style scoped>
.trending-page {
	position: relative;
	overflow-x: hidden;
}

.trending-atmosphere {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
	overflow: hidden;
}

.trend-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(10rpx);
	opacity: 0.88;
}

.orb-left {
	top: 90rpx;
	left: -80rpx;
	width: 240rpx;
	height: 240rpx;
	background: rgba(204, 229, 219, 0.34);
}

.orb-right {
	top: 300rpx;
	right: -90rpx;
	width: 280rpx;
	height: 280rpx;
	background: rgba(255, 217, 191, 0.28);
}

.trend-path {
	position: absolute;
	border-top: 3rpx dashed rgba(145, 159, 174, 0.18);
	border-radius: 999rpx;
}

.path-one {
	top: 160rpx;
	right: 60rpx;
	width: 220rpx;
	height: 84rpx;
	transform: rotate(12deg);
}

.path-two {
	top: 480rpx;
	left: 12rpx;
	width: 180rpx;
	height: 66rpx;
	transform: rotate(-14deg);
}

.trend-hero,
.trend-board {
	position: relative;
	z-index: 1;
}

.trend-hero {
	position: relative;
	margin-bottom: 24rpx;
	padding: 34rpx 28rpx 30rpx;
	border-radius: 38rpx;
	border: 2rpx solid rgba(218, 206, 187, 0.56);
	background:
		radial-gradient(circle at top right, rgba(255, 223, 198, 0.28), transparent 34%),
		radial-gradient(circle at 18% 16%, rgba(194, 220, 255, 0.16), transparent 28%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(249, 244, 236, 0.98));
	box-shadow: 0 22rpx 42rpx rgba(92, 78, 62, 0.08);
	overflow: hidden;
}

.trend-hero::before {
	content: '';
	position: absolute;
	inset: 0;
	background-image:
		repeating-linear-gradient(180deg, transparent 0 48rpx, rgba(154, 144, 125, 0.05) 48rpx 50rpx),
		linear-gradient(125deg, rgba(255, 255, 255, 0.46), transparent 34%);
	opacity: 0.68;
}

.hero-copy,
.hero-ticket,
.hero-metrics,
.hero-actions {
	position: relative;
	z-index: 1;
}

.hero-copy {
	max-width: 470rpx;
}

.hero-kicker {
	display: block;
	font-size: 20rpx;
	letter-spacing: 6rpx;
	text-transform: uppercase;
	color: rgba(103, 114, 120, 0.9);
}

.hero-title {
	display: block;
	margin-top: 14rpx;
	font-size: 44rpx;
	line-height: 1.18;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.hero-subtitle {
	display: block;
	margin-top: 14rpx;
	padding-right: 180rpx;
	font-size: 24rpx;
	line-height: 1.65;
	color: rgba(88, 98, 93, 0.92);
}

.hero-ticket {
	position: absolute;
	right: 24rpx;
	top: 28rpx;
	width: 180rpx;
	padding: 18rpx 18rpx 16rpx;
	border-radius: 26rpx;
	border: 2rpx solid rgba(213, 193, 154, 0.44);
	background: rgba(255, 249, 239, 0.88);
	box-shadow: 0 14rpx 22rpx rgba(121, 97, 73, 0.08);
	transform: rotate(4deg);
}

.hero-ticket-label,
.hero-ticket-note {
	display: block;
	font-size: 18rpx;
	color: rgba(103, 114, 120, 0.86);
}

.hero-ticket-value {
	display: block;
	margin: 10rpx 0 6rpx;
	font-size: 48rpx;
	line-height: 1;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.hero-metrics {
	display: flex;
	gap: 12rpx;
	margin-top: 26rpx;
	padding-right: 204rpx;
}

.metric-pill {
	min-width: 0;
	flex: 1;
	padding: 16rpx 16rpx 14rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.68);
	border: 2rpx solid rgba(218, 206, 187, 0.34);
}

.metric-pill.soft {
	background: rgba(252, 247, 239, 0.82);
}

.metric-value {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.metric-label {
	display: block;
	margin-top: 6rpx;
	font-size: 18rpx;
	color: rgba(103, 114, 120, 0.88);
}

.hero-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-top: 20rpx;
}

.refresh-pill {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	height: 76rpx;
	padding: 0 24rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.72);
	border: 2rpx solid rgba(218, 206, 187, 0.44);
	font-size: 24rpx;
	color: rgba(36, 48, 45, 0.94);
	box-shadow: 0 10rpx 18rpx rgba(31, 36, 40, 0.05);
}

.refresh-icon-image {
	width: 24rpx;
	height: 24rpx;
	display: block;
}

.hero-action-note {
	font-size: 20rpx;
	color: rgba(103, 114, 120, 0.86);
}

.trend-empty {
	position: relative;
	z-index: 1;
	margin-top: 8rpx;
}

.spotlight-card {
	display: flex;
	gap: 24rpx;
	padding: 28rpx;
	border-radius: 40rpx;
	border: 2rpx solid rgba(222, 197, 126, 0.44);
	background:
		radial-gradient(circle at top right, rgba(255, 214, 161, 0.26), transparent 40%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(250, 244, 234, 0.98));
	box-shadow: 0 22rpx 42rpx rgba(110, 94, 69, 0.08);
	overflow: hidden;
}

.spotlight-copy,
.spotlight-side {
	position: relative;
	z-index: 1;
}

.spotlight-copy {
	flex: 1;
	min-width: 0;
}

.spotlight-topline {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16rpx;
}

.spotlight-rank-kicker {
	display: block;
	font-size: 18rpx;
	letter-spacing: 4rpx;
	color: rgba(166, 122, 34, 0.88);
	text-transform: uppercase;
}

.spotlight-rank-label {
	display: block;
	margin-top: 8rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.spotlight-meta {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 10rpx;
}

.spotlight-mood {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	border: 2rpx solid currentColor;
	background: rgba(255, 255, 255, 0.66);
	font-size: 20rpx;
	font-weight: 600;
}

.spotlight-mood-icon {
	width: 20rpx;
	height: 20rpx;
	display: block;
	flex-shrink: 0;
}

.spotlight-time {
	font-size: 20rpx;
	color: rgba(103, 114, 120, 0.86);
}

.spotlight-title {
	display: block;
	margin-top: 18rpx;
	font-size: 34rpx;
	line-height: 1.32;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.spotlight-content {
	display: -webkit-box;
	margin-top: 14rpx;
	font-size: 28rpx;
	line-height: 1.62;
	color: rgba(50, 60, 55, 0.96);
	word-break: break-word;
	-webkit-line-clamp: 4;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.spotlight-ribbons {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-top: 18rpx;
}

.spotlight-ribbon {
	display: inline-flex;
	align-items: center;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.62);
	font-size: 20rpx;
	color: rgba(88, 98, 93, 0.92);
}

.spotlight-stats {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 22rpx;
}

.spotlight-stat {
	min-width: 104rpx;
	padding: 16rpx 18rpx 14rpx;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.68);
	border: 2rpx solid rgba(218, 206, 187, 0.34);
}

.spotlight-stat-value {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.spotlight-stat-label {
	display: block;
	margin-top: 6rpx;
	font-size: 18rpx;
	color: rgba(103, 114, 120, 0.88);
}

.spotlight-side {
	width: 172rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: space-between;
}

.spotlight-image {
	width: 156rpx;
	height: 196rpx;
	border-radius: 28rpx;
	border: 8rpx solid rgba(255, 255, 255, 0.84);
	box-shadow: 0 16rpx 26rpx rgba(106, 92, 71, 0.12);
	transform: rotate(6deg);
}

.spotlight-stamp {
	width: 152rpx;
	height: 152rpx;
	border-radius: 30rpx;
	border: 3rpx dashed currentColor;
	background: rgba(255, 255, 255, 0.44);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	transform: rotate(6deg);
}

.spotlight-stamp-rank {
	font-size: 24rpx;
	font-weight: 700;
}

.spotlight-stamp-icon {
	width: 40rpx;
	height: 40rpx;
	display: block;
}

.spotlight-heat {
	font-size: 20rpx;
	color: rgba(103, 114, 120, 0.9);
}

.podium-strip {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 18rpx;
}

.podium-card {
	padding: 24rpx;
	width: 100%;
	min-width: 0;
	margin: 0;
	box-sizing: border-box;
}

.podium-rank {
	display: block;
	font-size: 18rpx;
	letter-spacing: 4rpx;
	text-transform: uppercase;
	color: var(--accent);
}

.podium-location {
	display: block;
	margin-top: 10rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: var(--ink);
}

.podium-content {
	display: -webkit-box;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.58;
	color: rgba(50, 60, 55, 0.94);
	word-break: break-word;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.podium-meta {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-top: 14rpx;
	font-size: 20rpx;
	color: var(--muted);
}

.ranking-section {
	margin-top: 26rpx;
}

.ranking-head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 18rpx;
}

.ranking-kicker {
	display: block;
	font-size: 18rpx;
	letter-spacing: 4rpx;
	text-transform: uppercase;
	color: rgba(103, 114, 120, 0.84);
}

.ranking-title {
	display: block;
	margin-top: 8rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: var(--ink);
}

.ranking-note {
	font-size: 20rpx;
	color: var(--muted);
	text-align: right;
}

.plane-list {
	position: relative;
}

.theme-dark .trend-path {
	border-top-color: rgba(153, 168, 178, 0.12);
}

.theme-dark .orb-left {
	background: rgba(88, 119, 108, 0.2);
}

.theme-dark .orb-right {
	background: rgba(126, 101, 86, 0.18);
}

.theme-dark .trend-hero {
	border-color: rgba(230, 237, 241, 0.08);
	background:
		radial-gradient(circle at top right, rgba(255, 152, 95, 0.12), transparent 34%),
		radial-gradient(circle at 18% 16%, rgba(54, 192, 141, 0.1), transparent 28%),
		linear-gradient(180deg, rgba(24, 32, 36, 0.95), rgba(18, 24, 27, 0.98));
	box-shadow: 0 22rpx 42rpx rgba(0, 0, 0, 0.2);
}

.theme-dark .trend-hero::before {
	opacity: 0.18;
}

.theme-dark .hero-kicker,
.theme-dark .hero-subtitle,
.theme-dark .hero-ticket-label,
.theme-dark .hero-ticket-note,
.theme-dark .metric-label,
.theme-dark .hero-action-note,
.theme-dark .spotlight-time,
.theme-dark .spotlight-ribbon,
.theme-dark .spotlight-stat-label,
.theme-dark .spotlight-heat,
.theme-dark .podium-meta,
.theme-dark .ranking-kicker,
.theme-dark .ranking-note {
	color: rgba(205, 214, 220, 0.82);
}

.theme-dark .hero-title,
.theme-dark .hero-ticket-value,
.theme-dark .metric-value,
.theme-dark .spotlight-rank-label,
.theme-dark .spotlight-title,
.theme-dark .spotlight-stat-value,
.theme-dark .podium-location,
.theme-dark .ranking-title {
	color: var(--ink);
}

.theme-dark .hero-ticket,
.theme-dark .metric-pill,
.theme-dark .refresh-pill,
.theme-dark .spotlight-card,
.theme-dark .spotlight-mood,
.theme-dark .spotlight-ribbon,
.theme-dark .spotlight-stat,
.theme-dark .spotlight-stamp {
	background: rgba(255, 255, 255, 0.06);
	border-color: rgba(230, 237, 241, 0.08);
}

.theme-dark .hero-ticket {
	box-shadow: 0 14rpx 22rpx rgba(0, 0, 0, 0.24);
}

.theme-dark .refresh-pill {
	color: rgba(232, 238, 242, 0.94);
}

.theme-dark .spotlight-card {
	background:
		radial-gradient(circle at top right, rgba(255, 188, 92, 0.1), transparent 40%),
		linear-gradient(180deg, rgba(24, 32, 36, 0.96), rgba(18, 24, 27, 0.98));
	box-shadow: 0 22rpx 42rpx rgba(0, 0, 0, 0.22);
}

.theme-dark .spotlight-content,
.theme-dark .podium-content {
	color: rgba(232, 238, 242, 0.94);
}

.theme-dark .podium-rank {
	color: var(--accent);
}

.theme-dark .spotlight-image {
	border-color: rgba(255, 255, 255, 0.1);
	box-shadow: 0 16rpx 26rpx rgba(0, 0, 0, 0.22);
}
</style>
