"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_auth = require("../../common/auth.js");
const common_storage = require("../../common/storage.js");
const common_planeCode = require("../../common/plane-code.js");
const common_utils = require("../../common/utils.js");
const common_detailOpenTransition = require("../../common/detail-open-transition.js");
const common_pageTransition = require("../../common/page-transition.js");
const common_uiIcons = require("../../common/ui-icons.js");
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
      icons: common_uiIcons.uiIcons,
      myPlanes: [],
      fueledPlanes: [],
      pickedPlanes: [],
      loading: false,
      activeTab: "hangar",
      tabMotionDirection: "forward",
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
        return "男";
      if (this.appState.profileGender === "female")
        return "女";
      return "保密";
    },
    profileGenderIcon() {
      if (this.appState.profileGender === "male")
        return "/static/images/男.png";
      if (this.appState.profileGender === "female")
        return "/static/images/女.png";
      return "/static/images/性别保密.png";
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
      return content ? content.slice(0, 32) : "草稿在等你继续。";
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
    },
    tabPanelMotionClass() {
      return this.tabMotionDirection === "backward" ? "tab-panel-backward" : "tab-panel-forward";
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
        try {
          await common_auth.fetchCurrentUser();
          this.sessionAccount = common_auth.getSessionAccount();
        } catch (error) {
        }
        if (!this.sessionAccount) {
          this.myPlanes = [];
          this.fueledPlanes = [];
          this.pickedPlanes = [];
          common_vendor.index.reLaunch({
            url: "/pages/login/index"
          });
          return;
        }
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
          title: error.message || "加载失败",
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
        return "0小时";
      const diff = new Date(plane.expireTime).getTime() - Date.now();
      if (diff <= 0)
        return "0小时";
      const hours = Math.max(Math.ceil(diff / 36e5), 1);
      return `${hours}小时`;
    },
    switchTab(nextTab) {
      if (!nextTab || nextTab === this.activeTab)
        return;
      const order = ["hangar", "picked", "fueled"];
      const currentIndex = order.indexOf(this.activeTab);
      const nextIndex = order.indexOf(nextTab);
      this.tabMotionDirection = nextIndex < currentIndex ? "backward" : "forward";
      this.activeTab = nextTab;
      if (nextTab !== "hangar") {
        this.hangarFilterOpen = false;
      }
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
        title: "召回纸飞机",
        content: "召回后纸飞机将停止飞行，但会保留在你的记录中。",
        success: async ({
          confirm
        }) => {
          if (!confirm)
            return;
          try {
            await common_api.recallPlane(plane.id);
            common_vendor.index.showToast({
              title: "已召回",
              icon: "success"
            });
            await this.loadMyPlanes();
          } catch (error) {
            common_vendor.index.showToast({
              title: error.message || "召回失败",
              icon: "none"
            });
          }
        }
      });
    },
    handleDestroy(plane) {
      common_vendor.index.showModal({
        title: "销毁纸飞机",
        content: "该操作不可撤销。",
        confirmColor: "#ff6478",
        success: async ({
          confirm
        }) => {
          if (!confirm)
            return;
          try {
            await common_api.destroyPlane(plane.id);
            common_vendor.index.showToast({
              title: "已销毁",
              icon: "success"
            });
            await Promise.all([
              this.loadMyPlanes(),
              this.loadFueledPlanes(),
              this.loadPickedPlanes()
            ]);
          } catch (error) {
            common_vendor.index.showToast({
              title: error.message || "销毁失败",
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
    handlePlaneBarcodeScan() {
      common_vendor.index.scanCode({
        scanType: ["barCode"],
        success: (res) => {
          const planeId = common_planeCode.parseScannedPlaneId(res == null ? void 0 : res.result);
          if (!planeId) {
            common_vendor.index.showToast({
              title: "未识别到纸条条码",
              icon: "none"
            });
            return;
          }
          this.openDetail(planeId);
        },
        fail: (error) => {
          if ((error == null ? void 0 : error.errMsg) && /cancel/i.test(error.errMsg))
            return;
          common_vendor.index.showToast({
            title: "扫描失败",
            icon: "none"
          });
        }
      });
    },
    handleScan() {
      common_vendor.index.showToast({
        title: "扫描功能开发中",
        icon: "none"
      });
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "退出登录",
        content: "退出后将返回登录页。",
        confirmColor: "#ff7a6e",
        success: async ({
          confirm
        }) => {
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
    f: $options.profileGenderIcon,
    g: common_vendor.t($options.profileGenderLabel),
    h: common_vendor.t($data.appState.profileBio),
    i: $data.sessionAccount
  }, $data.sessionAccount ? {
    j: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args))
  } : {}, {
    k: $data.icons.scan,
    l: common_vendor.o((...args) => $options.handlePlaneBarcodeScan && $options.handlePlaneBarcodeScan(...args)),
    m: $data.icons.settings,
    n: common_vendor.o((...args) => $options.goProfileSettings && $options.goProfileSettings(...args)),
    o: common_vendor.t($data.myPlanes.length),
    p: common_vendor.t($options.totalPickups),
    q: common_vendor.t($options.totalLikes),
    r: common_vendor.n({
      active: $data.activeTab === "hangar"
    }),
    s: common_vendor.o(($event) => $options.switchTab("hangar")),
    t: common_vendor.n({
      active: $data.activeTab === "picked"
    }),
    v: common_vendor.o(($event) => $options.switchTab("picked")),
    w: common_vendor.n({
      active: $data.activeTab === "fueled"
    }),
    x: common_vendor.o(($event) => $options.switchTab("fueled")),
    y: $data.searchOpen
  }, $data.searchOpen ? {
    z: $data.searchFocus,
    A: common_vendor.o((...args) => $options.handleSearchBlur && $options.handleSearchBlur(...args)),
    B: $data.searchQuery,
    C: common_vendor.o(($event) => $data.searchQuery = $event.detail.value)
  } : {}, {
    D: common_vendor.n({
      open: $data.searchOpen
    }),
    E: !$data.searchOpen
  }, !$data.searchOpen ? {
    F: $data.icons.search,
    G: common_vendor.o((...args) => $options.toggleSearch && $options.toggleSearch(...args))
  } : {}, {
    H: $data.activeTab === "hangar"
  }, $data.activeTab === "hangar" ? {
    I: $data.icons.filter,
    J: common_vendor.o((...args) => $options.toggleHangarFilter && $options.toggleHangarFilter(...args))
  } : {}, {
    K: $data.activeTab === "hangar" && $data.hangarFilterOpen
  }, $data.activeTab === "hangar" && $data.hangarFilterOpen ? {
    L: common_vendor.n({
      active: $data.hangarStatusFilter === "all"
    }),
    M: common_vendor.o(($event) => $options.selectHangarFilter("all")),
    N: common_vendor.n({
      active: $data.hangarStatusFilter === "active"
    }),
    O: common_vendor.o(($event) => $options.selectHangarFilter("active")),
    P: common_vendor.n({
      active: $data.hangarStatusFilter === "recalled"
    }),
    Q: common_vendor.o(($event) => $options.selectHangarFilter("recalled"))
  } : {}, {
    R: $data.activeTab === "hangar"
  }, $data.activeTab === "hangar" ? common_vendor.e({
    S: $options.hasDraft
  }, $options.hasDraft ? {
    T: common_vendor.t($options.draftPreview),
    U: common_vendor.o((...args) => $options.goThrow && $options.goThrow(...args))
  } : {}, {
    V: $data.loading
  }, $data.loading ? {} : !$data.myPlanes.length ? {} : !$options.filteredHangarPlanes.length ? {} : {
    Y: common_vendor.f($options.filteredHangarPlanes, (plane, k0, i0) => {
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
    W: !$data.myPlanes.length,
    X: !$options.filteredHangarPlanes.length,
    Z: common_vendor.n($options.tabPanelMotionClass)
  }) : $data.activeTab === "picked" ? common_vendor.e({
    ab: $data.loading
  }, $data.loading ? {} : !$options.pickedList.length ? {} : !$options.filteredPickedList.length ? {} : {
    ae: common_vendor.f($options.filteredPickedList, (plane, k0, i0) => {
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
    ac: !$options.pickedList.length,
    ad: !$options.filteredPickedList.length,
    af: common_vendor.n($options.tabPanelMotionClass)
  }) : common_vendor.e({
    ag: $data.loading
  }, $data.loading ? {} : !$options.fueledList.length ? {} : !$options.filteredFueledList.length ? {} : {
    aj: common_vendor.f($options.filteredFueledList, (plane, k0, i0) => {
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
    ah: !$options.fueledList.length,
    ai: !$options.filteredFueledList.length,
    ak: common_vendor.n($options.tabPanelMotionClass)
  }), {
    aa: $data.activeTab === "picked",
    al: common_vendor.p({
      visible: _ctx.detailOpenVisible,
      theme: $data.appState.theme
    }),
    am: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    an: common_vendor.p({
      active: "mine",
      theme: $data.appState.theme
    }),
    ao: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-569e925a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/index.js.map
