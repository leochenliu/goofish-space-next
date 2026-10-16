/*
 * Goofish 空格翻页 —— content script (v1.3)
 * 在 goofish 搜索页：焦点在页面空白处时按空格 → 自动点击「下一页」/下一个页码。
 *
 * v1.3 修复的 bug：
 *  - [高] 祖先优先命中：改为「叶子/最深优先」。点击叶子会向上冒泡，能触发任意祖先上的处理器。
 *  - [高] 「查看更多」误点：从最优先降为「最后手段」，且限定叶子 + 取最靠下的一个。
 *  - [中] 嵌套翻页漏判：改用「数字叶子上溯聚类（父 + 祖父）」，容忍 ul>li>a 一层嵌套。
 *  - [中] 性能：单次 DOM 快照，去掉逐元素 querySelectorAll，聚类 O(n+m)。
 *  - [中] 误选价格/卡片网格：加合理性校验（1–200、去重、近似连续）。
 *  - [低] SVG className 判断：改用 getAttribute('class')。
 *  - [低] 异常保护：findNextPage 与 click 均 try/catch，click 失败回退派发 MouseEvent。
 *  - 顺序修正：显式「下一页」→ 编号 → 图标 next → URL 兜底 → 加载更多。
 */

(function () {
  'use strict';

  var SEARCH_RE = /goofish\.com\/search/i;

  function inScope() { return SEARCH_RE.test(location.href); }

  // 焦点是否「松散」：body 或普通容器视为松散；可交互控件视为聚焦，不放行劫持
  function isLooseFocus() {
    var a = document.activeElement;
    if (!a || a === document.body) return true;
    if (a.isContentEditable) return false;
    var tag = a.tagName;
    return !(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
             tag === 'BUTTON' || tag === 'A' || tag === 'OPTION');
  }

  function txt(el) { return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim(); }
  function cls(el) { return (el && el.getAttribute && el.getAttribute('class')) || ''; }

  function isNumericLeaf(el) {
    return !!(el && el.children.length === 0 && /^\d+$/.test(txt(el)));
  }

  function isActive(el) {
    if (el.getAttribute('aria-current') === 'page') return true;
    var s = cls(el) + ' ' + (el.getAttribute('data-state') || '');
    return /(^|[\s_-])(active|current|on|selected|checked)([\s_-]|$)/i.test(s);
  }

  function pageNumberFromUrl() {
    var m = location.search.match(/[?&](?:page|p|pn|paged)=(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function isDisabled(el) {
    if (!el) return false;
    if (el.disabled === true) return true;
    if (el.getAttribute && el.getAttribute('aria-disabled') === 'true') return true;
    return /(^|[\s_-])disabled([\s_-]|$)/i.test(cls(el));
  }

  // goofish 专属：搜索页翻页箭头按钮（右箭头 = 下一页；按钮无文字，靠 class 前缀识别）
  // class 形如 search-pagination-arrow-container--<hash> / search-pagination-arrow-right--<hash>
  // 哈希随构建变化，故只匹配稳定的语义前缀。
  function findGoofishArrow() {
    var right = document.querySelector('[class*="search-pagination-arrow-right"]');
    if (right) {
      var btn = right.closest ? right.closest('button') : null;
      return btn || right;
    }
    // 备用：容器按钮取文档序最后一个（左侧是上一页，右侧是下一页）
    var btns = document.querySelectorAll('button[class*="search-pagination-arrow-container"]');
    if (btns.length) return btns[btns.length - 1];
    return null;
  }

  var NEXT_EXACT = { '下一页': 1, '下一页 ›': 1, '下一页>': 1, '下页': 1 };
  var NEXT_ICON_RE = /^(›+|»+)$|^next$/i;
  var NEXT_ICON_LOOSE_RE = /^next\s*page$/i;

  // 优先取叶子/最深元素。preferLast=true 时取文档序最后的叶子（翻页条通常在页面底部）
  function pickLeaf(list, preferLast) {
    if (!list.length) return null;
    var leaves = list.filter(function (e) { return e.children.length === 0; });
    var pool = leaves.length ? leaves : list;
    return preferLast ? pool[pool.length - 1] : pool[0];
  }

  // 通过数字叶子上溯聚类，找翻页条（容忍 ul>li>a 一层嵌套）
  function findPaginationLeaves(els) {
    var leaves = [];
    for (var i = 0; i < els.length; i++) if (isNumericLeaf(els[i])) leaves.push(els[i]);
    if (leaves.length < 2) return null;

    var groups = new Map();
    function push(key, el) {
      if (!key) return;
      var arr = groups.get(key);
      if (!arr) { arr = []; groups.set(key, arr); }
      arr.push(el);
    }
    for (var j = 0; j < leaves.length; j++) {
      var p = leaves[j].parentElement;
      push(p, leaves[j]);                       // 数字直接是兄弟
      if (p) push(p.parentElement, leaves[j]);  // 数字外层还包了一层（如 a 在 li 里）
    }

    var best = null;
    groups.forEach(function (list) {
      if (list.length >= 2 && (!best || list.length > best.length)) best = list;
    });
    if (!best) return null;

    // 合理性校验：数值去重、范围 1–200、近似连续（排除价格 / 卡片网格）
    var nums = best.map(function (e) { return parseInt(txt(e), 10); });
    var uniq = nums.filter(function (v, k) { return nums.indexOf(v) === k; });
    if (uniq.length !== nums.length) return null;
    var min = Math.min.apply(null, nums);
    var max = Math.max.apply(null, nums);
    if (min < 1 || max > 200) return null;
    // 通过条件：近似连续，或从 1 开始（兼容「1 2 3 4 5 … 20」带跳末页的翻页条）
    var contiguous = (max - min) <= (nums.length + 3);
    var startsAtOne = (min === 1);
    if (!contiguous && !startsAtOne) return null;

    best.sort(function (a, b) {
      return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
    });
    return best;
  }

  // 多策略探测「下一页」元素，返回 {el, method} 或 null
  function findNextPage() {
    var nodeList = document.querySelectorAll('*');
    var els = [];
    for (var i = 0; i < nodeList.length; i++) els.push(nodeList[i]);

    // 0) goofish 专属：搜索页右下角翻页箭头（最稳，优先命中）
    var arrow = findGoofishArrow();
    if (arrow) return { el: arrow, method: 'goofish-arrow-right' };

    // 1) 显式「下一页」文本（叶子优先）
    var exact = [];
    for (var a = 0; a < els.length; a++) {
      var t = txt(els[a]);
      if (t && t.length <= 6 && NEXT_EXACT[t] === 1) exact.push(els[a]);
    }
    var exactEl = pickLeaf(exact, false);
    if (exactEl) return { el: exactEl, method: 'text-exact' };

    // 2) 编号翻页（放在图标之前，避免"只有面包屑 › 没有翻页箭头"时误点）
    var pages = findPaginationLeaves(els);
    if (pages && pages.length >= 2) {
      var curIdx = -1;
      for (var c = 0; c < pages.length; c++) if (isActive(pages[c])) { curIdx = c; break; }
      if (curIdx >= 0 && curIdx + 1 < pages.length) {
        return { el: pages[curIdx + 1], method: 'numbered-next' };
      }
      var curUrl = pageNumberFromUrl();
      if (curUrl != null) {
        for (var d = 0; d < pages.length; d++) {
          if (parseInt(txt(pages[d]), 10) === curUrl + 1) {
            return { el: pages[d], method: 'numbered-url' };
          }
        }
      }
    }

    // 3) 图标 / 英文 next（取文档序最后一个叶子，翻页条通常在底部）
    var icon = [];
    for (var b = 0; b < els.length; b++) {
      var t2 = txt(els[b]);
      if (t2 && t2.length <= 12 && (NEXT_ICON_RE.test(t2) || NEXT_ICON_LOOSE_RE.test(t2))) icon.push(els[b]);
    }
    var iconEl = pickLeaf(icon, true);
    if (iconEl) return { el: iconEl, method: 'text-icon' };

    // 4) URL 兜底——找 href 与当前仅差「页码参数 +1」的链接
    var curNum = pageNumberFromUrl();
    if (curNum != null) {
      var nextNum = curNum + 1;
      var links = document.querySelectorAll('a[href]');
      for (var e = 0; e < links.length; e++) {
        try {
          var u = new URL(links[e].getAttribute('href'), location.href);
          if (u.pathname !== location.pathname) continue;
          var params = new URLSearchParams(u.search);
          var keys = ['page', 'p', 'pn', 'paged'];
          for (var f = 0; f < keys.length; f++) {
            if (params.has(keys[f]) && parseInt(params.get(keys[f]), 10) === nextNum) {
              return { el: links[e], method: 'url' };
            }
          }
        } catch (err) { /* ignore */ }
      }
    }

    // 5) 最后手段：「加载更多 / 查看更多」——限定叶子，取最靠下的一个
    var more = [];
    for (var g = 0; g < els.length; g++) {
      if (els[g].children.length === 0) {
        var tm = txt(els[g]);
        if (tm === '加载更多' || tm === '查看更多' || tm === '更多') more.push(els[g]);
      }
    }
    if (more.length) {
      var bottom = more.reduce(function (x, y) {
        return x.getBoundingClientRect().top >= y.getBoundingClientRect().top ? x : y;
      });
      return { el: bottom, method: 'more' };
    }

    return null;
  }

  // 右下角状态角标（低透明度，pointer-events:none，不挡点击）
  function badge(msg) {
    if (!document.body) return;
    var b = document.getElementById('gsn-badge');
    if (!b) {
      b = document.createElement('div');
      b.id = 'gsn-badge';
      b.style.cssText =
        'position:fixed;right:8px;bottom:8px;z-index:2147483647;' +
        'background:rgba(0,0,0,.72);color:#fff;font:12px/1.4 monospace;' +
        'padding:4px 8px;border-radius:4px;pointer-events:none;opacity:.85;max-width:70vw;';
      document.body.appendChild(b);
    }
    b.style.display = 'block';
    b.textContent = '[空格翻页] ' + msg;
  }

  // 探测失败时打印诊断信息，便于定位闲鱼真实翻页结构
  function dumpDiagnostics() {
    var rows = [];
    var sel = 'a,button,[role="button"],[class*="page"],[class*="pager"],[class*="pagin"],[class*="next"]';
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length && rows.length < 50; i++) {
      var el = nodes[i];
      var t = txt(el);
      var c = cls(el);
      if (!t && !c) continue;
      rows.push({ tag: el.tagName.toLowerCase(), cls: c.slice(0, 60), text: t.slice(0, 30) });
    }

    var numInfo = [];
    var all = document.querySelectorAll('*');
    for (var j = 0; j < all.length && numInfo.length < 30; j++) {
      if (all[j].children.length === 0 && /^\d+$/.test(txt(all[j]))) {
        numInfo.push(txt(all[j]) + ' <' + all[j].tagName.toLowerCase() + ' class="' + cls(all[j]).slice(0, 40) + '">');
      }
    }

    console.log('%c[GoofishSpaceNext] 诊断：疑似翻页/可点击元素（前 50）', 'color:#09f');
    if (console.table) console.table(rows); else console.log(rows);
    console.log('%c[GoofishSpaceNext] 诊断：纯数字叶子节点（前 30）', 'color:#09f');
    console.log(numInfo);
    console.log('%c[GoofishSpaceNext] 若以上为空 → 页面很可能没有翻页控件（改用无限滚动/加载更多）。请把上面的表格内容截图或复制发我。', 'color:#f60');
  }

  function clickElement(el) {
    try {
      el.click();
    } catch (err) {
      try {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      } catch (err2) {
        console.error('[GoofishSpaceNext] 点击失败', err2);
      }
    }
  }

  function onKey(e) {
    if (!inScope()) return;
    if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Spacebar') return;
    if (!isLooseFocus()) {
      badge('焦点在控件上，空格未拦截（点页面空白处再试）');
      return;
    }

    var found = null;
    try {
      found = findNextPage();
    } catch (err) {
      console.error('[GoofishSpaceNext] 探测异常', err);
      badge('探测异常，见 Console');
      return;
    }

    if (found && found.el) {
      e.preventDefault();
      e.stopPropagation();
      if (isDisabled(found.el)) {
        console.log('[GoofishSpaceNext] 下一页按钮禁用（可能已是最后一页）');
        badge('已是最后一页 / 下一页不可用');
        return;
      }
      console.log('[GoofishSpaceNext] → 翻到下一页 (method=' + found.method + ')', found.el);
      badge('翻到下一页 ✓ (' + found.method + ')');
      clickElement(found.el);
    } else {
      console.warn('[GoofishSpaceNext] 未找到下一页按钮，空格按默认行为（滚动页面）');
      badge('未找到下一页按钮（看 Console 诊断表）');
      dumpDiagnostics();
    }
  }

  // 搜索页才显示角标；离开搜索页（SPA 切走）自动隐藏，进入时自动出现
  function refreshBadge() {
    if (!inScope()) {
      var ex = document.getElementById('gsn-badge');
      if (ex) ex.style.display = 'none';
      return;
    }
    badge('已就绪（点页面空白处后按空格翻页）');
  }

  document.addEventListener('keydown', onKey, true);
  console.log('[GoofishSpaceNext] 已加载（仅 goofish 搜索页生效）');
  refreshBadge();
  setInterval(refreshBadge, 1500);
})();
