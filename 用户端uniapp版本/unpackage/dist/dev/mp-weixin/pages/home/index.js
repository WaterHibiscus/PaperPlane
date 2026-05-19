"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_utils = require("../../common/utils.js");
const common_detailOpenTransition = require("../../common/detail-open-transition.js");
const common_pageTransition = require("../../common/page-transition.js");
const common_uiIcons = require("../../common/ui-icons.js");
const AppTabbar = () => "../../components/AppTabbar.js";
const DetailOpenTransition = () => "../../components/DetailOpenTransition.js";
const PageTransition = () => "../../components/PageTransition.js";
const ShatterHeadline = () => "../../components/ShatterHeadline.js";
const _sfc_main = {
  mixins: [common_pageTransition.pageTransitionMixin, common_detailOpenTransition.detailOpenTransitionMixin],
  components: {
    AppTabbar,
    DetailOpenTransition,
    PageTransition,
    ShatterHeadline
  },
  data() {
    return {
      appState: common_appState.appState,
      icons: common_uiIcons.uiIcons,
      query: "",
      trending: [],
      randomLoading: false,
      headlinePhrases: [
        "把心绪折成纸，交给校园的风",
        "把没说出口的话，留在路过的风景",
        "让匿名的回声，刚好落进谁手里",
        "把今天的情绪，投向一个真实地点",
        "给某个陌生同学，留下一次轻回应"
      ],
      nodePresets: [
        {
          x: 16,
          y: 28,
          size: 70
        },
        {
          x: 40,
          y: 18,
          size: 62
        },
        {
          x: 70,
          y: 26,
          size: 74
        },
        {
          x: 28,
          y: 64,
          size: 68
        },
        {
          x: 58,
          y: 58,
          size: 80
        },
        {
          x: 82,
          y: 70,
          size: 60
        },
        {
          x: 12,
          y: 70,
          size: 58
        },
        {
          x: 48,
          y: 76,
          size: 66
        }
      ],
      hudX: 0,
      hudY: 0,
      hudReady: false,
      hudDragging: false,
      hudDragOffsetX: 0,
      hudDragOffsetY: 0,
      mapCanvasRect: null,
      hudDragBounds: null,
      themeRippleVisible: false,
      themeRippleExpanding: false,
      themeRippleFading: false,
      themeRippleTarget: "light",
      themeRippleStartTimer: null,
      themeRippleToggleTimer: null,
      themeRippleFadeTimer: null,
      themeRippleEndTimer: null
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    isDark() {
      return this.appState.theme === "dark";
    },
    themeRippleThemeClass() {
      return this.themeRippleTarget === "dark" ? "ripple-theme-dark" : "ripple-theme-light";
    },
    locations() {
      return this.appState.locations || [];
    },
    filteredLocations() {
      const keyword = (this.query || "").trim();
      if (!keyword)
        return this.locations;
      return this.locations.filter((item) => item.name.includes(keyword));
    },
    isDenseMap() {
      return this.filteredLocations.length >= 7;
    },
    hudStyle() {
      if (!this.hudReady)
        return null;
      return {
        left: `${this.hudX}px`,
        top: `${this.hudY}px`,
        right: "auto"
      };
    },
    mapNodes() {
      const nowSec = Date.now() / 1e3;
      const orbitDuration = 3.6;
      const densePositions = this.isDenseMap ? this.buildDensePositions(this.filteredLocations.length) : [];
      const hideCount = this.isDenseMap && this.filteredLocations.length >= 9;
      return this.filteredLocations.map((loc, index) => {
        const preset = this.isDenseMap ? densePositions[index] || this.nodePresets[index % this.nodePresets.length] : this.nodePresets[index % this.nodePresets.length];
        const countBoost = Math.min(loc.planeCount || 0, 6) * 2;
        let x = preset.x;
        let y = preset.y;
        if (!this.isDenseMap) {
          x += (index % 3 - 1) * 1.4;
          y += index % 2 === 0 ? -1 : 1;
        }
        const safePoint = this.adjustForHudZone(x, y, this.isDenseMap ? 3 : 4, `node-${index}`);
        const size = this.isDenseMap ? Math.min(Math.max(52 + countBoost * 0.65, 48), 72) : Math.min(Math.max(preset.size + countBoost, 56), 90);
        const labelShift = safePoint.x > 72 ? "-14px" : safePoint.x < 22 ? "14px" : "0px";
        const delay = this.getNegativeAnimationDelay(nowSec, index * 0.18, orbitDuration);
        return {
          loc,
          x: safePoint.x,
          y: safePoint.y,
          size,
          labelShift,
          delay,
          hideCount
        };
      });
    },
    signalRoutes() {
      const nodes = this.mapNodes;
      if (nodes.length < 2)
        return [];
      const nowSec = Date.now() / 1e3;
      const pairs = this.isDenseMap ? this.buildDenseRoutePairs(nodes) : this.buildDefaultRoutePairs(nodes);
      const seen = /* @__PURE__ */ new Set();
      return pairs.filter(([from, to]) => {
        if (!from || !to || from.loc.id === to.loc.id)
          return false;
        const key = [from.loc.id, to.loc.id].sort((a, b) => a - b).join("-");
        if (seen.has(key))
          return false;
        seen.add(key);
        return true;
      }).slice(0, this.isDenseMap ? Math.max(nodes.length - 1, 7) : 7).map(([from, to], index) => {
        const heat = Math.max(from.loc.planeCount || 0, to.loc.planeCount || 0);
        const width = Math.min(2.8, 1.05 + heat * 0.18);
        return {
          id: `${from.loc.id}-${to.loc.id}-${index}`,
          path: this.createRoutePath(from, to, index),
          width,
          opacity: Math.min(0.78, 0.28 + heat * 0.08),
          duration: 5.4 + index % 3 * 0.9,
          delay: index * 0.65,
          packetOffset: index * 0.65 + 1.8,
          packetSize: Math.min(2.2, 1.15 + heat * 0.08),
          glowDelay: this.getNegativeAnimationDelay(nowSec, index * 0.65, 5.4 + index % 3 * 0.9),
          packetBegin: this.getNegativeMotionBegin(nowSec, index * 0.65, 5.4 + index % 3 * 0.9),
          secondaryPacketBegin: this.getNegativeMotionBegin(
            nowSec,
            index * 0.65 + 1.8,
            5.4 + index % 3 * 0.9
          )
        };
      });
    },
    totalPlanes() {
      return this.locations.reduce((sum, item) => sum + (item.planeCount || 0), 0);
    },
    topTrending() {
      return this.trending.slice(0, 3);
    },
    busiestLocationLabel() {
      if (!this.filteredLocations.length)
        return "等待新的投递进入网络";
      const sorted = this.filteredLocations.slice().sort((a, b) => (b.planeCount || 0) - (a.planeCount || 0));
      const hottest = sorted[0];
      if (!hottest || !hottest.planeCount)
        return "所有落点当前都很安静";
      return `${hottest.name} 最活跃 · ${hottest.planeCount} 架`;
    }
  },
  watch: {
    filteredLocations() {
      this.scheduleMeasureMapCanvas();
    }
  },
  async onShow() {
    await this.loadHome();
    this.scheduleMeasureMapCanvas();
  },
  onHide() {
    this.clearThemeRippleTimers();
    this.resetThemeRipple();
  },
  onUnload() {
    this.clearThemeRippleTimers();
    this.resetThemeRipple();
  },
  onReady() {
    this.scheduleMeasureMapCanvas();
  },
  methods: {
    normalizePhase(value, duration) {
      const mod = value % duration;
      return mod < 0 ? mod + duration : mod;
    },
    seededUnit(seed) {
      const text = String(seed);
      let h1 = 2166136261;
      let h2 = 461845907;
      for (let index = 0; index < text.length; index += 1) {
        const code = text.charCodeAt(index);
        h1 = Math.imul(h1 ^ code, 2246822507);
        h2 = Math.imul(h2 ^ code, 3266489909);
      }
      h1 ^= h1 >>> 16;
      h1 = Math.imul(h1, 2146121005);
      h1 ^= h1 >>> 15;
      h2 ^= h2 >>> 16;
      h2 = Math.imul(h2, 2221713035);
      h2 ^= h2 >>> 15;
      const hash = (h1 ^ h2) >>> 0;
      return hash / 4294967295;
    },
    clampPercent(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    isInHudZone(x, y, padding = 0) {
      const minX = 62 - padding;
      const maxX = 98 + padding;
      const minY = 2 - padding;
      const maxY = 34 + padding;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    },
    adjustForHudZone(x, y, padding = 3, seed = "") {
      let nextX = Math.min(Math.max(x, 6), 94);
      let nextY = Math.min(Math.max(y, 12), 92);
      if (!this.isInHudZone(nextX, nextY, padding)) {
        return { x: nextX, y: nextY };
      }
      const centerX = 80;
      const centerY = 18;
      let step = 0;
      while (this.isInHudZone(nextX, nextY, padding) && step < 10) {
        let dx = nextX - centerX;
        let dy = nextY - centerY;
        if (Math.abs(dx) + Math.abs(dy) < 0.01) {
          dx = this.seededUnit(`${seed}-dx-${step}`) - 0.5;
          dy = this.seededUnit(`${seed}-dy-${step}`) - 0.5;
        }
        const dist = Math.hypot(dx, dy) || 1;
        const push = 3.4 + step * 0.7;
        nextX += dx / dist * push;
        nextY += dy / dist * push;
        nextX = Math.min(Math.max(nextX, 6), 94);
        nextY = Math.min(Math.max(nextY, 12), 92);
        step += 1;
      }
      return { x: nextX, y: nextY };
    },
    buildDefaultRoutePairs(nodes) {
      const pairs = [];
      for (let index = 0; index < nodes.length - 1; index += 1) {
        pairs.push([nodes[index], nodes[index + 1]]);
      }
      if (nodes.length > 2) {
        for (let index = 0; index < nodes.length; index += 2) {
          pairs.push([nodes[index], nodes[(index + 2) % nodes.length]]);
        }
      }
      return pairs;
    },
    buildDenseRoutePairs(nodes) {
      const edges = [];
      for (let fromIndex = 0; fromIndex < nodes.length; fromIndex += 1) {
        for (let toIndex = fromIndex + 1; toIndex < nodes.length; toIndex += 1) {
          const from = nodes[fromIndex];
          const to = nodes[toIndex];
          const distance = Math.hypot(from.x - to.x, from.y - to.y);
          const jitter = this.seededUnit(`route-${from.loc.id}-${to.loc.id}`) * 1.2;
          edges.push({
            fromIndex,
            toIndex,
            from,
            to,
            distance,
            score: distance + jitter
          });
        }
      }
      edges.sort((a, b) => a.score - b.score);
      const parent = nodes.map((_, index) => index);
      const find = (index) => {
        let root = index;
        while (parent[root] !== root) {
          root = parent[root];
        }
        while (parent[index] !== index) {
          const next = parent[index];
          parent[index] = root;
          index = next;
        }
        return root;
      };
      const union = (a, b) => {
        const rootA = find(a);
        const rootB = find(b);
        if (rootA === rootB)
          return false;
        parent[rootB] = rootA;
        return true;
      };
      const connectedPairs = [];
      for (let index = 0; index < edges.length; index += 1) {
        const edge = edges[index];
        if (!union(edge.fromIndex, edge.toIndex))
          continue;
        connectedPairs.push([edge.from, edge.to]);
        if (connectedPairs.length >= nodes.length - 1)
          break;
      }
      if (connectedPairs.length < nodes.length - 1) {
        return this.buildDefaultRoutePairs(nodes);
      }
      const extraLimit = Math.min(3, Math.max(1, Math.floor(nodes.length / 5)));
      const degreeById = /* @__PURE__ */ Object.create(null);
      for (let index = 0; index < connectedPairs.length; index += 1) {
        const [from, to] = connectedPairs[index];
        degreeById[from.loc.id] = (degreeById[from.loc.id] || 0) + 1;
        degreeById[to.loc.id] = (degreeById[to.loc.id] || 0) + 1;
      }
      const existingKeys = new Set(
        connectedPairs.map(([from, to]) => [from.loc.id, to.loc.id].sort((a, b) => a - b).join("-"))
      );
      let extraCount = 0;
      for (let index = 0; index < edges.length && extraCount < extraLimit; index += 1) {
        const edge = edges[index];
        const key = [edge.from.loc.id, edge.to.loc.id].sort((a, b) => a - b).join("-");
        if (existingKeys.has(key))
          continue;
        if (edge.distance > 36)
          continue;
        if ((degreeById[edge.from.loc.id] || 0) >= 3 || (degreeById[edge.to.loc.id] || 0) >= 3)
          continue;
        connectedPairs.push([edge.from, edge.to]);
        existingKeys.add(key);
        degreeById[edge.from.loc.id] = (degreeById[edge.from.loc.id] || 0) + 1;
        degreeById[edge.to.loc.id] = (degreeById[edge.to.loc.id] || 0) + 1;
        extraCount += 1;
      }
      return connectedPairs;
    },
    buildDensePositions(total) {
      const points = [];
      if (!total)
        return points;
      const minX = 8;
      const maxX = 92;
      const minY = 12;
      const maxY = 90;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const targetDist = total <= 8 ? 20 : total <= 12 ? 16 : total <= 16 ? 13 : 11;
      const candidateCount = total <= 10 ? 120 : total <= 14 ? 104 : 88;
      const quadrantCounts = {
        lt: 0,
        rt: 0,
        lb: 0,
        rb: 0
      };
      const anchors = [
        { x: minX + 4, y: minY + 5 },
        { x: minX + 6, y: maxY - 6 },
        { x: maxX - 6, y: maxY - 6 },
        { x: centerX, y: minY + 6 },
        { x: centerX, y: maxY - 6 }
      ];
      const anchorCount = Math.min(total, anchors.length);
      for (let index = 0; index < anchorCount; index += 1) {
        const anchor = anchors[index];
        const jitterX = (this.seededUnit(`dense-anchor-${total}-${index}-x`) - 0.5) * 8;
        const jitterY = (this.seededUnit(`dense-anchor-${total}-${index}-y`) - 0.5) * 8;
        const safe = this.adjustForHudZone(anchor.x + jitterX, anchor.y + jitterY, 3, `dense-anchor-${total}-${index}`);
        const x = this.clampPercent(safe.x, minX, maxX);
        const y = this.clampPercent(safe.y, minY, maxY);
        points.push({ x, y });
        const key = x < centerX ? y < centerY ? "lt" : "lb" : y < centerY ? "rt" : "rb";
        quadrantCounts[key] += 1;
      }
      for (let index = points.length; index < total; index += 1) {
        let best = null;
        let bestScore = -Infinity;
        for (let candidateIndex = 0; candidateIndex < candidateCount; candidateIndex += 1) {
          const unitX = this.seededUnit(`dense-${total}-${index}-${candidateIndex}-x`);
          const unitY = this.seededUnit(`dense-${total}-${index}-${candidateIndex}-y`);
          const jitterX = (this.seededUnit(`dense-${total}-${index}-${candidateIndex}-jx`) - 0.5) * 11;
          const jitterY = (this.seededUnit(`dense-${total}-${index}-${candidateIndex}-jy`) - 0.5) * 11;
          let x2 = minX + unitX * (maxX - minX) + jitterX;
          let y2 = minY + unitY * (maxY - minY) + jitterY;
          x2 = this.clampPercent(x2, minX, maxX);
          y2 = this.clampPercent(y2, minY, maxY);
          if (this.isInHudZone(x2, y2, 2.8))
            continue;
          let nearest = Number.POSITIVE_INFINITY;
          for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
            const point = points[pointIndex];
            const distance = Math.hypot(x2 - point.x, y2 - point.y);
            if (distance < nearest)
              nearest = distance;
          }
          if (!points.length)
            nearest = 999;
          const radial = Math.hypot((x2 - centerX) / (maxX - minX), (y2 - centerY) / (maxY - minY));
          const edgeBoost = (index < total * 0.45 ? 4 : 1.8) * radial;
          const key2 = x2 < centerX ? y2 < centerY ? "lt" : "lb" : y2 < centerY ? "rt" : "rb";
          const balancePenalty = quadrantCounts[key2] * 1.35;
          const softDistancePenalty = Math.abs(nearest - targetDist) * 0.16;
          const randomBonus = this.seededUnit(`dense-${total}-${index}-${candidateIndex}-bonus`) * 0.95;
          const score = nearest + edgeBoost - balancePenalty - softDistancePenalty + randomBonus;
          if (score > bestScore) {
            bestScore = score;
            best = { x: x2, y: y2 };
          }
        }
        if (!best) {
          const fallbackX = minX + this.seededUnit(`dense-fallback-${total}-${index}-x`) * (maxX - minX);
          const fallbackY = minY + this.seededUnit(`dense-fallback-${total}-${index}-y`) * (maxY - minY);
          best = this.adjustForHudZone(fallbackX, fallbackY, 3.2, `dense-fallback-${index}`);
        }
        const safe = this.adjustForHudZone(best.x, best.y, 2.8, `dense-safe-${total}-${index}`);
        const x = this.clampPercent(safe.x, minX, maxX);
        const y = this.clampPercent(safe.y, minY, maxY);
        points.push({ x, y });
        const key = x < centerX ? y < centerY ? "lt" : "lb" : y < centerY ? "rt" : "rb";
        quadrantCounts[key] += 1;
      }
      for (let iteration = 0; iteration < 4; iteration += 1) {
        for (let index = 0; index < points.length; index += 1) {
          const current = points[index];
          let forceX = 0;
          let forceY = 0;
          for (let targetIndex = 0; targetIndex < points.length; targetIndex += 1) {
            if (targetIndex === index)
              continue;
            const other = points[targetIndex];
            const dx = current.x - other.x;
            const dy = current.y - other.y;
            const dist = Math.hypot(dx, dy) || 1e-3;
            if (dist >= targetDist * 0.92)
              continue;
            const power = (targetDist * 0.92 - dist) / (targetDist * 0.92);
            forceX += dx / dist * power;
            forceY += dy / dist * power;
          }
          current.x += forceX * 0.72;
          current.y += forceY * 0.72;
          const safe = this.adjustForHudZone(current.x, current.y, 2.8, `relax-${index}-${iteration}`);
          current.x = this.clampPercent(safe.x, minX, maxX);
          current.y = this.clampPercent(safe.y, minY, maxY);
        }
      }
      for (let index = points.length - 1; index > 0; index -= 1) {
        const rand = this.seededUnit(`dense-shuffle-${total}-${index}`);
        const swapIndex = Math.floor(rand * (index + 1));
        const temp = points[index];
        points[index] = points[swapIndex];
        points[swapIndex] = temp;
      }
      return points;
    },
    scheduleMeasureMapCanvas() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.measureMapCanvas();
        }, 24);
      });
    },
    measureMapCanvas() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".map-canvas").boundingClientRect();
      query.select(".signal-hud").boundingClientRect();
      query.exec((res) => {
        const canvasRect = res && res[0];
        const hudRect = res && res[1];
        if (!canvasRect || !canvasRect.width || !canvasRect.height)
          return;
        this.mapCanvasRect = canvasRect;
        this.hudDragBounds = this.getHudBounds(canvasRect, hudRect);
        if (!this.hudReady) {
          const defaultPos = this.getDefaultHudPosition(canvasRect, hudRect);
          this.hudX = defaultPos.x;
          this.hudY = defaultPos.y;
          this.hudReady = true;
          return;
        }
        const next = this.clampHudPosition(this.hudX, this.hudY);
        this.hudX = next.x;
        this.hudY = next.y;
      });
    },
    getHudBounds(canvasRect, hudRect) {
      const padding = 12;
      const hudWidth = hudRect && hudRect.width || 152;
      const hudHeight = hudRect && hudRect.height || 84;
      return {
        minX: padding,
        minY: padding,
        maxX: Math.max(padding, canvasRect.width - hudWidth - padding),
        maxY: Math.max(padding, canvasRect.height - hudHeight - padding)
      };
    },
    getDefaultHudPosition(canvasRect, hudRect) {
      const bounds = this.getHudBounds(canvasRect, hudRect);
      return {
        x: bounds.maxX,
        y: bounds.minY + 2
      };
    },
    clampHudPosition(x, y) {
      const bounds = this.hudDragBounds;
      if (!bounds)
        return { x, y };
      return {
        x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
        y: Math.min(Math.max(y, bounds.minY), bounds.maxY)
      };
    },
    getTouchPoint(event) {
      return event && event.touches && event.touches[0] || event && event.changedTouches && event.changedTouches[0] || null;
    },
    startHudDrag(event) {
      const touch = this.getTouchPoint(event);
      if (!touch)
        return;
      if (!this.mapCanvasRect || !this.hudDragBounds) {
        this.measureMapCanvas();
        return;
      }
      this.hudDragging = true;
      this.hudDragOffsetX = touch.pageX - this.mapCanvasRect.left - this.hudX;
      this.hudDragOffsetY = touch.pageY - this.mapCanvasRect.top - this.hudY;
    },
    moveHudDrag(event) {
      if (!this.hudDragging)
        return;
      const touch = this.getTouchPoint(event);
      if (!touch || !this.mapCanvasRect)
        return;
      const nextX = touch.pageX - this.mapCanvasRect.left - this.hudDragOffsetX;
      const nextY = touch.pageY - this.mapCanvasRect.top - this.hudDragOffsetY;
      const next = this.clampHudPosition(nextX, nextY);
      this.hudX = next.x;
      this.hudY = next.y;
    },
    endHudDrag() {
      this.hudDragging = false;
    },
    getNegativeAnimationDelay(nowSec, offsetSec, durationSec) {
      return -this.normalizePhase(nowSec - offsetSec, durationSec);
    },
    getNegativeMotionBegin(nowSec, offsetSec, durationSec) {
      return `${this.getNegativeAnimationDelay(nowSec, offsetSec, durationSec)}s`;
    },
    createRoutePath(from, to, index) {
      const fromPoint = this.adjustForHudZone(from.x, from.y, 2, `route-from-${index}`);
      const toPoint = this.adjustForHudZone(to.x, to.y, 2, `route-to-${index}`);
      const dx = toPoint.x - fromPoint.x;
      const dy = toPoint.y - fromPoint.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const bend = Math.min(16, 8 + distance * 0.12) * (index % 2 === 0 ? 1 : -1);
      const p1 = this.adjustForHudZone(fromPoint.x + dx * 0.32 + normalX * bend, fromPoint.y + dy * 0.18 + normalY * bend, 1, `route-c1-${index}`);
      const p2 = this.adjustForHudZone(fromPoint.x + dx * 0.68 + normalX * bend, fromPoint.y + dy * 0.82 + normalY * bend, 1, `route-c2-${index}`);
      return `M ${fromPoint.x} ${fromPoint.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${toPoint.x} ${toPoint.y}`;
    },
    async loadHome() {
      await common_appState.fetchLocations();
      try {
        this.trending = await common_api.getTrendingPlanes();
      } catch (error) {
        this.trending = [];
      }
      this.scheduleMeasureMapCanvas();
    },
    clearThemeRippleTimers() {
      if (this.themeRippleStartTimer) {
        clearTimeout(this.themeRippleStartTimer);
        this.themeRippleStartTimer = null;
      }
      if (this.themeRippleToggleTimer) {
        clearTimeout(this.themeRippleToggleTimer);
        this.themeRippleToggleTimer = null;
      }
      if (this.themeRippleFadeTimer) {
        clearTimeout(this.themeRippleFadeTimer);
        this.themeRippleFadeTimer = null;
      }
      if (this.themeRippleEndTimer) {
        clearTimeout(this.themeRippleEndTimer);
        this.themeRippleEndTimer = null;
      }
    },
    resetThemeRipple() {
      this.themeRippleVisible = false;
      this.themeRippleExpanding = false;
      this.themeRippleFading = false;
    },
    handleToggleTheme() {
      if (this.themeRippleVisible)
        return;
      this.clearThemeRippleTimers();
      this.themeRippleTarget = this.appState.theme === "dark" ? "light" : "dark";
      this.themeRippleVisible = true;
      this.themeRippleExpanding = false;
      this.themeRippleFading = false;
      this.themeRippleStartTimer = setTimeout(() => {
        this.themeRippleExpanding = true;
      }, 16);
      this.themeRippleToggleTimer = setTimeout(() => {
        common_appState.toggleTheme();
      }, 210);
      this.themeRippleFadeTimer = setTimeout(() => {
        this.themeRippleFading = true;
      }, 520);
      this.themeRippleEndTimer = setTimeout(() => {
        this.clearThemeRippleTimers();
        this.resetThemeRipple();
      }, 760);
    },
    goThrow() {
      common_vendor.index.reLaunch({
        url: "/pages/throw/index"
      });
    },
    goTrending() {
      common_vendor.index.reLaunch({
        url: "/pages/trending/index"
      });
    },
    goDiscover(name) {
      const locationName = String(name || "").trim();
      common_appState.setCurrentLocation(locationName);
      const url = locationName ? `/pages/discover/index?location=${encodeURIComponent(locationName)}` : "/pages/discover/index";
      common_vendor.index.reLaunch({
        url
      });
    },
    openDetail(id) {
      this.openPlaneDetail(id);
    },
    previewTrendImages(plane, currentIndex = 0) {
      const urls = ((plane == null ? void 0 : plane.imageUrls) || []).map((item) => common_api.getAssetUrl(item)).filter(Boolean);
      if (!urls.length)
        return;
      const safeIndex = Math.max(0, Math.min(currentIndex, urls.length - 1));
      common_vendor.index.previewImage({
        urls,
        current: urls[safeIndex]
      });
    },
    async handleRandom() {
      if (this.randomLoading)
        return;
      this.randomLoading = true;
      try {
        const plane = await common_api.getRandomPlane();
        this.openDetail(plane.id);
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "暂无飞机可拾取",
          icon: "none"
        });
      } finally {
        this.randomLoading = false;
      }
    },
    getPlaneAuthorLabelText(plane) {
      return common_utils.getPlaneAuthorLabel(plane);
    },
    getAssetUrl: common_api.getAssetUrl
  }
};
if (!Array) {
  const _component_shatter_headline = common_vendor.resolveComponent("shatter-headline");
  const _component_stop = common_vendor.resolveComponent("stop");
  const _component_linearGradient = common_vendor.resolveComponent("linearGradient");
  const _component_feGaussianBlur = common_vendor.resolveComponent("feGaussianBlur");
  const _component_feMergeNode = common_vendor.resolveComponent("feMergeNode");
  const _component_feMerge = common_vendor.resolveComponent("feMerge");
  const _component_filter = common_vendor.resolveComponent("filter");
  const _component_defs = common_vendor.resolveComponent("defs");
  const _component_path = common_vendor.resolveComponent("path");
  const _component_animateMotion = common_vendor.resolveComponent("animateMotion");
  const _component_circle = common_vendor.resolveComponent("circle");
  const _component_g = common_vendor.resolveComponent("g");
  const _component_svg = common_vendor.resolveComponent("svg");
  const _component_detail_open_transition = common_vendor.resolveComponent("detail-open-transition");
  const _component_page_transition = common_vendor.resolveComponent("page-transition");
  const _component_app_tabbar = common_vendor.resolveComponent("app-tabbar");
  (_component_shatter_headline + _component_stop + _component_linearGradient + _component_feGaussianBlur + _component_feMergeNode + _component_feMerge + _component_filter + _component_defs + _component_path + _component_animateMotion + _component_circle + _component_g + _component_svg + _component_detail_open_transition + _component_page_transition + _component_app_tabbar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.icons.throwActive,
    b: common_vendor.o((...args) => $options.handleToggleTheme && $options.handleToggleTheme(...args)),
    c: common_vendor.p({
      phrases: $data.headlinePhrases
    }),
    d: common_vendor.o((...args) => $options.goThrow && $options.goThrow(...args)),
    e: common_vendor.t($data.randomLoading ? "正在挑选" : "随机拾取"),
    f: common_vendor.o((...args) => $options.handleRandom && $options.handleRandom(...args)),
    g: common_vendor.t($options.totalPlanes),
    h: common_vendor.t($options.locations.length),
    i: common_vendor.t($options.topTrending.length),
    j: $data.icons.search,
    k: $data.query,
    l: common_vendor.o(($event) => $data.query = $event.detail.value),
    m: common_vendor.p({
      offset: "0%",
      ["stop-color"]: "rgba(47, 158, 116, 0.15)"
    }),
    n: common_vendor.p({
      offset: "45%",
      ["stop-color"]: "rgba(47, 158, 116, 0.95)"
    }),
    o: common_vendor.p({
      offset: "100%",
      ["stop-color"]: "rgba(242, 122, 75, 0.95)"
    }),
    p: common_vendor.p({
      id: "routeGradient",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%"
    }),
    q: common_vendor.p({
      stdDeviation: "1.2",
      result: "blur"
    }),
    r: common_vendor.p({
      in: "blur"
    }),
    s: common_vendor.p({
      in: "SourceGraphic"
    }),
    t: common_vendor.p({
      id: "routeGlow",
      x: "-50%",
      y: "-50%",
      width: "200%",
      height: "200%"
    }),
    v: common_vendor.f($options.signalRoutes, (route, k0, i0) => {
      return {
        a: `route-base-${route.id}`,
        b: route.width,
        c: route.opacity,
        d: "4978fed5-12-" + i0 + ",4978fed5-1",
        e: common_vendor.p({
          d: route.path
        })
      };
    }),
    w: common_vendor.f($options.signalRoutes, (route, k0, i0) => {
      return {
        a: `route-glow-${route.id}`,
        b: route.width,
        c: `${route.duration}s`,
        d: `${route.glowDelay}s`,
        e: "4978fed5-13-" + i0 + ",4978fed5-1",
        f: common_vendor.p({
          d: route.path
        })
      };
    }),
    x: common_vendor.f($options.signalRoutes, (route, k0, i0) => {
      return {
        a: "4978fed5-16-" + i0 + "," + ("4978fed5-15-" + i0),
        b: common_vendor.p({
          dur: `${route.duration}s`,
          begin: route.packetBegin,
          repeatCount: "indefinite",
          path: route.path
        }),
        c: "4978fed5-15-" + i0 + "," + ("4978fed5-14-" + i0),
        d: common_vendor.p({
          r: route.packetSize
        }),
        e: "4978fed5-18-" + i0 + "," + ("4978fed5-17-" + i0),
        f: common_vendor.p({
          dur: `${route.duration}s`,
          begin: route.secondaryPacketBegin,
          repeatCount: "indefinite",
          path: route.path
        }),
        g: "4978fed5-17-" + i0 + "," + ("4978fed5-14-" + i0),
        h: common_vendor.p({
          r: route.packetSize * 0.72
        }),
        i: `route-packet-${route.id}`,
        j: "4978fed5-14-" + i0 + ",4978fed5-1"
      };
    }),
    y: common_vendor.p({
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      ["aria-hidden"]: "true"
    }),
    z: common_vendor.t($options.totalPlanes),
    A: common_vendor.t($options.busiestLocationLabel),
    B: common_vendor.s($options.hudStyle),
    C: common_vendor.o((...args) => $options.startHudDrag && $options.startHudDrag(...args)),
    D: common_vendor.o((...args) => $options.moveHudDrag && $options.moveHudDrag(...args)),
    E: common_vendor.o((...args) => $options.endHudDrag && $options.endHudDrag(...args)),
    F: common_vendor.o((...args) => $options.endHudDrag && $options.endHudDrag(...args)),
    G: common_vendor.f($options.mapNodes, (node, index, i0) => {
      return common_vendor.e({
        a: node.loc.iconUrl ? $options.getAssetUrl(node.loc.iconUrl) : $data.icons.location,
        b: common_vendor.t(node.loc.name),
        c: !node.hideCount
      }, !node.hideCount ? {
        d: common_vendor.t(node.loc.planeCount)
      } : {}, {
        e: node.loc.id,
        f: `${node.x}%`,
        g: `${node.y}%`,
        h: `${node.size}px`,
        i: `${node.delay}s`,
        j: node.labelShift,
        k: common_vendor.o(($event) => $options.goDiscover(node.loc.name), node.loc.id)
      });
    }),
    H: common_vendor.n({
      "map-canvas-dense": $options.isDenseMap
    }),
    I: $options.topTrending.length
  }, $options.topTrending.length ? {
    J: common_vendor.o((...args) => $options.goTrending && $options.goTrending(...args)),
    K: common_vendor.f($options.topTrending, (plane, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(index + 1),
        b: common_vendor.t(plane.likeCount || 0),
        c: common_vendor.t(plane.content),
        d: common_vendor.t(plane.locationTag),
        e: common_vendor.t($options.getPlaneAuthorLabelText(plane)),
	        f: common_vendor.t(plane.likeCount),
	        g: plane.imageUrls && plane.imageUrls.length,
	        l: plane.imageUrls && plane.imageUrls.length === 1
      }, plane.imageUrls && plane.imageUrls.length ? {
        h: common_vendor.f(plane.imageUrls.slice(0, 3), (imageUrl, imageIndex, i1) => {
          return common_vendor.e({
            a: $options.getAssetUrl(imageUrl),
            b: imageIndex === 2 && plane.imageUrls.length > 3
          }, imageIndex === 2 && plane.imageUrls.length > 3 ? {
            c: common_vendor.t(plane.imageUrls.length - 3)
          } : {}, {
            d: plane.id + "-img-" + imageIndex,
            e: common_vendor.o(($event) => $options.previewTrendImages(plane, imageIndex), plane.id + "-img-" + imageIndex)
          });
        }),
        i: common_vendor.o(() => {
        }, plane.id)
      } : {}, {
        j: plane.id,
        k: common_vendor.o(($event) => $options.openDetail(plane.id), plane.id)
      });
    }),
    L: $data.icons.location
  } : {}, {
    M: $data.themeRippleVisible
  }, $data.themeRippleVisible ? {
    N: common_vendor.n($options.themeRippleThemeClass),
    O: common_vendor.n({
      "is-expand": $data.themeRippleExpanding,
      "is-fade": $data.themeRippleFading
    })
  } : {}, {
    P: common_vendor.p({
      visible: _ctx.detailOpenVisible,
      theme: $data.appState.theme
    }),
    Q: common_vendor.p({
      visible: _ctx.pageTransitionVisible,
      theme: $data.appState.theme
    }),
    R: common_vendor.p({
      active: "home",
      theme: $data.appState.theme
    }),
    S: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4978fed5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
