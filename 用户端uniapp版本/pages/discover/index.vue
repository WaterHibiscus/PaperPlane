<template>
	<view :class="['app-page', 'with-tabbar', 'discover-page', themeClass]">
		<view class="discover-atmosphere">
			<view class="atmosphere-orb orb-a"></view>
			<view class="atmosphere-orb orb-b"></view>
			<view class="atmosphere-orb orb-c"></view>
			<view class="flight-path flight-path-a"></view>
			<view class="flight-path flight-path-b"></view>
		</view>

		<view class="content-area">
			<view class="discover-head">
				<view class="discover-head-main">
					<text class="discover-kicker">Campus Air Mail</text>
					<text class="discover-title">发现正在路过的纸飞机</text>
					<text class="discover-subtitle">{{ discoverSubtitle }}</text>
				</view>
				<view class="discover-ticket">
					<text class="discover-ticket-label">{{ discoverTicketLabel }}</text>
					<text class="discover-ticket-value">{{ filteredPlanes.length }}</text>
					<text class="discover-ticket-note">{{ discoverTicketNote }}</text>
				</view>
				<view class="discover-ribbon-row">
					<view class="discover-ribbon">
						<text>{{ featuredStatusText }}</text>
					</view>
					<view class="discover-ribbon soft">
						<text>{{ mostActiveLocationText }}</text>
					</view>
				</view>
			</view>

			<view
				v-if="toolbarPinned"
				class="discover-toolbar-placeholder"
				:style="{ height: `${toolbarHeight}px` }"
			></view>
			<view
				:class="['discover-toolbar', { 'is-pinned': toolbarPinned }]"
				:style="{ '--toolbar-fixed-top': `${toolbarFixedTop}px` }"
			>
				<view class="search-panel">
					<view class="search-box">
						<image class="search-box-icon" :src="icons.search" mode="aspectFit" />
						<input
							v-model="query"
							class="search-input"
							placeholder="搜索纸飞机内容或降落点"
							placeholder-class="placeholder-text"
						/>
					</view>
				</view>

				<scroll-view class="mood-strip" scroll-x="true">
					<view class="mood-strip-row">
						<view
							v-for="filter in moodFilters"
							:key="filter.value"
							:class="['mood-chip', { 'is-active': activeMood === filter.value }]"
							:style="getMoodChipStyle(filter.value)"
							@tap="setMoodFilter(filter.value)"
						>
							<image class="mood-chip-icon" :src="getMoodFilterMeta(filter.value).icon" mode="aspectFit" />
							<text>{{ filter.label }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<view v-if="loading" class="note-grid">
				<view
					v-for="index in 4"
					:key="`skeleton-${index}`"
					class="note-item"
					:style="getNoteItemStyle(index - 1, `skeleton-${index}`, 'calm')"
				>
					<view class="stack-sheet stack-sheet-a"></view>
					<view class="stack-sheet stack-sheet-b"></view>
					<view :class="['plane-card', 'plane-skeleton']">
						<view class="note-clip">
							<svg class="note-clip-svg" viewBox="0 0 48 96" aria-hidden="true">
								<path class="clip-shadow" d="M29 7 C17 7 11 17 11 28 V67 C11 82 20 91 31 91 C41 91 48 82 48 69 V30 C48 17 40 10 31 10 C22 10 16 17 16 28 V64 C16 74 21 81 29 81 C37 81 42 75 42 67 V37" />
								<path class="clip-main" d="M27 5 C15 5 9 16 9 27 V66 C9 82 19 92 31 92 C43 92 50 82 50 68 V28 C50 14 41 8 30 8 C19 8 13 16 13 27 V64 C13 76 20 84 30 84 C40 84 46 77 46 67 V34" />
								<path class="clip-inner-line" d="M22 10 C14 10 10 18 10 28 V64 C10 77 18 86 28 87" />
							</svg>
						</view>
						<view class="note-tape tape-left"></view>
						<view class="note-tape tape-right"></view>
						<view class="paper-grain"></view>
						<view class="paper-lines"></view>
						<view class="plane-card-inner">
							<view class="skeleton-top">
								<view class="skeleton-icon"></view>
								<view class="skeleton-time"></view>
							</view>
							<view class="skeleton-line short"></view>
							<view class="skeleton-line"></view>
							<view class="skeleton-line"></view>
							<view class="skeleton-footer">
								<view class="skeleton-tag"></view>
								<view class="skeleton-meta"></view>
							</view>
						</view>
						<view class="paper-corner"></view>
					</view>
				</view>
			</view>

			<view v-else-if="filteredPlanes.length" class="discover-board">
				<view
					v-if="featuredPlane"
					class="featured-plane"
					:style="getFeaturedCardStyle(featuredPlane)"
					@tap="openDetail(featuredPlane)"
				>
					<view class="featured-plane-main">
						<view class="featured-plane-top">
							<view
								class="featured-plane-badge"
								:style="{ color: getPlaneMood(featuredPlane).color, borderColor: `${getPlaneMood(featuredPlane).color}33` }"
							>
								<image class="featured-mood-icon" :src="getPlaneMood(featuredPlane).icon" mode="aspectFit" />
								<text>{{ getPlaneMood(featuredPlane).label }}</text>
							</view>
							<text class="featured-plane-time">{{ formatPlaneTime(featuredPlane.createTime) }}</text>
						</view>
						<text class="featured-plane-title">{{ getFeaturedTitle(featuredPlane) }}</text>
						<text class="featured-plane-text">{{ featuredPlane.content }}</text>
						<view class="featured-plane-meta">
							<text>{{ getPlaneAuthorLabelText(featuredPlane) }}</text>
							<text class="featured-dot">·</text>
							<text>{{ featuredPlane.locationTag }}</text>
							<text v-if="featuredPlane.imageUrls && featuredPlane.imageUrls.length" class="featured-dot">·</text>
							<text v-if="featuredPlane.imageUrls && featuredPlane.imageUrls.length">{{ featuredPlane.imageUrls.length }} 张随手拍</text>
						</view>
						<view class="featured-plane-stats">
							<view class="featured-stat">
								<text class="featured-stat-value">{{ featuredPlane.pickCount || 0 }}</text>
								<text class="featured-stat-label">拾取</text>
							</view>
							<view class="featured-stat">
								<text class="featured-stat-value">{{ featuredPlane.likeCount || 0 }}</text>
								<text class="featured-stat-label">点赞</text>
							</view>
							<view class="featured-stat">
								<text class="featured-stat-value">{{ featuredPlane.commentCount || 0 }}</text>
								<text class="featured-stat-label">回复</text>
							</view>
						</view>
					</view>
					<view class="featured-plane-side">
						<image
							v-if="featuredPlane.imageUrls && featuredPlane.imageUrls.length"
							class="featured-plane-image"
							:src="getAssetUrl(featuredPlane.imageUrls[0])"
							mode="aspectFill"
						/>
						<view
							v-else
							class="featured-plane-stamp"
							:style="{ color: getPlaneMood(featuredPlane).color, borderColor: `${getPlaneMood(featuredPlane).color}48` }"
						>
							<image class="featured-plane-stamp-icon" :src="getPlaneMood(featuredPlane).icon" mode="aspectFit" />
							<text class="featured-plane-stamp-label">{{ getPlaneMood(featuredPlane).label }}</text>
						</view>
						<view class="featured-plane-route">
							<text>{{ getPlaneStatusLabel(featuredPlane) }}</text>
						</view>
					</view>
				</view>

				<view v-if="secondaryPlanes.length" class="note-grid compact-grid lively-grid">
					<view
						v-for="(plane, index) in secondaryPlanes"
						:key="plane.id"
						class="note-item"
						:class="[`variant-${getPlaneVariant(plane, index)}`, { 'has-media': plane.imageUrls && plane.imageUrls.length, 'airy-card': index % 3 === 1 }]"
						:style="getNoteItemStyle(index, plane.id, plane.mood, plane)"
					>
						<view class="stack-sheet stack-sheet-a"></view>
						<view class="stack-sheet stack-sheet-b"></view>
						<view
							:class="['plane-card', `variant-${getPlaneVariant(plane, index)}`, { 'has-media': plane.imageUrls && plane.imageUrls.length }]"
							@tap="openDetail(plane)"
						>
							<view v-if="isQuoteVariant(plane, index)" class="plane-quote-mark">“</view>
							<view
								v-if="isDiaryVariant(plane, index)"
								class="plane-side-label"
								:style="{ color: getPlaneMood(plane).color }"
							>
								<text>{{ getPlaneMood(plane).label }}</text>
							</view>
							<view class="note-clip">
								<svg class="note-clip-svg" viewBox="0 0 48 96" aria-hidden="true">
									<path class="clip-shadow" d="M29 7 C17 7 11 17 11 28 V67 C11 82 20 91 31 91 C41 91 48 82 48 69 V30 C48 17 40 10 31 10 C22 10 16 17 16 28 V64 C16 74 21 81 29 81 C37 81 42 75 42 67 V37" />
									<path class="clip-main" d="M27 5 C15 5 9 16 9 27 V66 C9 82 19 92 31 92 C43 92 50 82 50 68 V28 C50 14 41 8 30 8 C19 8 13 16 13 27 V64 C13 76 20 84 30 84 C40 84 46 77 46 67 V34" />
									<path class="clip-inner-line" d="M22 10 C14 10 10 18 10 28 V64 C10 77 18 86 28 87" />
								</svg>
							</view>
							<view class="note-tape tape-left"></view>
							<view class="note-tape tape-right"></view>
							<view class="paper-grain"></view>
							<view class="paper-lines"></view>
							<view class="plane-card-inner">
								<view class="plane-card-top">
									<view class="plane-mood-icon" :style="{ color: getPlaneMood(plane).color }">
										<image class="plane-mood-icon-image" :src="getPlaneMood(plane).icon" mode="aspectFit" />
									</view>
									<view class="plane-meta-side">
										<view class="plane-time-chip">
											<text>{{ formatPlaneTime(plane.createTime) }}</text>
										</view>
										<text class="plane-top-author">{{ getPlaneAuthorLabelText(plane) }}</text>
									</view>
								</view>
								<view class="plane-stamp-row">
									<view
										class="plane-stamp-chip"
										:style="{ color: getPlaneMood(plane).color, borderColor: `${getPlaneMood(plane).color}33` }"
									>
										<text>{{ getPlaneMood(plane).label }}</text>
									</view>
									<text class="plane-status-hint">{{ getPlaneStatusLabel(plane) }}</text>
								</view>
								<view v-if="shouldShowMediaPreview(plane, index)" class="plane-photo-frame">
									<image class="plane-photo-image" :src="getAssetUrl(plane.imageUrls[0])" mode="aspectFill" />
									<text class="plane-photo-caption">随手拍 · {{ plane.imageUrls.length }} 张</text>
								</view>
								<text
									:class="['plane-text', { 'is-large': isQuoteVariant(plane, index), 'is-tight': isDiaryVariant(plane, index) }]"
								>
									{{ plane.content }}
								</text>
								<view class="plane-footer">
									<view class="plane-footer-left">
										<view class="plane-location">
											<text>{{ plane.locationTag }}</text>
										</view>
									</view>
									<view
										v-if="plane.imageUrls && plane.imageUrls.length && !shouldShowMediaPreview(plane, index)"
										class="plane-media-badge"
									>
										<image class="plane-media-thumb" :src="getAssetUrl(plane.imageUrls[0])" mode="aspectFill" />
										<text class="plane-media-count">{{ plane.imageUrls.length }}</text>
									</view>
								</view>
								<view class="plane-stats-row">
									<view class="plane-stat-chip accent">
										<text>{{ getHeatLabel(plane) }}</text>
									</view>
									<view class="plane-stat-chip">
										<text>捡 {{ plane.pickCount || 0 }}</text>
									</view>
									<view class="plane-stat-chip">
										<text>评 {{ plane.commentCount || 0 }}</text>
									</view>
								</view>
							</view>
							<view class="paper-corner"></view>
						</view>
					</view>
				</view>
			</view>

			<view v-else class="glass-card empty-card custom-empty">
				<text class="empty-title">这阵风里暂时没有对应的纸飞机</text>
				<text class="empty-desc">换个关键词，或者切换一下情绪筛选，说不定下一封就刚好落在你眼前。</text>
			</view>
		</view>

		<detail-open-transition :visible="detailOpenVisible" :theme="appState.theme" />
		<page-transition :visible="pageTransitionVisible" :theme="appState.theme" />
		<app-tabbar active="discover" :theme="appState.theme" />
	</view>
</template>

<script>
import AppTabbar from '../../components/AppTabbar.vue'
import DetailOpenTransition from '../../components/DetailOpenTransition.vue'
import PageTransition from '../../components/PageTransition.vue'
import { appState, fetchLocations } from '../../common/app-state.js'
import { getAssetUrl, getPlanes } from '../../common/api.js'
import { getPlaneAuthorLabel } from '../../common/utils.js'
import { getMoodMeta, moodFilters } from '../../common/moods.js'
import detailOpenTransitionMixin from '../../common/detail-open-transition.js'
import pageTransitionMixin from '../../common/page-transition.js'
import { uiIcons } from '../../common/ui-icons.js'

const ALL_MOOD_META = {
	label: '全部',
	icon: uiIcons.emotion,
	color: '#7d8b8a',
}

export default {
	mixins: [pageTransitionMixin, detailOpenTransitionMixin],
	components: {
		AppTabbar,
		DetailOpenTransition,
		PageTransition,
	},
	data() {
		return {
			appState,
			icons: uiIcons,
			planes: [],
			loading: false,
			query: '',
			activeMood: 'all',
			pageScrollTop: 0,
			toolbarPinned: false,
			toolbarHeight: 0,
			toolbarAnchorTop: 0,
			toolbarFixedTop: 0,
			moodFilters,
			cardPalette: [
				{
					base: 'rgba(250, 247, 238, 0.98)',
					wash: 'rgba(194, 220, 255, 0.26)',
					glow: 'rgba(255, 255, 255, 0.92)',
					rule: 'rgba(129, 150, 176, 0.12)',
					tape: 'rgba(245, 232, 198, 0.82)',
				},
				{
					base: 'rgba(255, 246, 241, 0.98)',
					wash: 'rgba(255, 214, 194, 0.24)',
					glow: 'rgba(255, 255, 255, 0.94)',
					rule: 'rgba(179, 145, 131, 0.12)',
					tape: 'rgba(247, 226, 205, 0.82)',
				},
				{
					base: 'rgba(244, 251, 241, 0.98)',
					wash: 'rgba(185, 235, 202, 0.24)',
					glow: 'rgba(255, 255, 255, 0.94)',
					rule: 'rgba(120, 161, 132, 0.12)',
					tape: 'rgba(231, 236, 201, 0.84)',
				},
				{
					base: 'rgba(250, 244, 252, 0.98)',
					wash: 'rgba(229, 204, 245, 0.24)',
					glow: 'rgba(255, 255, 255, 0.94)',
					rule: 'rgba(157, 137, 171, 0.12)',
					tape: 'rgba(240, 226, 210, 0.8)',
				},
			],
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		filteredPlanes() {
			const keyword = this.query.trim().toLowerCase()
			return this.planes.filter(item => {
				const matchesMood = this.activeMood === 'all' || item.mood === this.activeMood
				if (!matchesMood) return false
				if (!keyword) return true
				return item.content.toLowerCase().includes(keyword) || item.locationTag.toLowerCase().includes(keyword)
			})
		},
		featuredPlane() {
			return this.filteredPlanes[0] || null
		},
		secondaryPlanes() {
			if (!this.featuredPlane) return []
			return this.filteredPlanes.filter(item => item.id !== this.featuredPlane.id)
		},
		discoverSubtitle() {
			const keyword = this.query.trim()
			if (keyword) {
				return `和“${keyword}”有关的纸飞机，正在这里慢慢降落。`
			}
			if (this.activeMood !== 'all') {
				return `筛一筛${this.getMoodFilterMeta(this.activeMood).label}的心情，看看此刻校园里谁在和你共鸣。`
			}
			return '把今天的心情、偶遇和没说完的话，留在风经过的地方。'
		},
		discoverTicketLabel() {
			return this.activeMood === 'all' ? '正在漂流' : this.getMoodFilterMeta(this.activeMood).label
		},
		discoverTicketNote() {
			if (!this.filteredPlanes.length) return '风里暂时安静'
			if (this.query.trim()) return '与你的搜索有关'
			return `${this.filteredPlanes.length} 封纸条在路上`
		},
		featuredStatusText() {
			if (!this.featuredPlane) return '风里暂时没有新的纸条'
			return this.getPlaneStatusLabel(this.featuredPlane)
		},
		mostActiveLocationText() {
			const location = this.getMostActiveLocation()
			return location ? `${location} 现在最热闹` : '校园里的风正在缓慢流动'
		},
	},
	async onShow() {
		await fetchLocations()
		await this.loadPlanes()
		this.scheduleMeasureToolbar()
	},
	onReady() {
		this.toolbarFixedTop = this.getToolbarFixedTop()
		this.scheduleMeasureToolbar()
	},
	onPageScroll(event) {
		this.pageScrollTop = event.scrollTop || 0
		this.syncToolbarPinned()
	},
	methods: {
		getPlaneMood(plane) {
			return getMoodMeta(plane.mood)
		},
		getMoodFilterMeta(value) {
			return value === 'all' ? ALL_MOOD_META : getMoodMeta(value)
		},
		getMoodChipStyle(value) {
			const meta = this.getMoodFilterMeta(value)
			return {
				'--chip-accent': meta.color,
				'--chip-soft': `${meta.color}18`,
			}
		},
		setMoodFilter(value) {
			this.activeMood = value
			this.scheduleMeasureToolbar()
		},
		getPlaneAuthorLabelText(plane) {
			return getPlaneAuthorLabel(plane)
		},
		getAssetUrl,
		getNoteItemStyle(index, seedSource, mood, plane) {
			const variant = plane ? this.getPlaneVariant(plane, index) : 'note'
			let cardHeight = '336rpx'
			if (variant === 'quote') {
				cardHeight = '352rpx'
			} else if (variant === 'diary') {
				cardHeight = '384rpx'
			} else if (plane?.imageUrls?.length) {
				cardHeight = '352rpx'
			} else if (index % 3 === 1) {
				cardHeight = '352rpx'
			}
			return {
				...this.getNoteStyle(index, seedSource),
				...this.getCardStyle(index, mood),
				'--card-height': cardHeight,
			}
		},
		getFeaturedCardStyle(plane) {
			const moodMeta = getMoodMeta(plane.mood)
			return {
				'--featured-accent': moodMeta.color,
				'--featured-soft': `${moodMeta.color}18`,
				'--featured-strong': `${moodMeta.color}32`,
			}
		},
		getSeedNumber(seedSource) {
			const input = String(seedSource || '')
			let hash = 0
			for (let index = 0; index < input.length; index += 1) {
				hash = (hash * 31 + input.charCodeAt(index)) % 1000003
			}
			return hash
		},
		getNoteStyle(index, seedSource) {
			const hash = this.getSeedNumber(`${seedSource}-${index}`)
			const baseOffset = [0, 20, 10, 30][index % 4]
			const extraOffset = hash % 12
			const tiltBase = ((hash % 440) / 100) - 2.2
			const tilt = tiltBase >= 0 ? Math.max(tiltBase, 0.35) : Math.min(tiltBase, -0.35)
			const shift = ((Math.floor(hash / 17) % 16) - 8) * 1.2
			const stackAOffsetX = -(3 + (hash % 4))
			const stackAOffsetY = 5 + (hash % 4)
			const stackBOffsetX = 3 + ((hash >> 3) % 4)
			const stackBOffsetY = 10 + ((hash >> 5) % 4)
			const stackARotate = tilt - (0.18 + ((hash >> 2) % 14) / 100)
			const stackBRotate = tilt + (0.24 + ((hash >> 4) % 14) / 100)
			return {
				'--note-offset': `${baseOffset + extraOffset}rpx`,
				'--note-tilt': `${tilt.toFixed(2)}deg`,
				'--note-shift': `${shift.toFixed(1)}rpx`,
				'--stack-a-x': `${stackAOffsetX}rpx`,
				'--stack-a-y': `${stackAOffsetY}rpx`,
				'--stack-b-x': `${stackBOffsetX}rpx`,
				'--stack-b-y': `${stackBOffsetY}rpx`,
				'--stack-a-rotate': `${stackARotate.toFixed(2)}deg`,
				'--stack-b-rotate': `${stackBRotate.toFixed(2)}deg`,
			}
		},
		getCardStyle(index, mood) {
			const palette = this.cardPalette[index % this.cardPalette.length]
			const moodMeta = getMoodMeta(mood)
			const hash = this.getSeedNumber(`${mood}-${index}`)
			const leftTilt = ((hash % 180) / 30 - 3).toFixed(2)
			const rightTilt = (((hash >> 3) % 180) / 30 - 3).toFixed(2)
			const leftOffset = 24 + (hash % 16)
			const rightOffset = 22 + ((hash >> 4) % 16)
			return {
				'--paper-base': palette.base,
				'--paper-wash': palette.wash,
				'--paper-glow': palette.glow,
				'--paper-rule': palette.rule,
				'--paper-tape': palette.tape,
				'--paper-border': `${moodMeta.color}20`,
				'--paper-shadow': `${moodMeta.color}12`,
				'--stack-base': palette.base,
				'--stack-border': `${moodMeta.color}16`,
				'--tape-left-tilt': `${leftTilt}deg`,
				'--tape-right-tilt': `${rightTilt}deg`,
				'--tape-left-offset': `${leftOffset}rpx`,
				'--tape-right-offset': `${rightOffset}rpx`,
			}
		},
		getPlaneVariant(plane, index) {
			const contentLength = String(plane?.content || '').length
			const heatScore = this.getHeatScore(plane)
			if (contentLength <= 28 || index % 5 === 1) return 'quote'
			if (heatScore >= 18 || index % 4 === 2) return 'diary'
			return 'note'
		},
		shouldShowMediaPreview() {
			return false
		},
		isQuoteVariant(plane, index) {
			return this.getPlaneVariant(plane, index) === 'quote'
		},
		isDiaryVariant(plane, index) {
			return this.getPlaneVariant(plane, index) === 'diary'
		},
		getHeatScore(plane) {
			const likeCount = Number(plane?.likeCount || 0)
			const pickCount = Number(plane?.pickCount || 0)
			const commentCount = Number(plane?.commentCount || 0)
			return likeCount * 2 + pickCount + commentCount * 3
		},
		getHeatLabel(plane) {
			const score = this.getHeatScore(plane)
			if (score >= 28) return '热度上升'
			if (score >= 18) return '有人共鸣'
			if (plane?.imageUrls?.length) return '带图纸条'
			return '刚刚路过'
		},
		getPlaneStatusLabel(plane) {
			const score = this.getHeatScore(plane)
			if (score >= 28) return '正在被很多人轻轻接住'
			if (score >= 18) return '已经有人停下来读了很久'
			if (plane?.commentCount) return '已经收到回应'
			if (plane?.imageUrls?.length) return '还带着一张随手拍'
			return '刚刚被风送到这里'
		},
		getFeaturedTitle(plane) {
			if (!plane) return ''
			if (plane.imageUrls?.length) {
				return `${plane.locationTag} 捎来的一点现场感`
			}
			const score = this.getHeatScore(plane)
			if (score >= 24) return '这封纸条正在被很多人接住'
			if (score >= 16) return `${this.getPlaneMood(plane).label} 正在悄悄扩散`
			return `${this.getPlaneMood(plane).label} 的一句轻声路过`
		},
		getMostActiveLocation() {
			if (!this.filteredPlanes.length) return ''
			const counter = this.filteredPlanes.reduce((result, item) => {
				const key = item.locationTag || '未知地点'
				result[key] = (result[key] || 0) + 1
				return result
			}, {})
			return Object.keys(counter).sort((left, right) => counter[right] - counter[left])[0] || ''
		},
		getToolbarFixedTop() {
			const systemInfo = uni.getSystemInfoSync()
			const safeTop = systemInfo.safeAreaInsets?.top || 0
			return safeTop + this.rpxToPx(8)
		},
		rpxToPx(value) {
			const systemInfo = uni.getSystemInfoSync()
			return (systemInfo.windowWidth || 375) * Number(value || 0) / 750
		},
		scheduleMeasureToolbar() {
			this.$nextTick(() => {
				setTimeout(() => {
					this.measureToolbar()
				}, 0)
			})
		},
		measureToolbar() {
			const query = uni.createSelectorQuery().in(this)
			const target = this.toolbarPinned ? '.discover-toolbar-placeholder' : '.discover-toolbar'
			query.select(target).boundingClientRect()
			query.exec(result => {
				const rect = result && result[0]
				if (!rect) return
				this.toolbarHeight = rect.height || 0
				this.toolbarFixedTop = this.getToolbarFixedTop()
				this.toolbarAnchorTop = (rect.top || 0) + this.pageScrollTop - this.toolbarFixedTop
				this.syncToolbarPinned()
			})
		},
		syncToolbarPinned() {
			if (!this.toolbarHeight) return
			this.toolbarPinned = this.pageScrollTop >= this.toolbarAnchorTop
		},
		async loadPlanes() {
			this.loading = true
			try {
				const data = await getPlanes()
				this.planes = data
			} catch (error) {
				this.planes = []
				uni.showToast({
					title: error.message || '加载失败',
					icon: 'none',
				})
			} finally {
				this.loading = false
				this.scheduleMeasureToolbar()
			}
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
.discover-page {
	position: relative;
	padding-top: calc(env(safe-area-inset-top) + 18rpx);
	overflow-x: hidden;
}

.content-area {
	position: relative;
	z-index: 2;
	padding-top: 12rpx;
}

.discover-atmosphere {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
	overflow: hidden;
}

.atmosphere-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(8rpx);
	opacity: 0.9;
	animation: orb-float 14s ease-in-out infinite;
}

.orb-a {
	top: 80rpx;
	right: -90rpx;
	width: 280rpx;
	height: 280rpx;
	background: rgba(255, 208, 181, 0.34);
}

.orb-b {
	top: 360rpx;
	left: -120rpx;
	width: 300rpx;
	height: 300rpx;
	background: rgba(176, 225, 204, 0.24);
	animation-delay: -5s;
}

.orb-c {
	top: 760rpx;
	right: -80rpx;
	width: 240rpx;
	height: 240rpx;
	background: rgba(194, 220, 255, 0.24);
	animation-delay: -9s;
}

.flight-path {
	position: absolute;
	border-top: 3rpx dashed rgba(129, 150, 176, 0.18);
	border-radius: 999rpx;
	opacity: 0.75;
}

.flight-path-a {
	top: 162rpx;
	right: 110rpx;
	width: 210rpx;
	height: 84rpx;
	transform: rotate(8deg);
}

.flight-path-b {
	top: 620rpx;
	left: 36rpx;
	width: 180rpx;
	height: 72rpx;
	transform: rotate(-14deg);
}

.discover-head {
	position: relative;
	margin-bottom: 22rpx;
	padding: 32rpx 28rpx 28rpx;
	border-radius: 36rpx;
	border: 2rpx solid rgba(214, 205, 188, 0.56);
	background:
		radial-gradient(circle at top right, rgba(255, 214, 194, 0.3), transparent 38%),
		radial-gradient(circle at 20% 20%, rgba(194, 220, 255, 0.16), transparent 34%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(250, 245, 236, 0.96));
	box-shadow: 0 20rpx 40rpx rgba(92, 78, 62, 0.08);
	overflow: hidden;
}

.discover-head::before {
	content: '';
	position: absolute;
	inset: 0;
	background-image:
		linear-gradient(125deg, rgba(255, 255, 255, 0.45), transparent 34%),
		repeating-linear-gradient(180deg, transparent 0 44rpx, rgba(176, 164, 144, 0.06) 44rpx 46rpx);
	opacity: 0.6;
}

.discover-head::after {
	content: '';
	position: absolute;
	right: 50rpx;
	top: 28rpx;
	width: 128rpx;
	height: 128rpx;
	border: 3rpx dashed rgba(160, 143, 119, 0.18);
	border-left-color: transparent;
	border-bottom-color: transparent;
	border-radius: 50%;
	transform: rotate(12deg);
}

.discover-head-main,
.discover-ticket,
.discover-ribbon-row {
	position: relative;
	z-index: 1;
}

.discover-head-main {
	max-width: 470rpx;
}

.discover-kicker {
	display: block;
	font-size: 20rpx;
	letter-spacing: 6rpx;
	color: rgba(104, 115, 125, 0.9);
	text-transform: uppercase;
}

.discover-title {
	display: block;
	margin-top: 14rpx;
	font-size: 46rpx;
	line-height: 1.16;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.discover-subtitle {
	display: block;
	margin-top: 16rpx;
	padding-right: 180rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: rgba(86, 96, 91, 0.92);
}

.discover-ticket {
	position: absolute;
	right: 24rpx;
	bottom: 28rpx;
	width: 180rpx;
	padding: 18rpx 18rpx 16rpx;
	border-radius: 24rpx 24rpx 20rpx 20rpx;
	border: 2rpx solid rgba(208, 185, 147, 0.42);
	background: rgba(255, 249, 239, 0.88);
	box-shadow: 0 14rpx 24rpx rgba(121, 97, 73, 0.08);
	transform: rotate(4deg);
	animation: ticket-sway 7s ease-in-out infinite;
}

.discover-ticket-label,
.discover-ticket-note {
	display: block;
	font-size: 18rpx;
	color: rgba(104, 115, 125, 0.9);
}

.discover-ticket-value {
	display: block;
	margin: 10rpx 0 6rpx;
	font-size: 46rpx;
	line-height: 1;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.96);
}

.discover-ribbon-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 24rpx;
	padding-right: 210rpx;
}

.discover-ribbon {
	display: inline-flex;
	align-items: center;
	max-width: 100%;
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.62);
	border: 2rpx solid rgba(214, 205, 188, 0.4);
	font-size: 20rpx;
	line-height: 1.4;
	color: rgba(86, 96, 91, 0.92);
}

.discover-ribbon.soft {
	background: rgba(250, 241, 228, 0.82);
}

.discover-toolbar-placeholder {
	pointer-events: none;
	margin-bottom: 22rpx;
	transition: height 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.discover-toolbar {
	--toolbar-side-padding: 8rpx;
	position: relative;
	z-index: 20;
	margin: 0 -8rpx 22rpx;
	padding: 10rpx var(--toolbar-side-padding) 12rpx;
	background: transparent;
	backdrop-filter: none;
	transform-origin: center top;
	transition:
		padding 0.22s cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
		transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
		opacity 0.22s ease;
}

.discover-toolbar.is-pinned {
	position: fixed;
	left: 0;
	right: 0;
	top: var(--toolbar-fixed-top, 0px);
	--toolbar-side-padding: 28rpx;
	z-index: 40;
	margin: 0;
	background: linear-gradient(180deg, rgba(247, 242, 233, 0.96), rgba(247, 242, 233, 0.82) 72%, rgba(247, 242, 233, 0));
	backdrop-filter: blur(18rpx);
	box-shadow: 0 14rpx 34rpx rgba(92, 78, 62, 0.08);
	animation: toolbar-pin-in 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.discover-toolbar::after {
	content: '';
	position: absolute;
	left: var(--toolbar-side-padding);
	right: var(--toolbar-side-padding);
	bottom: 0;
	height: 1rpx;
	background: linear-gradient(90deg, transparent, rgba(214, 205, 188, 0.4), transparent);
	opacity: 0;
	transition: opacity 0.18s ease;
}

.discover-toolbar.is-pinned::after {
	opacity: 1;
}

.search-panel {
	margin-bottom: 14rpx;
}

.search-box {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 24rpx;
	border-radius: 26rpx;
	background: rgba(255, 255, 255, 0.86);
	border: 2rpx solid rgba(240, 245, 242, 1);
	box-shadow: 0 12rpx 24rpx rgba(31, 36, 40, 0.05);
	transition:
		transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
		background 0.22s ease,
		border-color 0.22s ease;
}

.discover-toolbar.is-pinned .search-box {
	transform: translateY(-2rpx);
	box-shadow: 0 18rpx 30rpx rgba(31, 36, 40, 0.08);
}

.theme-dark .search-box {
	background: rgba(20, 28, 32, 0.9);
	border-color: rgba(230, 237, 241, 0.06);
}

.search-box-icon {
	margin-right: 12rpx;
	width: 28rpx;
	height: 28rpx;
	display: block;
}

.search-input {
	flex: 1;
	height: 88rpx;
	font-size: 26rpx;
	color: rgba(50, 60, 55, 1);
}

.theme-dark .search-input {
	color: var(--ink);
}

.mood-strip {
	margin: 0 -4rpx;
	white-space: nowrap;
	transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}

.discover-toolbar.is-pinned .mood-strip {
	transform: translateY(-2rpx);
}

.mood-strip-row {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	align-items: center;
	padding: 4rpx;
	width: max-content;
}

.mood-chip {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8rpx;
	flex-shrink: 0;
	padding: 14rpx 20rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.72);
	border: 2rpx solid rgba(214, 205, 188, 0.44);
	color: rgba(86, 96, 91, 0.94);
	font-size: 22rpx;
	box-shadow: 0 10rpx 18rpx rgba(31, 36, 40, 0.04);
	transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.mood-chip + .mood-chip {
	margin-left: 12rpx;
}

.mood-chip.is-active {
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), var(--chip-soft, rgba(255, 241, 235, 0.96)));
	border-color: var(--chip-accent, rgba(125, 139, 138, 0.44));
	box-shadow: 0 14rpx 24rpx rgba(31, 36, 40, 0.08);
	transform: translateY(-2rpx);
}

.mood-chip-icon {
	width: 22rpx;
	height: 22rpx;
	display: block;
	flex-shrink: 0;
}

.mood-chip text {
	white-space: nowrap;
}

.discover-board {
	position: relative;
}

.featured-plane {
	position: relative;
	display: flex;
	gap: 24rpx;
	margin-bottom: 8rpx;
	padding: 28rpx;
	border-radius: 40rpx;
	border: 2rpx solid var(--featured-strong, rgba(214, 205, 188, 0.52));
	background:
		radial-gradient(circle at top right, var(--featured-soft, rgba(255, 214, 194, 0.16)), transparent 40%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(249, 244, 235, 0.98));
	box-shadow: 0 22rpx 44rpx rgba(92, 78, 62, 0.08);
	overflow: hidden;
}

.featured-plane::before {
	content: '';
	position: absolute;
	inset: 0;
	background: repeating-linear-gradient(
		180deg,
		transparent 0 46rpx,
		rgba(129, 150, 176, 0.08) 46rpx 48rpx
	);
	opacity: 0.42;
}

.featured-plane-main,
.featured-plane-side {
	position: relative;
	z-index: 1;
}

.featured-plane-main {
	flex: 1;
	min-width: 0;
}

.featured-plane-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16rpx;
}

.featured-plane-badge {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.68);
	border: 2rpx solid currentColor;
	font-size: 20rpx;
	font-weight: 600;
}

