"use strict";
const common_appState = require("./app-state.js");
const pageTransitionMixin = {
  data() {
    return {
      pageTransitionVisible: false,
      pageTransitionTimer: null
    };
  },
  onShow() {
    const theme = this && this.appState ? this.appState.theme : void 0;
    common_appState.syncThemeWindow(theme);
    this.playPageTransition();
  },
  onHide() {
    this.clearPageTransitionTimer();
  },
  onUnload() {
    this.clearPageTransitionTimer();
  },
  methods: {
    playPageTransition(duration = 220) {
      this.clearPageTransitionTimer();
      this.pageTransitionVisible = true;
      this.pageTransitionTimer = setTimeout(() => {
        this.pageTransitionVisible = false;
        this.pageTransitionTimer = null;
      }, duration);
    },
    clearPageTransitionTimer() {
      if (this.pageTransitionTimer) {
        clearTimeout(this.pageTransitionTimer);
        this.pageTransitionTimer = null;
      }
      this.pageTransitionVisible = false;
    }
  }
};
exports.pageTransitionMixin = pageTransitionMixin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/page-transition.js.map
