"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_moods = require("../../common/moods.js");
const common_throwSettings = require("../../common/throw-settings.js");
const common_storage = require("../../common/storage.js");
const common_pageTransition = require("../../common/page-transition.js");
const common_uiIcons = require("../../common/ui-icons.js");
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
      moodOptions: common_moods.getMoodOptions(),
      expireOptions: common_throwSettings.getThrowExpireOptions(),
      content: "",
      selectedImages: [],
      mood: "calm",
      customMoodText: "",
      location: "",
      isAnonymous: true,
      expireHours: 24,
      voteEditorOpen: false,
      voteTitle: "",
      voteOptionInputs: ["", "", "", ""],
      loading: false,
      publishStage: "idle",
      publishProgress: 0,
      publishDetail: "",
      launchAnimating: false,
      launchTimer: null,
      closeIcon: common_uiIcons.uiIcons.close,
      arrowIcon: "›",
      pinIcon: common_uiIcons.uiIcons.location,
      timeIcon: common_uiIcons.uiIcons.hourglass,
      voteIcon: common_uiIcons.uiIcons.vote,
      planeIcon: common_uiIcons.uiIcons.throwActive,
      addImageIcon: common_uiIcons.uiIcons.more,
      selectorVisible: false,
      selectorOpen: false,
      selectorType: "",
      selectorOpenTimer: null,
      selectorCloseTimer: null,
      labels: {
        anonymousMode: "匿名投递",
        realMode: "实名投递",
        anonymousHint: "这架纸飞机会以匿名身份起飞。",
        editorPlaceholder: "写下你想留在这里的话...",
        imageLabel: "附加图片",
        addImage: "添加图片",
        locationLabel: "降落地点",
        moodLabel: "纸飞机情绪",
        customMoodLabel: "自定义心情",
        customMoodPlaceholder: "输入你的心情（最多20字）",
        expireLabel: "存活时间",
        voteLabel: "附加投票",
        voteTitlePlaceholder: "投票标题",
        voteOptionPlaceholder: "投票选项",
        launch: "放飞纸飞机",
        launching: "正在起飞...",
        launchFlightTitle: "这一页已经被折成纸飞机",
        launchFlightSubtitle: "它会带着你的心情穿过风，落进某个陌生人的手心。"
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
    currentLocationOption() {
      return this.locations.find((item) => item.name === this.location) || null;
    },
    currentLocationIcon() {
      var _a;
      return ((_a = this.currentLocationOption) == null ? void 0 : _a.iconUrl) ? common_api.getAssetUrl(this.currentLocationOption.iconUrl) : this.pinIcon;
    },
    selectorTitle() {
      if (this.selectorType === "location")
        return this.labels.locationLabel;
      if (this.selectorType === "mood")
        return this.labels.moodLabel;
      if (this.selectorType === "expire")
        return this.labels.expireLabel;
      return "请选择";
    },
    selectorOptions() {
      if (this.selectorType === "location") {
        return this.locations.map((item) => ({
          key: `loc-${item.id || item.name}`,
          label: item.name,
          value: item.name,
          icon: item.iconUrl ? common_api.getAssetUrl(item.iconUrl) : this.pinIcon
        }));
      }
      if (this.selectorType === "mood") {
        return this.moodOptions.map((item) => ({
          key: `mood-${item.value}`,
          label: item.text,
          value: item.value,
          icon: item.icon || this.currentMoodIcon,
          isCustom: Boolean(item.isCustom)
        })).sort((left, right) => Number(left.isCustom) - Number(right.isCustom));
      }
      if (this.selectorType === "expire") {
        return this.expireOptions.map((item) => ({
          key: `expire-${item.value}`,
          label: item.text,
          value: item.value,
          icon: this.timeIcon
        }));
      }
      return [];
    },
    selectorSelectedValue() {
      if (this.selectorType === "location")
        return this.location;
      if (this.selectorType === "mood")
        return this.mood;
      if (this.selectorType === "expire")
        return this.expireHours;
      return "";
    },
    selectorEmptyText() {
      if (this.selectorType === "location")
        return "暂无可选地点";
      return "暂无可选项";
    },
    wordCount() {
      return (this.content || "").length;
    },
    currentMoodOption() {
      return this.moodOptions.find((item) => item.value === this.mood) || null;
    },
    isCustomMoodSelected() {
      var _a;
      return this.mood === "custom" || Boolean((_a = this.currentMoodOption) == null ? void 0 : _a.isCustom);
    },
    currentMoodIcon() {
      var _a;
      return ((_a = this.currentMoodOption) == null ? void 0 : _a.icon) || common_moods.getMoodMeta(this.mood).icon || common_uiIcons.uiIcons.emotion;
    },
    currentMoodLabel() {
      var _a, _b;
      if (this.isCustomMoodSelected) {
        return this.customMoodText.trim() || ((_a = this.currentMoodOption) == null ? void 0 : _a.text) || "自定义心情";
      }
      return ((_b = this.currentMoodOption) == null ? void 0 : _b.text) || "平静";
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
      if (this.isCustomMoodSelected && !this.customMoodText.trim())
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
    },
    launchButtonText() {
      if (!this.loading)
        return this.labels.launch;
      if (this.publishStage === "uploading") {
        return `上传中 ${this.publishProgress}%`;
      }
      return this.publishStageText || this.labels.launching;
    },
    publishStageText() {
      switch (this.publishStage) {
        case "preparing":
          return "准备发布中";
        case "uploading":
          return "图片上传中";
        case "submitting":
          return "提交内容中";
        case "launching":
          return "正在起飞";
        default:
          return this.labels.launching;
      }
    },
    publishDetailText() {
      if (this.publishDetail)
        return this.publishDetail;
      if (this.publishStage === "uploading")
        return "正在传输图片数据";
      if (this.publishStage === "submitting")
        return "正在保存纸飞机内容";
      if (this.publishStage === "launching")
        return "即将完成发布";
      return "正在处理你的请求";
    }
  },
  watch: {
    content: "persistDraft",
    selectedImages: {
      handler: "persistDraft",
      deep: true
    },
    mood: "persistDraft",
    customMoodText: "persistDraft",
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
    try {
      await common_appState.fetchMoodConfigs();
    } catch (error) {
    }
    this.refreshMoodOptions();
    await this.refreshExpireOptions();
    this.restoreDraft();
  },
  onHide() {
    this.persistDraft();
    this.clearLaunchTimer();
    this.clearSelectorTimers();
    this.selectorVisible = false;
    this.selectorOpen = false;
    this.selectorType = "";
    this.launchAnimating = false;
    this.resetPublishState();
  },
  onUnload() {
    this.persistDraft();
    this.clearLaunchTimer();
    this.clearSelectorTimers();
    this.selectorVisible = false;
    this.selectorOpen = false;
    this.selectorType = "";
    this.launchAnimating = false;
    this.resetPublishState();
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
    getDefaultMoodValue() {
      var _a;
      const nonCustom = this.moodOptions.find((item) => !item.isCustom);
      if (nonCustom)
        return nonCustom.value;
      return ((_a = this.moodOptions[0]) == null ? void 0 : _a.value) || "calm";
    },
    getDefaultExpireValue() {
      var _a;
      return ((_a = this.expireOptions[0]) == null ? void 0 : _a.value) || 24;
    },
    refreshMoodOptions() {
      this.moodOptions = common_moods.getMoodOptions();
      if (!this.moodOptions.length) {
        this.mood = "calm";
        return;
      }
      const exists = this.moodOptions.some((item) => item.value === this.mood);
      if (!exists) {
        this.mood = this.getDefaultMoodValue();
      }
    },
    async refreshExpireOptions() {
      try {
        const options = await common_api.getExpireOptions();
        common_throwSettings.setThrowExpireOptions(options);
      } catch (error) {
      }
      this.expireOptions = common_throwSettings.getThrowExpireOptions();
      const exists = this.expireOptions.some((item) => item.value === this.expireHours);
      if (!exists) {
        this.expireHours = this.getDefaultExpireValue();
      }
    },
    clearSelectorTimers() {
      if (this.selectorOpenTimer) {
        clearTimeout(this.selectorOpenTimer);
        this.selectorOpenTimer = null;
      }
      if (this.selectorCloseTimer) {
        clearTimeout(this.selectorCloseTimer);
        this.selectorCloseTimer = null;
      }
    },
    openSelector(type) {
      if (!type)
        return;
      if (this.selectorVisible && this.selectorType === type && this.selectorOpen)
        return;
      this.clearSelectorTimers();
      this.selectorType = type;
      this.selectorVisible = true;
      this.selectorOpen = false;
      this.$nextTick(() => {
        this.selectorOpenTimer = setTimeout(() => {
          this.selectorOpen = true;
          this.selectorOpenTimer = null;
        }, 12);
      });
    },
    closeSelector() {
      if (!this.selectorVisible)
        return;
      this.clearSelectorTimers();
      this.selectorOpen = false;
      this.selectorCloseTimer = setTimeout(() => {
        this.selectorVisible = false;
        this.selectorType = "";
        this.selectorCloseTimer = null;
      }, 220);
    },
    selectSelectorOption(value) {
      if (this.selectorType === "location") {
        this.location = value || "";
        this.closeSelector();
        return;
      }
      if (this.selectorType === "mood") {
        const nextMood = this.moodOptions.find((item) => item.value === value);
        if (nextMood)
          this.mood = nextMood.value;
        this.closeSelector();
        return;
      }
      if (this.selectorType === "expire") {
        const nextExpire = this.expireOptions.find((item) => item.value === value);
        if (nextExpire)
          this.expireHours = nextExpire.value;
        this.closeSelector();
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
      var _a, _b, _c;
      const defaultMoodValue = this.getDefaultMoodValue();
      const defaultExpireValue = this.getDefaultExpireValue();
      const draft = {
        content: this.content,
        selectedImages: this.selectedImages,
        mood: this.mood,
        customMoodText: this.customMoodText,
        location: this.location,
        isAnonymous: this.isAnonymous,
        expireHours: this.expireHours,
        voteEditorOpen: this.voteEditorOpen,
        voteTitle: this.voteTitle,
        voteOptionInputs: this.voteOptionInputs
      };
      const hasDraft = Boolean((_a = draft.content) == null ? void 0 : _a.trim()) || draft.selectedImages.length > 0 || Boolean(draft.location) || draft.mood !== defaultMoodValue || Boolean((_b = draft.customMoodText) == null ? void 0 : _b.trim()) || draft.isAnonymous !== true || draft.expireHours !== defaultExpireValue || Boolean(draft.voteEditorOpen) || Boolean((_c = draft.voteTitle) == null ? void 0 : _c.trim()) || draft.voteOptionInputs.some((item) => String(item || "").trim());
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
        this.mood = draft.mood || this.getDefaultMoodValue();
        this.customMoodText = draft.customMoodText || "";
        this.location = draft.location || this.appState.currentLocation || "";
        this.isAnonymous = draft.isAnonymous !== false;
        this.expireHours = draft.expireHours || this.getDefaultExpireValue();
        this.voteEditorOpen = Boolean(draft.voteEditorOpen);
        this.voteTitle = draft.voteTitle || "";
        this.voteOptionInputs = Array.isArray(draft.voteOptionInputs) ? [...draft.voteOptionInputs, "", "", "", ""].slice(0, 4) : ["", "", "", ""];
        const moodExists = this.moodOptions.some((item) => item.value === this.mood);
        if (!moodExists) {
          this.mood = this.getDefaultMoodValue();
        }
        const expireExists = this.expireOptions.some((item) => item.value === this.expireHours);
        if (!expireExists) {
          this.expireHours = this.getDefaultExpireValue();
        }
        return;
      }
      this.customMoodText = "";
      if (this.appState.currentLocation) {
        this.location = this.appState.currentLocation;
      }
      this.expireHours = this.getDefaultExpireValue();
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
    resetPublishState() {
      this.publishStage = "idle";
      this.publishProgress = 0;
      this.publishDetail = "";
    },
    setPublishState(stage, progress, detail = "") {
      this.publishStage = stage;
      if (typeof progress === "number") {
        const next = Math.round(progress);
        this.publishProgress = Math.max(0, Math.min(100, next));
      }
      this.publishDetail = detail;
    },
    withTimeout(taskPromise, ms = 25e3, message = "发布请求超时，请稍后重试") {
      let timer = null;
      return new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error(message));
        }, ms);
        Promise.resolve(taskPromise).then((result) => {
          if (timer)
            clearTimeout(timer);
          resolve(result);
        }).catch((error) => {
          if (timer)
            clearTimeout(timer);
          reject(error);
        });
      });
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
      const customMood = this.customMoodText.trim();
      if (this.isCustomMoodSelected) {
        if (!customMood) {
          common_vendor.index.showToast({
            title: "请填写自定义心情",
            icon: "none"
          });
          return;
        }
        if (customMood.length > 20) {
          common_vendor.index.showToast({
            title: "自定义心情最多20个字",
            icon: "none"
          });
          return;
        }
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
      this.setPublishState("preparing", 3, "正在准备发布内容");
      try {
        const imageUrls = await this.uploadImagesInOrder(this.selectedImages);
        this.setPublishState("submitting", 95, "正在提交纸飞机");
        await this.withTimeout(common_api.throwPlane({
          locationTag: this.location,
          content: this.content.trim(),
          mood: this.isCustomMoodSelected ? customMood : this.mood,
          isAnonymous: this.isAnonymous,
          authorName: this.isAnonymous ? "" : this.appState.profileName,
          imageUrls,
          expireHours: this.expireHours,
          voteTitle: this.hasVoteDraft ? this.voteTitle.trim() : "",
          voteOptions: this.hasVoteDraft ? this.normalizedVoteOptions : []
        }), 12e4);
        this.setPublishState("launching", 100, "发布成功，准备起飞");
        common_appState.setCurrentLocation(this.location);
        await this.playLaunchAnimation();
        this.content = "";
        this.customMoodText = "";
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
          title: error.message || "投递失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
        if (!this.launchAnimating) {
          this.resetPublishState();
        }
      }
    },
    async uploadImagesInOrder(filePaths = []) {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        this.setPublishState("uploading", 90, "无需上传图片");
        return [];
      }
      const totalCount = filePaths.length;
      const results = [];
      for (let index = 0; index < totalCount; index += 1) {
        const progress = 5 + index / totalCount * 85;
        this.setPublishState("uploading", progress, `正在上传图片 ${index + 1}/${totalCount}`);
        const url = await common_api.uploadPlaneImage(filePaths[index]);
        results.push(url);
      }
      this.setPublishState("uploading", 92, `图片上传完成 ${totalCount}/${totalCount}`);
      return results;
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
    a: $data.closeIcon,
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
    o: $data.addImageIcon,
    p: common_vendor.t($data.labels.addImage),
    q: common_vendor.o((...args) => $options.chooseImages && $options.chooseImages(...args))
  } : {}, {
    r: $options.currentLocationIcon,
    s: common_vendor.t($data.labels.locationLabel),
    t: common_vendor.t($options.locationDisplay),
    v: common_vendor.t($data.arrowIcon),
    w: common_vendor.o(($event) => $options.openSelector("location")),
    x: $options.currentMoodIcon,
    y: common_vendor.t($data.labels.moodLabel),
    z: common_vendor.t($options.currentMoodLabel),
    A: common_vendor.t($data.arrowIcon),
    B: common_vendor.o(($event) => $options.openSelector("mood")),
    C: $options.isCustomMoodSelected
  }, $options.isCustomMoodSelected ? {
    D: $options.currentMoodIcon,
    E: common_vendor.t($data.labels.customMoodLabel),
    F: $data.labels.customMoodPlaceholder,
    G: $data.customMoodText,
    H: common_vendor.o(($event) => $data.customMoodText = $event.detail.value)
  } : {}, {
    I: $data.timeIcon,
    J: common_vendor.t($data.labels.expireLabel),
    K: common_vendor.t($options.expireLabel),
    L: common_vendor.t($data.arrowIcon),
    M: common_vendor.o(($event) => $options.openSelector("expire")),
    N: $data.voteIcon,
    O: common_vendor.t($data.labels.voteLabel),
    P: common_vendor.t($options.voteSummaryText),
    Q: common_vendor.t($data.arrowIcon),
    R: common_vendor.n($data.voteEditorOpen ? "expanded" : ""),
    S: common_vendor.o(($event) => $data.voteEditorOpen = !$data.voteEditorOpen),
    T: $data.labels.voteTitlePlaceholder,
    U: $data.voteTitle,
    V: common_vendor.o(($event) => $data.voteTitle = $event.detail.value),
    W: common_vendor.f($data.voteOptionInputs, (item, index, i0) => {
      return {
        a: `vote-option-${index}`,
        b: `${$data.labels.voteOptionPlaceholder} ${index + 1}`,
        c: $data.voteOptionInputs[index],
        d: common_vendor.o(($event) => $data.voteOptionInputs[index] = $event.detail.value, `vote-option-${index}`)
      };
    }),
    X: common_vendor.n($data.voteEditorOpen ? "open" : ""),
    Y: $data.planeIcon,
    Z: common_vendor.t($options.launchButtonText),
    aa: common_vendor.n({
      loading: $data.loading,
      launching: $data.launchAnimating,
      disabled: !$options.canLaunch && !$data.loading && !$data.launchAnimating
    }),
    ab: common_vendor.o((...args) => $options.handleThrow && $options.handleThrow(...args)),
    ac: $data.loading && !$data.launchAnimating
  }, $data.loading && !$data.launchAnimating ? {
    ad: common_vendor.t($options.publishStageText),
    ae: common_vendor.t($data.publishProgress),
    af: `${$data.publishProgress}%`,
    ag: common_vendor.t($options.publishDetailText)
  } : {}, {
    ah: common_vendor.n({
      "is-launching": $data.launchAnimating
    }),
    ai: common_vendor.n({
      "is-launching": $data.launchAnimating
    }),
    aj: $data.launchAnimating
  }, $data.launchAnimating ? {
    ak: common_vendor.t($options.launchPreviewText),
    al: common_vendor.t($options.launchPreviewText),
    am: common_vendor.t($data.labels.launching),
    an: common_vendor.t($data.labels.launchFlightTitle),
    ao: common_vendor.t($data.labels.launchFlightSubtitle)
  } : {}, {
    ap: $data.selectorVisible
  }, $data.selectorVisible ? common_vendor.e({
    aq: common_vendor.t($options.selectorTitle),
    ar: common_vendor.o((...args) => $options.closeSelector && $options.closeSelector(...args)),
    as: common_vendor.f($options.selectorOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: option.icon
      }, option.icon ? {
        b: common_vendor.n({
          "is-location-icon": $data.selectorType === "location",
          "is-mood-icon": $data.selectorType === "mood"
        }),
        c: option.icon
      } : {}, {
        d: common_vendor.t(option.label),
        e: option.value === $options.selectorSelectedValue
      }, option.value === $options.selectorSelectedValue ? {} : {}, {
        f: option.key,
        g: common_vendor.n({
          active: option.value === $options.selectorSelectedValue,
          "is-location-grid-item": $data.selectorType === "location",
          "is-mood-grid-item": $data.selectorType === "mood",
          "is-mood-custom-item": $data.selectorType === "mood" && option.isCustom
        }),
        h: common_vendor.o(($event) => $options.selectSelectorOption(option.value), option.key)
      });
    }),
    at: common_vendor.n({
      "is-location-grid": $data.selectorType === "location",
      "is-mood-grid": $data.selectorType === "mood"
    }),
    av: !$options.selectorOptions.length
  }, !$options.selectorOptions.length ? {
    aw: common_vendor.t($options.selectorEmptyText)
  } : {}, {
    ax: common_vendor.o(() => {
    }),
    ay: $data.selectorOpen ? 1 : "",
    az: common_vendor.o((...args) => $options.closeSelector && $options.closeSelector(...args))
  }) : {}, {
    aA: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    aB: common_vendor.p({
      active: "throw",
      theme: $data.appState.theme
    }),
    aC: common_vendor.n($options.themeClass),
    aD: common_vendor.n({
      launching: $data.launchAnimating
    }),
    aE: common_vendor.s($options.throwStyle)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c19b2228"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/throw/index.js.map