.featured-mood-icon {
	width: 22rpx;
	height: 22rpx;
	display: block;
	flex-shrink: 0;
}

.featured-plane-time {
	margin-top: 6rpx;
	font-size: 20rpx;
	color: rgba(104, 115, 125, 0.88);
}

.featured-plane-title {
	display: block;
	margin-top: 18rpx;
	font-size: 34rpx;
	line-height: 1.3;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.featured-plane-text {
	display: -webkit-box;
	margin-top: 14rpx;
	font-size: 28rpx;
	line-height: 1.58;
	color: rgba(50, 60, 55, 0.96);
	word-break: break-word;
	-webkit-line-clamp: 4;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.featured-plane-meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8rpx;
	margin-top: 18rpx;
	font-size: 20rpx;
	color: rgba(104, 115, 125, 0.88);
}

.featured-dot {
	opacity: 0.6;
}

.featured-plane-stats {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 22rpx;
}

.featured-stat {
	min-width: 100rpx;
	padding: 16rpx 18rpx 14rpx;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.68);
	border: 2rpx solid rgba(214, 205, 188, 0.34);
}

.featured-stat-value {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: rgba(28, 36, 40, 0.98);
}

.featured-stat-label {
	display: block;
	margin-top: 6rpx;
	font-size: 18rpx;
	color: rgba(104, 115, 125, 0.88);
}

