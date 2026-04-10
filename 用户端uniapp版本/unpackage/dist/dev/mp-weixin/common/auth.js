"use strict";
const common_vendor = require("./vendor.js");
const common_config = require("./config.js");
const common_appState = require("./app-state.js");
const common_storage = require("./storage.js");
function normalizeText(value) {
  return String(value || "").trim();
}
function normalizePhone(value) {
  return normalizeText(value).replace(/\s+/g, "");
}
function normalizeStudentId(value) {
  return normalizeText(value).replace(/\s+/g, "").toUpperCase();
}
function buildError(message, response) {
  const error = new Error(message || "请求失败");
  error.response = response || null;
  return error;
}
function request({ url, method = "GET", data, token = "" }) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${common_config.config.baseURL}${url}`,
      method,
      data,
      timeout: common_config.config.timeout,
      header: headers,
      success: (res) => {
        var _a;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(buildError(((_a = res.data) == null ? void 0 : _a.message) || "请求失败", res));
      },
      fail: (err) => {
        reject(buildError(err.errMsg || "网络异常", err));
      }
    });
  });
}
function normalizeUser(user) {
  if (!user)
    return null;
  return {
    userId: user.userId || user.id || "",
    username: normalizeText(user.username) || "纸飞机同学",
    avatarUrl: user.avatarUrl || "",
    gender: user.gender || "secret",
    bio: user.bio || "",
    phone: user.phone || "",
    studentId: user.studentId || ""
  };
}
function applyUserProfile(user) {
  if (!user)
    return;
  common_appState.setProfileName(user.username);
  common_appState.setProfileAvatar(user.avatarUrl || "");
  common_appState.setProfileGender(user.gender || "secret");
  common_appState.setProfileBio(user.bio || "");
}
function persistSession(payload) {
  const user = normalizeUser(payload == null ? void 0 : payload.user);
  const session = {
    accessToken: (payload == null ? void 0 : payload.accessToken) || "",
    refreshToken: (payload == null ? void 0 : payload.refreshToken) || "",
    expiresIn: Number((payload == null ? void 0 : payload.expiresIn) || 0),
    loginAt: (/* @__PURE__ */ new Date()).toISOString(),
    user
  };
  common_storage.setAuthSession(session);
  applyUserProfile(user);
  return session;
}
function getCurrentSession() {
  return common_storage.getAuthSession();
}
function getSessionAccount() {
  const session = common_storage.getAuthSession();
  if (!(session == null ? void 0 : session.accessToken) || !(session == null ? void 0 : session.user))
    return null;
  return {
    ...session.user,
    accountId: session.user.userId,
    loginAt: session.loginAt
  };
}
async function fetchCaptcha() {
  return request({
    url: "/user-auth/captcha"
  });
}
async function registerAccount(payload) {
  const username = normalizeText(payload.username);
  const phone = normalizePhone(payload.phone);
  const studentId = normalizeStudentId(payload.studentId);
  const password = normalizeText(payload.password);
  const captchaId = normalizeText(payload.captchaId);
  const captchaCode = normalizeText(payload.captchaCode).toUpperCase();
  return request({
    url: "/user-auth/register",
    method: "POST",
    data: {
      username,
      phone,
      studentId,
      password,
      captchaId,
      captchaCode
    }
  });
}
async function loginAccount(payload) {
  const credential = normalizeText(payload.credential);
  const password = normalizeText(payload.password);
  const captchaId = normalizeText(payload.captchaId);
  const captchaCode = normalizeText(payload.captchaCode).toUpperCase();
  const response = await request({
    url: "/user-auth/login",
    method: "POST",
    data: {
      credential,
      password,
      captchaId,
      captchaCode
    }
  });
  return persistSession(response);
}
async function fetchCurrentUser() {
  const token = common_storage.getAccessToken();
  if (!token)
    return null;
  const user = await request({
    url: "/user-auth/me",
    token
  });
  const normalized = normalizeUser(user);
  common_storage.setAuthSessionUser(normalized);
  applyUserProfile(normalized);
  return normalized;
}
async function logoutAccount() {
  const token = common_storage.getAccessToken();
  const refreshToken = common_storage.getRefreshToken();
  if (token) {
    try {
      await request({
        url: "/user-auth/logout",
        method: "POST",
        data: refreshToken ? { refreshToken } : {},
        token
      });
    } catch (error) {
    }
  }
  common_storage.clearAuthSession();
}
exports.fetchCaptcha = fetchCaptcha;
exports.fetchCurrentUser = fetchCurrentUser;
exports.getCurrentSession = getCurrentSession;
exports.getSessionAccount = getSessionAccount;
exports.loginAccount = loginAccount;
exports.logoutAccount = logoutAccount;
exports.registerAccount = registerAccount;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/auth.js.map
