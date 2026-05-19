"use strict";
const e = require("../../common/vendor.js"),
	t = require("../../common/app-state.js"),
	i = require("../../common/api.js"),
	n = require("../../common/utils.js"),
	s = require("../../common/detail-open-transition.js"),
	a = require("../../common/page-transition.js"),
	o = require("../../common/ui-icons.js"),
	h = {
		mixins: [a.pageTransitionMixin, s.detailOpenTransitionMixin],
		components: {
			AppTabbar: () => "../../components/AppTabbar.js",
			DetailOpenTransition: () => "../../components/DetailOpenTransition.js",
			PageTransition: () => "../../components/PageTransition.js",
			ShatterHeadline: () => "../../components/ShatterHeadline.js"
		},
		data: () => ({
			appState: t.appState,
			icons: o.uiIcons,
			query: "",
			trending: [],
			randomLoading: !1,
			headlinePhrases: ["把心绪折成纸，交给校园的风", "把没说出口的话，留在路过的风景", "让匿名的回声，刚好落进谁手里", "把今天的情绪，投向一个真实地点", "给某个陌生同学，留下一次轻回应"],
			nodePresets: [{
				x: 16,
				y: 28,
				size: 70
			}, {
				x: 40,
				y: 18,
				size: 62
			}, {
				x: 70,
				y: 26,
				size: 74
			}, {
				x: 28,
				y: 64,
				size: 68
			}, {
				x: 58,
				y: 58,
				size: 80
			}, {
				x: 82,
				y: 70,
				size: 60
			}, {
				x: 12,
				y: 70,
				size: 58
			}, {
				x: 48,
				y: 76,
				size: 66
			}],
			hudX: 0,
			hudY: 0,
			hudReady: !1,
			hudDragging: !1,
			hudDragOffsetX: 0,
			hudDragOffsetY: 0,
			mapCanvasRect: null,
			hudDragBounds: null,
			themeRippleVisible: !1,
			themeRippleExpanding: !1,
			themeRippleFading: !1,
			themeRippleTarget: "light",
				themeRippleStartTimer: null,
				themeRippleToggleTimer: null,
				themeRippleFadeTimer: null,
				themeRippleEndTimer: null,
				routeFrame: 0,
				routeViewLoopTimer: null
		}),
		computed: {
			themeClass() {
				return "dark" === this.appState.theme ? "theme-dark" : "theme-light"
			},
			isDark() {
				return "dark" === this.appState.theme
			},
			themeRippleThemeClass() {
				return "dark" === this.themeRippleTarget ? "ripple-theme-dark" : "ripple-theme-light"
			},
			locations() {
				return this.appState.locations || []
			},
			filteredLocations() {
				const e = (this.query || "").trim();
				return e ? this.locations.filter((t => t.name.includes(e))) : this.locations
			},
			isDenseMap() {
				return this.filteredLocations.length >= 7
			},
			hudStyle() {
				return this.hudReady ? {
					left: `${this.hudX}px`,
					top: `${this.hudY}px`,
					right: "auto"
				} : null
			},
			mapNodes() {
				const e = Date.now() / 1e3,
					t = this.isDenseMap ? this.buildDensePositions(this.filteredLocations.length) : [],
					i = this.isDenseMap && this.filteredLocations.length >= 9;
				return this.filteredLocations.map(((n, s) => {
					const a = this.isDenseMap && t[s] || this.nodePresets[s % this.nodePresets.length],
						o = 2 * Math.min(n.planeCount || 0, 6);
					let h = a.x,
						r = a.y;
					this.isDenseMap || (h += 1.4 * (s % 3 - 1), r += s % 2 == 0 ? -1 : 1);
					const l = this.adjustForHudZone(h, r, this.isDenseMap ? 3 : 4, `node-${s}`),
						d = this.isDenseMap ? Math.min(Math.max(52 + .65 * o, 48), 72) : Math.min(Math.max(a.size + o, 56), 90),
						p = l.x > 72 ? "-14px" : l.x < 22 ? "14px" : "0px",
						u = this.getNegativeAnimationDelay(e, .18 * s, 3.6);
					return {
						loc: n,
						x: l.x,
						y: l.y,
						size: d,
						labelShift: p,
						delay: u,
						hideCount: i
					}
				}))
			},
				signalRoutes() {
					const e = this.mapNodes;
					if (e.length < 2) return [];
				const t = Date.now() / 1e3,
					i = this.isDenseMap ? this.buildDenseRoutePairs(e) : this.buildDefaultRoutePairs(e),
					n = new Set;
				return i.filter((([e, t]) => {
					if (!e || !t || e.loc.id === t.loc.id) return !1;
					const i = [e.loc.id, t.loc.id].sort(((e, t) => e - t)).join("-");
					return !n.has(i) && (n.add(i), !0)
				})).slice(0, this.isDenseMap ? Math.max(e.length - 1, 7) : 7).map((([e, i], n) => {
					const s = Math.max(e.loc.planeCount || 0, i.loc.planeCount || 0),
						a = Math.min(2.8, 1.05 + .18 * s),
						o = 5.4 + n % 3 * .9,
						h = .65 * n,
						r = this.createRouteCurve(e, i, n);
						return {
							id: `${e.loc.id}-${i.loc.id}-${n}`,
							curve: r,
							width: a,
							opacity: Math.min(.78, .28 + .08 * s),
							duration: o,
							delay: h,
							packetSize: Math.min(2.2, 1.15 + .08 * s)
								}
						}))
					},
					routeBaseSegments() {
						const e = this.signalRoutes || [],
							t = [];
						for (let i = 0; i < e.length; i += 1) {
							const n = this.createRouteBaseSegments(e[i], i);
							for (let e = 0; e < n.length; e += 1) t.push(n[e])
						}
						return t
					},
					routeGlowSegments() {
						this.routeFrame;
						const e = this.signalRoutes || [],
							t = [];
						for (let i = 0; i < e.length; i += 1) {
							const n = this.createRouteGlowSegments(e[i], i);
							for (let e = 0; e < n.length; e += 1) t.push(n[e])
						}
						return t
					},
					routePacketDots() {
						this.routeFrame;
						const e = this.signalRoutes || [],
							t = [];
						for (let i = 0; i < e.length; i += 1) {
							const n = this.createRoutePacketDots(e[i], i);
							for (let e = 0; e < n.length; e += 1) t.push(n[e])
						}
						return t
					},
				totalPlanes() {
					return this.locations.reduce(((e, t) => e + (t.planeCount || 0)), 0)
				},
			topTrending() {
				return this.trending.slice(0, 3)
			},
			busiestLocationLabel() {
				if (!this.filteredLocations.length) return "等待新的投递进入网络";
				const e = this.filteredLocations.slice().sort(((e, t) => (t.planeCount || 0) - (e.planeCount || 0)))[0];
				return e && e.planeCount ? `${e.name} 最活跃 · ${e.planeCount} 架` : "所有落点当前都很安静"
			}
		},
		watch: {
			filteredLocations() {
				this.scheduleMeasureMapCanvas()
			}
			},
			async onShow() {
				await this.loadHome(), this.scheduleMeasureMapCanvas(), this.startRouteViewLoop()
			},
			onHide() {
				this.clearThemeRippleTimers(), this.stopRouteViewLoop(), this.resetThemeRipple()
			},
			onUnload() {
				this.clearThemeRippleTimers(), this.stopRouteViewLoop(), this.resetThemeRipple()
			},
		onReady() {
			this.scheduleMeasureMapCanvas()
		},
		methods: {
			normalizePhase(e, t) {
				const i = e % t;
				return i < 0 ? i + t : i
			},
			seededUnit(e) {
				const t = String(e);
				let i = 2166136261,
					n = 461845907;
				for (let s = 0; s < t.length; s += 1) {
					const e = t.charCodeAt(s);
					i = Math.imul(i ^ e, 2246822507), n = Math.imul(n ^ e, 3266489909)
				}
				return i ^= i >>> 16, i = Math.imul(i, 2146121005), i ^= i >>> 15, n ^= n >>> 16, n = Math.imul(n, 2221713035), n ^= n >>> 15, ((i ^ n) >>> 0) / 4294967295
			},
			clampPercent: (e, t, i) => Math.min(Math.max(e, t), i),
			isInHudZone: (e, t, i = 0) => e >= 62 - i && e <= 98 + i && t >= 2 - i && t <= 34 + i,
			adjustForHudZone(e, t, i = 3, n = "") {
				let s = Math.min(Math.max(e, 6), 94),
					a = Math.min(Math.max(t, 12), 92);
				if (!this.isInHudZone(s, a, i)) return {
					x: s,
					y: a
				};
				let o = 0;
				for (; this.isInHudZone(s, a, i) && o < 10;) {
					let e = s - 80,
						t = a - 18;
					Math.abs(e) + Math.abs(t) < .01 && (e = this.seededUnit(`${n}-dx-${o}`) - .5, t = this.seededUnit(`${n}-dy-${o}`) - .5);
					const i = Math.hypot(e, t) || 1,
						h = 3.4 + .7 * o;
					s += e / i * h, a += t / i * h, s = Math.min(Math.max(s, 6), 94), a = Math.min(Math.max(a, 12), 92), o += 1
				}
				return {
					x: s,
					y: a
				}
			},
			buildDefaultRoutePairs(e) {
				const t = [];
				for (let i = 0; i < e.length - 1; i += 1) t.push([e[i], e[i + 1]]);
				if (e.length > 2)
					for (let i = 0; i < e.length; i += 2) t.push([e[i], e[(i + 2) % e.length]]);
				return t
			},
			buildDenseRoutePairs(e) {
				const t = [];
				for (let d = 0; d < e.length; d += 1)
					for (let i = d + 1; i < e.length; i += 1) {
						const n = e[d],
							s = e[i],
							a = Math.hypot(n.x - s.x, n.y - s.y),
							o = 1.2 * this.seededUnit(`route-${n.loc.id}-${s.loc.id}`);
						t.push({
							fromIndex: d,
							toIndex: i,
							from: n,
							to: s,
							distance: a,
							score: a + o
						})
					}
				t.sort(((e, t) => e.score - t.score));
				const i = e.map(((e, t) => t)),
					n = e => {
						let t = e;
						for (; i[t] !== t;) t = i[t];
						for (; i[e] !== e;) {
							const n = i[e];
							i[e] = t, e = n
						}
						return t
					},
					s = (e, t) => {
						const s = n(e),
							a = n(t);
						return s !== a && (i[a] = s, !0)
					},
					a = [];
				for (let d = 0; d < t.length; d += 1) {
					const i = t[d];
					if (s(i.fromIndex, i.toIndex) && (a.push([i.from, i.to]), a.length >= e.length - 1)) break
				}
				if (a.length < e.length - 1) return this.buildDefaultRoutePairs(e);
				const o = Math.min(3, Math.max(1, Math.floor(e.length / 5))),
					h = Object.create(null);
				for (let d = 0; d < a.length; d += 1) {
					const [e, t] = a[d];
					h[e.loc.id] = (h[e.loc.id] || 0) + 1, h[t.loc.id] = (h[t.loc.id] || 0) + 1
				}
				const r = new Set(a.map((([e, t]) => [e.loc.id, t.loc.id].sort(((e, t) => e - t)).join("-"))));
				let l = 0;
				for (let d = 0; d < t.length && l < o; d += 1) {
					const e = t[d],
						i = [e.from.loc.id, e.to.loc.id].sort(((e, t) => e - t)).join("-");
					r.has(i) || (e.distance > 36 || (h[e.from.loc.id] || 0) >= 3 || (h[e.to.loc.id] || 0) >= 3 || (a.push([e.from, e.to]), r.add(i), h[e.from.loc.id] = (h[e.from.loc.id] || 0) + 1, h[e.to.loc.id] = (h[e.to.loc.id] || 0) + 1, l += 1))
				}
				return a
			},
			buildDensePositions(e) {
				const t = [];
				if (!e) return t;
				const i = 92,
					n = 12,
					s = 90,
					a = 50,
					o = 51,
					h = e <= 8 ? 20 : e <= 12 ? 16 : e <= 16 ? 13 : 11,
					r = e <= 10 ? 120 : e <= 14 ? 104 : 88,
					l = {
						lt: 0,
						rt: 0,
						lb: 0,
						rb: 0
					},
					d = [{
						x: 12,
						y: 17
					}, {
						x: 14,
						y: 84
					}, {
						x: 86,
						y: 84
					}, {
						x: a,
						y: 18
					}, {
						x: a,
						y: 84
					}],
					p = Math.min(e, d.length);
				for (let u = 0; u < p; u += 1) {
					const h = d[u],
						r = 8 * (this.seededUnit(`dense-anchor-${e}-${u}-x`) - .5),
						p = 8 * (this.seededUnit(`dense-anchor-${e}-${u}-y`) - .5),
						c = this.adjustForHudZone(h.x + r, h.y + p, 3, `dense-anchor-${e}-${u}`),
						m = this.clampPercent(c.x, 8, i),
						g = this.clampPercent(c.y, n, s);
					t.push({
						x: m,
						y: g
					}), l[m < a ? g < o ? "lt" : "lb" : g < o ? "rt" : "rb"] += 1
				}
				for (let u = t.length; u < e; u += 1) {
					let d = null,
						p = -1 / 0;
					for (let f = 0; f < r; f += 1) {
						const r = this.seededUnit(`dense-${e}-${u}-${f}-x`),
							c = this.seededUnit(`dense-${e}-${u}-${f}-y`);
						let m = 8 + 84 * r + 11 * (this.seededUnit(`dense-${e}-${u}-${f}-jx`) - .5),
							g = n + 78 * c + 11 * (this.seededUnit(`dense-${e}-${u}-${f}-jy`) - .5);
						if (m = this.clampPercent(m, 8, i), g = this.clampPercent(g, n, s), this.isInHudZone(m, g, 2.8)) continue;
						let x = Number.POSITIVE_INFINITY;
						for (let e = 0; e < t.length; e += 1) {
							const i = t[e],
								n = Math.hypot(m - i.x, g - i.y);
							n < x && (x = n)
						}
						t.length || (x = 999);
						const y = x + (u < .45 * e ? 4 : 1.8) * Math.hypot((m - a) / 84, (g - o) / 78) - 1.35 * l[m < a ? g < o ? "lt" : "lb" : g < o ? "rt" : "rb"] - .16 * Math.abs(x - h) + .95 * this.seededUnit(`dense-${e}-${u}-${f}-bonus`);
						y > p && (p = y, d = {
							x: m,
							y: g
						})
					}
					if (!d) {
						const t = 8 + 84 * this.seededUnit(`dense-fallback-${e}-${u}-x`),
							i = n + 78 * this.seededUnit(`dense-fallback-${e}-${u}-y`);
						d = this.adjustForHudZone(t, i, 3.2, `dense-fallback-${u}`)
					}
					const c = this.adjustForHudZone(d.x, d.y, 2.8, `dense-safe-${e}-${u}`),
						m = this.clampPercent(c.x, 8, i),
						g = this.clampPercent(c.y, n, s);
					t.push({
						x: m,
						y: g
					}), l[m < a ? g < o ? "lt" : "lb" : g < o ? "rt" : "rb"] += 1
				}
				for (let u = 0; u < 4; u += 1)
					for (let e = 0; e < t.length; e += 1) {
						const a = t[e];
						let o = 0,
							r = 0;
						for (let i = 0; i < t.length; i += 1) {
							if (i === e) continue;
							const n = t[i],
								s = a.x - n.x,
								l = a.y - n.y,
								d = Math.hypot(s, l) || .001;
							if (d >= .92 * h) continue;
							const p = (.92 * h - d) / (.92 * h);
							o += s / d * p, r += l / d * p
						}
						a.x += .72 * o, a.y += .72 * r;
						const l = this.adjustForHudZone(a.x, a.y, 2.8, `relax-${e}-${u}`);
						a.x = this.clampPercent(l.x, 8, i), a.y = this.clampPercent(l.y, n, s)
					}
				for (let u = t.length - 1; u > 0; u -= 1) {
					const i = this.seededUnit(`dense-shuffle-${e}-${u}`),
						n = Math.floor(i * (u + 1)),
						s = t[u];
					t[u] = t[n], t[n] = s
				}
				return t
			},
			scheduleMeasureMapCanvas() {
				this.$nextTick((() => {
					setTimeout((() => {
						this.measureMapCanvas()
					}), 24)
				}))
			},
			measureMapCanvas() {
				const t = e.index.createSelectorQuery().in(this);
				t.select(".map-canvas").boundingClientRect(), t.select(".signal-hud").boundingClientRect(), t.exec((e => {
					const t = e && e[0],
						i = e && e[1];
					if (!t || !t.width || !t.height) return;
						if (this.mapCanvasRect = t, this.hudDragBounds = this.getHudBounds(t, i), !this.hudReady) {
							const e = this.getDefaultHudPosition(t, i);
							this.hudX = e.x, this.hudY = e.y, this.hudReady = !0;
							return
						}
						const n = this.clampHudPosition(this.hudX, this.hudY);
						this.hudX = n.x, this.hudY = n.y
					}))
				},
			getHudBounds(e, t) {
				const i = 12,
					n = t && t.width || 152,
					s = t && t.height || 84;
				return {
					minX: i,
					minY: i,
					maxX: Math.max(i, e.width - n - i),
					maxY: Math.max(i, e.height - s - i)
				}
			},
			getDefaultHudPosition(e, t) {
				const i = this.getHudBounds(e, t);
				return {
					x: i.maxX,
					y: i.minY + 2
				}
			},
			clampHudPosition(e, t) {
				const i = this.hudDragBounds;
				return i ? {
					x: Math.min(Math.max(e, i.minX), i.maxX),
					y: Math.min(Math.max(t, i.minY), i.maxY)
				} : {
					x: e,
					y: t
				}
			},
			getTouchPoint: e => e && e.touches && e.touches[0] || e && e.changedTouches && e.changedTouches[0] || null,
			startHudDrag(e) {
				const t = this.getTouchPoint(e);
				t && (this.mapCanvasRect && this.hudDragBounds ? (this.hudDragging = !0, this.hudDragOffsetX = t.pageX - this.mapCanvasRect.left - this.hudX, this.hudDragOffsetY = t.pageY - this.mapCanvasRect.top - this.hudY) : this.measureMapCanvas())
			},
			moveHudDrag(e) {
				if (!this.hudDragging) return;
				const t = this.getTouchPoint(e);
				if (!t || !this.mapCanvasRect) return;
				const i = t.pageX - this.mapCanvasRect.left - this.hudDragOffsetX,
					n = t.pageY - this.mapCanvasRect.top - this.hudDragOffsetY,
					s = this.clampHudPosition(i, n);
				this.hudX = s.x, this.hudY = s.y
			},
			endHudDrag() {
				this.hudDragging = !1
			},
				getNegativeAnimationDelay(e, t, i) {
					return -this.normalizePhase(e - t, i)
				},
				createRouteCurve(e, t, i) {
				const n = this.adjustForHudZone(e.x, e.y, 2, `route-from-${i}`),
					s = this.adjustForHudZone(t.x, t.y, 2, `route-to-${i}`),
					a = s.x - n.x,
					o = s.y - n.y,
					h = Math.hypot(a, o) || 1,
					r = -o / h,
					l = a / h,
					d = Math.min(16, 8 + .12 * h) * (i % 2 == 0 ? 1 : -1),
					p = this.adjustForHudZone(n.x + .32 * a + r * d, n.y + .18 * o + l * d, 1, `route-c1-${i}`),
					u = this.adjustForHudZone(n.x + .68 * a + r * d, n.y + .82 * o + l * d, 1, `route-c2-${i}`);
				return {
					start: n,
					control1: p,
					control2: u,
					end: s
				}
			},
					getCubicBezierPoint(e, t, i, n, s) {
					const a = 1 - s,
						o = a * a,
					h = o * a,
					r = s * s,
					l = r * s;
				return {
					x: e.x * h + 3 * t.x * o * s + 3 * i.x * a * r + n.x * l,
						y: e.y * h + 3 * t.y * o * s + 3 * i.y * a * r + n.y * l
					}
					},
					formatRouteValue(e) {
						return Math.round(100 * e) / 100
					},
				getRouteLayerMetrics() {
					const e = this.mapCanvasRect && this.mapCanvasRect.width && this.mapCanvasRect.height ? this.mapCanvasRect : null;
					return {
						rect: e,
						unit: e ? "px" : "%",
						width: e ? e.width : 100,
						height: e ? e.height : 100,
						scale: e ? Math.min(e.width, e.height) / 100 : 2.8
					}
				},
				createRouteSegment(e, t, i, n, s, a) {
					const o = this.getRouteLayerMetrics(),
						h = this.getCubicBezierPoint(e.curve.start, e.curve.control1, e.curve.control2, e.curve.end, t),
						r = this.getCubicBezierPoint(e.curve.start, e.curve.control1, e.curve.control2, e.curve.end, i),
						l = h.x * o.width / 100,
						d = h.y * o.height / 100,
						p = r.x * o.width / 100,
						u = r.y * o.height / 100,
						c = p - l,
						m = u - d,
						g = Math.hypot(c, m);
					if (g <= .4) return null;
					const x = 180 * Math.atan2(m, c) / Math.PI,
						y = Math.max(g + (o.rect ? 2 : .45), o.rect ? 5 : .7),
						f = Math.max(1.2, n * o.scale);
					return {
						id: s,
						style: `left:${this.formatRouteValue(l)}${o.unit};top:${this.formatRouteValue(d)}${o.unit};width:${this.formatRouteValue(y)}${o.unit};height:${this.formatRouteValue(f)}px;transform:translateY(-50%) rotate(${this.formatRouteValue(x)}deg);opacity:${this.formatRouteValue(a)};`
					}
				},
				createRouteBaseSegments(e, t) {
					if (!e || !e.curve) return [];
					const i = this.isDenseMap ? 18 : 28,
						n = [],
						s = Math.min(.72, .2 + .62 * (e.opacity || .45));
					for (let a = 0; a < i; a += 1) {
						const o = this.createRouteSegment(e, a / i, (a + 1) / i, Math.max(1.05, (e.width || 1.2) * .68), `${e.id}-base-${a}`, s);
						o && n.push(o)
					}
					return n
				},
				createRouteGlowSegments(e, t) {
					if (!e || !e.curve) return [];
					const i = Date.now() / 1e3,
						n = "number" == typeof e.duration ? e.duration : 5.4,
						s = this.isDenseMap ? 2 : 3,
						a = this.isDenseMap ? .055 : .07,
						o = [],
						h = Math.min(.98, .48 + .48 * (e.opacity || .5));
					for (let r = 0; r < s; r += 1) {
						const s = this.normalizePhase(i - (e.delay || 0) - r * n / 3, n) / n,
							l = Math.min(.985, s + a),
							d = this.createRouteSegment(e, s, l, Math.max(1.65, (e.width || 1.2) + .35), `${e.id}-glow-${r}`, h);
						d && o.push(d)
					}
					return o
				},
				createRoutePacketDots(e, t) {
					if (!e || !e.curve) return [];
					const i = this.getRouteLayerMetrics(),
						n = Date.now() / 1e3,
						s = "number" == typeof e.duration ? e.duration : 5.4,
						a = Math.max(4.6, 2 * (e.packetSize || 1.2) * i.scale),
						o = Math.max(3.2, .72 * a),
						h = this.normalizePhase(n - (e.delay || 0), s) / s,
						r = this.normalizePhase(n - (e.delay || 0) - 1.8, s) / s,
						l = phase => {
							const n = this.getCubicBezierPoint(e.curve.start, e.curve.control1, e.curve.control2, e.curve.end, phase);
							return {
								x: n.x * i.width / 100,
								y: n.y * i.height / 100
							}
						},
						d = l(h),
						p = l(r);
					return [{
						id: `${e.id}-packet-primary`,
						className: "primary",
						style: `left:${this.formatRouteValue(d.x)}${i.unit};top:${this.formatRouteValue(d.y)}${i.unit};width:${this.formatRouteValue(a)}px;height:${this.formatRouteValue(a)}px;`
					}, {
						id: `${e.id}-packet-secondary`,
						className: "secondary",
						style: `left:${this.formatRouteValue(p.x)}${i.unit};top:${this.formatRouteValue(p.y)}${i.unit};width:${this.formatRouteValue(o)}px;height:${this.formatRouteValue(o)}px;`
					}]
				},
				startRouteViewLoop() {
					this.stopRouteViewLoop(), this.routeViewLoopTimer = setInterval((() => {
						this.routeFrame = (this.routeFrame + 1) % 1e5
					}), 50)
				},
				stopRouteViewLoop() {
					this.routeViewLoopTimer && (clearInterval(this.routeViewLoopTimer), this.routeViewLoopTimer = null)
				},
				async loadHome() {
				await t.fetchLocations();
				try {
					this.trending = await i.getTrendingPlanes()
				} catch (e) {
					this.trending = []
				}
				this.scheduleMeasureMapCanvas()
			},
			clearThemeRippleTimers() {
				this.themeRippleStartTimer && (clearTimeout(this.themeRippleStartTimer), this.themeRippleStartTimer = null), this.themeRippleToggleTimer && (clearTimeout(this.themeRippleToggleTimer), this.themeRippleToggleTimer = null), this.themeRippleFadeTimer && (clearTimeout(this.themeRippleFadeTimer), this.themeRippleFadeTimer = null), this.themeRippleEndTimer && (clearTimeout(this.themeRippleEndTimer), this.themeRippleEndTimer = null)
			},
			resetThemeRipple() {
				this.themeRippleVisible = !1, this.themeRippleExpanding = !1, this.themeRippleFading = !1
			},
			handleToggleTheme() {
				this.themeRippleVisible || (this.clearThemeRippleTimers(), this.themeRippleTarget = "dark" === this.appState.theme ? "light" : "dark", this.themeRippleVisible = !0, this.themeRippleExpanding = !1, this.themeRippleFading = !1, this.themeRippleStartTimer = setTimeout((() => {
					this.themeRippleExpanding = !0
				}), 16), this.themeRippleToggleTimer = setTimeout((() => {
					t.toggleTheme()
				}), 210), this.themeRippleFadeTimer = setTimeout((() => {
					this.themeRippleFading = !0
				}), 520), this.themeRippleEndTimer = setTimeout((() => {
					this.clearThemeRippleTimers(), this.resetThemeRipple()
				}), 760))
			},
			goThrow() {
				e.index.reLaunch({
					url: "/pages/throw/index"
				})
			},
			goTrending() {
				e.index.reLaunch({
					url: "/pages/trending/index"
				})
			},
			goDiscover(i) {
				const n = String(i || "").trim();
				t.setCurrentLocation(n);
				const s = n ? `/pages/discover/index?location=${encodeURIComponent(n)}` : "/pages/discover/index";
				e.index.reLaunch({
					url: s
				})
			},
			openDetail(e) {
				this.openPlaneDetail(e)
			},
			previewTrendImages(t, n = 0) {
				const s = ((null == t ? void 0 : t.imageUrls) || []).map((e => i.getAssetUrl(e))).filter(Boolean);
				if (!s.length) return;
				const a = Math.max(0, Math.min(n, s.length - 1));
				e.index.previewImage({
					urls: s,
					current: s[a]
				})
			},
			async handleRandom() {
				if (!this.randomLoading) {
					this.randomLoading = !0;
					try {
						const e = await i.getRandomPlane();
						this.openDetail(e.id)
					} catch (t) {
						e.index.showToast({
							title: t.message || "暂无飞机可拾取",
							icon: "none"
						})
					} finally {
						this.randomLoading = !1
					}
				}
			},
			getPlaneAuthorLabelText: e => n.getPlaneAuthorLabel(e),
			getAssetUrl: i.getAssetUrl
		}
	};
	if (!Array) {
		(e.resolveComponent("shatter-headline") + e.resolveComponent("detail-open-transition") + e.resolveComponent("page-transition") + e.resolveComponent("app-tabbar"))()
	}