.featured-plane-side {
	width: 176rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: space-between;
}

.featured-plane-image {
	width: 164rpx;
	height: 198rpx;
	border-radius: 28rpx;
	border: 8rpx solid rgba(255, 255, 255, 0.82);
	box-shadow: 0 16rpx 26rpx rgba(92, 78, 62, 0.12);
	background: rgba(247, 242, 235, 0.9);
	transform: rotate(6deg);
}

.featured-plane-stamp {
	width: 150rpx;
	height: 150rpx;
	border-radius: 30rpx;
	border: 3rpx dashed currentColor;
	background: rgba(255, 255, 255, 0.48);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	transform: rotate(6deg);
}

.featured-plane-stamp-icon {
	width: 40rpx;
	height: 40rpx;
	display: block;
}

.featured-plane-stamp-label {
	font-size: 22rpx;
	font-weight: 600;
}

.featured-plane-route {
	max-width: 164rpx;
	margin-top: 16rpx;
	padding: 12rpx 14rpx;
	border-radius: 20rpx;
	background: rgba(255, 255, 255, 0.62);
	border: 2rpx solid rgba(214, 205, 188, 0.3);
	font-size: 20rpx;
	line-height: 1.5;
	color: rgba(86, 96, 91, 0.94);
}

.lively-grid {
	margin-top: 22rpx;
}

