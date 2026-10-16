# 固定网址部署说明（GitHub Pages）

部署完成后，你会得到一个固定网址：

`https://你的GitHub用户名.github.io/仓库名/`

以后每天北京时间 07:00，GitHub 会自动执行：

1. 抓取我的钢铁网四城螺纹钢公开报价；
2. 合并广材网 CSV 数据（`server/data/price.csv`）；
3. 重新生成网页和离线单文件；
4. 自动发布到上面的固定网址。

整个过程不依赖你的电脑，也不依赖 Codex。

## 操作步骤

1. 注册/登录 GitHub：https://github.com
2. 新建一个 **Public** 仓库，例如 `building-price`。
3. 把本项目全部文件上传到该仓库（至少包含 `web`、`server`、`tools`、`.github` 四个目录）。
4. 打开仓库的 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
5. 打开仓库的 **Actions** 页面，选择“每日更新建材价格并发布到 GitHub Pages”，点 **Run workflow** 手动运行一次。
6. 运行完成后，Pages 会显示固定网址，例如：
   `https://你的用户名.github.io/building-price/`

## 需要说明

- GitHub Actions 运行在境外服务器上，如果我的钢铁网对境外访问有限制，抓取可能失败；失败时网站会继续使用上一次的数据。
- 如果不希望依赖境外服务，可以改用腾讯云/阿里云 OSS 静态网站 + 每日定时上传，效果一样，但需要云账号。
- 广材网的材料价格需要登录账号后才能抓取；目前每日自动抓取的是螺纹钢公开价格。
