"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_utils = require("../../common/utils.js");
const common_detailOpenTransition = require("../../common/detail-open-transition.js");
const common_pageTransition = require("../../common/page-transition.js");
const AppTabbar = () => "../../components/AppTabbar.js";
const DetailOpenTransition = () => "../../components/DetailOpenTransition.js";
const PageTransition = () => "../../components/PageTransition.js";
const ShatterHeadline = () => "../../components/ShatterHeadline.js";
const _sfc_main = {
  mixins: [common_pageTransition.pageTransitionMixin, common_detailOpenTransition.detailOpenTransitionMixin],
  components: {
    AppTabbar,
    DetailOpenTransition,
    PageTransition,
    ShatterHeadline
  },
  data() {
    return {
      appState: common_appState.appState,
      query: "",
      trending: [],
      randomLoading: false,
      headlinePhrases: [
        "把心绪折成纸，交给校园的风",
        "把没说出口的话，留在路过的风景",
        "让匿名的回声，刚好落进谁手里",
        "把今天的情绪，投向一个真实地点",
        "给某个陌生同学，留下一次轻回应"
      ],
      iconMap: {
        "图书馆": "📚",
        "食堂": "🍜",
        "操场": "🏃",
        "教学楼": "🏫",
        "宿舍楼": "🏠",
        "校门口": "🚪"
      },
      nodePresets: [
        {
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
        }
      ]
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    isDark() {
      return this.appState.theme === "dark";
    },
    locations() {
      return this.appState.locations || [];
    },
    filteredLocations() {
      const keyword = (this.query || "").trim();
      if (!keyword)
        return this.locations;
      return this.locations.filter((item) => item.name.includes(keyword));
    },
    mapNodes() {
      const nowSec = Date.now() / 1e3;
      const orbitDuration = 3.6;
      return this.filteredLocations.map((loc, index) => {
        const preset = this.nodePresets[index % this.nodePresets.length];
        const countBoost = Math.min(loc.planeCount || 0, 6) * 2;
        const size = Math.min(Math.max(preset.size + countBoost, 56), 90);
        const labelShift = preset.x > 72 ? "-16px" : preset.x < 20 ? "16px" : "0px";
        const delay = this.getNegativeAnimationDelay(nowSec, index * 0.18, orbitDuration);
        return {
          loc,
          ...preset,
          size,
          labelShift,
          delay
        };
      });
    },
    signalRoutes() {
      const nodes = this.mapNodes;
      if (nodes.length < 2)
        return [];
      const nowSec = Date.now() / 1e3;
      const pairs = [];
      for (let index = 0; index < nodes.length - 1; index += 1) {
        pairs.push([nodes[index], nodes[index + 1]]);
      }
      if (nodes.length > 2) {
        for (let index = 0; index < nodes.length; index += 2) {
          pairs.push([nodes[index], nodes[(index + 2) % nodes.length]]);
        }
      }
      const seen = /* @__PURE__ */ new Set();
      return pairs.filter(([from, to]) => {
        if (!from || !to || from.loc.id === to.loc.id)
          return false;
        const key = [from.loc.id, to.loc.id].sort((a, b) => a - b).join("-");
        if (seen.has(key))
          return false;
        seen.add(key);
        return true;
      }).slice(0, 7).map(([from, to], index) => {
        const heat = Math.max(from.loc.planeCount || 0, to.loc.planeCount || 0);
        const width = Math.min(2.8, 1.05 + heat * 0.18);
        return {
          id: `${from.loc.id}-${to.loc.id}-${index}`,
          path: this.createRoutePath(from, to, index),
          width,
          opacity: Math.min(0.78, 0.28 + heat * 0.08),
          duration: 5.4 + index % 3 * 0.9,
          delay: index * 0.65,
          packetOffset: index * 0.65 + 1.8,
          packetSize: Math.min(2.2, 1.15 + heat * 0.08),
          glowDelay: this.getNegativeAnimationDelay(nowSec, index * 0.65, 5.4 + index % 3 * 0.9),
          packetBegin: this.getNegativeMotionBegin(nowSec, index * 0.65, 5.4 + index % 3 * 0.9),
          secondaryPacketBegin: this.getNegativeMotionBegin(
            nowSec,
            index * 0.65 + 1.8,
            5.4 + index % 3 * 0.9
          )
        };
      });
    },
    totalPlanes() {
      return this.locations.reduce((sum, item) => sum + (item.planeCount || 0), 0);
    },
    topTrending() {
      return this.trending.slice(0, 3);
    },
    busiestLocationLabel() {
      if (!this.filteredLocations.length)
        return "等待新的投递进入网络";
      const sorted = this.filteredLocations.slice().sort((a, b) => (b.planeCount || 0) - (a.planeCount || 0));
      const hottest = sorted[0];
      if (!hottest || !hottest.planeCount)
        return "所有落点当前都很安静";
      return `${hottest.name} 最活跃 · ${hottest.planeCount} 架`;
    }
  },
  onShow() {
    this.loadHome();
  },
  methods: {
    normalizePhase(value, duration) {
      const mod = value % duration;
      return mod < 0 ? mod + duration : mod;
    },
    getNegativeAnimationDelay(nowSec, offsetSec, durationSec) {
      return -this.normalizePhase(nowSec - offsetSec, durationSec);
    },
    getNegativeMotionBegin(nowSec, offsetSec, durationSec) {
      return `${this.getNegativeAnimationDelay(nowSec, offsetSec, durationSec)}s`;
    },
    createRoutePath(from, to, index) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const bend = Math.min(16, 8 + distance * 0.12) * (index % 2 === 0 ? 1 : -1);
      const c1x = from.x + dx * 0.32 + normalX * bend;
      const c1y = from.y + dy * 0.18 + normalY * bend;
      const c2x = from.x + dx * 0.68 + normalX * bend;
      const c2y = from.y + dy * 0.82 + normalY * bend;
      return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
    },
    async loadHome() {
      await common_appState.fetchLocations();
      try {
        this.trending = await common_api.getTrendingPlanes();
      } catch (error) {
        this.trending = [];
      }
    },
    handleToggleTheme() {
      common_appState.toggleTheme();
    },
    goThrow() {
      common_vendor.index.reLaunch({
        url: "/pages/throw/index"
      });
    },
    goTrending() {
      common_vendor.index.reLaunch({
        url: "/pages/trending/index"
      });
    },
    goDiscover(name) {
      common_appState.setCurrentLocation(name);
      common_vendor.index.reLaunch({
        url: "/pages/discover/index"
      });
    },
    openDetail(id) {
      this.openPlaneDetail(id);
    },
    async handleRandom() {
      if (this.randomLoading)
        return;
      this.randomLoading = true;
      try {
        const plane = await common_api.getRandomPlane();
        this.openDetail(plane.id);
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "暂无飞机可拾取",
          icon: "none"
        });
      } finally {
        this.randomLoading = false;
      }
    },
    getPlaneAuthorLabelText(plane) {
      return common_utils.getPlaneAuthorLabel(plane);
    },
    getAssetUrl: common_api.getAssetUrl
  }
};
if (!Array) {
  const _component_shatter_headline = common_vendor.resolveComponent("shatter-headline");
  const _component_stop = common_vendor.resolveComponent("stop");
  const _component_linearGradient = common_vendor.resolveComponent("linearGradient");
  const _component_feGaussianBlur = common_vendor.resolveComponent("feGaussianBlur");
  const _component_feMergeNode = common_vendor.resolveComponent("feMergeNode");
  const _component_feMerge = common_vendor.resolveComponent("feMerge");
  const _component_filter = common_vendor.resolveComponent("filter");
  const _component_defs = common_vendor.resolveComponent("defs");
  const _component_path = common_vendor.resolveComponent("path");
  const _component_animateMotion = common_vendor.resolveComponent("animateMotion");
  const _component_circle = common_vendor.resolveComponent("circle");
  const _component_g = common_vendor.resolveComponent("g");
  const _component_svg = common_vendor.resolveComponent("svg");
  const _component_detail_open_transition = common_vendor.resolveComponent("detail-open-transition");
  const _component_page_transition = common_vendor.resolveComponent("page-transition");
  const _component_app_tabbar = common_vendor.resolveComponent("app-tabbar");
  (_component_shatter_headline + _component_stop + _component_linearGradient + _component_feGaussianBlur + _component_feMergeNode + _component_feMerge + _component_filter + _component_defs + _component_path + _component_animateMotion + _component_circle + _component_g + _component_svg + _component_detail_open_transition + _component_page_transition + _component_app_tabbar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($options.isDark ? "☾" : "☀"),
    b: common_vendor.o((...args) => $options.handleToggleTheme && $options.handleToggleTheme(...args)),
    c: common_vendor.p({
      phrases: $data.headlinePhrases
    }),
    d: common_vendor.o((...args) => $options.goThrow && $options.goThrow(...args)),
    e: common_vendor.t($data.randomLoading ? "正在挑选" : "随机拾取"),
    f: common_vendor.o((...args) => $options.handleRandom && $options.handleRandom(...args)),
    g: common_vendor.t($options.totalPlanes),
    h: common_vendor.t($options.locations.length),
    i: common_vendor.t($options.topTrending.length),
    j: $data.query,
    k: common_vendor.o(($event) => $data.query = $event.detail.value),
    l: common_vendor.p({
      offset: "0%",
      ["stop-color"]: "rgba(47, 158, 116, 0.15)"
    }),
    m: common_vendor.p({
      offset: "45%",
      ["stop-color"]: "rgba(47, 158, 116, 0.95)"
    }),
    n: common_vendor.p({
      offset: "100%",
      ["stop-color"]: "rgba(242, 122, 75, 0.95)"
    }),
    o: common_vendor.p({
      id: "routeGradient",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%"
    }),
    p: common_vendor.p({
      stdDeviation: "1.2",
      result: "blur"
    }),
    q: common_vendor.p({
      in: "blur"
    }),
    r: common_vendor.p({
      in: "SourceGraphic"
    }),
    s: common_vendor.p({
      id: "routeGlow",
      x: "-50%",
      y: "-50%",
      width: "200%",
      height: "200%"
    }),
    t: common_vendor.f($options.signalRoutes, (route, k0, i0) => {
      return {
        a: `route-base-${route.id}`,
        b: route.width,
        c: route.opacity,
        d: "4978fed5-12-" + i0 + ",4978fed5-1",
        e: common_vendor.p({
          d: route.path
        })
      };
    }),
    v: common_vendor.f($options.signalRoutes, (route, k0, i0) => {
      return {
        a: `route-glow-${route.id}`,
        b: route.width,
        c: `${route.duration}s`,
        d: `${route.glowDelay}s`,
        e: "4978fed5-13-" + i0 + ",4978fed5-1",
        f: common_vendor.p({
          d: route.path
        })
      };
    }),
    w: common_vendor.f($options.signalRoutes, (route, k0, i0) => {
      return {
        a: "4978fed5-16-" + i0 + "," + ("4978fed5-15-" + i0),
        b: common_vendor.p({
          dur: `${route.duration}s`,
          begin: route.packetBegin,
          repeatCount: "indefinite",
          path: route.path
        }),
        c: "4978fed5-15-" + i0 + "," + ("4978fed5-14-" + i0),
        d: common_vendor.p({
          r: route.packetSize
        }),
        e: "4978fed5-18-" + i0 + "," + ("4978fed5-17-" + i0),
        f: common_vendor.p({
          dur: `${route.duration}s`,
          begin: route.secondaryPacketBegin,
          repeatCount: "indefinite",
          path: route.path
        }),
        g: "4978fed5-17-" + i0 + "," + ("4978fed5-14-" + i0),
        h: common_vendor.p({
          r: route.packetSize * 0.72
        }),
        i: `route-packet-${route.id}`,
        j: "4978fed5-14-" + i0 + ",4978fed5-1"
      };
    }),
    x: common_vendor.p({
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      ["aria-hidden"]: "true"
    }),
    y: common_vendor.t($options.totalPlanes),
    z: common_vendor.t($options.busiestLocationLabel),
    A: common_vendor.f($options.mapNodes, (node, index, i0) => {
      return {
        a: common_vendor.t($data.iconMap[node.loc.name] || "📍"),
        b: common_vendor.t(node.loc.name),
        c: common_vendor.t(node.loc.planeCount),
        d: node.loc.id,
        e: `${node.x}%`,
        f: `${node.y}%`,
        g: `${node.size}px`,
        h: `${node.delay}s`,
        i: node.labelShift,
        j: common_vendor.o(($event) => $options.goDiscover(node.loc.name), node.loc.id)
      };
    }),
    B: $options.topTrending.length
  }, $options.topTrending.length ? {
    C: common_vendor.o((...args) => $options.goTrending && $options.goTrending(...args)),
    D: common_vendor.f($options.topTrending, (plane, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(index + 1),
        b: common_vendor.t(plane.content),
        c: common_vendor.t(plane.locationTag),
        d: common_vendor.t($options.getPlaneAuthorLabelText(plane)),
        e: common_vendor.t(plane.likeCount),
        f: plane.imageUrls && plane.imageUrls.length
      }, plane.imageUrls && plane.imageUrls.length ? {
        g: $options.getAssetUrl(plane.imageUrls[0]),
        h: common_vendor.t(plane.imageUrls.length)
      } : {}, {
        i: plane.id,
        j: common_vendor.o(($event) => $options.openDetail(plane.id), plane.id)
      });
    })
  } : {}, {
    E: common_vendor.p({
      visible: _ctx.detailOpenVisible,
      theme: $data.appState.theme
    }),
    F: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    G: common_vendor.p({
      active: "home",
      theme: $data.appState.theme
    }),
    H: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4978fed5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