.note-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24rpx;
	align-items: start;
}

.compact-grid {
	gap: 22rpx;
}

.note-item {
	position: relative;
	padding-top: var(--note-offset, 0rpx);
	padding-bottom: 28rpx;
	min-height: calc(var(--card-height, 304rpx) + var(--note-offset, 0rpx) + 28rpx);
}

.stack-sheet {
	position: absolute;
	left: 0;
	top: var(--note-offset, 0rpx);
	width: 100%;
	height: var(--card-height, 304rpx);
	border-radius: 30rpx;
	border: 2rpx solid var(--stack-border, rgba(255, 255, 255, 0.52));
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.46), transparent 16%),
		linear-gradient(165deg, rgba(255, 255, 255, 0.82), var(--stack-base, rgba(250, 247, 238, 0.92)) 72%);
	box-shadow: 0 10rpx 22rpx rgba(31, 36, 40, 0.05);
	pointer-events: none;
}

.stack-sheet-a {
	transform: translateX(var(--stack-a-x, -10rpx)) translateY(var(--stack-a-y, 10rpx)) rotate(var(--stack-a-rotate, -1deg));
	opacity: 0.72;
	z-index: 0;
}

.stack-sheet-b {
	transform: translateX(var(--stack-b-x, 10rpx)) translateY(var(--stack-b-y, 18rpx)) rotate(var(--stack-b-rotate, 1deg));
	opacity: 0.5;
	z-index: 0;
}

