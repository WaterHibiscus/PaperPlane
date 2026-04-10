<template>
	<view :class="['app-page', 'with-tabbar', 'mine-page', themeClass]">
		<view class="profile-hero">
			<view class="hero-top">
				<view class="hero-profile">
					<view class="avatar-shell">
						<image v-if="profileAvatarUrl" class="avatar-image" :src="profileAvatarUrl" mode="aspectFill" />
						<text v-else class="avatar-text">{{ nicknameInitial }}</text>
					</view>
					<view class="hero-copy">
						<view class="hero-name-row">
							<text class="hero-name">{{ appState.profileName }}</text>
							<view class="hero-meta">
								<text class="hero-id">ID: {{ profileId }}</text>
								<text class="hero-tag">{{ profileGenderLabel }}</text>
							</view>
						</view>
						<text class="hero-bio">{{ appState.profileBio }}</text>
					</view>
				</view>
				<view class="hero-tools">
					<view v-if="sessionAccount" class="logout-btn" @tap="handleLogout">
						<text>退出</text>
					</view>
					<view class="settings-btn" @tap="goProfileSettings">
						<image class="settings-btn-icon" :src="icons.settings" mode="aspectFit" />
					</view>
				</view>
			</view>

			<view class="stats-card">
				<view class="stats-item">
					<text class="stats-value">{{ myPlanes.length }}</text>
					<text class="stats-label">投递</text>
				</view>
				<view class="stats-divider"></view>
				<view class="stats-item">
					<text class="stats-value">{{ totalPickups }}</text>
					<text class="stats-label">拾取</text>
				</view>
				<view class="stats-divider"></view>
				<view class="stats-item">
					<text class="stats-value">{{ totalLikes }}</text>
					<text class="stats-label">续航</text>
				</view>
			</view>
		</view>

		<view class="hero-spacer"></view>

		<view class="tab-header">
			<view class="tab-main">
				<view :class="['tab-btn', { active: activeTab === 'hangar' }]" @tap="activeTab = 'hangar'">
					<text>机库</text>
				</view>
				<view :class="['tab-btn', { active: activeTab === 'picked' }]" @tap="activeTab = 'picked'">
					<text>拾取</text>
				</view>
				<view :class="['tab-btn', { active: activeTab === 'fueled' }]" @tap="activeTab = 'fueled'">
					<text>续航</text>
				</view>
			</view>
			<view class="tab-search">
				<view :class="['search-shell', { open: searchOpen }]">
					<input
						v-if="searchOpen"
						v-model="searchQuery"
						class="search-input"
						:focus="searchFocus"
						maxlength="20"
						placeholder="搜索内容或地点"
						placeholder-class="placeholder-text"
						@blur="handleSearchBlur"
					/>
				</view>
				<view v-if="!searchOpen" class="search-btn" @tap="toggleSearch">
					<image class="search-btn-icon" :src="icons.search" mode="aspectFit" />
				</view>
				<view v-if="activeTab === 'hangar'" class="filter-btn" @tap="toggleHangarFilter">
					<image class="filter-btn-icon" :src="icons.filter" mode="aspectFit" />
				</view>
				<view v-if="activeTab === 'hangar' && hangarFilterOpen" class="filter-dropdown">
					<view
						:class="['filter-option', { active: hangarStatusFilter === 'all' }]"
						@tap="selectHangarFilter('all')"
					>
						<text>全部</text>
					</view>
					<view
						:class="['filter-option', { active: hangarStatusFilter === 'active' }]"
						@tap="selectHangarFilter('active')"
					>
						<text>飞行中</text>
					</view>
					<view
						:class="['filter-option', { active: hangarStatusFilter === 'recalled' }]"
						@tap="selectHangarFilter('recalled')"
					>
						<text>已召回</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="activeTab === 'hangar'">
			<view v-if="hasDraft" class="draft-tip glass-card" @tap="goThrow">
				<text class="draft-tip-title">有草稿待继续</text>
				<text class="draft-tip-desc">{{ draftPreview }}</text>
			</view>

			<view v-if="loading" class="glass-card empty-card">
				<text class="empty-title">机库加载中...</text>
				<text class="empty-desc">正在同步你的最新数据。</text>
			</view>

			<view v-else-if="!myPlanes.length" class="glass-card empty-card">
				<text class="empty-title">你还没有投递纸飞机</text>
				<text class="empty-desc">去投递一架，它就会出现在这里。</text>
			</view>

			<view v-else-if="!filteredHangarPlanes.length" class="glass-card empty-card">
				<text class="empty-title">未找到匹配内容</text>
				<text class="empty-desc">试试其他关键词。</text>
			</view>

			<view v-else class="hangar-list">
				<view
					v-for="plane in filteredHangarPlanes"
					:key="plane.id"
					:class="['flight-card', isExpiredPlane(plane) ? 'landed' : 'active-flight']"
					@tap="openDetail(plane.id)"
				>
					<view class="flight-top">
						<view v-if="isRecalledPlane(plane)" class="flight-badge recalled">
							<text>已召回</text>
						</view>
						<view v-else-if="!isExpiredPlane(plane)" class="flight-badge active">
							<view class="flight-dot"></view>
							<text>飞行中（{{ getRemainingHoursLabel(plane) }}）</text>
						</view>
						<view v-else class="flight-badge landed">
							<text>已落地</text>
						</view>
						<text class="flight-date">{{ formatPlaneDate(plane.createTime) }}</text>
					</view>

					<text :class="['flight-content', { muted: isExpiredPlane(plane) }]">{{ plane.content }}</text>

					<view class="flight-footer">
						<view class="flight-meta">
							<text>地点 {{ plane.locationTag }}</text>
							<text>{{ plane.pickCount || 0 }} 次拾取</text>
						</view>
						<view v-if="canRecallPlane(plane)" class="flight-actions">
							<view class="flight-action secondary" @tap.stop="handleRecall(plane)">
								<text>召回</text>
							</view>
							<view class="flight-action danger" @tap.stop="handleDestroy(plane)">
								<text>销毁</text>
							</view>
						</view>
						<view v-else class="flight-actions">
							<view class="flight-action danger" @tap.stop="handleDestroy(plane)">
								<text>销毁</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-else-if="activeTab === 'picked'">
			<view v-if="loading" class="glass-card empty-card">
				<text class="empty-title">拾取记录加载中...</text>
				<text class="empty-desc">正在同步你的记录。</text>
			</view>

			<view v-else-if="!pickedList.length" class="glass-card empty-card">
				<text class="empty-title">暂无拾取记录</text>
				<text class="empty-desc">你拾取过的纸飞机会显示在这里。</text>
			</view>

			<view v-else-if="!filteredPickedList.length" class="glass-card empty-card">
				<text class="empty-title">未找到匹配内容</text>
				<text class="empty-desc">试试其他关键词。</text>
			</view>

			<view v-else class="hangar-list fueled-list">
				<view v-for="plane in filteredPickedList" :key="`picked-${plane.id}`" class="flight-card fueled-card" @tap="openDetail(plane.id)">
					<view class="flight-top">
						<view class="flight-badge active fueled">
							<text>已拾取</text>
						</view>
						<text class="flight-date">{{ formatPlaneDate(plane.pickedAt || plane.createTime) }}</text>
					</view>
					<text class="flight-content">{{ plane.content }}</text>
					<view class="flight-footer">
						<view class="flight-meta">
							<text>地点 {{ plane.locationTag }}</text>
							<text>{{ plane.commentCount || 0 }} 条评论</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-else>
			<view v-if="loading" class="glass-card empty-card">
				<text class="empty-title">续航记录加载中...</text>
				<text class="empty-desc">正在同步你的记录。</text>
			</view>

			<view v-else-if="!fueledList.length" class="glass-card empty-card">
				<text class="empty-title">暂无续航记录</text>
				<text class="empty-desc">你续航过的纸飞机会显示在这里。</text>
			</view>

			<view v-else-if="!filteredFueledList.length" class="glass-card empty-card">
				<text class="empty-title">未找到匹配内容</text>
				<text class="empty-desc">试试其他关键词。</text>
			</view>

			<view v-else class="hangar-list fueled-list">
				<view v-for="plane in filteredFueledList" :key="`fueled-${plane.id}`" class="flight-card fueled-card" @tap="openDetail(plane.id)">
					<view class="flight-top">
						<view class="flight-badge active fueled">
							<text>已续航</text>
						</view>
						<text class="flight-date">{{ formatPlaneDate(plane.fueledAt || plane.createTime) }}</text>
					</view>
					<text class="flight-content">{{ plane.content }}</text>
					<view class="flight-footer">
						<view class="flight-meta">
							<text>地点 {{ plane.locationTag }}</text>
							<text>{{ plane.likeCount || 0 }} 次续航</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<detail-open-transition :visible="detailOpenVisible" :theme="appState.theme" />
		<page-transition :visible="pageTransitionVisible" :theme="appState.theme" />
		<app-tabbar active="mine" :theme="appState.theme" />
	</view>
