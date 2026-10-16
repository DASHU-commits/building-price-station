/**
 * 建材价格每日更新脚本（无第三方依赖）
 *
 * 用法：
 *   node server/daily-update.js
 *
 * 数据源在 server/sources.json 中配置，支持：
 *   - json：远程 URL 或本地文件，内容为记录数组或 { records: [...] }
 *   - csv ：远程 URL 或本地 CSV/TSV 文件
 *   - guangcai：抓取广材网页面表格（需要登录 Cookie，放在环境变量 GUANGCAI_COOKIE）
 *
 * 输出：web/data/latest.json，页面可通过“每日自动更新”里的数据地址读取。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'sources.json');
const CHANNEL_PRIORITY = { 我的钢铁网: 5, 上海有色网: 5, 广材网: 4, 造价信息网: 3, 手动导入: 2, 示例数据: 1 };

function log(...args) {
  const line = '[' + new Date().toLocaleString('zh-CN') + '] ' + args.join(' ');
  console.log(line);
  try {
    fs.appendFileSync(path.join(__dirname, 'daily-update.log'), line + '\n', 'utf8');
  } catch (e) {
    /* 日志写入失败不影响更新 */
  }
}

function channelPriority(source) {
  return CHANNEL_PRIORITY[source] != null ? CHANNEL_PRIORITY[source] : 1;
}

function roundNum(v, dec) {
  const p = Math.pow(10, dec);
  return Math.round(v * p) / p;
}