.plane-card {
	position: relative;
	min-height: var(--card-height, 304rpx);
	height: var(--card-height, 304rpx);
	padding: 24rpx;
	border-radius: 28rpx;
	border: 2rpx solid var(--paper-border, rgba(255, 255, 255, 0.72));
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.65), transparent 14%, transparent 88%, rgba(0, 0, 0, 0.03)),
		linear-gradient(180deg, rgba(255, 255, 255, 0.55), transparent 18%),
		radial-gradient(circle at top right, var(--paper-wash, rgba(194, 220, 255, 0.22)), transparent 44%),
		linear-gradient(165deg, var(--paper-glow, rgba(255, 255, 255, 0.92)), var(--paper-base, rgba(250, 247, 238, 0.98)) 72%);
	box-shadow:
		0 12rpx 30rpx var(--paper-shadow, rgba(0, 0, 0, 0.05)),
		0 2rpx 0 rgba(255, 255, 255, 0.55) inset,
		0 -10rpx 18rpx rgba(0, 0, 0, 0.035) inset;
	transition: box-shadow 0.2s ease, transform 0.2s ease;
	overflow: hidden;
	transform: translateX(var(--note-shift, 0rpx)) rotate(var(--note-tilt, 0deg));
	transform-origin: center top;
	z-index: 2;
}

