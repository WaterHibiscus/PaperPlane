"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_auth = require("../../common/auth.js");
const common_storage = require("../../common/storage.js");
const common_utils = require("../../common/utils.js");
const common_detailOpenTransition = require("../../common/detail-open-transition.js");
const common_pageTransition = require("../../common/page-transition.js");
const AppTabbar = () => "../../components/AppTabbar.js";
const DetailOpenTransition = () => "../../components/DetailOpenTransition.js";
const PageTransition = () => "../../components/PageTransition.js";
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
      myPlanes: [],
      fueledPlanes: [],
      pickedPlanes: [],
      loading: false,
      activeTab: "hangar",
      hangarFilterOpen: false,
      hangarStatusFilter: "all",
      searchOpen: false,
      searchFocus: false,
      searchQuery: "",
      throwDraft: null,
      anonymousProfileId: common_storage.getVoterKey().slice(-4).toUpperCase(),
      sessionAccount: null
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    profileAvatarUrl() {
      return common_api.getAssetUrl(this.appState.profileAvatar);
    },
    nicknameInitial() {
      return (this.appState.profileName || "?").slice(0, 1);
    },
    profileId() {
      var _a, _b;
      const sourceId = ((_a = this.sessionAccount) == null ? void 0 : _a.accountId) || ((_b = this.sessionAccount) == null ? void 0 : _b.userId);
      if (!sourceId)
        return this.anonymousProfileId;
      return String(sourceId).slice(-6).toUpperCase();
    },
    profileGenderLabel() {
      if (this.appState.profileGender === "male")
        return "M";
      if (this.appState.profileGender === "female")
        return "F";
      return "Secret";
    },
    totalLikes() {
      return this.myPlanes.reduce((sum, item) => sum + (item.likeCount || 0), 0);
    },
    totalPickups() {
      return this.myPlanes.reduce((sum, item) => sum + (item.pickCount || 0), 0);
    },
    hasDraft() {
      var _a, _b;
      const draft = this.throwDraft;
      return Boolean(draft && (((_a = draft.content) == null ? void 0 : _a.trim()) || ((_b = draft.selectedImages) == null ? void 0 : _b.length)));
    },
    draftPreview() {
      var _a;
      const content = String(((_a = this.throwDraft) == null ? void 0 : _a.content) || "").trim();
      return content ? content.slice(0, 32) : "Draft is waiting for you.";
    },
    hangarPlanes() {
      const active = this.myPlanes.filter((item) => !this.isRecalledPlane(item) && !this.isExpiredPlane(item));
      const recalled = this.myPlanes.filter((item) => this.isRecalledPlane(item));
      const landed = this.myPlanes.filter((item) => !this.isRecalledPlane(item) && this.isExpiredPlane(item));
      return [...active, ...recalled, ...landed];
    },
    filteredHangarSource() {
      if (this.hangarStatusFilter === "active") {
        return this.hangarPlanes.filter((plane) => !this.isRecalledPlane(plane) && !this.isExpiredPlane(plane));
      }
      if (this.hangarStatusFilter === "recalled") {
        return this.hangarPlanes.filter((plane) => this.isRecalledPlane(plane));
      }
      return this.hangarPlanes;
    },
    normalizedSearch() {
      return String(this.searchQuery || "").trim().toLowerCase();
    },
    filteredHangarPlanes() {
      if (!this.normalizedSearch)
        return this.filteredHangarSource;
      return this.filteredHangarSource.filter((plane) => {
        const content = String(plane.content || "").toLowerCase();
        const location = String(plane.locationTag || "").toLowerCase();
        return content.includes(this.normalizedSearch) || location.includes(this.normalizedSearch);
      });
    },
    fueledList() {
      return this.fueledPlanes;
    },
    filteredFueledList() {
      if (!this.normalizedSearch)
        return this.fueledList;
      return this.fueledList.filter((plane) => {
        const content = String(plane.content || "").toLowerCase();
        const location = String(plane.locationTag || "").toLowerCase();
        return content.includes(this.normalizedSearch) || location.includes(this.normalizedSearch);
      });
    },
    pickedList() {
      return this.pickedPlanes;
    },
    filteredPickedList() {
      if (!this.normalizedSearch)
        return this.pickedList;
      return this.pickedList.filter((plane) => {
        const content = String(plane.content || "").toLowerCase();
        const location = String(plane.locationTag || "").toLowerCase();
        return content.includes(this.normalizedSearch) || location.includes(this.normalizedSearch);
      });
    }
  },
  onShow() {
    this.loadPageData();
  },
  methods: {
    isRecalledPlane(plane) {
      return Boolean((plane == null ? void 0 : plane.isRecalled) || (plane == null ? void 0 : plane.status) === "recalled");
    },
    isExpiredPlane(plane) {
      if (!plane)
        return true;
      if (plane.status === "expired")
        return true;
      if (this.isRecalledPlane(plane))
        return false;
      return common_utils.isExpired(plane.expireTime);
    },
    canRecallPlane(plane) {
      if (!plane)
        return false;
      return !this.isRecalledPlane(plane) && !this.isExpiredPlane(plane);
    },
    extractMineItems(payload) {
      if (Array.isArray(payload))
        return payload;
      if (Array.isArray(payload == null ? void 0 : payload.items))
        return payload.items;
      return [];
    },
    async loadPageData() {
      this.throwDraft = common_storage.getThrowDraft();
      this.sessionAccount = common_auth.getSessionAccount();
      if (!this.sessionAccount) {
        this.myPlanes = [];
        this.fueledPlanes = [];
        this.pickedPlanes = [];
        common_vendor.index.reLaunch({
          url: "/pages/login/index"
        });
        return;
      }
      this.loading = true;
      try {
        try {
          await common_auth.fetchCurrentUser();
          this.sessionAccount = common_auth.getSessionAccount();
        } catch (error) {
        }
        await Promise.all([
          this.loadMyPlanes(),
          this.loadFueledPlanes(),
          this.loadPickedPlanes()
        ]);
      } finally {
        this.loading = false;
      }
    },
    async loadMyPlanes() {
      try {
        const data = await common_api.getMyThrownPlanes({
          status: "all",
          page: 1,
          pageSize: 100
        });
        this.myPlanes = this.extractMineItems(data);
      } catch (error) {
        this.myPlanes = [];
        common_vendor.index.showToast({
          title: error.message || "Load failed",
          icon: "none"
        });
      }
    },
    async loadFueledPlanes() {
      try {
        const data = await common_api.getMyFueledPlanes({
          page: 1,
          pageSize: 100
        });
        this.fueledPlanes = this.extractMineItems(data);
      } catch (error) {
        this.fueledPlanes = [];
      }
    },
    async loadPickedPlanes() {
      try {
        const data = await common_api.getMyPickedPlanes({
          page: 1,
          pageSize: 100
        });
        this.pickedPlanes = this.extractMineItems(data);
      } catch (error) {
        this.pickedPlanes = [];
      }
    },
    formatPlaneDate(time) {
      if (!time)
        return "";
      const date = new Date(time);
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    getRemainingHoursLabel(plane) {
      if (!(plane == null ? void 0 : plane.expireTime))
        return "0h";
      const diff = new Date(plane.expireTime).getTime() - Date.now();
      if (diff <= 0)
        return "0h";
      const hours = Math.max(Math.ceil(diff / 36e5), 1);
      return `${hours}h`;
    },
    toggleSearch() {
      if (!this.searchOpen) {
        this.searchOpen = true;
      }
      this.$nextTick(() => {
        this.searchFocus = true;
      });
    },
    handleSearchBlur() {
      this.searchFocus = false;
      if (!this.searchQuery.trim()) {
        this.searchOpen = false;
      }
    },
    toggleHangarFilter() {
      if (this.activeTab !== "hangar")
        return;
      this.hangarFilterOpen = !this.hangarFilterOpen;
    },
    selectHangarFilter(value) {
      this.hangarStatusFilter = value;
      this.hangarFilterOpen = false;
    },
    handleRecall(plane) {
      common_vendor.index.showModal({
        title: "Recall plane",
        content: "After recall, this plane stops flying but remains in your history.",
        success: async ({ confirm }) => {
          if (!confirm)
            return;
          try {
            await common_api.recallPlane(plane.id);
            common_vendor.index.showToast({
              title: "Recalled",
              icon: "success"
            });
            await this.loadMyPlanes();
          } catch (error) {
            common_vendor.index.showToast({
              title: error.message || "Recall failed",
              icon: "none"
            });
          }
        }
      });
    },
    handleDestroy(plane) {
      common_vendor.index.showModal({
        title: "Destroy plane",
        content: "This action cannot be undone.",
        confirmColor: "#ff6478",
        success: async ({ confirm }) => {
          if (!confirm)
            return;
          try {
            await common_api.destroyPlane(plane.id);
            common_vendor.index.showToast({
              title: "Destroyed",
              icon: "success"
            });
            await Promise.all([
              this.loadMyPlanes(),
              this.loadFueledPlanes(),
              this.loadPickedPlanes()
            ]);
          } catch (error) {
            common_vendor.index.showToast({
              title: error.message || "Destroy failed",
              icon: "none"
            });
          }
        }
      });
    },
    goProfileSettings() {
      common_vendor.index.navigateTo({
        url: "/pages/profile-edit/index"
      });
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "Logout",
        content: "You will return to the login page.",
        confirmColor: "#ff7a6e",
        success: async ({ confirm }) => {
          if (!confirm)
            return;
          await common_auth.logoutAccount();
          this.sessionAccount = null;
          common_vendor.index.reLaunch({
            url: "/pages/login/index"
          });
        }
      });
    },
    goThrow() {
      common_vendor.index.navigateTo({
        url: "/pages/throw/index"
      });
    },
    openDetail(id) {
      this.openPlaneDetail(id);
    }
  }
};
if (!Array) {
  const _component_detail_open_transition = common_vendor.resolveComponent("detail-open-transition");
  const _component_page_transition = common_vendor.resolveComponent("page-transition");
  const _component_app_tabbar = common_vendor.resolveComponent("app-tabbar");
  (_component_detail_open_transition + _component_page_transition + _component_app_tabbar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $options.profileAvatarUrl
  }, $options.profileAvatarUrl ? {
    b: $options.profileAvatarUrl
  } : {
    c: common_vendor.t($options.nicknameInitial)
  }, {
    d: common_vendor.t($data.appState.profileName),
    e: common_vendor.t($options.profileId),
    f: common_vendor.t($options.profileGenderLabel),
    g: common_vendor.t($data.appState.profileBio),
    h: $data.sessionAccount
  }, $data.sessionAccount ? {
    i: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args))
  } : {}, {
    j: common_vendor.o((...args) => $options.goProfileSettings && $options.goProfileSettings(...args)),
    k: common_vendor.t($data.myPlanes.length),
    l: common_vendor.t($options.totalPickups),
    m: common_vendor.t($options.totalLikes),
    n: common_vendor.n({
      active: $data.activeTab === "hangar"
    }),
    o: common_vendor.o(($event) => $data.activeTab = "hangar"),
    p: common_vendor.n({
      active: $data.activeTab === "picked"
    }),
    q: common_vendor.o(($event) => $data.activeTab = "picked"),
    r: common_vendor.n({
      active: $data.activeTab === "fueled"
    }),
    s: common_vendor.o(($event) => $data.activeTab = "fueled"),
    t: $data.searchOpen
  }, $data.searchOpen ? {
    v: $data.searchFocus,
    w: common_vendor.o((...args) => $options.handleSearchBlur && $options.handleSearchBlur(...args)),
    x: $data.searchQuery,
    y: common_vendor.o(($event) => $data.searchQuery = $event.detail.value)
  } : {}, {
    z: common_vendor.n({
      open: $data.searchOpen
    }),
    A: !$data.searchOpen
  }, !$data.searchOpen ? {
    B: common_vendor.o((...args) => $options.toggleSearch && $options.toggleSearch(...args))
  } : {}, {
    C: $data.activeTab === "hangar"
  }, $data.activeTab === "hangar" ? {
    D: common_vendor.o((...args) => $options.toggleHangarFilter && $options.toggleHangarFilter(...args))
  } : {}, {
    E: $data.activeTab === "hangar" && $data.hangarFilterOpen
  }, $data.activeTab === "hangar" && $data.hangarFilterOpen ? {
    F: common_vendor.n({
      active: $data.hangarStatusFilter === "all"
    }),
    G: common_vendor.o(($event) => $options.selectHangarFilter("all")),
    H: common_vendor.n({
      active: $data.hangarStatusFilter === "active"
    }),
    I: common_vendor.o(($event) => $options.selectHangarFilter("active")),
    J: common_vendor.n({
      active: $data.hangarStatusFilter === "recalled"
    }),
    K: common_vendor.o(($event) => $options.selectHangarFilter("recalled"))
  } : {}, {
    L: $data.activeTab === "hangar"
  }, $data.activeTab === "hangar" ? common_vendor.e({
    M: $options.hasDraft
  }, $options.hasDraft ? {
    N: common_vendor.t($options.draftPreview),
    O: common_vendor.o((...args) => $options.goThrow && $options.goThrow(...args))
  } : {}, {
    P: $data.loading
  }, $data.loading ? {} : !$data.myPlanes.length ? {} : !$options.filteredHangarPlanes.length ? {} : {
    S: common_vendor.f($options.filteredHangarPlanes, (plane, k0, i0) => {
      return common_vendor.e({
        a: $options.isRecalledPlane(plane)
      }, $options.isRecalledPlane(plane) ? {} : !$options.isExpiredPlane(plane) ? {
        c: common_vendor.t($options.getRemainingHoursLabel(plane))
      } : {}, {
        b: !$options.isExpiredPlane(plane),
        d: common_vendor.t($options.formatPlaneDate(plane.createTime)),
        e: common_vendor.t(plane.content),
        f: common_vendor.n({
          muted: $options.isExpiredPlane(plane)
        }),
        g: common_vendor.t(plane.locationTag),
        h: common_vendor.t(plane.pickCount || 0),
        i: $options.canRecallPlane(plane)
      }, $options.canRecallPlane(plane) ? {
        j: common_vendor.o(($event) => $options.handleRecall(plane), plane.id),
        k: common_vendor.o(($event) => $options.handleDestroy(plane), plane.id)
      } : {
        l: common_vendor.o(($event) => $options.handleDestroy(plane), plane.id)
      }, {
        m: plane.id,
        n: common_vendor.n($options.isExpiredPlane(plane) ? "landed" : "active-flight"),
        o: common_vendor.o(($event) => $options.openDetail(plane.id), plane.id)
      });
    })
  }, {
    Q: !$data.myPlanes.length,
    R: !$options.filteredHangarPlanes.length
  }) : $data.activeTab === "picked" ? common_vendor.e({
    U: $data.loading
  }, $data.loading ? {} : !$options.pickedList.length ? {} : !$options.filteredPickedList.length ? {} : {
    X: common_vendor.f($options.filteredPickedList, (plane, k0, i0) => {
      return {
        a: common_vendor.t($options.formatPlaneDate(plane.pickedAt || plane.createTime)),
        b: common_vendor.t(plane.content),
        c: common_vendor.t(plane.locationTag),
        d: common_vendor.t(plane.commentCount || 0),
        e: `picked-${plane.id}`,
        f: common_vendor.o(($event) => $options.openDetail(plane.id), `picked-${plane.id}`)
      };
    })
  }, {
    V: !$options.pickedList.length,
    W: !$options.filteredPickedList.length
  }) : common_vendor.e({
    Y: $data.loading
  }, $data.loading ? {} : !$options.fueledList.length ? {} : !$options.filteredFueledList.length ? {} : {
    ab: common_vendor.f($options.filteredFueledList, (plane, k0, i0) => {
      return {
        a: common_vendor.t($options.formatPlaneDate(plane.fueledAt || plane.createTime)),
        b: common_vendor.t(plane.content),
        c: common_vendor.t(plane.locationTag),
        d: common_vendor.t(plane.likeCount || 0),
        e: `fueled-${plane.id}`,
        f: common_vendor.o(($event) => $options.openDetail(plane.id), `fueled-${plane.id}`)
      };
    })
  }, {
    Z: !$options.fueledList.length,
    aa: !$options.filteredFueledList.length
  }), {
    T: $data.activeTab === "picked",
    ac: common_vendor.p({
      visible: _ctx.detailOpenVisible,
      theme: $data.appState.theme
    }),
    ad: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    ae: common_vendor.p({
      active: "mine",
      theme: $data.appState.theme
    }),
    af: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/index.js.map
