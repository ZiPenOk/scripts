// ==UserScript==
// @name         JAV老司机-新
// @namespace    https://github.com/ZiPenOk/scripts
// @version      2.7.9.5
// @description  增强 JavBus、JavDB、JavLibrary 等 JAV 站点的浏览与检索体验：提供磁力搜索表、BT 引擎聚合、115 匹配与播放入口、番号复制、跨站搜索/跳转、预告片解析播放、多源预览图、标题翻译、卡片布局、横竖图切换、列数与页面缩放、移动端竖横屏适配、详情页比例调整、剧照浏览、瀑布流加载、JavDB 列表评分/评价排序与已加载内容重排、JavDB 榜单/TOP250页面增强、FC2 页面渲染和统一设置面板；并在 Sukebei、SupJav、MissAV、Jable、Emby、Javrate、Sehuatang、HJD2048 等页面提供番号识别与快捷跳转入口。
// @author       ZiPenOk
// @icon         https://cloudflare-imgbed-5nw.pages.dev/file/1778560196416_laosiji.png
// @match        *://*.javlibrary.com/*
// @match        *://javlibrary.com/*
// @match        *://*.javbus.com/*
// @match        *://javbus.com/*
// @match        *://javdb.com/*
// @match        *://115.com/*
// @match        *://www.115.com/*
// @match        *://sukebei.nyaa.si/*
// @match        *://169bbs.com/*
// @match        *://*169bbs*.com/*
// @match        *://supjav.com/*
// @match        *://javrate.com/*
// @match        *://www.javrate.com/*
// @match        *://sehuatang.net/*
// @match        *://hjd2048.com/2048/*
// @match        *://jable.tv/*
// @match        *://123av.com/*
// @match        *://fc2cmadb.com/*
// @match        *://www.fc2cmadb.com/*
// @include      *://javdb*.com/*
// @include      /^[^:]*?:\/\/(?:www\.)?(?:missav|njavtv)\.[^/]*?\/.*?$/
// @include      /^[^:]*?:\/\/emby\.[^/]*?\/web\/index\.html.*?$/
// @include      /^[^:]*?:\/\/10\.[^/]*?:[^/]*?\/web\/index\.html.*?$/
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_download
// @grant        GM_info
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js
// @connect      *
// @license      GPL-3.0
// @homepageURL  https://github.com/ZiPenOk/scripts
// @supportURL   https://github.com/ZiPenOk/scripts/issues
// @downloadURL  https://github.com/ZiPenOk/scripts/raw/refs/heads/main/laosiji-new.js
// @updateURL    https://github.com/ZiPenOk/scripts/raw/refs/heads/main/laosiji-new.js
// ==/UserScript==
(function () {
 'use strict';
 const SCRIPT_VERSION = '2.7.9.5'; const DEBUG_LOG = false; const ERROR_LOG = true; const PAGE_ZOOM_DEFAULT = 86; const PAGE_ZOOM_LOW_RES_DEFAULT = 100;
 const PAGE_ZOOM_2K_WIDTH = 2560;
 const getPageZoomDefault = () => {
  const screenLongSide = Math.max(window.screen?.width || 0, window.screen?.height || 0);
  return screenLongSide && screenLongSide < PAGE_ZOOM_2K_WIDTH ? PAGE_ZOOM_LOW_RES_DEFAULT : PAGE_ZOOM_DEFAULT; };
 const getDetailPreviewInlineDefault = () => {
  const screenLongSide = Math.max(window.screen?.width || 0, window.screen?.height || 0);
  return screenLongSide >= PAGE_ZOOM_2K_WIDTH; };
 const JAVDB_REVIEW_INITIAL_LIMIT = 6; const JAVDB_REVIEW_MORE_LIMIT = 20;
 const CFG = {};
 const resolveCfgDefault = meta => typeof meta.def === 'function' ? meta.def() : meta.def;
 const clampCfgNumber = (value, meta) => {
  const fallback = resolveCfgDefault(meta); const parsed = parseInt(value, 10); const next = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(meta.max, Math.max(meta.min, next)); };
 const normalizeCfgValue = (value, meta) => {
  if (meta.normalize) return meta.normalize(value);
  if (meta.bool) return !!value;
  if (Number.isFinite(meta.min) && Number.isFinite(meta.max)) return clampCfgNumber(value, meta);
  return value; };
 const CFG_MAP = {
  javdbSearchUrl: { key: 'cfg_javdb_search_url', def: 'javdb.com' },
  omagUrl: { key: 'cfg_omag_url', def: 'xn--mag-zna.net' },
  u3c3Url: { key: 'cfg_u3c3_url', def: 'www.u3c3.com' },
  btsearchUrl: { key: 'cfg_btsearch_url', def: 'btsearch.love' },
  sukebeiUrl: { key: 'cfg_sukebei_url', def: 'sukebei.nyaa.si' },
  u9a9Url: { key: 'cfg_u9a9_url', def: 'u9a9.com' },
  sokittyUrl: { key: 'cfg_sokitty_url', def: 'w1.sokitty.me' },
  defaultEngine: { key: 'cfg_default_engine', def: 'sukebei.nyaa.si' },
  defaultVideoEngine: { key: 'default_video_engine', def: 'missav' },
  pan115Player: { key: 'pan115_player_mode', def: 'official' },
  javbusCardColumns: { key: 'cfg_javbus_card_columns', def: 5, min: 2, max: 10 },
  javdbCardColumns: { key: 'cfg_javdb_card_columns', def: 5, min: 2, max: 10 },
  javlibCardColumns: { key: 'cfg_javlib_card_columns', def: 5, min: 2, max: 10 },
  javbusPortraitCardColumns: { key: 'cfg_javbus_portrait_card_columns', def: () => CFG.javbusCardColumns, min: 2, max: 10 },
  javdbPortraitCardColumns: { key: 'cfg_javdb_portrait_card_columns', def: () => CFG.javdbCardColumns, min: 2, max: 10 },
  javlibPortraitCardColumns: { key: 'cfg_javlib_portrait_card_columns', def: () => CFG.javlibCardColumns, min: 2, max: 10 },
  mobilePortraitCardColumns: { key: 'cfg_mobile_portrait_card_columns', def: 1, min: 1, max: 2 },
  javbusPageZoom: { key: 'cfg_javbus_page_zoom', def: getPageZoomDefault, min: 60, max: 100 },
  javdbPageZoom: { key: 'cfg_javdb_page_zoom', def: getPageZoomDefault, min: 60, max: 100 },
  javlibPageZoom: { key: 'cfg_javlib_page_zoom', def: getPageZoomDefault, min: 60, max: 100 },
  listPreviewQuick: { key: 'list_preview_quick_enabled', def: true, bool: true },
  detailPreviewInline: { key: 'detail_preview_inline_enabled', def: getDetailPreviewInlineDefault, bool: true },
  titleTranslate: { key: 'title_translate_enabled', def: true, bool: true },
  listOpenNewTab: { key: 'list_open_new_tab_enabled', def: false, bool: true },
  portraitCards: { key: 'portrait_cards_enabled', def: false, bool: true },
  reviewsDefaultExpanded: { key: 'reviews_default_expanded', def: false, bool: true },
  reviewFontSize: { key: 'review_font_size', def: 'medium', normalize: value => ['small', 'medium', 'large'].includes(value) ? value : 'medium' },
  apiMovieDefaultTab: { key: 'javdb_api_movie_default_tab', def: 'reviews', normalize: value => ['magnets', 'reviews'].includes(value) ? value : 'reviews' },
  javdbUseNativePages: { key: 'javdb_use_native_pages', def: false, bool: true },
  javdbFavoriteActorHighlight: { key: 'javdb_favorite_actor_highlight_enabled', def: true, bool: true },
  thumbSourceOrder: { key: 'thumb_source_order', def: () => ['javfree', 'projectjav', 'javstore'] },
  detailFlex: { key: 'detail_flex_settings', def: () => ({}), normalize: value => value || {} },
  btnShowNyaa: { key: 'btn_show_nyaa', def: true, bool: true },
  btnShowJavbus: { key: 'btn_show_javbus', def: true, bool: true },
  btnShowJavdb: { key: 'btn_show_javdb', def: true, bool: true },
  btnShowMissav: { key: 'btn_show_missav', def: true, bool: true },
  btnShowFanza: { key: 'btn_show_fanza', def: true, bool: true },
  btnShowSearch: { key: 'btn_show_search', def: true, bool: true },
  btnShowSubtitle: { key: 'btn_show_subtitle', def: true, bool: true },
  btnShowTrailer: { key: 'btn_show_trailer', def: true, bool: true },
  btnShowPreview: { key: 'btn_show_preview', def: true, bool: true },
  btnShowPan115: { key: 'btn_show_pan115', def: false, bool: true },
  magnetTable: { key: 'magnet_table_enabled', def: true, bool: true },
  magnetDisplayMode: {
   key: 'magnet_display_mode',
   def: () => GM_getValue('magnet_table_enabled', true) ? 'sidebar' : 'native',
   normalize: value => ['sidebar', 'native-replace', 'native'].includes(value) ? value : (GM_getValue('magnet_table_enabled', true) ? 'sidebar' : 'native'), },
  nativeMagnetDefaultTab: { key: 'native_magnet_default_tab', def: 'native', normalize: value => ['native', 'aggregate'].includes(value) ? value : 'native' },
  magnetSort: { key: 'magnet_sort_mode', def: 'size', normalize: value => ['size', 'newest', 'oldest'].includes(value) ? value : 'size' },
  infiniteScroll: { key: 'infinite_scroll_enabled', def: false, bool: true },
  infiniteScrollRestore: { key: 'infinite_scroll_restore_enabled', def: true, bool: true },
  cardFx: { key: 'card_fx_enabled', def: true, bool: true },
  coverHoverPreview: { key: 'cover_hover_preview_enabled', def: false, bool: true },
  pan115CoverHoverPreview: { key: 'pan115_cover_hover_preview_enabled', def: true, bool: true }, };
 Object.entries(CFG_MAP).forEach(([prop, meta]) => {
  Object.defineProperty(CFG, prop, {
   get() { return normalizeCfgValue(GM_getValue(meta.key, resolveCfgDefault(meta)), meta); },
   set(value) {
    GM_setValue(meta.key, normalizeCfgValue(value, meta)); },
  });
 });
 const legacyBtdigUrl = GM_getValue('cfg_btdig_url', 'btdig.com');
 if (CFG.defaultEngine === legacyBtdigUrl) CFG.defaultEngine = CFG.u3c3Url;
 const magnetEngineKeys = ['javdbSearchUrl', 'omagUrl', 'u3c3Url', 'btsearchUrl', 'sukebeiUrl', 'u9a9Url', 'sokittyUrl'];
 if (!magnetEngineKeys.some(key => CFG.defaultEngine === CFG[key])) CFG.defaultEngine = CFG.omagUrl;
 function injectStyle(id, css, update = false) {
  let style = document.getElementById(id);
  if (style) {
   if (update && style.textContent !== css) style.textContent = css;
   return style; }
  style = document.createElement('style'); style.id = id; style.textContent = css;
  (document.head || document.documentElement).appendChild(style); return style; }
 function isPortraitCardsPageAllowed(siteId, href = location.href) {
  let url;
  try {
   url = new URL(href, location.href);
  } catch { return true; }
  const path = url.pathname.replace(/\/+$/, '') || '/'; const params = url.searchParams;
  if (siteId === 'javbus') { return !/^\/(?:[a-z]{2}\/)?uncensored(?:\/|$)/i.test(path); }
  if (siteId === 'javdb') {
   const rankType = (params.get('t') || '').toLowerCase(); const tagName = (path.match(/^\/tags\/([^/]+)$/i)?.[1] || '').toLowerCase();
   const isC10 = params.get('c10') === '1';
   if (params.get('laosiji_detail') === 'fc2' || params.get('laosiji_rank') === 'fc2' || params.get('laosiji_fc2') === '1') return false;
   if (path === '/fc2') return false;
   if (path === '/uncensored' || path === '/western') return false;
   if (path === '/rankings/movies' && /^(uncensored|western|fc2)$/i.test(rankType)) return false;
   if (path === '/tags/fc2') return false;
   if (isC10 && /^(anime|uncensored|western)$/i.test(tagName)) return false;
  }
  return true; }
 function usePortraitCardsOnPage(siteId) { return MobilePolicy.featureEnabled('portraitCards', !!CFG.portraitCards) && isPortraitCardsPageAllowed(siteId); }
 const CardColumns = (() => {
  const LIMITS = { min: 2, max: 10 };
  const MOBILE_PORTRAIT_LIMITS = { min: 1, max: 2 };
  let mobilePortraitValue = null;
  const SITE_META = {
   javbus: { getter: () => CFG.javbusCardColumns, setter: v => { CFG.javbusCardColumns = v; }, portraitGetter: () => CFG.javbusPortraitCardColumns, portraitSetter: v => { CFG.javbusPortraitCardColumns = v; }, selector: '.javbus-card-grid', host: /(?:^|\.)javbus\.com$/i },
   javdb:  { getter: () => CFG.javdbCardColumns,  setter: v => { CFG.javdbCardColumns = v; },  portraitGetter: () => CFG.javdbPortraitCardColumns,  portraitSetter: v => { CFG.javdbPortraitCardColumns = v; },  selector: '.javdb-card-grid',  host: /javdb/i },
   javlib: { getter: () => CFG.javlibCardColumns, setter: v => { CFG.javlibCardColumns = v; }, portraitGetter: () => CFG.javlibPortraitCardColumns, portraitSetter: v => { CFG.javlibPortraitCardColumns = v; }, selector: '.javlib-card-grid', host: /(javlibrary|javlib|r86m|s87n)/i },
  };
  function clamp(value) { return Math.min(LIMITS.max, Math.max(LIMITS.min, parseInt(value, 10) || 5)); }
  function clampMobilePortrait(value) { return Math.min(MOBILE_PORTRAIT_LIMITS.max, Math.max(MOBILE_PORTRAIT_LIMITS.min, parseInt(value, 10) || 1)); }
  function usesMobileColumns() { return MobilePolicy.isMobile(); }
  function get(siteId) {
   const meta = SITE_META[siteId];
   if (!meta) return 5;
   if (usesMobileColumns()) return getMobilePortrait();
   return clamp((usePortraitCardsOnPage(siteId) ? meta.portraitGetter : meta.getter)()); }
  function getMobilePortrait() {
   if (mobilePortraitValue === null) mobilePortraitValue = clampMobilePortrait(CFG.mobilePortraitCardColumns);
   return mobilePortraitValue; }
  function set(siteId, value) {
   const meta = SITE_META[siteId];
   if (!meta) return;
   (usePortraitCardsOnPage(siteId) ? meta.portraitSetter : meta.setter)(clamp(value)); }
  function setMobilePortrait(value) {
   mobilePortraitValue = clampMobilePortrait(value); CFG.mobilePortraitCardColumns = mobilePortraitValue;
   return mobilePortraitValue; }
  function apply(siteId, value = get(siteId)) {
   const meta = SITE_META[siteId];
   if (!meta) return;
   const columns = usesMobileColumns() ? clampMobilePortrait(value) : clamp(value);
   document.querySelectorAll(meta.selector).forEach(el => { el.style.setProperty('--jav-card-columns', String(columns)); }); }
  function detectCurrentSite() {
   const host = location.hostname;
   return Object.entries(SITE_META).find(([, meta]) => meta.host.test(host))?.[0] || ''; }
  return { LIMITS, MOBILE_PORTRAIT_LIMITS, clamp, clampMobilePortrait, get, getMobilePortrait, set, setMobilePortrait, apply, detectCurrentSite };
 })();
 const PortraitCards = (() => {
  function enabled() { return !!CFG.portraitCards; }
  function ensureStyle() {
   injectStyle('jav-portrait-cards-style',`html.jav-card-portrait-mode .jav-card-grid{gap:14px!important}html.jav-card-portrait-mode .jav-card-cover{aspect-ratio:380 / 538!important;background:#f1f5f9!important}html.jav-card-portrait-mode .jav-card-image{object-fit:cover!important;object-position:right center!important}html.jav-card-portrait-mode .javbus-card-title{min-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+58px)!important}html.jav-card-portrait-mode .javdb-card-title{height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;max-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;min-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important}html.jav-card-portrait-mode .javlib-card-title{min-height:calc((var(--javlib-title-line-height,22px) * var(--jav-card-title-lines,2))+54px)!important}`);
  }
  function javbusCoverFromThumb(src) {
   let full = String(src || '').replace(/\/(imgs|pics)\/(thumb|thumbs)\//i, '/$1/cover/');
   if (!/nopic\.jpg/i.test(full)) full = full.replace(/(\.jpg|\.jpeg|\.png)(?:([?#].*)?)$/i, '_b$1$2');
   return full; }
  function syncJavbusImage(img, on) {
   if (!img) return;
   const thumb = img.dataset.laosijiThumbSrc || '';
   if (!thumb) return;
   if (!img.dataset.laosijiCoverSrc) img.dataset.laosijiCoverSrc = javbusCoverFromThumb(thumb);
   const next = img.dataset.laosijiCoverSrc || thumb;
   if (next && img.getAttribute('src') !== next) { img.src = next; img.setAttribute('src', next); }
  }
  function syncJavlibImage(img, on) {
   if (!img) return;
   const current = img.getAttribute('src') || '';
   if (!img.dataset.laosijiLandscapeSrc && /ps\.jpg(?:[?#].*)?$/i.test(current)) {
    img.dataset.laosijiLandscapeSrc = current.replace(/ps\.jpg((?:[?#].*)?)$/i, 'pl.jpg$1'); }
   if (!img.dataset.laosijiLandscapeSrc && /pl\.jpg(?:[?#].*)?$/i.test(current)) { img.dataset.laosijiLandscapeSrc = current; }
   const next = img.dataset.laosijiLandscapeSrc;
   if (next && img.getAttribute('src') !== next) { img.src = next; img.setAttribute('src', next); }
  }
  function syncJavdbImage(img, on) {
   if (!img) return;
   const current = img.getAttribute('src') || '';
   if (!img.dataset.laosijiLandscapeSrc && /\/thumbs\//i.test(current)) {
    img.dataset.laosijiLandscapeSrc = current.replace(/\/thumbs\//i, '/covers/');
   }
   if (!img.dataset.laosijiLandscapeSrc && /\/covers\//i.test(current)) { img.dataset.laosijiLandscapeSrc = current; }
   const next = img.dataset.laosijiLandscapeSrc;
   if (next && img.getAttribute('src') !== next) { img.src = next; img.setAttribute('src', next); }
  }
  function effective(siteId = CardColumns.detectCurrentSite()) { return usePortraitCardsOnPage(siteId); }
  function syncImages(on = effective()) {
   document.querySelectorAll('.javbus-card-image').forEach(img => syncJavbusImage(img, on));
   document.querySelectorAll('.javdb-card-image').forEach(img => syncJavdbImage(img, on));
   document.querySelectorAll('.javlib-card-image').forEach(img => syncJavlibImage(img, on)); }
  function apply(on = enabled()) {
   ensureStyle();
   const site = CardColumns.detectCurrentSite(); const active = !!on && isPortraitCardsPageAllowed(site);
   document.documentElement.classList.toggle('jav-card-portrait-mode', active); syncImages(active);
   if (site) CardColumns.apply(site);
  }
  function set(value) {
   CFG.portraitCards = !!value;
   apply(!!value); }
  return { enabled, effective, apply, set, syncImages };
 })();
 const PageZoom = (() => {
  const LIMITS = { min: 60, max: 100 };
  const SITE_META = {
   javbus: { getter: () => CFG.javbusPageZoom, setter: v => { CFG.javbusPageZoom = v; }, selector: 'body > div.container-fluid, body > div.container', host: /(?:^|\.)javbus\.com$/i },
   javdb:  { getter: () => CFG.javdbPageZoom,  setter: v => { CFG.javdbPageZoom = v; },  selector: 'body > section > div',     host: /javdb/i },
   javlib: { getter: () => CFG.javlibPageZoom, setter: v => { CFG.javlibPageZoom = v; }, selector: '#content',                 host: /(javlibrary|javlib|r86m|s87n)/i },
  };
  function clamp(value) { return Math.min(LIMITS.max, Math.max(LIMITS.min, parseInt(value, 10) || 100)); }
  function get(siteId) { return SITE_META[siteId] ? clamp(SITE_META[siteId].getter()) : 100; }
  function set(siteId, value) {
   if (!SITE_META[siteId]) return;
   SITE_META[siteId].setter(clamp(value)); }
  function isJavbusActorIndexPage(url = location.href) {
   try {
    const path = new URL(url, location.href).pathname.replace(/\/+$/, '');
    return /^\/(?:[a-z]{2}\/)?(?:uncensored\/)?actresses(?:\/\d+)?$/i.test(path);
   } catch (err) { return false; } }
  function reflowJavbusActorWaterfall() {
   const waterfall = document.querySelector('#waterfall');
   if (!waterfall || !waterfall.querySelector('.avatar-box')) return;
   waterfall.style.removeProperty('width'); waterfall.style.setProperty('max-width', '100%', 'important');
   waterfall.style.setProperty('margin-left', 'auto', 'important'); waterfall.style.setProperty('margin-right', 'auto', 'important');
   const run = () => {
    const jq = window.jQuery || window.$;
    try {
     const $waterfall = jq && jq(waterfall);
     if ($waterfall?.masonry) {
      $waterfall.masonry({ itemSelector: '.item', isFitWidth: true });
      ['reloadItems', 'reload', 'layout'].forEach(method => {
       try { $waterfall.masonry(method); } catch (err) {  }
      }); }
    } catch (err) {  }
    window.dispatchEvent(new Event('resize')); };
   requestAnimationFrame(run); setTimeout(run, 160); }
  function apply(siteId, value = get(siteId)) {
   const meta = SITE_META[siteId];
   if (!meta) return;
   if (MobilePolicy.isMobile()) { reset(siteId); return; }
   const zoomValue = clamp(value);
   const widthValue =`${zoomValue}%`;
   if (siteId === 'javlib') {
    const content = document.querySelector('#content');
    if (content) {
     content.style.setProperty('zoom', '1'); content.style.setProperty('width', widthValue, 'important');
     content.style.setProperty('max-width', 'none', 'important'); content.style.setProperty('margin-left', 'auto', 'important');
     content.style.setProperty('margin-right', 'auto', 'important'); content.style.setProperty('box-sizing', 'border-box', 'important');
     content.style.setProperty('padding-left', '12px', 'important'); content.style.setProperty('padding-right', '12px', 'important');
     content.style.setProperty('min-width', '0', 'important'); content.style.setProperty('overflow', 'visible', 'important'); }
    document.documentElement?.style.setProperty('background', '#fff', 'important'); document.body?.style.setProperty('background', '#fff', 'important');
    document.querySelectorAll('#page, #content, #rightcolumn').forEach(el => {
     el?.style.setProperty('background', '#fff', 'important'); el?.style.setProperty('box-sizing', 'border-box', 'important');
     el?.style.setProperty('max-width', '100%', 'important'); el?.style.setProperty('overflow', 'visible', 'important');
    });
    document.querySelectorAll('#rightcolumn > .videothumblist, #rightcolumn > .videothumblist .videos').forEach(el => {
     el.style.setProperty('box-sizing', 'border-box', 'important'); el.style.setProperty('max-width', '100%', 'important');
    });
    return; }
   document.querySelectorAll(meta.selector).forEach(el => {
    if (!el) return;
    el.style.setProperty('zoom', '1'); el.style.setProperty('width', widthValue, 'important'); el.style.setProperty('max-width', 'none', 'important');
    el.style.setProperty('margin-left', 'auto', 'important'); el.style.setProperty('margin-right', 'auto', 'important');
    el.style.setProperty('box-sizing', 'border-box', 'important');
   });
   if (siteId === 'javbus' && isJavbusActorIndexPage()) { reflowJavbusActorWaterfall(); }
  }
  function reset(siteId) {
   const meta = SITE_META[siteId];
   if (!meta) return;
   document.querySelectorAll(meta.selector).forEach(el => {
    ['zoom', 'width', 'max-width', 'margin-left', 'margin-right', 'box-sizing', 'padding-left', 'padding-right', 'min-width', 'overflow'].forEach(name => el.style.removeProperty(name));
   });
   if (siteId === 'javlib') {
    document.querySelectorAll('#page, #content, #rightcolumn').forEach(el => {
     ['box-sizing', 'max-width', 'overflow'].forEach(name => el.style.removeProperty(name));
    });
    document.querySelectorAll('#rightcolumn > .videothumblist, #rightcolumn > .videothumblist .videos').forEach(el => {
     ['box-sizing', 'max-width'].forEach(name => el.style.removeProperty(name));
    }); } }
  function detectCurrentSite() {
   const host = location.hostname;
   return Object.entries(SITE_META).find(([, meta]) => meta.host.test(host))?.[0] || ''; }
  function applyCurrent() {
   const current = detectCurrentSite();
   if (current) apply(current);
  }
  return { LIMITS, clamp, get, set, apply, applyCurrent, detectCurrentSite };
 })();
 const DetailFlex = (() => {
  const LIMITS = { min: 50, max: 200 };
  const DEFAULTS = {
   javbus: { cover: 95, info: 80, magnet: 100 },
   javdb: { cover: 135, info: 105, magnet: 125 },
   javlib: { cover: 100, info: 85, magnet: 100 }, };
  const META = {
   javbus: {
    host: /(?:^|\.)javbus\.com$/i,
    detail: () => !!document.querySelector('.row.movie') && !document.querySelector('#waterfall div.item'),
    root: () => document.querySelector('[data-laosiji-123av-fc2-layout-site="javbus"]') || document.querySelector('.row.movie'),
    vars: { cover: '--javbus-cover-flex', info: '--javbus-info-flex', magnet: '--javbus-magnet-flex' }, },
   javdb: {
    host: /javdb/i,
    detail: () => /\/v\//i.test(location.pathname),
    root: () => document.querySelector('[data-laosiji-123av-fc2-layout-site="javdb"]') || document.querySelector('.jav-flex-container'),
    vars: { cover: '--javdb-cover-flex', info: '--javdb-info-flex', magnet: '--javdb-magnet-flex' }, },
   javlib: {
    host: /(javlibrary|javlib|r86m|s87n)/i,
    detail: () => !!document.querySelector('#video_jacket_info #video_info, #video_id .text'),
    root: () => document.querySelector('[data-laosiji-123av-fc2-layout-site="javlib"]') || document.querySelector('#video_jacket_info tr'),
    vars: { cover: '--javlib-cover-flex', info: '--javlib-info-flex', magnet: '--javlib-magnet-flex' }, }, };
  function clamp(value) { return Math.min(LIMITS.max, Math.max(LIMITS.min, parseInt(value, 10) || 100)); }
  function detectCurrentSite() {
   const host = location.hostname;
   const is123AvDetailRoute = (() => {
    try {
     return new URL(location.href).searchParams.has('laosiji_123av_fc2_detail');
    } catch { return false; }
   })();
   if (is123AvDetailRoute) {
    if (/javbus/i.test(host)) return 'javbus';
    if (/(?:javlibrary|javlib|r86m|s87n)/i.test(host)) return 'javlib';
    if (/javdb/i.test(host)) return 'javdb';
   }
   return Object.entries(META).find(([, meta]) => meta.host.test(host) && meta.detail())?.[0] || ''; }
  function getAll() {
   const saved = CFG.detailFlex;
   return saved && typeof saved === 'object' ? saved : {}; }
  function get(siteId) {
   const all = getAll(); const defaults = DEFAULTS[siteId] || DEFAULTS.javbus;
   const saved = all[siteId] || {};
   return { cover: clamp(saved.cover ?? defaults.cover), info: clamp(saved.info ?? defaults.info), magnet: clamp(saved.magnet ?? defaults.magnet) }; }
  function set(siteId, key, value) {
   if (!META[siteId] || !DEFAULTS[siteId] || !DEFAULTS[siteId].hasOwnProperty(key)) return;
   const all = getAll();
   all[siteId] = { ...get(siteId), [key]: clamp(value) };
   CFG.detailFlex = all; }
  function toFlex(value) { return (clamp(value) / 100).toFixed(2).replace(/\.?0+$/, ''); }
  function defaultCss(siteId = detectCurrentSite()) {
   const values = DEFAULTS[siteId] || DEFAULTS.javbus;
   return { cover: toFlex(values.cover), info: toFlex(values.info), magnet: toFlex(values.magnet) }; }
  function hasMagnet(siteId = detectCurrentSite()) {
   if (!siteId) return false;
   if (document.querySelector(`[data-javdb-standalone-magnet-site="${siteId}"]`)) return true;
   if (!MobilePolicy.usesDesktopMagnetTable()) return false;
   return !!document.querySelector('.jav-nong-slot'); }
  function hasLayout(siteId = detectCurrentSite()) {
   const meta = META[siteId];
   return !!meta?.root?.(); }
  function applyStandaloneMagnet(siteId) {
   const defaults = DEFAULTS[siteId];
   if (!defaults) return;
   const values = get(siteId);
   const width = MobilePolicy.isMobile() ? '100%'
    :`${Math.min(100, Math.max(50, values.magnet / defaults.magnet * 100))}%`;
   document.querySelectorAll('[data-javdb-standalone-magnet]').forEach(section => {
    const sectionSite = section.getAttribute('data-javdb-standalone-magnet-site') || 'javdb';
    if (sectionSite !== siteId) return;
    section.style.setProperty('width', '100%', 'important');
    section.style.setProperty('--javdb-standalone-magnet-scale', String(values.magnet / defaults.magnet));
    const body = section.querySelector('.javdb-fc2-detail-magnet-body');
    const wrapper = body?.firstElementChild?.classList?.contains('jav-nong-wrapper') ? body.firstElementChild : body?.querySelector('.jav-nong-wrapper');
    body?.style.setProperty('width', '100%', 'important'); wrapper?.style.setProperty('width', width, 'important');
    wrapper?.style.setProperty('max-width', '100%', 'important');
   }); }
  function apply(siteId = detectCurrentSite()) {
   const meta = META[siteId];
   if (!meta) return;
   applyStandaloneMagnet(siteId);
   if (MobilePolicy.isMobile()) return;
   const root = meta.root();
   if (!root) return;
   const values = get(siteId); const unifiedRoot = root.matches?.('[data-laosiji-123av-fc2-layout-site]');
   if (unifiedRoot) {
    root.style.setProperty('--jav-detail-cover-flex', toFlex(values.cover)); root.style.setProperty('--jav-detail-info-flex', toFlex(values.info));
    if (hasMagnet(siteId)) root.style.setProperty('--jav-detail-magnet-flex', toFlex(values.magnet));
    return; }
   root.style.setProperty(meta.vars.cover, toFlex(values.cover)); root.style.setProperty(meta.vars.info, toFlex(values.info));
   if (hasMagnet(siteId)) { root.style.setProperty(meta.vars.magnet, toFlex(values.magnet)); }
  }
  return { LIMITS, DEFAULTS, clamp, detectCurrentSite, get, set, apply, hasMagnet, hasLayout, defaultCss };
 })();
 const debugLog = (...args) => {
  if (DEBUG_LOG) console.log('[老司机]', ...args);
 };
 const errorLog = (...args) => {
  if (ERROR_LOG) console.warn('[老司机]', ...args);
 };
 const log = debugLog;
 const Core = {
  version: SCRIPT_VERSION,
  cfg: CFG,
  log,
  debugLog,
  errorLog,
  notify,
  parseHTML,
  gmFetch,
  injectStyle,
  expose(name, value) {
   window[name] = value;
   return value; }, };
 Core.expose('__LAOSIJI_CORE__', Core);
 const VIDEO_ENGINES = [
  { key: 'missav', label: 'MissAV', host: /(?:missav\.(com|ai|ws)|njavtv\.com)/i, color: '#ec4899' },
  { key: 'jable',  label: 'Jable',  host: /jable\.tv/i, color: '#f97316' },
  { key: '123av',  label: '123AV',  host: /123av\.com/i, color: '#10b981' },
  { key: 'javday', label: 'JavDay', host: /javday\.app/i, color: '#0ea5e9' },
  { key: 'supjav', label: 'SupJav', host: /supjav\.com/i, color: '#ef4444' },
  { key: 'javrate', label: 'JavRate', host: /javrate\.com/i, color: '#8b5cf6' }, ];
 Core.expose('__LAOSIJI_VIDEO_ENGINES__', VIDEO_ENGINES);
 const Ui = {
  on(el, event, handler, options) {
   if (!el || typeof handler !== 'function') return null;
   el.addEventListener(event, handler, options);
   return el; },
  click(el, handler, options) { return this.on(el, 'click', handler, options); },
  bindCheckbox(el, checked, onChange) {
   if (!el) return null;
   el.checked = !!checked;
   this.on(el, 'change', () => onChange?.(el.checked, el));
   return el; },
  bindRange(el, valueEl, value, format, onInput) {
   if (!el) return null;
   const toText = typeof format === 'function' ? format : v => String(v);
   el.value = String(value);
   if (valueEl) valueEl.textContent = toText(value);
   this.on(el, 'input', () => {
    const next = el.value;
    if (valueEl) valueEl.textContent = toText(next);
    onInput?.(next, el);
   });
   return el; },
  setSelectValue(select, value, fallback = '') {
   if (!select) return '';
   const options = [...select.options]; const next = options.some(opt => opt.value === value) ? value : fallback;
   if (next && options.some(opt => opt.value === next)) {
    select.value = next;
   } else if (options.length) {
    select.selectedIndex = 0; }
   return select.value; },
  clearSessionByPrefixes(prefixes) {
   let count = 0;
   Object.keys(sessionStorage).forEach(key => {
    if (prefixes.some(prefix => key.startsWith(prefix))) { sessionStorage.removeItem(key); count += 1; }
   });
   return count; }, };
 Core.expose('__LAOSIJI_UI__', Ui);
 function getNotifyTone(title, text) {
  const raw =`${title || ''} ${text || ''}`;
  if (/失败|錯誤|错误|未登录|未登入|异常|失效|无法|失敗|請先|请先/i.test(raw)) return 'error';
  if (/成功|已保存|已添加|任务已添加|已保存授权|登录成功/i.test(raw)) return 'success';
  return 'info'; }
 function showPageNotify(title, text, url) {
  const parent = document.body || document.documentElement;
  if (!parent) return;
  injectStyle('jav-page-notify-style',`.jav-page-notify{position:fixed;top:76px;right:22px;z-index:2147483647;width:min(360px,calc(100vw - 28px));padding:12px 14px;color:#f8fafc;background:rgba(15,23,42,.94);border:1px solid rgba(148,163,184,.28);border-left:4px solid #38bdf8;border-radius:10px;box-shadow:0 16px 42px rgba(0,0,0,.32),0 0 0 1px rgba(255,255,255,.04) inset;backdrop-filter:blur(14px) saturate(1.1);font-family:Arial,"Microsoft YaHei",sans-serif;transform:translateY(-10px);opacity:0;pointer-events:auto;transition:opacity .18s ease,transform .18s ease;cursor:default}.jav-page-notify.is-clickable{cursor:pointer}.jav-page-notify.is-success{border-left-color:#22c55e}.jav-page-notify.is-error{border-left-color:#ef4444}.jav-page-notify.show{opacity:1;transform:translateY(0)}.jav-page-notify.hide{opacity:0;transform:translateY(-10px)}.jav-page-notify-title{margin:0 0 4px;font-size:14px;font-weight:800;line-height:1.35}.jav-page-notify-text{margin:0;color:#dbeafe;font-size:13px;line-height:1.45}@media (max-width:720px){.jav-page-notify{top:14px;right:14px;width:calc(100vw - 28px)}}`);
  document.querySelector('.jav-page-notify')?.remove();
  const toast = document.createElement('div');
  toast.className =`jav-page-notify is-${getNotifyTone(title, text)}${url ? ' is-clickable' : ''}`;
  toast.setAttribute('role', 'status');
  if (url) { toast.title = '点击打开相关页面'; toast.addEventListener('click', () => window.open(url, '_blank', 'noopener,noreferrer')); }
  const titleEl = document.createElement('p');
  titleEl.className = 'jav-page-notify-title'; titleEl.textContent = title || 'JAV 老司机';
  toast.appendChild(titleEl);
  if (text) {
   const textEl = document.createElement('p');
   textEl.className = 'jav-page-notify-text'; textEl.textContent = text;
   toast.appendChild(textEl); }
  parent.appendChild(toast); requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
   toast.classList.remove('show'); toast.classList.add('hide'); setTimeout(() => toast.remove(), 240);
  }, 3400); }
 function notify(title, text, url) {
  showPageNotify(title, text, url); }
 function addJavdbApiLoginStyles() {
  if (document.getElementById('javdb-api-login-style')) return;
  const style = document.createElement('style');
  style.id = 'javdb-api-login-style';
  style.textContent =`#javdb-api-login-overlay{position:fixed;inset:0;z-index:10000030;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.48);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#javdb-api-login-overlay .javdb-api-login-panel{width:min(360px,92vw);padding:22px;border-radius:12px;background:#fff;color:#111827;box-shadow:0 22px 60px rgba(15,23,42,.26);border:1px solid rgba(148,163,184,.38)}#javdb-api-login-overlay .javdb-api-login-title{margin-bottom:16px;font-size:18px;font-weight:800}#javdb-api-login-overlay .javdb-api-login-input{width:100%;height:40px;margin-bottom:12px;padding:0 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;font-size:14px;outline:none;box-sizing:border-box}#javdb-api-login-overlay .javdb-api-login-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}#javdb-api-login-overlay .javdb-api-login-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:4px}#javdb-api-login-overlay button,.javdb-api-login-inline{min-height:34px;padding:0 14px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;font-size:13px;font-weight:800;cursor:pointer}#javdb-api-login-overlay .javdb-api-login-submit,.javdb-api-login-inline{border-color:#2563eb;background:#2563eb;color:#fff}#javdb-api-login-overlay button:disabled{cursor:wait;opacity:.72}#javdb-api-login-overlay .javdb-api-login-tip{margin-top:12px;color:#64748b;font-size:12px;line-height:1.6}`;
  document.head.appendChild(style); }
 function parseHTML(str) { return new DOMParser().parseFromString(str, 'text/html'); }
 function gmFetch(url, opts = {}) {
  let request = null; let settled = false; let resolveRequest;
  const promise = new Promise(resolve => {
   resolveRequest = resolve;
   const finish = (response, kind = '') => {
    if (settled) return;
    settled = true;
    const result = response || {};
    const status = Number(result.status) || 0; const resolvedKind = kind || (status >= 200 && status < 400 ? '' : 'http'); const ok = resolvedKind === '';
    result.ok = ok; result.loadstuts = ok;
    result.error = resolvedKind ? { kind: resolvedKind, url, status } : null;
    if (resolvedKind === 'timeout' && !result.finalUrl) result.finalUrl = url;
    resolve(result); };
   try {
    request = GM_xmlhttpRequest({
     method: 'GET',
     timeout: 20000, ...opts,
     url,
     onload: response => finish(response),
     onerror: response => finish(response, 'network'),
     onabort: response => finish(response, 'abort'),
     ontimeout: response => finish(response, 'timeout'),
    });
   } catch (error) { finish({ status: 0, cause: error }, 'network'); }
  });
  promise.abort = () => {
   if (settled) return false;
   if (typeof request?.abort === 'function') { request.abort(); return true; }
   resolveRequest({
    status: 0,
    ok: false,
    loadstuts: false,
    error: { kind: 'abort', url },
   });
   settled = true;
   return true; };
  return promise; }
 function normalizeAvid(raw) {
  if (!raw) return '';
  raw = raw.trim().toUpperCase();
  if (raw.match(/-[^0]/)) return raw;
  if (raw.match(/^[0-9_-]+$/)) return raw;
  const m = raw.match(/^([A-Z]+[-_]?)(\d+)$/);
  if (m) return m[1].replace(/[-_]$/, '') + '-' + m[2];
  return raw; }
 function insertAvidCopyBtn(anchor, avid, nativeCopyBtn = null, append = false) {
  if (!anchor || !avid) return;
  const code = normalizeAvid(avid); const parent = anchor.parentElement || anchor;
  parent.querySelectorAll('.jav-avid-copy').forEach(btn => btn.remove()); nativeCopyBtn?.style.setProperty('display', 'none', 'important');
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'jav-avid-copy'; btn.textContent = '复制番号';
  btn.title =`复制番号：${code}`;
  btn.style.cssText = 'display:inline-block;min-width:62px;margin-left:8px;padding:2px 8px;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,"Microsoft YaHei","PingFang SC","Noto Sans CJK SC","Segoe UI",sans-serif;font-weight:600;text-align:center;background:#e8f4fd;border:1px solid #90c5e8;border-radius:4px;cursor:pointer;color:#1a6fa8;vertical-align:middle;white-space:nowrap;box-sizing:border-box;';
  btn.addEventListener('click', e => {
   e.preventDefault(); e.stopPropagation(); GM_setClipboard(code);
   btn.textContent = '已复制';
   setTimeout(() => { btn.textContent = '复制番号'; }, 900);
  });
  if (append) anchor.appendChild(btn);
  else anchor.after(btn);
 }
 const MobilePolicy = (() => {
  const NARROW_VIEWPORT_QUERY = '(max-width:720px)'; const LANDSCAPE_VIEWPORT_QUERY = '(orientation:landscape) and (max-height:720px)';
  const COARSE_POINTER_QUERY = '(pointer:coarse)';
  const DISABLED_FEATURES = new Set(['pageZoom', 'portraitCards', 'detailFlex', 'cardFx', 'coverHoverPreview', 'pan115CoverHoverPreview', 'detailPreviewInline']);
  const listeners = new Set(); let mediaQueries = []; let mobile = false; let started = false;
  function isMobile() { return mobile; }
  function matches(query) { return !!window.matchMedia?.(query).matches; }
  function isMobileClient() {
   const userAgent = navigator.userAgent || '';
   return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || matches(COARSE_POINTER_QUERY); }
  function matchesMobileViewport() { return matches(NARROW_VIEWPORT_QUERY) || (matches(LANDSCAPE_VIEWPORT_QUERY) && isMobileClient()); }
  function featureEnabled(name, configured = true) { return !mobile || !DISABLED_FEATURES.has(name) ? configured : false; }
  function effectiveMagnetDisplayMode() {
   if (mobile) return CFG.magnetDisplayMode === 'native' ? 'native' : 'native-replace';
   return CFG.magnetDisplayMode; }
  function usesDesktopMagnetTable() { return !mobile && CFG.magnetTable; }
  function applyRootState() {
   const root = document.documentElement;
   if (!root) return;
   root.toggleAttribute('data-laosiji-mobile', mobile); root.classList.toggle('laosiji-mobile', mobile); }
  function syncConsumers() {
   if (typeof PageZoom !== 'undefined') PageZoom.applyCurrent();
   if (typeof PortraitCards !== 'undefined') PortraitCards.apply(featureEnabled('portraitCards', CFG.portraitCards));
   if (typeof CardFx !== 'undefined') CardFx.apply(featureEnabled('cardFx', CFG.cardFx));
   if (typeof CoverHoverPreview !== 'undefined') CoverHoverPreview.sync();
   if (typeof DetailPreviewInline !== 'undefined') DetailPreviewInline.sync();
   if (typeof DetailCoverDownload !== 'undefined') DetailCoverDownload.sync();
   if (typeof SiteManager !== 'undefined') SiteManager.initCurrent();
   if (typeof MobileSettingsEntry !== 'undefined') MobileSettingsEntry.sync();
  }
  function update(next, notify = true) {
   const changed = mobile !== next;
   mobile = next;
   applyRootState();
   if (changed && notify) {
    listeners.forEach(listener => {
     try { listener(mobile); } catch (err) { errorLog('移动端策略监听失败:', err); }
    });
    syncConsumers(); } }
  function start() {
   if (started) return;
   started = true;
   mediaQueries = [NARROW_VIEWPORT_QUERY, LANDSCAPE_VIEWPORT_QUERY, COARSE_POINTER_QUERY] .map(query => window.matchMedia?.(query)) .filter(Boolean);
   update(matchesMobileViewport(), false);
   mediaQueries.forEach(mediaQuery => {
    if (mediaQuery.addEventListener) {
     mediaQuery.addEventListener('change', () => update(matchesMobileViewport()));
    } else if (mediaQuery.addListener) {
     mediaQuery.addListener(() => update(matchesMobileViewport())); }
   }); }
  function onChange(listener) {
   if (typeof listener !== 'function') return () => {};
   listeners.add(listener); return () => listeners.delete(listener); }
  return { start, isMobile, featureEnabled, effectiveMagnetDisplayMode, usesDesktopMagnetTable, onChange };
 })();
 Core.expose('__LAOSIJI_MOBILE_POLICY__', MobilePolicy);
 function injectSettingsPanelStyles() {
  GM_addStyle(`#jav-settings-overlay{position:fixed;inset:0;z-index:10000020;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(7px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#jav-settings-panel{width:min(800px,94vw);max-height:88vh;background:linear-gradient(180deg,#f8fbff 0%,#f6f3ff 46%,#fff7ed 100%);color:#111827;border:1px solid rgba(148,163,184,.38);border-radius:16px;box-shadow:0 26px 76px rgba(15,23,42,.36);display:flex;flex-direction:column;overflow:hidden}#jav-settings-panel *{box-sizing:border-box}#jav-settings-panel .sp-header{padding:18px 22px;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 54%,#7c2d12 100%);border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:space-between;flex:0 0 auto}#jav-settings-panel .sp-title{font-size:18px;font-weight:750;color:#fff}#jav-settings-panel .sp-close{width:32px;height:32px;border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:18px;line-height:1}#jav-settings-panel .sp-close:hover{background:rgba(255,255,255,.18)}#jav-settings-panel .sp-body{padding:18px 22px;overflow:auto;display:grid;gap:14px;flex:1 1 auto;min-height:0;overscroll-behavior:contain;scrollbar-gutter:stable}#jav-settings-panel .sp-card{position:relative;background:rgba(255,255,255,.92);border:1px solid rgba(203,213,225,.88);border-radius:10px;padding:15px;box-shadow:0 10px 24px rgba(15,23,42,.06);overflow:hidden}#jav-settings-panel .sp-card::before{content:'';position:absolute;left:0;top:0;width:4px;height:100%;background:#2563eb}#jav-settings-panel .sp-card-magnet::before{background:#16a34a}#jav-settings-panel .sp-card-features::before{background:#00a85a}#jav-settings-panel .sp-card-order::before{background:#dc2626}#jav-settings-panel .sp-card-title{font-size:13px;font-weight:750;color:#1e293b;margin-bottom:12px}#jav-settings-panel .sp-card-jump::before{background:#6366f1}#jav-settings-panel .sp-card-jump .sp-grid{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}#jav-settings-panel .sp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}#jav-settings-panel .sp-feature-order-row{display:grid;grid-template-columns:2fr 1fr;gap:14px;align-items:stretch}#jav-settings-panel .sp-feature-order-row>.sp-card{height:100%}#jav-settings-panel .sp-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#jav-settings-panel .sp-feature-item{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;padding:10px 11px;border:1px solid #e2e8f0;border-radius:8px;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%)}#jav-settings-panel .sp-feature-item:has(#sp-clear-preview-cache){order:2;grid-column:1}#jav-settings-panel .sp-feature-item:has(#sp-clear-trailer-cache){order:2;grid-column:2}#jav-settings-panel .sp-feature-item .sp-desc{margin-top:2px;font-size:11px}#jav-settings-panel .sp-feature-select{order:1;grid-column:2;display:grid;grid-template-columns:1fr 64px;align-items:center;gap:10px;min-width:0;padding:10px 11px;border:1px solid #e2e8f0;border-radius:8px;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%)}#jav-settings-panel .sp-feature-select .sp-select{height:28px;padding:3px 2px 3px 4px;font-size:12px;text-align:left}#jav-settings-panel .sp-feature-magnet-display{order:1;grid-column:1;grid-template-columns:minmax(0,1fr) 100px}#jav-settings-panel .sp-feature-select:has(#sp-pan115-player){grid-template-columns:minmax(0,1fr) 100px}#jav-settings-panel .sp-feature-restore-toggle{order:4;grid-column:1 / -1;cursor:pointer}#jav-settings-panel .sp-feature-item:has(#sp-javdb-native-pages){order:3;grid-column:1 / -1;cursor:pointer}#jav-settings-panel .sp-feature-checkbox{width:18px;height:18px;flex:0 0 auto;accent-color:#4f46e5;cursor:pointer}#jav-settings-panel .sp-cache-clean{background:linear-gradient(135deg,#fff 0%,#f8fbff 58%,#f0f9ff 100%)}#jav-settings-panel .sp-cache-clear-btn{position:relative;width:34px;height:34px;flex:0 0 auto;display:grid;place-items:center;border:1px solid #bae6fd;border-radius:10px;background:linear-gradient(180deg,#f0f9ff,#fff);color:#0284c7;cursor:pointer;overflow:hidden;transition:transform .16s,border-color .16s,background .16s,color .16s,box-shadow .16s}#jav-settings-panel .sp-cache-clear-btn::after{content:'';position:absolute;inset:-8px;border-radius:inherit;background:radial-gradient(circle,rgba(14,165,233,.22),transparent 62%);opacity:0;transform:scale(.45);transition:opacity .22s,transform .22s}#jav-settings-panel .sp-cache-clear-btn:hover{transform:translateY(-1px);border-color:#38bdf8;color:#0369a1;box-shadow:0 8px 18px rgba(14,165,233,.18)}#jav-settings-panel .sp-cache-clear-btn:active{transform:translateY(0) scale(.96)}#jav-settings-panel .sp-cache-clear-btn.is-clearing::after{opacity:1;transform:scale(1)}#jav-settings-panel .sp-cache-clear-btn.is-done{border-color:#86efac;background:linear-gradient(180deg,#ecfdf5,#fff);color:#15803d}#jav-settings-panel .sp-cache-clear-icon{position:relative;z-index:1;display:inline-block;font-size:15px;line-height:1}#jav-settings-panel .sp-cache-clear-btn.is-clearing .sp-cache-clear-icon{animation:spCacheSpin .48s ease}@keyframes spCacheSpin{to{transform:rotate(360deg)}}#jav-settings-panel .sp-field{display:flex;flex-direction:column;gap:6px;min-width:0}#jav-settings-panel .sp-label{font-size:12px;font-weight:650;color:#475569}#jav-settings-panel .sp-input,#jav-settings-panel .sp-select{width:100%;min-width:0;height:34px;padding:6px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-size:13px;outline:none}#jav-settings-panel .sp-input:focus,#jav-settings-panel .sp-select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.13)}#jav-settings-panel .sp-engine-row{display:grid;grid-template-columns:170px 1fr;gap:10px;align-items:end}#jav-settings-panel .sp-cache-actions{display:flex;align-items:center;gap:8px;margin-right:auto}#jav-settings-panel .sp-cache-feedback{min-width:64px;color:#059669;font-size:12px;font-weight:650}#jav-settings-panel .sp-footer-links{display:flex;align-items:center;gap:8px;margin-right:4px}#jav-settings-panel .sp-footer-link{color:#475569;font-size:12px;font-weight:700;text-decoration:none;padding:6px 8px;border-radius:7px}#jav-settings-panel .sp-footer-link:hover{color:#1d4ed8;background:#eff6ff}#jav-settings-panel .sp-footer-sep{width:1px;height:16px;background:#cbd5e1}#jav-settings-panel .sp-desc{font-size:12px;color:#64748b;line-height:1.45}#jav-settings-panel .sp-toggle{position:relative;display:inline-block;width:42px;height:24px;flex:0 0 auto}#jav-settings-panel .sp-toggle input{opacity:0;width:0;height:0}#jav-settings-panel .sp-toggle-track{position:absolute;inset:0;border-radius:999px;background:#cbd5e1;cursor:pointer;transition:background .18s}#jav-settings-panel .sp-toggle-track::before{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(15,23,42,.25);transition:transform .18s}#jav-settings-panel .sp-toggle input:checked+.sp-toggle-track{background:#2563eb}#jav-settings-panel .sp-toggle input:checked+.sp-toggle-track::before{transform:translateX(18px)}#jav-settings-panel .sp-order-list{display:flex;flex-direction:column;gap:8px}#jav-settings-panel .sp-order-item{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid #e2e8f0;border-radius:8px;background:linear-gradient(90deg,#fff 0%,#f8fafc 100%);user-select:none}#jav-settings-panel .sp-order-name{font-size:13px;font-weight:700;color:#1e293b}#jav-settings-panel .sp-dot{width:9px;height:9px;border-radius:50%}#jav-settings-panel .sp-order-actions{display:flex;gap:5px}#jav-settings-panel .sp-order-btn{width:28px;height:28px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;cursor:pointer;font-size:14px;line-height:1}#jav-settings-panel .sp-order-btn:hover:not(:disabled){border-color:#2563eb;color:#1d4ed8;background:#eff6ff}#jav-settings-panel .sp-order-btn:disabled{opacity:.36;cursor:not-allowed}#jav-settings-panel .sp-footer{padding:14px 22px;background:rgba(255,255,255,.92);border-top:1px solid rgba(203,213,225,.86);display:flex;align-items:center;justify-content:flex-end;gap:10px;flex:0 0 auto}#jav-settings-panel .sp-btn{height:34px;padding:0 16px;border-radius:8px;border:1px solid transparent;font-size:13px;font-weight:700;cursor:pointer}#jav-settings-panel .sp-btn-cancel{background:#fff;color:#475569;border-color:#cbd5e1}#jav-settings-panel .sp-btn-clear{background:#fff7ed;color:#9a3412;border-color:#fed7aa}#jav-settings-panel .sp-btn-clear:hover{background:#ffedd5}#jav-settings-panel .sp-btn-save{background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;box-shadow:0 8px 20px rgba(79,70,229,.25)}@media (max-width:640px){#jav-settings-panel .sp-grid,#jav-settings-panel .sp-engine-row,#jav-settings-panel .sp-feature-grid,#jav-settings-panel .sp-feature-order-row{grid-template-columns:1fr}#jav-settings-panel .sp-feature-item{grid-column:auto!important}#jav-settings-panel .sp-cache-actions{margin-right:0}#jav-settings-panel .sp-footer{flex-wrap:wrap}}#jav-settings-panel .sp-chip-group{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}#jav-settings-panel .sp-chip input{display:none}#jav-settings-panel .sp-chip-label{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;border:.5px solid var(--color-border-secondary,#cbd5e1);background:var(--color-background-secondary,#f8fafc);color:var(--color-text-secondary,#64748b);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;user-select:none}#jav-settings-panel .sp-chip input:checked+.sp-chip-label{border-color:#6366f1;background:#eef2ff;color:#4338ca}#jav-settings-panel .sp-chip-label:hover{border-color:#a5b4fc;background:#f0f4ff;color:#4338ca}#jav-settings-panel .sp-chip-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.6;flex:0 0 auto}@media (max-width:720px){#jav-settings-overlay{align-items:flex-start;padding:6px}#jav-settings-panel{width:100%;max-height:calc(100dvh - 12px);border-radius:12px}#jav-settings-panel .sp-header{padding:14px 16px}#jav-settings-panel .sp-body{padding:12px;gap:10px}#jav-settings-panel .sp-card{padding:12px}#jav-settings-panel .sp-footer{padding:10px 12px;gap:8px}#jav-settings-panel .sp-btn{min-height:40px}#jav-settings-panel .sp-input,#jav-settings-panel .sp-select{min-height:40px;height:40px}#jav-settings-panel .sp-chip-label{min-height:36px;padding:7px 10px}}html[data-laosiji-mobile] #jav-settings-overlay{align-items:center;padding:6px}html[data-laosiji-mobile] #jav-settings-panel{width:min(800px,calc(100vw - 12px));height:calc(100dvh - 12px);max-height:calc(100dvh - 12px);min-height:0;box-sizing:border-box}html[data-laosiji-mobile] #jav-settings-panel .sp-body{display:flex;flex-direction:column;align-items:stretch;scroll-padding-block:12px;-webkit-overflow-scrolling:touch}html[data-laosiji-mobile] #jav-settings-panel .sp-grid,html[data-laosiji-mobile] #jav-settings-panel .sp-engine-row,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-grid,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-order-row{grid-template-columns:minmax(0,1fr)}html[data-laosiji-mobile] #jav-settings-panel .sp-feature-item,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-select,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-magnet-display,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-restore-toggle,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-item:has(#sp-clear-preview-cache),html[data-laosiji-mobile] #jav-settings-panel .sp-feature-item:has(#sp-clear-trailer-cache),html[data-laosiji-mobile] #jav-settings-panel .sp-feature-item:has(#sp-javdb-native-pages){grid-column:auto!important}html[data-laosiji-mobile] #jav-settings-panel .sp-feature-select,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-magnet-display,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-select:has(#sp-pan115-player){grid-template-columns:minmax(0,1fr) 108px}html[data-laosiji-mobile] #jav-settings-panel .sp-card,html[data-laosiji-mobile] #jav-settings-panel .sp-feature-order-row{flex:0 0 auto}html[data-laosiji-mobile] #jav-settings-panel .sp-footer{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}html[data-laosiji-mobile] #jav-settings-panel .sp-cache-actions{display:grid;grid-column:1 / -1;grid-template-columns:minmax(0,1fr) auto;gap:4px 8px;width:100%;margin:0}html[data-laosiji-mobile] #jav-settings-panel .sp-footer-links{min-width:0;gap:2px;margin:0}html[data-laosiji-mobile] #jav-settings-panel .sp-footer-link{padding:6px 5px;white-space:nowrap}html[data-laosiji-mobile] #jav-settings-panel .sp-cache-feedback{grid-column:1 / -1;min-width:0}html[data-laosiji-mobile] #jav-settings-panel .sp-footer>.sp-btn{width:100%}`);
 }
 const SettingsPanel = (() => {
  const MAGNET_ENGINES = [
   { key: 'javdbSearchUrl',  label: 'JavDB',        placeholder: 'javdb.com' },
   { key: 'omagUrl',         label: 'ØMagnet',       placeholder: 'xn--mag-zna.net' },
   { key: 'u3c3Url',         label: 'U3C3',         placeholder: 'www.u3c3.com' },
   { key: 'btsearchUrl',     label: 'BTSearch',     placeholder: 'btsearch.love' },
   { key: 'sukebeiUrl',      label: 'Sukebei',      placeholder: 'sukebei.nyaa.si' },
   { key: 'u9a9Url',         label: 'U9A9',         placeholder: 'u9a9.com' },
   { key: 'sokittyUrl',      label: 'SoKitty',      placeholder: 'w1.sokitty.me' }, ];
  const JUMP_SEARCH_ENGINES = ['BTDigg', 'Taocili', 'Google', 'Bing', 'DuckGo', 'AVBase'];
  const BUTTON_TOGGLE_META = [
   { key: 'nyaa', cfgKey: 'btnShowNyaa', label: 'Sukebei' },
   { key: 'javbus', cfgKey: 'btnShowJavbus', label: 'JavBus' },
   { key: 'javdb', cfgKey: 'btnShowJavdb', label: 'JavDB' },
   { key: 'missav', cfgKey: 'btnShowMissav', label: '视频组' },
   { key: 'fanza', cfgKey: 'btnShowFanza', label: 'FANZA' },
   { key: 'search', cfgKey: 'btnShowSearch', label: '搜索组' },
   { key: 'subtitle', cfgKey: 'btnShowSubtitle', label: '字幕' },
   { key: 'trailer', cfgKey: 'btnShowTrailer', label: '预告片' },
   { key: 'preview', cfgKey: 'btnShowPreview', label: '预览图' }, ];
  const THUMB_META = {
   javfree:    { label: 'javfree.me',     color: '#16a34a' },
   projectjav: { label: 'projectjav.com', color: '#ca8a04' },
   javstore:   { label: 'javstore.net',   color: '#dc2626' }, };
  function renderButtonToggles() {
   return BUTTON_TOGGLE_META.map(({ key, label }) =>`<label class="sp-chip"><input id="sp-btn-${key}" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>${label}</span></label>`).join('');
  }
  const stripProtocol = value => String(value || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  function open() {
   document.getElementById('jav-settings-overlay')?.remove(); injectSettingsPanelStyles();
   const overlay = document.createElement('div');
   overlay.id = 'jav-settings-overlay';
   overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
   const panel = document.createElement('div');
   panel.id = 'jav-settings-panel';
   panel.innerHTML =`<div class="sp-header"><div><div class="sp-title">老司机设置</div></div><button class="sp-close" type="button" title="关闭">×</button></div><div class="sp-body"><section class="sp-card sp-card-magnet"><div class="sp-card-title">磁力搜索</div><div class="sp-grid"><label class="sp-field"><span class="sp-label">默认磁力引擎</span><select class="sp-select" id="sp-default-engine"></select></label><div class="sp-engine-row"><label class="sp-field"><span class="sp-label">编辑引擎</span><select class="sp-select" id="sp-engine-picker"></select></label><label class="sp-field"><span class="sp-label">域名</span><input class="sp-input" id="sp-engine-domain"></label></div></div></section><div class="sp-feature-order-row"><section class="sp-card sp-card-features"><div class="sp-card-title">功能项开关</div><div class="sp-feature-grid"><div class="sp-feature-item sp-cache-clean"><div><div class="sp-label">预览图缓存</div><div class="sp-desc">清理本页会话缓存</div></div><button class="sp-cache-clear-btn" id="sp-clear-preview-cache" type="button" title="清理预览图缓存"><span class="sp-cache-clear-icon">↻</span></button></div><div class="sp-feature-item sp-cache-clean"><div><div class="sp-label">预告片缓存</div><div class="sp-desc">清理解析结果缓存</div></div><button class="sp-cache-clear-btn" id="sp-clear-trailer-cache" type="button" title="清理预告片缓存"><span class="sp-cache-clear-icon">↻</span></button></div><label class="sp-feature-select sp-feature-magnet-display"><div><div class="sp-label">聚合搜索</div></div><select class="sp-select" id="sp-magnet-display"><option value="sidebar">独立磁力表</option><option value="native-replace">原页面增强</option><option value="native">关闭</option></select></label><label class="sp-feature-select"><div><div class="sp-label">115播放器</div></div><select class="sp-select" id="sp-pan115-player"><option value="official">官方</option><option value="115master">Master</option><option value="potplayer">PotPlayer</option></select></label><label class="sp-feature-item sp-feature-restore-toggle"><div><div class="sp-label">自动恢复瀑布流历史</div><div class="sp-desc">刷新或返回时恢复已加载内容；低配置电脑可关闭</div></div><input class="sp-feature-checkbox" id="sp-infinite-scroll-restore" type="checkbox"></label><label class="sp-feature-item"><div><div class="sp-label">JavDB原生页面</div><div class="sp-desc">JavDB会员可开启此功能</div></div><input class="sp-feature-checkbox" id="sp-javdb-native-pages" type="checkbox"></label></div></section><section class="sp-card sp-card-order"><div class="sp-card-title">预览图来源顺序</div><div class="sp-order-list" id="sp-thumb-order"></div></section></div><section class="sp-card sp-card-jump" style="--card-color:#6366f1;"><div class="sp-card-title">跳转入口与按钮控制</div><div class="sp-grid"><label class="sp-field"><span class="sp-label">默认搜索入口</span><select class="sp-select" id="sp-jump-engine"></select></label><label class="sp-field"><span class="sp-label">默认视频入口</span><select class="sp-select" id="sp-video-engine"></select></label></div><div class="sp-chip-group"> ${renderButtonToggles()} </div></section></div><div class="sp-footer"><div class="sp-cache-actions"><div class="sp-footer-links"><a class="sp-footer-link" href="https://github.com/ZiPenOk/scripts" target="_blank" rel="noopener noreferrer">Github</a><span class="sp-footer-sep"></span><a class="sp-footer-link" href="https://sleazyfork.org/zh-CN/scripts/576375-jav%E8%80%81%E5%8F%B8%E6%9C%BA-%E6%96%B0/feedback" target="_blank" rel="noopener noreferrer">反馈</a><span class="sp-footer-sep"></span><span class="sp-footer-link" style="cursor:default;color:#94a3b8;">v${SCRIPT_VERSION}</span></div><button class="sp-btn sp-btn-clear" id="sp-clear-cache" type="button">清空缓存</button><span class="sp-cache-feedback" id="sp-cache-feedback"></span></div><button class="sp-btn sp-btn-cancel" type="button">取消</button><button class="sp-btn sp-btn-save" type="button">保存设置</button></div>`;
   overlay.appendChild(panel); document.body.appendChild(overlay);
   const defaultSelect = panel.querySelector('#sp-default-engine'); const picker = panel.querySelector('#sp-engine-picker');
   const domainInput = panel.querySelector('#sp-engine-domain'); const jumpEngineSelect = panel.querySelector('#sp-jump-engine');
   const videoEngineSelect = panel.querySelector('#sp-video-engine'); const magnetDisplaySelect = panel.querySelector('#sp-magnet-display');
   const clearPreviewCacheBtn = panel.querySelector('#sp-clear-preview-cache'); const clearTrailerCacheBtn = panel.querySelector('#sp-clear-trailer-cache');
   const pan115PlayerSelect = panel.querySelector('#sp-pan115-player');
   const infiniteScrollRestoreCheckbox = panel.querySelector('#sp-infinite-scroll-restore');
   const javdbNativePagesCheckbox = panel.querySelector('#sp-javdb-native-pages');
   const btnToggles = Object.fromEntries(BUTTON_TOGGLE_META.map(({ key }) => (
    [key, panel.querySelector(`#sp-btn-${key}`)]
   )));
   const clearCacheBtn = panel.querySelector('#sp-clear-cache'); const cacheFeedback = panel.querySelector('#sp-cache-feedback');
   const orderList = panel.querySelector('#sp-thumb-order'); const domainDraft = Object.fromEntries(MAGNET_ENGINES.map(item => [item.key, CFG[item.key]]));
   let currentOrder = GM_getValue('thumb_source_order', ['javfree', 'projectjav', 'javstore']);
   Object.keys(THUMB_META).forEach(src => { if (!currentOrder.includes(src)) currentOrder.push(src); });
   currentOrder = currentOrder.filter(src => THUMB_META[src]);
   const syncDefaultOptions = () => {
    const current = defaultSelect.value || CFG.defaultEngine;
    defaultSelect.innerHTML = '';
    MAGNET_ENGINES.forEach(item => {
     const value = domainDraft[item.key];
     defaultSelect.add(new Option(`${item.label} (${value})`, value));
    });
    defaultSelect.value = [...defaultSelect.options].some(opt => opt.value === current) ? current : CFG.defaultEngine;
    if (![...defaultSelect.options].some(opt => opt.value === defaultSelect.value)) defaultSelect.selectedIndex = 0;
   };
   MAGNET_ENGINES.forEach(item => { picker.add(new Option(item.label, item.key)); });
   const loadPickedDomain = () => {
    const meta = MAGNET_ENGINES.find(item => item.key === picker.value);
    domainInput.value = domainDraft[picker.value] || ''; domainInput.placeholder = meta?.placeholder || ''; };
   picker.addEventListener('change', loadPickedDomain);
   domainInput.addEventListener('input', () => {
    domainDraft[picker.value] = stripProtocol(domainInput.value);
    syncDefaultOptions();
   });
   JUMP_SEARCH_ENGINES.forEach((name, index) => { jumpEngineSelect.add(new Option(name, String(index))); });
   VIDEO_ENGINES.forEach(item => { videoEngineSelect.add(new Option(item.label, item.key)); });
   jumpEngineSelect.value = String(GM_getValue('default_search_engine', JUMP_SEARCH_ENGINES.length - 1));
   Ui.setSelectValue(videoEngineSelect, CFG.defaultVideoEngine, 'missav');
   if (pan115PlayerSelect) {
    pan115PlayerSelect.value = ['official', '115master', 'potplayer'].includes(CFG.pan115Player) ? CFG.pan115Player : 'official'; }
   if (infiniteScrollRestoreCheckbox) infiniteScrollRestoreCheckbox.checked = CFG.infiniteScrollRestore;
   if (javdbNativePagesCheckbox) javdbNativePagesCheckbox.checked = CFG.javdbUseNativePages;
   Ui.setSelectValue(magnetDisplaySelect, CFG.magnetDisplayMode, 'sidebar');
   BUTTON_TOGGLE_META.forEach(({ key, cfgKey }) => { btnToggles[key].checked = CFG[cfgKey]; });
   const renderOrder = () => {
    orderList.innerHTML = '';
    currentOrder.forEach((src, index) => {
     const meta = THUMB_META[src]; const item = document.createElement('div');
     item.className = 'sp-order-item'; item.dataset.src = src;
     item.innerHTML =`<div><div class="sp-order-name"> ${meta.label} </div></div><span class="sp-dot" style="background: ${meta.color} "></span><div class="sp-order-actions"><button class="sp-order-btn" type="button" data-dir="-1" title="上移" ${index === 0 ? 'disabled' : ''} >↑</button><button class="sp-order-btn" type="button" data-dir="1" title="下移" ${index === currentOrder.length - 1 ? 'disabled' : ''} >↓</button></div>`;
     orderList.appendChild(item);
    }); };
   orderList.addEventListener('click', e => {
    const btn = e.target.closest('.sp-order-btn');
    if (!btn) return;
    const item = btn.closest('.sp-order-item'); const from = currentOrder.indexOf(item?.dataset.src); const to = from + parseInt(btn.dataset.dir, 10);
    if (from < 0 || to < 0 || to >= currentOrder.length) return;
    [currentOrder[from], currentOrder[to]] = [currentOrder[to], currentOrder[from]];
    renderOrder();
   });
   const flashCacheButton = (btn, label, count) => {
    if (!btn) return;
    btn.classList.remove('is-done'); btn.classList.add('is-clearing');
    setTimeout(() => {
     btn.classList.remove('is-clearing'); btn.classList.add('is-done');
     cacheFeedback.textContent = count ?`${label} ${count} 项` :`${label}无缓存`;
     setTimeout(() => btn.classList.remove('is-done'), 900);
     setTimeout(() => { cacheFeedback.textContent = ''; }, 1800);
    }, 260); };
   clearPreviewCacheBtn.addEventListener('click', () => {
    const count = Ui.clearSessionByPrefixes(['thumb_cache_', 'pan115_javdb_cover_v1_', 'pan115_cover_v2_']);
    flashCacheButton(clearPreviewCacheBtn, '预览图已清理', count);
   });
   clearTrailerCacheBtn.addEventListener('click', () => {
    const count = Ui.clearSessionByPrefixes(['trailer_cache_']);
    flashCacheButton(clearTrailerCacheBtn, '预告片已清理', count);
   });
   clearCacheBtn.addEventListener('click', () => {
    const count = Ui.clearSessionByPrefixes(['thumb_cache_', 'trailer_cache_', 'pan115_cache_', 'pan115_javdb_cover_v1_', 'pan115_cover_v2_']);
    cacheFeedback.textContent = count ?`已清空 ${count} 项` : '无缓存';
    setTimeout(() => { cacheFeedback.textContent = ''; }, 1800);
   });
   picker.value = 'javdbSearchUrl';
   loadPickedDomain(); syncDefaultOptions(); renderOrder();
   const closePanel = () => overlay.remove();
   panel.querySelector('.sp-close').addEventListener('click', closePanel); panel.querySelector('.sp-btn-cancel').addEventListener('click', closePanel);
   panel.querySelector('.sp-btn-save').addEventListener('click', () => {
    const snapshotNonPan115 = () => JSON.stringify({
     domains: MAGNET_ENGINES.map(item => CFG[item.key]),
     defaultEngine: CFG.defaultEngine,
     defaultSearchEngine: GM_getValue('default_search_engine', 2),
     defaultVideoEngine: CFG.defaultVideoEngine,
     columns: {
      javbus: CFG.javbusCardColumns,
      javdb: CFG.javdbCardColumns,
      javlib: CFG.javlibCardColumns, },
     magnetDisplayMode: CFG.magnetDisplayMode,
     infiniteScroll: CFG.infiniteScroll,
     infiniteScrollRestore: CFG.infiniteScrollRestore,
     javdbUseNativePages: CFG.javdbUseNativePages,
     buttons: Object.fromEntries(BUTTON_TOGGLE_META.map(({ key, cfgKey }) => [key, CFG[cfgKey]])),
     thumbOrder: GM_getValue('thumb_source_order', ['javfree', 'projectjav', 'javstore']),
    });
    const beforeNonPan115 = snapshotNonPan115(); const beforePan115Player = CFG.pan115Player;
    const nextPan115Player = ['official', '115master', 'potplayer'].includes(pan115PlayerSelect?.value) ? pan115PlayerSelect.value : 'official';
    MAGNET_ENGINES.forEach(item => { CFG[item.key] = stripProtocol(domainDraft[item.key]); });
    CFG.defaultEngine = defaultSelect.value;
    GM_setValue('default_search_engine', parseInt(jumpEngineSelect.value, 10) || 0);
    CFG.defaultVideoEngine = videoEngineSelect.value || 'missav'; CFG.pan115Player = nextPan115Player; CFG.magnetDisplayMode = magnetDisplaySelect.value;
    CFG.magnetTable = CFG.magnetDisplayMode === 'sidebar'; CFG.infiniteScrollRestore = !!infiniteScrollRestoreCheckbox?.checked;
    CFG.javdbUseNativePages = !!javdbNativePagesCheckbox?.checked;
    BUTTON_TOGGLE_META.forEach(({ key, cfgKey }) => { CFG[cfgKey] = btnToggles[key].checked; });
    GM_setValue('thumb_source_order', currentOrder);
    const pan115Changed = beforePan115Player !== nextPan115Player; const nonPan115Changed = beforeNonPan115 !== snapshotNonPan115();
    closePanel();
    if (nonPan115Changed) { location.reload(); return; }
    if (pan115Changed) Runtime.syncPan115(CFG.btnShowPan115);
   }); }
  return { open };
 })();
 Core.expose('__LAOSIJI_OPEN_SETTINGS__', () => SettingsPanel.open()); GM_registerMenuCommand('⚙️ 老司机设置', () => SettingsPanel.open());
 function ensureQuickSettingsPanelStyles() {
  injectStyle('jav-quick-settings-style',`#jav-quick-settings-popover{position:fixed;z-index:10000030;width:286px;padding:10px;border:1px solid rgba(203,213,225,.85);border-radius:10px;background:rgba(255,255,255,.985);color:#0f172a;box-shadow:0 12px 28px rgba(15,23,42,.16);backdrop-filter:blur(6px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box}#jav-quick-settings-popover *{box-sizing:border-box}#jav-quick-settings-popover .qs-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}#jav-quick-settings-popover .qs-title{font-size:13px;font-weight:800;color:#1e293b}#jav-quick-settings-popover .qs-site{margin-top:1px;font-size:11px;font-weight:650;color:#64748b}#jav-quick-settings-popover .qs-close{width:24px;height:24px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#64748b;cursor:pointer;line-height:1;font-size:14px}#jav-quick-settings-popover .qs-close:hover{color:#1d4ed8;border-color:#93c5fd;background:#eff6ff}#jav-quick-settings-popover .qs-row{display:grid;grid-template-columns:72px 1fr 42px;align-items:center;gap:9px;padding:4px 0;border:0;border-radius:0;background:transparent}#jav-quick-settings-popover .qs-row+.qs-row{margin-top:4px}#jav-quick-settings-popover .qs-mobile-columns-row{grid-template-columns:72px minmax(0,1fr)}#jav-quick-settings-popover .qs-segmented{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:hidden;border:1px solid #bfdbfe;border-radius:6px}#jav-quick-settings-popover .qs-segment{min-height:28px;padding:0 8px;border:0;border-right:1px solid #bfdbfe;background:#fff;color:#475569;font-size:12px;font-weight:750;cursor:pointer}#jav-quick-settings-popover .qs-segment:last-child{border-right:0}#jav-quick-settings-popover .qs-segment.is-active{background:#2563eb;color:#fff}#jav-quick-settings-popover .qs-segment:focus-visible{position:relative;outline:2px solid #1d4ed8;outline-offset:-2px}#jav-quick-settings-popover .qs-detail-flex{display:none;margin-top:8px;padding-top:7px;border-top:1px solid #e2e8f0}#jav-quick-settings-popover .qs-detail-flex.is-visible{display:block}#jav-quick-settings-popover .qs-section-title{margin-bottom:3px;font-size:12px;font-weight:850;color:#1e293b}#jav-quick-settings-popover .qs-row.is-disabled{opacity:.48}#jav-quick-settings-popover .qs-row.is-disabled .qs-range{cursor:not-allowed;background:#e2e8f0}#jav-quick-settings-popover .qs-row.is-disabled .qs-range::-webkit-slider-thumb{background:#94a3b8;cursor:not-allowed}#jav-quick-settings-popover .qs-row.is-disabled .qs-range::-moz-range-thumb{background:#94a3b8;cursor:not-allowed}#jav-quick-settings-popover .qs-switch-grid{display:grid;grid-template-columns:1fr;gap:6px;margin-top:6px}#jav-quick-settings-popover .qs-switch-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0;border:0;border-radius:0;background:transparent}#jav-quick-settings-popover .qs-name{font-size:12px;font-weight:750;color:#334155;white-space:nowrap}#jav-quick-settings-popover .qs-value{display:grid;place-items:center;min-width:34px;height:22px;border-radius:999px;background:#fff;color:#1d4ed8;font-size:12px;font-weight:800;border:1px solid #dbeafe}#jav-quick-settings-popover .qs-range{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:999px;background:linear-gradient(90deg,#93c5fd 0%,#dbeafe 100%);outline:none}#jav-quick-settings-popover .qs-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;border:2px solid #fff;background:#2563eb;box-shadow:0 3px 8px rgba(37,99,235,.22);cursor:pointer}#jav-quick-settings-popover .qs-range::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:50%;background:#2563eb;box-shadow:0 3px 8px rgba(37,99,235,.22);cursor:pointer}#jav-quick-settings-popover .qs-toggle{position:relative;display:inline-block;width:36px;height:20px;flex:0 0 auto}#jav-quick-settings-popover .qs-toggle input{opacity:0;width:0;height:0}#jav-quick-settings-popover .qs-toggle-track{position:absolute;inset:0;border-radius:999px;background:#cbd5e1;cursor:pointer;transition:background .18s}#jav-quick-settings-popover .qs-toggle-track::before{content:'';position:absolute;width:14px;height:14px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.22);transition:transform .18s}#jav-quick-settings-popover .qs-toggle input:checked+.qs-toggle-track{background:#2563eb}#jav-quick-settings-popover .qs-toggle input:checked+.qs-toggle-track::before{transform:translateX(14px)}#jav-quick-settings-popover .qs-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0}#jav-quick-settings-popover .qs-more{height:28px;padding:0 12px;border:1px solid #c7d2fe;border-radius:7px;background:#eef2ff;color:#4338ca;font-size:11px;font-weight:800;cursor:pointer}#jav-quick-settings-popover .qs-more:hover{background:#e0e7ff;border-color:#a5b4fc}#jav-quick-settings-popover.is-mobile{left:10px!important;right:10px!important;bottom:max(10px,env(safe-area-inset-bottom))!important;top:auto!important;width:auto!important;max-height:calc(100dvh - 20px);overflow:auto}#jav-quick-settings-popover.is-mobile .qs-page-zoom-row,#jav-quick-settings-popover.is-mobile .qs-columns-row,#jav-quick-settings-popover.is-mobile .qs-detail-flex{display:none!important}#jav-quick-settings-popover.is-mobile .qs-switch-row[data-mobile-disabled="1"]{opacity:.5}#jav-quick-settings-popover.is-mobile .qs-toggle-track,#jav-quick-settings-popover.is-mobile .qs-toggle input:disabled{cursor:not-allowed}`);
 }
 const QuickSettingsPanel = (() => {
  const siteLabelMap = { javbus: 'JavBus', javdb: 'JavDB', javlib: 'JavLibrary', pan115: '115网盘' };
  const TOGGLE_META = [
   { id: 'pan115', label: '115匹配', cfgKey: 'btnShowPan115', sync: 'syncPan115' },
   { id: 'infinite-scroll', label: '瀑布流', cfgKey: 'infiniteScroll', sync: 'syncInfiniteScroll' },
   { id: 'card-fx', label: '卡片动画', cfgKey: 'cardFx', sync: 'syncCardFx', mobileDisabled: true },
   { id: 'cover-hover-preview', label: '封面悬浮大图', cfgKey: 'coverHoverPreview', sync: 'syncCoverHoverPreview', mobileDisabled: true },
   { id: 'title-translate', label: '翻译标题', cfgKey: 'titleTranslate', sync: 'syncTitleTranslate' },
   { id: 'portrait-cards', label: '竖图模式', cfgKey: 'portraitCards', sync: 'syncPortraitCards', persist: false, refreshColumns: true, mobileDisabled: true },
   { id: 'list-open-new-tab', label: '新标签打开页面', cfgKey: 'listOpenNewTab', sync: 'syncListOpenNewTab' },
   { id: 'list-preview', label: '\u9996\u9875\u5feb\u6377\u529f\u80fd', cfgKey: 'listPreviewQuick', sync: 'syncListPreview' },
   { id: 'detail-preview-inline', label: '预览图直显', cfgKey: 'detailPreviewInline', sync: 'syncDetailPreview', mobileDisabled: true }, ];
  const PAN115_TOGGLE_META = [
   { id: 'pan115-cover-hover-preview', label: '115封面预览', cfgKey: 'pan115CoverHoverPreview', sync: 'syncCoverHoverPreview', mobileDisabled: true }, ];
  function renderToggleRows(toggleMeta = TOGGLE_META) {
   return toggleMeta.map(({ id, label, mobileDisabled }) =>`<div class="qs-switch-row"${mobileDisabled ? ' data-mobile-disabled="1"' : ''}><div class="qs-name">${label}</div><label class="qs-toggle"><input id="qs-${id}" type="checkbox"><span class="qs-toggle-track"></span></label></div>`).join('');
  }
  function getCurrentSite() {
   if (/^(?:www\.)?115\.com$/i.test(location.hostname)) return 'pan115';
   return CardColumns.detectCurrentSite() || PageZoom.detectCurrentSite(); }
  function positionPanel(panel, anchor) {
   if (MobilePolicy.isMobile()) {
    panel.classList.add('is-mobile'); panel.style.removeProperty('left'); panel.style.removeProperty('top');
    return; }
   const rect = anchor?.getBoundingClientRect?.(); const margin = 10; const width = panel.offsetWidth || 286; const height = panel.offsetHeight || 150;
   let left = rect ? rect.right - width : window.innerWidth - width - 18; let top = rect ? rect.bottom + 8 : 64;
   left = Math.max(margin, Math.min(left, window.innerWidth - width - margin)); top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
   panel.style.left =`${left}px`;
   panel.style.top =`${top}px`;
  }
  function open(anchor = null) {
   document.getElementById('jav-quick-settings-popover')?.remove(); ensureQuickSettingsPanelStyles();
   const site = getCurrentSite();
   if (!site) { SettingsPanel.open(); return; }
   const panel = document.createElement('div');
   panel.id = 'jav-quick-settings-popover';
   panel.classList.toggle('is-mobile', MobilePolicy.isMobile());
   const isPan115 = site === 'pan115'; const toggleMeta = isPan115 ? PAN115_TOGGLE_META : TOGGLE_META;
   const showMobilePortraitColumns = !isPan115 && MobilePolicy.isMobile() && !window.matchMedia?.('(orientation:landscape)').matches;
   panel.innerHTML =`<div class="qs-head"><div><div class="qs-title">快捷设置</div><div class="qs-site"> ${siteLabelMap[site] || '当前站点'} </div></div><button class="qs-close" type="button" title="关闭">×</button></div> ${isPan115 ? '' : `<div class="qs-row qs-columns-row">
                    <div class="qs-name">卡片列数</div>
                    <input class="qs-range" id="qs-columns" type="range" min="2" max="10" step="1">
                    <span class="qs-value" id="qs-columns-value">5</span>
                </div>`} ${showMobilePortraitColumns ? `
                <div class="qs-row qs-mobile-columns-row">
                    <div class="qs-name">竖屏卡片</div>
                    <div class="qs-segmented" role="group" aria-label="竖屏卡片列数">
                        <button class="qs-segment" type="button" data-mobile-columns="1">单列</button>
                        <button class="qs-segment" type="button" data-mobile-columns="2">双列</button>
                    </div>
                </div>` : ''} ${isPan115 ? '' : `<div class="qs-row qs-page-zoom-row">
                    <div class="qs-name">页面宽度</div>
                    <input class="qs-range" id="qs-zoom" type="range" min="60" max="100" step="1">
                    <span class="qs-value" id="qs-zoom-value">100%</span>
                </div>`} <div class="qs-detail-flex" id="qs-detail-flex"><div class="qs-section-title">详情比例</div><div class="qs-row" data-detail-flex-row="cover"><div class="qs-name">封面</div><input class="qs-range" id="qs-detail-cover" type="range" min="50" max="200" step="5"><span class="qs-value" id="qs-detail-cover-value">1.0</span></div><div class="qs-row" data-detail-flex-row="info"><div class="qs-name">信息</div><input class="qs-range" id="qs-detail-info" type="range" min="50" max="200" step="5"><span class="qs-value" id="qs-detail-info-value">1.0</span></div><div class="qs-row" data-detail-flex-row="magnet"><div class="qs-name">磁力</div><input class="qs-range" id="qs-detail-magnet" type="range" min="50" max="200" step="5"><span class="qs-value" id="qs-detail-magnet-value">关闭</span></div></div><div class="qs-switch-grid"> ${renderToggleRows(toggleMeta)} </div><div class="qs-footer"><button class="qs-more" type="button">更多设置</button></div>`;
   document.body.appendChild(panel);
   const close = () => panel.remove(); const columnsInput = panel.querySelector('#qs-columns'); const columnsValue = panel.querySelector('#qs-columns-value');
   const mobileColumnButtons = [...panel.querySelectorAll('[data-mobile-columns]')]; const zoomInput = panel.querySelector('#qs-zoom');
   const zoomValue = panel.querySelector('#qs-zoom-value'); const detailSite = DetailFlex.detectCurrentSite();
   const detailWrap = panel.querySelector('#qs-detail-flex');
   const detailInputs = {
    cover: panel.querySelector('#qs-detail-cover'),
    info: panel.querySelector('#qs-detail-info'),
    magnet: panel.querySelector('#qs-detail-magnet'), };
   const detailValues = {
    cover: panel.querySelector('#qs-detail-cover-value'),
    info: panel.querySelector('#qs-detail-info-value'),
    magnet: panel.querySelector('#qs-detail-magnet-value'), };
   const syncColumnsControl = () => {
    const value = CardColumns.get(site);
    if (columnsInput) columnsInput.value = String(value);
    if (columnsValue) columnsValue.textContent = String(value);
   };
   const formatFlexValue = value => (DetailFlex.clamp(value) / 100).toFixed(2).replace(/\.?0+$/, '');
   const syncDetailMagnetState = () => {
    const hasMagnet = detailSite && DetailFlex.hasMagnet(detailSite); const row = panel.querySelector('[data-detail-flex-row="magnet"]');
    if (row) row.classList.toggle('is-disabled', !hasMagnet);
    if (detailInputs.magnet) detailInputs.magnet.disabled = !hasMagnet;
    if (detailValues.magnet && !hasMagnet) detailValues.magnet.textContent = MobilePolicy.usesDesktopMagnetTable() ? '未渲染' : '关闭';
    return hasMagnet; };
   Ui.bindRange(columnsInput, columnsValue, CardColumns.get(site), v => String(CardColumns.clamp(v)), value => {
    const next = CardColumns.clamp(value);
    CardColumns.set(site, next); CardColumns.apply(site, next);
   });
   const syncMobileColumnsControl = () => {
    const value = CardColumns.getMobilePortrait();
    mobileColumnButtons.forEach(button => button.classList.toggle('is-active', Number(button.dataset.mobileColumns) === value)); };
   mobileColumnButtons.forEach(button => {
    Ui.click(button, () => {
     const next = CardColumns.setMobilePortrait(Number(button.dataset.mobileColumns));
     CardColumns.apply(site, next); syncMobileColumnsControl();
    });
   });
   syncMobileColumnsControl();
   Ui.bindRange(zoomInput, zoomValue, PageZoom.get(site), v =>`${PageZoom.clamp(v)}%`, value => {
    const next = PageZoom.clamp(value);
    PageZoom.set(site, next); PageZoom.apply(site, next);
   });
   if (detailSite && DetailFlex.hasLayout(detailSite)) {
    const flexValues = DetailFlex.get(detailSite);
    detailWrap?.classList.add('is-visible');
    Object.entries(detailInputs).forEach(([key, input]) => {
     const valueEl = detailValues[key];
     if (!input || !valueEl) return;
     Ui.bindRange(input, valueEl, flexValues[key], formatFlexValue, value => {
      const hasMagnet = key !== 'magnet' || syncDetailMagnetState();
      if (!hasMagnet) return;
      const next = DetailFlex.clamp(value);
      valueEl.textContent = formatFlexValue(next);
      DetailFlex.set(detailSite, key, next); DetailFlex.apply(detailSite);
     });
    });
    syncDetailMagnetState(); }
   toggleMeta.forEach(({ id, cfgKey, sync, persist = true, refreshColumns = false, mobileDisabled = false }) => {
    Ui.bindCheckbox(panel.querySelector(`#qs-${id}`), CFG[cfgKey], checked => {
     if (persist) CFG[cfgKey] = checked;
     Runtime[sync](checked);
     if (refreshColumns) syncColumnsControl();
    });
    const input = panel.querySelector(`#qs-${id}`);
    if (input && mobileDisabled && MobilePolicy.isMobile()) { input.checked = false; input.disabled = true; }
   });
   Ui.click(panel.querySelector('.qs-close'), close);
   Ui.click(panel.querySelector('.qs-more'), () => {
    close(); SettingsPanel.open();
   });
   panel.addEventListener('click', e => e.stopPropagation());
   setTimeout(() => {
    const onDocClick = e => {
     if (!panel.contains(e.target)) { close(); document.removeEventListener('click', onDocClick, true); }
    };
    document.addEventListener('click', onDocClick, true);
   }, 0);
   positionPanel(panel, anchor); }
  return { open };
 })();
 Core.expose('__LAOSIJI_OPEN_QUICK_SETTINGS__', anchor => QuickSettingsPanel.open(anchor));
 const MobileSettingsEntry = (() => {
  const BUTTON_ID = 'jav-mobile-settings-entry'; let observer = null; let pending = false;
  function ensureStyle() {
   injectStyle('jav-mobile-settings-entry-style',`#${BUTTON_ID}{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:2147483000;width:46px;height:46px;display:grid;place-items:center;padding:0;border:1px solid rgba(37,99,235,.3);border-radius:50%;background:#fff;color:#1d4ed8;box-shadow:0 6px 18px rgba(15,23,42,.2);cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:22px;line-height:1}#${BUTTON_ID}:active{transform:scale(.95)}#${BUTTON_ID}:focus-visible{outline:3px solid rgba(37,99,235,.28);outline-offset:2px}html:not([data-laosiji-mobile]) #${BUTTON_ID}{display:none}`);
  }
  function scheduleSync() {
   if (pending) return;
   pending = true;
   requestAnimationFrame(() => {
    pending = false;
    sync();
   }); }
  function createButton() {
   const button = document.createElement('button');
   button.id = BUTTON_ID; button.type = 'button'; button.textContent = '\u2699'; button.title = '\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e';
   button.setAttribute('aria-label', '\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e');
   button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); QuickSettingsPanel.open(button); });
   return button; }
  function sync() {
   const existing = document.getElementById(BUTTON_ID);
   if (!MobilePolicy.isMobile()) { existing?.remove(); return; }
   if (!document.body) return;
   if (existing) return;
   document.body.appendChild(createButton()); }
  function install() {
   if (observer) return;
   ensureStyle(); MobilePolicy.onChange(sync); sync();
   if (!document.body || typeof MutationObserver === 'undefined') return;
   observer = new MutationObserver(scheduleSync);
   observer.observe(document.body, { childList: true, subtree: true }); }
  return { install, sync };
 })();
 Core.expose('__LAOSIJI_MOBILE_SETTINGS_ENTRY__', MobileSettingsEntry);
 const Pan115SettingsEntry = (() => {
  const ENTRY_ID = 'jav-pan115-settings-entry'; let observer = null; let pending = false;
  function is115Page() { return /^(?:www\.)?115\.com$/i.test(location.hostname); }
  function ensureStyle() {
   injectStyle('jav-pan115-settings-entry-style',`#${ENTRY_ID}{display:inline-flex;align-items:center;vertical-align:top;height:34px;box-sizing:border-box;color:#3a4783!important;white-space:nowrap}#${ENTRY_ID}:hover{color:#263365!important;background:#f4f6ff!important}#${ENTRY_ID}:focus-visible{outline:2px solid rgba(58,71,131,.45);outline-offset:1px}#${ENTRY_ID} .entry-icon{display:inline-flex;align-items:center;font-size:16px;line-height:1}#${ENTRY_ID}.is-modern{height:32px;margin:0;padding:0 12px;border:1px solid #d1d4d6;border-radius:4px;background:#fff;color:#4b5563!important;font-size:14px;line-height:1;cursor:pointer}#${ENTRY_ID}.is-modern:hover{background:#f9fafb!important;color:#111827!important}`);
  }
  function scheduleSync() {
   if (pending) return;
   pending = true;
   requestAnimationFrame(() => {
    pending = false;
    sync();
   }); }
  function isDisplayed(element) {
   if (!element) return false;
   const style = window.getComputedStyle?.(element);
   if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
   return !!(element.getClientRects?.().length || element.offsetWidth || element.offsetHeight); }
  function createEntry(modern = false) {
   const entry = document.createElement(modern ? 'button' : 'a');
   entry.id = ENTRY_ID; entry.className = modern ? 'is-modern flex items-center gap-1' : 'button btn-line';
   if (modern) entry.type = 'button';
   else entry.href = 'javascript:void(0)';
   entry.title = '打开老司机快捷设置';
   entry.setAttribute('aria-label', '打开老司机快捷设置');
   entry.innerHTML =`<span class="entry-icon" aria-hidden="true">⚙</span><span>老司机设置</span>`;
   entry.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); QuickSettingsPanel.open(event.currentTarget); });
   return entry; }
  function sync() {
   const existing = document.getElementById(ENTRY_ID);
   if (!is115Page()) { existing?.remove(); return; }
   const modernHeader = [...document.querySelectorAll('.justify-between.w-full.pl-6.pr-5')]
    .find(root => isDisplayed(root) && root.querySelector('button[title="更多操作"]'));
   const modernMoreButton = modernHeader?.querySelector('button[title="更多操作"]'); const modernActionGroup = modernMoreButton?.parentElement;
   if (modernActionGroup) {
    if (existing && existing.parentElement !== modernActionGroup) existing.remove();
    if (existing) return;
    const viewModeGroup = modernActionGroup.querySelector('button[title="列表视图"]')?.parentElement; const entry = createEntry(true);
    modernActionGroup.insertBefore(entry, viewModeGroup || modernMoreButton);
    return; }
   const topBar = document.querySelector('#js_top_panel_box .left-tvf[rel="left_tvf"]');
   if (topBar) {
    if (existing && existing.parentElement !== topBar) existing.remove();
    if (existing) return;
    const entry = createEntry(); const previewButton = topBar.querySelector('.master-preview-switch-btn');
    if (previewButton) previewButton.insertAdjacentElement('afterend', entry);
    else topBar.appendChild(entry);
    return; } }
  function install() {
   if (observer) return;
   ensureStyle(); sync();
   const root = document.body || document.documentElement;
   if (!root || typeof MutationObserver === 'undefined') return;
   observer = new MutationObserver(scheduleSync);
   observer.observe(root, { childList: true, subtree: true }); }
  return { install, sync };
 })();
 Core.expose('__LAOSIJI_PAN115_SETTINGS_ENTRY__', Pan115SettingsEntry);
 const MagnetApi = (() => {
  const JAVDB_API_BASE = 'https://jdforrepam.com/api';
  const JAVDB_SIGN_SALT = '71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa';
  let javdbSignCache = { ts: 0, sign: '' };
  function javdbMd5(str) {
   const b = new TextEncoder().encode(str); const l = b.length; const n = ((l + 8) >> 6) + 1; const m = new Uint32Array(n * 16); const k = [];
   const s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
   for (let i = 0; i < 64; i++) k[i] = Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1)));
   for (let i = 0; i < l; i++) m[i >> 2] |= b[i] << ((i % 4) << 3);
   m[l >> 2] |= 0x80 << ((l % 4) << 3);
   m[n * 16 - 2] = l * 8;
   let [a0, b0, c0, d0] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
   for (let i = 0; i < n; i++) {
    const g = m.slice(i * 16, (i + 1) * 16); let [a, b, c, d] = [a0, b0, c0, d0];
    for (let j = 0; j < 64; j++) {
     const q = Math.floor(j / 16); const f = [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][q];
     const p = [j, (5 * j + 1) % 16, (3 * j + 5) % 16, (7 * j) % 16][q]; const sum = (a + f + k[j] + g[p]) | 0; const shift = s[(q << 2) | (j % 4)];
     const nextA = d;
     d = c; c = b; b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0; a = nextA; }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0; }
   return [a0, b0, c0, d0] .map(v => new Uint32Array([v])) .map(v => new Uint8Array(v.buffer))
    .map(v => Array.from(v, b => b.toString(16).padStart(2, '0')).join('')) .join(''); }
  function buildJavdbSignature() {
   const curr = Math.floor(Date.now() / 1000);
   if (javdbSignCache.sign && curr - javdbSignCache.ts <= 20) return javdbSignCache.sign;
   javdbSignCache = {
    ts: curr,
    sign:`${curr}.lpw6vgqzsp.${javdbMd5(`${curr}${JAVDB_SIGN_SALT}`)}`            };
   return javdbSignCache.sign; }
  function parseJson(text) {
   try { return JSON.parse(text || '{}'); }
   catch { return null; }
  }
  function formatJavdbSize(size) {
   const mb = Number(size);
   if (!Number.isFinite(mb) || mb <= 0) return '';
   return mb >= 1024 ?`${(mb / 1024).toFixed(mb >= 10240 ? 1 : 2)} GB` :`${Math.round(mb)} MB`;
  }
  function normalizeMagnetFileCount(...values) {
   for (const value of values) {
    if (Array.isArray(value)) return value.length ? String(value.length) : '';
    if (value && typeof value === 'object') {
     const count = Object.keys(value).length;
     if (count) return String(count);
     continue; }
    const text = String(value ?? '').trim();
    if (!text) continue;
    const num = parseInt(text.replace(/,/g, ''), 10);
    if (Number.isFinite(num) && num > 0) return String(num);
   }
   return ''; }
  function compactJavdbNumber(value) { return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function normalizeMagnetSearchKeyword(value) {
   const raw = String(value || '').trim().toUpperCase().replace(/[\s_]+/g, '-');
   const match = raw.match(/^FC2(?:-PPV)?-(\d{6,9})$/i) || raw.match(/^FC2PPV(\d{6,9})$/i);
   return match ?`FC2-PPV-${match[1]}` : String(value || '').trim();
  }
  function normalizeJavdbSearchKeyword(value) {
   const normalized = normalizeMagnetSearchKeyword(value);
   const fc2 = normalized.match(/^FC2-PPV-(\d{6,9})$/i);
   return fc2 ? fc2[1] : normalized; }
  function javdbNumberMatches(value, keyword) {
   const normalizedKeyword = normalizeMagnetSearchKeyword(keyword);
   const fc2 = normalizedKeyword.match(/^FC2-PPV-(\d{6,9})$/i);
   const candidate = String(value || '').trim();
   if (fc2) {
    const candidateFc2 = candidate.match(/^FC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})$/i);
    return candidate === fc2[1] || candidateFc2?.[1] === fc2[1]; }
   return compactJavdbNumber(candidate) === compactJavdbNumber(normalizedKeyword); }
  function normalizeMagnetResultTitle(value, keyword) {
   const title = String(value || '').trim(); const normalizedKeyword = normalizeMagnetSearchKeyword(keyword);
   if (!/^FC2-PPV-\d{6,9}$/i.test(normalizedKeyword)) return title;
   return title.replace(/FC2(?:[-_\s]?PPV)?[-_\s]?(\d{6,9})/ig, normalizedKeyword); }
  async function findJavdbMovieByNumber(kw, { limit = 5, fallbackFirst = false } = {}) {
   kw = normalizeMagnetSearchKeyword(kw);
   const searchKeyword = normalizeJavdbSearchKeyword(kw);
   const headers = { accept: 'application/json', jdSignature: buildJavdbSignature() };
   const params = new URLSearchParams({
    q: searchKeyword,
    page: '1',
    type: 'movie',
    limit: String(limit),
    movie_type: 'all',
    from_recent: 'false',
    movie_filter_by: 'all',
    movie_sort_by: 'relevance'
   });
   const r = await gmFetch(`${JAVDB_API_BASE}/v2/search?${params.toString()}`, { headers, timeout: 20000 });
   if (!r.loadstuts || r.status < 200 || r.status >= 400) return null;
   const json = parseJson(r.responseText); const movies = Array.isArray(json?.data?.movies) ? json.data.movies : [];
   const exact = movies.find(item => javdbNumberMatches(item?.number, kw));
   return exact || (fallbackFirst ? movies[0] : null) || null; }
  async function _searchJavDB(kw) {
   kw = normalizeMagnetSearchKeyword(kw);
   const webBase = 'https://' + CFG.javdbSearchUrl;
   const movie = await findJavdbMovieByNumber(kw, { limit: 5, fallbackFirst: true });
   if (!movie?.id) return { url: webBase, data: [] };
   const detailUrl =`${webBase}/v/${movie.id}`;
   const magnetsUrl =`${JAVDB_API_BASE}/v1/movies/${encodeURIComponent(movie.id)}/magnets`;
   const r2 = await gmFetch(magnetsUrl, { headers: { accept: 'application/json', jdSignature: buildJavdbSignature() } });
   if (!r2.loadstuts || r2.status < 200 || r2.status >= 400) return { url: detailUrl, data: [] };
   const magnetsJson = parseJson(r2.responseText); const magnets = Array.isArray(magnetsJson?.data?.magnets) ? magnetsJson.data.magnets : [];
   const data = magnets.map(item => {
    const hash = String(item?.hash || '').trim();
    if (!hash) return null;
    const name = normalizeMagnetResultTitle(item?.name || movie.number || kw, kw);
    const files = normalizeMagnetFileCount(item?.files_count, item?.file_count, item?.fileCount, item?.files);
    const title = [
     name,
     item?.cnsub ? '-CH' : '',
     item?.hd ? 'HD' : ''
    ].filter(Boolean).join(' ');
    return {
     title,
     maglink:`magnet:?xt=urn:btih:${hash}`,
     size: formatJavdbSize(item?.size),
     date: item?.created_at || '',
     src: detailUrl,
     files,
     cnsub: Boolean(item?.cnsub),
     hd: Boolean(item?.hd) };
   }).filter(Boolean);
   return { url: detailUrl, data }; }
  function normalizeJavdbApiToken(value) { return String(value || '').trim().replace(/^Bearer\s+/i, ''); }
  function javdbApiToken() {
   const candidates = [ GM_getValue('laosiji_javdb_app_authorization', ''), localStorage.getItem('laosiji_javdb_app_authorization') ];
   const token = normalizeJavdbApiToken(candidates.find(Boolean));
   if (token) {
    GM_setValue('laosiji_javdb_app_authorization', token);
    try {
     localStorage.setItem('laosiji_javdb_app_authorization', token);
    } catch {} }
   return token; }
  function setJavdbApiToken(token) {
   const normalized = normalizeJavdbApiToken(token);
   if (normalized) {
    GM_setValue('laosiji_javdb_app_authorization', normalized);
    try {
     localStorage.setItem('laosiji_javdb_app_authorization', normalized);
    } catch {}
   } else {
    GM_setValue('laosiji_javdb_app_authorization', '');
    try {
     localStorage.removeItem('laosiji_javdb_app_authorization');
    } catch {} }
   return normalized; }
  async function javdbApiLogin(username, password) {
   const account = String(username || '').trim(); const secret = String(password || '');
   if (!account || !secret) throw new Error('请输入 JavDB 用户名和密码');
   const params = new URLSearchParams({
    username: account,
    password: secret,
    device_uuid: '04b9534d-5118-53de-9f87-2ddded77111e',
    device_name: 'iPhone',
    device_model: 'iPhone',
    platform: 'ios',
    system_version: '17.4',
    app_version: 'official',
    app_version_number: '1.9.29',
    app_channel: 'official',
   });
   const signature = buildJavdbSignature();
   const url =`${JAVDB_API_BASE}/v1/sessions?${params.toString()}`;
   const headers = {
    'user-agent': 'Dart/3.5 (dart:io)',
    'accept-language': 'zh-TW',
    host: 'jdforrepam.com',
    'content-type': 'multipart/form-data; boundary=--dio-boundary-2210433284',
    jdsignature: signature, };
   const attempts = [ { method: 'POST', data: 'null', headers, timeout: 20000 }, { method: 'POST', data: undefined, headers, timeout: 20000 } ];
   let r = null; let lastJson = null;
   for (const opts of attempts) {
    r = await gmFetch(url, opts);
    if (!r.loadstuts || r.status < 200 || r.status >= 400) continue;
    const maybeJson = parseJson(r.responseText);
    if (maybeJson) lastJson = maybeJson;
    if (maybeJson?.success === 1 && maybeJson?.data?.token) break;
   }
   if (!r.loadstuts || r.status < 200 || r.status >= 400) {
    throw new Error(`JavDB App API 登录失败: HTTP ${r.status || 0}`);
   }
   const json = lastJson || parseJson(r.responseText);
   if (!json) throw new Error('JavDB App API 登录返回异常');
   if (json.success !== 1 || !json?.data?.token) {
    debugLog('JavDB App API 登录失败返回:', json);
    throw new Error(json?.message || json?.action || 'JavDB App API 登录失败'); }
   return setJavdbApiToken(json.data.token); }
  function javdbAuthHeader() {
   const token = javdbApiToken();
   if (!token) return {};
   return { authorization: /^bearer\s+/i.test(token) ? token :`Bearer ${token}` };
  }
  async function javdbApiRequest(path, params = {}, extraHeaders = {}) {
   const query = new URLSearchParams(params).toString();
   const url =`${JAVDB_API_BASE}${path}${query ? `?${query}` : ''}`;
   const r = await gmFetch(url, {
    headers: {
     accept: 'application/json',
     'accept-language': 'zh-TW',
     'user-agent': 'Dart/3.5 (dart:io)',
     jdSignature: buildJavdbSignature(), ...extraHeaders, },
    timeout: 20000,
   });
   if (!r.loadstuts || r.status < 200 || r.status >= 400) {
    throw new Error(`JavDB API 请求失败: HTTP ${r.status || 0}`);
   }
   const json = parseJson(r.responseText);
   if (!json) throw new Error('JavDB API 返回异常');
   return json; }
  const javdbApi = {
   token: javdbApiToken,
   setToken: setJavdbApiToken,
   login: javdbApiLogin,
   async top250({ category = 'all', year = '', page = 1, limit = 50 } = {}) {
    const params = { start_rank: 1, ignore_watched: 'false', page, limit };
    if (category && category !== 'all') {
     params.type = 'video_type'; params.type_value = category;
     if (year) params.year = year;
    } else if (year) {
     params.type = 'year'; params.type_value = year;
    } else {
     params.type = 'all'; params.type_value = ''; }
    return javdbApiRequest('/v1/movies/top', params, javdbAuthHeader()); },
   async fc2({ period = 'daily', page = 1, limit = 40 } = {}) {
    const json = await javdbApiRequest('/v1/rankings', {
     period,
     type: '3',
    });
    if (json.success !== 1) return json;
    const movies = Array.isArray(json?.data?.movies) ? json.data.movies : []; const start = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;
    const items = movies.slice(start, start + limit);
    return {
     success: 1,
     data: {
      movies: items,
      total: items.length, }, }; },
   async playback({ period = 'daily', filterBy = 'high_score', page = 1, limit = 40 } = {}) {
    const json = await javdbApiRequest('/v1/rankings/playback', {
     period,
     filter_by: filterBy,
    });
    if (json.success !== 1) return json;
    const movies = Array.isArray(json?.data?.movies) ? json.data.movies : []; const start = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;
    const items = movies.slice(start, start + limit);
    return {
     success: 1,
     data: {
      movies: items,
      total: movies.length, }, }; },
   async movieDetail(movieId) {
    return javdbApiRequest(`/v4/movies/${encodeURIComponent(movieId)}`);
   },
   async searchMovieByNumber(kw, options = {}) {
    return findJavdbMovieByNumber(kw, options); },
   async movieMagnets(movieId) {
    return javdbApiRequest(`/v1/movies/${encodeURIComponent(movieId)}/magnets`);
   },
   async movieReviews(movieId, { page = 1, limit = JAVDB_REVIEW_MORE_LIMIT, sortBy = 'hotly' } = {}) {
    return javdbApiRequest(`/v1/movies/${encodeURIComponent(movieId)}/reviews`, {
     page,
     limit,
     sort_by: sortBy,
    }); },
   async relatedLists(movieId, { page = 1, limit = 20 } = {}) {
    return javdbApiRequest('/v1/lists/related', {
     movie_id: movieId,
     page,
     limit,
    }); }, };
  return {
   client: javdbApi,
   searchJavDB: _searchJavDB,
   parseJson,
   javdbMd5,
   normalizeMagnetFileCount,
   normalizeMagnetSearchKeyword,
   normalizeJavdbSearchKeyword,
   normalizeMagnetResultTitle, };
 })();
 const MagnetActions = (() => {
  const { parseJson } = MagnetApi;
  async function offline115(maglink) {
   maglink = maglink.substring(0, 60);
   const loginUrl = 'https://115.com/?mode=login';
   const offlineUrl = 'https://115.com/?tab=offline&mode=wangpan';
   const tokenR = await gmFetch(`https://115.com/?ct=offline&ac=space&_=${Date.now()}`, {
    headers: {
     Accept: 'application/json, text/plain, */*',
     Referer: offlineUrl, },
   });
   if (!tokenR.loadstuts) { notify('115 错误', '无法获取签名，请检查跨源权限或115登录状态', loginUrl); return; }
   if (tokenR.responseText.includes('html')) { notify('115 未登录', '请先登录115账户后再离线下载', loginUrl); return; }
   const json = parseJson(tokenR.responseText);
   if (!json?.sign || !json?.time) { notify('115 错误', '签名返回异常，请确认115已登录并允许跨源访问', offlineUrl); return; }
   const uid = GM_getValue('jav_115_uid', '');
   return new Promise(resolve => {
    const done = () => resolve();
    GM_xmlhttpRequest({
     method: 'POST',
     url: 'https://115.com/web/lixian/?ct=lixian&ac=add_task_url',
     timeout: 20000,
     headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      Origin: 'https://115.com',
      Referer: offlineUrl,
      'X-Requested-With': 'XMLHttpRequest', },
     data:`url=${encodeURIComponent(maglink)}&uid=${uid}&sign=${json.sign}&time=${json.time}`,
     onload(r) {
      if (r.status < 200 || r.status >= 400) {
       notify('115 离线失败',`请求失败：HTTP ${r.status || 0}`, offlineUrl);
       done();
       return; }
      const res = parseJson(r.responseText);
      if (!res) { notify('115 离线失败', '115返回异常，可能是登录失效或跨源权限未完整允许', offlineUrl); done(); return; }
      if (res.state) {
       notify('115 离线成功', '任务已添加', offlineUrl);
      } else {
       const msg = res.errcode === '911' ? '账号使用异常，请手工验证' : (res.error_msg || res.msg || res.error || '未知错误');
       notify('115 离线失败', msg, offlineUrl); }
      done(); },
     onerror() {
      notify('115 离线失败', '推送请求失败，请检查跨源权限或网络状态', offlineUrl); done(); },
     ontimeout() {
      notify('115 离线失败', '推送请求超时，请稍后重试', offlineUrl); done(); },
     onabort() {
      notify('115 离线失败', '推送请求已取消，可能是跨源权限被拒绝', offlineUrl); done(); },
    });
   }); }
  function formatBytes(bytes) {
   const num = Number(bytes) || 0;
   if (!num) return '-';
   const units = ['B', 'KB', 'MB', 'GB', 'TB']; let value = num; let index = 0;
   while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
   return`${value.toFixed(index >= 3 ? 2 : 1)} ${units[index]}`;
  }
  function formatWhatslinkType(payload) {
   const raw = String(payload?.file_type || payload?.type || '').toUpperCase();
   if (raw.includes('FOLDER')) return '文件夹';
   if (raw.includes('FILE')) return '文件';
   return '-'; }
  function showWhatslinkModal(payload, magnet) {
   document.querySelector('.whatslink-overlay')?.remove();
   const shots = Array.isArray(payload?.screenshots) ? payload.screenshots.map(item => item?.screenshot).filter(Boolean) : []; let index = 0;
   const resourceName = payload?.name || '未知资源'; const resourceCount = payload?.count ?? '-'; const overlay = document.createElement('div');
   overlay.className = 'whatslink-overlay';
   const modal = document.createElement('section');
   modal.className =`whatslink-modal${shots.length ? '' : ' no-shots'}`;
   modal.innerHTML =`<div class="whatslink-gallery-scene"><div class="whatslink-gallery-visual"><button class="whatslink-gallery-close" type="button" aria-label="关闭">×</button><button class="whatslink-gallery-arrow whatslink-gallery-prev" type="button" aria-label="上一张">‹</button><img class="whatslink-gallery-hero" alt="截图预览"><button class="whatslink-gallery-arrow whatslink-gallery-next" type="button" aria-label="下一张">›</button><div class="whatslink-gallery-empty"><div class="whatslink-gallery-empty-icon">?</div><div class="whatslink-gallery-empty-title">暂无截图</div><p class="whatslink-gallery-empty-text">当前资源没有可展示的截图，可以结合资源名称和文件数量判断。</p></div></div><div class="whatslink-gallery-info"><span class="whatslink-gallery-name"></span><span class="whatslink-gallery-count"></span><span class="whatslink-gallery-index"></span></div><div class="whatslink-gallery-thumbs"></div></div>`;
   overlay.appendChild(modal); document.body.appendChild(overlay); modal.querySelector('.whatslink-gallery-name').textContent = resourceName;
   modal.querySelector('.whatslink-gallery-count').textContent =`${resourceCount} 个文件`;
   const visual = modal.querySelector('.whatslink-gallery-visual'); const hero = modal.querySelector('.whatslink-gallery-hero');
   const thumbs = modal.querySelector('.whatslink-gallery-thumbs'); const currentIndex = modal.querySelector('.whatslink-gallery-index');
   const closeButton = modal.querySelector('.whatslink-gallery-close'); const prevButton = modal.querySelector('.whatslink-gallery-prev');
   const nextButton = modal.querySelector('.whatslink-gallery-next');
   const sizeGallery = () => {
    if (!shots.length || !hero.naturalWidth || !hero.naturalHeight) return;
    const infoHeight = modal.querySelector('.whatslink-gallery-info').offsetHeight || 23; const thumbsHeight = thumbs.offsetHeight || 58;
    const maxHeight = Math.max(180, window.innerHeight - 36 - infoHeight - thumbsHeight - 6); const maxWidth = modal.clientWidth;
    const ratio = hero.naturalWidth / hero.naturalHeight; const height = Math.min(maxHeight, maxWidth / ratio); const width = height * ratio;
    visual.style.width =`${width}px`;
    visual.style.height =`${height}px`;
   };
   const positionControls = () => {
    if (!shots.length || !hero.naturalWidth || !hero.naturalHeight) return;
    const width = visual.clientWidth; const height = visual.clientHeight; const scale = Math.min(width / hero.naturalWidth, height / hero.naturalHeight);
    const imageWidth = hero.naturalWidth * scale; const imageHeight = hero.naturalHeight * scale; const imageLeft = (width - imageWidth) / 2;
    const imageTop = (height - imageHeight) / 2; const closeSize = closeButton.offsetWidth || 32; const arrowSize = prevButton.offsetWidth || 34;
    const sideGap = 12;
    closeButton.style.left =`${imageLeft + imageWidth - closeSize - sideGap}px`;
    closeButton.style.right = 'auto';
    closeButton.style.top =`${imageTop + sideGap}px`;
    prevButton.style.left =`${imageLeft + sideGap}px`;
    prevButton.style.right = 'auto';
    prevButton.style.top =`${imageTop + (imageHeight - arrowSize) / 2}px`;
    nextButton.style.left = 'auto';
    nextButton.style.right =`${width - imageLeft - imageWidth + sideGap}px`;
    nextButton.style.top =`${imageTop + (imageHeight - arrowSize) / 2}px`;
   };
   const render = () => {
    modal.classList.toggle('has-shots', Boolean(shots.length));
    if (!shots.length) { currentIndex.textContent = 'NO PREVIEW'; return; }
    hero.src = shots[index];
    const frame =`${index + 1} / ${shots.length}`;
    currentIndex.textContent = frame;
    [...thumbs.children].forEach((btn, i) => btn.classList.toggle('active', i === index));
    if (hero.complete) { sizeGallery(); positionControls(); }
   };
   shots.forEach((url, i) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'whatslink-gallery-thumb';
    btn.innerHTML =`<img src="${url}" alt="截图${i + 1}">`;
    btn.addEventListener('click', () => { index = i; render(); });
    thumbs.appendChild(btn);
   });
   modal.querySelector('.whatslink-gallery-prev').addEventListener('click', () => { if (!shots.length) return; index = (index + shots.length - 1) % shots.length; render(); });
   modal.querySelector('.whatslink-gallery-next').addEventListener('click', () => { if (!shots.length) return; index = (index + 1) % shots.length; render(); });
   const onKeydown = event => {
    if (!document.body.contains(overlay)) return;
    if (event.key === 'ArrowLeft' && shots.length) { index = (index + shots.length - 1) % shots.length; render(); }
    if (event.key === 'ArrowRight' && shots.length) { index = (index + 1) % shots.length; render(); }
    if (event.key === 'Escape') close();
   };
   const onResize = () => { sizeGallery(); positionControls(); };
   const removeResize = () => window.removeEventListener('resize', onResize);
   const close = () => {
    overlay.remove(); document.removeEventListener('keydown', onKeydown); removeResize(); };
   modal.querySelector('.whatslink-gallery-close').addEventListener('click', close);
   overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
   hero.addEventListener('load', () => { sizeGallery(); positionControls(); });
   window.addEventListener('resize', onResize); document.addEventListener('keydown', onKeydown); render(); }
  async function checkWhatslink(magnet) {
   document.querySelector('.whatslink-overlay')?.remove();
   const overlay = document.createElement('div');
   overlay.className = 'whatslink-overlay'; overlay.innerHTML = '<div class="whatslink-modal no-shots"><div class="whatslink-loading">正在验车...</div></div>';
   document.body.appendChild(overlay);
   try {
    const url =`https://whatslink.info/api/v1/link?url=${encodeURIComponent(magnet)}`;
    const r = await gmFetch(url, { timeout: 20000 });
    if (!r.loadstuts) throw new Error('WhatsLink 请求失败');
    const data = JSON.parse(r.responseText || '{}');
    overlay.remove(); showWhatslinkModal(data, magnet);
   } catch (e) {
    overlay.remove();
    showWhatslinkModal({ error: e.message || '查询失败', name: '查询失败', type: '-', file_type: '-', size: 0, count: '-', screenshots: [] }, magnet); } }
  return { offline115, checkWhatslink, formatBytes };
 })();
 const MagnetEngines = (() => {
  const { parseJson, javdbMd5, normalizeMagnetFileCount, searchJavDB } = MagnetApi;
  const formatBytes = MagnetActions.formatBytes;
  const ENGINE_LABELS = () => ({
   [CFG.javdbSearchUrl]: 'JavDB',
   [CFG.omagUrl]:        'ØMagnet',
   [CFG.u3c3Url]:        'U3C3',
   [CFG.btsearchUrl]:    'BTSearch',
   [CFG.sukebeiUrl]:     'Sukebei',
   [CFG.u9a9Url]:        'U9A9',
   [CFG.sokittyUrl]:     'SoKitty',
  });
  const Engines = {
   getAll() {
    return {
     [CFG.javdbSearchUrl]: searchJavDB,
     [CFG.omagUrl]:        _searchOmag,
     [CFG.u3c3Url]:        _searchU3C3,
     [CFG.btsearchUrl]:    _searchBTSearch,
     [CFG.sukebeiUrl]:     _searchsukebei,
     [CFG.u9a9Url]:        _searchU9A9,
     [CFG.sokittyUrl]:     _searchSokitty, }; },
   getCurrent() {
    const all = this.getAll(); const key = CFG.defaultEngine;
    return all[key] ? { key, fn: all[key] } : { key: Object.keys(all)[0], fn: Object.values(all)[0] }; }, };
  function normalizeMagnet(value) {
   const magnet = String(value || '').trim();
   return /^(?:magnet:\?xt=urn:btih:)(?:[a-f0-9]{40}|[a-z2-7]{32})(?:[&]|$)/i.test(magnet) ? magnet : ''; }
  async function fetchOmagMagnet(detailUrl, searchUrl) {
   const r = await gmFetch(detailUrl, {
    headers: {
     'Referer': searchUrl,
     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', },
   });
   if (!r.loadstuts) return { maglink: '', files: '' };
   const doc = parseHTML(r.responseText); const magnetInput = doc.querySelector('#input-magnet'); const magnetA = doc.querySelector('a[href^="magnet:"]');
   const fileHeader = doc.querySelector('table.table-hover.file-list thead th:first-child');
   const files = fileHeader?.textContent?.match(/Files\s*\(\s*(\d+)\s*\)/i)?.[1] || '';
   const maglink = normalizeMagnet(magnetInput?.getAttribute('value') || magnetA?.getAttribute('href') || magnetA?.href);
   return { maglink, files: normalizeMagnetFileCount(files) }; }
  async function _searchOmag(kw) {
   const base = 'https://' + CFG.omagUrl;
   const searchUrl =`${base}/search?q=${encodeURIComponent(kw)}`;
   const r = await gmFetch(searchUrl, {
    headers: {
     'Referer': base + '/',
     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', },
   });
   if (!r.loadstuts) return { url: searchUrl, data: [] };
   const doc = parseHTML(r.responseText);
   const entries = [...doc.querySelectorAll('tr')].map(row => {
    const titleA = row.querySelector('td.result-title a[href^="/!"]');
    if (!titleA) return null;
    const href = titleA.getAttribute('href') || '';
    if (!href) return null;
    let src;
    try {
     src = new URL(href, base).href;
    } catch (_) { return null; }
    const title = titleA.textContent.trim(); const meta = [...row.querySelectorAll('.result-meta > div')].map(item => item.textContent.trim());
    return { title, size: meta[0] || '', date: meta[1] || '', src };
   }).filter(Boolean);
   const data = (await Promise.all(entries.map(async entry => {
    const { maglink, files } = await fetchOmagMagnet(entry.src, searchUrl);
    return maglink ? { ...entry, maglink, files } : null;
   }))).filter(Boolean);
   return { url: searchUrl, data }; }
  async function _searchU3C3(kw) {
   const base = 'https://' + CFG.u3c3Url;
   const home = await gmFetch(base + '/', {
    headers: { Referer: base + '/' },
   });
   if (!home.loadstuts) return { url: base, data: [] };
   const homeDoc = parseHTML(home.responseText);
   const searchScript = [...homeDoc.scripts] .map(script => script.textContent || '') .find(text => text.includes('function search21')) || '';
   const token = searchScript.match(/^\s*var\s+nmefafej\s*=\s*["']([^"']+)["'];?/m)?.[1] || '';
   if (!token) return { url: base, data: [] };
   const searchUrl =`${base}/?search2=${encodeURIComponent(token)}&search=${encodeURIComponent(kw)}`;
   const r = await gmFetch(searchUrl, {
    headers: { Referer: base + '/' },
   });
   if (!r.loadstuts) return { url: searchUrl, data: [] };
   const doc = parseHTML(r.responseText); const normalizedKeyword = String(kw || '').toUpperCase().replace(/[-_\s]/g, '');
   const data = [...doc.querySelectorAll('table.torrent-list tbody tr.default, table.torrent-list tbody tr.success')] .map(row => {
     const titleA = row.querySelector('td:nth-child(2) a[href*="/view?id="]'); const magnetA = row.querySelector('td:nth-child(3) a[href^="magnet:"]');
     const title = titleA?.getAttribute('title')?.trim() || titleA?.textContent?.trim() || '';
     if (!title || !magnetA?.href) return null;
     if (normalizedKeyword && !title.toUpperCase().replace(/[-_\s]/g, '').includes(normalizedKeyword)) return null;
     const href = titleA.getAttribute('href') || '';
     return {
      title,
      maglink: magnetA.href,
      size: row.querySelector('td:nth-child(4)')?.textContent?.trim() || '',
      date: row.querySelector('td:nth-child(5)')?.textContent?.trim() || '',
      src: href ? new URL(href, base).href : searchUrl, };
    }) .filter(Boolean);
   return { url: r.finalUrl || searchUrl, data }; }
  function pickBTSearchItems(json) {
   if (Array.isArray(json?.data)) return json.data;
   if (Array.isArray(json?.data?.data)) return json.data.data;
   return []; }
  function cleanBTSearchText(value) {
   const raw = String(value || '').trim();
   if (!raw) return '';
   if (!/[<&]/.test(raw)) return raw.replace(/\s+/g, ' ');
   const doc = parseHTML(`<body>${raw}</body>`);
   return (doc.body?.textContent || raw.replace(/<[^>]+>/g, '')) .replace(/\s+/g, ' ') .trim(); }
  function normalizeBTSearchItem(item, base, searchUrl, keyword) {
   const title = cleanBTSearchText(item?.name); const hash = String(item?.hash || '').replace(/^magnet:\?xt=urn:btih:/i, '').replace(/[^a-z0-9]/gi, '');
   if (!/^[a-f0-9]{32,40}$/i.test(hash)) return null;
   const maglink =`magnet:?xt=urn:btih:${hash}`;
   const size = formatBytes(item?.size);
   const files = normalizeMagnetFileCount(
    item?.files_count,
    item?.file_count,
    item?.fileCount,
    item?.filesCount,
    item?.files_num,
    item?.file_num,
    item?.num_files,
    item?.count,
    item?.files,
    item?.fileList
   );
   const src = item?.id
    ?`${base}/torrent/${encodeURIComponent(item.id)}?keyword=${encodeURIComponent(keyword)}`                : searchUrl;
   const date = item?.created_at || item?.created_time || item?.create_time || item?.createTime || item?.date || item?.added_at || item?.add_time || '';
   return { title: title || maglink, maglink, size, date, src, files }; }
  function randomBTSearchNonce(length = 8) {
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let nonce = '';
   for (let i = 0; i < length; i++) nonce += chars.charAt(Math.floor(Math.random() * chars.length));
   return nonce; }
  function buildBTSearchHeaders(params, referer) {
   const timestamp = Math.floor(Date.now() / 1000).toString(); const nonce = randomBTSearchNonce();
   const parts = [`timestamp=${timestamp}`,`nonce=${nonce}`];
   Object.keys(params).forEach(key => parts.push(`${key}=${params[key]}`));
   const signText =`${parts.sort().join('&')}&key=long2ice`;
   return {
    Accept: 'application/json, text/plain, */*',
    Referer: referer,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-sign': javdbMd5(signText).toUpperCase() }; }
  async function _searchBTSearch(kw) {
   const base = 'https://' + CFG.btsearchUrl;
   const searchUrl =`${base}/search?keyword=${encodeURIComponent(kw)}`;
   const params = { keyword: kw, limit: '10', offset: '0', mode: '', time: '', sort: 'size', sort_type: 'desc', size: '' };
   const apiUrl =`${base}/api/search?${new URLSearchParams(params).toString()}`;
   const r = await gmFetch(apiUrl, {
    headers: buildBTSearchHeaders(params, searchUrl)
   });
   if (!r.loadstuts || r.status < 200 || r.status >= 400) return { url: searchUrl, data: [] };
   const json = parseJson(r.responseText); const data = pickBTSearchItems(json) .map(item => normalizeBTSearchItem(item, base, searchUrl, kw)) .filter(Boolean);
   return { url: searchUrl, data }; }
  async function _searchsukebei(kw) {
   const base = 'https://' + CFG.sukebeiUrl;
   const r = await gmFetch(`${base}/?f=0&c=0_0&q=${kw}`);
   if (!r.loadstuts) return { url: base, data: [] };
   const doc = parseHTML(r.responseText); const rows = doc.querySelectorAll('tr.default, tr.success');
   const data = [...rows].map(el => {
    const dateCell = el.querySelector('td:nth-child(5)');
    return {
     title: el.querySelector('td:nth-child(2)>a:nth-child(1)')?.title || '',
     maglink: el.querySelector('td:nth-child(3)>a:last-child')?.href || '',
     size: el.querySelector('td:nth-child(4)')?.textContent?.trim() || '',
     date: dateCell?.textContent?.trim() || '',
     timestamp: Number(dateCell?.dataset?.timestamp) || 0,
     src: base + (el.querySelector('td:nth-child(2)>a:nth-child(1)')?.getAttribute('href') || ''), };
   });
   return { url: r.finalUrl || base, data }; }
  function magnetTitleMatchesKeyword(title, keyword) {
   const rawTitle = String(title || '').toUpperCase(); const compactKeyword = String(keyword || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
   if (!rawTitle || !compactKeyword) return false;
   const code = compactKeyword.match(/^([A-Z]{2,15})0*(\d{2,10})$/);
   if (code) {
    const number = code[2].replace(/^0+(?=\d)/, '');
    const pattern = new RegExp(`(?:^|[^A-Z0-9])${code[1]}[\\s._-]*0*${number}(?!\\d)`, 'i');
    return pattern.test(rawTitle); }
   const compactTitle = rawTitle.replace(/[^A-Z0-9]/g, '');
   return compactTitle.includes(compactKeyword); }
  async function _searchU9A9(kw) {
   const base = 'https://' + CFG.u9a9Url;
   const searchUrl =`${base}/?type=2&search=${encodeURIComponent(kw)}`;
   const r = await gmFetch(searchUrl, {
    headers: {
     'Referer': base + '/',
     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', },
   });
   if (!r.loadstuts) return { url: searchUrl, data: [] };
   const doc = parseHTML(r.responseText); const rows = doc.querySelectorAll('table.torrent-list tbody tr.default, table.torrent-list tbody tr.success');
   const data = [...rows].map(el => {
    const titleA = el.querySelector('td:nth-child(2)>a:nth-child(1)'); const magnetA = el.querySelector('td:nth-child(3)>a[href^="magnet:"]');
    const href = titleA?.getAttribute('href') || ''; const src = href ? href.startsWith('http') ? href : new URL(href, base).href : searchUrl;
    return {
     title: titleA?.getAttribute('title') || titleA?.textContent?.trim() || '',
     maglink: magnetA?.href || '',
     size: el.querySelector('td:nth-child(4)')?.textContent?.trim() || '',
     date: el.querySelector('td:nth-child(5)')?.textContent?.trim() || '',
     src, };
   }).filter(item => item.title && item.maglink && magnetTitleMatchesKeyword(item.title, kw));
   return { url: r.finalUrl || searchUrl, data }; }
  async function _searchSokitty(kw) {
   const base = 'https://' + CFG.sokittyUrl;
   const searchUrl =`${base}/search?key=${encodeURIComponent(kw)}`;
   const r = await gmFetch(searchUrl, {
    headers: { 'Referer': base + '/' },
   });
   if (!r.loadstuts) return { url: searchUrl, data: [] };
   const doc = parseHTML(r.responseText); const normalize = s => s.toUpperCase().replace(/[-_\s]/g, ''); const kwNorm = normalize(kw); const data = [];
   doc.querySelectorAll('.panel.search-panel').forEach(panel => {
    const titleA = panel.querySelector('h3.panel-title > a.list-title');
    if (!titleA) return;
    const href = titleA.getAttribute('href') || '';
    if (!href.startsWith('/bt/')) return;
    const hash = href.replace('/bt/', '');
    if (!hash) return;
    const title = titleA.textContent.trim();
    if (!normalize(title).includes(kwNorm)) return;
    const maglink =`magnet:?xt=urn:btih:${hash}`;
    const src = base + href; const infoItems = [...panel.querySelectorAll('.panel-footer .info-item')]; const size = infoItems[0]?.textContent?.trim() || '';
    const date = infoItems[2]?.textContent?.trim() || '';
    data.push({ title, maglink, size, date, src });
   });
   return { url: searchUrl, data }; }
  return { labels: ENGINE_LABELS, getAll: () => Engines.getAll(), getCurrent: () => Engines.getCurrent(), matchesTitle: magnetTitleMatchesKeyword };
 })();
 const MagnetTableStyles = {
  install() {
  GM_addStyle(`.jav-nong-wrapper{overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin}#jav-nong-table{width:100%;min-width:448px;table-layout:fixed;margin:8px 0;color:#666;font-size:13px;text-align:center;background:#f2f2f2;border-collapse:collapse;max-width:100%}#jav-nong-table th,#jav-nong-table td{text-align:center;height:30px;line-height:1.35;vertical-align:middle;background:#fff;padding:0 6px;border:1px solid #efefef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#jav-nong-table .nong-size-head,#jav-nong-table .nong-size-cell{width:72px}#jav-nong-table .nong-file-count-head,#jav-nong-table .nong-file-count-cell{width:44px}#jav-nong-table .nong-op-head,#jav-nong-table .nong-op-cell{width:74px}#jav-nong-table .nong-115-head,#jav-nong-table .nong-115-cell{width:48px}#jav-nong-table:has(td.mag-laosiji-ready-cell) .nong-op-head,#jav-nong-table.has-mag-assistant .nong-op-head,#jav-nong-table.has-mag-assistant .nong-op-cell,#jav-nong-table:has(td.mag-laosiji-ready-cell) .nong-op-cell{width:110px}#jav-nong-table:has(td.mag-laosiji-ready-cell),#jav-nong-table.has-mag-assistant{min-width:340px}#jav-nong-table:has(td.mag-laosiji-ready-cell) .nong-115-head,#jav-nong-table.has-mag-assistant .nong-115-head,#jav-nong-table.has-mag-assistant .nong-115-cell,#jav-nong-table:has(td.mag-laosiji-ready-cell) .nong-115-cell{width:0!important;padding-left:0!important;padding-right:0!important;border-left:0!important;border-right:0!important}#jav-nong-table td.mag-laosiji-ready-cell{overflow:hidden!important;padding-left:4px;padding-right:4px}#jav-nong-table td.mag-laosiji-ready-cell .mag-btn-group{max-width:100%;box-sizing:border-box;white-space:nowrap}#jav-nong-table td:first-child{text-align:left}#jav-nong-table .nong-head-row th{background:#f8f8f8;font-weight:600}#jav-nong-table .nong-head-controls{display:flex;align-items:center;gap:5px;min-width:0;white-space:nowrap}#jav-nong-table .nong-head-controls select{height:22px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;padding:1px 6px 1px 4px;background:#fff;color:#172033;font-size:12px;font-weight:650}#jav-nong-table .nong-engine-select{min-width:90px;flex:0 0 90px}#jav-nong-table .nong-sort-select{width:70px;min-width:70px;flex:0 0 70px}#jav-nong-table .nong-magnet-name{display:flex;align-items:center;gap:4px;min-width:0;width:100%;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#jav-nong-table .nong-magnet-name>a{flex:1 1 auto;min-width:0;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#jav-nong-table .nong-magnet-date{flex:0 0 auto;color:#7c8798;font-size:11px;font-variant-numeric:tabular-nums}.nong-copy{color:#08c!important;cursor:pointer}.nong-check{color:#be185d!important;cursor:pointer;margin-left:8px}.nong-offline-115{color:rgb(0,180,30)!important;cursor:pointer}.nong-offline-115:hover{color:red!important}.whatslink-overlay{position:fixed;inset:0;z-index:10000040;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(15,23,42,.66);backdrop-filter:blur(8px)}.whatslink-modal{width:min(1100px,96vw);max-height:90vh;display:grid;grid-template-columns:1.55fr .75fr;background:#f5f7fb;border:1px solid rgba(203,213,225,.9);border-radius:12px;overflow:hidden;box-shadow:0 30px 80px rgba(2,8,23,.38);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.whatslink-modal.no-shots{grid-template-columns:1.1fr .9fr}.whatslink-viewer{min-width:0;display:grid;grid-template-rows:minmax(430px,1fr) auto;gap:10px;padding:14px;background:radial-gradient(circle at 20% 0%,#fff1f8 0,transparent 34%),#eef3f8}.whatslink-stage{position:relative;min-height:470px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #dde7f2;border-radius:12px;background:#111827;box-shadow:0 18px 36px rgba(15,23,42,.16)}.whatslink-stage img{width:100%;height:100%;max-height:68vh;object-fit:contain;border-radius:10px}.whatslink-modal.no-shots .whatslink-viewer{grid-template-rows:minmax(430px,1fr);background:linear-gradient(135deg,#f8fafc,#eef2ff)}.whatslink-modal.no-shots .whatslink-stage{background:linear-gradient(145deg,#fff,#f1f5f9);border-style:dashed;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8),0 18px 36px rgba(15,23,42,.08)}.whatslink-modal.no-shots .whatslink-stage img,.whatslink-modal.no-shots .whatslink-nav,.whatslink-modal.no-shots .whatslink-counter,.whatslink-modal.no-shots .whatslink-thumbs{display:none}.whatslink-empty{display:none;width:min(420px,72%);text-align:center;color:#475569}.whatslink-modal.no-shots .whatslink-empty{display:block}.whatslink-empty-icon{width:62px;height:62px;margin:0 auto 15px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(135deg,#fce7f3,#e0e7ff);color:#be185d;font-size:27px;box-shadow:0 12px 26px rgba(190,24,93,.16)}.whatslink-empty-title{font-size:18px;font-weight:800;color:#1e293b;margin-bottom:7px}.whatslink-empty-text{margin:0;font-size:13px;line-height:1.6}.whatslink-nav{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:52px;border:0;border-radius:8px;background:rgba(255,255,255,.14);color:#fff;font-size:28px;cursor:pointer}.whatslink-nav:hover{background:rgba(255,255,255,.24)}.whatslink-prev{left:12px}.whatslink-next{right:12px}.whatslink-counter{position:absolute;right:14px;bottom:12px;color:#e2e8f0;font-size:12px;text-shadow:0 1px 6px rgba(0,0,0,.6)}.whatslink-thumbs{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;padding:0;background:transparent}.whatslink-thumb{border:2px solid #e2e8f0;border-radius:9px;padding:0;overflow:hidden;background:#fff;cursor:pointer;aspect-ratio:16 / 9;box-shadow:0 6px 14px rgba(15,23,42,.08)}.whatslink-thumb.active{border-color:#db2777;box-shadow:0 8px 18px rgba(219,39,119,.22)}.whatslink-thumb img{width:100%;height:100%;object-fit:cover;display:block}.whatslink-info{min-width:0;padding:14px;background:#f8fafc;overflow:auto;color:#172033}.whatslink-head{position:sticky;top:0;z-index:2;margin:-14px -14px 12px;padding:13px 14px;background:rgba(248,250,252,.94);border-bottom:1px solid #e2e8f0;backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.whatslink-kicker{color:#db2777;font-size:12px;font-weight:800;margin-bottom:5px}.whatslink-title{margin:0;font-size:21px;line-height:1.18;color:#111827;word-break:break-word}.whatslink-close{width:32px;height:32px;border:0;border-radius:8px;color:#64748b;background:transparent;cursor:pointer;font-size:25px;line-height:1}.whatslink-tag{display:inline-flex;align-items:center;min-height:22px;padding:0 8px;margin-top:8px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700}.whatslink-meta{display:grid;grid-template-columns:1fr;gap:7px;margin:10px 0 12px}.whatslink-metric{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.06)}.whatslink-metric b{color:#172033;font-size:13px;order:2}.whatslink-metric span{color:#64748b;font-size:12px;order:1}.whatslink-section,.whatslink-summary-card{border:1px solid #e2e8f0;border-radius:10px;background:#fff;padding:10px;box-shadow:0 8px 20px rgba(15,23,42,.06)}.whatslink-section h3{margin:0 0 8px;color:#be185d;font-size:12px}.whatslink-magnet{word-break:break-all;max-height:86px;overflow:auto;padding:9px;border-radius:8px;background:#f6f8fb;color:#334155;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}.whatslink-summary{display:grid;gap:8px;margin-top:10px}.whatslink-summary-card strong{display:block;margin-bottom:4px;color:#111827;font-size:12px}.whatslink-summary-card p{margin:0;color:#64748b;font-size:11px;line-height:1.45}.whatslink-loading{padding:28px;text-align:center;color:#475569;font-size:14px}html[data-laosiji-mobile] .whatslink-overlay{align-items:center!important;padding:8px!important}html[data-laosiji-mobile] .whatslink-modal,html[data-laosiji-mobile] .whatslink-modal.no-shots{width:calc(100vw - 16px)!important;height:calc(100dvh - 16px)!important;max-height:calc(100dvh - 16px)!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,44dvh) minmax(0,1fr)!important;border-radius:12px!important}html[data-laosiji-mobile] .whatslink-viewer,html[data-laosiji-mobile] .whatslink-modal.no-shots .whatslink-viewer{min-height:0!important;padding:8px!important;gap:8px!important;grid-template-rows:minmax(0,1fr) auto!important}html[data-laosiji-mobile] .whatslink-stage{min-height:0!important}html[data-laosiji-mobile] .whatslink-stage img{max-height:none!important}html[data-laosiji-mobile] .whatslink-info{min-height:0!important;padding:12px!important;overscroll-behavior:contain!important}html[data-laosiji-mobile] .whatslink-head{margin:-12px -12px 10px!important;padding:10px 12px!important}html[data-laosiji-mobile] .whatslink-title{font-size:18px!important}html[data-laosiji-mobile] .whatslink-close{width:44px!important;height:44px!important;flex:0 0 44px!important;font-size:28px!important;touch-action:manipulation!important}@media (orientation:portrait){html[data-laosiji-mobile] .whatslink-meta{grid-template-columns:repeat(2,minmax(0,1fr))!important}html[data-laosiji-mobile] .whatslink-metric:last-child{grid-column:1 / -1}}@media (orientation:landscape){html[data-laosiji-mobile] .whatslink-modal,html[data-laosiji-mobile] .whatslink-modal.no-shots{width:min(960px,calc(100vw - 16px))!important;grid-template-columns:minmax(0,1.55fr) minmax(220px,.75fr)!important;grid-template-rows:minmax(0,1fr)!important}html[data-laosiji-mobile] .whatslink-viewer,html[data-laosiji-mobile] .whatslink-modal.no-shots .whatslink-viewer{padding:12px!important}}.whatslink-overlay{position:fixed;inset:0;z-index:10000040;display:flex;align-items:center;justify-content:center;padding:18px;background:transparent;backdrop-filter:none}.whatslink-modal,.whatslink-modal.no-shots{position:relative;inset:auto;width:min(1140px,calc(100vw - 36px));max-width:1140px;height:auto;max-height:calc(100vh - 36px);display:block;overflow:visible;border:0;border-radius:0;background:transparent;box-shadow:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.whatslink-gallery-scene{position:relative;inset:auto;display:grid;grid-template-rows:minmax(0,1fr) auto auto;row-gap:3px;width:100%;height:auto;align-items:center;justify-items:center;overflow:hidden;background:transparent}.whatslink-gallery-scene::after{content:none}.whatslink-gallery-visual{position:relative;z-index:1;grid-row:1;width:100%;height:auto;min-height:0;margin:0!important;display:grid;place-items:center;overflow:hidden}.whatslink-gallery-hero{position:relative;z-index:1;width:100%;height:100%;min-height:0;object-fit:contain;display:block}.whatslink-gallery-close{position:absolute;top:12px;right:14px;z-index:4;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;color:#fff;background:rgba(42,45,49,.76);cursor:pointer;padding:0 0 2px;font-family:Arial,sans-serif;font-size:23px;line-height:1}.whatslink-gallery-close:hover,.whatslink-gallery-arrow:hover{background:rgba(22,25,28,.92)}.whatslink-gallery-arrow{position:absolute;top:50%;z-index:3;width:34px;height:34px;display:flex;align-items:center;justify-content:center;transform:translateY(-50%);border:0;border-radius:50%;color:#fff;background:rgba(38,42,45,.76);cursor:pointer;padding:0 0 3px;font-family:Arial,sans-serif;font-size:27px;line-height:1}.whatslink-gallery-prev{left:16px}.whatslink-gallery-next{right:16px}.whatslink-gallery-info{grid-row:2;position:relative;z-index:3;margin:0!important;min-height:23px;display:flex;align-items:center;gap:8px;padding:4px 10px;border-radius:4px;color:#fff;background:rgba(38,40,42,.68);font:11px ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap}.whatslink-gallery-info span+span::before{content:" · ";margin-right:8px;color:rgba(255,255,255,.42)}.whatslink-gallery-thumbs{grid-row:3;position:relative;z-index:3;margin:0!important;display:flex;justify-content:center;gap:3px;width:auto;max-width:100%;padding:3px;border-radius:4px;background:rgba(29,31,34,.68);box-shadow:none}.whatslink-gallery-thumb{width:88px;height:50px;padding:0;overflow:hidden;border:2px solid transparent;border-radius:3px;background:transparent;cursor:pointer}.whatslink-gallery-thumb.active{border-color:#e3a05b}.whatslink-gallery-thumb img{width:100%;height:100%;display:block;object-fit:cover}.whatslink-gallery-empty{position:absolute;z-index:2;display:none;width:min(420px,72%);text-align:center;color:rgba(255,255,255,.74)}.whatslink-modal.no-shots .whatslink-gallery-empty{display:block}.whatslink-modal.no-shots .whatslink-gallery-visual{width:100%;height:min(460px,calc(100vh - 100px))}.whatslink-modal.no-shots .whatslink-gallery-hero,.whatslink-modal.no-shots .whatslink-gallery-arrow,.whatslink-modal.no-shots .whatslink-gallery-thumbs{display:none}.whatslink-gallery-empty-icon{width:56px;height:56px;margin:0 auto 14px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.24);border-radius:50%;color:#e3a05b;font-size:24px}.whatslink-gallery-empty-title{margin-bottom:7px;color:#fff;font-size:17px;font-weight:800}.whatslink-gallery-empty-text{margin:0;font-size:13px;line-height:1.6}html[data-laosiji-mobile] .whatslink-overlay{padding:10px!important}html[data-laosiji-mobile] .whatslink-modal,html[data-laosiji-mobile] .whatslink-modal.no-shots{width:calc(100vw - 20px)!important;height:auto!important;max-height:calc(100dvh - 20px)!important;display:block!important;border-radius:4px!important}html[data-laosiji-mobile] .whatslink-gallery-info{max-width:100%;overflow:hidden;text-overflow:ellipsis}html[data-laosiji-mobile] .whatslink-gallery-info span:nth-child(2){display:none}html[data-laosiji-mobile] .whatslink-gallery-thumb{width:60px;height:38px}html[data-laosiji-mobile] .whatslink-gallery-close{top:10px;right:10px;width:40px;height:40px}html[data-laosiji-mobile] .whatslink-gallery-arrow{width:32px;height:32px}html[data-laosiji-mobile] .whatslink-gallery-thumbs{max-width:calc(100% - 16px);overflow:hidden}#jav-nong-notice{padding:8px 0}.nong-magnet-name{max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;text-align:left}#jav-nong-refresh{display:none;margin-left:8px;color:#e74c3c;font-weight:bold;cursor:pointer}`);
  }, };
 const Magnet = (() => {
  MagnetTableStyles.install();
  function supportsFileCountColumn(engineKey) { return engineKey === CFG.javdbSearchUrl || engineKey === CFG.btsearchUrl || engineKey === CFG.omagUrl; }
  function magnetTableColSpan(table) { return table?.dataset?.fileCountEnabled === '1' ? 5 : 4; }
  function syncFileCountColumn(table, engineKey) {
   const enabled = supportsFileCountColumn(engineKey);
   table.dataset.fileCountEnabled = enabled ? '1' : '0';
   table.querySelectorAll('.nong-file-count-head,.nong-file-count-cell').forEach(cell => { cell.style.display = enabled ? '' : 'none'; }); }
  function parseMagnetSize(value) {
   const match = String(value || '').replace(/,/g, '').match(/([\d.]+)\s*(TiB|GiB|MiB|KiB|TB|GB|MB|KB|B)?/i);
   if (!match) return 0;
   const number = parseFloat(match[1]); const unit = (match[2] || 'B').toUpperCase();
   const multipliers = { TIB: 1099511627776, TB: 1099511627776, GIB: 1073741824, GB: 1073741824, MIB: 1048576, MB: 1048576, KIB: 1024, KB: 1024, B: 1 };
   return Number.isFinite(number) ? number * (multipliers[unit] || 1) : 0; }
  function parseMagnetTimestamp(value) {
   const text = String(value ?? '').trim();
   if (!text) return 0;
   if (/^\d{10,13}$/.test(text)) { const numeric = Number(text); return text.length === 10 ? numeric * 1000 : numeric; }
   const normalized = text
    .replace(/\//g, '-')
    .replace(/(\d)\s+(\d{1,2}:\d{2})/, '$1T$2');
   const timestamp = Date.parse(normalized);
   return Number.isFinite(timestamp) ? timestamp : 0; }
  function magnetItemTimestamp(item) { return parseMagnetTimestamp(item?.timestamp) || parseMagnetTimestamp(item?.date); }
  function formatMagnetDate(item) {
   const raw = String(item?.date || '').trim();
   const match = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
   if (match) return`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
   const timestamp = magnetItemTimestamp(item);
   return timestamp ? new Date(timestamp).toISOString().slice(0, 10) : ''; }
  function hasCrackedCode(text) {
   const codePattern = /\b(?:UN|UC)\b/g; let match;
   while ((match = codePattern.exec(text))) {
    const before = text.slice(0, match.index); const after = text.slice(match.index + match[0].length);
    const adjacentNumber = /\d$/.test(before) || /^\d/.test(after); const adjacentSubtitle = /\u5b57\u5e55$/.test(before) || /^\u5b57\u5e55/.test(after);
    if (!adjacentNumber && !adjacentSubtitle) return true;
   }
   return /\d[-_\s]U(?:$|[\s._-])/i.test(text); }
  function stripPromotionalSuffix(text) { return String(text || '').replace(/【[^】]*(?:APP|夸克|UC搜|(?:[a-z0-9-]+\.)+(?:com|net|org|cc|sbs|top))[^】]*】/gi, ' '); }
  function classifyQuality(title) {
   const text = stripPromotionalSuffix(title); const hasCJK = /[\u4e00-\u9fff]/.test(text); const hasJP = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
   const isChinese = /(?:[^A-Za-z]|^)FHDC(?:[^A-Za-z]|$)/i.test(text) || /[-_](?:UC|CH?)(?:[^A-Za-z]|$)/.test(text)
    || /(?:\u4e2d\u5b57|\u4e2d\u6587|\u5b57\u5e55|\u4e2d\u6587\u5b57\u5e55|\u7e41\u9ad4\u4e2d\u5b57|\u7e41\u4f53\u4e2d\u5b57|\u7e41\u9ad4\u4e2d\u6587|\u7e41\u4f53\u4e2d\u6587|\u7e41\u9ad4\u5b57\u5e55|\u7e41\u4f53\u5b57\u5e55|\u7e41\u4e2d|\u7e41\u5b57|\u81ea\u63d0|\u5f81\u7528|\u5fb5\u7528|\u6f22\u5316|\u6c49\u5316|\u5167\u5d4c|\u5185\u5d4c|\u5167\u5c01|\u5185\u5c01|\u96d9\u8a9e|\u53cc\u8bed)/.test(text)
    || (hasCJK && !hasJP);
   const is4K = /(?:[^A-Za-z0-9]|^)(?:4K(?:UHD)?|2160P)(?:[^A-Za-z0-9]|$)/i.test(text);
   const isCracked = /(?:\u7834\u89e3|\u7834\u574f|\u7834\u58de|\u7834\u58ca|\u65e0\u7801|\u7121\u78bc)/.test(text)
    || /\b(?:uncensored|mosaic)\b/i.test(text) || hasCrackedCode(text);
   return { isChinese, is4K, isCracked }; }
  function sortMagnetData(data, mode) {
   return [...data] .map((item, index) => ({ item, index })) .sort((a, b) => {
     const sizeDelta = parseMagnetSize(b.item?.size) - parseMagnetSize(a.item?.size);
     if (mode === 'size') return sizeDelta || a.index - b.index;
     const aTime = magnetItemTimestamp(a.item); const bTime = magnetItemTimestamp(b.item);
     if (!aTime && !bTime) return sizeDelta || a.index - b.index;
     if (!aTime) return 1;
     if (!bTime) return -1;
     const timeDelta = mode === 'oldest' ? aTime - bTime : bTime - aTime;
     return timeDelta || sizeDelta || a.index - b.index;
    }) .map(entry => entry.item); }
  function buildTable(avid) {
   const table = document.createElement('table');
   table.id = 'jav-nong-table'; table.dataset.avid = avid;
   const syncAssistantState = () => {
    table.classList.toggle('has-mag-assistant', !!table.querySelector('td.mag-laosiji-ready-cell, .mag-btn-group')); };
   const assistantObserver = new MutationObserver(syncAssistantState);
   assistantObserver.observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
   table.dataset.magAssistantObserver = '1';
   const headRow = document.createElement('tr');
   headRow.className = 'nong-head-row';
   const thEngine = document.createElement('th');
   thEngine.style.textAlign = 'left';
   const allEngines = MagnetEngines.getAll(); const curKey = CFG.defaultEngine; const controls = document.createElement('div');
   controls.className = 'nong-head-controls';
   const sel = document.createElement('select');
   sel.className = 'nong-engine-select'; sel.dataset.magnetEngine = '1';
   sel.setAttribute('aria-label', '磁力引擎');
   const labels = MagnetEngines.labels();
   Object.keys(allEngines).forEach(k => { sel.add(new Option(labels[k] || k, k, false, k === curKey)); });
   const fitSelWidth = () => {
    sel.style.width = '';
    const natural = sel.offsetWidth;
    sel.style.width = Math.max(natural, 90) + 'px'; };
   requestAnimationFrame(fitSelWidth);
   sel.addEventListener('change', () => {
    runSearch(table, avid, sel.value); requestAnimationFrame(fitSelWidth);
   });
   const sortSel = document.createElement('select');
   sortSel.className = 'nong-sort-select'; sortSel.dataset.magnetSort = '1';
   sortSel.setAttribute('aria-label', '排序方式');
   sortSel.title = '排序方式';
   [
    ['size', '大小'],
    ['newest', '最新'],
    ['oldest', '最旧'],
   ].forEach(([value, label]) => sortSel.add(new Option(label, value)));
   sortSel.value = CFG.magnetSort; sortSel.disabled = true; table.dataset.sortMode = CFG.magnetSort;
   sortSel.addEventListener('change', () => {
    table.dataset.sortMode = sortSel.value; CFG.magnetSort = sortSel.value;
    if (Array.isArray(table._laosijiMagnetData)) { fillTable(table, table._laosijiMagnetData, table._laosijiMagnetEngineUrl || ''); }
   });
   controls.appendChild(sel); controls.appendChild(sortSel); thEngine.appendChild(controls); headRow.appendChild(thEngine);
   ['大小', '文件', '操作', '115'].forEach(txt => {
    const th = document.createElement('th');
    th.textContent = txt;
    if (txt === '大小') th.className = 'nong-size-head';
    if (txt === '文件') th.className = 'nong-file-count-head';
    if (txt === '操作') th.className = 'nong-op-head';
    if (txt === '115') th.className = 'nong-115-head';
    headRow.appendChild(th);
   });
   syncFileCountColumn(table, curKey); table.appendChild(headRow);
   const loadRow = document.createElement('tr'); const loadTd = document.createElement('td');
   loadTd.colSpan = magnetTableColSpan(table); loadTd.id = 'jav-nong-notice';
   const loadText = document.createTextNode('Loading…'); const refreshBtn = document.createElement('a');
   refreshBtn.id = 'jav-nong-refresh'; refreshBtn.href = '#'; refreshBtn.textContent = '🔄 刷新'; refreshBtn.title = '网络加载失败，点击重试';
   refreshBtn.addEventListener('click', e => {
    e.preventDefault(); runSearch(table, avid, sel.value);
   });
   loadTd.appendChild(loadText); loadTd.appendChild(refreshBtn); loadRow.appendChild(loadTd); table.appendChild(loadRow);
   return table; }
  function fillTable(table, data, engineUrl) {
   table._laosijiMagnetData = [...data]; table._laosijiMagnetEngineUrl = engineUrl;
   data = sortMagnetData(table._laosijiMagnetData, table.dataset.sortMode || CFG.magnetSort);
   const showFileCount = table.dataset.fileCountEnabled === '1'; const sortSelect = table.querySelector('[data-magnet-sort]');
   [...table.querySelectorAll('tr:not(.nong-head-row)')].forEach(row => row.remove());
   if (sortSelect) sortSelect.disabled = !data.length;
   if (!data.length) {
    const emptyRow = document.createElement('tr'); const td = document.createElement('td');
    td.colSpan = magnetTableColSpan(table);
    td.innerHTML =`无搜索结果 <a href="${engineUrl}" target="_blank" style="color:red">前往查看</a>`;
    const refresh = document.createElement('a');
    refresh.href = '#'; refresh.textContent = ' 🔄 刷新'; refresh.style.cssText = 'margin-left:8px;color:#e74c3c;font-weight:bold;cursor:pointer;';
    refresh.addEventListener('click', e => {
     e.preventDefault();
     const engineKey = table.querySelector('[data-magnet-engine]')?.value || CFG.defaultEngine;
     runSearch(table, table.dataset.avid || '', engineKey);
    });
    td.appendChild(refresh); emptyRow.appendChild(td); table.appendChild(emptyRow);
    return; }
   data.forEach(item => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-maglink', item.maglink);
    const tdTitle = document.createElement('td'); const nameSpan = document.createElement('span');
    nameSpan.className = 'nong-magnet-name'; nameSpan.title = item.title;
    const { isChinese, is4K, isCracked } = classifyQuality(item.title);
    if (isChinese) {
     const badge = document.createElement('span');
     badge.textContent = '[中字]';
     badge.style.cssText = 'display:inline-block;margin-right:5px;padding:1px 5px;font-size:11px;font-weight:800;color:#fff;background:#16a34a;border-radius:4px;vertical-align:middle;flex-shrink:0;box-shadow:0 0 0 1px rgba(22,163,74,.18);';
     nameSpan.appendChild(badge);
     nameSpan.style.background = 'linear-gradient(90deg,#dcfce7 0%,#f0fdf4 55%,#fff 100%)'; nameSpan.style.borderLeft = '4px solid #16a34a';
     nameSpan.style.paddingLeft = '5px'; }
    if (isCracked) {
     const crackedBadge = document.createElement('span');
     crackedBadge.textContent = '[\u7834\u89e3]';
     crackedBadge.style.cssText = 'display:inline-block;margin-right:5px;padding:1px 5px;font-size:11px;font-weight:800;color:#fff;background:#be123c;border-radius:4px;vertical-align:middle;flex-shrink:0;box-shadow:0 0 0 1px rgba(190,18,60,.18);';
     nameSpan.appendChild(crackedBadge);
     if (!isChinese && !is4K) {
      nameSpan.style.background = 'linear-gradient(90deg,#ffe4e6 0%,#fff1f2 55%,#fff 100%)'; nameSpan.style.borderLeft = '4px solid #be123c';
      nameSpan.style.paddingLeft = '5px'; } }
    if (is4K) {
     const badge4k = document.createElement('span');
     badge4k.textContent = '[4K]';
     badge4k.style.cssText = 'display:inline-block;margin-right:5px;padding:1px 5px;font-size:11px;font-weight:800;color:#fff;background:#2563eb;border-radius:4px;vertical-align:middle;flex-shrink:0;box-shadow:0 0 0 1px rgba(37,99,235,.18);';
     nameSpan.insertBefore(badge4k, nameSpan.firstChild);
     if (!isChinese) {
      nameSpan.style.background = 'linear-gradient(90deg,#dbeafe 0%,#eff6ff 55%,#fff 100%)'; nameSpan.style.borderLeft = '4px solid #2563eb';
      nameSpan.style.paddingLeft = '5px'; } }
    const titleLink = document.createElement('a');
    titleLink.href = item.maglink; titleLink.target = '_self'; titleLink.textContent = item.title;
    nameSpan.appendChild(titleLink);
    const displayDate = formatMagnetDate(item);
    if (displayDate) {
     const dateSpan = document.createElement('span');
     dateSpan.className = 'nong-magnet-date'; dateSpan.textContent = displayDate;
     dateSpan.title = item.date ?`收录时间：${item.date}` : '收录时间';
     nameSpan.appendChild(dateSpan); }
    tdTitle.appendChild(nameSpan); tr.appendChild(tdTitle);
    const tdSize = document.createElement('td');
    tdSize.className = 'nong-size-cell'; tdSize.style.whiteSpace = 'nowrap'; tdSize.textContent = item.size;
    tr.appendChild(tdSize);
    if (showFileCount) {
     const tdFiles = document.createElement('td');
     tdFiles.className = 'nong-file-count-cell'; tdFiles.style.cssText = 'white-space:nowrap;text-align:center;'; tdFiles.textContent = item.files || '-';
     tr.appendChild(tdFiles); }
    const tdOp = document.createElement('td');
    tdOp.className = 'nong-op-cell'; tdOp.style.cssText = 'white-space:nowrap;padding-left:3px;padding-right:3px;';
    const copyBtn = document.createElement('a'); const magShort = item.maglink.substring(0, 60);
    const _extractCode = (text) => {
     if (!text) return null;
     const patterns = [
      /FC2[-\s_]?(?:PPV)?[-\s_]?(\d{6,9})/i,
      /([A-Z]{2,15})-(\d{2,10})(?:-(\d+))?/i,
      /([A-Z]{2,15})-([A-Z]{0,2}\d{2,10})/i,
      /^[A-Z0-9]+[-_](\d{6}[-_]\d{2,3})/i,
      /(\d{6}[-_]\d{2,3})[-_][A-Z0-9]+$/i,
      /(?<!\w)(\d{6}[-_]\d{2,3})(?!\w)/,
      /([A-Z]{1,2})(\d{3,4})/i, ];
     for (const re of patterns) {
      const m = text.match(re);
      if (m) return m[0].toUpperCase();
     }
     return null; };
    const dnCode = _extractCode(item.title) || _extractCode(item.maglink);
    const magWithDn = magShort + (dnCode ?`&dn=${encodeURIComponent(dnCode)}` : '');
    copyBtn.href = magShort; copyBtn.title = magShort; copyBtn.className = 'nong-copy'; copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', e => {
     e.preventDefault(); GM_setClipboard(magWithDn);
     copyBtn.textContent = '✓';
     setTimeout(() => { copyBtn.textContent = '复制'; }, 1000);
    });
    tdOp.appendChild(copyBtn);
    const checkBtn = document.createElement('a');
    checkBtn.href = '#'; checkBtn.className = 'nong-check'; checkBtn.textContent = '验车';
    checkBtn.addEventListener('click', e => {
     e.preventDefault(); MagnetActions.checkWhatslink(item.maglink);
    });
    tdOp.appendChild(checkBtn); tr.appendChild(tdOp);
    const tdOffline = document.createElement('td');
    tdOffline.className = 'nong-115-cell';
    const offBtn = document.createElement('a');
    offBtn.href = '#'; offBtn.className = 'nong-offline-115'; offBtn.textContent = '115';
    offBtn.addEventListener('click', e => {
     e.preventDefault(); MagnetActions.offline115(item.maglink);
    });
    tdOffline.appendChild(offBtn); tr.appendChild(tdOffline); table.appendChild(tr);
   }); }
  async function runSearch(table, avid, engineKey) {
   [...table.querySelectorAll('tr:not(.nong-head-row)')].forEach(r => r.remove());
   table._laosijiMagnetData = null; table._laosijiMagnetEngineUrl = '';
   const sortSelect = table.querySelector('[data-magnet-sort]');
   if (sortSelect) sortSelect.disabled = true;
   syncFileCountColumn(table, engineKey);
   const loadRow = document.createElement('tr'); const loadTd = document.createElement('td');
   loadTd.colSpan = magnetTableColSpan(table); loadTd.id = 'jav-nong-notice';
   const loadText = document.createTextNode('Loading…'); const refreshBtn = table.querySelector('#jav-nong-refresh') || document.createElement('a');
   refreshBtn.id = 'jav-nong-refresh'; refreshBtn.href = '#'; refreshBtn.textContent = '🔄 刷新';
   refreshBtn.style.cssText = 'display:none;margin-left:8px;color:#e74c3c;font-weight:bold;cursor:pointer;';
   refreshBtn.onclick = e => { e.preventDefault(); runSearch(table, avid, engineKey); };
   loadTd.appendChild(loadText); loadTd.appendChild(refreshBtn); loadRow.appendChild(loadTd); table.appendChild(loadRow);
   let timedOut = false;
   const timer = setTimeout(() => {
    timedOut = true; loadText.textContent = '加载超时 '; refreshBtn.style.display = 'inline';
   }, 8000);
   try {
    const allEngines = MagnetEngines.getAll(); const fn = allEngines[engineKey] || Object.values(allEngines)[0];
    const keyword = MagnetApi.normalizeMagnetSearchKeyword(avid); const result = await fn(keyword);
    const data = (result.data || []).map(item => ({ ...item,
     title: MagnetApi.normalizeMagnetResultTitle(item.title, keyword),
    }));
    clearTimeout(timer);
    if (timedOut) return;
    fillTable(table, data, result.url);
   } catch(e) {
    clearTimeout(timer); errorLog('磁力搜索出错:', e);
    loadText.textContent = '搜索出错 '; refreshBtn.style.display = 'inline'; } }
  function createMagnetWidget(avid) {
   const wrapper = document.createElement('div');
   wrapper.className = 'jav-nong-wrapper';
   wrapper.style.cssText =`display:inline-block;width:min(560px,100%);max-width:100%;box-sizing:border-box;padding:12px 12px 10px;background:#fafafa;border:1px solid #ebebeb;border-radius:6px;overflow:hidden;`;
   const header = document.createElement('div');
   header.style.cssText = 'margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
   const title = document.createElement('span');
   title.style.cssText = 'color:#0066cc;font-size:14px;font-weight:600;'; title.textContent = '🔥 磁力搜索';
   header.appendChild(title); wrapper.appendChild(header);
   const table = buildTable(avid);
   wrapper.appendChild(table);
   const engineKey = table.querySelector('[data-magnet-engine]')?.value || CFG.defaultEngine;
   runSearch(table, avid, engineKey);
   return wrapper; }
  return { createMagnetWidget, formatDate: formatMagnetDate, sortData: sortMagnetData, classifyQuality, javdbApi: MagnetApi.client };
 })();
 Core.expose('__LAOSIJI_MAGNET__', Magnet);
 const NativeMagnetPanelStyles = {
  install() {
   GM_addStyle(`.laosiji-native-magnet-panel{width:100%;box-sizing:border-box;margin:14px 0;color:#172033;background:#fffdfa;border:1px solid #e6ddd3;border-radius:7px;box-shadow:0 8px 24px rgba(68,49,31,.07)}.laosiji-native-magnet-head,.laosiji-native-magnet-controls,.laosiji-native-magnet-tabs,.laosiji-native-magnet-tab-tools,.laosiji-native-magnet-actions,.laosiji-native-magnet-metadata,.laosiji-native-magnet-title-line{display:flex;align-items:center}.laosiji-native-magnet-controls[hidden]{display:none!important}.laosiji-native-magnet-head{justify-content:space-between;gap:14px;min-height:55px;padding:10px 14px;border-bottom:1px solid #e6ddd3}.laosiji-native-magnet-title{color:#172033;font-size:16px;font-weight:720}.laosiji-native-magnet-count{margin-left:9px;color:#667085;font-size:12px;font-weight:500}.laosiji-native-magnet-tabs{flex-wrap:wrap;gap:5px}.laosiji-native-magnet-tab-tools{flex-wrap:wrap;justify-content:flex-end;gap:8px}.laosiji-native-magnet-tab,.laosiji-native-magnet-refresh,.laosiji-native-magnet-action{min-height:30px;padding:3px 8px;border:1px solid #cdd6e2;border-radius:4px;color:#475467;background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:background .16s ease,border-color .16s ease,color .16s ease}.laosiji-native-magnet-tab{border-color:transparent}.laosiji-native-magnet-tab[aria-selected="true"]{color:#1d4ed8;background:#e8f0ff;border-color:#c9d9ff}.laosiji-native-magnet-refresh{color:#1d4ed8;border-color:#bdd0ff;background:#f6f9ff}.laosiji-native-magnet-refresh:hover,.laosiji-native-magnet-action:hover,.laosiji-native-magnet-tab:not([aria-selected="true"]):hover{color:#1d4ed8;background:#f5f8fc;border-color:#a8c2ff}.laosiji-native-magnet-refresh:active,.laosiji-native-magnet-action:active,.laosiji-native-magnet-tab:active{background:#e8f0ff}.laosiji-native-magnet-tab:focus-visible,.laosiji-native-magnet-refresh:focus-visible,.laosiji-native-magnet-action:focus-visible,.laosiji-native-magnet-select:focus-visible{outline:2px solid #1d4ed8;outline-offset:2px}.laosiji-native-magnet-controls{gap:8px;min-height:48px;padding:9px 14px;background:#fffbf6;border-bottom:1px solid #e6ddd3}.laosiji-native-magnet-select{height:30px;max-width:150px;padding:2px 24px 2px 8px;border:1px solid #cdd6e2;border-radius:4px;color:#344054;background:#fff;font-size:12px}.laosiji-native-magnet-default-tab{height:30px;padding:2px 24px 2px 8px;border:1px solid #ddd2c4;border-radius:4px;color:#77543b;background:#fffbf6;font-size:11px;cursor:pointer}.laosiji-native-magnet-default-tab:focus-visible{outline:2px solid #a85b2d;outline-offset:2px}.laosiji-native-magnet-rows{display:grid}.laosiji-native-magnet-row{display:grid;grid-template-columns:20px minmax(0,1fr) auto;grid-template-areas:"index name actions" "index metadata actions";align-items:center;column-gap:6px;row-gap:6px;min-height:64px;padding:10px 12px;border-bottom:1px solid #eee7df;transition:background .16s ease}.laosiji-native-magnet-row:last-child{border-bottom:0}.laosiji-native-magnet-row:hover{background:#fff9f1}.laosiji-native-magnet-index{grid-area:index;color:#8a98a9;font-size:12px;font-variant-numeric:tabular-nums;text-align:right}.laosiji-native-magnet-name,.laosiji-native-magnet-title-line{min-width:0}.laosiji-native-magnet-name{grid-area:name}.laosiji-native-magnet-title-line{gap:7px}.laosiji-native-magnet-title-line>a{flex:0 1 auto;max-width:100%;min-width:0;overflow:hidden;color:#243b67;font-size:13px;font-weight:650;line-height:1.45;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.laosiji-native-magnet-title-line>a:hover{color:#1d4ed8;text-decoration:underline}.laosiji-native-magnet-assistant-trigger{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important}.laosiji-native-magnet-tags{display:flex;flex:0 0 auto;flex-wrap:wrap;gap:5px}.laosiji-native-magnet-tag{display:inline-flex;align-items:center;min-height:20px;padding:1px 6px;border:1px solid #dfe5eb;border-radius:3px;color:#58677a;background:#f3f5f7;font-size:11px;font-weight:700;line-height:1;white-space:nowrap}.laosiji-native-magnet-tag[data-kind="four-k"]{color:#1d4ed8;background:#e8f0ff;border-color:#c9d9ff}.laosiji-native-magnet-tag[data-kind="subtitle"]{color:#a85b00;background:#fff2d9;border-color:#ffe0a5}.laosiji-native-magnet-tag[data-kind="cracked"]{color:#9f1239;background:#ffe4e6;border-color:#fecdd3}.laosiji-native-magnet-metadata{grid-area:metadata;display:flex;flex-wrap:wrap;gap:5px 15px}.laosiji-native-magnet-meta{display:inline-flex;align-items:baseline;gap:4px;color:#344054;font-size:12px;font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}.laosiji-native-magnet-meta::before{content:attr(data-label);color:#7b8796;font-size:11px;font-weight:500}.laosiji-native-magnet-actions{grid-area:actions;align-self:center;justify-content:flex-end;gap:6px;min-width:max-content}.laosiji-native-magnet-action-copy{color:#4b3d87;border-color:#d0c7ee;background:#f6f4ff}.laosiji-native-magnet-action-check{color:#176b9e;border-color:#b8d9ed;background:#f0f9ff}.laosiji-native-magnet-action-offline{color:#137553;border-color:#b7ddce;background:#effaf5}.laosiji-native-magnet-action-copy:hover{color:#3d3075;border-color:#b9aae5;background:#eeebff}.laosiji-native-magnet-action-check:hover{color:#115b89;border-color:#91c5e4;background:#e5f5ff}.laosiji-native-magnet-action-offline:hover{color:#0f6548;border-color:#8ac9b3;background:#e3f6ed}.laosiji-native-magnet-actions .mag-btn-group{display:inline-flex!important;align-items:center;gap:4px;margin:0!important;white-space:nowrap}.laosiji-native-magnet-actions .mag-btn-group .mag-btn{margin:0!important}.laosiji-native-magnet-empty{padding:22px 14px;color:#64748b;text-align:center;font-size:13px}.laosiji-native-magnet-foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 14px;color:#667085;background:#fffbf6;border-top:1px solid #eee7df;font-size:11px}html[data-theme="dark"] .laosiji-native-magnet-panel{color:#e5e7eb;background:#222b38;border-color:#435062;box-shadow:none}html[data-theme="dark"] .laosiji-native-magnet-head,html[data-theme="dark"] .laosiji-native-magnet-controls{border-color:#435062}html[data-theme="dark"] .laosiji-native-magnet-controls,html[data-theme="dark"] .laosiji-native-magnet-foot{background:#1d2632}html[data-theme="dark"] .laosiji-native-magnet-title,html[data-theme="dark"] .laosiji-native-magnet-meta,html[data-theme="dark"] .laosiji-native-magnet-title-line>a{color:#e5e7eb}html[data-theme="dark"] .laosiji-native-magnet-row{border-color:#374454}html[data-theme="dark"] .laosiji-native-magnet-row:hover{background:#293545}html[data-theme="dark"] .laosiji-native-magnet-count,html[data-theme="dark"] .laosiji-native-magnet-foot,html[data-theme="dark"] .laosiji-native-magnet-empty,html[data-theme="dark"] .laosiji-native-magnet-meta::before,html[data-theme="dark"] .laosiji-native-magnet-index{color:#aeb9c7}html[data-theme="dark"] .laosiji-native-magnet-tab,html[data-theme="dark"] .laosiji-native-magnet-action,html[data-theme="dark"] .laosiji-native-magnet-select,html[data-theme="dark"] .laosiji-native-magnet-default-tab{color:#d9e1ea;background:#253141;border-color:#536276}html[data-theme="dark"] .laosiji-native-magnet-refresh{color:#c8dbff;background:#1f3658;border-color:#4775bc}html[data-theme="dark"] .laosiji-native-magnet-tab[aria-selected="true"]{color:#dce9ff;background:#244b89;border-color:#4e82d5}@media (max-width:760px){.laosiji-native-magnet-head{align-items:flex-start;flex-direction:column;gap:8px;padding:11px 12px}.laosiji-native-magnet-controls{width:100%;align-items:flex-start;flex-wrap:wrap;min-height:0;padding:9px 12px}.laosiji-native-magnet-tab,.laosiji-native-magnet-refresh,.laosiji-native-magnet-action,.laosiji-native-magnet-select,.laosiji-native-magnet-default-tab{min-height:44px}.laosiji-native-magnet-row{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name index" "metadata metadata" "actions actions";gap:8px;min-height:0;padding:11px 12px}.laosiji-native-magnet-name{grid-area:name}.laosiji-native-magnet-index{grid-area:index;align-self:start;padding-top:2px}.laosiji-native-magnet-title-line{align-items:flex-start;flex-wrap:wrap}.laosiji-native-magnet-title-line>a{flex:1 1 100%;overflow:visible;white-space:normal}.laosiji-native-magnet-metadata{grid-area:metadata;gap:10px}.laosiji-native-magnet-meta{text-align:left}.laosiji-native-magnet-actions{grid-area:actions;justify-content:flex-start;flex-wrap:wrap}.laosiji-native-magnet-foot{padding:10px 12px}}`);
  }, };
 const NativeMagnetPanel = (() => {
  NativeMagnetPanelStyles.install();
  const PANEL_CLASS = 'laosiji-native-magnet-panel'; const mountObservers = new Map();
  function assistantGroups(root) { return [...(root?.querySelectorAll?.('.mag-btn-group[data-mag-assistant="1"]') || [])]; }
  function syncAssistantGroups(root) {
   root?.querySelectorAll?.('.laosiji-native-magnet-row').forEach(row => {
    const groups = assistantGroups(row);
    if (!groups.length) return;
    const actions = row.querySelector('.laosiji-native-magnet-actions');
    if (!actions) return;
    const actionGroup = actions.querySelector('.mag-btn-group[data-mag-assistant="1"]'); const keep = actionGroup || groups[0];
    actions.querySelectorAll('.laosiji-native-magnet-action').forEach(button => button.remove());
    if (keep.parentNode !== actions) actions.appendChild(keep);
    groups.forEach(group => {
     if (group !== keep) group.remove();
    });
   }); }
  function cleanText(node, removeSelectors = []) {
   if (!node) return '';
   const copy = node.cloneNode(true);
   removeSelectors.forEach(selector => copy.querySelectorAll(selector).forEach(el => el.remove())); return (copy.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function addText(el, text) {
   el.textContent = String(text || '').trim();
   return el; }
  function toAbsoluteUrl(url) {
   if (!url) return '';
   try {
    return new URL(url, location.href).href;
   } catch (_) { return url; } }
  function getAssistantGroup(node) {
   const group = node?.querySelector('.mag-btn-group');
   if (!group) return null;
   return { group, parent: group.parentNode, next: group.nextSibling }; }
  function parseNativeTags(node) {
   return [...node.querySelectorAll('.tags .tag, .btn-mini-new')] .map(tag => cleanText(tag)) .filter(Boolean); }
  function magnetHash(maglink) {
   const match = String(maglink || '').match(/[?&]xt=urn:btih:([^&]+)/i);
   return match ? match[1].toLowerCase() : ''; }
  function qualityTags(title) {
   const { isChinese, is4K, isCracked } = Magnet.classifyQuality(title);
   return [
    is4K ? '4K' : '',
    isChinese ? '\u4e2d\u5b57' : '',
    isCracked ? '\u7834\u89e3' : '',
   ].filter(Boolean); }
  function tagKind(value) {
   if (value === '4K') return 'four-k';
   if (value === '\u4e2d\u5b57') return 'subtitle';
   if (value === '\u7834\u89e3') return 'cracked';
   return ''; }
  function parseJavbusItems(container) {
   return [...container.querySelectorAll('tr')] .map(row => {
     const cells = [...row.querySelectorAll(':scope > td')]; const magnetLink = row.querySelector('a[href^="magnet:"]');
     if (!magnetLink || cells.length < 2) return null;
     const title = cleanText(cells[0], ['.mag-btn-group', '.btn-mini-new']) || cleanText(magnetLink);
     return {
      title,
      maglink: magnetLink.href,
      size: cleanText(cells[1]),
      files: '',
      date: cleanText(cells[2]),
      qualityTags: qualityTags(title),
      nativeTags: parseNativeTags(cells[0]),
      assistant: getAssistantGroup(cells[0]), };
    }) .filter(Boolean); }
  function parseJavdbItems(container) {
   return [...container.querySelectorAll('.item')] .map(row => {
     const magnetLink = row.querySelector('.magnet-name a[href^="magnet:"]');
     if (!magnetLink) return null;
     const metaText = cleanText(row.querySelector('.magnet-name .meta')); const [size = '', files = ''] = metaText.split(/[,，]/).map(part => part.trim());
     const title = cleanText(row.querySelector('.magnet-name .name')) || cleanText(magnetLink);
     return {
      title,
      maglink: magnetLink.href,
      size,
      files,
      date: cleanText(row.querySelector('.date .time, .date')),
      qualityTags: qualityTags(title),
      nativeTags: parseNativeTags(row),
      assistant: getAssistantGroup(row.querySelector('.magnet-name')), };
    }) .filter(Boolean); }
  function buildNativeItems(site, container) {
   if (site === 'javbus') return parseJavbusItems(container);
   if (site === 'javdb') return parseJavdbItems(container);
   return []; }
  function normalizeAggregateItems(data, { titleAsMagnet = false, nativeItems = [], keyword = '' } = {}) {
   const nativeTagMap = new Map(
    nativeItems .map(item => [magnetHash(item?.maglink), item?.nativeTags || []]) .filter(([hash]) => hash)
   );
   return data.map(item => ({
    title: MagnetApi.normalizeMagnetResultTitle(item?.title || item?.maglink || '', keyword),
    maglink: item?.maglink || '',
    src: titleAsMagnet ? '' : toAbsoluteUrl(item?.src || ''),
    size: String(item?.size || ''),
    files: String(item?.files || ''),
    date: Magnet.formatDate(item),
    qualityTags: qualityTags(item?.title),
    nativeTags: nativeTagMap.get(magnetHash(item?.maglink)) || [],
   })).filter(item => item.title && item.maglink); }
  function createButton(label, className, onClick) {
   const button = document.createElement('button');
   button.type = 'button'; button.className = className; button.textContent = label;
   button.addEventListener('click', onClick);
   return button; }
  function appendAssistantTrigger(titleLine, item) {
   if (!item?.src || !item.maglink) return;
   const trigger = document.createElement('a');
   trigger.className = 'laosiji-native-magnet-assistant-trigger'; trigger.href = item.maglink; trigger.textContent = item.title; trigger.title = item.title;
   trigger.setAttribute('aria-hidden', 'true');
   trigger.tabIndex = -1;
   titleLine.appendChild(trigger); }
  function createTagGroup(values, withKinds = false) {
   if (!values?.length) return null;
   const tags = document.createElement('div');
   tags.className = 'laosiji-native-magnet-tags';
   values.forEach(value => {
    const tag = document.createElement('span');
    tag.className = 'laosiji-native-magnet-tag';
    const kind = withKinds ? tagKind(value) : '';
    if (kind) tag.dataset.kind = kind;
    addText(tag, value); tags.appendChild(tag);
   });
   return tags; }
  function appendFallbackActions(actions, item) {
   const copyButton = createButton('复制', 'laosiji-native-magnet-action laosiji-native-magnet-action-copy', () => {
    GM_setClipboard(item.maglink);
    copyButton.textContent = '已复制';
    setTimeout(() => { copyButton.textContent = '复制'; }, 900);
   });
   const checkButton = createButton('验车', 'laosiji-native-magnet-action laosiji-native-magnet-action-check', () => {
    MagnetActions.checkWhatslink(item.maglink);
   });
   const offlineButton = createButton('115离线', 'laosiji-native-magnet-action laosiji-native-magnet-action-offline', () => {
    MagnetActions.offline115(item.maglink);
   });
   actions.append(copyButton, checkButton, offlineButton); }
  function appendActions(actions, item) {
   if (item.assistant?.group) { item.assistant.group._laosijiNativeOrigin = item.assistant; actions.appendChild(item.assistant.group); return; }
   appendFallbackActions(actions, item); }
  function restoreAssistantGroups(panel) {
   panel.querySelectorAll('.mag-btn-group').forEach(group => {
    const origin = group._laosijiNativeOrigin;
    if (!origin?.parent?.isConnected) return;
    origin.parent.insertBefore(group, origin.next || null);
    delete group._laosijiNativeOrigin;
   }); }
  function createMeta(value, label) {
   const meta = document.createElement('span');
   meta.className = 'laosiji-native-magnet-meta'; meta.title = label; meta.dataset.label = label; meta.textContent = value || '—';
   return meta; }
  function renderRows(state) {
   const rows = state.panel.querySelector('.laosiji-native-magnet-rows'); const count = state.panel.querySelector('.laosiji-native-magnet-count');
   const source = state.panel.querySelector('.laosiji-native-magnet-source');
   const items = state.activeTab === 'aggregate' ? Magnet.sortData(state.aggregateItems, CFG.magnetSort) : state.nativeItems;
   restoreAssistantGroups(rows); rows.replaceChildren();
   count.textContent =`${items.length} 条`;
   source.textContent = state.activeTab === 'aggregate'
    ?`聚合：${MagnetEngines.labels()[state.engineKey] || state.engineKey}`                : '站内原始条目';
   if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'laosiji-native-magnet-empty'; empty.textContent = state.activeTab === 'aggregate' ? '没有搜索到可用磁力' : '站内暂时没有可用磁力';
    rows.appendChild(empty);
    return; }
   items.forEach((item, index) => {
    const row = document.createElement('article');
    row.className = 'laosiji-native-magnet-row';
    const rowIndex = document.createElement('span');
    rowIndex.className = 'laosiji-native-magnet-index'; rowIndex.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('div');
    name.className = 'laosiji-native-magnet-name';
    const titleLine = document.createElement('div');
    titleLine.className = 'laosiji-native-magnet-title-line';
    const title = document.createElement('a');
    title.href = item.maglink; title.target = '_self'; title.rel = ''; title.title = item.title;
    addText(title, item.title);
    const qualityTags = createTagGroup(item.qualityTags, true);
    if (qualityTags) titleLine.appendChild(qualityTags);
    titleLine.appendChild(title); appendAssistantTrigger(titleLine, item);
    const nativeTags = createTagGroup(item.nativeTags);
    if (nativeTags) titleLine.appendChild(nativeTags);
    name.appendChild(titleLine);
    const metadata = document.createElement('div');
    metadata.className = 'laosiji-native-magnet-metadata';
    metadata.append( createMeta(item.size, '大小'), createMeta(item.files, '文件'), createMeta(item.date, '日期') );
    const actions = document.createElement('div');
    actions.className = 'laosiji-native-magnet-actions';
    appendActions(actions, item); row.append(rowIndex, name, metadata, actions); rows.appendChild(row);
   }); }
  function syncTabControls(state) {
   const nativeButton = state.panel.querySelector('[data-native-magnet-tab="native"]');
   const aggregateButton = state.panel.querySelector('[data-native-magnet-tab="aggregate"]');
   const aggregateControls = state.panel.querySelector('.laosiji-native-magnet-controls'); const isAggregate = state.activeTab === 'aggregate';
   nativeButton?.setAttribute('aria-selected', String(!isAggregate)); aggregateButton?.setAttribute('aria-selected', String(isAggregate));
   aggregateControls.hidden = !isAggregate; }
  async function loadAggregate(state) {
   const rows = state.panel.querySelector('.laosiji-native-magnet-rows'); const select = state.panel.querySelector('[data-native-magnet-engine]');
   const refresh = state.panel.querySelector('.laosiji-native-magnet-refresh'); const empty = document.createElement('div');
   empty.className = 'laosiji-native-magnet-empty'; empty.textContent = '正在搜索聚合磁力…';
   rows.replaceChildren(empty);
   select.disabled = true; refresh.disabled = true;
   try {
    const engines = MagnetEngines.getAll(); const search = engines[state.engineKey] || Object.values(engines)[0];
    const keyword = MagnetApi.normalizeMagnetSearchKeyword(state.avid); const result = await search(keyword);
    state.aggregateItems = normalizeAggregateItems(result?.data || [], {
     titleAsMagnet: state.engineKey === CFG.javdbSearchUrl,
     nativeItems: state.nativeItems,
     keyword,
    });
    state.aggregateUrl = result?.url || '';
    renderRows(state);
   } catch (error) {
    errorLog('磁力聚合搜索出错:', error);
    empty.textContent = '聚合搜索失败，请刷新重试';
   } finally {
    select.disabled = false; refresh.disabled = false; } }
  function activateTab(state, tab) {
   state.activeTab = tab;
   syncTabControls(state);
   if (tab === 'aggregate') {
    if (state.aggregateItems === null) loadAggregate(state);
    else renderRows(state);
    return; }
   renderRows(state); }
  function createPanel(site, avid, nativeItems) {
   const panel = document.createElement('section');
   panel.className =`${PANEL_CLASS} laosiji-native-magnet-${site}`;
   panel.dataset.site = site;
   const state = {
    panel,
    site,
    avid,
    nativeItems,
    aggregateItems: null,
    aggregateUrl: '',
    engineKey: CFG.defaultEngine,
    activeTab: nativeItems.length ? CFG.nativeMagnetDefaultTab : 'aggregate', };
   const head = document.createElement('header');
   head.className = 'laosiji-native-magnet-head';
   const heading = document.createElement('div'); const title = document.createElement('span');
   title.className = 'laosiji-native-magnet-title'; title.textContent = '磁力资源';
   const count = document.createElement('span');
   count.className = 'laosiji-native-magnet-count';
   heading.append(title, count);
   const tabs = document.createElement('div');
   tabs.className = 'laosiji-native-magnet-tabs';
   if (nativeItems.length) {
    const nativeButton = createButton('站内磁力', 'laosiji-native-magnet-tab', () => activateTab(state, 'native'));
    nativeButton.dataset.nativeMagnetTab = 'native';
    tabs.appendChild(nativeButton); }
   const aggregateButton = createButton('聚合搜索', 'laosiji-native-magnet-tab', () => activateTab(state, 'aggregate'));
   aggregateButton.dataset.nativeMagnetTab = 'aggregate';
   tabs.appendChild(aggregateButton);
   const tabTools = document.createElement('div');
   tabTools.className = 'laosiji-native-magnet-tab-tools';
   tabTools.appendChild(tabs);
   if (nativeItems.length) {
    const defaultTabSelect = document.createElement('select');
    defaultTabSelect.className = 'laosiji-native-magnet-default-tab';
    defaultTabSelect.setAttribute('aria-label', '默认显示的磁力页签');
    defaultTabSelect.title = '设置以后进入详情页时默认显示的页签';
    defaultTabSelect.add(new Option('默认：站内磁力', 'native')); defaultTabSelect.add(new Option('默认：聚合搜索', 'aggregate'));
    defaultTabSelect.value = CFG.nativeMagnetDefaultTab;
    defaultTabSelect.addEventListener('change', () => {
     CFG.nativeMagnetDefaultTab = defaultTabSelect.value;
     activateTab(state, defaultTabSelect.value);
    });
    tabTools.appendChild(defaultTabSelect); }
   head.append(heading, tabTools);
   const controls = document.createElement('div');
   controls.className = 'laosiji-native-magnet-controls';
   const engineSelect = document.createElement('select');
   engineSelect.className = 'laosiji-native-magnet-select'; engineSelect.dataset.nativeMagnetEngine = '1';
   engineSelect.setAttribute('aria-label', '磁力引擎');
   const engines = MagnetEngines.getAll(); const labels = MagnetEngines.labels();
   Object.keys(engines).forEach(key => { engineSelect.add(new Option(labels[key] || key, key, false, key === state.engineKey)); });
   engineSelect.addEventListener('change', () => { state.engineKey = engineSelect.value; state.aggregateItems = null; loadAggregate(state); });
   const sortSelect = document.createElement('select');
   sortSelect.className = 'laosiji-native-magnet-select';
   sortSelect.setAttribute('aria-label', '聚合结果排序');
   [['size', '大小优先'], ['newest', '最新收录'], ['oldest', '最早收录']] .forEach(([value, label]) => sortSelect.add(new Option(label, value)));
   sortSelect.value = CFG.magnetSort;
   sortSelect.addEventListener('change', () => {
    CFG.magnetSort = sortSelect.value;
    if (state.aggregateItems) renderRows(state);
   });
   const refresh = createButton('刷新', 'laosiji-native-magnet-refresh', () => {
    if (state.activeTab === 'aggregate') {
     state.aggregateItems = null;
     loadAggregate(state);
    } else { renderRows(state); }
   });
   controls.append(engineSelect, sortSelect, refresh);
   const rows = document.createElement('div');
   rows.className = 'laosiji-native-magnet-rows';
   const foot = document.createElement('footer');
   foot.className = 'laosiji-native-magnet-foot';
   const source = document.createElement('span');
   source.className = 'laosiji-native-magnet-source';
   const hint = document.createElement('span');
   hint.textContent = nativeItems.length ? '聚合结果不会覆盖站内磁力' : '聚合搜索沿用已配置的磁力引擎';
   foot.append(source, hint); panel.append(head, controls, rows, foot);
   panel._laosijiNativeMagnetState = state;
   let assistantSyncPending = false;
   const assistantObserver = new MutationObserver(() => {
    if (assistantSyncPending) return;
    assistantSyncPending = true;
    queueMicrotask(() => {
     assistantSyncPending = false;
     syncAssistantGroups(panel);
    });
   });
   assistantObserver.observe(panel, { childList: true, subtree: true });
   panel._laosijiNativeAssistantObserver = assistantObserver;
   activateTab(state, state.activeTab);
   return panel; }
  function hideNativeSource(source) {
   source.dataset.laosijiNativeDisplay = source.style.display || ''; source.dataset.laosijiNativeHidden = '1'; source.style.display = 'none'; }
  function restoreNativeSource(source) {
   if (source.dataset.laosijiNativeHidden !== '1') return;
   source.style.display = source.dataset.laosijiNativeDisplay || '';
   delete source.dataset.laosijiNativeDisplay; delete source.dataset.laosijiNativeHidden; }
  function hideNativeParent(parent) {
   if (!parent || parent.dataset.laosijiNativeParentHidden === '1') return;
   parent.dataset.laosijiNativeParentDisplay = parent.style.display || ''; parent.dataset.laosijiNativeParentHidden = '1'; parent.style.display = 'none'; }
  function restoreNativeParent(parent) {
   if (parent.dataset.laosijiNativeParentHidden !== '1') return;
   parent.style.display = parent.dataset.laosijiNativeParentDisplay || '';
   delete parent.dataset.laosijiNativeParentDisplay; delete parent.dataset.laosijiNativeParentHidden; }
  function remove(site) {
   if (site) {
    mountObservers.get(site)?.disconnect(); mountObservers.delete(site);
   } else {
    mountObservers.forEach(observer => observer.disconnect()); mountObservers.clear(); }
   document.querySelectorAll(`.${PANEL_CLASS}${site ? `[data-site="${site}"]` : ''}`).forEach(panel => {
    panel._laosijiNativeAssistantObserver?.disconnect(); restoreAssistantGroups(panel); panel.remove();
   });
   document.querySelectorAll('[data-laosiji-native-hidden="1"]').forEach(restoreNativeSource);
   document.querySelectorAll('[data-laosiji-native-parent-hidden="1"]').forEach(restoreNativeParent);
   document.querySelectorAll('.laosiji-native-magnet-divider').forEach(divider => divider.remove()); }
  function mount(site, avid) {
   if (MobilePolicy.effectiveMagnetDisplayMode() !== 'native-replace') return false;
   if (document.querySelector(`.${PANEL_CLASS}[data-site="${site}"]`)) return true;
   if (site === 'javlib') {
    const reviews = document.querySelector('#video_reviews');
    if (!reviews) return false;
    const panel = createPanel(site, avid, []); const divider = document.createElement('hr');
    divider.className = 'grey laosiji-native-magnet-divider';
    reviews.insertAdjacentElement('beforebegin', panel); panel.insertAdjacentElement('afterend', divider);
    return true; }
   const source = site === 'javbus' ? document.querySelector('#magnet-table') : document.querySelector('#magnets-content');
   if (!source) return false;
   const nativeItems = buildNativeItems(site, source);
   if (!nativeItems.length) return false;
   const panel = createPanel(site, avid, nativeItems);
   const nativeParent = site === 'javbus' ? source.closest('.movie') : source.closest('article.message.video-panel');
   if (nativeParent?.parentNode) nativeParent.insertAdjacentElement('afterend', panel);
   else source.insertAdjacentElement('afterend', panel);
   hideNativeSource(source);
   if (site === 'javbus' || site === 'javdb') hideNativeParent(nativeParent);
   return true; }
  function scheduleMount(site, avid) {
   mountObservers.get(site)?.disconnect(); mountObservers.delete(site);
   const tryMount = () => {
    if (MobilePolicy.effectiveMagnetDisplayMode() !== 'native-replace' || mount(site, avid)) {
     mountObservers.get(site)?.disconnect(); mountObservers.delete(site);
     return true; }
    return false; };
   if (tryMount()) return;
   if (typeof MutationObserver === 'undefined' || !document.documentElement) {
    [300, 800, 1600, 3000, 6000, 10000].forEach(delay => setTimeout(tryMount, delay)); return; }
   let pending = false;
   const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
     pending = false;
     tryMount();
    });
   });
   mountObservers.set(site, observer);
   observer.observe(document.documentElement, { childList: true, subtree: true }); }
  function createAggregatePanel(avid) { const panel = createPanel('list', avid, []); panel.dataset.laosijiListPopup = '1'; return panel; }
  return { mount, scheduleMount, remove, createAggregatePanel };
 })();
 Core.expose('__LAOSIJI_NATIVE_MAGNET_PANEL__', NativeMagnetPanel);
 function openJavdbApiLoginDialog(nextUrl = '') {
  if (!document.body) { setTimeout(() => openJavdbApiLoginDialog(nextUrl), 50); return; }
  addJavdbApiLoginStyles(); document.querySelector('#javdb-api-login-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'javdb-api-login-overlay';
  overlay.innerHTML =`<div class="javdb-api-login-panel"><div class="javdb-api-login-title">登录 JavDB</div><input class="javdb-api-login-input" id="javdb-api-login-account" type="text" autocomplete="username" placeholder="用户名 / 邮箱"><input class="javdb-api-login-input" id="javdb-api-login-password" type="password" autocomplete="current-password" placeholder="密码"><div class="javdb-api-login-actions"><button class="javdb-api-login-cancel" type="button">取消</button><button class="javdb-api-login-submit" type="button">登录</button></div></div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove(); const submit = overlay.querySelector('.javdb-api-login-submit');
  const accountInput = overlay.querySelector('#javdb-api-login-account'); const passwordInput = overlay.querySelector('#javdb-api-login-password');
  overlay.addEventListener('click', event => {
   if (event.target === overlay || event.target.closest('.javdb-api-login-cancel')) close();
  });
  overlay.addEventListener('keydown', event => {
   if (event.key === 'Escape') close();
   if (event.key === 'Enter') submit.click();
  });
  submit.addEventListener('click', async () => {
   const account = accountInput.value.trim(); const password = passwordInput.value;
   if (!account || !password) { notify('JavDB App API', '请输入用户名和密码'); return; }
   submit.disabled = true; submit.textContent = '登录中...';
   try {
    await Magnet.javdbApi.login(account, password); notify('JavDB App API', '登录成功，已保存授权'); close();
    if (nextUrl) location.href = nextUrl;
    else if (location.hostname.includes('javdb') && /rankings|advanced_search/.test(location.pathname + location.search)) location.reload();
   } catch (err) { notify('JavDB App API', err?.message || '登录失败'); submit.disabled = false; submit.textContent = '登录'; }
  });
  setTimeout(() => accountInput.focus(), 0); }
 function renderJavdbApiLoginRequired(status, message = 'Top250 需要登录 JavDB API。可使用 JavDB 账号密码登录一次，脚本会在本地保存授权。', nextUrl = location.href) {
  addJavdbApiLoginStyles();
  if (!status) { scheduleJavdbApiLoginDialog(nextUrl); return; }
  status.classList.add('is-error');
  status.innerHTML =`<span>${message}</span><button class="javdb-api-login-inline" type="button">登录 JavDB</button>`;
  status.querySelector('.javdb-api-login-inline')?.addEventListener('click', () => openJavdbApiLoginDialog(nextUrl)); }
 function scheduleJavdbApiLoginDialog(nextUrl = location.href) {
  if (document.documentElement.dataset.laosijiJavdbApiLoginPrompted === '1') return;
  document.documentElement.dataset.laosijiJavdbApiLoginPrompted = '1';
  setTimeout(() => {
   if (!Magnet.javdbApi.token() && !document.querySelector('#javdb-api-login-overlay')) { openJavdbApiLoginDialog(nextUrl); }
  }, 0); }
 function isJavdbApiAuthError(err) {
  const text = String(err?.message || err || '');
  return /JWT|token|authorization|unauthorized|login required|請登錄|請登入|请登录|请登入|登錄帳號|登录账号|未登錄|未登录/i.test(text); }
 const SiteJavBus = {
  match() { return location.hostname.includes('javbus'); },
  isActorIndexPage(url = location.href) {
   try {
    const path = new URL(url, location.href).pathname.replace(/\/+$/, '');
    return /^\/(?:[a-z]{2}\/)?(?:uncensored\/)?actresses(?:\/\d+)?$/i.test(path);
   } catch (err) { return false; } },
  getVid() {
   const kw = document.querySelector('meta[name="keywords"]')?.content || '';
   return normalizeAvid(kw.split(',')[0].trim()); },
  isDetailPage() {
   return (
    !!document.querySelector('.row.movie') && !document.querySelector('#waterfall div.item')
   ); },
  initPage(avid) {
   document.querySelector('.ad-box')?.remove(); this._insert123AvFc2NavLink(); this._insert123AvFc2MobileLink();
   setTimeout(() => this._insert123AvFc2NavLink(), 500); setTimeout(() => this._insert123AvFc2MobileLink(), 500); this._insertTopSettingsButton();
   setTimeout(() => this._insertTopSettingsButton(), 500);
   if (Javdb123AvFc2.init()) return;
   if (this.isActorIndexPage()) return;
   if (document.querySelector('#waterfall div.item')) { this._initListPage(); return; }
   const detailDefaults = DetailFlex.defaultCss('javbus');
   GM_addStyle(`.container{max-width:100%!important;width:100%!important;padding-left:20px!important;padding-right:20px!important}.row.movie{display:flex!important;gap:20px!important;align-items:flex-start!important;flex-wrap:nowrap!important;margin:0!important}.row.movie{--javbus-cover-flex:${detailDefaults.cover};--javbus-info-flex:${detailDefaults.info};--javbus-magnet-flex:${detailDefaults.magnet}}.col-md-9.screencap{flex:var(--javbus-cover-flex) 1 0!important;min-width:0!important;width:auto!important;float:none!important;padding:0!important}.col-md-3.info{flex:var(--javbus-info-flex) 1 0!important;min-width:0!important;width:auto!important;float:none!important;overflow:hidden!important;word-break:break-word!important}.jav-nong-slot{flex:var(--javbus-magnet-flex) 1 0!important;min-width:0!important;align-self:flex-start!important;overflow:hidden!important}.jav-nong-wrapper{width:560px;max-width:100%}.screencap img{width:100%;max-width:100%}.footer{padding:20px 0}`);
   this._insertMagnet(avid); this._replaceRecommendWithJavdbReviews(avid); setTimeout(() => this._replaceRecommendWithJavdbReviews(avid), 900);
   this._scheduleNativeMagnetAssistantFix(); },
  _insert123AvFc2NavLink() {
   const navbar = document.querySelector('#navbar');
   if (!navbar) return;
   const navLists = [...navbar.querySelectorAll('ul.nav.navbar-nav')].filter(ul => {
    return !ul.classList.contains('navbar-right') && !ul.classList.contains('javbus-top-settings-nav');
   });
   navLists.forEach(navList => {
    const uncensoredLink = [...navList.querySelectorAll(':scope > li > a[href]')].find(link => {
     try {
      return /\/uncensored\/?$/i.test(new URL(link.href, location.href).pathname);
     } catch { return false; }
    });
    const parent = uncensoredLink?.parentElement;
    if (!parent || parent.parentElement !== navList) return;
    const existingItems = [...navList.querySelectorAll(':scope > li.javbus-123av-fc2-nav')];
    existingItems.slice(1).forEach(item => item.remove());
    const existingItem = existingItems[0];
    if (existingItem) {
     if (existingItem.previousElementSibling !== parent) parent.insertAdjacentElement('afterend', existingItem);
     return; }
    const item = document.createElement('li');
    item.className = 'javbus-123av-fc2-nav';
    item.innerHTML =`<a href="/?laosiji_123av_fc2=1" title="打开 123AV-FC2"><span>123AV-FC2</span></a>`;
    parent.insertAdjacentElement('afterend', item);
   }); },
  _insert123AvFc2MobileLink() {
   document.querySelectorAll('.overlay.overlay-contentscale').forEach(overlay => {
    if (overlay.querySelector('.javbus-123av-fc2-mobile')) return;
    const forumLink = [...overlay.querySelectorAll('a[href]')].find(link => {
     try {
      return /\/forum\/?$/i.test(new URL(link.href, location.href).pathname) || /论坛/.test(link.textContent || '');
     } catch { return /论坛/.test(link.textContent || ''); }
    });
    const anchor = forumLink?.closest('.col-xs-6') || overlay.querySelector('.overlay-close');
    if (!anchor) return;
    const item = document.createElement('div');
    item.className = 'col-xs-6 text-center javbus-123av-fc2-mobile'; item.innerHTML = '<a href="/?laosiji_123av_fc2=1" title="打开 123AV-FC2">123AV-FC2</a>';
    anchor.insertAdjacentElement(forumLink ? 'afterend' : 'beforebegin', item);
   }); },
  _insertTopSettingsButton() {
   const navbar = document.querySelector('#navbar');
   if (!navbar || navbar.querySelector('.javbus-top-settings-nav')) return;
   const magnetNav = [...navbar.querySelectorAll(':scope > ul.nav.navbar-nav.navbar-right')].find(ul => {
    return ul.querySelector('.glyphicon-magnet') || /\u5df2\u6709\u78c1\u529b/.test(ul.textContent || '');
   });
   const settingsNav = document.createElement('ul');
   settingsNav.className = 'nav navbar-nav navbar-right javbus-top-settings-nav';
   settingsNav.innerHTML =`<li><a href="javascript:void(0)" class="javbus-top-settings-btn" title="\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e"><span class="glyphicon glyphicon-cog" style="font-size:12px;"></span><span class="hidden-md hidden-sm">\u8001\u53f8\u673a\u8bbe\u7f6e</span></a></li>`;
   settingsNav.querySelector('.javbus-top-settings-btn')?.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation(); QuickSettingsPanel.open(e.currentTarget);
   });
   if (magnetNav) {
    magnetNav.insertAdjacentElement('afterend', settingsNav);
   } else { navbar.appendChild(settingsNav); }
   injectStyle('javbus-top-settings-style',`#navbar .javbus-top-settings-btn{color:#2563eb!important;font-weight:700!important}#navbar .javbus-top-settings-btn:hover{color:#1d4ed8!important;background:rgba(37,99,235,.08)!important}`);
  },
  _insertMagnet(avid) {
   if (MobilePolicy.effectiveMagnetDisplayMode() === 'native-replace') {
    document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove()); NativeMagnetPanel.scheduleMount('javbus', avid);
    return; }
   NativeMagnetPanel.remove('javbus');
   if (!MobilePolicy.usesDesktopMagnetTable()) return;
   const infoCol = document.querySelector("div[class='col-md-3 info']");
   if (!infoCol) return;
   document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove());
   const widget = Magnet.createMagnetWidget(avid); const slot = document.createElement('div');
   slot.className = 'jav-nong-slot'; slot.style.overflow = 'hidden';
   slot.appendChild(widget); infoCol.after(slot); },
  _scheduleNativeMagnetAssistantFix() {
   this._dedupeNativeMagnetAssistantButtons();
   [300, 900, 1800, 3500, 6500].forEach(delay => { setTimeout(() => this._dedupeNativeMagnetAssistantButtons(), delay); }); },
  _dedupeNativeMagnetAssistantButtons() {
   const table = document.querySelector('#magnet-table');
   if (!table) return;
   [...table.querySelectorAll('tr')].forEach(row => {
    const cells = [...row.querySelectorAll(':scope > td')];
    if (cells.length < 3 || !row.querySelector('a[href^="magnet:"]')) return;
    this._dedupeNativeMagnetAssistantRow(row, cells);
   }); },
  _dedupeNativeMagnetAssistantRow(row, cells) {
   const groups = [...row.querySelectorAll('.mag-btn-group')];
   if (groups.length < 2) return;
   const nameCell = cells.find(cell => cell.querySelector('a[href^="magnet:"]')) || cells[0];
   const keepGroup = groups.find(group => group.closest('td') === nameCell) || groups[0];
   groups.forEach(group => {
    if (group !== keepGroup) group.remove();
   }); }, };
 const JavbusReviews = {
  _ensureJavdbReviewsStyle() {
   JavdbReviews.ensureStyle();
   injectStyle('javbus-javdb-reviews-style',`.javbus-javdb-reviews{margin:18px 0 24px!important;border:1px solid #e5e7eb!important;border-radius:6px!important;background:#fff!important;overflow:hidden!important;box-shadow:0 1px 2px rgba(15,23,42,.04)!important}.javbus-javdb-reviews-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:10px 12px!important;border-bottom:1px solid #e5e7eb!important;background:#f8fafc!important;color:#1f2937!important;font-size:15px!important;font-weight:800!important}.javbus-javdb-reviews-toggle{display:inline-flex!important;align-items:center!important;gap:8px!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important;font:inherit!important;cursor:pointer!important}.javbus-javdb-reviews-toggle::before{content:"▸";color:#64748b;font-size:13px;transition:transform .16s ease}.javbus-javdb-reviews.is-expanded .javbus-javdb-reviews-toggle::before{transform:rotate(90deg)}.javbus-javdb-reviews-head a{color:#2563eb!important;font-size:12px!important;font-weight:800!important;text-decoration:none!important}.javbus-javdb-reviews-actions{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 auto!important}.javbus-javdb-reviews-badge{display:inline-flex!important;align-items:center!important;height:20px!important;margin-left:8px!important;padding:0 7px!important;border:1px solid #bfdbfe!important;border-radius:999px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:11px!important;line-height:1!important;vertical-align:middle!important}.javbus-javdb-reviews-body .message,.javbus-javdb-reviews-body .message-body{margin:0!important;border:0!important;background:transparent!important;padding:0!important}.javbus-javdb-reviews-body[hidden]{display:none!important}.javbus-javdb-reviews-footer{padding:10px 0 12px!important;background:#fff!important}.javbus-javdb-reviews-collapse-bar{padding:10px 12px 0!important;margin-bottom:0!important}`);
  },
  _findRecommendHeading() {
   return [...document.querySelectorAll('h4')].find(h4 => {
    const text = (h4.textContent || '').trim();
    if (!/推薦|推荐/.test(text)) return false;
    return (
     h4.querySelector('#urad2') || /bootstr\s*\(\s*1\s*\)/i.test(h4.innerHTML || '') || /^推薦|^推荐/.test(text)
    );
   }); },
  _findMagnetSubmitHeading() {
   const direct = document.querySelector('#mag-submit-show');
   if (direct) return direct;
   return [...document.querySelectorAll('h4')].find(h4 => /磁力(?:連結|链接)投稿/.test(h4.textContent || '')); },
  _placeJavbusReviewsPanel(panel) {
   const magnetSubmit = this._findMagnetSubmitHeading();
   const stillsShell = document.querySelector('.jav-stills-javbus[data-laosiji-stills="1"], .jav-stills-javbus');
   const anchor = stillsShell?.parentNode ? stillsShell.nextSibling : magnetSubmit; const parent = stillsShell?.parentNode || magnetSubmit?.parentNode;
   if (!panel || !parent) return false;
   if (stillsShell?.parentNode) {
    if (stillsShell.nextElementSibling !== panel) { parent.insertBefore(panel, anchor); }
   } else if (panel.nextElementSibling !== magnetSubmit) {
    parent.insertBefore(panel, magnetSubmit); }
   return true; },
  _removeRecommendBlock() {
   const heading = this._findRecommendHeading()
    || [...document.querySelectorAll('h4')].find(h4 => /^(?:\u63a8\u85a6|\u63a8\u8350)/.test((h4.textContent || '').trim()));
   if (!heading) return;
   const next = heading.nextElementSibling;
   heading.remove();
   if (this._isRecommendContainer(next)) next.remove();
  },
  _isRecommendContainer(node) {
   if (!node || node.nodeType !== 1) return false;
   const mark =`${node.id || ''} ${node.className || ''}`;
   if (/sample/i.test(mark)) return false;
   return (
    /waterfall|recommend|related|masonry/i.test(mark) || !!node.querySelector?.('.movie-box, .item, .masonry-brick')
   ); },
  _replaceRecommendWithJavdbReviews(avid) {
   if (!avid) return;
   const existing = document.querySelector('.javbus-javdb-reviews');
   if (existing) {
    this._bindJavbusReviewLoadMore(existing); this._placeJavbusReviewsPanel(existing); this._removeRecommendBlock();
    return; }
   const heading = this._findRecommendHeading();
   if (!heading && !this._findMagnetSubmitHeading()) return;
   this._ensureJavdbReviewsStyle();
   const panel = document.createElement('section');
   panel.className = 'javbus-javdb-reviews'; panel.dataset.avid = avid;
   panel.innerHTML =`<div class="javbus-javdb-reviews-head"><button type="button" class="javbus-javdb-reviews-toggle" aria-expanded="false">JavDB 短评<span class="javbus-javdb-reviews-badge" title="此区块已由 JAV 老司机脚本替换">老司机</span></button><div class="javbus-javdb-reviews-actions"> ${JavdbReviews.renderDefaultToggle()} <a class="javbus-javdb-reviews-link" href="https://javdb.com/search?q= ${encodeURIComponent(avid)} " target="_blank" rel="noopener noreferrer">JavDB</a></div></div><div class="javbus-javdb-reviews-body" hidden><div class="javdb-api-tab-loading">正在读取短评...</div></div>`;
   if (this._placeJavbusReviewsPanel(panel)) {
    this._removeRecommendBlock();
   } else {
    const next = heading.nextElementSibling;
    heading.replaceWith(panel);
    if (this._isRecommendContainer(next)) next.remove();
   }
   this._bindJavbusReviewLoadMore(panel); this._applyJavbusReviewsDefault(panel); },
  _renderJavbusReviewFooter(hasMore, shownCount) {
   return`<div class="javdb-api-tab-footer javbus-javdb-reviews-footer"> ${hasMore
                                ? `<button type="button" class="javdb-api-tab-load-more javbus-javdb-reviews-load-more" data-shown-count="${shownCount}" data-load-limit="${JAVDB_REVIEW_MORE_LIMIT}">加载更多短评</button>`
                                : `<div class="javdb-api-tab-end">已加载全部短评</div>`} </div>`;
  },
  _renderJavbusReviewCollapseBar() {
   return '<div class="javdb-api-review-collapse-bar javbus-javdb-reviews-collapse-bar"><button type="button" class="javdb-api-review-collapse javbus-javdb-reviews-collapse" data-javbus-reviews-collapse="1">收起短评</button></div>';
  },
  _renderJavbusReviews(reviews, offset = 0, hasMore = false) {
   const list = Array.isArray(reviews) ? reviews.slice(0, JAVDB_REVIEW_MORE_LIMIT) : [];
   const items = list.length ? JavdbReviews.renderItems(list, offset, JAVDB_REVIEW_MORE_LIMIT) : '<div class="javdb-api-tab-empty">暂无短评</div>';
   return`<article class="message video-panel"><div class="message-body"> ${this._renderJavbusReviewCollapseBar()} <div class="javdb-api-tab-items"> ${items} </div> ${this._renderJavbusReviewFooter(hasMore, offset + list.length)} </div></article>`;
  },
  _setJavbusReviewsExpanded(panel, expanded) {
   if (!panel) return;
   const body = panel.querySelector('.javbus-javdb-reviews-body'); const toggle = panel.querySelector('.javbus-javdb-reviews-toggle');
   panel.classList.toggle('is-expanded', !!expanded);
   if (body) body.hidden = !expanded;
   toggle?.setAttribute('aria-expanded', expanded ? 'true' : 'false'); },
  _applyJavbusReviewsDefault(panel) {
   JavdbReviews.syncDefaultToggles(panel);
   if (!panel || !CFG.reviewsDefaultExpanded) return;
   this._setJavbusReviewsExpanded(panel, true);
   if (panel.dataset.reviewsLoaded !== '1') { this._loadJavdbReviewsForJavbus(panel.dataset.avid || '', panel); }
  },
  _bindJavbusReviewLoadMore(panel) {
   if (!panel || panel.dataset.reviewsLoadMoreBound === '1') return;
   panel.dataset.reviewsLoadMoreBound = '1';
   panel.addEventListener('change', e => {
    const input = e.target?.closest?.('[data-laosiji-review-default-expanded]');
    if (input && panel.contains(input)) { CFG.reviewsDefaultExpanded = input.checked; JavdbReviews.syncDefaultToggles(document); return; }
    const sizeSelect = e.target?.closest?.('[data-laosiji-review-font-size]');
    if (sizeSelect && panel.contains(sizeSelect)) { CFG.reviewFontSize = sizeSelect.value; JavdbReviews.syncDefaultToggles(document); }
   }, true);
   panel.addEventListener('click', e => {
    const toggle = e.target?.closest?.('.javbus-javdb-reviews-toggle');
    if (toggle && panel.contains(toggle)) {
     e.preventDefault(); e.stopPropagation();
     e.stopImmediatePropagation?.();
     const expanded = panel.classList.toggle('is-expanded');
     this._setJavbusReviewsExpanded(panel, expanded);
     if (expanded && panel.dataset.reviewsLoaded !== '1') { this._loadJavdbReviewsForJavbus(panel.dataset.avid || '', panel); }
     return; }
    const collapse = e.target?.closest?.('[data-javbus-reviews-collapse]');
    if (collapse && panel.contains(collapse)) {
     e.preventDefault(); e.stopPropagation();
     e.stopImmediatePropagation?.();
     this._setJavbusReviewsExpanded(panel, false);
     return; }
    const btn = e.target?.closest?.('.javbus-javdb-reviews-load-more');
    if (!btn || !panel.contains(btn)) return;
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.();
    this._loadMoreJavdbReviewsForJavbus(panel, btn);
   }, true); },
  async _loadJavdbReviewsForJavbus(avid, panel) {
   const body = panel?.querySelector('.javbus-javdb-reviews-body');
   if (!body) return;
   panel.dataset.reviewsLoaded = '1';
   try {
    const movie = await Magnet.javdbApi.searchMovieByNumber(avid, { limit: 5 });
    if (!movie?.id) {
     body.innerHTML =`<div class="javdb-api-tab-empty">JavDB 未找到 ${JavdbReviews.escapeHtml(avid)} 的短评</div>`;
     return; }
    const link = panel.querySelector('.javbus-javdb-reviews-link');
    if (link) link.href =`https://javdb.com/v/${encodeURIComponent(movie.id)}`;
    panel.dataset.movieId = movie.id;
    const json = await Magnet.javdbApi.movieReviews(movie.id, { page: 1, limit: JAVDB_REVIEW_INITIAL_LIMIT + 1 });
    const allReviews = Array.isArray(json?.data?.reviews) ? json.data.reviews : []; const reviews = allReviews.slice(0, JAVDB_REVIEW_INITIAL_LIMIT);
    body.innerHTML = reviews.length ? this._renderJavbusReviews(reviews, 0, allReviews.length > JAVDB_REVIEW_INITIAL_LIMIT)
     : '<div class="javdb-api-tab-empty">暂无短评</div>';
   } catch (err) {
    errorLog('JavBus JavDB 短评读取失败:', err);
    body.innerHTML =`<div class="javdb-api-tab-error"> ${JavdbReviews.escapeHtml(err.message || '短评读取失败')} </div>`;
   } },
  async _loadMoreJavdbReviewsForJavbus(panel, btn) {
   const movieId = panel?.dataset?.movieId || ''; const body = panel?.querySelector('.javbus-javdb-reviews-body');
   if (!movieId || !body || !btn) return;
   const shown = body.querySelectorAll('.javdb-api-review').length; const take = Math.max(1, parseInt(btn.dataset.loadLimit, 10) || JAVDB_REVIEW_MORE_LIMIT);
   const oldText = btn.textContent;
   btn.textContent = '加载中...'; btn.disabled = true;
   try {
    const json = await Magnet.javdbApi.movieReviews(movieId, { page: 1, limit: shown + take + 1 });
    const allReviews = Array.isArray(json?.data?.reviews) ? json.data.reviews : []; const nextReviews = allReviews.slice(shown, shown + take);
    const items = body.querySelector('.javdb-api-tab-items'); const footer = body.querySelector('.javbus-javdb-reviews-footer');
    if (!nextReviews.length) {
     if (footer) footer.outerHTML = this._renderJavbusReviewFooter(false, shown);
     return; }
    items?.insertAdjacentHTML('beforeend', JavdbReviews.renderItems(nextReviews, shown, take));
    const nextShown = shown + nextReviews.length; const hasMore = allReviews.length > nextShown;
    if (footer) footer.outerHTML = this._renderJavbusReviewFooter(hasMore, nextShown);
   } catch (err) {
    errorLog('JavBus JavDB 更多短评读取失败:', err);
    btn.textContent = '加载失败，点击重试'; btn.disabled = false;
    return; }
   btn.textContent = oldText; btn.disabled = false; }, };
 Object.assign(SiteJavBus, JavbusReviews);
 const JavbusList = {
  _destroyMasonry(container) {
   try {
    const jq = window.jQuery || window.$;
    if (jq && jq(container).masonry) { jq(container).masonry('destroy'); }
   } catch (err) {  } },
  _swapCover(img) {
   const src = img.getAttribute('src') || '';
   if (!/\/(imgs|pics)\/(thumb|thumbs)\//i.test(src)) return;
   if (img.dataset.laosijiCoverSwapped === '1') return;
   let full = src.replace(/\/(imgs|pics)\/(thumb|thumbs)\//i, '/$1/cover/');
   if (!/nopic\.jpg/i.test(src)) { full = full.replace(/(\.jpg|\.jpeg|\.png)(?:([?#].*)?)$/i, '_b$1$2'); }
   if (full === src) return;
   img.dataset.laosijiCoverSwapped = '1'; img.dataset.laosijiThumbSrc = src; img.dataset.laosijiCoverSrc = full;
   img.addEventListener('error', function onErr() {
    img.removeEventListener('error', onErr);
    if (img.dataset.laosijiThumbSrc) img.src = img.dataset.laosijiThumbSrc;
   });
   img.src = full;
   img.setAttribute('src', full); },
  _decorateCard(item) {
   if (!item) return;
   if (item.dataset.laosijiGridCard === '1') { ListPreview.attach(item); return; }
   item.dataset.laosijiGridCard = '1';
   item.classList.add('jav-card', 'javbus-grid-card'); item.style.removeProperty('position'); item.style.removeProperty('top');
   item.style.removeProperty('left'); item.style.removeProperty('width');
   const anchor = item.querySelector(':scope > a.movie-box[href]') || item.querySelector('a.movie-box[href]');
   anchor?.classList.add('jav-card-link', 'javbus-card-link');
   const frame = item.querySelector('.photo-frame');
   frame?.classList.add('jav-card-cover', 'javbus-cover-frame');
   const img = frame?.querySelector('img[src]') || item.querySelector('img[src]');
   if (img) {
    img.removeAttribute('width'); img.removeAttribute('height'); img.classList.add('jav-card-image', 'javbus-card-image'); this._swapCover(img); }
   const info = item.querySelector('.photo-info');
   info?.classList.add('jav-card-title', 'javbus-card-title');
   const infoBody = info?.querySelector(':scope > span') || info;
   if (infoBody && !infoBody.querySelector(':scope > .video-title')) {
    const nodes = Array.from(infoBody.childNodes); const titleNodes = [];
    for (const node of nodes) {
     if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node;
      if (el.matches('br, .item-tag, date, .jav-pan115-badge')) break;
      titleNodes.push(node);
      continue; }
     if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim() || titleNodes.length) titleNodes.push(node);
     } }
    if (titleNodes.some(node => (node.textContent || '').trim())) {
     const headline = document.createElement('span');
     headline.className = 'video-title javbus-card-headline';
     infoBody.insertBefore(headline, titleNodes[0]); titleNodes.forEach(node => headline.appendChild(node));
     while (headline.nextSibling?.nodeType === Node.TEXT_NODE && !headline.nextSibling.textContent.trim()) { headline.nextSibling.remove(); }
     if (headline.nextSibling?.nodeType === Node.ELEMENT_NODE && headline.nextSibling.matches('br')) { headline.nextSibling.remove(); }
    } }
   const firstDate = info?.querySelector('date');
   if (firstDate && firstDate.dataset.laosijiCode !== '1') { firstDate.dataset.laosijiCode = '1'; firstDate.classList.add('javbus-card-code'); }
   ListPreview.attach(item); },
  _flattenWaterfall() {
   document.querySelectorAll('[id="waterfall"]').forEach(wf => {
    wf.querySelectorAll(':scope > #waterfall, :scope > .masonry').forEach(nested => {
     while (nested.firstChild) wf.insertBefore(nested.firstChild, nested);
     nested.remove();
    });
    wf.classList.remove('masonry'); wf.style.setProperty('position', 'static', 'important'); wf.style.setProperty('height', 'auto', 'important');
    wf.style.setProperty('width', 'auto', 'important');
    wf.querySelectorAll(':scope > .item').forEach(item => {
     item.style.removeProperty('position'); item.style.removeProperty('top'); item.style.removeProperty('left'); item.style.removeProperty('width');
    });
   }); },
  _getGridContainer() {
   return (
    document.querySelector('#waterfall.jav-card-grid') || document.querySelector('#waterfall')
   ); },
  _listPageNo(url = location.href) {
   try {
    const path = new URL(url, location.href).pathname.replace(/\/+$/, ''); let m = path.match(/\/page\/(\d+)$/i);
    if (m) return parseInt(m[1], 10) || 1;
    m = path.match(/\/(\d+)$/);
    if (m) return parseInt(m[1], 10) || 1;
    return 1;
   } catch (e) { return 1; } },
  _resolveListNext(doc, baseUrl) {
   const result = { nextUrl: '', maxPage: 0, curPage: this._listPageNo(baseUrl) };
   try {
    const nav = doc.querySelector('.pagination') || doc; const links = [...nav.querySelectorAll('li > a[href], a[href]')]; const pageMap = new Map();
    links.forEach(a => {
     const href = a.getAttribute('href') || '';
     if (!href || /^(?:#|javascript:)/i.test(href)) return;
     const n = this._listPageNo(href);
     if (/\/(?:page\/)?\d+$/i.test(href.replace(/\/+$/, '')) && n > 0) {
      if (!pageMap.has(n)) pageMap.set(n, new URL(href, baseUrl).href);
      if (n > result.maxPage) result.maxPage = n;
     }
    });
    const want = result.curPage + 1;
    if (pageMap.has(want)) {
     result.nextUrl = pageMap.get(want);
    } else if (want <= result.maxPage) {
     result.nextUrl = this._buildListPageUrl(baseUrl, want); }
   } catch (e) {}
   return result; },
  _buildListPageUrl(baseUrl, page) {
   try {
    const u = new URL(baseUrl, location.href); let path = u.pathname.replace(/\/+$/, '');
    if (/\/page\/\d+$/i.test(path)) {
     path = path.replace(/\/page\/\d+$/i, page <= 1 ? '' :`/page/${page}`);
    } else if (/\/\d+$/.test(path)) {
     path = path.replace(/\/\d+$/, page <= 1 ? '' :`/${page}`);
    } else {
     path = path === ''
      ? (page <= 1 ? '' :`/page/${page}`)
      : (page <= 1 ? path :`${path}/${page}`);
    }
    u.pathname = path || '/';
    return u.href;
   } catch (e) { return ''; } },
  _initListPage() {
   this._flattenWaterfall();
   const container = this._getGridContainer();
   if (!container) return;
   this._destroyMasonry(container); container.classList.remove('masonry'); container.style.setProperty('position', 'static', 'important');
   container.style.setProperty('height', 'auto', 'important'); container.style.setProperty('width', 'auto', 'important');
   const needStyle = container.dataset.laosijiGrid !== '1';
   if (needStyle) { container.dataset.laosijiGrid = '1'; container.classList.add('jav-card-grid', 'javbus-card-grid'); }
   CardColumns.apply('javbus'); container.querySelectorAll(':scope > .item').forEach(item => this._decorateCard(item));
   if (needStyle) {
    GM_addStyle(`.jav-card-grid{height:auto!important}.jav-card{position:static!important}.jav-card-link:visited .jav-card-title,.jav-card-link:visited .javbus-card-headline,.jav-card-link:visited .javbus-card-code{color:#64748b!important}.jav-card-cover{margin:0!important}.jav-card-image{transition:opacity .18s ease!important}.jav-card-title{display:block!important;height:auto!important;max-height:none!important;flex:1 1 auto!important;min-height:0!important;padding:7px 8px 9px!important;overflow:visible!important;line-height:var(--jav-card-title-line-height,1.5)!important}.javbus-card-grid{position:static!important;--jav-card-columns:5;box-sizing:border-box!important}#waterfall.javbus-card-grid{display:grid!important;grid-template-columns:repeat(var(--jav-card-columns,5),minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important;min-height:0!important}body .container-fluid{padding-left:28px!important;padding-right:28px!important;box-sizing:border-box!important}#waterfall.javbus-card-grid>.item,.javbus-card-grid .item.javbus-grid-card{position:static!important;width:auto!important;float:none!important;margin:0!important;top:auto!important;left:auto!important}.javbus-card-grid .item .jav-card-link.javbus-card-link{width:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important}.javbus-card-grid .item .javbus-cover-frame.photo-frame{margin:0!important;height:auto!important}.javbus-card-grid .item .javbus-card-image{height:100%!important;margin:0!important}.javbus-card-title>span{display:block!important}.javbus-card-title .video-title{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:var(--jav-card-title-lines,2)!important;line-clamp:var(--jav-card-title-lines,2)!important;height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;max-height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;min-height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:normal!important;word-break:break-word!important;color:inherit!important;font-size:var(--jav-card-title-size,15px)!important;line-height:var(--jav-card-title-line-height,1.5)!important;margin-bottom:6px!important}.javbus-card-grid .item .javbus-card-title .jav-pan115-badge{display:inline-flex!important;width:auto!important;max-width:max-content!important;float:none!important;vertical-align:middle!important;margin:0 6px 4px 0!important}.javbus-card-title .item-tag{margin:6px 0 4px!important}.javbus-card-title date{color:#94a3b8!important;font-size:12px!important}.javbus-card-title date.javbus-card-code{display:inline-block!important;color:inherit!important;font-size:15px!important;font-weight:800!important;margin-top:2px!important}@media (max-width:1100px){.javbus-card-grid{--jav-card-columns:4}}@media (max-width:820px){.javbus-card-grid{--jav-card-columns:3}}@media (max-width:560px){.javbus-card-grid{--jav-card-columns:2;gap:10px!important}}`);
   }
   setTimeout(() => {
    Runtime.refreshListPage();
   }, 0);
   setTimeout(() => {
    this._flattenWaterfall(); container.querySelectorAll(':scope > .item').forEach(item => this._decorateCard(item)); Runtime.syncListPreview();
   }, 450); }, };
 Object.assign(SiteJavBus, JavbusList);
 const JavdbFavorites = {
  _normalizeActorKey(value) {
   return String(value || '') .replace(/\s+/g, ' ') .trim() .toLowerCase(); },
  _getJavdbActorLinks(root = document) {
   const panel = root.querySelector?.('.movie-panel-info') || root;
   return [...panel.querySelectorAll?.('a[href*="/actors/"]') || []].filter(a => {
    const href = a.getAttribute('href') || ''; const text = (a.textContent || '').trim();
    return text && /\/actors\/[^/?#]+/i.test(href);
   }); },
  _getJavdbActorPath(value) {
   try {
    const path = new URL(value || '', location.origin).pathname.toLowerCase();
    return path.match(/^\/actors\/[^/?#]+/i)?.[0] || '';
   } catch { return ''; } },
  _getJavdbActorId(value) {
   const path = this._getJavdbActorPath(value);
   return path.match(/^\/actors\/([^/?#]+)/i)?.[1] || ''; },
  _readFavoriteActorsCache() {
   try {
    const raw = GM_getValue('javdb_favorite_actors_cache', null); const cache = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!cache || !Number.isFinite(cache.ts)) return null;
    return {
     names: new Set(Array.isArray(cache.names) ? cache.names : []),
     paths: new Set(Array.isArray(cache.paths) ? cache.paths : []),
     ids: new Set(
      Array.isArray(cache.ids) ? cache.ids : (Array.isArray(cache.paths) ? cache.paths : []) .map(path => this._getJavdbActorId(path)) .filter(Boolean)
     ),
     ts: cache.ts, };
   } catch { return null; } },
  _writeFavoriteActorsCache(names, paths, ids) {
   const ts = Date.now();
   GM_setValue('javdb_favorite_actors_cache', JSON.stringify({
    names: [...names],
    paths: [...paths],
    ids: [...ids],
    ts,
   }));
   return ts; },
  _readFavoriteActorsCacheDirtyAt() {
   const dirtyAt = Number(GM_getValue('javdb_favorite_actors_cache_dirty_at', 0));
   return Number.isFinite(dirtyAt) ? dirtyAt : 0; },
  _markFavoriteActorsCacheDirty() {
   GM_setValue('javdb_favorite_actors_cache_dirty_at', Date.now()); },
  _clearFavoriteActorsCacheDirty(ts) {
   if (this._readFavoriteActorsCacheDirtyAt() <= ts && !this._readFavoriteActorsPending()) { GM_setValue('javdb_favorite_actors_cache_dirty_at', 0); }
  },
  _readFavoriteActorsPending() {
   try {
    const raw = GM_getValue('javdb_favorite_actors_pending', null); const pending = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!pending) return null;
    const normalized = {
     addIds: new Set(Array.isArray(pending.addIds) ? pending.addIds : []),
     removeIds: new Set(Array.isArray(pending.removeIds) ? pending.removeIds : []),
     addPaths: new Set(Array.isArray(pending.addPaths) ? pending.addPaths : []),
     removePaths: new Set(Array.isArray(pending.removePaths) ? pending.removePaths : []),
     addNames: new Set(Array.isArray(pending.addNames) ? pending.addNames : []),
     removeNames: new Set(Array.isArray(pending.removeNames) ? pending.removeNames : []), };
    return Object.values(normalized).some(value => value.size) ? normalized : null;
   } catch { return null; } },
  _writeFavoriteActorsPending(pending) {
   const keys = ['addIds', 'removeIds', 'addPaths', 'removePaths', 'addNames', 'removeNames']; const hasPending = keys.some(key => pending[key]?.size);
   if (!hasPending) { GM_setValue('javdb_favorite_actors_pending', null); return; }
   GM_setValue('javdb_favorite_actors_pending', JSON.stringify(
    Object.fromEntries(keys.map(key => [key, [...pending[key]]]))
   )); },
  _mergeFavoriteActorsPending(names, paths, ids) {
   const pending = this._readFavoriteActorsPending();
   if (!pending) return { names, paths, ids };
   pending.addIds.forEach(id => {
    if (ids.has(id)) pending.addIds.delete(id);
   });
   pending.removeIds.forEach(id => {
    if (!ids.has(id)) pending.removeIds.delete(id);
   });
   pending.addPaths.forEach(path => {
    if (paths.has(path)) pending.addPaths.delete(path);
   });
   pending.removePaths.forEach(path => {
    if (!paths.has(path)) pending.removePaths.delete(path);
   });
   pending.addNames.forEach(name => {
    if (names.has(name)) pending.addNames.delete(name);
   });
   pending.removeNames.forEach(name => {
    if (!names.has(name)) pending.removeNames.delete(name);
   });
   pending.addIds.forEach(id => ids.add(id)); pending.removeIds.forEach(id => ids.delete(id)); pending.addPaths.forEach(path => paths.add(path));
   pending.removePaths.forEach(path => paths.delete(path)); pending.addNames.forEach(name => names.add(name));
   pending.removeNames.forEach(name => names.delete(name)); this._writeFavoriteActorsPending(pending);
   return { names, paths, ids }; },
  async _fetchFavoriteActors({ force = false } = {}) {
   const cached = !force ? this._readFavoriteActorsCache() : null;
   if (cached) return cached;
   const names = new Set(); const paths = new Set(); const ids = new Set(); const seen = new Set();
   let url = new URL('/users/collection_actors', location.origin).href;
   for (let page = 0; url && page < 30; page++) {
    const currentUrl = url;
    seen.add(currentUrl);
    const res = await gmFetch(currentUrl);
    if (!res.loadstuts || !res.responseText) throw new Error('JavDB 收藏演员读取失败');
    const doc = parseHTML(res.responseText);
    doc.querySelectorAll('a[href*="/actors/"]').forEach(a => {
     const text = this._normalizeActorKey(a.textContent); let path = '';
     path = this._getJavdbActorPath(a.getAttribute('href'));
     if (text) names.add(text);
     if (path) { paths.add(path); ids.add(this._getJavdbActorId(path)); }
    });
    const next = doc.querySelector('a.pagination-next[rel="next"][href], a[rel="next"][href], .pagination a[rel="next"][href]');
    url = '';
    if (next) {
     try {
      const nextUrl = new URL(next.getAttribute('href') || '', location.origin);
      if (nextUrl.origin === location.origin && /^\/users\/collection_actors\b/i.test(nextUrl.pathname) && !seen.has(nextUrl.href)) { url = nextUrl.href; }
     } catch {} } }
   const merged = this._mergeFavoriteActorsPending(names, paths, ids); const ts = this._writeFavoriteActorsCache(merged.names, merged.paths, merged.ids);
   return { ...merged, ts }; },
  _applyFavoriteActorHighlight(links, fav) {
   if (!links?.length || !fav) return;
   links.forEach(a => {
    const path = this._getJavdbActorPath(a.getAttribute('href')); const id = this._getJavdbActorId(path); const name = this._normalizeActorKey(a.textContent);
    const matched = id ? fav.ids?.has(id) : (path && fav.paths?.has(path)) || (name && fav.names?.has(name));
    a.classList.toggle('javdb-favorite-actor', !!matched);
    if (matched) a.title = a.title || '已收藏演员';
   }); },
  _updateFavoriteActorsCacheFromAction(action) {
   const href = action?.getAttribute('href') || ''; const id = this._getJavdbActorId(href); const path = this._getJavdbActorPath(href);
   if (!id || !path) return null;
   const cached = this._readFavoriteActorsCache() || {
    names: new Set(),
    paths: new Set(),
    ids: new Set(),
    ts: 0, };
   const isUncollect = /\/uncollect(?:[/?#]|$)/i.test(href); const name = this._normalizeActorKey(document.querySelector('.actor-section-name')?.textContent);
   const pending = this._readFavoriteActorsPending() || {
    addIds: new Set(),
    removeIds: new Set(),
    addPaths: new Set(),
    removePaths: new Set(),
    addNames: new Set(),
    removeNames: new Set(), };
   if (isUncollect) {
    cached.ids.delete(id); cached.paths.delete(path);
    if (name) cached.names.delete(name);
    pending.addIds.delete(id); pending.addPaths.delete(path); pending.addNames.delete(name); pending.removeIds.add(id); pending.removePaths.add(path);
    if (name) pending.removeNames.add(name);
   } else {
    cached.ids.add(id); cached.paths.add(path);
    if (name) cached.names.add(name);
    pending.removeIds.delete(id); pending.removePaths.delete(path); pending.removeNames.delete(name); pending.addIds.add(id); pending.addPaths.add(path);
    if (name) pending.addNames.add(name);
   }
   this._writeFavoriteActorsPending(pending);
   const ts = this._writeFavoriteActorsCache(cached.names, cached.paths, cached.ids);
   return { ...cached, ts }; },
  _refreshFavoriteActorsCache({ applyCurrentPage = true, delay = 500 } = {}) {
   const root = document.documentElement; const refreshingKey = 'laosijiJavdbFavoriteActorsRefreshing';
   const pendingKey = 'laosijiJavdbFavoriteActorsRefreshPending'; const pendingApplyKey = 'laosijiJavdbFavoriteActorsRefreshPendingApply';
   if (root.dataset[refreshingKey] === '1') {
    root.dataset[pendingKey] = '1';
    if (applyCurrentPage) root.dataset[pendingApplyKey] = '1';
    return; }
   root.dataset[refreshingKey] = '1';
   setTimeout(() => {
    this._fetchFavoriteActors({ force: true }) .then(fav => {
      this._clearFavoriteActorsCacheDirty(fav.ts);
      if (applyCurrentPage) this._applyFavoriteActorHighlight(this._getJavdbActorLinks(), fav);
     }) .catch(err => debugLog('JavDB 收藏演员缓存刷新失败:', err)) .finally(() => {
      delete root.dataset[refreshingKey];
      if (root.dataset[pendingKey] !== '1') return;
      const pendingApply = root.dataset[pendingApplyKey] === '1';
      delete root.dataset[pendingKey]; delete root.dataset[pendingApplyKey];
      this._refreshFavoriteActorsCache({
       applyCurrentPage: pendingApply,
       delay: 0,
      });
     });
   }, delay); },
  _isLoggedIn() {
   if (document.querySelector('a[href*="/users/sign_out"], a[href*="/logout"], a[href*="/users/profile"], a[href*="/users/collection"]')) { return true; }
   const navbarText = [
    document.querySelector('.navbar')?.textContent || '',
    document.querySelector('.menu')?.textContent || '',
    document.body?.textContent?.slice(0, 2000) || '',
   ].join(' '); return /登出|退出|我的|帳號|账号|收藏/i.test(navbarText) && !/登入|登录|註冊|注册/i.test(navbarText); },
  _primeFavoriteActorsCacheIfNeeded() {
   if (!this._isLoggedIn()) return;
   const cached = this._readFavoriteActorsCache(); const dirtyAt = this._readFavoriteActorsCacheDirtyAt();
   if (cached && dirtyAt <= cached.ts) return;
   this._refreshFavoriteActorsCache({ delay: dirtyAt ? 900 : 300 }); },
  _watchFavoriteActorActions() {
   if (document.documentElement.dataset.laosijiJavdbFavoriteActorActionWatch === '1') return;
   document.documentElement.dataset.laosijiJavdbFavoriteActorActionWatch = '1';
   document.addEventListener('click', e => {
    const action = e.target?.closest?.(
     '#button-collect-actor[href*="/actors/"][href$="/collect"],' +
     '#button-uncollect-actor[href*="/actors/"][href$="/uncollect"],' +
     'a[href*="/actors/"][href$="/uncollect"][data-method="post"]'
    );
    if (!action) return;
    const cached = this._updateFavoriteActorsCacheFromAction(action);
    this._markFavoriteActorsCacheDirty();
    if (cached) this._applyFavoriteActorHighlight(this._getJavdbActorLinks(), cached);
    this._refreshFavoriteActorsCache({ delay: 900 });
   }, true); },
  _syncFavoriteActorsFromCollectionPage() {
   if (!/^\/users\/collection_actors\b/i.test(location.pathname)) return;
   this._refreshFavoriteActorsCache({
    applyCurrentPage: false,
    delay: 300,
   }); },
  _initFavoriteActorHighlight() {
   if (!CFG.javdbFavoriteActorHighlight) return;
   this._watchFavoriteActorActions(); this._syncFavoriteActorsFromCollectionPage();
   if (location.pathname.startsWith('/v/')) { this._highlightFavoriteActors(); this._primeFavoriteActorsCacheIfNeeded(); }
  },
  _ensureFavoriteActorStyle() {
   injectStyle('javdb-favorite-actor-style',`.movie-panel-info a.javdb-favorite-actor{color:#d97706!important;font-weight:700!important;text-shadow:0 0 0 rgba(217,119,6,.2)}.movie-panel-info a.javdb-favorite-actor::after{content:"收藏";display:inline-block;margin-left:4px;padding:1px 5px;border-radius:999px;background:rgba(245,158,11,.14);color:#d97706;font-size:11px;font-weight:700;vertical-align:1px}html[data-theme="dark"] .movie-panel-info a.javdb-favorite-actor{color:#fbbf24!important}html[data-theme="dark"] .movie-panel-info a.javdb-favorite-actor::after{background:rgba(251,191,36,.16);color:#fde68a}`);
  },
  async _highlightFavoriteActors() {
   if (!CFG.javdbFavoriteActorHighlight) return;
   const links = this._getJavdbActorLinks();
   if (!links.length) return;
   this._ensureFavoriteActorStyle();
   const cached = this._readFavoriteActorsCache();
   if (cached) { this._applyFavoriteActorHighlight(links, cached); }
  }, };
 const JavdbApiTabStyles = {
  installMovieTabs() {
   injectStyle('javdb-api-movie-tab-style',`#tabs-container[data-laosiji-api-movie-tabs] .top-meta{display:none!important}.javdb-api-tab-loading,.javdb-api-tab-empty,.javdb-api-tab-error,.javdb-api-tab-end{padding:12px 14px!important;color:#64748b!important;font-size:13px!important;font-weight:700!important}.javdb-api-tab-error{color:#be123c!important}.javdb-api-review,.javdb-api-related{margin:0!important;padding:11px 12px!important;border-bottom:1px solid #edf2f7!important;background:#fff!important;word-break:break-word!important}.javdb-api-review-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;flex-wrap:wrap!important;color:#334155!important;font-size:13px!important}.javdb-api-related-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;flex-wrap:wrap!important;color:#334155!important;font-size:var(--laosiji-review-font-size,17px)!important;line-height:1.65!important}.javdb-api-review-content,.javdb-api-related-desc{margin-top:7px!important;color:#1f2937!important;font-size:var(--laosiji-review-font-size,17px)!important;line-height:1.65!important;white-space:normal!important}.javdb-api-related-meta{display:flex!important;gap:10px!important;flex-wrap:wrap!important;margin-top:7px!important;color:#64748b!important;font-size:var(--laosiji-review-font-size,17px)!important;line-height:1.65!important}.javdb-api-tab-footer{padding:10px 0 0!important}.javdb-api-tab-load-more{width:100%!important;min-height:34px!important;border:1px solid #bfdbfe!important;border-radius:6px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:13px!important;font-weight:800!important;cursor:pointer!important}.javdb-api-review-toggle{width:100%!important;min-height:38px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;border:1px solid #e2e8f0!important;border-radius:6px!important;background:#f8fafc!important;color:#334155!important;font-size:13px!important;font-weight:850!important;cursor:pointer!important}.javdb-api-review-toggle::before{content:"▸";color:#64748b;font-size:13px}.javdb-api-review-collapse-bar{display:flex!important;align-items:center!important;gap:8px!important;justify-content:flex-end!important;margin-bottom:8px!important}.javdb-api-review-collapse{min-height:28px!important;padding:0 10px!important;border:1px solid #e2e8f0!important;border-radius:6px!important;background:#f8fafc!important;color:#334155!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}.javdb-api-review-default-row{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:wrap!important;justify-content:flex-end!important;margin-bottom:8px!important}.javdb-api-review-default-toggle{display:inline-flex!important;align-items:center!important;gap:6px!important;color:#475569!important;font-size:12px!important;font-weight:800!important;line-height:1!important;white-space:nowrap!important;cursor:pointer!important;user-select:none!important}.javdb-api-review-default-toggle input{position:absolute!important;opacity:0!important;pointer-events:none!important}.javdb-api-review-default-switch{position:relative!important;width:28px!important;height:16px!important;border:1px solid #cbd5e1!important;border-radius:999px!important;background:#e5e7eb!important;transition:background .16s ease,border-color .16s ease!important}.javdb-api-review-default-switch::before{content:""!important;position:absolute!important;top:2px!important;left:2px!important;width:10px!important;height:10px!important;border-radius:50%!important;background:#fff!important;box-shadow:0 1px 2px rgba(15,23,42,.22)!important;transition:transform .16s ease!important}.javdb-api-review-default-toggle input:checked+.javdb-api-review-default-switch{border-color:#2563eb!important;background:#2563eb!important}.javdb-api-review-default-toggle input:checked+.javdb-api-review-default-switch::before{transform:translateX(12px)!important}html[data-theme="dark"] .javdb-api-review-default-toggle{color:#cbd5e1!important}html[data-theme="dark"] .javdb-api-review-default-switch{border-color:#52525b!important;background:#3f3f46!important}.javdb-api-review-font-size{display:inline-flex!important;align-items:center!important;gap:5px!important;color:#475569!important;font-size:12px!important;font-weight:800!important;line-height:1!important;white-space:nowrap!important}.javdb-api-review-font-size select{min-height:24px!important;padding:0 18px 0 7px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#fff!important;color:#334155!important;font-size:12px!important;font-weight:800!important;outline:none!important}html[data-theme="dark"] .javdb-api-review-font-size{color:#cbd5e1!important}html[data-theme="dark"] .javdb-api-review-font-size select{border-color:#52525b!important;background:#2f2f2f!important;color:#e5e7eb!important}.javdb-api-tab-badge-item{display:flex!important;align-items:center!important;margin-left:4px!important;pointer-events:auto!important}.javdb-api-tab-badge{margin-left:0!important;align-self:center!important;display:inline-flex!important;align-items:center!important;height:20px!important;padding:0 7px!important;border:1px solid #bfdbfe!important;border-radius:999px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:11px!important;font-weight:850!important;line-height:1!important;white-space:nowrap!important}.javdb-api-tab-default-item{display:flex!important;align-items:center!important;margin-left:auto!important;pointer-events:auto!important}.javdb-api-tab-default-control{display:inline-flex!important;align-items:center!important;gap:3px!important;height:24px!important;padding:2px!important;border:1px solid #cbd5e1!important;border-radius:999px!important;background:#f8fafc!important;color:#64748b!important;font-size:11px!important;font-weight:850!important;line-height:1!important;white-space:nowrap!important}.javdb-api-tab-default-label{padding:0 5px!important}.javdb-api-tab-default-btn{min-width:34px!important;height:18px!important;padding:0 7px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#64748b!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important}.javdb-api-tab-default-btn.is-active{background:#2563eb!important;color:#fff!important}html[data-theme="dark"] .javdb-api-tab-default-control{border-color:#52525b!important;background:#2f2f2f!important;color:#cbd5e1!important}html[data-theme="dark"] .javdb-api-tab-default-btn{color:#cbd5e1!important}html[data-theme="dark"] .javdb-api-tab-default-btn.is-active{background:#3b82f6!important;color:#fff!important}`);
  }, };
 const JavdbApiTabRenderer = {
  formatDate(value) {
   const text = String(value || '');
   if (!text) return '';
   return text.includes('T') ? text.slice(0, 10) : text; },
  formatSize(size) {
   const mb = Number(size);
   if (!Number.isFinite(mb) || mb <= 0) return '';
   return mb >= 1024 ?`${(mb / 1024).toFixed(mb >= 10240 ? 1 : 2)}GB` :`${Math.round(mb)}MB`;
  },
  renderLinkedText(value) {
   const text = String(value || ''); const re = /((?:magnet:\?|ed2k:\/\/|https?:\/\/)[^\s"'<>]+)/gi; let html = ''; let last = 0;
   text.replace(re, (match, _link, offset) => {
    html += this._escapeHtml(text.slice(last, offset));
    const safe = this._escapeHtml(match);
    html += `<a class="a-primary" href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`;
    last = offset + match.length;
    return match;
   });
   html += this._escapeHtml(text.slice(last));
   return html.replace(/\n/g, '<br>'); },
  renderStars(score) {
   const value = Math.max(0, Math.min(5, parseInt(score, 10) || 0));
   return `<span class="score-stars"> ${Array.from({ length: 5 }, (_, index) => `<i class="icon-star${index < value ? '' : ' gray'}"></i>`).join('')} </span>`;
  },
  renderLoading(text = '读取中...') {
   return `<div class="javdb-api-tab-loading"> ${this._escapeHtml(text)} </div>`;
  },
  renderError(text) {
   return `<div class="javdb-api-tab-error"> ${this._escapeHtml(text || '读取失败')} </div>`;
  },
  renderFooter(tab, nextPage, hasNext, doneText, moreText, pageSize = 20, shownCount = 0, loadLimit = pageSize) {
   return `<div class="javdb-api-tab-footer"> ${hasNext
        ? `<button type="button" class="javdb-api-tab-load-more" data-laosiji-api-load-tab="${tab}" data-next-page="${nextPage}" data-page-size="${pageSize}" data-shown-count="${shownCount}" data-load-limit="${loadLimit}">${this._escapeHtml(moreText)}</button>`
        : `<div class="javdb-api-tab-end">${this._escapeHtml(doneText)}</div>`} </div>`;
  },
  renderMagnetRows(magnets) {
   const list = Array.isArray(magnets) ? magnets : [];
   if (!list.length) return '<div class="javdb-api-tab-empty">暂无磁力信息</div>';
   return list.map((item, index) => {
    const hash = String(item?.hash || '').trim();
    if (!hash) return '';
    const name = String(item?.name || hash).trim();
    const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(`[javdb.com]${name}`)}`;
    const meta = [
     this._formatApiSize(item?.size),
     Number(item?.files_count || 0) > 0 ? `${item.files_count}個文件` : '',
    ].filter(Boolean).join(', ');
    const tags = [
     item?.hd ? '<span class="tag is-primary is-small is-light">高清</span>' : '',
     item?.cnsub ? '<span class="tag is-warning is-small is-light">字幕</span>' : '',
    ].filter(Boolean).join('');
    const pikpak = item?.pikpak_url ? `<a class="button is-info is-small" href="${this._escapeHtml(item.pikpak_url)}" target="_blank" rel="noopener noreferrer">&nbsp;下載&nbsp;</a>` : '';
    return `<div class="item columns is-desktop javdb-api-magnet-row ${index % 2 === 0 ? 'odd' : ''}"><div class="magnet-name column is-four-fifths"><a class="javdb-api-magnet-link" href="${this._escapeHtml(magnet)}" title="右鍵點擊並選擇「複製鏈接地址」"><span class="name">${this._escapeHtml(name)}</span> ${meta ? `<span class="meta javdb-api-magnet-meta">${this._escapeHtml(meta)}</span>` : ''}${tags ? `<span class="tags javdb-api-magnet-tags">${tags}</span>` : ''} </a></div><div class="buttons column javdb-api-magnet-actions"><button class="button is-info is-small copy-to-clipboard" data-clipboard-text="${this._escapeHtml(magnet)}" type="button">&nbsp;複製&nbsp;</button> ${pikpak} </div><div class="date column javdb-api-magnet-date"><span class="time">${this._escapeHtml(this._formatApiDate(item?.created_at))}</span></div></div>`;
   }).filter(Boolean).join(''); },
  renderMagnets(magnets) {
   return `<article class="message video-panel"><div class="message-body"><div id="magnets-content" class="magnet-links" data-laosiji-api-source="1"> ${this._renderApiMagnetRows(magnets)} </div></div></article>`;
  },
  renderReviews(reviews, page, limit) {
   const list = Array.isArray(reviews) ? reviews.slice(0, limit) : [];
   const items = list.length ? this._renderApiReviewItems(list, (page - 1) * limit, limit) : '<div class="javdb-api-tab-empty">暂无短评</div>';
   return `${this._renderApiReviewCollapseBar()} <div class="javdb-api-tab-items"> ${items} </div> ${this._renderApiTabFooter('reviews', page + 1, list.length >= limit, '已加载全部短评', '加载更多短评', limit, list.length, JAVDB_REVIEW_MORE_LIMIT)}`;
  },
  renderRelatedItems(lists, offset = 0) {
   const list = Array.isArray(lists) ? lists : [];
   return list.map((item, index) => {
    const href = `/lists/${encodeURIComponent(item?.id || '')}`;
    return `<div class="javdb-api-related"><div class="javdb-api-related-head"><span><strong>#${offset + index + 1}</strong><a href="${this._escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${this._escapeHtml(item?.name || '未命名清單')}</a></span><span>${this._escapeHtml(this._formatApiDate(item?.created_at))}</span></div> ${item?.description ? `<div class="javdb-api-related-desc">${this._renderApiLinkedText(item.description)}</div>` : ''} <div class="javdb-api-related-meta"><span>影片:${this._escapeHtml(item?.movies_count ?? '-')}</span><span>收藏:${this._escapeHtml(item?.collections_count ?? '-')}</span><span>浏览:${this._escapeHtml(item?.views_count ?? '-')}</span></div></div>`;
   }).join(''); },
  renderRelatedLists(lists, page, limit) {
   const list = Array.isArray(lists) ? lists : [];
   const items = list.length ? this._renderApiRelatedItems(list, (page - 1) * limit) : '<div class="javdb-api-tab-empty">暂无相关清单</div>';
   return `<div class="javdb-api-tab-items"> ${items} </div> ${this._renderApiTabFooter('lists', page + 1, list.length >= limit, '已加载全部清单', '加载更多清单')}`;
  }, };
 const JavdbApiTabs = {
  _getCurrentMovieId() {
   const pathHit = location.pathname.match(/^\/v\/([^/?#]+)/);
   if (pathHit) return decodeURIComponent(pathHit[1]);
   const tabUrl = document.querySelector('.review-tab[data-url*="/v/"], .list-tab[data-url*="/v/"]')?.dataset?.url || '';
   const tabHit = tabUrl.match(/\/v\/([^/]+)/);
   if (tabHit) return decodeURIComponent(tabHit[1]);
   return this._getApiDetailShellMode()?.movieId || ''; },
  _formatApiDate(value) { return JavdbApiTabRenderer.formatDate.call(this, value); },
  _formatApiSize(size) { return JavdbApiTabRenderer.formatSize.call(this, size); },
  _renderApiLinkedText(value) { return JavdbApiTabRenderer.renderLinkedText.call(this, value); },
  _renderApiStars(score) { return JavdbApiTabRenderer.renderStars.call(this, score); },
  _ensureApiMovieTabStyle() { return JavdbApiTabStyles.installMovieTabs(); },
  _ensureApiMovieTabBadge() {
   const tabs = document.querySelector('.tabs.no-bottom');
   if (!tabs) return;
   let badge = tabs.querySelector('.javdb-api-tab-badge');
   if (!badge) { badge = document.createElement('span'); badge.className = 'javdb-api-tab-badge'; }
   badge.textContent = '老司机'; badge.title = '此区块已由 JAV 老司机脚本替换';
   let badgeItem = tabs.querySelector('.javdb-api-tab-badge-item');
   if (!badgeItem) { badgeItem = document.createElement('li'); badgeItem.className = 'javdb-api-tab-badge-item'; }
   if (!badgeItem.contains(badge)) badgeItem.appendChild(badge);
   const listTab = document.querySelector('[data-movie-tab-target="listTab"]');
   if (listTab?.parentElement) {
    if (badgeItem.parentElement !== listTab.parentElement || badgeItem.previousElementSibling !== listTab) {
     listTab.insertAdjacentElement('afterend', badgeItem); }
   } else if (!tabs.contains(badgeItem)) {
    tabs.appendChild(badgeItem); } },
  _ensureApiMovieTabDefaultControl() {
   const tabs = document.querySelector('.tabs.no-bottom');
   if (!tabs) return;
   const tabList = tabs.querySelector('ul') || tabs; let controlItem = tabs.querySelector('.javdb-api-tab-default-item');
   if (!controlItem) {
    controlItem = document.createElement('li'); controlItem.className = 'javdb-api-tab-default-item';
    controlItem.innerHTML = `<span class="javdb-api-tab-default-control" title="设置以后进入详情页默认显示的区块"><span class="javdb-api-tab-default-label">默认</span><button type="button" class="javdb-api-tab-default-btn" data-laosiji-api-default-tab="magnets">磁力</button><button type="button" class="javdb-api-tab-default-btn" data-laosiji-api-default-tab="reviews">短评</button></span>`;
   }
   const badgeItem = tabs.querySelector('.javdb-api-tab-badge-item');
   if (badgeItem?.parentElement) {
    if (controlItem.parentElement !== badgeItem.parentElement || controlItem.previousElementSibling !== badgeItem) {
     badgeItem.insertAdjacentElement('afterend', controlItem); }
   } else if (!tabList.contains(controlItem)) {
    tabList.appendChild(controlItem); }
   this._syncApiMovieTabDefaultControl(tabs); },
  _syncApiMovieTabDefaultControl(root = document) {
   root.querySelectorAll?.('[data-laosiji-api-default-tab]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.laosijiApiDefaultTab === CFG.apiMovieDefaultTab);
   }); },
  _renderApiTabLoading(text = '读取中...') { return JavdbApiTabRenderer.renderLoading.call(this, text); },
  _renderApiTabError(text) { return JavdbApiTabRenderer.renderError.call(this, text); },
  _renderApiReviewDefaultToggle() { return JavdbReviews.renderDefaultToggle(); },
  _reviewFontSizeValue() { return JavdbReviews.reviewFontSizeValue(); },
  _applyReviewFontSize() { return JavdbReviews.applyFontSize(); },
  _syncApiReviewDefaultToggles(root = document) { return JavdbReviews.syncDefaultToggles(root); },
  _renderApiReviewCollapsed() { return JavdbReviews.renderCollapsed(); },
  _renderApiReviewCollapseBar() { return JavdbReviews.renderCollapseBar(); },
  _renderApiTabFooter(tab, nextPage, hasNext, doneText, moreText, pageSize = 20, shownCount = 0, loadLimit = pageSize) {
   return JavdbApiTabRenderer.renderFooter.call(this, tab, nextPage, hasNext, doneText, moreText, pageSize, shownCount, loadLimit); },
  _renderApiMagnetRows(magnets) { return JavdbApiTabRenderer.renderMagnetRows.call(this, magnets); },
  _renderApiMagnets(magnets) { return JavdbApiTabRenderer.renderMagnets.call(this, magnets); },
  _renderApiReviewItems(reviews, offset = 0, limit = JAVDB_REVIEW_MORE_LIMIT) { return JavdbReviews.renderItems(reviews, offset, limit); },
  _renderApiReviews(reviews, page, limit) { return JavdbApiTabRenderer.renderReviews.call(this, reviews, page, limit); },
  _renderApiRelatedItems(lists, offset = 0) { return JavdbApiTabRenderer.renderRelatedItems.call(this, lists, offset); },
  _renderApiRelatedLists(lists, page, limit) { return JavdbApiTabRenderer.renderRelatedLists.call(this, lists, page, limit); },
  _setApiMovieTab(active) {
   const tabs = {
    magnets: document.querySelector('[data-movie-tab-target="magnetTab"]'),
    reviews: document.querySelector('[data-movie-tab-target="reviewTab"]'),
    lists: document.querySelector('[data-movie-tab-target="listTab"]'), };
   const panes = { magnets: document.getElementById('magnets'), reviews: document.getElementById('reviews'), lists: document.getElementById('lists') };
   Object.entries(tabs).forEach(([key, tab]) => tab?.classList.toggle('is-active', key === active));
   Object.entries(panes).forEach(([key, pane]) => {
    if (pane) pane.style.display = key === active ? '' : 'none';
   }); },
  _updateApiTabFooter(pane, tab, nextPage, hasNext, doneText, moreText) {
   const footer = pane?.querySelector('.javdb-api-tab-footer');
   if (!footer) return;
   const pageSize = tab === 'reviews' ? JAVDB_REVIEW_MORE_LIMIT : 20;
   const shownCount = tab === 'reviews' ? pane.querySelectorAll('.javdb-api-review').length : 0;
   footer.outerHTML = this._renderApiTabFooter(tab, nextPage, hasNext, doneText, moreText, pageSize, shownCount, pageSize); },
  async _loadApiMovieTab(movieId, tab, page = 1, append = false, pageSize = null, shownCount = null, loadLimit = null) {
   const pane = document.getElementById(tab === 'magnets' ? 'magnets' : tab);
   if (!pane || !movieId) return;
   const visibleReviewCount = tab === 'reviews' && append ? Math.max(0, parseInt(shownCount, 10) || pane.querySelectorAll('.javdb-api-review').length || 0) : 0;
   const reviewTake = append ? Math.max(1, parseInt(loadLimit, 10) || JAVDB_REVIEW_MORE_LIMIT) : JAVDB_REVIEW_INITIAL_LIMIT;
   const limit = tab === 'reviews' ? visibleReviewCount + reviewTake : 20;
   if (!append) pane.innerHTML = this._renderApiTabLoading(tab === 'magnets' ? '正在读取磁力...' : tab === 'reviews' ? '正在读取短评...' : '正在读取相关清单...');
   try {
    if (tab === 'magnets') {
     const json = await Magnet.javdbApi.movieMagnets(movieId); const magnets = Array.isArray(json?.data?.magnets) ? json.data.magnets : [];
     pane.innerHTML = this._renderApiMagnets(magnets); pane.dataset.laosijiApiLoaded = '1';
     if (MobilePolicy.effectiveMagnetDisplayMode() === 'native-replace') { NativeMagnetPanel.scheduleMount('javdb', this.getVid()); }
     return; }
    if (tab === 'reviews') {
     const json = await Magnet.javdbApi.movieReviews(movieId, { page: 1, limit });
     const allReviews = Array.isArray(json?.data?.reviews) ? json.data.reviews : [];
     const reviews = append ? allReviews.slice(visibleReviewCount, visibleReviewCount + reviewTake) : allReviews.slice(0, JAVDB_REVIEW_INITIAL_LIMIT);
     if (append) {
      pane.querySelector('.javdb-api-tab-items')?.insertAdjacentHTML('beforeend', this._renderApiReviewItems(reviews, visibleReviewCount, reviewTake));
      this._updateApiTabFooter(pane, 'reviews', page + 1, allReviews.length >= limit && reviews.length > 0, '已加载全部短评', '加载更多短评');
     } else { pane.innerHTML = this._renderApiReviews(reviews, page, JAVDB_REVIEW_INITIAL_LIMIT); }
     pane.dataset.laosijiApiLoaded = '1';
     return; }
    if (tab === 'lists') {
     const json = await Magnet.javdbApi.relatedLists(movieId, { page, limit });
     const lists = Array.isArray(json?.data?.lists) ? json.data.lists : [];
     if (append) {
      pane.querySelector('.javdb-api-tab-items')?.insertAdjacentHTML('beforeend', this._renderApiRelatedItems(lists, (page - 1) * limit));
      this._updateApiTabFooter(pane, 'lists', page + 1, lists.length >= limit, '已加载全部清单', '加载更多清单');
     } else { pane.innerHTML = this._renderApiRelatedLists(lists, page, limit); }
     pane.dataset.laosijiApiLoaded = '1'; }
   } catch (err) {
    errorLog('JavDB API tab 读取失败:', tab, err);
    if (append) {
     this._updateApiTabFooter(pane, tab, page, true, '', '加载失败，点击重试');
    } else { pane.innerHTML = this._renderApiTabError(err.message || '读取失败'); } } },
  _initApiMovieTabs() {
   const movieId = this._getCurrentMovieId(); const tabsContainer = document.getElementById('tabs-container');
   const magnetsPane = document.getElementById('magnets'); const reviewsPane = document.getElementById('reviews');
   const listsPane = document.getElementById('lists');
   if (!movieId || !tabsContainer || !magnetsPane || !reviewsPane || !listsPane) return;
   if (tabsContainer.dataset.laosijiApiMovieTabs === movieId) return;
   tabsContainer.dataset.laosijiApiMovieTabs = movieId;
   this._ensureApiMovieTabStyle(); this._ensureApiMovieTabBadge(); this._ensureApiMovieTabDefaultControl();
   const tabLinks = {
    magnets: document.querySelector('[data-movie-tab-target="magnetTab"] a'),
    reviews: document.querySelector('[data-movie-tab-target="reviewTab"] a'),
    lists: document.querySelector('[data-movie-tab-target="listTab"] a'), };
   const useNativeMagnets = () => MobilePolicy.effectiveMagnetDisplayMode() !== 'sidebar';
   Object.entries(tabLinks).forEach(([key, link]) => {
    if (!link) return;
    link.dataset.laosijiApiTab = key;
    link.removeAttribute('data-action'); link.removeAttribute('data-url');
   });
   const root = tabsContainer.closest('.columns') || tabsContainer;
   root.addEventListener('change', e => {
    const input = e.target?.closest?.('[data-laosiji-review-default-expanded]');
    if (input && root.contains(input)) { CFG.reviewsDefaultExpanded = input.checked; this._syncApiReviewDefaultToggles(document); return; }
    const sizeSelect = e.target?.closest?.('[data-laosiji-review-font-size]');
    if (sizeSelect && root.contains(sizeSelect)) { CFG.reviewFontSize = sizeSelect.value; this._syncApiReviewDefaultToggles(document); }
   }, true);
   root.addEventListener('click', e => {
    if (e.target?.closest?.('.javdb-api-tab-badge-item')) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    const defaultTabBtn = e.target?.closest?.('[data-laosiji-api-default-tab]');
    if (defaultTabBtn && root.contains(defaultTabBtn)) {
     e.preventDefault(); e.stopImmediatePropagation();
     const tab = defaultTabBtn.dataset.laosijiApiDefaultTab === 'magnets' ? 'magnets' : 'reviews';
     CFG.apiMovieDefaultTab = tab;
     this._syncApiMovieTabDefaultControl(document); this._setApiMovieTab(tab);
     const pane = document.getElementById(tab);
     if (tab === 'reviews') {
      if (CFG.reviewsDefaultExpanded) {
       this._loadApiMovieTab(movieId, 'reviews');
      } else if (pane && pane.dataset.laosijiApiLoaded !== '1' && !pane.querySelector('[data-laosiji-api-expand-reviews]')) {
       pane.innerHTML = this._renderApiReviewCollapsed(); }
     } else if (!useNativeMagnets() && pane && pane.dataset.laosijiApiLoaded !== '1') {
      this._loadApiMovieTab(movieId, tab);
     } else if (MobilePolicy.effectiveMagnetDisplayMode() === 'native-replace') {
      NativeMagnetPanel.scheduleMount('javdb', this.getVid()); }
     return; }
    const copyBtn = e.target?.closest?.('.copy-to-clipboard[data-clipboard-text]');
    if (copyBtn && tabsContainer.contains(copyBtn)) {
     e.preventDefault(); e.stopImmediatePropagation(); GM_setClipboard(copyBtn.dataset.clipboardText || '');
     const oldText = copyBtn.textContent;
     copyBtn.textContent = '已複製';
     setTimeout(() => { copyBtn.textContent = oldText; }, 900);
     return; }
    const loadMore = e.target?.closest?.('.javdb-api-tab-load-more[data-laosiji-api-load-tab]');
    if (loadMore && tabsContainer.contains(loadMore)) {
     e.preventDefault(); e.stopImmediatePropagation();
     const tab = loadMore.dataset.laosijiApiLoadTab; const nextPage = parseInt(loadMore.dataset.nextPage || '2', 10) || 2;
     const pageSize = parseInt(loadMore.dataset.pageSize || '', 10) || null; const shownCount = parseInt(loadMore.dataset.shownCount || '', 10) || null;
     const loadLimit = parseInt(loadMore.dataset.loadLimit || '', 10) || null;
     loadMore.textContent = '加载中...'; loadMore.disabled = true;
     this._loadApiMovieTab(movieId, tab, nextPage, true, pageSize, shownCount, loadLimit);
     return; }
    const expandReviews = e.target?.closest?.('[data-laosiji-api-expand-reviews]');
    if (expandReviews && tabsContainer.contains(expandReviews)) {
     e.preventDefault(); e.stopImmediatePropagation(); this._loadApiMovieTab(movieId, 'reviews');
     return; }
    const collapseReviews = e.target?.closest?.('[data-laosiji-api-collapse-reviews]');
    if (collapseReviews && tabsContainer.contains(collapseReviews)) {
     e.preventDefault(); e.stopImmediatePropagation();
     delete reviewsPane.dataset.laosijiApiLoaded;
     reviewsPane.innerHTML = this._renderApiReviewCollapsed();
     return; }
    const tabLink = e.target?.closest?.('[data-laosiji-api-tab]');
    if (!tabLink || !root.contains(tabLink)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const tab = tabLink.dataset.laosijiApiTab;
    this._setApiMovieTab(tab);
    const pane = document.getElementById(tab === 'magnets' ? 'magnets' : tab);
    if (tab === 'magnets' && useNativeMagnets()) {
     if (MobilePolicy.effectiveMagnetDisplayMode() === 'native-replace') { NativeMagnetPanel.scheduleMount('javdb', this.getVid()); }
     return; }
    if (pane && pane.dataset.laosijiApiLoaded !== '1') {
     if (tab === 'reviews') {
      if (CFG.reviewsDefaultExpanded) {
       this._loadApiMovieTab(movieId, 'reviews');
      } else if (!pane.querySelector('[data-laosiji-api-expand-reviews]')) {
       pane.innerHTML = this._renderApiReviewCollapsed(); }
     } else { this._loadApiMovieTab(movieId, tab); } }
   }, true);
   const defaultTab = CFG.apiMovieDefaultTab;
   this._setApiMovieTab(defaultTab);
   if (defaultTab === 'magnets') {
    if (useNativeMagnets()) {
     if (MobilePolicy.effectiveMagnetDisplayMode() === 'native-replace') { NativeMagnetPanel.scheduleMount('javdb', this.getVid()); }
    } else { this._loadApiMovieTab(movieId, 'magnets'); }
    reviewsPane.innerHTML = this._renderApiReviewCollapsed();
   } else if (CFG.reviewsDefaultExpanded) {
    this._loadApiMovieTab(movieId, 'reviews');
   } else { reviewsPane.innerHTML = this._renderApiReviewCollapsed(); } }, };
 const JavdbPagination = {
  _ensurePaginationJumpStyle() {
   injectStyle('javdb-pagination-jump-style',`.javdb-pagination-jump{display:flex!important;align-items:center!important;gap:.25rem!important;margin:0!important;flex-wrap:nowrap!important}.pagination-list .javdb-pagination-jump-item{display:list-item!important;margin-left:.25rem!important}.javdb-pagination-jump .pagination-link{margin:0!important}.javdb-pagination-jump input.pagination-link{width:4.5em!important;min-width:4.5em!important;text-align:center!important;box-shadow:none!important;appearance:textfield!important}.javdb-pagination-jump input.pagination-link::-webkit-outer-spin-button,.javdb-pagination-jump input.pagination-link::-webkit-inner-spin-button{-webkit-appearance:none!important;margin:0!important}.javdb-pagination-jump button.pagination-link{cursor:pointer!important;font-weight:400!important}@media (max-width:640px){.pagination-list .javdb-pagination-jump-item{flex-basis:100%!important;margin-left:.25rem!important}}`);
  },
  _paginationCurrentPage(nav) {
   const params = new URLSearchParams(location.search); const fromUrl = parseInt(params.get('page') || '1', 10);
   if (Number.isFinite(fromUrl) && fromUrl > 0) return fromUrl;
   const current = parseInt(nav?.querySelector('.pagination-link.is-current')?.textContent?.trim() || '1', 10);
   return Number.isFinite(current) && current > 0 ? current : 1; },
  _paginationPageUrl(page) {
   const url = new URL(location.href);
   if (page <= 1) url.searchParams.delete('page');
   else url.searchParams.set('page', String(page));
   return url.href; },
  _initPaginationJump(root = document) {
   const navs = [...root.querySelectorAll?.('nav.pagination') || []];
   if (!navs.length) return;
   this._ensurePaginationJumpStyle();
   navs.forEach(nav => {
    if (nav.querySelector('.javdb-pagination-jump')) return;
    const list = nav.querySelector('.pagination-list'); const host = document.createElement(list ? 'li' : 'div');
    host.className = list ? 'javdb-pagination-jump-item' : 'javdb-pagination-jump-item pagination-link';
    const form = document.createElement('form');
    form.className = 'javdb-pagination-jump';
    form.innerHTML = `<input class="pagination-link" type="number" min="1" step="1" inputmode="numeric" aria-label="跳转页码" placeholder="页码" value="${this._escapeHtml(this._paginationCurrentPage(nav))}"><button class="pagination-link" type="submit">跳转</button>`;
    form.addEventListener('submit', e => {
     e.preventDefault();
     const input = form.querySelector('input'); const page = Math.max(1, parseInt(input?.value || '1', 10) || 1);
     location.href = this._paginationPageUrl(page);
    });
    host.appendChild(form);
    (list || nav).appendChild(host);
   }); }, };
 const JavdbApiShellStyles = {
  installFc2AdvancedSearch() {
   injectStyle('javdb-fc2-advanced-search-style',`html[data-laosiji-fc2-advanced-search="1"] h2.section-title,html[data-laosiji-fc2-advanced-search="1"] .section .container>.box,html[data-laosiji-fc2-advanced-search="1"] body>section>div>.box{display:none!important}`);
  },
  installRankingShell() {
   injectStyle('javdb-api-shell-style',`.javdb-api-shell{margin-top:10px!important}.javdb-api-shell-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin:8px 0 12px!important;flex-wrap:wrap!important}.javdb-api-shell-title{font-size:18px!important;font-weight:850!important;color:#1e293b!important}.javdb-api-shell-toolbar,.javdb-api-shell-pagination{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important}.javdb-api-shell-toolbar{margin:8px 0 12px!important}.javdb-api-shell-pagination{justify-content:center!important;margin:16px 0 8px!important}.javdb-api-shell-toolbar-group{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important;width:100%!important}.javdb-api-shell-toolbar-label{color:#64748b!important;font-size:12px!important;font-weight:850!important;min-width:34px!important}.javdb-api-shell-toolbar a,.javdb-api-shell-pagination a,.javdb-api-shell-pagination span{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;padding:5px 12px!important;border:1px solid #dbe3ef!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:12px!important;font-weight:800!important;text-decoration:none!important}.javdb-api-shell-toolbar a.is-active,.javdb-api-shell-pagination a.is-active{border-color:#60a5fa!important;background:#eff6ff!important;color:#1d4ed8!important}.javdb-api-shell-status{margin:10px 0!important;padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#f8fafc!important;color:#475569!important;font-size:13px!important;font-weight:700!important}.javdb-api-shell-status.is-error{border-color:#fecaca!important;background:#fff1f2!important;color:#be123c!important}`);
  },
  installDetailShell() {
   injectStyle('javdb-api-detail-style',`.javdb-fc2-detail-samples-section{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-top:20px!important;overflow:hidden!important}.javdb-fc2-detail-sample-heading{margin:0 0 12px!important;color:#0f172a!important;font-size:17px!important;font-weight:900!important}.javdb-fc2-detail-magnet{margin-top:20px!important;box-sizing:border-box!important;overflow:visible!important}.javdb-fc2-detail-magnet-title{margin:0 0 12px!important;color:#0f172a!important;font-size:17px!important;font-weight:900!important}.javdb-fc2-detail-magnet-body{width:100%!important;min-width:0!important}.javdb-fc2-detail-magnet-body>.jav-nong-wrapper{max-width:100%!important}html[data-theme="dark"] .javdb-fc2-detail-sample-heading,html[data-theme="dark"] .javdb-fc2-detail-magnet-title{color:#f8fafc!important}`);
  }, };
 const JavdbApiShell = {
  _apiRankingShellUrl(mode, next = {}) {
   const params = new URLSearchParams();
   params.set('laosiji_rank', mode);
   if (mode === 'top') {
    params.set('lsj_category', next.category || 'all');
    if (next.year) params.set('lsj_year', next.year);
   } else if (mode === 'playback') {
    params.set('lsj_period', next.period || 'daily'); params.set('lsj_filter_by', next.filterBy || 'high_score');
   } else { params.set('lsj_period', next.period || 'daily'); }
   if (next.page && next.page > 1) params.set('lsj_page', String(next.page));
   return `/advanced_search?${params.toString()}`;
  },
  _apiDetailShellUrl(movieId) {
   const id = String(movieId || '').trim();
   if (!id) return '';
   return `/advanced_search?laosiji_detail=fc2&movie_id=${encodeURIComponent(id)}`;
  },
  _getApiDetailShellMode() {
   const path = location.pathname.replace(/\/+$/, '');
   if (path !== '/advanced_search') return null;
   const params = new URLSearchParams(location.search);
   if (params.get('laosiji_detail') !== 'fc2') return null;
   const movieId = params.get('movie_id') || '';
   if (!movieId) return null;
   return { movieId }; },
  _apiTopTypeFromRankingParams(params) {
   const t = params.get('t') || '';
   if (/^y\d{4}$/i.test(t)) return { category: 'all', year: t.slice(1) };
   if (t) return { category: t, year: '' };
   return { category: 'all', year: '' }; },
  _apiRankingShellUrlFromHref(href) {
   try {
    const url = new URL(href, location.href);
    if (!/javdb/i.test(url.hostname)) return '';
    const path = url.pathname.replace(/\/+$/, ''); const params = new URLSearchParams(url.search);
    if (path === '/advanced_search' && /^(top|fc2|playback)$/.test(params.get('laosiji_rank') || '')) {
     return `${url.pathname}${url.search}`;
    }
    if (path === '/rankings/top') {
     const topType = this._apiTopTypeFromRankingParams(params);
     return this._apiRankingShellUrl('top', {
      category: topType.category,
      year: topType.year,
      page: parseInt(params.get('page') || '1', 10) || 1,
     }); }
    if (path === '/rankings/movies' && params.get('t') === 'fc2') {
     return this._apiRankingShellUrl('fc2', {
      period: params.get('p') || 'daily',
      page: parseInt(params.get('page') || '1', 10) || 1,
     }); }
    if (path === '/rankings/playback') {
     return this._apiRankingShellUrl('playback', {
      period: params.get('p') || params.get('period') || 'daily',
      filterBy: params.get('filter_by') || 'high_score',
      page: parseInt(params.get('page') || '1', 10) || 1,
     }); }
    if (path === '/fc2' || path === '/tags/fc2') { return '/advanced_search?type=3&score_min=0&d=1&laosiji_fc2=1'; }
   } catch {}
   return ''; },
  _isTopRankingShellUrl(href) {
   try {
    const url = new URL(href, location.href);
    return url.pathname.replace(/\/+$/, '') === '/advanced_search' && new URLSearchParams(url.search).get('laosiji_rank') === 'top';
   } catch {}
   return false; },
  _movieIdFromJavdbHref(href) {
   try {
    const url = new URL(href, location.href);
    if (!/javdb/i.test(url.hostname)) return '';
    const m = url.pathname.match(/^\/v\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : '';
   } catch {}
   return ''; },
  _isFc2ListContext() {
   const path = location.pathname.replace(/\/+$/, ''); const params = new URLSearchParams(location.search);
   if (path === '/advanced_search' && params.get('type') === '3') return true;
   const mode = this._getApiRankingShellMode();
   return mode?.mode === 'fc2'; },
  _isScriptFc2AdvancedSearch() {
   const path = location.pathname.replace(/\/+$/, '');
   if (path !== '/advanced_search') return false;
   const params = new URLSearchParams(location.search);
   return params.get('type') === '3' && params.get('laosiji_fc2') === '1'; },
  _hideScriptFc2AdvancedSearchBox() {
   if (!this._isScriptFc2AdvancedSearch()) return;
   document.documentElement.dataset.laosijiFc2AdvancedSearch = '1';
   JavdbApiShellStyles.installFc2AdvancedSearch(); },
  _fc2DetailShellUrlFromLink(link) {
   if (CFG.javdbUseNativePages) return '';
   const movieId = this._movieIdFromJavdbHref(link?.getAttribute?.('href') || link?.href || '');
   if (!movieId) return '';
   const text = link.closest?.('.item, .movie-list .item, .box')?.textContent || link.textContent || '';
   if (!this._isFc2ListContext() && !/FC2[-_]/i.test(text)) return '';
   return this._apiDetailShellUrl(movieId); },
  _nativeUrlFromApiShellHref(href) {
   try {
    const url = new URL(href, location.href);
    if (!/javdb/i.test(url.hostname)) return '';
    const path = url.pathname.replace(/\/+$/, ''); const params = new URLSearchParams(url.search);
    const page = Math.max(1, parseInt(params.get('lsj_page') || '1', 10) || 1);
    if (path !== '/advanced_search') return '';
    if (params.get('laosiji_detail') === 'fc2') {
     const movieId = params.get('movie_id') || '';
     return movieId ? `/v/${encodeURIComponent(movieId)}` : '';
    }
    if (params.get('laosiji_fc2') === '1') return '/fc2';
    const mode = params.get('laosiji_rank') || '';
    if (mode === 'top') {
     const native = new URL('/rankings/top', url.origin); const category = params.get('lsj_category') || 'all'; const year = params.get('lsj_year') || '';
     if (year) native.searchParams.set('t', `y${year}`);
     else if (category !== 'all') native.searchParams.set('t', category);
     if (page > 1) native.searchParams.set('page', String(page));
     return `${native.pathname}${native.search}`;
    }
    if (mode === 'fc2') {
     const native = new URL('/rankings/movies', url.origin);
     native.searchParams.set('t', 'fc2'); native.searchParams.set('p', params.get('lsj_period') || 'daily');
     if (page > 1) native.searchParams.set('page', String(page));
     return `${native.pathname}${native.search}`;
    }
    if (mode === 'playback') {
     const native = new URL('/rankings/playback', url.origin);
     native.searchParams.set('p', params.get('lsj_period') || 'daily'); native.searchParams.set('filter_by', params.get('lsj_filter_by') || 'high_score');
     if (page > 1) native.searchParams.set('page', String(page));
     return `${native.pathname}${native.search}`;
    }
   } catch {}
   return ''; },
  _rewriteFc2DetailLinks(root = document) {
   root.querySelectorAll?.('a[href*="/v/"]').forEach(link => {
    const shellUrl = this._fc2DetailShellUrlFromLink(link);
    if (!shellUrl) return;
    link.dataset.laosijiFc2DetailShell = '1'; link.href = shellUrl;
   }); },
  _redirectCurrentApiRankingEntry() {
   const shellUrl = this._apiRankingShellUrlFromHref(location.href);
   if (!shellUrl) return false;
   const currentPath = location.pathname.replace(/\/+$/, '');
   if (currentPath === '/advanced_search') return false;
   location.replace(shellUrl);
   return true; },
  _redirectCurrentNativeEntry() {
   const nativeUrl = this._nativeUrlFromApiShellHref(location.href);
   if (!nativeUrl) return false;
   location.replace(nativeUrl);
   return true; },
  _rewriteApiRankingLinks(root = document) {
   root.querySelectorAll?.('a[href]').forEach(link => {
    const shellUrl = this._apiRankingShellUrlFromHref(link.getAttribute('href'));
    if (!shellUrl) return;
    link.dataset.laosijiApiRankingShell = '1'; link.href = shellUrl;
   });
   this._rewriteFc2DetailLinks(root); },
  _installApiRankingShell() {
   if (document.documentElement.dataset.laosijiJavdbApiShell === '1') { this._rewriteApiRankingLinks(); return; }
   document.documentElement.dataset.laosijiJavdbApiShell = '1';
   document.addEventListener('click', e => {
    const link = e.target?.closest?.('a[href]');
    if (!link || e.defaultPrevented) return;
    const detailShellUrl = this._fc2DetailShellUrlFromLink(link);
    if (detailShellUrl) {
     link.href = detailShellUrl;
     if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || link.target === '_blank') return;
     e.preventDefault(); e.stopPropagation();
     location.href = detailShellUrl;
     return; }
    const shellUrl = this._apiRankingShellUrlFromHref(link.href);
    if (!shellUrl) return;
    link.href = shellUrl;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || link.target === '_blank') return;
    e.preventDefault(); e.stopPropagation();
    if (this._isTopRankingShellUrl(shellUrl) && !Magnet.javdbApi.token()) { openJavdbApiLoginDialog(shellUrl); return; }
    location.href = shellUrl;
   }, true);
   this._rewriteApiRankingLinks(); setTimeout(() => this._rewriteApiRankingLinks(), 500); setTimeout(() => this._rewriteApiRankingLinks(), 1500);
   if (document.body) { new MutationObserver(() => this._rewriteApiRankingLinks()).observe(document.body, { childList: true, subtree: true }); }
  },
  _getApiRankingShellMode() {
   const path = location.pathname.replace(/\/+$/, '');
   if (path !== '/advanced_search') return null;
   const params = new URLSearchParams(location.search); const mode = params.get('laosiji_rank') || '';
   if (!/^(top|fc2|playback)$/.test(mode)) return null;
   const legacyType = params.get('lsj_type') || ''; const legacyValue = params.get('lsj_type_value') || ''; let category = params.get('lsj_category') || '';
   let year = params.get('lsj_year') || '';
   if (!category && legacyType === 'video_type') category = legacyValue;
   if (!year && legacyType === 'year') year = legacyValue;
   if (!category) category = 'all';
   return {
    mode,
    params,
    page: Math.max(1, parseInt(params.get('lsj_page') || '1', 10) || 1),
    category,
    year,
    period: params.get('lsj_period') || 'daily',
    filterBy: params.get('lsj_filter_by') || 'high_score', }; }, };
 const JavdbApiRanking = {
  _ensureApiRankingShellStyle() { return JavdbApiShellStyles.installRankingShell(); },
  _renderApiRankingToolbar(modeInfo) {
   if (modeInfo.mode === 'top') {
    const items = [ ['all', '全部'], ['0', '有码'], ['1', '无码'], ['2', '欧美'], ['3', 'FC2'] ];
    const categoryLinks = items.map(([category, label]) => {
     const active = modeInfo.category === category;
     const href = this._apiRankingShellUrl('top', { category, year: modeInfo.year, page: 1 });
     return `<a class="${active ? 'is-active' : ''}" href="${href}">${label}</a>`;
    }).join('');
    const currentYear = new Date().getFullYear(); const allYearActive = !modeInfo.year;
    const allYearLink = `<a class="${allYearActive ? 'is-active' : ''}" href="${this._apiRankingShellUrl('top', { category: modeInfo.category, year: '', page: 1 })}">全部年份</a>`;
    const yearLinks = Array.from({ length: Math.max(0, currentYear - 2008 + 1) }, (_, i) => currentYear - i) .map(year => {
      const value = String(year); const active = modeInfo.year === value;
      const href = this._apiRankingShellUrl('top', { category: modeInfo.category, year: value, page: 1 });
      return `<a class="${active ? 'is-active' : ''}" href="${href}">${value}</a>`;
     }).join('');
    return `<div class="javdb-api-shell-toolbar-group"><span class="javdb-api-shell-toolbar-label">分类</span> ${categoryLinks} </div><div class="javdb-api-shell-toolbar-group"><span class="javdb-api-shell-toolbar-label">年份</span> ${allYearLink}${yearLinks} </div>`;
   }
   const items = [ ['daily', '日榜'], ['weekly', '周榜'], ['monthly', '月榜'] ];
   const periodLinks = items.map(([period, label]) => {
    const active = modeInfo.period === period;
    const href = this._apiRankingShellUrl(modeInfo.mode, {
     period,
     filterBy: modeInfo.filterBy,
     page: 1,
    });
    return `<a class="${active ? 'is-active' : ''}" href="${href}">${label}</a>`;
   }).join('');
   if (modeInfo.mode !== 'playback') return periodLinks;
   const filters = [ ['high_score', '高评分'] ];
   const filterLinks = filters.map(([filterBy, label]) => {
    const active = modeInfo.filterBy === filterBy;
    const href = this._apiRankingShellUrl('playback', {
     period: modeInfo.period,
     filterBy,
     page: 1,
    });
    return `<a class="${active ? 'is-active' : ''}" href="${href}">${label}</a>`;
   }).join('');
   return `<div class="javdb-api-shell-toolbar-group"><span class="javdb-api-shell-toolbar-label">周期</span> ${periodLinks} </div><div class="javdb-api-shell-toolbar-group"><span class="javdb-api-shell-toolbar-label">排序</span> ${filterLinks} </div>`;
  },
  _renderApiRankingPagination(modeInfo, hasNext) {
   const page = modeInfo.page;
   const href = nextPage => {
    if (modeInfo.mode === 'top') { return this._apiRankingShellUrl('top', { category: modeInfo.category, year: modeInfo.year, page: nextPage }); }
    if (modeInfo.mode === 'playback') { return this._apiRankingShellUrl('playback', { period: modeInfo.period, filterBy: modeInfo.filterBy, page: nextPage }); }
    return this._apiRankingShellUrl('fc2', { period: modeInfo.period, page: nextPage }); };
   const pages = modeInfo.mode === 'top'
    ? [1, 2, 3, 4, 5].map(item => `<a class="${item === page ? 'is-active' : ''}" href="${href(item)}">${item}</a>`).join('')
    : `<span>第 ${page} 页</span>`;
   return `<div class="javdb-api-shell-pagination"> ${page > 1 ? `<a href="${href(page - 1)}">上一页</a>` : ''}${pages}${hasNext ? `<a href="${href(page + 1)}">下一页</a>` : ''} </div>`;
  },
  _renderApiRankingMovies(movies) {
   const updateCover = value => String(value || '').replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
   return movies.map(raw => {
    const item = raw?.movie || raw; const title = item?.origin_title || item?.title || '';
    const score = item?.score ? `<span class="value">${this._escapeHtml(item.score)}分${item?.watched_count ? `, 由${this._escapeHtml(item.watched_count)}人評價` : ''}</span>` : '';
    const tags = [
     item?.has_cnsub ? '<span class="tag is-warning">中文字幕</span>' : '',
     Number(item?.magnets_count || 0) > 0 ? '<span class="tag is-success">含磁鏈</span>' : '',
     Number(item?.magnets_count || 0) <= 0 ? '<span class="tag">無磁鏈</span>' : '',
     item?.new_magnets ? '<span class="tag is-info">今日新種</span>' : '',
    ].filter(Boolean).join('');
    const href = /^FC2[-_]/i.test(String(item?.number || '')) ? this._apiDetailShellUrl(item?.id || '')
     : `/v/${this._escapeHtml(item?.id || '')}`;
    return `<div class="item" data-javdb-api-shell-item="1"><a href="${this._escapeHtml(href)}" class="box" title="${this._escapeHtml(title)}"><div class="cover "><img loading="lazy" src="${this._escapeHtml(updateCover(item?.cover_url || item?.thumb_url || ''))}" alt=""></div><div class="video-title"><strong>${this._escapeHtml(item?.number || '')}</strong> ${this._escapeHtml(title)}</div><div class="score">${score}</div><div class="meta">${this._escapeHtml(item?.release_date || '')}</div><div class="tags has-addons">${tags}</div></a></div>`;
   }).join(''); },
  async _initApiRankingShellPage() {
   const modeInfo = this._getApiRankingShellMode();
   if (!modeInfo) return false;
   const container = document.querySelector('body > section > div, .section .container');
   if (!container) return false;
   this._ensureApiRankingShellStyle();
   const title = modeInfo.mode === 'top' ? 'Top250' : modeInfo.mode === 'playback' ? '热播' : 'FC2 排行榜';
   container.innerHTML = `<div class="javdb-api-shell"><div class="javdb-api-shell-head"><div class="javdb-api-shell-title"> ${title} </div></div><div class="javdb-api-shell-toolbar"> ${this._renderApiRankingToolbar(modeInfo)} </div><div class="javdb-api-shell-status">正在加载 API 数据...</div><div class="movie-list h cols-4 vcols-8"></div><div class="javdb-api-shell-pagination-wrap"></div></div>`;
   const status = container.querySelector('.javdb-api-shell-status'); const list = container.querySelector('.movie-list');
   const pagination = container.querySelector('.javdb-api-shell-pagination-wrap');
   try {
    let json;
    if (modeInfo.mode === 'top') {
     if (!Magnet.javdbApi.token()) { renderJavdbApiLoginRequired(status); scheduleJavdbApiLoginDialog(location.href); return true; }
     json = await Magnet.javdbApi.top250({
      category: modeInfo.category,
      year: modeInfo.year,
      page: modeInfo.page,
      limit: 50,
     });
    } else if (modeInfo.mode === 'playback') {
     json = await Magnet.javdbApi.playback({
      period: modeInfo.period,
      filterBy: modeInfo.filterBy,
      page: modeInfo.page,
      limit: 40,
     });
    } else {
     json = await Magnet.javdbApi.fc2({
      period: modeInfo.period,
      page: modeInfo.page,
      limit: 40,
     }); }
    if (json.success !== 1) throw new Error(json.message || json.action || 'JavDB API 请求失败');
    const movies = Array.isArray(json?.data?.movies) ? json.data.movies : [];
    if (!movies.length) { status.textContent = '没有查询到数据。'; return true; }
    const total = Number(json?.data?.total || 0);
    list.innerHTML = this._renderApiRankingMovies(movies);
    status.textContent = total ? `已加载 ${movies.length} 条数据，共 ${total} 条匹配` : `已加载 ${movies.length} 条数据`;
    const hasNext = modeInfo.mode === 'top' ? modeInfo.page < 5 : (total ? modeInfo.page * 40 < total : movies.length >= 40);
    pagination.innerHTML = this._renderApiRankingPagination(modeInfo, hasNext);
    this._initListPage(); PageZoom.apply('javdb'); Runtime.refreshListPage();
    return true;
   } catch (err) {
    errorLog('JavDB API 榜单请求失败:', err);
    if (isJavdbApiAuthError(err)) {
     Magnet.javdbApi.setToken(''); renderJavdbApiLoginRequired(status, 'JavDB API 登录状态已失效，请重新登录一次。');
     delete document.documentElement.dataset.laosijiJavdbApiLoginPrompted;
     scheduleJavdbApiLoginDialog(location.href);
     return true; }
    status.classList.add('is-error');
    status.textContent = err.message || 'JavDB API 请求失败';
    return true; } }, };
 const JavdbFc2DetailRenderer = (() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
   '&': '&amp;',
   '<': '&lt;',
   '>': '&gt;',
   '"': '&quot;',
   "'": '&#39;',
  }[ch]));
  function installStyles() {
   injectStyle('javdb-fc2-detail-renderer-style',`.javdb-123av-fc2-unified-detail,.javdb-123av-fc2-detail-shell{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0!important;padding:0!important;color:#1f2937!important;font-family:Arial,sans-serif!important;font-size:16px!important;line-height:1.5!important}.javdb-123av-fc2-unified-detail .javdb-api-detail-title{margin:0 0 12px!important;color:#363636!important;font-size:1.5rem!important;line-height:1.25!important;overflow-wrap:anywhere!important}.javdb-123av-fc2-unified-detail[data-laosiji-123av-fc2-detail-site="javbus"]{padding-top:16px!important}.javdb-123av-fc2-unified-detail[data-laosiji-123av-fc2-detail-site="javbus"] .javdb-api-detail-title{margin:0 0 16px!important;font-size:20px!important;line-height:1.45!important}.javdb-123av-fc2-unified-detail .javdb-123av-fc2-overview{width:100%!important;max-width:100%!important;min-width:0!important;padding:8px!important;border:1px solid #dbdbdb!important;border-radius:7px!important;background:#fff!important;box-shadow:0 .5em 1em -.125em rgba(10,10,10,.08),0 0 0 1px rgba(10,10,10,.02)!important;box-sizing:border-box!important;overflow:hidden!important}.javdb-123av-fc2-unified-detail .jav-flex-container{display:flex!important;align-items:flex-start!important;gap:20px!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:16px 0 0!important;padding:0!important;box-sizing:border-box!important}.javdb-123av-fc2-unified-detail .jav-flex-container>.column-video-cover{flex:var(--jav-detail-cover-flex,1.35) 1 0!important;width:auto!important;max-width:none!important;min-width:0!important;padding:.75rem!important;box-sizing:border-box!important}.javdb-123av-fc2-unified-detail .jav-flex-container>.column-video-info{flex:var(--jav-detail-info-flex,1.05) 1 0!important;width:auto!important;max-width:none!important;min-width:0!important;padding:.75rem!important;overflow:hidden!important;word-break:break-word!important;box-sizing:border-box!important}.javdb-123av-fc2-unified-detail .column-video-cover>a,.javdb-123av-fc2-unified-detail .column-video-cover .video-cover{display:block!important;width:100%!important;height:auto!important;max-width:100%!important;box-sizing:border-box!important}.javdb-123av-fc2-unified-detail .movie-panel-info{display:block!important;width:100%!important;max-width:100%!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important;box-sizing:border-box!important}.javdb-123av-fc2-unified-detail .movie-panel-info .panel-block{display:flex!important;align-items:center!important;justify-content:flex-start!important;min-height:40px!important;padding:.5em .75em!important;border-bottom:1px solid #ededed!important;color:#363636!important;font-size:16px!important;line-height:1.5!important;box-sizing:border-box!important}.javdb-123av-fc2-unified-detail .movie-panel-info .panel-block:last-child{border-bottom:0!important}.javdb-123av-fc2-unified-detail .movie-panel-info .panel-block>strong,.javdb-123av-fc2-unified-detail .movie-panel-info .panel-block .value{font-size:16px!important;line-height:1.5!important}.javdb-123av-fc2-unified-detail .movie-panel-info .panel-block>strong{flex:0 0 auto!important;color:#363636!important}.javdb-123av-fc2-unified-detail .movie-panel-info .panel-block .value{min-width:0!important;overflow-wrap:anywhere!important}.javdb-fc2-detail-samples-section,.javdb-fc2-detail-magnet{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-top:20px!important;overflow:visible!important}.javdb-fc2-detail-sample-heading,.javdb-fc2-detail-magnet-title{margin:0 0 12px!important;color:#0f172a!important;font-size:17px!important;font-weight:900!important}.javdb-fc2-detail-magnet-body{width:100%!important;min-width:0!important}.javdb-fc2-detail-magnet-body>.jav-nong-wrapper{max-width:100%!important}.javdb-123av-fc2-detail-chip{display:inline-block!important;margin:0 5px 4px 0!important;padding:2px 7px!important;border-radius:4px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:12px!important}.javdb-123av-fc2-detail-empty{color:#94a3b8!important;font-size:12px!important}html[data-theme="dark"] .javdb-123av-fc2-unified-detail{color:#e5e7eb!important}html[data-theme="dark"] .javdb-123av-fc2-unified-detail .javdb-api-detail-title,html[data-theme="dark"] .javdb-123av-fc2-unified-detail .movie-panel-info .panel-block>strong,html[data-theme="dark"] .javdb-fc2-detail-sample-heading,html[data-theme="dark"] .javdb-fc2-detail-magnet-title{color:#f8fafc!important}html[data-theme="dark"] .javdb-123av-fc2-unified-detail .javdb-123av-fc2-overview{border-color:#475569!important;background:#252525!important}html[data-theme="dark"] .javdb-123av-fc2-unified-detail .movie-panel-info .panel-block{border-color:#3f3f46!important;color:#e5e7eb!important}@media (max-width:768px){.javdb-123av-fc2-unified-detail .jav-flex-container{display:block!important;margin-top:0!important}.javdb-123av-fc2-unified-detail .jav-flex-container>.column-video-cover,.javdb-123av-fc2-unified-detail .jav-flex-container>.column-video-info{width:100%!important;max-width:100%!important;padding:.75rem 0!important}.javdb-123av-fc2-unified-detail[data-laosiji-123av-fc2-detail-site="javbus"]{padding-top:12px!important}.javdb-123av-fc2-unified-detail[data-laosiji-123av-fc2-detail-site="javbus"] .javdb-api-detail-title{font-size:18px!important;line-height:1.45!important}}`);
  }
  function render(detail, { site = 'javdb', samplesHtml = '' } = {}) {
   const rows = Array.isArray(detail.rows) ? detail.rows : [];
   const rowsHtml = rows.filter(row => row && (row.html || row.value)).map(row => `<div class="panel-block"><strong>${escapeHtml(row.label)}:</strong>&nbsp;<span class="value">${row.html || escapeHtml(row.value)}</span></div>`).join('');
   const tags = Array.isArray(detail.tags) && detail.tags.length
    ? `<div class="panel-block"><strong>标签:</strong>&nbsp;<span class="value">${detail.tags.map(tag => `<span class="javdb-123av-fc2-detail-chip">${escapeHtml(tag)}</span>`).join('')}</span></div>`
    : '';
   const cover = detail.cover
    ? `<a data-fancybox="gallery" href="${escapeHtml(detail.cover)}"><img src="${escapeHtml(detail.cover)}" class="video-cover" alt="${escapeHtml(detail.title)}"></a>`
    : '<span class="javdb-123av-fc2-detail-empty">未找到封面</span>';
   return `<div class="video-detail javdb-api-detail javdb-123av-fc2-unified-detail" data-javdb-api-detail="1" data-laosiji-code="${escapeHtml(detail.code)}" data-laosiji-123av-fc2-detail-site="${escapeHtml(site)}"><h2 class="title is-4 javdb-api-detail-title" data-laosiji-code="${escapeHtml(detail.code)}"><strong>${escapeHtml(detail.code)}</strong><span class="javdb-api-detail-title-separator" aria-hidden="true"> - </span><strong class="current-title">${escapeHtml(detail.title)}</strong></h2><div class="javdb-123av-fc2-overview"><div class="columns is-desktop jav-flex-container" data-laosiji-123av-fc2-layout-site="${escapeHtml(site)}"><div class="column column-video-cover">${cover}</div><div class="column column-video-info"><nav class="panel movie-panel-info"><div class="panel-block first-block"><strong>番号:</strong>&nbsp;<span class="value">${escapeHtml(detail.code)}</span></div> ${rowsHtml}${tags} </nav></div></div></div> ${samplesHtml} <section class="javdb-fc2-detail-magnet"><h2 class="javdb-fc2-detail-magnet-title">磁力聚合</h2><div class="javdb-fc2-detail-magnet-body"></div></section></div>`;
  }
  return { installStyles, render, escapeHtml };
 })();
 Core.expose('__LAOSIJI_FC2_DETAIL_RENDERER__', JavdbFc2DetailRenderer);
 const JavdbApiDetail = {
  _ensureApiDetailShellStyle() {
   JavdbFc2DetailRenderer.installStyles();
   return JavdbApiShellStyles.installDetailShell(); },
  _mountStandaloneMagnet(root, avid, siteId = 'javdb') {
   const body = root?.querySelector?.('.javdb-fc2-detail-magnet-body');
   if (!body || !avid || typeof Magnet === 'undefined') return null;
   const useEnhancedPanel = CFG.magnetDisplayMode === 'native-replace' && typeof NativeMagnetPanel !== 'undefined'
    && typeof NativeMagnetPanel.createAggregatePanel === 'function';
   const widget = useEnhancedPanel ? NativeMagnetPanel.createAggregatePanel(avid) : typeof Magnet.createMagnetWidget === 'function'
     ? Magnet.createMagnetWidget(avid) : null;
   if (!widget) return null;
   body.replaceChildren(widget);
   const section = useEnhancedPanel ? widget : body.closest('.javdb-fc2-detail-magnet');
   section?.setAttribute('data-javdb-standalone-magnet', '1'); section?.setAttribute('data-javdb-standalone-magnet-site', siteId);
   DetailFlex.apply?.(siteId);
   setTimeout(() => DetailFlex.apply?.(siteId), 0);
   return body.firstElementChild; },
  _renderApiDetailImages(images) {
   const list = Array.isArray(images) ? images : Array.isArray(images?.items) ? images.items : [];
   const updateCover = value => String(value || '').replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
   const html = list.map((item, index) => {
    const large = updateCover(typeof item === 'string' ? item
     : item?.large_url || item?.largeUrl || item?.image_url || item?.url || item?.src || item?.thumb_url || item?.thumbUrl || '');
    const thumb = updateCover(typeof item === 'string' ? item
     : item?.thumb_url || item?.thumbUrl || item?.thumbnail_url || item?.thumbnailUrl || item?.large_url || item?.largeUrl || item?.image_url || item?.url || item?.src || '');
    if (!large || !thumb) return '';
    return`<a class="tile-item" href="${JavdbFc2DetailRenderer.escapeHtml(large)}" data-fancybox="gallery" data-caption="预览图${index + 1}"><img src="${JavdbFc2DetailRenderer.escapeHtml(thumb)}" loading="lazy" alt="预览图${index + 1}"></a>`;
   }).filter(Boolean).join('');
   return html ?`
                <section class="javdb-fc2-detail-samples-section">
                    <h2 class="javdb-fc2-detail-sample-heading">剧照</h2>
                    <div class="tile-images preview-images">${html}</div>
                </section>` : '';
  },
  _renderApiDetailPage(movie) {
   const updateCover = value => String(value || '').replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
   const number = String(movie?.number || ''); const title = movie?.origin_title || movie?.title || '';
   const actors = (Array.isArray(movie?.actors) ? movie.actors : []).map(item => item?.name || item).filter(Boolean);
   const cover = updateCover(movie?.cover_url || movie?.thumb_url || '');
   const previewImages = movie?.preview_images || movie?.previewImages || movie?.samples || movie?.images || [];
   return JavdbFc2DetailRenderer.render({
    code: number,
    title,
    cover,
    rows: [
     { label: '标题', value: title },
     { label: '日期', value: movie?.release_date },
     { label: '时长', value: movie?.duration ?`${movie.duration} 分钟` : '' },
     { label: '评分', value: movie?.score ?`${movie.score} / ${movie?.watched_count || 0} 人` : '' },
     { label: '片商', value: movie?.maker_name || movie?.publisher_name },
     { label: '系列', value: movie?.series_name },
     { label: '导演', value: movie?.director_name },
     { label: '演员', value: actors }, ],
    tags: (Array.isArray(movie?.tags) ? movie.tags : []).map(item => item?.name || item?.title || item).filter(Boolean),
   }, {
    site: 'javdb',
    samplesHtml: this._renderApiDetailImages(previewImages),
   }); },
  async _initApiDetailShellPage() {
   const modeInfo = this._getApiDetailShellMode();
   if (!modeInfo) return false;
   const container = document.querySelector('body > section > div, .section .container');
   if (!container) return false;
   this._ensureApiDetailShellStyle();
   container.innerHTML = '<div class="javdb-api-shell-status">正在加载 API 详情...</div>';
   const status = container.querySelector('.javdb-api-shell-status');
   try {
    const json = await Magnet.javdbApi.movieDetail(modeInfo.movieId);
    if (json.success !== 1) throw new Error(json.message || json.action || 'JavDB API 请求失败');
    const movie = json?.data?.movie;
    if (!movie?.number) throw new Error('没有查询到详情数据');
    container.innerHTML = this._renderApiDetailPage(movie);
    const avid = normalizeAvid(movie.number); const numberLabel = container.querySelector('.movie-panel-info .first-block strong');
    if (numberLabel) numberLabel.textContent = '\u756a\u53f7:';
    const magnetTitle = container.querySelector('.javdb-fc2-detail-magnet-title');
    if (magnetTitle) magnetTitle.textContent = '\u78c1\u529b\u805a\u5408';
    this._mountStandaloneMagnet(container, avid); PageZoom.apply('javdb'); DetailFlex.apply('javdb');
    Runtime.refresh({ detailPreview: true, infiniteScroll: false });
    return true;
   } catch (err) {
    errorLog('JavDB API 详情请求失败:', err); status.classList.add('is-error');
    status.textContent = err.message || 'JavDB API 详情请求失败';
    return true; } }, };
 const JavdbList = {
  _initListPage() {
   this._stripNativeLayoutParam();
   const list = document.querySelector('.movie-list, .movies, .grid');
   if (!list) return;
   this._neutralizeNativeListLayout(list);
   const needStyle = list.dataset.laosijiGrid !== '1'; const cards = [...list.querySelectorAll(':scope > .item:not([data-laosiji-grid-card="1"])')];
   if (!cards.length && !needStyle) { JavdbListScoreSort.sync(list); return; }
   list.dataset.laosijiGrid = '1';
   list.classList.add('jav-card-grid', 'javdb-card-grid'); CardColumns.apply('javdb'); cards.forEach(card => this._decorateCard(card));
   JavdbListScoreSort.sync(list, cards); this._rewriteFc2DetailLinks(list); PortraitCards.syncImages();
   if (needStyle) {
    GM_addStyle(`.jav-card-link:visited .jav-card-title,.jav-card-link:visited .javdb-card-headline,.jav-card-link:visited .jav-card-title strong{color:#64748b!important}.jav-card-title{display:block!important;height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;max-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;flex:0 0 auto!important;min-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;padding:7px 8px 9px!important;overflow:hidden!important;line-height:var(--jav-card-title-line-height,1.5)!important}.javdb-card-headline{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:var(--jav-card-title-lines,2)!important;line-clamp:var(--jav-card-title-lines,2)!important;max-height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:normal!important;word-break:break-word!important}.jav-card-title strong{color:inherit!important;font-size:16px!important;font-weight:800!important}.javdb-card-grid{--jav-card-columns:5}.javdb-card-grid .item.javdb-grid-card{position:static!important;width:auto!important;float:none!important;margin:0!important}.javdb-card-grid .item .javdb-card-link.box{width:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important}.javdb-card-grid .item .javdb-cover-frame.cover{margin:0!important;height:auto!important}.javdb-card-grid .item .javdb-card-image{height:100%!important;margin:0!important}.javdb-card-grid .item .javdb-card-title .jav-pan115-badge{display:inline-flex!important;width:auto!important;max-width:max-content!important;float:none!important;vertical-align:middle!important;margin:0 6px 4px 0!important}.javdb-card-score,.javdb-card-meta,.javdb-card-tags{padding-left:8px!important;padding-right:8px!important}.javdb-card-score{margin-top:2px!important;color:#64748b!important;font-size:12px!important;line-height:1.45!important}.javdb-card-score .value{color:inherit!important;font-size:inherit!important}.javdb-card-meta{margin-top:4px!important;color:#94a3b8!important;font-size:12px!important;line-height:1.45!important}.javdb-card-tags{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:auto!important;padding-top:8px!important;padding-bottom:10px!important}.javdb-card-tags .tag{margin:0!important}@media (max-width:1100px){.javdb-card-grid{--jav-card-columns:4}}@media (max-width:820px){.javdb-card-grid{--jav-card-columns:3}}@media (max-width:560px){.javdb-card-grid{--jav-card-columns:2;gap:10px!important}}`);
   }
   setTimeout(() => {
    Runtime.refreshListPage();
   }, 0); },
  _neutralizeNativeListLayout(list) {
   if (!list) return;
   [...list.classList].forEach(name => {
    if (/^(?:cols-|vcols-|h$|v$)/i.test(name)) list.classList.remove(name);
   }); },
  _repairCardStructure(card) {
   if (!card) return;
   const anchor = card.querySelector(':scope > a.box[href], :scope > a[href].box');
   if (!anchor || anchor.querySelector('.cover, .video-title')) return;
   const moveSelectors = ['.cover', '.video-title', '.score', '.meta', '.tags']; let moved = false;
   moveSelectors.forEach(selector => {
    const node = card.querySelector(`:scope > ${selector}`);
    if (!node) return;
    node.querySelectorAll('.emby-badge, .emby-btn, .emby-button-group').forEach(el => el.remove()); anchor.appendChild(node);
    moved = true;
   });
   if (moved) {
    anchor.querySelectorAll('a[href]').forEach(child => {
     if (child === anchor) return;
     child.replaceWith(...child.childNodes);
    }); } },
  _decorateCard(card) {
   if (!card) return;
   this._repairCardStructure(card);
   if (card.dataset.laosijiGridCard !== '1') { card.dataset.laosijiGridCard = '1'; card.classList.add('jav-card', 'javdb-grid-card'); }
   const anchor = card.querySelector(':scope > a.box[href], :scope > a[href].box, a.box[href]');
   anchor?.classList.add('jav-card-link', 'javdb-card-link');
   if (anchor && !anchor.querySelector('.jav-pan115-badge')) { delete anchor.dataset.pan115Checked; delete anchor.dataset.pan115HasBadge; }
   const cover = card.querySelector('.cover');
   cover?.classList.add('jav-card-cover', 'javdb-cover-frame');
   const img = cover?.querySelector('img[src]') || card.querySelector('img[src]');
   if (img) {
    img.removeAttribute('width'); img.removeAttribute('height'); img.classList.add('jav-card-image', 'javdb-card-image');
    const src = img.getAttribute('src') || '';
    if (/\/covers\//i.test(src)) {
     img.dataset.laosijiLandscapeSrc = img.dataset.laosijiLandscapeSrc || src;
    } else if (/\/thumbs\//i.test(src)) {
     img.dataset.laosijiLandscapeSrc = img.dataset.laosijiLandscapeSrc || src.replace(/\/thumbs\//i, '/covers/');
    } }
   const titleEl = card.querySelector('.video-title');
   titleEl?.classList.add('jav-card-title', 'javdb-card-title');
   if (titleEl && !titleEl.querySelector('.javdb-card-headline')) {
    const headline = document.createElement('span');
    headline.className = 'javdb-card-headline';
    while (titleEl.firstChild) headline.appendChild(titleEl.firstChild);
    titleEl.appendChild(headline); }
   const scoreEl = card.querySelector('.score');
   scoreEl?.classList.add('javdb-card-score');
   const metaEl = card.querySelector('.meta');
   metaEl?.classList.add('javdb-card-meta');
   const tagsEl = card.querySelector('.tags');
   tagsEl?.classList.add('javdb-card-tags'); ListPreview.attach(card); }, };
 const JavdbListScoreSort = (() => {
  const states = new WeakMap();
  const loadedReorderControls = [ { key: 'score', text: '评分', compare: compareScores }, { key: 'votes', text: '评价', compare: compareVotes } ];
  function stateFor(list) {
   let state = states.get(list);
   if (!state) {
    state = { mode: '', nextOrder: 0, originalOrder: new WeakMap() };
    states.set(list, state); }
   return state; }
  function listCards(list) { return [...list.querySelectorAll(':scope > .item')]; }
  function rememberOrder(state, cards) {
   cards.forEach(card => {
    if (!state.originalOrder.has(card)) { state.originalOrder.set(card, state.nextOrder); state.nextOrder += 1; }
   }); }
  function scoreData(card) {
   const scoreText = card.querySelector('.javdb-card-score, .score')?.textContent || '';
   const metaText = card.querySelector('.javdb-card-meta, .meta')?.textContent || ''; const rating = Number(scoreText.match(/(\d+(?:\.\d+)?)\s*分/)?.[1]);
   const votes = Number((scoreText.match(/(?:由|by\s*)([\d,]+)\s*(?:人(?:评价|評價)|ratings?)/i)?.[1] || '').replace(/,/g, ''));
   const dateText = metaText.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
   const date = Date.parse(dateText) || 0;
   return { rating: Number.isFinite(rating) ? rating : -1, votes: Number.isFinite(votes) ? votes : 0, date }; }
  function compareScores(state, left, right) {
   const leftScore = scoreData(left); const rightScore = scoreData(right);
   return rightScore.rating - leftScore.rating || rightScore.votes - leftScore.votes || rightScore.date - leftScore.date
    || (state.originalOrder.get(left) || 0) - (state.originalOrder.get(right) || 0); }
  function compareVotes(state, left, right) {
   const leftScore = scoreData(left); const rightScore = scoreData(right);
   return rightScore.votes - leftScore.votes || rightScore.rating - leftScore.rating || rightScore.date - leftScore.date
    || (state.originalOrder.get(left) || 0) - (state.originalOrder.get(right) || 0); }
  function activeControl(mode) { return loadedReorderControls.find(control => control.key === mode) || null; }
  function reorder(list, cards, compare) {
   const sorted = [...cards].sort(compare); const fragment = document.createDocumentFragment();
   sorted.forEach(card => fragment.appendChild(card)); list.appendChild(fragment); }
  function findNativeSortButtons(list) {
   const roots = [list.closest('main, section, body'), document].filter(Boolean);
   const isListSortGroup = item => item.querySelector('a[href*="vst=1"], a[href*="lst="]');
   for (const root of roots) {
    const buttons = [...root.querySelectorAll('.toolbar .button-group .buttons.has-addons')] .find(isListSortGroup);
    if (buttons) return buttons;
   }
   return null; }
  function findToolbar(list) {
   const roots = [list.closest('main, section, body'), document].filter(Boolean);
   for (const root of roots) {
    const toolbar = root.querySelector('.toolbar');
    if (toolbar) return toolbar;
   }
   return null; }
  function ensureSortButtons(list) {
   const nativeButtons = findNativeSortButtons(list);
   if (nativeButtons) return nativeButtons;
   const toolbar = findToolbar(list);
   if (!toolbar) return null;
   let group = toolbar.querySelector('[data-laosiji-score-sort-group="1"]');
   if (!group) {
    group = document.createElement('div'); group.className = 'button-group'; group.dataset.laosijiScoreSortGroup = '1';
    group.innerHTML = '<div class="buttons has-addons"></div>';
    toolbar.appendChild(group); }
   return group.querySelector('.buttons.has-addons'); }
  function updateButton(button, active, mode) {
   button.classList.toggle('is-selected', active); button.setAttribute('aria-pressed', String(active));
   button.title = active
    ?`当前已按${mode}排序；再次点击恢复网站顺序`                :`按${mode}排序当前页；无限滚动的新内容仅在本批内排序`;
  }
  function canReorderLoaded(list, state) {
   return !!state.mode && InfiniteScroll?.state?.site === 'javdb' && InfiniteScroll.state.container === list
    && !!list.querySelector(':scope > .item[data-laosiji-infinite-item="1"]'); }
  function syncLoadedReorderControl(list, state) {
   let button = document.querySelector('[data-laosiji-reorder-loaded]'); const floatButtons = document.querySelector('.float-buttons');
   if (!canReorderLoaded(list, state) || !floatButtons) { button?.remove(); return; }
   if (!button) {
    button = document.createElement('button'); button.type = 'button'; button.className = 'javdb-loaded-reorder-btn'; button.dataset.laosijiReorderLoaded = '1';
    button.textContent = '重排已加载内容';
    button.addEventListener('click', () => {
     const control = activeControl(state.mode);
     if (!control) return;
     const cards = listCards(list);
     rememberOrder(state, cards); reorder(list, cards, (left, right) => control.compare(state, left, right));
     const top = Math.max(0, window.scrollY + list.getBoundingClientRect().top - 12);
     window.scrollTo({ top, behavior: 'auto' });
    }); }
   const control = activeControl(state.mode);
   floatButtons.insertBefore(button, floatButtons.querySelector('.material-scrolltop'));
   button.title =`按${control?.text || '当前'}排序重排所有已加载内容，并返回列表顶部`;
  }
  function installControl(list, state) {
   const buttons = ensureSortButtons(list);
   if (!buttons) return;
   const controls = [ { key: 'score', text: '评分排序', compare: compareScores }, { key: 'votes', text: '评价排序', compare: compareVotes } ];
   const controlButtons = controls.map(control => {
    let button = buttons.querySelector(`[data-laosiji-${control.key}-sort]`);
    if (!button) {
     button = document.createElement('button'); button.type = 'button';
     button.className =`button is-small is-primary javdb-${control.key}-sort-btn`;
     button.dataset[`laosiji${control.key[0].toUpperCase()}${control.key.slice(1)}Sort`] = '1';
    button.textContent = control.text;
    button.addEventListener('click', event => {
     event.preventDefault(); event.stopPropagation();
     state.mode = state.mode === control.key ? '' : control.key;
     const cards = listCards(list);
     rememberOrder(state, cards);
     if (state.mode) {
      const activeControl = controls.find(item => item.key === state.mode);
      reorder(list, cards, (left, right) => activeControl.compare(state, left, right));
     } else {
      reorder(list, cards, (left, right) => { return (state.originalOrder.get(left) || 0) - (state.originalOrder.get(right) || 0); }); }
     controlButtons.forEach(({ button: item, control: itemControl }) => { updateButton(item, state.mode === itemControl.key, itemControl.text); });
     syncLoadedReorderControl(list, state);
    });
    buttons.appendChild(button); }
    return { button, control };
   });
   controlButtons.forEach(({ button, control }) => { updateButton(button, state.mode === control.key, control.text); }); }
  function sync(list, incomingCards = []) {
   if (!list?.matches('.javdb-card-grid')) return;
   const state = stateFor(list); const incoming = [...incomingCards].filter(card => card?.parentElement === list);
   rememberOrder(state, incoming.length ? incoming : listCards(list)); installControl(list, state); syncLoadedReorderControl(list, state);
   if (state.mode && incoming.length) {
    const compare = state.mode === 'score' ? compareScores : compareVotes;
    reorder(list, incoming, (left, right) => compare(state, left, right)); } }
  return { sync };
 })();
 const Javdb123AvFc2 = (() => {
  const BASE_URL = 'https://123av.com';
  const ROUTE_KEY = 'laosiji_123av_fc2'; const DETAIL_KEY = 'laosiji_123av_fc2_detail';
  const LEGACY_SORTS = { recent: { label: '最近更新', source: '' }, today: { label: '今日发布', source: 'today' }, hot: { label: '热门', source: 'week' } };
  const TYPES = [
   { value: '', label: '\u5168\u90e8' },
   { value: 'censored', label: '\u6709\u7801' },
   { value: 'uncensored', label: '\u65e0\u7801' },
   { value: 'uncensored-leaked', label: '\u65e0\u7801\u6cc4\u9732' }, ];
  const ACTRESS_MODES = [ { value: '', label: '\u5168\u90e8' }, { value: 'single', label: '\u5355\u4eba' }, { value: 'multi', label: '\u591a\u4eba' } ];
  const SORTS = {
   release_date: { label: '\u53d1\u5e03\u65e5\u671f' },
   recent: { label: '\u6700\u8fd1\u6dfb\u52a0' },
   hot: { label: '\u70ed\u95e8' },
   today: { label: '\u4eca\u65e5\u89c2\u770b' },
   week: { label: '\u6bcf\u5468\u89c2\u770b' },
   month: { label: '\u6bcf\u6708\u89c2\u770b' },
   views: { label: '\u6700\u53d7\u6b22\u8fce' },
   follows: { label: '\u6700\u591a\u5173\u6ce8' },
   longest: { label: '\u6700\u957f' }, };
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from( { length: Math.max(0, CURRENT_YEAR - 2000 + 1) }, (_, index) => String(CURRENT_YEAR - index) );
  const CACHE_PREFIX = 'javdb_123av_fc2_cache_v3_'; const CACHE_TTL = 90 * 1000; const activeRequests = new Set(); let renderGeneration = 0;
  function installEarlyJavlibMask() {
   try {
    const url = new URL(location.href); const isJavLib = /(?:javlibrary|javlib|r86m|s87n)/i.test(url.hostname); const isJavBus = /javbus/i.test(url.hostname);
    const isJavDb = /javdb/i.test(url.hostname); const isRoute = url.searchParams.get(ROUTE_KEY) === '1';
    if ((!isJavLib && !isJavBus && !isJavDb) || (!isJavLib && !isRoute)) return;
    const style = document.createElement('style');
    style.id = '123av-fc2-early-mask';
    style.textContent = isJavLib ? isRoute ? '#rightcolumn{visibility:hidden!important}#leftmenu{display:none!important;visibility:hidden!important}'
      : '#leftmenu{display:none!important;visibility:hidden!important}' : isJavDb ? 'body > section{visibility:hidden!important}'
      : '#waterfall{visibility:hidden!important}.pagination{visibility:hidden!important}';
    (document.head || document.documentElement).appendChild(style);
   } catch {
   } }
  installEarlyJavlibMask();
  function escapeHtml(value) {
   return SiteJavDB?._escapeHtml?.(value) || String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
   }[ch])); }
  function parseRoute(href = location.href) {
   try {
    const url = new URL(href, location.href); const params = url.searchParams;
    if (!/(?:jav(?:db|bus|library|lib)|r86m|s87n)/i.test(url.hostname) || params.get(ROUTE_KEY) !== '1') return null;
    const type = TYPES.some(item => item.value === params.get('laosiji_type')) ? params.get('laosiji_type') : '';
    const year = YEARS.includes(params.get('laosiji_year')) ? params.get('laosiji_year') : '';
    const actress = ACTRESS_MODES.some(item => item.value === params.get('laosiji_actress')) ? params.get('laosiji_actress') : '';
    const sort = SORTS[params.get('laosiji_sort')] ? params.get('laosiji_sort') : 'release_date';
    const detail = String(params.get(DETAIL_KEY) || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    return {
     page: Math.max(1, parseInt(params.get('laosiji_page') || '1', 10) || 1),
     query: (params.get('laosiji_query') || '').trim(),
     type,
     year,
     actress,
     sort, ...(detail ? { detail } : {}), };
   } catch { return null; } }
  function routeUrl(next = {}) {
   const params = new URLSearchParams();
   params.set(ROUTE_KEY, '1');
   const query = String(next.query ?? '').trim(); const type = TYPES.some(item => item.value === next.type) ? next.type : '';
   const year = YEARS.includes(String(next.year || '')) ? String(next.year) : '';
   const actress = ACTRESS_MODES.some(item => item.value === next.actress) ? next.actress : ''; const sort = SORTS[next.sort] ? next.sort : 'release_date';
   const page = Math.max(1, parseInt(next.page || '1', 10) || 1); const detail = String(next.detail || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
   if (query) params.set('laosiji_query', query);
   if (type) params.set('laosiji_type', type);
   if (year) params.set('laosiji_year', year);
   if (actress) params.set('laosiji_actress', actress);
   if (sort !== 'release_date') params.set('laosiji_sort', sort);
   if (page > 1) params.set('laosiji_page', String(page));
   if (detail) params.set(DETAIL_KEY, detail);
   const host = location.hostname || ''; const path = /javbus/i.test(host) ? '/' : /(?:javlibrary|javlib|r86m|s87n)/i.test(host) ? '/cn/main.php' : '/';
   return `${path}?${params.toString()}`;
  }
  function sourceUrl(route, sourcePage = route.page) {
   const url = new URL(route.query ? '/cn/search' : '/cn/makers/fc2', BASE_URL);
   if (route.query) url.searchParams.set('keyword', route.query);
   url.searchParams.set('page', String(Math.max(1, sourcePage))); url.searchParams.set('type', route.type || '');
   url.searchParams.set('year', route.year || ''); url.searchParams.set('actress', route.actress || '');
   url.searchParams.set('sort', route.sort || 'release_date');
   return url.href; }
  function renderOptions(items, selected) {
   return items.map(item => `<option value="${escapeHtml(item.value)}"${item.value === selected ? ' selected' : ''}>${escapeHtml(item.label)}</option>`).join('');
  }
  function renderYearOptions(selected) {
   return renderOptions([
    { value: '', label: '\u5168\u90e8' }, ...YEARS.map(value => ({ value, label: value })),
   ], selected); }
  function normalizeCode(value) {
   const raw = String(value || '').trim().toUpperCase();
   const match = raw.match(/FC2[-_\s]?PPV[-_\s]?(\d{6,9})/i) || raw.match(/\b(\d{6,9})\b/);
   return match ? `FC2-PPV-${match[1]}` : '';
  }
  function detailSlug(href) {
   try {
    const path = new URL(href, BASE_URL).pathname.replace(/\/+$/, ''); const match = path.match(/\/v\/([^/]+)$/i);
    return match ? decodeURIComponent(match[1]).toLowerCase() : '';
   } catch { return ''; } }
  function localDetailUrl(href) {
   const slug = detailSlug(href);
   return slug ? routeUrl({ detail: slug }) : href; }
  function parseCard(card, baseUrl = BASE_URL) {
   if (!card) return null;
   const link = card.querySelector('.card__cover[href], .card__title a[href]'); const titleLink = card.querySelector('.card__title a[href]') || link;
   const rawTitle = (titleLink?.textContent || '').replace(/\s+/g, ' ').trim(); const code = normalizeCode(rawTitle || link?.getAttribute('href'));
   const href = link?.getAttribute('href') || titleLink?.getAttribute('href') || ''; const image = card.querySelector('.card__img[src], img[src]');
   if (!code || !href) return null;
   return {
    code,
    title: rawTitle.replace(/^FC2[-_\s]?PPV[-_\s]?\d{6,9}\s*(?:[-—:]\s*)?/i, '').trim() || rawTitle,
    href: new URL(href, baseUrl).href,
    cover: image?.getAttribute('src') || '',
    preview: card.querySelector('.card__poster[data-preview]')?.getAttribute('data-preview') || '',
    meta: (card.querySelector('.card__meta')?.textContent || '').replace(/\s+/g, ' ').trim(), }; }
  function parseDocument(doc, baseUrl = BASE_URL) {
   const seen = new Set();
   const items = [...doc.querySelectorAll('.card')].map(card => parseCard(card, baseUrl)).filter(item => {
    if (!item || seen.has(item.code)) return false;
    seen.add(item.code);
    return true;
   });
   const next = doc.querySelector('.pager__nav[rel="next"][href], a[rel="next"][href]');
   const last = doc.querySelector('.pager__pages a[rel="last"][href], a[rel="last"][href]');
   const totalText = doc.querySelector('.pager__total')?.textContent || '';
   const totalPages = Math.max( parseInt(totalText.replace(/[^\d]/g, ''), 10) || 0, parseInt(last?.textContent?.replace(/[^\d]/g, '') || '0', 10) || 0 );
   const visibleBody = doc.body?.cloneNode?.(true);
   visibleBody?.querySelectorAll?.('script,style,noscript,template').forEach(el => el.remove());
   const visibleText = visibleBody?.textContent || doc.body?.textContent || '';
   const challengeText = `${doc.title || ''} ${visibleText}`;
   return {
    items,
    nextUrl: next ? new URL(next.getAttribute('href'), baseUrl).href : '',
    totalPages,
    blocked: !items.length && /cloudflare|challenge|checking your browser|captcha|验证|驗證/i.test(challengeText), }; }
  function mergePages(pages) {
   const seen = new Set();
   const items = pages.flatMap(page => page?.items || []).filter(item => {
    if (!item?.code || seen.has(item.code)) return false;
    seen.add(item.code);
    return true;
   });
   const sourceTotalPages = Math.max(...pages.map(page => Number(page?.totalPages) || 0), 0); const hasNext = pages.some(page => !!page?.nextUrl);
   return { items, nextUrl: hasNext ? '1' : '', totalPages: Math.ceil(sourceTotalPages / 2), sourceTotalPages }; }
  function responseError(response) {
   if (!response?.ok) {
    const status = Number(response?.status) || 0;
    if (status === 403) return new Error('123AV 请求被拒绝（403），请稍后重试。');
    if (status === 429) return new Error('123AV 请求过于频繁（429），请稍后重试。');
    if (response?.error?.kind === 'timeout') return new Error('123AV 请求超时。');
    if (response?.error?.kind === 'abort') return new Error('请求已取消。');
    return new Error(`123AV 请求失败${status ? `（${status}）` : ''}。`);
   }
   return null; }
  function cacheKey(url) {
   return `${CACHE_PREFIX}${url}`;
  }
  function readCache(url) {
   try {
    const value = JSON.parse(sessionStorage.getItem(cacheKey(url)) || 'null');
    if (!value || Date.now() - Number(value.savedAt) > CACHE_TTL) return null;
    return value.data || null;
   } catch { return null; } }
  function writeCache(url, data) {
   try {
    sessionStorage.setItem(cacheKey(url), JSON.stringify({ savedAt: Date.now(), data }));
   } catch {
   } }
  async function fetchPage(url, generation) {
   const cached = readCache(url);
   if (cached) return cached;
   const request = gmFetch(url, { timeout: 20000, headers: { accept: 'text/html' } });
   activeRequests.add(request);
   const response = await request;
   activeRequests.delete(request);
   if (generation !== renderGeneration) throw new Error('请求已被新页面替换。');
   const error = responseError(response);
   if (error) throw error;
   const data = parseDocument(parseHTML(response.responseText || ''), url);
   if (data.blocked) throw new Error('123AV 返回了验证页面，请稍后重试。');
   writeCache(url, data);
   return data; }
  async function fetchPageBundle(route, generation) {
   activeRequests.forEach(item => item.abort?.()); activeRequests.clear();
   const firstSourcePage = (route.page - 1) * 2 + 1; const first = await fetchPage(sourceUrl(route, firstSourcePage), generation);
   const second = first.nextUrl ? await fetchPage(sourceUrl(route, firstSourcePage + 1), generation) : null;
   return mergePages([first, second]); }
  function textOf(node) { return (node?.textContent || '').replace(/\s+/g, ' ').trim(); }
  function styleUrl(value) {
   const match = String(value || '').match(/url\(['"]?([^'")]+)['"]?\)/i);
   return match ? match[1] : ''; }
  function decodePlayerJson(value) {
   const match = String(value || '').match(/player\(JSON\.parse\('([\s\S]*?)'\)/i);
   if (!match) return [];
   try {
    const json = match[1] .replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
     .replace(/\\\//g, '/')
     .replace(/\\\\/g, '\\') .replace(/\\'/g, "'");
    const episodes = JSON.parse(json);
    return Array.isArray(episodes) ? episodes : [];
   } catch { return []; } }
  function parseDetailDocument(doc, baseUrl = BASE_URL) {
   const titleNode = doc?.querySelector?.('.watch__title, h1'); const rawTitle = textOf(titleNode) || textOf(doc?.querySelector?.('title'));
   const rows = [...(doc?.querySelectorAll?.('.watch__info-row') || [])];
   const fields = {};
   rows.forEach(row => {
    const label = textOf(row.querySelector?.('dt')).replace(/[：:]/g, '').toLowerCase(); const valueNode = row.querySelector?.('dd');
    const value = textOf(valueNode);
    if (label) fields[label] = {
     value,
     links: [...(valueNode?.querySelectorAll?.('a') || [])].map(textOf).filter(Boolean), };
   });
   const player = doc?.querySelector?.('.watch__main[x-data], .watch__main'); const playerConfig = decodePlayerJson(player?.getAttribute?.('x-data'));
   const cover = styleUrl(doc?.querySelector?.('.player')?.getAttribute?.('style')); const sourceUrl = new URL(baseUrl, BASE_URL).href;
   const code = normalizeCode(fields['代码']?.value || fields.code?.value || rawTitle);
   const title = rawTitle.replace(/^FC2[-_\s]?PPV[-_\s]?\d{6,9}\s*[—-]?\s*/i, '').trim() || rawTitle;
   const field = (...labels) => labels.map(label => fields[label]) .find(Boolean) || { value: '', links: [] };
   const type = field('类型', 'type'); const release = field('发布日期', '发行日期', 'release date', 'released'); const maker = field('制作商', 'maker', 'studio');
   const genres = field('类别', '分类', 'genres', 'genre');
   const metaStats = [...(doc?.querySelectorAll?.('.watch__meta--stats .watch__metaitem') || [])].map(textOf).filter(Boolean);
   return {
    code,
    title,
    rawTitle,
    cover,
    playerUrl: playerConfig[0]?.url || '',
    type: type.links.join(' / ') || type.value,
    releaseDate: release.value,
    maker: maker.links.join(' / ') || maker.value,
    genres: genres.links.length ? genres.links : genres.value ? [genres.value] : [],
    stats: metaStats,
    sourceUrl, }; }
  async function fetchDetail(slug, generation) {
   const url = new URL(`/cn/v/${encodeURIComponent(slug)}`, BASE_URL).href;
   const cached = readCache(url);
   if (cached) return cached;
   const request = gmFetch(url, { timeout: 20000, headers: { accept: 'text/html' } });
   activeRequests.add(request);
   const response = await request;
   activeRequests.delete(request);
   if (generation !== renderGeneration) throw new Error('request replaced');
   const error = responseError(response);
   if (error) throw error;
   const doc = parseHTML(response.responseText || ''); const detail = parseDetailDocument(doc, url);
   if (!detail.code || !detail.rawTitle) throw new Error('\u0031\u0032\u0033AV \u8fd4\u56de\u4e86\u9a8c\u8bc1\u9875\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002');
   writeCache(url, detail);
   return detail; }
  function httpUrl(value, baseUrl) {
   try {
    const url = new URL(String(value || '').trim(), baseUrl);
    return /^https?:$/i.test(url.protocol) ? url.href : '';
   } catch { return ''; } }
  function codeNumber(code) { return String(code || '').match(/FC2-PPV-(\d{6,9})/i)?.[1] || ''; }
  function metaContent(doc, selector) { return doc?.querySelector?.(selector)?.getAttribute?.('content') || ''; }
  function recordLink(node, baseUrl, label = '') {
   const url = httpUrl(node?.getAttribute?.('href') || node?.getAttribute?.('src'), baseUrl); const name = textOf(node) || label;
   return url && name ? { name, url } : null; }
  function sampleRecord(anchor, image, baseUrl) {
   const url = httpUrl(anchor?.getAttribute?.('href') || image?.getAttribute?.('src'), baseUrl);
   const thumb = httpUrl(image?.getAttribute?.('src') || anchor?.getAttribute?.('href'), baseUrl);
   return url ? { url, thumb: thumb || url } : null; }
  function parseOfficialSupplementDocument(doc, baseUrl) {
   const title = metaContent(doc, 'meta[property="og:title"]') || textOf(doc?.querySelector?.('.items_article_headerInfo h3'));
   const cover = httpUrl(
    doc?.querySelector?.('.items_article_MainitemThumb img')?.getAttribute?.('src') || metaContent(doc, 'meta[property="og:image"]'),
    baseUrl,
   );
   const sellerNode = doc?.querySelector?.('.items_article_writer a[href*="/users/"]'); const seller = recordLink(sellerNode, baseUrl);
   const sellerId = doc?.querySelector?.('.items_article_writer [data-userid]')?.getAttribute?.('data-userid') || '';
   const samples = [...(doc?.querySelectorAll?.('.items_article_SampleImagesArea a[data-image-slideshow], .items_article_SampleImagesArea a') || [])]
    .map(anchor => sampleRecord(anchor, anchor.querySelector?.('img'), baseUrl)) .filter(Boolean);
   const tags = [...(doc?.querySelectorAll?.('.items_article_TagArea a.tagTag, .items_article_TagArea a[data-tag]') || [])]
    .map(node => textOf(node) || node.getAttribute?.('data-tag') || '') .filter(Boolean);
   return { title, cover, seller: seller ? { ...seller, id: sellerId } : null, actresses: [], samples, tags: [...new Set(tags)] }; }
  function parsePpvCmaInertiaPage(doc) {
   const pageScript = doc?.querySelector?.('script[data-page="app"]');
   if (!pageScript) return null;
   try {
    return JSON.parse(pageScript.textContent || pageScript.innerHTML || '');
   } catch { return null; } }
  function parsePpvDbSupplementDocument(doc, baseUrl) {
   const inertiaPage = parsePpvCmaInertiaPage(doc); const structured = inertiaPage?.props?.article || null; const structuredWriter = structured?.writer;
   const structuredSeller = structuredWriter?.name ? {
     name: textOf({ textContent: structuredWriter.name }),
     url: httpUrl(`/users/${encodeURIComponent(structuredWriter.slug || structuredWriter.id || '')}`, baseUrl),
     id: String(structuredWriter.id || ''),
    } : null;
   const structuredTags = Array.isArray(structured?.tags) ? structured.tags.map(tag => typeof tag === 'string' ? tag : tag?.name || '').filter(Boolean) : [];
   const structuredSamples = [ ...(Array.isArray(structured?.samples) ? structured.samples : []),
    ...(Array.isArray(structured?.sample_images) ? structured.sample_images : []),
    ...(Array.isArray(structured?.preview_images) ? structured.preview_images : []),
   ].map(sample => {
    const url = typeof sample === 'string' ? sample : sample?.url || sample?.image_url || sample?.src || '';
    const thumb = typeof sample === 'string' ? sample : sample?.thumb || sample?.thumbnail || sample?.thumbnail_url || sample?.src || '';
    const safeUrl = httpUrl(url, baseUrl); const safeThumb = httpUrl(thumb, baseUrl);
    return safeUrl ? { url: safeUrl, thumb: safeThumb || safeUrl } : null;
   }).filter(Boolean);
   const structuredActresses = Array.isArray(structured?.actresses) ? structured.actresses.map(actress => {
     const name = typeof actress === 'string' ? actress : actress?.name || '';
     const slug = typeof actress === 'string' ? '' : actress?.slug || actress?.id || '';
     const url = httpUrl(
      typeof actress === 'object' ? actress?.url || (slug ? `/actresses/${encodeURIComponent(slug)}` : '') : '',
      baseUrl,
     );
     return name && url ? { name: textOf({ textContent: name }), url } : null;
    }).filter(Boolean) : [];
   const title = structured?.title || metaContent(doc, 'meta[property="og:title"]') || textOf(doc?.querySelector?.('h1, .title, [class*="title"]'));
   const cover = httpUrl(
    structured?.image_url || metaContent(doc, 'meta[property="og:image"]')
     || doc?.querySelector?.('[class*="cover"] img, [class*="poster"] img, img[src*="cover"]')?.getAttribute?.('src'),
    baseUrl,
   );
   const links = [...(doc?.querySelectorAll?.('a[href]') || [])];
   const collectByHint = hints => links.map(link => {
    const href = link.getAttribute?.('href') || '';
    const context = `${href} ${textOf(link)} ${textOf(link.parentElement)}`.toLowerCase();
    return hints.some(hint => context.includes(hint)) ? recordLink(link, baseUrl) : null;
   }).filter(Boolean);
   const collectBySelector = selector => [...(doc?.querySelectorAll?.(selector) || [])].map(link => recordLink(link, baseUrl)).filter(Boolean);
   const directActresses = [...(doc?.querySelectorAll?.('a[href*="/actresses/"]') || [])].map(link => {
    const url = httpUrl(link.getAttribute?.('href'), baseUrl);
    const name = textOf({
     textContent: link.getAttribute?.('title') || link.querySelector?.('h2, .card-title')?.textContent || link.textContent,
    });
    return url && name ? { name, url } : null;
   }).filter(Boolean);
   const sampleAnchors = [...(doc?.querySelectorAll?.('[class*="sample"] a, [class*="preview"] a, [class*="sample"] img, [class*="preview"] img') || [])];
   const htmlSamples = sampleAnchors.map(node => {
    const image = node.matches?.('img') ? node : node.querySelector?.('img'); const anchor = node.matches?.('a') ? node : node.closest?.('a');
    return sampleRecord(anchor, image, baseUrl);
   }).filter(Boolean);
   const actresses = [ ...directActresses, ...structuredActresses, ...collectByHint(['actress', 'actor', 'performer', '\u5973\u512a', '\u5973\u6f14\u5458']),
    ...collectBySelector('[class*="actress"] a, [class*="actor"] a, [class*="performer"] a, [data-actress] a'), ];
   const sellers = [ ...(structuredSeller ? [structuredSeller] : []),
    ...collectByHint(['seller', 'maker', 'author', 'uploader', '\u8ca9\u58f2\u8005', '\u9500\u552e\u8005']),
    ...collectBySelector('[class*="seller"] a, [class*="maker"] a, [class*="author"] a, [data-seller] a'), ];
   return {
    title,
    cover,
    seller: sellers[0] || null,
    actresses: [...actresses.reduce((map, item) => {
     const key = String(item.name || '').trim().toLowerCase() || item.url; const previous = map.get(key);
     if (!previous || (!previous.url && item.url)) map.set(key, item);
     return map;
    }, new Map()).values()],
    samples: [...new Map([...structuredSamples, ...htmlSamples].map(item => [item.url, item])).values()],
    tags: [...new Set(structuredTags)], }; }
  function parsePpvDbDeferredResponse(responseText, baseUrl) {
   let payload;
   try {
    payload = JSON.parse(String(responseText || ''));
   } catch { return []; }
   return (Array.isArray(payload?.props?.actresses) ? payload.props.actresses : []).map(actress => {
    const name = String(actress?.name || '').trim(); const id = String(actress?.id || '').trim();
    const url = httpUrl(actress?.url || (id ? `/actresses/${encodeURIComponent(id)}` : ''), baseUrl);
    return name && url ? { name, url } : null;
   }).filter(Boolean); }
  function mergeActresses(...groups) {
   return [...groups.flat().reduce((map, item) => {
    const key = String(item?.name || '').trim().toLowerCase() || item?.url; const previous = map.get(key);
    if (!previous || (!previous.url && item?.url)) map.set(key, item);
    return map;
   }, new Map()).values()]; }
  async function fetchSupplementSource(source, generation) {
   const cached = readCache(source.url);
   if (cached) return cached;
   let request;
   try {
    request = gmFetch(source.url, { timeout: 20000, headers: { accept: 'text/html' } });
    activeRequests.add(request);
    const response = await request;
    if (generation !== renderGeneration || !response?.ok) return null;
    const document = parseHTML(response.responseText || ''); const parsed = source.parser(document, source.url);
    if (source.deferred === 'actresses') {
     const page = parsePpvCmaInertiaPage(document);
     if (page?.version) {
      let deferredRequest;
      try {
       deferredRequest = gmFetch(source.url, {
        timeout: 20000,
        headers: {
         accept: 'text/html, application/xhtml+xml',
         'X-Inertia': 'true',
         'X-Inertia-Partial-Component': page.component || 'Articles/Show',
         'X-Inertia-Partial-Data': 'actresses',
         'X-Inertia-Version': page.version,
         'X-Requested-With': 'XMLHttpRequest', },
       });
       activeRequests.add(deferredRequest);
       const deferredResponse = await deferredRequest;
       if (deferredResponse?.ok) {
        parsed.actresses = mergeActresses( parsed.actresses || [], parsePpvDbDeferredResponse(deferredResponse.responseText, source.url) ); }
      } catch {
      } finally {
       activeRequests.delete(deferredRequest); } } }
    if (generation !== renderGeneration) return null;
    writeCache(source.url, parsed);
    return parsed;
   } catch {
    return null;
   } finally {
    activeRequests.delete(request); } }
  async function fetchSupplementBundle(code, generation) {
   const number = codeNumber(code);
   if (!number) return { actresses: [], sellers: [], samples: [], tags: [] };
   const officialUrl = `https://adult.contents.fc2.com/article/${number}/?lang=cn`;
   const dbUrl = `https://fc2cmadb.com/articles/${number}`;
   const sources = [
    { url: officialUrl, parser: parseOfficialSupplementDocument },
    { url: dbUrl, parser: parsePpvDbSupplementDocument, deferred: 'actresses' }, ];
   const results = (await Promise.all(sources.map(source => fetchSupplementSource(source, generation)))).filter(Boolean);
   const unique = (items, key = item => item.url || item.name) => [...new Map(items.filter(Boolean).map(item => [key(item), item])).values()];
   return {
    actresses: unique(results.flatMap(item => item.actresses || [])),
    sellers: unique(results.map(item => item.seller).filter(Boolean)),
    samples: unique(results.flatMap(item => item.samples || [])),
    tags: [...new Set(results.flatMap(item => item.tags || []))], }; }
  function renderItems(items, site = 'javdb') {
   if (site === 'javbus') {
    return items.map(item => `<div class="item" data-javbus-123av-fc2-item="1"><a href="${escapeHtml(localDetailUrl(item.href))}" data-123av-source="${escapeHtml(item.href)}" class="movie-box" title="${escapeHtml(item.title)}"><div class="photo-frame"><img loading="lazy" src="${escapeHtml(item.cover)}" alt=""></div><div class="photo-info"><span>${escapeHtml(item.title || item.code)}<br><date>${escapeHtml(item.code)}</date></span></div></a></div>`).join('');
   }
   if (site === 'javlib') {
    return items.map(item => `<div class="video" data-javlib-123av-fc2-item="1"><a href="${escapeHtml(localDetailUrl(item.href))}" data-123av-source="${escapeHtml(item.href)}" title="${escapeHtml(item.title)}"><img loading="lazy" src="${escapeHtml(item.cover)}" alt=""><div class="id">${escapeHtml(item.code)}</div><div class="title">${escapeHtml(item.title || item.code)}</div></a></div>`).join('');
   }
   return items.map(item => `<div class="item" data-javdb-123av-fc2-item="1"><a href="${escapeHtml(localDetailUrl(item.href))}" data-123av-source="${escapeHtml(item.href)}" class="box" title="${escapeHtml(item.title)}"><div class="cover"><img loading="lazy" src="${escapeHtml(item.cover)}" alt=""></div><div class="video-title"><strong>${escapeHtml(item.code)}</strong> ${escapeHtml(item.title)}</div><div class="score"></div><div class="meta">${escapeHtml(item.meta)}</div><div class="tags has-addons"><span class="tag is-info">123AV-FC2</span></div></a></div>`).join('');
  }
  function renderPagination(route, data) {
   const links = [];
   const add = (page, label, className = '') => links.push(`<a class="${className}" href="${routeUrl({ ...route, page })}">${label}</a>`);
   if (route.page > 1) add(route.page - 1, '上一页');
   const start = Math.max(1, route.page - 2); const end = data.totalPages ? Math.min(data.totalPages, route.page + 2) : route.page + (data.nextUrl ? 1 : 0);
   for (let page = start; page <= end; page += 1) add(page, page, page === route.page ? 'is-active' : '');
   if (data.nextUrl) add(route.page + 1, '下一页');
   return `<div class="javdb-123av-fc2-pagination">${links.join('')}</div>`;
  }
  function detailContainer(site) {
   if (site === 'javlib') return document.querySelector('#rightcolumn');
   if (site === 'javbus') {
    const list = document.querySelector('#waterfall');
    return list?.closest('.container-fluid, .container') || list?.parentElement || document.querySelector('.container'); }
   const section = document.querySelector('body > section, .section');
   if (!section) return document.querySelector('.section .container');
   const existingContainer = [...section.children].find(child => child.classList?.contains('container'));
   if (existingContainer) return existingContainer;
   const container = document.createElement('div');
   container.className = 'container';
   while (section.firstChild) container.appendChild(section.firstChild);
   section.appendChild(container);
   return container; }
  function renderDetailShell(route, site) {
   const container = detailContainer(site);
   if (!container) return null;
   if (site === 'javdb') PageZoom.apply?.('javdb');
   JavdbFc2DetailRenderer.installStyles();
   JavdbApiShellStyles.installDetailShell?.();
   injectStyle('javdb-123av-fc2-detail-style',`.javdb-123av-fc2-detail-status{padding:12px!important;border:1px solid #e2e8f0!important;border-radius:7px!important;background:#f8fafc!important;color:#475569!important;font-size:13px!important;font-weight:700!important}.javdb-123av-fc2-detail-status.is-error{border-color:#fecaca!important;background:#fff1f2!important;color:#be123c!important}`);
   if (site === 'javlib') injectStyle('javlib-123av-fc2-detail-layout-style', '#leftmenu{display:none!important}#rightcolumn{margin:0!important;width:100%!important;float:none!important}');
   container.innerHTML = `<div class="javdb-123av-fc2-detail-shell" data-laosiji-123av-fc2-detail-site="${site}"><div class="javdb-123av-fc2-detail-head"><div class="javdb-123av-fc2-detail-kicker">123AV-FC2 统一详情</div><div class="javdb-123av-fc2-detail-actions"><a href="${escapeHtml(routeUrl({ ...route, detail: '' }))}">返回列表</a></div></div><div class="javdb-123av-fc2-detail-status">正在加载 123AV 详情...</div></div>`;
   return { container, status: container.querySelector('.javdb-123av-fc2-detail-status') }; }
  function renderSupplementInfoHtml(data) {
   const names = items => (Array.isArray(items) ? items : []).map(item => {
    const name = String(typeof item === 'object' ? item?.name || '' : item || '').trim();
    if (!name) return '';
    const safeName = escapeHtml(name);
    return item?.url
     ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${safeName}</a>`
     : safeName;
   }).filter(Boolean).join(' / ');
   const actresses = names(data.actresses);
   const seller = (Array.isArray(data.sellers) ? data.sellers : []) .find(item => String(typeof item === 'object' ? item?.name || '' : item || '').trim());
   const sellerHtml = seller ? names([seller]) : '';
   const tags = [...new Set((Array.isArray(data.tags) ? data.tags : []) .map(tag => String(tag || '').trim()) .filter(Boolean))]
    .map(tag => `<span class="javdb-123av-fc2-detail-chip">${escapeHtml(tag)}</span>`)
    .join('');
   return [
    actresses ? `<div class="panel-block" data-123av-supplement-info="1"><strong>女优:</strong>&nbsp;<span class="value">${actresses}</span></div>` : '',
    sellerHtml ? `<div class="panel-block" data-123av-supplement-info="1"><strong>销售者:</strong>&nbsp;<span class="value">${sellerHtml}</span></div>` : '',
    tags ? `<div class="panel-block" data-123av-supplement-info="1"><strong>标签:</strong>&nbsp;<span class="value">${tags}</span></div>` : '',
   ].join(''); }
  function renderSupplementHtml(data) {
   if (!Array.isArray(data.samples) || !data.samples.length) return '';
   const samples = data.samples.map((sample, index) => `<a class="tile-item" href="${escapeHtml(sample.url)}" data-caption="${escapeHtml(`\u5267\u7167 ${index + 1}`)}"><img loading="lazy" src="${escapeHtml(sample.thumb)}" alt="\u5267\u7167 ${index + 1}"></a>`).join('');
   return `<section class="javdb-fc2-detail-samples-section" data-123av-detail-stills="1"><h2 class="javdb-fc2-detail-sample-heading">剧照</h2><div class="tile-images preview-images">${samples}</div></section>`;
  }
  function renderDetailHtml(detail, site = 'javdb') {
   return JavdbFc2DetailRenderer.render({
    code: detail.code,
    title: detail.title,
    cover: detail.cover,
    rows: [
     { label: '类型', value: detail.type },
     { label: '发布日期', value: detail.releaseDate },
     { label: '制作商', value: detail.maker },
     { label: '统计', value: detail.stats.join(' / ') }, ],
    tags: detail.genres,
   }, { site }); }
  function normalizeDetailInfoLabels(root) {
   const numberBlock = root?.querySelector('.movie-panel-info .first-block'); const numberLabel = numberBlock?.querySelector('strong');
   if (numberLabel) numberLabel.textContent = '\u756a\u53f7:';
   const magnetTitle = root?.querySelector('.javdb-fc2-detail-magnet-title');
   if (magnetTitle) magnetTitle.textContent = '\u78c1\u529b\u805a\u5408';
  }
  async function initDetail(route, site) {
   const shell = renderDetailShell(route, site);
   if (!shell) return true;
   const generation = ++renderGeneration;
   try {
    const detail = await fetchDetail(route.detail, generation);
    if (generation !== renderGeneration) return true;
    shell.container.innerHTML = renderDetailHtml(detail, site);
    if (typeof DetailFlex !== 'undefined') DetailFlex.apply?.(site);
    normalizeDetailInfoLabels(shell.container);
    if (typeof JumpButtons !== 'undefined') JumpButtons.render?.();
    if (typeof SiteJavDB !== 'undefined') SiteJavDB._mountStandaloneMagnet?.(shell.container, detail.code, site);
    const info = shell.container.querySelector('.movie-panel-info');
    fetchSupplementBundle(detail.code, generation).then(data => {
     if (generation !== renderGeneration || !info?.isConnected) return;
     info.querySelectorAll('[data-123av-supplement-info="1"]').forEach(row => row.remove());
     const infoHtml = renderSupplementInfoHtml(data); const jumpGroup = info.querySelector('.jav-jump-btn-group[data-laosiji-jump="1"]');
     if (infoHtml) {
      if (jumpGroup) jumpGroup.insertAdjacentHTML('beforebegin', infoHtml);
      else info.insertAdjacentHTML('beforeend', infoHtml);
     }
     const samplesHtml = renderSupplementHtml(data); const magnet = shell.container.querySelector('.javdb-fc2-detail-magnet');
     if (samplesHtml && magnet) magnet.insertAdjacentHTML('beforebegin', samplesHtml);
     StillsGallery.sync?.();
    }).catch(() => {});
    document.getElementById('123av-fc2-early-mask')?.remove();
    return true;
   } catch (error) {
    if (generation !== renderGeneration) return true;
    shell.status.classList.add('is-error');
    shell.status.textContent = error.message || '123AV detail request failed';
    document.getElementById('123av-fc2-early-mask')?.remove();
    return true; } }
  function renderShell(route, site = 'javdb') {
   const isJavBus = site === 'javbus'; const isJavLib = site === 'javlib';
   const nativeList = isJavBus ? document.querySelector('#waterfall') : isJavLib ? document.querySelector('.videothumblist .videos') : null;
   if (isJavBus || isJavLib) {
    document.querySelectorAll('ul.pagination, .page_selector').forEach(pagination => {
     const wrapper = pagination.closest('.text-center');
     (wrapper || pagination).remove();
    }); }
   const container = isJavBus ? nativeList?.closest('.container-fluid, .container') || nativeList?.parentElement : isJavLib
     ? document.querySelector('#rightcolumn') : document.querySelector('body > section > div, .section .container, body > section');
   if (!container) { document.getElementById('123av-fc2-early-mask')?.remove(); return null; }
   if (isJavLib) { injectStyle('javlib-123av-fc2-layout-style', '#leftmenu{display:none!important}'); }
   injectStyle('javdb-123av-fc2-style',`.javdb-123av-fc2-shell{margin-top:10px!important}.javdb-123av-fc2-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex-wrap:wrap!important;margin:8px 0 12px!important}.javdb-123av-fc2-title{color:#1e293b!important;font-size:18px!important;font-weight:850!important}.javdb-123av-fc2-tools{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;margin:8px 0 12px!important}.javdb-123av-fc2-tools>form,.javdb-123av-fc2-tools>a{display:none!important}.javdb-123av-fc2-filter-form{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:wrap!important;margin:8px 0 12px!important}.javdb-123av-fc2-filter-form input,.javdb-123av-fc2-filter-form select{min-width:0!important;min-height:32px!important;padding:5px 9px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#fff!important;color:#334155!important;font-size:12px!important}.javdb-123av-fc2-filter-form input{flex:1 1 220px!important}.javdb-123av-fc2-filter-form select{flex:0 1 128px!important}.javdb-123av-fc2-filter-form button{min-height:32px!important;padding:5px 12px!important;border:1px solid #dbe3ef!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}.javdb-123av-fc2-tools form{display:flex!important;gap:6px!important;flex:1 1 240px!important;max-width:520px!important}.javdb-123av-fc2-tools input{min-width:0!important;flex:1 1 auto!important;min-height:32px!important;padding:5px 9px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#fff!important}.javdb-123av-fc2-tools button,.javdb-123av-fc2-tools a,.javdb-123av-fc2-pagination a{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;padding:5px 11px!important;border:1px solid #dbe3ef!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:12px!important;font-weight:800!important;text-decoration:none!important;cursor:pointer!important}.javdb-123av-fc2-tools a.is-active,.javdb-123av-fc2-pagination a.is-active{border-color:#60a5fa!important;background:#eff6ff!important;color:#1d4ed8!important}.javdb-123av-fc2-status{margin:10px 0!important;padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#f8fafc!important;color:#475569!important;font-size:13px!important;font-weight:700!important}.javdb-123av-fc2-status.is-error{border-color:#fecaca!important;background:#fff1f2!important;color:#be123c!important}.javdb-123av-fc2-pagination{display:flex!important;justify-content:center!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important;margin:16px 0 8px!important}html[data-theme="dark"] .javdb-123av-fc2-title{color:#e5e7eb!important}html[data-theme="dark"] .javdb-123av-fc2-tools input,html[data-theme="dark"] .javdb-123av-fc2-tools button,html[data-theme="dark"] .javdb-123av-fc2-tools a,html[data-theme="dark"] .javdb-123av-fc2-pagination a{border-color:#475569!important;background:#252525!important;color:#e5e7eb!important}`);
   container.innerHTML = `<div class="javdb-123av-fc2-shell"><div class="javdb-123av-fc2-head"><div class="javdb-123av-fc2-title">123AV-FC2</div></div><div class="javdb-123av-fc2-tools"><form><input name="query" type="search" value="${escapeHtml(route.query)}" placeholder="搜索 FC2 番号或标题"><button type="submit">搜索</button></form> ${Object.entries(SORTS).map(([key, value]) => `<a class="${key === route.sort ? 'is-active' : ''}" href="${routeUrl({ ...route, sort: key, page: 1 })}">${value.label}</a>`).join('')} </div><div class="javdb-123av-fc2-status">正在加载 123AV 数据...</div><form class="javdb-123av-fc2-filter-form"><input name="query" type="search" value="${escapeHtml(route.query)}" placeholder="\u641c\u7d22 FC2 \u756a\u53f7\u6216\u6807\u9898"><select name="type" aria-label="\u7c7b\u578b">${renderOptions(TYPES, route.type)}</select><select name="year" aria-label="\u5e74\u4efd">${renderYearOptions(route.year)}</select><select name="actress" aria-label="\u5973\u6f14\u5458">${renderOptions(ACTRESS_MODES, route.actress)}</select><select name="sort" aria-label="\u6392\u5e8f">${renderOptions(Object.entries(SORTS).map(([value, item]) => ({ value, label: item.label })), route.sort)}</select><button type="submit">\u641c\u7d22</button></form> ${isJavBus
      ? '<div id="waterfall" class="javbus-123av-fc2-list"></div>' : isJavLib
       ? '<div class="videothumblist"><div class="videos javlib-123av-fc2-list"></div></div>'
       : '<div class="movie-list h cols-4 vcols-8"></div>'} <div class="javdb-123av-fc2-pagination-wrap"></div></div>`;
   if (isJavLib) {
    const mask = document.getElementById('123av-fc2-early-mask');
    if (mask) mask.textContent = '#leftmenu{display:none!important;visibility:hidden!important}';
   } else if (isJavBus) {
    document.getElementById('123av-fc2-early-mask')?.remove();
   } else { document.getElementById('123av-fc2-early-mask')?.remove(); }
   const form = container.querySelector('form');
   form?.addEventListener('submit', event => {
    event.preventDefault();
    const query = form.querySelector('input[name="query"]')?.value?.trim() || '';
    location.href = routeUrl({ ...route, query, page: 1 });
   });
   const filterForm = container.querySelector('.javdb-123av-fc2-filter-form');
   filterForm?.addEventListener('submit', event => {
    event.preventDefault();
    const value = name => filterForm.querySelector(`[name="${name}"]`)?.value || '';
    location.href = routeUrl({ ...route,
     query: value('query').trim(),
     type: value('type'),
     year: value('year'),
     actress: value('actress'),
     sort: value('sort'),
     page: 1,
    });
   });
   filterForm?.querySelectorAll('select').forEach(select => select.addEventListener('change', () => filterForm.requestSubmit()));
   return {
    container,
    status: container.querySelector('.javdb-123av-fc2-status'),
    list: container.querySelector(isJavBus ? '#waterfall' : isJavLib ? '.videos' : '.movie-list'),
    pagination: container.querySelector('.javdb-123av-fc2-pagination-wrap'),
    site, }; }
  function init() {
   const route = parseRoute();
   if (!route) return false;
   const host = location.hostname || ''; const site = /javbus/i.test(host) ? 'javbus' : /(?:javlibrary|javlib|r86m|s87n)/i.test(host) ? 'javlib' : 'javdb';
   if (route.detail) { initDetail(route, site); return true; }
   const shell = renderShell(route, site);
   if (!shell) return true;
   const generation = ++renderGeneration;
   (async () => {
    try {
     const data = await fetchPageBundle(route, generation);
     if (generation !== renderGeneration) return;
     shell.list.innerHTML = renderItems(data.items, site);
     shell.status.textContent = data.items.length
      ? `已加载 ${data.items.length} 条 123AV-FC2 数据${data.totalPages ? `，共 ${data.totalPages} 页` : ''}`
      : '没有查询到 123AV-FC2 数据。';
     shell.pagination.innerHTML = renderPagination(route, data);
     if (site === 'javbus') {
      SiteJavBus._initListPage(); PageZoom.apply('javbus');
     } else if (site === 'javlib') {
      SiteJavLib._initListPage(); PageZoom.apply('javlib');
     } else {
      SiteJavDB._initListPage(); PageZoom.apply('javdb'); }
     Runtime.refreshListPage();
    } catch (error) {
     if (generation !== renderGeneration || /请求已被新页面替换|请求已取消/.test(error.message)) return;
     shell.status.classList.add('is-error');
     shell.status.textContent = error.message || '123AV 请求失败。'; }
   })();
   return true; }
  function installLink() {
   injectStyle('javdb-123av-fc2-nav-style',`li.javdb-123av-fc2-nav-item{display:flex!important;align-items:stretch!important;gap:0!important}li.javdb-123av-fc2-nav-item>a{flex:0 0 auto!important}`);
   const links = [...document.querySelectorAll('a[href]')].filter(link => {
    try {
     const url = new URL(link.getAttribute('href'), location.href);
     return /javdb/i.test(url.hostname) && /(?:^|\/)fc2\/?$/i.test(url.pathname);
    } catch { return false; }
   });
   links.forEach(link => {
    const parent = link.parentElement;
    if (!parent || parent.querySelector('[data-laosiji123av-fc2-link="1"]')) return;
    parent.classList.add('javdb-123av-fc2-nav-item');
    const clone = link.cloneNode(true);
    clone.removeAttribute('data-laosiji-api-ranking-shell');
    clone.dataset.laosiji123avFc2Link = '1';
    const label = clone.querySelector('span') || clone;
    label.textContent = '123AV-FC2';
    clone.href = routeUrl({ page: 1 });
    clone.title = '使用 123AV-FC2 来源';
    link.insertAdjacentElement('afterend', clone);
   }); }
  return {
   init,
   installLink,
   parseRoute,
   routeUrl,
   isDetailRoute: () => !!parseRoute()?.detail,
   sourceUrl,
   normalizeCode,
   parseCard,
   parseDocument,
   renderPagination,
   renderItems,
   renderDetailHtml,
   parseDetailDocument,
   parseOfficialSupplementDocument,
   parsePpvDbSupplementDocument,
   parsePpvDbDeferredResponse,
   renderSupplementInfoHtml,
   renderSupplementHtml,
   detailSlug,
   localDetailUrl,
   mergePages,
   _resetForTest() { activeRequests.clear(); renderGeneration = 0; }, };
 })();
 Core.expose('__LAOSIJI_JAVDB_123AV_FC2__', Javdb123AvFc2);
 const SiteJavDB = {
  match() { return location.hostname.includes('javdb'); },
  getVid() {
   const el = document.querySelector('a.button.is-white.copy-to-clipboard');
   return normalizeAvid(el?.dataset?.clipboardText || '') || Utils.extractCode(document.querySelector('h2.title, .javdb-api-detail-title')?.textContent || '');
  },
  initPage(avid) {
   document.querySelector('.app-desktop-banner')?.remove(); this._dismissOver18Modal(); this._insertTopSettingsButton(); this._ensureDarkThemeStyle();
   this._hideNativeLayoutSwitcher(); this._stripNativeLayoutParam(); this._initFavoriteActorHighlight(); Javdb123AvFc2.installLink();
   if (Javdb123AvFc2.init()) return;
   if (CFG.javdbUseNativePages) {
    if (this._redirectCurrentNativeEntry()) return;
   } else {
    this._installApiRankingShell(); this._hideScriptFc2AdvancedSearchBox();
    if (this._redirectCurrentApiRankingEntry()) return;
   }
   this._initPaginationJump();
   if (!CFG.javdbUseNativePages && this._getApiRankingShellMode()) { this._initApiRankingShellPage().catch(err => errorLog('JavDB API 榜单渲染失败:', err)); return; }
   if (!CFG.javdbUseNativePages && this._getApiDetailShellMode()) { this._initApiDetailShellPage().catch(err => errorLog('JavDB API 详情渲染失败:', err)); return; }
   if (!location.pathname.startsWith('/v/')) { this._initListPage(); return; }
   this._hideDownloadCorrectionBlock();
   GM_addStyle(`.container{max-width:100%!important}.movie-panel-info{overflow:hidden;word-break:break-word}.movie-panel-info .panel-block{flex-wrap:wrap}.movie-panel-info .value{overflow:hidden;word-break:break-word}.review-buttons>.panel-block:has(a[href="#magnet-links"]),.review-buttons>.panel-block:has(a[href*="/corrections/new"]){display:none!important}`);
   this._ensureDetailLayout(); this._insertMagnet(avid); this._initApiMovieTabs(); },
  _hideDownloadCorrectionBlock() {
   document.querySelectorAll('.review-buttons > .panel-block').forEach(block => {
    if (block.querySelector('a[href="#magnet-links"], a[href*="/corrections/new"]')) { block.remove(); }
   }); },
  _hideNativeLayoutSwitcher() {
   document.querySelectorAll('.toolbar > .button-group').forEach(group => {
    const hrefs = [...group.querySelectorAll('a[href]')].map(a => a.getAttribute('href') || '');
    const labels = [...group.querySelectorAll('a.button')].map(a => (a.textContent || '').replace(/\s+/g, ''));
    const hasLayoutHref = hrefs.some(href => /[?&]lm=h\b/i.test(href)) && hrefs.some(href => /[?&]lm=v\b/i.test(href));
    const hasLayoutLabel = labels.some(text => /大封面|大封面/i.test(text)) && labels.some(text => /小封面|小封面/i.test(text));
    if (hasLayoutHref || hasLayoutLabel) { group.dataset.laosijiHiddenNativeLayout = '1'; }
   });
   injectStyle('javdb-native-layout-style',`.toolbar>.button-group[data-laosiji-hidden-native-layout="1"]{display:none!important}`);
  },
  _stripNativeLayoutParam(root = document) {
   try {
    const current = new URL(location.href);
    if (current.searchParams.has('lm')) {
     current.searchParams.delete('lm'); history.replaceState(history.state, document.title, current.pathname + current.search + current.hash); }
   } catch {}
   root.querySelectorAll?.('a[href*="lm="]').forEach(a => {
    try {
     const raw = a.getAttribute('href') || ''; const url = new URL(raw, location.href);
     if (!url.searchParams.has('lm')) return;
     url.searchParams.delete('lm'); a.setAttribute('href', url.pathname + url.search + url.hash);
    } catch {}
   }); },
  _ensureDarkThemeStyle() {
   injectStyle('javdb-dark-style',`html[data-theme="dark"] .jav-card{background:#252525!important;border-color:#3f3f46!important;box-shadow:0 1px 4px rgba(0,0,0,.34)!important}html[data-theme="dark"] .jav-card:hover{border-color:rgba(96,165,250,.58)!important;box-shadow:0 12px 26px rgba(0,0,0,.38)!important}html[data-theme="dark"] .jav-card-link,html[data-theme="dark"] .javdb-card-grid .item .javdb-card-link.box{background:#252525!important;color:#8ab4ff!important}html[data-theme="dark"] .jav-card-link:visited{color:#94a3b8!important}html[data-theme="dark"] .jav-card-cover,html[data-theme="dark"] .jav-card-image{background:#18181b!important;border-color:#3f3f46!important}html[data-theme="dark"] .javdb-card-score{color:#cbd5e1!important}html[data-theme="dark"] .javdb-card-meta{color:#94a3b8!important}html[data-theme="dark"] .javdb-card-tags .tag:not(.is-success):not(.is-info):not(.is-primary):not(.is-warning):not(.is-danger){background:#333333!important;color:#d1d5db!important}html[data-theme="dark"] .jav-nong-wrapper{background:transparent!important;color:#d1d5db!important}html[data-theme="dark"] #jav-nong-table{background:#2f2f2f!important;color:#d1d5db!important}html[data-theme="dark"] #jav-nong-table th,html[data-theme="dark"] #jav-nong-table td{background:#262626!important;border-color:#3f3f46!important;color:#d1d5db!important}html[data-theme="dark"] #jav-nong-table .nong-head-row th{background:#303030!important;color:#e5e7eb!important}html[data-theme="dark"] #jav-nong-table .nong-magnet-name>a{color:#8ab4ff!important}html[data-theme="dark"] #jav-nong-notice,html[data-theme="dark"] #jav-nong-refresh{color:#cbd5e1!important}html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] article.message.video-panel,html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] article.message.video-panel .message-body{background:#252525!important;border-color:#3f3f46!important;color:#e5e7eb!important}html[data-theme="dark"] .javdb-api-review,html[data-theme="dark"] .javdb-api-related{background:#252525!important;border-bottom-color:#3f3f46!important}html[data-theme="dark"] .javdb-api-review-head,html[data-theme="dark"] .javdb-api-related-head,html[data-theme="dark"] .javdb-api-review-content,html[data-theme="dark"] .javdb-api-related-desc{color:#e5e7eb!important}html[data-theme="dark"] .javdb-api-related-meta,html[data-theme="dark"] .javdb-api-tab-loading,html[data-theme="dark"] .javdb-api-tab-empty,html[data-theme="dark"] .javdb-api-tab-end{color:#cbd5e1!important}html[data-theme="dark"] .javdb-api-tab-error{color:#fb7185!important}html[data-theme="dark"] .javdb-api-review-toggle,html[data-theme="dark"] .javdb-api-review-collapse,html[data-theme="dark"] .javdb-api-tab-load-more{background:#2f3b4f!important;border-color:#4b5f80!important;color:#dbeafe!important}html[data-theme="dark"] .javdb-api-review-toggle::before{color:#93c5fd!important}html[data-theme="dark"] .javdb-api-tab-badge{background:#1e3a5f!important;border-color:#3b82f6!important;color:#dbeafe!important}html[data-theme="dark"] .jav-stills-shell{background:#252525!important;border-color:#3f3f46!important;box-shadow:0 8px 18px rgba(0,0,0,.28)!important}html[data-theme="dark"] .jav-stills-rail>a,html[data-theme="dark"] .jav-stills-rail>.tile-item,html[data-theme="dark"] .jav-stills-rail>.preview-video-container{background:#1f2937!important;border-color:#4b5563!important;box-shadow:none!important}html[data-theme="dark"] .jav-stills-arrow{background:rgba(9,14,23,.16)!important;border-color:rgba(226,232,240,.55)!important;color:#f8fafc!important;box-shadow:0 8px 22px rgba(0,0,0,.42)!important}html[data-theme="dark"] .jav-stills-arrow:hover{background:rgba(15,23,42,.32)!important;border-color:rgba(125,211,252,.86)!important;box-shadow:0 10px 24px rgba(0,0,0,.5)!important}`);
  },
  _dismissOver18Modal() {
   if (!this.match()) return;
   const modal = document.querySelector('.modal.is-active.over18-modal');
   if (!modal) return;
   const ok = modal.querySelector('a.button.is-success[href*="/over18?respond=1"]'); const href = ok?.getAttribute('href') || '';
   if (href && sessionStorage.getItem('javdb_over18_confirming') !== '1') {
    sessionStorage.setItem('javdb_over18_confirming', '1');
    GM_xmlhttpRequest({
     method: 'GET',
     url: new URL(href, location.origin).href,
     onload: () => sessionStorage.removeItem('javdb_over18_confirming'),
     onerror: () => sessionStorage.removeItem('javdb_over18_confirming'),
     ontimeout: () => sessionStorage.removeItem('javdb_over18_confirming'),
    }); }
   modal.remove(); document.documentElement.classList.remove('is-clipped'); document.body.classList.remove('is-clipped'); },
  _escapeHtml(value) {
   return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
   }[ch])); },
  _insertTopSettingsButton() {
   const navbarEnd = document.querySelector('#navbar-menu-user .navbar-end');
   if (!navbarEnd || navbarEnd.querySelector('.javdb-top-settings-btn')) return;
   const btn = document.createElement('a');
   btn.href = 'javascript:void(0)'; btn.className = 'navbar-item javdb-top-settings-btn'; btn.textContent = '\u8001\u53f8\u673a\u8bbe\u7f6e';
   btn.title = '\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e';
   btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); QuickSettingsPanel.open(e.currentTarget); });
   const userMenu = navbarEnd.querySelector('a[href="/users/profile"]')?.closest('.navbar-item.has-dropdown');
   navbarEnd.insertBefore(btn, userMenu || null);
   injectStyle('javdb-top-settings-style',`#navbar-menu-user .javdb-top-settings-btn{color:#2563eb!important;font-weight:700!important}#navbar-menu-user .javdb-top-settings-btn:hover{color:#1d4ed8!important;background:rgba(37,99,235,.08)!important}`);
  },
  _ensureDetailLayout() {
   const coverCol  = document.querySelector('.column.column-video-cover'); const infoPanel = document.querySelector('.movie-panel-info');
   if (!coverCol || !infoPanel) return null;
   const infoCol = infoPanel.closest('.column') || infoPanel; const currentContainer = coverCol.closest('.jav-flex-container');
   const parent = currentContainer || coverCol.parentElement;
   if (!parent) return null;
   let flexContainer = currentContainer || parent.querySelector(':scope > .jav-flex-container');
   if (!flexContainer) {
    flexContainer = document.createElement('div'); flexContainer.className = 'jav-flex-container';
    flexContainer.appendChild(coverCol); flexContainer.appendChild(infoCol); parent.appendChild(flexContainer);
   } else {
    if (coverCol.parentElement !== flexContainer) flexContainer.insertBefore(coverCol, flexContainer.firstChild);
    if (infoCol.parentElement !== flexContainer) {
     const magnetSlot = flexContainer.querySelector(':scope > .jav-nong-slot');
     flexContainer.insertBefore(infoCol, magnetSlot || null); } }
   if (MobilePolicy.isMobile()) {
    flexContainer.style.setProperty('display', 'block', 'important');
    ['gap', 'align-items', 'width', 'margin-top'].forEach(name => flexContainer.style.removeProperty(name));
    ['--javdb-cover-flex', '--javdb-info-flex', '--javdb-magnet-flex'].forEach(name => flexContainer.style.removeProperty(name));
    [coverCol, infoCol].forEach(el => {
     if (!el) return;
     ['flex', 'width', 'max-width', 'min-width', 'align-self', 'overflow', 'word-break'].forEach(name => el.style.removeProperty(name));
    });
    return flexContainer; }
   flexContainer.style.setProperty('display', 'flex', 'important'); flexContainer.style.setProperty('gap', '20px', 'important');
   flexContainer.style.setProperty('align-items', 'flex-start', 'important'); flexContainer.style.setProperty('width', '100%', 'important');
   flexContainer.style.setProperty('margin-top', '16px', 'important');
   const detailDefaults = DetailFlex.defaultCss('javdb');
   flexContainer.style.setProperty('--javdb-cover-flex', flexContainer.style.getPropertyValue('--javdb-cover-flex') || detailDefaults.cover);
   flexContainer.style.setProperty('--javdb-info-flex', flexContainer.style.getPropertyValue('--javdb-info-flex') || detailDefaults.info);
   flexContainer.style.setProperty('--javdb-magnet-flex', flexContainer.style.getPropertyValue('--javdb-magnet-flex') || detailDefaults.magnet);
   coverCol.style.setProperty('flex', 'var(--javdb-cover-flex) 1 0', 'important'); coverCol.style.setProperty('width', 'auto', 'important');
   coverCol.style.setProperty('max-width', 'none', 'important'); coverCol.style.setProperty('min-width', '0', 'important');
   coverCol.style.setProperty('align-self', 'flex-start', 'important'); infoCol.style.setProperty('flex', 'var(--javdb-info-flex) 1 0', 'important');
   infoCol.style.setProperty('width', 'auto', 'important'); infoCol.style.setProperty('max-width', 'none', 'important');
   infoCol.style.setProperty('min-width', '0', 'important'); infoCol.style.setProperty('overflow', 'hidden', 'important');
   infoCol.style.setProperty('word-break', 'break-word', 'important'); infoPanel.style.setProperty('width', '100%', 'important');
   infoPanel.style.setProperty('max-width', '100%', 'important'); infoPanel.style.setProperty('box-sizing', 'border-box', 'important');
   const coverBox = coverCol.querySelector('.cover, .box');
   if (coverBox) {
    coverBox.style.setProperty('display', 'block', 'important'); coverBox.style.setProperty('width', '100%', 'important');
    coverBox.style.setProperty('height', 'auto', 'important'); coverBox.style.setProperty('box-sizing', 'border-box', 'important'); }
   const coverImg = coverCol.querySelector('img');
   if (coverImg) {
    coverImg.removeAttribute('width'); coverImg.removeAttribute('height');
    const coverLink = coverImg.closest('a');
    if (coverLink) {
     coverLink.style.setProperty('display', 'block', 'important'); coverLink.style.setProperty('width', '100%', 'important');
     coverLink.style.setProperty('height', 'auto', 'important'); }
    coverImg.style.setProperty('display', 'block', 'important'); coverImg.style.setProperty('width', '100%', 'important');
    coverImg.style.setProperty('height', 'auto', 'important'); coverImg.style.setProperty('aspect-ratio', 'auto', 'important');
    coverImg.style.setProperty('object-fit', 'contain', 'important'); }
   return flexContainer; },
  _insertMagnet(avid) {
   if (MobilePolicy.effectiveMagnetDisplayMode() === 'native-replace') {
    document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove()); NativeMagnetPanel.scheduleMount('javdb', avid);
    return; }
   NativeMagnetPanel.remove('javdb');
   if (!MobilePolicy.usesDesktopMagnetTable()) return;
   document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove());
   const flexContainer = this._ensureDetailLayout();
   if (!flexContainer) return;
   const slot = document.createElement('div');
   slot.className = 'jav-nong-slot';
   slot.style.setProperty('flex', 'var(--javdb-magnet-flex) 1 0', 'important'); slot.style.setProperty('min-width', '0', 'important');
   slot.style.setProperty('align-self', 'flex-start', 'important'); slot.style.setProperty('overflow', 'hidden', 'important');
   const widget = Magnet.createMagnetWidget(avid);
   slot.appendChild(widget); flexContainer.appendChild(slot); }, };
 Object.assign( SiteJavDB, JavdbFavorites, JavdbApiTabs, JavdbPagination, JavdbApiShell, JavdbApiRanking, JavdbApiDetail, JavdbList );
 const JavdbReviews = {
  ensureStyle() { return SiteJavDB._ensureApiMovieTabStyle(); },
  escapeHtml(value) { return SiteJavDB._escapeHtml(value); },
  renderStars(score) { return SiteJavDB._renderApiStars(score); },
  formatDate(value) { return SiteJavDB._formatApiDate(value); },
  renderLinkedText(value) { return SiteJavDB._renderApiLinkedText(value); },
  renderDefaultToggle() {
   return`<label class="javdb-api-review-default-toggle" title="控制以后进入详情页时短评默认展开或折叠"><input type="checkbox" data-laosiji-review-default-expanded="1"${CFG.reviewsDefaultExpanded ? ' checked' : ''}><span class="javdb-api-review-default-switch"></span><span>默认展开</span></label><label class="javdb-api-review-font-size" title="调整短评与清单字号"><span>字号</span><select data-laosiji-review-font-size="1"><option value="small"${CFG.reviewFontSize === 'small' ? ' selected' : ''}>小</option><option value="medium"${CFG.reviewFontSize === 'medium' ? ' selected' : ''}>中</option><option value="large"${CFG.reviewFontSize === 'large' ? ' selected' : ''}>大</option></select></label>`;
  },
  reviewFontSizeValue() { return ({ small: '15px', medium: '17px', large: '19px' })[CFG.reviewFontSize] || '17px'; },
  applyFontSize() {
   document.documentElement.style.setProperty('--laosiji-review-font-size', this.reviewFontSizeValue()); },
  syncDefaultToggles(root = document) {
   root.querySelectorAll?.('[data-laosiji-review-default-expanded]').forEach(input => { input.checked = CFG.reviewsDefaultExpanded; });
   root.querySelectorAll?.('[data-laosiji-review-font-size]').forEach(select => { select.value = CFG.reviewFontSize; });
   this.applyFontSize(); },
  renderCollapsed() {
   return`<div class="javdb-api-review-default-row"> ${this.renderDefaultToggle()} </div><button type="button" class="javdb-api-review-toggle" data-laosiji-api-expand-reviews="1">展开短评</button>`;
  },
  renderCollapseBar() {
   return`<div class="javdb-api-review-collapse-bar"> ${this.renderDefaultToggle()} <button type="button" class="javdb-api-review-collapse" data-laosiji-api-collapse-reviews="1">收起短评</button></div>`;
  },
  renderItems(reviews, offset = 0, limit = JAVDB_REVIEW_MORE_LIMIT) {
   const size = Math.max(1, parseInt(limit, 10) || JAVDB_REVIEW_MORE_LIMIT); const list = Array.isArray(reviews) ? reviews.slice(0, size) : [];
   return list.map((item, index) =>`<div class="javdb-api-review"><div class="javdb-api-review-head"><span><strong>#${offset + index + 1}</strong> ${this.escapeHtml(item?.username || '匿名')}</span><span>${this.renderStars(item?.score)} ${this.escapeHtml(this.formatDate(item?.created_at))} ${Number(item?.likes_count || 0) ? ` · 點讚:${this.escapeHtml(item.likes_count)}` : ''}</span></div><div class="javdb-api-review-content">${this.renderLinkedText(item?.content || '')}</div></div>`).join('');
  }, };
 const SiteJavLib = {
  match() { return /(javlibrary|javlib|r86m|s87n)/i.test(location.hostname); },
  isDetailPage() {
   return (
    !!document.querySelector('#video_id .text') && !!document.querySelector('meta[name="keywords"]')
   ); },
  isHomePage() {
   return (
    document.body?.classList.contains('main') && !this.isDetailPage() && !!document.querySelector('#rightcolumn > .videothumblist .videos')
   ); },
  getVid() {
   const el = document.querySelector('#video_id .text');
   if (el?.textContent?.trim()) return normalizeAvid(el.textContent.trim());
   const m = document.title.match(/([A-Z0-9]+-\d+)/i);
   return m ? m[1].toUpperCase() : ''; },
  initPage(avid) {
   document.body?.setAttribute('data-laosiji-javlib', '');
   this._initMobileForum?.();
   this._insertTopSettingsButton(); this._insertTopNavigationDropdown();
   if (Javdb123AvFc2.init()) return;
   if (!this.isDetailPage()) {
    this._initListPage();
    if (this.isHomePage()) this._initHomePage();
    return; }
   if (!avid) return;
   document.querySelector('.socialmedia')?.remove();
   GM_addStyle(`#leftmenu{display:none}#rightcolumn{margin:0!important;width:100%!important;float:none!important}#content{padding-top:0;width:100%;margin:0!important}#video_title h3.post-title.text,#video_title h3.post-title.text a{font-size:20px!important;line-height:1.45!important}#video_jacket img{max-width:100%;height:auto}#video_info{text-align:left;font:14px Arial;overflow:hidden;word-break:break-word;margin:0!important;width:100%!important;float:none!important}#video_info .item,#video_info table,#video_info tr,#video_info td,#video_info .header,#video_info .text{text-align:left!important}#video_info table{margin-left:0!important;margin-right:auto!important}#video_info .jav-jump-btn-group{justify-content:flex-start!important}#video_reviews,#video_comments,#video_review_edit,#video_comment_edit{width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}#video_reviews .review,#video_comments .comment{width:100%!important;max-width:100%!important;table-layout:fixed!important;box-sizing:border-box!important}#video_reviews .review td,#video_comments .comment td{box-sizing:border-box!important;vertical-align:top!important}#video_reviews .review td.info,#video_comments .comment td.info{width:132px!important}#video_reviews .review td.scores,#video_comments .comment td.scores{width:92px!important}#video_reviews .review td.t,#video_comments .comment td.t{width:auto!important;min-width:0!important;overflow:hidden!important}#video_reviews .review td.t .text,#video_comments .comment td.t .text,#video_reviews .review td.t textarea,#video_comments .comment td.t textarea{width:auto!important;max-width:100%!important;box-sizing:border-box!important;white-space:normal!important;word-break:break-word!important;overflow-wrap:anywhere!important}.jav-nong-slot .jav-nong-wrapper{width:560px;max-width:100%;margin-top:16px}`);
   this._ensureDetailLayout(); this._insertMagnet(avid); },
  _insertTopNavigationDropdown() {
   const source = document.querySelector('#leftmenu .menul1'); const advSearch = document.querySelector('#topmenu .advsearch');
   if (!source || !advSearch || advSearch.querySelector('.javlib-top-nav-menu')) return;
   const lang = String(document.documentElement.lang || '').toLowerCase();
   const label = lang.startsWith('en') ? 'Site Nav' : lang.startsWith('ja') ? 'ナビ' : /tw|zh$/.test(lang) ? '站點導航' : '站点导航';
   const menu = document.createElement('span');
   menu.className = 'javlib-top-nav-menu';
   menu.innerHTML =`<a class="javlib-top-nav-trigger" href="javascript:void(0)"> ${label} ▾</a><div class="javlib-top-nav-dropdown" role="menu"></div>`;
   menu.addEventListener('mousedown', e => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) { e.preventDefault(); }
   }, true);
   const dropdown = menu.querySelector('.javlib-top-nav-dropdown'); const nodes = Array.from(source.children);
   for (let i = 0; i < nodes.length; i += 1) {
    const category = nodes[i]; const list = nodes[i + 1];
    if (!category?.classList?.contains('category') || !list?.matches?.('ul')) continue;
    const section = document.createElement('div');
    section.className = 'javlib-top-nav-section';
    const title = document.createElement('div');
    title.className = 'javlib-top-nav-title'; title.textContent = category.textContent.trim();
    const links = document.createElement('div');
    links.className = 'javlib-top-nav-links';
    list.querySelectorAll('a[href]').forEach(anchor => {
     const link = anchor.cloneNode(true);
     link.className = 'javlib-top-nav-link';
     links.appendChild(link);
    });
    section.append(title, links); dropdown.appendChild(section); }
   if (!dropdown.children.length) return;
   const movieSection = [...dropdown.querySelectorAll('.javlib-top-nav-section')].find(section => {
    return /影片|movies?/i.test(section.querySelector('.javlib-top-nav-title')?.textContent || '');
   }) || dropdown.querySelector('.javlib-top-nav-section');
   const movieLinks = movieSection?.querySelector('.javlib-top-nav-links');
   if (movieLinks && !movieLinks.querySelector('.javlib-123av-fc2-link')) {
    const link = document.createElement('a');
    link.href = '/cn/main.php?laosiji_123av_fc2=1'; link.className = 'javlib-top-nav-link javlib-123av-fc2-link'; link.title = '打开 123AV-FC2';
    link.textContent = '123AV-FC2';
    movieLinks.appendChild(link); }
   advSearch.append(document.createTextNode(' '), menu);
   injectStyle('javlib-top-nav-style',`#leftmenu{display:none!important}#rightcolumn{margin:0!important;width:100%!important;float:none!important}#topmenu .advsearch{position:relative!important;white-space:nowrap!important}.javlib-top-nav-menu{position:relative!important;display:inline-block!important;vertical-align:middle!important;margin-left:8px!important;z-index:10010!important}.javlib-top-nav-trigger{display:inline-flex!important;align-items:center!important;height:24px!important;padding:0 10px!important;border:1px solid #93c5fd!important;border-radius:999px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:14px!important;font-weight:800!important;line-height:24px!important;text-decoration:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.82),0 3px 9px rgba(37,99,235,.12)!important}.javlib-top-nav-menu:hover .javlib-top-nav-trigger,.javlib-top-nav-menu:focus-within .javlib-top-nav-trigger{background:#dbeafe!important;border-color:#60a5fa!important;color:#1e40af!important}.javlib-top-nav-dropdown{position:absolute!important;top:100%!important;left:0!important;display:none!important;min-width:280px!important;max-width:min(560px,86vw)!important;padding:18px 10px 10px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:linear-gradient(to bottom,rgba(255,255,255,0) 0,rgba(255,255,255,0) 8px,rgba(255,255,255,.98) 8px)!important;box-shadow:0 16px 36px rgba(15,23,42,.18)!important;box-sizing:border-box!important;white-space:normal!important;background-clip:padding-box!important}.javlib-top-nav-menu:hover .javlib-top-nav-dropdown,.javlib-top-nav-menu:focus-within .javlib-top-nav-dropdown{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}.javlib-top-nav-title{margin-bottom:6px!important;color:#0f172a!important;font-size:14px!important;font-weight:900!important}.javlib-top-nav-links{display:grid!important;gap:4px!important}.javlib-top-nav-link{display:block!important;min-height:22px!important;padding:3px 7px!important;border-radius:6px!important;color:#2563eb!important;font-size:14px!important;line-height:1.35!important;text-decoration:none!important}.javlib-top-nav-link:hover{background:#eff6ff!important;color:#1d4ed8!important;text-decoration:none!important}@media (max-width:720px){.javlib-top-nav-menu:hover .javlib-top-nav-dropdown,.javlib-top-nav-menu:focus-within .javlib-top-nav-dropdown{grid-template-columns:1fr!important}}`);
  },
  _insertTopSettingsButton() {
   const menu = document.querySelector('#topmenu .menutext, .menutext');
   if (!menu || menu.querySelector('.javlib-top-settings-btn')) return;
   const btn = document.createElement('a');
   btn.href = 'javascript:void(0)'; btn.className = 'javlib-top-settings-btn'; btn.textContent = '\u8001\u53f8\u673a\u8bbe\u7f6e';
   btn.title = '\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e';
   btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); QuickSettingsPanel.open(e.currentTarget); });
   const accountLink = menu.querySelector('a[href*="myaccount.php"]'); const sep = document.createTextNode(' | ');
   if (accountLink) {
    accountLink.after(sep, btn);
   } else { menu.append(sep, btn); }
   injectStyle('javlib-top-settings-style',`#topmenu .menutext .javlib-top-settings-btn,.menutext .javlib-top-settings-btn{color:#2563eb!important;font-weight:700!important;text-decoration:none!important}#topmenu .menutext .javlib-top-settings-btn:hover,.menutext .javlib-top-settings-btn:hover{color:#1d4ed8!important;text-decoration:underline!important}`);
  },
  _ensureDetailLayout() {
   const table = document.getElementById('video_jacket_info');
   if (!table) return null;
   const row = table.querySelector('tr');
   if (!row) return null;
   table.style.setProperty('width', '100%', 'important'); table.style.setProperty('display', 'block', 'important');
   if (MobilePolicy.isMobile()) {
    row.style.setProperty('display', 'block', 'important');
    ['gap', 'align-items', 'width'].forEach(name => row.style.removeProperty(name));
    ['--javlib-cover-flex', '--javlib-info-flex', '--javlib-magnet-flex'].forEach(name => row.style.removeProperty(name));
    row.querySelectorAll(':scope > td').forEach(cell => {
     ['display', 'flex', 'min-width', 'vertical-align', 'overflow', 'word-break'].forEach(name => cell.style.removeProperty(name));
    });
    return row; }
   row.style.setProperty('display', 'flex', 'important'); row.style.setProperty('gap', '20px', 'important');
   row.style.setProperty('align-items', 'flex-start', 'important'); row.style.setProperty('width', '100%', 'important');
   const detailDefaults = DetailFlex.defaultCss('javlib');
   row.style.setProperty('--javlib-cover-flex', row.style.getPropertyValue('--javlib-cover-flex') || detailDefaults.cover);
   row.style.setProperty('--javlib-info-flex', row.style.getPropertyValue('--javlib-info-flex') || detailDefaults.info);
   row.style.setProperty('--javlib-magnet-flex', row.style.getPropertyValue('--javlib-magnet-flex') || detailDefaults.magnet);
   const tds = row.querySelectorAll('td');
   if (tds[0]) {
    tds[0].style.setProperty('flex', 'var(--javlib-cover-flex) 1 0', 'important'); tds[0].style.setProperty('min-width', '0', 'important');
    tds[0].style.setProperty('vertical-align', 'top', 'important'); }
   if (tds[1]) {
    tds[1].style.setProperty('flex', 'var(--javlib-info-flex) 1 0', 'important'); tds[1].style.setProperty('min-width', '0', 'important');
    tds[1].style.setProperty('vertical-align', 'top', 'important'); tds[1].style.setProperty('overflow', 'hidden', 'important');
    tds[1].style.setProperty('word-break', 'break-word', 'important'); }
   const jacketImg = document.getElementById('video_jacket_img');
   if (jacketImg) {
    jacketImg.removeAttribute('width'); jacketImg.removeAttribute('height'); jacketImg.style.setProperty('width', '100%', 'important');
    jacketImg.style.setProperty('height', 'auto', 'important'); jacketImg.style.setProperty('max-width', '100%', 'important'); }
   return row; },
  _insertMagnet(avid) {
   if (MobilePolicy.effectiveMagnetDisplayMode() === 'native-replace') {
    document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove()); NativeMagnetPanel.mount('javlib', avid);
    return; }
   NativeMagnetPanel.remove('javlib');
   if (!MobilePolicy.usesDesktopMagnetTable()) return;
   document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove());
   const row = this._ensureDetailLayout();
   if (!row) return;
   const magnetTd = document.createElement('td');
   magnetTd.className = 'jav-nong-slot javlib-nong-slot';
   magnetTd.style.cssText = 'flex:var(--javlib-magnet-flex) 1 0;min-width:0;vertical-align:top;align-self:flex-start;';
   const innerWrap = document.createElement('div');
   innerWrap.style.cssText = 'display:inline-block;';
   const widget = Magnet.createMagnetWidget(avid);
   innerWrap.appendChild(widget); magnetTd.appendChild(innerWrap); row.appendChild(magnetTd); }, };
 const JavlibList = {
  _initListPage() {
   const list = document.querySelector('.videothumblist .videos');
   if (!list) return;
   const needStyle = list.dataset.laosijiGrid !== '1'; const cards = [...list.querySelectorAll(':scope > .video:not([data-laosiji-grid-card="1"])')];
   if (!cards.length && !needStyle) return;
   list.dataset.laosijiGrid = '1';
   list.classList.add('jav-card-grid', 'javlib-card-grid'); CardColumns.apply('javlib'); cards.forEach(card => this._decorateCard(card));
   if (needStyle) {
    GM_addStyle(`.jav-card-link:visited .jav-card-title,.jav-card-link:visited .javlib-card-headline,.jav-card-link:visited .javlib-card-code{color:#64748b!important}.javlib-card-link:visited .jav-card-title{background:#f8fafc!important}.javlib-card-link:visited .javlib-card-code{background:#e2e8f0!important}.jav-card-image{transition:opacity .18s ease!important}.javlib-cover-swapping{opacity:.42!important}.jav-card-title{--javlib-title-line-height:22px;display:flex!important;flex-direction:column!important;gap:6px!important;height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+54px)!important;max-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+54px)!important;flex:0 0 auto!important;min-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+54px)!important;padding:9px 10px 10px!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:var(--javlib-title-line-height)!important}.jav-card-title:has(.javlib-card-footer>*){height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+82px)!important;max-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+82px)!important;min-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+82px)!important}.javlib-card-code-row{display:flex!important;align-items:center!important;flex:0 0 22px!important;height:22px!important;max-height:22px!important;min-height:22px!important;overflow:hidden!important}.javlib-card-headline{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:var(--jav-card-title-lines,2)!important;line-clamp:var(--jav-card-title-lines,2)!important;height:calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;max-height:calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;min-height:calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:normal!important;word-break:break-word!important;color:inherit!important;flex:0 0 calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;line-height:var(--javlib-title-line-height)!important}.javlib-card-code{display:inline-flex!important;align-items:center!important;max-width:100%!important;padding:2px 7px!important;border-radius:999px!important;background:#eef2ff!important;color:inherit!important;font-size:14px!important;line-height:1.35!important;font-weight:800!important;letter-spacing:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.javlib-card-footer{display:none!important;align-items:center!important;gap:6px!important;min-height:0!important;margin-top:auto!important;overflow:hidden!important}.javlib-card-footer:not(:empty){display:flex!important;flex:0 0 22px!important;height:22px!important;max-height:22px!important;min-height:22px!important}.videothumblist{width:100%!important}.videothumblist .videos.javlib-card-grid{--jav-card-columns:5}.videothumblist .video.javlib-grid-card .id{display:none!important}.videothumblist .video.javlib-grid-card .toolbar{display:none!important}@media (max-width:1100px){.videothumblist .videos.javlib-card-grid{--jav-card-columns:4}}@media (max-width:820px){.videothumblist .videos.javlib-card-grid{--jav-card-columns:3}}@media (max-width:560px){.videothumblist .videos.javlib-card-grid{--jav-card-columns:2;gap:10px!important}}`);
   }
   setTimeout(() => {
    Runtime.refreshListDecorations();
   }, 0); },
  _decorateCard(card) {
   if (!card) return;
   card.dataset.laosijiGridCard = '1';
   card.classList.add('jav-card', 'javlib-grid-card');
   const anchor = card.querySelector(':scope > a[href]:not(.emby-javlibrary-list-badge)');
   anchor?.classList.add('jav-card-link', 'javlib-card-link');
   if (anchor && !anchor.querySelector('.jav-pan115-badge')) { delete anchor.dataset.pan115Checked; delete anchor.dataset.pan115HasBadge; }
   const idEl = card.querySelector('.id'); const titleEl = card.querySelector('.title');
   titleEl?.classList.add('jav-card-title', 'javlib-card-title');
   if (idEl && titleEl && !titleEl.querySelector('.javlib-card-headline')) {
    const code = idEl.textContent.trim(); const titleText = titleEl.textContent.trim();
    titleEl.textContent = '';
    const codeRow = document.createElement('span');
    codeRow.className = 'javlib-card-code-row';
    const strong = document.createElement('strong');
    strong.className = 'javlib-card-code'; strong.textContent = code;
    codeRow.appendChild(strong);
    const headline = document.createElement('span');
    headline.className = 'javlib-card-headline'; headline.textContent = titleText;
    const footer = document.createElement('span');
    footer.className = 'javlib-card-footer';
    titleEl.appendChild(codeRow); titleEl.appendChild(headline); titleEl.appendChild(footer);
    titleEl.dataset.laosijiCodeMerged = '1'; }
   const img = card.querySelector('img[src]');
   if (!img) return;
   const src = img.getAttribute('src') || ''; const fullSrc = src.replace(/ps\.jpg(?:([?#].*)?)$/i, 'pl.jpg$1');
   if (fullSrc !== src) img.dataset.laosijiLandscapeSrc = img.dataset.laosijiLandscapeSrc || fullSrc;
   if (!PortraitCards.effective('javlib') && fullSrc !== src && img.dataset.laosijiCoverPreloaded !== '1' && img.dataset.laosijiCoverLoading !== '1') {
    img.dataset.laosijiCoverLoading = '1';
    const preloader = new Image();
    preloader.onload = () => {
     img.dataset.laosijiCoverPreloaded = '1';
     delete img.dataset.laosijiCoverLoading;
     if (PortraitCards.effective('javlib')) return;
     img.classList.add('javlib-cover-swapping');
     setTimeout(() => {
      if (PortraitCards.effective('javlib')) return;
      img.src = fullSrc;
      img.setAttribute('src', fullSrc);
      requestAnimationFrame(() => { img.classList.remove('javlib-cover-swapping'); });
     }, 90); };
    preloader.onerror = () => {
     img.dataset.laosijiCoverPreloaded = '1';
     delete img.dataset.laosijiCoverLoading; };
    preloader.src = fullSrc; }
   img.removeAttribute('width'); img.removeAttribute('height'); img.classList.add('jav-card-image', 'javlib-card-image');
   if (!img.closest('.javlib-cover-frame')) {
    const frame = document.createElement('div');
    frame.className = 'jav-card-cover javlib-cover-frame';
    img.parentNode.insertBefore(frame, img); frame.appendChild(img);
   } else { img.closest('.javlib-cover-frame')?.classList.add('jav-card-cover'); } },
  _initHomePage() {
   if (document.body.dataset.laosijiJavlibHome === '1') return;
   document.body.dataset.laosijiJavlibHome = '1';
   document.body.classList.add('javlib-home-page');
   const rightColumn = document.querySelector('#rightcolumn');
   rightColumn?.querySelectorAll(':scope > .titlebox, :scope > table.about').forEach(el => { el.style.setProperty('display', 'none', 'important'); });
   GM_addStyle(`body.javlib-home-page #rightcolumn>.videothumblist{height:auto!important;max-height:none!important;overflow:visible!important}body.javlib-home-page #rightcolumn>br{display:none!important}`);
  }, };
 Object.assign(SiteJavLib, JavlibList);
 const JavlibMobileForum = {
  ready: false,
  shell: null,
  lastRightColumn: null,
  commentsShell: null,
  lastComments: null,
  reviewsShell: null,
  lastReviews: null,
  movable: new Map(),
  init() {
   if (!this.ready) { this.ready = true; MobilePolicy.onChange(() => this.sync()); }
   this.sync(); },
  isMobile() { return MobilePolicy.isMobile() && !!document.body?.matches('[data-laosiji-javlib]'); },
  getContext() {
   const rightColumn = document.querySelector('#rightcolumn');
   if (!rightColumn) return null;
   const title = rightColumn.querySelector(':scope > .boxtitle'); const table = rightColumn.querySelector(':scope > table.pubgroup');
   const posts = rightColumn.querySelector(':scope > #publicposts');
   const pageType = posts ? 'topic' : table?.querySelector(':scope > tbody > tr#header .pgtopic') ? 'topics' : table ? 'groups' : '';
   if (!title || !pageType) return null;
   return { rightColumn, title, table, posts, pageType }; },
  sync() {
   const context = this.getContext();
   if (!this.isMobile()) {
    this.restore(context?.rightColumn || this.lastRightColumn); this.restoreComments(); this.restoreReviews();
    return; }
   if (context) this.render(context);
   else this.restore(this.lastRightColumn);
   const comments = this.getCommentsContext();
   if (comments) this.renderComments(comments);
   else this.restoreComments();
   const reviews = this.getReviewsContext();
   if (reviews) this.renderReviews(reviews);
   else this.restoreReviews();
  },
  render(context) {
   const { rightColumn, title, table, posts, pageType } = context;
   this.lastRightColumn = rightColumn;
   this.restoreMovedNodes(rightColumn); this.shell?.remove();
   this.shell = document.createElement('section');
   this.shell.className =`javlib-forum-shell javlib-forum-${pageType}`;
   this.shell.setAttribute('aria-label', title.textContent.trim()); this.shell.appendChild(this.createHeading(title));
   const tools = this.findDirect(rightColumn, '.right');
   if (tools) { this.moveNode(tools, this.shell); tools.classList.add('javlib-forum-tools'); }
   if (pageType === 'topic') this.shell.appendChild(this.createPosts(posts));
   else this.shell.appendChild(this.createTableCards(table));
   const pagination = this.findDirect(rightColumn, '.page_selector');
   if (pagination) { this.moveNode(pagination, this.shell); pagination.classList.add('javlib-forum-pagination'); }
   const divider = this.findDirect(rightColumn, 'hr.grey');
   if (divider) { this.moveNode(divider, this.shell); divider.classList.add('javlib-forum-divider'); }
   title.classList.add('javlib-forum-source-hidden'); table?.classList.add('javlib-forum-source-hidden'); posts?.classList.add('javlib-forum-source-hidden');
   rightColumn.appendChild(this.shell); },
  getCommentsContext() {
   const container = document.querySelector('#video_comments');
   if (!container) return null;
   const title = container.querySelector(':scope > .header'); const allLang = container.querySelector(':scope > #video_comments_alllang');
   const comments = [...container.querySelectorAll(':scope > table.comment')];
   if (!title || !comments.length) return null;
   return { container, title, allLang, comments }; },
  renderComments(context) {
   const { container, title, allLang, comments } = context;
   this.lastComments = container;
   this.restoreMovedNodes(container); this.commentsShell?.remove();
   this.commentsShell = document.createElement('section'); this.commentsShell.className = 'javlib-forum-shell javlib-comments-shell';
   this.commentsShell.setAttribute('aria-label', title.textContent.trim()); this.commentsShell.appendChild(this.createHeading(title));
   if (allLang) { this.moveNode(allLang, this.commentsShell); allLang.classList.add('javlib-forum-tools', 'javlib-comments-tools'); }
   this.commentsShell.appendChild(this.createCommentCards(comments)); title.classList.add('javlib-forum-source-hidden');
   comments.forEach(comment => comment.classList.add('javlib-forum-source-hidden')); container.appendChild(this.commentsShell); },
  getReviewsContext() {
   const container = document.querySelector('#video_reviews');
   if (!container) return null;
   const title = container.querySelector(':scope > .header'); const reviews = [...container.querySelectorAll(':scope > table.review')];
   if (!title || !reviews.length) return null;
   return { container, title, reviews }; },
  renderReviews(context) {
   const { container, title, reviews } = context;
   this.lastReviews = container;
   this.restoreMovedNodes(container); this.reviewsShell?.remove();
   this.reviewsShell = document.createElement('section'); this.reviewsShell.className = 'javlib-forum-shell javlib-reviews-shell';
   this.reviewsShell.setAttribute('aria-label', title.textContent.trim()); this.reviewsShell.appendChild(this.createHeading(title));
   this.reviewsShell.appendChild(this.createCommentCards(reviews, 'review'));
   const divider = this.findDirect(container, 'hr.grey');
   if (divider) { this.moveNode(divider, this.reviewsShell); divider.classList.add('javlib-forum-divider'); }
   title.classList.add('javlib-forum-source-hidden'); reviews.forEach(review => review.classList.add('javlib-forum-source-hidden'));
   container.appendChild(this.reviewsShell); },
  restore(rightColumn) {
   this.shell?.remove();
   this.shell = null;
   rightColumn?.querySelector(':scope > .boxtitle')?.classList.remove('javlib-forum-source-hidden');
   rightColumn?.querySelector(':scope > table.pubgroup')?.classList.remove('javlib-forum-source-hidden');
   rightColumn?.querySelector(':scope > #publicposts')?.classList.remove('javlib-forum-source-hidden'); this.restoreMovedNodes(rightColumn); },
  findDirect(parent, selector) { return [...(parent?.children || [])].find(child => child.matches(selector)) || null; },
  moveNode(node, target) {
   if (!node || !target) return;
   let placeholder = this.movable.get(node);
   if (!placeholder) {
    placeholder = document.createComment('javlib forum source position');
    node.parentNode?.insertBefore(placeholder, node); this.movable.set(node, placeholder); }
   target.appendChild(node); },
  restoreMovedNodes(rightColumn) {
   [...this.movable.entries()].forEach(([node, placeholder]) => {
    if (!placeholder.parentNode || (rightColumn && !rightColumn.contains(placeholder))) return;
    placeholder.parentNode.insertBefore(node, placeholder.nextSibling);
    node.classList.remove(
     'javlib-forum-tools',
     'javlib-forum-pagination',
     'javlib-forum-divider',
     'javlib-comments-tools',
     'javlib-feedback-score',
     'javlib-feedback-toolbar',
     'javlib-comment-score',
     'javlib-comment-toolbar',
     'javlib-review-score',
     'javlib-review-toolbar',
    );
   }); },
  createHeading(source) {
   const heading = document.createElement('div');
   heading.className = 'javlib-forum-heading';
   const before = document.createElement('span');
   before.className = 'javlib-forum-heading-line';
   before.setAttribute('aria-hidden', 'true'); heading.appendChild(before);
   const content = document.createElement('span');
   content.className = 'javlib-forum-heading-content';
   this.copyChildren(source, content); heading.appendChild(content);
   const after = document.createElement('span');
   after.className = 'javlib-forum-heading-line';
   after.setAttribute('aria-hidden', 'true'); heading.appendChild(after);
   return heading; },
  restoreComments(container = this.lastComments) {
   this.commentsShell?.remove();
   this.commentsShell = null;
   container?.querySelector(':scope > .header')?.classList.remove('javlib-forum-source-hidden');
   container?.querySelectorAll(':scope > table.comment').forEach(comment => { comment.classList.remove('javlib-forum-source-hidden'); });
   this.restoreMovedNodes(container); },
  restoreReviews(container = this.lastReviews) {
   this.reviewsShell?.remove();
   this.reviewsShell = null;
   container?.querySelector(':scope > .header')?.classList.remove('javlib-forum-source-hidden');
   container?.querySelectorAll(':scope > table.review').forEach(review => { review.classList.remove('javlib-forum-source-hidden'); });
   this.restoreMovedNodes(container); },
  createTableCards(table) {
   const list = document.createElement('div');
   list.className = 'javlib-forum-card-list';
   const rows = [...(table?.querySelectorAll(':scope > tbody > tr:not(#header)') || [])];
   rows.forEach(row => {
    const cells = [...row.cells];
    if (!cells.length) return;
    const card = document.createElement('article');
    card.className =`javlib-forum-data-card${row.classList.contains('dimrow') ? ' is-dim' : ''}`;
    const primary = document.createElement('div');
    primary.className = 'javlib-forum-card-primary';
    this.copyCell(cells[0], primary); card.appendChild(primary); list.appendChild(card);
   });
   return list; },
  createCommentCards(comments, kind = 'comment') {
   const list = document.createElement('div');
   list.className =`javlib-forum-post-list javlib-${kind}-list`;
   comments.forEach(source => {
    const card = document.createElement('article');
    card.className =`javlib-forum-post-card javlib-${kind}-card`;
    const meta = document.createElement('div');
    meta.className =`javlib-forum-post-meta javlib-feedback-meta javlib-${kind}-meta`;
    this.copyNode(source.querySelector('td.info'), meta); card.appendChild(meta);
    const body = document.createElement('div');
    body.className =`javlib-forum-post-body javlib-feedback-body javlib-${kind}-body`;
    this.copyNode(source.querySelector('td.t'), body); card.appendChild(body);
    const footer = document.createElement('div');
    footer.className =`javlib-forum-post-footer javlib-feedback-footer javlib-${kind}-footer`;
    this.copyNode(source.querySelector('td.date'), footer);
    const score = source.querySelector('tr:first-child > td.scores');
    if (score) {
     this.moveNode(score, footer);
     score.classList.add('javlib-feedback-score',`javlib-${kind}-score`);
    }
    const toolbar = source.querySelector('td.toolbar');
    if (toolbar) {
     this.moveNode(toolbar, footer);
     toolbar.classList.add('javlib-feedback-toolbar',`javlib-${kind}-toolbar`);
    }
    card.appendChild(footer); list.appendChild(card);
   });
   return list; },
  createPosts(posts) {
   const list = document.createElement('div');
   list.className = 'javlib-forum-post-list';
   [...(posts?.querySelectorAll(':scope > table.post') || [])].forEach(source => {
    const card = document.createElement('article');
    card.className = 'javlib-forum-post-card';
    const meta = document.createElement('div');
    meta.className = 'javlib-forum-post-meta';
    this.copyNode(source.querySelector('.info'), meta); card.appendChild(meta);
    const body = document.createElement('div');
    body.className = 'javlib-forum-post-body';
    this.copyNode(source.querySelector('.t'), body); card.appendChild(body);
    const footer = document.createElement('div');
    footer.className = 'javlib-forum-post-footer';
    this.copyNode(source.querySelector('.date'), footer); this.moveNode(source.querySelector('.toolbar'), footer); card.appendChild(footer);
    list.appendChild(card);
   });
   return list; },
  copyCell(source, target) {
   if (source) target.innerHTML = source.innerHTML;
  },
  copyNode(source, target) {
   if (!source) return;
   const clone = document.createElement('div');
   clone.className = source.className || ''; clone.innerHTML = source.innerHTML;
   target.appendChild(clone); },
  copyChildren(source, target) {
   [...source.childNodes].forEach(node => target.appendChild(node.cloneNode(true))); }, };
 SiteJavLib._initMobileForum = () => JavlibMobileForum.init();
 Core.expose('__LAOSIJI_JAVLIB_MOBILE_FORUM__', JavlibMobileForum);
 GM_addStyle(`html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo{display:block!important;clear:both!important;float:none!important;position:relative!important;z-index:1!important;height:auto!important;min-height:0!important;margin:0!important;padding:8px 12px!important;overflow:visible!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo .sitelogo{display:block!important;float:none!important;position:static!important;width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;text-align:center!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo .sitelogo a{display:inline-block!important;max-width:100%!important;height:auto!important;line-height:0!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo .sitelogo img{display:block!important;width:min(280px,100%)!important;height:auto!important;max-width:100%!important;margin:0 auto!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #content{display:block!important;clear:both!important;position:relative!important;top:auto!important;margin:0!important;padding:0 12px 16px!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #rightcolumn{display:block!important;clear:both!important;float:none!important;position:relative!important;z-index:0!important;width:100%!important;min-width:0!important;max-width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-source-hidden{display:none!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-shell{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important;color:#1f2937!important;font:14px/1.5 Arial,"Microsoft YaHei",sans-serif!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-heading{display:flex!important;align-items:flex-start!important;width:100%!important;min-width:0!important;gap:10px!important;margin:0 0 12px!important;padding:7px 0!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-heading-line{flex:1 1 0!important;min-width:14px!important;height:1px!important;margin-top:11px!important;background:#cbd5e1!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-heading-content{flex:0 1 auto!important;min-width:0!important;max-width:calc(100% - 48px)!important;color:#111827!important;font-size:16px!important;font-weight:700!important;line-height:1.45!important;text-align:center!important;overflow-wrap:anywhere!important;word-break:break-word!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-heading-content a{color:inherit!important;overflow-wrap:anywhere!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-tools{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:7px!important;width:100%!important;min-width:0!important;margin:0 0 10px!important;padding:0!important;float:none!important;clear:both!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-tools>*{max-width:100%!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-card-list,html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-list{display:grid!important;gap:9px!important;width:100%!important;min-width:0!important;margin:0!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-data-card,html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-card{display:block!important;width:100%!important;min-width:0!important;margin:0!important;padding:0!important;border:1px solid #d7dee8!important;border-radius:4px!important;background:#fff!important;box-shadow:0 1px 3px rgba(15,23,42,.06)!important;box-sizing:border-box!important;overflow:hidden!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-data-card.is-dim{background:#f8fafc!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-card-primary{display:block!important;min-width:0!important;padding:10px 11px 9px!important;border-bottom:1px solid #e5e7eb!important;color:#111827!important;line-height:1.45!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-card-primary a{color:inherit!important;font-weight:700!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-card-primary .desc{display:block!important;margin-top:3px!important;color:#64748b!important;font-size:12px!important;font-weight:400!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-meta{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px 8px!important;min-width:0!important;padding:8px 10px!important;border-bottom:1px dashed #d7dee8!important;background:#f8fafc!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-meta .postid{color:#94a3b8!important;font-size:11px!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-meta .userid{font-weight:700!important;overflow-wrap:anywhere!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-meta .nickname{display:flex!important;align-items:center!important;margin-left:auto!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-meta .imageflag{width:22px!important;height:auto!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-body{min-width:0!important;padding:11px 10px 13px!important;color:#1f2937!important;line-height:1.6!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-body .posttext{display:block!important;margin:0!important;padding:0!important;white-space:normal!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-body>.t>br{display:none!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-comments-shell{margin-top:12px!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-comments-tools{justify-content:flex-end!important;margin:-4px 0 8px!important;font-size:12px!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-body .text{display:block!important;width:auto!important;max-width:100%!important;min-width:0!important;margin:0!important;box-sizing:border-box!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-body .text img{display:block!important;max-width:100%!important;height:auto!important;margin:6px 0!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-body .quote{max-width:100%!important;box-sizing:border-box!important;overflow-wrap:anywhere!important;word-break:break-word!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-footer{justify-content:flex-start!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-score{display:flex!important;flex:0 0 auto!important;align-items:center!important;width:auto!important;min-width:0!important;padding:0!important;border:0!important;background:transparent!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-score>table{width:auto!important;margin:0!important;border-collapse:collapse!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-score td{width:auto!important;padding:0 3px!important;white-space:nowrap!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-feedback-toolbar{display:flex!important;flex:0 0 auto!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;width:auto!important;min-width:0!important;margin-left:auto!important;padding:0!important;border:0!important;background:transparent!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-review-meta .rating9,html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-review-meta .rating10{flex:0 0 auto!important;margin-right:2px!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-footer{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:7px!important;min-width:0!important;padding:8px 10px!important;border-top:1px solid #eef2f7!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-footer .date{color:#64748b!important;font-size:11px!important;overflow-wrap:anywhere!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-footer .toolbar{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-left:auto!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-post-footer .smallbutton{min-height:30px!important;margin:0!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-pagination{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;gap:6px!important;width:100%!important;margin:12px 0 0!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-pagination a{min-height:32px!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .javlib-forum-divider{width:100%!important;margin:12px 0 0!important}@media (max-width:390px){}`);
 const SiteSukebei = {
  match() { return /(?:^|\.)sukebei\.nyaa\.si$/i.test(location.hostname); },
  isDetailPage() { return /^\/view\/\d+\/?$/i.test(location.pathname) && !!document.querySelector('#torrent-description'); },
  getVid() {
   const title = document.querySelector('.panel-title')?.textContent || document.title; const code = Utils.extractCode(title);
   return code ? normalizeAvid(code) : ''; },
  initPage(avid) {
   if (!this.isDetailPage() || !avid) return;
   this._insertDescriptionMagnetWhenReady(avid); },
  _isDescriptionRendered(description) {
   if (!description) return false;
   if (description.dataset.laosijiMagnetLayout === '1') return true;
   if (description.querySelector('p,br,hr,a,img,ul,ol,blockquote')) return true;
   return !description.hasAttribute('markdown-text'); },
  _insertDescriptionMagnetWhenReady(avid) {
   const description = document.querySelector('#torrent-description');
   if (!description || description.dataset.laosijiMagnetLayout === '1') return;
   if (this._isDescriptionRendered(description)) { this._insertDescriptionMagnet(avid); return; }
   if (description.dataset.laosijiMagnetPending === '1') return;
   description.dataset.laosijiMagnetPending = '1';
   let tries = 0; let timer = 0; let observer = null;
   const finish = () => {
    if (timer) clearInterval(timer);
    observer?.disconnect?.(); delete description.dataset.laosijiMagnetPending; };
   const tryInsert = () => {
    const current = document.querySelector('#torrent-description');
    if (!current || current.dataset.laosijiMagnetLayout === '1') { finish(); return; }
    if (this._isDescriptionRendered(current)) { finish(); this._insertDescriptionMagnet(avid); return; }
    tries += 1;
    if (tries >= 80) finish();
   };
   if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(tryInsert);
    observer.observe(description, { childList: true, subtree: true, characterData: true }); }
   timer = setInterval(tryInsert, 125);
   tryInsert(); },
  _insertDescriptionMagnet(avid) {
   const description = document.querySelector('#torrent-description');
   if (!description || description.dataset.laosijiMagnetLayout === '1' || !this._isDescriptionRendered(description)) return;
   injectStyle('sukebei-magnet-description-style',`#torrent-description .sukebei-description-layout{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(520px,560px);grid-template-areas:"original magnet";gap:18px;align-items:start}#torrent-description .sukebei-description-original{grid-area:original;min-width:0;overflow-wrap:anywhere;word-break:break-word}#torrent-description .sukebei-description-original>:first-child{margin-top:0}#torrent-description .sukebei-description-original img{max-width:100%;height:auto}#torrent-description .sukebei-magnet-pane{grid-area:magnet;width:100%;min-width:520px;align-self:start}#torrent-description .sukebei-magnet-pane .jav-nong-wrapper{display:block!important;width:100%!important;max-width:560px!important;margin:0!important}@media (max-width:991px){#torrent-description .sukebei-description-layout{grid-template-columns:minmax(0,1fr);grid-template-areas:"original" "magnet"}#torrent-description .sukebei-magnet-pane{min-width:0}#torrent-description .sukebei-magnet-pane .jav-nong-wrapper{max-width:100%!important;margin-left:0!important}}`);
   const original = document.createElement('div');
   original.className = 'sukebei-description-original';
   const divider = Array.from(description.children).find((node) => node.tagName === 'HR') || null;
   while (description.firstChild && description.firstChild !== divider) { original.appendChild(description.firstChild); }
   const magnetPane = document.createElement('div');
   magnetPane.className = 'sukebei-magnet-pane';
   magnetPane.appendChild(Magnet.createMagnetWidget(avid));
   const layout = document.createElement('div');
   layout.className = 'sukebei-description-layout';
   layout.appendChild(original); layout.appendChild(magnetPane); description.classList.add('laosiji-sukebei-description');
   description.dataset.laosijiMagnetLayout = '1';
   description.insertBefore(layout, divider); }, };
 const SiteAdapters = [SiteJavBus, SiteJavDB, SiteJavLib, SiteSukebei];
 const SiteManager = {
  list: SiteAdapters,
  javdbGuardsReady: false,
  current() { return this.list.find(s => s.match()) || null; },
  isDetailPage() { return isCurrentDetailPage(); },
  getListCards(doc = document) {
   return [
    ...doc.querySelectorAll('.javbus-card-grid > .item, .javdb-card-grid > .item, .videothumblist .videos.javlib-card-grid > .video, .torrent-list > tbody > tr')
   ]; },
  getCardCover(card) { return card?.querySelector('.jav-card-cover') || null; },
  getCardCode(card) {
   if (!card) return '';
   const explicitNode = card.querySelector('.javbus-card-code, .javlib-card-code, .id, [data-code]:not(.jav-card-quick-actions):not(.jav-card-quick-btn):not(.jav-card-quick-menu):not(.jav-card-quick-menu-popover)');
   const explicitCode = explicitNode?.getAttribute?.('data-code')?.trim() || explicitNode?.textContent?.trim();
   if (explicitCode) {
    const normalized = Utils.extractCode(explicitCode) || Utils.normalizeCode(explicitCode);
    if (normalized) return normalized;
   }
   let fallbackCard = card;
   if (typeof card.cloneNode === 'function') {
    fallbackCard = card.cloneNode(true);
    fallbackCard.querySelectorAll?.('.jav-card-quick-actions, .jav-card-quick-menu, .jav-card-quick-menu-popover, .jav-sukebei-offline-115').forEach(el => el.remove());
   }
   const titleText = [
    fallbackCard.querySelector('.javdb-card-headline')?.textContent,
    fallbackCard.querySelector('.javlib-card-headline')?.textContent,
    fallbackCard.querySelector('.javbus-card-headline')?.textContent,
    fallbackCard.querySelector('.video-title')?.textContent,
    fallbackCard.querySelector('.title')?.textContent,
    fallbackCard.querySelector('a[title]')?.getAttribute('title'),
    fallbackCard.textContent
   ].filter(Boolean).join(' '); return Utils.extractCode(titleText) || ''; },
  getInfiniteScrollContainer(site, doc = document) {
   if (site === 'javbus') { return doc === document ? SiteJavBus._getGridContainer() : doc.querySelector('#waterfall'); }
   if (site === 'javdb') { return doc.querySelector('.movie-list') || doc.querySelector('.movies') || doc.querySelector('.grid'); }
   if (site === 'javlib') { return doc.querySelector('.videothumblist .videos'); }
   return null; },
  getInfiniteScrollConfig(doc = document, baseUrl = location.href) {
   if (SiteJavBus.match()) {
    if (SiteJavBus.isActorIndexPage(baseUrl)) return null;
    const container = this.getInfiniteScrollContainer('javbus', doc);
    if (!container) return null;
    const { nextUrl } = SiteJavBus._resolveListNext(doc, baseUrl);
    if (!nextUrl) return null;
    return { site: 'javbus', container, nextUrl, itemSelector: '#waterfall > .item', paginationSelector: '.pagination' }; }
   if (SiteJavDB.match()) {
    const container = this.getInfiniteScrollContainer('javdb', doc);
    const next = doc.querySelector('a.pagination-next[rel="next"][href], a[rel="next"].pagination-link[href]');
    const nextHref = next?.getAttribute('href')?.trim();
    if (!container || !nextHref) return null;
    let nextUrl;
    try {
     nextUrl = new URL(nextHref, baseUrl).href;
    } catch { return null; }
    return { site: 'javdb', container, nextUrl, itemSelector: '.movie-list .item, .movies .item, .grid .item', paginationSelector: 'nav.pagination' }; }
   if (SiteJavLib.match()) {
    const container = this.getInfiniteScrollContainer('javlib', doc); const next = doc.querySelector('.page_selector a.page.next[href]');
    const nextHref = next?.getAttribute('href')?.trim();
    if (!container || !nextHref) return null;
    let nextUrl;
    try {
     nextUrl = new URL(nextHref, baseUrl).href;
    } catch { return null; }
    return { site: 'javlib', container, nextUrl, itemSelector: '.videothumblist .videos > .video', paginationSelector: '.page_selector' }; }
   return null; },
  decorateInfiniteScrollItem(site, item) {
   if (site === 'javbus') SiteJavBus._decorateCard?.(item);
   if (site === 'javdb') SiteJavDB._decorateCard?.(item);
   if (site === 'javlib') SiteJavLib._decorateCard?.(item);
   ListPreview.attach(item); },
  reflowInfiniteScroll(site, container) {
   if (site === 'javbus') {
    const live = this.getInfiniteScrollContainer('javbus') || container;
    live?.querySelectorAll(':scope > .item').forEach(item => SiteJavBus._decorateCard?.(item));
    return live || container; }
   if (site === 'javlib') {
    const live = this.getInfiniteScrollContainer('javlib') || container;
    live?.querySelectorAll(':scope > .video').forEach(item => SiteJavLib._decorateCard?.(item));
    return live || container; }
   const jq = window.jQuery || window.$;
   if (jq && jq(container).masonry) { jq(container).masonry('reloadItems'); jq(container).masonry('layout'); }
   return container; },
  findPan115TitleTextNode(anchor) {
   const root = anchor.querySelector('.video-title, .title, [class*="title"], h1, h2, h3, h4, h5, p') || anchor;
   const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) { return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
   });
   return walker.nextNode(); },
  getPan115ListCard(anchor) {
   return anchor?.closest?.([
    '.video-img-box',
    '.card',
    '.video-list-row',
    '.movie-list .item',
    '.movies .item',
    '.grid .item',
    '#waterfall .item',
    '.videothumblist .video',
    '.thumbnail',
    '.post',
   ].join(',')) || null; },
  findPan115TitleAnchor(anchor) {
   if (!anchor || anchor.closest('.jav-jump-btn-group, .jav-pan115-badge')) return null;
   if (anchor.closest('.emby-btn, .emby-badge, .emby-button-group, .emby-javlibrary-list-badge')) return null;
   const href = anchor.getAttribute('href') || '';
   if (/^(?:magnet:|javascript:|#)/i.test(href)) return null;
   const text = [
    anchor.getAttribute('title'),
    anchor.getAttribute('aria-label'),
    anchor.textContent,
    href,
   ].filter(Boolean).join(' ');
   const code = Utils.extractCode(text); const pan115Code = Pan115.extractCode(text, code);
   if (!code || !pan115Code) return null;
   const visibleTitle = (anchor.textContent || anchor.getAttribute('title') || '').trim(); const hasTitleText = visibleTitle.length > 0;
   const visibleTitleHasCode = !!Utils.extractCode(visibleTitle);
   if (!hasTitleText) return null;
   const card = this.getPan115ListCard(anchor);
   if (card && anchor.querySelector('img') && !visibleTitleHasCode) {
    const titleAnchor = card.querySelector('.card__title .card__link[href], .detail .title a[href], h6.title a[href], .video-title a[href], .title a[href]');
    if (titleAnchor && titleAnchor !== anchor) return null;
   }
   const looksLikeVideoLink =
    /\/v\/\w+/i.test(href) || /(?:^|\/|\.)jav\w+\.html(?:[?#].*)?$/i.test(href) || /\/videos\/[a-z0-9-]+\/?/i.test(href) ||
    /\/(?:[a-z]{2,15}-\d{2,10}|fc2[-_]?ppv[-_]?\d{6,9})\/?$/i.test(href) || /\/(?:[a-z]{2,15}\d{3,6})\/?$/i.test(href) ||
    /(?:movie|video|detail|view|jav)/i.test(href);
   const inListContainer = !!anchor.closest('.movie-list, .movies, .grid, #waterfall, .movie-box, .box, .thumbnail, .video-img-box, .card, .video-list, .video-list-row, .section-container, .videothumblist');
   if (!looksLikeVideoLink && !inListContainer) return null;
   if (hasTitleText && !visibleTitleHasCode && !looksLikeVideoLink) return null;
   return { anchor, code: pan115Code }; },
  collectPan115ListTargets() {
   if (this.isDetailPage()) return [];
   const isSupjavList = /supjav\.com/.test(location.hostname); const seen = new Set(); const seenCardCodes = new Map(); const targets = [];
   const pushTarget = target => {
    if (!target?.anchor || !target.code) return;
    const card = this.getPan115ListCard(target.anchor) || target.anchor; const normalized = Pan115.normalizeKeepSeparator(target.code) || target.code;
    let codes = seenCardCodes.get(card);
    if (!codes) { codes = new Set(); seenCardCodes.set(card, codes); }
    if (codes.has(normalized)) return;
    codes.add(normalized); targets.push(target); };
   if (/(javlibrary|javlib|r86m|s87n)/i.test(location.hostname)) {
    document.querySelectorAll('.videothumblist .video > a[href]:not(.emby-javlibrary-list-badge)').forEach(anchor => {
     if (seen.has(anchor) || anchor.dataset.pan115Checked === '1') return;
     if (anchor.closest('.emby-btn, .emby-badge, .emby-button-group, .emby-javlibrary-list-badge')) return;
     const card = anchor.closest('.video');
     const text = [
      card?.querySelector('.id')?.textContent,
      card?.querySelector('.title')?.textContent,
      anchor.getAttribute('title'),
      anchor.href,
     ].filter(Boolean).join(' ');
     const code = Utils.extractCode(text); const pan115Code = Pan115.extractCode(text, code);
     if (!code || !pan115Code) return;
     seen.add(anchor);
     pushTarget({ anchor, code: pan115Code });
    }); }
   const selectors = [ ...(isSupjavList ? ['.post h3 a[href]'] : []),
    '.card__title .card__link[href]',
    '.video-img-box .detail .title a[href]',
    '.video-img-box h6.title a[href]',
    '.movie-list a[href]',
    '.videothumblist .video > a[href]:not(.emby-javlibrary-list-badge)',
    '.movies a[href]',
    '.grid a[href]',
    '.item a[href]',
    '.video-title a[href]',
    'a.movie-box[href]',
    'a.box[href]',
    'a[href*="/v/"]',
    'a[title][href]', ];
   document.querySelectorAll(selectors.join(',')).forEach(anchor => {
    if (seen.has(anchor) || anchor.dataset.pan115Checked === '1') return;
    if (isSupjavList && !anchor.matches('.post h3 a[href]')) return;
    seen.add(anchor);
    const target = this.findPan115TitleAnchor(anchor);
    if (target) pushTarget(target);
   });
   return targets; },
  insertPan115ListBadge(anchor, hit, code) {
   const matches = (Array.isArray(hit) ? hit : hit?.pickcode ? [hit] : []).filter(item => item?.pickcode);
   if (!Pan115.enabled() || !matches.length || !anchor || anchor.dataset.pan115HasBadge === '1') return;
   if (anchor.matches?.('.emby-javlibrary-list-badge') || anchor.closest?.('.emby-btn, .emby-badge, .emby-button-group, .emby-javlibrary-list-badge')) return;
   const card = this.getPan115ListCard(anchor);
   const hasSameBadge = root => !!root && [...root.querySelectorAll('.jav-pan115-badge[data-pickcode]')]
    .some(badge => matches.some(item => badge.dataset.pickcode === item.pickcode));
   if (hasSameBadge(card) || (!card && hasSameBadge(anchor.parentElement))) { anchor.dataset.pan115HasBadge = '1'; return; }
   const title = anchor.querySelector('.title, .video-title');
   if (title) {
    const badge = createPan115Badge(matches, code, false); const javlibHeadline = title.querySelector('.javlib-card-headline');
    if (javlibHeadline) {
     const footer = title.querySelector('.javlib-card-footer');
     if (footer) {
      footer.insertBefore(badge, footer.firstChild);
     } else { javlibHeadline.insertAdjacentElement('afterend', badge); }
     anchor.dataset.pan115HasBadge = '1';
     return; }
    const javdbHeadline = title.querySelector('.javdb-card-headline');
    if (javdbHeadline) { javdbHeadline.insertBefore(badge, javdbHeadline.firstChild); anchor.dataset.pan115HasBadge = '1'; return; }
    title.insertBefore(badge, title.firstChild);
    anchor.dataset.pan115HasBadge = '1';
    return; }
   const textNode = this.findPan115TitleTextNode(anchor);
   if (textNode?.parentNode && anchor.contains(textNode.parentNode)) {
    const badge = createPan115Badge(matches, code, false);
    textNode.parentNode.insertBefore(badge, textNode);
   } else {
    const badge = createPan115Badge(matches, code, true);
    anchor.parentNode?.insertBefore(badge, anchor); }
   anchor.dataset.pan115HasBadge = '1'; },
  getDetailFeatureSite() { return JumpSites.find(site => site.match(window.location.href)) || null; },
  getDetailCode() {
   const site = this.getDetailFeatureSite();
   if (!site) return '';
   const titleElem = site.id === 'emby' ? resolveEmbyTitleElem() : document.querySelector(site.titleSelector || '');
   if (typeof site.getCode === 'function') return site.getCode(titleElem) || '';
   const titleText = titleElem?.textContent || document.title || '';
   return Utils.extractCode(titleText) || ''; },
  getDetailLayoutSite() {
   const host = location.hostname;
   if (/(?:^|\.)javbus\.com$/i.test(host) && document.querySelector('.row.movie')) return 'javbus';
   if (/javdb/i.test(host) && document.querySelector('.jav-flex-container, .column.column-video-cover')) return 'javdb';
   if (/(javlibrary|javlib|r86m|s87n)/i.test(host) && document.querySelector('#video_jacket_info tr')) return 'javlib';
   return ''; },
  getMagnetSlot() { return document.querySelector('.jav-nong-slot'); },
  createDetailPreviewStandaloneSlot() {
   const site = this.getDetailLayoutSite(); const slot = document.createElement(site === 'javlib' ? 'td' : 'div');
   slot.className =`jav-detail-preview-standalone${site ? ` jav-detail-preview-standalone-${site}` : ''}`;
   if (site === 'javbus') {
    const root = document.querySelector('.row.movie'); const info = root?.querySelector('.col-md-3.info');
    if (!root || !info) return null;
    info.insertAdjacentElement('afterend', slot);
    return slot; }
   if (site === 'javdb') {
    const root = document.querySelector('.jav-flex-container');
    const info = root?.querySelector('.movie-panel-info')?.closest('.column') || root?.querySelector('.movie-panel-info');
    if (!root || !info) return null;
    info.insertAdjacentElement('afterend', slot);
    return slot; }
   if (site === 'javlib') {
    const row = document.querySelector('#video_jacket_info tr'); const info = row?.querySelector('#video_info')?.closest('td');
    if (!row || !info) return null;
    info.insertAdjacentElement('afterend', slot);
    return slot; }
   return null; },
  getDetailPreviewTarget() {
   const slot = this.getMagnetSlot();
   if (slot) {
    document.querySelectorAll('.jav-detail-preview-standalone').forEach(el => el.remove());
    let anchor = slot.querySelector('.jav-nong-wrapper');
    while (anchor?.parentElement && anchor.parentElement !== slot) { anchor = anchor.parentElement; }
    return { slot, anchor }; }
   let standalone = document.querySelector('.jav-detail-preview-standalone');
   if (!standalone) { standalone = this.createDetailPreviewStandaloneSlot(); }
   if (!standalone) return null;
   return { slot: standalone, anchor: null, standalone: true }; },
  clearDetailPreviewInline() {
   document.querySelectorAll('.jav-detail-preview-wrap').forEach(el => el.remove());
   document.querySelectorAll('.jav-detail-preview-standalone').forEach(el => el.remove());
   document.querySelectorAll('.jav-nong-slot.has-detail-preview-inline').forEach(el => { el.classList.remove('has-detail-preview-inline'); }); },
  getJumpSite(url = window.location.href) { return JumpSites.find(s => s.match(url)) || null; },
  getJumpTitleElement(site) {
   if (!site) return null;
   if (typeof Javdb123AvFc2 !== 'undefined' && Javdb123AvFc2.isDetailRoute?.() && ['javbus', 'javlibrary'].includes(site.id)) {
    return document.querySelector('.javdb-api-detail-title'); }
   if (typeof site.getTitleElement === 'function') return site.getTitleElement();
   return site.id === 'emby' ? resolveEmbyTitleElem() : document.querySelector(site.titleSelector); },
  getEmbyInsertAnchor(titleElem) {
   return titleElem?.closest('.itemPrimaryNameContainer, .nameContainer, .detailPageWrapperContainer .infoWrapper') || titleElem; },
  getEmbyRenderKey(titleElem) {
   const hash = location.hash || ''; const itemId = hash.match(/item\?id=([^&]+)/i)?.[1] || new URLSearchParams(hash.split('?')[1] || '').get('id') || '';
   const title = (titleElem?.textContent || '').trim();
   return`${itemId}::${title}`;
  },
  isEmbyPage(url = window.location.href) { return !!JumpSites.find(s => s.id === 'emby')?.match(url); },
  setupJavDbGuards() {
   if (this.javdbGuardsReady || !SiteJavDB.match()) return;
   this.javdbGuardsReady = true;
   SiteJavDB._dismissOver18Modal(); SiteJavDB._hideDownloadCorrectionBlock();
   const javdbOver18Observer = new MutationObserver(() => {
    SiteJavDB._dismissOver18Modal(); SiteJavDB._hideDownloadCorrectionBlock();
   });
   javdbOver18Observer.observe(document.documentElement, { childList: true, subtree: true });
   window.addEventListener('popstate', () => setTimeout(() => {
    SiteJavDB._dismissOver18Modal(); SiteJavDB._hideDownloadCorrectionBlock();
   }, 0));
   window.addEventListener('hashchange', () => setTimeout(() => {
    SiteJavDB._dismissOver18Modal(); SiteJavDB._hideDownloadCorrectionBlock();
   }, 0)); },
  initCurrent() {
   const site = this.current();
   if (!site) return;
   const avid = site.getVid();
   log('匹配站点:', site.constructor?.name || '未知', '| 番号:', avid); site.initPage(avid); PageZoom.applyCurrent(); DetailFlex.apply(); }, };
 const ListOpenNewTab = (() => {
  const MARK = 'laosijiListNewTab';
  function enabled() { return CFG.listOpenNewTab; }
  function isSafeHref(anchor) {
   const href = anchor?.getAttribute?.('href') || '';
   if (!href || /^(?:javascript:|#|magnet:|mailto:|tel:)/i.test(href)) return false;
   try {
    const url = new URL(href, location.href);
    return /^https?:$/i.test(url.protocol);
   } catch (err) { return false; } }
  function collectAnchors() {
   if (SiteManager.isDetailPage()) return [];
   if (SiteJavBus.match() && SiteJavBus.isActorIndexPage()) return [];
   let selectors = [];
   if (SiteJavBus.match()) {
    selectors = [
     '#waterfall.javbus-card-grid > .item > a.movie-box[href]',
     '.javbus-card-grid .javbus-card-link[href]', ];
   } else if (SiteJavDB.match()) {
    selectors = [
     '.javdb-card-grid > .item > a.box[href]',
     '.movie-list.javdb-card-grid > .item > a.box[href]',
     '.movies.javdb-card-grid > .item > a.box[href]',
     '.grid.javdb-card-grid > .item > a.box[href]', ];
   } else if (SiteJavLib.match()) {
    selectors = [
     '.videothumblist .videos.javlib-card-grid > .video > a[href]:not(.emby-javlibrary-list-badge)', ]; }
   if (!selectors.length) return [];
   const seen = new Set();
   return selectors.flatMap(selector => [...document.querySelectorAll(selector)]) .filter(anchor => {
     if (seen.has(anchor) || !isSafeHref(anchor)) return false;
     seen.add(anchor);
     return true;
    }); }
  function remember(anchor) {
   if (anchor.dataset[MARK] === '1') return;
   anchor.dataset[MARK] = '1'; anchor.dataset.laosijiHadTarget = anchor.hasAttribute('target') ? '1' : '0';
   anchor.dataset.laosijiHadRel = anchor.hasAttribute('rel') ? '1' : '0'; anchor.dataset.laosijiOriginalTarget = anchor.getAttribute('target') || '';
   anchor.dataset.laosijiOriginalRel = anchor.getAttribute('rel') || ''; }
  function applyAnchor(anchor) {
   if (anchor.dataset.laosijiNewTabApplied === '1') return;
   remember(anchor);
   const rel = new Set((anchor.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
   rel.add('noopener'); rel.add('noreferrer'); anchor.setAttribute('target', '_blank'); anchor.setAttribute('rel', [...rel].join(' '));
   anchor.dataset.laosijiNewTabApplied = '1'; }
  function restoreAnchor(anchor) {
   if (anchor.dataset[MARK] !== '1') return;
   if (anchor.dataset.laosijiHadTarget === '1') {
    anchor.setAttribute('target', anchor.dataset.laosijiOriginalTarget || '');
   } else { anchor.removeAttribute('target'); }
   if (anchor.dataset.laosijiHadRel === '1') {
    anchor.setAttribute('rel', anchor.dataset.laosijiOriginalRel || '');
   } else { anchor.removeAttribute('rel'); }
   delete anchor.dataset[MARK]; delete anchor.dataset.laosijiHadTarget; delete anchor.dataset.laosijiHadRel; delete anchor.dataset.laosijiOriginalTarget;
   delete anchor.dataset.laosijiOriginalRel; delete anchor.dataset.laosijiNewTabApplied; }
  function clearExcept(active = new Set()) {
   document.querySelectorAll('a[data-laosiji-list-new-tab="1"]').forEach(anchor => {
    if (!active.has(anchor)) restoreAnchor(anchor);
   }); }
  function sync() {
   if (!enabled()) { clearExcept(); return; }
   const anchors = collectAnchors(); const active = new Set(anchors);
   anchors.forEach(applyAnchor); clearExcept(active); }
  return { sync, clear: () => clearExcept() };
 })();
 Core.expose('__LAOSIJI_LIST_OPEN_NEW_TAB__', ListOpenNewTab);
 function ensureStillsGalleryStyles() {
  injectStyle('jav-stills-gallery-style',`.jav-stills-shell{position:relative!important;width:100%!important;inline-size:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:16px 0 18px!important;padding:6px 4px!important;border:1px solid #d9e2ec!important;border-radius:8px!important;background:#ffffff!important;box-shadow:0 8px 18px rgba(15,23,42,.06)!important;overflow:hidden!important}.jav-stills-stage{position:relative!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;overflow:hidden!important}.jav-stills-rail{display:flex!important;flex-wrap:nowrap!important;align-items:stretch!important;gap:10px!important;width:100%!important;inline-size:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0!important;padding:0 0 6px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-behavior:smooth!important;overscroll-behavior-inline:contain!important;scrollbar-width:thin!important;scrollbar-color:rgba(100,116,139,.44) transparent!important}.jav-stills-rail::-webkit-scrollbar{height:8px!important}.jav-stills-rail::-webkit-scrollbar-thumb{border-radius:999px!important;background:rgba(100,116,139,.36)!important}.jav-stills-rail::-webkit-scrollbar-track{background:transparent!important}.jav-stills-arrow{position:absolute!important;top:calc(50% - 7px)!important;z-index:3!important;display:grid!important;place-items:center!important;width:44px!important;height:72px!important;border:1px solid rgba(226,232,240,.55)!important;border-radius:22px!important;background:rgba(15,23,42,.12)!important;-webkit-backdrop-filter:blur(12px) saturate(135%)!important;backdrop-filter:blur(12px) saturate(135%)!important;color:#f8fafc!important;font-size:30px!important;line-height:1!important;font-weight:800!important;cursor:pointer!important;transform:translateY(-50%)!important;box-shadow:0 8px 22px rgba(0,0,0,.34)!important;transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease!important;touch-action:manipulation!important}.jav-stills-arrow:hover{background:rgba(15,23,42,.26)!important;border-color:rgba(125,211,252,.86)!important;box-shadow:0 10px 24px rgba(0,0,0,.42)!important;transform:translateY(-50%) scale(1.04)!important}.jav-stills-arrow:focus-visible{outline:2px solid rgba(37,99,235,.78)!important;outline-offset:2px!important}.jav-stills-arrow-prev{left:8px!important}.jav-stills-arrow-next{right:8px!important}.jav-stills-rail>a,.jav-stills-rail>.tile-item,.jav-stills-rail>.preview-video-container{flex:0 0 auto!important;display:block!important;position:relative!important;width:172px!important;height:104px!important;margin:0!important;padding:0!important;border:1px solid rgba(148,163,184,.28)!important;border-radius:8px!important;background:#e2e8f0!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)!important;overflow:hidden!important;box-sizing:border-box!important;text-decoration:none!important}.jav-stills-rail img{display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center!important;border:0!important}.jav-stills-rail .photo-frame{width:100%!important;height:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important}.jav-stills-rail>video,.jav-stills-rail video[style*="display:none"],.jav-stills-rail video[style*="display:none"]{display:none!important;flex:0 0 auto!important}.jav-stills-javdb .preview-video-container span{position:absolute!important;left:8px!important;bottom:7px!important;z-index:2!important;padding:3px 7px!important;border-radius:6px!important;background:rgba(15,23,42,.68)!important;color:#ffffff!important;font-size:11px!important;line-height:1!important;font-weight:800!important}.jav-stills-javlib .jav-stills-rail>a{width:150px!important;height:100px!important}.javdb-stills-column-clean,.javdb-stills-panel-clean,.javdb-stills-panel-clean>.message-body,.javdb-stills-body-clean{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.javdb-stills-column-clean{flex:1 1 0!important;overflow:hidden!important;padding-left:.75rem!important;padding-right:.75rem!important}.javdb-stills-panel-clean{margin:16px 0 18px!important}.jav-stills-javdb{width:auto!important;max-width:min(100%,calc(100vw - 34px))!important;max-inline-size:min(100%,calc(100vw - 34px))!important}.javdb-stills-panel-clean .jav-stills-shell{margin:0!important}.jav-stills-viewer{position:fixed!important;inset:0!important;z-index:2147483647!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;background:rgba(8,13,25,.9)!important;backdrop-filter:blur(5px)!important;color:#ffffff!important;cursor:zoom-out!important}.jav-stills-viewer-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:54px!important;padding:12px 16px!important;box-sizing:border-box!important;pointer-events:none!important}.jav-stills-viewer-count{min-width:64px!important;padding:6px 10px!important;border-radius:8px!important;background:rgba(15,23,42,.72)!important;color:#e5edf8!important;font-size:13px!important;font-weight:800!important;text-align:center!important;pointer-events:auto!important}.jav-stills-viewer-close,.jav-stills-viewer-nav{display:grid!important;place-items:center!important;border:1px solid rgba(226,232,240,.22)!important;background:rgba(15,23,42,.72)!important;color:#ffffff!important;cursor:pointer!important;box-shadow:0 12px 26px rgba(0,0,0,.24)!important;touch-action:manipulation!important}.jav-stills-viewer-close{width:38px!important;height:38px!important;border-radius:10px!important;font-size:24px!important;line-height:1!important;pointer-events:auto!important}.jav-stills-viewer-close:hover,.jav-stills-viewer-nav:hover{background:rgba(30,41,59,.88)!important;border-color:rgba(255,255,255,.36)!important}.jav-stills-viewer-body{position:relative!important;display:grid!important;place-items:center!important;min-width:0!important;min-height:0!important;padding:0 68px!important;box-sizing:border-box!important;overflow:auto!important}.jav-stills-viewer-img{display:block!important;max-width:100%!important;max-height:calc(100vh - 118px)!important;width:auto!important;height:auto!important;object-fit:contain!important;border-radius:6px!important;background:#111827!important;box-shadow:0 18px 46px rgba(0,0,0,.45)!important;cursor:zoom-in!important}.jav-stills-viewer-img.is-zoomed{max-width:none!important;max-height:none!important;cursor:zoom-out!important}.jav-stills-viewer.is-zoomed .jav-stills-viewer-body,.jav-stills-viewer.is-zoomed .jav-stills-viewer-img{touch-action:pan-x pan-y pinch-zoom!important}.jav-stills-viewer-nav{position:fixed!important;top:50%!important;z-index:2147483647!important;width:44px!important;height:58px!important;border-radius:12px!important;font-size:30px!important;line-height:1!important;transform:translateY(-50%)!important}.jav-stills-viewer-prev{left:18px!important}.jav-stills-viewer-next{right:18px!important}.jav-stills-viewer-caption{min-height:42px!important;padding:9px 18px 16px!important;box-sizing:border-box!important;color:rgba(226,232,240,.86)!important;font-size:13px!important;line-height:1.45!important;text-align:center!important;pointer-events:none!important}@media (max-width:720px){.jav-stills-shell{padding:6px 4px!important}.jav-stills-arrow{width:34px!important;height:54px!important;border-radius:18px!important;font-size:26px!important}.jav-stills-rail>a,.jav-stills-rail>.tile-item,.jav-stills-rail>.preview-video-container{width:150px!important;height:92px!important}.jav-stills-javlib .jav-stills-rail>a{width:138px!important;height:92px!important}.jav-stills-viewer-body{padding:0 52px!important;touch-action:pan-y pinch-zoom!important}.jav-stills-viewer-img{touch-action:pan-y pinch-zoom!important}.jav-stills-viewer-nav{width:38px!important;height:52px!important}.jav-stills-viewer-prev{left:8px!important}.jav-stills-viewer-next{right:8px!important}}`);
 }
 const ViewerNavigation = (() => {
  const noNavigation = consume => ({ consume, navigate: null });
  function create({ length, index = 0 } = {}) {
   const size = Math.max(0, Number(length) || 0); let currentIndex = size ? ((Number(index) || 0) % size + size) % size : 0; let zoomed = false;
   let wheelDelta = 0; let wheelLockedUntil = 0; let touchStart = null; let ignoreClickUntil = 0; let destroyed = false;
   const navigate = nextIndex => {
    if (destroyed || !size) return noNavigation(false);
    currentIndex = ((nextIndex % size) + size) % size; zoomed = false;
    return { consume: true, navigate: currentIndex }; };
   const step = direction => navigate(currentIndex + direction);
   const key = value => {
    if (destroyed) return noNavigation(false);
    if (value === 'Escape') return { consume: true, close: true, navigate: null };
    if (value === 'ArrowLeft' || value === 'ArrowRight') return step(value === 'ArrowRight' ? 1 : -1);
    return noNavigation(false); };
   const toggleZoom = () => {
    if (destroyed) return zoomed;
    zoomed = !zoomed;
    return zoomed; };
   const wheel = ({ deltaX = 0, deltaY = 0, deltaMode = 0, ctrlKey = false, viewportHeight = 800, now = Date.now() } = {}) => {
    if (destroyed || ctrlKey || size < 2 || zoomed) return noNavigation(false);
    const rawDelta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX;
    if (!rawDelta || now < wheelLockedUntil) return noNavigation(true);
    const deltaUnit = deltaMode === 1 ? 16 : (deltaMode === 2 ? Math.max(viewportHeight, 800) : 1);
    wheelDelta += rawDelta * deltaUnit;
    if (Math.abs(wheelDelta) < 36) return noNavigation(true);
    const result = step(wheelDelta > 0 ? 1 : -1);
    wheelDelta = 0; wheelLockedUntil = now + 220;
    return result; };
   const startTouch = ({ x, y, points = 1 } = {}) => {
    touchStart = !destroyed && size >= 2 && !zoomed && points === 1 ? { x, y } : null;
    return !!touchStart; };
   const moveTouch = ({ x, y, points = 1 } = {}) => {
    if (destroyed || !touchStart) return { consume: false };
    if (points !== 1) {
     touchStart = null;
     return { consume: false }; }
    const deltaX = x - touchStart.x; const deltaY = y - touchStart.y;
    return { consume: Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) }; };
   const endTouch = ({ x, y, width = 0, now = Date.now(), remainingPoints = 0, changedPoints = 1 } = {}) => {
    const start = touchStart;
    touchStart = null;
    if (destroyed || !start || remainingPoints !== 0 || changedPoints !== 1) return noNavigation(false);
    const deltaX = x - start.x; const deltaY = y - start.y; const threshold = Math.min(96, Math.max(48, width * .12));
    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) return noNavigation(false);
    ignoreClickUntil = now + 400;
    return step(deltaX < 0 ? 1 : -1); };
   const suppressClick = ({ target, now = Date.now() } = {}) => !destroyed && now < ignoreClickUntil && (target === 'image' || target === 'body');
   const destroy = () => {
    destroyed = true; touchStart = null; wheelDelta = 0; };
   return {
    get index() { return currentIndex; },
    get zoomed() { return zoomed; },
    get destroyed() { return destroyed; },
    navigate,
    step,
    key,
    toggleZoom,
    wheel,
    touchStart: startTouch,
    touchMove: moveTouch,
    touchEnd: endTouch,
    touchCancel: () => { touchStart = null; },
    suppressClick,
    destroy, }; }
  return { create };
 })();
 const StillsGallery = (() => {
  let activeViewerClose = null;
  function scrollRail(rail, dir) {
   const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
   if (maxLeft <= 1) return;
   const edge = 8;
   if (dir > 0 && rail.scrollLeft >= maxLeft - edge) {
    rail.scrollTo({ left: 0, behavior: 'smooth' });
    return; }
   if (dir < 0 && rail.scrollLeft <= edge) {
    rail.scrollTo({ left: maxLeft, behavior: 'smooth' });
    return; }
   rail.scrollBy({ left: dir * Math.max(220, rail.clientWidth * .72), behavior: 'smooth' }); }
  function button(text, className, rail, dir) {
   const btn = document.createElement('button');
   btn.type = 'button';
   btn.className =`jav-stills-arrow ${className}`;
   btn.textContent = text;
   btn.setAttribute('aria-label', dir < 0 ? '向左滚动剧照' : '向右滚动剧照');
   btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); scrollRail(rail, dir); });
   return btn; }
  function toAbsUrl(value) {
   try {
    return new URL(value, location.href).href;
   } catch { return ''; } }
  function isImageHref(value) {
   const url = String(value || '').split('#')[0].split('?')[0];
   return /\.(?:jpe?g|png|webp|gif|bmp)$/i.test(url); }
  function collectImages(rail) {
   return [...rail.querySelectorAll(':scope > a[href]')].map(anchor => {
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return null;
    const img = anchor.querySelector('img[src]');
    if (!img) return null;
    const url = toAbsUrl(href); const src = toAbsUrl(img.currentSrc || img.src || img.getAttribute('src') || '');
    if (!url || (!isImageHref(url) && !isImageHref(src))) return null;
    const title = anchor.getAttribute('data-caption') || img.getAttribute('title') || img.getAttribute('alt') || '';
    return { anchor, url, title: title.trim() };
   }).filter(Boolean); }
  function openViewer(items, startIndex = 0) {
   if (!items.length) return;
   activeViewerClose?.();
   const originalHtmlOverflow = document.documentElement.style.overflow; const originalBodyOverflow = document.body.style.overflow;
   document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
   const navigation = ViewerNavigation.create({ length: items.length, index: startIndex });
   const overlay = document.createElement('div');
   overlay.className = 'jav-stills-viewer';
   const top = document.createElement('div');
   top.className = 'jav-stills-viewer-top';
   const count = document.createElement('div');
   count.className = 'jav-stills-viewer-count';
   const close = document.createElement('button');
   close.type = 'button'; close.className = 'jav-stills-viewer-close'; close.textContent = '×';
   close.setAttribute('aria-label', '关闭剧照预览'); top.append(count, close);
   const body = document.createElement('div');
   body.className = 'jav-stills-viewer-body';
   const img = document.createElement('img');
   img.className = 'jav-stills-viewer-img';
   body.appendChild(img);
   const prev = document.createElement('button');
   prev.type = 'button'; prev.className = 'jav-stills-viewer-nav jav-stills-viewer-prev'; prev.textContent = '‹';
   prev.setAttribute('aria-label', '上一张剧照');
   const next = document.createElement('button');
   next.type = 'button'; next.className = 'jav-stills-viewer-nav jav-stills-viewer-next'; next.textContent = '›';
   next.setAttribute('aria-label', '下一张剧照');
   const caption = document.createElement('div');
   caption.className = 'jav-stills-viewer-caption';
   const show = () => {
    const index = navigation.index; const item = items[index];
    img.classList.remove('is-zoomed'); overlay.classList.remove('is-zoomed');
    img.src = item.url;
    img.alt = item.title ||`剧照 ${index + 1}`;
    count.textContent =`${index + 1} / ${items.length}`;
    caption.textContent = item.title || ''; };
   const closeViewer = (event = null) => {
    if (event) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
    navigation.destroy(); overlay.remove();
    document.documentElement.style.overflow = originalHtmlOverflow; document.body.style.overflow = originalBodyOverflow;
    document.removeEventListener('keydown', keyHandler, true);
    if (activeViewerClose === closeViewer) activeViewerClose = null;
   };
   const keyHandler = e => {
    const result = navigation.key(e.key);
    if (result.close) { closeViewer(e); return; }
    if (!result.consume) return;
    stopViewerEvent(e);
    if (result.navigate !== null) show();
   };
   const stopViewerEvent = e => {
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.(); };
   const wheelHandler = e => {
    const result = navigation.wheel({ deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, ctrlKey: e.ctrlKey, viewportHeight: overlay.clientHeight });
    if (result.consume) stopViewerEvent(e);
    if (result.navigate !== null) show();
   };
   const touchStartHandler = e => {
    const touch = e.touches[0];
    navigation.touchStart({ x: touch?.clientX, y: touch?.clientY, points: e.touches.length }); };
   const touchMoveHandler = e => {
    const touch = e.touches[0];
    const result = navigation.touchMove({ x: touch?.clientX, y: touch?.clientY, points: e.touches.length });
    if (result.consume) stopViewerEvent(e);
   };
   const touchEndHandler = e => {
    const touch = e.changedTouches[0];
    if (!touch) { navigation.touchCancel(); return; }
    const result = navigation.touchEnd({
     x: touch.clientX,
     y: touch.clientY,
     width: overlay.clientWidth,
     remainingPoints: e.touches.length,
     changedPoints: e.changedTouches.length,
    });
    if (result.consume) stopViewerEvent(e);
    if (result.navigate !== null) show();
   };
   close.addEventListener('click', closeViewer, true);
   prev.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.();
    navigation.step(-1); show();
   }, true);
   next.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.();
    navigation.step(1); show();
   }, true);
   img.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.();
    img.classList.toggle('is-zoomed', navigation.toggleZoom()); overlay.classList.toggle('is-zoomed', navigation.zoomed);
   }, true);
   overlay.addEventListener('click', e => {
    const target = e.target === img ? 'image' : (e.target === body ? 'body' : 'other');
    if (navigation.suppressClick({ target })) { stopViewerEvent(e); return; }
    if (e.target === overlay || e.target === body) closeViewer(e);
   }, true);
   overlay.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
   body.addEventListener('touchstart', touchStartHandler, { passive: true });
   body.addEventListener('touchmove', touchMoveHandler, { passive: false });
   body.addEventListener('touchend', touchEndHandler, { passive: false });
   body.addEventListener('touchcancel', () => navigation.touchCancel(), { passive: true });
   document.addEventListener('keydown', keyHandler, true); overlay.append(top, body, prev, next, caption); document.body.appendChild(overlay);
   activeViewerClose = closeViewer;
   show(); }
  function bindViewer(rail) {
   if (rail.dataset.laosijiStillsViewerBound === '1') return;
   rail.dataset.laosijiStillsViewerBound = '1';
   rail.addEventListener('click', e => {
    const anchor = e.target?.closest?.('a[href]');
    if (!anchor || !rail.contains(anchor)) return;
    const items = collectImages(rail); const index = items.findIndex(item => item.anchor === anchor);
    if (index < 0) return;
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.();
    openViewer(items, index);
   }, true); }
  function findConfig() {
   const customContainer = document.querySelector('[data-123av-detail-stills="1"] .tile-images.preview-images');
   if (customContainer?.querySelector('a[href], img')) { return { site: 'javdb', container: customContainer, heading: null }; }
   if (SiteJavBus.match()) {
    const container = document.querySelector('#sample-waterfall');
    if (!container?.querySelector('a, img')) return null;
    const heading = container.previousElementSibling?.matches?.('h4') ? container.previousElementSibling : null;
    return { site: 'javbus', container, heading }; }
   if (SiteJavDB.match()) {
    const container = document.querySelector('.tile-images.preview-images');
    if (!container?.querySelector('a, img, video')) return null;
    return { site: 'javdb', container, heading: null }; }
   if (SiteJavLib.match()) {
    const container = document.querySelector('.previewthumbs');
    if (!container?.querySelector('a, img')) return null;
    return { site: 'javlib', container, heading: null }; }
   return null; }
  function cleanSiteShell(config) {
   if (config.site !== 'javdb') return;
   config.container.closest('.column')?.classList.add('javdb-stills-column-clean');
   config.container.closest('.message.video-panel, article.message')?.classList.add('javdb-stills-panel-clean');
   config.container.closest('.message-body')?.classList.add('javdb-stills-body-clean'); }
  function reorderJavbusStills(config, shell) {
   if (config?.site !== 'javbus' || !shell) return;
   const reviewsPanel = document.querySelector('.javbus-javdb-reviews');
   if (reviewsPanel?.parentNode) {
    if (shell.nextElementSibling !== reviewsPanel) { reviewsPanel.parentNode.insertBefore(shell, reviewsPanel); }
    return; }
   const submitHeading = document.querySelector('#mag-submit-show');
   if (!submitHeading?.parentNode || shell.nextElementSibling === submitHeading) return;
   submitHeading.parentNode.insertBefore(shell, submitHeading); }
  function sync() {
   const config = findConfig();
   if (!config?.container) return;
   ensureStillsGalleryStyles(); cleanSiteShell(config); bindViewer(config.container);
   const existingShell = config.container.closest('.jav-stills-shell');
   if (existingShell) { reorderJavbusStills(config, existingShell); return; }
   const shell = document.createElement('div');
   shell.className =`jav-stills-shell jav-stills-${config.site}`;
   shell.dataset.laosijiStills = '1';
   const stage = document.createElement('div');
   stage.className = 'jav-stills-stage';
   config.container.classList.add('jav-stills-rail',`jav-stills-rail-${config.site}`);
   config.container.dataset.laosijiStillsRail = '1';
   const ref = config.heading || config.container;
   ref.parentNode?.insertBefore(shell, ref);
   if (config.heading) { config.heading.dataset.laosijiStillsHidden = '1'; config.heading.style.display = 'none'; }
   stage.append( button('‹', 'jav-stills-arrow-prev', config.container, -1), config.container, button('›', 'jav-stills-arrow-next', config.container, 1) );
   shell.append(stage); reorderJavbusStills(config, shell); }
  return { sync };
 })();
 Core.expose('__LAOSIJI_SITE_MANAGER__', SiteManager); Core.expose('__LAOSIJI_SITE_JAVBUS__', SiteJavBus); Core.expose('__LAOSIJI_SITE_JAVDB__', SiteJavDB);
 Core.expose('__LAOSIJI_SITE_JAVLIB__', SiteJavLib); Core.expose('__LAOSIJI_STILLS_GALLERY__', StillsGallery);
 function mainRun() {
  SiteManager.initCurrent(); }
 GM_addStyle(`.preview-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;overflow:auto;cursor:zoom-out;backdrop-filter:blur(5px)}.preview-img{border-radius:4px;margin:auto;cursor:zoom-in;max-width:95vw;max-height:95vh;object-fit:contain;display:block;box-shadow:0 0 20px rgba(0,0,0,0.5)}.preview-img.zoomed{max-width:none;max-height:none;cursor:zoom-out}a:focus:not(:focus-visible),button:focus:not(:focus-visible),[role="button"]:focus:not(:focus-visible),input[type="button"]:focus:not(:focus-visible),input[type="submit"]:focus:not(:focus-visible){outline:none!important}.jav-card-grid{--jav-card-title-size:15px;--jav-card-title-line-height:1.5;--jav-card-title-lines:2;display:grid!important;grid-template-columns:repeat(var(--jav-card-columns,5),minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important;width:100%!important;box-sizing:border-box!important}.jav-card{float:none!important;display:block!important;width:auto!important;height:100%!important;max-height:none!important;min-width:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important;text-align:left!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:6px!important;overflow:hidden!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important;transform:translateZ(0)!important;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease!important;will-change:transform!important}.jav-card:hover{border-color:rgba(37,99,235,.35)!important;box-shadow:0 10px 24px rgba(15,23,42,.16)!important;transform:translateY(-4px) scale(1.018)!important;z-index:2!important}.jav-card-link{display:flex!important;flex-direction:column!important;height:100%!important;max-height:none!important;overflow:hidden!important;color:#2563eb!important;text-decoration:none!important}.jav-card-link:visited{color:#64748b!important}.jav-card-cover{display:block!important;width:100%!important;height:auto!important;aspect-ratio:800 / 538!important;overflow:hidden!important;background:#f8fafc!important;border-bottom:1px solid #f1f5f9!important}.jav-card-image{display:block!important;width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;background:#f8fafc!important;border:0!important}.jav-card-title{width:100%!important;max-width:none!important;box-sizing:border-box!important;margin:0!important;color:inherit!important;font-size:var(--jav-card-title-size,15px)!important;text-align:left!important;white-space:normal!important;word-break:break-word!important}.jav-jump-btn-group{margin-top:8px;margin-bottom:4px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.jav-jump-btn-group.fc2cmadb-jump-group{margin-top:10px;margin-bottom:8px}.emby-fix{width:100%!important;flex-basis:100%!important;clear:both!important;margin-top:8px!important;margin-bottom:4px!important}.mini-switch{width:40px;height:20px;appearance:none;background:#e0e0e0;border-radius:20px;position:relative;cursor:pointer;outline:none;transition:background 0.2s}.mini-switch:checked{background:#4CAF50}.mini-switch::before{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:white;top:2px;left:2px;transition:left 0.2s}.mini-switch:checked::before{left:calc(100% - 18px)}@keyframes btnSlideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}.jav-jump-btn-group a{transition:background .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease;animation:btnSlideIn 0.3s ease-out}.jav-jump-btn-group a:hover{background:var(--jav-btn-hover-bg,#f8fafc)!important;transform:translateY(-1px)!important;filter:none!important;box-shadow:0 5px 14px rgba(15,23,42,0.12),inset 0 1px 0 rgba(255,255,255,0.76)!important;text-decoration:none!important}@keyframes menuFadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.search-menu{position:relative;display:inline-block;border-radius:4px}.search-main-btn{padding-right:28px!important}.search-toggle-btn{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:16px;height:16px;padding:0!important;margin:0!important;display:inline-flex!important;align-items:center;justify-content:center;flex-shrink:0;font-size:10px!important;line-height:1;opacity:1;background:color-mix(in srgb,var(--jav-btn-accent,#64748b) 18%,#ffffff)!important;color:inherit!important;border:1px solid color-mix(in srgb,var(--jav-btn-accent,#64748b) 26%,#ffffff)!important;border-radius:999px!important;box-shadow:0 1px 2px rgba(15,23,42,0.12),inset 0 1px 0 rgba(255,255,255,0.7)!important;cursor:pointer}.search-toggle-btn:hover{filter:none;background:color-mix(in srgb,var(--jav-btn-accent,#64748b) 26%,#ffffff)!important}.search-toggle-btn .search-arrow{display:inline-block;transform:translateY(-1px);pointer-events:none}.search-submenu{position:absolute;top:calc(100%+4px);left:0;display:none;flex-direction:column;gap:4px;padding:4px;background:rgba(255,255,255,0.95);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:10000;min-width:120px;backdrop-filter:blur(5px)}.search-submenu.is-open{display:flex}.search-submenu a{transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1)!important}.search-submenu a:hover{transform:translateX(5px) scale(1.02);filter:brightness(1.1)}.jav-pan115-badge{display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:22px!important;padding:0 7px;margin-right:6px;position:static!important;top:auto!important;transform:none!important;border-radius:6px;background:#bbf7d0;border:1px solid #22c55e;color:#065f46;font-size:12px!important;font-weight:800;line-height:22px!important;text-decoration:none;box-sizing:border-box;vertical-align:middle;box-shadow:inset 0 1px 0 rgba(255,255,255,0.72)}.jav-pan115-badge:hover{background:#86efac;color:#064e3b;text-decoration:none;box-shadow:0 4px 12px rgba(15,23,42,0.12),inset 0 1px 0 rgba(255,255,255,0.76)}span.jav-pan115-badge{cursor:pointer}.jav-pan115-chooser-overlay{position:fixed;inset:0;z-index:10000030;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,0.38);backdrop-filter:blur(6px)}.jav-pan115-chooser{width:min(720px,calc(100vw - 24px));max-height:min(76vh,680px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #d8dee8;border-radius:14px;background:#f8fafc;box-shadow:0 24px 70px rgba(15,23,42,0.22);color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.jav-pan115-chooser-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:15px 16px 12px;border-bottom:1px solid #e2e8f0;background:#fff;color:#111827}.jav-pan115-chooser-title{font-size:16px;font-weight:800;line-height:1.35}.jav-pan115-chooser-desc{margin-top:4px;color:#64748b;font-size:12px;line-height:1.45}.jav-pan115-chooser-close{width:30px;height:30px;flex:0 0 auto;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#475569;font-size:20px;line-height:1;cursor:pointer}.jav-pan115-candidate-list{overflow:auto;padding:10px;display:grid;gap:8px;overscroll-behavior:contain}.jav-pan115-candidate{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;box-shadow:0 4px 12px rgba(15,23,42,0.06)}.jav-pan115-candidate.is-low-priority{border-color:#e2e8f0;background:#f8fafc}.jav-pan115-candidate-name{max-width:100%;overflow:hidden;color:#0f172a;font-size:13px;font-weight:750;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}.jav-pan115-candidate-meta{margin-top:3px;color:#64748b;font-size:12px;line-height:1.35}.jav-pan115-candidate-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}.jav-pan115-candidate-actions button{min-width:48px;height:30px;padding:0 9px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer}.jav-pan115-candidate-play{border:1px solid #0f766e;background:#0f766e;color:#fff}.jav-pan115-candidate-rename{border:1px solid #cbd5e1;background:#f8fafc;color:#334155}.jav-pan115-candidate-delete{border:1px solid #e2e8f0;background:#fff;color:#dc2626}.jav-pan115-candidate-delete:disabled{border-color:#e2e8f0;background:#f8fafc;color:#94a3b8;cursor:not-allowed}.jav-pan115-candidate-actions button:disabled{border-color:#e2e8f0;background:#f8fafc;color:#94a3b8;cursor:not-allowed}.jav-pan115-confirm-overlay{position:fixed;inset:0;z-index:10000040;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,0.32);backdrop-filter:blur(5px)}.jav-pan115-confirm{width:min(420px,calc(100vw - 28px));padding:16px;border:1px solid #d8dee8;border-radius:14px;background:#fff;color:#111827;box-shadow:0 20px 54px rgba(15,23,42,0.26);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.jav-pan115-confirm-title{font-size:16px;font-weight:900;line-height:1.35}.jav-pan115-confirm-message{margin-top:8px;color:#475569;font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-word}.jav-pan115-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.jav-pan115-confirm-actions button{min-width:70px;height:34px;padding:0 14px;border-radius:8px;font-size:13px;font-weight:850;cursor:pointer}.jav-pan115-confirm-cancel{border:1px solid #e2e8f0;background:#f8fafc;color:#475569}.jav-pan115-confirm-ok{border:1px solid #dc2626;background:#dc2626;color:#fff}.jav-pan115-rename-input{width:100%;height:38px;margin-top:12px;padding:0 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#111827;font-size:13px;font-weight:650;outline:none}.jav-pan115-rename-input:focus{border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,0.12)}.jav-pan115-rename-hint{margin-top:7px;color:#64748b;font-size:12px;line-height:1.45}.jav-pan115-rename-ok{border-color:#0f766e!important;background:#0f766e!important;color:#fff!important}html[data-laosiji-mobile] .jav-pan115-chooser-overlay{align-items:flex-end;padding:8px}html[data-laosiji-mobile] .jav-pan115-chooser{width:100%;max-height:82dvh;border-radius:14px 14px 10px 10px}html[data-laosiji-mobile] .jav-pan115-candidate{grid-template-columns:minmax(0,1fr);align-items:stretch}html[data-laosiji-mobile] .jav-pan115-candidate-actions button{flex:1 1 0;min-height:34px}html[data-laosiji-mobile] .jav-pan115-confirm-overlay{align-items:flex-end;padding:10px}html[data-laosiji-mobile] .jav-pan115-confirm{width:100%}html[data-laosiji-mobile] .jav-pan115-confirm-actions button{flex:1 1 0;min-height:38px}.jav-infinite-sentinel{width:100%;padding:14px 0;color:#64748b;font-size:13px;font-weight:700;text-align:center;clear:both}.jav-infinite-sentinel.is-loading{color:#2563eb}.jav-infinite-sentinel.is-done{color:#94a3b8}.jav-infinite-sentinel.is-error{color:#dc2626;cursor:pointer}.button.javdb-score-sort-btn,.button.javdb-votes-sort-btn{border-color:#be123c!important;background:#be123c!important;color:#fff!important}.button.javdb-score-sort-btn:hover,.button.javdb-votes-sort-btn:hover{border-color:#e11d48!important;background:#e11d48!important}.button.javdb-score-sort-btn.is-selected,.button.javdb-votes-sort-btn.is-selected{border-color:#9f1239!important;background:#9f1239!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.58)!important}.button.javdb-score-sort-btn:focus-visible,.button.javdb-votes-sort-btn:focus-visible{outline:2px solid #fecdd3;outline-offset:2px}.float-buttons .javdb-loaded-reorder-btn{display:block;align-items:center;justify-content:center;min-height:36px;max-width:calc(100vw - 32px);margin:0 0 8px auto;padding:7px 11px;border:1px solid #be123c;border-radius:6px;background:#be123c;color:#fff;font-size:13px;font-weight:700;line-height:1.25;letter-spacing:0;box-shadow:0 5px 16px rgba(15,23,42,.2);cursor:pointer}.float-buttons .javdb-loaded-reorder-btn:hover{background:#e11d48;border-color:#e11d48}.float-buttons .javdb-loaded-reorder-btn:focus-visible{outline:2px solid #fecdd3;outline-offset:2px}@media (max-width:768px){.float-buttons .javdb-loaded-reorder-btn{min-height:34px;padding:7px 10px;font-size:12px}}`);
 GM_addStyle(`.preview-toolbar{position:fixed;top:20px;right:20px;display:flex;gap:8px;z-index:2147483648;background:rgba(30,30,30,0.75);backdrop-filter:blur(10px);padding:6px 12px;border-radius:30px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 6px 18px rgba(0,0,0,0.25)}.preview-btn{border:none;color:#eee;font-size:13px;font-weight:450;cursor:pointer;padding:6px 14px;border-radius:24px;transition:all 0.2s ease;display:inline-flex;align-items:center;gap:6px;background:rgba(100,100,120,0.3);border:1px solid rgba(255,255,255,0.05);box-shadow:0 2px 4px rgba(0,0,0,0.1);letter-spacing:0.2px}.preview-btn:hover{background:rgba(140,140,160,0.4);transform:translateY(-2px);box-shadow:0 6px 12px rgba(0,0,0,0.2)}.preview-btn.javfree.active{background:#2ecc71;color:white;border-color:rgba(255,255,255,0.3);box-shadow:0 0 16px rgba(46,204,113,0.6);font-weight:500}.preview-btn.javstore.active{background:#e74c3c;color:white;border-color:rgba(255,255,255,0.3);box-shadow:0 0 16px rgba(231,76,60,0.6);font-weight:500}.preview-btn.action{background:rgba(100,100,120,0.3)}.preview-btn.action:hover{background:rgba(140,140,160,0.5)}.preview-btn:active{transform:translateY(0);box-shadow:0 2px 4px rgba(0,0,0,0.15)}`);
 GM_addStyle(`.trailer-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:34px;background:radial-gradient(circle at 50% 18%,rgba(56,189,248,0.16),transparent 32%),linear-gradient(180deg,rgba(5,7,12,0.88),rgba(0,0,0,0.96));backdrop-filter:none;cursor:default}.trailer-modal{width:min(1120px,94vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;color:#f8fafc;background:#05070c;border:1px solid rgba(255,255,255,0.12);border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,0.68),0 0 0 1px rgba(255,255,255,0.04) inset;cursor:default;animation:trailerFadeIn .18s ease-out}@keyframes trailerFadeIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}.trailer-header{position:absolute;top:0;left:0;right:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px 34px;background:linear-gradient(180deg,rgba(0,0,0,0.66),rgba(0,0,0,0));border:0;pointer-events:none;opacity:1;transition:opacity .18s ease,transform .18s ease}.trailer-title{min-width:0;display:flex;align-items:center;gap:10px;font:700 15px/1.3 Arial,"Microsoft YaHei",sans-serif;pointer-events:auto}.trailer-code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.4px}.trailer-source{flex-shrink:0;padding:3px 9px;border-radius:999px;color:rgba(255,255,255,0.82);background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);font-size:12px;font-weight:500;backdrop-filter:blur(12px)}.jav-player-close{width:34px;height:34px;border:0;border-radius:50%;color:#fff;background:rgba(255,255,255,0.14);cursor:pointer;font-size:18px;line-height:34px;pointer-events:auto;box-shadow:0 8px 20px rgba(0,0,0,0.22);transition:transform .15s ease,background .15s ease,box-shadow .15s ease}.jav-player-close:hover{transform:scale(1.08);background:rgba(248,113,113,0.34);box-shadow:0 10px 24px rgba(0,0,0,0.28)}.trailer-screen{position:relative;aspect-ratio:16 / 9;width:100%;max-height:82vh;overflow:hidden;background:radial-gradient(circle at center,rgba(31,41,55,.75),#000 62%),#000}.trailer-screen:fullscreen{width:100vw;height:100vh;max-height:none;aspect-ratio:auto;display:flex;align-items:center;justify-content:center;background:#000}.trailer-screen:-webkit-full-screen{width:100vw;height:100vh;max-height:none;aspect-ratio:auto;display:flex;align-items:center;justify-content:center;background:#000}.trailer-screen::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,0.52),rgba(0,0,0,0) 30%),linear-gradient(0deg,rgba(0,0,0,0.62),rgba(0,0,0,0) 36%)}.trailer-screen.is-iframe::before{display:none}.trailer-screen video,.trailer-screen iframe{position:absolute;inset:0;width:100%;height:100%;display:block;border:0;background:#000;object-fit:contain}.trailer-volume-indicator{position:absolute;top:62px;right:26px;z-index:5;color:#f8fafc;font:750 24px/1 Arial,"Microsoft YaHei",sans-serif;text-shadow:0 2px 8px rgba(0,0,0,0.82);opacity:0;pointer-events:none;transition:opacity .14s ease}.trailer-volume-indicator.is-visible{opacity:1}.trailer-fallback-status{position:absolute;left:18px;top:58px;z-index:5;max-width:min(520px,calc(100% - 36px));padding:7px 10px;border-radius:8px;color:rgba(255,255,255,0.9);background:rgba(10,14,22,0.68);border:1px solid rgba(255,255,255,0.16);box-shadow:0 12px 28px rgba(0,0,0,0.28);backdrop-filter:blur(14px);font:12px/1.45 Arial,"Microsoft YaHei",sans-serif;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .16s ease,transform .16s ease}.trailer-fallback-status.is-visible{opacity:1;transform:translateY(0)}.trailer-quality-bar{display:flex;align-items:center;gap:8px;padding:0;background:transparent;border:none;border-radius:0;backdrop-filter:none}.trailer-quality-select{min-width:78px;max-width:140px;height:30px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.12);color:#f8fafc;outline:none;font-size:12px;line-height:28px;text-align:center;text-align-last:center;appearance:none;cursor:pointer}.trailer-quality-select option{background:#0b1020;color:#f8fafc}.trailer-footer{position:absolute;left:16px;right:16px;bottom:16px;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;color:rgba(255,255,255,0.78);background:rgba(10,14,22,0.62);border:1px solid rgba(255,255,255,0.16);border-radius:8px;box-shadow:0 18px 40px rgba(0,0,0,0.32);backdrop-filter:blur(16px) saturate(1.08);font:12px/1.4 Arial,"Microsoft YaHei",sans-serif;opacity:1;transform:translateY(0);transition:opacity .18s ease,transform .18s ease}.trailer-screen.is-controls-hidden{cursor:none}.trailer-screen.is-controls-hidden .trailer-header{opacity:0;transform:translateY(-8px);pointer-events:none}.trailer-screen.is-controls-hidden .trailer-footer{opacity:0;transform:translateY(10px);pointer-events:none}.trailer-control-left,.trailer-control-right{display:flex;align-items:center;gap:9px;min-width:0}.trailer-control-left{flex:1 1 auto}.trailer-control-right{flex:0 0 auto}.trailer-control-btn{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;padding:0;border:0;border-radius:999px;color:#fff;background:rgba(255,255,255,0.14);cursor:pointer;font:700 13px/1 Arial,"Microsoft YaHei",sans-serif;transition:background .15s ease,transform .15s ease}.trailer-control-btn:hover{background:rgba(255,255,255,0.24);transform:translateY(-1px)}.trailer-volume-wrap{position:relative;width:30px;height:30px;display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;box-sizing:border-box}.trailer-volume-wrap::before{content:"";position:absolute;left:50%;bottom:100%;width:46px;height:18px;transform:translateX(-50%)}.trailer-volume-popover{position:absolute;left:15px;bottom:42px;width:36px;height:126px;display:flex;align-items:center;justify-content:center;padding:12px 0;border-radius:999px;background:rgba(10,14,22,0.76);border:1px solid rgba(255,255,255,0.16);box-sizing:border-box;box-shadow:0 14px 32px rgba(0,0,0,0.34);backdrop-filter:blur(16px) saturate(1.08);opacity:0;pointer-events:none;transform:translate(-50%,6px);transition:opacity .15s ease,transform .15s ease}.trailer-volume-wrap:hover .trailer-volume-popover{opacity:1;pointer-events:auto;transform:translate(-50%,0)}.trailer-volume-rail{position:absolute;left:50%;top:16px;bottom:16px;width:4px;transform:translateX(-50%);border-radius:999px;background:rgba(255,255,255,0.32);pointer-events:none}.trailer-volume-fill{position:absolute;left:0;right:0;bottom:0;height:var(--volume-percent,35%);border-radius:999px;background:#38bdf8}.trailer-volume-thumb{position:absolute;left:50%;bottom:var(--volume-percent,35%);width:16px;height:16px;transform:translate(-50%,50%);border-radius:50%;background:#38bdf8;border:2px solid rgba(255,255,255,0.92);box-shadow:0 2px 8px rgba(0,0,0,0.38)}.trailer-volume-slider{position:absolute;top:10px;bottom:10px;left:50%;width:16px;height:calc(100% - 20px);margin:0;transform:translateX(-50%);appearance:none;-webkit-appearance:none;writing-mode:vertical-lr;direction:rtl;background:transparent;cursor:pointer}.trailer-volume-slider::-webkit-slider-runnable-track{width:100%;height:100%;background:transparent}.trailer-volume-slider::-moz-range-track{width:100%;height:100%;background:transparent}.trailer-volume-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:16px;background:transparent;border:0;box-shadow:none}.trailer-volume-slider::-moz-range-thumb{width:24px;height:16px;background:transparent;border:0;box-shadow:none}.trailer-time{flex:0 0 auto;min-width:36px;color:rgba(255,255,255,0.78);font:11px/1.3 Arial,"Microsoft YaHei",sans-serif;white-space:nowrap;text-align:center}.trailer-progress{flex:1 1 160px;min-width:120px;height:32px;margin:0;border-radius:999px;accent-color:#38bdf8;cursor:pointer}`);
 GM_addStyle(`.jav-jump-toast{position:fixed;left:50%;top:72px;z-index:2147483647;display:flex;align-items:flex-start;gap:12px;width:min(420px,calc(100vw - 32px));padding:14px 16px;color:#f8fafc;background:rgba(15,23,42,0.94);border:1px solid rgba(148,163,184,0.28);border-left:4px solid #38bdf8;border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,0.34),0 0 0 1px rgba(255,255,255,0.04) inset;backdrop-filter:blur(14px) saturate(1.1);font-family:Arial,"Microsoft YaHei",sans-serif;transform:translate(-50%,-12px);opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}.jav-jump-toast.show{opacity:1;transform:translate(-50%,0)}.jav-jump-toast.hide{opacity:0;transform:translate(-50%,-12px)}.jav-jump-toast-icon{flex:0 0 auto;width:24px;height:24px;border-radius:999px;color:#082f49;background:#7dd3fc;font-size:16px;font-weight:800;line-height:24px;text-align:center}.jav-jump-toast-title{margin:0 0 4px;font-size:14px;font-weight:700;line-height:1.35}.jav-jump-toast-message{margin:0;color:#cbd5e1;font-size:13px;line-height:1.45}`);
 GM_addStyle(`html[data-laosiji-mobile]{overflow-x:hidden!important}html[data-laosiji-mobile] body{max-width:100%!important;overflow-x:hidden!important}html[data-laosiji-mobile] body[data-laosiji-javlib]{min-width:0!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu,html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo,html[data-laosiji-mobile] body[data-laosiji-javlib] #content,html[data-laosiji-mobile] body[data-laosiji-javlib] #rightcolumn,html[data-laosiji-mobile] body[data-laosiji-javlib] .videothumblist,html[data-laosiji-mobile] body[data-laosiji-javlib] .videothumblist .videos{width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu{display:block!important;position:relative!important;z-index:2!important;height:auto!important;min-height:0!important;margin:0!important;padding:8px 12px!important;overflow:visible!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar,html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .menutext{float:none!important;width:100%!important;min-width:0!important;height:auto!important;box-sizing:border-box!important;overflow:visible!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar,html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .menutext,html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar form{position:static!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar form,html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar table,html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar tbody{display:block!important;width:100%!important;min-width:0!important;height:auto!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar tr{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;width:100%!important;min-width:0!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar td{display:block!important;padding:0!important;line-height:0!important;vertical-align:top!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .searchbar td:first-child{position:relative!important;flex:1 1 140px!important;height:36px!important;max-height:36px!important;min-width:0!important;overflow:hidden!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #idsearchbox{display:block!important;width:100%!important;min-width:0!important;height:36px!important;min-height:36px!important;max-height:36px!important;margin:0!important;padding:0 9px!important;border:1px solid #94a3b8!important;border-radius:0!important;outline:0!important;background:#fff!important;color:#111827!important;box-shadow:none!important;vertical-align:top!important;box-sizing:border-box!important;appearance:none!important;-webkit-appearance:none!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #idsearchbox:focus{border-color:#3b82f6!important;box-shadow:0 0 0 1px #3b82f6!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #idsearchboxmask{position:absolute!important;top:50%!important;right:8px!important;left:8px!important;max-width:none!important;max-height:calc(100% - 8px)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;line-height:1.2!important;pointer-events:none!important;transform:translateY(-50%)!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #idsearchbutton{display:block!important;width:auto!important;height:36px!important;min-height:36px!important;margin:0 0 0 6px!important;vertical-align:top!important;box-sizing:border-box!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .advsearch{flex:1 1 100%!important;padding:7px 0 0!important;line-height:1.5!important;white-space:normal!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #topmenu .menutext{margin-top:8px!important;padding-top:8px!important;border-top:1px solid rgba(148,163,184,.28)!important;line-height:1.8!important;white-space:normal!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo{clear:both!important;position:relative!important;z-index:1!important;height:auto!important;margin:0!important;padding:8px 12px!important;overflow:visible!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo .sitelogo{float:none!important;width:100%!important;text-align:center!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo .sitelogo img{width:min(280px,100%)!important;height:auto!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo .topbanner1{display:none!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #toplogo .languagemenu{position:static!important;float:none!important;width:100%!important;margin:7px 0 0!important;text-align:center!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #content{margin:0!important;padding:0 12px 16px!important}html[data-laosiji-mobile] body[data-laosiji-javlib] #rightcolumn{float:none!important;margin:0!important}html[data-laosiji-mobile] body[data-laosiji-javlib] .videothumblist .videos.javlib-card-grid{grid-template-columns:repeat(var(--jav-card-columns,1),minmax(0,1fr))!important;gap:12px!important}html[data-laosiji-mobile] .jav-card-grid{grid-template-columns:repeat(var(--jav-card-columns,1),minmax(0,1fr))!important;gap:10px!important}html[data-laosiji-mobile] #waterfall.javbus-card-grid{grid-template-columns:repeat(var(--jav-card-columns,1),minmax(0,1fr))!important;gap:12px!important}html[data-laosiji-mobile] body .container-fluid{padding-left:12px!important;padding-right:12px!important}html[data-laosiji-mobile] .jav-card,html[data-laosiji-mobile] .jav-card:hover{transform:none!important;transition:none!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important;z-index:auto!important}html[data-laosiji-mobile] .jav-card-image,html[data-laosiji-mobile] .jav-card:hover .jav-card-image,html[data-laosiji-mobile] .jav-card-link:hover .jav-card-image{transform:none!important;transition:none!important}html[data-laosiji-mobile] .jav-card-cover,html[data-laosiji-mobile] .jav-card-image{height:auto!important;aspect-ratio:auto!important}html[data-laosiji-mobile] .jav-card-cover{overflow:visible!important}html[data-laosiji-mobile] .jav-card-image{object-fit:contain!important;object-position:center!important}html[data-laosiji-mobile] .jav-card-title,html[data-laosiji-mobile] .javlib-card-headline,html[data-laosiji-mobile] .javdb-card-headline{height:auto!important;min-height:0!important;max-height:none!important}html[data-laosiji-mobile] .jav-flex-container,html[data-laosiji-mobile] .row.movie,html[data-laosiji-mobile] #video_jacket_info tr{display:block!important;width:100%!important;max-width:100%!important;margin:0!important}html[data-laosiji-mobile] .jav-flex-container>.column,html[data-laosiji-mobile] .row.movie>.col-md-9.screencap,html[data-laosiji-mobile] .row.movie>.col-md-3.info,html[data-laosiji-mobile] #video_jacket_info tr>td,html[data-laosiji-mobile] .jav-nong-slot{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;flex:none!important;float:none!important;box-sizing:border-box!important}html[data-laosiji-mobile] .jav-flex-container>.column,html[data-laosiji-mobile] .row.movie>.col-md-9.screencap,html[data-laosiji-mobile] .row.movie>.col-md-3.info,html[data-laosiji-mobile] #video_jacket_info tr>td{margin:0 0 14px!important;padding-left:0!important;padding-right:0!important}html[data-laosiji-mobile] .jav-flex-container .movie-panel-info,html[data-laosiji-mobile] .row.movie .info,html[data-laosiji-mobile] #video_info{width:100%!important;max-width:100%!important;overflow:visible!important;word-break:break-word!important}html[data-laosiji-mobile] .jav-flex-container img,html[data-laosiji-mobile] .row.movie .screencap img,html[data-laosiji-mobile] #video_jacket_img{width:100%!important;height:auto!important;max-width:100%!important;aspect-ratio:auto!important;object-fit:contain!important}html[data-laosiji-mobile] .jav-jump-btn-group{gap:6px!important;align-items:stretch!important}html[data-laosiji-mobile] .jav-jump-btn-group a,html[data-laosiji-mobile] .jav-jump-btn-group button{min-height:40px!important}html[data-laosiji-mobile] .jav-card-quick-actions{gap:4px!important}html[data-laosiji-mobile] .jav-card-quick-btn{width:40px!important;height:40px!important;min-width:40px!important;flex:0 0 40px!important;opacity:1!important;touch-action:manipulation!important}html[data-laosiji-mobile] .jav-card-quick-btn:hover,html[data-laosiji-mobile] .jav-card-quick-btn:active{transform:none!important;opacity:1!important}html[data-laosiji-mobile] .jav-card-quick-btn .tool-svg{width:21px!important;height:21px!important}html[data-laosiji-mobile] .search-submenu{width:min(176px,calc(100vw - 16px))!important;min-width:0!important;max-width:calc(100vw - 16px)!important;box-sizing:border-box!important;overscroll-behavior:contain!important}html[data-laosiji-mobile] .search-submenu a{min-height:40px!important;display:flex!important;align-items:center!important;padding:8px 10px!important;touch-action:manipulation!important}html[data-laosiji-mobile] .jav-card-magnet-overlay{align-items:flex-end!important;padding:8px!important}html[data-laosiji-mobile] .jav-card-magnet-panel{width:100%!important;max-width:none!important;max-height:calc(100dvh - 8px)!important;border-radius:12px 12px 0 0!important}html[data-laosiji-mobile] .jav-card-magnet-head{min-height:52px!important;padding:8px 12px!important}html[data-laosiji-mobile] .jav-card-magnet-title{flex:1 1 auto!important}html[data-laosiji-mobile] .jav-card-magnet-close{width:44px!important;height:44px!important;flex:0 0 44px!important;touch-action:manipulation!important}html[data-laosiji-mobile] .jav-card-magnet-body{max-height:calc(100dvh - 64px)!important;padding:10px!important;overscroll-behavior:contain!important}html[data-laosiji-mobile] .jav-card-magnet-body>.laosiji-native-magnet-panel[data-laosiji-list-popup="1"]{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important}html[data-laosiji-mobile] .jav-card-magnet-body .jav-nong-wrapper{overflow-x:auto!important;overflow-y:hidden!important}html[data-laosiji-mobile] .jav-card-magnet-body #jav-nong-table{min-width:448px!important}html[data-laosiji-mobile] .jav-card-magnet-body #jav-nong-table .nong-head-row>th:first-child,html[data-laosiji-mobile] .jav-card-magnet-body #jav-nong-table tr>td:first-child{width:210px!important}html[data-laosiji-mobile] .preview-toolbar{top:auto!important;right:8px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;left:8px!important;max-width:calc(100vw - 16px)!important;overflow-x:auto!important;justify-content:flex-start!important;gap:6px!important;padding:6px!important;border-radius:12px!important;box-sizing:border-box!important}html[data-laosiji-mobile] .preview-btn{min-height:40px!important;flex:0 0 auto!important;padding:0 10px!important;touch-action:manipulation!important}html[data-laosiji-mobile] .jav-subtitle-overlay,html[data-laosiji-mobile] .jav-subtitle-preview-overlay{align-items:flex-end!important;padding:8px!important}html[data-laosiji-mobile] .jav-subtitle-panel,html[data-laosiji-mobile] .jav-subtitle-preview-panel{width:100%!important;max-width:none!important;max-height:calc(100dvh - 8px)!important;border-radius:12px 12px 0 0!important}html[data-laosiji-mobile] .jav-subtitle-close{width:44px!important;height:44px!important;flex:0 0 44px!important;touch-action:manipulation!important}html[data-laosiji-mobile] .jav-subtitle-row{grid-template-columns:1fr!important;gap:8px!important;padding:12px!important}html[data-laosiji-mobile] .jav-subtitle-actions{justify-content:stretch!important;flex-wrap:wrap!important}html[data-laosiji-mobile] .jav-subtitle-actions button,html[data-laosiji-mobile] .jav-subtitle-preview-download{min-height:40px!important;flex:1 1 120px!important;touch-action:manipulation!important}html[data-laosiji-mobile] .jav-subtitle-pre{max-height:calc(100dvh - 160px)!important;min-height:180px!important}html[data-laosiji-mobile] .trailer-overlay{padding:12px!important}html[data-laosiji-mobile] .trailer-modal{width:100%!important;max-height:100dvh!important;border-radius:10px 10px 0 0!important}html[data-laosiji-mobile] .trailer-screen>video{pointer-events:none!important}html[data-laosiji-mobile] .trailer-screen{touch-action:manipulation!important}html[data-laosiji-mobile] .trailer-screen:not(.is-controls-hidden) .trailer-header,html[data-laosiji-mobile] .trailer-screen:not(.is-controls-hidden) .trailer-footer{z-index:4!important;opacity:1!important}html[data-laosiji-mobile] .trailer-screen:not(.is-controls-hidden) .trailer-header{transform:translateY(0)!important;pointer-events:none!important}html[data-laosiji-mobile] .trailer-screen:not(.is-controls-hidden) .trailer-footer{transform:translateY(0)!important;pointer-events:auto!important}html[data-laosiji-mobile] .trailer-screen.is-controls-hidden .trailer-header,html[data-laosiji-mobile] .trailer-screen.is-controls-hidden .trailer-footer{opacity:0!important}html[data-laosiji-mobile] .trailer-screen.is-controls-hidden .trailer-header,html[data-laosiji-mobile] .trailer-screen.is-controls-hidden .trailer-header *,html[data-laosiji-mobile] .trailer-screen.is-controls-hidden .trailer-footer,html[data-laosiji-mobile] .trailer-screen.is-controls-hidden .trailer-footer *{pointer-events:none!important}html[data-laosiji-mobile] .trailer-header{gap:8px!important;padding:8px 10px 18px!important}html[data-laosiji-mobile] .trailer-title{gap:6px!important;font-size:12px!important}html[data-laosiji-mobile] .trailer-source{max-width:42vw!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}html[data-laosiji-mobile] .jav-player-close{width:36px!important;height:36px!important;line-height:36px!important}html[data-laosiji-mobile] .trailer-screen::before{background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,0) 24%),linear-gradient(0deg,rgba(0,0,0,.42),rgba(0,0,0,0) 28%)!important}html[data-laosiji-mobile] .trailer-footer{left:8px!important;right:8px!important;bottom:8px!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;gap:6px!important;padding:4px 6px!important}html[data-laosiji-mobile] .trailer-control-left,html[data-laosiji-mobile] .trailer-control-right{width:auto!important;gap:6px!important}html[data-laosiji-mobile] .trailer-control-left{min-width:0!important;justify-content:flex-start!important}html[data-laosiji-mobile] .trailer-control-right{flex:0 0 auto!important;justify-content:flex-end!important}html[data-laosiji-mobile] .trailer-control-btn,html[data-laosiji-mobile] .trailer-volume-wrap{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important}html[data-laosiji-mobile] .trailer-quality-select{width:70px!important;min-width:70px!important;max-width:70px!important;height:34px!important;padding:0 6px!important;font-size:11px!important}html[data-laosiji-mobile] .trailer-time{display:none!important}html[data-laosiji-mobile] .trailer-progress{min-width:0!important;height:32px!important;flex:1 1 0!important}html[data-laosiji-mobile] .trailer-control-btn,html[data-laosiji-mobile] .trailer-quality-select,html[data-laosiji-mobile] .trailer-progress,html[data-laosiji-mobile] .trailer-volume-slider{touch-action:manipulation!important}html[data-laosiji-mobile] .trailer-volume-popover{left:50%!important;bottom:calc(100%+8px)!important;width:138px!important;height:38px!important;padding:0 12px!important;border-radius:20px!important}html[data-laosiji-mobile] .trailer-volume-rail{top:50%!important;right:12px!important;bottom:auto!important;left:12px!important;width:auto!important;height:4px!important;transform:translateY(-50%)!important}html[data-laosiji-mobile] .trailer-volume-fill{top:0!important;right:auto!important;bottom:0!important;width:var(--volume-percent,35%)!important;height:auto!important}html[data-laosiji-mobile] .trailer-volume-thumb{top:50%!important;bottom:auto!important;left:var(--volume-percent,35%)!important;transform:translate(-50%,-50%)!important}html[data-laosiji-mobile] .trailer-volume-slider{top:0!important;bottom:auto!important;left:0!important;width:100%!important;height:100%!important;transform:none!important;writing-mode:horizontal-tb!important;direction:ltr!important}html[data-laosiji-mobile] .trailer-volume-wrap:focus-within .trailer-volume-popover{opacity:1!important;pointer-events:auto!important;transform:translate(-50%,0)!important}html[data-laosiji-mobile] .jav-stills-viewer-close,html[data-laosiji-mobile] .jav-stills-viewer-nav{width:44px!important;min-width:44px!important;height:56px!important;touch-action:manipulation!important}html[data-laosiji-mobile] .jav-detail-preview-wrap,html[data-laosiji-mobile] .javlib-nong-slot.has-detail-preview-inline>.jav-detail-preview-wrap{width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;max-height:none!important}html[data-laosiji-mobile] .jav-detail-preview-inline,html[data-laosiji-mobile] .javlib-nong-slot.has-detail-preview-inline .jav-detail-preview-inline{width:100%!important;max-width:100%!important;height:auto!important;max-height:78vw!important}@media (orientation:landscape){html[data-laosiji-mobile] body[data-laosiji-javlib] .videothumblist .videos.javlib-card-grid,html[data-laosiji-mobile] .jav-card-grid,html[data-laosiji-mobile] #waterfall.javbus-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}}@media (max-width:720px){.jav-jump-toast{top:18px;width:calc(100vw - 24px);padding:13px 14px}}`);
 const Utils = {
  isEligibleDmmCoverCode(value) {
   const raw = String(value || '').trim().toUpperCase();
   if (!/^[A-Z0-9]{2,10}-\d{1,6}$/.test(raw)) return false;
   const code = Utils.normalizeCode(raw);
   if (!/^[A-Z0-9]{2,10}-\d{1,6}$/.test(code) || /^FC2-/.test(code)) return false;
   if (/^\d{6}[-_]\d{2,3}$/.test(code)) return false;
   if (/^(DUGA|MYWIFE|HEYZO|PACO|10MU|1PONDO|CARIBBEAN|CARIB|TOKYO|GACHI|REAL|JUKU|AKA|NTR)-/.test(code)) return false;
   return !Utils.getJavBusUrl(code).includes('/uncensored/'); },
  normalizeCode(code) {
   const raw = String(code || '').trim();
   if (!raw) return '';
   const fc2 = raw.match(/^FC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})$/i);
   if (fc2) return`FC2-PPV-${fc2[1]}`;
   const normalized = raw .replace(/\s+/g, '-') .toUpperCase(); const heyDouga = normalized.match(/^HEYDOUGA[-_]?([A-Z0-9]+[-_][A-Z0-9]+)$/i);
   if (heyDouga) return heyDouga[1].replace(/_/g, '-');
   const tokyoHot = normalized.match(/^TOKYO[-_]?HOT[-_]?([A-Z0-9]+(?:[-_][A-Z0-9]+)?)$/i);
   if (tokyoHot) return tokyoHot[1].replace(/_/g, '-');
   const uncensoredNumeric = normalized.match(/(\d{6})[-_](\d{2,3})/);
   if (uncensoredNumeric) {
    const sep = uncensoredNumeric[0].includes('_') ? '_' : '-';
    return`${uncensoredNumeric[1]}${sep}${uncensoredNumeric[2]}`;
   }
   const compact = normalized.match(/^([A-Z]{2,10})(\d{3,6})$/);
   if (compact) {
    const number = compact[2].replace(/^0+(?=\d{3})/, '');
    return`${compact[1]}-${number}`;
   }
   const mixedCompact = normalized.match(/^([A-Z][A-Z0-9]{2,14}?)(\d{3,6})$/);
   if (mixedCompact) {
    const number = mixedCompact[2].replace(/^0+(?=\d{3})/, '');
    return`${mixedCompact[1]}-${number}`;
   }
   const trimmed = normalized.match(/^([A-Z0-9]{2,15}[-_]\d{2,9})/);
   if (trimmed) return trimmed[1];
   return normalized; },
  extractCode(text, options = {}) {
   if (!text) return null;
   const sourceText = String(text);
   const fc2 = sourceText.match(/\bFC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})\b/i);
   if (fc2) return Utils.normalizeCode(`FC2-PPV-${fc2[1]}`);
   const heyDouga = sourceText.match(/\bHEYDOUGA[-_\s]*(\d{4})[-_\s]+([A-Z0-9]+)\b/i);
   if (heyDouga) {
    const code = Utils.normalizeCode(`${heyDouga[1]}-${heyDouga[2]}`);
    return options.keepUncensoredSource ?`HEYDOUGA_${code}` : code;
   }
   const gachi = sourceText.match(/\bGACHI[-_\s]*(\d{3,6})\b/i);
   if (gachi) {
    const code = Utils.normalizeCode(`GACHI-${gachi[1]}`);
    return options.keepUncensoredSource ?`HEYDOUGA_${code}` : code;
   }
   const duga = sourceText.match(/\bDUGA[-_\s]+([A-Z0-9]+[-_][A-Z0-9]+)\b/i);
   if (duga) return Utils.normalizeCode(`DUGA-${duga[1]}`);
   const myWife = sourceText.match(/\bMY[-_\s]?WIFE[-_\s]*(\d+)\b/i);
   if (myWife) return Utils.normalizeCode(`MYWIFE-${myWife[1]}`);
   const tokyoHot = sourceText.match(/\bTOKYO[-_\s]?HOT[-_\s]*([A-Z0-9]+(?:[-_][A-Z0-9]+)?)\b/i);
   if (tokyoHot) return Utils.normalizeCode(tokyoHot[1]);
   const uncensoredHit = String(text).match(/(?:(PACOPACOMAMA|PACO|10MUSUME|10MU|1PONDO|CARIBBEANCOM|CARIBBEAN|CARIB|HEYZO)[-_\s]*)?(\d{6})([-_])(\d{2,3})/i);
   if (uncensoredHit) {
    const code = Utils.normalizeCode(`${uncensoredHit[2]}${uncensoredHit[3]}${uncensoredHit[4]}`);
    if (options.keepUncensoredSource && uncensoredHit[1]) {
     return`${uncensoredHit[1].toUpperCase()}_${code}`;
    }
    return code; }
   const mgstageFull = String(text).match(/\b(\d{3}[A-Z]{2,10})[-_\s](\d{2,6})\b/i);
   if (mgstageFull) {
    return Utils.normalizeCode(`${mgstageFull[1]}-${mgstageFull[2]}`);
   }
   const patterns = [
    { regex: /\b([A-Z0-9][A-Z0-9]{1,14})[-_\s](\d{2,10})(?:[-_](\d{1,3}))?/i, type: 'standard' },
    { regex: /([A-Z]{2,15})[-_\s]([A-Z]{1,2}\d{2,10})/i, type: 'alphanum' },
    { regex: /([A-Z]{2,15})[-_\s](\d{2,10})(?:[-_](\d{1,3}))?/i, type: 'standard' },
    { regex: /(\d{6})([-_\s]?)(\d{2,3})/, type: 'numeric' },
    { regex: /\b([A-Z][A-Z0-9]{2,14}?)(\d{3,6})\b/i, type: 'mixedCompact' },
    { regex: /\b([A-Z]{2,10})(\d{3,6})\b/i, type: 'compactStandard' },
    { regex: /([A-Z]{1,2})(\d{3,4})/i, type: 'compact' } ];
   const ignoreList = ['FULLHD', 'H264', 'H265', '1080P', '720P', 'PART', 'DISC', '10BIT'];
   for (let i = 0; i < patterns.length; i++) {
    const { regex, type } = patterns[i];
    const match = text.match(regex);
    if (!match) continue;
    if (type === 'alphanum') {
     return Utils.normalizeCode(match[0].trim());
    } else if (type === 'standard') {
     const prefix = match[1].toUpperCase();
     if (ignoreList.includes(prefix)) continue;
     return Utils.normalizeCode(match[3] ?`${prefix}-${match[2]}-${match[3]}` :`${prefix}-${match[2]}`);
    } else if (type === 'numeric') {
     if (match[2] === '_') return Utils.normalizeCode(`${match[1]}_${match[3]}`);
     return Utils.normalizeCode(`${match[1]}-${match[3]}`);
    } else if (type === 'mixedCompact') {
     const prefix = match[1].toUpperCase();
     if (/^[A-Z]+$/.test(prefix) || /\d$/.test(prefix)) continue;
     if (ignoreList.includes(prefix)) continue;
     const number = match[2].replace(/^0+(?=\d{3})/, '');
     return Utils.normalizeCode(`${prefix}-${number}`);
    } else if (type === 'compactStandard') {
     const prefix = match[1].toUpperCase();
     if (ignoreList.includes(prefix)) continue;
     const number = match[2].replace(/^0+(?=\d{3})/, '');
     return Utils.normalizeCode(`${prefix}-${number}`);
    } else if (type === 'compact') {
     return Utils.normalizeCode(match[0].toUpperCase()); } }
   return null; },
  hexToRgb(color) {
   const hex = String(color || '').trim().replace(/^#/, '');
   if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return { r: 100, g: 116, b: 139 };
   const full = hex.length === 3 ? hex.split('').map(ch => ch + ch).join('') : hex;
   return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) }; },
  mixColor(color, target = '#ffffff', weight = 0.12) {
   const from = Utils.hexToRgb(color); const to = Utils.hexToRgb(target); const mix = key => Math.round(from[key] * weight + to[key] * (1 - weight));
   return`rgb(${mix('r')}, ${mix('g')}, ${mix('b')})`;
  },
  getModernBtnStyle(color) {
   const accent = color || '#64748b'; const bg = Utils.mixColor(accent, '#ffffff', 0.10); const border = Utils.mixColor(accent, '#dbe3ef', 0.28);
   const text = Utils.mixColor(accent, '#111827', 0.72); const hoverBg = Utils.mixColor(accent, '#ffffff', 0.16);
   return [
    'height:30px',
    'padding:0 11px',
`--jav-btn-accent:${accent}`,
`--jav-btn-hover-bg:${hoverBg}`,
`background:${bg}`,
`color:${text}`,
`border:1px solid ${border}`,
    'border-radius:7px',
    'font-size:13px',
    'font-weight:700',
    'line-height:1',
    'cursor:pointer',
    'text-decoration:none',
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'gap:6px',
    'white-space:nowrap',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.7)',
    'box-sizing:border-box',
   ].join(';'); },
  createLinkBtn(text, color, url) {
   const btn = document.createElement('a');
   btn.textContent = text; btn.href = url || '#';
   if (url) btn.target = '_blank';
   btn.rel = 'noopener noreferrer'; btn.style.cssText = Utils.getModernBtnStyle(color);
   return btn; },
  createJumpLinkBtn(text, color, url) {
   const btn = Utils.createLinkBtn(text, color, url);
   btn.addEventListener('click', e => {
    e.stopImmediatePropagation();
   }, true);
   return btn; },
  createBtn(text, color, handler, useCapture = false) {
   const btn = document.createElement('a');
   btn.textContent = text; btn.style.cssText = Utils.getModernBtnStyle(color);
   if (useCapture) {
    btn.addEventListener('click', (e) => {
     e.preventDefault(); e.stopPropagation(); handler();
    }, true);
   } else {
    btn.onclick = (e) => {
     e.preventDefault(); handler(); }; }
   return btn; },
  request(url) {
   const request = gmFetch(url, { timeout: 30000 });
   const result = request.then(response => {
    if (!response.ok) {
     const error = new Error(`HTTP ${response.status || 0}`);
     error.response = response;
     throw error; }
    return response.responseText || '';
   });
   result.abort = () => request.abort?.() || false;
   return result; },
  showToast(title, message = '', duration = 2000) {
   document.querySelector('.jav-jump-toast')?.remove();
   const toast = document.createElement('div');
   toast.className = 'jav-jump-toast';
   const icon = document.createElement('div');
   icon.className = 'jav-jump-toast-icon'; icon.textContent = '!';
   const body = document.createElement('div'); const titleEl = document.createElement('p');
   titleEl.className = 'jav-jump-toast-title'; titleEl.textContent = title;
   const messageEl = document.createElement('p');
   messageEl.className = 'jav-jump-toast-message'; messageEl.textContent = message;
   body.appendChild(titleEl);
   if (message) body.appendChild(messageEl);
   toast.appendChild(icon); toast.appendChild(body); document.body.appendChild(toast); requestAnimationFrame(() => toast.classList.add('show'));
   setTimeout(() => {
    toast.classList.remove('show'); toast.classList.add('hide'); setTimeout(() => toast.remove(), 220);
   }, duration); },
  showOverlay(imgUrl, code, source = null) { return ImagePreview.open(imgUrl, code, source); },
  showTrailerOverlay(options) { return TrailerPlayer.open(options); },
  getJavBusUrl(code) {
   const codeLower = code.toLowerCase();
   const isUncensored =
    /^\d{6}[-_\s]\d{3}$/.test(code) || codeLower.startsWith('heyzo') || codeLower.startsWith('carib') || codeLower.startsWith('1pondo') ||
    codeLower.startsWith('tokyo') || codeLower.startsWith('cat') || codeLower.startsWith('paco') || codeLower.startsWith('10mu') ||
    codeLower.startsWith('muram') || codeLower.startsWith('gach') || codeLower.startsWith('real') || codeLower.startsWith('juku') ||
    codeLower.startsWith('aka') || codeLower.startsWith('s-cute') || codeLower.startsWith('n_') || /^n\d{4}$/.test(codeLower) || codeLower.startsWith('k_') ||
    /^k\d{4}$/.test(codeLower);
   if (isUncensored) {
    return`https://www.javbus.com/uncensored/search/${encodeURIComponent(code)}&type=1`;
   }
   return`https://www.javbus.com/search/${encodeURIComponent(code)}&type=&parent=ce`;
  } };
 const ImagePreview = {
  open(imgUrl, code, source = null) {
   const originalHtmlOverflow = document.documentElement.style.overflow; const originalBodyOverflow = document.body.style.overflow;
   document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
   const container = document.createElement('div');
   container.className = 'preview-overlay';
   const img = document.createElement('img');
   img.className =`preview-img${MobilePolicy.isMobile() ? '' : ' zoomed'}`;
   img.onclick = (e) => {
    e.stopPropagation(); img.classList.toggle('zoomed'); };
   let currentBlobUrl = null;
   const loadImg = (url, src) => {
    if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
    if (src === 'projectjav') {
     img.src = '';
     GM_xmlhttpRequest({
      method: 'GET',
      url,
      responseType: 'blob',
      headers: {
       'Referer': 'https://projectjav.com/',
       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      onload: r => {
       if (r.response) { currentBlobUrl = URL.createObjectURL(r.response); img.src = currentBlobUrl; }
      },
      onerror: () => { img.src = url; }
     });
    } else { img.src = url; } };
   loadImg(imgUrl, source);
   const toolbar = document.createElement('div');
   toolbar.className = 'preview-toolbar';
   toolbar.style.cssText =`position:fixed;top:20px;right:20px;display:flex;gap:12px;z-index:2147483648;`;
   const createButton = (text, icon, className, onClick) => {
    const btn = document.createElement('button');
    btn.className =`preview-btn ${className}`;
    btn.innerHTML =`${icon}${text}`;
    btn.onclick = onClick;
    return btn; };
   const setActiveSource = (activeSource) => {
    javfreeBtn.classList.toggle('active', activeSource === 'javfree'); projectjavBtn.classList.toggle('active', activeSource === 'projectjav');
    javstoreBtn.classList.toggle('active', activeSource === 'javstore'); };
   const javfreeBtn = createButton('javfree', '🟢', 'javfree', async (e) => {
    e.stopPropagation();
    const newUrl = await Thumbnail.javfree(code);
    if (newUrl) { loadImg(newUrl, 'javfree'); setActiveSource('javfree'); }
    else alert('javfree 未找到预览图');
   });
   const projectjavBtn = createButton('projectjav', '🟡', 'javstore', async (e) => {
    e.stopPropagation();
    const newUrl = await Thumbnail.projectjav(code);
    if (newUrl) { loadImg(newUrl, 'projectjav'); setActiveSource('projectjav'); }
    else alert('projectjav 未找到预览图');
   });
   const javstoreBtn = createButton('javstore', '🔴', 'javstore', async (e) => {
    e.stopPropagation();
    const newUrl = await Thumbnail.javstore(code);
    if (newUrl) { loadImg(newUrl, 'javstore'); setActiveSource('javstore'); }
    else alert('javstore 未找到预览图');
   });
   const newWindowBtn = createButton('新窗口', '🌐', 'action', (e) => {
    e.stopPropagation(); window.open(img.src);
   });
   const downloadBtn = createButton('下载', '⬇️', 'action', (e) => {
    e.stopPropagation();
    GM_download(img.src,`${code}.jpg`);
   });
   if (source === 'javfree') javfreeBtn.classList.add('active');
   else if (source === 'projectjav') projectjavBtn.classList.add('active');
   else if (source === 'javstore') javstoreBtn.classList.add('active');
   toolbar.appendChild(javfreeBtn); toolbar.appendChild(projectjavBtn); toolbar.appendChild(javstoreBtn); toolbar.appendChild(newWindowBtn);
   toolbar.appendChild(downloadBtn); container.appendChild(img);
   const closeOverlay = () => {
    if (container.parentNode) {
     container.remove(); toolbar.remove();
     document.documentElement.style.overflow = originalHtmlOverflow; document.body.style.overflow = originalBodyOverflow;
     if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
    } };
   container.onclick = closeOverlay;
   const escHandler = (e) => {
    if (e.key === 'Escape') { closeOverlay(); document.removeEventListener('keydown', escHandler); }
   };
   document.addEventListener('keydown', escHandler); document.body.appendChild(container); document.body.appendChild(toolbar); }, };
 function createTrailerHlsRuntime() {
  const HLS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';
  const getHlsClass = () => {
   const HlsClass = window.Hls || globalThis.Hls || (typeof Hls !== 'undefined' ? Hls : null);
   return HlsClass?.isSupported?.() ? HlsClass : null; };
  const binaryTextToArrayBuffer = (value) => {
   const text = String(value || ''); const bytes = new Uint8Array(text.length);
   for (let index = 0; index < text.length; index += 1) { bytes[index] = text.charCodeAt(index) & 0xff; }
   return bytes.buffer; };
  let hlsLoadPromise = null;
  const loadHlsLibrary = () => {
   const readyHls = getHlsClass();
   if (readyHls) return Promise.resolve(readyHls);
   if (hlsLoadPromise) return hlsLoadPromise;
   const loadByGm = () => new Promise(resolve => {
    GM_xmlhttpRequest({
     method: 'GET',
     url: HLS_SCRIPT_URL,
     timeout: 15000,
     onload: (r) => {
      if (r.status >= 200 && r.status < 300 && r.responseText) {
       try {
        Function(`${r.responseText}\n//# sourceURL=${HLS_SCRIPT_URL}`).call(globalThis);
       } catch (err) { errorLog('TrailerResolver:HLS hls.js 执行失败', err); } }
      resolve(getHlsClass()); },
     onerror: () => resolve(getHlsClass()),
     ontimeout: () => resolve(getHlsClass())
    });
   });
   hlsLoadPromise = new Promise(resolve => {
    const existing = document.querySelector('script[data-laosiji-hls="1"]');
    if (existing) {
     existing.addEventListener('load', () => resolve(getHlsClass()), { once: true });
     existing.addEventListener('error', () => loadByGm().then(resolve), { once: true });
     setTimeout(() => {
      if (!getHlsClass()) loadByGm().then(resolve);
     }, 4000);
     return; }
    const hlsScript = document.createElement('script');
    hlsScript.src = HLS_SCRIPT_URL; hlsScript.async = true; hlsScript.dataset.laosijiHls = '1'; hlsScript.onload = () => resolve(getHlsClass());
    hlsScript.onerror = () => loadByGm().then(resolve);
    document.head.appendChild(hlsScript);
   }).then(HlsClass => {
    if (!HlsClass) hlsLoadPromise = null;
    return HlsClass;
   });
   return hlsLoadPromise; };
  const createHlsLoader = () => class GMHlsLoader {
   constructor(config) {
    this.config = config; this.context = null; this.callbacks = null; this.loader = null; this.stats = this.createStats(); }
   createStats() {
    return {
     aborted: false,
     loaded: 0,
     retry: 0,
     total: 0,
     chunkCount: 0,
     bwEstimate: 0,
     trequest: 0,
     tfirst: 0,
     tload: 0,
     loading: {
      start: 0,
      first: 0,
      end: 0 },
     parsing: {
      start: 0,
      end: 0 },
     buffering: {
      start: 0,
      first: 0,
      end: 0 } }; }
   destroy() {
    this.abort(); }
   abort() {
    if (this.stats) this.stats.aborted = true;
    this.loader?.abort?.();
    this.loader = null; }
   load(context, config, callbacks) {
    this.context = context; this.callbacks = callbacks;
    const requestUrl = context.url; const wantsArrayBuffer = context.responseType === 'arraybuffer' || /\.(?:ts|m4s|mp4|key)(?:[?#]|$)/i.test(requestUrl);
    const startedAt = performance.now(); const stats = this.stats = this.createStats();
    stats.trequest = startedAt; stats.tfirst = startedAt; stats.tload = startedAt; stats.loading.start = startedAt;
    this.loader = GM_xmlhttpRequest({
     method: 'GET',
     url: requestUrl,
     responseType: 'text',
     overrideMimeType: wantsArrayBuffer ? 'text/plain; charset=x-user-defined' : undefined,
     timeout: config?.timeout || 20000,
     headers: {
      Accept: wantsArrayBuffer ? '*/*' : 'application/vnd.apple.mpegurl, application/x-mpegURL, */*' },
     onprogress: (event) => {
      stats.loaded = Number(event?.loaded || stats.loaded || 0); stats.total = Number(event?.total || stats.total || stats.loaded || 0);
      if (!stats.loading.first && stats.loaded > 0) stats.loading.first = performance.now();
     },
     onload: (r) => {
      const status = Number(r.status || 0);
      const response = { code: status, text: r.statusText || '', url: r.finalUrl || requestUrl };
      stats.tfirst = stats.tfirst || performance.now(); stats.tload = performance.now(); stats.loading.first = stats.loading.first || stats.tload;
      stats.loading.end = stats.tload;
      if (status < 200 || status >= 300) { callbacks.onError?.(response, context, null, stats); return; }
      const responseText = r.responseText ?? r.response ?? ''; const data = wantsArrayBuffer ? binaryTextToArrayBuffer(responseText) : responseText;
      stats.loaded = data?.byteLength || data?.length || stats.loaded || 0; stats.total = stats.total || stats.loaded;
      stats.bwEstimate = stats.loading.end > stats.loading.first ? Math.round((stats.total * 8000) / (stats.loading.end - stats.loading.first)) : 0;
      callbacks.onSuccess?.({ data, url: response.url }, stats, context, response); },
     onerror: () => callbacks.onError?.({ code: 0, text: 'network error', url: requestUrl }, context, null, stats),
     ontimeout: () => {
      stats.tload = performance.now(); stats.loading.end = stats.tload;
      callbacks.onTimeout?.(stats, context, null); }
    }); } };
  return { getHlsClass, loadHlsLibrary, createHlsLoader }; }
 function createTrailerPlayerView({ code, source, isIframe }) {
  const overlay = document.createElement('div');
  overlay.className = 'trailer-overlay';
  const modal = document.createElement('div');
  modal.className = 'trailer-modal'; modal.onclick = (e) => e.stopPropagation();
  const header = document.createElement('div');
  header.className = 'trailer-header';
  const title = document.createElement('div');
  title.className = 'trailer-title';
  title.innerHTML =`<span>🎞️</span><span class="trailer-code"> ${code} </span><span class="trailer-source"> ${source} </span>`;
  const sourceBadge = title.querySelector('.trailer-source'); const closeBtn = document.createElement('button');
  closeBtn.className = 'jav-player-close'; closeBtn.type = 'button'; closeBtn.textContent = '×';
  header.appendChild(title); header.appendChild(closeBtn);
  const screen = document.createElement('div');
  screen.className = 'trailer-screen';
  if (isIframe) screen.classList.add('is-iframe');
  const fallbackStatus = document.createElement('div');
  fallbackStatus.className = 'trailer-fallback-status';
  const volumeIndicator = document.createElement('div');
  volumeIndicator.className = 'trailer-volume-indicator';
  const playBtn = document.createElement('button');
  playBtn.className = 'trailer-control-btn'; playBtn.type = 'button'; playBtn.textContent = '⏸'; playBtn.title = '播放/暂停';
  const volumeBtn = document.createElement('button');
  volumeBtn.className = 'trailer-control-btn'; volumeBtn.type = 'button'; volumeBtn.textContent = '🔊'; volumeBtn.title = '静音/取消静音';
  const volumeWrap = document.createElement('div');
  volumeWrap.className = 'trailer-volume-wrap';
  const volumePopover = document.createElement('div');
  volumePopover.className = 'trailer-volume-popover';
  const volumeRail = document.createElement('div');
  volumeRail.className = 'trailer-volume-rail';
  const volumeFill = document.createElement('div');
  volumeFill.className = 'trailer-volume-fill';
  const volumeThumb = document.createElement('div');
  volumeThumb.className = 'trailer-volume-thumb';
  const volumeSlider = document.createElement('input');
  volumeSlider.className = 'trailer-volume-slider'; volumeSlider.type = 'range'; volumeSlider.min = '0'; volumeSlider.max = '100'; volumeSlider.step = '1';
  volumeSlider.value = '35'; volumeSlider.title = '音量';
  volumeRail.appendChild(volumeFill); volumeRail.appendChild(volumeThumb); volumePopover.appendChild(volumeRail); volumePopover.appendChild(volumeSlider);
  volumeWrap.appendChild(volumeBtn); volumeWrap.appendChild(volumePopover);
  const currentTimeText = document.createElement('span');
  currentTimeText.className = 'trailer-time'; currentTimeText.textContent = '00:00';
  const durationText = document.createElement('span');
  durationText.className = 'trailer-time'; durationText.textContent = '00:00';
  const progress = document.createElement('input');
  progress.className = 'trailer-progress'; progress.type = 'range'; progress.min = '0'; progress.max = '1000'; progress.step = '1'; progress.value = '0';
  progress.title = '播放进度';
  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.className = 'trailer-control-btn'; fullscreenBtn.type = 'button'; fullscreenBtn.textContent = '⛶'; fullscreenBtn.title = '全屏';
  return {
   overlay, modal, header, sourceBadge, closeBtn, screen,
   fallbackStatus, volumeIndicator, playBtn, volumeBtn, volumeWrap,
   volumeRail, volumeSlider, currentTimeText, durationText, progress, fullscreenBtn, }; }
 function createTrailerPlaybackControls({
  getVideo, isSeekingByProgress, getFooter, screen, playBtn, volumeBtn,
  volumeSlider, volumeRail, volumeIndicator, currentTimeText, durationText, progress,
 }) {
  let volumeIndicatorTimer = null; let controlsHideTimer = null;
  const formatTime = (seconds) => {
   if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
   const total = Math.floor(seconds); const h = Math.floor(total / 3600); const m = Math.floor((total % 3600) / 60); const s = total % 60;
   return h
    ?`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`                :`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const syncTrailerControls = () => {
   const video = getVideo();
   if (!video) return;
   playBtn.textContent = video.paused ? '▶' : '⏸'; volumeBtn.textContent = video.muted || video.volume <= 0 ? '🔇' : '🔊';
   volumeSlider.value = String(Math.round((video.muted ? 0 : video.volume) * 100));
   volumeRail.style.setProperty('--volume-percent',`${volumeSlider.value}%`);
   currentTimeText.textContent = formatTime(video.currentTime || 0); durationText.textContent = formatTime(video.duration || 0);
   if (!isSeekingByProgress() && Number.isFinite(video.duration) && video.duration > 0) {
    progress.value = String(Math.round(((video.currentTime || 0) / video.duration) * 1000)); } };
  const keepTrailerControlsVisible = () => {
   screen.classList.remove('is-controls-hidden'); clearTimeout(controlsHideTimer); };
  const hideTrailerControls = () => {
   clearTimeout(controlsHideTimer); screen.classList.add('is-controls-hidden'); };
  const showVolumeIndicator = () => {
   const video = getVideo();
   if (!video) return;
   volumeIndicator.textContent =`${Math.round(video.volume * 100)}%`;
   volumeIndicator.classList.add('is-visible'); clearTimeout(volumeIndicatorTimer);
   volumeIndicatorTimer = setTimeout(() => {
    volumeIndicator.classList.remove('is-visible');
   }, 820); };
  const showTrailerControls = () => {
   keepTrailerControlsVisible();
   const video = getVideo();
   if (!video || video.paused) return;
   controlsHideTimer = setTimeout(() => {
    if (MobilePolicy.isMobile() || (!getFooter()?.matches(':hover') && document.activeElement !== volumeSlider)) { hideTrailerControls(); }
   }, 2000); };
  const scheduleHideTrailerControls = () => {
   clearTimeout(controlsHideTimer);
   const video = getVideo();
   if (!video || video.paused) { screen.classList.remove('is-controls-hidden'); return; }
   controlsHideTimer = setTimeout(() => {
    hideTrailerControls();
   }, 2000); };
  const toggleTrailerFullscreen = () => {
   if (document.fullscreenElement) document.exitFullscreen?.();
   else screen.requestFullscreen?.();
  };
  const destroyTrailerControls = () => {
   clearTimeout(volumeIndicatorTimer); clearTimeout(controlsHideTimer); };
  return {
   formatTime, syncTrailerControls, keepTrailerControlsVisible, showVolumeIndicator,
   showTrailerControls, hideTrailerControls, scheduleHideTrailerControls, toggleTrailerFullscreen, destroyTrailerControls, }; }
 const createTrailerQualitySelector = ({
  qualities, initialQuality, getVideo, getActiveQuality, setActiveQuality,
  getFallbackUrls, setFallbackIndex, writePlaybackTime, destroyActiveHls,
  resetPlaybackReady, attachVideoSrc, sourceLink,
 }) => {
  const qualityBar = document.createElement('div'); const qualityMap = qualities && typeof qualities === 'object' ? qualities : null;
  if (!qualityMap || Object.keys(qualityMap).length <= 1) return qualityBar;
  const qualityOrder = ['4k', 'hhb', 'hmb', 'mhb', 'mmb', 'dm', 'sm'];
  const qualityLabels = { '4k': '4K', hhb: '1080P', hmb: '720P', mhb: '576P', mmb: '432P' };
  const sortedKeys = Object.keys(qualityMap) .filter(key => qualityMap[key]) .sort((a, b) => qualityOrder.indexOf(a) - qualityOrder.indexOf(b));
  const select = document.createElement('select');
  qualityBar.className = 'trailer-quality-bar'; select.className = 'trailer-quality-select';
  sortedKeys.forEach(key => { select.add(new Option(qualityLabels[key] || key, key)); });
  select.addEventListener('change', async () => {
   const key = select.value; const video = getVideo();
   if (!video || !qualityMap[key] || getActiveQuality() === key) return;
   const currentTime = video.currentTime || 0; const shouldPlay = !video.paused;
   writePlaybackTime(currentTime); destroyActiveHls(); resetPlaybackReady();
   video.dataset.playbackRestored = '1';
   setFallbackIndex(Math.max(0, getFallbackUrls().indexOf(qualityMap[key])));
   video.currentTime = currentTime;
   setActiveQuality(key, qualityMap[key]);
   sourceLink.href = qualityMap[key];
   attachVideoSrc(qualityMap[key]); video.load();
   video.currentTime = currentTime;
   if (shouldPlay) await video.play().catch(() => {});
  });
  qualityBar.appendChild(select);
  const initialKey = initialQuality && qualityMap[initialQuality] ? initialQuality : sortedKeys[0];
  setActiveQuality(initialKey, qualityMap[initialKey]);
  select.value = initialKey;
  return qualityBar; };
 const TrailerPlayer = {
  open({ code, url, type = 'video', source = '预告片', qualities = null, quality = null, urls = null, fallbackResolver = null, javxySource = null }) {
   document.querySelector('.trailer-overlay')?.remove();
   const isIframe = type === 'iframe'; const originalHtmlOverflow = document.documentElement.style.overflow;
   const originalBodyOverflow = document.body.style.overflow;
   document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
   const {
    overlay, modal, header, sourceBadge, closeBtn, screen,
    fallbackStatus, volumeIndicator, playBtn, volumeBtn, volumeWrap,
    volumeRail, volumeSlider, currentTimeText, durationText, progress, fullscreenBtn,
   } = createTrailerPlayerView({ code, source, isIframe });
   let video = null; let activeUrl = url; let activeType = type; let activeSource = source; let activeJavxySource = javxySource || source;
   let activeQuality = quality; let fallbackStatusTimer = null; let playbackReadyTimer = null; let sourceFallbackInProgress = false; let overlayClosed = false;
   let playbackStarted = false; let qualityBar = null; let qualityBarMount = null; const failedSources = new Set(); let seekingByProgress = false;
   let footer = null;
   let removeMobileTapToggle = () => {};
   const {
    formatTime, syncTrailerControls, keepTrailerControlsVisible, showVolumeIndicator,
    showTrailerControls, hideTrailerControls, scheduleHideTrailerControls, toggleTrailerFullscreen, destroyTrailerControls,
   } = createTrailerPlaybackControls({
    getVideo: () => video,
    isSeekingByProgress: () => seekingByProgress,
    getFooter: () => footer,
    screen, playBtn, volumeBtn, volumeSlider, volumeRail,
    volumeIndicator, currentTimeText, durationText, progress,
   });
   let fallbackUrls = Array.isArray(urls) ? [...new Set(urls.filter(Boolean))] : [url].filter(Boolean);
   let fallbackIndex = Math.max(0, fallbackUrls.indexOf(url));
   const sourceLink = { href: activeUrl };
   const playbackKey = (value = activeUrl) =>`trailer_playback_${String(code || '').trim().toUpperCase()}_${String(value || '').slice(0, 160)}`;
   let playbackKeyBase = playbackKey(activeUrl);
   const readPlaybackTime = (key = playbackKeyBase) => {
    const value = Number(sessionStorage.getItem(key) || 0);
    return Number.isFinite(value) && value > 0 ? value : 0; };
   const writePlaybackTime = (time = video?.currentTime || 0, key = playbackKeyBase) => {
    if (!Number.isFinite(time) || time < 3) return;
    const duration = Number(video?.duration || 0);
    if (Number.isFinite(duration) && duration > 0 && duration - time < 3) { sessionStorage.removeItem(key); return; }
    sessionStorage.setItem(key, String(Math.floor(time))); };
   const clearPlaybackTime = (key = playbackKeyBase) => sessionStorage.removeItem(key);
   const restorePlaybackTime = (key = playbackKeyBase) => {
    if (!video || video.dataset.playbackRestored === '1') return;
    const savedTime = readPlaybackTime(key);
    if (!savedTime) return;
    const duration = Number(video.duration || 0);
    if (Number.isFinite(duration) && duration > 0 && savedTime < duration - 3) {
     video.currentTime = savedTime; video.dataset.playbackRestored = '1';
     syncTrailerControls(); } };
   const setFallbackStatus = (message, autoHide = false) => {
    clearTimeout(fallbackStatusTimer);
    fallbackStatus.textContent = message || '';
    fallbackStatus.classList.toggle('is-visible', Boolean(message));
    if (message && autoHide) {
     fallbackStatusTimer = setTimeout(() => {
      fallbackStatus.classList.remove('is-visible');
     }, 1800); } };
   const markPlaybackReady = () => {
    playbackStarted = true;
    clearTimeout(playbackReadyTimer); setFallbackStatus('', false); };
   const destroyActiveHls = () => {
    if (video?._hls) {
     try { video._hls.destroy(); } catch {}
     video._hls = null; } };
   const renderQualityBar = (result = {}) => {
    if (isIframe || !qualityBarMount) return;
    const nextQualityBar = createTrailerQualitySelector({
     qualities: result.qualities,
     initialQuality: result.quality,
     getVideo: () => video,
     getActiveQuality: () => activeQuality,
     setActiveQuality: (nextQuality, nextUrl) => {
      activeQuality = nextQuality; activeUrl = nextUrl; },
     getFallbackUrls: () => fallbackUrls,
     setFallbackIndex: nextIndex => { fallbackIndex = nextIndex; },
     writePlaybackTime,
     destroyActiveHls,
     resetPlaybackReady: () => { playbackStarted = false; },
     attachVideoSrc,
     sourceLink,
    });
    qualityBar?.replaceWith(nextQualityBar);
    qualityBar = nextQualityBar; };
   const normalizedSourceName = (value = activeJavxySource) => {
    const raw = String(value || '').trim().toLowerCase();
    if (raw.includes('mgstage')) return 'MGStage';
    if (raw.includes('heydouga')) return 'HeyDouga';
    if (raw.includes('mywife')) return 'MYWIFE';
    if (raw.includes('duga')) return 'DUGA';
    if (raw.includes('javtrailers')) return 'JavTrailers';
    if (raw.includes('javdb')) return 'JavDB';
    if (raw.includes('avwikidb')) return 'AVWikiDB';
    if (raw.includes('javdatabase')) return 'JAVDatabase';
    if (raw.includes('dmm')) return 'DMM';
    return String(value || activeSource || '').replace(/^Javxy\s*\|\s*/i, '').trim(); };
   const schedulePlaybackGuard = (reason = 'timeout') => {
    clearTimeout(playbackReadyTimer);
    const timeout = /\.m3u8(?:[?#].*)?$/i.test(activeUrl) || activeType === 'hls' ? 8000 : 4000;
    playbackReadyTimer = setTimeout(() => {
     if (overlayClosed || playbackStarted || !video || !video.isConnected) return;
     handlePlaybackFailure(reason);
    }, timeout); };
   const useResultSource = (result) => {
    activeUrl = result.url; activeType = result.type || 'video'; activeSource = result.source || '预告片';
    activeJavxySource = result.javxySource || result.source || activeSource; activeQuality = result.quality || null; playbackStarted = false;
    fallbackUrls = Array.isArray(result.urls) && result.urls.length ? [...new Set(result.urls.filter(Boolean))] : [activeUrl].filter(Boolean);
    fallbackIndex = Math.max(0, fallbackUrls.indexOf(activeUrl)); sourceLink.href = activeUrl; playbackKeyBase = playbackKey(activeUrl);
    if (sourceBadge) sourceBadge.textContent = activeSource;
    renderQualityBar(result); };
   const handlePlaybackFailure = async (reason = 'error') => {
    if (overlayClosed || !video || sourceFallbackInProgress) return;
    if (playbackStarted && reason !== 'timeout') return;
    if (fallbackIndex < fallbackUrls.length - 1) {
     fallbackIndex += 1; activeUrl = fallbackUrls[fallbackIndex]; sourceLink.href = activeUrl;
     destroyActiveHls(); setFallbackStatus('当前画质加载失败，正在切换备用画质...'); attachVideoSrc(activeUrl);
     video.load?.();
     video.play().catch(() => {});
     schedulePlaybackGuard(reason);
     return; }
    if (typeof fallbackResolver !== 'function') return;
    const failedSource = normalizedSourceName();
    if (!failedSource || failedSources.has(failedSource)) return;
    failedSources.add(failedSource);
    sourceFallbackInProgress = true;
    setFallbackStatus(`${failedSource} 加载失败，正在切换备用来源...`);
    destroyActiveHls();
    try {
     const result = await fallbackResolver([...failedSources]);
     if (!result?.url) { setFallbackStatus('备用来源暂不可用', true); return; }
     useResultSource(result);
     setFallbackStatus(`已切换到 ${normalizedSourceName(result.javxySource || result.source) || '备用来源'}`, true);
     attachVideoSrc(activeUrl);
     video.load?.();
     video.play().catch(() => {});
     schedulePlaybackGuard('fallback');
    } catch (error) {
     errorLog('TrailerResolver 播放失败回落异常', error); setFallbackStatus('备用来源切换失败', true);
    } finally {
     sourceFallbackInProgress = false; } };
   const isM3U8 = /\.m3u8(?:[?#].*)?$/i.test(url);
   const { getHlsClass, loadHlsLibrary, createHlsLoader } = createTrailerHlsRuntime();
   const attachMp4Src = (src) => {
    if (!src) return;
    video.src = src; };
   const attachM3u8Src = (src) => {
    if (!src) return;
    const HlsClass = getHlsClass();
    if (!HlsClass) { video.src = src; video.load?.(); return; }
    const hls = new HlsClass({
     enableWorker: false,
     lowLatencyMode: true,
     loader: createHlsLoader(),
     autoStartLoad: true,
     startPosition: 0,
     capLevelToPlayerSize: true,
     testBandwidth: false,
     preferManagedMediaSource: false,
     maxBufferLength: 6,
     maxMaxBufferLength: 12,
     backBufferLength: 30,
     maxBufferHole: 0.5,
     nudgeOffset: 0.1,
     manifestLoadingMaxRetry: 2,
     levelLoadingMaxRetry: 2,
     fragLoadingMaxRetry: 2,
     manifestLoadingTimeOut: 12000,
     levelLoadingTimeOut: 12000,
     fragLoadingTimeOut: 12000,
     abrEwmaFastLive: 3,
     abrEwmaSlowLive: 9,
    });
    hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
     hls.startLoad(0);
     video.play().catch(() => {});
    });
    hls.on(HlsClass.Events.ERROR, (_, data) => {
     if (!data?.fatal) return;
     errorLog('TrailerResolver:HLS 播放失败', data);
     if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR) {
      if (playbackStarted || video?.readyState >= 2) {
       try { hls.recoverMediaError?.(); } catch {}
       markPlaybackReady();
       return; } }
     if (overlayClosed) return;
     handlePlaybackFailure('hls');
    });
    hls.loadSource(src); hls.attachMedia(video);
    video._hls = hls; };
   const attachVideoSrc = (src) => {
    if (!src) return;
    setFallbackStatus(`正在加载 ${normalizedSourceName() || '预告片'}...`);
    if (/\.m3u8(?:[?#].*)?$/i.test(src)) attachM3u8Src(src);
    else attachMp4Src(src);
    schedulePlaybackGuard('timeout'); };
   const initTrailerVideo = (src) => {
    if (isM3U8 && !getHlsClass()) {
     loadHlsLibrary().then(HlsClass => {
      if (!video || !video.isConnected) return;
      if (HlsClass) attachM3u8Src(src);
      else attachMp4Src(src);
     });
    } else { attachVideoSrc(src); } };
   if (isIframe) {
    const iframe = document.createElement('iframe');
    iframe.src = url; iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; iframe.allowFullscreen = true;
    screen.appendChild(iframe);
   } else {
    video = document.createElement('video'); video.controls = false; video.autoplay = true; video.loop = true; video.playsInline = true;
    const savedVolume = Number(GM_getValue('trailer_volume', 0.35)); const savedMuted = GM_getValue('trailer_muted', false);
    video.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.35; video.muted = Boolean(savedMuted);
    initTrailerVideo(fallbackUrls[fallbackIndex] || url);
    video.preload = 'auto';
    video.addEventListener('volumechange', () => {
     GM_setValue('trailer_volume', video.volume); GM_setValue('trailer_muted', video.muted); syncTrailerControls();
    });
    video.addEventListener('play', () => {
     syncTrailerControls(); scheduleHideTrailerControls();
    });
    video.addEventListener('playing', markPlaybackReady);
    video.addEventListener('pause', () => {
     syncTrailerControls(); keepTrailerControlsVisible();
    });
    video.addEventListener('timeupdate', () => {
     if ((video.currentTime || 0) > 0.15) markPlaybackReady();
     syncTrailerControls(); writePlaybackTime();
    });
    video.addEventListener('durationchange', () => {
     syncTrailerControls(); restorePlaybackTime();
    });
    video.addEventListener('loadedmetadata', () => {
     syncTrailerControls(); restorePlaybackTime();
    });
    video.addEventListener('ended', () => clearPlaybackTime());
    video.addEventListener('error', () => { handlePlaybackFailure('video'); });
    screen.appendChild(video); screen.appendChild(fallbackStatus); screen.appendChild(volumeIndicator);
    playBtn.addEventListener('click', e => {
     e.preventDefault(); e.stopPropagation();
     if (!video) return;
     if (video.paused) video.play().catch(() => {});
     else video.pause();
     syncTrailerControls();
    });
    volumeBtn.addEventListener('click', e => {
     e.preventDefault(); e.stopPropagation();
     if (!video) return;
     video.muted = !video.muted;
     if (!video.muted && video.volume <= 0) video.volume = 0.35;
     showVolumeIndicator(); syncTrailerControls();
    });
    volumeSlider.addEventListener('input', e => {
     e.stopPropagation();
     if (!video) return;
     keepTrailerControlsVisible();
     const nextVolume = Math.min(1, Math.max(0, Number(volumeSlider.value) / 100));
     video.volume = nextVolume; video.muted = nextVolume <= 0;
     showVolumeIndicator(); syncTrailerControls();
    });
    volumeSlider.addEventListener('change', scheduleHideTrailerControls);
    video.addEventListener('click', e => {
     if (MobilePolicy.isMobile()) return;
     e.preventDefault();
     if (video.paused) video.play().catch(() => {});
     else video.pause();
     syncTrailerControls();
    });
    progress.addEventListener('input', () => {
     seekingByProgress = true;
     if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
     const nextTime = (Number(progress.value) / 1000) * video.duration;
     currentTimeText.textContent = formatTime(nextTime);
    });
    progress.addEventListener('change', () => {
     if (video && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = (Number(progress.value) / 1000) * video.duration;
      writePlaybackTime(video.currentTime); }
     seekingByProgress = false;
     syncTrailerControls();
    });
    fullscreenBtn.addEventListener('click', e => {
     e.preventDefault(); e.stopPropagation(); fullscreenBtn.blur(); toggleTrailerFullscreen();
    });
    setTimeout(() => {
     video.play().catch(() => {});
     syncTrailerControls(); scheduleHideTrailerControls();
    }, 120); }
   qualityBar = isIframe ? document.createElement('div') : createTrailerQualitySelector({
    qualities,
    initialQuality: activeQuality,
    getVideo: () => video,
    getActiveQuality: () => activeQuality,
    setActiveQuality: (nextQuality, nextUrl) => {
     activeQuality = nextQuality; activeUrl = nextUrl; },
    getFallbackUrls: () => fallbackUrls,
    setFallbackIndex: nextIndex => { fallbackIndex = nextIndex; },
    writePlaybackTime,
    destroyActiveHls,
    resetPlaybackReady: () => { playbackStarted = false; },
    attachVideoSrc,
    sourceLink,
   });
   footer = document.createElement('div'); footer.className = 'trailer-footer';
   const footerLeft = document.createElement('div');
   footerLeft.className = 'trailer-control-left';
   if (!isIframe) {
    footerLeft.appendChild(playBtn); footerLeft.appendChild(volumeWrap); footerLeft.appendChild(currentTimeText); footerLeft.appendChild(progress);
    footerLeft.appendChild(durationText); }
   const footerRight = document.createElement('div');
   footerRight.className = 'trailer-control-right'; qualityBarMount = footerRight;
   footerRight.appendChild(qualityBar); footer.appendChild(footerLeft); footerRight.appendChild(fullscreenBtn); footer.appendChild(footerRight);
   modal.appendChild(screen); screen.appendChild(header);
   if (!isIframe) screen.appendChild(footer);
   overlay.appendChild(modal);
   if (!isIframe) {
    screen.addEventListener('mousemove', () => {
     if (!MobilePolicy.isMobile()) showTrailerControls();
    });
    screen.addEventListener('mouseenter', () => {
     if (!MobilePolicy.isMobile()) showTrailerControls();
    });
    const toggleMobileScreenControls = e => {
     if (!MobilePolicy.isMobile() || e.target.closest?.('.trailer-header, .trailer-footer')) return;
     if (screen.classList.contains('is-controls-hidden')) showTrailerControls();
     else hideTrailerControls();
    };
    screen.addEventListener('click', toggleMobileScreenControls);
    removeMobileTapToggle = () => screen.removeEventListener('click', toggleMobileScreenControls);
    screen.addEventListener('mouseleave', () => {
     if (!MobilePolicy.isMobile() && video && !video.paused) hideTrailerControls();
    });
    footer.addEventListener('mouseenter', () => {
     if (!MobilePolicy.isMobile()) keepTrailerControlsVisible();
    });
    footer.addEventListener('mouseleave', () => {
     if (!MobilePolicy.isMobile()) scheduleHideTrailerControls();
    }); }
   const closeOverlay = (event = null) => {
    if (event) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
    overlayClosed = true;
    const video = overlay.querySelector('video');
    if (video) {
     writePlaybackTime(video.currentTime || 0);
     if (video._hls) {
      try { video._hls.destroy(); } catch {}
      video._hls = null; }
     video.pause(); video.removeAttribute('src'); video.load(); }
    overlay.remove();
    document.documentElement.style.overflow = originalHtmlOverflow; document.body.style.overflow = originalBodyOverflow;
    window.removeEventListener('pointerdown', overlayCloseGuard, true); window.removeEventListener('mousedown', overlayCloseGuard, true);
    window.removeEventListener('click', overlayCloseGuard, true); document.removeEventListener('keydown', escHandler, true); removeMobileTapToggle();
    destroyTrailerControls(); clearTimeout(fallbackStatusTimer); clearTimeout(playbackReadyTimer); };
   const overlayCloseGuard = (event) => {
    if (!overlay.contains(event.target)) return;
    const shouldClose = event.target === overlay || event.target.closest('.jav-player-close');
    if (!shouldClose) return;
    if (event.type === 'click') { closeOverlay(event); return; }
    event.stopPropagation();
    event.stopImmediatePropagation?.(); };
   const escHandler = (e) => {
    if (e.key === 'Escape') { closeOverlay(); return; }
    if (isIframe) return;
    const key = e.key; const shouldCapture = [' ', 'Spacebar', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key);
    if (shouldCapture) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation?.(); }
    if (key === 'Enter') { toggleTrailerFullscreen(); showTrailerControls(); return; }
    if (!video) return;
    if (key === ' ' || key === 'Spacebar') {
     if (video.paused) video.play().catch(() => {});
     else video.pause();
     syncTrailerControls(); showTrailerControls();
    } else if (key === 'ArrowLeft') {
     video.currentTime = Math.max(0, (video.currentTime || 0) - 2);
    } else if (key === 'ArrowRight') {
     const nextTime = (video.currentTime || 0) + 2;
     video.currentTime = Number.isFinite(video.duration) ? Math.min(video.duration, nextTime) : nextTime;
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
     const delta = key === 'ArrowUp' ? 0.05 : -0.05;
     video.volume = Math.min(1, Math.max(0, Math.round((video.volume + delta) * 100) / 100));
     if (video.volume > 0) video.muted = false;
     showVolumeIndicator(); } };
   closeBtn.addEventListener('click', closeOverlay, true);
   overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay(e);
   }, true);
   window.addEventListener('pointerdown', overlayCloseGuard, true); window.addEventListener('mousedown', overlayCloseGuard, true);
   window.addEventListener('click', overlayCloseGuard, true); document.addEventListener('keydown', escHandler, true); document.body.appendChild(overlay); }, };
 const Thumbnail = {
  sources: ['javfree', 'projectjav', 'javstore'],
  cacheKey(code) {
   return`thumb_cache_v3_${code}`;
  },
  lookupCode(code) {
   const text = String(code || '').trim();
   const fc2 = text.match(/^(?:FC2[-_\s]?(?:PPV[-_\s]?)?)?(\d{6,9})$/i);
   return fc2 ? fc2[1] : text; },
  sourceOrder() {
   const savedOrder = Settings.getSourceOrder(); const ordered = Array.isArray(savedOrder) ? savedOrder : []; const seen = new Set();
   return [...ordered, ...this.sources].filter(src => {
    if (seen.has(src) || typeof this[src] !== 'function') return false;
    seen.add(src);
    return true;
   }); },
  async fetchFromSource(source, code) {
   try {
    return await this[source](this.lookupCode(code));
   } catch (e) {
    debugLog(`Thumbnail[${source}] 异常:`, e.message);
    return null; } },
  normalizeForCompare(text) { return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, ''); },
  isCodeMatched(text, code) {
   const normalizedText = this.normalizeForCompare(text); const normalizedCode = this.normalizeForCompare(code);
   return !!normalizedCode && normalizedText.includes(normalizedCode); },
  isDetailMatched(doc, url, code) {
   const title = doc?.querySelector('title')?.textContent || '';
   const headings = [...(doc?.querySelectorAll('h1,h2,h3,.entry-title,.movie-title,.post-title') || [])] .map(el => el.textContent || '') .join(' ');
   const bodyText = (doc?.body?.textContent || '').slice(0, 5000);
   return this.isCodeMatched([url, title, headings, bodyText].join(' '), code); },
  normalizePreviewUrl(url, baseUrl = '') {
   if (!url) return '';
   const absolute = /^https?:\/\//i.test(url)
    ? url : (baseUrl ? new URL(url, baseUrl).href : url);
   return absolute.replace(/^http:/, 'https:'); },
  isJavfreePreviewImage(url, code) {
   const cleanUrl = String(url || '').split('?')[0]; const lookupCode = this.lookupCode(code);
   const isFc2Numeric = /^\d{6,9}$/.test(lookupCode);
   const fc2ShotPattern = isFc2Numeric
    ? new RegExp(`${lookupCode}_\\d+\\.(?:jpe?g|png|webp)$`, 'i')
    : null;
   return this.isCodeMatched(cleanUrl, code) && (
     /-(?:1080p|demosaic)\.(?:jpe?g|png|webp)$/i.test(cleanUrl) || (isFc2Numeric && fc2ShotPattern.test(cleanUrl))
    ); },
  selectJavfreePreviewUrl(doc, detailUrl, code) {
   const urls = [...doc.querySelectorAll('p > img[src]')] .map(img => this.normalizePreviewUrl(img.getAttribute('src') || img.src || '', detailUrl))
    .filter(url => this.isJavfreePreviewImage(url, code));
   return urls.find(url => /-1080p\./i.test(url)) || urls.find(url => /-demosaic\./i.test(url)) || urls.find(url => /_1\.(?:jpe?g|png|webp)$/i.test(url)) || '';
  },
  async javfree(code) {
   code = this.lookupCode(code);
   const cacheKey = this.cacheKey(code); const cacheEnabled = Settings.getPreviewCacheEnabled();
   if (cacheEnabled) {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
   }
   try {
    const html = await Utils.request(`https://javfree.me/search/${code}`);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const link = [...doc.querySelectorAll('.entry-title>a')] .find(a => this.isCodeMatched([a.href, a.textContent].join(' '), code))?.href;
    if (!link) return null;
    const dHtml = await Utils.request(link); const dDoc = new DOMParser().parseFromString(dHtml, 'text/html');
    if (!this.isDetailMatched(dDoc, link, code)) return null;
    const url = this.selectJavfreePreviewUrl(dDoc, link, code);
    if (url && cacheEnabled) { sessionStorage.setItem(cacheKey, url); return url; }
    if (url) return url;
    return null;
   } catch { return null; } },
  async javstore(code) {
   code = this.lookupCode(code);
   try {
    const normalizedCode = code.replace(/^fc2-?/i, '').replace(/-/g, '').toLowerCase();
    debugLog(`javstore: searching for code=${code}, normalized=${normalizedCode}`);
    const searchUrl =`https://javstore.net/search?q=${encodeURIComponent(code)}`;
    const searchHtml = await Utils.request(searchUrl); const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');
    const candidateLinks = searchDoc.querySelectorAll('a[href*="/"]'); const detailUrls = [];
    for (const link of candidateLinks) {
     const href = link.getAttribute('href');
     if (!href) continue;
     if (href.startsWith('http') && !href.includes('javstore.net')) continue;
     const urlObj = new URL(href, searchUrl);
     if (!/javstore\.net$/i.test(urlObj.hostname)) continue;
     if (/^\/search(?:[/?#]|$)/i.test(urlObj.pathname)) continue;
     const fullUrl = urlObj.href; const pathLastPart = decodeURIComponent(urlObj.pathname.split('/').pop() || '');
     const normalizedPath = pathLastPart.toLowerCase().replace(/-/g, '');
     const looksLikeDetail = /\.html$/i.test(urlObj.pathname) || /^\/\d+[-/]/.test(urlObj.pathname);
     if (looksLikeDetail && normalizedPath.includes(normalizedCode) && !detailUrls.includes(fullUrl)) {
      detailUrls.push(fullUrl);
      debugLog(`javstore: 候选链接 [${detailUrls.length}]: ${fullUrl}`);
     } }
    if (detailUrls.length === 0) { debugLog('javstore: 未找到匹配的详情页'); return null; }
    for (const detailUrl of detailUrls) {
     debugLog(`javstore: 尝试详情页: ${detailUrl}`);
     const imgUrl = await this._extractImgFromDetail(detailUrl, code);
     if (imgUrl) {
      debugLog(`javstore: 找到预览图: ${imgUrl}`);
      return imgUrl; }
     debugLog(`javstore: 该页无预览图，尝试下一个`);
    }
    debugLog('javstore: 所有候选页均无预览图');
    return null;
   } catch (e) {
    debugLog('javstore 获取失败', e);
    return null; } },
  async _extractImgFromDetail(detailUrl, code) {
   try {
    const detailHtml = await Utils.request(detailUrl); const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
    if (!this.isDetailMatched(detailDoc, detailUrl, code)) { debugLog('javstore: 详情页番号不匹配，跳过', detailUrl); return null; }
    for (const link of detailDoc.querySelectorAll('a')) {
     if (link.textContent.includes('CLICK HERE')) {
      const imgUrl = link.href || link.getAttribute('href') || '';
      if (imgUrl) return this.normalizePreviewUrl(imgUrl, detailUrl);
     } }
    const img = detailDoc.querySelector('img[src*="_s.jpg"]');
    if (img) {
     let src = img.getAttribute('src') || '';
     if (!src.startsWith('http')) src = new URL(src, detailUrl).href;
     return this.normalizePreviewUrl(src.replace(/_s\.jpg$/, '_l.jpg'), detailUrl); }
    return null;
   } catch (e) {
    debugLog('javstore: 详情页请求失败', detailUrl, e.message);
    return null; } },
  async projectjav(code) {
   code = this.lookupCode(code);
   try {
    const request = (url) => new Promise((resolve, reject) => {
     GM_xmlhttpRequest({
      method: 'GET',
      url,
      timeout: 20000,
      headers: {
       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
       'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' },
      onload: r => {
       debugLog(`[projectjav] ${url} → HTTP ${r.status}, final=${r.finalUrl || url}, 长度 ${r.responseText?.length}`);
       if (r.status >= 200 && r.status < 400) resolve(r);
       else reject(new Error(`HTTP ${r.status}`));
      },
      onerror: (e) => { debugLog('[projectjav] 网络错误', e); reject(new Error('请求失败')); },
      ontimeout: () => { debugLog('[projectjav] 请求超时'); reject(new Error('请求超时')); }
     });
    });
    const searchUrl =`https://projectjav.com/?searchTerm=${encodeURIComponent(code)}`;
    debugLog('[projectjav] 搜索页:', searchUrl);
    const searchRes = await request(searchUrl); const searchHtml = searchRes.responseText || ''; const finalSearchUrl = searchRes.finalUrl || searchUrl;
    const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');
    let detailUrl = /\/movie\//i.test(new URL(finalSearchUrl).pathname)
     ? finalSearchUrl : '';
    if (!detailUrl) {
     const allMovieLinks = [...searchDoc.querySelectorAll('a[href*="/movie/"]')];
     debugLog(`[projectjav] /movie/ 链接数: ${allMovieLinks.length}`);
     allMovieLinks.slice(0, 5).forEach(a => debugLog('  ', a.getAttribute('href')));
     const firstLink = allMovieLinks[0]?.getAttribute('href') || '';
     if (!firstLink) { debugLog('[projectjav] 无结果，页面标题:', searchDoc.title); debugLog('[projectjav] 页面前800字符:', searchHtml.slice(0, 800)); return null; }
     detailUrl = firstLink.startsWith('http') ? firstLink :`https://projectjav.com${firstLink}`;
    }
    debugLog('[projectjav] 详情页:', detailUrl);
    const detailRes = finalSearchUrl === detailUrl ? searchRes : await request(detailUrl); const detailHtml = detailRes.responseText || '';
    const finalDetailUrl = detailRes.finalUrl || detailUrl; const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
    const screenshotLink = [...detailDoc.querySelectorAll('.col-md-12.thumbnail a[data-featherlight="image"], .thumbnail a[data-featherlight="image"]')]
     .find(a => this.isCodeMatched([
      a.outerHTML,
      a.closest('.thumbnail')?.outerHTML,
      finalDetailUrl
     ].join(' '), code));
    debugLog('[projectjav] screenshotLink matched:', !!screenshotLink, 'href:', screenshotLink?.getAttribute('href'));
    if (screenshotLink) {
     const thumbImg = screenshotLink.querySelector('img'); const href = screenshotLink.getAttribute('href') || '';
     if (href) return this.normalizePreviewUrl(href, finalDetailUrl);
     if (thumbImg) {
      const src = (thumbImg.getAttribute('src') || '').replace(/\?.*$/, '');
      if (src) return this.normalizePreviewUrl(src, finalDetailUrl);
     } }
    debugLog('[projectjav] 详情页未找到图片，页面标题:', detailDoc.title);
    return null;
   } catch (e) {
    debugLog('[projectjav] 异常:', e.message);
    return null; } },
  async get(code) {
   const cacheEnabled = Settings.getPreviewCacheEnabled(); const cacheKey = this.cacheKey(code);
   if (cacheEnabled) {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return { url: cached, source: null };
   }
   let url = null, source = null;
   for (const src of this.sourceOrder()) {
    url = await this.fetchFromSource(src, code);
    if (url) { source = src; break; }
    debugLog(`${src} 无结果，尝试下一个来源`);
   }
   debugLog('预览图最终结果:', url ?`有图 (${source})` : '无图');
   if (url && cacheEnabled) { sessionStorage.setItem(cacheKey, url); }
   return { url, source }; },
  async show(code) {
   const result = await this.get(code);
   if (result.url) {
    Utils.showOverlay(result.url, code, result.source);
   } else { alert('未找到预览图'); } } };
 const ListPreview = (() => {
  let magnetOverlay = null;
  const ACTIONS = [
   { key: 'magnet', name: 'magnet', title: '磁力', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="tool-svg" viewBox="0 0 1000 1000"><path d="M420 80c-160 18-300 88-410 200v210h230V300c55-45 120-72 200-80h140v-140H420zM760 80v140h140V80H760zM10 510v210c110 112 250 182 410 200h160V780H440c-80-8-145-35-200-80V510H10zM760 780v140h140V780H760z"/></svg>' },
   { key: 'trailer', name: 'trailer', title: '预告片', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="tool-svg" viewBox="0 0 16 16"><path d="M2 2.8A1.8 1.8 0 0 1 3.8 1h8.4A1.8 1.8 0 0 1 14 2.8v10.4a1.8 1.8 0 0 1-1.8 1.8H3.8A1.8 1.8 0 0 1 2 13.2V2.8zm1 1.7h10V2.8a.8.8 0 0 0-.8-.8H3.8a.8.8 0 0 0-.8.8v1.7zm10 1H3v5h10v-5zm0 6H3v1.7c0 .44.36.8.8.8h8.4c.44 0 .8-.36.8-.8v-1.7zM6.4 6.45a.45.45 0 0 1 .47.02l2.35 1.35a.45.45 0 0 1 0 .78L6.87 9.95A.45.45 0 0 1 6.2 9.56V6.84c0-.17.08-.32.2-.39z"/></svg>' },
   { key: 'preview', name: 'picture', title: '预览图', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="tool-svg" viewBox="0 0 16 16"><path d="M6 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path><path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v6.5l-3.78-1.95a.5.5 0 0 0-.57.1l-3.71 3.7-2.66-1.77a.5.5 0 0 0-.63.06L1 12V3a1 1 0 0 1 1-1h12z"></path></svg>' },
  ];
  const QUICK_MENU_ICON = '<svg xmlns="http://www.w3.org/2000/svg" class="tool-svg" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M0 0h1024v1024H0z" fill="none"/><path fill="currentColor" d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8m-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8m0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8M142.4 642.1L298.7 519a8.84 8.84 0 0 0 0-13.9L142.4 381.9c-5.8-4.6-14.4-.5-14.4 6.9v246.3a8.9 8.9 0 0 0 14.4 7"/></svg>';
  const QUICK_MENU_ITEMS = [
   { key: 'copy-code', label: '\u590d\u5236\u756a\u53f7', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="quick-menu-item-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M0 0h24v24H0z" fill="none"/><path fill="currentColor" d="M20 2H10c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 12H10V4h10zM14 20H4V10h2V8H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2h-2zM12 6h6v2h-6zm0 4h6v2h-6z"/></svg>' },
   { key: 'download-cover', label: '\u4e0b\u8f7d\u9ad8\u6e05\u5c01\u9762', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="quick-menu-item-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M0 0h12v12H0z" fill="none"/><path fill="currentColor" d="M8.5 5C6.57 5 5 6.57 5 8.5S6.57 12 8.5 12 12 10.43 12 8.5 10.43 5 8.5 5m1.85 4.35-1.5 1.5s-.1.08-.16.11c-.06.02-.12.04-.19.04s-.13-.01-.19-.04a.4.4 0 0 1-.16-.11l-1.5-1.5c-.2-.2-.2-.51 0-.71s.51-.2.71 0l.65.65V6.5c0-.28.22-.5.5-.5s.5.22.5.5v2.79l.65-.65c.2-.2.51-.2.71 0s.2.51 0 .71zM4.05 9c.04.35.11.68.23 1 .12-.32.19-.65.23-1H3c-1.65 0-3-1.35-3-3 0-1.49 1.1-2.74 2.53-2.96C2.76 2.33 4.23 1 6 1s3.24 1.32 3.47 3.04v.08A4.4 4.4 0 0 0 8.5 4h-.05A2.51 2.51 0 0 0 6 1.99a2.5 2.5 0 0 0-2.5 2.5c0 .28-.22.5-.5.5-1.1 0-2 .9-2 2s.9 2 2 2h1.05z"/></svg>' },
  ];
  function enabled() { return GM_getValue('list_preview_quick_enabled', true); }
  function ensureStyle() {
   injectStyle('jav-list-preview-style',`.jav-card-quick-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;flex:0 0 auto!important;margin-left:auto!important}.jav-card-quick-btn{width:26px;height:26px;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 24px!important;border:0!important;border-radius:4px!important;background:transparent!important;color:#64748b!important;box-shadow:none!important;fill:currentColor!important;line-height:1!important;text-decoration:none!important;cursor:pointer!important;user-select:none!important;opacity:.74!important;transition:transform .14s ease,color .14s ease,opacity .14s ease!important}.jav-card-quick-btn:hover{transform:translateY(-1px)!important;background:transparent!important;color:#2563eb!important;opacity:1!important}.jav-card-quick-btn:active{transform:scale(.96)!important}.jav-card-quick-btn:focus-visible{outline:2px solid rgba(37,99,235,.35)!important;outline-offset:2px!important}.jav-card-quick-btn .tool-svg{width:20px!important;height:20px!important;display:block!important;fill:currentColor!important}.jav-card-quick-menu{position:relative;display:inline-flex;z-index:30}.jav-card-quick-menu-trigger{width:26px!important;height:26px!important;padding:0!important}.jav-card-quick-menu-trigger .tool-svg{width:24px!important;height:24px!important}.jav-card-quick-menu-popover{display:none;position:fixed;z-index:10000120;min-width:164px;padding:5px;border:1px solid #dbe3ef;border-radius:6px;background:#fff;box-shadow:0 10px 24px rgba(15,23,42,.18)}.jav-card-quick-menu.is-open .jav-card-quick-menu-popover,.jav-card-quick-menu-popover.is-open{display:grid;gap:3px}.jav-card-quick-menu-item{display:flex;align-items:center;gap:8px;width:100%;min-height:34px;padding:0 9px;border:1px solid transparent;border-radius:4px;background:#fff;color:#475569;font-size:13px;font-weight:600;line-height:1.35;text-align:left;cursor:pointer}.jav-card-quick-menu-item:hover{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}.quick-menu-item-icon{width:18px;height:18px;flex:none;fill:currentColor}html[data-theme="dark"] .jav-card-quick-menu-popover,html[data-theme="dark"] .jav-card-quick-menu-item{border-color:#52525b;background:#18181b;color:#e4e4e7}.javbus-card-title .item-tag,.javdb-card-tags,.javlib-card-footer{align-items:center!important}.javbus-card-title .item-tag,.javdb-card-tags{display:flex!important}.javlib-card-footer .jav-card-quick-actions{margin-left:auto!important}.torrent-list>tbody>tr>td:nth-child(2)>.jav-card-quick-actions{display:inline-flex!important;align-items:center!important;gap:3px!important;margin:0 0 0 8px!important;vertical-align:middle!important;white-space:nowrap!important}.torrent-list>tbody>tr>td:nth-child(2){display:table-cell!important;min-width:0!important;overflow:visible!important}.torrent-list>tbody>tr>td:nth-child(2)>.jav-card-quick-actions{margin:0 8px 0 0!important}.torrent-list>tbody>tr>td:nth-child(2)>.jav-card-quick-actions{float:right!important;margin:0!important}.torrent-list>tbody>tr>td:nth-child(2)>.jav-card-quick-actions .jav-card-quick-btn{width:24px!important;height:24px!important;flex-basis:24px!important}.torrent-list>tbody>tr>td:nth-child(2)>.jav-card-quick-actions .tool-svg{width:17px!important;height:17px!important}.torrent-list>tbody>tr>td:nth-child(2)>a[href^="/view/"]{display:inline-block!important;max-width:calc(100% - 150px)!important;overflow:hidden!important;text-overflow:ellipsis!important;vertical-align:middle!important;white-space:nowrap!important}.torrent-list .jav-card-quick-preview{order:1}.torrent-list .jav-card-quick-trailer{order:2}.torrent-list .jav-card-quick-magnet{order:3}.torrent-list .jav-sukebei-offline-115{margin-left:4px!important}.torrent-list .jav-sukebei-offline-115[data-loading="1"]{pointer-events:none!important;opacity:.55!important}html.jav-card-portrait-mode .javdb-card-meta{display:flex!important;align-items:center!important;gap:6px!important}.jav-card-magnet-overlay{position:fixed;inset:0;z-index:10000035;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.58);backdrop-filter:blur(5px)}.jav-card-magnet-panel{width:min(760px,94vw);max-height:86vh;display:flex;flex-direction:column;overflow:hidden;border-radius:10px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.38)}.jav-card-magnet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #e5e7eb}.jav-card-magnet-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#111827;font-size:15px;font-weight:850}.jav-card-magnet-close{width:30px;height:30px;border:0;border-radius:7px;background:#f1f5f9;color:#334155;font-size:22px;line-height:1;cursor:pointer}.jav-card-magnet-body{padding:12px;overflow:auto}.jav-card-magnet-body .jav-nong-wrapper{width:100%!important;display:block!important;box-sizing:border-box!important}`);
  }
  function isListPage() { return !SiteManager.isDetailPage(); }
  function cardSite(card) {
   if (card?.classList?.contains('javbus-grid-card')) return 'javbus';
   if (card?.classList?.contains('javdb-grid-card')) return 'javdb';
   if (card?.classList?.contains('javlib-grid-card')) return 'javlib';
   if (SiteSukebei.match() && card?.matches?.('.torrent-list > tbody > tr')) return 'sukebei';
   return CardColumns.detectCurrentSite(); }
  function targetSlot(card) {
   const site = cardSite(card);
   if (site === 'javbus') return card.querySelector('.item-tag');
   if (site === 'javdb') {
    return PortraitCards.effective('javdb') ? card.querySelector('.javdb-card-meta, .meta') : card.querySelector('.javdb-card-tags, .tags.has-addons, .tags'); }
   if (site === 'javlib') {
    const title = card.querySelector('.javlib-card-title, .title'); let footer = title?.querySelector('.javlib-card-footer');
    if (!footer && title) { footer = document.createElement('span'); footer.className = 'javlib-card-footer'; title.appendChild(footer); }
    return footer; }
   if (site === 'sukebei') {
    const title = card.querySelector(':scope > td:nth-child(2) a[href^="/view/"]');
    const flexRow = title?.parentElement?.matches('span[style*="display: flex"]') ? title.parentElement : null;
    return flexRow || card.querySelector(':scope > td:nth-child(2)'); }
   return null; }
  function insertActions(slot, actions, site, card) {
   if (site === 'sukebei') {
    const title = card.querySelector(':scope > td:nth-child(2) a[href^="/view/"]');
    if (title?.parentNode === slot) {
     const embyButton = slot.querySelector(':scope > .emby-btn');
     if (embyButton) { slot.appendChild(actions); slot.insertBefore(actions, embyButton); return; }
     slot.insertBefore(actions, title);
     return; } }
   slot.appendChild(actions); }
  function closeMagnetPopup() {
   magnetOverlay?.remove();
   magnetOverlay = null; }
  function usesAggregateMagnetPanel() { return MobilePolicy.isMobile() || CFG.magnetDisplayMode === 'native-replace'; }
  function visibleActions() { return enabled() ? ACTIONS : []; }
  function syncSukebeiOfflineButton(card) {
   if (cardSite(card) !== 'sukebei') return;
   const cells = [...card.children].filter(child => child.matches?.('td')); const linkCell = cells.find(cell => cell.querySelector('a[href^="magnet:"]'));
   const magnetLink = linkCell?.querySelector('a[href^="magnet:"]'); const existing = card.querySelector('.jav-sukebei-offline-115');
   const assistantGroup = linkCell?.querySelector('.mag-btn-group[data-mag-assistant="1"]');
   if (!linkCell || !magnetLink) { existing?.remove(); return; }
   if (assistantGroup) { existing?.remove(); return; }
   const magnet = magnetLink.getAttribute('href') || magnetLink.href;
   if (existing) {
    existing.dataset.magnet = magnet;
    if (existing.parentNode !== linkCell) linkCell.appendChild(existing);
    return; }
   const button = document.createElement('a');
   button.href = '#'; button.className = 'jav-sukebei-offline-115'; button.title = '推送到115';
   button.setAttribute('aria-label', '推送到115');
   button.dataset.magnet = magnet; button.innerHTML = '<i class="fa fa-cloud-upload"></i>';
   button.addEventListener('click', async e => {
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.();
    if (button.dataset.loading === '1') return;
    button.dataset.loading = '1';
    try {
     await MagnetActions.offline115(button.dataset.magnet || magnet);
    } finally {
     delete button.dataset.loading; }
   }, true);
   magnetLink.insertAdjacentElement('afterend', button); }
  function openMagnetPopup(code) {
   if (!code) return;
   closeMagnetPopup(); ensureStyle();
   const overlay = document.createElement('div');
   overlay.className = 'jav-card-magnet-overlay';
   overlay.innerHTML =`<div class="jav-card-magnet-panel" role="dialog" aria-modal="true"><div class="jav-card-magnet-head"><div class="jav-card-magnet-title">磁力 ${code}</div><button class="jav-card-magnet-close" type="button">×</button></div><div class="jav-card-magnet-body"></div></div>`;
   overlay.addEventListener('click', e => {
    if (e.target === overlay) closeMagnetPopup();
   });
   overlay.querySelector('.jav-card-magnet-close')?.addEventListener('click', closeMagnetPopup);
   const body = overlay.querySelector('.jav-card-magnet-body');
   if (body) {
    body.appendChild(
     usesAggregateMagnetPanel() ? NativeMagnetPanel.createAggregatePanel(code) : Magnet.createMagnetWidget(code)
    ); }
   document.body.appendChild(overlay);
   magnetOverlay = overlay; }
  async function runAction(action, code, btn) {
   if (!code || btn.dataset.loading === '1') return;
   if (action === 'magnet') { openMagnetPopup(code); return; }
   btn.dataset.loading = '1'; btn.style.pointerEvents = 'none'; btn.style.opacity = '.72';
   try {
    if (action === 'trailer') await Trailer.show(code);
    else await Thumbnail.show(code);
   } finally {
    delete btn.dataset.loading;
    btn.style.pointerEvents = ''; btn.style.opacity = ''; } }
  function createButton(meta, code, card) {
   const btn = document.createElement('span');
   btn.className =`tool-span jav-card-quick-btn jav-card-quick-${meta.key}`;
   btn.setAttribute('name', meta.name); btn.setAttribute('avid', code);
   btn.dataset.action = meta.key; btn.dataset.code = code;
   btn.title =`${meta.title} ${code}`;
   btn.innerHTML = meta.svg;
   btn.setAttribute('role', 'button');
   btn.tabIndex = 0;
   const handler = e => {
    e.preventDefault(); e.stopPropagation();
    e.stopImmediatePropagation?.();
    runAction(meta.key, btn.dataset.code || SiteManager.getCardCode(card), btn); };
   btn.addEventListener('click', handler, true);
   btn.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    handler(e);
   }, true);
   return btn; }
  function showQuickMenuToast(title, message) {
   if (typeof Utils?.showToast === 'function') Utils.showToast(title, message, 1800);
  }
  async function runQuickMenuAction(action, code, card, item) {
   if (!code) return;
   if (action === 'copy-code') { GM_setClipboard(code); showQuickMenuToast('\u5df2\u590d\u5236\u756a\u53f7', code); return; }
   if (action !== 'download-cover') return;
   if (!Utils.isEligibleDmmCoverCode(code)) {
    showQuickMenuToast('\u65e0\u6cd5\u4e0b\u8f7d\u5c01\u9762', '\u8be5\u756a\u53f7\u4e0d\u652f\u6301 DMM \u9ad8\u6e05\u5c01\u9762');
    return; }
   item.disabled = true;
   showQuickMenuToast('\u6b63\u5728\u83b7\u53d6\u5c01\u9762', '\u6700\u9ad8\u652f\u6301 2K\uff0c\u56fe\u7247\u8f83\u5927\uff0c\u8bf7\u7a0d\u7b49');
   try {
    const result = await Trailer.fromJavxyCover(code); const url = result?.found && (result.url || result.highCover || result.cover);
    if (!url) { showQuickMenuToast('\u672a\u627e\u5230\u5c01\u9762', '\u8be5\u756a\u53f7\u6ca1\u6709\u53ef\u7528\u7684 DMM \u5c01\u9762'); return; }
    const fileName =`${code.replace(/[^a-z0-9_-]/gi, '_')}-cover.jpg`;
    GM_download({ url, name: fileName, saveAs: false,
     onload: () => showQuickMenuToast('\u5c01\u9762\u4e0b\u8f7d\u5b8c\u6210', fileName),
     onerror: () => showQuickMenuToast('\u5c01\u9762\u4e0b\u8f7d\u5931\u8d25', '\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216\u91cd\u8bd5') });
   } catch (error) {
    debugLog('DMM 封面检查失败:', error); showQuickMenuToast('\u5c01\u9762\u4e0b\u8f7d\u5931\u8d25', '\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216\u91cd\u8bd5');
   } finally {
    item.disabled = false; } }
  function closeQuickMenu(menu) {
   if (!menu) return;
   menu.classList.remove('is-open'); menu.querySelector('.jav-card-quick-menu-trigger')?.setAttribute('aria-expanded', 'false');
   const popover = menu.__quickMenuPopover;
   if (!popover) return;
   popover.classList.remove('is-open');
   popover.style.left = ''; popover.style.top = '';
   if (popover.parentNode !== menu) menu.appendChild(popover);
  }
  function toggleQuickMenu(menu) {
   const trigger = menu?.querySelector('.jav-card-quick-menu-trigger'); const popover = menu?.__quickMenuPopover;
   if (!trigger || !popover) return;
   document.querySelectorAll('.jav-card-quick-menu.is-open').forEach(item => { if (item !== menu) closeQuickMenu(item); });
   const open = !menu.classList.contains('is-open');
   if (!open) { closeQuickMenu(menu); return; }
   menu.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); popover.classList.add('is-open'); document.body.appendChild(popover);
   const rect = trigger.getBoundingClientRect(); const width = popover.offsetWidth || 164; const height = popover.offsetHeight || 82;
   popover.style.left =`${Math.min(Math.max(6, rect.right - width), window.innerWidth - width - 6)}px`;
   popover.style.top =`${rect.top >= height + 8 ? rect.top - height - 6 : Math.min(window.innerHeight - height - 6, rect.bottom + 6)}px`;
  }
  function addQuickMenu(card, actions, code) {
   if (!actions || !code) return null;
   const existing = card.querySelector('.jav-card-quick-menu');
   if (existing) {
    existing.dataset.code = code;
    const coverItem = existing.querySelector('[data-quick-action="download-cover"]');
    if (coverItem) coverItem.hidden = !Utils.isEligibleDmmCoverCode(code);
    actions.appendChild(existing);
    return existing; }
   const menu = document.createElement('span');
   menu.className = 'jav-card-quick-menu'; menu.dataset.code = code;
   menu.innerHTML =`<button type="button" class="jav-card-quick-btn jav-card-quick-menu-trigger" title="\u9996\u9875\u5feb\u6377\u529f\u80fd" aria-label="\u9996\u9875\u5feb\u6377\u529f\u80fd" aria-haspopup="menu" aria-expanded="false">${QUICK_MENU_ICON}</button><span class="jav-card-quick-menu-popover" role="menu"></span>`;
   const popover = menu.querySelector('.jav-card-quick-menu-popover');
   menu.__quickMenuPopover = popover;
   QUICK_MENU_ITEMS.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'jav-card-quick-menu-item'; button.dataset.quickAction = item.key; button.innerHTML =`${item.icon}<span>${item.label}</span>`;
    if (item.key === 'download-cover' && !Utils.isEligibleDmmCoverCode(code)) button.hidden = true;
    button.addEventListener('click', event => {
     event.preventDefault(); event.stopPropagation();
     Promise.resolve(runQuickMenuAction(item.key, menu.dataset.code || code, card, button)).finally(() => closeQuickMenu(menu));
    }, true);
    popover.appendChild(button);
   });
   const trigger = menu.querySelector('.jav-card-quick-menu-trigger');
   trigger.addEventListener('click', event => {
    event.preventDefault(); event.stopPropagation(); toggleQuickMenu(menu);
   }, true);
   trigger.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); event.stopPropagation(); toggleQuickMenu(menu);
   }, true);
   actions.appendChild(menu);
   return menu; }
  function createDetailActions(code, host = null) {
   if (!code) return null;
   const actions = document.createElement('span');
   actions.className = 'jav-detail-quick-actions'; actions.dataset.code = code;
   QUICK_MENU_ITEMS.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'jav-card-quick-btn jav-detail-quick-btn'; button.dataset.quickAction = item.key; button.innerHTML = item.icon;
    button.title =`${item.label}：${code}`;
    button.setAttribute('aria-label',`${item.label}：${code}`);
    if (item.key === 'download-cover' && !Utils.isEligibleDmmCoverCode(code)) button.hidden = true;
    button.addEventListener('click', event => {
     event.preventDefault(); event.stopPropagation(); Promise.resolve(runQuickMenuAction(item.key, actions.dataset.code || code, host, button));
    }, true);
    actions.appendChild(button);
   });
   return actions; }
  if (window.__LAOSIJI_QUICK_MENU_EVENTS__) window.removeEventListener('click', window.__LAOSIJI_QUICK_MENU_EVENTS__, true);
  window.__LAOSIJI_QUICK_MENU_EVENTS__ = event => {
   const insideMenu = event.target.closest?.('.jav-card-quick-menu')
    || [...document.querySelectorAll('.jav-card-quick-menu.is-open')].some(menu => menu.__quickMenuPopover?.contains(event.target));
   if (!insideMenu) document.querySelectorAll('.jav-card-quick-menu.is-open').forEach(closeQuickMenu);
  };
  window.addEventListener('click', window.__LAOSIJI_QUICK_MENU_EVENTS__, true);
  function attachToCard(card) {
   if (!card) return;
   card.querySelectorAll('.jav-list-preview-btn').forEach(el => el.remove());
   const existing = card.querySelector('.jav-card-quick-actions');
   if (enabled()) syncSukebeiOfflineButton(card);
   else card.querySelector('.jav-sukebei-offline-115')?.remove();
   const site = cardSite(card); const code = SiteManager.getCardCode(card); const slot = targetSlot(card);
   if (!code || !slot) { existing?.remove(); return; }
   if (existing) {
    const actions = visibleActions(); const actionKeys = new Set(actions.map(action => action.key));
    existing.dataset.code = code;
    existing.querySelectorAll('.jav-card-quick-btn:not(.jav-card-quick-menu-trigger)').forEach(btn => {
     const meta = ACTIONS.find(item => item.key === btn.dataset.action);
     if (!actionKeys.has(btn.dataset.action)) { btn.remove(); return; }
     btn.setAttribute('avid', code);
     btn.dataset.code = code;
     if (meta) btn.title =`${meta.title} ${code}`;
    });
    actions.forEach(meta => {
     if (!existing.querySelector(`[data-action="${meta.key}"]`)) {
      existing.appendChild(createButton(meta, code, card)); }
    });
    addQuickMenu(card, existing, code); insertActions(slot, existing, site, card);
    return; }
   const actions = document.createElement('span');
   actions.className = 'toolbar-b jav-card-quick-actions'; actions.dataset.code = code;
   visibleActions().forEach(meta => actions.appendChild(createButton(meta, code, card))); addQuickMenu(card, actions, code);
   insertActions(slot, actions, site, card); }
  function removeAll() {
   document.querySelectorAll('.jav-card-quick-actions, .jav-card-quick-menu, .jav-card-quick-menu-popover, .jav-list-preview-btn, .jav-sukebei-offline-115').forEach(el => el.remove());
   closeMagnetPopup(); }
  function sync() {
   if (!isListPage()) { removeAll(); return; }
   ensureStyle(); SiteManager.getListCards().forEach(attachToCard); }
  return { sync, removeAll, attach: attachToCard, closeMagnetPopup, closeQuickMenu, ensureStyle, addQuickMenu, createDetailActions };
 })();
 Core.expose('__LAOSIJI_LIST_PREVIEW__', ListPreview);
 const CoverHoverPreview = (() => {
  let active = false; let timer = null; let popup = null; let lastEvent = null; let lastAnchor = null; const titleStore = new Map();
  const pan115CoverCache = new Map(); const pan115CoverPending = new Map(); const PAN115_COVER_CACHE_PREFIX = 'pan115_cover_v2_';
  const DMM_GRAPHQL_URL = 'https://api.video.dmm.co.jp/graphql';
  function enabled() {
   const feature = is115Page() ? 'pan115CoverHoverPreview' : 'coverHoverPreview';
   const configured = is115Page() ? CFG.pan115CoverHoverPreview : CFG.coverHoverPreview; const embyPage = isEmbyPage();
   if (embyPage) return true;
   return MobilePolicy.featureEnabled(feature, !!configured) && !SiteManager.isDetailPage(); }
  function ensureStyle() {
   injectStyle('jav-cover-hover-preview-style',`.jav-cover-hover-preview{position:fixed;z-index:2147483000;pointer-events:none;padding:4px;border-radius:6px;background:rgba(15,23,42,.84);box-shadow:0 18px 42px rgba(15,23,42,.34);opacity:0;transform:translateY(4px);transition:opacity .12s ease,transform .12s ease}.jav-cover-hover-preview.is-visible{opacity:1;transform:translateY(0)}.jav-cover-hover-preview img{display:block;width:auto;max-width:min(90vw,1000px);max-height:82vh;border-radius:4px;object-fit:contain;background:#0f172a}`);
  }
  function clearTimer() {
   if (!timer) return;
   clearTimeout(timer);
   timer = null; }
  function hide() {
   clearTimer(); popup?.remove();
   popup = null; lastEvent = null; lastAnchor = null;
   restoreTitles(); }
  function is115Page() { return /^(?:www\.)?115\.com$/i.test(location.hostname); }
  function isEmbyPage() { return typeof SiteManager !== 'undefined' && typeof SiteManager.isEmbyPage === 'function' && SiteManager.isEmbyPage(); }
  function resolveEmbyImage(value) {
   const source = String(value || '').trim();
   if (!source || /^data:/i.test(source) || /^none$/i.test(source)) return '';
   try {
    return new URL(source, location.href).href;
   } catch { return source; } }
  function resizeEmbyImage(value, maxWidth, maxHeight) {
   const source = resolveEmbyImage(value);
   if (!source) return '';
   try {
    const url = new URL(source, location.href);
    if (!/\/Items\/[^/]+\/Images\//i.test(url.pathname)) return source;
    url.searchParams.delete('fillWidth'); url.searchParams.delete('fillHeight'); url.searchParams.set('maxWidth', String(maxWidth));
    url.searchParams.set('maxHeight', String(maxHeight));
    return url.href;
   } catch { return source; } }
  function embyLargeImageSrc(value) {
   const source = resizeEmbyImage(value, 1920, 1080);
   if (!source) return '';
   try {
    const url = new URL(source, location.href);
    if (/\/Images\/Primary$/i.test(url.pathname)) {
     url.pathname = url.pathname.replace(/\/Images\/Primary$/i, '/Images/Thumb');
     url.searchParams.delete('tag'); }
    return url.href;
   } catch { return source; } }
  function embyPrimaryFallbackSrc(value) { return resizeEmbyImage(value, 1080, 1620); }
  function cssImageUrl(value) {
   const matches = String(value || '').matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi);
   const urls = [...matches].map(match => resolveEmbyImage(match[2])).filter(Boolean);
   return urls.find(url => /\/Items\/[^/]+\/Images\//i.test(url)) || urls.at(-1) || '';
  }
  function embyImageSrc(node) {
   if (!node) return '';
   const img = node.matches?.('img') ? node : node.querySelector?.('img[src], img[data-src], img[data-lazy-src], img[data-image]');
   const imageValues = [
    img?.currentSrc,
    img?.getAttribute?.('src'),
    img?.getAttribute?.('data-src'),
    img?.getAttribute?.('data-lazy-src'),
    img?.getAttribute?.('data-image'), ];
   for (const value of imageValues) {
    const source = resolveEmbyImage(value);
    if (source) return source;
   }
   const inline = cssImageUrl(node.style?.backgroundImage);
   if (inline) return inline;
   if (typeof window.getComputedStyle === 'function') { return cssImageUrl(window.getComputedStyle(node).backgroundImage); }
   return ''; }
  function embyItemFromEvent(target) {
   const imageSelector = [
    '.cardImageContainer',
    '.cardImage',
    '.listItemImage',
    '.listItemImageContainer',
    '.itemImage',
    '.itemImageContainer',
    '.backdropCardImage',
   ].join(',');
   const directImage = target?.closest?.(imageSelector);
   const card = directImage?.closest?.('.card, .listItem, .item, .emby-scroller-slide') || target?.closest?.('.card, .listItem, .item, .emby-scroller-slide');
   const image = directImage || card?.querySelector?.(imageSelector);
   if (!image || !card || target?.closest?.('.cardText')) return null;
   const src = embyImageSrc(image) || embyImageSrc(card);
   return src ? {
    anchor: image,
    src: embyLargeImageSrc(src),
    fallback: embyPrimaryFallbackSrc(src),
    code: '',
   } : null; }
  function pan115ItemFromEvent(target) {
   const legacyItem = target?.closest?.('li[rel="item"]');
   if (legacyItem) {
    const fileType = legacyItem.getAttribute('file_type') || '';
    if (fileType !== '0' && fileType !== '1') return null;
    const name = legacyItem.getAttribute('title') || legacyItem.querySelector('.file-name .name')?.textContent || '';
    if (fileType === '1' && !Pan115.isVideoName(name)) return null;
    const code = Utils.extractCode(name);
    if (!code) return null;
    return { anchor: legacyItem, src: '', code: Utils.normalizeCode(code) }; }
   const item = target?.closest?.('.file-list-item');
   if (!item) return null;
   const nameNode = item.querySelector('.file-name-responsive[title], .file-name-responsive');
   const name = nameNode?.getAttribute('title') || nameNode?.textContent || '';
   const isFolder = !!item.querySelector('img[src*="/icons/types/folder.svg"], img[alt="文件夹"]') || /(?:^|\s)文件夹(?:\s|$)/.test(item.textContent || '');
   if (!isFolder && !Pan115.isVideoName(name)) return null;
   const code = Utils.extractCode(name);
   if (!code) return null;
   return { anchor: item, src: '', code: Utils.normalizeCode(code) }; }
  function targetFromEvent(target) {
   if (is115Page()) return pan115ItemFromEvent(target);
   if (isEmbyPage()) return embyItemFromEvent(target);
   const cover = target?.closest?.('.jav-card-cover');
   if (!cover || !cover.closest?.('.jav-card')) return null;
   return { anchor: cover, src: imageSrc(cover), code: '' }; }
  function imageSrc(cover) {
   const img = cover?.querySelector?.('img[src]');
   if (!img) return '';
   return img.dataset.laosijiLandscapeSrc || img.dataset.laosijiCoverSrc || img.currentSrc || img.src || ''; }
  function javdbImageUrl(value) {
   return String(value || '').trim().replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
  }
  function pickJavdbCover(movie) {
   const preview = Array.isArray(movie?.preview_images) ? movie.preview_images[0] : null;
   return javdbImageUrl(
    movie?.cover_url || movie?.thumb_url || movie?.cover?.url || preview?.large_url || preview?.url || preview?.thumb_url
   ); }
  function readPan115CoverCache(code) {
   const key =`${PAN115_COVER_CACHE_PREFIX}${code}`;
   if (pan115CoverCache.has(key)) return pan115CoverCache.get(key);
   try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return undefined;
    const value = JSON.parse(raw);
    pan115CoverCache.set(key, value || null);
    return value || null;
   } catch { return undefined; } }
  function writePan115CoverCache(code, value) {
   const key =`${PAN115_COVER_CACHE_PREFIX}${code}`;
   pan115CoverCache.set(key, value || null);
   try { sessionStorage.setItem(key, JSON.stringify(value || null)); } catch {}
  }
  async function loadJavdbCover(code) {
   const movie = await MagnetApi.client.searchMovieByNumber(code, { limit: 5, fallbackFirst: false });
   let cover = pickJavdbCover(movie);
   if (!cover && movie?.id) { const detail = await MagnetApi.client.movieDetail(movie.id); cover = pickJavdbCover(detail?.data?.movie); }
   if (!cover) throw new Error('JavDB cover missing');
   return cover; }
  function dmmGraphQLKeyword(code) {
   const match = String(code || '').trim().toUpperCase().match(/^([A-Z0-9]{2,10})-(\d{1,6})$/);
   if (!match) return '';
   return`${match[1].toLowerCase()}${match[2].padStart(5, '0')}`;
  }
  async function dmmGraphQLRequest(query) {
   const response = await gmFetch(DMM_GRAPHQL_URL, {
    method: 'POST',
    data: JSON.stringify({ query }),
    timeout: 12000,
    headers: {
     Accept: 'application/json',
     'Content-Type': 'application/json',
     Referer: 'https://video.dmm.co.jp/',
     'Fanza-Device': 'BROWSER',
     'Cache-Control': 'no-cache', },
   });
   if (!response.loadstuts || response.status < 200 || response.status >= 400) {
    throw new Error(`DMM GraphQL HTTP ${response.status || 0}`);
   }
   const json = JSON.parse(response.responseText || '{}');
   if (Array.isArray(json.errors) && json.errors.length) throw new Error(json.errors[0]?.message || 'DMM GraphQL error');
   return json.data || {}; }
  async function loadDmmCover(code) {
   const keyword = dmmGraphQLKeyword(code);
   if (!keyword) throw new Error('DMM cover keyword missing');
   for (const searchKeyword of [...new Set([keyword,`${keyword}#`])]) {
    const query =`{ legacySearchPPV(limit: 5, offset: 0, sort: SALES_RANK_SCORE, floor: AV, queryWord: ${JSON.stringify(searchKeyword)}) { result { contents { id } } } }`;
    const data = await dmmGraphQLRequest(query);
    const ids = Array.isArray(data?.legacySearchPPV?.result?.contents)
     ? data.legacySearchPPV.result.contents.map(item => String(item?.id || '').trim()).filter(Boolean) : [];
    const compactKeyword = keyword.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const contentID = ids.find(id => id.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(compactKeyword)) || (ids.length === 1 ? ids[0] : '');
    if (contentID) {
     const encoded = encodeURIComponent(contentID);
     return`https://pics.dmm.co.jp/digital/video/${encoded}/${encoded}pl.jpg`;
    } }
   throw new Error('DMM cover missing'); }
  async function loadPan115Cover(code) {
   const normalized = Utils.normalizeCode(code);
   if (!normalized) return '';
   const cached = readPan115CoverCache(normalized);
   if (cached !== undefined) return cached || '';
   if (pan115CoverPending.has(normalized)) return pan115CoverPending.get(normalized);
   const task = Promise.any([
    loadJavdbCover(normalized),
    loadDmmCover(normalized),
   ]).then(cover => {
    writePan115CoverCache(normalized, cover);
    return cover;
   }).catch(err => {
    errorLog('115 JavDB/DMM 封面查询失败:', normalized, err); writePan115CoverCache(normalized, '');
    return '';
   }).finally(() => pan115CoverPending.delete(normalized));
   pan115CoverPending.set(normalized, task);
   return task; }
  function titleTargets(cover) {
   return [
    cover,
    cover?.querySelector?.('.file-name .name[title]'),
    cover?.querySelector?.('.file-name-responsive[title]'),
    cover?.querySelector?.('img[title]'),
    cover?.closest?.('a[title]'),
    cover?.closest?.('.jav-card')?.querySelector?.('a[title]'),
   ].filter(Boolean); }
  function suppressTitles(cover) {
   titleTargets(cover).forEach(el => {
    if (!el.hasAttribute?.('title') || titleStore.has(el)) return;
    titleStore.set(el, el.getAttribute('title') || ''); el.removeAttribute('title');
   }); }
  function restoreTitles() {
   titleStore.forEach((title, el) => { el.setAttribute('title', title); });
   titleStore.clear(); }
  function position(box, event = lastEvent) {
   if (!box || !event) return;
   const gap = 16; const rect = box.getBoundingClientRect(); let left = event.clientX + gap; let top = event.clientY + gap;
   if (left + rect.width > window.innerWidth - 8) left = event.clientX - rect.width - gap;
   if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8;
   if (top < 8) top = 8;
   if (left < 8) left = 8;
   box.style.left =`${Math.round(left)}px`;
   box.style.top =`${Math.round(top)}px`;
  }
  function show(src, event, fallback = '') {
   if (!src || !active) return;
   ensureStyle(); popup?.remove();
   const box = document.createElement('div'); const img = document.createElement('img');
   box.className = 'jav-cover-hover-preview'; img.decoding = 'async'; img.loading = 'eager'; img.src = src;
   img.addEventListener('load', () => {
    position(box, event); requestAnimationFrame(() => box.classList.add('is-visible'));
   }, { once: true });
   let fallbackAttempted = false;
   const onImageError = () => {
    if (fallback && !fallbackAttempted) { fallbackAttempted = true; img.src = fallback; return; }
    hide(); };
   img.addEventListener('error', onImageError); box.appendChild(img); document.body.appendChild(box);
   popup = box;
   position(box, event); }
  function onOver(event) {
   if (!enabled()) return;
   const target = targetFromEvent(event.target);
   if (!target) return;
   suppressTitles(target.anchor);
   lastEvent = event; lastAnchor = target.anchor;
   clearTimer();
   timer = setTimeout(async () => {
    const current = targetFromEvent(lastEvent?.target);
    if (!current || current.anchor !== target.anchor || !active) return;
    const src = target.src || await loadPan115Cover(target.code);
    if (src && active && lastAnchor === target.anchor) show(src, lastEvent, target.fallback);
   }, 500); }
  function onMove(event) {
   if (!popup && !timer) return;
   lastEvent = event;
   if (popup) position(popup, event);
  }
  function onOut(event) {
   const target = targetFromEvent(event.target);
   if (!target) return;
   const next = event.relatedTarget;
   if (next && targetFromEvent(next)?.anchor === target.anchor) return;
   hide(); }
  function onPointerDown(event) {
   if (!targetFromEvent(event.target)) return;
   hide(); }
  function sync() {
   const shouldEnable = enabled();
   if (shouldEnable === active) {
    if (!shouldEnable) hide();
    return; }
   active = shouldEnable;
   if (active) {
    document.addEventListener('mouseover', onOver, true); document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseout', onOut, true); document.addEventListener('pointerdown', onPointerDown, true);
   } else {
    document.removeEventListener('mouseover', onOver, true); document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('mouseout', onOut, true); document.removeEventListener('pointerdown', onPointerDown, true); hide(); } }
  return { sync, hide };
 })();
 Core.expose('__LAOSIJI_COVER_HOVER_PREVIEW__', CoverHoverPreview);
 const DetailPreviewInline = (() => {
  let lastToken = 0;
  let state = { code: '', status: '' };
  function enabled() { return MobilePolicy.featureEnabled('detailPreviewInline', CFG.detailPreviewInline); }
  function ensureStyle() {
   injectStyle('jav-detail-preview-inline-style',`.jav-nong-slot.has-detail-preview-inline{display:flex!important;align-items:flex-start!important;gap:12px!important;overflow:visible!important}.jav-detail-preview-standalone{display:flex!important;align-items:flex-start!important;gap:12px!important;min-width:0!important;align-self:flex-start!important;overflow:visible!important}.row.movie>.jav-detail-preview-standalone{flex:0 0 180px!important}.jav-flex-container>.jav-detail-preview-standalone{flex:0 0 180px!important}#video_jacket_info tr>.jav-detail-preview-standalone{flex:0 0 180px!important;min-width:160px!important;vertical-align:top!important}.javlib-nong-slot.has-detail-preview-inline{width:100%!important}.jav-nong-slot.has-detail-preview-inline .jav-nong-wrapper{flex:1 1 auto!important;min-width:0!important}.javlib-nong-slot.has-detail-preview-inline>div:not(.jav-detail-preview-wrap){flex:1 1 0!important;min-width:0!important;display:block!important}.javlib-nong-slot.has-detail-preview-inline>.jav-detail-preview-wrap{flex:0 0 180px!important;width:180px!important;max-width:180px!important;min-width:160px!important;height:480px!important;max-height:480px!important;overflow:hidden!important;display:block!important}.jav-detail-preview-wrap{flex:0 0 180px;width:180px;max-width:180px;min-width:150px;align-self:flex-start;position:relative;box-sizing:border-box;overflow:hidden}.jav-detail-preview-inline{display:block;width:100%;height:auto;max-width:100%;max-height:480px;object-fit:contain;border-radius:6px;cursor:zoom-in}.javlib-nong-slot.has-detail-preview-inline .jav-detail-preview-inline{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important}.jav-detail-preview-loading{position:absolute;inset:0;display:grid;place-items:center;color:#475569;font-size:12px;font-weight:700;white-space:nowrap;pointer-events:none}@media (max-width:900px){.jav-nong-slot.has-detail-preview-inline{flex-wrap:wrap!important}.jav-detail-preview-standalone{flex-basis:100%!important}.jav-detail-preview-wrap{flex-basis:100%;width:100%;max-width:100%}.jav-detail-preview-inline{max-width:100%;max-height:480px;margin:0 auto}.javlib-nong-slot.has-detail-preview-inline>.jav-detail-preview-wrap{flex-basis:100%!important;width:100%!important;max-width:100%!important;height:480px!important;max-height:480px!important}}`);
  }
  function remove() {
   SiteManager.clearDetailPreviewInline(); }
  async function sync() {
   if (!enabled() || !SiteManager.isDetailPage()) {
    lastToken++;
    remove();
    state = { code: '', status: '' };
    return; }
   ensureStyle();
   const code = SiteManager.getDetailCode();
   if (!code) {
    lastToken++;
    remove();
    state = { code: '', status: '' };
    return; }
   if (state.code === code && state.status === 'missing') return;
   const existingWrap = document.querySelector('.jav-detail-preview-wrap');
   if (existingWrap?.dataset.code === code && existingWrap.dataset.state === 'loaded') return;
   if (existingWrap?.dataset.code === code && existingWrap.dataset.state === 'loading') return;
   const token = ++lastToken;
   state = { code, status: 'loading' };
   if (existingWrap && existingWrap.dataset.code !== code) existingWrap.remove();
   const target = SiteManager.getDetailPreviewTarget();
   if (!target) { return; }
   if (!target.standalone) target.slot.classList.add('has-detail-preview-inline');
   let wrap = document.querySelector('.jav-detail-preview-wrap');
   if (!wrap) {
    wrap = document.createElement('div'); wrap.className = 'jav-detail-preview-wrap'; wrap.dataset.code = code; wrap.dataset.state = 'loading';
    const loading = document.createElement('span');
    loading.className = 'jav-detail-preview-loading'; loading.textContent = '预览图加载中...';
    wrap.appendChild(loading);
    if (target.anchor?.parentElement === target.slot) {
     target.slot.insertBefore(wrap, target.anchor);
    } else { target.slot.insertBefore(wrap, target.slot.firstChild); }
   } else { wrap.dataset.code = code; wrap.dataset.state = 'loading'; wrap.innerHTML = '<span class="jav-detail-preview-loading">预览图加载中...</span>'; }
   const result = await Thumbnail.get(code);
   if (token !== lastToken || !wrap.isConnected) return;
   if (!result?.url) {
    wrap.remove();
    if (!target.standalone) target.slot.classList.remove('has-detail-preview-inline');
    state = { code, status: 'missing' };
    return; }
   state = { code, status: 'loaded' };
   wrap.dataset.state = 'loaded'; wrap.innerHTML = '';
   const img = document.createElement('img');
   img.className = 'jav-detail-preview-inline'; img.dataset.code = code; img.src = result.url; img.alt = code; img.loading = 'lazy'; img.title = '点击查看预览图';
   img.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); Utils.showOverlay(result.url, code, result.source); });
   wrap.appendChild(img); }
  return { sync, remove };
 })();
 Core.expose('__LAOSIJI_DETAIL_PREVIEW_INLINE__', DetailPreviewInline);
 const DetailCoverDownload = (() => {
  function ensureStyle() {
   injectStyle('jav-detail-quick-actions-style',`.jav-detail-quick-actions{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-left:8px!important;vertical-align:middle!important;line-height:0!important;white-space:nowrap!important}.jav-detail-quick-actions .jav-detail-quick-btn{width:26px!important;height:26px!important;padding:0!important;flex:0 0 26px!important;appearance:none!important;border:0!important;vertical-align:middle!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;outline:0!important;text-shadow:none!important}.jav-detail-quick-actions .quick-menu-item-icon{width:18px!important;height:18px!important;display:block!important;background:transparent!important;background-image:none!important;border:0!important}.jav-detail-quick-actions .jav-detail-quick-btn:hover,.jav-detail-quick-actions .jav-detail-quick-btn:active,.jav-detail-quick-actions .jav-detail-quick-btn:focus{border:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;outline:0!important}`);
  }
  function removeLegacyCopyButtons() {
   document.querySelectorAll('.jav-avid-copy').forEach(button => button.remove());
   document.querySelectorAll('.movie-panel-info .first-block .copy-to-clipboard').forEach(button => button.remove()); }
  function remove() {
   document.querySelectorAll('.jav-detail-quick-actions').forEach(actions => actions.remove());
   document.querySelectorAll('.jav-detail-cover-download-shell').forEach(shell => {
    const media = [...shell.children].find(child => !child.classList.contains('jav-detail-cover-download'));
    if (media) shell.replaceWith(media);
    else shell.remove();
   }); }
  function getTarget(code) {
   const numberBlock = document.querySelector('.movie-panel-info .first-block'); const numberValue = numberBlock?.querySelector('.value');
   if (numberBlock && numberValue) return { anchor: numberValue, host: numberBlock };
   const javbusInfo = document.querySelector('div.col-md-3.info');
   const javbusCode = [...(javbusInfo?.querySelectorAll('p span, h3 span') || [])].find(el => {
    return el.textContent.trim().toUpperCase() === code.toUpperCase();
   });
   if (javbusCode) return { anchor: javbusCode, host: javbusInfo };
   const javbusAnchor = [...(javbusInfo?.querySelectorAll('p, h3, span') || [])].find(el => {
    return el.textContent.trim().toUpperCase().includes(code.toUpperCase());
   });
   if (javbusAnchor) return { anchor: javbusAnchor, host: javbusInfo };
   const javlibAnchor = document.querySelector('#video_id .text');
   if (javlibAnchor) return { anchor: javlibAnchor, host: javlibAnchor, inside: true };
   return null; }
  function sync() {
   const code = SiteManager.isDetailPage() ? SiteManager.getDetailCode() : '';
   removeLegacyCopyButtons();
   if (!code) { remove(); return; }
   const target = getTarget(code);
   if (!target) { remove(); return; }
   const existing = target.anchor.querySelector(':scope > .jav-detail-quick-actions')
    || target.anchor.parentElement?.querySelector(':scope > .jav-detail-quick-actions')
    || target.anchor.nextElementSibling?.classList.contains('jav-detail-quick-actions') && target.anchor.nextElementSibling;
   if (existing?.dataset.code === code) return;
   remove(); ensureStyle();
   const actions = ListPreview.createDetailActions(code, target.host);
   if (!actions) return;
   actions.dataset.code = code;
   if (target.inside) target.anchor.appendChild(actions);
   else target.anchor.insertAdjacentElement('afterend', actions);
  }
  return { sync, remove };
 })();
 Core.expose('__LAOSIJI_DETAIL_COVER_DOWNLOAD__', DetailCoverDownload);
 const JAVXY_DEV_API_BASE = '';
 const Trailer = {
  normalize(code) { return Utils.normalizeCode(code); },
  cacheKey(code) {
   return`trailer_cache_v17_${this.normalize(code)}`;
  },
  isDynamicTrailer(result) {
   const url = String(result?.url || '');
   return String(result?.type || '').toLowerCase() === 'hls' || /\.m3u8(?:[?#].*)?$/i.test(url); },
  debug(...args) {
   if (DEBUG_LOG) console.log('[TrailerResolver]', ...args);
  },
  resolverChain() {
   return [
    'fromJavxyCcCd'
   ].map(name => ({ name, fn: this[name] })).filter(item => typeof item.fn === 'function'); },
  async show(code) {
   const result = await this.get(code);
   if (result?.url) {
    this.debug('打开播放器', { code: this.normalize(code), source: result.source, type: result.type || 'video', url: result.url });
    const normalizedCode = this.normalize(code); const rawCode = String(code || '').trim();
    Utils.showTrailerOverlay({
     code: normalizedCode,
     url: result.url,
     type: result.type || 'video',
     source: result.source || '预告片',
     qualities: result.qualities,
     quality: result.quality,
     urls: result.urls,
     javxySource: result.javxySource || result.source,
     fallbackResolver: async (failedSources = []) => {
      const failed = [...new Set(failedSources.map(source => this.normalizeJavxySource(source)).filter(Boolean))];
      if (failed.includes('JavDB')) return null;
      if (failed.includes('DMM')) this.markJpSourceTemporarilyFailed('DMM');
      const sources = failed.includes('JavTrailers') ? ['JavDB'] : ['JavTrailers', 'JavDB'];
      return this.fallbackJavxyResult(normalizedCode, rawCode, failed, { source: sources }); }
    });
   } else {
    this.debug('最终未找到可用视频源', { code: this.normalize(code) });
    Utils.showToast('未找到可用的视频源。', '节点不可用，请将DMM域名分流到日本ip', 3000); } },
  async get(code) {
   const rawCode = String(code || '').trim(); const id = this.normalize(code); const cacheEnabled = Settings.getTrailerCacheEnabled();
   this.debug('开始查询', { rawCode, normalized: id, cacheEnabled });
   if (cacheEnabled) {
    const cached = sessionStorage.getItem(this.cacheKey(id));
    if (cached) {
     try {
      const cachedResult = JSON.parse(cached);
      if (cachedResult?.url) {
       if (this.isDynamicTrailer(cachedResult)) {
        this.debug('动态预告不缓存，已清理旧缓存', { source: cachedResult.source, url: cachedResult.url });
        sessionStorage.removeItem(this.cacheKey(id));
       } else if (this.isJpSourceTemporarilyFailed('DMM') && this.normalizeJavxySource(cachedResult.javxySource || cachedResult.source) === 'DMM') {
        this.debug('DMM 会话内已失败，跳过旧缓存', { source: cachedResult.source, url: cachedResult.url });
        sessionStorage.removeItem(this.cacheKey(id));
       } else {
        this.debug('缓存命中', { source: cachedResult.source, url: cachedResult.url });
        return cachedResult; } }
     } catch {
     }
     this.debug('缓存无效，已移除'); sessionStorage.removeItem(this.cacheKey(id)); } }
   for (const resolver of this.resolverChain()) {
    const resolverName = resolver.name || 'anonymous';
    try {
     this.debug('尝试来源', resolverName);
     const options = resolverName === 'fromJavxyCcCd' && this.isJpSourceTemporarilyFailed('DMM') ? { skip: ['DMM'] } : {};
     const result = await resolver.fn.call(this, id, rawCode, options);
     if (result?.url) {
      this.debug('来源命中', resolverName, { source: result.source, type: result.type || 'video', url: result.url, qualities: result.qualities ? Object.keys(result.qualities) : [] });
      if (cacheEnabled && !this.isDynamicTrailer(result)) sessionStorage.setItem(this.cacheKey(id), JSON.stringify(result));
      return result; }
     this.debug('来源无结果', resolverName);
    } catch (e) {
     errorLog(`TrailerResolver 来源异常: ${resolverName}`, e);
    } }
   return null; },
  request(url, options = {}) {
   const request = gmFetch(url, {
    method: options.method || 'GET',
    data: options.data,
    headers: options.headers || {},
    timeout: options.timeout || 15000,
   });
   const result = request.then(response => {
    if (['network', 'timeout', 'abort'].includes(response.error?.kind)) return null;
    return response;
   });
   result.abort = () => request.abort?.() || false;
   return result; },
  javxyToken() {
   return [118,119,112,71,97,110,28,84,124,65,76,102,65,16,77,109,64,82,85,83,67,92,125,108,83,65,124,107,84,104,71,84,17,124,118,125,104,8,125,96,112,103,29,18,82,83,87,84]
    .map(v => String.fromCharCode(v ^ 0x25)) .join(''); },
  normalizeJavxySource(value) {
   const raw = String(value || '').trim().toLowerCase();
   if (raw.includes('fc2')) return 'FC2';
   if (raw.includes('mgstage')) return 'MGStage';
   if (raw.includes('heydouga')) return 'Direct';
   if (raw.includes('mywife')) return 'MYWIFE';
   if (raw.includes('duga')) return 'DUGA';
   if (raw.includes('javtrailers')) return 'JavTrailers';
   if (raw.includes('javdb')) return 'JavDB';
   if (raw.includes('avwikidb')) return 'AVWikiDB';
   if (raw.includes('javdatabase')) return 'JAVDatabase';
   if (raw.includes('dmm')) return 'DMM';
   if (raw === 'direct' || raw.includes('heyzo') || raw.includes('heydouga') || raw.includes('paco') || raw.includes('10musume') || raw.includes('10mu') || raw.includes('1pondo') || raw.includes('caribbean') || raw.includes('tokyo-hot') || raw.includes('tokyohot')) return 'Direct';
   return String(value || '').trim(); },
  jpSourceFailedKey(source = 'DMM') {
   return`javxy_jp_source_failed_until_${String(source || '').toUpperCase()}`;
  },
  isJpSourceTemporarilyFailed(source = 'DMM') {
   const until = Number(sessionStorage.getItem(this.jpSourceFailedKey(source)) || 0);
   if (!Number.isFinite(until) || until <= Date.now()) { sessionStorage.removeItem(this.jpSourceFailedKey(source)); return false; }
   return true; },
  markJpSourceTemporarilyFailed(source = 'DMM') {
   sessionStorage.setItem(this.jpSourceFailedKey(source), String(Date.now() + 30 * 60 * 1000)); },
  async fallbackJavxyResult(code, rawCode = '', failedSources = [], options = {}) {
   const skip = [...new Set((failedSources || []).map(source => this.normalizeJavxySource(source)).filter(Boolean))];
   const prefer = [...new Set((options.prefer || []).map(source => String(source || '').trim()).filter(Boolean))];
   const source = [...new Set((options.source || []).map(source => String(source || '').trim()).filter(Boolean))];
   if (!skip.length && !prefer.length && !source.length) return null;
   if (!options.silent) {
    this.debug('Javxy 播放失败回落查询', {
     code,
     skip,
     prefer,
     source,
     rule: '仅跳过失败来源，后续顺序按服务端后台设置'
    }); }
   return this.fromJavxyCcCd(code, rawCode, { skip, prefer, source, playbackFallback: true }); },
  installFallbackDebugHelper() {
   const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : globalThis;
   targetWindow.__javxyFailDMMFor30m = globalThis.__javxyFailDMMFor30m = () => {
    this.markJpSourceTemporarilyFailed('DMM'); this.debug('已手动标记 DMM 30 分钟内跳过'); };
   targetWindow.__javxyClearDMMFail = globalThis.__javxyClearDMMFail = () => {
    sessionStorage.removeItem(this.jpSourceFailedKey('DMM')); this.debug('已清除 DMM 跳过标记'); }; },
  result(url, source, type = 'video', extra = {}) {
   return { url, source, type, ...extra }; },
  qualityOptions: [
   { quality: '4k', text: '4K' },
   { quality: 'hhb', text: '1080p' },
   { quality: '1080p', text: '1080p' },
   { quality: 'hmb', text: '720p' },
   { quality: '720p', text: '720p' },
   { quality: 'mhb', text: '576p' },
   { quality: '540p', text: '540p' },
   { quality: 'mmb', text: '432p' },
   { quality: '480p', text: '480p' },
   { quality: '396p', text: '396p' },
   { quality: '360p', text: '360p' },
   { quality: '240p', text: '240p' } ],
  selectHighestQuality(qualityMap) { return this.sortQualityKeys(qualityMap)[0] || null; },
  sortQualityKeys(qualityMap) {
   const rank = new Map(this.qualityOptions.map((item, index) => [item.quality, index]));
   return Object.keys(qualityMap || {}) .filter(key => qualityMap[key]) .sort((a, b) => (rank.get(a) ?? -1) - (rank.get(b) ?? -1)); },
  javxySourceLabels: {
   'Tokyo-Hot': 'Javxy | Tokyo-Hot',
   FC2: 'Javxy | FC2',
   Direct: 'Javxy | Direct',
   DMM: 'Javxy | dmm',
   MGStage: 'Javxy | MGStage',
   DUGA: 'Javxy | DUGA',
   MYWIFE: 'Javxy | MyWife',
   JavTrailers: 'Javxy | JavTrailers',
   JavDB: 'Javxy | Javdb',
   AVWikiDB: 'Javxy | AVWikiDB',
   JAVDatabase: 'Javxy | JAVDatabase',
   HEYZO: 'Javxy | Heyzo',
   HeyDouga: 'Javxy | HeyDouga',
   PACO: 'Javxy | Paco',
   '10MU': 'Javxy | 10mu',
   Caribbean: 'Javxy | 加勒比',
   '1Pondo': 'Javxy | 一本道' },
  async fromJavxyCcCd(id, rawCode = '', options = {}) {
   const query = String(id || rawCode || '').trim();
   if (!query) { this.debug('Javxy 跳过：查询词为空'); return null; }
   const localApiBase = String(JAVXY_DEV_API_BASE || '').trim().replace(/\/+$/, '');
   const endpoints = localApiBase ? [{ base: localApiBase, label: 'Javxy Local' }] : [
     { host: String.fromCharCode(106,97,118,120,121,46,99,99,46,99,100), label: 'Javxy' },
     { host: String.fromCharCode(119,111,114,107,101,114,46,106,97,118,120,121,46,99,99,46,99,100), label: 'Javxy Worker' } ];
   for (const endpoint of endpoints) {
    const params = new URLSearchParams({ client: 'laosiji-new' });
    if (Array.isArray(options.skip) && options.skip.length) params.set('skip', options.skip.join(','));
    if (Array.isArray(options.prefer) && options.prefer.length) params.set('prefer', options.prefer.join(','));
    if (Array.isArray(options.source) && options.source.length) params.set('source', options.source.join(','));
    if (options.playbackFallback) params.set('purpose', 'playback-fallback');
    const apiUrl = endpoint.base
     ?`${endpoint.base}/trailers/${encodeURIComponent(query)}?${params}`                    :`${endpoint.protocol || 'https'}://${endpoint.host}/trailers/${encodeURIComponent(query)}?${params}`;
    this.debug('Javxy \u8bf7\u6c42 API', { query, apiUrl, endpoint: endpoint.label });
    const r = await this.request(apiUrl, {
     timeout: 8000,
     headers: {
      Accept: 'application/json,text/plain,*/*',
      [[String.fromCharCode(88),String.fromCharCode(74,97,118,120,121),String.fromCharCode(84,111,107,101,110)].join('-')]: this.javxyToken() }
    });
    if (!r) {
     this.debug('Javxy API 网络失败，尝试下一个节点', { endpoint: endpoint.label });
     continue; }
    if (r.status >= 500 || r.status === 0) {
     this.debug('Javxy API 服务异常，尝试下一个节点', { endpoint: endpoint.label, status: r.status });
     continue; }
    if ([401, 403, 429].includes(r.status)) {
     this.debug('Javxy API 被拒绝或限流，尝试下一个节点', { endpoint: endpoint.label, status: r.status });
     continue; }
    if (r.status < 200 || r.status >= 400) {
     this.debug('Javxy API 无结果，停止查询', { endpoint: endpoint.label, status: r.status });
     return null; }
    if (!r.responseText) {
     this.debug('Javxy API 响应为空，停止查询', { endpoint: endpoint.label, status: r.status });
     return null; }
    let data;
    try {
     data = JSON.parse(r.responseText);
    } catch {
     this.debug('Javxy JSON 解析失败，尝试下一个节点', { endpoint: endpoint.label });
     continue; }
    const trailerUrl = String(data?.trailer || '').trim();
    if (!trailerUrl) {
     this.debug('Javxy 无 trailer 字段，停止查询', { endpoint: endpoint.label, keys: Object.keys(data || {}) });
     return null; }
    const qualityMap = data?.qualities && typeof data.qualities === 'object' ? data.qualities : {};
    const quality = data?.quality && qualityMap[data.quality] ? data.quality : this.selectHighestQuality(qualityMap);
    const sourceBase = this.javxySourceLabels[data?.source] ||`Javxy | ${data?.source || 'dmm'}`;
    const source = sourceBase;
    this.debug('Javxy 返回结果', { endpoint: endpoint.label, source: data?.source, quality, qualities: Object.keys(qualityMap) });
    const resultType = String(data?.type || '').trim() || 'video'; const directUrl = qualityMap[quality] || trailerUrl;
    return this.result(directUrl, source, resultType, {
     qualities: qualityMap,
     quality,
     directUrl,
     code: this.normalize(query),
     rawCode,
     javxySource: String(data?.source || '').trim(),
     requiresJP: Boolean(data?.requiresJP),
     fallbackSources: Array.isArray(data?.fallback) ? data.fallback.filter(Boolean) : [],
     fallbackQuery: {
      skip: Array.isArray(options.skip) ? options.skip.filter(Boolean) : [],
      prefer: Array.isArray(options.prefer) ? options.prefer.filter(Boolean) : [],
      source: Array.isArray(options.source) ? options.source.filter(Boolean) : [] },
     urls: Array.isArray(data?.urls) && data.urls.length ? data.urls : this.sortQualityKeys(qualityMap).map(key => qualityMap[key])
    }); }
   return null; },
  async fromJavxyCover(code) {
   const query = String(code || '').trim();
   if (!query) return null;
   const localApiBase = String(JAVXY_DEV_API_BASE || '').trim().replace(/\/+$/, '');
   const endpoints = localApiBase ? [{ base: localApiBase }] : [{ host: String.fromCharCode(106,97,118,120,121,46,99,99,46,99,100) }];
   for (const endpoint of endpoints) {
    const params = new URLSearchParams({ client: 'laosiji-new' });
    const apiUrl = endpoint.base
     ?`${endpoint.base}/covers/${encodeURIComponent(query)}?${params}`                    :`https://${endpoint.host}/covers/${encodeURIComponent(query)}?${params}`;
    const response = await this.request(apiUrl, {
     timeout: 15000,
     headers: { Accept: 'application/json,text/plain,*/*', [[String.fromCharCode(88),String.fromCharCode(74,97,118,120,121),String.fromCharCode(84,111,107,101,110)].join('-')]: this.javxyToken() }
    });
    if (!response || response.status === 0 || response.status >= 500 || [401, 403, 429].includes(response.status)) continue;
    if (![200, 404].includes(response.status) || !response.responseText) return null;
    try {
     const data = JSON.parse(response.responseText);
     if (data?.found && (data.url || data.cover || data.highCover)) return data;
     if (response.status === 404 && !data?.found) return data;
    } catch {}
    return null; }
   return null; }, };
 const Settings = {
  getPreviewCacheEnabled() { return true; },
  getTrailerCacheEnabled() { return true; },
  getDefaultSearchEngine(code = '') {
   const fc2Engine = SearchEngines.find(engine => engine.fc2Only && engine.isAvailable?.(code));
   if (fc2Engine) return fc2Engine;
   const defaultIndex = SearchEngines.findIndex(engine => engine.name === 'AVBase');
   const index = GM_getValue('default_search_engine', defaultIndex >= 0 ? defaultIndex : SearchEngines.length - 1); const configured = SearchEngines[index];
   const fallback = SearchEngines.find(engine => engine.name === 'AVBase' && !engine.isAvailable) || SearchEngines.find(engine => !engine.isAvailable)
    || SearchEngines[0];
   return configured?.isAvailable && !configured.isAvailable(code) ? fallback : configured || fallback; },
  getDefaultVideoEngine() { return GM_getValue('default_video_engine', 'missav'); },
  getVideoEngines() { return VIDEO_ENGINES; },
  getSourceOrder() { return GM_getValue('thumb_source_order', ['javfree', 'projectjav', 'javstore']); } };
 const SearchEngines = [
  { name: 'BTDigg', color: '#F60', url: (code) =>`https://btdig.com/search?q=${code}` },
  { name: 'Taocili', color: '#DE5833', url: (code) =>`https://taocili.com/search?q=${code}` },
  { name: 'Google', color: '#4285F4', url: (code) =>`https://www.google.com/search?q=${code}` },
  { name: 'Bing', color: '#008373', url: (code) =>`https://www.bing.com/search?q=${code}` },
  { name: 'DuckGo', color: '#DE5833', url: (code) =>`https://duckduckgo.com/?q=${code}` },
  { name: 'AVBase', color: '#1d4ed8', url: (code) =>`https://www.avbase.net/works?q=${encodeURIComponent(code)}` },
  {
   name: 'FD2PPV',
   color: '#0f766e',
   fc2Only: true,
   isAvailable: code => /^FC2[-_\s]?(?:PPV[-_\s]?)?\d{6,9}$/i.test(String(code || '').trim()),
   url: code => {
    const number = String(code || '').trim().match(/^FC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})$/i)?.[1] || '';
    return number ?`https://fd2ppv.cc/articles/${number}` : '';
   }, }, ];
 function getAvailableSearchEngines(code) { return SearchEngines.filter(engine => !engine.isAvailable || engine.isAvailable(code)); }
 const Pan115 = {
  api: 'https://webapi.115.com/files/search',
  directApi: 'https://proapi.115.com/app/chrome/downurl',
  editApi: 'https://webapi.115.com/files/edit',
  deleteApi: 'https://webapi.115.com/rb/delete',
  videoExts: new Set(['mp4', 'mkv', 'avi', 'wmv', 'mov', 'm4v', 'ts', 'flv', 'rmvb', 'webm']),
  pending: new Map(),
  pendingAll: new Map(),
  cachePrefix: 'pan115_cache_v7_',
  listCachePrefix: 'pan115_list_cache_v1_',
  mgstagePrefixMap: {
   LUXU: '259LUXU',
   MIUM: '300MIUM',
   GANA: '200GANA',
   SIRO: 'SIRO',
   DCV: '277DCV',
   JNT: '390JNT',
   JAC: '390JAC',
   HHH: '451HHH',
   HLM: '436HLM',
   SYS: '332SYS',
   NAMA: '332NAMA',
   HEN: '353HEN',
   ARA: '261ARA',
   FCT: '326FCT',
   ERK: '420ERK',
   STH: '420STH',
   MLA: '476MLA',
   MMC: '812MMC',
   MY: '292MY',
   OERO: '892OERO', },
  sourceAliases: {
   PACO: ['PACO', 'PACOPACOMAMA'],
   PACOPACOMAMA: ['PACO', 'PACOPACOMAMA'],
   '10MU': ['10MU', '10MUSUME'],
   '10MUSUME': ['10MU', '10MUSUME'],
   '1PON': ['1PON', '1PONDO'],
   '1PONDO': ['1PON', '1PONDO'],
   CARIB: ['CARIB', 'CARIBBEANCOM'],
   CARIBBEANCOM: ['CARIB', 'CARIBBEANCOM'],
   HEYZO: ['HEYZO'], },
  enabled() { return GM_getValue('btn_show_pan115', false); },
  normalizeCode(code) { return String(code || '').trim().toUpperCase().replace(/[_\s]+/g, '-'); },
  normalizeKeepSeparator(code) { return String(code || '').trim().toUpperCase().replace(/\s+/g, '-'); },
  playUrl(pickcode) {
   const encoded = encodeURIComponent(pickcode); const playerMode = GM_getValue('pan115_player_mode', 'official');
   if (playerMode === '115master') {
    return`https://115.com/web/lixian/master/video/?pick_code=${encoded}`;
   }
   return`https://115vod.com/?pickcode=${encoded}&share_id=0`;
  },
  isPotPlayerMode() { return GM_getValue('pan115_player_mode', 'official') === 'potplayer'; },
  async playPotPlayer(pickcode, title = '') {
   const directUrl = await fetchPan115DirectUrl(pickcode); const encodedTitle = String(title || '').replace(/[\r\n]/g, ' ').split('"').join(' ').trim();
   const command = [
`potplayer://${encodeURI(directUrl)}`,
    '/current',
`/user_agent="${String(navigator.userAgent).replace(/[\r\n]/g, ' ').split('"').join(' ')}"`,
    '/referer="https://115.com/"',
    encodedTitle ?`/title="${encodedTitle}"` : '',
   ].filter(Boolean).join(' ');
   GM_setClipboard(command);
   window.open('potplayer:///current/clipboard', '_self');
   return directUrl; },
  cacheKey(code) {
   return`${this.cachePrefix}${this.normalizeKeepSeparator(code)}`;
  },
  listCacheKey(code) {
   return`${this.listCachePrefix}${this.normalizeKeepSeparator(code)}`;
  },
  getCached(code) {
   try {
    const raw = sessionStorage.getItem(this.cacheKey(code));
    if (!raw) return undefined;
    return JSON.parse(raw);
   } catch { return undefined; } },
  setCached(code, value) {
   try {
    sessionStorage.setItem(this.cacheKey(code), JSON.stringify(value || null));
   } catch {} },
  getListCached(code) {
   try {
    const raw = sessionStorage.getItem(this.listCacheKey(code));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
   } catch { return undefined; } },
  setListCached(code, value) {
   try {
    sessionStorage.setItem(this.listCacheKey(code), JSON.stringify(Array.isArray(value) ? value : []));
   } catch {} },
  clearCached(code) {
   try {
    const normalized = this.normalizeKeepSeparator(code);
    sessionStorage.removeItem(this.cacheKey(normalized)); sessionStorage.removeItem(this.listCacheKey(normalized));
   } catch {} },
  sourcePattern() { return Object.keys(this.sourceAliases).sort((a, b) => b.length - a.length).join('|'); },
  sourceGroup(source) { return this.sourceAliases[String(source || '').toUpperCase()] || [String(source || '').toUpperCase()].filter(Boolean); },
  uncensoredParts(code) {
   const normalized = this.normalizeKeepSeparator(code);
   const match = normalized.match(/^(\d{6})([-_])(\d{2,3})(?:[-_]([A-Z0-9]+))?$/);
   return match ? { date: match[1], sep: match[2], num: match[3], source: match[4] || '' } : null; },
  uncensoredDigitKey(code) {
   const parts = this.uncensoredParts(code);
   return parts ?`${parts.date}${parts.sep}${parts.num}` : '';
  },
  fc2Number(code) {
   const normalized = this.normalizeKeepSeparator(code);
   const match = normalized.match(/^FC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})$/i);
   return match ? match[1] : ''; },
  extractCode(text, fallbackCode = '') {
   const fc2 = String(text || '').match(/\bFC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})\b/i);
   if (fc2) return`FC2-PPV-${fc2[1]}`;
   const sourcePattern = this.sourcePattern();
   const tail = String(text || '').match(new RegExp(`\\b(\\d{6})([-_])(\\d{2,3})[-_\\s]*(${sourcePattern})\\b`, 'i'));
   if (tail) {
    const source = tail[4].toUpperCase(); const sep = tail[2] === '_' ? '_' : '-';
    return`${tail[1]}${sep}${tail[3]}-${source}`;
   }
   const head = String(text || '').match(new RegExp(`\\b(${sourcePattern})[-_\\s]*(\\d{6})([-_])(\\d{2,3})\\b`, 'i'));
   if (head) {
    const source = head[1].toUpperCase(); const sep = head[3] === '_' ? '_' : '-';
    return`${head[2]}${sep}${head[4]}-${source}`;
   }
   return fallbackCode || Utils.extractCode(text); },
  searchKeyword(code) {
   const fc2 = this.fc2Number(code);
   if (fc2) return fc2;
   return String(code || '').trim().toLowerCase().replace(/^fc2-(?:ppv-)?/, ''); },
  searchVariants(code) {
   const normalized = this.normalizeKeepSeparator(code); const variants = [normalized]; const fc2 = this.fc2Number(normalized);
   if (fc2) {
    variants.push(`FC2-${fc2}`,`FC2-PPV-${fc2}`, fc2);
   }
   const mgstage = normalized.match(/^(\d{3})([A-Z]{2,10})-(\d{2,6})$/);
   if (mgstage && Object.values(this.mgstagePrefixMap).includes(`${mgstage[1]}${mgstage[2]}`)) {
    variants.push(`${mgstage[2]}-${mgstage[3]}`);
   }
   const shortMgstage = normalized.match(/^([A-Z]{2,10})-(\d{2,6})$/);
   if (shortMgstage && this.mgstagePrefixMap[shortMgstage[1]]) {
    variants.push(`${this.mgstagePrefixMap[shortMgstage[1]]}-${shortMgstage[2]}`);
   }
   const uncensored = this.uncensoredParts(normalized);
   if (uncensored) {
    variants.push(`${uncensored.date}${uncensored.sep}${uncensored.num}`);
    if (uncensored.source) {
     this.sourceGroup(uncensored.source).forEach(source => {
      variants.push(`${uncensored.date}${uncensored.sep}${uncensored.num}-${source}`);
      variants.push(`${source}-${uncensored.date}${uncensored.sep}${uncensored.num}`);
     }); } }
   return [...new Set(variants.filter(Boolean))]; },
  codeRegex(code) {
   const fc2 = this.fc2Number(code);
   if (fc2) {
    return new RegExp(`(^|[^A-Z0-9])(?:FC2[-_\\s]?(?:PPV[-_\\s]?)?${fc2}|${fc2})([^A-Z0-9]|$)`, 'i');
   }
   const digitKey = this.uncensoredDigitKey(code);
   if (digitKey) {
    const parts = this.uncensoredParts(code); const sep = parts.sep === '_' ? '_' : '-';
    return new RegExp(`(^|[^0-9])${parts.date}${sep}${parts.num}([^0-9]|$)`, 'i');
   }
   const patterns = [];
   const add = value => {
    const normalized = this.normalizeCode(value);
    if (!normalized) return;
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-_]/g, '[-_\\s]?');
    patterns.push(escaped, normalized.replace(/[-_]/g, '')); };
   this.searchVariants(code).forEach(add);
   return new RegExp(`(?:${[...new Set(patterns)].join('|')})`, 'i');
  },
  isVideoName(name) {
   const ext = String(name || '').split('.').pop().toLowerCase();
   return this.videoExts.has(ext); },
  parseSize(value) {
   if (value == null || value === '') return 0;
   if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
   const text = String(value).trim().replace(/,/g, ''); const unitMatch = text.match(/^([\d.]+)\s*(b|kb|mb|gb|tb)$/i);
   if (unitMatch) {
    const amount = Number(unitMatch[1]); const unit = unitMatch[2].toLowerCase();
    const power = { b: 0, kb: 1, mb: 2, gb: 3, tb: 4 }[unit] || 0;
    return Number.isFinite(amount) ? Math.round(amount * 1024 ** power) : 0; }
   const numeric = Number(text);
   return Number.isFinite(numeric) ? numeric : 0; },
  formatSize(bytes) {
   const size = this.parseSize(bytes);
   if (!size) return '';
   const units = ['B', 'KB', 'MB', 'GB', 'TB']; let value = size; let index = 0;
   while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
   const digits = index >= 3 ? 2 : index >= 2 ? 1 : 0;
   return`${value.toFixed(digits).replace(/\.0+$/, '')} ${units[index]}`;
  },
  lowPriorityReason(item) {
   const name = String(item?.name || ''); const size = this.parseSize(item?.size);
   const previewName = /(?:^|[.\-_\s])(?:tp|trailer|sample|preview|pv|cm|予告|预告|試看|试看)(?:[.\-_\s]|$)/i.test(name);
   if (previewName) return '疑似预告/样片';
   if (size > 0 && size < 180 * 1024 * 1024) return '小体积文件';
   return ''; },
  candidateRank(item) {
   const reason = this.lowPriorityReason(item); const size = this.parseSize(item?.size);
   return (reason ? 1000 : 0) - Math.min(size / (1024 ** 3), 100); },
  flattenFiles(payload) {
   const candidates = [ payload?.data, payload?.data?.list, payload?.data?.files, payload?.data?.items, payload?.files, payload?.list ];
   const arr = candidates.find(Array.isArray) || [];
   return arr.map(item => ({
    name: item.n || item.name || item.file_name || item.filename || item.title || '',
    pickcode: item.pc || item.pickcode || item.pick_code || item.pickCode || item.pick || '',
    fileId: item.fid || item.file_id || item.fileId || item.id || '',
    size: this.parseSize(item.s || item.size || item.file_size || item.fileSize || item.fs || item.bytes),
    raw: item,
   })).filter(item => item.name); },
  async requestSearch(keyword) {
   const query = new URLSearchParams({
    search_value: keyword,
    limit: '50',
    offset: '0',
   });
   return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
     method: 'GET',
     url:`${this.api}?${query}`,
     timeout: 15000,
     anonymous: false,
     headers: { Accept: 'application/json, text/plain, */*' },
     onload: r => {
      try {
       resolve(JSON.parse(r.responseText));
      } catch (err) { reject(new Error('115返回不是JSON，可能未登录')); } },
     onerror: () => reject(new Error('115请求失败')),
     ontimeout: () => reject(new Error('115请求超时')),
    });
   }); },
  async search(code) {
   const matches = await this.searchAll(code);
   return matches[0] || null; },
  async searchAll(code) {
   const matcher = this.codeRegex(code); const seen = new Set(); const matches = [];
   const keywords = [...new Set(this.searchVariants(code).map(item => this.searchKeyword(item)).filter(Boolean))];
   for (const keyword of keywords) {
    const payload = await this.requestSearch(keyword); const state = payload?.state ?? payload?.success;
    if (state === false) { const msg = payload?.error || payload?.message || payload?.errno || '115查询失败'; throw new Error(String(msg)); }
    for (const item of this.flattenFiles(payload)) {
     const key = item.pickcode || item.name;
     if (seen.has(key)) continue;
     seen.add(key);
     if (matcher.test(item.name) && this.isVideoName(item.name) && item.pickcode) {
      item.lowPriorityReason = this.lowPriorityReason(item); item.sizeText = this.formatSize(item.size);
      matches.push(item); } } }
   return matches.sort((a, b) => this.candidateRank(a) - this.candidateRank(b)); },
  async searchCached(code) {
   const normalized = this.normalizeKeepSeparator(code);
   if (!normalized) return null;
   const cached = this.getCached(normalized);
   if (cached !== undefined) return cached;
   if (this.pending.has(normalized)) return this.pending.get(normalized);
   const task = this.search(normalized) .then(hit => {
     this.setCached(normalized, hit || null);
     return hit || null;
    }) .finally(() => this.pending.delete(normalized));
   this.pending.set(normalized, task);
   return task; },
  async searchAllCached(code) {
   const normalized = this.normalizeKeepSeparator(code);
   if (!normalized) return [];
   const cached = this.getListCached(normalized);
   if (cached !== undefined) return cached;
   if (this.pendingAll.has(normalized)) return this.pendingAll.get(normalized);
   const task = this.searchAll(normalized) .then(matches => {
     this.setListCached(normalized, matches); this.setCached(normalized, matches[0] || null);
     return matches;
    }) .finally(() => this.pendingAll.delete(normalized));
   this.pendingAll.set(normalized, task);
   return task; },
  async deleteFile(fileId) {
   const fid = String(fileId || '').trim();
   if (!fid) throw new Error('缺少115文件ID，无法删除');
   const body = new URLSearchParams();
   body.set('fid[0]', fid); body.set('ignore_warn', '1');
   return this.postForm(this.deleteApi, body, '115删除'); },
  async renameFile(fileId, newName) {
   const fid = String(fileId || '').trim(); const fileName = String(newName || '').trim().replace(/[\\/:*?"<>|]/g, ' ');
   if (!fid) throw new Error('缺少115文件ID，无法改名');
   if (!fileName) throw new Error('新文件名为空');
   return this.postForm(this.editApi, new URLSearchParams({ fid, file_name: fileName }), '115改名'); },
  postForm(url, body, label) {
   return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
     method: 'POST',
     url,
     data: body.toString(),
     timeout: 15000,
     anonymous: false,
     headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', },
     onload: r => {
      try {
       const payload = JSON.parse(r.responseText || '{}');
       const ok = payload?.state === true || payload?.success === true || payload?.errno === 0;
       if (ok) {
        resolve(payload);
       } else {
        reject(new Error(String(payload?.error || payload?.message || payload?.errno || `${label}失败`)));
       }
      } catch (err) {
       reject(new Error(`${label}返回不是JSON`));
      } },
     onerror: () => reject(new Error(`${label}请求失败`)),
     ontimeout: () => reject(new Error(`${label}请求超时`)),
    });
   }); }, };
 const M115_RSA_N = BigInt('0x8686980c0f5a24c4b9d43020cd2c22703ff3f450756529058b1cf88f09b8602136477198a6e2683149659bd122c33592fdb5ad47944ad1ea4d36c6b172aad6338c3bb6ac6227502d010993ac967d1aef00f0c8e038de2e4d3bc2ec368af2e9f10a6f1eda4f7262f136420c07c331b871bf139f74f3010e3c4fe57df3afb71683');
 const M115_RSA_E = 0x10001n;
 const M115_G_KTS = [240,229,105,174,191,220,191,138,26,69,232,190,125,166,115,184,222,143,231,196,69,218,134,196,155,100,139,20,106,180,241,170,56,1,53,158,38,105,44,134,0,107,79,165,54,52,98,166,42,150,104,24,242,74,253,189,107,151,143,77,143,137,19,183,108,142,147,237,14,13,72,62,215,47,136,216,254,254,126,134,80,149,79,209,235,131,38,52,219,102,123,156,126,157,122,129,50,234,182,51,222,58,169,89,52,102,59,170,186,129,96,72,185,213,129,156,248,108,132,119,255,84,120,38,95,190,232,30,54,159,52,128,92,69,44,155,118,213,27,143,204,195,184,245];
 const M115_KEY_S = [0x29, 0x23, 0x21, 0x5E]; const M115_KEY_L = [120, 6, 173, 76, 51, 134, 93, 24, 76, 1, 63, 70];
 function m115ModPow(base, exponent, modulus) {
  let result = 1n; let value = base % modulus; let power = exponent;
  while (power > 0n) {
   if (power & 1n) result = (result * value) % modulus;
   value = (value * value) % modulus;
   power >>= 1n; }
  return result; }
 function m115BytesToHex(bytes) { return bytes.map(byte => Number(byte).toString(16).padStart(2, '0')).join(''); }
 function m115HexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  return bytes; }
 function m115BigIntToBytes(value) {
  let hex = value.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  return m115HexToBytes(hex); }
 function m115RsaEncrypt(text) {
  const padded = new Array(128).fill(0); let sourceIndex = text.length - 1; let targetIndex = padded.length;
  while (sourceIndex >= 0) padded[--targetIndex] = text.charCodeAt(sourceIndex--);
  padded[--targetIndex] = 0;
  while (targetIndex > 2) padded[--targetIndex] = 0xff;
  padded[--targetIndex] = 2;
  const encrypted = m115ModPow(BigInt('0x' + m115BytesToHex(padded)), M115_RSA_E, M115_RSA_N);
  return encrypted.toString(16).padStart(256, '0'); }
 function m115RsaDecrypt(text) {
  const encrypted = BigInt('0x' + m115BytesToHex([...text].map(char => char.charCodeAt(0))));
  const padded = m115BigIntToBytes(m115ModPow(encrypted, M115_RSA_E, M115_RSA_N)); let separator = 1;
  while (separator < padded.length && padded[separator] !== 0) separator += 1;
  return String.fromCharCode(...padded.slice(separator + 1)); }
 function m115GetKey(length, key) {
  if (key) return Array.from({ length }, (_, index) => ((key[index] + M115_G_KTS[length * index]) & 0xff) ^ M115_G_KTS[length * (length - 1 - index)]);
  return (length === 12 ? M115_KEY_L : M115_KEY_S).slice(); }
 function m115XorEncode(source, key) {
  const remainder = source.length % 4; const result = [];
  for (let index = 0; index < remainder; index += 1) result.push(source[index] ^ key[index % key.length]);
  for (let index = remainder; index < source.length; index += 1) result.push(source[index] ^ key[(index - remainder) % key.length]);
  return result; }
 function m115SymEncode(source, key1, key2) {
  const result = m115XorEncode(source, m115GetKey(4, key1));
  result.reverse();
  return m115XorEncode(result, m115GetKey(12, key2)); }
 function m115SymDecode(source, key1, key2) {
  const result = m115XorEncode(source, m115GetKey(12, key2));
  result.reverse();
  return m115XorEncode(result, m115GetKey(4, key1)); }
 function m115StringToBytes(value) { return [...value].map(char => char.charCodeAt(0)); }
 function m115BytesToString(bytes) { return bytes.map(byte => String.fromCharCode(byte)).join(''); }
 function m115AsymEncode(source) {
  const chunkSize = 128 - 11; let encoded = '';
  for (let index = 0; index < Math.ceil(source.length / chunkSize); index += 1) {
   const chunk = source.slice(index * chunkSize, Math.min((index + 1) * chunkSize, source.length));
   encoded += m115RsaEncrypt(m115BytesToString(chunk)); }
  return btoa(m115HexToBytes(encoded).map(byte => String.fromCharCode(byte)).join('')); }
 function m115AsymDecode(source) {
  const chunkSize = 128; let decoded = '';
  for (let index = 0; index < Math.ceil(source.length / chunkSize); index += 1) {
   const chunk = source.slice(index * chunkSize, Math.min((index + 1) * chunkSize, source.length));
   decoded += m115RsaDecrypt(m115BytesToString(chunk)); }
  return m115StringToBytes(decoded); }
 function m115Md5(value) {
  if (typeof MagnetApi !== 'undefined' && typeof MagnetApi.javdbMd5 === 'function') return MagnetApi.javdbMd5(value);
  throw new Error('MD5模块未加载'); }
 function m115Encode(source, timestamp) {
  const key = m115StringToBytes(m115Md5(`!@###@#${timestamp}DFDR@#@#`));
  let encoded = m115StringToBytes(source);
  encoded = m115SymEncode(encoded, key, null); encoded = key.slice(0, 16).concat(encoded);
  return { data: m115AsymEncode(encoded), key }; }
 function m115Decode(source, key) {
  let decoded = m115StringToBytes(atob(source));
  decoded = m115AsymDecode(decoded);
  return m115BytesToString(m115SymDecode(decoded.slice(16), key, decoded.slice(0, 16))); }
 function fetchPan115DirectUrl(pickcode) {
  return new Promise((resolve, reject) => {
   const timestamp = Math.floor(Date.now() / 1000);
   const { data, key } = m115Encode(JSON.stringify({ pickcode }), timestamp);
   GM_xmlhttpRequest({
    method: 'POST',
    url: `${Pan115.directApi}?t=${timestamp}`,
    data: `data=${encodeURIComponent(data)}`,
    timeout: 20000,
    anonymous: false,
    headers: {
     'Content-Type': 'application/x-www-form-urlencoded',
     Referer: 'https://115.com/',
     'User-Agent': navigator.userAgent, },
    onload(response) {
     try {
      const payload = JSON.parse(response.responseText || '{}');
      if (!payload.state) {
       reject(new Error(payload.msg || payload.error || `errno:${payload.errno || response.status || 0}`));
       return; }
      const decoded = JSON.parse(m115Decode(payload.data, key)); const fileId = Object.keys(decoded)[0]; const directUrl = decoded[fileId]?.url?.url;
      if (!directUrl) { reject(new Error('115未返回可播放直链')); return; }
      resolve(directUrl);
     } catch (error) {
      reject(new Error(`115直链解析失败: ${error.message}`));
     } },
    onerror: () => reject(new Error('115直链请求失败')),
    ontimeout: () => reject(new Error('115直链请求超时')),
   });
  }); }
 function ensureSubtitleStyles() {
  injectStyle('jav-subtitle-style',`.jav-subtitle-overlay,.jav-subtitle-preview-overlay{position:fixed;inset:0;z-index:10000045;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.58);backdrop-filter:blur(5px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box;overscroll-behavior:contain}.jav-subtitle-preview-overlay{z-index:10000046}.jav-subtitle-panel{width:min(780px,94vw);max-height:86vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(203,213,225,.85);border-radius:12px;background:#fff;color:#111827;box-shadow:0 24px 70px rgba(15,23,42,.38)}.jav-subtitle-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #e5e7eb;background:linear-gradient(180deg,#f8fafc 0%,#fff 100%)}.jav-subtitle-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:850}.jav-subtitle-close{width:30px;height:30px;border:0;border-radius:7px;background:#f1f5f9;color:#334155;font-size:22px;line-height:1;cursor:pointer}.jav-subtitle-close:hover{background:#e2e8f0}.jav-subtitle-body{padding:12px;overflow:auto;overscroll-behavior:contain}.jav-subtitle-status{padding:38px 14px;color:#64748b;font-size:14px;text-align:center}.jav-subtitle-table{display:flex;flex-direction:column;gap:8px}.jav-subtitle-row{display:grid;grid-template-columns:minmax(0,1fr) 72px 146px;gap:10px;align-items:center;padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc}.jav-subtitle-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:760;color:#0f172a}.jav-subtitle-ext{justify-self:start;padding:3px 8px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:12px;font-weight:800;text-transform:uppercase}.jav-subtitle-actions{display:flex;justify-content:flex-end;gap:7px}.jav-subtitle-actions button,.jav-subtitle-preview-download{height:28px;padding:0 10px;border:0;border-radius:7px;background:#0f766e;color:#fff;font-size:12px;font-weight:800;cursor:pointer}.jav-subtitle-actions button:nth-child(2){background:#2563eb}.jav-subtitle-actions button:disabled,.jav-subtitle-preview-download:disabled{opacity:.62;cursor:wait}.jav-subtitle-preview-panel{width:min(920px,94vw);max-height:88vh}.jav-subtitle-pre{margin:0;min-height:320px;max-height:70vh;overflow:auto;padding:14px 16px;background:#111827;color:#e5e7eb;font:12px/1.55 Consolas,Monaco,"Courier New",monospace;white-space:pre-wrap;word-break:break-word;overscroll-behavior:contain}.jav-subtitle-preview-footer{display:flex;justify-content:flex-end;gap:8px;padding:10px 12px;border-top:1px solid #e5e7eb;background:#f8fafc}@media (max-width:640px){.jav-subtitle-row{grid-template-columns:1fr;gap:7px}.jav-subtitle-actions{justify-content:flex-start}}`);
 }
 const Subtitle = {
  api: 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle',
  previewExts: new Set(['ass', 'srt', 'ssa', 'vtt']),
  overlay: null,
  closeOverlay: null,
  scrollLockDepth: 0,
  savedHtmlOverflow: '',
  savedBodyOverflow: '',
  normalizeCode(code) { return Utils.normalizeCode(code) || String(code || '').trim().toUpperCase(); },
  ensureStyle() {
   ensureSubtitleStyles(); },
  lockScroll() {
   if (this.scrollLockDepth === 0) {
    this.savedHtmlOverflow = document.documentElement.style.overflow || ''; this.savedBodyOverflow = document.body.style.overflow || '';
    document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; }
   this.scrollLockDepth++; },
  unlockScroll() {
   if (this.scrollLockDepth <= 0) return;
   this.scrollLockDepth--;
   if (this.scrollLockDepth === 0) { document.documentElement.style.overflow = this.savedHtmlOverflow; document.body.style.overflow = this.savedBodyOverflow; }
  },
  requestJson(url) {
   return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
     method: 'GET',
     url,
     timeout: 18000,
     headers: { Accept: 'application/json, text/plain, */*' },
     onload: r => {
      if (r.status && (r.status < 200 || r.status >= 400)) {
       reject(new Error(`HTTP ${r.status}`));
       return; }
      try {
       resolve(JSON.parse(r.responseText || '{}'));
      } catch { reject(new Error('字幕源返回不是JSON')); } },
     onerror: () => reject(new Error('字幕源请求失败')),
     ontimeout: () => reject(new Error('字幕源请求超时')),
    });
   }); },
  requestText(url) {
   return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
     method: 'GET',
     url,
     timeout: 20000,
     onload: r => {
      if (r.status && (r.status < 200 || r.status >= 400)) reject(new Error(`HTTP ${r.status}`));
      else resolve(r.responseText || '');
     },
     onerror: () => reject(new Error('字幕文件请求失败')),
     ontimeout: () => reject(new Error('字幕文件请求超时')),
    });
   }); },
  requestBlob(url) {
   return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
     if (settled) return;
     settled = true;
     clearTimeout(watchdog); fn(value); };
    const fail = message => finish(reject, new Error(message)); const watchdog = setTimeout(() => fail('字幕下载超时'), 30000);
    try {
     GM_xmlhttpRequest({
      method: 'GET',
      url,
      timeout: 25000,
      responseType: 'arraybuffer',
      onload: r => {
       if (r.status && (r.status < 200 || r.status >= 400)) {
        fail(`HTTP ${r.status}`);
        return; }
       const payload = r.response ?? r.responseText ?? '';
       const blob = payload instanceof Blob ? payload : new Blob([payload], { type: 'application/octet-stream' });
       finish(resolve, blob); },
      onerror: () => fail('字幕下载失败'),
      ontimeout: () => fail('字幕下载超时'),
      onabort: () => fail('字幕下载已取消'),
     });
    } catch (err) { finish(reject, err instanceof Error ? err : new Error(String(err || '字幕下载失败'))); }
   }); },
  itemUrl(item) { return String(item?.url || item?.link || item?.download_url || '').trim(); },
  itemExt(item) {
   const direct = String(item?.ext || '').replace(/^\./, '').trim().toLowerCase();
   if (direct) return direct;
   const name = String(item?.name || item?.filename || ''); const url = this.itemUrl(item);
   return (name.match(/\.([a-z0-9]{2,5})$/i)?.[1] || url.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i)?.[1] || '').toLowerCase(); },
  itemDisplayName(item, code) {
   const ext = this.itemExt(item); const raw = String(item?.name || item?.filename || item?.title || '').trim();
   if (raw) return raw;
   return `${this.normalizeCode(code)}${ext ? `.${ext}` : ''}`;
  },
  fileName(item, code) {
   const ext = this.itemExt(item); let name = this.itemDisplayName(item, code);
   if (ext && !new RegExp(`\\.${ext}$`, 'i').test(name)) name += `.${ext}`;
   name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim();
   return name ||`${this.normalizeCode(code)}.${ext || 'srt'}`;
  },
  async search(code) {
   const normalized = this.normalizeCode(code);
   const query = new URLSearchParams({ gcid: '', cid: '', name: normalized });
   const payload = await this.requestJson(`${this.api}?${query.toString()}`);
   const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.data?.list) ? payload.data.list : []; const seen = new Set();
   return list.filter(item => {
    const url = this.itemUrl(item);
    const key =`${url}|${this.itemDisplayName(item, normalized)}`;
    if (!url || seen.has(key)) return false;
    seen.add(key);
    return true;
   }); },
  createShell(code, title =`字幕 ${code}`) {
   this.ensureStyle();
   if (this.closeOverlay) this.closeOverlay();
   const overlay = document.createElement('div');
   overlay.className = 'jav-subtitle-overlay';
   overlay.innerHTML =`<section class="jav-subtitle-panel" role="dialog" aria-modal="true"><div class="jav-subtitle-head"><div class="jav-subtitle-title"></div><button class="jav-subtitle-close" type="button" title="关闭">×</button></div><div class="jav-subtitle-body"><div class="jav-subtitle-status">正在搜索字幕...</div></div></section>`;
   overlay.querySelector('.jav-subtitle-title').textContent = title;
   const close = () => {
    overlay.remove();
    if (this.overlay === overlay) this.overlay = null;
    if (this.closeOverlay === close) this.closeOverlay = null;
    this.unlockScroll(); document.removeEventListener('keydown', onKeydown, true); };
   const onKeydown = e => {
    if (e.key === 'Escape') close();
   };
   overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
   });
   overlay.addEventListener('wheel', e => e.stopPropagation(), { passive: false });
   overlay.querySelector('.jav-subtitle-close')?.addEventListener('click', close); this.lockScroll(); document.addEventListener('keydown', onKeydown, true);
   document.body.appendChild(overlay);
   this.overlay = overlay; this.closeOverlay = close;
   return overlay; },
  setStatus(overlay, text) {
   const body = overlay.querySelector('.jav-subtitle-body');
   if (!body) return;
   body.innerHTML = '';
   const status = document.createElement('div');
   status.className = 'jav-subtitle-status'; status.textContent = text;
   body.appendChild(status); },
  renderList(overlay, code, items) {
   const body = overlay.querySelector('.jav-subtitle-body');
   if (!body) return;
   body.innerHTML = '';
   const table = document.createElement('div');
   table.className = 'jav-subtitle-table';
   items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'jav-subtitle-row';
    const name = document.createElement('div');
    name.className = 'jav-subtitle-name'; name.textContent = this.itemDisplayName(item, code); name.title = name.textContent;
    const ext = document.createElement('span');
    ext.className = 'jav-subtitle-ext'; ext.textContent = this.itemExt(item) || 'file';
    const actions = document.createElement('div');
    actions.className = 'jav-subtitle-actions';
    const preview = document.createElement('button');
    preview.type = 'button'; preview.textContent = '预览';
    preview.addEventListener('click', () => this.preview(item, code, preview));
    const download = document.createElement('button');
    download.type = 'button'; download.textContent = '下载';
    download.addEventListener('click', () => this.download(item, code, download)); actions.appendChild(preview); actions.appendChild(download);
    row.appendChild(name); row.appendChild(ext); row.appendChild(actions); table.appendChild(row);
   });
   body.appendChild(table); },
  async show(code) {
   const normalized = this.normalizeCode(code);
   if (!normalized) { Utils.showToast('无法识别番号', '没有可用于搜索字幕的番号', 2400); return; }
   const overlay = this.createShell(normalized);
   try {
    const items = await this.search(normalized);
    if (!items.length) { this.setStatus(overlay, '未找到相关字幕'); return; }
    this.renderList(overlay, normalized, items);
   } catch (err) {
    errorLog('字幕搜索失败:', err); this.setStatus(overlay, err?.message || '字幕搜索失败'); } },
  async withBusy(btn, text, fn) {
   const oldText = btn?.textContent || '';
   if (btn) { btn.disabled = true; btn.textContent = text; }
   try {
    return await fn();
   } finally {
    if (btn) { btn.disabled = false; btn.textContent = oldText; }
   } },
  async preview(item, code, btn) {
   const url = this.itemUrl(item); const ext = this.itemExt(item);
   if (!url) { Utils.showToast('无法预览字幕', '字幕文件地址为空', 2400); return; }
   if (!this.previewExts.has(ext)) {
    Utils.showToast('暂不支持预览',`${ext || '该'} 类型可直接下载`, 2400);
    return; }
   await this.withBusy(btn, '读取中', async () => {
    const text = await this.requestText(url);
    this.showPreview(code, this.fileName(item, code), text, item);
   }).catch(err => {
    errorLog('字幕预览失败:', err); Utils.showToast('字幕预览失败', err?.message || '请求失败', 2800);
   }); },
  async download(item, code, btn) {
   const url = this.itemUrl(item); const ext = this.itemExt(item);
   if (!url) { Utils.showToast('无法下载字幕', '字幕文件地址为空', 2400); return; }
   await this.withBusy(btn, '下载中', async () => {
    if (this.previewExts.has(ext)) {
     const text = await this.requestText(url);
     const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
     this.saveBlob(blob, this.fileName(item, code));
     return; }
    const blob = await this.requestBlob(url);
    this.saveBlob(blob, this.fileName(item, code));
   }).catch(err => {
    errorLog('字幕下载失败:', err); Utils.showToast('字幕下载失败', err?.message || '请求失败', 2800);
   }); },
  saveBlob(blob, fileName) {
   const url = URL.createObjectURL(blob); const a = document.createElement('a');
   a.href = url; a.download = fileName;
   document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1200); },
  showPreview(code, fileName, text, item) {
   this.ensureStyle();
   const overlay = document.createElement('div');
   overlay.className = 'jav-subtitle-preview-overlay';
   overlay.innerHTML =`<section class="jav-subtitle-panel jav-subtitle-preview-panel" role="dialog" aria-modal="true"><div class="jav-subtitle-head"><div class="jav-subtitle-title"></div><button class="jav-subtitle-close" type="button" title="关闭">×</button></div><pre class="jav-subtitle-pre"></pre><div class="jav-subtitle-preview-footer"><button class="jav-subtitle-preview-download" type="button">下载</button></div></section>`;
   const close = () => {
    overlay.remove(); this.unlockScroll(); document.removeEventListener('keydown', onKeydown, true); };
   const onKeydown = e => {
    if (e.key === 'Escape') close();
   };
   const numbered = String(text || '').split(/\r?\n/).map((line, index, lines) => {
    const num = String(index + 1).padStart(String(lines.length).length, ' ');
    return`${num}. ${line}`;
   }).join('\n');
   overlay.querySelector('.jav-subtitle-title').textContent =`${fileName} - ${code}`;
   overlay.querySelector('.jav-subtitle-pre').textContent = numbered; overlay.querySelector('.jav-subtitle-close')?.addEventListener('click', close);
   overlay.querySelector('.jav-subtitle-preview-download')?.addEventListener('click', e => {
    e.preventDefault();
    this.saveBlob(new Blob([text || ''], { type: 'text/plain;charset=utf-8' }), fileName);
   });
   overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
   });
   overlay.addEventListener('wheel', e => e.stopPropagation(), { passive: false });
   this.lockScroll(); document.addEventListener('keydown', onKeydown, true); document.body.appendChild(overlay); }, };
 Subtitle.requestJson = function (url) {
  const request = gmFetch(url, {
   timeout: 18000,
   headers: { Accept: 'application/json, text/plain, */*' },
  });
  const result = request.then(response => {
   if (!response.ok) throw new Error(`${response.error?.kind || 'http'} ${response.status || 0}`);
   try {
    return JSON.parse(response.responseText || '{}');
   } catch { throw new Error('subtitle response is not valid JSON'); }
  });
  result.abort = () => request.abort?.() || false;
  return result; };
 Subtitle.requestText = function (url) {
  const request = gmFetch(url, { timeout: 20000 });
  const result = request.then(response => {
   if (!response.ok) throw new Error(`${response.error?.kind || 'http'} ${response.status || 0}`);
   return response.responseText || '';
  });
  result.abort = () => request.abort?.() || false;
  return result; };
 Core.expose('__LAOSIJI_SUBTITLE__', Subtitle);
 const JumpSites = [
  {
   id: 'sukebei',
   name: 'Sukebei',
   match: (url) => /nyaa\.si/.test(url) && url.includes('/view/'),
   titleSelector: '.panel-title' },
  {
   id: '169bbs',
   name: '169bbs',
   match: (url) => /169bbs\.(com|net|org)/.test(url) && url.includes('mod=viewthread'),
   titleSelector: '#thread_subject, h1' },
  {
   id: 'supjav',
   name: 'SupJav',
   match: (url) => /supjav\.com/.test(url) && /\/\d+\.html$/.test(url),
   titleSelector: '.clearfix.post-meta > h2' },
  {
   id: 'emby',
   name: 'Emby',
   match: (url) => {
    try {
     const u = new URL(url);
     if (!/\/web\/index\.html/.test(u.pathname)) return false;
     return /emby|jellyfin/i.test(u.hostname) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname);
    } catch { return false; } },
   titleSelector: 'h1' },
  {
   id: 'javbus',
   name: 'JavBus',
   match: (url) => /javbus\.com/.test(url) && !/search|genre|actresses|uncensored|forum|page|series|studio|label|director|star/.test(url),
   titleSelector: 'h3' },
  {
   id: 'javdb',
   name: 'JavDB',
   match: (url) => /javdb\d*\.com/.test(url) && (/\/v\/\w+/.test(url) || /[?&](?:laosiji_detail=fc2\b|laosiji_123av_fc2_detail=)/.test(url)),
   titleSelector: 'h2.title, .javdb-api-detail-title',
   getCode(titleElem) {
    const explicitCode = titleElem?.dataset?.laosijiCode || titleElem?.closest?.('[data-laosiji-code]')?.dataset?.laosijiCode || '';
    return explicitCode ? Utils.normalizeCode(explicitCode) : Utils.extractCode(titleElem?.textContent || ''); } },
  {
   id: 'javlibrary',
   name: 'JAVLibrary',
   match: (url) => /(javlibrary|javlib|r86m|s87n)/i.test(url) && (/\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?jav\w+\.html/i.test(new URL(url).pathname) || /[?&]laosiji_123av_fc2_detail=/.test(url)),
   titleSelector: '.post-title' },
  {
   id: 'javrate',
   name: 'Javrate',
   match: (url) => /javrate\.com/.test(url) && /\/movie\/detail\//i.test(url),
   titleSelector: 'h1' },
  {
   id: 'sehuatang',
   name: 'Sehuatang',
   match: (url) => /sehuatang\.(net|org|com)/.test(url) && url.includes('mod=viewthread'),
   titleSelector: '#thread_subject, h1' },
  {
   id: 'hjd2048',
   name: 'HJD2048',
   match: (url) => /hjd2048\.com/.test(url) && /\/2048\//.test(url),
   titleSelector: 'h1#subject_tpc, h1' },
  {
   id: 'missav',
   name: 'MissAV',
   match(url) {
    let parsed;
    try {
     parsed = new URL(url);
    } catch { return false; }
    if (!/(?:^|\.)(?:missav\.(?:ws|ai|com)|njavtv\.com)$/i.test(parsed.hostname)) return false;
    if (/^\/(?:$|search(?:\/|$)|tags(?:\/|$)|actresses(?:\/|$)|genres(?:\/|$))/i.test(parsed.pathname)) return false;
    const titleElem = document.querySelector(this.titleSelector);
    return !!Utils.extractCode(titleElem?.textContent || ''); },
   titleSelector: 'h1[class*="text-nord6"]' },
  {
   id: 'jable',
   name: 'Jable',
   match: (url) => /jable\.tv/.test(url) && /\/videos\/[a-z0-9-]+\/?/i.test(new URL(url).pathname),
   titleSelector: '.header-left > h4' },
  {
   id: '123av',
   name: '123AV',
   match: (url) => {
    const u = new URL(url);
    return /(?:^|\.)123av\.com$/i.test(u.hostname) && /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?v\/[^/?#]+\/?$/i.test(u.pathname); },
   titleSelector: '.watch__title' },
  {
   id: 'fc2cmadb',
   name: 'FC2CMA',
   match(url) { return /(?:^|\.)fc2cmadb\.com$/i.test(new URL(url).hostname) && !!this.getTitleElement(); },
   titleSelector: 'table.table tr:first-child td',
   getInfoTable() {
    return [...document.querySelectorAll('table.table')].find(table => {
     const row = table.querySelector('tr:first-child'); const label = (row?.querySelector('th')?.textContent || '').replace(/\s+/g, '').trim();
     const value = row?.querySelector('td')?.textContent || '';
     return /^ID[:：]?$/i.test(label) && /\b\d{6,9}\b/.test(value);
    }) || null; },
   getTitleElement() { return this.getInfoTable()?.querySelector('tr:first-child td') || null; },
   getCode(titleElem) {
    const raw = String(titleElem?.textContent || '').match(/\b(\d{6,9})\b/)?.[1] || '';
    return raw ?`FC2-PPV-${raw}` : '';
   } } ];
 Core.expose('__LAOSIJI_JUMP_SITES__', JumpSites);
 function clearMobileJumpMenuPosition(subMenu) {
  [
   'position',
   'top',
   'right',
   'bottom',
   'left',
   'width',
   'min-width',
   'max-height',
   'overflow-y',
   'visibility',
  ].forEach(property => subMenu.style.removeProperty(property)); }
 function closeAllJumpMenus(exceptMenu = null) {
  document.querySelectorAll('.search-submenu.is-open').forEach(menu => {
   if (menu !== exceptMenu) { menu.classList.remove('is-open'); clearMobileJumpMenuPosition(menu); }
  }); }
 function bindJumpMenu(menuDiv, toggleBtn, subMenu, mainBtn = null) {
  let closeTimer = null; const isMobile = () => typeof MobilePolicy !== 'undefined' && MobilePolicy.isMobile();
  const clearCloseTimer = () => {
   if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  };
  const closeMenu = () => {
   clearCloseTimer(); subMenu.classList.remove('is-open'); clearMobileJumpMenuPosition(subMenu); };
  const getFixedHeaderBottom = () => {
   const header = document.querySelector('#navbar, .navbar');
   if (!header) return 8;
   const style = window.getComputedStyle(header); const rect = header.getBoundingClientRect();
   if (!['fixed', 'sticky'].includes(style.position) || rect.bottom <= 0 || rect.top > 8) return 8;
   return Math.max(8, rect.bottom + 8); };
  const positionMobileMenu = () => {
   if (!isMobile()) return;
   const gutter = 8; const viewportWidth = document.documentElement.clientWidth || window.innerWidth; const viewportHeight = window.innerHeight;
   const triggerRect = menuDiv.getBoundingClientRect(); const menuWidth = Math.max(0, Math.min(176, viewportWidth - gutter * 2));
   subMenu.style.setProperty('position', 'fixed'); subMenu.style.setProperty('top', '0px'); subMenu.style.setProperty('left', '0px');
   subMenu.style.setProperty('width',`${menuWidth}px`, 'important');
   subMenu.style.setProperty('min-width', '0px', 'important'); subMenu.style.setProperty('visibility', 'hidden');
   const menuHeight = subMenu.getBoundingClientRect().height; const minimumTop = Math.min(viewportHeight - gutter, getFixedHeaderBottom());
   const preferredTop = Math.max(minimumTop, triggerRect.bottom + 4); const availableBelow = viewportHeight - gutter - preferredTop;
   const availableAbove = triggerRect.top - gutter - minimumTop; const shouldOpenAbove = menuHeight > availableBelow && availableAbove > availableBelow;
   const top = shouldOpenAbove ? Math.max(minimumTop, triggerRect.top - 4 - menuHeight) : preferredTop;
   const availableHeight = Math.max(0, viewportHeight - gutter - top); const maxLeft = Math.max(gutter, viewportWidth - gutter - menuWidth);
   const left = Math.min(Math.max(gutter, triggerRect.left), maxLeft);
   subMenu.style.setProperty('top',`${top}px`);
   subMenu.style.setProperty('left',`${left}px`);
   subMenu.style.setProperty('max-height',`${availableHeight}px`);
   subMenu.style.setProperty('overflow-y', 'auto'); subMenu.style.removeProperty('visibility'); };
  const scheduleClose = () => {
   clearCloseTimer();
   if (subMenu.classList.contains('is-open')) closeTimer = setTimeout(closeMenu, 1000);
  };
  toggleBtn.addEventListener('click', e => {
   e.preventDefault(); e.stopPropagation();
   const willOpen = !subMenu.classList.contains('is-open');
   closeAllJumpMenus(subMenu); clearCloseTimer(); subMenu.classList.toggle('is-open', willOpen);
   if (willOpen && isMobile()) positionMobileMenu();
   if (willOpen && !isMobile() && !menuDiv.matches(':hover')) scheduleClose();
  });
  menuDiv.addEventListener('mouseenter', () => {
   if (!isMobile()) clearCloseTimer();
  });
  menuDiv.addEventListener('mouseleave', () => {
   if (!isMobile()) scheduleClose();
  });
  if (mainBtn) mainBtn.addEventListener('click', closeMenu);
  subMenu.addEventListener('click', e => {
   if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', e => {
   if (!menuDiv.contains(e.target)) closeMenu();
  });
  document.addEventListener('scroll', event => {
   if (isMobile() && !subMenu.contains(event.target)) closeMenu();
  }, { capture: true, passive: true });
  window.addEventListener('resize', closeMenu, { passive: true }); }
 function createJumpMenu({ accent, mainBtn, subButtons, toggleTitle, className = '', stretchSubButtons = true }) {
  const menuDiv = document.createElement('div');
  menuDiv.className =`search-menu${className ? ` ${className}` : ''}`;
  menuDiv.style.setProperty('--jav-btn-accent', accent); mainBtn.classList.add('search-main-btn'); menuDiv.appendChild(mainBtn);
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button'; toggleBtn.className = 'search-toggle-btn'; toggleBtn.title = toggleTitle;
  toggleBtn.innerHTML = '<span class="search-arrow">▼</span>';
  menuDiv.appendChild(toggleBtn);
  const subMenu = document.createElement('div');
  subMenu.className = 'search-submenu';
  subButtons.forEach(btn => {
   btn.style.margin = '2px 0';
   if (stretchSubButtons) { btn.style.width = '100%'; btn.style.textAlign = 'left'; }
   subMenu.appendChild(btn);
  });
  menuDiv.appendChild(subMenu); bindJumpMenu(menuDiv, toggleBtn, subMenu, mainBtn);
  return menuDiv; }
 function addNyaaBtn(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_nyaa', true)) return;
  if (/sukebei\.nyaa/i.test(location.hostname)) return;
  const btn = Utils.createJumpLinkBtn('🔍 Sukebei', '#17a2b8',`https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(code)}`);
  container.appendChild(btn); }
 function addJavbusBtn(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_javbus', true)) return;
  if (/javbus\.com/i.test(location.hostname)) return;
  const url = Utils.getJavBusUrl(code); const btn = Utils.createJumpLinkBtn('🎬 JavBus', '#007bff', url);
  container.appendChild(btn); }
 function addJavdbBtn(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_javdb', true)) return;
  if (/javdb\.com/i.test(location.hostname)) return;
  const btn = Utils.createJumpLinkBtn('📀 JavDB', '#6f42c1',`https://javdb.com/search?q=${encodeURIComponent(code)}`);
  container.appendChild(btn); }
 function getFc2Number(code) { return String(code || '').trim().match(/^FC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})$/i)?.[1] || ''; }
 function getFc2CmaArticleUrl(code) {
  const fc2Number = getFc2Number(code);
  return fc2Number ?`https://fc2cmadb.com/articles/${fc2Number}` : '';
 }
 function addMissAVBtn(code, container, useCapture = false) {
  const showMissav = GM_getValue('btn_show_missav', true);
  if (!showMissav) return;
  const codeLower = String(code || '').trim().toLowerCase(); const codeCompactLower = codeLower.replace(/-/g, ''); const fc2Number = getFc2Number(code);
  const fc2Slug = fc2Number ?`fc2-ppv-${fc2Number}` : '';
  const fc2JavdaySlug = fc2Number ?`FC2PPV${fc2Number}` : '';
  const get123AvLocalePrefix = () => {
   if (/(?:^|\.)123av\.com$/i.test(location.hostname)) {
    const locale = location.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\//i)?.[1];
    if (locale) return`/${locale.toLowerCase()}`;
   }
   return '/cn'; };
  const videoUrlMap = {
   missav:`https://missav.ws/${fc2Slug || codeLower}`,
   jable:`https://jable.tv/videos/${codeLower}/`,
   '123av':`https://123av.com${get123AvLocalePrefix()}/v/${fc2Slug || codeLower}`,
   javday: fc2JavdaySlug ?`https://javday.app/index.php/videos/${fc2JavdaySlug}/` :`https://javday.app/videos/${codeCompactLower}/`,
   supjav:`https://supjav.com/zh/?s=${encodeURIComponent(fc2Number || code)}`,
   javrate:`https://www.javrate.com/search/${encodeURIComponent(codeLower)}`,
  };
  const enabledVideoKeys = new Set([ ...(showMissav ? ['missav', 'jable', '123av', 'javday', 'supjav', 'javrate'] : []),
  ]);
  const videoButtons = Settings.getVideoEngines() .filter(item => enabledVideoKeys.has(item.key) && !item.host.test(location.hostname))
   .map(item => ({ ...item, url: videoUrlMap[item.key] })) .filter(item => item.url);
  if (!videoButtons.length) return;
  const defaultKey = Settings.getDefaultVideoEngine(); const mainItem = videoButtons.find(item => item.key === defaultKey) || videoButtons[0];
  const subItems = videoButtons.filter(item => item !== mainItem);
  const createVideoBtn = item => Utils.createJumpLinkBtn(`🎬 ${item.label}`, item.color, item.url);
  if (!subItems.length) { container.appendChild(createVideoBtn(mainItem)); return; }
  container.appendChild(createJumpMenu({
   accent: mainItem.color,
   className: 'missav-menu',
   mainBtn: createVideoBtn(mainItem),
   subButtons: subItems.map(createVideoBtn),
   toggleTitle: '展开同类站点',
  })); }
 function addDmmBtn(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_fanza', true)) return;
  const fc2CmaUrl = getFc2CmaArticleUrl(code);
  if (fc2CmaUrl) {
   if (/(?:^|\.)fc2cmadb\.com$/i.test(location.hostname)) return;
   const btn = Utils.createBtn('▶ FC2CMA', '#2563eb', () => {
    window.open(fc2CmaUrl);
   }, useCapture);
   container.appendChild(btn);
   return; }
  const btn = Utils.createBtn('▶ FANZA', '#c0392b', () => {
   window.open(`https://www.dmm.co.jp/mono/-/search/=/searchstr=${encodeURIComponent(code)}/`);
  }, useCapture);
  container.appendChild(btn); }
 function addSubtitleBtn(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_subtitle', true)) return;
  const btn = Utils.createBtn('📝 字幕', '#0f766e', async () => {
   const oldText = btn.textContent;
   btn.textContent = '📝 搜索中...'; btn.style.pointerEvents = 'none'; btn.style.opacity = '0.72';
   try {
    await Subtitle.show(code);
   } finally {
    btn.textContent = oldText; btn.style.pointerEvents = ''; btn.style.opacity = ''; }
  }, useCapture);
  btn.classList.add('jav-subtitle-btn'); container.appendChild(btn); }
 function addTrailerBtn(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_trailer', true)) return;
  const btn = Utils.createBtn('🎞️ 预告片', '#111827', async () => {
   const oldText = btn.textContent;
   btn.textContent = '🎞️ 解析中...'; btn.style.pointerEvents = 'none'; btn.style.opacity = '0.72';
   try {
    await Trailer.show(code);
   } finally {
    btn.textContent = oldText; btn.style.pointerEvents = ''; btn.style.opacity = ''; }
  }, useCapture);
  btn.classList.add('jav-trailer-btn'); container.appendChild(btn); }
 function addPreviewBtn(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_preview', true)) return;
  const btn = Utils.createBtn('🖼️ 预览图', '#28a745', async () => {
   await Thumbnail.show(code);
  }, useCapture);
  btn.classList.add('jav-preview-btn'); container.appendChild(btn); }
 function addSearchMenu(code, container, useCapture = false) {
  if (!GM_getValue('btn_show_search', true)) return;
  const availableEngines = getAvailableSearchEngines(code); const defaultEngine = Settings.getDefaultSearchEngine(code);
  const mainBtn = Utils.createBtn(`🔍 ${defaultEngine.name}`, defaultEngine.color, () => {
   window.open(defaultEngine.url(code));
  }, useCapture);
  const subButtons = availableEngines .filter(engine => engine.name !== defaultEngine.name)
   .map(engine => Utils.createBtn(`🔍 ${engine.name}`, engine.color, () => {
    window.open(engine.url(code));
   }, useCapture));
  container.appendChild(createJumpMenu({
   accent: defaultEngine.color,
   mainBtn,
   subButtons,
   toggleTitle: '展开搜索引擎',
  })); }
 function addSettingsBtn(container, useCapture = false) {
  if (!container || container.querySelector('.jav-settings-btn')) return;
  const btn = Utils.createBtn('⚙️ 设置', '#475569', () => {
   SettingsPanel.open();
  }, useCapture);
  btn.classList.add('jav-settings-btn');
  btn.title = '打开老司机设置';
  container.appendChild(btn); }
 function addJumpLineBreak(container) {
  const lineBreak = document.createElement('span');
  lineBreak.className = 'jav-jump-line-break'; lineBreak.style.cssText = 'flex-basis:100%;height:0;padding:0;margin:0;';
  container.appendChild(lineBreak); }
 let pan115ChooserOverlay = null;
 function normalizePan115Matches(value) {
  return (Array.isArray(value) ? value : value?.pickcode ? [value] : []) .filter(item => item?.pickcode); }
 function pan115DisplayLabel(base, matches) {
  return matches.length > 1 ?`${base}×${matches.length}` : base;
 }
 function pan115MatchTitle(matches, code) {
  return normalizePan115Matches(matches) .map(item => [item.name, item.sizeText || Pan115.formatSize(item.size)].filter(Boolean).join(' · '))
   .join('\n') ||`115播放：${Pan115.normalizeKeepSeparator(code)}`;
 }
 function refreshPan115Control(control, code, matches) {
  const list = normalizePan115Matches(matches);
  if (!control?.isConnected) return;
  if (!list.length) { control.remove(); return; }
  const best = list[0]; const isBadge = control.classList.contains('jav-pan115-badge'); const base = isBadge ? '115匹配' : '115播放';
  control.textContent = pan115DisplayLabel(base, list); control.title = pan115MatchTitle(list, code); control.dataset.pickcode = best.pickcode;
  control.dataset.pan115Code = Pan115.normalizeKeepSeparator(code) || code || '';
  if (control.tagName === 'A' && !Pan115.isPotPlayerMode() && list.length === 1) { control.href = Pan115.playUrl(best.pickcode); }
 }
 function refreshPan115ControlsForCode(code, matches, trigger = null) {
  const normalized = Pan115.normalizeKeepSeparator(code) || code || ''; const controls = new Set();
  if (trigger) controls.add(trigger);
  document.querySelectorAll('.jav-pan115-badge, .jav-pan115-play-btn').forEach(control => {
   if ((control.dataset.pan115Code || '') === normalized) controls.add(control);
  });
  controls.forEach(control => refreshPan115Control(control, normalized, matches)); }
 function playPan115Candidate(match, trigger = null) {
  if (!match?.pickcode) return;
  if (Pan115.isPotPlayerMode()) { playPan115Pot(match.pickcode, match.name, trigger); return; }
  window.open(Pan115.playUrl(match.pickcode), '_blank', 'noopener,noreferrer'); }
 function closePan115Chooser() {
  pan115ChooserOverlay?.remove();
  pan115ChooserOverlay = null;
  document.removeEventListener('keydown', onPan115ChooserKeydown, true); }
 function onPan115ChooserKeydown(event) {
  if (document.querySelector('.jav-pan115-confirm-overlay')) return;
  if (event.key === 'Escape') closePan115Chooser();
 }
 function pan115Node(tag, className = '', text = null, parent = null) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== null) node.textContent = text;
  parent?.appendChild(node);
  return node; }
 function pan115Button(text, className, parent, onClick = null) {
  const button = pan115Node('button', className, text, parent);
  button.type = 'button';
  if (onClick) button.addEventListener('click', onClick, true);
  return button; }
 function confirmPan115Action(options = {}) {
  return new Promise(resolve => {
   const overlay = pan115Node('div', 'jav-pan115-confirm-overlay'); const dialog = pan115Node('div', 'jav-pan115-confirm', null, overlay);
   pan115Node('div', 'jav-pan115-confirm-title', options.title || '确认操作', dialog);
   pan115Node('div', 'jav-pan115-confirm-message', options.message || '', dialog);
   const actions = pan115Node('div', 'jav-pan115-confirm-actions', null, dialog);
   const cancel = pan115Button(options.cancelText || '取消', 'jav-pan115-confirm-cancel', actions, () => cleanup(false));
   const confirm = pan115Button(options.confirmText || '确认', 'jav-pan115-confirm-ok', actions, () => cleanup(true));
   const cleanup = value => {
    overlay.remove(); document.removeEventListener('keydown', onKeydown, true); resolve(value); };
   const onKeydown = event => {
    if (event.key !== 'Escape' && event.key !== 'Enter') return;
    event.preventDefault(); event.stopImmediatePropagation(); cleanup(event.key === 'Enter'); };
   overlay.addEventListener('click', event => {
    if (event.target === overlay) cleanup(false);
   }, true);
   document.addEventListener('keydown', onKeydown, true); document.body.appendChild(overlay);
   confirm.focus({ preventScroll: true });
  }); }
 function promptPan115Rename(options = {}) {
  return new Promise(resolve => {
   const overlay = pan115Node('div', 'jav-pan115-confirm-overlay jav-pan115-rename-overlay');
   const dialog = pan115Node('div', 'jav-pan115-confirm jav-pan115-rename-dialog', null, overlay);
   pan115Node('div', 'jav-pan115-confirm-title', options.title || '手动改名', dialog);
   const input = pan115Node('input', 'jav-pan115-rename-input', null, dialog);
   input.className = 'jav-pan115-rename-input'; input.type = 'text'; input.value = options.value || ''; input.placeholder = '输入新的 115 文件名';
   pan115Node('div', 'jav-pan115-rename-hint', options.hint || '确认后会直接改名，请保留正确扩展名。', dialog);
   const actions = pan115Node('div', 'jav-pan115-confirm-actions', null, dialog);
   pan115Button('取消', 'jav-pan115-confirm-cancel', actions, () => cleanup(null));
   pan115Button('确认改名', 'jav-pan115-confirm-ok jav-pan115-rename-ok', actions, () => submit());
   const cleanup = value => {
    overlay.remove(); document.removeEventListener('keydown', onKeydown, true); resolve(value); };
   const submit = () => cleanup(input.value.trim() || null);
   const onKeydown = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); cleanup(null); }
    if (event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); submit(); }
   };
   overlay.addEventListener('click', event => {
    if (event.target === overlay) cleanup(null);
   }, true);
   document.addEventListener('keydown', onKeydown, true); document.body.appendChild(overlay);
   input.focus({ preventScroll: true });
   input.select();
  }); }
 async function renamePan115Candidate(context, newName, button) {
  const { match, matches, normalized, code, nameNode, trigger } = context;
  const nextName = String(newName || '').trim();
  if (!match.fileId) { notify('115 改名失败', '115 搜索结果未返回文件ID，无法改名'); return false; }
  if (!nextName) return false;
  if (nextName === match.name) { notify('115 改名', '新旧文件名一致，已跳过'); return false; }
  const oldText = button.textContent;
  button.disabled = true; button.textContent = '改名中';
  try {
   await Pan115.renameFile(match.fileId, nextName);
   match.name = nextName;
   if (nameNode) { nameNode.textContent = nextName; nameNode.title = nextName; }
   Pan115.clearCached(normalized || code); refreshPan115ControlsForCode(normalized || code, matches, trigger); notify('115 改名成功', nextName);
   return true;
  } catch (error) {
   errorLog('115改名失败:', error); notify('115 改名失败', error?.message || '改名请求失败');
   return false;
  } finally {
   button.disabled = false; button.textContent = oldText; } }
 function createPan115CandidateAction(action, context) {
  const button = document.createElement('button'); const disabled = typeof action.disabled === 'function' && action.disabled(context);
  button.type = 'button';
  button.className =`jav-pan115-candidate-action ${action.className || ''}`.trim();
  button.dataset.pan115Action = action.key || ''; button.textContent = typeof action.label === 'function' ? action.label(context) : action.label;
  button.disabled = !!disabled; button.title = typeof action.title === 'function' ? action.title(context) : action.title || '';
  button.addEventListener('click', event => {
   event.preventDefault(); event.stopImmediatePropagation();
   if (button.disabled) return;
   action.run(context, button);
  }, true);
  return button; }
 function getPan115CandidateActions() {
  return [
   {
    key: 'play',
    className: 'jav-pan115-candidate-play',
    label: () => Pan115.isPotPlayerMode() ? 'PotPlayer' : '播放',
    title: () => Pan115.isPotPlayerMode() ? '使用 PotPlayer 播放' : '打开 115 播放',
    run: ({ match }, button) => playPan115Candidate(match, button), },
   {
    key: 'rename',
    className: 'jav-pan115-candidate-rename',
    label: '改名',
    disabled: ({ match }) => !match.fileId,
    title: ({ match }) => match.fileId ? '手动修改 115 文件名' : '115 搜索结果未返回文件ID，无法改名',
    async run(context, button) {
     const nextName = await promptPan115Rename({ value: context.match.name || '' });
     await renamePan115Candidate(context, nextName, button); }, },
   {
    key: 'delete',
    className: 'jav-pan115-candidate-delete',
    label: '删除',
    disabled: ({ match }) => !match.fileId,
    title: ({ match }) => match.fileId ? '删除此 115 文件' : '115 搜索结果未返回文件ID，无法删除',
    async run({ match, matches, normalized, code, row, refreshDesc, trigger }, button) {
     if (!match.fileId) return;
     const confirmed = await confirmPan115Action({
      title: '删除 115 文件',
      message:`确定删除这个文件吗？\n\n${match.name || match.fileId}`,
      confirmText: '删除',
     });
     if (!confirmed) return;
     button.disabled = true; button.textContent = '删除中';
     try {
      await Pan115.deleteFile(match.fileId);
      const pos = matches.indexOf(match);
      if (pos >= 0) matches.splice(pos, 1);
      Pan115.clearCached(normalized || code); row.remove(); refreshDesc(); refreshPan115ControlsForCode(normalized || code, matches, trigger);
      notify('115 删除成功', match.name || '文件已删除');
      if (!matches.length) closePan115Chooser();
     } catch (error) {
      errorLog('115删除失败:', error); notify('115 删除失败', error?.message || '删除请求失败');
      button.disabled = false; button.textContent = '删除'; } }, }, ]; }
 function openPan115Chooser(code, value, trigger = null) {
  const matches = normalizePan115Matches(value);
  if (!matches.length) return;
  if (matches.length === 1) { playPan115Candidate(matches[0], trigger); return; }
  closePan115Chooser();
  const normalized = Pan115.normalizeKeepSeparator(code); const overlay = document.createElement('div');
  overlay.className = 'jav-pan115-chooser-overlay';
  overlay.addEventListener('click', event => {
   if (event.target === overlay) closePan115Chooser();
  }, true);
  const dialog = document.createElement('div');
  dialog.className = 'jav-pan115-chooser';
  overlay.appendChild(dialog);
  const header = document.createElement('div');
  header.className = 'jav-pan115-chooser-header';
  dialog.appendChild(header);
  const titleWrap = document.createElement('div');
  header.appendChild(titleWrap);
  const title = document.createElement('div');
  title.className = 'jav-pan115-chooser-title';
  title.textContent =`${normalized || code} 的 115 匹配`;
  titleWrap.appendChild(title);
  const desc = document.createElement('div');
  desc.className = 'jav-pan115-chooser-desc';
  titleWrap.appendChild(desc);
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'jav-pan115-chooser-close'; close.textContent = '×'; close.title = '关闭';
  close.addEventListener('click', closePan115Chooser, true); header.appendChild(close);
  const list = document.createElement('div');
  list.className = 'jav-pan115-candidate-list';
  dialog.appendChild(list);
  const refreshDesc = () => {
   desc.textContent =`共 ${matches.length} 个候选，可选择播放或管理文件。`;
  };
  refreshDesc();
  matches.forEach((match, index) => {
   const row = document.createElement('div');
   row.className =`jav-pan115-candidate${match.lowPriorityReason ? ' is-low-priority' : ''}`;
   list.appendChild(row);
   const main = document.createElement('div');
   main.className = 'jav-pan115-candidate-main';
   row.appendChild(main);
   const name = document.createElement('div');
   name.className = 'jav-pan115-candidate-name';
   name.textContent = match.name ||`候选 ${index + 1}`;
   name.title = match.name || '';
   main.appendChild(name);
   const meta = document.createElement('div');
   meta.className = 'jav-pan115-candidate-meta';
   meta.textContent = [match.sizeText || Pan115.formatSize(match.size), match.lowPriorityReason].filter(Boolean).join(' · ') || '未返回文件大小';
   main.appendChild(meta);
   const actions = document.createElement('div');
   actions.className = 'jav-pan115-candidate-actions';
   row.appendChild(actions);
   getPan115CandidateActions().forEach(action => {
    actions.appendChild(createPan115CandidateAction(action, { match, matches, normalized, code, row, nameNode: name, metaNode: meta, refreshDesc, trigger }));
   });
  });
  document.body.appendChild(overlay);
  pan115ChooserOverlay = overlay;
  document.addEventListener('keydown', onPan115ChooserKeydown, true); }
 function createPan115MatchButton(matches, code, text, useCapture = false) {
  const list = normalizePan115Matches(matches); const best = list[0];
  const button = Utils.createBtn(pan115DisplayLabel(text, list), '#00a85a', () => openPan115Chooser(code, list, button), useCapture);
  button.classList.add('jav-pan115-play-btn');
  button.dataset.pickcode = best.pickcode; button.dataset.pan115Code = Pan115.normalizeKeepSeparator(code) || code || '';
  button.title = pan115MatchTitle(list, code);
  return button; }
 function addPan115PlayBtn(code, container, useCapture = false) {
  if (!Pan115.enabled() || !code || !container) return;
  const normalized = Pan115.normalizeKeepSeparator(code);
  if (!normalized || container.dataset.pan115PlayCode === normalized) return;
  container.dataset.pan115PlayCode = normalized;
  const marker = document.createComment('pan115-play');
  const anchor = container.querySelector('.jav-subtitle-btn, .jav-trailer-btn, .jav-preview-btn, .jav-settings-btn');
  container.insertBefore(marker, anchor || null);
  Pan115.searchAllCached(normalized).then(matches => {
   const list = normalizePan115Matches(matches);
   if (!Pan115.enabled() || !list.length || !marker.parentNode) return;
   const btn = createPan115MatchButton(list, normalized, '115播放', useCapture);
   marker.parentNode.insertBefore(btn, marker);
  }).catch(err => {
   errorLog('115自动查询失败:', err);
  }).finally(() => { marker.remove(); }); }
 function createPan115PotButton(text, pickcode, title, useCapture = false) {
  let button;
  button = Utils.createBtn(text, '#00a85a', () => playPan115Pot(pickcode, title, button), useCapture); button.dataset.pickcode = pickcode;
  button.title = title || '使用 PotPlayer 播放';
  return button; }
 async function playPan115Pot(pickcode, title, button = null) {
  if (button?.dataset.pan115Loading === '1') return;
  if (button) { button.dataset.pan115Loading = '1'; button.setAttribute('aria-busy', 'true'); }
  try {
   await Pan115.playPotPlayer(pickcode, title); notify('PotPlayer', '已发送 115 直链，正在启动播放器');
  } catch (error) {
   errorLog('PotPlayer 播放失败:', error); notify('PotPlayer 播放失败', error?.message || '无法获取 115 直链');
  } finally {
   if (button) { delete button.dataset.pan115Loading; button.removeAttribute('aria-busy'); }
  } }
 function createPan115Badge(hit, code, asAnchor = true) {
  const matches = normalizePan115Matches(hit); const best = matches[0]; const isMulti = matches.length > 1;
  const url = best ? Pan115.playUrl(best.pickcode) : '#';
  const badge = document.createElement(asAnchor && !isMulti && !Pan115.isPotPlayerMode() ? 'a' : 'span');
  badge.className = 'jav-pan115-badge'; badge.textContent = pan115DisplayLabel('115匹配', matches); badge.title = pan115MatchTitle(matches, code);
  badge.dataset.pickcode = best?.pickcode || ''; badge.dataset.pan115Code = Pan115.normalizeKeepSeparator(code) || code || '';
  if (isMulti) {
   badge.setAttribute('role', 'link');
   badge.tabIndex = 0;
   const openList = event => {
    event.preventDefault(); event.stopImmediatePropagation(); openPan115Chooser(code, matches, badge); };
   badge.addEventListener('click', openList, true);
   badge.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') openList(event);
   }, true);
  } else if (Pan115.isPotPlayerMode()) {
   if (asAnchor) badge.href = '#';
   badge.setAttribute('role', 'link');
   badge.tabIndex = 0;
   const openPot = event => {
    event.preventDefault(); event.stopImmediatePropagation(); playPan115Pot(best.pickcode, best.name, badge); };
   badge.addEventListener('click', openPot, true);
   badge.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') openPot(event);
   }, true);
  } else if (asAnchor) {
   badge.href = url; badge.target = '_blank'; badge.rel = 'noopener noreferrer';
   badge.addEventListener('click', e => {
    e.stopImmediatePropagation();
   }, true);
  } else {
   badge.setAttribute('role', 'link');
   badge.tabIndex = 0;
   const open = e => {
    e.preventDefault(); e.stopImmediatePropagation(); window.open(Pan115.playUrl(badge.dataset.pickcode), '_blank', 'noopener,noreferrer'); };
   badge.addEventListener('click', open, true);
   badge.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') open(e);
   }, true); }
  return badge; }
 let pan115ListRunning = false;
 async function renderPan115ListBadges() {
  if (!Pan115.enabled() || pan115ListRunning || SiteManager.isDetailPage()) return;
  pan115ListRunning = true;
  const targets = SiteManager.collectPan115ListTargets().slice(0, 36);
  try {
   targets.forEach(({ anchor }) => { anchor.dataset.pan115Checked = '1'; });
   await Promise.all(targets.map(async ({ anchor, code }) => {
    try {
     const matches = await Pan115.searchAllCached(code);
     SiteManager.insertPan115ListBadge(anchor, matches, code);
    } catch (err) { errorLog('115列表单项查询失败:', err); }
   }));
  } catch (err) {
   errorLog('115列表自动查询失败:', err);
  } finally {
   pan115ListRunning = false;
   if (Pan115.enabled() && SiteManager.collectPan115ListTargets().length) schedulePan115ListBadges();
  } }
 function removePan115Ui() {
  clearTimeout(pan115ListTimer); closePan115Chooser(); document.querySelectorAll('.jav-pan115-badge, .jav-pan115-play-btn').forEach(el => el.remove());
  document.querySelectorAll('[data-pan115-checked], [data-pan115-has-badge]').forEach(el => {
   delete el.dataset.pan115Checked; delete el.dataset.pan115HasBadge;
  });
  document.querySelectorAll('[data-pan115-play-code]').forEach(el => { delete el.dataset.pan115PlayCode; }); }
 function refreshPan115PlayerLinks() {
  if (Pan115.isPotPlayerMode()) return;
  document.querySelectorAll('.jav-pan115-badge[data-pickcode], .jav-pan115-play-btn[data-pickcode]').forEach(el => {
   const url = Pan115.playUrl(el.dataset.pickcode);
   if (el.tagName === 'A') el.href = url;
  }); }
 function forceRenderPan115Ui() {
  refreshPan115PlayerLinks();
  if (SiteManager.isDetailPage()) {
   JumpButtons.render();
  } else { schedulePan115ListBadges(); } }
 function syncPan115AfterSettingsSave(enabled = Pan115.enabled()) {
  if (!enabled) { removePan115Ui(); return; }
  removePan115Ui(); setTimeout(forceRenderPan115Ui, 0); }
 Core.expose('__LAOSIJI_SYNC_PAN115__', syncPan115AfterSettingsSave);
 const TitleTranslate = (() => {
  const CACHE_PREFIX = 'title_translate_pa_v1_';
  function ensureStyle() {
   injectStyle('jav-title-translate-style',`.jav-title-translation{margin:6px 0 8px!important;padding:7px 10px!important;border-left:3px solid #60a5fa!important;background:#eff6ff!important;color:#1e3a8a!important;font-size:20px!important;font-weight:700!important;line-height:1.5!important;word-break:break-word!important;border-radius:0 6px 6px 0!important}.jav-title-translation.is-loading{color:#64748b!important;background:#f8fafc!important;border-left-color:#cbd5e1!important}.jav-title-translation.is-error{color:#be123c!important;background:#fff1f2!important;border-left-color:#fb7185!important}#video_title .jav-title-translation{margin-right:72px!important}`);
  }
  function escapeRegExp(value) { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function titleWithoutCode(text) {
   const raw = String(text || '').replace(/\s+/g, ' ').trim(); const code = Utils.extractCode(raw);
   if (!code) return raw;
   return raw.replace(new RegExp(`^\\s*${escapeRegExp(code)}\\s*`, 'i'), '').trim() || raw;
  }
  function getInfo() {
   const site = SiteManager.getJumpSite();
   if (!site || !['javdb', 'javbus', 'javlibrary'].includes(site.id)) return null;
   if (site.id === 'javdb') {
    const current = document.querySelector('strong.current-title, .current-title');
    if (!current) return null;
    const text = current.textContent.trim();
    return { site: site.id, text, anchor: current.closest('h2') || current }; }
   if (site.id === 'javbus') {
    const title = document.querySelector('h3[data-enhanced="1"]') || SiteManager.getJumpTitleElement(site);
    if (!title) return null;
    return { site: site.id, text: titleWithoutCode(title.textContent), anchor: title }; }
   const title = document.querySelector('#video_title .post-title.text a, #video_title .post-title.text, .post-title a, .post-title');
   if (!title) return null;
   return { site: site.id, text: titleWithoutCode(title.textContent), anchor: title.closest('h3') || title }; }
  function readJavbusLang() {
   const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; const direct = pageWindow?.lang || window.lang || '';
   if (direct) return direct;
   for (const script of document.scripts || []) {
    const hit = (script.textContent || '').match(/\bvar\s+lang\s*=\s*['"]([^'"]+)/i);
    if (hit) return hit[1];
   }
   return ''; }
  function targetLanguage(siteId) {
   let lang = '';
   if (siteId === 'javdb') {
    lang = document.documentElement.dataset.lang || document.body?.dataset.lang || new URL(location.href).searchParams.get('locale') || '';
    const lower = String(lang).toLowerCase();
    if (lower === 'en') return 'en';
    if (lower === 'zh') return 'zh-TW';
    return 'zh-CN'; }
   if (siteId === 'javbus') {
    lang = readJavbusLang();
    const lower = String(lang).toLowerCase();
    if (lower === 'ja') return '';
    if (lower === 'en') return 'en';
    if (lower === 'ko') return 'ko';
    return 'zh-CN'; }
   if (siteId === 'javlibrary' || siteId === 'javlib') {
    lang = document.documentElement.lang || '';
    const lower = String(lang).toLowerCase();
    if (lower.startsWith('ja')) return '';
    if (lower.startsWith('en')) return '';
    if (lower.includes('tw') || lower === 'zh') return 'zh-TW';
    return 'zh-CN'; }
   return 'zh-CN'; }
  function translateMessage(target, type) {
   const lang = String(target || '').toLowerCase();
   if (lang === 'en') return type === 'error' ? 'Title translation failed' : 'Translating title...';
   if (lang === 'ko') return type === 'error' ? '제목 번역 실패' : '제목 번역 중...';
   if (lang === 'zh-tw') return type === 'error' ? '翻譯標題失敗' : '翻譯標題中...';
   return type === 'error' ? '翻译标题失败' : '翻译标题中...'; }
  function cacheKey(text, target) {
   return `${CACHE_PREFIX}${target || 'zh-CN'}_${encodeURIComponent(String(text || '').slice(0, 180))}`;
  }
  async function translate(text, target) {
   const key = cacheKey(text, target); const cached = sessionStorage.getItem(key);
   if (cached) return cached;
   const url = 'https://translate-pa.googleapis.com/v1/translate?' + new URLSearchParams({
    'params.client': 'gtx',
    dataTypes: 'TRANSLATION',
    key: 'AIzaSyDLEeFI5OtFBwYBIoK_jj5m32rZK5CkCXA',
    'query.sourceLanguage': 'ja',
    'query.targetLanguage': target || 'zh-CN',
    'query.text': text,
   }).toString();
   const r = await gmFetch(url, { timeout: 15000 });
   if (!r.ok) throw new Error(`${r.error?.kind || 'http'} ${r.status || 0}`);
   const json = JSON.parse(r.responseText || '{}');
   const result = String(json.translation || '').trim();
   if (!result) throw new Error('empty translation');
   sessionStorage.setItem(key, result);
   return result; }
  function clear() {
   document.querySelectorAll('.jav-title-translation').forEach(el => el.remove()); }
  async function sync() {
   if (!CFG.titleTranslate) { clear(); return; }
   const info = getInfo();
   if (!info?.text || !info.anchor) { clear(); return; }
   const target = targetLanguage(info.site);
   if (!target) { clear(); return; }
   ensureStyle();
   let row = Array.from(info.anchor.parentNode?.children || []).find(el => el.classList?.contains('jav-title-translation'));
   if (!row) { row = document.createElement('div'); row.className = 'jav-title-translation is-loading'; info.anchor.insertAdjacentElement('afterend', row); }
   const id = `${info.site}:${target}:${info.text}`;
   if (row.dataset.translateId === id && ['loading', 'loaded'].includes(row.dataset.state)) return;
   row.dataset.translateId = id; row.dataset.state = 'loading'; row.className = 'jav-title-translation is-loading'; row.textContent = translateMessage(target);
   try {
    const translated = await translate(info.text, target);
    if (!CFG.titleTranslate || row.dataset.translateId !== id) return;
    row.dataset.state = 'loaded'; row.className = 'jav-title-translation'; row.textContent = translated;
   } catch (err) {
    if (row.dataset.translateId !== id) return;
    row.dataset.state = 'error'; row.className = 'jav-title-translation is-error'; row.textContent = translateMessage(target, 'error');
    errorLog('翻译标题失败:', err); } }
  return { sync, clear };
 })();
 Core.expose('__LAOSIJI_TITLE_TRANSLATE__', TitleTranslate);
 function isCurrentDetailPage() {
  if (typeof Javdb123AvFc2 !== 'undefined' && Javdb123AvFc2.isDetailRoute?.()) return true;
  if (/javbus\.com/i.test(location.hostname)) {
   return /^\/(?:[a-z]{2}\/)?(?:[A-Z]{2,15}-?\d{2,10}(?:-\d{1,3})?|[A-Z]{2,10}\d{3,6}|FC2(?:-PPV)?-\d{6,9})\/?$/i.test(location.pathname); }
  return JumpSites.some(site => site.match(window.location.href)); }
 function isElemVisible(el) {
  if (!el) return false;
  if (el.closest('.hide, [hidden], [aria-hidden="true"]')) return false;
  const rects = el.getClientRects();
  if (!rects || rects.length === 0) return false;
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  return true; }
 const EMBY_PLAYBACK_UI_SELECTOR = '.view-videoosd-videoosd, .videoOsdBottom, .videoOsdText';
 function isEmbyPlaybackUiNode(el) { return !!el?.closest?.(EMBY_PLAYBACK_UI_SELECTOR); }
 function removeEmbyPlaybackButtons() {
  document.querySelectorAll('.jav-jump-btn-group[data-laosiji-jump="1"]').forEach(group => {
   if (!isEmbyPlaybackUiNode(group)) return;
   const titleElem = group.previousElementSibling;
   if (titleElem?.dataset.enhanced === '1') delete titleElem.dataset.enhanced;
   group.remove();
  }); }
 function resolveEmbyTitleElem() {
  const nodes = Array.from(document.querySelectorAll(
   'h1, h2, h3.itemName, .itemName-primary, .pageTitle, .nameContainer h3, [class*="itemName"]'
  ));
  let firstVisible = null;
  for (const el of nodes) {
   const txt = (el.textContent || '').trim();
   if (!txt) continue;
   if (isEmbyPlaybackUiNode(el)) continue;
   if (!isElemVisible(el)) continue;
   if (!firstVisible) firstVisible = el;
   if (Utils.extractCode(txt)) return el;
  }
  return firstVisible; }
 function renderButtonsForCurrentPage() {
  const site = SiteManager.getJumpSite();
  if (!site) return;
  if (site.id === 'emby') removeEmbyPlaybackButtons();
  let titleElem = SiteManager.getJumpTitleElement(site);
  if (!titleElem) return;
  if (site.id === 'emby' && !Utils.extractCode(titleElem.textContent || '')) return;
  const existingBtnGroup = document.querySelector('.jav-jump-btn-group[data-laosiji-jump="1"]');
  if (site.id === 'emby') {
   const renderKey = SiteManager.getEmbyRenderKey(titleElem); const existingKey = existingBtnGroup?.dataset.embyRenderKey || '';
   if (existingBtnGroup) {
    if ((existingKey && existingKey !== renderKey) || !existingBtnGroup.isConnected) {
     existingBtnGroup.remove();
    } else {
     const anchor = SiteManager.getEmbyInsertAnchor(titleElem);
     if (anchor.nextElementSibling !== existingBtnGroup) { anchor.insertAdjacentElement('afterend', existingBtnGroup); }
     return; } }
   delete titleElem.dataset.enhanced; }
  if (existingBtnGroup) {
   if (site.id === 'emby') {
   } else {
    const existingTitleText = titleElem.textContent || '';
    const code = typeof site.getCode === 'function' ? site.getCode(titleElem) : Utils.extractCode(existingTitleText);
    if (code && existingBtnGroup.dataset.code && existingBtnGroup.dataset.code !== code) {
     existingBtnGroup.remove();
     delete titleElem.dataset.enhanced;
    } else {
     if (code) existingBtnGroup.dataset.code = code;
     const pan115Code = Pan115.extractCode(site.id === 'fc2cmadb' ? code : existingTitleText, code);
     if (pan115Code) addPan115PlayBtn(pan115Code, existingBtnGroup);
     addSettingsBtn(existingBtnGroup); placeJumpButtonGroup(site, titleElem, existingBtnGroup);
     return; } } }
  if (titleElem.dataset.enhanced === '1') return;
  titleElem.dataset.enhanced = '1';
  const titleText = titleElem.textContent; const code = typeof site.getCode === 'function' ? site.getCode(titleElem) : Utils.extractCode(titleText);
  if (!code) return;
  const trailerCode = typeof site.getCode === 'function' ? code : Utils.extractCode(titleText, { keepUncensoredSource: true }) || code;
  const btnGroup = document.createElement('div');
  btnGroup.className = 'jav-jump-btn-group'; btnGroup.dataset.laosijiJump = '1'; btnGroup.dataset.code = code;
  if (site.id === 'fc2cmadb') { btnGroup.classList.add('fc2cmadb-jump-group'); insertAvidCopyBtn(titleElem, code, null, true); }
  addNyaaBtn(code, btnGroup); addJavbusBtn(code, btnGroup); addJavdbBtn(code, btnGroup); addMissAVBtn(code, btnGroup);
  if (site.id === 'missav') {
   const availableEngines = getAvailableSearchEngines(code); const defaultEngine = Settings.getDefaultSearchEngine(code);
   const mainSearchBtn = Utils.createLinkBtn(`🔍 ${defaultEngine.name}`, defaultEngine.color, defaultEngine.url(code));
   const subButtons = availableEngines .filter(engine => engine.name !== defaultEngine.name)
    .map(engine => Utils.createLinkBtn(`🔍 ${engine.name}`, engine.color, engine.url(code)));
   btnGroup.appendChild(createJumpMenu({
    accent: defaultEngine.color,
    mainBtn: mainSearchBtn,
    subButtons,
    toggleTitle: '展开搜索引擎',
    stretchSubButtons: false,
   }));
  } else {
   addDmmBtn(code, btnGroup); addSearchMenu(code, btnGroup);
   if (site.id === 'javlibrary' || ['javbus', 'javdb', 'supjav', 'jable'].includes(site.id)) { addJumpLineBreak(btnGroup); }
  }
  addPan115PlayBtn(Pan115.extractCode(site.id === 'fc2cmadb' ? code : titleText, code), btnGroup); addSubtitleBtn(code, btnGroup);
  addTrailerBtn(trailerCode, btnGroup); addPreviewBtn(code, btnGroup); addSettingsBtn(btnGroup);
  if (site.id === 'javlibrary') {
   btnGroup.querySelectorAll('a').forEach(btn => {
    let style = btn.getAttribute('style') || '';
    style = style.replace(/background:\s*([^;]+);/g, 'background: $1 !important;'); style = style.replace(/color:\s*([^;]+);/g, 'color: $1 !important;');
    btn.setAttribute('style', style);
   });
  } else if (site.id === 'missav') {
   btnGroup.style.cssText = `margin:10px 0 6px 0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;position:relative;z-index:9999;`;
  }
  if (site.id === 'emby') {
   btnGroup.classList.add('emby-fix');
   btnGroup.dataset.embyRenderKey = SiteManager.getEmbyRenderKey(titleElem);
   SiteManager.getEmbyInsertAnchor(titleElem).insertAdjacentElement('afterend', btnGroup);
  } else { placeJumpButtonGroup(site, titleElem, btnGroup); } }
 function getJhsLikeJumpTarget(site) {
  if (typeof Javdb123AvFc2 !== 'undefined' && Javdb123AvFc2.isDetailRoute?.()) { return document.querySelector('.movie-panel-info'); }
  if (site.id === 'javdb') return document.querySelector('.movie-panel-info');
  if (site.id === 'javbus') return document.querySelector('.container .info');
  if (site.id === 'javlibrary') return document.querySelector('#video_info');
  if (site.id === 'fc2cmadb') return site.getInfoTable?.(SiteManager.getJumpTitleElement(site)) || document.querySelector('table.table');
  return null; }
 function placeJumpButtonGroup(site, titleElem, btnGroup) {
  if (site.id === 'fc2cmadb') {
   const target = getJhsLikeJumpTarget(site);
   if (!target) return;
   allowJumpMenuOverflow(target);
   if (btnGroup.parentElement !== target.parentElement || btnGroup.previousElementSibling !== target) { target.insertAdjacentElement('afterend', btnGroup); }
   return; }
  if (site.id === 'supjav') {
   btnGroup.style.marginTop = '8px';
   if (btnGroup.parentElement !== titleElem.parentElement || btnGroup.previousElementSibling !== titleElem) {
    titleElem.insertAdjacentElement('afterend', btnGroup); }
   return; }
  if (site.id === 'jable') {
   btnGroup.style.marginTop = '8px'; btnGroup.style.display = 'flex'; btnGroup.style.flexWrap = 'wrap';
   if (btnGroup.parentElement !== titleElem) { titleElem.appendChild(btnGroup); }
   return; }
  if (site.id === '123av') {
   btnGroup.style.marginTop = '10px'; btnGroup.style.display = 'flex'; btnGroup.style.flexWrap = 'wrap';
   const head = titleElem.closest('.watch__head, .watch__headinfo') || titleElem.parentElement;
   allowJumpMenuOverflow(head);
   if (btnGroup.parentElement !== titleElem.parentElement || btnGroup.previousElementSibling !== titleElem) {
    titleElem.insertAdjacentElement('afterend', btnGroup); }
   return; }
  const target = getJhsLikeJumpTarget(site);
  if (target) {
   allowJumpMenuOverflow(target);
   if (site.id === 'javlibrary') {
    if (btnGroup.parentElement !== target || btnGroup.nextElementSibling) target.appendChild(btnGroup);
   } else if (btnGroup.parentElement !== target) {
    target.appendChild(btnGroup); }
  } else if (btnGroup.parentElement !== titleElem.parentElement || btnGroup.previousElementSibling !== titleElem) {
   titleElem.insertAdjacentElement('afterend', btnGroup); } }
 function allowJumpMenuOverflow(target) {
  const elements = [
   target,
   target.closest('td'),
   target.closest('tr'),
   target.closest('#video_jacket_info'),
   target.closest('.movie-panel-info'),
   target.closest('.movie-panel-info')?.closest('.column'),
   target.closest('.movie-panel-info')?.closest('.columns'),
   target.closest('.movie-panel-info')?.closest('.video-meta-panel'),
   target.closest('.movie-panel-info')?.closest('.javdb-123av-fc2-overview'),
   target.closest('.container .info'),
   target.closest('.col-md-3.info'),
   target.closest('.jav-flex-container'),
   target.closest('.row.movie'),
   target.closest('.video-info'),
   target.closest('.info-header') ];
  [...new Set(elements.filter(Boolean))].forEach(el => {
   el.style.setProperty('overflow', 'visible', 'important'); el.style.setProperty('overflow-x', 'visible', 'important');
   el.style.setProperty('overflow-y', 'visible', 'important');
  }); }
 const JumpButtons = { render: renderButtonsForCurrentPage, refresh: renderButtonsForCurrentPage };
 Core.expose('__LAOSIJI_JUMP_BUTTONS__', JumpButtons);
 const InfiniteScroll = {
  cachePrefix: 'laosiji_infinite_v1_',
  maxSnapshotItems: 120,
  pendingScrollY: null,
  initRetryTimer: null,
  initRetryCount: 0,
  generation: 0,
  enabled() { return GM_getValue('infinite_scroll_enabled', false); },
  restoreEnabled() { return GM_getValue('infinite_scroll_restore_enabled', true); },
  state: null,
  init() {
   if (!this.enabled() || SiteManager.isDetailPage()) { this.clearInitRetry(); return; }
   if (this.state) {
    const alive = this.state.container?.isConnected && this.state.sentinel?.isConnected;
    if (alive) return;
    this.destroy(); }
   if (SiteJavDB.match() && !SiteManager.isDetailPage()) { SiteJavDB._initListPage?.(); }
   const config = this.getConfig();
   if (!config?.container || !config.nextUrl) { this.scheduleInitRetry(); return; }
   this.clearInitRetry();
   const generation = ++this.generation;
   this.pendingScrollY = null;
   this.state = { ...config,
    generation,
    loading: false,
    paused: false,
    done: false,
    emptyStreak: 0,
    seen: new Set([...config.container.querySelectorAll('a[href]')].map(a => a.href)), };
   if (this.restoreEnabled()) {
    try {
     this.restoreSnapshot(this.state);
    } catch (err) { errorLog('瀑布流快照恢复失败:', err); }
   } else { this.clearSnapshot(this.state); }
   this.hidePagination(); this.createSentinel(); this.observe();
   if (this.restoreEnabled()) this.restoreScroll();
  },
  clearInitRetry(resetCount = true) {
   clearTimeout(this.initRetryTimer);
   this.initRetryTimer = null;
   if (resetCount) this.initRetryCount = 0;
  },
  scheduleInitRetry() {
   if (this.initRetryTimer || this.initRetryCount >= 8) return;
   const delays = [250, 600, 1000, 1600, 2400, 3500, 5000, 7000]; const delay = delays[Math.min(this.initRetryCount, delays.length - 1)];
   this.initRetryCount += 1;
   this.initRetryTimer = setTimeout(() => {
    this.initRetryTimer = null;
    if (!this.state) this.init();
   }, delay); },
  destroy() {
   ++this.generation; this.state?.abortRequest?.();
   const javdbList = this.state?.site === 'javdb' ? this.state.container : null;
   if (this.restoreEnabled()) this.saveSnapshot();
   else this.clearSnapshot(this.state);
   this.clearInitRetry();
   if (this.state?.observer) { this.state.observer.disconnect(); }
   this.state = null;
   if (javdbList) JavdbListScoreSort.sync(javdbList);
   document.querySelectorAll('.jav-infinite-sentinel').forEach(el => el.remove());
   document.querySelectorAll('#next, .pagination, nav.pagination, .page_selector').forEach(el => { el.style.display = ''; }); },
  pauseForBfcache() {
   if (!this.state) return;
   this.state.paused = true;
   this.state.observer?.disconnect();
   this.state.observer = null;
   this.clearInitRetry(); },
  resumeFromBfcache() {
   if (!this.enabled() || SiteManager.isDetailPage()) return;
   if (!this.state?.container?.isConnected || !this.state?.sentinel?.isConnected) { this.init(); return; }
   this.state.paused = false;
   if (!this.state.done && !this.state.observer) this.observe();
  },
  isCurrent(state, generation) { return this.state === state && this.generation === generation; },
  getConfig(doc = document, baseUrl = location.href) { return SiteManager.getInfiniteScrollConfig(doc, baseUrl); },
  cacheKey(config = this.state) {
   if (!config?.site) return '';
   const url = new URL(location.href);
   url.hash = '';
   return `${this.cachePrefix}${config.site}_${url.href}`;
  },
  readSnapshot(config = this.state) {
   const key = this.cacheKey(config);
   if (!key) return null;
   try {
    const data = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!data || data.site !== config.site) return null;
    return data;
   } catch {
    sessionStorage.removeItem(key);
    return null; } },
  clearSnapshot(config = this.state) {
   const key = this.cacheKey(config);
   if (!key) return;
   try {
    sessionStorage.removeItem(key);
   } catch {
   } },
  itemKey(item) {
   const href = item?.querySelector?.('a[href]')?.getAttribute('href') || '';
   return href ? new URL(href, location.href).href : (item?.textContent || '').trim().slice(0, 80); },
  applySnapshotState(config, snapshot) {
   if (!snapshot) return;
   if ('nextUrl' in snapshot) config.nextUrl = snapshot.nextUrl || '';
   config.done = !!snapshot.done; config.restoredScrollY = Number(snapshot.scrollY) || 0; },
  sanitizeSnapshotItem(item) {
   if (!item) return null;
   const clone = item.cloneNode(true);
   clone.querySelectorAll('.emby-badge, .emby-btn, .emby-button-group, .emby-javlibrary-list-badge, .jav-card-quick-actions, .jav-list-preview-btn').forEach(el => el.remove());
   clone.querySelectorAll('a[href]').forEach(anchor => { anchor.querySelectorAll('a[href]').forEach(child => child.replaceWith(...child.childNodes)); });
   return clone; },
  restoreSnapshot(config) {
   const snapshot = this.readSnapshot(config);
   if (!snapshot) return false;
   this.applySnapshotState(config, snapshot);
   const items = Array.isArray(snapshot.items) ? snapshot.items : [];
   if (!items.length) return false;
   const liveKeys = new Set([...config.container.querySelectorAll(config.itemSelector)] .map(item => this.itemKey(item)) .filter(Boolean));
   const frag = document.createDocumentFragment(); let restored = 0;
   items.forEach(html => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    let item = tpl.content.firstElementChild; const key = this.itemKey(item);
    if (!item || !key || liveKeys.has(key)) return;
    liveKeys.add(key); config.seen.add(key);
    item.dataset.laosijiInfiniteItem = '1'; item = this.sanitizeSnapshotItem(item) || item;
    SiteManager.decorateInfiniteScrollItem(config.site, item); frag.appendChild(item);
    restored += 1;
   });
   if (!restored) return false;
   config.container.appendChild(frag); this.hidePagination();
   return true; },
  saveSnapshot() {
   if (!this.restoreEnabled()) { this.clearSnapshot(); return; }
   if (!this.state?.container) return;
   const key = this.cacheKey();
   if (!key) return;
   const allItems = [...this.state.container.querySelectorAll(this.state.itemSelector)];
   const items = allItems .filter(item => item.dataset.laosijiInfiniteItem === '1') .slice(-this.maxSnapshotItems)
    .map(item => this.sanitizeSnapshotItem(item)?.outerHTML || item.outerHTML);
   const payload = {
    site: this.state.site,
    nextUrl: this.state.nextUrl || '',
    done: !!this.state.done,
    scrollY: this.pendingScrollY ?? window.scrollY ?? 0,
    items,
    savedAt: Date.now(), };
   try {
    sessionStorage.setItem(key, JSON.stringify(payload));
   } catch (err) { errorLog('瀑布流快照保存失败:', err); } },
  scheduleSnapshotSave() {
   if (!this.state || !this.restoreEnabled()) return;
   this.pendingScrollY = window.scrollY || 0; },
  rememberScroll() {
   if (this.restoreEnabled()) this.pendingScrollY = window.scrollY || 0;
  },
  restoreScroll() {
   const y = Number(this.state?.restoredScrollY) || 0;
   if (y <= 0) return;
   setTimeout(() => window.scrollTo(window.scrollX || 0, y), 0); setTimeout(() => window.scrollTo(window.scrollX || 0, y), 120); },
  createSentinel() {
   const sentinel = document.createElement('div');
   sentinel.className = 'jav-infinite-sentinel'; sentinel.textContent = '继续滚动加载下一页';
   sentinel.addEventListener('click', () => {
    if (sentinel.classList.contains('is-error')) this.loadNext();
   });
   this.state.sentinel = sentinel;
   this.state.container.insertAdjacentElement('afterend', sentinel); },
  observe() {
   this.state.observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) this.loadNext();
   }, { rootMargin: '900px 0px' });
   this.state.observer.observe(this.state.sentinel); },
  hidePagination() {
   document.querySelectorAll('#next, .pagination, nav.pagination, .page_selector').forEach(el => { el.style.display = 'none'; }); },
  setStatus(text, className = '') {
   const sentinel = this.state?.sentinel;
   if (!sentinel) return;
   sentinel.className = `jav-infinite-sentinel ${className}`.trim();
   sentinel.textContent = text; },
  async fetchDoc(url, requestContext = null) {
   const target = new URL(url, location.href);
   if (target.origin === location.origin) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    if (controller && requestContext) requestContext.abort = () => controller.abort();
    try {
     const res = await fetch(target.href, {
      credentials: 'include',
      cache: 'no-store',
      signal: controller?.signal,
     });
     if (!res.ok) throw new Error(`HTTP ${res.status}`);
     const html = await res.text();
     return new DOMParser().parseFromString(html, 'text/html');
    } catch (err) {
     if (controller?.signal.aborted) throw err;
     debugLog('same-origin page fetch failed, fallback to GM_xmlhttpRequest:', err); } }
   const request = gmFetch(target.href, {
    withCredentials: true,
    timeout: 20000,
   });
   if (requestContext) requestContext.abort = () => request.abort?.();
   const r = await request;
   if (!r.ok) throw new Error(`${r.error?.kind || 'http'} ${r.status || 0}`);
   return new DOMParser().parseFromString(r.responseText, 'text/html'); },
  appendItems(doc) {
   const items = [...doc.querySelectorAll(this.state.itemSelector)]; let container = this.state.container;
   const live = SiteManager.getInfiniteScrollContainer(this.state.site);
   if (live) container = this.state.container = live;
   let added = 0; const addedItems = [];
   items.forEach(item => {
    try {
     const key = this.itemKey(item);
     if (key && this.state.seen.has(key)) return;
     if (key) this.state.seen.add(key);
     item.dataset.laosijiInfiniteItem = '1';
     const adopted = document.adoptNode(item);
     container.appendChild(adopted);
     try {
      const imgs = adopted.matches?.('img') ? [adopted] : adopted.querySelectorAll?.('img') || [];
      imgs.forEach(img => { if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy'); });
     } catch (e) {}
     SiteManager.decorateInfiniteScrollItem(this.state.site, adopted); addedItems.push(adopted);
     added += 1;
    } catch (err) { errorLog('追加单项失败:', err); }
   });
   if (this.state.site === 'javdb' && addedItems.length) { JavdbListScoreSort.sync(container, addedItems); }
   return added; },
  async loadNext() {
   const state = this.state; const generation = state?.generation ?? this.generation;
   if (!this.isCurrent(state, generation) || state.paused || state.loading || state.done || !state.nextUrl) return;
   state.loading = true;
   this.setStatus('正在加载下一页...', 'is-loading');
   try {
    const currentUrl = state.nextUrl;
    const requestContext = { abort: null };
    state.abortRequest = () => requestContext.abort?.();
    const doc = await this.fetchDoc(currentUrl, requestContext).catch(err => {
     if (!this.isCurrent(state, generation)) return null;
     throw err;
    });
    if (!this.isCurrent(state, generation)) return;
    if (!doc.querySelector(state.itemSelector)) throw new Error('next page has no list items');
    const added = this.appendItems(doc); const nextConfig = this.getConfig(doc, currentUrl);
    if (!this.isCurrent(state, generation)) return;
    const resolvedNext = nextConfig?.nextUrl || '';
    state.nextUrl = (resolvedNext && resolvedNext !== currentUrl) ? resolvedNext : '';
    this.hidePagination(); this.reflow(); Runtime.refreshListDecorations(); this.saveSnapshot();
    setTimeout(() => {
     if (!this.isCurrent(state, generation)) return;
     Runtime.refreshListPage();
    }, 80);
    state.emptyStreak = added ? 0 : (state.emptyStreak + 1);
    if (!state.nextUrl || state.emptyStreak >= 3) {
     state.done = true;
     state.observer?.disconnect(); this.setStatus('已经到底了', 'is-done'); this.saveSnapshot();
    } else { this.setStatus('继续滚动加载下一页'); }
   } catch (err) {
    errorLog('瀑布流加载失败:', err); this.setStatus('加载失败，点击重试', 'is-error');
   } finally {
    if (state.abortRequest) state.abortRequest = null;
    if (this.isCurrent(state, generation)) state.loading = false;
   } },
  reflow() {
   try {
    this.state.container = SiteManager.reflowInfiniteScroll(this.state.site, this.state.container);
   } catch (err) { errorLog('瀑布流重排失败:', err); }
   window.dispatchEvent(new Event('resize')); }, };
 Core.expose('__LAOSIJI_INFINITE_SCROLL__', InfiniteScroll);
 let pan115ListTimer = null;
 function schedulePan115ListBadges() {
  if (!Pan115.enabled() || SiteManager.isDetailPage()) return;
  clearTimeout(pan115ListTimer);
  pan115ListTimer = setTimeout(renderPan115ListBadges, 300); }
 Core.expose('__LAOSIJI_SCHEDULE_PAN115__', schedulePan115ListBadges); Core.expose('__LAOSIJI_RENDER_BUTTONS__', () => JumpButtons.render());
 const Runtime = {
  refreshTimer: null,
  refreshGeneration: 0,
  cancelScheduledRefresh() { this.refreshGeneration += 1; clearTimeout(this.refreshTimer); this.refreshTimer = null; },
  scheduleRefresh(options = {}, delay = 0) {
   const generation = ++this.refreshGeneration;
   clearTimeout(this.refreshTimer);
   this.refreshTimer = setTimeout(() => {
    if (generation !== this.refreshGeneration) return;
    this.refreshTimer = null;
    this.refresh(options);
   }, Math.max(0, Number(delay) || 0)); },
  refreshForChange(change = {}) {
   const type = typeof change === 'string' ? change : change.type;
   if (type === 'list') {
    return this.refresh({
     detailPreview: false,
     stillsGallery: false,
     titleTranslate: false,
     infiniteScroll: false,
    }); }
   if (type === 'detail') {
    return this.refresh({
     jump: false,
     listPreview: false,
     listOpenNewTab: false,
     portraitCards: false,
     pan115: false,
     infiniteScroll: false,
    }); }
   return this.refresh(); },
  refresh(options = {}) {
   this.cancelScheduledRefresh();
   const {
    jump = true,
    listPreview = true,
    detailPreview = true,
    pan115 = true,
    infiniteScroll = true,
    titleTranslate = true,
    listOpenNewTab = true,
    portraitCards = true,
    stillsGallery = true,
    coverHoverPreview = true,
   } = options;
   if (jump) JumpButtons.render();
   if (listPreview) ListPreview.sync();
   if (listOpenNewTab) ListOpenNewTab.sync();
   if (portraitCards) PortraitCards.apply();
   if (detailPreview) DetailPreviewInline.sync();
   if (typeof DetailCoverDownload !== 'undefined') DetailCoverDownload.sync();
   if (stillsGallery) StillsGallery.sync();
   if (coverHoverPreview) CoverHoverPreview.sync();
   if (pan115) schedulePan115ListBadges();
   if (infiniteScroll) InfiniteScroll.init();
   if (titleTranslate) TitleTranslate.sync();
  },
  refreshListPage() {
   this.refresh({ detailPreview: false, infiniteScroll: false }); },
  refreshListDecorations() {
   if (SiteJavDB.match()) {
    SiteJavDB._stripNativeLayoutParam(); document.querySelectorAll('.movie-list, .movies, .grid').forEach(list => SiteJavDB._neutralizeNativeListLayout(list));
    SiteJavDB._hideNativeLayoutSwitcher(); }
   ListPreview.sync(); ListOpenNewTab.sync(); PortraitCards.apply(); CoverHoverPreview.sync(); schedulePan115ListBadges(); },
  syncPan115(enabled = Pan115.enabled()) {
   syncPan115AfterSettingsSave(enabled); },
  syncInfiniteScroll(enabled = CFG.infiniteScroll) {
   if (enabled) {
    InfiniteScroll.init();
   } else { InfiniteScroll.destroy(); } },
  syncListPreview() {
   ListPreview.sync(); },
  syncCoverHoverPreview() {
   CoverHoverPreview.sync(); },
  syncDetailPreview() {
   DetailPreviewInline.sync(); },
  syncDetailCoverDownload() {
   if (typeof DetailCoverDownload !== 'undefined') DetailCoverDownload.sync();
  },
  syncTitleTranslate() {
   TitleTranslate.sync(); },
  syncListOpenNewTab() {
   ListOpenNewTab.sync(); },
  syncPortraitCards(enabled = CFG.portraitCards) {
   PortraitCards.set(enabled); ListPreview.sync(); },
  syncCardFx(enabled = CFG.cardFx) {
   CardFx.apply(enabled); }, };
 Core.expose('__LAOSIJI_RUNTIME__', Runtime);
 const CardFx = (() => {
  function ensureStyle() {
   injectStyle('jav-card-fx-style',`html[data-laosiji-card-fx="off"] .jav-card{transition:none!important;will-change:auto!important;transform:none!important}html[data-laosiji-card-fx="off"] .jav-card:hover{transform:none!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important;border-color:rgba(148,163,184,.35)!important}.jav-card{content-visibility:auto;contain-intrinsic-size:auto 320px}.jav-card-cover .jav-card-image{transition:opacity .18s ease!important;transform:none!important;will-change:auto!important}html[data-laosiji-card-fx="off"] .jav-card-cover .jav-card-image{transition:transform .22s ease,opacity .18s ease!important}html[data-laosiji-card-fx="off"] .jav-card-cover:hover .jav-card-image,html[data-laosiji-card-fx="off"] .jav-card-link:hover .jav-card-image,html[data-laosiji-card-fx="off"] .jav-card:hover .jav-card-image{transform:scale(1.06)!important}html:not([data-laosiji-card-fx="off"]) .jav-card-cover:hover .jav-card-image,html:not([data-laosiji-card-fx="off"]) .jav-card-link:hover .jav-card-image,html:not([data-laosiji-card-fx="off"]) .jav-card:hover .jav-card-image,html:not([data-laosiji-card-fx="off"]) .movie-list .javdb-grid-card .box:hover .cover img,html:not([data-laosiji-card-fx="off"]) .movies .javdb-grid-card .box:hover .cover img,html:not([data-laosiji-card-fx="off"]) .grid .javdb-grid-card .box:hover .cover img{transform:none!important}`);
  }
  function apply(enabled = CFG.cardFx) {
   ensureStyle();
   const root = document.documentElement;
   if (enabled) root.removeAttribute('data-laosiji-card-fx');
   else root.setAttribute('data-laosiji-card-fx', 'off');
  }
  return { apply };
 })();
 Core.expose('__LAOSIJI_CARD_FX__', CardFx);
 function resetEmbyButtonState() {
  if (!SiteManager.isEmbyPage()) return;
  document.querySelectorAll('.jav-jump-btn-group[data-laosiji-jump="1"]').forEach(el => el.remove());
  document.querySelectorAll('h1[data-enhanced="1"]').forEach(el => delete el.dataset.enhanced); }
 function is123AvHost() { return /(?:^|\.)123av\.com$/i.test(location.hostname); }
 function reset123AvRouteState() {
  if (!is123AvHost()) return;
  document.querySelectorAll('.jav-jump-btn-group[data-laosiji-jump="1"]').forEach(el => el.remove());
  document.querySelectorAll('.watch__title[data-enhanced="1"]').forEach(el => delete el.dataset.enhanced); removePan115Ui(); }
 let mutationSyncTimer = null;
 const runIdle = window.requestIdleCallback ? (fn) => window.requestIdleCallback(fn, { timeout: 600 }) : (fn) => setTimeout(fn, 0);
 const isOwnNode = (node) => {
  if (!node || node.nodeType !== 1) return false;
  try {
   return !!(node.matches?.('[class*="jav-"],[class*="laosiji"],[data-laosiji-grid-card],[data-laosiji-jump]')
    || node.closest?.('[class*="jav-"],[data-laosiji-grid-card]'));
  } catch (e) { return false; } };
 const hasMeaningfulMutation = (records) => {
  try {
   return records.some(r => {
    for (const n of r.addedNodes) { if (!isOwnNode(n)) return true; }
    for (const n of r.removedNodes) { if (!isOwnNode(n)) return true; }
    return false;
   });
  } catch (e) { return true; } };
 const observer = new MutationObserver((records) => {
  if (!hasMeaningfulMutation(records)) return;
  clearTimeout(mutationSyncTimer);
  mutationSyncTimer = setTimeout(() => {
   runIdle(() => Runtime.scheduleRefresh());
  }, 350);
 });
 let lastEmbyLoc = location.href;
 function embyButtonsPresent() {
  const g = document.querySelector('.jav-jump-btn-group[data-laosiji-jump="1"]');
  return !!(g && g.isConnected); }
 let embyRetryTimers = [];
 function clearEmbyRetries() {
  embyRetryTimers.forEach(t => clearTimeout(t));
  embyRetryTimers = []; }
 function embyRenderWithRetry() {
  clearEmbyRetries();
  const delays = [0, 80, 200, 400, 700, 1100, 1700, 2500, 3500, 5000, 6500];
  delays.forEach(d => {
   embyRetryTimers.push(setTimeout(() => {
    JumpButtons.render();
    if (embyButtonsPresent()) clearEmbyRetries();
   }, d));
  }); }
 let routeRefreshTimers = [];
 function clearRouteRefreshRetries() {
  routeRefreshTimers.forEach(t => clearTimeout(t));
  routeRefreshTimers = []; }
 function routeRefreshWithRetry() {
  clearRouteRefreshRetries();
  const delays = [80, 200, 450, 800, 1300, 2200, 3500];
  delays.forEach(d => {
   routeRefreshTimers.push(setTimeout(() => {
    Runtime.scheduleRefresh();
   }, d));
  }); }
 function onEmbyNavigate() {
  if (location.href === lastEmbyLoc) return;
  lastEmbyLoc = location.href;
  Runtime.cancelScheduledRefresh();
  const isEmby = SiteManager.isEmbyPage();
  if (isEmby) {
   resetEmbyButtonState(); embyRenderWithRetry();
  } else if (is123AvHost()) {
   reset123AvRouteState(); routeRefreshWithRetry();
  } else { JumpButtons.render(); } }
 const App = {
  started: false,
  observerReady: false,
  navigationReady: false,
  initRuntimeObserver() {
   if (this.observerReady) return;
   this.observerReady = true;
   if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  },
  initNavigationHooks() {
   if (this.navigationReady) return;
   this.navigationReady = true;
   window.addEventListener('scroll', () => InfiniteScroll.scheduleSnapshotSave(), { passive: true });
   window.addEventListener('pagehide', event => {
    Runtime.cancelScheduledRefresh();
    if (event.persisted) InfiniteScroll.pauseForBfcache();
    else InfiniteScroll.saveSnapshot();
   });
   window.addEventListener('pageshow', e => {
    if (e.persisted) setTimeout(() => InfiniteScroll.resumeFromBfcache(), 0);
   });
   window.addEventListener('hashchange', onEmbyNavigate); window.addEventListener('popstate', onEmbyNavigate);
   (function hookHistory() {
    const wrap = (type) => {
     const orig = history[type];
     if (typeof orig !== 'function') return;
     history[type] = function () {
      const ret = orig.apply(this, arguments);
      setTimeout(onEmbyNavigate, 0);
      return ret; }; };
    wrap('pushState'); wrap('replaceState');
   })(); },
  init() {
   if (this.started) return;
   this.started = true;
   const start = () => this._start();
   if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
    return; }
   start(); },
  _start() {
   MobilePolicy.start(); MobileSettingsEntry.install(); Pan115SettingsEntry.install(); CardFx.apply(MobilePolicy.featureEnabled('cardFx', CFG.cardFx));
   Trailer.installFallbackDebugHelper(); this.initRuntimeObserver(); this.initNavigationHooks(); SiteManager.setupJavDbGuards();
   if (location.hostname.includes('javdb') && location.pathname.startsWith('/v/')) {
    setTimeout(mainRun, 600);
   } else { mainRun(); }
   if (SiteManager.isEmbyPage()) {
    embyRenderWithRetry();
    Runtime.refresh({ jump: false });
   } else {
    Runtime.refresh();
    Runtime.scheduleRefresh({}, 3000); } }, };
 Core.expose('__LAOSIJI_APP__', App); App.init();
})();