</template>

<script>
import AppTabbar from '../../components/AppTabbar.vue'
import DetailOpenTransition from '../../components/DetailOpenTransition.vue'
import PageTransition from '../../components/PageTransition.vue'
import { appState } from '../../common/app-state.js'
import {
	destroyPlane,
	getAssetUrl,
	getMyFueledPlanes,
	getMyPickedPlanes,
	getMyThrownPlanes,
	recallPlane,
} from '../../common/api.js'
import {
	fetchCurrentUser,
	getSessionAccount,
	logoutAccount,
} from '../../common/auth.js'
import {
	getThrowDraft,
	getVoterKey,
} from '../../common/storage.js'
import { isExpired } from '../../common/utils.js'
import detailOpenTransitionMixin from '../../common/detail-open-transition.js'
import pageTransitionMixin from '../../common/page-transition.js'
import { uiIcons } from '../../common/ui-icons.js'

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
			myPlanes: [],
			fueledPlanes: [],
			pickedPlanes: [],
			loading: false,
			activeTab: 'hangar',
			hangarFilterOpen: false,
			hangarStatusFilter: 'all',
			searchOpen: false,
			searchFocus: false,
			searchQuery: '',
			throwDraft: null,
			anonymousProfileId: getVoterKey().slice(-4).toUpperCase(),
			sessionAccount: null,
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		profileAvatarUrl() {
			return getAssetUrl(this.appState.profileAvatar)
		},
		nicknameInitial() {
			return (this.appState.profileName || '?').slice(0, 1)
		},
		profileId() {
			const sourceId = this.sessionAccount?.accountId || this.sessionAccount?.userId
			if (!sourceId) return this.anonymousProfileId
			return String(sourceId).slice(-6).toUpperCase()
		},
		profileGenderLabel() {
			if (this.appState.profileGender === 'male') return '男'
			if (this.appState.profileGender === 'female') return '女'
			return '保密'
		},
		totalLikes() {
			return this.myPlanes.reduce((sum, item) => sum + (item.likeCount || 0), 0)
		},
		totalPickups() {
			return this.myPlanes.reduce((sum, item) => sum + (item.pickCount || 0), 0)
		},
		hasDraft() {
			const draft = this.throwDraft
			return Boolean(draft && (draft.content?.trim() || draft.selectedImages?.length))
		},
		draftPreview() {
			const content = String(this.throwDraft?.content || '').trim()
			return content ? content.slice(0, 32) : '草稿在等你继续。'
		},
		hangarPlanes() {
			const active = this.myPlanes.filter(item => !this.isRecalledPlane(item) && !this.isExpiredPlane(item))
			const recalled = this.myPlanes.filter(item => this.isRecalledPlane(item))
			const landed = this.myPlanes.filter(item => !this.isRecalledPlane(item) && this.isExpiredPlane(item))
			return [...active, ...recalled, ...landed]
		},
		filteredHangarSource() {
			if (this.hangarStatusFilter === 'active') {
				return this.hangarPlanes.filter(plane => !this.isRecalledPlane(plane) && !this.isExpiredPlane(plane))
			}
			if (this.hangarStatusFilter === 'recalled') {
				return this.hangarPlanes.filter(plane => this.isRecalledPlane(plane))
			}
			return this.hangarPlanes
		},
		normalizedSearch() {
			return String(this.searchQuery || '').trim().toLowerCase()
		},
		filteredHangarPlanes() {
			if (!this.normalizedSearch) return this.filteredHangarSource
			return this.filteredHangarSource.filter(plane => {
				const content = String(plane.content || '').toLowerCase()
				const location = String(plane.locationTag || '').toLowerCase()
				return content.includes(this.normalizedSearch) || location.includes(this.normalizedSearch)
			})
		},
		fueledList() {
			return this.fueledPlanes
		},
		filteredFueledList() {
			if (!this.normalizedSearch) return this.fueledList
			return this.fueledList.filter(plane => {
				const content = String(plane.content || '').toLowerCase()
				const location = String(plane.locationTag || '').toLowerCase()
				return content.includes(this.normalizedSearch) || location.includes(this.normalizedSearch)
			})
		},
		pickedList() {
			return this.pickedPlanes
		},
		filteredPickedList() {
			if (!this.normalizedSearch) return this.pickedList
			return this.pickedList.filter(plane => {
				const content = String(plane.content || '').toLowerCase()
				const location = String(plane.locationTag || '').toLowerCase()
				return content.includes(this.normalizedSearch) || location.includes(this.normalizedSearch)
			})
		},
	},
	onShow() {
		this.loadPageData()
	},
	methods: {
		isRecalledPlane(plane) {
			return Boolean(plane?.isRecalled || plane?.status === 'recalled')
		},
		isExpiredPlane(plane) {
			if (!plane) return true
			if (plane.status === 'expired') return true
			if (this.isRecalledPlane(plane)) return false
			return isExpired(plane.expireTime)
		},
		canRecallPlane(plane) {
			if (!plane) return false
			return !this.isRecalledPlane(plane) && !this.isExpiredPlane(plane)
		},
		extractMineItems(payload) {
			if (Array.isArray(payload)) return payload
			if (Array.isArray(payload?.items)) return payload.items
			return []
		},
		async loadPageData() {
			this.throwDraft = getThrowDraft()
			this.sessionAccount = getSessionAccount()
			if (!this.sessionAccount) {
				try {
					await fetchCurrentUser()
					this.sessionAccount = getSessionAccount()
				} catch (error) {
					// ignore recovery failure and fallback to login
				}
				if (!this.sessionAccount) {
					this.myPlanes = []
					this.fueledPlanes = []
					this.pickedPlanes = []
					uni.reLaunch({
						url: '/pages/login/index',
					})
					return
				}
			}
			this.loading = true
			try {
				try {
					await fetchCurrentUser()
					this.sessionAccount = getSessionAccount()
				} catch (error) {
					// Keep local user info when network is unstable.
				}
				await Promise.all([
					this.loadMyPlanes(),
					this.loadFueledPlanes(),
					this.loadPickedPlanes(),
				])
			} finally {
				this.loading = false
			}
		},
		async loadMyPlanes() {
			try {
				const data = await getMyThrownPlanes({
					status: 'all',
					page: 1,
					pageSize: 100,
				})
				this.myPlanes = this.extractMineItems(data)
			} catch (error) {
				this.myPlanes = []
				uni.showToast({
					title: error.message || '加载失败',
					icon: 'none',
				})
			}
		},
		async loadFueledPlanes() {
			try {
				const data = await getMyFueledPlanes({
					page: 1,
					pageSize: 100,
				})
				this.fueledPlanes = this.extractMineItems(data)
			} catch (error) {
				this.fueledPlanes = []
			}
		},
		async loadPickedPlanes() {
			try {
				const data = await getMyPickedPlanes({
					page: 1,
					pageSize: 100,
				})
				this.pickedPlanes = this.extractMineItems(data)
			} catch (error) {
				this.pickedPlanes = []
			}
		},
		formatPlaneDate(time) {
			if (!time) return ''
			const date = new Date(time)
			const year = date.getFullYear()
			const month = `${date.getMonth() + 1}`.padStart(2, '0')
			const day = `${date.getDate()}`.padStart(2, '0')
			return `${year}-${month}-${day}`
		},
		getRemainingHoursLabel(plane) {
			if (!plane?.expireTime) return '0小时'
			const diff = new Date(plane.expireTime).getTime() - Date.now()
			if (diff <= 0) return '0小时'
			const hours = Math.max(Math.ceil(diff / 3600000), 1)
			return `${hours}小时`
		},
		toggleSearch() {
			if (!this.searchOpen) {
				this.searchOpen = true
			}
			this.$nextTick(() => {
				this.searchFocus = true
			})
		},
		handleSearchBlur() {
			this.searchFocus = false
			if (!this.searchQuery.trim()) {
				this.searchOpen = false
			}
		},
		toggleHangarFilter() {
			if (this.activeTab !== 'hangar') return
			this.hangarFilterOpen = !this.hangarFilterOpen
		},
		selectHangarFilter(value) {
			this.hangarStatusFilter = value
			this.hangarFilterOpen = false
		},
		handleRecall(plane) {
			uni.showModal({
				title: '召回纸飞机',
				content: '召回后纸飞机将停止飞行，但会保留在你的记录中。',
				success: async ({ confirm }) => {
					if (!confirm) return
					try {
						await recallPlane(plane.id)
						uni.showToast({
							title: '已召回',
							icon: 'success',
						})
						await this.loadMyPlanes()
					} catch (error) {
						uni.showToast({
							title: error.message || '召回失败',
							icon: 'none',
						})
					}
				},
			})
		},
		handleDestroy(plane) {
			uni.showModal({
				title: '销毁纸飞机',
				content: '该操作不可撤销。',
				confirmColor: '#ff6478',
				success: async ({ confirm }) => {
					if (!confirm) return
					try {
						await destroyPlane(plane.id)
						uni.showToast({
							title: '已销毁',
							icon: 'success',
						})
						await Promise.all([
							this.loadMyPlanes(),
							this.loadFueledPlanes(),
							this.loadPickedPlanes(),
						])
					} catch (error) {
						uni.showToast({
							title: error.message || '销毁失败',
							icon: 'none',
						})
					}
				},
			})
		},
		goProfileSettings() {
			uni.navigateTo({
				url: '/pages/profile-edit/index',
			})
		},
		handleLogout() {
			uni.showModal({
				title: '退出登录',
				content: '退出后将返回登录页。',
				confirmColor: '#ff7a6e',
				success: async ({ confirm }) => {
					if (!confirm) return
					await logoutAccount()
					this.sessionAccount = null
					uni.reLaunch({
						url: '/pages/login/index',
					})
				},
			})
		},
		goThrow() {
			uni.navigateTo({
				url: '/pages/throw/index',
			})
		},
		openDetail(id) {
			this.openPlaneDetail(id)
		},
	},
}
</script>
<style scoped>
	.mine-page {
		padding-top: 0;
		padding-left: 0;
		padding-right: 0;
		background: rgba(247, 250, 248, 1);
	}

	.mine-page .profile-hero {
		position: relative;
		height: 344rpx;
		padding: calc(env(safe-area-inset-top) + 80rpx) 32rpx 0;
		background: linear-gradient(180deg, rgba(225, 245, 235, 1), rgba(247, 250, 248, 1));
	}

	.mine-page .hero-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 24rpx;
	}

	.mine-page .hero-profile {
		display: flex;
		align-items: center;
		gap: 18rpx;
		flex: 1;
		min-width: 0;
	}

	.mine-page .hero-copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 6rpx;
		min-width: 0;
	}

	.mine-page .hero-name-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
		flex-wrap: wrap;
	}

	.mine-page .avatar-shell {
		width: 112rpx;
		height: 112rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.05);
		border: 6rpx solid #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.mine-page .avatar-image {
		width: 100%;
		height: 100%;
	}

	.mine-page .avatar-text {
		font-size: 42rpx;
		font-weight: 700;
		color: rgba(180, 200, 190, 1);
	}

	.mine-page .hero-name {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		line-height: 1.15;
		color: rgba(30, 40, 35, 1);
	}

	.mine-page .hero-meta {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-top: 0;
		flex-wrap: wrap;
	}

	.mine-page .hero-id {
		display: inline-flex;
		padding: 4rpx 10rpx;
		border-radius: 999rpx;
		font-size: 18rpx;
		color: rgba(100, 110, 105, 1);
		background: rgba(255, 255, 255, 0.8);
		border: 2rpx solid rgba(235, 245, 240, 1);
	}

	.mine-page .hero-tag {
		display: inline-flex;
		padding: 4rpx 10rpx;
		border-radius: 999rpx;
		font-size: 18rpx;
		color: rgba(46, 164, 116, 1);
		background: rgba(235, 245, 240, 1);
	}

	.mine-page .hero-bio {
		display: block;
		margin-top: 0;
		font-size: 21rpx;
		line-height: 1.45;
		color: rgba(100, 110, 105, 1);
	}

	.mine-page .hero-session {
		display: none;
	}

	.mine-page .hero-tools {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-left: 12rpx;
	}

	.mine-page .logout-btn {
		height: 58rpx;
		padding: 0 20rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.72);
		border: 2rpx solid rgba(255, 231, 236, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 100, 120, 1);
		font-size: 20rpx;
		font-weight: 600;
	}

