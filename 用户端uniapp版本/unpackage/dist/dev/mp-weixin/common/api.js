"use strict";
const common_vendor = require("./vendor.js");
const common_config = require("./config.js");
const common_storage = require("./storage.js");
let refreshPromise = null;
const COMPRESS_THRESHOLD = 2 * 1024 * 1024;
const COMPRESS_QUALITY = 65;
function buildError(message, response) {
  const error = new Error(message || "Request failed");
  error.response = response || null;
  return error;
}
function getLocalFileSize(filePath) {
  return new Promise((resolve) => {
    if (!filePath || typeof common_vendor.index === "undefined" || typeof common_vendor.index.getFileInfo !== "function") {
      resolve(null);
      return;
    }
    common_vendor.index.getFileInfo({
      filePath,
      success: (res) => {
        resolve(Number((res == null ? void 0 : res.size) || 0));
      },
      fail: () => {
        resolve(null);
      }
    });
  });
}
function compressImageOnce(filePath, quality = COMPRESS_QUALITY) {
  return new Promise((resolve) => {
    if (!filePath || typeof common_vendor.index === "undefined" || typeof common_vendor.index.compressImage !== "function") {
      resolve(filePath);
      return;
    }
    common_vendor.index.compressImage({
      src: filePath,
      quality,
      success: (res) => {
        resolve((res == null ? void 0 : res.tempFilePath) || filePath);
      },
      fail: () => {
        resolve(filePath);
      }
    });
  });
}
async function prepareImageForUpload(filePath) {
  const size = await getLocalFileSize(filePath);
  if (typeof size !== "number" || size <= 0 || size < COMPRESS_THRESHOLD) {
    return filePath;
  }
  const compressedPath = await compressImageOnce(filePath, COMPRESS_QUALITY);
  if (!compressedPath || compressedPath === filePath) {
    return filePath;
  }
  const compressedSize = await getLocalFileSize(compressedPath);
  if (typeof compressedSize !== "number" || compressedSize <= 0) {
    return filePath;
  }
  return compressedSize < size ? compressedPath : filePath;
}
function toErrorMessage(payload, fallback = "Request failed") {
  if (payload && typeof payload === "object" && payload.message) {
    return payload.message;
  }
  return fallback;
}
function isUnauthorized(error) {
  var _a;
  return Number(((_a = error == null ? void 0 : error.response) == null ? void 0 : _a.statusCode) || 0) === 401;
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
        reject(buildError(err.errMsg || "Network error", err));
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
        throw buildError("Please login first", error.response || error);
      }
      throw buildError("Session expired, please login again", error.response || error);
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
      timeout: common_config.config.uploadTimeout,
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
        reject(buildError(toErrorMessage(payload, "Upload failed"), { ...res, data: payload }));
      },
      fail: (err) => {
        const errMsg = (err == null ? void 0 : err.errMsg) || "Upload failed";
        if (/timeout/i.test(errMsg)) {
          reject(buildError("上传超时，请检查网络后重试，或压缩图片后再上传", err));
          return;
        }
        reject(buildError(errMsg, err));
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
        throw buildError("Please login first", error.response || error);
      }
      throw buildError("Session expired, please login again", error.response || error);
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
function getAssetUrl(path) {
  if (!path)
    return "";
  if (/^(https?:)?\/\//.test(path) || /^data:/.test(path) || /^blob:/.test(path)) {
    return path;
  }
  if (/^[a-zA-Z]:\\/.test(path)) {
    return path;
  }
  if (path.startsWith("/static/")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${getAssetBaseUrl()}${path}`;
  }
  return `${getAssetBaseUrl()}/${path}`;
}
function getLocations() {
  return request({ url: "/locations" });
}
function getMoodConfigs() {
  return request({ url: "/moods" });
}
function getExpireOptions() {
  return request({ url: "/expire-options" });
}
function throwPlane(data) {
  return request({ url: "/planes", method: "POST", data });
}
async function uploadPlaneImage(filePath, options = {}) {
  const uploadPath = await prepareImageForUpload(filePath);
  const data = await uploadFile({
    url: "/uploads/images",
    filePath: uploadPath,
    name: "file"
  });
  return data.url;
}
function getPlanes(location) {
  return request({ url: "/planes", data: { location } });
}
function normalizePlaneLookupToken(value) {
  return String(value || "").trim();
}
function isGuidToken(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
function getPlaneDetail(idOrCode) {
  const token = normalizePlaneLookupToken(idOrCode);
  if (!token) {
    return Promise.reject(new Error("Invalid plane id"));
  }
  if (isGuidToken(token)) {
    return request({ url: `/planes/${token}` });
  }
  return request({ url: `/planes/by-code/${encodeURIComponent(token)}` });
}
function getPlaneQrCodePngUrl(id) {
  const planeId = String(id || "").trim();
  if (!planeId)
    return "";
  return `${common_config.config.baseURL}/planes/${encodeURIComponent(planeId)}/qrcode.png`;
}
function likePlane(id) {
  return request({ url: `/planes/${id}/like`, method: "POST" });
}
function reportPlane(id) {
  return request({ url: `/planes/${id}/report`, method: "POST" });
}
function recallPlane(id) {
  return request({ url: `/planes/${id}/recall`, method: "POST" });
}
function destroyPlane(id) {
  return request({ url: `/planes/${id}/destroy`, method: "POST" });
}
function getPlaneAttitudes(id, voterKey) {
  return request({ url: `/planes/${id}/attitudes`, data: { voterKey } });
}
function votePlaneAttitude(id, optionKey, voterKey) {
  return request({ url: `/planes/${id}/attitudes`, method: "POST", data: { optionKey, voterKey } });
}
function getRandomPlane() {
  return request({ url: "/planes/random" });
}
function getTrendingPlanes() {
  return request({ url: "/planes/trending" });
}
function getComments(planeId) {
  return request({ url: `/planes/${planeId}/comments` });
}
function addComment(planeId, payload) {
  const data = typeof payload === "string" ? { reply: payload } : payload;
  return request({ url: `/planes/${planeId}/comments`, method: "POST", data });
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
async function uploadMyAvatar(filePath, options = {}) {
  const uploadPath = await prepareImageForUpload(filePath);
  const data = await uploadFile({
    url: "/users/me/avatar",
    filePath: uploadPath,
    name: "file"
  });
  return data.url;
}
exports.addComment = addComment;
exports.destroyPlane = destroyPlane;
exports.getAssetUrl = getAssetUrl;
exports.getComments = getComments;
exports.getExpireOptions = getExpireOptions;
exports.getLocations = getLocations;
exports.getMoodConfigs = getMoodConfigs;
exports.getMyFueledPlanes = getMyFueledPlanes;
exports.getMyPickedPlanes = getMyPickedPlanes;
exports.getMyProfile = getMyProfile;
exports.getMyThrownPlanes = getMyThrownPlanes;
exports.getPlaneAttitudes = getPlaneAttitudes;
exports.getPlaneDetail = getPlaneDetail;
exports.getPlaneQrCodePngUrl = getPlaneQrCodePngUrl;
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
