# Chrome 应用商店 · Privacy practices 逐条填写答案

> 用途：开发者后台 item 编辑页 → **Privacy practices** 标签。下面每条都给 **中文版** 与 **English 版**，
> 二选一粘贴即可（推荐 English，审核团队处理最快；中文同样可被审核）。
> 对应包：`dist/goofish-space-next-1.5.0.zip`（manifest v1.5.0）

后台报的 4 条必填项与本文对应关系：

| 后台提示 | 对应本文 |
|---|---|
| The single purpose description is required. | 第 1 条 |
| A justification for host permission use is required. | 第 2 条 |
| A justification for remote code use is required. | 第 3 条 |
| To publish your item, you must certify that your data usage complies with our Developer Program Policies. | 第 4 条 |

---

## 1. Single purpose description（单一用途说明）

**中文（可直接粘贴）**
```
本扩展只有一个用途：在闲鱼（goofish.com）搜索结果页，把空格键映射为该页面原有的「下一页」箭头按钮，
让用户用键盘翻到下一页搜索结果，替代鼠标点击。除此之外不提供任何其他功能。
```

**English**
```
This extension has one single purpose: on the search results page of goofish.com, it maps the
Spacebar key to the page's own "next page" arrow button, so the user can go to the next page of
search results with the keyboard instead of the mouse. It does nothing else.
```

---

## 2. Host permission justification（主机权限 / 站点访问理由）

> 当前申请范围：`*://*.goofish.com/*`（manifest → content_scripts.matches）
> 关键论点：**站点是 SPA，只能全站注入；但运行时自己判断只在 /search 页响应**。

**中文（可直接粘贴）**
```
本扩展仅作用于 goofish.com。内容脚本需要在整个 goofish.com 域注入（而不只是 /search 路径），
原因是该站点是单页应用（SPA）：用户从首页进入搜索结果页属于站内路由跳转，不会重新加载文档，
而浏览器只在文档加载时注入内容脚本，因此若仅声明 /search，用户经站内导航到达搜索页时脚本将永不生效。

脚本在运行时自行判断当前地址，仅在搜索结果页（/search）拦截空格键；在站点的其他任何页面上，
脚本不修改 DOM、不拦截按键、不执行任何操作。脚本只读取该页自带的「下一页」按钮以便模拟一次点击，
不会读取、存储或上传任何页面内容与用户数据。
```

**English**
```
The extension only operates on goofish.com. The content script must be injected across the whole
goofish.com domain (not only the /search path) because the site is a single-page application (SPA):
navigating from the home page into the search results page is an in-site route change that does not
reload the document, and Chrome injects content scripts only at document load. If the permission were
limited to /search, the script would never be injected when a user reaches the search page through
in-site navigation.

At runtime the script checks the current URL itself and only intercepts the Spacebar on the search
results page (/search). On every other page of the site it makes no DOM changes, does not intercept
keys and performs no action at all. The script only reads the page's own "next page" button in order
to simulate a single click on it, and never reads, stores or transmits any page content or user data.
```

---

## 3. Remote code justification（远程代码说明）

**重要：请选择 "No, I am not using remote code"（否）。**
本扩展**完全不使用远程代码**——所有 JavaScript 均打包在扩展内（`content.js`，约 13 KB），本地执行。

**若后台仍强制要求填写一段文字，粘贴下面的声明：**

**中文**
```
本扩展不使用任何远程代码。全部 JavaScript 均打包在扩展包内（content.js，约 13 KB）并在本地执行。
代码中不存在 eval()、new Function()、动态注入的 <script src>、importScripts()，也没有任何 fetch /
XMLHttpRequest / WebSocket 等网络请求，不加载任何外部脚本或资源。因此本扩展不属于远程代码使用场景。
```

**English**
```
This extension does not use remote code. All JavaScript is bundled inside the extension package
(content.js, ~13 KB) and executed locally. The code contains no eval(), no new Function(), no
dynamically injected <script src>, and no importScripts(), and it makes no network requests of any
kind (no fetch / XMLHttpRequest / WebSocket) and loads no external scripts or resources. Therefore
remote code use does not apply to this extension.
```

---

## 4. Data usage certification（数据使用认证）

**操作**：在 Privacy practices 页的 **Data usage** 区域：

1. **所有数据类别一律不勾选**（Personally identifiable information / Health / Financial /
   Authentication / Personal communications / Location / Web history / User activity / Website
   content 等全部保持未勾选）。
2. 勾选底部那句认证声明：
   > ☑ By checking this box, I certify that my data usage complies with our Developer Program Policies.
3. 三个 "Does your extension…" 声明项按以下选择：
   - 不出售或转让用户数据 → **不涉及 / 否**
   - 不将数据用于与单一用途无关的目的 → **不涉及 / 否**
   - 不将数据用于判定信用度或放贷 → **不涉及 / 否**

**理由（脚本侧已核实）**：`content.js` 中不存在 `fetch` / `XMLHttpRequest` / `WebSocket` /
`chrome.storage` / `localStorage` / `document.cookie` 中的任何一项；不采集、不存储、不上传任何数据，
不请求任何权限（仅 `content_scripts.matches` 一处站点访问声明）。

---

## 5. 隐私政策 URL（若后台强制要求）

`PRIVACY.md` 已备好中英文内容。若该字段为必填，需要先把它放到一个公开可访问的 URL，再填入。
（可托管为 GitHub 公开 gist / GitHub Pages，取 raw 链接填写。）

---

## 快速自检表

| 项 | 值 |
|---|---|
| 单一用途 | ✅ 已填第 1 条 |
| 主机权限理由 | ✅ 已填第 2 条（对应 `*://*.goofish.com/*`） |
| 远程代码 | ✅ 选 **No**（如强制要说明 → 第 3 条） |
| 数据使用认证 | ✅ 全部类别不勾选 + 勾选认证框 |
| 隐私政策 URL | ⚠️ 若必填 → 托管 `PRIVACY.md` 后填链接 |