const r = e._export_sfc(h, [
	["render", function(t, i, n, s, a, o) {
		return e.e({
			a: a.icons.throwActive,
			b: e.o(((...e) => o.handleToggleTheme && o.handleToggleTheme(...e)), "c8"),
			c: e.p({
				phrases: a.headlinePhrases
			}),
			d: e.o(((...e) => o.goThrow && o.goThrow(...e)), "46"),
			e: e.t(a.randomLoading ? "正在挑选" : "随机拾取"),
			f: e.o(((...e) => o.handleRandom && o.handleRandom(...e)), "b6"),
			g: e.t(o.totalPlanes),
			h: e.t(o.locations.length),
				i: e.t(o.topTrending.length),
				j: a.icons.search,
				k: a.query,
				l: e.o((e => a.query = e.detail.value), "e1"),
					T: e.f(o.routeBaseSegments, ((t, i, n) => ({
							a: t.id,
							b: t.style
						}))),
					U: e.f(o.routeGlowSegments, ((t, i, n) => ({
						a: t.id,
						b: t.style
					}))),
					V: e.f(o.routePacketDots, ((t, i, n) => ({
						a: t.id,
						b: t.className,
						c: t.style
					}))),
					z: e.t(o.totalPlanes),
				A: e.t(o.busiestLocationLabel),
			B: e.s(o.hudStyle),
			C: e.o(((...e) => o.startHudDrag && o.startHudDrag(...e)), "67"),
			D: e.o(((...e) => o.moveHudDrag && o.moveHudDrag(...e)), "67"),
			E: e.o(((...e) => o.endHudDrag && o.endHudDrag(...e)), "f3"),
			F: e.o(((...e) => o.endHudDrag && o.endHudDrag(...e)), "a5"),
			G: e.f(o.mapNodes, ((t, i, n) => e.e({
				a: t.loc.iconUrl ? o.getAssetUrl(t.loc.iconUrl) : a.icons.location,
				b: e.t(t.loc.name),
				c: !t.hideCount
			}, t.hideCount ? {} : {
				d: e.t(t.loc.planeCount)
			}, {
				e: t.loc.id,
				f: `${t.x}%`,
				g: `${t.y}%`,
				h: `${t.size}px`,
				i: `${t.delay}s`,
				j: t.labelShift,
				k: e.o((e => o.goDiscover(t.loc.name)), t.loc.id)
			}))),
			H: e.n({
				"map-canvas-dense": o.isDenseMap
			}),
			I: o.topTrending.length
		}, o.topTrending.length ? {
			J: e.o(((...e) => o.goTrending && o.goTrending(...e)), "5c"),
			K: e.f(o.topTrending, ((t, i, n) => e.e({
				a: e.t(i + 1),
				b: e.t(t.likeCount || 0),
				c: e.t(t.content),
				d: e.t(t.locationTag),
				e: e.t(o.getPlaneAuthorLabelText(t)),
					f: e.t(t.likeCount),
					g: t.imageUrls && t.imageUrls.length,
					l: t.imageUrls && t.imageUrls.length === 1
			}, t.imageUrls && t.imageUrls.length ? {
				h: e.f(t.imageUrls.slice(0, 3), ((i, n, s) => e.e({
					a: o.getAssetUrl(i),
					b: 2 === n && t.imageUrls.length > 3
				}, 2 === n && t.imageUrls.length > 3 ? {
					c: e.t(t.imageUrls.length - 3)
				} : {}, {
					d: t.id + "-img-" + n,
					e: e.o((e => o.previewTrendImages(t, n)), t.id + "-img-" + n)
				}))),
				i: e.o((() => {}), t.id)
			} : {}, {
				j: t.id,
				k: e.o((e => o.openDetail(t.id)), t.id)
			}))),
			L: a.icons.location
		} : {}, {
			M: a.themeRippleVisible
		}, a.themeRippleVisible ? {
			N: e.n(o.themeRippleThemeClass),
			O: e.n({
				"is-expand": a.themeRippleExpanding,
				"is-fade": a.themeRippleFading
			})
		} : {}, {
			P: e.p({
				visible: t.detailOpenVisible,
				theme: a.appState.theme
			}),
			Q: e.p({
				visible: t.pageTransitionVisible,
				theme: a.appState.theme
			}),
			R: e.p({
				active: "home",
				theme: a.appState.theme
			}),
			S: e.n(o.themeClass)
		})
	}],
	["__scopeId", "data-v-04673b4a"]
]);
wx.createPage(r);
