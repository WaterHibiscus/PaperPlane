"use strict";
const t = require("./vendor.js");

function e() {
	return void 0 === t.index || "function" != typeof t.index.getStorageSync ? "" : function(t) {
		const e = String(t || "").trim().replace(/\/+$/, "");
		return e && /^https?:\/\//i.test(e) ? e.endsWith("/api") ? e : `${e}/api` : ""
	}(t.index.getStorageSync("paperplane_api_base_url"))
}
const n = {
	baseURL: e() || "http://127.0.0.1:5000/api",
	timeout: 1e4,
	uploadTimeout: 3e5
};
exports.config = n;