.mine-page .settings-btn {
	width: 58rpx;
	height: 58rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.6);
		display: flex;
	align-items: center;
	justify-content: center;
}

.mine-page .settings-btn-icon {
	width: 24rpx;
	height: 24rpx;
	display: block;
}

	.mine-page .stats-card {
		position: absolute;
		left: 32rpx;
		right: 32rpx;
		bottom: -30rpx;
		display: flex;
		align-items: stretch;
		padding: 28rpx 18rpx;
		border-radius: 28rpx;
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.04);
	}

	.mine-page .stats-item {
		flex: 1;
		text-align: center;
	}

	.mine-page .stats-value {
		display: block;
		font-size: 36rpx;
		font-weight: 700;
		color: rgba(30, 40, 35, 1);
	}

	.mine-page .stats-label {
		display: block;
		margin-top: 6rpx;
		font-size: 18rpx;
		color: rgba(140, 150, 145, 1);
	}

	.mine-page .stats-divider {
		width: 2rpx;
		margin: 8rpx 0;
		background: rgba(240, 245, 242, 1);
	}

	.mine-page .hero-spacer {
		height: 42rpx;
	}

	.settings-panel,
	.draft-tip,
	.glass-card,
	.mine-page .picked-panel {
		margin: 0 28rpx 20rpx;
		padding: 24rpx;
		text-align: center;
	}

	.glass-card {
		display: flex;
		flex-direction: column;
	}

	.settings-title,
	.mine-page .draft-tip-title {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: rgba(30, 40, 35, 1);
	}

	.settings-note,
	.mine-page .draft-tip-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		line-height: 1.6;
		color: rgba(120, 130, 125, 1);
	}

	.mine-page .settings-editor {
		display: flex;
		gap: 12rpx;
		margin-top: 18rpx;
	}

	.mine-page .settings-section {
		margin-top: 18rpx;
		text-align: left;
	}

	.mine-page .settings-section-label {
		display: block;
		font-size: 22rpx;
		font-weight: 600;
		color: rgba(30, 40, 35, 1);
		margin-bottom: 12rpx;
	}

	.mine-page .gender-row {
		display: flex;
		gap: 12rpx;
		flex-wrap: wrap;
	}

	.mine-page .gender-chip {
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(247, 250, 248, 1);
		border: 2rpx solid rgba(235, 240, 238, 1);
		font-size: 22rpx;
		color: rgba(120, 130, 125, 1);
	}

	.mine-page .gender-chip.active {
		background: rgba(235, 245, 240, 1);
		border-color: rgba(46, 164, 116, 0.24);
		color: rgba(46, 164, 116, 1);
		font-weight: 600;
	}

	.mine-page .bio-input {
		width: 100%;
		min-height: 132rpx;
		padding: 18rpx 20rpx;
		border-radius: 20rpx;
		background: rgba(247, 250, 248, 1);
		font-size: 24rpx;
		line-height: 1.55;
		color: var(--ink);
	}

	.mine-page .settings-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 18rpx;
	}

	.mine-page .settings-input {
		flex: 1;
		height: 80rpx;
		padding: 0 20rpx;
		border-radius: 20rpx;
		background: rgba(247, 250, 248, 1);
		font-size: 26rpx;
		color: var(--ink);
	}

	.mine-page .save-btn {
		height: 80rpx;
		padding: 0 22rpx;
		border-radius: 20rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(46, 164, 116, 1), rgba(76, 189, 143, 1));
		color: #ffffff;
		font-size: 24rpx;
	}

	.mine-page .save-btn.disabled {
		background: rgba(210, 216, 220, 1);
		color: rgba(110, 118, 124, 1);
	}

	.mine-page .draft-tip-title {
		color: rgba(46, 164, 116, 1);
	}

	.mine-page .tab-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		margin: 8rpx 28rpx 0;
		padding-bottom: 6rpx;
		border-bottom: 2rpx solid rgba(235, 240, 238, 1);
		flex-wrap: wrap;
	}

	.mine-page .tab-main {
		display: flex;
		gap: 24rpx;
		flex-wrap: wrap;
		flex: 1;
		min-width: 0;
	}

	.mine-page .tab-btn {
		padding-bottom: 18rpx;
		border-bottom: 4rpx solid transparent;
		font-size: 28rpx;
		font-weight: 500;
		color: rgba(150, 160, 155, 1);
	}

	.mine-page .tab-btn.active {
		border-bottom-color: rgba(46, 164, 116, 1);
		font-weight: 700;
		color: rgba(30, 40, 35, 1);
	}

	.mine-page .tab-search {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 10rpx;
		flex-shrink: 0;
	}

	.mine-page .search-shell {
		width: 0;
		opacity: 0;
		overflow: hidden;
		transition: width 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
	}

	.mine-page .search-shell.open {
		width: 230rpx;
		opacity: 1;
	}

	.mine-page .search-input {
		width: 230rpx;
		height: 62rpx;
		padding: 0 18rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.92);
		border: 2rpx solid rgba(235, 240, 238, 1);
		font-size: 22rpx;
		color: rgba(30, 40, 35, 1);
	}

