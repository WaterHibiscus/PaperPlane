<template>
	<view :class="['app-page', 'with-tabbar', 'home-page', themeClass]">
		<view class="hero glass-card">
			<view class="hero-top">
				<view class="brand">
					<view class="brand-mark">
						<image class="brand-mark-image" :src="icons.throwActive" mode="aspectFit" />
					</view>
					<text class="brand-name">纸飞机降落点</text>
				</view>
				<view class="icon-btn" @tap="handleToggleTheme">
					<image class="toggle-icon-image" :src="icons.settings" mode="aspectFit" />
				</view>
			</view>

			<view class="hero-title">
				<shatter-headline :phrases="headlinePhrases" />
			</view>
			<text class="hero-desc">在真实地点留下匿名回声，让某个未来的你刚好拾起它。</text>

			<view class="hero-actions">
				<view class="primary-pill" @tap="goThrow">
					<text>投掷一架</text>
				</view>
				<view class="ghost-pill" @tap="handleRandom">
					<text>{{ randomLoading ? '正在挑选' : '随机拾取' }}</text>
				</view>
			</view>

			<view class="hero-metrics">
				<view class="metric-card">
					<text class="metric-num">{{ totalPlanes }}</text>
					<text class="metric-label">飞行中</text>
				</view>
				<view class="metric-card">
					<text class="metric-num">{{ locations.length }}</text>
					<text class="metric-label">降落点</text>
				</view>
				<view class="metric-card">
					<text class="metric-num">{{ topTrending.length }}</text>
					<text class="metric-label">热度上升</text>
				</view>
			</view>

			<view class="search-box">
				<image class="search-icon-image" :src="icons.search" mode="aspectFit" />
				<input v-model="query" class="search-input" placeholder="搜索地点" placeholder-class="placeholder-text" />
			</view>
		</view>

		<view class="section-title">
			<!-- <text class="section-heading">落点地图</text> -->
		</view>
		<view class="glass-card map-shell">
			<view class="map-header">
				<view>
					<text class="map-title">校园信号</text>
					<text class="map-subtitle">选择一个地点启动扫描</text>
				</view>
				<view class="map-tags">
					<text class="map-tag">实时</text>
					<text class="map-tag">匿名</text>
					<text class="map-tag">校园</text>
				</view>
			</view>

			<view :class="['map-canvas', { 'map-canvas-dense': isDenseMap }]">
				<view class="signal-orbit orbit-a"></view>
				<view class="signal-orbit orbit-b"></view>

				<svg class="signal-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
					<defs>
						<linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stop-color="rgba(47, 158, 116, 0.15)" />
							<stop offset="45%" stop-color="rgba(47, 158, 116, 0.95)" />
							<stop offset="100%" stop-color="rgba(242, 122, 75, 0.95)" />
						</linearGradient>
						<filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="1.2" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					<path v-for="route in signalRoutes" :key="`route-base-${route.id}`" class="route-line"
						:d="route.path" :style="{
							'--route-width': route.width,
							'--route-opacity': route.opacity,
						}" />
					<path v-for="route in signalRoutes" :key="`route-glow-${route.id}`" class="route-glow"
						:d="route.path" :style="{
							'--route-width': route.width,
							'--route-duration': `${route.duration}s`,
							'--route-delay': `${route.glowDelay}s`,
						}" />

					<g v-for="route in signalRoutes" :key="`route-packet-${route.id}`">
						<circle class="route-packet" :r="route.packetSize">
							<animateMotion :dur="`${route.duration}s`" :begin="route.packetBegin"
								repeatCount="indefinite" :path="route.path" />
						</circle>
						<circle class="route-packet secondary" :r="route.packetSize * 0.72">
							<animateMotion :dur="`${route.duration}s`" :begin="route.secondaryPacketBegin"
								repeatCount="indefinite" :path="route.path" />
						</circle>
					</g>
				</svg>

				<view class="signal-hud" :style="hudStyle" @touchstart.stop="startHudDrag" @touchmove.stop.prevent="moveHudDrag"
					@touchend.stop="endHudDrag" @touchcancel.stop="endHudDrag">
					<view class="hud-top">
						<text class="hud-kicker">匿名信号网</text>
						<text class="hud-value">{{ totalPlanes }}</text>
					</view>
					<text class="hud-caption">{{ busiestLocationLabel }}</text>
				</view>

				<view v-for="(node, index) in mapNodes" :key="node.loc.id" class="map-station" :style="{
						'--x': `${node.x}%`,
						'--y': `${node.y}%`,
						'--halo': `${node.size}px`,
						'--delay': `${node.delay}s`,
						'--label-shift': node.labelShift,
					}" @tap="goDiscover(node.loc.name)">
					<view class="station-halo"></view>
					<view class="station-core">
						<image class="station-core-image" :src="node.loc.iconUrl || icons.location" mode="aspectFill" lazy-load />
					</view>
					<view class="station-label">
						<text class="station-name">{{ node.loc.name }}</text>
						<text v-if="!node.hideCount" class="station-count">{{ node.loc.planeCount }} 架</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="topTrending.length" class="trend-section">
			<view class="section-title">
				<text class="section-heading">热度上升</text>
				<text class="section-link" @tap="goTrending">查看更多</text>
			</view>
			<view v-for="(plane, index) in topTrending" :key="plane.id" class="glass-card trend-card"
				@tap="openDetail(plane.id)">
				<view class="trend-card-head">
					<text class="trend-rank">TOP {{ index + 1 }}</text>
					<text class="trend-hot-chip">+{{ plane.likeCount || 0 }}</text>
				</view>
				<text class="trend-content">{{ plane.content }}</text>
				<view class="trend-meta-row">
					<view class="trend-meta-left">
						<image class="trend-meta-icon" :src="icons.location" mode="aspectFit" />
						<text class="trend-meta">{{ plane.locationTag }} · {{ getPlaneAuthorLabelText(plane) }} · {{ plane.likeCount }} 赞</text>
					</view>
				</view>
				<view v-if="plane.imageUrls && plane.imageUrls.length" class="trend-media-row" @tap.stop>
					<view v-for="(imageUrl, imageIndex) in plane.imageUrls.slice(0, 3)" :key="plane.id + '-img-' + imageIndex"
						class="trend-media-item" @tap.stop="previewTrendImages(plane, imageIndex)">
						<image class="trend-media-image" :src="getAssetUrl(imageUrl)" mode="aspectFill" lazy-load />
						<view v-if="imageIndex === 2 && plane.imageUrls.length > 3" class="trend-media-mask">
							<text class="trend-media-mask-text">+{{ plane.imageUrls.length - 3 }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<detail-open-transition :visible="detailOpenVisible" :theme="appState.theme" />
		<page-transition :visible="pageTransitionVisible" :theme="appState.theme" />
		<app-tabbar active="home" :theme="appState.theme" />
	</view>
</template>

<script>
	import AppTabbar from '../../components/AppTabbar.vue'
	import DetailOpenTransition from '../../components/DetailOpenTransition.vue'
	import PageTransition from '../../components/PageTransition.vue'
	import ShatterHeadline from '../../components/ShatterHeadline.vue'
	import {
		appState,
		fetchLocations,
		setCurrentLocation,
		toggleTheme
	} from '../../common/app-state.js'
	import {
		getRandomPlane,
		getTrendingPlanes
	} from '../../common/api.js'
	import { getAssetUrl } from '../../common/api.js'
	import { getPlaneAuthorLabel } from '../../common/utils.js'
	import detailOpenTransitionMixin from '../../common/detail-open-transition.js'
	import pageTransitionMixin from '../../common/page-transition.js'
	import { uiIcons } from '../../common/ui-icons.js'

	export default {
		mixins: [pageTransitionMixin, detailOpenTransitionMixin],
		components: {
			AppTabbar,
			DetailOpenTransition,
			PageTransition,
			ShatterHeadline,
		},
		data() {
			return {
				appState,
				icons: uiIcons,
				query: '',
				trending: [],
				randomLoading: false,
				headlinePhrases: [
					'把心绪折成纸，交给校园的风',
					'把没说出口的话，留在路过的风景',
					'让匿名的回声，刚好落进谁手里',
					'把今天的情绪，投向一个真实地点',
					'给某个陌生同学，留下一次轻回应',
				],
				nodePresets: [{
						x: 16,
						y: 28,
						size: 70
					},
					{
						x: 40,
						y: 18,
						size: 62
					},
					{
						x: 70,
						y: 26,
						size: 74
					},
					{
						x: 28,
						y: 64,
						size: 68
					},
					{
						x: 58,
						y: 58,
						size: 80
					},
					{
						x: 82,
						y: 70,
						size: 60
					},
					{
						x: 12,
						y: 70,
						size: 58
					},
					{
						x: 48,
						y: 76,
						size: 66
					},
				],
				hudX: 0,
				hudY: 0,
				hudReady: false,
				hudDragging: false,
				hudDragOffsetX: 0,
				hudDragOffsetY: 0,
				mapCanvasRect: null,
				hudDragBounds: null,
			}
		},
		computed: {
			themeClass() {
				return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
			},
			isDark() {
				return this.appState.theme === 'dark'
			},
			locations() {
				return this.appState.locations || []
			},
			filteredLocations() {
				const keyword = (this.query || '').trim()
				if (!keyword) return this.locations
				return this.locations.filter(item => item.name.includes(keyword))
			},
			isDenseMap() {
				return this.filteredLocations.length >= 7
			},
			hudStyle() {
				if (!this.hudReady) return null
				return {
					left: `${this.hudX}px`,
					top: `${this.hudY}px`,
					right: 'auto',
				}
			},
			mapNodes() {
				const nowSec = Date.now() / 1000
				const orbitDuration = 3.6
				const densePositions = this.isDenseMap ? this.buildDensePositions(this.filteredLocations.length) : []
				const hideCount = this.isDenseMap && this.filteredLocations.length >= 9

				return this.filteredLocations.map((loc, index) => {
					const preset = this.isDenseMap
						? densePositions[index] || this.nodePresets[index % this.nodePresets.length]
						: this.nodePresets[index % this.nodePresets.length]
					const countBoost = Math.min(loc.planeCount || 0, 6) * 2
					let x = preset.x
					let y = preset.y
					if (!this.isDenseMap) {
						x += ((index % 3) - 1) * 1.4
						y += index % 2 === 0 ? -1 : 1
					}
					const safePoint = this.adjustForHudZone(x, y, this.isDenseMap ? 3 : 4, `node-${index}`)
					const size = this.isDenseMap
						? Math.min(Math.max(52 + countBoost * 0.65, 48), 72)
						: Math.min(Math.max(preset.size + countBoost, 56), 90)
					const labelShift = safePoint.x > 72 ? '-14px' : safePoint.x < 22 ? '14px' : '0px'
					const delay = this.getNegativeAnimationDelay(nowSec, index * 0.18, orbitDuration)

					return {
						loc,
						x: safePoint.x,
						y: safePoint.y,
						size,
						labelShift,
						delay,
						hideCount,
					}
				})
			},
			signalRoutes() {
				const nodes = this.mapNodes
				if (nodes.length < 2) return []
				const nowSec = Date.now() / 1000

				const pairs = this.isDenseMap ? this.buildDenseRoutePairs(nodes) : this.buildDefaultRoutePairs(nodes)

				const seen = new Set()

				return pairs
					.filter(([from, to]) => {
						if (!from || !to || from.loc.id === to.loc.id) return false
						const key = [from.loc.id, to.loc.id].sort((a, b) => a - b).join('-')
						if (seen.has(key)) return false
						seen.add(key)
						return true
					})
					.slice(0, this.isDenseMap ? 6 : 7)
					.map(([from, to], index) => {
						const heat = Math.max(from.loc.planeCount || 0, to.loc.planeCount || 0)
						const width = Math.min(2.8, 1.05 + heat * 0.18)

						return {
							id: `${from.loc.id}-${to.loc.id}-${index}`,
							path: this.createRoutePath(from, to, index),
							width,
							opacity: Math.min(0.78, 0.28 + heat * 0.08),
							duration: 5.4 + (index % 3) * 0.9,
							delay: index * 0.65,
							packetOffset: index * 0.65 + 1.8,
							packetSize: Math.min(2.2, 1.15 + heat * 0.08),
							glowDelay: this.getNegativeAnimationDelay(nowSec, index * 0.65, 5.4 + (index % 3) * 0.9),
							packetBegin: this.getNegativeMotionBegin(nowSec, index * 0.65, 5.4 + (index % 3) * 0.9),
							secondaryPacketBegin: this.getNegativeMotionBegin(nowSec, index * 0.65 + 1.8,
								5.4 + (index % 3) * 0.9),
						}
					})
			},
			totalPlanes() {
				return this.locations.reduce((sum, item) => sum + (item.planeCount || 0), 0)
			},
			topTrending() {
				return this.trending.slice(0, 3)
			},
			busiestLocationLabel() {
				if (!this.filteredLocations.length) return '等待新的投递进入网络'
				const sorted = this.filteredLocations.slice().sort((a, b) => (b.planeCount || 0) - (a.planeCount || 0))
				const hottest = sorted[0]
				if (!hottest || !hottest.planeCount) return '所有落点当前都很安静'
				return `${hottest.name} 最活跃 · ${hottest.planeCount} 架`
			},
		},
		watch: {
			filteredLocations() {
				this.scheduleMeasureMapCanvas()
			},
		},
		async onShow() {
			await this.loadHome()
			this.scheduleMeasureMapCanvas()
		},
		onReady() {
			this.scheduleMeasureMapCanvas()
		},
		methods: {
		normalizePhase(value, duration) {
			const mod = value % duration
			return mod < 0 ? mod + duration : mod
		},
		seededUnit(seed) {
			const text = String(seed)
			let h1 = 0x811c9dc5
			let h2 = 0x1b873593
			for (let index = 0; index < text.length; index += 1) {
				const code = text.charCodeAt(index)
				h1 = Math.imul(h1 ^ code, 0x85ebca6b)
				h2 = Math.imul(h2 ^ code, 0xc2b2ae35)
			}
			h1 ^= h1 >>> 16
			h1 = Math.imul(h1, 0x7feb352d)
			h1 ^= h1 >>> 15
			h2 ^= h2 >>> 16
			h2 = Math.imul(h2, 0x846ca68b)
			h2 ^= h2 >>> 15
			const hash = (h1 ^ h2) >>> 0
			return hash / 4294967295
		},
		clampPercent(value, min, max) {
			return Math.min(Math.max(value, min), max)
		},
		isInHudZone(x, y, padding = 0) {
			const minX = 62 - padding
			const maxX = 98 + padding
			const minY = 2 - padding
			const maxY = 34 + padding
			return x >= minX && x <= maxX && y >= minY && y <= maxY
		},
		adjustForHudZone(x, y, padding = 3, seed = '') {
			let nextX = Math.min(Math.max(x, 6), 94)
			let nextY = Math.min(Math.max(y, 12), 92)
			if (!this.isInHudZone(nextX, nextY, padding)) {
				return { x: nextX, y: nextY }
			}
			const centerX = 80
			const centerY = 18
			let step = 0
			while (this.isInHudZone(nextX, nextY, padding) && step < 10) {
				let dx = nextX - centerX
				let dy = nextY - centerY
				if (Math.abs(dx) + Math.abs(dy) < 0.01) {
					dx = this.seededUnit(`${seed}-dx-${step}`) - 0.5
					dy = this.seededUnit(`${seed}-dy-${step}`) - 0.5
				}
				const dist = Math.hypot(dx, dy) || 1
				const push = 3.4 + step * 0.7
				nextX += (dx / dist) * push
				nextY += (dy / dist) * push
				nextX = Math.min(Math.max(nextX, 6), 94)
				nextY = Math.min(Math.max(nextY, 12), 92)
				step += 1
			}
			return { x: nextX, y: nextY }
		},
		buildDefaultRoutePairs(nodes) {
			const pairs = []
			for (let index = 0; index < nodes.length - 1; index += 1) {
				pairs.push([nodes[index], nodes[index + 1]])
			}
			if (nodes.length > 2) {
				for (let index = 0; index < nodes.length; index += 2) {
					pairs.push([nodes[index], nodes[(index + 2) % nodes.length]])
				}
			}
			return pairs
		},
		buildDenseRoutePairs(nodes) {
			const edges = []
			for (let fromIndex = 0; fromIndex < nodes.length; fromIndex += 1) {
				for (let toIndex = fromIndex + 1; toIndex < nodes.length; toIndex += 1) {
					const from = nodes[fromIndex]
					const to = nodes[toIndex]
					const distance = Math.hypot(from.x - to.x, from.y - to.y)
					const jitter = this.seededUnit(`route-${from.loc.id}-${to.loc.id}`) * 1.2
					edges.push({
						from,
						to,
						distance,
						score: distance + jitter,
					})
				}
			}
			edges.sort((a, b) => a.score - b.score)
			const degreeById = Object.create(null)
			const maxRoutes = Math.min(6, Math.max(4, Math.ceil(nodes.length * 0.42)))
			const maxDistance = nodes.length <= 10 ? 44 : 40
			const pairs = []
			for (let index = 0; index < edges.length; index += 1) {
				const edge = edges[index]
				if (edge.distance > maxDistance) continue
				const fromId = edge.from.loc.id
				const toId = edge.to.loc.id
				const fromDegree = degreeById[fromId] || 0
				const toDegree = degreeById[toId] || 0
				if (fromDegree >= 2 || toDegree >= 2) continue
				pairs.push([edge.from, edge.to])
				degreeById[fromId] = fromDegree + 1
				degreeById[toId] = toDegree + 1
				if (pairs.length >= maxRoutes) break
			}
			if (pairs.length < 3) {
				return this.buildDefaultRoutePairs(nodes).slice(0, 4)
			}
			return pairs
		},
		buildDensePositions(total) {
			const points = []
			if (!total) return points
			const minX = 8
			const maxX = 92
			const minY = 12
			const maxY = 90
			const centerX = (minX + maxX) / 2
			const centerY = (minY + maxY) / 2
			const targetDist = total <= 8 ? 20 : total <= 12 ? 16 : total <= 16 ? 13 : 11
			const candidateCount = total <= 10 ? 120 : total <= 14 ? 104 : 88
			const quadrantCounts = {
				lt: 0,
				rt: 0,
				lb: 0,
				rb: 0,
			}
			const anchors = [
				{ x: minX + 4, y: minY + 5 },
				{ x: minX + 6, y: maxY - 6 },
				{ x: maxX - 6, y: maxY - 6 },
				{ x: centerX, y: minY + 6 },
				{ x: centerX, y: maxY - 6 },
			]
			const anchorCount = Math.min(total, anchors.length)
			for (let index = 0; index < anchorCount; index += 1) {
				const anchor = anchors[index]
				const jitterX = (this.seededUnit(`dense-anchor-${total}-${index}-x`) - 0.5) * 8
				const jitterY = (this.seededUnit(`dense-anchor-${total}-${index}-y`) - 0.5) * 8
				const safe = this.adjustForHudZone(anchor.x + jitterX, anchor.y + jitterY, 3, `dense-anchor-${total}-${index}`)
				const x = this.clampPercent(safe.x, minX, maxX)
				const y = this.clampPercent(safe.y, minY, maxY)
				points.push({ x, y })
				const key = x < centerX ? (y < centerY ? 'lt' : 'lb') : (y < centerY ? 'rt' : 'rb')
				quadrantCounts[key] += 1
			}
			for (let index = points.length; index < total; index += 1) {
				let best = null
				let bestScore = -Infinity
				for (let candidateIndex = 0; candidateIndex < candidateCount; candidateIndex += 1) {
					const unitX = this.seededUnit(`dense-${total}-${index}-${candidateIndex}-x`)
					const unitY = this.seededUnit(`dense-${total}-${index}-${candidateIndex}-y`)
					const jitterX = (this.seededUnit(`dense-${total}-${index}-${candidateIndex}-jx`) - 0.5) * 11
					const jitterY = (this.seededUnit(`dense-${total}-${index}-${candidateIndex}-jy`) - 0.5) * 11
					let x = minX + unitX * (maxX - minX) + jitterX
					let y = minY + unitY * (maxY - minY) + jitterY
					x = this.clampPercent(x, minX, maxX)
					y = this.clampPercent(y, minY, maxY)
					if (this.isInHudZone(x, y, 2.8)) continue
					let nearest = Number.POSITIVE_INFINITY
					for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
						const point = points[pointIndex]
						const distance = Math.hypot(x - point.x, y - point.y)
						if (distance < nearest) nearest = distance
					}
					if (!points.length) nearest = 999
					const radial = Math.hypot((x - centerX) / (maxX - minX), (y - centerY) / (maxY - minY))
					const edgeBoost = (index < total * 0.45 ? 4 : 1.8) * radial
					const key = x < centerX ? (y < centerY ? 'lt' : 'lb') : (y < centerY ? 'rt' : 'rb')
					const balancePenalty = quadrantCounts[key] * 1.35
					const softDistancePenalty = Math.abs(nearest - targetDist) * 0.16
					const randomBonus = this.seededUnit(`dense-${total}-${index}-${candidateIndex}-bonus`) * 0.95
					const score = nearest + edgeBoost - balancePenalty - softDistancePenalty + randomBonus
					if (score > bestScore) {
						bestScore = score
						best = { x, y }
					}
				}
				if (!best) {
					const fallbackX = minX + this.seededUnit(`dense-fallback-${total}-${index}-x`) * (maxX - minX)
					const fallbackY = minY + this.seededUnit(`dense-fallback-${total}-${index}-y`) * (maxY - minY)
					best = this.adjustForHudZone(fallbackX, fallbackY, 3.2, `dense-fallback-${index}`)
				}
				const safe = this.adjustForHudZone(best.x, best.y, 2.8, `dense-safe-${total}-${index}`)
				const x = this.clampPercent(safe.x, minX, maxX)
				const y = this.clampPercent(safe.y, minY, maxY)
				points.push({ x, y })
				const key = x < centerX ? (y < centerY ? 'lt' : 'lb') : (y < centerY ? 'rt' : 'rb')
				quadrantCounts[key] += 1
			}
			for (let iteration = 0; iteration < 4; iteration += 1) {
				for (let index = 0; index < points.length; index += 1) {
					const current = points[index]
					let forceX = 0
					let forceY = 0
					for (let targetIndex = 0; targetIndex < points.length; targetIndex += 1) {
						if (targetIndex === index) continue
						const other = points[targetIndex]
						const dx = current.x - other.x
						const dy = current.y - other.y
						const dist = Math.hypot(dx, dy) || 0.001
						if (dist >= targetDist * 0.92) continue
						const power = (targetDist * 0.92 - dist) / (targetDist * 0.92)
						forceX += (dx / dist) * power
						forceY += (dy / dist) * power
					}
					current.x += forceX * 0.72
					current.y += forceY * 0.72
					const safe = this.adjustForHudZone(current.x, current.y, 2.8, `relax-${index}-${iteration}`)
					current.x = this.clampPercent(safe.x, minX, maxX)
					current.y = this.clampPercent(safe.y, minY, maxY)
				}
			}
			for (let index = points.length - 1; index > 0; index -= 1) {
				const rand = this.seededUnit(`dense-shuffle-${total}-${index}`)
				const swapIndex = Math.floor(rand * (index + 1))
				const temp = points[index]
				points[index] = points[swapIndex]
				points[swapIndex] = temp
			}
			return points
		},
		scheduleMeasureMapCanvas() {
			this.$nextTick(() => {
				setTimeout(() => {
					this.measureMapCanvas()
				}, 24)
			})
		},
		measureMapCanvas() {
			const query = uni.createSelectorQuery().in(this)
			query.select('.map-canvas').boundingClientRect()
			query.select('.signal-hud').boundingClientRect()
			query.exec(res => {
				const canvasRect = res && res[0]
				const hudRect = res && res[1]
				if (!canvasRect || !canvasRect.width || !canvasRect.height) return
				this.mapCanvasRect = canvasRect
				this.hudDragBounds = this.getHudBounds(canvasRect, hudRect)
				if (!this.hudReady) {
					const defaultPos = this.getDefaultHudPosition(canvasRect, hudRect)
					this.hudX = defaultPos.x
					this.hudY = defaultPos.y
					this.hudReady = true
					return
				}
				const next = this.clampHudPosition(this.hudX, this.hudY)
				this.hudX = next.x
				this.hudY = next.y
			})
		},
		getHudBounds(canvasRect, hudRect) {
			const padding = 12
			const hudWidth = (hudRect && hudRect.width) || 152
			const hudHeight = (hudRect && hudRect.height) || 84
			return {
				minX: padding,
				minY: padding,
				maxX: Math.max(padding, canvasRect.width - hudWidth - padding),
				maxY: Math.max(padding, canvasRect.height - hudHeight - padding),
			}
		},
		getDefaultHudPosition(canvasRect, hudRect) {
			const bounds = this.getHudBounds(canvasRect, hudRect)
			return {
				x: bounds.maxX,
				y: bounds.minY + 2,
			}
		},
		clampHudPosition(x, y) {
			const bounds = this.hudDragBounds
			if (!bounds) return { x, y }
			return {
				x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
				y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
			}
		},
		getTouchPoint(event) {
			return (event && event.touches && event.touches[0]) || (event && event.changedTouches && event.changedTouches[0]) || null
		},
		startHudDrag(event) {
			const touch = this.getTouchPoint(event)
			if (!touch) return
			if (!this.mapCanvasRect || !this.hudDragBounds) {
				this.measureMapCanvas()
				return
			}
			this.hudDragging = true
			this.hudDragOffsetX = touch.pageX - this.mapCanvasRect.left - this.hudX
			this.hudDragOffsetY = touch.pageY - this.mapCanvasRect.top - this.hudY
		},
		moveHudDrag(event) {
			if (!this.hudDragging) return
			const touch = this.getTouchPoint(event)
			if (!touch || !this.mapCanvasRect) return
			const nextX = touch.pageX - this.mapCanvasRect.left - this.hudDragOffsetX
			const nextY = touch.pageY - this.mapCanvasRect.top - this.hudDragOffsetY
			const next = this.clampHudPosition(nextX, nextY)
			this.hudX = next.x
			this.hudY = next.y
		},
		endHudDrag() {
			this.hudDragging = false
		},
		getNegativeAnimationDelay(nowSec, offsetSec, durationSec) {
			return -this.normalizePhase(nowSec - offsetSec, durationSec)
		},
		getNegativeMotionBegin(nowSec, offsetSec, durationSec) {
			return `${this.getNegativeAnimationDelay(nowSec, offsetSec, durationSec)}s`
		},
		createRoutePath(from, to, index) {
			const fromPoint = this.adjustForHudZone(from.x, from.y, 2, `route-from-${index}`)
			const toPoint = this.adjustForHudZone(to.x, to.y, 2, `route-to-${index}`)
			const dx = toPoint.x - fromPoint.x
			const dy = toPoint.y - fromPoint.y
			const distance = Math.hypot(dx, dy) || 1
			const normalX = -dy / distance
			const normalY = dx / distance
			const bend = Math.min(16, 8 + distance * 0.12) * (index % 2 === 0 ? 1 : -1)
			const p1 = this.adjustForHudZone(fromPoint.x + dx * 0.32 + normalX * bend, fromPoint.y + dy * 0.18 + normalY * bend, 1, `route-c1-${index}`)
			const p2 = this.adjustForHudZone(fromPoint.x + dx * 0.68 + normalX * bend, fromPoint.y + dy * 0.82 + normalY * bend, 1, `route-c2-${index}`)
			return `M ${fromPoint.x} ${fromPoint.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${toPoint.x} ${toPoint.y}`
		},
			async loadHome() {
				await fetchLocations()
				try {
					this.trending = await getTrendingPlanes()
				} catch (error) {
					this.trending = []
				}
				this.scheduleMeasureMapCanvas()
			},
			handleToggleTheme() {
				toggleTheme()
			},
			goThrow() {
				uni.reLaunch({
					url: '/pages/throw/index',
				})
			},
			goTrending() {
				uni.reLaunch({
					url: '/pages/trending/index',
				})
			},
			goDiscover(name) {
				setCurrentLocation(name)
				uni.reLaunch({
					url: '/pages/discover/index',
				})
			},
			openDetail(id) {
				this.openPlaneDetail(id)
			},
			previewTrendImages(plane, currentIndex = 0) {
				const urls = (plane?.imageUrls || []).map(item => getAssetUrl(item)).filter(Boolean)
				if (!urls.length) return
				const safeIndex = Math.max(0, Math.min(currentIndex, urls.length - 1))
				uni.previewImage({
					urls,
					current: urls[safeIndex],
				})
			},
			async handleRandom() {
				if (this.randomLoading) return
				this.randomLoading = true
				try {
					const plane = await getRandomPlane()
					this.openDetail(plane.id)
				} catch (error) {
					uni.showToast({
						title: error.message || '暂无飞机可拾取',
						icon: 'none',
					})
				} finally {
					this.randomLoading = false
				}
			},
			getPlaneAuthorLabelText(plane) {
				return getPlaneAuthorLabel(plane)
			},
			getAssetUrl,
		},
	}
