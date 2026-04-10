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
        username: "",
        studentId: "",
        phone: "",
        password: "",
        confirmPassword: "",
        code: "",
        agreed: false
      },
      captchaId: "",
      captchaImage: "",
      shakeMap: {
        username: false,
        studentId: false,
        phone: false,
        password: false,
        confirmPassword: false,
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
  onLoad() {
    this.refreshCaptcha();
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
      const content = type === "user" ? "当前为演示版注册页，正式上线时请替换成你们项目的真实用户协议内容。" : "当前为演示版注册页，正式上线时请替换成你们项目的真实隐私政策内容。";
      common_vendor.index.showModal({
        title,
        content,
        showCancel: false
      });
    },
    validateForm() {
      const username = this.form.username.trim();
      const studentId = this.form.studentId.trim();
      const phone = this.form.phone.trim();
      const password = this.form.password.trim();
      const confirmPassword = this.form.confirmPassword.trim();
      const code = this.form.code.trim().toUpperCase();
      if (!username) {
        this.shakeField("username");
        common_vendor.index.showToast({
          title: "请输入用户名",
          icon: "none"
        });
        return false;
      }
      if (!studentId) {
        this.shakeField("studentId");
        common_vendor.index.showToast({
          title: "请输入学号",
          icon: "none"
        });
        return false;
      }
      if (!/^[A-Za-z0-9]{6,20}$/.test(studentId)) {
        this.shakeField("studentId");
        common_vendor.index.showToast({
          title: "学号格式不正确",
          icon: "none"
        });
        return false;
      }
      if (!phone) {
        this.shakeField("phone");
        common_vendor.index.showToast({
          title: "请输入手机号",
          icon: "none"
        });
        return false;
      }
      if (!/^1\d{10}$/.test(phone)) {
        this.shakeField("phone");
        common_vendor.index.showToast({
          title: "请输入正确的手机号",
          icon: "none"
        });
        return false;
      }
      if (!password) {
        this.shakeField("password");
        common_vendor.index.showToast({
          title: "请设置密码",
          icon: "none"
        });
        return false;
      }
      if (password.length < 6) {
        this.shakeField("password");
        common_vendor.index.showToast({
          title: "密码至少 6 位",
          icon: "none"
        });
        return false;
      }
      if (!confirmPassword) {
        this.shakeField("confirmPassword");
        common_vendor.index.showToast({
          title: "请再次输入密码",
          icon: "none"
        });
        return false;
      }
      if (password !== confirmPassword) {
        this.shakeField("confirmPassword");
        common_vendor.index.showToast({
          title: "两次密码不一致",
          icon: "none"
        });
        return false;
      }
      if (!code) {
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
    async handleRegister() {
      if (this.submitting || !this.validateForm())
        return;
      this.submitting = true;
      try {
        await common_auth.registerAccount({
          username: this.form.username,
          studentId: this.form.studentId,
          phone: this.form.phone,
          password: this.form.password,
          captchaId: this.captchaId,
          captchaCode: this.form.code.trim().toUpperCase()
        });
        common_vendor.index.showToast({
          title: "注册成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.redirectTo({
            url: `/pages/login/index?account=${encodeURIComponent(this.form.phone)}`
          });
        }, 280);
      } catch (error) {
        const message = String(error.message || "注册失败");
        if (message.includes("验证码")) {
          this.shakeField("code");
          this.form.code = "";
          await this.refreshCaptcha();
        } else if (message.includes("手机号")) {
          this.shakeField("phone");
        } else if (message.includes("学号")) {
          this.shakeField("studentId");
        } else {
          this.shakeField("username");
        }
        common_vendor.index.showToast({
          title: message,
          icon: "none"
        });
      } finally {
        this.submitting = false;
      }
    },
    goLogin() {
      common_vendor.index.navigateBack({
        fail: () => {
          common_vendor.index.redirectTo({
            url: "/pages/login/index"
          });
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: $data.form.username,
    c: common_vendor.o(($event) => $data.form.username = $event.detail.value),
    d: common_vendor.n({
      "is-shaking": $data.shakeMap.username
    }),
    e: $data.form.studentId,
    f: common_vendor.o(($event) => $data.form.studentId = $event.detail.value),
    g: common_vendor.n({
      "is-shaking": $data.shakeMap.studentId
    }),
    h: $data.form.phone,
    i: common_vendor.o(($event) => $data.form.phone = $event.detail.value),
    j: common_vendor.n({
      "is-shaking": $data.shakeMap.phone
    }),
    k: $data.form.password,
    l: common_vendor.o(($event) => $data.form.password = $event.detail.value),
    m: common_vendor.n({
      "is-shaking": $data.shakeMap.password
    }),
    n: $data.form.confirmPassword,
    o: common_vendor.o(($event) => $data.form.confirmPassword = $event.detail.value),
    p: common_vendor.n({
      "is-shaking": $data.shakeMap.confirmPassword
    }),
    q: $data.form.code,
    r: common_vendor.o(($event) => $data.form.code = $event.detail.value),
    s: common_vendor.n({
      "is-shaking": $data.shakeMap.code
    }),
    t: $data.captchaImage
  }, $data.captchaImage ? {
    v: $data.captchaImage
  } : {}, {
    w: common_vendor.o((...args) => $options.refreshCaptcha && $options.refreshCaptcha(...args)),
    x: common_vendor.t($data.form.agreed ? "✓" : ""),
    y: common_vendor.n({
      "is-active": $data.form.agreed
    }),
    z: common_vendor.o(($event) => $options.showAgreement("privacy")),
    A: common_vendor.o(($event) => $options.showAgreement("user")),
    B: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args)),
    C: common_vendor.t($data.submitting ? "注册中..." : "立即注册"),
    D: common_vendor.n({
      "is-disabled": $data.submitting
    }),
    E: common_vendor.o((...args) => $options.handleRegister && $options.handleRegister(...args)),
    F: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args)),
    G: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-46a64346"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/register/index.js.map
