<template>
  <span class="shatter-headline" :class="`phase-${phase}`" aria-live="polite">
    <span
      v-for="piece in pieces"
      :key="piece.key"
      class="headline-piece"
      :style="{
        '--dx': `${piece.dx}px`,
        '--dy': `${piece.dy}px`,
        '--rot': `${piece.rot}deg`,
        '--delay': `${piece.delay}ms`,
        '--blur': `${piece.blur}px`,
        '--assemble-x': `${piece.assembleX}px`,
        '--assemble-y': `${piece.assembleY}px`,
      }"
    >
      {{ piece.char === ' ' ? '\u00A0' : piece.char }}
    </span>
  </span>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
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
})

const phase = ref('stable')
const activeIndex = ref(0)
const pieces = ref([])
const cycleSeed = ref(0)

let holdTimer = null
let shatterTimer = null
let assembleTimer = null

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function clearTimers() {
  if (holdTimer) window.clearTimeout(holdTimer)
  if (shatterTimer) window.clearTimeout(shatterTimer)
  if (assembleTimer) window.clearTimeout(assembleTimer)

  holdTimer = null
  shatterTimer = null
  assembleTimer = null
}

function buildPieces(text, mode = 'stable') {
  return Array.from(text || '').map((char, index) => ({
    key: `${cycleSeed.value}-${mode}-${index}-${char}`,
    char,
    dx: randomBetween(-14, 14),
    dy: randomBetween(16, 34),
    rot: randomBetween(-22, 22),
    delay: index * 28,
    blur: randomBetween(3, 6),
    assembleX: randomBetween(-10, 10),
    assembleY: randomBetween(14, 26),
  }))
}

function scheduleNextCycle() {
  clearTimers()

  if (props.phrases.length < 2) return

  holdTimer = window.setTimeout(() => {
    phase.value = 'shatter'

    shatterTimer = window.setTimeout(() => {
      activeIndex.value = (activeIndex.value + 1) % props.phrases.length
      cycleSeed.value += 1
      pieces.value = buildPieces(props.phrases[activeIndex.value], 'assemble')
      phase.value = 'assemble'

      assembleTimer = window.setTimeout(() => {
        phase.value = 'stable'
        scheduleNextCycle()
      }, props.duration)
    }, props.duration)
  }, props.hold)
}

watch(
  () => props.phrases,
  phrases => {
    clearTimers()
    activeIndex.value = 0
    cycleSeed.value += 1
    pieces.value = buildPieces(phrases[0] || '', 'stable')
    phase.value = 'stable'
    scheduleNextCycle()
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style scoped>
.shatter-headline {
  display: inline-flex;
  align-items: flex-start;
  white-space: nowrap;
  min-height: calc(1.2em + 0.8em);
  padding-bottom: 0.8em;
  overflow: visible;
}

.headline-piece {
  display: inline-block;
  position: relative;
  will-change: transform, opacity, filter;
  transform-origin: 50% 100%;
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
    transform: translate3d(var(--assemble-x), var(--assemble-y), 0) rotate(calc(var(--rot) * -0.65)) scale(0.82);
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
