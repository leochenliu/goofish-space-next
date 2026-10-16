# Chrome 应用商店（Chrome Web Store）上架材料

上传入口：https://chrome.google.com/webstore/devconsole
上传包：`dist/goofish-space-next-1.5.0.zip`

---

## 1. 基本信息（可直接复制粘贴）

| 字段 | 值 | 限制 |
|---|---|---|
| 名称 Name | `Goofish 空格翻页` | ≤45 字符 |
| 简介 Summary | `在闲鱼搜索页按空格键翻到下一页，替代鼠标点击翻页箭头，浏览更顺手。` | ≤132 字符 |
| 类别 Category | `工具`（Tools）或 `效率`（Productivity） | — |
| 语言 Language | `中文（简体）` | — |
| 图标 Store icon | `icons/icon128.png`（128×128 PNG） | 必填 |

## 2. 详细说明（Detailed description，直接复制）

```
「Goofish 空格翻页」让你在闲鱼（goofish.com）搜索结果页用键盘更高效地浏览。

主要功能
• 在搜索结果页，焦点在页面空白处时，按一下空格键 = 翻到下一页（等同点击右下角翻页箭头）。
• 自动识别按钮禁用态：已经是最后一页时不会误操作。
• 页面右下角有状态小角标，翻页结果一目了然。
• 与其它翻页类插件（如 nextpage）互不冲突。

使用方法
1. 打开闲鱼搜索页，例如 https://www.goofish.com/search?q=手机
2. 用鼠标点一下页面空白处（让焦点离开地址栏 / 搜索框）
3. 按空格键翻页

隐私说明
本扩展不收集、不上传任何数据，全部逻辑在本地浏览器内运行。仅在您按下空格键时，模拟点击页面上的「下一页」按钮。

免责声明
本扩展为第三方工具，与闲鱼 / goofish 官方无关。
```

## 3. 图片素材

| 素材 | 规格 | 是否必填 | 文件 |
|---|---|---|---|
| 商店图标 | 128×128 PNG | 必填 | `icons/icon128.png` |
| 截图 | 1280×800 或 640×400，1–5 张 | 必填（≥1） | 需你手动截取，见下方 |
| 小型宣传图块 | 440×280 | 可选 | `icons/promo_440x280.png` |
| 顶部宣传图 Marquee | 1400×560 | 可选（仅推荐位用） | 可选自制 |

### 截图怎么拍（Chrome 原生截图法，1280×800）
1. 打开 `https://www.goofish.com/search?q=手机`，确认右下角出现 `[空格翻页] 已就绪…` 角标
2. 按 `F12` 打开 DevTools → `Ctrl+Shift+M` 进入设备工具栏 → 分辨率选 `1280×800`（自定义 Responsive）
3. `Ctrl+Shift+P` → 输入 `screenshot` → 选 **Capture screenshot**，即得 1280×800 PNG
4. 建议拍 3 张：① 搜索结果页 + 就绪角标　② 按空格后翻到第 2 页（角标显示 `翻到下一页 ✓`）　③ 最后一页时的 `已是最后一页` 提示

> 截图里请勿出现账号名、订单、收货地址等个人信息。

## 4. 隐私规范（Privacy practices）填写答案

- **单一用途说明（Single purpose）**：
  `在闲鱼（goofish.com）搜索结果页，将空格键映射为「翻到下一页」，仅此一项功能。`
- **content_scripts 主机权限理由**：
  `站点为单页应用（SPA），从首页到搜索页为站内路由、不整页刷新，脚本需在 goofish.com 全域注入才能保证切换后仍生效；脚本运行时自行判断仅在 /search 页响应按键，其余页面不做任何操作。脚本不读取、不存储、不上传任何页面数据。`
- **是否使用远程代码（Remote code）**：`否`。全部逻辑打包在 content.js 内。
- **数据使用（Data usage）**：勾选 **不收集任何用户数据**（This extension does not collect user data）。
- **隐私政策 URL**：如后台强制要求，可用本仓库的 `PRIVACY.md` 内容托管到任一公开地址后填入（见下）。

## 5. 提交步骤（开发者后台）

1. 打开 https://chrome.google.com/webstore/devconsole ，用你的开发者账号登录
2. **New item** → 上传 `dist/goofish-space-next-1.5.0.zip`
3. 填写 Store listing：名称 / 简介 / 详细说明 / 类别 / 语言 / 图标 / 截图（用上面第 1–3 节）
4. 填写 **Privacy practices**（用上面第 4 节）
5. 选择可见范围（公开 / 不公开 / 仅测试者）
6. **Submit for review** → 等待审核（通常数小时到数个工作日）

## 6. 审核风险与对策

| 风险 | 说明 | 对策 |
|---|---|---|
| 主机权限过宽 | `*://*.goofish.com/*` 是全域，审核可能要求说明 | 已备好第 4 节的理由；如被拒，可收窄为 `*://www.goofish.com/*` |
| 与已装插件功能重叠 | 你本地还装了 `nextpage`，但上架包不依赖也不冲突 | 描述中已声明"互不冲突" |
| 提权/劫持嫌疑 | 扩展会在页面注入角标 div | 角标 `pointer-events:none`、不采集数据，属正常 UI 增强 |
| 品牌词 | 名称含 "Goofish" | 若被商标质疑，可改名为「闲鱼空格翻页（非官方）」 |

## 7. 版本更新

改完代码后执行：

```bash
python tools/make_zip.py        # 重新打包到 dist/
# 回到后台 → 对应 item → Package → Upload new package → 提交
```

记得先改 `manifest.json` 的 `version`。