.plane-card:active {
	transform: translateX(var(--note-shift, 0rpx)) rotate(var(--note-tilt, 0deg)) scale(0.98);
	box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.08);
}

.note-item.has-media {
	--note-offset: calc(var(--note-offset, 0rpx) + 6rpx);
}

.note-item.airy-card {
	--note-offset: calc(var(--note-offset, 0rpx) + 10rpx);
}

.note-clip {
	position: absolute;
	left: 22rpx;
	top: -18rpx;
	width: 38rpx;
	height: 108rpx;
	z-index: 4;
	transform: rotate(8deg);
	pointer-events: none;
}

.note-clip-svg {
	width: 100%;
	height: 100%;
	overflow: visible;
}

.clip-shadow,
.clip-main,
.clip-inner-line {
	fill: none;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.clip-shadow {
	stroke: rgba(31, 36, 40, 0.1);
	stroke-width: 5.2;
	transform: translate(1.1px, 1.6px);
}

.clip-main {
	stroke: rgba(121, 131, 144, 0.96);
	stroke-width: 3.7;
	filter: drop-shadow(0 2rpx 4rpx rgba(31, 36, 40, 0.08));
}

.clip-inner-line {
	stroke: rgba(227, 233, 238, 0.92);
	stroke-width: 1.4;
	opacity: 0.82;
}

.plane-card-inner {
	position: relative;
	z-index: 3;
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
	gap: 10rpx;
}

.plane-quote-mark {
	position: absolute;
	right: 22rpx;
	top: 54rpx;
	font-size: 120rpx;
	line-height: 1;
	color: rgba(255, 255, 255, 0.42);
	font-family: Georgia, 'Times New Roman', serif;
	z-index: 2;
	pointer-events: none;
}

.plane-side-label {
	position: absolute;
	right: -8rpx;
	top: 130rpx;
	padding: 8rpx 16rpx;
	border-radius: 14rpx 14rpx 0 0;
	background: rgba(255, 255, 255, 0.52);
	font-size: 18rpx;
	font-weight: 600;
	transform: rotate(90deg);
	transform-origin: top right;
	z-index: 4;
}

.note-tape {
	position: absolute;
	top: -8rpx;
	width: 68rpx;
	height: 24rpx;
	border-radius: 8rpx;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.34), transparent 38%),
		linear-gradient(180deg, var(--paper-tape, rgba(245, 232, 198, 0.82)), rgba(222, 208, 176, 0.72));
	border: 1rpx solid rgba(150, 136, 108, 0.12);
	box-shadow: 0 4rpx 10rpx rgba(111, 95, 71, 0.08);
	opacity: 0.88;
	z-index: 2;
}

