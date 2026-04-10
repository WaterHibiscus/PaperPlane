"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_moods = require("../../common/moods.js");
const common_storage = require("../../common/storage.js");
const common_pageTransition = require("../../common/page-transition.js");
const AppTabbar = () => "../../components/AppTabbar.js";
const PageTransition = () => "../../components/PageTransition.js";
const _sfc_main = {
  mixins: [common_pageTransition.pageTransitionMixin],
  components: {
    AppTabbar,
    PageTransition
  },
  data() {
    return {
      appState: common_appState.appState,
      moodOptions: common_moods.moodOptions,
      expireOptions: common_moods.expireOptions,
      content: "",
      selectedImages: [],
      mood: "calm",
      location: "",
      isAnonymous: true,
      expireHours: 24,
      voteEditorOpen: false,
      voteTitle: "",
      voteOptionInputs: ["", "", "", ""],
      loading: false,
      launchAnimating: false,
      launchTimer: null,
      closeIcon: "×",
      arrowIcon: "›",
      pinIcon: "⌖",
      timeIcon: "◷",
      moodIcon: "✦",
      voteIcon: "◌",
      planeIcon: "✈",
      labels: {
        anonymousMode: "匿名投掷",
        realMode: "实名投掷",
        anonymousHint: "这架纸飞机会以匿名身份飞出去。",
        editorPlaceholder: "写下你想留在这里的话...",
        imageLabel: "附加图片",
        addImage: "添加图片",
        locationLabel: "降落地点",
        moodLabel: "纸飞机情绪",
        expireLabel: "存活时间",
        voteLabel: "附加投票",
        voteTitlePlaceholder: "投票标题",
        voteOptionPlaceholder: "投票选项",
        launch: "放飞纸飞机",
        launching: "正在起飞...",
        launchFlightTitle: "这一页已经被折成纸飞机",
        launchFlightSubtitle: "它会带着你的心情穿过风，再落进某个陌生人的手心。"
      }
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    locations() {
      return this.appState.locations || [];
    },
    locationOptions() {
      return this.locations.map((item) => item.name);
    },
    moodPickerOptions() {
      return this.moodOptions.map((item) => `${item.icon} ${item.text}`);
    },
    expirePickerOptions() {
      return this.expireOptions.map((item) => item.text);
    },
    wordCount() {
      return (this.content || "").length;
    },
    currentMoodLabel() {
      const current = this.moodOptions.find((item) => item.value === this.mood);
      return current ? current.text : "平静";
    },
    expireLabel() {
      const current = this.expireOptions.find((item) => item.value === this.expireHours);
      return current ? current.text : "24小时";
    },
    realModeHint() {
      return `这架纸飞机会显示为“${this.appState.profileName}”发布。`;
    },
    locationDisplay() {
      return this.location || "请选择地点";
    },
    normalizedVoteOptions() {
      return this.voteOptionInputs.map((item) => item.trim()).filter(Boolean);
    },
    hasVoteDraft() {
      return Boolean(this.voteTitle.trim() || this.normalizedVoteOptions.length);
    },
    voteSummaryText() {
      if (!this.voteTitle.trim() && !this.normalizedVoteOptions.length) {
        return "不设置";
      }
      if (this.voteTitle.trim() && this.normalizedVoteOptions.length >= 2) {
        return `${this.normalizedVoteOptions.length} 个选项`;
      }
      return "填写中";
    },
    canLaunch() {
      if (!this.content.trim() || !this.location)
        return false;
      if (!this.hasVoteDraft)
        return true;
      return Boolean(this.voteTitle.trim()) && this.normalizedVoteOptions.length >= 2;
    },
    throwStyle() {
      return {
        "--throw-accent": "#31bc7d",
        "--throw-accent-strong": "#1f9d69",
        "--throw-accent-glow": "rgba(49, 188, 125, 0.34)"
      };
    },
    launchPreviewText() {
      const source = String(this.content || "").trim();
      return source ? source.slice(0, 24) : "纸页正在收起今天想说的话";
    }
  },
  watch: {
    content: "persistDraft",
    selectedImages: {
      handler: "persistDraft",
      deep: true
    },
    mood: "persistDraft",
    location: "persistDraft",
    isAnonymous: "persistDraft",
    expireHours: "persistDraft",
    voteEditorOpen: "persistDraft",
    voteTitle: "persistDraft",
    voteOptionInputs: {
      handler: "persistDraft",
      deep: true
    }
  },
  async onShow() {
    await common_appState.fetchLocations();
    this.restoreDraft();
  },
  onHide() {
    this.persistDraft();
    this.clearLaunchTimer();
    this.launchAnimating = false;
  },
  onUnload() {
    this.persistDraft();
    this.clearLaunchTimer();
    this.launchAnimating = false;
  },
  methods: {
    goBack() {
      common_vendor.index.switchTab({
        url: "/pages/home/index",
        fail: () => {
          common_vendor.index.reLaunch({
            url: "/pages/home/index"
          });
        }
      });
    },
    handleLocationChange(event) {
      const index = Number(event.detail.value);
      this.location = this.locationOptions[index] || this.location;
    },
    handleMoodChange(event) {
      const index = Number(event.detail.value);
      const current = this.moodOptions[index];
      if (current) {
        this.mood = current.value;
      }
    },
    handleExpireChange(event) {
      const index = Number(event.detail.value);
      const current = this.expireOptions[index];
      if (current) {
        this.expireHours = current.value;
      }
    },
    chooseImages() {
      const remainCount = 9 - this.selectedImages.length;
      if (remainCount <= 0)
        return;
      common_vendor.index.chooseImage({
        count: remainCount,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const files = res.tempFilePaths || [];
          this.selectedImages = [...this.selectedImages, ...files].slice(0, 9);
        }
      });
    },
    removeImage(index) {
      this.selectedImages.splice(index, 1);
    },
    previewImages(current) {
      if (!this.selectedImages.length)
        return;
      common_vendor.index.previewImage({
        urls: this.selectedImages,
        current: this.selectedImages[current]
      });
    },
    persistDraft() {
      var _a, _b;
      const draft = {
        content: this.content,
        selectedImages: this.selectedImages,
        mood: this.mood,
        location: this.location,
        isAnonymous: this.isAnonymous,
        expireHours: this.expireHours,
        voteEditorOpen: this.voteEditorOpen,
        voteTitle: this.voteTitle,
        voteOptionInputs: this.voteOptionInputs
      };
      const hasDraft = Boolean((_a = draft.content) == null ? void 0 : _a.trim()) || draft.selectedImages.length > 0 || Boolean(draft.location) || draft.mood !== "calm" || draft.isAnonymous !== true || draft.expireHours !== 24 || Boolean(draft.voteEditorOpen) || Boolean((_b = draft.voteTitle) == null ? void 0 : _b.trim()) || draft.voteOptionInputs.some((item) => String(item || "").trim());
      if (!hasDraft) {
        common_storage.clearThrowDraft();
        return;
      }
      common_storage.setThrowDraft(draft);
    },
    restoreDraft() {
      const draft = common_storage.getThrowDraft();
      if (draft) {
        this.content = draft.content || "";
        this.selectedImages = Array.isArray(draft.selectedImages) ? draft.selectedImages.slice(0, 9) : [];
        this.mood = draft.mood || "calm";
        this.location = draft.location || this.appState.currentLocation || "";
        this.isAnonymous = draft.isAnonymous !== false;
        this.expireHours = draft.expireHours || 24;
        this.voteEditorOpen = Boolean(draft.voteEditorOpen);
        this.voteTitle = draft.voteTitle || "";
        this.voteOptionInputs = Array.isArray(draft.voteOptionInputs) ? [...draft.voteOptionInputs, "", "", "", ""].slice(0, 4) : ["", "", "", ""];
        return;
      }
      if (this.appState.currentLocation) {
        this.location = this.appState.currentLocation;
      }
    },
    resetVoteDraft() {
      this.voteEditorOpen = false;
      this.voteTitle = "";
      this.voteOptionInputs = ["", "", "", ""];
      this.selectedImages = [];
    },
    playLaunchAnimation(duration = 1680) {
      this.clearLaunchTimer();
      this.launchAnimating = true;
      return new Promise((resolve) => {
        this.launchTimer = setTimeout(() => {
          this.launchAnimating = false;
          this.launchTimer = null;
          resolve();
        }, duration);
      });
    },
    clearLaunchTimer() {
      if (this.launchTimer) {
        clearTimeout(this.launchTimer);
        this.launchTimer = null;
      }
    },
    async handleThrow() {
      if (this.loading || this.launchAnimating)
        return;
      if (!this.content.trim()) {
        common_vendor.index.showToast({
          title: "请写点什么吧",
          icon: "none"
        });
        return;
      }
      if (!this.location) {
        common_vendor.index.showToast({
          title: "请选择地点",
          icon: "none"
        });
        return;
      }
      if (this.hasVoteDraft) {
        if (!this.voteTitle.trim()) {
          common_vendor.index.showToast({
            title: "请填写投票标题",
            icon: "none"
          });
          return;
        }
        if (this.normalizedVoteOptions.length < 2) {
          common_vendor.index.showToast({
            title: "至少填写两个投票选项",
            icon: "none"
          });
          return;
        }
      }
      this.loading = true;
      try {
        const imageUrls = [];
        for (const filePath of this.selectedImages) {
          const url = await common_api.uploadPlaneImage(filePath);
          imageUrls.push(url);
        }
        const plane = await common_api.throwPlane({
          locationTag: this.location,
          content: this.content.trim(),
          mood: this.mood,
          isAnonymous: this.isAnonymous,
          authorName: this.isAnonymous ? "" : this.appState.profileName,
          imageUrls,
          expireHours: this.expireHours,
          voteTitle: this.hasVoteDraft ? this.voteTitle.trim() : "",
          voteOptions: this.hasVoteDraft ? this.normalizedVoteOptions : []
        });
        common_storage.saveMyPlaneId(plane.id);
        common_appState.setCurrentLocation(this.location);
        await this.playLaunchAnimation();
        this.content = "";
        this.resetVoteDraft();
        common_storage.clearThrowDraft();
        common_vendor.index.switchTab({
          url: "/pages/home/index",
          fail: () => {
            common_vendor.index.reLaunch({
              url: "/pages/home/index"
            });
          }
        });
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "投掷失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    }
  }
};
if (!Array) {
  const _component_page_transition = common_vendor.resolveComponent("page-transition");
  const _component_app_tabbar = common_vendor.resolveComponent("app-tabbar");
  (_component_page_transition + _component_app_tabbar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.closeIcon),
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.t($data.isAnonymous ? $data.labels.anonymousMode : $data.labels.realMode),
    d: common_vendor.n($data.isAnonymous ? "" : "named"),
    e: common_vendor.o(($event) => $data.isAnonymous = !$data.isAnonymous),
    f: common_vendor.t($data.isAnonymous ? $data.labels.anonymousHint : $options.realModeHint),
    g: $data.labels.editorPlaceholder,
    h: $data.content,
    i: common_vendor.o(($event) => $data.content = $event.detail.value),
    j: common_vendor.t($options.wordCount),
    k: common_vendor.t($data.labels.imageLabel),
    l: common_vendor.t($data.selectedImages.length),
    m: common_vendor.f($data.selectedImages, (item, index, i0) => {
      return {
        a: item,
        b: common_vendor.o(($event) => $options.previewImages(index), `${item}-${index}`),
        c: common_vendor.o(($event) => $options.removeImage(index), `${item}-${index}`),
        d: `${item}-${index}`
      };
    }),
    n: $data.selectedImages.length < 9
  }, $data.selectedImages.length < 9 ? {
    o: common_vendor.t($data.labels.addImage),
    p: common_vendor.o((...args) => $options.chooseImages && $options.chooseImages(...args))
  } : {}, {
    q: common_vendor.t($data.pinIcon),
    r: common_vendor.t($data.labels.locationLabel),
    s: common_vendor.t($options.locationDisplay),
    t: common_vendor.t($data.arrowIcon),
    v: $options.locationOptions,
    w: common_vendor.o((...args) => $options.handleLocationChange && $options.handleLocationChange(...args)),
    x: common_vendor.t($data.moodIcon),
    y: common_vendor.t($data.labels.moodLabel),
    z: common_vendor.t($options.currentMoodLabel),
    A: common_vendor.t($data.arrowIcon),
    B: $options.moodPickerOptions,
    C: common_vendor.o((...args) => $options.handleMoodChange && $options.handleMoodChange(...args)),
    D: common_vendor.t($data.timeIcon),
    E: common_vendor.t($data.labels.expireLabel),
    F: common_vendor.t($options.expireLabel),
    G: common_vendor.t($data.arrowIcon),
    H: $options.expirePickerOptions,
    I: common_vendor.o((...args) => $options.handleExpireChange && $options.handleExpireChange(...args)),
    J: common_vendor.t($data.voteIcon),
    K: common_vendor.t($data.labels.voteLabel),
    L: common_vendor.t($options.voteSummaryText),
    M: common_vendor.t($data.arrowIcon),
    N: common_vendor.n($data.voteEditorOpen ? "expanded" : ""),
    O: common_vendor.o(($event) => $data.voteEditorOpen = !$data.voteEditorOpen),
    P: $data.labels.voteTitlePlaceholder,
    Q: $data.voteTitle,
    R: common_vendor.o(($event) => $data.voteTitle = $event.detail.value),
    S: common_vendor.f($data.voteOptionInputs, (item, index, i0) => {
      return {
        a: `vote-option-${index}`,
        b: `${$data.labels.voteOptionPlaceholder} ${index + 1}`,
        c: $data.voteOptionInputs[index],
        d: common_vendor.o(($event) => $data.voteOptionInputs[index] = $event.detail.value, `vote-option-${index}`)
      };
    }),
    T: common_vendor.n($data.voteEditorOpen ? "open" : ""),
    U: common_vendor.t($data.planeIcon),
    V: common_vendor.t($data.loading ? $data.labels.launching : $data.labels.launch),
    W: common_vendor.n({
      loading: $data.loading,
      launching: $data.launchAnimating,
      disabled: !$options.canLaunch && !$data.loading && !$data.launchAnimating
    }),
    X: common_vendor.o((...args) => $options.handleThrow && $options.handleThrow(...args)),
    Y: common_vendor.n({
      "is-launching": $data.launchAnimating
    }),
    Z: common_vendor.n({
      "is-launching": $data.launchAnimating
    }),
    aa: $data.launchAnimating
  }, $data.launchAnimating ? {
    ab: common_vendor.t($options.launchPreviewText),
    ac: common_vendor.t($options.launchPreviewText),
    ad: common_vendor.t($data.labels.launching),
    ae: common_vendor.t($data.labels.launchFlightTitle),
    af: common_vendor.t($data.labels.launchFlightSubtitle)
  } : {}, {
    ag: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    ah: common_vendor.p({
      active: "throw",
      theme: $data.appState.theme
    }),
    ai: common_vendor.n($options.themeClass),
    aj: common_vendor.n({
      launching: $data.launchAnimating
    }),
    ak: common_vendor.s($options.throwStyle)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c19b2228"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/throw/index.js.map
