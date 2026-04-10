"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  props: {
    phrases: {
      type: Array,
      default: () => []
    },
    hold: {
      type: Number,
      default: 2600
    },
    duration: {
      type: Number,
      default: 820
    }
  },
  data() {
    return {
      phase: "stable",
      activeIndex: 0,
      pieces: [],
      cycleSeed: 0,
      holdTimer: null,
      shatterTimer: null,
      assembleTimer: null
    };
  },
  watch: {
    phrases: {
      immediate: true,
      deep: true,
      handler(phrases) {
        this.resetPieces(phrases);
      }
    }
  },
  beforeUnmount() {
    this.clearTimers();
  },
  beforeDestroy() {
    this.clearTimers();
  },
  methods: {
    randomBetween(min, max) {
      return Math.random() * (max - min) + min;
    },
    clearTimers() {
      if (this.holdTimer)
        clearTimeout(this.holdTimer);
      if (this.shatterTimer)
        clearTimeout(this.shatterTimer);
      if (this.assembleTimer)
        clearTimeout(this.assembleTimer);
      this.holdTimer = null;
      this.shatterTimer = null;
      this.assembleTimer = null;
    },
    buildPieces(text, mode) {
      return Array.from(text || "").map((char, index) => ({
        key: `${this.cycleSeed}-${mode}-${index}-${char}`,
        char,
        dx: this.randomBetween(-24, 24),
        dy: this.randomBetween(22, 48),
        rot: this.randomBetween(-22, 22),
        delay: index * 28,
        blur: this.randomBetween(2, 6),
        assembleX: this.randomBetween(-18, 18),
        assembleY: this.randomBetween(18, 34)
      }));
    },
    resetPieces(phrases) {
      this.clearTimers();
      this.activeIndex = 0;
      this.cycleSeed += 1;
      this.phase = "stable";
      this.pieces = this.buildPieces(phrases && phrases[0] || "", "stable");
      this.scheduleNextCycle();
    },
    scheduleNextCycle() {
      this.clearTimers();
      if (!this.phrases || this.phrases.length < 2)
        return;
      this.holdTimer = setTimeout(() => {
        this.phase = "shatter";
        this.shatterTimer = setTimeout(() => {
          this.activeIndex = (this.activeIndex + 1) % this.phrases.length;
          this.cycleSeed += 1;
          this.pieces = this.buildPieces(this.phrases[this.activeIndex], "assemble");
          this.phase = "assemble";
          this.assembleTimer = setTimeout(() => {
            this.phase = "stable";
            this.scheduleNextCycle();
          }, this.duration);
        }, this.duration);
      }, this.hold);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.pieces, (piece, k0, i0) => {
      return {
        a: common_vendor.t(piece.char === " " ? " " : piece.char),
        b: piece.key,
        c: `${piece.dx}rpx`,
        d: `${piece.dy}rpx`,
        e: `${piece.rot}deg`,
        f: `${piece.delay}ms`,
        g: `${piece.blur}rpx`,
        h: `${piece.assembleX}rpx`,
        i: `${piece.assembleY}rpx`
      };
    }),
    b: common_vendor.n(`phase-${$data.phase}`)
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d23ac1b6"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/ShatterHeadline.js.map