.tape-left {
	left: var(--tape-left-offset, 24rpx);
	transform: rotate(var(--tape-left-tilt, -2deg));
}

.tape-right {
	right: var(--tape-right-offset, 24rpx);
	transform: rotate(var(--tape-right-tilt, 2deg));
}

.paper-grain {
	position: absolute;
	inset: 0;
	background-image:
		radial-gradient(circle at 12% 18%, rgba(0, 0, 0, 0.035) 0 1rpx, transparent 1.5rpx),
		radial-gradient(circle at 78% 22%, rgba(0, 0, 0, 0.025) 0 1rpx, transparent 1.5rpx),
		radial-gradient(circle at 28% 74%, rgba(255, 255, 255, 0.45) 0 1rpx, transparent 1.5rpx),
		radial-gradient(circle at 66% 68%, rgba(0, 0, 0, 0.025) 0 1rpx, transparent 1.5rpx);
	background-size: 38rpx 38rpx, 44rpx 44rpx, 52rpx 52rpx, 48rpx 48rpx;
	opacity: 0.55;
	pointer-events: none;
	z-index: 1;
}

.paper-lines {
	position: absolute;
	left: 20rpx;
	right: 20rpx;
	top: 58rpx;
	bottom: 52rpx;
	background-image: repeating-linear-gradient(
		180deg,
		transparent 0 34rpx,
		var(--paper-rule, rgba(129, 150, 176, 0.12)) 34rpx 36rpx
	);
	opacity: 0.55;
	pointer-events: none;
	z-index: 1;
}

.plane-card-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 4rpx;
}

.plane-meta-side {
	margin-top: -10rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	min-width: 0;
	max-width: 240rpx;
}

.plane-mood-icon {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.plane-mood-icon-image {
	width: 28rpx;
	height: 28rpx;
	display: block;
}

.plane-time-chip {
	padding: 6rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.54);
	font-size: 18rpx;
	color: rgba(100, 110, 105, 1);
}

.plane-top-author {
	max-width: 100%;
	font-size: 18rpx;
	line-height: 1.2;
	color: rgba(100, 110, 105, 1);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.plane-stamp-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}

.plane-stamp-chip {
	display: inline-flex;
	align-items: center;
	padding: 6rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.6);
	border: 2rpx solid currentColor;
	font-size: 18rpx;
	font-weight: 600;
}

.plane-status-hint {
	flex: 1;
	min-width: 0;
	font-size: 18rpx;
	text-align: right;
	color: rgba(104, 115, 125, 0.9);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.plane-photo-frame {
	position: relative;
	padding: 10rpx;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.54);
	border: 2rpx solid rgba(214, 205, 188, 0.32);
	box-shadow: 0 10rpx 18rpx rgba(31, 36, 40, 0.05);
}

.plane-photo-frame::after {
	content: '';
	position: absolute;
	top: -8rpx;
	right: 24rpx;
	width: 56rpx;
	height: 20rpx;
	border-radius: 6rpx;
	background: rgba(247, 226, 205, 0.88);
	transform: rotate(5deg);
	opacity: 0.92;
}

.plane-photo-image {
	width: 100%;
	height: 132rpx;
	border-radius: 16rpx;
	background: rgba(239, 231, 220, 0.9);
}

.plane-photo-caption {
	display: block;
	margin-top: 10rpx;
	font-size: 18rpx;
	color: rgba(104, 115, 125, 0.88);
}

.plane-text {
	display: -webkit-box;
	flex: 1 1 auto;
	min-width: 0;
	min-height: 72rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: rgba(50, 60, 55, 1);
	word-break: break-word;
	-webkit-line-clamp: 4;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
}

.plane-text.is-large {
	padding-right: 22rpx;
	font-size: 30rpx;
	line-height: 1.58;
	-webkit-line-clamp: 4;
}

.plane-text.is-tight {
	-webkit-line-clamp: 5;
}

.plane-media-badge {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 6rpx 10rpx 6rpx 8rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.6);
	border: 2rpx solid rgba(28, 36, 40, 0.05);
}

.plane-media-thumb {
	width: 30rpx;
	height: 30rpx;
	border-radius: 50%;
}

.plane-media-count {
	font-size: 16rpx;
	color: rgba(100, 110, 105, 1);
}

.plane-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	margin-top: 14rpx;
	flex-shrink: 0;
}

.plane-footer-left {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	min-width: 0;
	flex: 1;
}

.plane-stats-row {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8rpx;
	margin-top: 4rpx;
	flex-shrink: 0;
}

.plane-stat-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
	padding: 8rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.54);
	border: 1rpx solid rgba(214, 205, 188, 0.34);
	font-size: 18rpx;
	color: rgba(86, 96, 91, 0.92);
	overflow: hidden;
}

.plane-stat-chip.accent {
	background: rgba(255, 255, 255, 0.76);
	font-weight: 600;
}

.plane-stat-chip text {
	display: block;
	min-width: 0;
	max-width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.plane-mood-tag,
.plane-location {
	display: inline-flex;
	align-items: center;
	padding: 6rpx 12rpx;
	border-radius: 12rpx;
	background: rgba(255, 255, 255, 0.5);
	font-size: 18rpx;
}

.plane-location {
	color: rgba(100, 110, 105, 1);
	min-width: 0;
	max-width: 150rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.variant-photo .plane-text {
	-webkit-line-clamp: 3;
}

.variant-quote .paper-lines {
	top: 76rpx;
}

.variant-quote .plane-footer {
	margin-top: 10rpx;
}

.variant-diary .plane-card-inner {
	padding-right: 20rpx;
}

.paper-corner {
	position: absolute;
	width: 54rpx;
	height: 54rpx;
	background: linear-gradient(135deg, transparent 48%, rgba(214, 205, 188, 0.35) 49%, rgba(246, 241, 231, 0.82) 100%);
	box-shadow: -6rpx -6rpx 14rpx rgba(255, 255, 255, 0.24);
}

.paper-corner::before {
	content: '';
	position: absolute;
	right: 0;
	bottom: 0;
	width: 36rpx;
	height: 36rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.12) 100%);
	clip-path: polygon(100% 0, 0 100%, 100% 100%);
}

