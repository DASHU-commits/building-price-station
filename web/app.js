(function () {
  'use strict';

  const CITIES = PriceData.CITIES;
  const MATERIALS = PriceData.MATERIALS;

  const CITY_COLORS = { '合肥': '#1668dc', '南京': '#e8a13c', '上海': '#d64545', '杭州': '#0e9aa7' };
  const MA_COLORS = { ma5: '#e8a13c', ma10: '#1668dc', ma20: '#0e9aa7' };
  const MA_NAMES = { ma5: 'MA5', ma10: 'MA10', ma20: 'MA20' };
  const UP = '#d64545';
  const DOWN = '#1f9d61';
  const PERIOD_NAMES = { daily: '日K', weekly: '周K', monthly: '月K' };
  const RANGE_NAMES = { 1: '近1月', 3: '近3月', 6: '近6月', 12: '近1年', 36: '近3年', 0: '全部' };
  const STORAGE_KEY = 'priceTool.data.v7';
  const DATA_VERSION = '20261015a';
  const DATA_URL_KEY = 'priceTool.dataUrl';
  const SOURCE_KEY = 'priceTool.source';

  function storageGet(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, value);
    } catch (e) {
      /* 本地文件或隐私模式下不可用，忽略即可 */
    }
  }

  function storageRemove(key) {
    try {
      if (window.localStorage) window.localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  }

  function loadInitialData() {
    try {
      const raw = storageGet(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.series && parsed.cities && parsed.materials && parsed.dataVersion === DATA_VERSION) {
          const currentIds = new Set(MATERIALS.map(m => m.id));
          const stillValid = parsed.materials.every(m => currentIds.has(m.id));
          if (stillValid) return parsed;
        }
      }
    } catch (e) {
      console.warn('读取本地数据失败', e);
    }
    return PriceData.buildDemoData();
  }

  const state = {
    data: loadInitialData(),
    source: storageGet(SOURCE_KEY) || 'demo',
    dataUrl: storageGet(DATA_URL_KEY) || '',
    view: 'market',
    city: '合肥',
    materialId: 'rebar',
    period: 'daily',
    rangeMonths: 36,
    mas: { ma5: true, ma10: true, ma20: true },
    priceMode: 'tax', // tax | noTax
    compareMaterialId: 'rebar',
    comparePeriod: 'daily',
    compareRangeMonths: 36,
    comparePriceMode: 'tax',
    materialSearch: ''
    ,categoryFilter: 'all'
    ,materialFamily: ''
  };

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function fmtPrice(v, dec) {
    const num = Number(v);
    if (!isFinite(num)) return '—';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function fmtPct(v, signed) {
    if (v == null || !isFinite(v)) return '—';
    const s = signed === false ? '' : (v > 0 ? '+' : '');
    return s + v.toFixed(2) + '%';
  }

  function fmtTick(v) {
    if (Math.abs(v) >= 1000) return Number(v.toFixed(0)).toLocaleString('zh-CN');
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  function shortDate(date) {
    return String(date).slice(5);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function roundNum(v, dec) {
    const p = Math.pow(10, dec);
    return Math.round(v * p) / p;
  }

  function modeValue(v, rate, dec, mode) {
    if (mode !== 'noTax' || !rate) return v;
    return roundNum(v / (1 + rate), dec);
  }

  function modeCandles(candles, rate, dec, mode) {
    if (mode !== 'noTax' || !rate) return candles;
    return candles.map(c => ({
      date: c.date,
      label: c.label,
      open: modeValue(c.open, rate, dec, mode),
      high: modeValue(c.high, rate, dec, mode),
      low: modeValue(c.low, rate, dec, mode),
      close: modeValue(c.close, rate, dec, mode)
    }));
  }

  // 渠道优先级：广材网优先，其次造价信息网、手动导入、示例数据
  const CHANNEL_PRIORITY = { '我的钢铁网': 5, '上海有色网': 5, '广材网': 4, '造价信息网': 3, '手动导入': 2, '示例数据': 1 };

  function channelPriority(source) {
    return CHANNEL_PRIORITY[source] != null ? CHANNEL_PRIORITY[source] : 1;
  }

  function detectChannel(text) {
    const t = String(text || '');
    if (t.includes('广材网') || t.includes('广材')) return '广材网';
    if (t.includes('造价信息') || t.includes('信息价网')) return '造价信息网';
    return '手动导入';
  }

  function getSeries(city, id) {
    const cm = state.data.series[city];
    return cm && cm[id] ? cm[id] : null;
  }

  function getMaterial(id) {
    return state.data.materials.find(m => m.id === id) || null;
  }

  function ensureSelectedMaterials() {
    const materials = state.data.materials || [];
    const ids = new Set(materials.map(m => m.id));
    if (!ids.has(state.materialId)) {
      state.materialId = materials[0] ? materials[0].id : '';
    }
    if (!ids.has(state.compareMaterialId)) {
      state.compareMaterialId = materials[0] ? materials[0].id : '';
    }
    const current = materials.find(m => m.id === state.materialId);
    if (current) state.materialFamily = current.name;
    const names = new Set(materials.map(m => m.name));
    if (!names.has(state.materialFamily)) {
      state.materialFamily = materials[0] ? materials[0].name : '';
    }
  }

  function isoWeekStart(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function aggregateSeries(rawSeries, period) {
    if (!rawSeries || !rawSeries.length) return [];
    if (period === 'daily') {
      return rawSeries.map(c => Object.assign({}, c, { label: c.date }));
    }

    const groups = [];
    let current = null;
    for (const c of rawSeries) {
      const groupKey = period === 'weekly' ? isoWeekStart(c.date) : c.date.slice(0, 7);
      if (!current || current.key !== groupKey) {
        current = {
          key: groupKey,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          date: c.date,
          first: c.date,
          count: 1
        };
        groups.push(current);
      } else {
        current.high = Math.max(current.high, c.high);
        current.low = Math.min(current.low, c.low);
        current.close = c.close;
        current.date = c.date;
        current.count += 1;
      }
    }
    return groups.map(g => ({
      date: g.date,
      open: g.open,
      high: g.high,
      low: g.low,
      close: g.close,
      label: period === 'weekly' ? (g.first + ' 至 ' + g.date) : (g.key + '月')
    }));
  }

  function cutoffDate(months) {
    if (!months || months <= 0) return '';
    const d = new Date(state.data.latestDate + 'T00:00:00');
    d.setMonth(d.getMonth() - months);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function filterByMonths(candles, months) {
    const cut = cutoffDate(months);
    return cut ? candles.filter(c => c.date >= cut) : candles;
  }

  function calcMA(candles, n) {
    return candles.map((c, i) => {
      if (i < n - 1) return null;
      let sum = 0;
      for (let j = i - n + 1; j <= i; j++) sum += candles[j].close;
      return { v: sum / n };
    });
  }

  function niceTicks(min, max, count) {
    const span = max - min;
    if (span <= 0) return [min];
    const step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    let step;
    if (norm <= 1) step = 1;
    else if (norm <= 2) step = 2;
    else if (norm <= 2.5) step = 2.5;
    else if (norm <= 5) step = 5;
    else step = 10;
    step *= mag;
    const start = Math.ceil(min / step) * step;
    const out = [];
    for (let v = start; v <= max + step * 0.001; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }

  function changePct(series, days) {
    if (!series || series.length < 2) return null;
    const latest = series[series.length - 1].close;
    const cutoff = new Date(state.data.latestDate + 'T00:00:00');
    cutoff.setDate(cutoff.getDate() - days);
    const cutStr = cutoff.getFullYear() + '-' + pad2(cutoff.getMonth() + 1) + '-' + pad2(cutoff.getDate());
    let prev = null;
    for (let i = series.length - 2; i >= 0; i--) {
      if (series[i].date <= cutStr) { prev = series[i].close; break; }
    }
    if (prev == null) prev = series[0].close;
    return (latest - prev) / prev * 100;
  }

  function latestInfo(city, id) {
    const s = getSeries(city, id);
    if (!s || !s.series.length) return null;
    const series = s.series;
    const last = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2].close : null;
    const rate = s.taxRate || 0;
    return {
      name: s.name,
      spec: s.spec,
      unit: s.unit,
      dec: s.dec,
      taxRate: rate,
      source: s.source || '示例数据',
      latest: modeValue(last.close, rate, s.dec, state.priceMode),
      latestTax: last.close,
      dayChg: prev != null ? (last.close - prev) / prev * 100 : null,
      weekChg: changePct(series, 7),
      monthChg: changePct(series, 30),
      yearChg: changePct(series, 365),
      date: last.date
    };
  }

  function renderCandles(container, candles, opts) {
    opts = opts || {};
    if (!candles || !candles.length) {
      container.innerHTML = '<div class="empty-chart">暂无数据</div>';
      return;
    }

    const width = Math.max(container.clientWidth || 760, 320);
    const height = opts.height || 400;
    const compact = !!opts.compact;
    const pad = { top: 14, right: compact ? 8 : 68, bottom: 24, left: compact ? 4 : 62 };
    const plotW = Math.max(40, width - pad.left - pad.right);
    const plotH = Math.max(60, height - pad.top - pad.bottom);
    const volH = compact ? 14 : Math.max(24, Math.round(plotH * 0.14));
    const priceH = plotH - volH - (compact ? 6 : 14);
    const n = candles.length;

    const maDefs = { ma5: 5, ma10: 10, ma20: 20 };
    const mas = [];
    let minV = Infinity;
    let maxV = -Infinity;
    for (const c of candles) {
      minV = Math.min(minV, c.low);
      maxV = Math.max(maxV, c.high);
    }
    for (const key of (opts.maKeys || [])) {
      const arr = calcMA(candles, maDefs[key]);
      const points = arr.filter(Boolean);
      if (points.length) {
        for (const p of points) {
          minV = Math.min(minV, p.v);
          maxV = Math.max(maxV, p.v);
        }
        mas.push({ key, arr });
      }
    }
    if (!isFinite(minV) || !isFinite(maxV)) {
      container.innerHTML = '<div class="empty-chart">暂无数据</div>';
      return;
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const range = maxV - minV;
    minV -= range * 0.07;
    maxV += range * 0.07;

    const step = plotW / n;
    const bodyW = Math.max(2, Math.min(compact ? 9 : 13, step * 0.62));
    const x = i => pad.left + step * i + step / 2;
    const y = v => pad.top + priceH - ((v - minV) / (maxV - minV)) * priceH;
    const volMax = Math.max.apply(null, candles.map(c => Math.max(0.0001, c.high - c.low)));
    const volTop = pad.top + priceH + (compact ? 4 : 12);
    const yVol = v => volTop + volH - (v / volMax) * volH;
    const ticks = niceTicks(minV, maxV, compact ? 3 : 5);
    const labelEvery = Math.max(1, Math.ceil(n / (compact ? 4 : 8)));
    const dec = opts.decimals || 0;

    let svg = '<svg class="kline" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="K线图">';

    for (const t of ticks) {
      const yy = y(t);
      svg += '<line class="kline-grid" x1="' + pad.left + '" y1="' + yy.toFixed(2) + '" x2="' + (width - pad.right) + '" y2="' + yy.toFixed(2) + '"/>';
      svg += '<text class="kline-axis" x="' + (pad.left - 8) + '" y="' + (yy + 4).toFixed(2) + '" text-anchor="end">' + fmtTick(t) + '</text>';
    }
    for (let i = 0; i < n; i += labelEvery) {
      const xx = x(i);
      svg += '<line class="kline-grid" x1="' + xx.toFixed(2) + '" y1="' + pad.top + '" x2="' + xx.toFixed(2) + '" y2="' + (pad.top + priceH + volH + (compact ? 4 : 12)) + '"/>';
      svg += '<text class="kline-axis" x="' + xx.toFixed(2) + '" y="' + (height - 6) + '" text-anchor="middle">' + shortDate(candles[i].date) + '</text>';
    }

    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const v = Math.max(0.0001, c.high - c.low);
      const yv = yVol(v);
      const hgt = Math.max(1, volTop + volH - yv);
      const up = c.close >= c.open;
      svg += '<rect x="' + (x(i) - bodyW / 2).toFixed(2) + '" y="' + yv.toFixed(2) + '" width="' + bodyW + '" height="' + hgt.toFixed(2) + '" rx="1" fill="' + (up ? UP : DOWN) + '" opacity="0.32"/>';
    }

    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const cx = x(i);
      const up = c.close >= c.open;
      const colorCls = up ? 'candle-up' : 'candle-down';
      const wickCls = up ? 'wick-up' : 'wick-down';
      svg += '<line class="' + wickCls + '" x1="' + cx.toFixed(2) + '" y1="' + y(c.high).toFixed(2) + '" x2="' + cx.toFixed(2) + '" y2="' + y(c.low).toFixed(2) + '"/>';
      const yo = y(c.open);
      const yc = y(c.close);
      const bodyTop = Math.min(yo, yc);
      const bodyH = Math.max(1.5, Math.abs(yo - yc));
      svg += '<rect class="' + colorCls + '" x="' + (cx - bodyW / 2).toFixed(2) + '" y="' + bodyTop.toFixed(2) + '" width="' + bodyW + '" height="' + bodyH.toFixed(2) + '" rx="1"/>';
    }

    for (const m of mas) {
      let d = '';
      for (let i = 0; i < m.arr.length; i++) {
        if (!m.arr[i]) continue;
        d += (d ? 'L' : 'M') + x(i).toFixed(2) + ' ' + y(m.arr[i].v).toFixed(2);
      }
      if (d) svg += '<path d="' + d + '" fill="none" stroke="' + MA_COLORS[m.key] + '" stroke-width="1.4" opacity="0.9"/>';
    }

    if (!compact && n > 0) {
      const last = candles[n - 1];
      const yy = y(last.close);
      svg += '<line class="last-line" x1="' + pad.left + '" y1="' + yy.toFixed(2) + '" x2="' + (width - pad.right) + '" y2="' + yy.toFixed(2) + '"/>';
      svg += '<rect x="' + (width - pad.right) + '" y="' + (yy - 9).toFixed(2) + '" width="' + (pad.right - 4) + '" height="18" rx="3" fill="#f5f7f9" stroke="#d4dae2"/>';
      svg += '<text class="last-label" x="' + (width - pad.right + 2) + '" y="' + (yy + 4).toFixed(2) + '" text-anchor="start">' + fmtPrice(last.close, dec) + '</text>';
    }

    svg += '<line id="crossV" class="cross-v" x1="0" y1="' + pad.top + '" x2="0" y2="' + (pad.top + priceH + volH) + '" visibility="hidden"/>';
    svg += '<line id="crossH" class="cross-h" x1="' + pad.left + '" y1="0" x2="' + (width - pad.right) + '" y2="0" visibility="hidden"/>';
    svg += '<rect id="hoverArea" x="' + pad.left + '" y="' + pad.top + '" width="' + plotW + '" height="' + plotH + '" fill="transparent"/>';
    svg += '</svg>';
    container.innerHTML = svg;

    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    tip.style.display = 'none';
    container.appendChild(tip);
    const crossV = container.querySelector('#crossV');
    const crossH = container.querySelector('#crossH');

    function updateTip(idx, mx, my) {
      const c = candles[idx];
      const cx = x(idx);
      crossV.setAttribute('x1', cx.toFixed(2));
      crossV.setAttribute('x2', cx.toFixed(2));
      crossV.setAttribute('visibility', 'visible');
      crossH.setAttribute('y1', my.toFixed(2));
      crossH.setAttribute('y2', my.toFixed(2));
      crossH.setAttribute('visibility', 'visible');
      const prev = candles[idx - 1];
      const chg = prev ? (c.close - prev.close) / prev.close * 100 : 0;
      const up = chg >= 0;
      const labelLine = c.label && c.label !== c.date ? '<div class="tip-date">' + esc(c.label) + '</div>' : '';
      tip.innerHTML =
        '<div class="tip-date">' + esc(c.date) + '</div>' + labelLine +
        '<div class="tip-row"><span>开</span><b>' + fmtPrice(c.open, dec) + '</b></div>' +
        '<div class="tip-row"><span>高</span><b>' + fmtPrice(c.high, dec) + '</b></div>' +
        '<div class="tip-row"><span>低</span><b>' + fmtPrice(c.low, dec) + '</b></div>' +
        '<div class="tip-row"><span>收</span><b>' + fmtPrice(c.close, dec) + '</b></div>' +
        '<div class="tip-chg ' + (up ? 'up' : 'down') + '">' + fmtPct(chg) + '</div>';
      tip.style.display = 'block';
      const tipW = tip.offsetWidth;
      const tipH = tip.offsetHeight;
      let left = cx + 10;
      if (left + tipW > width - 4) left = Math.max(4, cx - tipW - 10);
      tip.style.left = left + 'px';
      tip.style.top = clamp(my - tipH - 10, 4, height - tipH - 4) + 'px';
    }

    container.onmousemove = function (e) {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx < pad.left || mx > width - pad.right) return;
      const idx = clamp(Math.floor((mx - pad.left) / step), 0, n - 1);
      updateTip(idx, mx, my);
    };
    container.onmouseleave = function () {
      tip.style.display = 'none';
      crossV.setAttribute('visibility', 'hidden');
      crossH.setAttribute('visibility', 'hidden');
    };
  }

  // 价格走势折线图（默认图表）：单条价格折线 + 均线 + 悬浮十字线
  function renderLineChart(container, candles, opts) {
    opts = opts || {};
    if (!candles || !candles.length) {
      container.innerHTML = '<div class="empty-chart">暂无数据</div>';
      return;
    }
    const compact = !!opts.compact;
    const width = Math.max(container.clientWidth || 760, 280);
    const height = opts.height || 400;
    const pad = compact
      ? { top: 10, right: 44, bottom: 20, left: 38 }
      : { top: 16, right: 68, bottom: 28, left: 58 };
    const plotW = Math.max(40, width - pad.left - pad.right);
    const plotH = Math.max(60, height - pad.top - pad.bottom);

    const maDefs = { ma5: 5, ma10: 10, ma20: 20 };
    const mas = [];
    let minV = Infinity;
    let maxV = -Infinity;
    for (const c of candles) {
      minV = Math.min(minV, c.low);
      maxV = Math.max(maxV, c.high);
    }
    for (const key of (opts.maKeys || [])) {
      const arr = calcMA(candles, maDefs[key]);
      const pts = arr.filter(Boolean);
      if (pts.length) {
        for (const p of pts) {
          minV = Math.min(minV, p.v);
          maxV = Math.max(maxV, p.v);
        }
        mas.push({ key, arr });
      }
    }
    if (!isFinite(minV) || !isFinite(maxV)) {
      container.innerHTML = '<div class="empty-chart">暂无数据</div>';
      return;
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const span = maxV - minV;
    minV -= span * 0.08;
    maxV += span * 0.08;

    const n = candles.length;
    const step = plotW / n;
    const x = i => pad.left + step * i + step / 2;
    const y = v => pad.top + plotH - ((v - minV) / (maxV - minV)) * plotH;
    const ticks = niceTicks(minV, maxV, compact ? 3 : 5);
    const labelEvery = Math.max(1, Math.ceil(n / (compact ? 4 : 8)));
    const dec = opts.decimals || 0;
    const up = candles[n - 1].close >= candles[0].close;
    const lineColor = up ? UP : DOWN;

    let svg = '<svg class="kline" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="价格走势折线图">';
    for (const t of ticks) {
      const yy = y(t);
      svg += '<line class="kline-grid" x1="' + pad.left + '" y1="' + yy.toFixed(2) + '" x2="' + (width - pad.right) + '" y2="' + yy.toFixed(2) + '"/>';
      svg += '<text class="kline-axis" x="' + (pad.left - 6) + '" y="' + (yy + 4).toFixed(2) + '" text-anchor="end">' + fmtTick(t) + '</text>';
    }
    for (let i = 0; i < n; i += labelEvery) {
      const xx = x(i);
      svg += '<line class="kline-grid" x1="' + xx.toFixed(2) + '" y1="' + pad.top + '" x2="' + xx.toFixed(2) + '" y2="' + (pad.top + plotH) + '"/>';
      svg += '<text class="kline-axis" x="' + xx.toFixed(2) + '" y="' + (height - 6) + '" text-anchor="middle">' + shortDate(candles[i].date) + '</text>';
    }

    let linePath = '';
    for (let i = 0; i < n; i++) {
      linePath += (i ? 'L' : 'M') + x(i).toFixed(2) + ' ' + y(candles[i].close).toFixed(2);
    }
    const baseY = (pad.top + plotH).toFixed(2);
    const areaPath = linePath + 'L' + x(n - 1).toFixed(2) + ' ' + baseY + 'L' + x(0).toFixed(2) + ' ' + baseY + 'Z';
    svg += '<path d="' + areaPath + '" fill="' + lineColor + '" opacity="0.08"/>';
    svg += '<path d="' + linePath + '" fill="none" stroke="' + lineColor + '" stroke-width="' + (compact ? 1.8 : 2.2) + '" stroke-linejoin="round" stroke-linecap="round"/>';

    for (const m of mas) {
      let d = '';
      for (let i = 0; i < m.arr.length; i++) {
        if (!m.arr[i]) continue;
        d += (d ? 'L' : 'M') + x(i).toFixed(2) + ' ' + y(m.arr[i].v).toFixed(2);
      }
      if (d) svg += '<path d="' + d + '" fill="none" stroke="' + MA_COLORS[m.key] + '" stroke-width="1.4" opacity="0.9"/>';
    }

    const lastC = candles[n - 1];
    svg += '<circle cx="' + x(n - 1).toFixed(2) + '" cy="' + y(lastC.close).toFixed(2) + '" r="' + (compact ? 2.5 : 3.5) + '" fill="' + lineColor + '"/>';
    if (!compact) {
      const lastY = y(lastC.close);
      svg += '<line class="last-line" x1="' + pad.left + '" y1="' + lastY.toFixed(2) + '" x2="' + (width - pad.right) + '" y2="' + lastY.toFixed(2) + '"/>';
      svg += '<rect x="' + (width - pad.right) + '" y="' + (lastY - 9).toFixed(2) + '" width="' + (pad.right - 4) + '" height="18" rx="3" fill="#f5f7f9" stroke="#d4dae2"/>';
      svg += '<text class="last-label" x="' + (width - pad.right + 2) + '" y="' + (lastY + 4).toFixed(2) + '" text-anchor="start">' + fmtPrice(lastC.close, dec) + '</text>';
    }

    svg += '<line id="lineCrossV" class="cross-v" x1="0" y1="' + pad.top + '" x2="0" y2="' + (pad.top + plotH) + '" visibility="hidden"/>';
    svg += '<line id="lineCrossH" class="cross-h" x1="' + pad.left + '" y1="0" x2="' + (width - pad.right) + '" y2="0" visibility="hidden"/>';
    svg += '<rect id="lineHover" x="' + pad.left + '" y="' + pad.top + '" width="' + plotW + '" height="' + plotH + '" fill="transparent"/>';
    svg += '</svg>';
    container.innerHTML = svg;

    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    tip.style.display = 'none';
    container.appendChild(tip);
    const crossV = container.querySelector('#lineCrossV');
    const crossH = container.querySelector('#lineCrossH');

    container.onmousemove = function (e) {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx < pad.left || mx > width - pad.right) return;
      const idx = clamp(Math.floor((mx - pad.left) / step), 0, n - 1);
      const c = candles[idx];
      const cx = x(idx);
      crossV.setAttribute('x1', cx.toFixed(2));
      crossV.setAttribute('x2', cx.toFixed(2));
      crossV.setAttribute('visibility', 'visible');
      crossH.setAttribute('y1', my.toFixed(2));
      crossH.setAttribute('y2', my.toFixed(2));
      crossH.setAttribute('visibility', 'visible');
      const prev = candles[idx - 1];
      const chg = prev ? (c.close - prev.close) / prev.close * 100 : 0;
      const cls = chg >= 0 ? 'up' : 'down';
      tip.innerHTML =
        '<div class="tip-date">' + esc(c.date) + (c.label && c.label !== c.date ? '（' + esc(c.label) + '）' : '') + '</div>' +
        '<div class="tip-row"><span>价格</span><b>' + fmtPrice(c.close, dec) + '</b></div>' +
        '<div class="tip-row"><span>涨跌</span><b class="' + cls + '">' + fmtPct(chg) + '</b></div>' +
        '<div class="tip-row"><span>最高/最低</span><b>' + fmtPrice(c.high, dec) + ' / ' + fmtPrice(c.low, dec) + '</b></div>';
      tip.style.display = 'block';
      const tipW = tip.offsetWidth;
      const tipH = tip.offsetHeight;
      let left = cx + 10;
      if (left + tipW > width - 4) left = Math.max(4, cx - tipW - 10);
      tip.style.left = left + 'px';
      tip.style.top = clamp(my - tipH - 10, 4, height - tipH - 4) + 'px';
    };
    container.onmouseleave = function () {
      tip.style.display = 'none';
      crossV.setAttribute('visibility', 'hidden');
      crossH.setAttribute('visibility', 'hidden');
    };
  }

  function renderCompareLines(container, items, opts) {
    opts = opts || {};
    items = items.filter(it => it.candles && it.candles.length > 0);
    if (!items.length) {
      container.innerHTML = '<div class="empty-chart">暂无对比数据</div>';
      return;
    }

    const width = Math.max(container.clientWidth || 820, 320);
    const height = opts.height || 420;
    const pad = { top: 16, right: 78, bottom: 28, left: 58 };
    const plotW = Math.max(40, width - pad.left - pad.right);
    const plotH = height - pad.top - pad.bottom;

    const normItems = items.map(it => {
      const start = it.candles[0].close;
      return {
        name: it.name,
        color: it.color,
        start,
        candles: it.candles,
        points: it.candles.map(c => ({
          date: c.date,
          value: start ? 100 * c.close / start : 100,
          price: c.close
        }))
      };
    });

    const n = Math.max.apply(null, normItems.map(it => it.points.length));
    let minV = Infinity;
    let maxV = -Infinity;
    for (const it of normItems) {
      for (const p of it.points) {
        minV = Math.min(minV, p.value);
        maxV = Math.max(maxV, p.value);
      }
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const range = maxV - minV;
    minV -= range * 0.08;
    maxV += range * 0.08;

    const step = plotW / n;
    const x = i => pad.left + step * i + step / 2;
    const y = v => pad.top + plotH - ((v - minV) / (maxV - minV)) * plotH;
    const ticks = niceTicks(minV, maxV, 5);
    const labelEvery = Math.max(1, Math.ceil(n / 8));
    const baseCandles = normItems[0].candles;

    let svg = '<svg class="kline" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="城市对比图">';
    for (const t of ticks) {
      const yy = y(t);
      svg += '<line class="kline-grid" x1="' + pad.left + '" y1="' + yy.toFixed(2) + '" x2="' + (width - pad.right) + '" y2="' + yy.toFixed(2) + '"/>';
      svg += '<text class="kline-axis" x="' + (pad.left - 8) + '" y="' + (yy + 4).toFixed(2) + '" text-anchor="end">' + t.toFixed(1) + '</text>';
    }
    for (let i = 0; i < n; i += labelEvery) {
      const xx = x(i);
      svg += '<line class="kline-grid" x1="' + xx.toFixed(2) + '" y1="' + pad.top + '" x2="' + xx.toFixed(2) + '" y2="' + (pad.top + plotH) + '"/>';
      svg += '<text class="kline-axis" x="' + xx.toFixed(2) + '" y="' + (height - 6) + '" text-anchor="middle">' + shortDate(baseCandles[i] ? baseCandles[i].date : '') + '</text>';
    }

    for (const it of normItems) {
      let d = '';
      for (let i = 0; i < it.points.length; i++) {
        const p = it.points[i];
        d += (d ? 'L' : 'M') + x(i).toFixed(2) + ' ' + y(p.value).toFixed(2);
      }
      if (d) svg += '<path d="' + d + '" fill="none" stroke="' + it.color + '" stroke-width="2" opacity="0.92"/>';
    }
    if (n <= 90) {
      for (const it of normItems) {
        for (let i = 0; i < it.points.length; i++) {
          const p = it.points[i];
          svg += '<circle cx="' + x(i).toFixed(2) + '" cy="' + y(p.value).toFixed(2) + '" r="2.2" fill="' + it.color + '"/>';
        }
      }
    }

    svg += '<line id="cmpCrossV" class="cross-v" x1="0" y1="' + pad.top + '" x2="0" y2="' + (pad.top + plotH) + '" visibility="hidden"/>';
    svg += '<line id="cmpCrossH" class="cross-h" x1="' + pad.left + '" y1="0" x2="' + (width - pad.right) + '" y2="0" visibility="hidden"/>';
    svg += '<rect id="cmpHover" x="' + pad.left + '" y="' + pad.top + '" width="' + plotW + '" height="' + plotH + '" fill="transparent"/>';
    svg += '</svg>';
    container.innerHTML = svg;

    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    tip.style.display = 'none';
    container.appendChild(tip);
    const crossV = container.querySelector('#cmpCrossV');
    const crossH = container.querySelector('#cmpCrossH');

    container.onmousemove = function (e) {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx < pad.left || mx > width - pad.right) return;
      const idx = clamp(Math.floor((mx - pad.left) / step), 0, n - 1);
      const cx = x(idx);
      crossV.setAttribute('x1', cx.toFixed(2));
      crossV.setAttribute('x2', cx.toFixed(2));
      crossV.setAttribute('visibility', 'visible');
      crossH.setAttribute('y1', my.toFixed(2));
      crossH.setAttribute('y2', my.toFixed(2));
      crossH.setAttribute('visibility', 'visible');
      const date = baseCandles[idx] ? baseCandles[idx].date : '';
      let html = '<div class="tip-date">' + esc(date) + '</div>';
      for (const it of normItems) {
        const p = it.points[idx];
        if (!p) continue;
        const chg = (p.value - 100);
        const chgCls = chg >= 0 ? 'up' : 'down';
        html += '<div class="tip-city">' +
          '<span class="city-name">' + esc(it.name) + '</span>' +
          '<span class="city-val">' + fmtPrice(p.price, opts.decimals || 0) + '</span>' +
          '<span class="city-chg ' + chgCls + '">' + fmtPct(chg) + '</span>' +
          '</div>';
      }
      tip.innerHTML = html;
      tip.style.display = 'block';
      const tipW = tip.offsetWidth;
      const tipH = tip.offsetHeight;
      let left = cx + 10;
      if (left + tipW > width - 4) left = Math.max(4, cx - tipW - 10);
      tip.style.left = left + 'px';
      tip.style.top = clamp(my - tipH - 10, 4, height - tipH - 4) + 'px';
    };
    container.onmouseleave = function () {
      tip.style.display = 'none';
      crossV.setAttribute('visibility', 'hidden');
      crossH.setAttribute('visibility', 'hidden');
    };
  }

  function renderCitySeg() {
    const box = $('#citySeg');
    box.innerHTML = CITIES.map(c =>
      '<button type="button" class="seg-btn' + (state.city === c ? ' active' : '') + '" data-city="' + c + '">' + c + '</button>'
    ).join('');
    box.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.city = btn.dataset.city;
        renderMarket();
      });
    });
  }

  function renderPriceModeSeg() {
    const box = $('#priceModeSeg');
    const modes = [
      { value: 'tax', label: '含税价' },
      { value: 'noTax', label: '不含税价' }
    ];
    box.innerHTML = modes.map(m =>
      '<button type="button" class="seg-btn' + (state.priceMode === m.value ? ' active' : '') + '" data-mode="' + m.value + '">' + m.label + '</button>'
    ).join('');
    box.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.priceMode = btn.dataset.mode;
        renderMarket();
      });
    });
  }

  function renderCategorySeg() {
    const box = $('#categorySeg');
    const options = [
      { value: 'all', label: '全部' },
      { value: '钢材', label: '钢材' },
      { value: '地材', label: '地材' },
      { value: '安装材料', label: '安装材料' }
    ];
    box.innerHTML = options.map(o =>
      '<button type="button" class="seg-btn' + (state.categoryFilter === o.value ? ' active' : '') + '" data-category="' + o.value + '">' + o.label + '</button>'
    ).join('');
    box.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.categoryFilter = btn.dataset.category;
        renderCategorySeg();
        renderMaterialList();
      });
    });
  }

  function renderPeriodSeg() {
    const box = $('#periodSeg');
    const periods = [
      { value: 'daily', label: '日K' },
      { value: 'weekly', label: '周K' },
      { value: 'monthly', label: '月K' }
    ];
    box.innerHTML = periods.map(p =>
      '<button type="button" class="seg-btn' + (state.period === p.value ? ' active' : '') + '" data-period="' + p.value + '">' + p.label + '</button>'
    ).join('');
    box.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.period = btn.dataset.period;
        renderMarket();
      });
    });
  }

  function renderMaterialList() {
    const kw = state.materialSearch.trim().toLowerCase();
    const box = $('#materialList');
    const families = [];
    const familyMap = {};
    for (const m of state.data.materials) {
      if (state.categoryFilter !== 'all' && m.category !== state.categoryFilter) continue;
      if (kw && !(m.name + ' ' + m.spec + ' ' + m.id).toLowerCase().includes(kw)) continue;
      if (!familyMap[m.name]) {
        familyMap[m.name] = { name: m.name, category: m.category, items: [] };
        families.push(familyMap[m.name]);
      }
      familyMap[m.name].items.push(m);
    }
    let html = '';
    for (const family of families) {
      const prices = [];
      for (const m of family.items) {
        const info = latestInfo(state.city, m.id);
        if (info) prices.push(info.latest);
      }
      const first = family.items[0];
      let range = '—';
      if (prices.length && first) {
        const min = Math.min.apply(null, prices);
        const max = Math.max.apply(null, prices);
        range = min === max ? fmtPrice(min, first.dec) : fmtPrice(min, first.dec) + ' ~ ' + fmtPrice(max, first.dec);
      }
      html += '<button type="button" class="mat-item' + (state.materialFamily === family.name ? ' active' : '') + '" data-family="' + esc(family.name) + '">' +
        '<span><span class="mat-name">' + esc(family.name) + '</span><span class="mat-spec">' + esc(family.category || '') + ' · ' + family.items.length + ' 个规格</span></span>' +
        '<span class="mat-price">' + range + '<small>' + esc(first ? first.unit : '') + '</small></span></button>';
    }
    box.innerHTML = html || '<div class="empty-chart">未找到材料</div>';
    box.querySelectorAll('.mat-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const family = families.find(f => f.name === btn.dataset.family);
        if (!family) return;
        state.materialFamily = family.name;
        if (!family.items.some(m => m.id === state.materialId)) {
          state.materialId = family.items[0].id;
        }
        renderMarket();
      });
    });
  }

  function renderSpecChips() {
    const box = $('#specChips');
    if (!box) return;
    const family = (state.data.materials || []).filter(m => m.name === state.materialFamily);
    box.innerHTML = family.map(m =>
      '<button type="button" class="spec-chip' + (state.materialId === m.id ? ' active' : '') + '" data-id="' + esc(m.id) + '">' + esc(m.spec) + '</button>'
    ).join('');
    box.querySelectorAll('.spec-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.materialId = btn.dataset.id;
        renderMarketChartOnly();
        renderSpecChips();
        renderPriceTable();
      });
    });
  }

  function visibleCandles() {
    const raw = getSeries(state.city, state.materialId);
    if (!raw) return [];
    const candles = filterByMonths(aggregateSeries(raw.series, state.period), state.rangeMonths);
    return modeCandles(candles, raw.taxRate || 0, raw.dec, state.priceMode);
  }

  function computeMarketStats(candles) {
    const raw = getSeries(state.city, state.materialId);
    if (!raw || !candles.length) return null;
    const last = candles[candles.length - 1];
    const first = candles[0];
    const prev = candles.length > 1 ? candles[candles.length - 2] : null;
    let sum = 0;
    let high = -Infinity;
    let low = Infinity;
    for (const c of candles) {
      sum += c.close;
      high = Math.max(high, c.high);
      low = Math.min(low, c.low);
    }
    return {
      latest: last.close,
      prevClose: prev ? prev.close : null,
      dayChg: prev ? (last.close - prev.close) / prev.close * 100 : null,
      weekChg: changePct(raw.series, 7),
      monthChg: changePct(raw.series, 30),
      high,
      low,
      avg: sum / candles.length,
      rangeChg: (last.close - first.close) / first.close * 100
    };
  }

  function renderQuoteStrip() {
    const raw = getSeries(state.city, state.materialId);
    const candles = visibleCandles();
    const stats = computeMarketStats(candles);
    const box = $('#quoteStrip');
    const mat = getMaterial(state.materialId);
    const dec = raw ? raw.dec : 0;
    if (!stats) {
      box.innerHTML = '<div class="q-card"><div class="q-label">暂无数据</div></div>';
      return;
    }
    const dayCls = stats.dayChg >= 0 ? 'up' : 'down';
    const items = [
      { label: '最新价', value: fmtPrice(stats.latest, dec), cls: '' },
      { label: '较昨日', value: fmtPct(stats.dayChg), cls: dayCls },
      { label: '近一周', value: fmtPct(stats.weekChg), cls: stats.weekChg >= 0 ? 'up' : 'down' },
      { label: '近一月', value: fmtPct(stats.monthChg), cls: stats.monthChg >= 0 ? 'up' : 'down' },
      { label: '区间最高', value: fmtPrice(stats.high, dec), cls: '' },
      { label: '区间最低', value: fmtPrice(stats.low, dec), cls: '' },
      { label: '区间均价', value: fmtPrice(stats.avg, dec), cls: '' }
    ];
    box.innerHTML = items.map(it =>
      '<div class="q-card"><div class="q-label">' + it.label + '</div><div class="q-value ' + it.cls + '">' + it.value + '</div></div>'
    ).join('');
    $('#chartTitle').textContent = mat ? mat.name + ' ' + (mat.spec || '') : state.materialId;
    const modeLabel = state.priceMode === 'tax' ? '含税价' : '不含税价';
    $('#chartSub').textContent = state.city + ' · ' + PERIOD_NAMES[state.period] + ' · ' + RANGE_NAMES[state.rangeMonths] + ' · ' + modeLabel + ' · 税率 ' + (((raw && raw.taxRate) || 0) * 100).toFixed(0) + '%' + ' · 来源 ' + ((raw && raw.source) || '示例数据') + ' · 渠道 ' + ((mat && mat.channel) || '广材网');
    const activeMas = Object.keys(MA_NAMES).filter(k => state.mas[k]);
    $('#maLegend').innerHTML = activeMas.map(k =>
      '<span class="legend-item"><span class="legend-dot" style="background:' + MA_COLORS[k] + '"></span>' + MA_NAMES[k] + '</span>'
    ).join('') + '<span class="legend-item"><span class="legend-dot" style="background:' + UP + '"></span>涨</span><span class="legend-item"><span class="legend-dot" style="background:' + DOWN + '"></span>跌</span>';
  }

  function renderPriceChart() {
    const raw = getSeries(state.city, state.materialId);
    const container = $('#candleChart');
    if (!raw || !raw.series.length) {
      container.innerHTML = '<div class="empty-chart">该城市暂无此材料数据</div>';
      return;
    }
    const candles = visibleCandles();
    if (!candles.length) {
      container.innerHTML = '<div class="empty-chart">所选时间范围内暂无数据</div>';
      return;
    }
    const activeMas = Object.keys(MA_NAMES).filter(k => state.mas[k]);
    const height = window.innerWidth <= 720 ? 300 : 400;
    renderLineChart(container, candles, { maKeys: activeMas, decimals: raw.dec, height });
  }

  function renderMarketChartOnly() {
    renderQuoteStrip();
    renderPriceChart();
  }

  function renderMarket() {
    ensureSelectedMaterials();
    renderCitySeg();
    renderCategorySeg();
    renderPriceModeSeg();
    renderPeriodSeg();
    renderMaterialList();
    renderSpecChips();
    renderMarketChartOnly();
    renderPriceTable();
    $('#tableCityLabel').textContent = state.city + ' · ' + state.materialFamily;
  }

  function chipHtml(chg) {
    if (chg == null || !isFinite(chg)) return '<span class="chip flat">—</span>';
    const cls = chg > 0.0001 ? 'up' : (chg < -0.0001 ? 'down' : 'flat');
    return '<span class="chip ' + cls + '">' + fmtPct(chg) + '</span>';
  }

  function renderPriceTable() {
    const rows = [];
    for (const m of state.data.materials) {
      if (m.name !== state.materialFamily) continue;
      const info = latestInfo(state.city, m.id);
      if (!info) continue;
      rows.push(Object.assign({}, info, { id: m.id, channel: m.channel, category: m.category }));
    }
    const head = '<thead><tr><th>规格</th><th>单位</th><th class="num">税率</th><th>渠道</th><th class="num">最新价</th><th class="num">日涨跌</th><th class="num">周涨跌</th><th class="num">月涨跌</th></tr></thead>';
    const body = rows.map(r =>
      '<tr data-id="' + esc(r.id) + '" class="' + (r.id === state.materialId ? 'active-row' : '') + '"><td class="mat-cell">' + esc(r.spec) + '</td><td>' + esc(r.unit) + '</td>' +
      '<td class="num">' + (((r.taxRate || 0) * 100).toFixed(0)) + '%</td>' +
      '<td>' + esc(r.channel || '广材网') + '</td>' +
      '<td class="num">' + fmtPrice(r.latest, r.dec) + '</td>' +
      '<td class="num">' + chipHtml(r.dayChg) + '</td>' +
      '<td class="num">' + chipHtml(r.weekChg) + '</td>' +
      '<td class="num">' + chipHtml(r.monthChg) + '</td></tr>'
    ).join('');
    $('#priceTable').innerHTML = head + '<tbody>' + (body || '<tr><td colspan="8">暂无数据</td></tr>') + '</tbody>';
    $('#priceTable').querySelectorAll('tbody tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        state.materialId = tr.dataset.id;
        renderMarketChartOnly();
        renderSpecChips();
        renderPriceTable();
      });
    });

    const cards = rows.map(r =>
      '<div class="price-card' + (r.id === state.materialId ? ' active' : '') + '" data-id="' + esc(r.id) + '">' +
      '<div class="price-card-head"><div><div class="price-card-name">' + esc(r.spec) + '</div>' +
      '<div class="price-card-spec">' + esc(r.unit || '') + ' · ' + esc(r.channel || '广材网') + '</div></div>' +
      '<div class="price-card-price">' + fmtPrice(r.latest, r.dec) + '</div></div>' +
      '<div class="price-card-meta"><span class="label">日</span>' + chipHtml(r.dayChg) +
      '<span class="label">周</span>' + chipHtml(r.weekChg) +
      '<span class="label">月</span>' + chipHtml(r.monthChg) +
      '<span class="label">税率 ' + (((r.taxRate || 0) * 100).toFixed(0)) + '%</span></div>' +
      '</div>'
    ).join('');
    $('#priceCards').innerHTML = cards;
    $('#priceCards').querySelectorAll('.price-card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        state.materialId = card.dataset.id;
        renderMarketChartOnly();
        renderSpecChips();
        renderPriceTable();
      });
    });
  }

  function renderCompareSelects() {
    const sel = $('#compareMaterialSelect');
    sel.innerHTML = state.data.materials.map(m =>
      '<option value="' + esc(m.id) + '"' + (state.compareMaterialId === m.id ? ' selected' : '') + '>' + esc(m.category || '') + ' · ' + esc(m.name) + ' ' + esc(m.spec || '') + '</option>'
    ).join('');
    $('#comparePeriodSelect').value = state.comparePeriod;
    $('#compareRangeSelect').value = String(state.compareRangeMonths);
    $('#comparePriceModeSelect').value = state.comparePriceMode;
  }

  function renderCompare() {
    ensureSelectedMaterials();
    renderCompareSelects();
    const mat = getMaterial(state.compareMaterialId);
    if (!mat) {
      $('#compareChart').innerHTML = '<div class="empty-chart">暂无数据</div>';
      $('#compareTable').innerHTML = '';
      $('#miniGrid').innerHTML = '';
      return;
    }
    const items = [];
    const rows = [];
    for (const city of CITIES) {
      const raw = getSeries(city, mat.id);
      const info = latestInfo(city, mat.id);
      if (!raw || !info) {
        rows.push({ city, price: '—', day: null, month: null, year: null, range: null, dec: 0 });
        continue;
      }
      const candles = modeCandles(
        filterByMonths(aggregateSeries(raw.series, state.comparePeriod), state.compareRangeMonths),
        raw.taxRate || 0,
        raw.dec,
        state.comparePriceMode
      );
      if (candles.length) {
        items.push({ name: city, color: CITY_COLORS[city] || '#5b6472', candles });
      }
      const rangeChg = candles.length > 1
        ? (candles[candles.length - 1].close - candles[0].close) / candles[0].close * 100
        : null;
      rows.push({
        city,
        price: modeValue(info.latestTax, info.taxRate || 0, info.dec, state.comparePriceMode),
        dec: info.dec,
        rate: info.taxRate,
        day: info.dayChg,
        month: info.monthChg,
        year: info.yearChg,
        range: rangeChg
      });
    }

    const mat2 = getMaterial(state.compareMaterialId);
    $('#compareSub').textContent = (mat2 ? mat2.name + ' ' + (mat2.spec || '') : '') + ' · ' + PERIOD_NAMES[state.comparePeriod] + ' · ' + RANGE_NAMES[state.compareRangeMonths] + ' · ' + (state.comparePriceMode === 'tax' ? '含税价' : '不含税价');
    $('#compareLegend').innerHTML = items.map(it =>
      '<span class="legend-item"><span class="legend-dot" style="background:' + it.color + '"></span>' + it.name + '</span>'
    ).join('');
    renderCompareLines($('#compareChart'), items, { decimals: rows[0] ? rows[0].dec : 0, height: 420 });

    const head = '<thead><tr><th>城市</th><th class="num">最新价</th><th class="num">税率</th><th class="num">较昨日</th><th class="num">区间涨跌</th><th class="num">近1月</th><th class="num">近1年</th></tr></thead>';
    const body = rows.map(r =>
      '<tr><td><span class="city-dot" style="background:' + (CITY_COLORS[r.city] || '#5b6472') + '"></span> ' + r.city + '</td>' +
      '<td class="num">' + (r.price === '—' ? '—' : fmtPrice(r.price, r.dec)) + '</td>' +
      '<td class="num">' + (((r.rate || 0) * 100).toFixed(0)) + '%</td>' +
      '<td class="num">' + chipHtml(r.day) + '</td>' +
      '<td class="num">' + chipHtml(r.range) + '</td>' +
      '<td class="num">' + chipHtml(r.month) + '</td>' +
      '<td class="num">' + chipHtml(r.year) + '</td></tr>'
    ).join('');
    $('#compareTable').innerHTML = head + '<tbody>' + body + '</tbody>';

    $('#miniGrid').innerHTML = CITIES.map(city => {
      const raw = getSeries(city, mat.id);
      const info = latestInfo(city, mat.id);
      const candles = raw ? modeCandles(
        filterByMonths(aggregateSeries(raw.series, state.comparePeriod), state.compareRangeMonths),
        raw.taxRate || 0,
        raw.dec,
        state.comparePriceMode
      ) : [];
      const chg = info && info.dayChg != null ? info.dayChg : null;
      const chgCls = chg != null ? (chg >= 0 ? 'up' : 'down') : 'flat';
      return '<div class="mini-card">' +
        '<div class="mini-head"><span class="mini-city"><span class="city-dot" style="background:' + (CITY_COLORS[city] || '#5b6472') + '"></span>' + city + '</span>' +
        '<span class="mini-price">' + (info ? fmtPrice(modeValue(info.latestTax, info.taxRate || 0, info.dec, state.comparePriceMode), info.dec) : '—') + '</span></div>' +
        '<div class="mini-chg ' + chgCls + '">较昨日 ' + (chg != null ? fmtPct(chg) : '—') + '</div>' +
        '<div class="mini-chart" data-mini="' + city + '"></div>' +
        '</div>';
    }).join('');
    CITIES.forEach(city => {
      const el = document.querySelector('[data-mini="' + city + '"]');
      if (!el) return;
      const raw = getSeries(city, mat.id);
      const candles = raw ? filterByMonths(aggregateSeries(raw.series, state.comparePeriod), state.compareRangeMonths) : [];
      renderLineChart(el, candles, { height: 180, compact: true, decimals: raw ? raw.dec : 0 });
    });
  }

  const HEADER_RULES = [
    { keys: ['日期', '时间', 'date', '发布日', '时间日期'], col: 'date' },
    { keys: ['城市', '地区', 'city', '市场'], col: 'city' },
    { keys: ['材料', '品名', '名称', '项目', 'material', '产品'], col: 'material' },
    { keys: ['规格', '型号', 'spec', '牌号', '规格型号'], col: 'spec' },
    { keys: ['单位', 'unit'], col: 'unit' },
    { keys: ['来源', '渠道', 'source', '数据来源'], col: 'source' },
    { keys: ['含税价'], col: 'priceTax' },
    { keys: ['不含税价'], col: 'priceNoTax' },
    { keys: ['税率'], col: 'taxRate' },
    { keys: ['价格', '单价', '市场价', '信息价', 'price'], col: 'price' },
    { keys: ['开盘', 'open'], col: 'open' },
    { keys: ['最高', 'high'], col: 'high' },
    { keys: ['最低', 'low'], col: 'low' },
    { keys: ['收盘', 'close'], col: 'close' }
  ];

  function normalizeHeader(h) {
    return String(h).toLowerCase().replace(/[\s（）()【】\[\]：:，,、._-]/g, '');
  }

  function detectDelimiter(line) {
    const tab = (line.match(/\t/g) || []).length;
    const comma = (line.match(/,/g) || []).length;
    const ccomma = (line.match(/，/g) || []).length;
    if (tab && tab >= Math.max(comma, ccomma)) return '\t';
    if (ccomma > comma) return '，';
    return ',';
  }

  function stripQuotes(v) {
    return String(v).replace(/^["']|["']$/g, '').trim();
  }

  function matchHeaderCol(h) {
    const key = normalizeHeader(h);
    for (const rule of HEADER_RULES) {
      if (rule.keys.some(k => key === k.toLowerCase())) return rule.col;
    }
    for (const rule of HEADER_RULES) {
      if (rule.keys.some(k => /^[a-z]+$/.test(k) && key.includes(k))) return rule.col;
    }
    for (const rule of HEADER_RULES) {
      if (rule.keys.some(k => k.length <= 2 && key.includes(k.toLowerCase()))) return rule.col;
    }
    return null;
  }

  function parseDelimitedRows(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const delim = detectDelimiter(lines[0]);
    const header = lines[0].split(delim).map(stripQuotes);
    const map = {};
    header.forEach((h, i) => {
      const col = matchHeaderCol(h);
      if (col) map[col] = i;
    });
    if (map.date === undefined || (map.price === undefined && map.priceTax === undefined && map.priceNoTax === undefined && map.close === undefined)) return null;
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(delim).map(stripQuotes);
      rows.push(cells);
    }
    return { map, rows, header };
  }

  function parseDateStr(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return null;
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return m[1] + '-' + pad2(Number(m[2])) + '-' + pad2(Number(m[3]));
    m = s.match(/(\d{1,2})月(\d{1,2})[日号]?/);
    if (m) {
      const year = state.data.latestDate ? Number(state.data.latestDate.slice(0, 4)) : new Date().getFullYear();
      return year + '-' + pad2(Number(m[1])) + '-' + pad2(Number(m[2]));
    }
    return null;
  }

  function slugId(name) {
    let h = 2166136261;
    const s = String(name || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 'm' + (h >>> 0).toString(36);
  }

  function matchMaterialName(text) {
    const t = String(text || '').trim();
    if (!t) return { id: slugId('未识别材料'), name: '未识别材料', spec: '', unit: '', dec: 0 };
    let best = null;
    for (const m of MATERIALS) {
      if (t.includes(m.name) && (!best || m.name.length > best.name.length)) best = m;
    }
    if (best) return best;
    const cleaned = t.replace(/[，,、;；:：()（）【】\[\]]/g, '').trim();
    return { id: slugId(cleaned), name: cleaned, spec: '', unit: '', dec: 0 };
  }

  // 同名材料按规格精确匹配，避免不同管径/厚度被归到同一条
  function matchMaterialForRecord(name, spec) {
    const text = String(name || '').trim();
    const specText = String(spec || '').trim();
    const candidates = MATERIALS.filter(m => text.includes(m.name));
    if (candidates.length) {
      if (specText) {
        const exact = candidates.find(m => m.spec === specText)
          || candidates.find(m => specText.indexOf(m.spec) >= 0 || m.spec.indexOf(specText) >= 0);
        if (exact) return exact;
      }
      return candidates[0];
    }
    const cleaned = text.replace(/[，,、;；:：()（）【】\[\]]/g, '').trim();
    return {
      id: slugId(cleaned + '|' + specText),
      name: cleaned,
      spec: specText,
      unit: '',
      tax: 0.13,
      dec: 0,
      category: '',
      channel: '手动导入'
    };
  }

  const SPEC_PATTERNS = [
    'HRB400E', 'HPB300', 'P\\.?O42\\.5', 'Φ[\\d.\\-×xX]+', '[\\d.]+mm', 'C\\d{2,3}',
    'DN[\\d.]+', 'SBS', 'XPS', 'YJV[\\s\\w×-]*', 'B06', 'A3\\.5', '5\\+9A\\+5',
    '1830×915×15', '70#', '800×800'
  ];

  function parseLineRecord(line, defaultCity) {
    const text = line.trim();
    if (!text) return null;
    const city = CITIES.find(c => text.includes(c)) || defaultCity;
    const date = parseDateStr(text);
    const nums = Array.from(text.matchAll(/\d+(?:\.\d+)?/g)).map(x => parseFloat(x[0]));
    if (!nums.length) return null;
    const price = nums[nums.length - 1];
    const mat = matchMaterialName(text);
    let spec = '';
    for (const p of SPEC_PATTERNS) {
      const m = text.match(new RegExp(p));
      if (m) { spec = m[0]; break; }
    }
    const unitMatch = text.match(/元\/([^\s0-9]+)/);
    const unit = unitMatch ? unitMatch[1] : '';
    return {
      date,
      city,
      material: mat.name,
      spec: spec || mat.spec || '',
      unit: unit || mat.unit || '',
      price,
      priceNoTax: null,
      taxRate: mat.tax || 0.13,
      source: detectChannel(text),
      open: null,
      high: null,
      low: null,
      close: null
    };
  }

  function parseImportedText(text, defaultCity) {
    const clean = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return { records: [], errors: ['没有可解析的内容'], sample: [] };

    const records = [];
    const errors = [];
    const tsv = parseDelimitedRows(clean);
    if (tsv) {
      const { map, rows } = tsv;
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i];
        const get = col => (col !== undefined && cells[col] !== undefined) ? cells[col] : '';
        const date = parseDateStr(get(map.date));
        const taxRaw = get(map.priceTax !== undefined ? map.priceTax : (map.price !== undefined ? map.price : map.close));
        const noTaxRaw = get(map.priceNoTax);
        const rateRaw = get(map.taxRate);
        let price = parseFloat(String(taxRaw).replace(/[^\d.\-]/g, ''));
        let priceNoTax = parseFloat(String(noTaxRaw).replace(/[^\d.\-]/g, ''));
        let taxRate = parseFloat(String(rateRaw).replace(/[^\d.]/g, '')) / 100;
        if (!isFinite(taxRate) || taxRate <= 0 || taxRate >= 1) taxRate = null;
        if (!isFinite(price) && isFinite(priceNoTax)) {
          price = roundNum(priceNoTax * (1 + (taxRate || 0.13)), 2);
        }
        if (!isFinite(priceNoTax) && isFinite(price)) {
          priceNoTax = roundNum(price / (1 + (taxRate || 0.13)), 2);
        }
        const cityRaw = get(map.city);
        const city = cityRaw || defaultCity;
        if (!date) { errors.push('第 ' + (i + 2) + ' 行：日期无法识别'); continue; }
        if (!isFinite(price)) { errors.push('第 ' + (i + 2) + ' 行：价格无法识别'); continue; }
        if (!CITIES.includes(city)) { errors.push('第 ' + (i + 2) + ' 行：未知城市 ' + city); continue; }
        const num = v => {
          const n = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, ''));
          return isFinite(n) ? n : null;
        };
        records.push({
          date,
          city,
          material: get(map.material) || '未识别材料',
          spec: get(map.spec),
          unit: get(map.unit),
          price,
          priceNoTax,
          taxRate,
          source: get(map.source) || '手动导入',
          open: num(get(map.open)),
          high: num(get(map.high)),
          low: num(get(map.low)),
          close: num(get(map.close))
        });
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        const rec = parseLineRecord(lines[i], defaultCity);
        if (!rec) { errors.push('第 ' + (i + 1) + ' 行：无法解析'); continue; }
        if (!rec.date) { errors.push('第 ' + (i + 1) + ' 行：日期无法识别'); continue; }
        records.push(rec);
      }
    }
    return {
      records,
      errors,
      sample: records.slice(0, 12)
    };
  }

  function recordsToDataset(records) {
    const meta = {};
    const order = [];
    const cityMap = {};
    for (const r of records) {
      if (!CITIES.includes(r.city) || !r.date || !isFinite(r.price)) continue;
      const base = matchMaterialForRecord(r.material, r.spec);
      const id = base.id;
      if (!meta[id]) {
        meta[id] = {
          id,
          name: base.name,
          spec: r.spec || base.spec || '',
          unit: r.unit || base.unit || '',
          taxRate: r.taxRate != null ? r.taxRate : (base.tax || 0.13),
          channel: base.channel || '广材网',
          category: base.category || '',
          dec: (r.taxRate != null && r.taxRate > 0) ? 2 : (Number.isInteger(r.price) ? 0 : 2)
        };
        order.push(id);
      } else {
        if (r.spec && !meta[id].spec) meta[id].spec = r.spec;
        if (r.unit && !meta[id].unit) meta[id].unit = r.unit;
        if (r.taxRate != null) meta[id].taxRate = r.taxRate;
        if ((r.taxRate != null && r.taxRate > 0) || !Number.isInteger(r.price)) meta[id].dec = 2;
      }
      if (!cityMap[r.city]) cityMap[r.city] = {};
      if (!cityMap[r.city][id]) cityMap[r.city][id] = { points: {} };
      const o = r.open != null ? r.open : r.price;
      const h = r.high != null ? r.high : r.price;
      const l = r.low != null ? r.low : r.price;
      const c = r.close != null ? r.close : r.price;
      const source = r.source || '手动导入';
      const priority = channelPriority(source);
      const points = cityMap[r.city][id].points;
      const existing = points[r.date];
      if (!existing || priority >= existing.priority) {
        points[r.date] = { date: r.date, open: o, high: h, low: l, close: c, source, priority };
      }
    }

    const series = {};
    let latestDate = '';
    for (const city of CITIES) {
      series[city] = {};
      const cm = cityMap[city] || {};
      for (const id of order) {
        const entry = cm[id];
        if (!entry) continue;
        const dates = Object.keys(entry.points).sort();
        const list = dates.map(d => entry.points[d]);
        let bestSource = list.length ? (list[0].source || '手动导入') : '手动导入';
        for (const p of list) {
          if (channelPriority(p.source) > channelPriority(bestSource)) bestSource = p.source;
        }
        series[city][id] = {
          name: meta[id].name,
          spec: meta[id].spec,
          unit: meta[id].unit,
          dec: meta[id].dec,
          taxRate: meta[id].taxRate,
          source: bestSource,
          series: list
        };
        if (list.length && list[list.length - 1].date > latestDate) latestDate = list[list.length - 1].date;
      }
    }
    return {
      cities: CITIES.slice(),
      materials: order.map(id => ({
        id,
        name: meta[id].name,
        spec: meta[id].spec,
        unit: meta[id].unit,
        dec: meta[id].dec,
        taxRate: meta[id].taxRate,
        channel: meta[id].channel,
        category: meta[id].category
      })),
      series,
      latestDate
    };
  }

  function renderImportPreview(result) {
    const box = $('#importPreview');
    box.classList.remove('hidden');
    const good = result.records.length;
    const bad = result.errors.length;
    const rows = result.sample.map(r => {
      const rate = r.taxRate || 0.13;
      const noTax = r.priceNoTax != null ? r.priceNoTax : roundNum(r.price / (1 + rate), 2);
      return '<tr><td>' + esc(r.date) + '</td><td>' + esc(r.city) + '</td><td>' + esc(r.material) + '</td><td class="spec-cell">' + esc(r.spec || '') + '</td><td>' + esc(r.unit || '') + '</td><td class="num">' + (rate * 100).toFixed(0) + '%</td><td>' + esc(r.source || '手动导入') + '</td><td class="num">' + fmtPrice(r.price, Number.isInteger(r.price) ? 0 : 2) + '</td><td class="num">' + fmtPrice(noTax, 2) + '</td></tr>';
    }).join('');
    box.innerHTML =
      '<div class="preview-stats">' +
      '<span class="preview-stat good">识别成功 <b>' + good + '</b> 条</span>' +
      '<span class="preview-stat ' + (bad ? 'bad' : 'good') + '">待处理 <b>' + bad + '</b> 条</span>' +
      '<span class="preview-stat">覆盖城市 <b>' + new Set(result.records.map(r => r.city)).size + '</b> 个</span>' +
      '</div>' +
      '<div class="preview-actions">' +
      '<button id="applyImportBtn" class="btn primary" type="button">应用到行情</button>' +
      '<button id="resetDemoBtn" class="btn ghost" type="button">恢复示例数据</button>' +
      '</div>' +
      '<div class="table-scroll"><table class="data-table"><thead><tr><th>日期</th><th>城市</th><th>材料</th><th>规格</th><th>单位</th><th class="num">税率</th><th>来源</th><th class="num">含税价</th><th class="num">不含税价</th></tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="9">无有效记录</td></tr>') + '</tbody></table></div>' +
      (bad ? '<div class="error-list">' + result.errors.slice(0, 20).map(e => '<div>' + esc(e) + '</div>').join('') + '</div>' : '');

    $('#applyImportBtn').addEventListener('click', () => {
      if (!result.records.length) {
        showToast('没有可应用的有效记录', 'err');
        return;
      }
      state.data = recordsToDataset(result.records);
      state.source = 'import';
      if (!state.data.materials.find(m => m.id === state.materialId)) {
        state.materialId = state.data.materials[0] ? state.data.materials[0].id : 'rebar';
      }
      if (!state.data.materials.find(m => m.id === state.compareMaterialId)) {
        state.compareMaterialId = state.data.materials[0] ? state.data.materials[0].id : 'rebar';
      }
      saveLocalData();
      renderAll();
      showToast('已应用 ' + result.records.length + ' 条记录', 'ok');
    });
    $('#resetDemoBtn').addEventListener('click', resetDemo);
  }

  function resetDemo() {
    state.data = PriceData.buildDemoData();
    state.source = 'demo';
    state.materialId = 'rebar';
    state.compareMaterialId = 'rebar';
    PriceData.extendSeriesToDate(state.data, PriceData.todayStr());
    saveLocalData();
    renderAll();
    showToast('已恢复示例数据', 'ok');
  }

  function exportCSV() {
    const rows = [['日期', '城市', '材料', '规格', '单位', '税率', '来源', '开盘', '最高', '最低', '收盘']];
    for (const city of state.data.cities) {
      for (const m of state.data.materials) {
        const s = getSeries(city, m.id);
        if (!s) continue;
        const rate = s.taxRate || 0;
        for (const c of s.series) {
          rows.push([
            c.date, city, s.name, s.spec, s.unit,
            (rate * 100).toFixed(0) + '%',
            s.source || '示例数据',
            modeValue(c.open, rate, s.dec, state.priceMode),
            modeValue(c.high, rate, s.dec, state.priceMode),
            modeValue(c.low, rate, s.dec, state.priceMode),
            modeValue(c.close, rate, s.dec, state.priceMode)
          ]);
        }
      }
    }
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '建材价格_' + state.data.latestDate + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 300);
    showToast('已导出 CSV', 'ok');
  }

  function showToast(msg, type) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.add('hidden'), 2600);
  }

  function updateSourceBadge() {
    const badge = $('#sourceBadge');
    if (state.source === 'import') {
      badge.textContent = '已导入数据';
      badge.classList.add('imported');
    } else {
      badge.textContent = '示例数据';
      badge.classList.remove('imported');
    }
  }

  function saveLocalData() {
    state.data.dataVersion = DATA_VERSION;
    storageSet(STORAGE_KEY, JSON.stringify(state.data));
    storageSet(SOURCE_KEY, state.source);
  }

  // 合并两份数据：同一天同材料按渠道优先级取数（广材网 > 造价信息网 > 手动导入 > 示例数据）
  function mergeDatasets(primary, fallback) {
    const out = {
      cities: (primary.cities || fallback.cities || CITIES).slice(),
      materials: [],
      series: {},
      latestDate: ''
    };
    for (const city of out.cities) {
      out.series[city] = {};
      const pa = (primary.series && primary.series[city]) || {};
      const fb = (fallback.series && fallback.series[city]) || {};
      const ids = new Set(Object.keys(pa).concat(Object.keys(fb)));
      for (const id of ids) {
        const a = pa[id];
        const b = fb[id];
        if (!a) { out.series[city][id] = b; continue; }
        if (!b) { out.series[city][id] = a; continue; }
        const byDate = {};
        for (const p of b.series) byDate[p.date] = { point: p, priority: channelPriority(p.source || b.source) };
        for (const p of a.series) {
          const priority = channelPriority(p.source || a.source);
          if (!byDate[p.date] || priority >= byDate[p.date].priority) {
            byDate[p.date] = { point: p, priority };
          }
        }
        const list = Object.keys(byDate).sort().map(d => byDate[d].point);
        out.series[city][id] = Object.assign({}, a, { series: list });
      }
    }
    const matMap = {};
    for (const m of (fallback.materials || [])) matMap[m.id] = m;
    for (const m of (primary.materials || [])) matMap[m.id] = m;
    out.materials = Object.keys(matMap).map(id => matMap[id]);
    let latest = '';
    for (const city of out.cities) {
      for (const id of Object.keys(out.series[city])) {
        const s = out.series[city][id];
        if (s.series && s.series.length) {
          const d = s.series[s.series.length - 1].date;
          if (d > latest) latest = d;
        }
      }
    }
    out.latestDate = latest;
    return out;
  }

  function renderUpdateStatus(message) {
    const badge = $('#updateBadge');
    if (badge) {
      badge.textContent = state.data.latestDate ? '更新至 ' + state.data.latestDate : '未更新';
    }
    const box = $('#updateStatus');
    if (box) {
      box.innerHTML =
        '<div class="update-line">当前数据截止：' + esc(state.data.latestDate || '—') + '</div>' +
        '<div class="update-line">自动检查：打开页面、每30分钟、跨天时' + (message ? '（' + esc(message) + '）' : '') + '</div>' +
        '<div class="update-line">外部数据源：' + esc(state.dataUrl || '未配置（使用内置数据自动延续）') + '</div>';
    }
    const input = $('#dataUrlInput');
    if (input && document.activeElement !== input) input.value = state.dataUrl || '';
  }

  async function autoUpdate(manual) {
    let changed = false;
    const before = state.data.latestDate;
    let message = '';
    let externalLoaded = false;
    const embedded = (typeof window !== 'undefined' && window.EMBEDDED_PRICES && Array.isArray(window.EMBEDDED_PRICES.records))
      ? window.EMBEDDED_PRICES
      : null;
    const defaultUrl = (typeof location !== 'undefined' && /^https?:/.test(location.protocol)) ? 'data/latest.json' : '';
    const candidateUrl = state.dataUrl || defaultUrl;
    const isDefaultCandidate = !state.dataUrl && !!defaultUrl;

    // 离线打开（file://）时优先使用单文件里内嵌的每日数据
    if (embedded && typeof location !== 'undefined' && location.protocol === 'file:') {
      state.data = mergeDatasets(recordsToDataset(embedded.records), state.data);
      state.source = 'import';
      externalLoaded = true;
      changed = true;
      message = '离线数据 ' + (embedded.latestDate || '');
    } else if (candidateUrl) {
      try {
        const bust = (candidateUrl.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
        const res = await fetch(candidateUrl + bust, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const payload = await res.json();
        const records = Array.isArray(payload) ? payload : (payload.records || []);
        if (records.length) {
          const ds = recordsToDataset(records);
          state.data = mergeDatasets(ds, state.data);
          state.source = 'import';
          state.data.dataVersion = DATA_VERSION;
          externalLoaded = true;
          changed = true;
          message = '已同步外部数据源';
        }
      } catch (e) {
        if (embedded && embedded.records.length) {
          state.data = mergeDatasets(recordsToDataset(embedded.records), state.data);
          state.source = 'import';
          externalLoaded = true;
          changed = true;
          message = '离线数据 ' + (embedded.latestDate || '');
        } else if (!isDefaultCandidate) {
          console.warn('外部数据源更新失败：', e);
          message = '外部数据源暂不可用';
          if (manual) showToast('外部数据源更新失败，已使用本地数据', 'err');
        }
      }
    }

    // 只有没有真实数据源时才用内置行情向后延续，避免在真实价格后面生成模拟价
    if (!externalLoaded && state.source !== 'import') {
      PriceData.extendSeriesToDate(state.data, PriceData.todayStr());
      if (state.data.latestDate !== before) changed = true;
    }

    if (changed) {
      saveLocalData();
      updateSourceBadge();
      renderAll();
    }
    renderUpdateStatus(message);
    if (manual) {
      if (message === '外部数据源暂不可用') return;
      showToast(changed ? ('已更新至 ' + state.data.latestDate) : ('数据已是最新（' + (state.data.latestDate || '—') + '）'), 'ok');
    }
  }

  function scheduleAutoUpdate() {
    autoUpdate(false);
    setInterval(() => autoUpdate(false), 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) autoUpdate(false);
    });
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 5, 0);
    setTimeout(() => {
      autoUpdate(false);
      setInterval(() => autoUpdate(false), 24 * 60 * 60 * 1000);
    }, nextMidnight - now);
  }

  function switchView(name) {
    state.view = name;
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    if (name === 'market') renderMarket();
    else if (name === 'compare') renderCompare();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() {
    ensureSelectedMaterials();
    updateSourceBadge();
    if (state.view === 'market') renderMarket();
    else if (state.view === 'compare') renderCompare();
  }

  function initEvents() {
    $$('.tab').forEach(t => t.addEventListener('click', () => switchView(t.dataset.view)));
    $('#goImportBtn').addEventListener('click', () => switchView('import'));
    $('#exportBtn').addEventListener('click', exportCSV);
    $('#refreshBtn').addEventListener('click', () => autoUpdate(true));
    $('#saveDataUrlBtn').addEventListener('click', () => {
      const url = $('#dataUrlInput').value.trim();
      state.dataUrl = url;
      if (url) storageSet(DATA_URL_KEY, url);
      else storageRemove(DATA_URL_KEY);
      autoUpdate(true);
    });
    $('#clearDataUrlBtn').addEventListener('click', () => {
      state.dataUrl = '';
      storageRemove(DATA_URL_KEY);
      $('#dataUrlInput').value = '';
      renderUpdateStatus('已清除外部数据源');
      showToast('已清除外部数据源', 'ok');
    });
    $('#materialSearch').addEventListener('input', e => {
      state.materialSearch = e.target.value;
      renderMaterialList();
    });

    // ===== 全网比价（京东/淘宝） =====
    const WS_SOURCES = [
      { key: 'jd', name: '京东', cls: 'src-jd', check: /item\.jd\.com|\d+\.jd\.com|jkcsjd/, url: k => 'https://search.jd.com/Search?keyword=' + encodeURIComponent(k) + '&enc=utf8' },
      { key: 'tb', name: '淘宝', cls: 'src-tb', check: /item\.taobao\.com|detail\.tmall\.com|m\.tb\.cn|detail\.liangxinyao/, url: k => 'https://s.taobao.com/search?q=' + encodeURIComponent(k) }
    ];
    let wsToken = 0;
    let WS_FC_URL = '';
    try {
      const fcParam = new URLSearchParams(location.search).get('fc');
      if (fcParam) localStorage.setItem('bpsFcProxy', fcParam.trim().replace(/\/+$/, ''));
      WS_FC_URL = (localStorage.getItem('bpsFcProxy') || '').replace(/\/+$/, '');
    } catch (e) {}

    async function wsFetchFC(kw, srcKey) {
      if (!WS_FC_URL) throw new Error('fc not configured');
      const r = await fetch(WS_FC_URL + '/api/search?src=' + srcKey + '&kw=' + encodeURIComponent(kw));
      if (!r.ok) throw new Error('FC HTTP ' + r.status);
      const j = await r.json();
      if (!(j && j.ok && Array.isArray(j.items))) throw new Error('FC bad response');
      return j.items
        .filter(it => it && it.title && it.url && isFinite(Number(it.price)) && Number(it.price) > 0)
        .map(it => ({ title: String(it.title), price: Number(it.price), img: it.img || '', url: it.url, source: WS_SOURCES.find(s => s.key === srcKey) }))
        .filter(it => it.source);
    }

    async function wsSearchSource(kw, src) {
      try { return await wsFetchFC(kw, src.key); }
      catch (e) {
        const md = await wsFetchText(src.url(kw));
        return wsParseProducts(md, src);
      }
    }

    async function wsFetchText(url) {
      const attempts = [
        'https://api.cors.lol/?url=' + encodeURIComponent(url),
        'https://r.jina.ai/' + url,
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
        'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url),
        'https://corsproxy.io/?url=' + encodeURIComponent(url)
      ];
      let lastErr = null;
      for (const p of attempts) {
        try {
          const r = await fetch(p, { headers: { 'Accept': 'text/plain, text/html;q=0.9, */*;q=0.8' } });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const t = await r.text();
          if (t && t.length > 400) return t;
          throw new Error('empty response');
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('fetch failed');
    }

    function wsParseProducts(md, source) {
      const items = [];
      const seen = new Set();
      const re = /\[([^\]\n]{4,140})\]\(((?:https?:)?\/\/[^\s)]+)\)/g;
      let m;
      while ((m = re.exec(md)) !== null) {
        const url = m[2];
        if (!source.check.test(url)) continue;
        const norm = url.split('?')[0].replace(/^https?:/, '');
        if (seen.has(norm)) continue;
        const win = md.slice(Math.max(0, m.index - 700), m.index + m[0].length + 500);
        const imgM = win.match(/!\[[^\]]*\]\(\s*((?:https?:)?\/\/[^\s)]*(?:360buyimg|alicdn|taobaocdn)[^\s)]*)\s*\)/);
        const pM = win.match(/[¥￥]\s?([\d,]+(?:\.\d{1,2})?)/) || win.match(/\b([\d,]{3,7}\.\d{2})\b/);
        if (!pM) continue;
        const price = Number(pM[1].replace(/,/g, ''));
        const title = m[1].replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
        if (!title || title.length < 4 || !isFinite(price) || price < 1) continue;
        seen.add(norm);
        items.push({
          title,
          url: url.startsWith('//') ? 'https:' + url : url,
          price,
          img: imgM ? (imgM[1].startsWith('//') ? 'https:' + imgM[1] : imgM[1]) : '',
          source
        });
      }
      return items;
    }

    function wsRender(items, statusHtml) {
      $('#webSearchResults').innerHTML = items.length ? items.map(it =>
        '<a class="ws-card" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="ws-img-box">' + (it.img
            ? '<img loading="lazy" src="' + esc(it.img) + '" alt="" onerror="this.parentElement.innerHTML=&quot;<div class=ws-noimg>暂无图片</div>&quot;">'
            : '<div class="ws-noimg">暂无图片</div>') + '</div>' +
          '<div class="ws-title">' + esc(it.title) + '</div>' +
          '<div class="ws-meta"><span class="ws-badge ' + it.source.cls + '">' + esc(it.source.name) + '</span>' +
          '<span class="ws-price">¥' + fmtPrice(it.price, it.price % 1 ? 2 : 0) + '</span></div>' +
        '</a>'
      ).join('') : '<div class="empty-chart">未找到相关商品，可换个关键词重试</div>';
      $('#webSearchStatus').innerHTML = statusHtml;
    }

    async function runWebSearch(kw) {
      kw = (kw || '').trim();
      if (!kw) { showToast('请先输入搜索关键词', 'err'); return; }
      const panel = $('#webSearchPanel');
      panel.classList.remove('hidden');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const token = ++wsToken;
      $('#webSearchGo').disabled = true;
      $('#webSearchStatus').textContent = '正在从京东 / 淘宝抓取“' + kw + '”的相关商品，请稍候…';
      $('#webSearchResults').innerHTML = '<div class="empty-chart">搜索中，请稍候…</div>';
      const settled = await Promise.allSettled(WS_SOURCES.map(async src => ({ src, items: await wsSearchSource(kw, src) })));
      if (token !== wsToken) return;
      $('#webSearchGo').disabled = false;
      const notes = [];
      const buckets = [];
      settled.forEach((s, idx) => {
        const src = WS_SOURCES[idx];
        if (s.status === 'fulfilled' && s.value.items.length) {
          buckets.push(s.value.items);
          notes.push(esc(src.name) + ' ' + s.value.items.length + ' 条');
        } else {
          notes.push(esc(src.name) + ' 抓取失败（可能需登录/限流/网络拦截） · <a href="' + esc(src.url(kw)) + '" target="_blank" rel="noopener">直达' + esc(src.name) + '搜索</a>');
        }
      });
      const merged = [];
      for (let i = 0; merged.length < 20; i++) {
        let pushed = false;
        for (const b of buckets) { if (b[i]) { merged.push(b[i]); pushed = true; if (merged.length >= 20) break; } }
        if (!pushed) break;
      }
      wsRender(merged, '“' + esc(kw) + '”搜索结果：' + notes.join(' · ') + (merged.length ? '，共展示 ' + merged.length + ' 条' : ''));
    }

    $('#webSearchBtn').addEventListener('click', () => {
      const kw = state.materialSearch.trim();
      $('#webSearchKw').value = kw;
      runWebSearch(kw);
    });
    $('#webSearchGo').addEventListener('click', () => runWebSearch($('#webSearchKw').value));
    $('#webSearchKw').addEventListener('keydown', e => { if (e.key === 'Enter') runWebSearch(e.target.value); });
    $('#rangeSelect').addEventListener('change', e => {
      state.rangeMonths = Number(e.target.value);
      renderMarketChartOnly();
    });
    $('#maToggles').addEventListener('change', e => {
      const key = e.target.dataset.ma;
      if (key) state.mas[key] = e.target.checked;
      renderMarketChartOnly();
    });
    $('#compareMaterialSelect').addEventListener('change', e => {
      state.compareMaterialId = e.target.value;
      renderCompare();
    });
    $('#comparePeriodSelect').addEventListener('change', e => {
      state.comparePeriod = e.target.value;
      renderCompare();
    });
    $('#compareRangeSelect').addEventListener('change', e => {
      state.compareRangeMonths = Number(e.target.value);
      renderCompare();
    });
    $('#comparePriceModeSelect').addEventListener('change', e => {
      state.comparePriceMode = e.target.value;
      renderCompare();
    });
    $('#parseBtn').addEventListener('click', () => {
      const text = $('#importText').value;
      if (!text.trim()) {
        showToast('请先粘贴或输入数据', 'err');
        return;
      }
      const result = parseImportedText(text, state.city);
      renderImportPreview(result);
      if (!result.records.length) showToast('未识别到有效记录，请检查格式', 'err');
    });
    $('#clearImportBtn').addEventListener('click', () => {
      $('#importText').value = '';
      $('#importPreview').classList.add('hidden');
    });
    $('#fileBtn').addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        $('#importText').value = String(reader.result || '');
        $('#parseBtn').click();
      };
      reader.readAsText(file, 'utf-8');
    });
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.view === 'market') renderMarketChartOnly();
        else if (state.view === 'compare') renderCompare();
      }, 160);
    });
  }

  initEvents();
  renderAll();
  scheduleAutoUpdate();
})();
