// 阿里云函数计算 FC · Node.js 18/22 · Web 函数（监听 9000 端口）
// 用途：为“建材价格情报站”全网比价提供稳定的服务端抓取代理
// 部署后访问：https://<你的公网地址>/api/search?src=jd|tb&kw=关键词
// 返回 JSON：{ ok: true, src, items: [{ title, price, img, url }] }，已带 CORS 头

const http = require('http');
const https = require('https');

const debug = {};

function fetchText(url, headers = {}, timeoutMs = 12000, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 3) return reject(new Error('too many redirects'));
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: Object.assign({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }, headers)
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchText(new URL(res.headers.location, u).href, headers, timeoutMs, depth + 1));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => { data += c; if (data.length > 6 * 1024 * 1024) req.destroy(); });
      res.on('end', () => resolve(data));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('upstream timeout')));
    req.on('error', reject);
    req.end();
  });
}

function fetchJson(url, headers) {
  return fetchText(url, headers).then(t => JSON.parse(t));
}

function decode(s) {
  return String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

// 京东搜索（2026 新版页面：plugin_goodsCardWrapper 商品块 + data-sku；兼容旧版 gl-item）
// 环境变量 JD_COOKIE：已登录京东的浏览器 Cookie（新版搜索页需要登录态）
async function searchJD(kw) {
  debug.hasCookie = !!process.env.JD_COOKIE;
  debug.cookieLen = (process.env.JD_COOKIE || '').length;
  const url = 'https://search.jd.com/Search?keyword=' + encodeURIComponent(kw) + '&enc=utf8';
  const headers = { 'Referer': 'https://www.jd.com/' };
  if (process.env.JD_COOKIE) headers['Cookie'] = process.env.JD_COOKIE;
  const html = await fetchText(url, headers);
  debug.htmlLen = html.length;

  const items = [];
  const seen = new Set();
  const add = (sku, title, img, htmlPrice) => {
    if (!sku || seen.has(sku)) return;
    if (!title || title.length < 4) return;
    seen.add(sku);
    items.push({
      sku,
      title,
      img: img ? (img.startsWith('//') ? 'https:' + img : img) : '',
      url: 'https://item.jd.com/' + sku + '.html',
      htmlPrice: htmlPrice || null
    });
  };

  // 新版商品块
  const blocks = html.split('plugin_goodsCardWrapper').slice(1);
  debug.newCards = blocks.length;
  for (const raw of blocks) {
    const seg = raw.slice(0, 9000);
    const skuM = seg.match(/data-sku="(\d+)"/);
    if (!skuM) continue;
    const titleM = seg.match(/title="([^"]{6,150})"/);
    const imgM = seg.match(/data-src="((?:https?:)?\/\/img\d+\.360buyimg\.com[^"]+)"/);
    let hp = null;
    const pm = seg.match(/¥<\/i>([\s\S]{0,300}?)<\/span><\/span>/);
    if (pm) {
      const num = decode(pm[1]).replace(/[^\d.]/g, '');
      if (num) hp = Number(num);
    }
    add(skuM[1], titleM ? decode(titleM[1]) : '', imgM ? imgM[1] : '', hp);
    if (items.length >= 30) break;
  }

  // 旧版商品块（兜底）
  if (!items.length) {
    const re = /<li[^>]*class="[^"]*gl-item[^"]*"[^>]*data-sku="(\d+)"([\s\S]*?)<\/li>/g;
    let m;
    while ((m = re.exec(html)) !== null && items.length < 30) {
      const block = m[2];
      const tM = block.match(/<em[^>]*>([\s\S]*?)<\/em>/);
      const imgM = block.match(/(?:data-lazy-img|src)="((?:https?:)?\/\/img\d+\.360buyimg\.com[^"]+)"/);
      add(m[1], tM ? decode(tM[1]) : '', imgM ? imgM[1] : '', null);
    }
  }
  debug.parsed = items.length;

  // 价格：以京东公开价格接口为准，页面价格兜底
  if (items.length) {
    try {
      const ids = items.map(i => 'J_' + i.sku).join(',');
      const prices = await fetchJson('https://p.3.cn/prices/mgets?skuIds=' + ids);
      const map = {};
      (Array.isArray(prices) ? prices : []).forEach(p => { if (p && p.id) map[String(p.id).replace(/^J_/, '')] = p.p; });
      items.forEach(i => { i.price = map[i.sku] || i.htmlPrice || null; });
    } catch (e) {
      items.forEach(i => { i.price = i.htmlPrice || null; });
    }
  }
  return items.filter(i => i.price && i.price > 0).slice(0, 20);
}

// 淘宝：尽力而为，环境变量 TB_COOKIE 可提升成功率；失败返回空数组，前端自动降级
async function searchTaobao(kw) {
  try {
    const headers = { 'Referer': 'https://www.taobao.com/' };
    if (process.env.TB_COOKIE) headers['Cookie'] = process.env.TB_COOKIE;
    const html = await fetchText('https://s.taobao.com/search?q=' + encodeURIComponent(kw), headers);
    const items = [];
    const re = /"title":"([^"]{6,140})"[\s\S]{0,400}?"price"\s*:\s*"?([\d.]+)"?[\s\S]{0,400}?"pic_url":"([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null && items.length < 20) {
      let img = m[3].replace(/\\u003d/g, '=');
      if (img.startsWith('//')) img = 'https:' + img;
      const price = Number(m[2]);
      if (!isFinite(price) || price <= 0) continue;
      items.push({ title: decode(m[1]), price, img, url: '' });
    }
    return items;
  } catch (e) {
    return [];
  }
}

async function handle(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };
  const reply = (code, obj) => {
    Object.keys(cors).forEach(k => res.setHeader(k, cors[k]));
    res.writeHead(code);
    res.end(JSON.stringify(obj));
  };
  if (req.method === 'OPTIONS') { reply(204, {}); return; }
  if (u.pathname !== '/api/search') { reply(404, { ok: false, error: 'not found' }); return; }
  const kw = String(u.searchParams.get('kw') || '').trim().slice(0, 60);
  const src = (u.searchParams.get('src') || 'jd').toLowerCase() === 'tb' ? 'tb' : 'jd';
  if (!kw) { reply(400, { ok: false, error: 'missing kw' }); return; }
  try {
    const items = await (src === 'tb' ? searchTaobao(kw) : searchJD(kw));
    const out = { ok: true, src, items };
    if (src === 'jd' && (!items || !items.length)) out.debug = debug;
    reply(200, out);
  } catch (e) {
    reply(200, { ok: false, error: String((e && e.message) || e) });
  }
}

http.createServer(handle).listen(9000, () => console.log('bps-price-proxy listening on 9000'));
