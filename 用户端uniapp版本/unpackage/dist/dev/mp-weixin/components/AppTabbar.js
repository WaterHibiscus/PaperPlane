"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  props: {
    active: {
      type: String,
      default: "home"
    },
    theme: {
      type: String,
      default: "light"
    }
  },
  data() {
    return {
      tabs: [
        {
          key: "home",
          label: "Home",
          iconType: "image",
          icon: "/static/images/首页.png",
          activeIcon: "/static/images/首页选中.png",
          path: "/pages/home/index"
        },
        {
          key: "discover",
          label: "Radar",
          iconType: "image",
          icon: "/static/images/雷达.png",
          activeIcon: "/static/images/雷达选中.png",
          path: "/pages/discover/index"
        },
        {
          key: "throw",
          label: "Throw",
          iconType: "image",
          icon: "/static/images/投掷.png",
          activeIcon: "/static/images/投掷选中.png",
          path: "/pages/throw/index"
        },
        {
          key: "trending",
          label: "Trending",
          iconType: "image",
          icon: "/static/images/热门.png",
          activeIcon: "/static/images/热门选中.png",
          path: "/pages/trending/index"
        },
        {
          key: "mine",
          label: "Mine",
          iconType: "text",
          icon: "◉",
          activeIcon: "◉",
          path: "/pages/mine/index"
        }
      ],
      maskPlane: "✈",
      maskText: "纸飞机正在穿过这片风场",
      notchWidth: 26,
      notchDepth: 28,
      notchCurve: 7,
      visualActive: "home",
      overlayVisible: false,
      navigating: false,
      navigationTimer: null
    };
  },
  computed: {
    themeClass() {
      return this.theme === "dark" ? "theme-dark" : "theme-light";
    },
    activeIndex() {
      const index = this.tabs.findIndex((item) => item.key === this.visualActive);
      return index === -1 ? 0 : index;
    },
    activeTab() {
      return this.tabs[this.activeIndex] || this.tabs[0];
    },
    notchMargin() {
      return this.notchWidth / 2;
    },
    activePercent() {
      return (this.activeIndex + 0.5) / this.tabs.length * 100;
    },
    activeX() {
      return this.clamp(this.activePercent, this.notchMargin, 100 - this.notchMargin);
    },
    tabbarStyle() {
      return {
        "--active-x": `${this.activeX}%`,
        "--tab-count": this.tabs.length
      };
    },
    tabbarPath() {
      const width = 100;
      const height = 64;
      const x = this.activeX;
      const left = x - this.notchWidth / 2;
      const right = x + this.notchWidth / 2;
      return `
				M 0 0
				L ${left - this.notchCurve} 0
				C ${left + this.notchCurve} 0, ${left + this.notchCurve} ${this.notchDepth}, ${x} ${this.notchDepth}
				C ${right - this.notchCurve} ${this.notchDepth}, ${right - this.notchCurve} 0, ${right + this.notchCurve} 0
				L ${width} 0
				L ${width} ${height}
				L 0 ${height}
				Z
			`;
    }
  },
  watch: {
    active: {
      immediate: true,
      handler(value) {
        if (!this.navigating) {
          this.visualActive = value || "home";
        }
      }
    }
  },
  beforeUnmount() {
    this.clearNavigationTimer();
  },
  beforeDestroy() {
    this.clearNavigationTimer();
  },
  methods: {
    getTabIcon(item, isActive) {
      if (!item)
        return "";
      if (item.iconType !== "image")
        return item.icon;
      return isActive ? item.activeIcon || item.icon : item.icon;
    },
    getTabIndex(key) {
      const index = this.tabs.findIndex((item) => item.key === key);
      return index === -1 ? 0 : index;
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    clearNavigationTimer() {
      if (this.navigationTimer) {
        clearTimeout(this.navigationTimer);
        this.navigationTimer = null;
      }
    },
    switchTo(item) {
      if (!item || item.key === this.active || this.navigating)
        return;
      this.navigating = true;
      this.visualActive = item.key;
      this.overlayVisible = true;
      this.clearNavigationTimer();
      this.navigationTimer = setTimeout(() => {
        common_vendor.index.reLaunch({
          url: item.path
        });
      }, 420);
    }
  }
};
if (!Array) {
  const _component_path = common_vendor.resolveComponent("path");
  const _component_svg = common_vendor.resolveComponent("svg");
  (_component_path + _component_svg)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.overlayVisible
  }, $data.overlayVisible ? {
    b: common_vendor.t($data.maskPlane),
    c: common_vendor.t($data.maskText)
  } : {}, {
    d: common_vendor.p({
      d: $options.tabbarPath
    }),
    e: common_vendor.p({
      viewBox: "0 0 100 64",
      preserveAspectRatio: "none",
      ["aria-hidden"]: "true"
    }),
    f: $options.activeTab.iconType === "image"
  }, $options.activeTab.iconType === "image" ? {
    g: $options.getTabIcon($options.activeTab, true)
  } : {
    h: common_vendor.t($options.activeTab.icon)
  }, {
    i: common_vendor.f($data.tabs, (item, k0, i0) => {
      return common_vendor.e({
        a: item.iconType === "image"
      }, item.iconType === "image" ? {
        b: $options.getTabIcon(item, $options.activeIndex === $options.getTabIndex(item.key))
      } : {
        c: common_vendor.t(item.icon)
      }, {
        d: common_vendor.t(item.label),
        e: item.key,
        f: common_vendor.n({
          active: $options.activeIndex === $options.getTabIndex(item.key)
        }),
        g: common_vendor.o(($event) => $options.switchTo(item), item.key)
      });
    }),
    j: common_vendor.n($options.themeClass),
    k: common_vendor.s($options.tabbarStyle)
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a66d2e12"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/AppTabbar.js.map
