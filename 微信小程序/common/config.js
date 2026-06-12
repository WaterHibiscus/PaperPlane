"use strict";
const t = require("./vendor.js");

const e = 5000;
const n = "/api";
const o = "paperplane_api_base_url";
const i = "paperplane_api_lan_host";
const r = "172.31.215.67";

function a(t) {
	const e = String(t || "").trim().replace(/\/+$/, "");
	return e && /^https?:\/\//i.test(e) ? e.endsWith(n) ? e : `${e}${n}` : ""
}

function s() {
	return void 0 === t.index || "function" != typeof t.index.getStorageSync ? "" : a(t.index.getStorageSync(o))
}

function u() {
	if (void 0 === t.index || "function" != typeof t.index.getSystemInfoSync) return !1;
	try {
		const e = t.index.getSystemInfoSync() || {};
		return "devtools" === String(e.platform || "").toLowerCase()
	} catch (e) {
		return !1
	}
}

function c() {
	if (void 0 === t.index || "function" != typeof t.index.getStorageSync) return r;
	const e = String(t.index.getStorageSync(i) || "").trim();
	return /^\d{1,3}(\.\d{1,3}){3}$/.test(e) ? e : r
}

function l() {
	const t = s();
	if (t) {
		if (!u() && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(t)) {
			const t = c();
			return `http://${t}:${e}${n}`
		}
		return t
	}
	const o = u() ? "127.0.0.1" : c();
	return `http://${o}:${e}${n}`
}

const f = {
	baseURL: l(),
	timeout: 1e4,
	uploadTimeout: 3e5
};
exports.config = f;
