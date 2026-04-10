"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_auth = require("../../common/auth.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      appState: common_appState.appState,
      form: {
        credential: "",
        password: "",
        code: "",
        agreed: false
      },
      captchaId: "",
      captchaImage: "",
      shakeMap: {
        credential: false,
        password: false,
        code: false
      },
      submitting: false
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    }
  },
  onLoad(query) {
    if (query == null ? void 0 : query.account) {
      this.form.credential = decodeURIComponent(query.account);
    }
    this.refreshCaptcha();
  },
  onShow() {
    var _a;
    if ((_a = common_auth.getCurrentSession()) == null ? void 0 : _a.accessToken) {
      common_vendor.index.reLaunch({
        url: "/pages/home/index"
      });
    }
  },
  methods: {
    async refreshCaptcha() {
      try {
        const data = await common_auth.fetchCaptcha();
        this.captchaId = (data == null ? void 0 : data.captchaId) || "";
        this.captchaImage = (data == null ? void 0 : data.captchaImage) || "";
      } catch (error) {
        this.captchaId = "";
        this.captchaImage = "";
        common_vendor.index.showToast({
          title: error.message || "验证码加载失败",
          icon: "none"
        });
      }
    },
    shakeField(field) {
      this.shakeMap = {
        ...this.shakeMap,
        [field]: false
      };
      setTimeout(() => {
        this.shakeMap = {
          ...this.shakeMap,
          [field]: true
        };
        setTimeout(() => {
          this.shakeMap = {
            ...this.shakeMap,
            [field]: false
          };
        }, 420);
      }, 20);
    },
    toggleAgreement() {
      this.form.agreed = !this.form.agreed;
    },
    showAgreement(type) {
      const title = type === "user" ? "用户协议" : "隐私政策";
      const content = type === "user" ? "当前为演示版登录页，正式上线时请替换为你们项目的真实用户协议内容。" : "当前为演示版登录页，正式上线时请替换为你们项目的真实隐私政策内容。";
      common_vendor.index.showModal({
        title,
        content,
        showCancel: false
      });
    },
    validateForm() {
      if (!this.form.credential.trim()) {
        this.shakeField("credential");
        common_vendor.index.showToast({
          title: "请输入学号或手机号",
          icon: "none"
        });
        return false;
      }
      if (!this.form.password.trim()) {
        this.shakeField("password");
        common_vendor.index.showToast({
          title: "请输入密码",
          icon: "none"
        });
        return false;
      }
      if (!this.form.code.trim()) {
        this.shakeField("code");
        common_vendor.index.showToast({
          title: "请输入验证码",
          icon: "none"
        });
        return false;
      }
      if (!this.captchaId) {
        this.shakeField("code");
        this.form.code = "";
        this.refreshCaptcha();
        common_vendor.index.showToast({
          title: "验证码已失效，请刷新",
          icon: "none"
        });
        return false;
      }
      if (!this.form.agreed) {
        common_vendor.index.showToast({
          title: "请先勾选协议",
          icon: "none"
        });
        return false;
      }
      return true;
    },
    async handleLogin() {
      if (this.submitting || !this.validateForm())
        return;
      this.submitting = true;
      try {
        await common_auth.loginAccount({
          credential: this.form.credential,
          password: this.form.password,
          captchaId: this.captchaId,
          captchaCode: this.form.code.trim().toUpperCase()
        });
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.reLaunch({
            url: "/pages/home/index"
          });
        }, 280);
      } catch (error) {
        const message = String(error.message || "登录失败");
        if (message.includes("验证码")) {
          this.shakeField("code");
          this.form.code = "";
          await this.refreshCaptcha();
        } else if (message.includes("密码")) {
          this.shakeField("password");
        } else {
          this.shakeField("credential");
        }
        common_vendor.index.showToast({
          title: message,
          icon: "none"
        });
      } finally {
        this.submitting = false;
      }
    },
    goRegister() {
      common_vendor.index.navigateTo({
        url: "/pages/register/index"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: $data.form.credential,
    c: common_vendor.o(($event) => $data.form.credential = $event.detail.value),
    d: common_vendor.n({
      "is-shaking": $data.shakeMap.credential
    }),
    e: $data.form.password,
    f: common_vendor.o(($event) => $data.form.password = $event.detail.value),
    g: common_vendor.n({
      "is-shaking": $data.shakeMap.password
    }),
    h: $data.form.code,
    i: common_vendor.o(($event) => $data.form.code = $event.detail.value),
    j: common_vendor.n({
      "is-shaking": $data.shakeMap.code
    }),
    k: $data.captchaImage
  }, $data.captchaImage ? {
    l: $data.captchaImage
  } : {}, {
    m: common_vendor.o((...args) => $options.refreshCaptcha && $options.refreshCaptcha(...args)),
    n: common_vendor.t($data.form.agreed ? "✓" : ""),
    o: common_vendor.n({
      "is-active": $data.form.agreed
    }),
    p: common_vendor.o(($event) => $options.showAgreement("user")),
    q: common_vendor.o(($event) => $options.showAgreement("privacy")),
    r: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args)),
    s: common_vendor.t($data.submitting ? "登录中..." : "登录"),
    t: common_vendor.n({
      "is-disabled": $data.submitting
    }),
    v: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    w: common_vendor.o((...args) => $options.goRegister && $options.goRegister(...args)),
    x: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d08ef7d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/index.js.map
