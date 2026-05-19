"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_utils = require("../../common/utils.js");
const common_moods = require("../../common/moods.js");
const common_detailOpenTransition = require("../../common/detail-open-transition.js");
const common_pageTransition = require("../../common/page-transition.js");
const common_uiIcons = require("../../common/ui-icons.js");
const common_assets = require("../../common/assets.js");
const AppTabbar = () => "../../components/AppTabbar.js";
const DetailOpenTransition = () => "../../components/DetailOpenTransition.js";
const PageTransition = () => "../../components/PageTransition.js";
const ALL_MOOD_META = {
  label: "全部",
  icon: common_uiIcons.uiIcons.emotion,
  color: "#7d8b8a"
};
const _sfc_main = {
  mixins: [common_pageTransition.pageTransitionMixin, common_detailOpenTransition.detailOpenTransitionMixin],
  components: {
    AppTabbar,
    DetailOpenTransition,
    PageTransition
  },
  data() {
    return {
      appState: common_appState.appState,
      icons: common_uiIcons.uiIcons,
      planes: [],
      loading: false,
      query: "",
      activeMood: "all",
      selectedLocation: "",
      routeLocation: "",
      moodFoldOpen: false,
      locationFoldOpen: false,
      pageScrollTop: 0,
      toolbarPinned: false,
      toolbarHeight: 0,
      toolbarAnchorTop: 0,
      toolbarFixedTop: 0,
      moodFilters: common_moods.getMoodFilters(),
      cardPalette: [
        {
          base: "rgba(250, 247, 238, 0.98)",
          wash: "rgba(194, 220, 255, 0.26)",
          glow: "rgba(255, 255, 255, 0.92)",
          rule: "rgba(129, 150, 176, 0.12)",
          tape: "rgba(245, 232, 198, 0.82)"
        },
        {
          base: "rgba(255, 246, 241, 0.98)",
          wash: "rgba(255, 214, 194, 0.24)",
          glow: "rgba(255, 255, 255, 0.94)",
          rule: "rgba(179, 145, 131, 0.12)",
          tape: "rgba(247, 226, 205, 0.82)"
        },
        {
          base: "rgba(244, 251, 241, 0.98)",
          wash: "rgba(185, 235, 202, 0.24)",
          glow: "rgba(255, 255, 255, 0.94)",
          rule: "rgba(120, 161, 132, 0.12)",
          tape: "rgba(231, 236, 201, 0.84)"
        },
        {
          base: "rgba(250, 244, 252, 0.98)",
          wash: "rgba(229, 204, 245, 0.24)",
          glow: "rgba(255, 255, 255, 0.94)",
          rule: "rgba(157, 137, 171, 0.12)",
          tape: "rgba(240, 226, 210, 0.8)"
        }
      ]
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    locationFilters() {
      return Array.isArray(this.appState.locations) ? this.appState.locations : [];
    },
    currentMoodFilterLabel() {
      var _a;
      return ((_a = this.getMoodFilterMeta(this.activeMood)) == null ? void 0 : _a.label) || "全部";
    },
    currentLocationFilterLabel() {
      return this.selectedLocation || "全部";
    },
    filteredPlanes() {
      const keyword = this.query.trim().toLowerCase();
      const selectedLocation = String(this.selectedLocation || "").trim();
      return this.planes.filter((item) => {
        const locationText = String(item.locationTag || "");
        const matchesLocation = !selectedLocation || locationText === selectedLocation;
        if (!matchesLocation)
          return false;
        const moodKey = common_moods.resolveMoodKey(item.mood);
        const matchesMood = this.activeMood === "all" || moodKey === this.activeMood;
        if (!matchesMood)
          return false;
        if (!keyword)
          return true;
        const contentText = String(item.content || "").toLowerCase();
        return contentText.includes(keyword) || locationText.toLowerCase().includes(keyword);
      });
    },
    featuredPlane() {
      return this.filteredPlanes[0] || null;
    },
    secondaryPlanes() {
      if (!this.featuredPlane)
        return [];
      return this.filteredPlanes.filter((item) => item.id !== this.featuredPlane.id);
    },
    discoverSubtitle() {
      const keyword = this.query.trim();
      if (keyword) {
        return `和“${keyword}”有关的纸飞机，正在这里慢慢降落。`;
      }
      if (this.activeMood !== "all") {
        return `筛一筛${this.getMoodFilterMeta(this.activeMood).label}的心情，看看此刻校园里谁在和你共鸣。`;
      }
      return "把今天的心情、偶遇和没说完的话，留在风经过的地方。";
    },
    discoverTicketLabel() {
      return this.activeMood === "all" ? "正在漂流" : this.getMoodFilterMeta(this.activeMood).label;
    },
    discoverTicketNote() {
      if (!this.filteredPlanes.length)
        return "风里暂时安静";
      if (this.query.trim())
        return "与你的搜索有关";
      return `${this.filteredPlanes.length} 封纸条在路上`;
    },
    featuredStatusText() {
      if (!this.featuredPlane)
        return "风里暂时没有新的纸条";
      return this.getPlaneStatusLabel(this.featuredPlane);
    },
    mostActiveLocationText() {
      const location = this.getMostActiveLocation();
      return location ? `${location} 现在最热闹` : "校园里的风正在缓慢流动";
    }
  },
  onLoad(options = {}) {
    this.routeLocation = this.decodeRouteLocation(options.location);
    if (this.routeLocation) {
      this.selectedLocation = this.routeLocation;
      common_appState.setCurrentLocation(this.routeLocation);
    }
  },
  async onShow() {
    await common_appState.fetchLocations();
    try {
      await common_appState.fetchMoodConfigs();
    } catch (error) {
    }
    this.refreshMoodFilters();
    this.syncSelectedLocation();
    await this.loadPlanes();
    this.scheduleMeasureToolbar();
  },
  onReady() {
    this.toolbarFixedTop = this.getToolbarFixedTop();
    this.scheduleMeasureToolbar();
  },
  onPageScroll(event) {
    this.pageScrollTop = event.scrollTop || 0;
    this.syncToolbarPinned();
  },
  methods: {
    decodeRouteLocation(value) {
      const raw = String(value || "").trim();
      if (!raw)
        return "";
      try {
        return decodeURIComponent(raw);
      } catch (error) {
        return raw;
      }
    },
    normalizeLocation(value) {
      return String(value || "").trim();
    },
    syncSelectedLocation() {
      const routeLocation = this.normalizeLocation(this.routeLocation);
      if (routeLocation) {
        this.selectedLocation = routeLocation;
        this.routeLocation = "";
        if (routeLocation !== this.appState.currentLocation) {
          common_appState.setCurrentLocation(routeLocation);
        }
        return;
      }
      if (!this.selectedLocation) {
        const current = this.normalizeLocation(this.appState.currentLocation);
        if (current) {
          this.selectedLocation = current;
        }
      }
    },
    refreshMoodFilters() {
      const filters = common_moods.getMoodFilters();
      this.moodFilters = filters;
      const hasActiveMood = filters.some((item) => item.value === this.activeMood);
      if (!hasActiveMood) {
        this.activeMood = "all";
      }
    },
    getPlaneMood(plane) {
      return common_moods.getMoodMeta(plane.mood);
    },
    getMoodFilterMeta(value) {
      return value === "all" ? ALL_MOOD_META : common_moods.getMoodMeta(value);
    },
    toggleMoodFold() {
      this.moodFoldOpen = !this.moodFoldOpen;
      if (this.moodFoldOpen) {
        this.locationFoldOpen = false;
      }
      this.scheduleMeasureToolbar();
    },
    toggleLocationFold() {
      this.locationFoldOpen = !this.locationFoldOpen;
      if (this.locationFoldOpen) {
        this.moodFoldOpen = false;
      }
      this.scheduleMeasureToolbar();
    },
    setMoodFilter(value) {
      this.activeMood = value;
      this.scheduleMeasureToolbar();
    },
    selectMoodFilter(value) {
      this.setMoodFilter(value);
      this.moodFoldOpen = false;
      this.scheduleMeasureToolbar();
    },
    async setLocationFilter(value) {
      const nextLocation = this.normalizeLocation(value);
      if (nextLocation === this.selectedLocation)
        return;
      this.selectedLocation = nextLocation;
      this.routeLocation = "";
      common_appState.setCurrentLocation(nextLocation);
      await this.loadPlanes();
    },
    async selectLocationFilter(value) {
      await this.setLocationFilter(value);
      this.locationFoldOpen = false;
      this.scheduleMeasureToolbar();
    },
    getPlaneAuthorLabelText(plane) {
      return common_utils.getPlaneAuthorLabel(plane);
    },
    getAssetUrl: common_api.getAssetUrl,
    getNoteItemStyle(index, seedSource, mood, plane) {
      var _a;
      const variant = plane ? this.getPlaneVariant(plane, index) : "note";
      let cardHeight = "336rpx";
      if (variant === "quote") {
        cardHeight = "352rpx";
      } else if (variant === "diary") {
        cardHeight = "384rpx";
      } else if ((_a = plane == null ? void 0 : plane.imageUrls) == null ? void 0 : _a.length) {
        cardHeight = "352rpx";
      } else if (index % 3 === 1) {
        cardHeight = "352rpx";
      }
      return {
        ...this.getNoteStyle(index, seedSource),
        ...this.getCardStyle(index, mood),
        "--card-height": cardHeight
      };
    },
    getFeaturedCardStyle(plane) {
      const moodMeta = common_moods.getMoodMeta(plane.mood);
      return {
        "--featured-accent": moodMeta.color,
        "--featured-soft": `${moodMeta.color}18`,
        "--featured-strong": `${moodMeta.color}32`
      };
    },
    getSeedNumber(seedSource) {
      const input = String(seedSource || "");
      let hash = 0;
      for (let index = 0; index < input.length; index += 1) {
        hash = (hash * 31 + input.charCodeAt(index)) % 1000003;
      }
      return hash;
    },
    getNoteStyle(index, seedSource) {
      const hash = this.getSeedNumber(`${seedSource}-${index}`);
      const baseOffset = [0, 20, 10, 30][index % 4];
      const extraOffset = hash % 12;
      const tiltBase = hash % 440 / 100 - 2.2;
      const tilt = tiltBase >= 0 ? Math.max(tiltBase, 0.35) : Math.min(tiltBase, -0.35);
      const shift = (Math.floor(hash / 17) % 16 - 8) * 1.2;
      const stackAOffsetX = -(3 + hash % 4);
      const stackAOffsetY = 5 + hash % 4;
      const stackBOffsetX = 3 + (hash >> 3) % 4;
      const stackBOffsetY = 10 + (hash >> 5) % 4;
      const stackARotate = tilt - (0.18 + (hash >> 2) % 14 / 100);
      const stackBRotate = tilt + (0.24 + (hash >> 4) % 14 / 100);
      return {
        "--note-offset": `${baseOffset + extraOffset}rpx`,
        "--note-tilt": `${tilt.toFixed(2)}deg`,
        "--note-shift": `${shift.toFixed(1)}rpx`,
        "--stack-a-x": `${stackAOffsetX}rpx`,
        "--stack-a-y": `${stackAOffsetY}rpx`,
        "--stack-b-x": `${stackBOffsetX}rpx`,
        "--stack-b-y": `${stackBOffsetY}rpx`,
        "--stack-a-rotate": `${stackARotate.toFixed(2)}deg`,
        "--stack-b-rotate": `${stackBRotate.toFixed(2)}deg`
      };
    },
    getCardStyle(index, mood) {
      const palette = this.cardPalette[index % this.cardPalette.length];
      const moodMeta = common_moods.getMoodMeta(mood);
      const hash = this.getSeedNumber(`${mood}-${index}`);
      const leftTilt = (hash % 180 / 30 - 3).toFixed(2);
      const rightTilt = ((hash >> 3) % 180 / 30 - 3).toFixed(2);
      const leftOffset = 24 + hash % 16;
      const rightOffset = 22 + (hash >> 4) % 16;
      return {
        "--paper-base": palette.base,
        "--paper-wash": palette.wash,
        "--paper-glow": palette.glow,
        "--paper-rule": palette.rule,
        "--paper-tape": palette.tape,
        "--paper-border": `${moodMeta.color}20`,
        "--paper-shadow": `${moodMeta.color}12`,
        "--stack-base": palette.base,
        "--stack-border": `${moodMeta.color}16`,
        "--tape-left-tilt": `${leftTilt}deg`,
        "--tape-right-tilt": `${rightTilt}deg`,
        "--tape-left-offset": `${leftOffset}rpx`,
        "--tape-right-offset": `${rightOffset}rpx`
      };
    },
    getPlaneVariant(plane, index) {
      const contentLength = String((plane == null ? void 0 : plane.content) || "").length;
      const heatScore = this.getHeatScore(plane);
      if (contentLength <= 28 || index % 5 === 1)
        return "quote";
      if (heatScore >= 18 || index % 4 === 2)
        return "diary";
      return "note";
    },
    shouldShowMediaPreview() {
      return false;
    },
    isQuoteVariant(plane, index) {
      return this.getPlaneVariant(plane, index) === "quote";
    },
    isDiaryVariant(plane, index) {
      return this.getPlaneVariant(plane, index) === "diary";
    },
    getHeatScore(plane) {
      const likeCount = Number((plane == null ? void 0 : plane.likeCount) || 0);
      const pickCount = Number((plane == null ? void 0 : plane.pickCount) || 0);
      const commentCount = Number((plane == null ? void 0 : plane.commentCount) || 0);
      return likeCount * 2 + pickCount + commentCount * 3;
    },
    getHeatLabel(plane) {
      var _a;
      const score = this.getHeatScore(plane);
      if (score >= 28)
        return "热度上升";
      if (score >= 18)
        return "有人共鸣";
      if ((_a = plane == null ? void 0 : plane.imageUrls) == null ? void 0 : _a.length)
        return "带图纸条";
      return "刚刚路过";
    },
    getPlaneStatusLabel(plane) {
      var _a;
      const score = this.getHeatScore(plane);
      if (score >= 28)
        return "正在被很多人轻轻接住";
      if (score >= 18)
        return "已经有人停下来读了很久";
      if (plane == null ? void 0 : plane.commentCount)
        return "已经收到回应";
      if ((_a = plane == null ? void 0 : plane.imageUrls) == null ? void 0 : _a.length)
        return "还带着一张随手拍";
      return "刚刚被风送到这里";
    },
    getFeaturedTitle(plane) {
      var _a;
      if (!plane)
        return "";
      if ((_a = plane.imageUrls) == null ? void 0 : _a.length) {
        return `${plane.locationTag} 捎来的一点现场感`;
      }
      const score = this.getHeatScore(plane);
      if (score >= 24)
        return "这封纸条正在被很多人接住";
      if (score >= 16)
        return `${this.getPlaneMood(plane).label} 正在悄悄扩散`;
      return `${this.getPlaneMood(plane).label} 的一句轻声路过`;
    },
    getMostActiveLocation() {
      if (!this.filteredPlanes.length)
        return "";
      const counter = this.filteredPlanes.reduce((result, item) => {
        const key = item.locationTag || "未知地点";
        result[key] = (result[key] || 0) + 1;
        return result;
      }, {});
      return Object.keys(counter).sort((left, right) => counter[right] - counter[left])[0] || "";
    },
    getToolbarFixedTop() {
      var _a;
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const safeTop = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.top) || 0;
      return safeTop + this.rpxToPx(8);
    },
    rpxToPx(value) {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      return (systemInfo.windowWidth || 375) * Number(value || 0) / 750;
    },
    scheduleMeasureToolbar() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.measureToolbar();
        }, 0);
      });
    },
    measureToolbar() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      const target = this.toolbarPinned ? ".discover-toolbar-placeholder" : ".discover-toolbar";
      query.select(target).boundingClientRect();
      query.exec((result) => {
        const rect = result && result[0];
        if (!rect)
          return;
        this.toolbarHeight = rect.height || 0;
        this.toolbarFixedTop = this.getToolbarFixedTop();
        this.toolbarAnchorTop = (rect.top || 0) + this.pageScrollTop - this.toolbarFixedTop;
        this.syncToolbarPinned();
      });
    },
    syncToolbarPinned() {
      if (!this.toolbarHeight)
        return;
      this.toolbarPinned = this.pageScrollTop >= this.toolbarAnchorTop;
    },
    async loadPlanes() {
      this.loading = true;
      try {
        const location = this.normalizeLocation(this.selectedLocation);
        const data = await common_api.getPlanes(location || void 0);
        const list = Array.isArray(data) ? data : [];
        if (location) {
          this.planes = list.filter((item) => String((item == null ? void 0 : item.locationTag) || "") === location);
        } else {
          this.planes = list;
        }
      } catch (error) {
        this.planes = [];
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
        this.scheduleMeasureToolbar();
      }
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
  const _component_path = common_vendor.resolveComponent("path");
  const _component_svg = common_vendor.resolveComponent("svg");
  const _component_detail_open_transition = common_vendor.resolveComponent("detail-open-transition");
  const _component_page_transition = common_vendor.resolveComponent("page-transition");
  const _component_app_tabbar = common_vendor.resolveComponent("app-tabbar");
  (_component_path + _component_svg + _component_detail_open_transition + _component_page_transition + _component_app_tabbar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($options.discoverSubtitle),
    b: common_vendor.t($options.discoverTicketLabel),
    c: common_vendor.t($options.filteredPlanes.length),
    d: common_vendor.t($options.discoverTicketNote),
    e: common_vendor.t($options.featuredStatusText),
    f: common_vendor.t($options.mostActiveLocationText),
    g: $data.toolbarPinned
  }, $data.toolbarPinned ? {
    h: `${$data.toolbarHeight}px`
  } : {}, {
    i: $data.icons.search,
    j: $data.query,
    k: common_vendor.o(($event) => $data.query = $event.detail.value),
    l: common_vendor.t($options.currentMoodFilterLabel),
    m: common_vendor.n({
      "is-open": $data.moodFoldOpen
    }),
    n: common_assets._imports_1,
    o: common_vendor.o((...args) => $options.toggleMoodFold && $options.toggleMoodFold(...args)),
    p: common_vendor.f($data.moodFilters, (filter, k0, i0) => {
      return common_vendor.e({
        a: $options.getMoodFilterMeta(filter.value).icon,
        b: common_vendor.t(filter.label),
        c: $data.activeMood === filter.value
      }, $data.activeMood === filter.value ? {} : {}, {
        d: `mood-${filter.value}`,
        e: common_vendor.n({
          "is-active": $data.activeMood === filter.value
        }),
        f: common_vendor.o(($event) => $options.selectMoodFilter(filter.value), `mood-${filter.value}`)
      });
    }),
    q: common_vendor.n({
      "is-open": $data.moodFoldOpen
    }),
    r: common_vendor.n({
      "is-open": $data.moodFoldOpen
    }),
    s: common_vendor.t($options.currentLocationFilterLabel),
    t: common_vendor.n({
      "is-open": $data.locationFoldOpen
    }),
    v: common_assets._imports_1,
    w: common_vendor.o((...args) => $options.toggleLocationFold && $options.toggleLocationFold(...args)),
    x: !$data.selectedLocation
  }, !$data.selectedLocation ? {} : {}, {
    y: common_vendor.n({
      "is-active": !$data.selectedLocation
    }),
    z: common_vendor.o(($event) => $options.selectLocationFilter("")),
    A: common_vendor.f($options.locationFilters, (location, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(location.name),
        b: $data.selectedLocation === location.name
      }, $data.selectedLocation === location.name ? {} : {}, {
        c: location.id || location.name,
        d: common_vendor.n({
          "is-active": $data.selectedLocation === location.name
        }),
        e: common_vendor.o(($event) => $options.selectLocationFilter(location.name), location.id || location.name)
      });
    }),
    B: common_vendor.n({
      "is-open": $data.locationFoldOpen
    }),
    C: common_vendor.n({
      "is-open": $data.locationFoldOpen
    }),
    D: common_vendor.n({
      "is-pinned": $data.toolbarPinned
    }),
    E: `${$data.toolbarFixedTop}px`,
    F: $data.loading
  }, $data.loading ? {
    G: common_vendor.f(4, (index, k0, i0) => {
      return {
        a: "157e4766-1-" + i0 + "," + ("157e4766-0-" + i0),
        b: "157e4766-2-" + i0 + "," + ("157e4766-0-" + i0),
        c: "157e4766-3-" + i0 + "," + ("157e4766-0-" + i0),
        d: "157e4766-0-" + i0,
        e: `skeleton-${index}`,
        f: common_vendor.s($options.getNoteItemStyle(index - 1, `skeleton-${index}`, "calm"))
      };
    }),
    H: common_vendor.p({
      d: "M29 7 C17 7 11 17 11 28 V67 C11 82 20 91 31 91 C41 91 48 82 48 69 V30 C48 17 40 10 31 10 C22 10 16 17 16 28 V64 C16 74 21 81 29 81 C37 81 42 75 42 67 V37"
    }),
    I: common_vendor.p({
      d: "M27 5 C15 5 9 16 9 27 V66 C9 82 19 92 31 92 C43 92 50 82 50 68 V28 C50 14 41 8 30 8 C19 8 13 16 13 27 V64 C13 76 20 84 30 84 C40 84 46 77 46 67 V34"
    }),
    J: common_vendor.p({
      d: "M22 10 C14 10 10 18 10 28 V64 C10 77 18 86 28 87"
    }),
    K: common_vendor.p({
      viewBox: "0 0 48 96",
      ["aria-hidden"]: "true"
    })
  } : $options.filteredPlanes.length ? common_vendor.e({
    M: $options.featuredPlane
  }, $options.featuredPlane ? common_vendor.e({
    N: $options.getPlaneMood($options.featuredPlane).icon,
    O: common_vendor.t($options.getPlaneMood($options.featuredPlane).label),
    P: $options.getPlaneMood($options.featuredPlane).color,
    Q: `${$options.getPlaneMood($options.featuredPlane).color}33`,
    R: common_vendor.t($options.formatPlaneTime($options.featuredPlane.createTime)),
    S: common_vendor.t($options.getFeaturedTitle($options.featuredPlane)),
    T: common_vendor.t($options.featuredPlane.content),
    U: common_vendor.t($options.getPlaneAuthorLabelText($options.featuredPlane)),
    V: common_vendor.t($options.featuredPlane.locationTag),
    W: $options.featuredPlane.imageUrls && $options.featuredPlane.imageUrls.length
  }, $options.featuredPlane.imageUrls && $options.featuredPlane.imageUrls.length ? {} : {}, {
    X: $options.featuredPlane.imageUrls && $options.featuredPlane.imageUrls.length
  }, $options.featuredPlane.imageUrls && $options.featuredPlane.imageUrls.length ? {
    Y: common_vendor.t($options.featuredPlane.imageUrls.length)
  } : {}, {
    Z: common_vendor.t($options.featuredPlane.pickCount || 0),
    aa: common_vendor.t($options.featuredPlane.likeCount || 0),
    ab: common_vendor.t($options.featuredPlane.commentCount || 0),
    ac: $options.featuredPlane.imageUrls && $options.featuredPlane.imageUrls.length
  }, $options.featuredPlane.imageUrls && $options.featuredPlane.imageUrls.length ? {
    ad: $options.getAssetUrl($options.featuredPlane.imageUrls[0])
  } : {
    ae: $options.getPlaneMood($options.featuredPlane).icon,
    af: common_vendor.t($options.getPlaneMood($options.featuredPlane).label),
    ag: $options.getPlaneMood($options.featuredPlane).color,
    ah: `${$options.getPlaneMood($options.featuredPlane).color}48`
  }, {
    ai: common_vendor.t($options.getPlaneStatusLabel($options.featuredPlane)),
    aj: common_vendor.s($options.getFeaturedCardStyle($options.featuredPlane)),
    ak: common_vendor.o(($event) => $options.openDetail($options.featuredPlane))
  }) : {}, {
    al: $options.secondaryPlanes.length
  }, $options.secondaryPlanes.length ? {
    am: common_vendor.f($options.secondaryPlanes, (plane, index, i0) => {
      return common_vendor.e({
        a: $options.isQuoteVariant(plane, index)
      }, $options.isQuoteVariant(plane, index) ? {} : {}, {
        b: $options.isDiaryVariant(plane, index)
      }, $options.isDiaryVariant(plane, index) ? {
        c: common_vendor.t($options.getPlaneMood(plane).label),
        d: $options.getPlaneMood(plane).color
      } : {}, {
        e: "157e4766-5-" + i0 + "," + ("157e4766-4-" + i0),
        f: "157e4766-6-" + i0 + "," + ("157e4766-4-" + i0),
        g: "157e4766-7-" + i0 + "," + ("157e4766-4-" + i0),
        h: "157e4766-4-" + i0,
        i: $options.getPlaneMood(plane).icon,
        j: $options.getPlaneMood(plane).color,
        k: common_vendor.t($options.formatPlaneTime(plane.createTime)),
        l: common_vendor.t($options.getPlaneAuthorLabelText(plane)),
        m: common_vendor.t($options.getPlaneMood(plane).label),
        n: $options.getPlaneMood(plane).color,
        o: `${$options.getPlaneMood(plane).color}33`,
        p: common_vendor.t($options.getPlaneStatusLabel(plane)),
        q: $options.shouldShowMediaPreview(plane, index)
      }, $options.shouldShowMediaPreview(plane, index) ? {
        r: $options.getAssetUrl(plane.imageUrls[0]),
        s: common_vendor.t(plane.imageUrls.length)
      } : {}, {
        t: common_vendor.t(plane.content),
        v: common_vendor.n({
          "is-large": $options.isQuoteVariant(plane, index),
          "is-tight": $options.isDiaryVariant(plane, index)
        }),
        w: common_vendor.t(plane.locationTag),
        x: plane.imageUrls && plane.imageUrls.length && !$options.shouldShowMediaPreview(plane, index)
      }, plane.imageUrls && plane.imageUrls.length && !$options.shouldShowMediaPreview(plane, index) ? {
        y: $options.getAssetUrl(plane.imageUrls[0]),
        z: common_vendor.t(plane.imageUrls.length)
      } : {}, {
        A: common_vendor.t($options.getHeatLabel(plane)),
        B: common_vendor.t(plane.pickCount || 0),
        C: common_vendor.t(plane.commentCount || 0),
        D: common_vendor.n(`variant-${$options.getPlaneVariant(plane, index)}`),
        E: common_vendor.n({
          "has-media": plane.imageUrls && plane.imageUrls.length
        }),
        F: common_vendor.o(($event) => $options.openDetail(plane), plane.id),
        G: plane.id,
        H: common_vendor.n(`variant-${$options.getPlaneVariant(plane, index)}`),
        I: common_vendor.n({
          "has-media": plane.imageUrls && plane.imageUrls.length,
          "airy-card": index % 3 === 1
        }),
        J: common_vendor.s($options.getNoteItemStyle(index, plane.id, plane.mood, plane))
      });
    }),
    an: common_vendor.p({
      d: "M29 7 C17 7 11 17 11 28 V67 C11 82 20 91 31 91 C41 91 48 82 48 69 V30 C48 17 40 10 31 10 C22 10 16 17 16 28 V64 C16 74 21 81 29 81 C37 81 42 75 42 67 V37"
    }),
    ao: common_vendor.p({
      d: "M27 5 C15 5 9 16 9 27 V66 C9 82 19 92 31 92 C43 92 50 82 50 68 V28 C50 14 41 8 30 8 C19 8 13 16 13 27 V64 C13 76 20 84 30 84 C40 84 46 77 46 67 V34"
    }),
    ap: common_vendor.p({
      d: "M22 10 C14 10 10 18 10 28 V64 C10 77 18 86 28 87"
    }),
    aq: common_vendor.p({
      viewBox: "0 0 48 96",
      ["aria-hidden"]: "true"
    })
  } : {}) : {}, {
    L: $options.filteredPlanes.length,
    ar: common_vendor.p({
      visible: _ctx.detailOpenVisible,
      theme: $data.appState.theme
    }),
    as: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    at: common_vendor.p({
      active: "discover",
      theme: $data.appState.theme
    }),
    av: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-157e4766"]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/discover/index.js.map
