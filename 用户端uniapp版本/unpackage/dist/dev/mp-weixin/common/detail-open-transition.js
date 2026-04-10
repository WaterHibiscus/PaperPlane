"use strict";
const common_vendor = require("./vendor.js");
const detailOpenTransitionMixin = {
  data() {
    return {
      detailOpenVisible: false,
      detailOpenTimer: null
    };
  },
  onHide() {
    this.clearDetailOpenTimer();
    this.detailOpenVisible = false;
  },
  onUnload() {
    this.clearDetailOpenTimer();
    this.detailOpenVisible = false;
  },
  methods: {
    clearDetailOpenTimer() {
      if (this.detailOpenTimer) {
        clearTimeout(this.detailOpenTimer);
        this.detailOpenTimer = null;
      }
    },
    openPlaneDetail(id, delay = 760) {
      if (!id || this.detailOpenVisible)
        return;
      this.detailOpenVisible = true;
      this.clearDetailOpenTimer();
      this.detailOpenTimer = setTimeout(() => {
        common_vendor.index.navigateTo({
          url: `/pages/detail/index?id=${id}`
        });
      }, delay);
    }
  }
};
exports.detailOpenTransitionMixin = detailOpenTransitionMixin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/detail-open-transition.js.map
