"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_detailOpenTransition = require("../../common/detail-open-transition.js");
const common_pageTransition = require("../../common/page-transition.js");
const common_moods = require("../../common/moods.js");
const common_utils = require("../../common/utils.js");
const AppTabbar = () => "../../components/AppTabbar.js";
const DetailOpenTransition = () => "../../components/DetailOpenTransition.js";
const PageTransition = () => "../../components/PageTransition.js";
const PlaneCard = () => "../../components/PlaneCard.js";
const _sfc_main = {
  mixins: [common_pageTransition.pageTransitionMixin, common_detailOpenTransition.detailOpenTransitionMixin],
  components: {
    AppTabbar,
    DetailOpenTransition,
    PageTransition,
    PlaneCard
  },
  data() {
    return {
      appState: common_appState.appState,
      planes: [],
      loading: false
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    scoredEntries() {
      return this.planes.map((plane, index) => ({
        plane,
        rank: index + 1,
        score: this.getHeatScore(plane)
      }));
    },
    featuredEntry() {
      return this.scoredEntries[0] || null;
    },
    podiumEntries() {
      return this.scoredEntries.slice(1, 3).filter((entry) => entry.score > 0);
    },
    rankedEntries() {
      return this.scoredEntries.filter((entry, index) => index >= 3 || index >= 1 && index <= 2 && entry.score <= 0);
    },
    hotPlaneCount() {
      return this.scoredEntries.filter((entry) => entry.score > 0).length;
    },
    featuredImage() {
      var _a, _b, _c;
      return ((_c = (_b = (_a = this.featuredEntry) == null ? void 0 : _a.plane) == null ? void 0 : _b.imageUrls) == null ? void 0 : _c.length) ? common_api.getAssetUrl(this.featuredEntry.plane.imageUrls[0]) : "";
    },
    totalHeat() {
      return this.scoredEntries.reduce((total, entry) => total + entry.score, 0);
    },
    photoPlaneCount() {
      return this.planes.filter((plane) => plane.imageUrls && plane.imageUrls.length).length;
    },
    hottestLocationText() {
      if (!this.planes.length)
        return "热度会在这里实时更新";
      const counter = this.planes.reduce((result, plane) => {
        const key = plane.locationTag || "未知地点";
        result[key] = (result[key] || 0) + this.getHeatScore(plane);
        return result;
      }, {});
      const location = Object.keys(counter).sort((left, right) => counter[right] - counter[left])[0] || "校园风场";
      return `${location} 热度最高`;
    },
    heroSubtitle() {
      if (!this.planes.length) {
        return "把今天最常被接住、被回应的纸飞机，整理成一张校园热榜。";
      }
      return `${this.hottestLocationText}，这阵风里最常被接住的纸条都在这里。`;
    },
    featuredTitle() {
      var _a;
      if (!((_a = this.featuredEntry) == null ? void 0 : _a.plane))
        return "";
      if (this.featuredImage) {
        return `${this.featuredEntry.plane.locationTag} 的这一封，正在被很多人停下来读`;
      }
      return `今天最热的一架，从 ${this.featuredEntry.plane.locationTag} 起飞`;
    }
  },
  onShow() {
    this.loadTrending();
  },
  methods: {
    async loadTrending() {
      this.loading = true;
      try {
        this.planes = await common_api.getTrendingPlanes();
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
        this.planes = [];
      } finally {
        this.loading = false;
      }
    },
    getPlaneMood(plane) {
      return common_moods.getMoodMeta(plane == null ? void 0 : plane.mood);
    },
    getPlaneAuthorLabelText(plane) {
      return common_utils.getPlaneAuthorLabel(plane);
    },
    getHeatScore(plane) {
      return Number((plane == null ? void 0 : plane.likeCount) || 0) * 2 + Number((plane == null ? void 0 : plane.pickCount) || 0);
    },
    getHeatLabel(plane, rank = 0) {
      const score = this.getHeatScore(plane);
      if (rank === 1)
        return score > 0 ? "当前榜首" : "暂列榜首";
      if (score >= 36)
        return "全场焦点";
      if (score >= 22)
        return "高热上升";
      if (score >= 10)
        return "持续升温";
      if (score > 0)
        return "已经被接住";
      return "等待升温";
    },
    formatPlaneTime(time) {
      if (!time)
        return "";
      const date = new Date(time);
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const hour = `${date.getHours()}`.padStart(2, "0");
      const minute = `${date.getMinutes()}`.padStart(2, "0");
      return `${month}/${day} ${hour}:${minute}`;
    },
    openDetail(plane) {
      this.openPlaneDetail(plane.id);
    }
  }
};
if (!Array) {
  const _component_plane_card = common_vendor.resolveComponent("plane-card");
  const _component_detail_open_transition = common_vendor.resolveComponent("detail-open-transition");
  const _component_page_transition = common_vendor.resolveComponent("page-transition");
  const _component_app_tabbar = common_vendor.resolveComponent("app-tabbar");
  (_component_plane_card + _component_detail_open_transition + _component_page_transition + _component_app_tabbar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($options.heroSubtitle),
    b: common_vendor.t($data.planes.length),
    c: common_vendor.t($data.loading ? "热度正在刷新" : $options.hottestLocationText),
    d: common_vendor.t($options.totalHeat),
    e: common_vendor.t($options.photoPlaneCount),
    f: common_vendor.t($options.hotPlaneCount),
    g: common_vendor.t($data.loading ? "◌" : "↻"),
    h: common_vendor.t($data.loading ? "刷新中..." : "刷新热榜"),
    i: common_vendor.o((...args) => $options.loadTrending && $options.loadTrending(...args)),
    j: $data.loading && !$data.planes.length
  }, $data.loading && !$data.planes.length ? {} : !$data.planes.length ? {} : common_vendor.e({
    l: common_vendor.t($options.getHeatLabel($options.featuredEntry.plane, $options.featuredEntry.rank)),
    m: common_vendor.t($options.getPlaneMood($options.featuredEntry.plane).icon),
    n: common_vendor.t($options.getPlaneMood($options.featuredEntry.plane).label),
    o: $options.getPlaneMood($options.featuredEntry.plane).color,
    p: `${$options.getPlaneMood($options.featuredEntry.plane).color}33`,
    q: common_vendor.t($options.formatPlaneTime($options.featuredEntry.plane.createTime)),
    r: common_vendor.t($options.featuredTitle),
    s: common_vendor.t($options.featuredEntry.plane.content),
    t: common_vendor.t($options.featuredEntry.plane.locationTag),
    v: common_vendor.t($options.getPlaneAuthorLabelText($options.featuredEntry.plane)),
    w: $options.featuredEntry.plane.imageUrls && $options.featuredEntry.plane.imageUrls.length
  }, $options.featuredEntry.plane.imageUrls && $options.featuredEntry.plane.imageUrls.length ? {
    x: common_vendor.t($options.featuredEntry.plane.imageUrls.length)
  } : {}, {
    y: common_vendor.t($options.featuredEntry.plane.pickCount || 0),
    z: common_vendor.t($options.featuredEntry.plane.likeCount || 0),
    A: common_vendor.t($options.featuredEntry.plane.commentCount || 0),
    B: $options.featuredImage
  }, $options.featuredImage ? {
    C: $options.featuredImage
  } : {
    D: common_vendor.t($options.getPlaneMood($options.featuredEntry.plane).icon),
    E: $options.getPlaneMood($options.featuredEntry.plane).color,
    F: `${$options.getPlaneMood($options.featuredEntry.plane).color}48`
  }, {
    G: common_vendor.t($options.getHeatScore($options.featuredEntry.plane)),
    H: common_vendor.o(($event) => $options.openDetail($options.featuredEntry.plane)),
    I: $options.podiumEntries.length
  }, $options.podiumEntries.length ? {
    J: common_vendor.f($options.podiumEntries, (entry, k0, i0) => {
      return {
        a: common_vendor.t(entry.rank),
        b: common_vendor.t(entry.plane.locationTag),
        c: common_vendor.t(entry.plane.content),
        d: common_vendor.t($options.getPlaneMood(entry.plane).label),
        e: common_vendor.t($options.getHeatScore(entry.plane)),
        f: entry.plane.id,
        g: common_vendor.o(($event) => $options.openDetail(entry.plane), entry.plane.id)
      };
    })
  } : {}, {
    K: common_vendor.t($options.rankedEntries.length ? `${$options.rankedEntries.length} 架继续上榜` : "前面的高热纸条已经包揽榜面"),
    L: $options.rankedEntries.length
  }, $options.rankedEntries.length ? {
    M: common_vendor.f($options.rankedEntries, (entry, k0, i0) => {
      return {
        a: entry.plane.id,
        b: common_vendor.o($options.openDetail, entry.plane.id),
        c: "eeab9fab-0-" + i0,
        d: common_vendor.p({
          plane: entry.plane,
          rank: entry.rank
        })
      };
    })
  } : {}), {
    k: !$data.planes.length,
    N: common_vendor.p({
      visible: _ctx.detailOpenVisible,
      theme: $data.appState.theme
    }),
    O: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    P: common_vendor.p({
      active: "trending",
      theme: $data.appState.theme
    }),
    Q: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-eeab9fab"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/trending/index.js.map