function stripTags(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHeader(h) {
  return stripTags(h).toLowerCase().replace(/[\s（）()【】\[\]：:，,、._-]/g, '');
}

function matchHeaderCol(header) {
  const key = normalizeHeader(header);
  const rules = [
    { keys: ['日期', '时间', 'date', '发布日'], col: 'date' },
    { keys: ['城市', '地区', 'city', '市场'], col: 'city' },
    { keys: ['材料', '品名', '名称', 'material', '产品'], col: 'material' },
    { keys: ['规格', '型号', 'spec', '牌号'], col: 'spec' },
    { keys: ['单位', 'unit'], col: 'unit' },
    { keys: ['含税价'], col: 'price' },
    { keys: ['不含税价'], col: 'priceNoTax' },
    { keys: ['税率'], col: 'taxRate' },
    { keys: ['来源', '渠道', 'source'], col: 'source' },
    { keys: ['价格', '单价', '市场价', '信息价', 'price'], col: 'price' }
  ];
  for (const rule of rules) {
    if (rule.keys.some(k => key === k.toLowerCase())) return rule.col;
  }
  for (const rule of rules) {
    if (rule.keys.some(k => /^[a-z]+$/.test(k) && key.includes(k))) return rule.col;
  }
  for (const rule of rules) {
    if (rule.keys.some(k => k.length <= 2 && key.includes(k.toLowerCase()))) return rule.col;
  }
  return null;
}

function parseDate(value) {
  const s = stripTags(value);
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
  m = s.match(/(\d{1,2})月(\d{1,2})[日号]?/);
  if (m) {
    const year = new Date().getFullYear();
    return year + '-' + String(m[1]).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0');
  }
  return null;
}

function toNumber(value) {
  const n = parseFloat(String(value == null ? '' : value).replace(/[^\d.\-]/g, ''));
  return isFinite(n) ? n : null;
}

function normalizeRecord(raw, fallback) {
  fallback = fallback || {};
  const price = toNumber(raw.price != null ? raw.price : raw.close);
  const priceNoTax = toNumber(raw.priceNoTax);
  let taxRate = toNumber(raw.taxRate);
  if (taxRate != null && taxRate > 1) taxRate = taxRate / 100;
  if (taxRate == null && price != null && priceNoTax != null && priceNoTax > 0) {
    taxRate = roundNum((price - priceNoTax) / priceNoTax, 4);
  }
  return {
    date: parseDate(raw.date),
    city: raw.city || fallback.city || '合肥',
    material: raw.material || fallback.material || '未识别材料',
    spec: raw.spec || '',
    unit: raw.unit || '',
    price,
    priceNoTax,
    taxRate,
    source: raw.source || fallback.channel || '手动导入'
  };
}

function parseCsv(text, fallback) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const delim = lines[0].includes('\t') ? '\t' : (lines[0].includes('，') ? '，' : ',');
  const header = lines[0].split(delim).map(s => s.trim().replace(/^["']|["']$/g, ''));
  const map = {};
  header.forEach((h, i) => {
    const col = matchHeaderCol(h);
    if (col) map[col] = i;
  });
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delim).map(s => s.trim().replace(/^["']|["']$/g, ''));
    const get = col => (col !== undefined && cells[col] !== undefined) ? cells[col] : '';
    const rec = normalizeRecord({
      date: get(map.date),
      city: get(map.city),
      material: get(map.material),
      spec: get(map.spec),
      unit: get(map.unit),
      price: get(map.price),
      priceNoTax: get(map.priceNoTax),
      taxRate: get(map.taxRate),
      source: get(map.source)
    }, fallback);
    if (rec.date && rec.price != null) records.push(rec);
  }
  return records;
}

function parseGuangcaiHtml(html, fallback) {
  const records = [];
  const rows = String(html).match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  let map = null;
  for (const row of rows) {
    const cells = (row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(stripTags);
    if (!cells.length) continue;
    if (!map) {
      const candidate = {};
      cells.forEach((cell, i) => {
        const col = matchHeaderCol(cell);
        if (col) candidate[col] = i;
      });
      if (candidate.material && (candidate.price !== undefined || candidate.priceNoTax !== undefined) && candidate.date !== undefined) {
        map = candidate;
        continue;
      }
      continue;
    }
    const get = col => (col !== undefined && cells[col] !== undefined) ? cells[col] : '';
    const rec = normalizeRecord({
      date: get(map.date),
      city: get(map.city),
      material: get(map.material),
      spec: get(map.spec),
      unit: get(map.unit),
      price: get(map.price),
      priceNoTax: get(map.priceNoTax),
      taxRate: get(map.taxRate),
      source: get(map.source)
    }, fallback);
    if (rec.date && rec.price != null) records.push(rec);
  }
  return records;
}

// 解析我的钢铁网城市页公开的螺纹钢价格
function parseMysteelHtml(html, city, source) {
  const match = String(html).match(/螺纹钢[\s\S]{0,60}?<\/strong>\s*&nbsp;\s*(\d+)/);
  if (!match) return null;
  const price = Number(match[1]);
  if (!isFinite(price)) return null;
  const now = new Date();
  const date = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  return {
    date,
    city,
    material: source.material || '螺纹钢',
    spec: source.spec || 'HRB400E Φ20',
    unit: '元/吨',
    price,
    priceNoTax: null,
    taxRate: 0.13,
    source: source.channel || '我的钢铁网'
  };
}

async function readText(source) {
  if (source.url) {
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
    if (source.cookieEnv && process.env[source.cookieEnv]) {
      headers.Cookie = process.env[source.cookieEnv];
    }
    const res = await fetch(source.url, { headers });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + source.url);
    return await res.text();
  }
  const file = path.resolve(__dirname, source.path);
  return fs.readFileSync(file, 'utf8');
}

async function loadSource(source) {
  if (!source.enabled) {
    // autoIfExists：文件存在时自动启用（例如广材网导出的 CSV）
    if (!(source.autoIfExists && source.path)) return [];
    const candidate = path.resolve(__dirname, source.path);
    if (!fs.existsSync(candidate)) return [];
    log('检测到本地导出文件，自动启用：' + source.name);
  }
  log('读取数据源：' + source.name);
  if (source.type === 'mysteel-public') {
    const records = [];
    for (const city of Object.keys(source.cities || {})) {
      try {
        const html = await readText({ url: source.cities[city] });
        const rec = parseMysteelHtml(html, city, source);
        if (rec) {
          records.push(rec);
          log('  ' + city + ' 螺纹钢：' + rec.price + ' 元/吨');
        } else {
          log('  ' + city + ' 未解析到螺纹钢价格');
        }
      } catch (err) {
        log('  ' + city + ' 抓取失败：' + err.message);
      }
    }
    return records;
  }
  const text = await readText(source);
  if (source.type === 'json') {
    const payload = JSON.parse(text);
    const list = Array.isArray(payload) ? payload : (payload.records || []);
    return list.map(item => normalizeRecord(item, source)).filter(r => r.date && r.price != null);
  }
  if (source.type === 'csv') return parseCsv(text, source);
  if (source.type === 'guangcai') return parseGuangcaiHtml(text, source);
  log('未知数据源类型：' + source.type);
  return [];
}

function mergeRecords(records) {
  const byKey = {};
  for (const r of records) {
    const key = [r.date, r.city, r.material, r.spec].join('|');
    const prev = byKey[key];
    if (!prev || channelPriority(r.source) >= channelPriority(prev.source)) byKey[key] = r;
  }
  return Object.keys(byKey).sort().map(k => byKey[k]);
}

function localDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function weekdaysBetween(fromDate, toDate) {
  const out = [];
  const d = new Date(fromDate + 'T00:00:00');
  const end = new Date(toDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      out.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// 没有新数据时，把每个材料最近一次价格滚动到当天，保证网站日期每天推进
function carryForward(records, targetDate) {
  const latestByKey = {};
  for (const r of records) {
    const key = [r.city, r.material, r.spec].join('|');
    if (!latestByKey[key] || r.date > latestByKey[key].date) latestByKey[key] = r;
  }
  const out = [];
  for (const key of Object.keys(latestByKey)) {
    const last = latestByKey[key];
    if (!last.date || last.date >= targetDate) continue;
    for (const date of weekdaysBetween(last.date, targetDate)) {
      out.push(Object.assign({}, last, { date, source: '示例数据', carryForward: true }));
    }
  }
  return out;
}

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const all = [];
  for (const source of config.sources || []) {
    try {
      const records = await loadSource(source);
      log('  ' + source.name + '：' + records.length + ' 条');
      all.push(...records);
    } catch (err) {
      log('  ' + source.name + ' 更新失败：' + err.message);
    }
  }
  const today = localDateStr();
  const forwarded = carryForward(all, today);
  if (forwarded.length) {
    log('没有新数据源的日期，已把最近价格滚动到 ' + today + '（' + forwarded.length + ' 条，标注示例数据）');
  }
  const records = mergeRecords(all.concat(forwarded));
  let latestDate = '';
  for (const r of records) if (r.date > latestDate) latestDate = r.date;
  const outPath = path.resolve(ROOT, config.output || 'web/data/latest.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    latestDate,
    channelPriority: CHANNEL_PRIORITY,
    records
  }, null, 2), 'utf8');
  log('已写入 ' + outPath + '（' + records.length + ' 条，最新 ' + (latestDate || '—') + '）');
  // 同步重建离线单文件版本，保证离线打开也是最新数据
  try {
    require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'web', 'build-single.cjs')], { stdio: 'ignore' });
    log('已重新生成离线文件 web/price-station.html 与 建材价格情报站.html');
  } catch (e) {
    log('离线文件生成失败：' + e.message);
  }
  return { records, latestDate, outPath };
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, parseCsv, parseGuangcaiHtml, mergeRecords };