</script>

<style scoped>
	.home-page {
		padding-top: calc(env(safe-area-inset-top) + 36rpx);
	}

	.hero {
		padding: 34rpx;
		overflow: hidden;
		position: relative;
		background:
			radial-gradient(circle at 14% 18%, rgba(47, 158, 116, 0.14), transparent 34%),
			radial-gradient(circle at 88% 14%, rgba(242, 122, 75, 0.14), transparent 30%),
			linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8) 58%, rgba(238, 244, 241, 0.96));
		border-color: rgba(28, 36, 40, 0.06);
		box-shadow:
			0 24rpx 60rpx rgba(31, 36, 40, 0.12),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.5);
	}

	.theme-dark .hero {
		background:
			radial-gradient(circle at 16% 18%, rgba(92, 110, 123, 0.16), transparent 34%),
			radial-gradient(circle at 86% 14%, rgba(103, 86, 76, 0.14), transparent 30%),
			linear-gradient(145deg, rgba(16, 22, 26, 0.96), rgba(20, 28, 32, 0.92) 58%, rgba(24, 32, 36, 0.9));
		border-color: rgba(230, 237, 241, 0.06);
		box-shadow:
			0 24rpx 60rpx rgba(0, 0, 0, 0.28),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.04);
	}

	.hero::before {
		content: '';
		position: absolute;
		left: -72rpx;
		bottom: -96rpx;
		width: 280rpx;
		height: 280rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 207, 90, 0.16), transparent 70%);
	}

	.hero::after {
		content: '';
		position: absolute;
		width: 260rpx;
		height: 260rpx;
		border-radius: 50%;
		right: -90rpx;
		top: -110rpx;
		background: radial-gradient(circle, rgba(47, 158, 116, 0.22), transparent 70%);
	}

	.theme-dark .hero::before {
		background: radial-gradient(circle, rgba(122, 98, 83, 0.14), transparent 72%);
	}

	.theme-dark .hero::after {
		background: radial-gradient(circle, rgba(110, 130, 142, 0.18), transparent 72%);
	}

	.hero-top,
	.hero-title,
	.hero-desc,
	.hero-actions,
	.hero-metrics,
	.search-box {
		position: relative;
		z-index: 1;
	}

	.hero-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 22rpx;
	}

	.brand {
		display: flex;
		align-items: center;
	}

	.brand-mark {
		width: 70rpx;
		height: 70rpx;
		border-radius: 22rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(47, 158, 116, 0.14);
		margin-right: 14rpx;
	}

	.brand-mark-image {
		width: 34rpx;
		height: 34rpx;
		display: block;
	}

	.brand-name {
		font-size: 34rpx;
		font-weight: 700;
	}

	.toggle-icon-image {
		width: 30rpx;
		height: 30rpx;
		display: block;
	}

	.hero-title {
		font-size: 36rpx;
		line-height: 1.45;
		font-weight: 700;
		min-height: 122rpx;
	}

	.hero-desc {
		margin-top: 12rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: var(--muted);
	}

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 18rpx;
		margin-top: 28rpx;
	}

	.hero-metrics {
		display: flex;
		gap: 16rpx;
		margin-top: 28rpx;
	}

	.metric-card {
		flex: 1;
		padding: 18rpx 12rpx;
		border-radius: 24rpx;
		text-align: center;
		background: rgba(255, 255, 255, 0.72);
		border: 2rpx solid var(--border);
	}

	.theme-dark .metric-card {
		background: rgba(20, 28, 32, 0.88);
	}

	.metric-num {
		display: block;
		font-size: 36rpx;
		font-weight: 700;
		color: var(--accent);
	}

	.metric-label {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: var(--muted);
	}

	.search-box {
		display: flex;
		align-items: center;
		margin-top: 24rpx;
		padding: 0 24rpx;
		height: 86rpx;
		border-radius: 26rpx;
		background: rgba(255, 255, 255, 0.74);
		border: 2rpx solid var(--border);
	}

	.theme-dark .search-box {
		background: rgba(20, 28, 32, 0.88);
	}

	.search-icon-image {
		width: 28rpx;
		height: 28rpx;
		margin-right: 14rpx;
		opacity: 0.82;
	}

	.search-input {
		flex: 1;
		height: 86rpx;
		font-size: 26rpx;
		color: var(--ink);
	}

	.map-shell {
		padding: 28rpx;
		position: relative;
		overflow: hidden;
	}

	.map-shell::after {
		content: '';
		position: absolute;
		inset: -50rpx;
		background:
			radial-gradient(circle at 20% 20%, rgba(47, 158, 116, 0.12), transparent 45%),
			radial-gradient(circle at 80% 10%, rgba(242, 122, 75, 0.12), transparent 42%),
			radial-gradient(circle at 72% 74%, rgba(255, 207, 90, 0.12), transparent 42%);
		opacity: 0.62;
		pointer-events: none;
	}

	.theme-dark .map-shell::after {
		background:
			radial-gradient(circle at 20% 20%, rgba(113, 135, 150, 0.08), transparent 42%),
			radial-gradient(circle at 80% 10%, rgba(138, 102, 82, 0.08), transparent 38%),
			radial-gradient(circle at 72% 74%, rgba(82, 101, 115, 0.08), transparent 40%);
		opacity: 0.42;
	}

	.map-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
		position: relative;
		z-index: 1;
	}

	.map-title {
		display: block;
		font-size: 32rpx;
		font-weight: 700;
	}

	.map-subtitle {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: var(--muted);
	}

	.map-tags {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 10rpx;
		max-width: 240rpx;
	}

	.map-tag {
		padding: 8rpx 16rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		color: var(--accent);
		background: rgba(47, 158, 116, 0.12);
	}

	.map-canvas {
		position: relative;
		height: 640rpx;
		margin-top: 18rpx;
		border-radius: 32rpx;
		background:
			radial-gradient(circle at 20% 20%, rgba(47, 158, 116, 0.14), transparent 40%),
			radial-gradient(circle at 80% 80%, rgba(242, 122, 75, 0.14), transparent 40%),
			linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.78));
		border: 2rpx solid var(--border);
		overflow: hidden;
		z-index: 1;
	}

	.map-canvas.map-canvas-dense {
		height: 720rpx;
	}

	.theme-dark .map-canvas {
		background:
			radial-gradient(circle at 16% 18%, rgba(92, 110, 123, 0.16), transparent 34%),
			radial-gradient(circle at 84% 22%, rgba(103, 86, 76, 0.12), transparent 30%),
			linear-gradient(145deg, rgba(12, 16, 19, 0.96), rgba(18, 22, 26, 0.92) 46%, rgba(23, 28, 33, 0.88));
		border-color: rgba(230, 237, 241, 0.06);
	}

	.map-canvas::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(47, 158, 116, 0.08) 2rpx, transparent 2rpx),
			linear-gradient(90deg, rgba(47, 158, 116, 0.08) 2rpx, transparent 2rpx);
		background-size: 92rpx 92rpx;
		opacity: 0.5;
		pointer-events: none;
	}

	.theme-dark .map-canvas::before {
		background-image:
			linear-gradient(rgba(226, 232, 237, 0.035) 2rpx, transparent 2rpx),
			linear-gradient(90deg, rgba(226, 232, 237, 0.035) 2rpx, transparent 2rpx);
		opacity: 0.28;
	}

	.map-canvas::after {
		content: '';
		position: absolute;
		inset: -60rpx;
		background:
			radial-gradient(circle at 72% 28%, rgba(47, 158, 116, 0.18), transparent 40%),
			radial-gradient(circle at 28% 72%, rgba(255, 207, 90, 0.16), transparent 42%);
		opacity: 0.42;
		pointer-events: none;
	}

	.theme-dark .map-canvas::after {
		background:
			radial-gradient(circle at 72% 28%, rgba(110, 130, 142, 0.14), transparent 40%),
			radial-gradient(circle at 28% 72%, rgba(122, 98, 83, 0.12), transparent 42%);
		opacity: 0.3;
	}

	.signal-orbit {
		position: absolute;
		border-radius: 999rpx;
		border: 2rpx solid rgba(47, 158, 116, 0.14);
		background: radial-gradient(circle, rgba(47, 158, 116, 0.08), transparent 72%);
		pointer-events: none;
		z-index: 1;
	}

	.theme-dark .signal-orbit {
		border-color: rgba(230, 237, 241, 0.06);
		background: radial-gradient(circle, rgba(126, 142, 153, 0.07), transparent 72%);
	}

	.orbit-a {
		width: 420rpx;
		height: 420rpx;
		left: -56rpx;
		bottom: -180rpx;
		animation: orbit-drift 16s ease-in-out infinite;
	}

	.orbit-b {
		width: 340rpx;
		height: 340rpx;
		right: -72rpx;
		top: -88rpx;
		animation: orbit-drift 14s ease-in-out infinite reverse;
	}

	.signal-hud {
		position: absolute;
		right: 20rpx;
		top: 20rpx;
		z-index: 3;
		min-width: 250rpx;
		max-width: 320rpx;
		padding: 18rpx 22rpx;
		border-radius: 24rpx;
		background: rgba(255, 255, 255, 0.72);
		border: 2rpx solid rgba(47, 158, 116, 0.16);
		box-shadow: 0 16rpx 36rpx rgba(31, 36, 40, 0.1);
		backdrop-filter: blur(16rpx);
		touch-action: none;
		user-select: none;
		transition: box-shadow 0.2s ease;
	}

	.theme-dark .signal-hud {
		background: rgba(15, 19, 23, 0.84);
		border-color: rgba(230, 237, 241, 0.06);
		box-shadow: 0 14rpx 30rpx rgba(0, 0, 0, 0.24);
	}

	.map-canvas-dense .map-station {
		gap: 4px;
	}

	.map-canvas-dense .station-core {
		width: 26px;
		height: 26px;
		border-radius: 8px;
	}

	.map-canvas-dense .station-label {
		padding: 4px 8px;
		max-width: 118px;
		gap: 4px;
	}

	.map-canvas-dense .station-name {
		max-width: 86px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 10px;
	}

	.hud-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18rpx;
		margin-bottom: 6rpx;
	}

	.hud-kicker,
	.hud-caption {
		display: block;
		font-size: 20rpx;
		color: var(--muted);
	}

	.hud-kicker {
		letter-spacing: 3rpx;
		text-transform: uppercase;
	}

	.hud-value {
		flex-shrink: 0;
		font-size: 46rpx;
		font-weight: 700;
		line-height: 1;
		color: var(--ink);
	}

	.hud-caption {
		line-height: 1.4;
		color: var(--accent);
	}

	.signal-network {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 2;
	}

	.route-line,
	.route-glow {
		fill: none;
		stroke-linecap: round;
	}

	.route-line {
		stroke: rgba(47, 158, 116, 0.16);
		stroke-width: var(--route-width);
		opacity: var(--route-opacity);
	}

	.route-glow {
		stroke: url(#routeGradient);
		stroke-width: calc(var(--route-width) + 0.4);
		stroke-dasharray: 12 18;
		filter: url(#routeGlow);
		animation: route-flow var(--route-duration) linear infinite;
		animation-delay: var(--route-delay);
	}

	.route-packet {
		fill: var(--accent-3);
		opacity: 0.95;
		filter: drop-shadow(0 0 10px rgba(255, 207, 90, 0.65));
	}

	.route-packet.secondary {
		fill: var(--accent);
		opacity: 0.55;
		filter: drop-shadow(0 0 8px rgba(47, 158, 116, 0.5));
	}

	.map-station {
		position: absolute;
		left: var(--x);
		top: var(--y);
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translate(-50%, -50%);
		gap: 6px;
		z-index: 2;
	}

	.map-station:active {
		transform: translate(-50%, -50%) scale(0.96);
	}

	.station-halo {
		position: absolute;
		width: var(--halo);
		height: var(--halo);
		border-radius: 50%;
		background: radial-gradient(circle, rgba(47, 158, 116, 0.22), transparent 60%);
		opacity: 0.6;
		animation: halo-pulse 3.6s ease-in-out infinite;
		animation-delay: var(--delay);
		z-index: 0;
	}

	.station-core {
		width: 30px;
		height: 30px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid var(--border);
		box-shadow: 0 8px 18px rgba(31, 36, 40, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
		animation: core-float 3.6s ease-in-out infinite;
		animation-delay: var(--delay);
	}

	.theme-dark .station-core {
		background: rgba(20, 24, 29, 0.94);
		border-color: rgba(230, 237, 241, 0.08);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.22);
	}

	.station-core-image {
		width: 100%;
		height: 100%;
		display: block;
		border-radius: inherit;
	}

	.station-label {
		padding: 6px 10px;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.86);
		border: 1px solid var(--border);
		box-shadow: 0 6px 14px rgba(31, 36, 40, 0.08);
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
		z-index: 1;
		transform: translateX(var(--label-shift, 0));
	}

	.theme-dark .station-label {
		background: rgba(16, 20, 24, 0.86);
		border-color: rgba(230, 237, 241, 0.06);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.16);
	}

	.station-name {
		font-size: 11px;
		color: var(--ink);
		white-space: nowrap;
	}

	.station-count {
		font-size: 11px;
		font-weight: 600;
		color: var(--accent);
		white-space: nowrap;
	}

	@keyframes route-flow {
		from {
			stroke-dashoffset: 0;
		}

		to {
			stroke-dashoffset: -120;
		}
	}

	@keyframes orbit-drift {

		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(0.98);
			opacity: 0.45;
		}

		50% {
			transform: translate3d(10rpx, -12rpx, 0) scale(1.04);
			opacity: 0.8;
		}
	}

	@keyframes core-float {

		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-6rpx);
		}
	}

	@keyframes halo-pulse {

		0%,
		100% {
			transform: scale(0.92);
			opacity: 0.45;
		}

		50% {
			transform: scale(1.05);
			opacity: 0.75;
		}
	}

	.trend-section {
		margin-top: 6rpx;
	}

	.section-link {
		font-size: 24rpx;
		color: var(--accent);
	}

	.trend-card {
		padding: 24rpx 28rpx;
		margin-bottom: 18rpx;
	}

	.trend-card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14rpx;
	}

	.trend-rank {
		display: block;
		font-size: 22rpx;
		font-weight: 700;
		color: var(--accent-2);
	}

	.trend-hot-chip {
		display: inline-flex;
		align-items: center;
		height: 44rpx;
		padding: 0 16rpx;
		border-radius: 999rpx;
		background: rgba(47, 158, 116, 0.14);
		color: var(--accent);
		font-size: 20rpx;
		font-weight: 700;
	}

	.trend-content {
		display: -webkit-box;
		margin-top: 10rpx;
		font-size: 28rpx;
		line-height: 1.7;
		word-break: break-word;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trend-meta {
		font-size: 22rpx;
		color: var(--muted);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.trend-meta-row {
		display: flex;
		align-items: center;
		gap: 14rpx;
		margin-top: 14rpx;
	}

	.trend-meta-left {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
		min-width: 0;
		flex: 1;
	}

	.trend-meta-icon {
		width: 24rpx;
		height: 24rpx;
		flex-shrink: 0;
		opacity: 0.85;
	}

	.trend-media-row {
		width: 100%;
		display: flex;
		gap: 10rpx;
		margin-top: 16rpx;
	}

	.trend-media-item {
		position: relative;
		flex: 1;
		height: 136rpx;
		border-radius: 18rpx;
		overflow: hidden;
		border: 2rpx solid rgba(47, 158, 116, 0.14);
		background: rgba(255, 255, 255, 0.6);
		transition: transform 0.14s ease;
	}

	.theme-dark .trend-media-item {
		border-color: rgba(230, 237, 241, 0.08);
		background: rgba(14, 20, 24, 0.72);
	}

	.trend-media-item:active {
		transform: scale(0.98);
	}

	.trend-media-image {
		width: 100%;
		height: 100%;
		display: block;
	}

	.trend-media-mask {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 20, 22, 0.44);
	}

	.trend-media-mask-text {
		font-size: 24rpx;
		font-weight: 700;
		color: #ffffff;
	}
</style>
