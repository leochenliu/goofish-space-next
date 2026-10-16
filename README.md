# Goofish 空格翻页（Chrome 解压式扩展）

在闲鱼（goofish）搜索结果页，**焦点在页面空白处时按空格键 = 点击「下一页」/ 下一个页码**，替代鼠标点击翻页。

> 与已安装的 `nextpage` 插件互不影响，本扩展独立运行。

## 安装步骤

1. 打开 `chrome://extensions`
2. 右上角打开 **开发者模式（Developer mode）**
3. 点击 **加载已解压的扩展程序（Load unpacked）**，选择本文件夹 `goofish-space-next`
4. 访问闲鱼搜索页，例如：`https://www.goofish.com/search?q=手机`
5. **先点一下页面空白处**（让焦点离开地址栏/输入框），再按空格即可翻页

## 使用要点

- 空格仅在「焦点松散」（body 或普通区域）时触发翻页；当焦点在搜索框、按钮、链接等控件上时，空格保持原功能（输入空格 / 激活控件），不会被劫持。
- 翻页成功后页面底部控制台（F12 → Console）会打印：`[GoofishSpaceNext] → 翻到下一页 (method=...)`。
- 若已是最后一页或没探测到下一页按钮，空格按默认行为滚动页面，并打印一条 warn 提示，方便排查。

## 探测策略（自适应闲鱼改版）

运行时按以下优先级探测「下一页」：

0. **goofish 专属（最先命中）**：搜索页右下角翻页箭头按钮。按钮无文字、内部只有个空 `<div>` 箭头，
   靠 class 语义前缀识别：`[class*="search-pagination-arrow-right"]` → `closest('button')`。
   class 形如 `search-pagination-arrow-right--<hash>`，`<hash>` 随构建变化，故只用稳定的前缀匹配。
1. 文案匹配：`下一页` / `next` / `›` `»` 等图标按钮（叶子优先）
2. 编号翻页容器：对「纯数字叶子」上溯聚类找翻页条，点当前页的下一个数字（支持 `aria-current` / `active` 高亮）
3. URL 兜底：当前 URL 含 `page/p/pn/paged` 参数时，自动寻找页码 +1 的链接
4. 最后手段：`加载更多` / `查看更多`（限叶子，取最靠下的一个）

命中禁用态（`disabled` / `aria-disabled` / class 含 `disabled`）时判定为"已是最后一页"，不点击。

## 调试 / 自定义

如需手动指定选择器（极少情况探测失效），在 `content.js` 的 `findNextPage()` 开头加一行，例如：

```js
var manual = document.querySelector('你的选择器');
if (manual) return { el: manual, method: 'manual' };
```

或把控制台输出的 `[GoofishSpaceNext]` 日志发我，我帮你加精准选择器。