.paper-corner {
	right: 0;
	bottom: 0;
	border-bottom-right-radius: 28rpx;
}

.paper-corner::before {
	right: 0;
	bottom: 0;
	border-bottom-right-radius: 28rpx;
}

.plane-skeleton {
	background: rgba(255, 255, 255, 0.8);
}

.theme-dark .plane-skeleton {
	background: rgba(20, 28, 32, 0.88);
}

.skeleton-tag,
.skeleton-line,
.skeleton-time,
.skeleton-icon,
.skeleton-meta {
	border-radius: 999rpx;
	background: linear-gradient(90deg, rgba(230, 236, 233, 0.5), rgba(245, 247, 246, 0.95), rgba(230, 236, 233, 0.5));
	background-size: 200% 100%;
	animation: skeleton-flow 1.2s linear infinite;
}

.theme-dark .skeleton-tag,
.theme-dark .skeleton-line,
.theme-dark .skeleton-time,
.theme-dark .skeleton-icon,
.theme-dark .skeleton-meta {
	background: linear-gradient(90deg, rgba(44, 54, 58, 0.6), rgba(70, 82, 87, 0.9), rgba(44, 54, 58, 0.6));
	background-size: 200% 100%;
}

.skeleton-top,
.skeleton-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.skeleton-top {
	margin-bottom: 18rpx;
}

.skeleton-footer {
	margin-top: 20rpx;
}

.skeleton-icon {
	width: 48rpx;
	height: 48rpx;
	border-radius: 16rpx;
}

.skeleton-tag {
	width: 96rpx;
	height: 28rpx;
}

.skeleton-line {
	height: 22rpx;
	margin-bottom: 14rpx;
}

.skeleton-line.short {
	width: 72%;
}

.skeleton-time {
	width: 90rpx;
	height: 18rpx;
}

.skeleton-meta {
	width: 84rpx;
	height: 28rpx;
}

.theme-dark .flight-path {
	border-top-color: rgba(138, 160, 176, 0.12);
}

.theme-dark .discover-head {
	border-color: rgba(230, 237, 241, 0.08);
	background:
		radial-gradient(circle at top right, rgba(255, 152, 95, 0.14), transparent 38%),
		radial-gradient(circle at 20% 20%, rgba(54, 192, 141, 0.12), transparent 34%),
		linear-gradient(180deg, rgba(24, 32, 36, 0.94), rgba(18, 24, 27, 0.98));
	box-shadow: 0 24rpx 44rpx rgba(0, 0, 0, 0.22);
}

.theme-dark .discover-toolbar.is-pinned {
	background: linear-gradient(180deg, rgba(15, 20, 22, 0.96), rgba(15, 20, 22, 0.84) 72%, rgba(15, 20, 22, 0));
	box-shadow: 0 16rpx 34rpx rgba(0, 0, 0, 0.18);
}

.theme-dark .discover-toolbar.is-pinned::after {
	background: linear-gradient(90deg, transparent, rgba(230, 237, 241, 0.1), transparent);
}

.theme-dark .discover-head::before {
	opacity: 0.18;
}

.theme-dark .discover-kicker,
.theme-dark .discover-subtitle,
.theme-dark .discover-ticket-label,
.theme-dark .discover-ticket-note,
.theme-dark .discover-ribbon,
.theme-dark .featured-plane-time,
.theme-dark .featured-plane-meta,
.theme-dark .featured-stat-label,
.theme-dark .featured-plane-route,
.theme-dark .plane-status-hint,
.theme-dark .plane-photo-caption,
.theme-dark .plane-top-author,
.theme-dark .plane-media-count,
.theme-dark .plane-location,
.theme-dark .plane-time-chip {
	color: rgba(214, 223, 229, 0.82);
}

.theme-dark .discover-title,
.theme-dark .discover-ticket-value,
.theme-dark .featured-plane-title,
.theme-dark .featured-stat-value {
	color: var(--ink);
}

.theme-dark .discover-ticket,
.theme-dark .discover-ribbon,
.theme-dark .mood-chip,
.theme-dark .featured-plane-badge,
.theme-dark .featured-stat,
.theme-dark .featured-plane-route,
.theme-dark .featured-plane-stamp,
.theme-dark .plane-time-chip,
.theme-dark .plane-stamp-chip,
.theme-dark .plane-photo-frame,
.theme-dark .plane-stat-chip,
.theme-dark .plane-media-badge,
.theme-dark .plane-location,
.theme-dark .plane-side-label {
	background: rgba(255, 255, 255, 0.06);
	border-color: rgba(230, 237, 241, 0.1);
}

.theme-dark .mood-chip.is-active {
	background: linear-gradient(135deg, rgba(36, 45, 49, 0.96), var(--chip-soft, rgba(52, 73, 68, 0.92)));
}

.theme-dark .featured-plane {
	background:
		radial-gradient(circle at top right, var(--featured-soft, rgba(54, 192, 141, 0.12)), transparent 40%),
		linear-gradient(180deg, rgba(24, 32, 36, 0.96), rgba(18, 24, 27, 0.98));
	box-shadow: 0 24rpx 44rpx rgba(0, 0, 0, 0.24);
}

.theme-dark .featured-plane::before {
	opacity: 0.18;
}

.theme-dark .featured-plane-image {
	border-color: rgba(255, 255, 255, 0.1);
	box-shadow: 0 18rpx 30rpx rgba(0, 0, 0, 0.24);
}

.theme-dark .plane-card {
	box-shadow:
		0 14rpx 30rpx rgba(0, 0, 0, 0.16),
		0 2rpx 0 rgba(255, 255, 255, 0.06) inset,
		0 -10rpx 18rpx rgba(0, 0, 0, 0.1) inset;
}

.theme-dark .plane-text,
.theme-dark .featured-plane-text {
	color: rgba(230, 237, 241, 0.94);
}

.theme-dark .plane-stat-chip.accent {
	background: rgba(255, 255, 255, 0.1);
}

.theme-dark .clip-shadow {
	stroke: rgba(0, 0, 0, 0.28);
}

.theme-dark .clip-main {
	stroke: rgba(214, 223, 229, 0.78);
}

.theme-dark .clip-inner-line {
	stroke: rgba(86, 99, 108, 0.92);
}

.custom-empty {
	margin-top: 16rpx;
	display: flex;
	flex-direction: column;
}

@keyframes orb-float {
	0%,
	100% {
		transform: translate3d(0, 0, 0);
	}
	50% {
		transform: translate3d(0, -16rpx, 0);
	}
}

@keyframes ticket-sway {
	0%,
	100% {
		transform: rotate(4deg) translateY(0);
	}
	50% {
		transform: rotate(2deg) translateY(-4rpx);
	}
}

@keyframes toolbar-pin-in {
	from {
		opacity: 0.72;
		transform: translateY(-10rpx) scale(0.985);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes skeleton-flow {
	from {
		background-position: 200% 0;
	}
	to {
		background-position: -200% 0;
	}
}

</style>
