# 建材价格每日自动更新服务

网页版本身会在每次打开、每 30 分钟、跨天时自动把行情补到最新交易日。
如果需要接入真实价格数据（例如广材网、造价信息网、公司内部数据），用这个目录下的脚本做每日定时抓取。

## 一、配置数据源

编辑 `server/sources.json`，把需要的数据源 `enabled` 改成 `true`：

```json
{
  "sources": [
    {
      "name": "广材网-合肥主要材料",
      "type": "guangcai",
      "enabled": true,
      "url": "https://www.gldjc.com/需要抓取的页面",
      "city": "合肥",
      "channel": "广材网",
      "cookieEnv": "GUANGCAI_COOKIE"
    }
  ]
}
```

支持三种类型：

- `guangcai`：抓取广材网页面里的表格。广材网需要登录授权，请把登录后的 Cookie 存到环境变量 `GUANGCAI_COOKIE`；页面结构变化时要调整 `daily-update.js` 里的解析规则。
- `csv`：读取本地或远程 CSV/TSV，列名支持日期、城市、材料、规格、单位、含税价、不含税价、税率、来源。
- `json`：读取远程或本地 JSON，格式为记录数组或 `{ "records": [...] }`。

## 二、手动执行一次

```powershell
node server/daily-update.js
```

执行后生成 `web/data/latest.json`。网页端在“数据导入 → 每日自动更新”里填入这个地址即可，例如：

```
http://127.0.0.1:8100/api/prices
```

如果网页由 `server/server.js` 启动，不填地址也会自动尝试读取 `/api/prices`。

## 三、每天 07:00 自动更新

方式一：用 Windows 任务计划程序，管理员 PowerShell 执行：

```powershell
schtasks /Create /SC DAILY /ST 07:00 /TN "建材价格每日更新" /TR "\"C:\Program Files\nodejs\node.exe\" \"E:\黄康\文档\快速提取表格信息，合并同类项的工具\server\daily-update.js\"" /F
```

方式二：直接运行带定时任务的服务器：

```powershell
node server/server.js
```

服务器会在每天 07:00 自动抓取，并提供 `http://127.0.0.1:8100/` 页面和 `/api/prices` 接口。

## 四、需要注意

- 广材网等网站通常要求登录、付费订阅，并有反爬限制。请确认你有权抓取并对外展示这些数据，否则建议使用官方导出文件或公司内部接口。
- 浏览器直接抓取这些网站会被跨域限制拦截，所以真实数据的每日抓取应放在这个服务端脚本里，而不是网页里。
- 同一材料同一天有多条记录时，合并优先级为：广材网 > 造价信息网 > 手动导入 > 示例数据。
