// ==UserScript==
// @name         论坛居中显示
// @namespace    https://github.com/ZiPenOk
// @version      1.0.1
// @description  将 sehuatang.net 的论坛布局水平居中并限制最大宽度，适配 Discuz! X3.4 常见结构
// @author       ZiPenOk
// @match        *://sehuatang.net/*
// @match        *://www.right.com.cn/*
// @match        *://169bbs.com/*
// @match        *://*169bbs*.*/*
// @match        *://hostloc.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/forum_centered.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/forum_centered.js
// ==/UserScript==

(function () {
  const css = `
/* 基础：让常见容器块（Discuz 的 .wp/.ct/.mn/.sd + 头部/页脚）居中并约束宽度 */
#hd .wp, #wp, #ft .wp, .wp, .ct, .mn, .sd, #ct, #nv, #pt, #um, #ft {
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
  float: none !important;
}

/* 如果主题启用了自适应宽度（body.widthauto），也强制居中并限制最大宽度 */
body.widthauto #hd .wp,
body.widthauto #wp,
body.widthauto #ft .wp,
body.widthauto .wp {
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

/* 保持页面占满视口宽度，避免外层容器把内容挤到左侧 */
html, body { width: 100% !important; }

/* 线程列表/帖子内部常见容器，也跟随居中 */
#threadlist, .forumlist, .bm, .bm_c, .plist, .tl, .pcb {
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

/* 选项：当屏幕较窄时，主栏占满宽度，避免出现左右空白过多 */
@media (max-width: 1280px) {
  .mn { width: 100% !important; }
}

/* 可选：如果有全宽横幅或通栏广告，不要被 max-width 限制（按需注释） */
/*
.tbn, .a_mu, .a_fl, .a_fr, .a_cn {
  max-width: none !important;
}
*/
`;

  if (typeof GM_addStyle === 'function') {
    GM_addStyle(css);
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    document.documentElement.appendChild(style);
  }
})();
