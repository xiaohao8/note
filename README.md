# Desktop-note 官网

纯静态站点：无框架、无构建步骤、无 npm 依赖，一个目录丢给 Netlify 就能上线。

```
website/
├── index.html              首页（首屏 / 功能 / 本地优先 / 规格 / 下载 / 常见问题）
├── privacy.html            隐私政策
├── 404.html                404 兜底页
├── netlify.toml            部署配置（发布目录、安全头、重定向）
├── robots.txt
├── sitemap.xml
├── scripts/
│   └── check-site.mjs      上线前自检（资源 / 锚点 / 品牌词 / 标签配平）
└── assets/
    ├── css/style.css       设计系统 + 全部样式
    ├── js/main.js          导航描边、滚动进场、目录高亮
    └── img/
        ├── favicon.png      浏览器标签图标（换图后记得把链接上的 ?v= 戳 +1 破缓存）
        └── og-cover.png     1200×630 社交分享卡片（og:image / twitter:image；由 scripts/gen-og-cover.py 从 build/icon-source.png 派生）
```

## 部署到 Netlify

**方式一 · 拖拽上传（最快）**

1. 打开 [app.netlify.com/drop](https://app.netlify.com/drop)
2. 把 `website` 整个文件夹拖进去
3. 拿到 `xxx.netlify.app` 地址后，在 **Domain management → Domains** 里绑定自己的域名

**方式二 · 关联 Git 仓库（推荐长期维护）**

1. 把这个目录推到 GitHub / GitLab
2. Netlify → **Add new site → Import an existing project**
3. Base directory 填 `website`（如果仓库里还放着别的东西）
4. Build command **留空**，Publish directory 填 `.`（`netlify.toml` 已经写好了这两项，界面上留空即可自动读取）

> 注意：如果官网不是放在仓库根目录，请把 `netlify.toml` 挪到仓库根，并把 `publish` 改成 `"website"`。

## 上线前需要替换的占位

| 位置 | 现在的值 | 改成 |
| --- | --- | --- |
| `index.html` 商店按钮 | `https://apps.microsoft.com/` | 上架后的应用详情链接：`https://apps.microsoft.com/detail/9NNVHVJZXCVP`（Store ID）|
| `index.html` 安装包链接 | `https://github.com/your-org/desktop-note/releases` | 你的 Releases 地址，或直链 `.exe` |
| 两处 `<link rel="canonical">` 与 `sitemap.xml` | `https://example.com/` | 你的实际域名（部署后替换）|
| `og:image` / `twitter:image` 里的域名 | `https://example.com/...` | 部署后换成真实域名（图片本身 `assets/img/og-cover.png` 已生成）|
| favicon 换图后 | 链接带 `?v=2` 缓存戳 | 每次替换 `favicon.png` 把戳 +1，否则浏览器按旧 URL 缓存继续显示旧图标 |

搜索这两个标记能一次找全：
`TODO:`

## 上线前自检

改完 HTML 跑一遍，会检查本地资源是否存在、锚点是否可达、有没有手滑带进第三方品牌词、标签是否配平：

```bash
node scripts/check-site.mjs      # 有问题时退出码为 1
```

## 本地预览

任意静态服务器都行，例如：

```bash
python -m http.server 8080      # 然后访问 http://localhost:8080
npx serve .                      # 或者
```

不建议直接双击 `index.html` 打开（`file://` 协议下部分相对路径行为不同）。

## 设计约定

- **自动深浅色**：跟随系统 `prefers-color-scheme`，没有手动切换开关（这也是刻意留白的考虑）。
- **字号与间距**统一由 `assets/css/style.css` 顶部的 `:root` 令牌控制，改一处全站生效；主色调 `--accent`、产品色板 `--sticky-1..6` 与客户端 `src/shared/tokens.ts` 保持一致。
- **首屏产品图是纯 CSS 画的**（`.stage`，没有位图），所以任意分辨率都不糊、不会变形；内部所有尺寸基于 `.stage` 的 `font-size` 用 `em` 表达，缩放窗口时会整体等比收缩。
- **动效克制**：只有滚动淡入与便签的轻微浮动，且全部在 `prefers-reduced-motion: reduce` 下自动失效。

## 维护提示

- 改了 `assets/css/style.css` 后如果线上没变化，是 Netlify 的 10 分钟缓存（`netlify.toml` 里设的），等一会儿或手动清 CDN 即可。
- 新增页面记得同步更新 `sitemap.xml` 和页脚导航。