.mine-page .search-btn {
	width: 62rpx;
		height: 62rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.72);
		border: 2rpx solid rgba(235, 240, 238, 1);
	display: flex;
	align-items: center;
	justify-content: center;
}

.mine-page .search-btn-icon {
	width: 24rpx;
	height: 24rpx;
	display: block;
}

.mine-page .filter-btn {
	width: 62rpx;
		height: 62rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.72);
		border: 2rpx solid rgba(235, 240, 238, 1);
	display: flex;
	align-items: center;
	justify-content: center;
}

.mine-page .filter-btn-icon {
	width: 24rpx;
	height: 24rpx;
	display: block;
}

	.mine-page .filter-dropdown {
		position: absolute;
		right: 0;
		top: 74rpx;
		min-width: 150rpx;
		padding: 10rpx;
		border-radius: 20rpx;
		background: rgba(255, 255, 255, 0.98);
		border: 2rpx solid rgba(235, 240, 238, 1);
		box-shadow: 0 16rpx 32rpx rgba(0, 0, 0, 0.06);
		z-index: 20;
	}

	.mine-page .filter-option {
		padding: 14rpx 16rpx;
		border-radius: 14rpx;
		font-size: 22rpx;
		color: rgba(100, 110, 105, 1);
	}

	.mine-page .filter-option.active {
		background: rgba(235, 245, 240, 1);
		color: rgba(46, 164, 116, 1);
		font-weight: 600;
	}

	.mine-page .hangar-list {
		padding: 18rpx 28rpx 0;
	}

	.mine-page .flight-card {
		padding: 24rpx;
		border-radius: 24rpx;
		margin-bottom: 18rpx;
		border: 2rpx solid rgba(240, 245, 242, 1);
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.02);
	}

	.mine-page .flight-card.landed {
		background: rgba(248, 250, 249, 1);
		opacity: 0.72;
		box-shadow: none;
	}

	.mine-page .flight-card.fueled-card {
		border-color: rgba(226, 236, 248, 1);
		background: rgba(252, 254, 255, 1);
	}

	.mine-page .flight-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12rpx;
		margin-bottom: 16rpx;
	}

	.mine-page .flight-badge {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
		padding: 6rpx 12rpx;
		border-radius: 999rpx;
		font-size: 18rpx;
		font-weight: 500;
	}

	.mine-page .flight-badge.active {
		background: rgba(235, 245, 240, 1);
		color: rgba(46, 164, 116, 1);
	}

	.mine-page .flight-badge.recalled {
		background: rgba(255, 244, 233, 1);
		color: rgba(212, 135, 65, 1);
	}

	.mine-page .flight-badge.fueled {
		background: rgba(232, 244, 255, 1);
		color: rgba(79, 137, 214, 1);
	}

	.mine-page .flight-badge.landed {
		background: rgba(240, 245, 242, 1);
		color: rgba(140, 150, 145, 1);
	}

	.mine-page .flight-dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: rgba(46, 164, 116, 1);
	}

	.mine-page .flight-date {
		font-size: 20rpx;
		color: rgba(160, 170, 165, 1);
	}

	.mine-page .flight-content {
		display: block;
		font-size: 28rpx;
		line-height: 1.65;
		color: rgba(50, 60, 55, 1);
	}

	.mine-page .flight-content.muted {
		color: rgba(100, 110, 105, 1);
	}

	.mine-page .flight-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		margin-top: 18rpx;
		padding-top: 18rpx;
		border-top: 2rpx solid rgba(245, 248, 246, 1);
	}

	.mine-page .flight-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		font-size: 22rpx;
		color: rgba(140, 150, 145, 1);
	}

	.mine-page .flight-actions {
		display: inline-flex;
		align-items: center;
		gap: 12rpx;
		flex-shrink: 0;
	}

	.mine-page .flight-action {
		padding: 8rpx 16rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
		font-weight: 500;
	}

	.mine-page .flight-action.secondary {
		background: rgba(235, 245, 240, 1);
		color: rgba(46, 164, 116, 1);
	}

	.mine-page .flight-action.danger {
		background: rgba(255, 240, 244, 1);
		color: rgba(255, 100, 120, 1);
	}

	.mine-page.theme-dark {
		background: rgba(15, 20, 22, 1);
	}

	.mine-page.theme-dark .profile-hero {
		background: linear-gradient(180deg, rgba(31, 52, 44, 1), rgba(15, 20, 22, 1));
	}

	.mine-page.theme-dark .avatar-shell {
		background: rgba(22, 31, 35, 0.96);
		border-color: rgba(230, 237, 241, 0.08);
		box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.22);
	}

	.mine-page.theme-dark .avatar-text {
		color: rgba(164, 186, 177, 0.92);
	}

	.mine-page.theme-dark .stats-divider {
		background: rgba(230, 237, 241, 0.08);
	}

	.mine-page.theme-dark .search-input,
	.mine-page.theme-dark .search-btn,
	.mine-page.theme-dark .filter-btn,
	.mine-page.theme-dark .filter-dropdown {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(230, 237, 241, 0.08);
		color: rgba(190, 198, 202, 0.9);
	}

	.mine-page.theme-dark .filter-dropdown {
		box-shadow: 0 16rpx 32rpx rgba(0, 0, 0, 0.24);
	}

	.mine-page.theme-dark .filter-option {
		color: rgba(190, 198, 202, 0.86);
	}

	.mine-page.theme-dark .filter-option.active {
		background: rgba(54, 192, 141, 0.14);
		color: rgba(126, 223, 183, 1);
	}

	.mine-page.theme-dark .hero-tag,
	.mine-page.theme-dark .gender-chip.active {
		background: rgba(54, 192, 141, 0.14);
		color: rgba(126, 223, 183, 1);
	}

	.mine-page.theme-dark .hero-bio,
	.mine-page.theme-dark .settings-section-label {
		color: rgba(190, 198, 202, 0.86);
	}

	.mine-page.theme-dark .logout-btn {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(230, 237, 241, 0.08);
	}

	.mine-page.theme-dark .logout-btn {
		color: rgba(255, 149, 164, 1);
	}

	.mine-page.theme-dark .gender-chip,
	.mine-page.theme-dark .bio-input {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(230, 237, 241, 0.08);
		color: rgba(190, 198, 202, 0.86);
	}

	.theme-dark .stats-card,
	.theme-dark .flight-card,
	.theme-dark .settings-panel,
	.theme-dark .draft-tip,
	.mine-page.theme-dark .picked-panel {
		background: rgba(24, 32, 36, 0.96);
		border-color: rgba(230, 237, 241, 0.08);
	}

	.mine-page.theme-dark .flight-card.landed {
		background: rgba(21, 28, 31, 0.96);
	}

	.mine-page.theme-dark .flight-card.fueled-card {
		background: rgba(20, 30, 36, 0.96);
		border-color: rgba(116, 170, 244, 0.2);
	}

	.mine-page.theme-dark .flight-badge.active {
		background: rgba(54, 192, 141, 0.16);
		color: rgba(126, 223, 183, 0.96);
	}

	.mine-page.theme-dark .flight-badge.recalled {
		background: rgba(255, 168, 92, 0.16);
		color: rgba(255, 199, 144, 0.96);
	}

	.mine-page.theme-dark .flight-badge.fueled {
		background: rgba(116, 170, 244, 0.16);
		color: rgba(176, 207, 252, 0.96);
	}

	.mine-page.theme-dark .flight-badge.landed {
		background: rgba(230, 237, 241, 0.08);
		color: rgba(190, 198, 202, 0.78);
	}

	.mine-page.theme-dark .flight-dot {
		background: rgba(126, 223, 183, 1);
	}

	.mine-page.theme-dark .flight-action.secondary {
		background: rgba(54, 192, 141, 0.14);
		color: rgba(126, 223, 183, 0.96);
	}

	.mine-page.theme-dark .flight-action.danger {
		background: rgba(255, 118, 146, 0.14);
		color: rgba(255, 170, 186, 0.96);
	}

	.theme-dark .hero-name,
	.theme-dark .stats-value,
	.theme-dark .settings-title,
	.theme-dark .draft-tip-title,
	.theme-dark .tab-btn.active,
	.mine-page.theme-dark .flight-content {
		color: var(--ink);
	}

	.theme-dark .hero-id,
	.theme-dark .settings-btn,
	.theme-dark .stats-label,
	.theme-dark .settings-note,
	.theme-dark .draft-tip-desc,
	.theme-dark .tab-btn,
	.theme-dark .flight-date,
	.theme-dark .flight-meta,
	.mine-page.theme-dark .flight-content.muted {
		color: rgba(190, 198, 202, 0.78);
	}

	.theme-dark .hero-id,
	.theme-dark .settings-btn,
	.mine-page.theme-dark .settings-input {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(230, 237, 241, 0.08);
	}

	.theme-dark .tab-header,
	.mine-page.theme-dark .flight-footer {
		border-color: rgba(230, 237, 241, 0.06);
	}
</style>


