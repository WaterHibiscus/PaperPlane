"use strict";
const common_vendor = require("./vendor.js");
const common_config = require("./config.js");
const common_mockDb = require("./mock-db.js");
const common_storage = require("./storage.js");
let transportFallbackUntil = 0;
let refreshPromise = null;
function buildError(message, response) {
  const error = new Error(message || "请求失败");
  error.response = response || null;
  return error;
}
function toErrorMessage(payload, fallback = "请求失败") {
  if (payload && typeof payload === "object" && payload.message) {
    return payload.message;
  }
  return fallback;
}
function markTransportFallback() {
  const cooldown = Number(common_config.config.mockFallbackCooldown || 0);
  if (cooldown > 0) {
    transportFallbackUntil = Date.now() + cooldown;
  }
}
function clearTransportFallback() {
  transportFallbackUntil = 0;
}
function shouldUseMockFirst() {
  return transportFallbackUntil > Date.now();
}
function isUnauthorized(error) {
  var _a;
  return Number(((_a = error == null ? void 0 : error.response) == null ? void 0 : _a.statusCode) || 0) === 401;
}
function hasHttpStatus(error) {
  var _a;
  return Boolean((_a = error == null ? void 0 : error.response) == null ? void 0 : _a.statusCode);
}
function getAuthHeaders() {
  const token = common_storage.getAccessToken();
  if (!token)
    return {};
  return {
    Authorization: `Bearer ${token}`
  };
}
function rawRequest({ url, method = "GET", data, headers = {} }) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${common_config.config.baseURL}${url}`,
      method,
      data,
      header: headers,
      timeout: common_config.config.timeout,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(buildError(toErrorMessage(res.data), res));
      },
      fail: (err) => {
        reject(buildError(err.errMsg || "网络异常", err));
      }
    });
  });
}
function persistRefreshedSession(payload) {
  const current = common_storage.getAuthSession() || {};
  common_storage.setAuthSession({
    ...current,
    accessToken: (payload == null ? void 0 : payload.accessToken) || "",
    refreshToken: (payload == null ? void 0 : payload.refreshToken) || "",
    expiresIn: Number((payload == null ? void 0 : payload.expiresIn) || 0),
    user: (payload == null ? void 0 : payload.user) || current.user || null,
    loginAt: current.loginAt || (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function tryRefreshToken() {
  const refreshToken = common_storage.getRefreshToken();
  if (!refreshToken)
    return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const payload = await rawRequest({
          url: "/user-auth/refresh-token",
          method: "POST",
          data: { refreshToken },
          headers: {}
        });
        persistRefreshedSession(payload);
        return true;
      } catch (error) {
        common_storage.clearAuthSession();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}
async function request({ url, method = "GET", data, retryOnAuth = true, attachAuth = true }) {
  const headers = attachAuth ? getAuthHeaders() : {};
  try {
    return await rawRequest({ url, method, data, headers });
  } catch (error) {
    if (retryOnAuth && attachAuth && isUnauthorized(error)) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return request({
          url,
          method,
          data,
          retryOnAuth: false,
          attachAuth
        });
      }
      if (!common_storage.getAccessToken()) {
        throw buildError("请先登录", error.response || error);
      }
      throw buildError("登录已过期，请重新登录", error.response || error);
    }
    throw error;
  }
}
function rawUploadFile({ url, filePath, name = "file", headers = {} }) {
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: `${common_config.config.baseURL}${url}`,
      filePath,
      name,
      header: headers,
      timeout: common_config.config.timeout,
      success: (res) => {
        let payload = {};
        try {
          payload = JSON.parse(res.data || "{}");
        } catch (error) {
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(payload);
          return;
        }
        reject(buildError(toErrorMessage(payload, "上传失败"), { ...res, data: payload }));
      },
      fail: (err) => {
        reject(buildError(err.errMsg || "上传失败", err));
      }
    });
  });
}
async function uploadFile({ url, filePath, name = "file", retryOnAuth = true, attachAuth = true }) {
  const headers = attachAuth ? getAuthHeaders() : {};
  try {
    return await rawUploadFile({ url, filePath, name, headers });
  } catch (error) {
    if (retryOnAuth && attachAuth && isUnauthorized(error)) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return uploadFile({
          url,
          filePath,
          name,
          retryOnAuth: false,
          attachAuth
        });
      }
      if (!common_storage.getAccessToken()) {
        throw buildError("请先登录", error.response || error);
      }
      throw buildError("登录已过期，请重新登录", error.response || error);
    }
    throw error;
  }
}
function toQueryString(params = {}) {
  const pairs = Object.entries(params).filter(([, value]) => value !== void 0 && value !== null && value !== "").map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  if (!pairs.length)
    return "";
  return `?${pairs.join("&")}`;
}
function getAssetBaseUrl() {
  return common_config.config.baseURL.replace(/\/api$/, "");
}
async function withFallback(networkTask, mockTask) {
  if (shouldUseMockFirst()) {
    return mockTask();
  }
  try {
    const result = await networkTask();
    clearTransportFallback();
    return result;
  } catch (error) {
    if (hasHttpStatus(error)) {
      throw error;
    }
    markTransportFallback();
    return mockTask(error);
  }
}
function getAssetUrl(path) {
  if (!path)
    return "";
  if (/^(https?:)?\/\//.test(path) || /^data:/.test(path) || /^blob:/.test(path)) {
    return path;
  }
  if (/^[a-zA-Z]:\\/.test(path)) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${getAssetBaseUrl()}${path}`;
  }
  return `${getAssetBaseUrl()}/${path}`;
}
function getLocations() {
  return withFallback(
    () => request({ url: "/locations" }),
    () => common_mockDb.getLocations()
  );
}
function throwPlane(data) {
  return withFallback(
    () => request({ url: "/planes", method: "POST", data }),
    () => common_mockDb.throwPlane(data)
  );
}
function uploadPlaneImage(filePath) {
  return withFallback(
    async () => {
      const data = await uploadFile({
        url: "/uploads/images",
        filePath,
        name: "file"
      });
      return data.url;
    },
    () => Promise.resolve(filePath)
  );
}
function getPlanes(location) {
  return withFallback(
    () => request({ url: "/planes", data: { location } }),
    () => common_mockDb.getPlanes(location)
  );
}
function getPlaneDetail(id) {
  return withFallback(
    () => request({ url: `/planes/${id}` }),
    () => common_mockDb.getPlaneDetail(id)
  );
}
function likePlane(id) {
  return withFallback(
    () => request({ url: `/planes/${id}/like`, method: "POST" }),
    () => common_mockDb.likePlane(id)
  );
}
function reportPlane(id) {
  return withFallback(
    () => request({ url: `/planes/${id}/report`, method: "POST" }),
    () => common_mockDb.reportPlane(id)
  );
}
function recallPlane(id) {
  return withFallback(
    () => request({ url: `/planes/${id}/recall`, method: "POST" }),
    () => common_mockDb.recallPlane(id)
  );
}
function destroyPlane(id) {
  return withFallback(
    () => request({ url: `/planes/${id}/destroy`, method: "POST" }),
    () => common_mockDb.destroyPlane(id)
  );
}
function getPlaneAttitudes(id, voterKey) {
  return withFallback(
    () => request({ url: `/planes/${id}/attitudes`, data: { voterKey } }),
    () => common_mockDb.getPlaneAttitudes(id, voterKey)
  );
}
function votePlaneAttitude(id, optionKey, voterKey) {
  return withFallback(
    () => request({ url: `/planes/${id}/attitudes`, method: "POST", data: { optionKey, voterKey } }),
    () => common_mockDb.votePlaneAttitude(id, optionKey, voterKey)
  );
}
function getRandomPlane() {
  return withFallback(
    () => request({ url: "/planes/random" }),
    () => common_mockDb.getRandomPlane()
  );
}
function getTrendingPlanes() {
  return withFallback(
    () => request({ url: "/planes/trending" }),
    () => common_mockDb.getTrendingPlanes()
  );
}
function getComments(planeId) {
  return withFallback(
    () => request({ url: `/planes/${planeId}/comments` }),
    () => common_mockDb.getComments(planeId)
  );
}
function addComment(planeId, payload) {
  const data = typeof payload === "string" ? { reply: payload } : payload;
  return withFallback(
    () => request({ url: `/planes/${planeId}/comments`, method: "POST", data }),
    () => common_mockDb.addComment(planeId, data)
  );
}
function getMyThrownPlanes(params = {}) {
  return request({
    url: `/planes/mine/thrown${toQueryString(params)}`
  });
}
function getMyFueledPlanes(params = {}) {
  return request({
    url: `/planes/mine/fueled${toQueryString(params)}`
  });
}
function getMyPickedPlanes(params = {}) {
  return request({
    url: `/planes/mine/picked${toQueryString(params)}`
  });
}
function getMyProfile() {
  return request({
    url: "/users/me/profile"
  });
}
function updateMyProfile(data) {
  return request({
    url: "/users/me/profile",
    method: "PUT",
    data
  });
}
async function uploadMyAvatar(filePath) {
  const data = await uploadFile({
    url: "/users/me/avatar",
    filePath,
    name: "file"
  });
  return data.url;
}
exports.addComment = addComment;
exports.destroyPlane = destroyPlane;
exports.getAssetUrl = getAssetUrl;
exports.getComments = getComments;
exports.getLocations = getLocations;
exports.getMyFueledPlanes = getMyFueledPlanes;
exports.getMyPickedPlanes = getMyPickedPlanes;
exports.getMyProfile = getMyProfile;
exports.getMyThrownPlanes = getMyThrownPlanes;
exports.getPlaneAttitudes = getPlaneAttitudes;
exports.getPlaneDetail = getPlaneDetail;
exports.getPlanes = getPlanes;
exports.getRandomPlane = getRandomPlane;
exports.getTrendingPlanes = getTrendingPlanes;
exports.likePlane = likePlane;
exports.recallPlane = recallPlane;
exports.reportPlane = reportPlane;
exports.throwPlane = throwPlane;
exports.updateMyProfile = updateMyProfile;
exports.uploadMyAvatar = uploadMyAvatar;
exports.uploadPlaneImage = uploadPlaneImage;
exports.votePlaneAttitude = votePlaneAttitude;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/api.js.map
