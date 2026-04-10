<template>
	<view :class="['shatter-headline', `phase-${phase}`]">
		<text
			v-for="piece in pieces"
			:key="piece.key"
			class="headline-piece"
			:style="{
				'--dx': `${piece.dx}rpx`,
				'--dy': `${piece.dy}rpx`,
				'--rot': `${piece.rot}deg`,
				'--delay': `${piece.delay}ms`,
				'--blur': `${piece.blur}rpx`,
				'--assemble-x': `${piece.assembleX}rpx`,
				'--assemble-y': `${piece.assembleY}rpx`,
			}"
		>
			{{ piece.char === ' ' ? '\u00A0' : piece.char }}
		</text>
	</view>
</template>

<script>
export default {
	props: {
		phrases: {
			type: Array,
			default: () => [],
		},
		hold: {
			type: Number,
			default: 2600,
		},
		duration: {
			type: Number,
			default: 820,
		},
	},
	data() {
		return {
			phase: 'stable',
			activeIndex: 0,
			pieces: [],
			cycleSeed: 0,
			holdTimer: null,
			shatterTimer: null,
			assembleTimer: null,
		}
	},
	watch: {
		phrases: {
			immediate: true,
			deep: true,
			handler(phrases) {
				this.resetPieces(phrases)
			},
		},
	},
	beforeUnmount() {
		this.clearTimers()
	},
	beforeDestroy() {
		this.clearTimers()
	},
	methods: {
		randomBetween(min, max) {
			return Math.random() * (max - min) + min
		},
		clearTimers() {
			if (this.holdTimer) clearTimeout(this.holdTimer)
			if (this.shatterTimer) clearTimeout(this.shatterTimer)
			if (this.assembleTimer) clearTimeout(this.assembleTimer)

			this.holdTimer = null
			this.shatterTimer = null
			this.assembleTimer = null
		},
		buildPieces(text, mode) {
			return Array.from(text || '').map((char, index) => ({
				key: `${this.cycleSeed}-${mode}-${index}-${char}`,
				char,
				dx: this.randomBetween(-24, 24),
				dy: this.randomBetween(22, 48),
				rot: this.randomBetween(-22, 22),
				delay: index * 28,
				blur: this.randomBetween(2, 6),
				assembleX: this.randomBetween(-18, 18),
				assembleY: this.randomBetween(18, 34),
			}))
		},
		resetPieces(phrases) {
			this.clearTimers()
			this.activeIndex = 0
			this.cycleSeed += 1
			this.phase = 'stable'
			this.pieces = this.buildPieces((phrases && phrases[0]) || '', 'stable')
			this.scheduleNextCycle()
		},
		scheduleNextCycle() {
			this.clearTimers()

			if (!this.phrases || this.phrases.length < 2) return

			this.holdTimer = setTimeout(() => {
				this.phase = 'shatter'

				this.shatterTimer = setTimeout(() => {
					this.activeIndex = (this.activeIndex + 1) % this.phrases.length
					this.cycleSeed += 1
					this.pieces = this.buildPieces(this.phrases[this.activeIndex], 'assemble')
					this.phase = 'assemble'

					this.assembleTimer = setTimeout(() => {
						this.phase = 'stable'
						this.scheduleNextCycle()
					}, this.duration)
				}, this.duration)
			}, this.hold)
		},
	},
}
</script>

<style scoped>
.shatter-headline {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	min-height: 122rpx;
	padding-bottom: 18rpx;
	overflow: visible;
}

.headline-piece {
	display: inline-block;
	position: relative;
	transform-origin: 50% 100%;
	will-change: transform, opacity, filter;
}

.phase-stable .headline-piece {
	transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
	opacity: 1;
	filter: blur(0);
}

.phase-shatter .headline-piece {
	animation: shatter-fall 820ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
	animation-delay: var(--delay);
}

.phase-assemble .headline-piece {
	opacity: 0;
	animation: shatter-rise 820ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	animation-delay: var(--delay);
}

@keyframes shatter-fall {
	0% {
		transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
		opacity: 1;
		filter: blur(0);
	}
	45% {
		opacity: 1;
	}
	100% {
		transform: translate3d(var(--dx), var(--dy), 0) rotate(var(--rot)) scale(0.78);
		opacity: 0;
		filter: blur(var(--blur));
	}
}

@keyframes shatter-rise {
	0% {
		transform: translate3d(var(--assemble-x), var(--assemble-y), 0) rotate(var(--rot)) scale(0.82);
		opacity: 0;
		filter: blur(var(--blur));
	}
	55% {
		opacity: 1;
	}
	100% {
		transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
		opacity: 1;
		filter: blur(0);
	}
}
</style>
