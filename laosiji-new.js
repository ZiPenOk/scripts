// ==UserScript==
// @name         JAV老司机-新
// @namespace    https://github.com/ZiPenOk/scripts
// @version      2.6.8.1
// @description  增强 JavBus、JavDB、JavLibrary 等 JAV 站点的浏览与检索体验：提供磁力搜索表、BT 引擎聚合、115 匹配与播放入口、番号复制、跨站搜索/跳转、预告片解析播放、多源预览图、标题翻译、卡片布局、横竖图切换、列数与页面缩放、详情页比例调整、剧照浏览、瀑布流加载、JavDB 榜单/TOP250页面增强、FC2 页面渲染和统一设置面板；并在 Sukebei、SupJav、MissAV、Jable、Emby、Javrate、Sehuatang、HJD2048 等页面提供番号识别与快捷跳转入口。
// @author       ZiPenOk
// @icon         https://img.sh1nyan.fun/file/1778560196416_laosiji.png
// @match        *://*.javlibrary.com/*
// @match        *://javlibrary.com/*
// @match        *://*.javbus.com/*
// @match        *://javbus.com/*
// @include      *://*javdb*.com/*
// @match        *://sukebei.nyaa.si/*
// @match        *://169bbs.com/*
// @match        *://supjav.com/*
// @match        *://javrate.com/*
// @match        *://www.javrate.com/*
// @match        *://sehuatang.net/*
// @match        *://hjd2048.com/2048/*
// @match        *://jable.tv/*
// @include      /^[^:]*?:\/\/missav\.[^/]*?\/.*?$/
// @include      /^[^:]*?:\/\/emby\.[^/]*?\/web\/index\.html.*?$/
// @include      /^[^:]*?:\/\/10\.[^/]*?:[^/]*?\/web\/index\.html.*?$/
// @run-at       document-idle
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
    const SCRIPT_VERSION = '2.6.8.1';
    const DEBUG_LOG = false;
    const ERROR_LOG = true;
    const PAGE_ZOOM_DEFAULT = 86;
    const JAVDB_REVIEW_INITIAL_LIMIT = 6;
    const JAVDB_REVIEW_MORE_LIMIT = 20;
    const CFG = {};
    const resolveCfgDefault = meta => typeof meta.def === 'function' ? meta.def() : meta.def;
    const clampCfgNumber = (value, meta) => {
        const fallback = resolveCfgDefault(meta);
        const parsed = parseInt(value, 10);
        const next = Number.isFinite(parsed) ? parsed : fallback;
        return Math.min(meta.max, Math.max(meta.min, next));
    };
    const normalizeCfgValue = (value, meta) => {
        if (meta.normalize) return meta.normalize(value);
        if (meta.bool) return !!value;
        if (Number.isFinite(meta.min) && Number.isFinite(meta.max)) return clampCfgNumber(value, meta);
        return value;
    };
    const CFG_MAP = {
        javdbSearchUrl: { key: 'cfg_javdb_search_url', def: 'javdb.com' },
        ciligouUrl: { key: 'cfg_ciligou_url', def: 'clg55.top' },
        btdigUrl: { key: 'cfg_btdig_url', def: 'btdig.com' },
        btsearchUrl: { key: 'cfg_btsearch_url', def: 'btsearch.love' },
        sukebeiUrl: { key: 'cfg_sukebei_url', def: 'sukebei.nyaa.si' },
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
        javbusPageZoom: { key: 'cfg_javbus_page_zoom', def: PAGE_ZOOM_DEFAULT, min: 60, max: 100 },
        javdbPageZoom: { key: 'cfg_javdb_page_zoom', def: PAGE_ZOOM_DEFAULT, min: 60, max: 100 },
        javlibPageZoom: { key: 'cfg_javlib_page_zoom', def: PAGE_ZOOM_DEFAULT, min: 60, max: 100 },
        listPreviewQuick: { key: 'list_preview_quick_enabled', def: true, bool: true },
        detailPreviewInline: { key: 'detail_preview_inline_enabled', def: true, bool: true },
        titleTranslate: { key: 'title_translate_enabled', def: true, bool: true },
        listOpenNewTab: { key: 'list_open_new_tab_enabled', def: false, bool: true },
        portraitCards: { key: 'portrait_cards_enabled', def: false, bool: true },
        reviewsDefaultExpanded: { key: 'reviews_default_expanded', def: false, bool: true },
        thumbSourceOrder: { key: 'thumb_source_order', def: () => ['javfree', 'projectjav', 'javstore'] },
        detailFlex: { key: 'detail_flex_settings', def: () => ({}), normalize: value => value || {} },
        btnShowNyaa: { key: 'btn_show_nyaa', def: true, bool: true },
        btnShowJavbus: { key: 'btn_show_javbus', def: true, bool: true },
        btnShowJavdb: { key: 'btn_show_javdb', def: true, bool: true },
        btnShowMissav: { key: 'btn_show_missav', def: true, bool: true },
        btnShowFanza: { key: 'btn_show_fanza', def: true, bool: true },
        btnShowSearch: { key: 'btn_show_search', def: true, bool: true },
        btnShowTrailer: { key: 'btn_show_trailer', def: true, bool: true },
        btnShowPreview: { key: 'btn_show_preview', def: true, bool: true },
        btnShowPan115: { key: 'btn_show_pan115', def: false, bool: true },
        magnetTable: { key: 'magnet_table_enabled', def: true, bool: true },
        infiniteScroll: { key: 'infinite_scroll_enabled', def: false, bool: true },
        cardFx: { key: 'card_fx_enabled', def: true, bool: true },
        coverHoverPreview: { key: 'cover_hover_preview_enabled', def: false, bool: true },
    };
    Object.entries(CFG_MAP).forEach(([prop, meta]) => {
        Object.defineProperty(CFG, prop, {
            get() {
                return normalizeCfgValue(GM_getValue(meta.key, resolveCfgDefault(meta)), meta);
            },
            set(value) {
                GM_setValue(meta.key, normalizeCfgValue(value, meta));
            },
        });
    });
    function injectStyle(id, css, update = false) {
        let style = document.getElementById(id);
        if (style) {
            if (update && style.textContent !== css) style.textContent = css;
            return style;
        }
        style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
        return style;
    }
    function isPortraitCardsPageAllowed(siteId, href = location.href) {
        let url;
        try {
            url = new URL(href, location.href);
        } catch {
            return true;
        }
        const path = url.pathname.replace(/\/+$/, '') || '/';
        const params = url.searchParams;
        if (siteId === 'javbus') {
            return !/^\/(?:[a-z]{2}\/)?uncensored(?:\/|$)/i.test(path);
        }
        if (siteId === 'javdb') {
            const rankType = (params.get('t') || '').toLowerCase();
            const tagName = (path.match(/^\/tags\/([^/]+)$/i)?.[1] || '').toLowerCase();
            const isC10 = params.get('c10') === '1';
            if (params.get('laosiji_detail') === 'fc2' || params.get('laosiji_rank') === 'fc2' || params.get('laosiji_fc2') === '1') return false;
            if (path === '/fc2') return false;
            if (path === '/uncensored' || path === '/western') return false;
            if (path === '/rankings/movies' && /^(uncensored|western|fc2)$/i.test(rankType)) return false;
            if (path === '/tags/fc2') return false;
            if (isC10 && /^(anime|uncensored|western)$/i.test(tagName)) return false;
        }
        return true;
    }
    function usePortraitCardsOnPage(siteId) {
        return !!CFG.portraitCards && isPortraitCardsPageAllowed(siteId);
    }
    const CardColumns = (() => {
        const LIMITS = { min: 2, max: 10 };
        const SITE_META = {
            javbus: { getter: () => CFG.javbusCardColumns, setter: v => { CFG.javbusCardColumns = v; }, portraitGetter: () => CFG.javbusPortraitCardColumns, portraitSetter: v => { CFG.javbusPortraitCardColumns = v; }, selector: '.javbus-card-grid', host: /(?:^|\.)javbus\.com$/i },
            javdb:  { getter: () => CFG.javdbCardColumns,  setter: v => { CFG.javdbCardColumns = v; },  portraitGetter: () => CFG.javdbPortraitCardColumns,  portraitSetter: v => { CFG.javdbPortraitCardColumns = v; },  selector: '.javdb-card-grid',  host: /javdb/i },
            javlib: { getter: () => CFG.javlibCardColumns, setter: v => { CFG.javlibCardColumns = v; }, portraitGetter: () => CFG.javlibPortraitCardColumns, portraitSetter: v => { CFG.javlibPortraitCardColumns = v; }, selector: '.javlib-card-grid', host: /(javlibrary|javlib|r86m|s87n)/i },
        };
        function clamp(value) {
            return Math.min(LIMITS.max, Math.max(LIMITS.min, parseInt(value, 10) || 5));
        }
        function get(siteId) {
            const meta = SITE_META[siteId];
            if (!meta) return 5;
            return clamp((usePortraitCardsOnPage(siteId) ? meta.portraitGetter : meta.getter)());
        }
        function set(siteId, value) {
            const meta = SITE_META[siteId];
            if (!meta) return;
            (usePortraitCardsOnPage(siteId) ? meta.portraitSetter : meta.setter)(clamp(value));
        }
        function apply(siteId, value = get(siteId)) {
            const meta = SITE_META[siteId];
            if (!meta) return;
            document.querySelectorAll(meta.selector).forEach(el => {
                el.style.setProperty('--jav-card-columns', String(clamp(value)));
            });
        }
        function detectCurrentSite() {
            const host = location.hostname;
            return Object.entries(SITE_META).find(([, meta]) => meta.host.test(host))?.[0] || '';
        }
        return { LIMITS, clamp, get, set, apply, detectCurrentSite };
    })();
    const PortraitCards = (() => {
        function enabled() {
            return !!CFG.portraitCards;
        }
        function ensureStyle() {
            injectStyle('jav-portrait-cards-style', `html.jav-card-portrait-mode .jav-card-grid{gap:14px!important}html.jav-card-portrait-mode .jav-card-cover{aspect-ratio:380 / 538!important;background:#f1f5f9!important}html.jav-card-portrait-mode .jav-card-image{object-fit:cover!important;object-position:right center!important}html.jav-card-portrait-mode .javbus-card-title{min-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+58px)!important}html.jav-card-portrait-mode .javdb-card-title{height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;max-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;min-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important}html.jav-card-portrait-mode .javlib-card-title{min-height:calc((var(--javlib-title-line-height,22px) * var(--jav-card-title-lines,2))+54px)!important}`);
        }
        function javbusCoverFromThumb(src) {
            let full = String(src || '').replace(/\/(imgs|pics)\/(thumb|thumbs)\//i, '/$1/cover/');
            if (!/nopic\.jpg/i.test(full)) full = full.replace(/(\.jpg|\.jpeg|\.png)(?:([?#].*)?)$/i, '_b$1$2');
            return full;
        }
        function syncJavbusImage(img, on) {
            if (!img) return;
            const thumb = img.dataset.laosijiThumbSrc || '';
            if (!thumb) return;
            if (!img.dataset.laosijiCoverSrc) img.dataset.laosijiCoverSrc = javbusCoverFromThumb(thumb);
            const next = img.dataset.laosijiCoverSrc || thumb;
            if (next && img.getAttribute('src') !== next) {
                img.src = next;
                img.setAttribute('src', next);
            }
        }
        function syncJavlibImage(img, on) {
            if (!img) return;
            const current = img.getAttribute('src') || '';
            if (!img.dataset.laosijiLandscapeSrc && /ps\.jpg(?:[?#].*)?$/i.test(current)) {
                img.dataset.laosijiLandscapeSrc = current.replace(/ps\.jpg((?:[?#].*)?)$/i, 'pl.jpg$1');
            }
            if (!img.dataset.laosijiLandscapeSrc && /pl\.jpg(?:[?#].*)?$/i.test(current)) {
                img.dataset.laosijiLandscapeSrc = current;
            }
            const next = img.dataset.laosijiLandscapeSrc;
            if (next && img.getAttribute('src') !== next) {
                img.src = next;
                img.setAttribute('src', next);
            }
        }
        function syncJavdbImage(img, on) {
            if (!img) return;
            const current = img.getAttribute('src') || '';
            if (!img.dataset.laosijiLandscapeSrc && /\/thumbs\//i.test(current)) {
                img.dataset.laosijiLandscapeSrc = current.replace(/\/thumbs\//i, '/covers/');
            }
            if (!img.dataset.laosijiLandscapeSrc && /\/covers\//i.test(current)) {
                img.dataset.laosijiLandscapeSrc = current;
            }
            const next = img.dataset.laosijiLandscapeSrc;
            if (next && img.getAttribute('src') !== next) {
                img.src = next;
                img.setAttribute('src', next);
            }
        }
        function effective(siteId = CardColumns.detectCurrentSite()) {
            return usePortraitCardsOnPage(siteId);
        }
        function syncImages(on = effective()) {
            document.querySelectorAll('.javbus-card-image').forEach(img => syncJavbusImage(img, on));
            document.querySelectorAll('.javdb-card-image').forEach(img => syncJavdbImage(img, on));
            document.querySelectorAll('.javlib-card-image').forEach(img => syncJavlibImage(img, on));
        }
        function apply(on = enabled()) {
            ensureStyle();
            const site = CardColumns.detectCurrentSite();
            const active = !!on && isPortraitCardsPageAllowed(site);
            document.documentElement.classList.toggle('jav-card-portrait-mode', active);
            syncImages(active);
            if (site) CardColumns.apply(site);
        }
        function set(value) {
            CFG.portraitCards = !!value;
            apply(!!value);
        }
        return { enabled, effective, apply, set, syncImages };
    })();
    const PageZoom = (() => {
        const LIMITS = { min: 60, max: 100 };
        const SITE_META = {
            javbus: { getter: () => CFG.javbusPageZoom, setter: v => { CFG.javbusPageZoom = v; }, selector: 'body > div.container-fluid, body > div.container', host: /(?:^|\.)javbus\.com$/i },
            javdb:  { getter: () => CFG.javdbPageZoom,  setter: v => { CFG.javdbPageZoom = v; },  selector: 'body > section > div',     host: /javdb/i },
            javlib: { getter: () => CFG.javlibPageZoom, setter: v => { CFG.javlibPageZoom = v; }, selector: '#content',                 host: /(javlibrary|javlib|r86m|s87n)/i },
        };
        function clamp(value) {
            return Math.min(LIMITS.max, Math.max(LIMITS.min, parseInt(value, 10) || 100));
        }
        function get(siteId) {
            return SITE_META[siteId] ? clamp(SITE_META[siteId].getter()) : 100;
        }
        function set(siteId, value) {
            if (!SITE_META[siteId]) return;
            SITE_META[siteId].setter(clamp(value));
        }
        function isJavbusActorIndexPage(url = location.href) {
            try {
                const path = new URL(url, location.href).pathname.replace(/\/+$/, '');
                return /^\/(?:[a-z]{2}\/)?(?:uncensored\/)?actresses(?:\/\d+)?$/i.test(path);
            } catch (err) {
                return false;
            }
        }
        function reflowJavbusActorWaterfall() {
            const waterfall = document.querySelector('#waterfall');
            if (!waterfall || !waterfall.querySelector('.avatar-box')) return;
            waterfall.style.removeProperty('width');
            waterfall.style.setProperty('max-width', '100%', 'important');
            waterfall.style.setProperty('margin-left', 'auto', 'important');
            waterfall.style.setProperty('margin-right', 'auto', 'important');
            const run = () => {
                const jq = window.jQuery || window.$;
                try {
                    const $waterfall = jq && jq(waterfall);
                    if ($waterfall?.masonry) {
                        $waterfall.masonry({ itemSelector: '.item', isFitWidth: true });
                        ['reloadItems', 'reload', 'layout'].forEach(method => {
                            try { $waterfall.masonry(method); } catch (err) {  }
                        });
                    }
                } catch (err) {  }
                window.dispatchEvent(new Event('resize'));
            };
            requestAnimationFrame(run);
            setTimeout(run, 160);
        }
        function apply(siteId, value = get(siteId)) {
            const meta = SITE_META[siteId];
            if (!meta) return;
            const zoomValue = clamp(value);
            const widthValue = `${zoomValue}%`;
            if (siteId === 'javlib') {
                const content = document.querySelector('#content');
                if (content) {
                    content.style.setProperty('zoom', '1');
                    content.style.setProperty('width', widthValue, 'important');
                    content.style.setProperty('max-width', 'none', 'important');
                    content.style.setProperty('margin-left', 'auto', 'important');
                    content.style.setProperty('margin-right', 'auto', 'important');
                    content.style.setProperty('box-sizing', 'border-box', 'important');
                    content.style.setProperty('padding-left', '12px', 'important');
                    content.style.setProperty('padding-right', '12px', 'important');
                    content.style.setProperty('min-width', '0', 'important');
                    content.style.setProperty('overflow', 'visible', 'important');
                }
                document.documentElement?.style.setProperty('background', '#fff', 'important');
                document.body?.style.setProperty('background', '#fff', 'important');
                document.querySelectorAll('#page, #content, #rightcolumn').forEach(el => {
                    el?.style.setProperty('background', '#fff', 'important');
                    el?.style.setProperty('box-sizing', 'border-box', 'important');
                    el?.style.setProperty('max-width', '100%', 'important');
                    el?.style.setProperty('overflow', 'visible', 'important');
                });
                document.querySelectorAll('#rightcolumn > .videothumblist, #rightcolumn > .videothumblist .videos').forEach(el => {
                    el.style.setProperty('box-sizing', 'border-box', 'important');
                    el.style.setProperty('max-width', '100%', 'important');
                });
                return;
            }
            document.querySelectorAll(meta.selector).forEach(el => {
                if (!el) return;
                el.style.setProperty('zoom', '1');
                el.style.setProperty('width', widthValue, 'important');
                el.style.setProperty('max-width', 'none', 'important');
                el.style.setProperty('margin-left', 'auto', 'important');
                el.style.setProperty('margin-right', 'auto', 'important');
                el.style.setProperty('box-sizing', 'border-box', 'important');
            });
            if (siteId === 'javbus' && isJavbusActorIndexPage()) {
                reflowJavbusActorWaterfall();
            }
        }
        function detectCurrentSite() {
            const host = location.hostname;
            return Object.entries(SITE_META).find(([, meta]) => meta.host.test(host))?.[0] || '';
        }
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
            javlib: { cover: 100, info: 85, magnet: 100 },
        };
        const META = {
            javbus: {
                host: /(?:^|\.)javbus\.com$/i,
                detail: () => !!document.querySelector('.row.movie') && !document.querySelector('#waterfall div.item'),
                root: () => document.querySelector('.row.movie'),
                vars: { cover: '--javbus-cover-flex', info: '--javbus-info-flex', magnet: '--javbus-magnet-flex' },
            },
            javdb: {
                host: /javdb/i,
                detail: () => /\/v\//i.test(location.pathname),
                root: () => document.querySelector('.jav-flex-container'),
                vars: { cover: '--javdb-cover-flex', info: '--javdb-info-flex', magnet: '--javdb-magnet-flex' },
            },
            javlib: {
                host: /(javlibrary|javlib|r86m|s87n)/i,
                detail: () => !!document.querySelector('#video_jacket_info #video_info, #video_id .text'),
                root: () => document.querySelector('#video_jacket_info tr'),
                vars: { cover: '--javlib-cover-flex', info: '--javlib-info-flex', magnet: '--javlib-magnet-flex' },
            },
        };
        function clamp(value) {
            return Math.min(LIMITS.max, Math.max(LIMITS.min, parseInt(value, 10) || 100));
        }
        function detectCurrentSite() {
            const host = location.hostname;
            return Object.entries(META).find(([, meta]) => meta.host.test(host) && meta.detail())?.[0] || '';
        }
        function getAll() {
            const saved = CFG.detailFlex;
            return saved && typeof saved === 'object' ? saved : {};
        }
        function get(siteId) {
            const all = getAll();
            const defaults = DEFAULTS[siteId] || DEFAULTS.javbus;
            const saved = all[siteId] || {};
            return {
                cover: clamp(saved.cover ?? defaults.cover),
                info: clamp(saved.info ?? defaults.info),
                magnet: clamp(saved.magnet ?? defaults.magnet),
            };
        }
        function set(siteId, key, value) {
            if (!META[siteId] || !DEFAULTS[siteId] || !DEFAULTS[siteId].hasOwnProperty(key)) return;
            const all = getAll();
            all[siteId] = { ...get(siteId), [key]: clamp(value) };
            CFG.detailFlex = all;
        }
        function toFlex(value) {
            return (clamp(value) / 100).toFixed(2).replace(/\.?0+$/, '');
        }
        function defaultCss(siteId = detectCurrentSite()) {
            const values = DEFAULTS[siteId] || DEFAULTS.javbus;
            return {
                cover: toFlex(values.cover),
                info: toFlex(values.info),
                magnet: toFlex(values.magnet),
            };
        }
        function hasMagnet(siteId = detectCurrentSite()) {
            if (!siteId || !CFG.magnetTable) return false;
            return !!document.querySelector('.jav-nong-slot');
        }
        function hasLayout(siteId = detectCurrentSite()) {
            const meta = META[siteId];
            return !!meta?.root?.();
        }
        function apply(siteId = detectCurrentSite()) {
            const meta = META[siteId];
            if (!meta) return;
            const root = meta.root();
            if (!root) return;
            const values = get(siteId);
            root.style.setProperty(meta.vars.cover, toFlex(values.cover));
            root.style.setProperty(meta.vars.info, toFlex(values.info));
            if (hasMagnet(siteId)) {
                root.style.setProperty(meta.vars.magnet, toFlex(values.magnet));
            }
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
            return value;
        },
    };
    Core.expose('__LAOSIJI_CORE__', Core);
    const VIDEO_ENGINES = [
        { key: 'missav', label: 'MissAV', host: /missav\.(com|ai|ws)/i, color: '#ec4899' },
        { key: 'jable',  label: 'Jable',  host: /jable\.tv/i, color: '#f97316' },
        { key: '123av',  label: '123AV',  host: /123av\.com/i, color: '#10b981' },
        { key: 'javday', label: 'JavDay', host: /javday\.app/i, color: '#0ea5e9' },
        { key: 'supjav', label: 'SupJav', host: /supjav\.com/i, color: '#ef4444' },
        { key: 'javrate', label: 'JavRate', host: /javrate\.com/i, color: '#8b5cf6' },
    ];
    Core.expose('__LAOSIJI_VIDEO_ENGINES__', VIDEO_ENGINES);
    const Ui = {
        on(el, event, handler, options) {
            if (!el || typeof handler !== 'function') return null;
            el.addEventListener(event, handler, options);
            return el;
        },
        click(el, handler, options) {
            return this.on(el, 'click', handler, options);
        },
        bindCheckbox(el, checked, onChange) {
            if (!el) return null;
            el.checked = !!checked;
            this.on(el, 'change', () => onChange?.(el.checked, el));
            return el;
        },
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
            return el;
        },
        setSelectValue(select, value, fallback = '') {
            if (!select) return '';
            const options = [...select.options];
            const next = options.some(opt => opt.value === value) ? value : fallback;
            if (next && options.some(opt => opt.value === next)) {
                select.value = next;
            } else if (options.length) {
                select.selectedIndex = 0;
            }
            return select.value;
        },
        clearSessionByPrefixes(prefixes) {
            let count = 0;
            Object.keys(sessionStorage).forEach(key => {
                if (prefixes.some(prefix => key.startsWith(prefix))) {
                    sessionStorage.removeItem(key);
                    count += 1;
                }
            });
            return count;
        },
    };
    Core.expose('__LAOSIJI_UI__', Ui);
    function getNotifyTone(title, text) {
        const raw = `${title || ''} ${text || ''}`;
        if (/失败|錯誤|错误|未登录|未登入|异常|失效|无法|失敗|請先|请先/i.test(raw)) return 'error';
        if (/成功|已保存|已添加|任务已添加|已保存授权|登录成功/i.test(raw)) return 'success';
        return 'info';
    }
    function showPageNotify(title, text, url) {
        const parent = document.body || document.documentElement;
        if (!parent) return;
        injectStyle('jav-page-notify-style', `.jav-page-notify{position:fixed;top:76px;right:22px;z-index:2147483647;width:min(360px,calc(100vw - 28px));padding:12px 14px;color:#f8fafc;background:rgba(15,23,42,.94);border:1px solid rgba(148,163,184,.28);border-left:4px solid #38bdf8;border-radius:10px;box-shadow:0 16px 42px rgba(0,0,0,.32),0 0 0 1px rgba(255,255,255,.04) inset;backdrop-filter:blur(14px) saturate(1.1);font-family:Arial,"Microsoft YaHei",sans-serif;transform:translateY(-10px);opacity:0;pointer-events:auto;transition:opacity .18s ease,transform .18s ease;cursor:default}.jav-page-notify.is-clickable{cursor:pointer}.jav-page-notify.is-success{border-left-color:#22c55e}.jav-page-notify.is-error{border-left-color:#ef4444}.jav-page-notify.show{opacity:1;transform:translateY(0)}.jav-page-notify.hide{opacity:0;transform:translateY(-10px)}.jav-page-notify-title{margin:0 0 4px;font-size:14px;font-weight:800;line-height:1.35}.jav-page-notify-text{margin:0;color:#dbeafe;font-size:13px;line-height:1.45}@media (max-width:720px){.jav-page-notify{top:14px;right:14px;width:calc(100vw - 28px)}}`);
        document.querySelector('.jav-page-notify')?.remove();
        const toast = document.createElement('div');
        toast.className = `jav-page-notify is-${getNotifyTone(title, text)}${url ? ' is-clickable' : ''}`;
        toast.setAttribute('role', 'status');
        if (url) {
            toast.title = '点击打开相关页面';
            toast.addEventListener('click', () => window.open(url, '_blank', 'noopener,noreferrer'));
        }
        const titleEl = document.createElement('p');
        titleEl.className = 'jav-page-notify-title';
        titleEl.textContent = title || 'JAV 老司机';
        toast.appendChild(titleEl);
        if (text) {
            const textEl = document.createElement('p');
            textEl.className = 'jav-page-notify-text';
            textEl.textContent = text;
            toast.appendChild(textEl);
        }
        parent.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 240);
        }, 3400);
    }
    function notify(title, text, url) {
        showPageNotify(title, text, url);
    }
    function addJavdbApiLoginStyles() {
        if (document.getElementById('javdb-api-login-style')) return;
        const style = document.createElement('style');
        style.id = 'javdb-api-login-style';
        style.textContent = `#javdb-api-login-overlay{position:fixed;inset:0;z-index:10000030;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.48);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#javdb-api-login-overlay .javdb-api-login-panel{width:min(360px,92vw);padding:22px;border-radius:12px;background:#fff;color:#111827;box-shadow:0 22px 60px rgba(15,23,42,.26);border:1px solid rgba(148,163,184,.38)}#javdb-api-login-overlay .javdb-api-login-title{margin-bottom:16px;font-size:18px;font-weight:800}#javdb-api-login-overlay .javdb-api-login-input{width:100%;height:40px;margin-bottom:12px;padding:0 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;font-size:14px;outline:none;box-sizing:border-box}#javdb-api-login-overlay .javdb-api-login-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}#javdb-api-login-overlay .javdb-api-login-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:4px}#javdb-api-login-overlay button,.javdb-api-login-inline{min-height:34px;padding:0 14px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;font-size:13px;font-weight:800;cursor:pointer}#javdb-api-login-overlay .javdb-api-login-submit,.javdb-api-login-inline{border-color:#2563eb;background:#2563eb;color:#fff}#javdb-api-login-overlay button:disabled{cursor:wait;opacity:.72}#javdb-api-login-overlay .javdb-api-login-tip{margin-top:12px;color:#64748b;font-size:12px;line-height:1.6}`;
        document.head.appendChild(style);
    }
    function parseHTML(str) {
        return new DOMParser().parseFromString(str, 'text/html');
    }
    function gmFetch(url, opts = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                timeout: 20000,
                ...opts,
                url,
                onload(r) {
                    r.loadstuts = true;
                    resolve(r);
                },
                onerror(r)   { r.loadstuts = false; resolve(r); },
                onabort(r)   { r.loadstuts = false; resolve(r); },
                ontimeout(r) { r.loadstuts = false; r.finalUrl = url; resolve(r); },
            });
        });
    }
    function normalizeAvid(raw) {
        if (!raw) return '';
        raw = raw.trim().toUpperCase();
        if (raw.match(/-[^0]/)) return raw;
        if (raw.match(/^[0-9_-]+$/)) return raw;
        const m = raw.match(/^([A-Z]+[-_]?)(\d+)$/);
        if (m) return m[1].replace(/[-_]$/, '') + '-' + m[2];
        return raw;
    }
    function insertAvidCopyBtn(anchor, avid, nativeCopyBtn = null, append = false) {
        if (!anchor || !avid) return;
        const code = normalizeAvid(avid);
        const parent = anchor.parentElement || anchor;
        parent.querySelectorAll('.jav-avid-copy').forEach(btn => btn.remove());
        nativeCopyBtn?.style.setProperty('display', 'none', 'important');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'jav-avid-copy';
        btn.textContent = '复制番号';
        btn.title = `复制番号：${code}`;
        btn.style.cssText = 'display:inline-block;margin-left:8px;padding:2px 8px;font-size:12px;background:#e8f4fd;border:1px solid #90c5e8;border-radius:4px;cursor:pointer;color:#1a6fa8;vertical-align:middle;white-space:nowrap;';
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            GM_setClipboard(code);
            btn.textContent = '已复制';
            setTimeout(() => { btn.textContent = '复制番号'; }, 900);
        });
        if (append) anchor.appendChild(btn);
        else anchor.after(btn);
    }
    const SettingsPanel = (() => {
        const MAGNET_ENGINES = [
            { key: 'javdbSearchUrl',  label: 'JavDB',        placeholder: 'javdb.com' },
            { key: 'ciligouUrl',      label: 'CiliGou',      placeholder: 'clg55.top' },
            { key: 'btdigUrl',        label: 'BtDig',        placeholder: 'btdig.com' },
            { key: 'btsearchUrl',     label: 'BTSearch',     placeholder: 'btsearch.love' },
            { key: 'sukebeiUrl',      label: 'Sukebei',      placeholder: 'sukebei.nyaa.si' },
            { key: 'sokittyUrl',      label: 'SoKitty',      placeholder: 'w1.sokitty.me' },
        ];
        const JUMP_SEARCH_ENGINES = ['BTDigg', 'Taocili', 'Google', 'Bing', 'DuckGo'];
        const BUTTON_TOGGLE_META = [
            ['nyaa', 'btnShowNyaa'],
            ['javbus', 'btnShowJavbus'],
            ['javdb', 'btnShowJavdb'],
            ['missav', 'btnShowMissav'],
            ['fanza', 'btnShowFanza'],
            ['search', 'btnShowSearch'],
            ['trailer', 'btnShowTrailer'],
            ['preview', 'btnShowPreview'],
        ];
        const THUMB_META = {
            javfree:    { label: 'javfree.me',     color: '#16a34a' },
            projectjav: { label: 'projectjav.com', color: '#ca8a04' },
            javstore:   { label: 'javstore.net',   color: '#dc2626' },
        };
        const stripProtocol = value => String(value || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
        function open() {
            document.getElementById('jav-settings-overlay')?.remove();
            GM_addStyle(`#jav-settings-overlay{position:fixed;inset:0;z-index:10000020;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(7px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#jav-settings-panel{width:min(800px,94vw);max-height:88vh;background:linear-gradient(180deg,#f8fbff 0%,#f6f3ff 46%,#fff7ed 100%);color:#111827;border:1px solid rgba(148,163,184,.38);border-radius:16px;box-shadow:0 26px 76px rgba(15,23,42,.36);display:flex;flex-direction:column;overflow:hidden}#jav-settings-panel *{box-sizing:border-box}#jav-settings-panel .sp-header{padding:18px 22px;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 54%,#7c2d12 100%);border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:space-between}#jav-settings-panel .sp-title{font-size:18px;font-weight:750;color:#fff}#jav-settings-panel .sp-close{width:32px;height:32px;border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:18px;line-height:1}#jav-settings-panel .sp-close:hover{background:rgba(255,255,255,.18)}#jav-settings-panel .sp-body{padding:18px 22px;overflow:auto;display:grid;gap:14px}#jav-settings-panel .sp-card{position:relative;background:rgba(255,255,255,.92);border:1px solid rgba(203,213,225,.88);border-radius:10px;padding:15px;box-shadow:0 10px 24px rgba(15,23,42,.06);overflow:hidden}#jav-settings-panel .sp-card::before{content:'';position:absolute;left:0;top:0;width:4px;height:100%;background:#2563eb}#jav-settings-panel .sp-card-magnet::before{background:#16a34a}#jav-settings-panel .sp-card-defaults::before{background:#2563eb}#jav-settings-panel .sp-card-features::before{background:#00a85a}#jav-settings-panel .sp-card-order::before{background:#dc2626}#jav-settings-panel .sp-card-title{font-size:13px;font-weight:750;color:#1e293b;margin-bottom:12px}#jav-settings-panel .sp-card-jump::before{background:#6366f1}#jav-settings-panel .sp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}#jav-settings-panel .sp-feature-order-row{display:grid;grid-template-columns:2fr 1fr;gap:14px;align-items:stretch}#jav-settings-panel .sp-feature-order-row>.sp-card{height:100%}#jav-settings-panel .sp-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#jav-settings-panel .sp-feature-item{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;padding:10px 11px;border:1px solid #e2e8f0;border-radius:8px;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%)}#jav-settings-panel .sp-feature-item:has(#sp-magnet-table){order:1;grid-column:1}#jav-settings-panel .sp-feature-item:has(#sp-clear-preview-cache){order:2;grid-column:1}#jav-settings-panel .sp-feature-item:has(#sp-clear-trailer-cache){order:2;grid-column:2}#jav-settings-panel .sp-feature-item .sp-desc{margin-top:2px;font-size:11px}#jav-settings-panel .sp-feature-select{order:1;grid-column:2;display:grid;grid-template-columns:1fr 64px;align-items:center;gap:10px;min-width:0;padding:10px 11px;border:1px solid #e2e8f0;border-radius:8px;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%)}#jav-settings-panel .sp-feature-select .sp-select{height:28px;padding:3px 2px 3px 4px;font-size:12px;text-align:left}#jav-settings-panel .sp-cache-clean{background:linear-gradient(135deg,#fff 0%,#f8fbff 58%,#f0f9ff 100%)}#jav-settings-panel .sp-cache-clear-btn{position:relative;width:34px;height:34px;flex:0 0 auto;display:grid;place-items:center;border:1px solid #bae6fd;border-radius:10px;background:linear-gradient(180deg,#f0f9ff,#fff);color:#0284c7;cursor:pointer;overflow:hidden;transition:transform .16s,border-color .16s,background .16s,color .16s,box-shadow .16s}#jav-settings-panel .sp-cache-clear-btn::after{content:'';position:absolute;inset:-8px;border-radius:inherit;background:radial-gradient(circle,rgba(14,165,233,.22),transparent 62%);opacity:0;transform:scale(.45);transition:opacity .22s,transform .22s}#jav-settings-panel .sp-cache-clear-btn:hover{transform:translateY(-1px);border-color:#38bdf8;color:#0369a1;box-shadow:0 8px 18px rgba(14,165,233,.18)}#jav-settings-panel .sp-cache-clear-btn:active{transform:translateY(0) scale(.96)}#jav-settings-panel .sp-cache-clear-btn.is-clearing::after{opacity:1;transform:scale(1)}#jav-settings-panel .sp-cache-clear-btn.is-done{border-color:#86efac;background:linear-gradient(180deg,#ecfdf5,#fff);color:#15803d}#jav-settings-panel .sp-cache-clear-icon{position:relative;z-index:1;display:inline-block;font-size:15px;line-height:1}#jav-settings-panel .sp-cache-clear-btn.is-clearing .sp-cache-clear-icon{animation:spCacheSpin .48s ease}@keyframes spCacheSpin{to{transform:rotate(360deg)}}#jav-settings-panel .sp-field{display:flex;flex-direction:column;gap:6px;min-width:0}#jav-settings-panel .sp-label{font-size:12px;font-weight:650;color:#475569}#jav-settings-panel .sp-input,#jav-settings-panel .sp-select{width:100%;min-width:0;height:34px;padding:6px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-size:13px;outline:none}#jav-settings-panel .sp-input:focus,#jav-settings-panel .sp-select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.13)}#jav-settings-panel .sp-engine-row{display:grid;grid-template-columns:170px 1fr;gap:10px;align-items:end}#jav-settings-panel .sp-cache-actions{display:flex;align-items:center;gap:8px;margin-right:auto}#jav-settings-panel .sp-cache-feedback{min-width:64px;color:#059669;font-size:12px;font-weight:650}#jav-settings-panel .sp-footer-links{display:flex;align-items:center;gap:8px;margin-right:4px}#jav-settings-panel .sp-footer-link{color:#475569;font-size:12px;font-weight:700;text-decoration:none;padding:6px 8px;border-radius:7px}#jav-settings-panel .sp-footer-link:hover{color:#1d4ed8;background:#eff6ff}#jav-settings-panel .sp-footer-sep{width:1px;height:16px;background:#cbd5e1}#jav-settings-panel .sp-desc{font-size:12px;color:#64748b;line-height:1.45}#jav-settings-panel .sp-toggle{position:relative;display:inline-block;width:42px;height:24px;flex:0 0 auto}#jav-settings-panel .sp-toggle input{opacity:0;width:0;height:0}#jav-settings-panel .sp-toggle-track{position:absolute;inset:0;border-radius:999px;background:#cbd5e1;cursor:pointer;transition:background .18s}#jav-settings-panel .sp-toggle-track::before{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(15,23,42,.25);transition:transform .18s}#jav-settings-panel .sp-toggle input:checked+.sp-toggle-track{background:#2563eb}#jav-settings-panel .sp-toggle input:checked+.sp-toggle-track::before{transform:translateX(18px)}#jav-settings-panel .sp-order-list{display:flex;flex-direction:column;gap:8px}#jav-settings-panel .sp-order-item{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid #e2e8f0;border-radius:8px;background:linear-gradient(90deg,#fff 0%,#f8fafc 100%);user-select:none}#jav-settings-panel .sp-order-name{font-size:13px;font-weight:700;color:#1e293b}#jav-settings-panel .sp-dot{width:9px;height:9px;border-radius:50%}#jav-settings-panel .sp-order-actions{display:flex;gap:5px}#jav-settings-panel .sp-order-btn{width:28px;height:28px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;cursor:pointer;font-size:14px;line-height:1}#jav-settings-panel .sp-order-btn:hover:not(:disabled){border-color:#2563eb;color:#1d4ed8;background:#eff6ff}#jav-settings-panel .sp-order-btn:disabled{opacity:.36;cursor:not-allowed}#jav-settings-panel .sp-footer{padding:14px 22px;background:rgba(255,255,255,.92);border-top:1px solid rgba(203,213,225,.86);display:flex;align-items:center;justify-content:flex-end;gap:10px}#jav-settings-panel .sp-btn{height:34px;padding:0 16px;border-radius:8px;border:1px solid transparent;font-size:13px;font-weight:700;cursor:pointer}#jav-settings-panel .sp-btn-cancel{background:#fff;color:#475569;border-color:#cbd5e1}#jav-settings-panel .sp-btn-clear{background:#fff7ed;color:#9a3412;border-color:#fed7aa}#jav-settings-panel .sp-btn-clear:hover{background:#ffedd5}#jav-settings-panel .sp-btn-save{background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;box-shadow:0 8px 20px rgba(79,70,229,.25)}@media (max-width:640px){#jav-settings-panel .sp-grid,#jav-settings-panel .sp-engine-row,#jav-settings-panel .sp-feature-grid,#jav-settings-panel .sp-feature-order-row{grid-template-columns:1fr}#jav-settings-panel .sp-feature-item{grid-column:auto!important}#jav-settings-panel .sp-cache-actions{margin-right:0}#jav-settings-panel .sp-footer{flex-wrap:wrap}}`);
            const overlay = document.createElement('div');
            overlay.id = 'jav-settings-overlay';
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            const panel = document.createElement('div');
            panel.id = 'jav-settings-panel';
            panel.innerHTML = `<div class="sp-header"><div><div class="sp-title">老司机设置</div></div><button class="sp-close" type="button" title="关闭">×</button></div><div class="sp-body"><section class="sp-card sp-card-magnet"><div class="sp-card-title">磁力搜索</div><div class="sp-grid"><label class="sp-field"><span class="sp-label">默认磁力引擎</span><select class="sp-select" id="sp-default-engine"></select></label><div class="sp-engine-row"><label class="sp-field"><span class="sp-label">编辑引擎</span><select class="sp-select" id="sp-engine-picker"></select></label><label class="sp-field"><span class="sp-label">域名</span><input class="sp-input" id="sp-engine-domain"></label></div></div></section><section class="sp-card sp-card-defaults"><div class="sp-card-title">默认组跳转入口</div><div class="sp-grid"><label class="sp-field"><span class="sp-label">默认搜索入口</span><select class="sp-select" id="sp-jump-engine"></select></label><label class="sp-field"><span class="sp-label">默认视频入口</span><select class="sp-select" id="sp-video-engine"></select></label></div></section><div class="sp-feature-order-row"><section class="sp-card sp-card-features"><div class="sp-card-title">功能项开关</div><div class="sp-feature-grid"><div class="sp-feature-item"><div><div class="sp-label">磁力引擎</div></div><label class="sp-toggle"><input id="sp-magnet-table" type="checkbox"><span class="sp-toggle-track"></span></label></div><div class="sp-feature-item sp-cache-clean"><div><div class="sp-label">预览图缓存</div><div class="sp-desc">清理本页会话缓存</div></div><button class="sp-cache-clear-btn" id="sp-clear-preview-cache" type="button" title="清理预览图缓存"><span class="sp-cache-clear-icon">↻</span></button></div><div class="sp-feature-item sp-cache-clean"><div><div class="sp-label">预告片缓存</div><div class="sp-desc">清理解析结果缓存</div></div><button class="sp-cache-clear-btn" id="sp-clear-trailer-cache" type="button" title="清理预告片缓存"><span class="sp-cache-clear-icon">↻</span></button></div><label class="sp-feature-select"><div><div class="sp-label">115播放器</div></div><select class="sp-select" id="sp-pan115-player"><option value="official">官方</option><option value="115master">Master</option></select></label></div></section><section class="sp-card sp-card-order"><div class="sp-card-title">预览图来源顺序</div><div class="sp-order-list" id="sp-thumb-order"></div></section></div><section class="sp-card sp-card-jump" style="--card-color:#6366f1;"><style> #jav-settings-panel .sp-chip-group { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; } #jav-settings-panel .sp-chip input { display: none; } #jav-settings-panel .sp-chip-label { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 999px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #64748b); font-size: 12px; font-weight: 500; cursor: pointer; transition: all .15s; user-select: none; } #jav-settings-panel .sp-chip input:checked + .sp-chip-label { border-color: #6366f1; background: #eef2ff; color: #4338ca; } #jav-settings-panel .sp-chip-label:hover { border-color: #a5b4fc; background: #f0f4ff; color: #4338ca; } #jav-settings-panel .sp-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.6; flex: 0 0 auto; } </style><div class="sp-card-title">跳转按钮控制</div><div class="sp-chip-group"><label class="sp-chip"><input id="sp-btn-nyaa" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>Sukebei</span></label><label class="sp-chip"><input id="sp-btn-javbus" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>JavBus</span></label><label class="sp-chip"><input id="sp-btn-javdb" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>JavDB</span></label><label class="sp-chip"><input id="sp-btn-missav" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>视频组</span></label><label class="sp-chip"><input id="sp-btn-fanza" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>FANZA</span></label><label class="sp-chip"><input id="sp-btn-search" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>搜索组</span></label><label class="sp-chip"><input id="sp-btn-trailer" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>预告片</span></label><label class="sp-chip"><input id="sp-btn-preview" type="checkbox"><span class="sp-chip-label"><span class="sp-chip-dot"></span>预览图</span></label></div></section></div><div class="sp-footer"><div class="sp-cache-actions"><div class="sp-footer-links"><a class="sp-footer-link" href="https://github.com/ZiPenOk/scripts" target="_blank" rel="noopener noreferrer">Github</a><span class="sp-footer-sep"></span><a class="sp-footer-link" href="https://sleazyfork.org/zh-CN/scripts/576375-jav%E8%80%81%E5%8F%B8%E6%9C%BA-%E6%96%B0/feedback" target="_blank" rel="noopener noreferrer">反馈</a><span class="sp-footer-sep"></span><span class="sp-footer-link" style="cursor:default;color:#94a3b8;">v${SCRIPT_VERSION}</span></div><button class="sp-btn sp-btn-clear" id="sp-clear-cache" type="button">清空缓存</button><span class="sp-cache-feedback" id="sp-cache-feedback"></span></div><button class="sp-btn sp-btn-cancel" type="button">取消</button><button class="sp-btn sp-btn-save" type="button">保存设置</button></div>`;
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
            const defaultSelect = panel.querySelector('#sp-default-engine');
            const picker = panel.querySelector('#sp-engine-picker');
            const domainInput = panel.querySelector('#sp-engine-domain');
            const jumpEngineSelect = panel.querySelector('#sp-jump-engine');
            const videoEngineSelect = panel.querySelector('#sp-video-engine');
            const magnetTableCheckbox = panel.querySelector('#sp-magnet-table');
            const clearPreviewCacheBtn = panel.querySelector('#sp-clear-preview-cache');
            const clearTrailerCacheBtn = panel.querySelector('#sp-clear-trailer-cache');
            const pan115PlayerSelect = panel.querySelector('#sp-pan115-player');
            const btnToggles = {
                nyaa:    panel.querySelector('#sp-btn-nyaa'),
                javbus:  panel.querySelector('#sp-btn-javbus'),
                javdb:   panel.querySelector('#sp-btn-javdb'),
                missav:  panel.querySelector('#sp-btn-missav'),
                fanza:   panel.querySelector('#sp-btn-fanza'),
                search:  panel.querySelector('#sp-btn-search'),
                trailer: panel.querySelector('#sp-btn-trailer'),
                preview: panel.querySelector('#sp-btn-preview'),
            };
            const clearCacheBtn = panel.querySelector('#sp-clear-cache');
            const cacheFeedback = panel.querySelector('#sp-cache-feedback');
            const orderList = panel.querySelector('#sp-thumb-order');
            const domainDraft = Object.fromEntries(MAGNET_ENGINES.map(item => [item.key, CFG[item.key]]));
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
            MAGNET_ENGINES.forEach(item => {
                picker.add(new Option(item.label, item.key));
            });
            const loadPickedDomain = () => {
                const meta = MAGNET_ENGINES.find(item => item.key === picker.value);
                domainInput.value = domainDraft[picker.value] || '';
                domainInput.placeholder = meta?.placeholder || '';
            };
            picker.addEventListener('change', loadPickedDomain);
            domainInput.addEventListener('input', () => {
                domainDraft[picker.value] = stripProtocol(domainInput.value);
                syncDefaultOptions();
            });
            JUMP_SEARCH_ENGINES.forEach((name, index) => {
                jumpEngineSelect.add(new Option(name, String(index)));
            });
            VIDEO_ENGINES.forEach(item => {
                videoEngineSelect.add(new Option(item.label, item.key));
            });
            jumpEngineSelect.value = String(GM_getValue('default_search_engine', 2));
            Ui.setSelectValue(videoEngineSelect, CFG.defaultVideoEngine, 'missav');
            if (pan115PlayerSelect) pan115PlayerSelect.value = CFG.pan115Player === '115master' ? '115master' : 'official';
            magnetTableCheckbox.checked = CFG.magnetTable;
            BUTTON_TOGGLE_META.forEach(([key, cfgKey]) => {
                btnToggles[key].checked = CFG[cfgKey];
            });
            const renderOrder = () => {
                orderList.innerHTML = '';
                currentOrder.forEach((src, index) => {
                    const meta = THUMB_META[src];
                    const item = document.createElement('div');
                    item.className = 'sp-order-item';
                    item.dataset.src = src;
                    item.innerHTML = `<div><div class="sp-order-name"> ${meta.label} </div></div><span class="sp-dot" style="background: ${meta.color} "></span><div class="sp-order-actions"><button class="sp-order-btn" type="button" data-dir="-1" title="上移" ${index === 0 ? 'disabled' : ''} >↑</button><button class="sp-order-btn" type="button" data-dir="1" title="下移" ${index === currentOrder.length - 1 ? 'disabled' : ''} >↓</button></div>`;
                    orderList.appendChild(item);
                });
            };
            orderList.addEventListener('click', e => {
                const btn = e.target.closest('.sp-order-btn');
                if (!btn) return;
                const item = btn.closest('.sp-order-item');
                const from = currentOrder.indexOf(item?.dataset.src);
                const to = from + parseInt(btn.dataset.dir, 10);
                if (from < 0 || to < 0 || to >= currentOrder.length) return;
                [currentOrder[from], currentOrder[to]] = [currentOrder[to], currentOrder[from]];
                renderOrder();
            });
            const flashCacheButton = (btn, label, count) => {
                if (!btn) return;
                btn.classList.remove('is-done');
                btn.classList.add('is-clearing');
                setTimeout(() => {
                    btn.classList.remove('is-clearing');
                    btn.classList.add('is-done');
                    cacheFeedback.textContent = count ? `${label} ${count} 项` : `${label}无缓存`;
                    setTimeout(() => btn.classList.remove('is-done'), 900);
                    setTimeout(() => { cacheFeedback.textContent = ''; }, 1800);
                }, 260);
            };
            clearPreviewCacheBtn.addEventListener('click', () => {
                const count = Ui.clearSessionByPrefixes(['thumb_cache_']);
                flashCacheButton(clearPreviewCacheBtn, '预览图已清理', count);
            });
            clearTrailerCacheBtn.addEventListener('click', () => {
                const count = Ui.clearSessionByPrefixes(['trailer_cache_']);
                flashCacheButton(clearTrailerCacheBtn, '预告片已清理', count);
            });
            clearCacheBtn.addEventListener('click', () => {
                const count = Ui.clearSessionByPrefixes(['thumb_cache_', 'trailer_cache_', 'pan115_cache_']);
                cacheFeedback.textContent = count ? `已清空 ${count} 项` : '无缓存';
                setTimeout(() => { cacheFeedback.textContent = ''; }, 1800);
            });
            picker.value = 'javdbSearchUrl';
            loadPickedDomain();
            syncDefaultOptions();
            renderOrder();
            const closePanel = () => overlay.remove();
            panel.querySelector('.sp-close').addEventListener('click', closePanel);
            panel.querySelector('.sp-btn-cancel').addEventListener('click', closePanel);
            panel.querySelector('.sp-btn-save').addEventListener('click', () => {
                const snapshotNonPan115 = () => JSON.stringify({
                    domains: MAGNET_ENGINES.map(item => CFG[item.key]),
                    defaultEngine: CFG.defaultEngine,
                    defaultSearchEngine: GM_getValue('default_search_engine', 2),
                    defaultVideoEngine: CFG.defaultVideoEngine,
                    columns: {
                        javbus: CFG.javbusCardColumns,
                        javdb: CFG.javdbCardColumns,
                        javlib: CFG.javlibCardColumns,
                    },
                    magnetTable: CFG.magnetTable,
                    infiniteScroll: CFG.infiniteScroll,
                    buttons: Object.fromEntries(BUTTON_TOGGLE_META.map(([key, cfgKey]) => [key, CFG[cfgKey]])),
                    thumbOrder: GM_getValue('thumb_source_order', ['javfree', 'projectjav', 'javstore']),
                });
                const beforeNonPan115 = snapshotNonPan115();
                const beforePan115Player = CFG.pan115Player;
                const nextPan115Player = pan115PlayerSelect?.value === '115master' ? '115master' : 'official';
                MAGNET_ENGINES.forEach(item => { CFG[item.key] = stripProtocol(domainDraft[item.key]); });
                CFG.defaultEngine = defaultSelect.value;
                GM_setValue('default_search_engine', parseInt(jumpEngineSelect.value, 10) || 0);
                CFG.defaultVideoEngine = videoEngineSelect.value || 'missav';
                CFG.pan115Player = nextPan115Player;
                CFG.magnetTable = magnetTableCheckbox.checked;
                BUTTON_TOGGLE_META.forEach(([key, cfgKey]) => {
                    CFG[cfgKey] = btnToggles[key].checked;
                });
                GM_setValue('thumb_source_order', currentOrder);
                const pan115Changed = beforePan115Player !== nextPan115Player;
                const nonPan115Changed = beforeNonPan115 !== snapshotNonPan115();
                closePanel();
                if (nonPan115Changed) {
                    location.reload();
                    return;
                }
                if (pan115Changed) Runtime.syncPan115(CFG.btnShowPan115);
            });
        }
        return { open };
    })();
    Core.expose('__LAOSIJI_OPEN_SETTINGS__', () => SettingsPanel.open());
    GM_registerMenuCommand('⚙️ 老司机设置', () => SettingsPanel.open());
    const QuickSettingsPanel = (() => {
        const siteLabelMap = { javbus: 'JavBus', javdb: 'JavDB', javlib: 'JavLibrary' };
        function getCurrentSite() {
            return CardColumns.detectCurrentSite() || PageZoom.detectCurrentSite();
        }
        function ensureStyle() {
            injectStyle('jav-quick-settings-style', `#jav-quick-settings-popover{position:fixed;z-index:10000030;width:286px;padding:10px;border:1px solid rgba(203,213,225,.85);border-radius:10px;background:rgba(255,255,255,.985);color:#0f172a;box-shadow:0 12px 28px rgba(15,23,42,.16);backdrop-filter:blur(6px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box}#jav-quick-settings-popover *{box-sizing:border-box}#jav-quick-settings-popover .qs-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}#jav-quick-settings-popover .qs-title{font-size:13px;font-weight:800;color:#1e293b}#jav-quick-settings-popover .qs-site{margin-top:1px;font-size:11px;font-weight:650;color:#64748b}#jav-quick-settings-popover .qs-close{width:24px;height:24px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#64748b;cursor:pointer;line-height:1;font-size:14px}#jav-quick-settings-popover .qs-close:hover{color:#1d4ed8;border-color:#93c5fd;background:#eff6ff}#jav-quick-settings-popover .qs-row{display:grid;grid-template-columns:72px 1fr 42px;align-items:center;gap:9px;padding:4px 0;border:0;border-radius:0;background:transparent}#jav-quick-settings-popover .qs-row+.qs-row{margin-top:4px}#jav-quick-settings-popover .qs-detail-flex{display:none;margin-top:8px;padding-top:7px;border-top:1px solid #e2e8f0}#jav-quick-settings-popover .qs-detail-flex.is-visible{display:block}#jav-quick-settings-popover .qs-section-title{margin-bottom:3px;font-size:12px;font-weight:850;color:#1e293b}#jav-quick-settings-popover .qs-row.is-disabled{opacity:.48}#jav-quick-settings-popover .qs-row.is-disabled .qs-range{cursor:not-allowed;background:#e2e8f0}#jav-quick-settings-popover .qs-row.is-disabled .qs-range::-webkit-slider-thumb{background:#94a3b8;cursor:not-allowed}#jav-quick-settings-popover .qs-row.is-disabled .qs-range::-moz-range-thumb{background:#94a3b8;cursor:not-allowed}#jav-quick-settings-popover .qs-switch-grid{display:grid;grid-template-columns:1fr;gap:6px;margin-top:6px}#jav-quick-settings-popover .qs-switch-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0;border:0;border-radius:0;background:transparent}#jav-quick-settings-popover .qs-name{font-size:12px;font-weight:750;color:#334155;white-space:nowrap}#jav-quick-settings-popover .qs-value{display:grid;place-items:center;min-width:34px;height:22px;border-radius:999px;background:#fff;color:#1d4ed8;font-size:12px;font-weight:800;border:1px solid #dbeafe}#jav-quick-settings-popover .qs-range{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:999px;background:linear-gradient(90deg,#93c5fd 0%,#dbeafe 100%);outline:none}#jav-quick-settings-popover .qs-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;border:2px solid #fff;background:#2563eb;box-shadow:0 3px 8px rgba(37,99,235,.22);cursor:pointer}#jav-quick-settings-popover .qs-range::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:50%;background:#2563eb;box-shadow:0 3px 8px rgba(37,99,235,.22);cursor:pointer}#jav-quick-settings-popover .qs-toggle{position:relative;display:inline-block;width:36px;height:20px;flex:0 0 auto}#jav-quick-settings-popover .qs-toggle input{opacity:0;width:0;height:0}#jav-quick-settings-popover .qs-toggle-track{position:absolute;inset:0;border-radius:999px;background:#cbd5e1;cursor:pointer;transition:background .18s}#jav-quick-settings-popover .qs-toggle-track::before{content:'';position:absolute;width:14px;height:14px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.22);transition:transform .18s}#jav-quick-settings-popover .qs-toggle input:checked+.qs-toggle-track{background:#2563eb}#jav-quick-settings-popover .qs-toggle input:checked+.qs-toggle-track::before{transform:translateX(14px)}#jav-quick-settings-popover .qs-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0}#jav-quick-settings-popover .qs-more{height:28px;padding:0 12px;border:1px solid #c7d2fe;border-radius:7px;background:#eef2ff;color:#4338ca;font-size:11px;font-weight:800;cursor:pointer}#jav-quick-settings-popover .qs-more:hover{background:#e0e7ff;border-color:#a5b4fc}`);
        }
        function positionPanel(panel, anchor) {
            const rect = anchor?.getBoundingClientRect?.();
            const margin = 10;
            const width = panel.offsetWidth || 286;
            const height = panel.offsetHeight || 150;
            let left = rect ? rect.right - width : window.innerWidth - width - 18;
            let top = rect ? rect.bottom + 8 : 64;
            left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
            top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }
        function open(anchor = null) {
            document.getElementById('jav-quick-settings-popover')?.remove();
            ensureStyle();
            const site = getCurrentSite();
            if (!site) {
                SettingsPanel.open();
                return;
            }
            const panel = document.createElement('div');
            panel.id = 'jav-quick-settings-popover';
            panel.innerHTML = `<div class="qs-head"><div><div class="qs-title">快捷设置</div><div class="qs-site"> ${siteLabelMap[site] || '当前站点'} </div></div><button class="qs-close" type="button" title="关闭">×</button></div><div class="qs-row"><div class="qs-name">卡片列数</div><input class="qs-range" id="qs-columns" type="range" min="2" max="10" step="1"><span class="qs-value" id="qs-columns-value">5</span></div><div class="qs-row"><div class="qs-name">页面宽度</div><input class="qs-range" id="qs-zoom" type="range" min="60" max="100" step="1"><span class="qs-value" id="qs-zoom-value">100%</span></div><div class="qs-detail-flex" id="qs-detail-flex"><div class="qs-section-title">详情比例</div><div class="qs-row" data-detail-flex-row="cover"><div class="qs-name">封面</div><input class="qs-range" id="qs-detail-cover" type="range" min="50" max="200" step="5"><span class="qs-value" id="qs-detail-cover-value">1.0</span></div><div class="qs-row" data-detail-flex-row="info"><div class="qs-name">信息</div><input class="qs-range" id="qs-detail-info" type="range" min="50" max="200" step="5"><span class="qs-value" id="qs-detail-info-value">1.0</span></div><div class="qs-row" data-detail-flex-row="magnet"><div class="qs-name">磁力</div><input class="qs-range" id="qs-detail-magnet" type="range" min="50" max="200" step="5"><span class="qs-value" id="qs-detail-magnet-value">关闭</span></div></div><div class="qs-switch-grid"><div class="qs-switch-row"><div class="qs-name">115匹配</div><label class="qs-toggle"><input id="qs-pan115" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">瀑布流</div><label class="qs-toggle"><input id="qs-infinite-scroll" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">卡片动画</div><label class="qs-toggle"><input id="qs-card-fx" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">封面悬浮大图</div><label class="qs-toggle"><input id="qs-cover-hover-preview" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">翻译标题</div><label class="qs-toggle"><input id="qs-title-translate" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">竖图模式</div><label class="qs-toggle"><input id="qs-portrait-cards" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">新标签打开页面</div><label class="qs-toggle"><input id="qs-list-open-new-tab" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">首页快捷查看</div><label class="qs-toggle"><input id="qs-list-preview" type="checkbox"><span class="qs-toggle-track"></span></label></div><div class="qs-switch-row"><div class="qs-name">预览图直显</div><label class="qs-toggle"><input id="qs-detail-preview-inline" type="checkbox"><span class="qs-toggle-track"></span></label></div></div><div class="qs-footer"><button class="qs-more" type="button">更多设置</button></div>`;
            document.body.appendChild(panel);
            const close = () => panel.remove();
            const columnsInput = panel.querySelector('#qs-columns');
            const columnsValue = panel.querySelector('#qs-columns-value');
            const zoomInput = panel.querySelector('#qs-zoom');
            const zoomValue = panel.querySelector('#qs-zoom-value');
            const pan115Input = panel.querySelector('#qs-pan115');
            const infiniteInput = panel.querySelector('#qs-infinite-scroll');
            const cardFxInput = panel.querySelector('#qs-card-fx');
            const coverHoverPreviewInput = panel.querySelector('#qs-cover-hover-preview');
            const listPreviewInput = panel.querySelector('#qs-list-preview');
            const detailPreviewInput = panel.querySelector('#qs-detail-preview-inline');
            const titleTranslateInput = panel.querySelector('#qs-title-translate');
            const portraitCardsInput = panel.querySelector('#qs-portrait-cards');
            const listOpenNewTabInput = panel.querySelector('#qs-list-open-new-tab');
            const detailSite = DetailFlex.detectCurrentSite();
            const detailWrap = panel.querySelector('#qs-detail-flex');
            const detailInputs = {
                cover: panel.querySelector('#qs-detail-cover'),
                info: panel.querySelector('#qs-detail-info'),
                magnet: panel.querySelector('#qs-detail-magnet'),
            };
            const detailValues = {
                cover: panel.querySelector('#qs-detail-cover-value'),
                info: panel.querySelector('#qs-detail-info-value'),
                magnet: panel.querySelector('#qs-detail-magnet-value'),
            };
            const syncColumnsControl = () => {
                const value = CardColumns.get(site);
                if (columnsInput) columnsInput.value = String(value);
                if (columnsValue) columnsValue.textContent = String(value);
            };
            const formatFlexValue = value => (DetailFlex.clamp(value) / 100).toFixed(2).replace(/\.?0+$/, '');
            const syncDetailMagnetState = () => {
                const hasMagnet = detailSite && DetailFlex.hasMagnet(detailSite);
                const row = panel.querySelector('[data-detail-flex-row="magnet"]');
                if (row) row.classList.toggle('is-disabled', !hasMagnet);
                if (detailInputs.magnet) detailInputs.magnet.disabled = !hasMagnet;
                if (detailValues.magnet && !hasMagnet) detailValues.magnet.textContent = CFG.magnetTable ? '未渲染' : '关闭';
                return hasMagnet;
            };
            Ui.bindRange(columnsInput, columnsValue, CardColumns.get(site), v => String(CardColumns.clamp(v)), value => {
                const next = CardColumns.clamp(value);
                CardColumns.set(site, next);
                CardColumns.apply(site, next);
            });
            Ui.bindRange(zoomInput, zoomValue, PageZoom.get(site), v => `${PageZoom.clamp(v)}%`, value => {
                const next = PageZoom.clamp(value);
                PageZoom.set(site, next);
                PageZoom.apply(site, next);
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
                        DetailFlex.set(detailSite, key, next);
                        DetailFlex.apply(detailSite);
                    });
                });
                syncDetailMagnetState();
            }
            Ui.bindCheckbox(pan115Input, CFG.btnShowPan115, checked => {
                CFG.btnShowPan115 = checked;
                Runtime.syncPan115(checked);
            });
            Ui.bindCheckbox(infiniteInput, CFG.infiniteScroll, checked => {
                CFG.infiniteScroll = checked;
                Runtime.syncInfiniteScroll(checked);
            });
            Ui.bindCheckbox(cardFxInput, CFG.cardFx, checked => {
                CFG.cardFx = checked;
                Runtime.syncCardFx(checked);
            });
            Ui.bindCheckbox(coverHoverPreviewInput, CFG.coverHoverPreview, checked => {
                CFG.coverHoverPreview = checked;
                Runtime.syncCoverHoverPreview();
            });
            Ui.bindCheckbox(listPreviewInput, CFG.listPreviewQuick, checked => {
                CFG.listPreviewQuick = checked;
                Runtime.syncListPreview();
            });
            Ui.bindCheckbox(detailPreviewInput, CFG.detailPreviewInline, checked => {
                CFG.detailPreviewInline = checked;
                Runtime.syncDetailPreview();
            });
            Ui.bindCheckbox(titleTranslateInput, CFG.titleTranslate, checked => {
                CFG.titleTranslate = checked;
                Runtime.syncTitleTranslate();
            });
            Ui.bindCheckbox(portraitCardsInput, CFG.portraitCards, checked => {
                Runtime.syncPortraitCards(checked);
                syncColumnsControl();
            });
            Ui.bindCheckbox(listOpenNewTabInput, CFG.listOpenNewTab, checked => {
                CFG.listOpenNewTab = checked;
                Runtime.syncListOpenNewTab();
            });
            Ui.click(panel.querySelector('.qs-close'), close);
            Ui.click(panel.querySelector('.qs-more'), () => {
                close();
                SettingsPanel.open();
            });
            panel.addEventListener('click', e => e.stopPropagation());
            setTimeout(() => {
                const onDocClick = e => {
                    if (!panel.contains(e.target)) {
                        close();
                        document.removeEventListener('click', onDocClick, true);
                    }
                };
                document.addEventListener('click', onDocClick, true);
            }, 0);
            positionPanel(panel, anchor);
        }
        return { open };
    })();
    Core.expose('__LAOSIJI_OPEN_QUICK_SETTINGS__', anchor => QuickSettingsPanel.open(anchor));
    const Magnet = (() => {
        const ENGINE_LABELS = () => ({
            [CFG.javdbSearchUrl]: 'JavDB',
            [CFG.ciligouUrl]:     'CiliGou',
            [CFG.btdigUrl]:       'BtDig',
            [CFG.btsearchUrl]:    'BTSearch',
            [CFG.sukebeiUrl]:     'Sukebei',
            [CFG.sokittyUrl]:     'SoKitty',
        });
        const Engines = {
            getAll() {
                return {
                    [CFG.javdbSearchUrl]: _searchJavDB,
                    [CFG.ciligouUrl]:     _searchCiligou,
                    [CFG.btdigUrl]:       _searchBtdig,
                    [CFG.btsearchUrl]:    _searchBTSearch,
                    [CFG.sukebeiUrl]:     _searchsukebei,
                    [CFG.sokittyUrl]:     _searchSokitty,
                };
            },
            getCurrent() {
                const all = this.getAll();
                const key = CFG.defaultEngine;
                return all[key] ? { key, fn: all[key] } : { key: Object.keys(all)[0], fn: Object.values(all)[0] };
            },
        };
        const JAVDB_API_BASE = 'https://jdforrepam.com/api';
        const JAVDB_SIGN_SALT = '71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa';
        let javdbSignCache = { ts: 0, sign: '' };
        function javdbMd5(str) {
            const b = new TextEncoder().encode(str);
            const l = b.length;
            const n = ((l + 8) >> 6) + 1;
            const m = new Uint32Array(n * 16);
            const k = [];
            const s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
            for (let i = 0; i < 64; i++) k[i] = Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1)));
            for (let i = 0; i < l; i++) m[i >> 2] |= b[i] << ((i % 4) << 3);
            m[l >> 2] |= 0x80 << ((l % 4) << 3);
            m[n * 16 - 2] = l * 8;
            let [a0, b0, c0, d0] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
            for (let i = 0; i < n; i++) {
                const g = m.slice(i * 16, (i + 1) * 16);
                let [a, b, c, d] = [a0, b0, c0, d0];
                for (let j = 0; j < 64; j++) {
                    const q = Math.floor(j / 16);
                    const f = [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][q];
                    const p = [j, (5 * j + 1) % 16, (3 * j + 5) % 16, (7 * j) % 16][q];
                    const sum = (a + f + k[j] + g[p]) | 0;
                    const shift = s[(q << 2) | (j % 4)];
                    const nextA = d;
                    d = c;
                    c = b;
                    b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
                    a = nextA;
                }
                a0 = (a0 + a) | 0;
                b0 = (b0 + b) | 0;
                c0 = (c0 + c) | 0;
                d0 = (d0 + d) | 0;
            }
            return [a0, b0, c0, d0]
                .map(v => new Uint32Array([v]))
                .map(v => new Uint8Array(v.buffer))
                .map(v => Array.from(v, b => b.toString(16).padStart(2, '0')).join(''))
                .join('');
        }
        function buildJavdbSignature() {
            const curr = Math.floor(Date.now() / 1000);
            if (javdbSignCache.sign && curr - javdbSignCache.ts <= 20) return javdbSignCache.sign;
            javdbSignCache = {
                ts: curr,
                sign: `${curr}.lpw6vgqzsp.${javdbMd5(`${curr}${JAVDB_SIGN_SALT}`)}`
            };
            return javdbSignCache.sign;
        }
        function parseJson(text) {
            try { return JSON.parse(text || '{}'); }
            catch { return null; }
        }
        function formatJavdbSize(size) {
            const mb = Number(size);
            if (!Number.isFinite(mb) || mb <= 0) return '';
            return mb >= 1024 ? `${(mb / 1024).toFixed(mb >= 10240 ? 1 : 2)} GB` : `${Math.round(mb)} MB`;
        }
        function compactJavdbNumber(value) {
            return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        async function findJavdbMovieByNumber(kw, { limit = 5, fallbackFirst = false } = {}) {
            const headers = {
                accept: 'application/json',
                jdSignature: buildJavdbSignature()
            };
            const params = new URLSearchParams({
                q: kw,
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
            const json = parseJson(r.responseText);
            const movies = Array.isArray(json?.data?.movies) ? json.data.movies : [];
            const compactKw = compactJavdbNumber(kw);
            const exact = movies.find(item => {
                const number = compactJavdbNumber(item?.number);
                return number && number === compactKw;
            });
            return exact || (fallbackFirst ? movies[0] : null) || null;
        }
        async function _searchJavDB(kw) {
            const webBase = 'https://' + CFG.javdbSearchUrl;
            const movie = await findJavdbMovieByNumber(kw, { limit: 5, fallbackFirst: true });
            if (!movie?.id) return { url: webBase, data: [] };
            const detailUrl = `${webBase}/v/${movie.id}`;
            const magnetsUrl = `${JAVDB_API_BASE}/v1/movies/${encodeURIComponent(movie.id)}/magnets`;
            const r2 = await gmFetch(magnetsUrl, { headers: { accept: 'application/json', jdSignature: buildJavdbSignature() } });
            if (!r2.loadstuts || r2.status < 200 || r2.status >= 400) return { url: detailUrl, data: [] };
            const magnetsJson = parseJson(r2.responseText);
            const magnets = Array.isArray(magnetsJson?.data?.magnets) ? magnetsJson.data.magnets : [];
            const data = magnets.map(item => {
                const hash = String(item?.hash || '').trim();
                if (!hash) return null;
                const name = String(item?.name || movie.number || kw).trim();
                const title = [
                    name,
                    item?.cnsub ? '-CH' : '',
                    item?.hd ? 'HD' : '',
                    item?.files_count ? `${item.files_count} files` : '',
                    item?.created_at || ''
                ].filter(Boolean).join(' ');
                return {
                    title,
                    maglink: `magnet:?xt=urn:btih:${hash}`,
                    size: formatJavdbSize(item?.size),
                    src: detailUrl,
                    cnsub: Boolean(item?.cnsub),
                    hd: Boolean(item?.hd)
                };
            }).filter(Boolean);
            return { url: detailUrl, data };
        }
        function normalizeJavdbApiToken(value) {
            return String(value || '').trim().replace(/^Bearer\s+/i, '');
        }
        function javdbApiToken() {
            const candidates = [
                GM_getValue('laosiji_javdb_app_authorization', ''),
                localStorage.getItem('laosiji_javdb_app_authorization'),
            ];
            const token = normalizeJavdbApiToken(candidates.find(Boolean));
            if (token) {
                GM_setValue('laosiji_javdb_app_authorization', token);
                try {
                    localStorage.setItem('laosiji_javdb_app_authorization', token);
                } catch {}
            }
            return token;
        }
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
                } catch {}
            }
            return normalized;
        }
        async function javdbApiLogin(username, password) {
            const account = String(username || '').trim();
            const secret = String(password || '');
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
            const url = `${JAVDB_API_BASE}/v1/sessions?${params.toString()}`;
            const headers = {
                'user-agent': 'Dart/3.5 (dart:io)',
                'accept-language': 'zh-TW',
                host: 'jdforrepam.com',
                'content-type': 'multipart/form-data; boundary=--dio-boundary-2210433284',
                jdsignature: signature,
            };
            const attempts = [
                { method: 'POST', data: 'null', headers, timeout: 20000 },
                { method: 'POST', data: undefined, headers, timeout: 20000 },
            ];
            let r = null;
            let lastJson = null;
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
                throw new Error(json?.message || json?.action || 'JavDB App API 登录失败');
            }
            return setJavdbApiToken(json.data.token);
        }
        function javdbAuthHeader() {
            const token = javdbApiToken();
            if (!token) return {};
            return { authorization: /^bearer\s+/i.test(token) ? token : `Bearer ${token}` };
        }
        async function javdbApiRequest(path, params = {}, extraHeaders = {}) {
            const query = new URLSearchParams(params).toString();
            const url = `${JAVDB_API_BASE}${path}${query ? `?${query}` : ''}`;
            const r = await gmFetch(url, {
                headers: {
                    accept: 'application/json',
                    'accept-language': 'zh-TW',
                    'user-agent': 'Dart/3.5 (dart:io)',
                    jdSignature: buildJavdbSignature(),
                    ...extraHeaders,
                },
                timeout: 20000,
            });
            if (!r.loadstuts || r.status < 200 || r.status >= 400) {
                throw new Error(`JavDB API 请求失败: HTTP ${r.status || 0}`);
            }
            const json = parseJson(r.responseText);
            if (!json) throw new Error('JavDB API 返回异常');
            return json;
        }
        const javdbApi = {
            token: javdbApiToken,
            setToken: setJavdbApiToken,
            login: javdbApiLogin,
            async top250({ category = 'all', year = '', page = 1, limit = 50 } = {}) {
                const params = {
                    start_rank: 1,
                    ignore_watched: 'false',
                    page,
                    limit,
                };
                if (category && category !== 'all') {
                    params.type = 'video_type';
                    params.type_value = category;
                    if (year) params.year = year;
                } else if (year) {
                    params.type = 'year';
                    params.type_value = year;
                } else {
                    params.type = 'all';
                    params.type_value = '';
                }
                return javdbApiRequest('/v1/movies/top', params, javdbAuthHeader());
            },
            async fc2({ period = 'daily', page = 1, limit = 40 } = {}) {
                const json = await javdbApiRequest('/v1/rankings', {
                    period,
                    type: '3',
                });
                if (json.success !== 1) return json;
                const movies = Array.isArray(json?.data?.movies) ? json.data.movies : [];
                const start = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;
                const items = movies.slice(start, start + limit);
                return {
                    success: 1,
                    data: {
                        movies: items,
                        total: items.length,
                    },
                };
            },
            async playback({ period = 'daily', filterBy = 'high_score', page = 1, limit = 40 } = {}) {
                const json = await javdbApiRequest('/v1/rankings/playback', {
                    period,
                    filter_by: filterBy,
                });
                if (json.success !== 1) return json;
                const movies = Array.isArray(json?.data?.movies) ? json.data.movies : [];
                const start = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;
                const items = movies.slice(start, start + limit);
                return {
                    success: 1,
                    data: {
                        movies: items,
                        total: movies.length,
                    },
                };
            },
            async movieDetail(movieId) {
                return javdbApiRequest(`/v4/movies/${encodeURIComponent(movieId)}`);
            },
            async searchMovieByNumber(kw, options = {}) {
                return findJavdbMovieByNumber(kw, options);
            },
            async movieMagnets(movieId) {
                return javdbApiRequest(`/v1/movies/${encodeURIComponent(movieId)}/magnets`);
            },
            async movieReviews(movieId, { page = 1, limit = JAVDB_REVIEW_MORE_LIMIT, sortBy = 'hotly' } = {}) {
                return javdbApiRequest(`/v1/movies/${encodeURIComponent(movieId)}/reviews`, {
                    page,
                    limit,
                    sort_by: sortBy,
                });
            },
            async relatedLists(movieId, { page = 1, limit = 20 } = {}) {
                return javdbApiRequest('/v1/lists/related', {
                    movie_id: movieId,
                    page,
                    limit,
                });
            },
        };
        async function _searchCiligou(kw) {
            const base = 'https://' + CFG.ciligouUrl;
            const encoded = btoa(unescape(encodeURIComponent(kw))).replace(/=+$/, '');
            const searchUrl = `${base}/search?word=${encoded}`;
            const r = await gmFetch(searchUrl, {
                headers: {
                    'Referer': base + '/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
            });
            if (!r.loadstuts) return { url: searchUrl, data: [] };
            const doc = parseHTML(r.responseText);
            const data = [];
            doc.querySelectorAll('#Search_list_wrapper li').forEach(li => {
                const titleA = li.querySelector('a.SearchListTitle_result_title');
                if (!titleA) return;
                const href = titleA.getAttribute('href') || '';
                const hash = href.split('/').pop();
                if (!hash) return;
                const maglink = `magnet:?xt=urn:btih:${hash}`;
                const src = base + href;
                const title = titleA.textContent.trim();
                const infoText = li.querySelector('.Search_list_info')?.textContent || '';
                const sizeMatch = infoText.match(/文件大小：([^\s]+)/);
                const size = sizeMatch ? sizeMatch[1] : '';
                data.push({ title, maglink, size, src });
            });
            return { url: searchUrl, data };
        }
        async function _searchBtdig(kw) {
            const base = 'https://' + CFG.btdigUrl;
            const r = await gmFetch(`${base}/search?q=${kw}`);
            if (!r.loadstuts) return { url: base, data: [] };
            const doc = parseHTML(r.responseText);
            const items = doc.querySelectorAll('div.one_result');
            const data = [...items].map(el => ({
                title:   el.querySelector('.torrent_name a')?.textContent?.trim() || '',
                maglink: el.querySelector('.fa.fa-magnet a')?.href || '',
                size:    el.querySelector('.torrent_size')?.textContent?.trim() || '',
                src:     el.querySelector('.torrent_name a')?.href || '',
            }));
            return { url: r.finalUrl || base, data };
        }
        function pickBTSearchItems(json) {
            if (Array.isArray(json?.data)) return json.data;
            if (Array.isArray(json?.data?.data)) return json.data.data;
            return [];
        }
        function cleanBTSearchText(value) {
            const raw = String(value || '').trim();
            if (!raw) return '';
            if (!/[<&]/.test(raw)) return raw.replace(/\s+/g, ' ');
            const doc = parseHTML(`<body>${raw}</body>`);
            return (doc.body?.textContent || raw.replace(/<[^>]+>/g, ''))
                .replace(/\s+/g, ' ')
                .trim();
        }
        function normalizeBTSearchItem(item, base, searchUrl, keyword) {
            const title = cleanBTSearchText(item?.name);
            const hash = String(item?.hash || '').replace(/^magnet:\?xt=urn:btih:/i, '').replace(/[^a-z0-9]/gi, '');
            if (!/^[a-f0-9]{32,40}$/i.test(hash)) return null;
            const maglink = `magnet:?xt=urn:btih:${hash}`;
            const size = formatBytes(item?.size);
            const src = item?.id
                ? `${base}/torrent/${encodeURIComponent(item.id)}?keyword=${encodeURIComponent(keyword)}`
                : searchUrl;
            return { title: title || maglink, maglink, size, src };
        }
        function randomBTSearchNonce(length = 8) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let nonce = '';
            for (let i = 0; i < length; i++) nonce += chars.charAt(Math.floor(Math.random() * chars.length));
            return nonce;
        }
        function buildBTSearchHeaders(params, referer) {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const nonce = randomBTSearchNonce();
            const parts = [`timestamp=${timestamp}`, `nonce=${nonce}`];
            Object.keys(params).forEach(key => parts.push(`${key}=${params[key]}`));
            const signText = `${parts.sort().join('&')}&key=long2ice`;
            return {
                Accept: 'application/json, text/plain, */*',
                Referer: referer,
                'x-timestamp': timestamp,
                'x-nonce': nonce,
                'x-sign': javdbMd5(signText).toUpperCase()
            };
        }
        async function _searchBTSearch(kw) {
            const base = 'https://' + CFG.btsearchUrl;
            const searchUrl = `${base}/search?keyword=${encodeURIComponent(kw)}`;
            const params = {
                keyword: kw,
                limit: '10',
                offset: '0',
                mode: '',
                time: '',
                sort: 'size',
                sort_type: 'desc',
                size: ''
            };
            const apiUrl = `${base}/api/search?${new URLSearchParams(params).toString()}`;
            const r = await gmFetch(apiUrl, {
                headers: buildBTSearchHeaders(params, searchUrl)
            });
            if (!r.loadstuts || r.status < 200 || r.status >= 400) return { url: searchUrl, data: [] };
            const json = parseJson(r.responseText);
            const data = pickBTSearchItems(json)
                .map(item => normalizeBTSearchItem(item, base, searchUrl, kw))
                .filter(Boolean);
            return { url: searchUrl, data };
        }
        async function _searchsukebei(kw) {
            const base = 'https://' + CFG.sukebeiUrl;
            const r = await gmFetch(`${base}/?f=0&c=0_0&q=${kw}`);
            if (!r.loadstuts) return { url: base, data: [] };
            const doc = parseHTML(r.responseText);
            const rows = doc.querySelectorAll('tr.default, tr.success');
            const data = [...rows].map(el => ({
                title:   el.querySelector('td:nth-child(2)>a:nth-child(1)')?.title || '',
                maglink: el.querySelector('td:nth-child(3)>a:last-child')?.href || '',
                size:    el.querySelector('td:nth-child(4)')?.textContent?.trim() || '',
                src:     base + (el.querySelector('td:nth-child(2)>a:nth-child(1)')?.getAttribute('href') || ''),
            }));
            return { url: r.finalUrl || base, data };
        }
        async function _searchSokitty(kw) {
            const base = 'https://' + CFG.sokittyUrl;
            const searchUrl = `${base}/search?key=${encodeURIComponent(kw)}`;
            const r = await gmFetch(searchUrl, {
                headers: { 'Referer': base + '/' },
            });
            if (!r.loadstuts) return { url: searchUrl, data: [] };
            const doc = parseHTML(r.responseText);
            const normalize = s => s.toUpperCase().replace(/[-_\s]/g, '');
            const kwNorm = normalize(kw);
            const data = [];
            doc.querySelectorAll('.panel.search-panel').forEach(panel => {
                const titleA = panel.querySelector('h3.panel-title > a.list-title');
                if (!titleA) return;
                const href = titleA.getAttribute('href') || '';
                if (!href.startsWith('/bt/')) return;
                const hash = href.replace('/bt/', '');
                if (!hash) return;
                const title = titleA.textContent.trim();
                if (!normalize(title).includes(kwNorm)) return;
                const maglink = `magnet:?xt=urn:btih:${hash}`;
                const src = base + href;
                const size = panel.querySelector('.panel-footer .info-item')?.textContent?.trim() || '';
                data.push({ title, maglink, size, src });
            });
            return { url: searchUrl, data };
        }
        async function offline115(maglink) {
            maglink = maglink.substring(0, 60);
            const loginUrl = 'https://115.com/?mode=login';
            const offlineUrl = 'https://115.com/?tab=offline&mode=wangpan';
            const tokenR = await gmFetch(`https://115.com/?ct=offline&ac=space&_=${Date.now()}`, {
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    Referer: offlineUrl,
                },
            });
            if (!tokenR.loadstuts) {
                notify('115 错误', '无法获取签名，请检查跨源权限或115登录状态', loginUrl);
                return;
            }
            if (tokenR.responseText.includes('html')) {
                notify('115 未登录', '请先登录115账户后再离线下载', loginUrl);
                return;
            }
            const json = parseJson(tokenR.responseText);
            if (!json?.sign || !json?.time) {
                notify('115 错误', '签名返回异常，请确认115已登录并允许跨源访问', offlineUrl);
                return;
            }
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
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    data: `url=${encodeURIComponent(maglink)}&uid=${uid}&sign=${json.sign}&time=${json.time}`,
                    onload(r) {
                        if (r.status < 200 || r.status >= 400) {
                            notify('115 离线失败', `请求失败：HTTP ${r.status || 0}`, offlineUrl);
                            done();
                            return;
                        }
                        const res = parseJson(r.responseText);
                        if (!res) {
                            notify('115 离线失败', '115返回异常，可能是登录失效或跨源权限未完整允许', offlineUrl);
                            done();
                            return;
                        }
                        if (res.state) {
                            notify('115 离线成功', '任务已添加', offlineUrl);
                        } else {
                            const msg = res.errcode === '911'
                                ? '账号使用异常，请手工验证'
                                : (res.error_msg || res.msg || res.error || '未知错误');
                            notify('115 离线失败', msg, offlineUrl);
                        }
                        done();
                    },
                    onerror() {
                        notify('115 离线失败', '推送请求失败，请检查跨源权限或网络状态', offlineUrl);
                        done();
                    },
                    ontimeout() {
                        notify('115 离线失败', '推送请求超时，请稍后重试', offlineUrl);
                        done();
                    },
                    onabort() {
                        notify('115 离线失败', '推送请求已取消，可能是跨源权限被拒绝', offlineUrl);
                        done();
                    },
                });
            });
        }
        GM_addStyle(`.jav-nong-wrapper{overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin}#jav-nong-table{width:100%;min-width:220px;table-layout:fixed;margin:8px 0;color:#666;font-size:13px;text-align:center;background:#f2f2f2;border-collapse:collapse;max-width:100%}#jav-nong-table th,#jav-nong-table td{text-align:center;height:30px;background:#fff;padding:0 6px;border:1px solid #efefef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#jav-nong-table th:nth-child(2),#jav-nong-table td:nth-child(2){width:74px}#jav-nong-table th:nth-child(3),#jav-nong-table td:nth-child(3){width:74px}#jav-nong-table th:nth-child(4),#jav-nong-table td:nth-child(4){width:48px}#jav-nong-table:has(td.mag-laosiji-ready-cell) th:nth-child(3),#jav-nong-table.has-mag-assistant th:nth-child(3),#jav-nong-table.has-mag-assistant td:nth-child(3),#jav-nong-table:has(td.mag-laosiji-ready-cell) td:nth-child(3){width:110px}#jav-nong-table:has(td.mag-laosiji-ready-cell),#jav-nong-table.has-mag-assistant{min-width:300px}#jav-nong-table:has(td.mag-laosiji-ready-cell) th:nth-child(4),#jav-nong-table.has-mag-assistant th:nth-child(4),#jav-nong-table.has-mag-assistant td:nth-child(4),#jav-nong-table:has(td.mag-laosiji-ready-cell) td:nth-child(4){width:0!important;padding-left:0!important;padding-right:0!important;border-left:0!important;border-right:0!important}#jav-nong-table td.mag-laosiji-ready-cell{overflow:visible;padding-left:4px;padding-right:4px}#jav-nong-table td.mag-laosiji-ready-cell .mag-btn-group{max-width:120px;box-sizing:border-box}#jav-nong-table td:first-child{text-align:left}#jav-nong-table .nong-head-row th{background:#f8f8f8;font-weight:600}#jav-nong-table .nong-magnet-name{display:flex;align-items:center;gap:4px;min-width:0;width:100%;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#jav-nong-table .nong-magnet-name>a{flex:1 1 auto;min-width:0;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nong-copy{color:#08c!important;cursor:pointer}.nong-check{color:#be185d!important;cursor:pointer;margin-left:8px}.nong-offline-115{color:rgb(0,180,30)!important;cursor:pointer}.nong-offline-115:hover{color:red!important}.whatslink-overlay{position:fixed;inset:0;z-index:10000040;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(15,23,42,.66);backdrop-filter:blur(8px)}.whatslink-modal{width:min(1100px,96vw);max-height:90vh;display:grid;grid-template-columns:1.55fr .75fr;background:#f5f7fb;border:1px solid rgba(203,213,225,.9);border-radius:12px;overflow:hidden;box-shadow:0 30px 80px rgba(2,8,23,.38);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.whatslink-modal.no-shots{grid-template-columns:1.1fr .9fr}.whatslink-viewer{min-width:0;display:grid;grid-template-rows:minmax(430px,1fr) auto;gap:10px;padding:14px;background:radial-gradient(circle at 20% 0%,#fff1f8 0,transparent 34%),#eef3f8}.whatslink-stage{position:relative;min-height:470px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #dde7f2;border-radius:12px;background:#111827;box-shadow:0 18px 36px rgba(15,23,42,.16)}.whatslink-stage img{width:100%;height:100%;max-height:68vh;object-fit:contain;border-radius:10px}.whatslink-modal.no-shots .whatslink-viewer{grid-template-rows:minmax(430px,1fr);background:linear-gradient(135deg,#f8fafc,#eef2ff)}.whatslink-modal.no-shots .whatslink-stage{background:linear-gradient(145deg,#fff,#f1f5f9);border-style:dashed;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8),0 18px 36px rgba(15,23,42,.08)}.whatslink-modal.no-shots .whatslink-stage img,.whatslink-modal.no-shots .whatslink-nav,.whatslink-modal.no-shots .whatslink-counter,.whatslink-modal.no-shots .whatslink-thumbs{display:none}.whatslink-empty{display:none;width:min(420px,72%);text-align:center;color:#475569}.whatslink-modal.no-shots .whatslink-empty{display:block}.whatslink-empty-icon{width:62px;height:62px;margin:0 auto 15px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(135deg,#fce7f3,#e0e7ff);color:#be185d;font-size:27px;box-shadow:0 12px 26px rgba(190,24,93,.16)}.whatslink-empty-title{font-size:18px;font-weight:800;color:#1e293b;margin-bottom:7px}.whatslink-empty-text{margin:0;font-size:13px;line-height:1.6}.whatslink-nav{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:52px;border:0;border-radius:8px;background:rgba(255,255,255,.14);color:#fff;font-size:28px;cursor:pointer}.whatslink-nav:hover{background:rgba(255,255,255,.24)}.whatslink-prev{left:12px}.whatslink-next{right:12px}.whatslink-counter{position:absolute;right:14px;bottom:12px;color:#e2e8f0;font-size:12px;text-shadow:0 1px 6px rgba(0,0,0,.6)}.whatslink-thumbs{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;padding:0;background:transparent}.whatslink-thumb{border:2px solid #e2e8f0;border-radius:9px;padding:0;overflow:hidden;background:#fff;cursor:pointer;aspect-ratio:16 / 9;box-shadow:0 6px 14px rgba(15,23,42,.08)}.whatslink-thumb.active{border-color:#db2777;box-shadow:0 8px 18px rgba(219,39,119,.22)}.whatslink-thumb img{width:100%;height:100%;object-fit:cover;display:block}.whatslink-info{min-width:0;padding:14px;background:#f8fafc;overflow:auto;color:#172033}.whatslink-head{position:sticky;top:0;z-index:2;margin:-14px -14px 12px;padding:13px 14px;background:rgba(248,250,252,.94);border-bottom:1px solid #e2e8f0;backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.whatslink-kicker{color:#db2777;font-size:12px;font-weight:800;margin-bottom:5px}.whatslink-title{margin:0;font-size:21px;line-height:1.18;color:#111827;word-break:break-word}.whatslink-close{width:32px;height:32px;border:0;border-radius:8px;color:#64748b;background:transparent;cursor:pointer;font-size:25px;line-height:1}.whatslink-tag{display:inline-flex;align-items:center;min-height:22px;padding:0 8px;margin-top:8px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700}.whatslink-meta{display:grid;grid-template-columns:1fr;gap:7px;margin:10px 0 12px}.whatslink-metric{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.06)}.whatslink-metric b{color:#172033;font-size:13px;order:2}.whatslink-metric span{color:#64748b;font-size:12px;order:1}.whatslink-section,.whatslink-summary-card{border:1px solid #e2e8f0;border-radius:10px;background:#fff;padding:10px;box-shadow:0 8px 20px rgba(15,23,42,.06)}.whatslink-section h3{margin:0 0 8px;color:#be185d;font-size:12px}.whatslink-magnet{word-break:break-all;max-height:86px;overflow:auto;padding:9px;border-radius:8px;background:#f6f8fb;color:#334155;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}.whatslink-summary{display:grid;gap:8px;margin-top:10px}.whatslink-summary-card strong{display:block;margin-bottom:4px;color:#111827;font-size:12px}.whatslink-summary-card p{margin:0;color:#64748b;font-size:11px;line-height:1.45}.whatslink-loading{padding:28px;text-align:center;color:#475569;font-size:14px}#jav-nong-notice{padding:8px 0}.nong-magnet-name{max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;text-align:left}#jav-nong-refresh{display:none;margin-left:8px;color:#e74c3c;font-weight:bold;cursor:pointer}`);
        function formatBytes(bytes) {
            const num = Number(bytes) || 0;
            if (!num) return '-';
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let value = num;
            let index = 0;
            while (value >= 1024 && index < units.length - 1) {
                value /= 1024;
                index += 1;
            }
            return `${value.toFixed(index >= 3 ? 2 : 1)} ${units[index]}`;
        }
        function formatWhatslinkType(payload) {
            const raw = String(payload?.file_type || payload?.type || '').toUpperCase();
            if (raw.includes('FOLDER')) return '文件夹';
            if (raw.includes('FILE')) return '文件';
            return '-';
        }
        function showWhatslinkModal(payload, magnet) {
            document.querySelector('.whatslink-overlay')?.remove();
            const shots = Array.isArray(payload?.screenshots) ? payload.screenshots.map(item => item?.screenshot).filter(Boolean) : [];
            let index = 0;
            const resourceType = formatWhatslinkType(payload);
            const overlay = document.createElement('div');
            overlay.className = 'whatslink-overlay';
            const modal = document.createElement('section');
            modal.className = `whatslink-modal${shots.length ? '' : ' no-shots'}`;
            modal.innerHTML = `<div class="whatslink-viewer"><div class="whatslink-stage"><button class="whatslink-nav whatslink-prev" type="button">‹</button><img class="whatslink-hero" alt="截图预览"><button class="whatslink-nav whatslink-next" type="button">›</button><div class="whatslink-counter"></div><div class="whatslink-empty"><div class="whatslink-empty-icon">?</div><div class="whatslink-empty-title">暂无截图</div><p class="whatslink-empty-text">WhatsLink 已返回资源基础信息，但没有可展示的截图。可以通过名称、大小和文件数量先做基础判断。</p></div></div><div class="whatslink-thumbs"></div></div><aside class="whatslink-info"><div class="whatslink-head"><div><div class="whatslink-kicker">磁力验车</div><h2 class="whatslink-title"></h2><span class="whatslink-tag"></span></div><button class="whatslink-close" type="button">×</button></div><div class="whatslink-meta"><div class="whatslink-metric"><b> ${formatBytes(payload?.size)} </b><span>资源大小</span></div><div class="whatslink-metric"><b> ${payload?.count ?? '-'} </b><span>文件数量</span></div><div class="whatslink-metric"><b> ${resourceType} </b><span>资源结构</span></div><div class="whatslink-metric"><b> ${shots.length} </b><span>截图数量</span></div><div class="whatslink-metric"><b> ${payload?.error ? '异常' : '无错误'} </b><span>接口状态</span></div></div><div class="whatslink-section"><h3>磁力链接</h3><div class="whatslink-magnet"></div></div><div class="whatslink-summary"><div class="whatslink-summary-card"><strong>验车结论</strong><p> ${shots.length ? 'WhatsLink 已返回截图，优先用左侧大图确认内容是否匹配番号。' : '当前没有截图，建议结合资源名称、大小和文件数量判断。'} </p></div></div></aside>`;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            modal.querySelector('.whatslink-title').textContent = payload?.name || '未知资源';
            modal.querySelector('.whatslink-tag').textContent = resourceType;
            modal.querySelector('.whatslink-magnet').textContent = magnet;
            const hero = modal.querySelector('.whatslink-hero');
            const thumbs = modal.querySelector('.whatslink-thumbs');
            const counter = modal.querySelector('.whatslink-counter');
            const render = () => {
                if (!shots.length) return;
                hero.src = shots[index];
                counter.textContent = `${index + 1} / ${shots.length}`;
                [...thumbs.children].forEach((btn, i) => btn.classList.toggle('active', i === index));
            };
            shots.forEach((url, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'whatslink-thumb';
                btn.innerHTML = `<img src="${url}" alt="截图${i + 1}">`;
                btn.addEventListener('click', () => { index = i; render(); });
                thumbs.appendChild(btn);
            });
            modal.querySelector('.whatslink-prev').addEventListener('click', () => { if (!shots.length) return; index = (index + shots.length - 1) % shots.length; render(); });
            modal.querySelector('.whatslink-next').addEventListener('click', () => { if (!shots.length) return; index = (index + 1) % shots.length; render(); });
            const close = () => overlay.remove();
            modal.querySelector('.whatslink-close').addEventListener('click', close);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
            render();
        }
        async function checkWhatslink(magnet) {
            document.querySelector('.whatslink-overlay')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'whatslink-overlay';
            overlay.innerHTML = '<div class="whatslink-modal no-shots"><div class="whatslink-loading">正在验车...</div></div>';
            document.body.appendChild(overlay);
            try {
                const url = `https://whatslink.info/api/v1/link?url=${encodeURIComponent(magnet)}`;
                const r = await gmFetch(url, { timeout: 20000 });
                if (!r.loadstuts) throw new Error('WhatsLink 请求失败');
                const data = JSON.parse(r.responseText || '{}');
                overlay.remove();
                showWhatslinkModal(data, magnet);
            } catch (e) {
                overlay.remove();
                showWhatslinkModal({ error: e.message || '查询失败', name: '查询失败', type: '-', file_type: '-', size: 0, count: '-', screenshots: [] }, magnet);
            }
        }
        function buildTable(avid) {
            const table = document.createElement('table');
            table.id = 'jav-nong-table';
            table.dataset.avid = avid;
            const syncAssistantState = () => {
                table.classList.toggle('has-mag-assistant', !!table.querySelector('td.mag-laosiji-ready-cell, .mag-btn-group'));
            };
            const assistantObserver = new MutationObserver(syncAssistantState);
            assistantObserver.observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            table.dataset.magAssistantObserver = '1';
            const headRow = document.createElement('tr');
            headRow.className = 'nong-head-row';
            const thEngine = document.createElement('th');
            thEngine.style.textAlign = 'left';
            const allEngines = Engines.getAll();
            const curKey = CFG.defaultEngine;
            const sel = document.createElement('select');
            sel.style.cssText = 'height:22px;font-size:12px;border:1px solid #cbd5e1;border-radius:6px;padding:1px 22px 1px 6px;min-width:84px;background:#fff;color:#172033;font-weight:650;';
            const labels = ENGINE_LABELS();
            Object.keys(allEngines).forEach(k => {
                sel.add(new Option(labels[k] || k, k, false, k === curKey));
            });
            const fitSelWidth = () => {
                sel.style.width = '';
                const natural = sel.offsetWidth;
                sel.style.width = Math.max(natural, 80) + 'px';
            };
            requestAnimationFrame(fitSelWidth);
            sel.addEventListener('change', () => {
                runSearch(table, avid, sel.value);
                requestAnimationFrame(fitSelWidth);
            });
            thEngine.appendChild(sel);
            headRow.appendChild(thEngine);
            ['大小', '操作', '115'].forEach(txt => {
                const th = document.createElement('th');
                th.textContent = txt;
                if (txt === '115') th.className = 'nong-115-head';
                headRow.appendChild(th);
            });
            table.appendChild(headRow);
            const loadRow = document.createElement('tr');
            const loadTd = document.createElement('td');
            loadTd.colSpan = 4;
            loadTd.id = 'jav-nong-notice';
            const loadText = document.createTextNode('Loading…');
            const refreshBtn = document.createElement('a');
            refreshBtn.id = 'jav-nong-refresh';
            refreshBtn.href = '#';
            refreshBtn.textContent = '🔄 刷新';
            refreshBtn.title = '网络加载失败，点击重试';
            refreshBtn.addEventListener('click', e => {
                e.preventDefault();
                runSearch(table, avid, sel.value);
            });
            loadTd.appendChild(loadText);
            loadTd.appendChild(refreshBtn);
            loadRow.appendChild(loadTd);
            table.appendChild(loadRow);
            return table;
        }
        function fillTable(table, data, engineUrl) {
            const parseSize = s => {
                if (!s) return 0;
                const m = s.replace(/,/g, '').match(/([\d.]+)\s*(GiB|MiB|KiB|GB|MB|KB|B)?/i);
                if (!m) return 0;
                const n = parseFloat(m[1]);
                const u = (m[2] || 'B').toUpperCase();
                return n * ({ GIB: 1073741824, MIB: 1048576, KIB: 1024, GB: 1073741824, MB: 1048576, KB: 1024, B: 1 }[u] || 1);
            };
            data = [...data].sort((a, b) => parseSize(b.size) - parseSize(a.size));
            const notice = table.querySelector('#jav-nong-notice');
            if (notice) notice.parentElement.remove();
            if (!data.length) {
                const emptyRow = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4;
                td.innerHTML = `无搜索结果 <a href="${engineUrl}" target="_blank" style="color:red">前往查看</a>`;
                const refresh = document.createElement('a');
                refresh.href = '#';
                refresh.textContent = ' 🔄 刷新';
                refresh.style.cssText = 'margin-left:8px;color:#e74c3c;font-weight:bold;cursor:pointer;';
                refresh.addEventListener('click', e => {
                    e.preventDefault();
                    const engineKey = table.querySelector('select')?.value || CFG.defaultEngine;
                    runSearch(table, table.dataset.avid || '', engineKey);
                });
                td.appendChild(refresh);
                emptyRow.appendChild(td);
                table.appendChild(emptyRow);
                return;
            }
            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-maglink', item.maglink);
                const tdTitle = document.createElement('td');
                const nameSpan = document.createElement('span');
                nameSpan.className = 'nong-magnet-name';
                nameSpan.title = item.title;
                const _hasCJK = /[\u4e00-\u9fff]/.test(item.title);
                const _hasJP  = /[\u3040-\u309f\u30a0-\u30ff]/.test(item.title);
                const isChinese = /(?:[^A-Za-z]|^)FHDC(?:[^A-Za-z]|$)/i.test(item.title)
                    || /[-_]CH?(?:[^A-Za-z]|$)/.test(item.title)
                    || /中字/.test(item.title)
                    || /中文/.test(item.title)
                    || /自提/.test(item.title)
                    || /征用/.test(item.title)
                    || (_hasCJK && !_hasJP);
                const is4K = /(?:[^A-Za-z0-9]|^)(?:4K(?:UHD)?|2160P)(?:[^A-Za-z0-9]|$)/i.test(item.title);
                if (isChinese) {
                    const badge = document.createElement('span');
                    badge.textContent = '[中字]';
                    badge.style.cssText = 'display:inline-block;margin-right:5px;padding:1px 5px;font-size:11px;font-weight:800;color:#fff;background:#16a34a;border-radius:4px;vertical-align:middle;flex-shrink:0;box-shadow:0 0 0 1px rgba(22,163,74,.18);';
                    nameSpan.appendChild(badge);
                    nameSpan.style.background = 'linear-gradient(90deg,#dcfce7 0%,#f0fdf4 55%,#fff 100%)';
                    nameSpan.style.borderLeft = '4px solid #16a34a';
                    nameSpan.style.paddingLeft = '5px';
                }
                if (is4K) {
                    const badge4k = document.createElement('span');
                    badge4k.textContent = '[4K]';
                    badge4k.style.cssText = 'display:inline-block;margin-right:5px;padding:1px 5px;font-size:11px;font-weight:800;color:#fff;background:#2563eb;border-radius:4px;vertical-align:middle;flex-shrink:0;box-shadow:0 0 0 1px rgba(37,99,235,.18);';
                    nameSpan.insertBefore(badge4k, nameSpan.firstChild);
                    if (!isChinese) {
                        nameSpan.style.background = 'linear-gradient(90deg,#dbeafe 0%,#eff6ff 55%,#fff 100%)';
                        nameSpan.style.borderLeft = '4px solid #2563eb';
                        nameSpan.style.paddingLeft = '5px';
                    }
                }
                const titleLink = document.createElement('a');
                titleLink.href = item.src || item.maglink;
                titleLink.target = '_blank';
                titleLink.textContent = item.title;
                nameSpan.appendChild(titleLink);
                tdTitle.appendChild(nameSpan);
                tr.appendChild(tdTitle);
                const tdSize = document.createElement('td');
                tdSize.style.whiteSpace = 'nowrap';
                tdSize.textContent = item.size;
                tr.appendChild(tdSize);
                const tdOp = document.createElement('td');
                tdOp.style.whiteSpace = 'nowrap';
                const copyBtn = document.createElement('a');
                const magShort = item.maglink.substring(0, 60);
                const _extractCode = (text) => {
                    if (!text) return null;
                    const patterns = [
                        /FC2[-\s_]?(?:PPV)?[-\s_]?(\d{6,9})/i,
                        /([A-Z]{2,15})-(\d{2,10})(?:-(\d+))?/i,
                        /([A-Z]{2,15})-([A-Z]{0,2}\d{2,10})/i,
                        /^[A-Z0-9]+[-_](\d{6}[-_]\d{2,3})/i,
                        /(\d{6}[-_]\d{2,3})[-_][A-Z0-9]+$/i,
                        /(?<!\w)(\d{6}[-_]\d{2,3})(?!\w)/,
                        /([A-Z]{1,2})(\d{3,4})/i,
                    ];
                    for (const re of patterns) {
                        const m = text.match(re);
                        if (m) return m[0].toUpperCase();
                    }
                    return null;
                };
                const dnCode = _extractCode(item.title) || _extractCode(item.maglink);
                const magWithDn = magShort + (dnCode ? `&dn=${encodeURIComponent(dnCode)}` : '');
                copyBtn.href = magShort;
                copyBtn.title = magShort;
                copyBtn.className = 'nong-copy';
                copyBtn.textContent = '复制';
                copyBtn.addEventListener('click', e => {
                    e.preventDefault();
                    GM_setClipboard(magWithDn);
                    copyBtn.textContent = '✓';
                    setTimeout(() => { copyBtn.textContent = '复制'; }, 1000);
                });
                tdOp.appendChild(copyBtn);
                const checkBtn = document.createElement('a');
                checkBtn.href = '#';
                checkBtn.className = 'nong-check';
                checkBtn.textContent = '验车';
                checkBtn.addEventListener('click', e => {
                    e.preventDefault();
                    checkWhatslink(item.maglink);
                });
                tdOp.appendChild(checkBtn);
                tr.appendChild(tdOp);
                const tdOffline = document.createElement('td');
                tdOffline.className = 'nong-115-cell';
                const offBtn = document.createElement('a');
                offBtn.href = '#';
                offBtn.className = 'nong-offline-115';
                offBtn.textContent = '115';
                offBtn.addEventListener('click', e => {
                    e.preventDefault();
                    offline115(item.maglink);
                });
                tdOffline.appendChild(offBtn);
                tr.appendChild(tdOffline);
                table.appendChild(tr);
            });
        }
        async function runSearch(table, avid, engineKey) {
            [...table.querySelectorAll('tr:not(.nong-head-row)')].forEach(r => r.remove());
            const loadRow = document.createElement('tr');
            const loadTd = document.createElement('td');
            loadTd.colSpan = 4;
            loadTd.id = 'jav-nong-notice';
            const loadText = document.createTextNode('Loading…');
            const refreshBtn = table.querySelector('#jav-nong-refresh') || document.createElement('a');
            refreshBtn.id = 'jav-nong-refresh';
            refreshBtn.href = '#';
            refreshBtn.textContent = '🔄 刷新';
            refreshBtn.style.cssText = 'display:none;margin-left:8px;color:#e74c3c;font-weight:bold;cursor:pointer;';
            refreshBtn.onclick = e => { e.preventDefault(); runSearch(table, avid, engineKey); };
            loadTd.appendChild(loadText);
            loadTd.appendChild(refreshBtn);
            loadRow.appendChild(loadTd);
            table.appendChild(loadRow);
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                loadText.textContent = '加载超时 ';
                refreshBtn.style.display = 'inline';
            }, 8000);
            try {
                const allEngines = Engines.getAll();
                const fn = allEngines[engineKey] || Object.values(allEngines)[0];
                const { url, data } = await fn(avid);
                clearTimeout(timer);
                if (timedOut) return;
                fillTable(table, data, url);
            } catch(e) {
                clearTimeout(timer);
                errorLog('磁力搜索出错:', e);
                loadText.textContent = '搜索出错 ';
                refreshBtn.style.display = 'inline';
            }
        }
        function createMagnetWidget(avid) {
            const wrapper = document.createElement('div');
            wrapper.className = 'jav-nong-wrapper';
            wrapper.style.cssText = `display:inline-block;width:min(560px,100%);max-width:100%;box-sizing:border-box;padding:12px 12px 10px;background:#fafafa;border:1px solid #ebebeb;border-radius:6px;overflow:hidden;`;
            const header = document.createElement('div');
            header.style.cssText = 'margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
            const title = document.createElement('span');
            title.style.cssText = 'color:#0066cc;font-size:14px;font-weight:600;';
            title.textContent = '🔥 磁力搜索';
            header.appendChild(title);
            wrapper.appendChild(header);
            const table = buildTable(avid);
            wrapper.appendChild(table);
            const engineKey = CFG.defaultEngine;
            runSearch(table, avid, engineKey);
            return wrapper;
        }
        return { createMagnetWidget, javdbApi };
    })();
    Core.expose('__LAOSIJI_MAGNET__', Magnet);
    function openJavdbApiLoginDialog(nextUrl = '') {
        if (!document.body) {
            setTimeout(() => openJavdbApiLoginDialog(nextUrl), 50);
            return;
        }

        addJavdbApiLoginStyles();
        document.querySelector('#javdb-api-login-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'javdb-api-login-overlay';
        overlay.innerHTML = `<div class="javdb-api-login-panel"><div class="javdb-api-login-title">登录 JavDB</div><input class="javdb-api-login-input" id="javdb-api-login-account" type="text" autocomplete="username" placeholder="用户名 / 邮箱"><input class="javdb-api-login-input" id="javdb-api-login-password" type="password" autocomplete="current-password" placeholder="密码"><div class="javdb-api-login-actions"><button class="javdb-api-login-cancel" type="button">取消</button><button class="javdb-api-login-submit" type="button">登录</button></div></div>`;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        const submit = overlay.querySelector('.javdb-api-login-submit');
        const accountInput = overlay.querySelector('#javdb-api-login-account');
        const passwordInput = overlay.querySelector('#javdb-api-login-password');
        overlay.addEventListener('click', event => {
            if (event.target === overlay || event.target.closest('.javdb-api-login-cancel')) close();
        });
        overlay.addEventListener('keydown', event => {
            if (event.key === 'Escape') close();
            if (event.key === 'Enter') submit.click();
        });
        submit.addEventListener('click', async () => {
            const account = accountInput.value.trim();
            const password = passwordInput.value;
            if (!account || !password) {
                notify('JavDB App API', '请输入用户名和密码');
                return;
            }
            submit.disabled = true;
            submit.textContent = '登录中...';
            try {
                await Magnet.javdbApi.login(account, password);
                notify('JavDB App API', '登录成功，已保存授权');
                close();
                if (nextUrl) location.href = nextUrl;
                else if (location.hostname.includes('javdb') && /rankings|advanced_search/.test(location.pathname + location.search)) location.reload();
            } catch (err) {
                notify('JavDB App API', err?.message || '登录失败');
                submit.disabled = false;
                submit.textContent = '登录';
            }
        });
        setTimeout(() => accountInput.focus(), 0);
    }
    function renderJavdbApiLoginRequired(status, message = 'Top250 需要登录 JavDB API。可使用 JavDB 账号密码登录一次，脚本会在本地保存授权。', nextUrl = location.href) {
        addJavdbApiLoginStyles();

        if (!status) {
            scheduleJavdbApiLoginDialog(nextUrl);
            return;
        }

        status.classList.add('is-error');
        status.innerHTML = `<span>${message}</span><button class="javdb-api-login-inline" type="button">登录 JavDB</button>`;
        status.querySelector('.javdb-api-login-inline')?.addEventListener('click', () => openJavdbApiLoginDialog(nextUrl));
    }
    function scheduleJavdbApiLoginDialog(nextUrl = location.href) {
        if (document.documentElement.dataset.laosijiJavdbApiLoginPrompted === '1') return;
        document.documentElement.dataset.laosijiJavdbApiLoginPrompted = '1';
        setTimeout(() => {
            if (!Magnet.javdbApi.token() && !document.querySelector('#javdb-api-login-overlay')) {
                openJavdbApiLoginDialog(nextUrl);
            }
        }, 0);
    }
    function isJavdbApiAuthError(err) {
        const text = String(err?.message || err || '');
        return /JWT|token|authorization|unauthorized|login required|請登錄|請登入|请登录|请登入|登錄帳號|登录账号|未登錄|未登录/i.test(text);
    }
    const SiteJavBus = {
        match() {
            return location.hostname.includes('javbus');
        },
        isActorIndexPage(url = location.href) {
            try {
                const path = new URL(url, location.href).pathname.replace(/\/+$/, '');
                return /^\/(?:[a-z]{2}\/)?(?:uncensored\/)?actresses(?:\/\d+)?$/i.test(path);
            } catch (err) {
                return false;
            }
        },
        getVid() {
            const kw = document.querySelector('meta[name="keywords"]')?.content || '';
            return normalizeAvid(kw.split(',')[0].trim());
        },
        isDetailPage() {
            return (
                !!document.querySelector('.row.movie') &&
                !document.querySelector('#waterfall div.item')
            );
        },
        initPage(avid) {
            document.querySelector('.ad-box')?.remove();
            this._insertTopSettingsButton();
            setTimeout(() => this._insertTopSettingsButton(), 500);
            if (this.isActorIndexPage()) return;
            if (document.querySelector('#waterfall div.item')) {
                this._initListPage();
                return;
            }
            this._insertCopyButton(avid);
            const detailDefaults = DetailFlex.defaultCss('javbus');
            GM_addStyle(`.container{max-width:100%!important;width:100%!important;padding-left:20px!important;padding-right:20px!important}.row.movie{display:flex!important;gap:20px!important;align-items:flex-start!important;flex-wrap:nowrap!important;margin:0!important}.row.movie{--javbus-cover-flex:${detailDefaults.cover};--javbus-info-flex:${detailDefaults.info};--javbus-magnet-flex:${detailDefaults.magnet}}.col-md-9.screencap{flex:var(--javbus-cover-flex) 1 0!important;min-width:0!important;width:auto!important;float:none!important;padding:0!important}.col-md-3.info{flex:var(--javbus-info-flex) 1 0!important;min-width:0!important;width:auto!important;float:none!important;overflow:hidden!important;word-break:break-word!important}.jav-nong-slot{flex:var(--javbus-magnet-flex) 1 0!important;min-width:0!important;align-self:flex-start!important;overflow:hidden!important}.jav-nong-wrapper{width:560px;max-width:100%}.screencap img{width:100%;max-width:100%}.footer{padding:20px 0}`);
            this._insertMagnet(avid);
            this._replaceRecommendWithJavdbReviews(avid);
            setTimeout(() => this._replaceRecommendWithJavdbReviews(avid), 900);
        },
        _insertTopSettingsButton() {
            const navbar = document.querySelector('#navbar');
            if (!navbar || navbar.querySelector('.javbus-top-settings-nav')) return;
            const magnetNav = [...navbar.querySelectorAll(':scope > ul.nav.navbar-nav.navbar-right')].find(ul => {
                return ul.querySelector('.glyphicon-magnet') || /\u5df2\u6709\u78c1\u529b/.test(ul.textContent || '');
            });
            const settingsNav = document.createElement('ul');
            settingsNav.className = 'nav navbar-nav navbar-right javbus-top-settings-nav';
            settingsNav.innerHTML = `<li><a href="javascript:void(0)" class="javbus-top-settings-btn" title="\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e"><span class="glyphicon glyphicon-cog" style="font-size:12px;"></span><span class="hidden-md hidden-sm">\u8001\u53f8\u673a\u8bbe\u7f6e</span></a></li>`;
            settingsNav.querySelector('.javbus-top-settings-btn')?.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                QuickSettingsPanel.open(e.currentTarget);
            });
            if (magnetNav) {
                magnetNav.insertAdjacentElement('afterend', settingsNav);
            } else {
                navbar.appendChild(settingsNav);
            }
            injectStyle('javbus-top-settings-style', `#navbar .javbus-top-settings-btn{color:#2563eb!important;font-weight:700!important}#navbar .javbus-top-settings-btn:hover{color:#1d4ed8!important;background:rgba(37,99,235,.08)!important}`);
        },
        _insertCopyButton(avid) {
            const infoCol = document.querySelector("div[class='col-md-3 info']");
            if (!infoCol || !avid) return;
            const anchor = [...infoCol.querySelectorAll('p, h3, span')].find(el => {
                return el.textContent.trim().toUpperCase().includes(normalizeAvid(avid));
            });
            insertAvidCopyBtn(anchor || infoCol.querySelector('h3'), avid, null, true);
        },
        _insertMagnet(avid) {
            if (!CFG.magnetTable) return;
            const infoCol = document.querySelector("div[class='col-md-3 info']");
            if (!infoCol) return;
            document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove());
            const widget = Magnet.createMagnetWidget(avid);
            const slot = document.createElement('div');
            slot.className = 'jav-nong-slot';
            slot.style.overflow = 'hidden';
            slot.appendChild(widget);
            infoCol.after(slot);
        },
        _ensureJavdbReviewsStyle() {
            SiteJavDB._ensureApiMovieTabStyle?.();
            injectStyle('javbus-javdb-reviews-style', `.javbus-javdb-reviews{margin:18px 0 24px!important;border:1px solid #e5e7eb!important;border-radius:6px!important;background:#fff!important;overflow:hidden!important;box-shadow:0 1px 2px rgba(15,23,42,.04)!important}.javbus-javdb-reviews-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:10px 12px!important;border-bottom:1px solid #e5e7eb!important;background:#f8fafc!important;color:#1f2937!important;font-size:15px!important;font-weight:800!important}.javbus-javdb-reviews-toggle{display:inline-flex!important;align-items:center!important;gap:8px!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important;font:inherit!important;cursor:pointer!important}.javbus-javdb-reviews-toggle::before{content:"▸";color:#64748b;font-size:13px;transition:transform .16s ease}.javbus-javdb-reviews.is-expanded .javbus-javdb-reviews-toggle::before{transform:rotate(90deg)}.javbus-javdb-reviews-head a{color:#2563eb!important;font-size:12px!important;font-weight:800!important;text-decoration:none!important}.javbus-javdb-reviews-actions{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 auto!important}.javbus-javdb-reviews-badge{display:inline-flex!important;align-items:center!important;height:20px!important;margin-left:8px!important;padding:0 7px!important;border:1px solid #bfdbfe!important;border-radius:999px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:11px!important;line-height:1!important;vertical-align:middle!important}.javbus-javdb-reviews-body .message,.javbus-javdb-reviews-body .message-body{margin:0!important;border:0!important;background:transparent!important;padding:0!important}.javbus-javdb-reviews-body[hidden]{display:none!important}.javbus-javdb-reviews-footer{padding:10px 0 12px!important;background:#fff!important}.javbus-javdb-reviews-collapse-bar{padding:10px 12px 0!important;margin-bottom:0!important}`);
        },
        _findRecommendHeading() {
            return [...document.querySelectorAll('h4')].find(h4 => {
                const text = (h4.textContent || '').trim();
                if (!/推薦|推荐/.test(text)) return false;
                return (
                    h4.querySelector('#urad2') ||
                    /bootstr\s*\(\s*1\s*\)/i.test(h4.innerHTML || '') ||
                    /^推薦|^推荐/.test(text)
                );
            });
        },
        _isRecommendContainer(node) {
            if (!node || node.nodeType !== 1) return false;
            const mark = `${node.id || ''} ${node.className || ''}`;
            if (/sample/i.test(mark)) return false;
            return (
                /waterfall|recommend|related|masonry/i.test(mark) ||
                !!node.querySelector?.('.movie-box, .item, .masonry-brick')
            );
        },
        _replaceRecommendWithJavdbReviews(avid) {
            if (!avid) return;
            const existing = document.querySelector('.javbus-javdb-reviews');
            if (existing) {
                this._bindJavbusReviewLoadMore(existing);
                const next = existing.nextElementSibling;
                if (this._isRecommendContainer(next)) next.remove();
                return;
            }
            const heading = this._findRecommendHeading();
            if (!heading) return;
            this._ensureJavdbReviewsStyle();
            const next = heading.nextElementSibling;
            const panel = document.createElement('section');
            panel.className = 'javbus-javdb-reviews';
            panel.dataset.avid = avid;
            panel.innerHTML = `<div class="javbus-javdb-reviews-head"><button type="button" class="javbus-javdb-reviews-toggle" aria-expanded="false">JavDB 短评<span class="javbus-javdb-reviews-badge" title="此区块已由 JAV 老司机脚本替换">老司机</span></button><div class="javbus-javdb-reviews-actions">${SiteJavDB._renderApiReviewDefaultToggle()}<a class="javbus-javdb-reviews-link" href="https://javdb.com/search?q=${encodeURIComponent(avid)}" target="_blank" rel="noopener noreferrer">JavDB</a></div></div><div class="javbus-javdb-reviews-body" hidden><div class="javdb-api-tab-loading">正在读取短评...</div></div>`;
            heading.replaceWith(panel);
            if (this._isRecommendContainer(next)) next.remove();
            this._bindJavbusReviewLoadMore(panel);
            this._applyJavbusReviewsDefault(panel);
        },
        _renderJavbusReviewFooter(hasMore, shownCount) {
            return `<div class="javdb-api-tab-footer javbus-javdb-reviews-footer"> ${hasMore ? `<button type="button" class="javdb-api-tab-load-more javbus-javdb-reviews-load-more" data-shown-count="${shownCount}" data-load-limit="${JAVDB_REVIEW_MORE_LIMIT}">加载更多短评</button>` : `<div class="javdb-api-tab-end">已加载全部短评</div>`} </div>`;
        },
        _renderJavbusReviewCollapseBar() {
            return '<div class="javdb-api-review-collapse-bar javbus-javdb-reviews-collapse-bar"><button type="button" class="javdb-api-review-collapse javbus-javdb-reviews-collapse" data-javbus-reviews-collapse="1">收起短评</button></div>';
        },
        _renderJavbusReviews(reviews, offset = 0, hasMore = false) {
            const list = Array.isArray(reviews) ? reviews.slice(0, JAVDB_REVIEW_MORE_LIMIT) : [];
            const items = list.length ? SiteJavDB._renderApiReviewItems(list, offset, JAVDB_REVIEW_MORE_LIMIT) : '<div class="javdb-api-tab-empty">暂无短评</div>';
            return `<article class="message video-panel"><div class="message-body"> ${this._renderJavbusReviewCollapseBar()} <div class="javdb-api-tab-items"> ${items} </div> ${this._renderJavbusReviewFooter(hasMore, offset + list.length)} </div></article>`;
        },
        _setJavbusReviewsExpanded(panel, expanded) {
            if (!panel) return;
            const body = panel.querySelector('.javbus-javdb-reviews-body');
            const toggle = panel.querySelector('.javbus-javdb-reviews-toggle');
            panel.classList.toggle('is-expanded', !!expanded);
            if (body) body.hidden = !expanded;
            toggle?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        },
        _applyJavbusReviewsDefault(panel) {
            SiteJavDB._syncApiReviewDefaultToggles?.(panel);
            if (!panel || !CFG.reviewsDefaultExpanded) return;
            this._setJavbusReviewsExpanded(panel, true);
            if (panel.dataset.reviewsLoaded !== '1') {
                this._loadJavdbReviewsForJavbus(panel.dataset.avid || '', panel);
            }
        },
        _bindJavbusReviewLoadMore(panel) {
            if (!panel || panel.dataset.reviewsLoadMoreBound === '1') return;
            panel.dataset.reviewsLoadMoreBound = '1';
            panel.addEventListener('change', e => {
                const input = e.target?.closest?.('[data-laosiji-review-default-expanded]');
                if (!input || !panel.contains(input)) return;
                CFG.reviewsDefaultExpanded = input.checked;
                SiteJavDB._syncApiReviewDefaultToggles?.(document);
            }, true);
            panel.addEventListener('click', e => {
                const toggle = e.target?.closest?.('.javbus-javdb-reviews-toggle');
                if (toggle && panel.contains(toggle)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation?.();
                    const expanded = panel.classList.toggle('is-expanded');
                    this._setJavbusReviewsExpanded(panel, expanded);
                    if (expanded && panel.dataset.reviewsLoaded !== '1') {
                        this._loadJavdbReviewsForJavbus(panel.dataset.avid || '', panel);
                    }
                    return;
                }
                const collapse = e.target?.closest?.('[data-javbus-reviews-collapse]');
                if (collapse && panel.contains(collapse)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation?.();
                    this._setJavbusReviewsExpanded(panel, false);
                    return;
                }
                const btn = e.target?.closest?.('.javbus-javdb-reviews-load-more');
                if (!btn || !panel.contains(btn)) return;
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                this._loadMoreJavdbReviewsForJavbus(panel, btn);
            }, true);
        },
        async _loadJavdbReviewsForJavbus(avid, panel) {
            const body = panel?.querySelector('.javbus-javdb-reviews-body');
            if (!body) return;
            panel.dataset.reviewsLoaded = '1';
            try {
                const movie = await Magnet.javdbApi.searchMovieByNumber(avid, { limit: 5 });
                if (!movie?.id) {
                    body.innerHTML = `<div class="javdb-api-tab-empty">JavDB 未找到 ${SiteJavDB._escapeHtml(avid)} 的短评</div>`;
                    return;
                }
                const link = panel.querySelector('.javbus-javdb-reviews-link');
                if (link) link.href = `https://javdb.com/v/${encodeURIComponent(movie.id)}`;
                panel.dataset.movieId = movie.id;
                const json = await Magnet.javdbApi.movieReviews(movie.id, { page: 1, limit: JAVDB_REVIEW_INITIAL_LIMIT + 1 });
                const allReviews = Array.isArray(json?.data?.reviews) ? json.data.reviews : [];
                const reviews = allReviews.slice(0, JAVDB_REVIEW_INITIAL_LIMIT);
                body.innerHTML = reviews.length
                    ? this._renderJavbusReviews(reviews, 0, allReviews.length > JAVDB_REVIEW_INITIAL_LIMIT)
                    : '<div class="javdb-api-tab-empty">暂无短评</div>';
            } catch (err) {
                errorLog('JavBus JavDB 短评读取失败:', err);
                body.innerHTML = `<div class="javdb-api-tab-error"> ${SiteJavDB._escapeHtml(err.message || '短评读取失败')} </div>`;
            }
        },
        async _loadMoreJavdbReviewsForJavbus(panel, btn) {
            const movieId = panel?.dataset?.movieId || '';
            const body = panel?.querySelector('.javbus-javdb-reviews-body');
            if (!movieId || !body || !btn) return;
            const shown = body.querySelectorAll('.javdb-api-review').length;
            const take = Math.max(1, parseInt(btn.dataset.loadLimit, 10) || JAVDB_REVIEW_MORE_LIMIT);
            const oldText = btn.textContent;
            btn.textContent = '加载中...';
            btn.disabled = true;
            try {
                const json = await Magnet.javdbApi.movieReviews(movieId, { page: 1, limit: shown + take + 1 });
                const allReviews = Array.isArray(json?.data?.reviews) ? json.data.reviews : [];
                const nextReviews = allReviews.slice(shown, shown + take);
                const items = body.querySelector('.javdb-api-tab-items');
                const footer = body.querySelector('.javbus-javdb-reviews-footer');
                if (!nextReviews.length) {
                    if (footer) footer.outerHTML = this._renderJavbusReviewFooter(false, shown);
                    return;
                }
                items?.insertAdjacentHTML('beforeend', SiteJavDB._renderApiReviewItems(nextReviews, shown, take));
                const nextShown = shown + nextReviews.length;
                const hasMore = allReviews.length > nextShown;
                if (footer) footer.outerHTML = this._renderJavbusReviewFooter(hasMore, nextShown);
            } catch (err) {
                errorLog('JavBus JavDB 更多短评读取失败:', err);
                btn.textContent = '加载失败，点击重试';
                btn.disabled = false;
                return;
            }
            btn.textContent = oldText;
            btn.disabled = false;
        },
        _destroyMasonry(container) {
            try {
                const jq = window.jQuery || window.$;
                if (jq && jq(container).masonry) {
                    jq(container).masonry('destroy');
                }
            } catch (err) {  }
        },
        _swapCover(img) {
            const src = img.getAttribute('src') || '';
            if (!/\/(imgs|pics)\/(thumb|thumbs)\//i.test(src)) return;
            if (img.dataset.laosijiCoverSwapped === '1') return;
            let full = src.replace(/\/(imgs|pics)\/(thumb|thumbs)\//i, '/$1/cover/');
            if (!/nopic\.jpg/i.test(src)) {
                full = full.replace(/(\.jpg|\.jpeg|\.png)(?:([?#].*)?)$/i, '_b$1$2');
            }
            if (full === src) return;
            img.dataset.laosijiCoverSwapped = '1';
            img.dataset.laosijiThumbSrc = src;
            img.dataset.laosijiCoverSrc = full;
            img.addEventListener('error', function onErr() {
                img.removeEventListener('error', onErr);
                if (img.dataset.laosijiThumbSrc) img.src = img.dataset.laosijiThumbSrc;
            });
            img.src = full;
            img.setAttribute('src', full);
        },
        _decorateCard(item) {
            if (!item) return;
            if (item.dataset.laosijiGridCard === '1') {
                ListPreview.attach(item);
                return;
            }
            item.dataset.laosijiGridCard = '1';
            item.classList.add('jav-card', 'javbus-grid-card');
            item.style.removeProperty('position');
            item.style.removeProperty('top');
            item.style.removeProperty('left');
            item.style.removeProperty('width');
            const anchor = item.querySelector(':scope > a.movie-box[href]') || item.querySelector('a.movie-box[href]');
            anchor?.classList.add('jav-card-link', 'javbus-card-link');
            const frame = item.querySelector('.photo-frame');
            frame?.classList.add('jav-card-cover', 'javbus-cover-frame');
            const img = frame?.querySelector('img[src]') || item.querySelector('img[src]');
            if (img) {
                img.removeAttribute('width');
                img.removeAttribute('height');
                img.classList.add('jav-card-image', 'javbus-card-image');
                this._swapCover(img);
            }
            const info = item.querySelector('.photo-info');
            info?.classList.add('jav-card-title', 'javbus-card-title');
            const infoBody = info?.querySelector(':scope > span') || info;
            if (infoBody && !infoBody.querySelector(':scope > .video-title')) {
                const nodes = Array.from(infoBody.childNodes);
                const titleNodes = [];
                for (const node of nodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node;
                        if (el.matches('br, .item-tag, date, .jav-pan115-badge')) break;
                        titleNodes.push(node);
                        continue;
                    }
                    if (node.nodeType === Node.TEXT_NODE) {
                        if (node.textContent.trim() || titleNodes.length) titleNodes.push(node);
                    }
                }
                if (titleNodes.some(node => (node.textContent || '').trim())) {
                    const headline = document.createElement('span');
                    headline.className = 'video-title javbus-card-headline';
                    infoBody.insertBefore(headline, titleNodes[0]);
                    titleNodes.forEach(node => headline.appendChild(node));
                    while (headline.nextSibling?.nodeType === Node.TEXT_NODE && !headline.nextSibling.textContent.trim()) {
                        headline.nextSibling.remove();
                    }
                    if (headline.nextSibling?.nodeType === Node.ELEMENT_NODE && headline.nextSibling.matches('br')) {
                        headline.nextSibling.remove();
                    }
                }
            }
            const firstDate = info?.querySelector('date');
            if (firstDate && firstDate.dataset.laosijiCode !== '1') {
                firstDate.dataset.laosijiCode = '1';
                firstDate.classList.add('javbus-card-code');
            }
            ListPreview.attach(item);
        },
        _flattenWaterfall() {
            document.querySelectorAll('[id="waterfall"]').forEach(wf => {
                wf.querySelectorAll(':scope > #waterfall, :scope > .masonry').forEach(nested => {
                    while (nested.firstChild) wf.insertBefore(nested.firstChild, nested);
                    nested.remove();
                });
                wf.classList.remove('masonry');
                wf.style.setProperty('position', 'static', 'important');
                wf.style.setProperty('height', 'auto', 'important');
                wf.style.setProperty('width', 'auto', 'important');
                wf.querySelectorAll(':scope > .item').forEach(item => {
                    item.style.removeProperty('position');
                    item.style.removeProperty('top');
                    item.style.removeProperty('left');
                    item.style.removeProperty('width');
                });
            });
        },
        _getGridContainer() {
            return (
                document.querySelector('#waterfall.jav-card-grid') ||
                document.querySelector('#waterfall')
            );
        },
        _listPageNo(url = location.href) {
            try {
                const path = new URL(url, location.href).pathname.replace(/\/+$/, '');
                let m = path.match(/\/page\/(\d+)$/i);
                if (m) return parseInt(m[1], 10) || 1;
                m = path.match(/\/(\d+)$/);
                if (m) return parseInt(m[1], 10) || 1;
                return 1;
            } catch (e) {
                return 1;
            }
        },
        _resolveListNext(doc, baseUrl) {
            const result = { nextUrl: '', maxPage: 0, curPage: this._listPageNo(baseUrl) };
            try {
                const nav = doc.querySelector('.pagination') || doc;
                const links = [...nav.querySelectorAll('li > a[href], a[href]')];
                const pageMap = new Map();
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
                    result.nextUrl = this._buildListPageUrl(baseUrl, want);
                }
            } catch (e) {}
            return result;
        },
        _buildListPageUrl(baseUrl, page) {
            try {
                const u = new URL(baseUrl, location.href);
                let path = u.pathname.replace(/\/+$/, '');
                if (/\/page\/\d+$/i.test(path)) {
                    path = path.replace(/\/page\/\d+$/i, page <= 1 ? '' : `/page/${page}`);
                } else if (/\/\d+$/.test(path)) {
                    path = path.replace(/\/\d+$/, page <= 1 ? '' : `/${page}`);
                } else {
                    path = path === ''
                        ? (page <= 1 ? '' : `/page/${page}`)
                        : (page <= 1 ? path : `${path}/${page}`);
                }
                u.pathname = path || '/';
                return u.href;
            } catch (e) {
                return '';
            }
        },
        _initListPage() {
            this._flattenWaterfall();
            const container = this._getGridContainer();
            if (!container) return;
            this._destroyMasonry(container);
            container.classList.remove('masonry');
            container.style.setProperty('position', 'static', 'important');
            container.style.setProperty('height', 'auto', 'important');
            container.style.setProperty('width', 'auto', 'important');
            const needStyle = container.dataset.laosijiGrid !== '1';
            if (needStyle) {
                container.dataset.laosijiGrid = '1';
                container.classList.add('jav-card-grid', 'javbus-card-grid');
            }
            CardColumns.apply('javbus');
            container.querySelectorAll(':scope > .item').forEach(item => this._decorateCard(item));
            if (needStyle) {
                GM_addStyle(`.jav-card-grid{--jav-card-title-size:15px;--jav-card-title-line-height:1.5;--jav-card-title-lines:2;display:grid!important;grid-template-columns:repeat(var(--jav-card-columns,5),minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important;width:100%!important;height:auto!important;box-sizing:border-box!important}.jav-card{position:static!important;float:none!important;display:block!important;width:auto!important;height:100%!important;max-height:none!important;min-width:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important;text-align:left!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:6px!important;overflow:hidden!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important;transform:translateZ(0)!important;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease!important;will-change:transform!important}.jav-card:hover{border-color:rgba(37,99,235,.35)!important;box-shadow:0 10px 24px rgba(15,23,42,.16)!important;transform:translateY(-4px) scale(1.018)!important;z-index:2!important}.jav-card-link{display:flex!important;flex-direction:column!important;height:100%!important;max-height:none!important;overflow:hidden!important;color:#2563eb!important;text-decoration:none!important}.jav-card-link:visited{color:#7c3aed!important}.jav-card-cover{display:block!important;width:100%!important;height:auto!important;aspect-ratio:800 / 538!important;overflow:hidden!important;background:#f8fafc!important;border-bottom:1px solid #f1f5f9!important;margin:0!important}.jav-card-image{display:block!important;width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;background:#f8fafc!important;border:0!important;transition:opacity .18s ease!important}.jav-card-title{display:block!important;width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;box-sizing:border-box!important;flex:1 1 auto!important;min-height:0!important;margin:0!important;padding:7px 8px 9px!important;overflow:visible!important;color:inherit!important;font-size:var(--jav-card-title-size,15px)!important;line-height:var(--jav-card-title-line-height,1.5)!important;text-align:left!important;white-space:normal!important;word-break:break-word!important}.javbus-card-grid{position:static!important;--jav-card-columns:5;box-sizing:border-box!important}#waterfall.javbus-card-grid{display:grid!important;grid-template-columns:repeat(var(--jav-card-columns,5),minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important;min-height:0!important}body .container-fluid{padding-left:28px!important;padding-right:28px!important;box-sizing:border-box!important}#waterfall.javbus-card-grid>.item,.javbus-card-grid .item.javbus-grid-card{position:static!important;width:auto!important;float:none!important;margin:0!important;top:auto!important;left:auto!important}.javbus-card-grid .item .jav-card-link.javbus-card-link{width:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important}.javbus-card-grid .item .javbus-cover-frame.photo-frame{margin:0!important;height:auto!important}.javbus-card-grid .item .javbus-card-image{height:100%!important;margin:0!important}.javbus-card-title>span{display:block!important}.javbus-card-title .video-title{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:var(--jav-card-title-lines,2)!important;line-clamp:var(--jav-card-title-lines,2)!important;height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;max-height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;min-height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:normal!important;word-break:break-word!important;color:inherit!important;font-size:var(--jav-card-title-size,15px)!important;line-height:var(--jav-card-title-line-height,1.5)!important;margin-bottom:6px!important}.javbus-card-grid .item .javbus-card-title .jav-pan115-badge{display:inline-flex!important;width:auto!important;max-width:max-content!important;float:none!important;vertical-align:middle!important;margin:0 6px 4px 0!important}.javbus-card-title .item-tag{margin:6px 0 4px!important}.javbus-card-title date{color:#94a3b8!important;font-size:12px!important}.javbus-card-title date.javbus-card-code{display:inline-block!important;color:inherit!important;font-size:15px!important;font-weight:800!important;margin-top:2px!important}@media (max-width:1100px){.javbus-card-grid{--jav-card-columns:4}}@media (max-width:820px){.javbus-card-grid{--jav-card-columns:3}}@media (max-width:560px){.javbus-card-grid{--jav-card-columns:2;gap:10px!important}}`);
            }
            setTimeout(() => {
                Runtime.refreshListPage();
            }, 0);
            setTimeout(() => {
                this._flattenWaterfall();
                container.querySelectorAll(':scope > .item').forEach(item => this._decorateCard(item));
                Runtime.syncListPreview();
            }, 450);
        },
    };
    const SiteJavDB = {
        match() {
            return location.hostname.includes('javdb');
        },
        getVid() {
            const el = document.querySelector('a.button.is-white.copy-to-clipboard');
            return normalizeAvid(el?.dataset?.clipboardText || '');
        },
        initPage(avid) {
            document.querySelector('.app-desktop-banner')?.remove();
            this._dismissOver18Modal();
            this._insertTopSettingsButton();
            this._ensureDarkThemeStyle();
            this._hideNativeLayoutSwitcher();
            this._stripNativeLayoutParam();
            this._installApiRankingShell();
            this._hideScriptFc2AdvancedSearchBox();
            this._initPaginationJump();
            if (this._redirectCurrentApiRankingEntry()) return;
            if (this._getApiRankingShellMode()) {
                this._initApiRankingShellPage().catch(err => errorLog('JavDB API 榜单渲染失败:', err));
                return;
            }
            if (this._getApiDetailShellMode()) {
                this._initApiDetailShellPage().catch(err => errorLog('JavDB API 详情渲染失败:', err));
                return;
            }
            if (!location.pathname.startsWith('/v/')) {
                this._initListPage();
                return;
            }
            this._insertCopyButton(avid);
            this._hideDownloadCorrectionBlock();
            GM_addStyle(`.container{max-width:100%!important}.movie-panel-info{overflow:hidden;word-break:break-word}.movie-panel-info .panel-block{flex-wrap:wrap}.movie-panel-info .value{overflow:hidden;word-break:break-word}.review-buttons>.panel-block:has(a[href="#magnet-links"]),.review-buttons>.panel-block:has(a[href*="/corrections/new"]){display:none!important}`);
            this._ensureDetailLayout();
            this._insertMagnet(avid);
            this._initApiMovieTabs();
        },
        _hideDownloadCorrectionBlock() {
            document.querySelectorAll('.review-buttons > .panel-block').forEach(block => {
                if (block.querySelector('a[href="#magnet-links"], a[href*="/corrections/new"]')) {
                    block.remove();
                }
            });
        },
        _hideNativeLayoutSwitcher() {
            document.querySelectorAll('.toolbar > .button-group').forEach(group => {
                const hrefs = [...group.querySelectorAll('a[href]')].map(a => a.getAttribute('href') || '');
                const labels = [...group.querySelectorAll('a.button')].map(a => (a.textContent || '').replace(/\s+/g, ''));
                const hasLayoutHref = hrefs.some(href => /[?&]lm=h\b/i.test(href)) && hrefs.some(href => /[?&]lm=v\b/i.test(href));
                const hasLayoutLabel = labels.some(text => /大封面|大封面/i.test(text)) && labels.some(text => /小封面|小封面/i.test(text));
                if (hasLayoutHref || hasLayoutLabel) {
                    group.dataset.laosijiHiddenNativeLayout = '1';
                }
            });
            injectStyle('javdb-native-layout-style', `.toolbar>.button-group[data-laosiji-hidden-native-layout="1"]{display:none!important}`);
        },
        _stripNativeLayoutParam(root = document) {
            try {
                const current = new URL(location.href);
                if (current.searchParams.has('lm')) {
                    current.searchParams.delete('lm');
                    history.replaceState(history.state, document.title, current.pathname + current.search + current.hash);
                }
            } catch {}
            root.querySelectorAll?.('a[href*="lm="]').forEach(a => {
                try {
                    const raw = a.getAttribute('href') || '';
                    const url = new URL(raw, location.href);
                    if (!url.searchParams.has('lm')) return;
                    url.searchParams.delete('lm');
                    a.setAttribute('href', url.pathname + url.search + url.hash);
                } catch {}
            });
        },
        _ensureDarkThemeStyle() {
            injectStyle('javdb-dark-style', `html[data-theme="dark"] .jav-card{background:#252525!important;border-color:#3f3f46!important;box-shadow:0 1px 4px rgba(0,0,0,.34)!important}html[data-theme="dark"] .jav-card:hover{border-color:rgba(96,165,250,.58)!important;box-shadow:0 12px 26px rgba(0,0,0,.38)!important}html[data-theme="dark"] .jav-card-link,html[data-theme="dark"] .javdb-card-grid .item .javdb-card-link.box{background:#252525!important;color:#8ab4ff!important}html[data-theme="dark"] .jav-card-link:visited{color:#c4a7ff!important}html[data-theme="dark"] .jav-card-cover,html[data-theme="dark"] .jav-card-image{background:#18181b!important;border-color:#3f3f46!important}html[data-theme="dark"] .javdb-card-score{color:#cbd5e1!important}html[data-theme="dark"] .javdb-card-meta{color:#94a3b8!important}html[data-theme="dark"] .javdb-card-tags .tag:not(.is-success):not(.is-info):not(.is-primary):not(.is-warning):not(.is-danger){background:#333333!important;color:#d1d5db!important}html[data-theme="dark"] .jav-nong-wrapper{background:transparent!important;color:#d1d5db!important}html[data-theme="dark"] #jav-nong-table{background:#2f2f2f!important;color:#d1d5db!important}html[data-theme="dark"] #jav-nong-table th,html[data-theme="dark"] #jav-nong-table td{background:#262626!important;border-color:#3f3f46!important;color:#d1d5db!important}html[data-theme="dark"] #jav-nong-table .nong-head-row th{background:#303030!important;color:#e5e7eb!important}html[data-theme="dark"] #jav-nong-table .nong-magnet-name>a{color:#8ab4ff!important}html[data-theme="dark"] #jav-nong-notice,html[data-theme="dark"] #jav-nong-refresh{color:#cbd5e1!important}html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] article.message.video-panel,html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] article.message.video-panel .message-body{background:#252525!important;border-color:#3f3f46!important;color:#e5e7eb!important}html[data-theme="dark"] .javdb-api-review,html[data-theme="dark"] .javdb-api-related{background:#252525!important;border-bottom-color:#3f3f46!important}html[data-theme="dark"] .javdb-api-review-head,html[data-theme="dark"] .javdb-api-related-head,html[data-theme="dark"] .javdb-api-review-content,html[data-theme="dark"] .javdb-api-related-desc{color:#e5e7eb!important}html[data-theme="dark"] .javdb-api-related-meta,html[data-theme="dark"] .javdb-api-tab-loading,html[data-theme="dark"] .javdb-api-tab-empty,html[data-theme="dark"] .javdb-api-tab-end{color:#cbd5e1!important}html[data-theme="dark"] .javdb-api-tab-error{color:#fb7185!important}html[data-theme="dark"] .javdb-api-review-toggle,html[data-theme="dark"] .javdb-api-review-collapse,html[data-theme="dark"] .javdb-api-tab-load-more{background:#2f3b4f!important;border-color:#4b5f80!important;color:#dbeafe!important}html[data-theme="dark"] .javdb-api-review-toggle::before{color:#93c5fd!important}html[data-theme="dark"] .javdb-api-tab-badge{background:#1e3a5f!important;border-color:#3b82f6!important;color:#dbeafe!important}html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] .magnet-links .item{background:#252525!important;border-color:#3f3f46!important;color:#e5e7eb!important}html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] .magnet-links .item.odd{background:#2a2a2a!important}html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] .magnet-links .magnet-name a,html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] .magnet-links a{color:#8ab4ff!important}html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] .magnet-links .meta,html[data-theme="dark"] #tabs-container[data-laosiji-api-movie-tabs] .magnet-links .date{color:#94a3b8!important}html[data-theme="dark"] .jav-stills-shell{background:#252525!important;border-color:#3f3f46!important;box-shadow:0 8px 18px rgba(0,0,0,.28)!important}html[data-theme="dark"] .jav-stills-rail>a,html[data-theme="dark"] .jav-stills-rail>.tile-item,html[data-theme="dark"] .jav-stills-rail>.preview-video-container{background:#1f2937!important;border-color:#4b5563!important;box-shadow:none!important}html[data-theme="dark"] .jav-stills-arrow{background:rgba(39,39,42,.92)!important;border-color:#52525b!important;color:#e5e7eb!important}html[data-theme="dark"] .jav-stills-arrow:hover{background:#303030!important;border-color:rgba(96,165,250,.58)!important}`);
            injectStyle('javdb-review-default-dark-style', `html[data-theme="dark"] .javdb-api-review-default-toggle{color:#cbd5e1!important}html[data-theme="dark"] .javdb-api-review-default-switch{border-color:#52525b!important;background:#3f3f46!important}`);
        },
        _dismissOver18Modal() {
            if (!this.match()) return;
            const modal = document.querySelector('.modal.is-active.over18-modal');
            if (!modal) return;
            const ok = modal.querySelector('a.button.is-success[href*="/over18?respond=1"]');
            const href = ok?.getAttribute('href') || '';
            if (href && sessionStorage.getItem('javdb_over18_confirming') !== '1') {
                sessionStorage.setItem('javdb_over18_confirming', '1');
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: new URL(href, location.origin).href,
                    onload: () => sessionStorage.removeItem('javdb_over18_confirming'),
                    onerror: () => sessionStorage.removeItem('javdb_over18_confirming'),
                    ontimeout: () => sessionStorage.removeItem('javdb_over18_confirming'),
                });
            }
            modal.remove();
            document.documentElement.classList.remove('is-clipped');
            document.body.classList.remove('is-clipped');
        },
        _escapeHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, ch => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            }[ch]));
        },
        _getCurrentMovieId() {
            const pathHit = location.pathname.match(/^\/v\/([^/?#]+)/);
            if (pathHit) return decodeURIComponent(pathHit[1]);
            const tabUrl = document.querySelector('.review-tab[data-url*="/v/"], .list-tab[data-url*="/v/"]')?.dataset?.url || '';
            const tabHit = tabUrl.match(/\/v\/([^/]+)/);
            if (tabHit) return decodeURIComponent(tabHit[1]);
            return this._getApiDetailShellMode()?.movieId || '';
        },
        _formatApiDate(value) {
            const text = String(value || '');
            if (!text) return '';
            return text.includes('T') ? text.slice(0, 10) : text;
        },
        _formatApiSize(size) {
            const mb = Number(size);
            if (!Number.isFinite(mb) || mb <= 0) return '';
            return mb >= 1024 ? `${(mb / 1024).toFixed(mb >= 10240 ? 1 : 2)}GB` : `${Math.round(mb)}MB`;
        },
        _renderApiLinkedText(value) {
            const text = String(value || '');
            const re = /((?:magnet:\?|ed2k:\/\/|https?:\/\/)[^\s"'<>]+)/gi;
            let html = '';
            let last = 0;
            text.replace(re, (match, _link, offset) => {
                html += this._escapeHtml(text.slice(last, offset));
                const safe = this._escapeHtml(match);
                html += `<a class="a-primary" href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`;
                last = offset + match.length;
                return match;
            });
            html += this._escapeHtml(text.slice(last));
            return html.replace(/\n/g, '<br>');
        },
        _renderApiStars(score) {
            const value = Math.max(0, Math.min(5, parseInt(score, 10) || 0));
            return `<span class="score-stars"> ${Array.from({ length: 5 }, (_, index) => `<i class="icon-star${index < value ? '' : ' gray'}"></i>`).join('')} </span>`;
        },
        _ensureApiMovieTabStyle() {
            injectStyle('javdb-api-movie-tab-style', `#tabs-container[data-laosiji-api-movie-tabs] .top-meta{display:none!important}.javdb-api-tab-loading,.javdb-api-tab-empty,.javdb-api-tab-error,.javdb-api-tab-end{padding:12px 14px!important;color:#64748b!important;font-size:13px!important;font-weight:700!important}.javdb-api-tab-error{color:#be123c!important}.javdb-api-review,.javdb-api-related{margin:0!important;padding:11px 12px!important;border-bottom:1px solid #edf2f7!important;background:#fff!important;word-break:break-word!important}.javdb-api-review-head,.javdb-api-related-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;flex-wrap:wrap!important;color:#334155!important;font-size:13px!important}.javdb-api-review-content,.javdb-api-related-desc{margin-top:7px!important;color:#1f2937!important;font-size:13px!important;line-height:1.65!important;white-space:normal!important}.javdb-api-related-meta{display:flex!important;gap:10px!important;flex-wrap:wrap!important;margin-top:7px!important;color:#64748b!important;font-size:12px!important}.javdb-api-tab-footer{padding:10px 0 0!important}.javdb-api-tab-load-more{width:100%!important;min-height:34px!important;border:1px solid #bfdbfe!important;border-radius:6px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:13px!important;font-weight:800!important;cursor:pointer!important}.javdb-api-review-toggle{width:100%!important;min-height:38px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;border:1px solid #e2e8f0!important;border-radius:6px!important;background:#f8fafc!important;color:#334155!important;font-size:13px!important;font-weight:850!important;cursor:pointer!important}.javdb-api-review-toggle::before{content:"▸";color:#64748b;font-size:13px}.javdb-api-review-collapse-bar{display:flex!important;align-items:center!important;gap:8px!important;justify-content:flex-end!important;margin-bottom:8px!important}.javdb-api-review-default-row{display:flex!important;justify-content:flex-end!important;margin-bottom:8px!important}.javdb-api-review-default-toggle{display:inline-flex!important;align-items:center!important;gap:6px!important;color:#475569!important;font-size:12px!important;font-weight:800!important;line-height:1!important;white-space:nowrap!important;cursor:pointer!important;user-select:none!important}.javdb-api-review-default-toggle input{position:absolute!important;opacity:0!important;pointer-events:none!important}.javdb-api-review-default-switch{position:relative!important;width:28px!important;height:16px!important;border:1px solid #cbd5e1!important;border-radius:999px!important;background:#e5e7eb!important;transition:background .16s ease,border-color .16s ease!important}.javdb-api-review-default-switch::before{content:""!important;position:absolute!important;top:2px!important;left:2px!important;width:10px!important;height:10px!important;border-radius:50%!important;background:#fff!important;box-shadow:0 1px 2px rgba(15,23,42,.22)!important;transition:transform .16s ease!important}.javdb-api-review-default-toggle input:checked+.javdb-api-review-default-switch{border-color:#2563eb!important;background:#2563eb!important}.javdb-api-review-default-toggle input:checked+.javdb-api-review-default-switch::before{transform:translateX(12px)!important}.javdb-api-review-collapse{min-height:28px!important;padding:0 10px!important;border:1px solid #e2e8f0!important;border-radius:6px!important;background:#f8fafc!important;color:#334155!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}.javdb-api-tab-badge-item{display:flex!important;align-items:center!important;margin-left:4px!important;pointer-events:auto!important}.javdb-api-tab-badge{margin-left:0!important;align-self:center!important;display:inline-flex!important;align-items:center!important;height:20px!important;padding:0 7px!important;border:1px solid #bfdbfe!important;border-radius:999px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:11px!important;font-weight:850!important;line-height:1!important;white-space:nowrap!important}`);
        },
        _ensureApiMovieTabBadge() {
            const tabs = document.querySelector('.tabs.no-bottom');
            if (!tabs) return;
            let badge = tabs.querySelector('.javdb-api-tab-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'javdb-api-tab-badge';
            }
            badge.textContent = '老司机';
            badge.title = '此区块已由 JAV 老司机脚本替换';
            let badgeItem = tabs.querySelector('.javdb-api-tab-badge-item');
            if (!badgeItem) {
                badgeItem = document.createElement('li');
                badgeItem.className = 'javdb-api-tab-badge-item';
            }
            if (!badgeItem.contains(badge)) badgeItem.appendChild(badge);
            const listTab = document.querySelector('[data-movie-tab-target="listTab"]');
            if (listTab?.parentElement) {
                if (badgeItem.parentElement !== listTab.parentElement || badgeItem.previousElementSibling !== listTab) {
                    listTab.insertAdjacentElement('afterend', badgeItem);
                }
            } else if (!tabs.contains(badgeItem)) {
                tabs.appendChild(badgeItem);
            }
        },
        _renderApiTabLoading(text = '读取中...') {
            return `<article class="message video-panel"><div class="message-body"><div class="javdb-api-tab-loading"> ${this._escapeHtml(text)} </div></div></article>`;
        },
        _renderApiTabError(text) {
            return `<article class="message video-panel"><div class="message-body"><div class="javdb-api-tab-error"> ${this._escapeHtml(text || '读取失败')} </div></div></article>`;
        },
        _renderApiReviewDefaultToggle() {
            return `<label class="javdb-api-review-default-toggle" title="控制以后进入详情页时短评默认展开或折叠"><input type="checkbox" data-laosiji-review-default-expanded="1"${CFG.reviewsDefaultExpanded ? ' checked' : ''}><span class="javdb-api-review-default-switch"></span><span>默认展开</span></label>`;
        },
        _syncApiReviewDefaultToggles(root = document) {
            root.querySelectorAll?.('[data-laosiji-review-default-expanded]').forEach(input => {
                input.checked = CFG.reviewsDefaultExpanded;
            });
        },
        _renderApiReviewCollapsed() {
            return `<article class="message video-panel"><div class="message-body"><div class="javdb-api-review-default-row">${this._renderApiReviewDefaultToggle()}</div><button type="button" class="javdb-api-review-toggle" data-laosiji-api-expand-reviews="1">展开短评</button></div></article>`;
        },
        _renderApiReviewCollapseBar() {
            return `<div class="javdb-api-review-collapse-bar">${this._renderApiReviewDefaultToggle()}<button type="button" class="javdb-api-review-collapse" data-laosiji-api-collapse-reviews="1">收起短评</button></div>`;
        },
        _renderApiTabFooter(tab, nextPage, hasNext, doneText, moreText, pageSize = 20, shownCount = 0, loadLimit = pageSize) {
            return `<div class="javdb-api-tab-footer"> ${hasNext ? `<button type="button" class="javdb-api-tab-load-more" data-laosiji-api-load-tab="${tab}" data-next-page="${nextPage}" data-page-size="${pageSize}" data-shown-count="${shownCount}" data-load-limit="${loadLimit}">${this._escapeHtml(moreText)}</button>` : `<div class="javdb-api-tab-end">${this._escapeHtml(doneText)}</div>`} </div>`;
        },
        _renderApiMagnetRows(magnets) {
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
                return `<div class="item columns is-desktop ${index % 2 === 0 ? 'odd' : ''}"><div class="magnet-name column is-four-fifths"><a href="${this._escapeHtml(magnet)}" title="右鍵點擊並選擇「複製鏈接地址」"><span class="name">${this._escapeHtml(name)}</span> ${meta ? `<br><span class="meta">${this._escapeHtml(meta)}</span>` : ''}${tags ? `<br><div class="tags">${tags}</div>` : ''} </a></div><div class="buttons column"><button class="button is-info is-small copy-to-clipboard" data-clipboard-text="${this._escapeHtml(magnet)}" type="button">&nbsp;複製&nbsp;</button> ${pikpak} </div><div class="date column"><span class="time">${this._escapeHtml(this._formatApiDate(item?.created_at))}</span></div></div>`;
            }).filter(Boolean).join('');
        },
        _renderApiMagnets(magnets) {
            return `<article class="message video-panel"><div class="message-body"><div id="magnets-content" class="magnet-links" data-laosiji-api-source="1"> ${this._renderApiMagnetRows(magnets)} </div></div></article>`;
        },
        _renderApiReviewItems(reviews, offset = 0, limit = JAVDB_REVIEW_MORE_LIMIT) {
            const size = Math.max(1, parseInt(limit, 10) || JAVDB_REVIEW_MORE_LIMIT);
            const list = Array.isArray(reviews) ? reviews.slice(0, size) : [];
            return list.map((item, index) => `<div class="javdb-api-review"><div class="javdb-api-review-head"><span><strong>#${offset + index + 1}</strong> ${this._escapeHtml(item?.username || '匿名')}</span><span>${this._renderApiStars(item?.score)} ${this._escapeHtml(this._formatApiDate(item?.created_at))} ${Number(item?.likes_count || 0) ? ` · 點讚:${this._escapeHtml(item.likes_count)}` : ''}</span></div><div class="javdb-api-review-content">${this._renderApiLinkedText(item?.content || '')}</div></div>`).join('');
        },
        _renderApiReviews(reviews, page, limit) {
            const list = Array.isArray(reviews) ? reviews.slice(0, limit) : [];
            const items = list.length ? this._renderApiReviewItems(list, (page - 1) * limit, limit) : '<div class="javdb-api-tab-empty">暂无短评</div>';
            return `<article class="message video-panel"><div class="message-body"> ${this._renderApiReviewCollapseBar()} <div class="javdb-api-tab-items"> ${items} </div> ${this._renderApiTabFooter('reviews', page + 1, list.length >= limit, '已加载全部短评', '加载更多短评', limit, list.length, JAVDB_REVIEW_MORE_LIMIT)} </div></article>`;
        },
        _renderApiRelatedItems(lists, offset = 0) {
            const list = Array.isArray(lists) ? lists : [];
            return list.map((item, index) => {
                const href = `/lists/${encodeURIComponent(item?.id || '')}`;
                return `<div class="javdb-api-related"><div class="javdb-api-related-head"><span><strong>#${offset + index + 1}</strong><a href="${this._escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${this._escapeHtml(item?.name || '未命名清單')}</a></span><span>${this._escapeHtml(this._formatApiDate(item?.created_at))}</span></div> ${item?.description ? `<div class="javdb-api-related-desc">${this._renderApiLinkedText(item.description)}</div>` : ''} <div class="javdb-api-related-meta"><span>影片:${this._escapeHtml(item?.movies_count ?? '-')}</span><span>收藏:${this._escapeHtml(item?.collections_count ?? '-')}</span><span>浏览:${this._escapeHtml(item?.views_count ?? '-')}</span></div></div>`;
            }).join('');
        },
        _renderApiRelatedLists(lists, page, limit) {
            const list = Array.isArray(lists) ? lists : [];
            const items = list.length ? this._renderApiRelatedItems(list, (page - 1) * limit) : '<div class="javdb-api-tab-empty">暂无相关清单</div>';
            return `<article class="message video-panel"><div class="message-body"><div class="javdb-api-tab-items"> ${items} </div> ${this._renderApiTabFooter('lists', page + 1, list.length >= limit, '已加载全部清单', '加载更多清单')} </div></article>`;
        },
        _setApiMovieTab(active) {
            const tabs = {
                magnets: document.querySelector('[data-movie-tab-target="magnetTab"]'),
                reviews: document.querySelector('[data-movie-tab-target="reviewTab"]'),
                lists: document.querySelector('[data-movie-tab-target="listTab"]'),
            };
            const panes = {
                magnets: document.getElementById('magnets'),
                reviews: document.getElementById('reviews'),
                lists: document.getElementById('lists'),
            };
            Object.entries(tabs).forEach(([key, tab]) => tab?.classList.toggle('is-active', key === active));
            Object.entries(panes).forEach(([key, pane]) => {
                if (pane) pane.style.display = key === active ? '' : 'none';
            });
        },
        _updateApiTabFooter(pane, tab, nextPage, hasNext, doneText, moreText) {
            const footer = pane?.querySelector('.javdb-api-tab-footer');
            if (!footer) return;
            const pageSize = tab === 'reviews' ? JAVDB_REVIEW_MORE_LIMIT : 20;
            const shownCount = tab === 'reviews' ? pane.querySelectorAll('.javdb-api-review').length : 0;
            footer.outerHTML = this._renderApiTabFooter(tab, nextPage, hasNext, doneText, moreText, pageSize, shownCount, pageSize);
        },
        async _loadApiMovieTab(movieId, tab, page = 1, append = false, pageSize = null, shownCount = null, loadLimit = null) {
            const pane = document.getElementById(tab === 'magnets' ? 'magnets' : tab);
            if (!pane || !movieId) return;
            const visibleReviewCount = tab === 'reviews' && append
                ? Math.max(0, parseInt(shownCount, 10) || pane.querySelectorAll('.javdb-api-review').length || 0)
                : 0;
            const reviewTake = append
                ? Math.max(1, parseInt(loadLimit, 10) || JAVDB_REVIEW_MORE_LIMIT)
                : JAVDB_REVIEW_INITIAL_LIMIT;
            const limit = tab === 'reviews' ? visibleReviewCount + reviewTake : 20;
            if (!append) pane.innerHTML = this._renderApiTabLoading(tab === 'magnets' ? '正在读取磁力...' : tab === 'reviews' ? '正在读取短评...' : '正在读取相关清单...');
            try {
                if (tab === 'magnets') {
                    const json = await Magnet.javdbApi.movieMagnets(movieId);
                    const magnets = Array.isArray(json?.data?.magnets) ? json.data.magnets : [];
                    pane.innerHTML = this._renderApiMagnets(magnets);
                    pane.dataset.laosijiApiLoaded = '1';
                    return;
                }
                if (tab === 'reviews') {
                    const json = await Magnet.javdbApi.movieReviews(movieId, { page: 1, limit });
                    const allReviews = Array.isArray(json?.data?.reviews) ? json.data.reviews : [];
                    const reviews = append
                        ? allReviews.slice(visibleReviewCount, visibleReviewCount + reviewTake)
                        : allReviews.slice(0, JAVDB_REVIEW_INITIAL_LIMIT);
                    if (append) {
                        pane.querySelector('.javdb-api-tab-items')?.insertAdjacentHTML('beforeend', this._renderApiReviewItems(reviews, visibleReviewCount, reviewTake));
                        this._updateApiTabFooter(pane, 'reviews', page + 1, allReviews.length >= limit && reviews.length > 0, '已加载全部短评', '加载更多短评');
                    } else {
                        pane.innerHTML = this._renderApiReviews(reviews, page, JAVDB_REVIEW_INITIAL_LIMIT);
                    }
                    pane.dataset.laosijiApiLoaded = '1';
                    return;
                }
                if (tab === 'lists') {
                    const json = await Magnet.javdbApi.relatedLists(movieId, { page, limit });
                    const lists = Array.isArray(json?.data?.lists) ? json.data.lists : [];
                    if (append) {
                        pane.querySelector('.javdb-api-tab-items')?.insertAdjacentHTML('beforeend', this._renderApiRelatedItems(lists, (page - 1) * limit));
                        this._updateApiTabFooter(pane, 'lists', page + 1, lists.length >= limit, '已加载全部清单', '加载更多清单');
                    } else {
                        pane.innerHTML = this._renderApiRelatedLists(lists, page, limit);
                    }
                    pane.dataset.laosijiApiLoaded = '1';
                }
            } catch (err) {
                errorLog('JavDB API tab 读取失败:', tab, err);
                if (append) {
                    this._updateApiTabFooter(pane, tab, page, true, '', '加载失败，点击重试');
                } else {
                    pane.innerHTML = this._renderApiTabError(err.message || '读取失败');
                }
            }
        },
        _initApiMovieTabs() {
            const movieId = this._getCurrentMovieId();
            const tabsContainer = document.getElementById('tabs-container');
            const magnetsPane = document.getElementById('magnets');
            const reviewsPane = document.getElementById('reviews');
            const listsPane = document.getElementById('lists');
            if (!movieId || !tabsContainer || !magnetsPane || !reviewsPane || !listsPane) return;
            if (tabsContainer.dataset.laosijiApiMovieTabs === movieId) return;
            tabsContainer.dataset.laosijiApiMovieTabs = movieId;
            this._ensureApiMovieTabStyle();
            this._ensureApiMovieTabBadge();
            const tabLinks = {
                magnets: document.querySelector('[data-movie-tab-target="magnetTab"] a'),
                reviews: document.querySelector('[data-movie-tab-target="reviewTab"] a'),
                lists: document.querySelector('[data-movie-tab-target="listTab"] a'),
            };
            Object.entries(tabLinks).forEach(([key, link]) => {
                if (!link) return;
                link.dataset.laosijiApiTab = key;
                link.removeAttribute('data-action');
                link.removeAttribute('data-url');
            });
            const root = tabsContainer.closest('.columns') || tabsContainer;
            root.addEventListener('change', e => {
                const input = e.target?.closest?.('[data-laosiji-review-default-expanded]');
                if (!input || !root.contains(input)) return;
                CFG.reviewsDefaultExpanded = input.checked;
                this._syncApiReviewDefaultToggles(document);
            }, true);
            root.addEventListener('click', e => {
                if (e.target?.closest?.('.javdb-api-tab-badge-item')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return;
                }
                const copyBtn = e.target?.closest?.('.copy-to-clipboard[data-clipboard-text]');
                if (copyBtn && tabsContainer.contains(copyBtn)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    GM_setClipboard(copyBtn.dataset.clipboardText || '');
                    const oldText = copyBtn.textContent;
                    copyBtn.textContent = '已複製';
                    setTimeout(() => { copyBtn.textContent = oldText; }, 900);
                    return;
                }
                const loadMore = e.target?.closest?.('.javdb-api-tab-load-more[data-laosiji-api-load-tab]');
                if (loadMore && tabsContainer.contains(loadMore)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const tab = loadMore.dataset.laosijiApiLoadTab;
                    const nextPage = parseInt(loadMore.dataset.nextPage || '2', 10) || 2;
                    const pageSize = parseInt(loadMore.dataset.pageSize || '', 10) || null;
                    const shownCount = parseInt(loadMore.dataset.shownCount || '', 10) || null;
                    const loadLimit = parseInt(loadMore.dataset.loadLimit || '', 10) || null;
                    loadMore.textContent = '加载中...';
                    loadMore.disabled = true;
                    this._loadApiMovieTab(movieId, tab, nextPage, true, pageSize, shownCount, loadLimit);
                    return;
                }
                const expandReviews = e.target?.closest?.('[data-laosiji-api-expand-reviews]');
                if (expandReviews && tabsContainer.contains(expandReviews)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this._loadApiMovieTab(movieId, 'reviews');
                    return;
                }
                const collapseReviews = e.target?.closest?.('[data-laosiji-api-collapse-reviews]');
                if (collapseReviews && tabsContainer.contains(collapseReviews)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    delete reviewsPane.dataset.laosijiApiLoaded;
                    reviewsPane.innerHTML = this._renderApiReviewCollapsed();
                    return;
                }
                const tabLink = e.target?.closest?.('[data-laosiji-api-tab]');
                if (!tabLink || !root.contains(tabLink)) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                const tab = tabLink.dataset.laosijiApiTab;
                this._setApiMovieTab(tab);
                const pane = document.getElementById(tab === 'magnets' ? 'magnets' : tab);
                if (pane && pane.dataset.laosijiApiLoaded !== '1') {
                    if (tab === 'reviews') {
                        if (!pane.querySelector('[data-laosiji-api-expand-reviews]')) {
                            pane.innerHTML = this._renderApiReviewCollapsed();
                        }
                    } else {
                        this._loadApiMovieTab(movieId, tab);
                    }
                }
            }, true);
            this._setApiMovieTab('reviews');
            if (CFG.reviewsDefaultExpanded) {
                this._loadApiMovieTab(movieId, 'reviews');
            } else {
                reviewsPane.innerHTML = this._renderApiReviewCollapsed();
            }
        },
        _ensurePaginationJumpStyle() {
            injectStyle('javdb-pagination-jump-style', `.javdb-pagination-jump{display:flex!important;align-items:center!important;gap:.25rem!important;margin:0!important;flex-wrap:nowrap!important}.pagination-list .javdb-pagination-jump-item{display:list-item!important;margin-left:.25rem!important}.javdb-pagination-jump .pagination-link{margin:0!important}.javdb-pagination-jump input.pagination-link{width:4.5em!important;min-width:4.5em!important;text-align:center!important;box-shadow:none!important;appearance:textfield!important}.javdb-pagination-jump input.pagination-link::-webkit-outer-spin-button,.javdb-pagination-jump input.pagination-link::-webkit-inner-spin-button{-webkit-appearance:none!important;margin:0!important}.javdb-pagination-jump button.pagination-link{cursor:pointer!important;font-weight:400!important}@media (max-width:640px){.pagination-list .javdb-pagination-jump-item{flex-basis:100%!important;margin-left:.25rem!important}}`);
        },
        _paginationCurrentPage(nav) {
            const params = new URLSearchParams(location.search);
            const fromUrl = parseInt(params.get('page') || '1', 10);
            if (Number.isFinite(fromUrl) && fromUrl > 0) return fromUrl;
            const current = parseInt(nav?.querySelector('.pagination-link.is-current')?.textContent?.trim() || '1', 10);
            return Number.isFinite(current) && current > 0 ? current : 1;
        },
        _paginationPageUrl(page) {
            const url = new URL(location.href);
            if (page <= 1) url.searchParams.delete('page');
            else url.searchParams.set('page', String(page));
            return url.href;
        },
        _initPaginationJump(root = document) {
            const navs = [...root.querySelectorAll?.('nav.pagination') || []];
            if (!navs.length) return;
            this._ensurePaginationJumpStyle();
            navs.forEach(nav => {
                if (nav.querySelector('.javdb-pagination-jump')) return;
                const list = nav.querySelector('.pagination-list');
                const host = document.createElement(list ? 'li' : 'div');
                host.className = list ? 'javdb-pagination-jump-item' : 'javdb-pagination-jump-item pagination-link';
                const form = document.createElement('form');
                form.className = 'javdb-pagination-jump';
                form.innerHTML = `<input class="pagination-link" type="number" min="1" step="1" inputmode="numeric" aria-label="跳转页码" placeholder="页码" value="${this._escapeHtml(this._paginationCurrentPage(nav))}"><button class="pagination-link" type="submit">跳转</button>`;
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    const input = form.querySelector('input');
                    const page = Math.max(1, parseInt(input?.value || '1', 10) || 1);
                    location.href = this._paginationPageUrl(page);
                });
                host.appendChild(form);
                (list || nav).appendChild(host);
            });
        },
        _apiRankingShellUrl(mode, next = {}) {
            const params = new URLSearchParams();
            params.set('laosiji_rank', mode);
            if (mode === 'top') {
                params.set('lsj_category', next.category || 'all');
                if (next.year) params.set('lsj_year', next.year);
            } else if (mode === 'playback') {
                params.set('lsj_period', next.period || 'daily');
                params.set('lsj_filter_by', next.filterBy || 'high_score');
            } else {
                params.set('lsj_period', next.period || 'daily');
            }
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
            return { movieId };
        },
        _apiTopTypeFromRankingParams(params) {
            const t = params.get('t') || '';
            if (/^y\d{4}$/i.test(t)) return { category: 'all', year: t.slice(1) };
            if (t) return { category: t, year: '' };
            return { category: 'all', year: '' };
        },
        _apiRankingShellUrlFromHref(href) {
            try {
                const url = new URL(href, location.href);
                if (!/javdb/i.test(url.hostname)) return '';
                const path = url.pathname.replace(/\/+$/, '');
                const params = new URLSearchParams(url.search);
                if (path === '/advanced_search' && /^(top|fc2|playback)$/.test(params.get('laosiji_rank') || '')) {
                    return `${url.pathname}${url.search}`;
                }
                if (path === '/rankings/top') {
                    const topType = this._apiTopTypeFromRankingParams(params);
                    return this._apiRankingShellUrl('top', {
                        category: topType.category,
                        year: topType.year,
                        page: parseInt(params.get('page') || '1', 10) || 1,
                    });
                }
                if (path === '/rankings/movies' && params.get('t') === 'fc2') {
                    return this._apiRankingShellUrl('fc2', {
                        period: params.get('p') || 'daily',
                        page: parseInt(params.get('page') || '1', 10) || 1,
                    });
                }
                if (path === '/rankings/playback') {
                    return this._apiRankingShellUrl('playback', {
                        period: params.get('p') || params.get('period') || 'daily',
                        filterBy: params.get('filter_by') || 'high_score',
                        page: parseInt(params.get('page') || '1', 10) || 1,
                    });
                }
                if (path === '/fc2' || path === '/tags/fc2') {
                    return '/advanced_search?type=3&score_min=0&d=1&laosiji_fc2=1';
                }
            } catch {}
            return '';
        },
        _isTopRankingShellUrl(href) {
            try {
                const url = new URL(href, location.href);
                return url.pathname.replace(/\/+$/, '') === '/advanced_search'
                    && new URLSearchParams(url.search).get('laosiji_rank') === 'top';
            } catch {}
            return false;
        },
        _movieIdFromJavdbHref(href) {
            try {
                const url = new URL(href, location.href);
                if (!/javdb/i.test(url.hostname)) return '';
                const m = url.pathname.match(/^\/v\/([^/?#]+)/);
                return m ? decodeURIComponent(m[1]) : '';
            } catch {}
            return '';
        },
        _isFc2ListContext() {
            const path = location.pathname.replace(/\/+$/, '');
            const params = new URLSearchParams(location.search);
            if (path === '/advanced_search' && params.get('type') === '3') return true;
            const mode = this._getApiRankingShellMode();
            return mode?.mode === 'fc2';
        },
        _isScriptFc2AdvancedSearch() {
            const path = location.pathname.replace(/\/+$/, '');
            if (path !== '/advanced_search') return false;
            const params = new URLSearchParams(location.search);
            return params.get('type') === '3' && params.get('laosiji_fc2') === '1';
        },
        _hideScriptFc2AdvancedSearchBox() {
            if (!this._isScriptFc2AdvancedSearch()) return;
            document.documentElement.dataset.laosijiFc2AdvancedSearch = '1';
            injectStyle('javdb-fc2-advanced-search-style', `html[data-laosiji-fc2-advanced-search="1"] h2.section-title,html[data-laosiji-fc2-advanced-search="1"] .section .container>.box,html[data-laosiji-fc2-advanced-search="1"] body>section>div>.box{display:none!important}`);
        },
        _fc2DetailShellUrlFromLink(link) {
            const movieId = this._movieIdFromJavdbHref(link?.getAttribute?.('href') || link?.href || '');
            if (!movieId) return '';
            const text = link.closest?.('.item, .movie-list .item, .box')?.textContent || link.textContent || '';
            if (!this._isFc2ListContext() && !/FC2[-_]/i.test(text)) return '';
            return this._apiDetailShellUrl(movieId);
        },
        _rewriteFc2DetailLinks(root = document) {
            root.querySelectorAll?.('a[href*="/v/"]').forEach(link => {
                const shellUrl = this._fc2DetailShellUrlFromLink(link);
                if (!shellUrl) return;
                link.dataset.laosijiFc2DetailShell = '1';
                link.href = shellUrl;
            });
        },
        _redirectCurrentApiRankingEntry() {
            const shellUrl = this._apiRankingShellUrlFromHref(location.href);
            if (!shellUrl) return false;
            const currentPath = location.pathname.replace(/\/+$/, '');
            if (currentPath === '/advanced_search') return false;
            location.replace(shellUrl);
            return true;
        },
        _rewriteApiRankingLinks(root = document) {
            root.querySelectorAll?.('a[href]').forEach(link => {
                const shellUrl = this._apiRankingShellUrlFromHref(link.getAttribute('href'));
                if (!shellUrl) return;
                link.dataset.laosijiApiRankingShell = '1';
                link.href = shellUrl;
            });
            this._rewriteFc2DetailLinks(root);
        },
        _installApiRankingShell() {
            if (document.documentElement.dataset.laosijiJavdbApiShell === '1') {
                this._rewriteApiRankingLinks();
                return;
            }
            document.documentElement.dataset.laosijiJavdbApiShell = '1';
            document.addEventListener('click', e => {
                const link = e.target?.closest?.('a[href]');
                if (!link || e.defaultPrevented) return;
                const detailShellUrl = this._fc2DetailShellUrlFromLink(link);
                if (detailShellUrl) {
                    link.href = detailShellUrl;
                    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || link.target === '_blank') return;
                    e.preventDefault();
                    e.stopPropagation();
                    location.href = detailShellUrl;
                    return;
                }
                const shellUrl = this._apiRankingShellUrlFromHref(link.href);
                if (!shellUrl) return;
                link.href = shellUrl;
                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || link.target === '_blank') return;
                e.preventDefault();
                e.stopPropagation();
                if (this._isTopRankingShellUrl(shellUrl) && !Magnet.javdbApi.token()) {
                    openJavdbApiLoginDialog(shellUrl);
                    return;
                }
                location.href = shellUrl;
            }, true);
            this._rewriteApiRankingLinks();
            setTimeout(() => this._rewriteApiRankingLinks(), 500);
            setTimeout(() => this._rewriteApiRankingLinks(), 1500);
            if (document.body) {
                new MutationObserver(() => this._rewriteApiRankingLinks()).observe(document.body, { childList: true, subtree: true });
            }
        },
        _getApiRankingShellMode() {
            const path = location.pathname.replace(/\/+$/, '');
            if (path !== '/advanced_search') return null;
            const params = new URLSearchParams(location.search);
            const mode = params.get('laosiji_rank') || '';
            if (!/^(top|fc2|playback)$/.test(mode)) return null;
            const legacyType = params.get('lsj_type') || '';
            const legacyValue = params.get('lsj_type_value') || '';
            let category = params.get('lsj_category') || '';
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
                filterBy: params.get('lsj_filter_by') || 'high_score',
            };
        },
        _ensureApiRankingShellStyle() {
            injectStyle('javdb-api-shell-style', `.javdb-api-shell{margin-top:10px!important}.javdb-api-shell-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin:8px 0 12px!important;flex-wrap:wrap!important}.javdb-api-shell-title{font-size:18px!important;font-weight:850!important;color:#1e293b!important}.javdb-api-shell-toolbar,.javdb-api-shell-pagination{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important}.javdb-api-shell-toolbar{margin:8px 0 12px!important}.javdb-api-shell-pagination{justify-content:center!important;margin:16px 0 8px!important}.javdb-api-shell-toolbar-group{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important;width:100%!important}.javdb-api-shell-toolbar-label{color:#64748b!important;font-size:12px!important;font-weight:850!important;min-width:34px!important}.javdb-api-shell-toolbar a,.javdb-api-shell-pagination a,.javdb-api-shell-pagination span{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;padding:5px 12px!important;border:1px solid #dbe3ef!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:12px!important;font-weight:800!important;text-decoration:none!important}.javdb-api-shell-toolbar a.is-active,.javdb-api-shell-pagination a.is-active{border-color:#60a5fa!important;background:#eff6ff!important;color:#1d4ed8!important}.javdb-api-shell-status{margin:10px 0!important;padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#f8fafc!important;color:#475569!important;font-size:13px!important;font-weight:700!important}.javdb-api-shell-status.is-error{border-color:#fecaca!important;background:#fff1f2!important;color:#be123c!important}`);
        },
        _renderApiRankingToolbar(modeInfo) {
            if (modeInfo.mode === 'top') {
                const items = [
                    ['all', '全部'],
                    ['0', '有码'],
                    ['1', '无码'],
                    ['2', '欧美'],
                    ['3', 'FC2'],
                ];
                const categoryLinks = items.map(([category, label]) => {
                    const active = modeInfo.category === category;
                    const href = this._apiRankingShellUrl('top', { category, year: modeInfo.year, page: 1 });
                    return `<a class="${active ? 'is-active' : ''}" href="${href}">${label}</a>`;
                }).join('');
                const currentYear = new Date().getFullYear();
                const allYearActive = !modeInfo.year;
                const allYearLink = `<a class="${allYearActive ? 'is-active' : ''}" href="${this._apiRankingShellUrl('top', { category: modeInfo.category, year: '', page: 1 })}">全部年份</a>`;
                const yearLinks = Array.from({ length: Math.max(0, currentYear - 2008 + 1) }, (_, i) => currentYear - i)
                    .map(year => {
                        const value = String(year);
                        const active = modeInfo.year === value;
                        const href = this._apiRankingShellUrl('top', { category: modeInfo.category, year: value, page: 1 });
                        return `<a class="${active ? 'is-active' : ''}" href="${href}">${value}</a>`;
                    }).join('');
                return `<div class="javdb-api-shell-toolbar-group"><span class="javdb-api-shell-toolbar-label">分类</span> ${categoryLinks} </div><div class="javdb-api-shell-toolbar-group"><span class="javdb-api-shell-toolbar-label">年份</span> ${allYearLink}${yearLinks} </div>`;
            }
            const items = [
                ['daily', '日榜'],
                ['weekly', '周榜'],
                ['monthly', '月榜'],
            ];
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
            const filters = [
                ['high_score', '高评分'],
            ];
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
                if (modeInfo.mode === 'top') {
                    return this._apiRankingShellUrl('top', { category: modeInfo.category, year: modeInfo.year, page: nextPage });
                }
                if (modeInfo.mode === 'playback') {
                    return this._apiRankingShellUrl('playback', { period: modeInfo.period, filterBy: modeInfo.filterBy, page: nextPage });
                }
                return this._apiRankingShellUrl('fc2', { period: modeInfo.period, page: nextPage });
            };
            const pages = modeInfo.mode === 'top'
                ? [1, 2, 3, 4, 5].map(item => `<a class="${item === page ? 'is-active' : ''}" href="${href(item)}">${item}</a>`).join('')
                : `<span>第 ${page} 页</span>`;
            return `<div class="javdb-api-shell-pagination"> ${page > 1 ? `<a href="${href(page - 1)}">上一页</a>` : ''}${pages}${hasNext ? `<a href="${href(page + 1)}">下一页</a>` : ''} </div>`;
        },
        _renderApiRankingMovies(movies) {
            const updateCover = value => String(value || '').replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
            return movies.map(raw => {
                const item = raw?.movie || raw;
                const title = item?.origin_title || item?.title || '';
                const score = item?.score ? `<span class="value">${this._escapeHtml(item.score)}分${item?.watched_count ? `, 由${this._escapeHtml(item.watched_count)}人評價` : ''}</span>` : '';
                const tags = [
                    item?.has_cnsub ? '<span class="tag is-warning">中文字幕</span>' : '',
                    Number(item?.magnets_count || 0) > 0 ? '<span class="tag is-success">含磁鏈</span>' : '',
                    Number(item?.magnets_count || 0) <= 0 ? '<span class="tag">無磁鏈</span>' : '',
                    item?.new_magnets ? '<span class="tag is-info">今日新種</span>' : '',
                ].filter(Boolean).join('');
                const href = /^FC2[-_]/i.test(String(item?.number || ''))
                    ? this._apiDetailShellUrl(item?.id || '')
                    : `/v/${this._escapeHtml(item?.id || '')}`;
                return `<div class="item" data-javdb-api-shell-item="1"><a href="${this._escapeHtml(href)}" class="box" title="${this._escapeHtml(title)}"><div class="cover "><img loading="lazy" src="${this._escapeHtml(updateCover(item?.cover_url || item?.thumb_url || ''))}" alt=""></div><div class="video-title"><strong>${this._escapeHtml(item?.number || '')}</strong> ${this._escapeHtml(title)}</div><div class="score">${score}</div><div class="meta">${this._escapeHtml(item?.release_date || '')}</div><div class="tags has-addons">${tags}</div></a></div>`;
            }).join('');
        },
        _ensureApiDetailShellStyle() {
            injectStyle('javdb-api-detail-style', `.javdb-api-detail .movie-panel-info .value.tags{display:inline-flex!important;flex-wrap:wrap!important;gap:4px!important}`);
        },
        _renderApiDetailField(label, value) {
            const text = Array.isArray(value) ? value.filter(Boolean).join(' / ') : String(value || '');
            if (!text) return '';
            return `<div class="panel-block"><strong> ${this._escapeHtml(label)} :</strong>&nbsp;<span class="value"> ${this._escapeHtml(text)} </span></div>`;
        },
        _renderApiDetailTags(items) {
            const list = Array.isArray(items) ? items : [];
            if (!list.length) return '';
            const tags = list.map(item => {
                const name = item?.name || item?.title || item;
                return name ? `<span class="tag">${this._escapeHtml(name)}</span>` : '';
            }).filter(Boolean).join('');
            if (!tags) return '';
            return `<div class="panel-block"><strong>標籤:</strong>&nbsp;<span class="value tags"> ${tags} </span></div>`;
        },
        _renderApiDetailImages(images) {
            const list = Array.isArray(images) ? images : [];
            const updateCover = value => String(value || '').replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
            const html = list.map((item, index) => {
                const large = updateCover(item?.large_url || item?.url || item?.thumb_url || '');
                const thumb = updateCover(item?.thumb_url || item?.large_url || item?.url || '');
                if (!large || !thumb) return '';
                return `<a class="tile-item" href="${this._escapeHtml(large)}" data-fancybox="gallery" data-caption="预览图${index + 1}"><img src="${this._escapeHtml(thumb)}" loading="lazy" alt="预览图${index + 1}"></a>`;
            }).filter(Boolean).join('');
            return html ? `<div class="columns javdb-api-detail-preview-columns"><div class="column"><article class="message video-panel"><div class="message-body"><div class="tile-images preview-images">${html}</div></div></article></div></div>` : '';
        },
        _renderApiDetailPage(movie) {
            const updateCover = value => String(value || '').replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
            const number = String(movie?.number || '');
            const title = movie?.origin_title || movie?.title || '';
            const actors = (Array.isArray(movie?.actors) ? movie.actors : []).map(item => item?.name || item).filter(Boolean);
            const cover = updateCover(movie?.cover_url || movie?.thumb_url || '');
            return `<div class="video-detail javdb-api-detail" data-javdb-api-detail="1"><h2 class="title is-4 javdb-api-detail-title"><strong>${this._escapeHtml(number)}</strong><strong class="current-title">${this._escapeHtml(title)}</strong></h2><div class="video-meta-panel"><div class="columns is-desktop"><div class="column column-video-cover"><a data-fancybox="gallery" href="${this._escapeHtml(cover)}"><img src="${this._escapeHtml(cover)}" class="video-cover" alt="${this._escapeHtml(title)}"></a></div><div class="column"><nav class="panel movie-panel-info"><div class="panel-block first-block"><strong>番號:</strong>&nbsp;<span class="value">${this._escapeHtml(number)}</span>&nbsp;<a class="button is-white copy-to-clipboard" title="複製番號" data-clipboard-text="${this._escapeHtml(number)}"><span class="icon is-small"><i class="icon-copy"></i></span></a></div> ${this._renderApiDetailField('標題', title)} ${this._renderApiDetailField('日期', movie?.release_date)} ${this._renderApiDetailField('時長', movie?.duration ? `${movie.duration} 分鐘` : '')} ${this._renderApiDetailField('評分', movie?.score ? `${movie.score} / ${movie?.watched_count || 0} 人` : '')} ${this._renderApiDetailField('片商', movie?.maker_name || movie?.publisher_name)} ${this._renderApiDetailField('系列', movie?.series_name)} ${this._renderApiDetailField('導演', movie?.director_name)} ${this._renderApiDetailField('演員', actors)} ${this._renderApiDetailTags(movie?.tags)} </nav></div></div></div> ${this._renderApiDetailImages(movie?.preview_images)} </div>`;
        },
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
                const avid = normalizeAvid(movie.number);
                this._insertCopyButton(avid);
                this._ensureDetailLayout();
                this._insertMagnet(avid);
                PageZoom.apply('javdb');
                DetailFlex.apply();
                Runtime.refresh({ detailPreview: true, infiniteScroll: false });
                return true;
            } catch (err) {
                errorLog('JavDB API 详情请求失败:', err);
                status.classList.add('is-error');
                status.textContent = err.message || 'JavDB API 详情请求失败';
                return true;
            }
        },
        async _initApiRankingShellPage() {
            const modeInfo = this._getApiRankingShellMode();
            if (!modeInfo) return false;
            const container = document.querySelector('body > section > div, .section .container');
            if (!container) return false;
            this._ensureApiRankingShellStyle();
            const title = modeInfo.mode === 'top'
                ? 'Top250'
                : modeInfo.mode === 'playback'
                    ? '热播'
                    : 'FC2 排行榜';
            container.innerHTML = `<div class="javdb-api-shell"><div class="javdb-api-shell-head"><div class="javdb-api-shell-title"> ${title} </div></div><div class="javdb-api-shell-toolbar"> ${this._renderApiRankingToolbar(modeInfo)} </div><div class="javdb-api-shell-status">正在加载 API 数据...</div><div class="movie-list h cols-4 vcols-8"></div><div class="javdb-api-shell-pagination-wrap"></div></div>`;
            const status = container.querySelector('.javdb-api-shell-status');
            const list = container.querySelector('.movie-list');
            const pagination = container.querySelector('.javdb-api-shell-pagination-wrap');
            try {
                let json;
                if (modeInfo.mode === 'top') {
                    if (!Magnet.javdbApi.token()) {
                        renderJavdbApiLoginRequired(status);
                        scheduleJavdbApiLoginDialog(location.href);
                        return true;
                    }
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
                    });
                }
                if (json.success !== 1) throw new Error(json.message || json.action || 'JavDB API 请求失败');
                const movies = Array.isArray(json?.data?.movies) ? json.data.movies : [];
                if (!movies.length) {
                    status.textContent = '没有查询到数据。';
                    return true;
                }
                const total = Number(json?.data?.total || 0);
                list.innerHTML = this._renderApiRankingMovies(movies);
                status.textContent = total ? `已加载 ${movies.length} 条数据，共 ${total} 条匹配` : `已加载 ${movies.length} 条数据`;
                const hasNext = modeInfo.mode === 'top'
                    ? modeInfo.page < 5
                    : (total ? modeInfo.page * 40 < total : movies.length >= 40);
                pagination.innerHTML = this._renderApiRankingPagination(modeInfo, hasNext);
                this._initListPage();
                PageZoom.apply('javdb');
                Runtime.refreshListPage();
                return true;
            } catch (err) {
                errorLog('JavDB API 榜单请求失败:', err);
                if (isJavdbApiAuthError(err)) {
                    Magnet.javdbApi.setToken('');
                    renderJavdbApiLoginRequired(status, 'JavDB API 登录状态已失效，请重新登录一次。');
                    delete document.documentElement.dataset.laosijiJavdbApiLoginPrompted;
                    scheduleJavdbApiLoginDialog(location.href);
                    return true;
                }
                status.classList.add('is-error');
                status.textContent = err.message || 'JavDB API 请求失败';
                return true;
            }
        },
        _initListPage() {
            this._stripNativeLayoutParam();
            const list = document.querySelector('.movie-list, .movies, .grid');
            if (!list) return;
            this._neutralizeNativeListLayout(list);
            const needStyle = list.dataset.laosijiGrid !== '1';
            const cards = [...list.querySelectorAll(':scope > .item:not([data-laosiji-grid-card="1"])')];
            if (!cards.length && !needStyle) return;
            list.dataset.laosijiGrid = '1';
            list.classList.add('jav-card-grid', 'javdb-card-grid');
            CardColumns.apply('javdb');
            cards.forEach(card => this._decorateCard(card));
            this._rewriteFc2DetailLinks(list);
            PortraitCards.syncImages();
            if (needStyle) {
                GM_addStyle(`.jav-card-grid{--jav-card-title-size:15px;--jav-card-title-line-height:1.5;--jav-card-title-lines:2;display:grid!important;grid-template-columns:repeat(var(--jav-card-columns,5),minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important;width:100%!important;box-sizing:border-box!important}.jav-card{float:none!important;display:block!important;width:auto!important;height:100%!important;max-height:none!important;min-width:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important;text-align:left!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:6px!important;overflow:hidden!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important;transform:translateZ(0)!important;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease!important;will-change:transform!important}.jav-card:hover{border-color:rgba(37,99,235,.35)!important;box-shadow:0 10px 24px rgba(15,23,42,.16)!important;transform:translateY(-4px) scale(1.018)!important;z-index:2!important}.jav-card-link{display:flex!important;flex-direction:column!important;height:100%!important;max-height:none!important;overflow:hidden!important;color:#2563eb!important;text-decoration:none!important}.jav-card-link:visited{color:#7c3aed!important}.jav-card-cover{display:block!important;width:100%!important;height:auto!important;aspect-ratio:800 / 538!important;overflow:hidden!important;background:#f8fafc!important;border-bottom:1px solid #f1f5f9!important}.jav-card-image{display:block!important;width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;background:#f8fafc!important;border:0!important}.jav-card-title{display:block!important;width:100%!important;max-width:none!important;height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;max-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;box-sizing:border-box!important;flex:0 0 auto!important;min-height:calc((var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)+16px)!important;margin:0!important;padding:7px 8px 9px!important;overflow:hidden!important;color:inherit!important;font-size:var(--jav-card-title-size,15px)!important;line-height:var(--jav-card-title-line-height,1.5)!important;text-align:left!important;white-space:normal!important;word-break:break-word!important}.javdb-card-headline{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:var(--jav-card-title-lines,2)!important;line-clamp:var(--jav-card-title-lines,2)!important;max-height:calc(var(--jav-card-title-line-height,1.5) * var(--jav-card-title-lines,2) * 1em)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:normal!important;word-break:break-word!important}.jav-card-title strong{color:inherit!important;font-size:16px!important;font-weight:800!important}.javdb-card-grid{--jav-card-columns:5}.javdb-card-grid .item.javdb-grid-card{position:static!important;width:auto!important;float:none!important;margin:0!important}.javdb-card-grid .item .javdb-card-link.box{width:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important}.javdb-card-grid .item .javdb-cover-frame.cover{margin:0!important;height:auto!important}.javdb-card-grid .item .javdb-card-image{height:100%!important;margin:0!important}.javdb-card-grid .item .javdb-card-title .jav-pan115-badge{display:inline-flex!important;width:auto!important;max-width:max-content!important;float:none!important;vertical-align:middle!important;margin:0 6px 4px 0!important}.javdb-card-score,.javdb-card-meta,.javdb-card-tags{padding-left:8px!important;padding-right:8px!important}.javdb-card-score{margin-top:2px!important;color:#64748b!important;font-size:12px!important;line-height:1.45!important}.javdb-card-score .value{color:inherit!important;font-size:inherit!important}.javdb-card-meta{margin-top:4px!important;color:#94a3b8!important;font-size:12px!important;line-height:1.45!important}.javdb-card-tags{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:auto!important;padding-top:8px!important;padding-bottom:10px!important}.javdb-card-tags .tag{margin:0!important}@media (max-width:1100px){.javdb-card-grid{--jav-card-columns:4}}@media (max-width:820px){.javdb-card-grid{--jav-card-columns:3}}@media (max-width:560px){.javdb-card-grid{--jav-card-columns:2;gap:10px!important}}`);
            }
            setTimeout(() => {
                Runtime.refreshListPage();
            }, 0);
        },
        _neutralizeNativeListLayout(list) {
            if (!list) return;
            [...list.classList].forEach(name => {
                if (/^(?:cols-|vcols-|h$|v$)/i.test(name)) list.classList.remove(name);
            });
        },
        _repairCardStructure(card) {
            if (!card) return;
            const anchor = card.querySelector(':scope > a.box[href], :scope > a[href].box');
            if (!anchor || anchor.querySelector('.cover, .video-title')) return;
            const moveSelectors = ['.cover', '.video-title', '.score', '.meta', '.tags'];
            let moved = false;
            moveSelectors.forEach(selector => {
                const node = card.querySelector(`:scope > ${selector}`);
                if (!node) return;
                node.querySelectorAll('.emby-badge, .emby-btn, .emby-button-group').forEach(el => el.remove());
                anchor.appendChild(node);
                moved = true;
            });
            if (moved) {
                anchor.querySelectorAll('a[href]').forEach(child => {
                    if (child === anchor) return;
                    child.replaceWith(...child.childNodes);
                });
            }
        },
        _decorateCard(card) {
            if (!card) return;
            this._repairCardStructure(card);
            if (card.dataset.laosijiGridCard !== '1') {
                card.dataset.laosijiGridCard = '1';
                card.classList.add('jav-card', 'javdb-grid-card');
            }
            const anchor = card.querySelector(':scope > a.box[href], :scope > a[href].box, a.box[href]');
            anchor?.classList.add('jav-card-link', 'javdb-card-link');
            if (anchor && !anchor.querySelector('.jav-pan115-badge')) {
                delete anchor.dataset.pan115Checked;
                delete anchor.dataset.pan115HasBadge;
            }
            const cover = card.querySelector('.cover');
            cover?.classList.add('jav-card-cover', 'javdb-cover-frame');
            const img = cover?.querySelector('img[src]') || card.querySelector('img[src]');
            if (img) {
                img.removeAttribute('width');
                img.removeAttribute('height');
                img.classList.add('jav-card-image', 'javdb-card-image');
                const src = img.getAttribute('src') || '';
                if (/\/covers\//i.test(src)) {
                    img.dataset.laosijiLandscapeSrc = img.dataset.laosijiLandscapeSrc || src;
                } else if (/\/thumbs\//i.test(src)) {
                    img.dataset.laosijiLandscapeSrc = img.dataset.laosijiLandscapeSrc || src.replace(/\/thumbs\//i, '/covers/');
                }
            }
            const titleEl = card.querySelector('.video-title');
            titleEl?.classList.add('jav-card-title', 'javdb-card-title');
            if (titleEl && !titleEl.querySelector('.javdb-card-headline')) {
                const headline = document.createElement('span');
                headline.className = 'javdb-card-headline';
                while (titleEl.firstChild) headline.appendChild(titleEl.firstChild);
                titleEl.appendChild(headline);
            }
            const scoreEl = card.querySelector('.score');
            scoreEl?.classList.add('javdb-card-score');
            const metaEl = card.querySelector('.meta');
            metaEl?.classList.add('javdb-card-meta');
            const tagsEl = card.querySelector('.tags');
            tagsEl?.classList.add('javdb-card-tags');
            ListPreview.attach(card);
        },
        _insertTopSettingsButton() {
            const navbarEnd = document.querySelector('#navbar-menu-user .navbar-end');
            if (!navbarEnd || navbarEnd.querySelector('.javdb-top-settings-btn')) return;
            const btn = document.createElement('a');
            btn.href = 'javascript:void(0)';
            btn.className = 'navbar-item javdb-top-settings-btn';
            btn.textContent = '\u8001\u53f8\u673a\u8bbe\u7f6e';
            btn.title = '\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e';
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                QuickSettingsPanel.open(e.currentTarget);
            });
            const userMenu = navbarEnd.querySelector('a[href="/users/profile"]')?.closest('.navbar-item.has-dropdown');
            navbarEnd.insertBefore(btn, userMenu || null);
            injectStyle('javdb-top-settings-style', `#navbar-menu-user .javdb-top-settings-btn{color:#2563eb!important;font-weight:700!important}#navbar-menu-user .javdb-top-settings-btn:hover{color:#1d4ed8!important;background:rgba(37,99,235,.08)!important}`);
        },
        _insertCopyButton(avid) {
            const infoPanel = document.querySelector('.movie-panel-info');
            if (!infoPanel || !avid) return;
            const nativeCopy = infoPanel.querySelector('.copy-to-clipboard, [data-clipboard-text]');
            const anchor = nativeCopy?.closest('.panel-block')?.querySelector('.value')
                || [...infoPanel.querySelectorAll('.panel-block .value')].find(el => {
                    return el.textContent.trim().toUpperCase().includes(normalizeAvid(avid));
                });
            insertAvidCopyBtn(anchor, avid, nativeCopy);
        },
        _ensureDetailLayout() {
            const coverCol  = document.querySelector('.column.column-video-cover');
            const infoPanel = document.querySelector('.movie-panel-info');
            if (!coverCol || !infoPanel) return null;
            const infoCol = infoPanel.closest('.column') || infoPanel;
            const currentContainer = coverCol.closest('.jav-flex-container');
            const parent = currentContainer || coverCol.parentElement;
            if (!parent) return null;
            let flexContainer = currentContainer || parent.querySelector(':scope > .jav-flex-container');
            if (!flexContainer) {
                flexContainer = document.createElement('div');
                flexContainer.className = 'jav-flex-container';
                flexContainer.appendChild(coverCol);
                flexContainer.appendChild(infoCol);
                parent.appendChild(flexContainer);
            } else {
                if (coverCol.parentElement !== flexContainer) flexContainer.insertBefore(coverCol, flexContainer.firstChild);
                if (infoCol.parentElement !== flexContainer) {
                    const magnetSlot = flexContainer.querySelector(':scope > .jav-nong-slot');
                    flexContainer.insertBefore(infoCol, magnetSlot || null);
                }
            }
            flexContainer.style.setProperty('display', 'flex', 'important');
            flexContainer.style.setProperty('gap', '20px', 'important');
            flexContainer.style.setProperty('align-items', 'flex-start', 'important');
            flexContainer.style.setProperty('width', '100%', 'important');
            flexContainer.style.setProperty('margin-top', '16px', 'important');
            const detailDefaults = DetailFlex.defaultCss('javdb');
            flexContainer.style.setProperty('--javdb-cover-flex', flexContainer.style.getPropertyValue('--javdb-cover-flex') || detailDefaults.cover);
            flexContainer.style.setProperty('--javdb-info-flex', flexContainer.style.getPropertyValue('--javdb-info-flex') || detailDefaults.info);
            flexContainer.style.setProperty('--javdb-magnet-flex', flexContainer.style.getPropertyValue('--javdb-magnet-flex') || detailDefaults.magnet);
            coverCol.style.setProperty('flex', 'var(--javdb-cover-flex) 1 0', 'important');
            coverCol.style.setProperty('width', 'auto', 'important');
            coverCol.style.setProperty('max-width', 'none', 'important');
            coverCol.style.setProperty('min-width', '0', 'important');
            infoCol.style.setProperty('flex', 'var(--javdb-info-flex) 1 0', 'important');
            infoCol.style.setProperty('width', 'auto', 'important');
            infoCol.style.setProperty('max-width', 'none', 'important');
            infoCol.style.setProperty('min-width', '0', 'important');
            infoCol.style.setProperty('overflow', 'hidden', 'important');
            infoCol.style.setProperty('word-break', 'break-word', 'important');
            infoPanel.style.setProperty('width', '100%', 'important');
            infoPanel.style.setProperty('max-width', '100%', 'important');
            infoPanel.style.setProperty('box-sizing', 'border-box', 'important');
            const coverBox = coverCol.querySelector('.cover, .box');
            if (coverBox) {
                coverBox.style.setProperty('width', '100%', 'important');
                coverBox.style.setProperty('max-width', '100%', 'important');
                coverBox.style.setProperty('box-sizing', 'border-box', 'important');
            }
            const coverImg = coverCol.querySelector('img');
            if (coverImg) {
                coverImg.style.setProperty('width', '100%', 'important');
                coverImg.style.setProperty('height', 'auto', 'important');
                coverImg.style.setProperty('max-width', '100%', 'important');
            }
            return flexContainer;
        },
        _insertMagnet(avid) {
            if (!CFG.magnetTable) return;
            document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove());
            const flexContainer = this._ensureDetailLayout();
            if (!flexContainer) return;
            const slot = document.createElement('div');
            slot.className = 'jav-nong-slot';
            slot.style.setProperty('flex', 'var(--javdb-magnet-flex) 1 0', 'important');
            slot.style.setProperty('min-width', '0', 'important');
            slot.style.setProperty('align-self', 'flex-start', 'important');
            slot.style.setProperty('overflow', 'hidden', 'important');
            const widget = Magnet.createMagnetWidget(avid);
            slot.appendChild(widget);
            flexContainer.appendChild(slot);
        },
    };
    const SiteJavLib = {
        match() {
            return /(javlibrary|javlib|r86m|s87n)/i.test(location.hostname);
        },
        isDetailPage() {
            return (
                !!document.querySelector('#video_id .text') &&
                !!document.querySelector('meta[name="keywords"]')
            );
        },
        isHomePage() {
            return (
                document.body?.classList.contains('main') &&
                !this.isDetailPage() &&
                !!document.querySelector('#rightcolumn > .videothumblist .videos')
            );
        },
        getVid() {
            const el = document.querySelector('#video_id .text');
            if (el?.textContent?.trim()) return normalizeAvid(el.textContent.trim());
            const m = document.title.match(/([A-Z0-9]+-\d+)/i);
            return m ? m[1].toUpperCase() : '';
        },
        initPage(avid) {
            this._insertTopSettingsButton();
            this._insertTopNavigationDropdown();
            if (!this.isDetailPage()) {
                this._initListPage();
                if (this.isHomePage()) this._initHomePage();
                return;
            }
            if (!avid) return;
            document.querySelector('.socialmedia')?.remove();
            this._insertCopyButton(avid);
            GM_addStyle(`#leftmenu{display:none}#rightcolumn{margin:0!important;width:100%!important;float:none!important}#content{padding-top:0;width:100%;margin:0!important}#video_title h3.post-title.text,#video_title h3.post-title.text a{font-size:20px!important;line-height:1.45!important}#video_jacket img{max-width:100%;height:auto}#video_info{text-align:left;font:14px Arial;overflow:hidden;word-break:break-word;margin:0!important;width:100%!important;float:none!important}#video_info .item,#video_info table,#video_info tr,#video_info td,#video_info .header,#video_info .text{text-align:left!important}#video_info table{margin-left:0!important;margin-right:auto!important}#video_info .jav-jump-btn-group{justify-content:flex-start!important}#video_reviews,#video_comments,#video_review_edit,#video_comment_edit{width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}#video_reviews .comment,#video_comments .comment{width:100%!important;max-width:100%!important;table-layout:fixed!important;box-sizing:border-box!important}#video_reviews .comment td,#video_comments .comment td{box-sizing:border-box!important;vertical-align:top!important}#video_reviews .comment td.info,#video_comments .comment td.info{width:132px!important}#video_reviews .comment td.scores,#video_comments .comment td.scores{width:92px!important}#video_reviews .comment td.t,#video_comments .comment td.t{width:auto!important;min-width:0!important;overflow:hidden!important}#video_reviews .comment td.t .text,#video_comments .comment td.t .text,#video_reviews .comment td.t textarea,#video_comments .comment td.t textarea{width:auto!important;max-width:100%!important;box-sizing:border-box!important;white-space:normal!important;word-break:break-word!important;overflow-wrap:anywhere!important}.jav-nong-slot .jav-nong-wrapper{width:560px;max-width:100%;margin-top:16px}`);
            this._ensureDetailLayout();
            this._insertMagnet(avid);
        },
        _initListPage() {
            const list = document.querySelector('.videothumblist .videos');
            if (!list) return;
            const needStyle = list.dataset.laosijiGrid !== '1';
            const cards = [...list.querySelectorAll(':scope > .video:not([data-laosiji-grid-card="1"])')];
            if (!cards.length && !needStyle) return;
            list.dataset.laosijiGrid = '1';
            list.classList.add('jav-card-grid', 'javlib-card-grid');
            CardColumns.apply('javlib');
            cards.forEach(card => {
                card.dataset.laosijiGridCard = '1';
                card.classList.add('jav-card', 'javlib-grid-card');
                const anchor = card.querySelector(':scope > a[href]:not(.emby-javlibrary-list-badge)');
                anchor?.classList.add('jav-card-link', 'javlib-card-link');
                if (anchor && !anchor.querySelector('.jav-pan115-badge')) {
                    delete anchor.dataset.pan115Checked;
                    delete anchor.dataset.pan115HasBadge;
                }
                const idEl = card.querySelector('.id');
                const titleEl = card.querySelector('.title');
                titleEl?.classList.add('jav-card-title', 'javlib-card-title');
                if (idEl && titleEl && !titleEl.querySelector('.javlib-card-headline')) {
                    const code = idEl.textContent.trim();
                    const titleText = titleEl.textContent.trim();
                    titleEl.textContent = '';
                    const codeRow = document.createElement('span');
                    codeRow.className = 'javlib-card-code-row';
                    const strong = document.createElement('strong');
                    strong.className = 'javlib-card-code';
                    strong.textContent = code;
                    codeRow.appendChild(strong);
                    const headline = document.createElement('span');
                    headline.className = 'javlib-card-headline';
                    headline.textContent = titleText;
                    const footer = document.createElement('span');
                    footer.className = 'javlib-card-footer';
                    titleEl.appendChild(codeRow);
                    titleEl.appendChild(headline);
                    titleEl.appendChild(footer);
                    titleEl.dataset.laosijiCodeMerged = '1';
                }
                const img = card.querySelector('img[src]');
                if (!img) return;
                const src = img.getAttribute('src') || '';
                const fullSrc = src.replace(/ps\.jpg(?:([?#].*)?)$/i, 'pl.jpg$1');
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
                            requestAnimationFrame(() => {
                                img.classList.remove('javlib-cover-swapping');
                            });
                        }, 90);
                    };
                    preloader.onerror = () => {
                        img.dataset.laosijiCoverPreloaded = '1';
                        delete img.dataset.laosijiCoverLoading;
                    };
                    preloader.src = fullSrc;
                }
                img.removeAttribute('width');
                img.removeAttribute('height');
                img.classList.add('jav-card-image', 'javlib-card-image');
                if (!img.closest('.javlib-cover-frame')) {
                    const frame = document.createElement('div');
                    frame.className = 'jav-card-cover javlib-cover-frame';
                    img.parentNode.insertBefore(frame, img);
                    frame.appendChild(img);
                } else {
                    img.closest('.javlib-cover-frame')?.classList.add('jav-card-cover');
                }
            });
            if (needStyle) {
                GM_addStyle(`.jav-card-grid{--jav-card-title-size:15px;--jav-card-title-line-height:1.5;--jav-card-title-lines:2;display:grid!important;grid-template-columns:repeat(var(--jav-card-columns,5),minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important;width:100%!important;box-sizing:border-box!important}.jav-card{float:none!important;display:block!important;width:auto!important;height:100%!important;max-height:none!important;min-width:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important;text-align:left!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:6px!important;overflow:hidden!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important;transform:translateZ(0)!important;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease!important;will-change:transform!important}.jav-card:hover{border-color:rgba(37,99,235,.35)!important;box-shadow:0 10px 24px rgba(15,23,42,.16)!important;transform:translateY(-4px) scale(1.018)!important;z-index:2!important}.jav-card-link{display:flex!important;flex-direction:column!important;height:100%!important;max-height:none!important;overflow:hidden!important;color:#2563eb!important;text-decoration:none!important}.jav-card-link:visited{color:#7c3aed!important}.javlib-card-link:visited .jav-card-title{background:#fbf7ff!important}.javlib-card-link:visited .javlib-card-code{background:#f3e8ff!important}.jav-card-cover{display:block!important;width:100%!important;height:auto!important;aspect-ratio:800 / 538!important;overflow:hidden!important;background:#f8fafc!important;border-bottom:1px solid #f1f5f9!important}.jav-card-image{display:block!important;width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;background:#f8fafc!important;border:0!important;transition:opacity .18s ease!important}.javlib-cover-swapping{opacity:.42!important}.jav-card-title{--javlib-title-line-height:22px;display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important;max-width:none!important;height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+54px)!important;max-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+54px)!important;box-sizing:border-box!important;flex:0 0 auto!important;min-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+54px)!important;margin:0!important;padding:9px 10px 10px!important;overflow:hidden!important;text-overflow:ellipsis!important;color:inherit!important;font-size:var(--jav-card-title-size,15px)!important;line-height:var(--javlib-title-line-height)!important;text-align:left!important;white-space:normal!important;word-break:break-word!important}.jav-card-title:has(.javlib-card-footer>*){height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+82px)!important;max-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+82px)!important;min-height:calc((var(--javlib-title-line-height) * var(--jav-card-title-lines,2))+82px)!important}.javlib-card-code-row{display:flex!important;align-items:center!important;flex:0 0 22px!important;height:22px!important;max-height:22px!important;min-height:22px!important;overflow:hidden!important}.javlib-card-headline{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:var(--jav-card-title-lines,2)!important;line-clamp:var(--jav-card-title-lines,2)!important;height:calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;max-height:calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;min-height:calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:normal!important;word-break:break-word!important;color:inherit!important;flex:0 0 calc(var(--javlib-title-line-height) * var(--jav-card-title-lines,2))!important;line-height:var(--javlib-title-line-height)!important}.javlib-card-code{display:inline-flex!important;align-items:center!important;max-width:100%!important;padding:2px 7px!important;border-radius:999px!important;background:#eef2ff!important;color:inherit!important;font-size:14px!important;line-height:1.35!important;font-weight:800!important;letter-spacing:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.javlib-card-footer{display:none!important;align-items:center!important;gap:6px!important;min-height:0!important;margin-top:auto!important;overflow:hidden!important}.javlib-card-footer:not(:empty){display:flex!important;flex:0 0 22px!important;height:22px!important;max-height:22px!important;min-height:22px!important}.videothumblist{width:100%!important}.videothumblist .videos.javlib-card-grid{--jav-card-columns:5}.videothumblist .video.javlib-grid-card .id{display:none!important}.videothumblist .video.javlib-grid-card .toolbar{display:none!important}@media (max-width:1100px){.videothumblist .videos.javlib-card-grid{--jav-card-columns:4}}@media (max-width:820px){.videothumblist .videos.javlib-card-grid{--jav-card-columns:3}}@media (max-width:560px){.videothumblist .videos.javlib-card-grid{--jav-card-columns:2;gap:10px!important}}`);
            }
            setTimeout(() => {
                Runtime.refreshListDecorations();
            }, 0);
        },
        _initHomePage() {
            if (document.body.dataset.laosijiJavlibHome === '1') return;
            document.body.dataset.laosijiJavlibHome = '1';
            document.body.classList.add('javlib-home-page');
            const rightColumn = document.querySelector('#rightcolumn');
            rightColumn?.querySelectorAll(':scope > .titlebox, :scope > table.about').forEach(el => {
                el.style.setProperty('display', 'none', 'important');
            });
            GM_addStyle(`body.javlib-home-page #rightcolumn>.videothumblist{height:auto!important;max-height:none!important;overflow:visible!important}`);
        },
        _insertTopNavigationDropdown() {
            const source = document.querySelector('#leftmenu .menul1');
            const advSearch = document.querySelector('#topmenu .advsearch');
            if (!source || !advSearch || advSearch.querySelector('.javlib-top-nav-menu')) return;
            const lang = String(document.documentElement.lang || '').toLowerCase();
            const label = lang.startsWith('en') ? 'Site Nav' : lang.startsWith('ja') ? 'ナビ' : /tw|zh$/.test(lang) ? '站點導航' : '站点导航';
            const menu = document.createElement('span');
            menu.className = 'javlib-top-nav-menu';
            menu.innerHTML = `<a class="javlib-top-nav-trigger" href="javascript:void(0)"> ${label} ▾</a><div class="javlib-top-nav-dropdown" role="menu"></div>`;
            menu.addEventListener('mousedown', e => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    e.preventDefault();
                }
            }, true);
            const dropdown = menu.querySelector('.javlib-top-nav-dropdown');
            const nodes = Array.from(source.children);
            for (let i = 0; i < nodes.length; i += 1) {
                const category = nodes[i];
                const list = nodes[i + 1];
                if (!category?.classList?.contains('category') || !list?.matches?.('ul')) continue;
                const section = document.createElement('div');
                section.className = 'javlib-top-nav-section';
                const title = document.createElement('div');
                title.className = 'javlib-top-nav-title';
                title.textContent = category.textContent.trim();
                const links = document.createElement('div');
                links.className = 'javlib-top-nav-links';
                list.querySelectorAll('a[href]').forEach(anchor => {
                    const link = anchor.cloneNode(true);
                    link.className = 'javlib-top-nav-link';
                    links.appendChild(link);
                });
                section.append(title, links);
                dropdown.appendChild(section);
            }
            if (!dropdown.children.length) return;
            advSearch.append(document.createTextNode(' '), menu);
            injectStyle('javlib-top-nav-style', `#leftmenu{display:none!important}#rightcolumn{margin:0!important;width:100%!important;float:none!important}#topmenu .advsearch{position:relative!important;white-space:nowrap!important}.javlib-top-nav-menu{position:relative!important;display:inline-block!important;vertical-align:middle!important;margin-left:8px!important;z-index:10010!important}.javlib-top-nav-trigger{display:inline-flex!important;align-items:center!important;height:24px!important;padding:0 10px!important;border:1px solid #93c5fd!important;border-radius:999px!important;background:#eff6ff!important;color:#1d4ed8!important;font-size:14px!important;font-weight:800!important;line-height:24px!important;text-decoration:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.82),0 3px 9px rgba(37,99,235,.12)!important}.javlib-top-nav-menu:hover .javlib-top-nav-trigger,.javlib-top-nav-menu:focus-within .javlib-top-nav-trigger{background:#dbeafe!important;border-color:#60a5fa!important;color:#1e40af!important}.javlib-top-nav-dropdown{position:absolute!important;top:100%!important;left:0!important;display:none!important;min-width:280px!important;max-width:min(560px,86vw)!important;padding:18px 10px 10px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:linear-gradient(to bottom,rgba(255,255,255,0) 0,rgba(255,255,255,0) 8px,rgba(255,255,255,.98) 8px)!important;box-shadow:0 16px 36px rgba(15,23,42,.18)!important;box-sizing:border-box!important;white-space:normal!important;background-clip:padding-box!important}.javlib-top-nav-menu:hover .javlib-top-nav-dropdown,.javlib-top-nav-menu:focus-within .javlib-top-nav-dropdown{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}.javlib-top-nav-title{margin-bottom:6px!important;color:#0f172a!important;font-size:14px!important;font-weight:900!important}.javlib-top-nav-links{display:grid!important;gap:4px!important}.javlib-top-nav-link{display:block!important;min-height:22px!important;padding:3px 7px!important;border-radius:6px!important;color:#2563eb!important;font-size:14px!important;line-height:1.35!important;text-decoration:none!important}.javlib-top-nav-link:hover{background:#eff6ff!important;color:#1d4ed8!important;text-decoration:none!important}@media (max-width:720px){.javlib-top-nav-menu:hover .javlib-top-nav-dropdown,.javlib-top-nav-menu:focus-within .javlib-top-nav-dropdown{grid-template-columns:1fr!important}}`);
        },
        _insertTopSettingsButton() {
            const menu = document.querySelector('#topmenu .menutext, .menutext');
            if (!menu || menu.querySelector('.javlib-top-settings-btn')) return;
            const btn = document.createElement('a');
            btn.href = 'javascript:void(0)';
            btn.className = 'javlib-top-settings-btn';
            btn.textContent = '\u8001\u53f8\u673a\u8bbe\u7f6e';
            btn.title = '\u6253\u5f00\u8001\u53f8\u673a\u8bbe\u7f6e';
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                QuickSettingsPanel.open(e.currentTarget);
            });
            const accountLink = menu.querySelector('a[href*="myaccount.php"]');
            const sep = document.createTextNode(' | ');
            if (accountLink) {
                accountLink.after(sep, btn);
            } else {
                menu.append(sep, btn);
            }
            injectStyle('javlib-top-settings-style', `#topmenu .menutext .javlib-top-settings-btn,.menutext .javlib-top-settings-btn{color:#2563eb!important;font-weight:700!important;text-decoration:none!important}#topmenu .menutext .javlib-top-settings-btn:hover,.menutext .javlib-top-settings-btn:hover{color:#1d4ed8!important;text-decoration:underline!important}`);
        },
        _insertCopyButton(avid) {
            const codeEl = document.querySelector('#video_id .text');
            insertAvidCopyBtn(codeEl, avid);
        },
        _ensureDetailLayout() {
            const table = document.getElementById('video_jacket_info');
            if (!table) return null;
            const row = table.querySelector('tr');
            if (!row) return null;
            table.style.setProperty('width', '100%', 'important');
            table.style.setProperty('display', 'block', 'important');
            row.style.setProperty('display', 'flex', 'important');
            row.style.setProperty('gap', '20px', 'important');
            row.style.setProperty('align-items', 'flex-start', 'important');
            row.style.setProperty('width', '100%', 'important');
            const detailDefaults = DetailFlex.defaultCss('javlib');
            row.style.setProperty('--javlib-cover-flex', row.style.getPropertyValue('--javlib-cover-flex') || detailDefaults.cover);
            row.style.setProperty('--javlib-info-flex', row.style.getPropertyValue('--javlib-info-flex') || detailDefaults.info);
            row.style.setProperty('--javlib-magnet-flex', row.style.getPropertyValue('--javlib-magnet-flex') || detailDefaults.magnet);
            const tds = row.querySelectorAll('td');
            if (tds[0]) {
                tds[0].style.setProperty('flex', 'var(--javlib-cover-flex) 1 0', 'important');
                tds[0].style.setProperty('min-width', '0', 'important');
                tds[0].style.setProperty('vertical-align', 'top', 'important');
            }
            if (tds[1]) {
                tds[1].style.setProperty('flex', 'var(--javlib-info-flex) 1 0', 'important');
                tds[1].style.setProperty('min-width', '0', 'important');
                tds[1].style.setProperty('vertical-align', 'top', 'important');
                tds[1].style.setProperty('overflow', 'hidden', 'important');
                tds[1].style.setProperty('word-break', 'break-word', 'important');
            }
            const jacketImg = document.getElementById('video_jacket_img');
            if (jacketImg) {
                jacketImg.removeAttribute('width');
                jacketImg.removeAttribute('height');
                jacketImg.style.setProperty('width', '100%', 'important');
                jacketImg.style.setProperty('height', 'auto', 'important');
                jacketImg.style.setProperty('max-width', '100%', 'important');
            }
            return row;
        },
        _insertMagnet(avid) {
            if (!CFG.magnetTable) return;
            document.querySelectorAll('.jav-nong-slot').forEach(el => el.remove());
            const row = this._ensureDetailLayout();
            if (!row) return;
            const magnetTd = document.createElement('td');
            magnetTd.className = 'jav-nong-slot javlib-nong-slot';
            magnetTd.style.cssText = 'flex:var(--javlib-magnet-flex) 1 0;min-width:0;vertical-align:top;align-self:flex-start;';
            const innerWrap = document.createElement('div');
            innerWrap.style.cssText = 'display:inline-block;';
            const widget = Magnet.createMagnetWidget(avid);
            innerWrap.appendChild(widget);
            magnetTd.appendChild(innerWrap);
            row.appendChild(magnetTd);
        },
    };
    const SiteAdapters = [SiteJavBus, SiteJavDB, SiteJavLib];
    const SiteManager = {
        list: SiteAdapters,
        javdbGuardsReady: false,
        current() {
            return this.list.find(s => s.match()) || null;
        },
        isDetailPage() {
            return isCurrentDetailPage();
        },
        getListCards(doc = document) {
            return [
                ...doc.querySelectorAll('.javbus-card-grid > .item, .javdb-card-grid > .item, .videothumblist .videos.javlib-card-grid > .video')
            ];
        },
        getCardCover(card) {
            return card?.querySelector('.jav-card-cover') || null;
        },
        getCardCode(card) {
            if (!card) return '';
            const explicitCode = card.querySelector('.javbus-card-code, .javlib-card-code, .id, [data-code]')?.textContent?.trim();
            if (explicitCode) {
                const normalized = Utils.extractCode(explicitCode) || Utils.normalizeCode(explicitCode);
                if (normalized) return normalized;
            }
            const titleText = [
                card.querySelector('.javdb-card-headline')?.textContent,
                card.querySelector('.javlib-card-headline')?.textContent,
                card.querySelector('.javbus-card-headline')?.textContent,
                card.querySelector('.video-title')?.textContent,
                card.querySelector('.title')?.textContent,
                card.querySelector('a[title]')?.getAttribute('title'),
                card.textContent
            ].filter(Boolean).join(' ');
            return Utils.extractCode(titleText) || '';
        },
        getInfiniteScrollContainer(site, doc = document) {
            if (site === 'javbus') {
                return doc === document ? SiteJavBus._getGridContainer() : doc.querySelector('#waterfall');
            }
            if (site === 'javdb') {
                return doc.querySelector('.movie-list') || doc.querySelector('.movies') || doc.querySelector('.grid');
            }
            return null;
        },
        getInfiniteScrollConfig(doc = document, baseUrl = location.href) {
            if (SiteJavBus.match()) {
                if (SiteJavBus.isActorIndexPage(baseUrl)) return null;
                const container = this.getInfiniteScrollContainer('javbus', doc);
                if (!container) return null;
                const { nextUrl } = SiteJavBus._resolveListNext(doc, baseUrl);
                if (!nextUrl) return null;
                return {
                    site: 'javbus',
                    container,
                    nextUrl,
                    itemSelector: '#waterfall > .item',
                    paginationSelector: '.pagination',
                };
            }
            if (SiteJavDB.match()) {
                const container = this.getInfiniteScrollContainer('javdb', doc);
                const next = doc.querySelector('a.pagination-next[rel="next"][href], a[rel="next"].pagination-link[href]');
                if (!container || !next) return null;
                return {
                    site: 'javdb',
                    container,
                    nextUrl: new URL(next.getAttribute('href'), baseUrl).href,
                    itemSelector: '.movie-list .item, .movies .item, .grid .item',
                    paginationSelector: 'nav.pagination',
                };
            }
            return null;
        },
        decorateInfiniteScrollItem(site, item) {
            if (site === 'javbus') SiteJavBus._decorateCard?.(item);
            if (site === 'javdb') SiteJavDB._decorateCard?.(item);
            ListPreview.attach(item);
        },
        reflowInfiniteScroll(site, container) {
            if (site === 'javbus') {
                const live = this.getInfiniteScrollContainer('javbus') || container;
                live?.querySelectorAll(':scope > .item').forEach(item => SiteJavBus._decorateCard?.(item));
                return live || container;
            }
            const jq = window.jQuery || window.$;
            if (jq && jq(container).masonry) {
                jq(container).masonry('reloadItems');
                jq(container).masonry('layout');
            }
            return container;
        },
        findPan115TitleTextNode(anchor) {
            const root = anchor.querySelector('.video-title, .title, [class*="title"], h1, h2, h3, h4, h5, p') || anchor;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            });
            return walker.nextNode();
        },
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
            const code = Utils.extractCode(text);
            const pan115Code = Pan115.extractCode(text, code);
            if (!code || !pan115Code) return null;
            const visibleTitle = (anchor.textContent || anchor.getAttribute('title') || '').trim();
            const hasTitleText = visibleTitle.length > 0;
            if (!hasTitleText) return null;
            const looksLikeVideoLink =
                /\/v\/\w+/i.test(href) ||
                /(?:^|\/|\.)jav\w+\.html(?:[?#].*)?$/i.test(href) ||
                /\/videos\/[a-z0-9-]+\/?/i.test(href) ||
                /\/(?:[a-z]{2,15}-\d{2,10}|fc2[-_]?ppv[-_]?\d{6,9})\/?$/i.test(href) ||
                /\/(?:[a-z]{2,15}\d{3,6})\/?$/i.test(href) ||
                /(?:movie|video|detail|view|jav)/i.test(href);
            const inListContainer = !!anchor.closest('.movie-list, .movies, .grid, #waterfall, .movie-box, .box, .thumbnail, .video-list, .video-list-row, .section-container, .videothumblist');
            if (!looksLikeVideoLink && !inListContainer) return null;
            if (hasTitleText && !Utils.extractCode(visibleTitle) && !looksLikeVideoLink) return null;
            return { anchor, code: pan115Code };
        },
        collectPan115ListTargets() {
            if (this.isDetailPage()) return [];
            const isSupjavList = /supjav\.com/.test(location.hostname);
            const seen = new Set();
            const targets = [];
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
                    const code = Utils.extractCode(text);
                    const pan115Code = Pan115.extractCode(text, code);
                    if (!code || !pan115Code) return;
                    seen.add(anchor);
                    targets.push({ anchor, code: pan115Code });
                });
            }
            const selectors = [
                ...(isSupjavList ? ['.post h3 a[href]'] : []),
                '.movie-list a[href]',
                '.videothumblist .video > a[href]:not(.emby-javlibrary-list-badge)',
                '.movies a[href]',
                '.grid a[href]',
                '.item a[href]',
                '.video-title a[href]',
                'a.movie-box[href]',
                'a.box[href]',
                'a[href*="/v/"]',
                'a[title][href]',
            ];
            document.querySelectorAll(selectors.join(',')).forEach(anchor => {
                if (seen.has(anchor) || anchor.dataset.pan115Checked === '1') return;
                if (isSupjavList && !anchor.matches('.post h3 a[href]')) return;
                seen.add(anchor);
                const target = this.findPan115TitleAnchor(anchor);
                if (target) targets.push(target);
            });
            return targets;
        },
        insertPan115ListBadge(anchor, hit, code) {
            if (!Pan115.enabled() || !hit?.pickcode || !anchor || anchor.dataset.pan115HasBadge === '1') return;
            if (anchor.matches?.('.emby-javlibrary-list-badge') || anchor.closest?.('.emby-btn, .emby-badge, .emby-button-group, .emby-javlibrary-list-badge')) return;
            const title = anchor.querySelector('.title, .video-title');
            if (title) {
                const badge = createPan115Badge(hit, code, false);
                const javlibHeadline = title.querySelector('.javlib-card-headline');
                if (javlibHeadline) {
                    const footer = title.querySelector('.javlib-card-footer');
                    if (footer) {
                        footer.insertBefore(badge, footer.firstChild);
                    } else {
                        javlibHeadline.insertAdjacentElement('afterend', badge);
                    }
                    anchor.dataset.pan115HasBadge = '1';
                    return;
                }
                const javdbHeadline = title.querySelector('.javdb-card-headline');
                if (javdbHeadline) {
                    javdbHeadline.insertBefore(badge, javdbHeadline.firstChild);
                    anchor.dataset.pan115HasBadge = '1';
                    return;
                }
                title.insertBefore(badge, title.firstChild);
                anchor.dataset.pan115HasBadge = '1';
                return;
            }
            const textNode = this.findPan115TitleTextNode(anchor);
            if (textNode?.parentNode && anchor.contains(textNode.parentNode)) {
                const badge = createPan115Badge(hit, code, false);
                textNode.parentNode.insertBefore(badge, textNode);
            } else {
                const badge = createPan115Badge(hit, code, true);
                anchor.parentNode?.insertBefore(badge, anchor);
            }
            anchor.dataset.pan115HasBadge = '1';
        },
        getDetailFeatureSite() {
            return JumpSites.find(site => site.match(window.location.href)) || null;
        },
        getDetailCode() {
            const site = this.getDetailFeatureSite();
            if (!site) return '';
            const titleElem = site.id === 'emby'
                ? resolveEmbyTitleElem()
                : document.querySelector(site.titleSelector || '');
            const titleText = titleElem?.textContent || document.title || '';
            return Utils.extractCode(titleText) || '';
        },
        getDetailLayoutSite() {
            const host = location.hostname;
            if (/(?:^|\.)javbus\.com$/i.test(host) && document.querySelector('.row.movie')) return 'javbus';
            if (/javdb/i.test(host) && document.querySelector('.jav-flex-container, .column.column-video-cover')) return 'javdb';
            if (/(javlibrary|javlib|r86m|s87n)/i.test(host) && document.querySelector('#video_jacket_info tr')) return 'javlib';
            return '';
        },
        getMagnetSlot() {
            return document.querySelector('.jav-nong-slot');
        },
        createDetailPreviewStandaloneSlot() {
            const site = this.getDetailLayoutSite();
            const slot = document.createElement(site === 'javlib' ? 'td' : 'div');
            slot.className = `jav-detail-preview-standalone${site ? ` jav-detail-preview-standalone-${site}` : ''}`;
            if (site === 'javbus') {
                const root = document.querySelector('.row.movie');
                const info = root?.querySelector('.col-md-3.info');
                if (!root || !info) return null;
                info.insertAdjacentElement('afterend', slot);
                return slot;
            }
            if (site === 'javdb') {
                const root = document.querySelector('.jav-flex-container');
                const info = root?.querySelector('.movie-panel-info')?.closest('.column') || root?.querySelector('.movie-panel-info');
                if (!root || !info) return null;
                info.insertAdjacentElement('afterend', slot);
                return slot;
            }
            if (site === 'javlib') {
                const row = document.querySelector('#video_jacket_info tr');
                const info = row?.querySelector('#video_info')?.closest('td');
                if (!row || !info) return null;
                info.insertAdjacentElement('afterend', slot);
                return slot;
            }
            return null;
        },
        getDetailPreviewTarget() {
            const slot = this.getMagnetSlot();
            if (slot) {
                document.querySelectorAll('.jav-detail-preview-standalone').forEach(el => el.remove());
                let anchor = slot.querySelector('.jav-nong-wrapper');
                while (anchor?.parentElement && anchor.parentElement !== slot) {
                    anchor = anchor.parentElement;
                }
                return { slot, anchor };
            }
            let standalone = document.querySelector('.jav-detail-preview-standalone');
            if (!standalone) {
                standalone = this.createDetailPreviewStandaloneSlot();
            }
            if (!standalone) return null;
            return { slot: standalone, anchor: null, standalone: true };
        },
        clearDetailPreviewInline() {
            document.querySelectorAll('.jav-detail-preview-wrap').forEach(el => el.remove());
            document.querySelectorAll('.jav-detail-preview-standalone').forEach(el => el.remove());
            document.querySelectorAll('.jav-nong-slot.has-detail-preview-inline').forEach(el => {
                el.classList.remove('has-detail-preview-inline');
            });
        },
        getJumpSite(url = window.location.href) {
            return JumpSites.find(s => s.match(url)) || null;
        },
        getJumpTitleElement(site) {
            if (!site) return null;
            return site.id === 'emby'
                ? resolveEmbyTitleElem()
                : document.querySelector(site.titleSelector);
        },
        getEmbyInsertAnchor(titleElem) {
            return titleElem?.closest('.itemPrimaryNameContainer, .nameContainer, .detailPageWrapperContainer .infoWrapper') || titleElem;
        },
        getEmbyRenderKey(titleElem) {
            const hash = location.hash || '';
            const itemId = hash.match(/item\?id=([^&]+)/i)?.[1]
                || new URLSearchParams(hash.split('?')[1] || '').get('id')
                || '';
            const title = (titleElem?.textContent || '').trim();
            return `${itemId}::${title}`;
        },
        isEmbyPage(url = window.location.href) {
            return !!JumpSites.find(s => s.id === 'emby')?.match(url);
        },
        setupJavDbGuards() {
            if (this.javdbGuardsReady || !SiteJavDB.match()) return;
            this.javdbGuardsReady = true;
            SiteJavDB._dismissOver18Modal();
            SiteJavDB._hideDownloadCorrectionBlock();
            const javdbOver18Observer = new MutationObserver(() => {
                SiteJavDB._dismissOver18Modal();
                SiteJavDB._hideDownloadCorrectionBlock();
            });
            javdbOver18Observer.observe(document.documentElement, { childList: true, subtree: true });
            window.addEventListener('popstate', () => setTimeout(() => {
                SiteJavDB._dismissOver18Modal();
                SiteJavDB._hideDownloadCorrectionBlock();
            }, 0));
            window.addEventListener('hashchange', () => setTimeout(() => {
                SiteJavDB._dismissOver18Modal();
                SiteJavDB._hideDownloadCorrectionBlock();
            }, 0));
        },
        initCurrent() {
            const site = this.current();
            if (!site) return;
            const avid = site.getVid();
            log('匹配站点:', site.constructor?.name || '未知', '| 番号:', avid);
            site.initPage(avid);
            PageZoom.applyCurrent();
            DetailFlex.apply();
        },
    };
    const ListOpenNewTab = (() => {
        const MARK = 'laosijiListNewTab';
        function enabled() {
            return CFG.listOpenNewTab;
        }
        function isSafeHref(anchor) {
            const href = anchor?.getAttribute?.('href') || '';
            if (!href || /^(?:javascript:|#|magnet:|mailto:|tel:)/i.test(href)) return false;
            try {
                const url = new URL(href, location.href);
                return /^https?:$/i.test(url.protocol);
            } catch (err) {
                return false;
            }
        }
        function collectAnchors() {
            if (SiteManager.isDetailPage()) return [];
            if (SiteJavBus.match() && SiteJavBus.isActorIndexPage()) return [];
            let selectors = [];
            if (SiteJavBus.match()) {
                selectors = [
                    '#waterfall.javbus-card-grid > .item > a.movie-box[href]',
                    '.javbus-card-grid .javbus-card-link[href]',
                ];
            } else if (SiteJavDB.match()) {
                selectors = [
                    '.javdb-card-grid > .item > a.box[href]',
                    '.movie-list.javdb-card-grid > .item > a.box[href]',
                    '.movies.javdb-card-grid > .item > a.box[href]',
                    '.grid.javdb-card-grid > .item > a.box[href]',
                ];
            } else if (SiteJavLib.match()) {
                selectors = [
                    '.videothumblist .videos.javlib-card-grid > .video > a[href]:not(.emby-javlibrary-list-badge)',
                ];
            }
            if (!selectors.length) return [];
            const seen = new Set();
            return selectors.flatMap(selector => [...document.querySelectorAll(selector)])
                .filter(anchor => {
                    if (seen.has(anchor) || !isSafeHref(anchor)) return false;
                    seen.add(anchor);
                    return true;
                });
        }
        function remember(anchor) {
            if (anchor.dataset[MARK] === '1') return;
            anchor.dataset[MARK] = '1';
            anchor.dataset.laosijiHadTarget = anchor.hasAttribute('target') ? '1' : '0';
            anchor.dataset.laosijiHadRel = anchor.hasAttribute('rel') ? '1' : '0';
            anchor.dataset.laosijiOriginalTarget = anchor.getAttribute('target') || '';
            anchor.dataset.laosijiOriginalRel = anchor.getAttribute('rel') || '';
        }
        function applyAnchor(anchor) {
            if (anchor.dataset.laosijiNewTabApplied === '1') return;
            remember(anchor);
            const rel = new Set((anchor.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
            rel.add('noopener');
            rel.add('noreferrer');
            anchor.setAttribute('target', '_blank');
            anchor.setAttribute('rel', [...rel].join(' '));
            anchor.dataset.laosijiNewTabApplied = '1';
        }
        function restoreAnchor(anchor) {
            if (anchor.dataset[MARK] !== '1') return;
            if (anchor.dataset.laosijiHadTarget === '1') {
                anchor.setAttribute('target', anchor.dataset.laosijiOriginalTarget || '');
            } else {
                anchor.removeAttribute('target');
            }
            if (anchor.dataset.laosijiHadRel === '1') {
                anchor.setAttribute('rel', anchor.dataset.laosijiOriginalRel || '');
            } else {
                anchor.removeAttribute('rel');
            }
            delete anchor.dataset[MARK];
            delete anchor.dataset.laosijiHadTarget;
            delete anchor.dataset.laosijiHadRel;
            delete anchor.dataset.laosijiOriginalTarget;
            delete anchor.dataset.laosijiOriginalRel;
            delete anchor.dataset.laosijiNewTabApplied;
        }
        function clearExcept(active = new Set()) {
            document.querySelectorAll('a[data-laosiji-list-new-tab="1"]').forEach(anchor => {
                if (!active.has(anchor)) restoreAnchor(anchor);
            });
        }
        function sync() {
            if (!enabled()) {
                clearExcept();
                return;
            }
            const anchors = collectAnchors();
            const active = new Set(anchors);
            anchors.forEach(applyAnchor);
            clearExcept(active);
        }
        return { sync, clear: () => clearExcept() };
    })();
    Core.expose('__LAOSIJI_LIST_OPEN_NEW_TAB__', ListOpenNewTab);
    const StillsGallery = (() => {
        let activeViewerClose = null;
        function ensureStyle() {
            injectStyle('jav-stills-gallery-style', `.jav-stills-shell{position:relative!important;width:100%!important;inline-size:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:16px 0 18px!important;padding:12px 44px!important;border:1px solid #d9e2ec!important;border-radius:8px!important;background:#ffffff!important;box-shadow:0 8px 18px rgba(15,23,42,.06)!important;overflow:hidden!important}.jav-stills-stage{position:relative!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;overflow:hidden!important}.jav-stills-rail{display:flex!important;flex-wrap:nowrap!important;align-items:stretch!important;gap:10px!important;width:100%!important;inline-size:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0!important;padding:2px 0 10px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-behavior:smooth!important;overscroll-behavior-inline:contain!important;scrollbar-width:thin!important;scrollbar-color:rgba(100,116,139,.44) transparent!important}.jav-stills-rail::-webkit-scrollbar{height:8px!important}.jav-stills-rail::-webkit-scrollbar-thumb{border-radius:999px!important;background:rgba(100,116,139,.36)!important}.jav-stills-rail::-webkit-scrollbar-track{background:transparent!important}.jav-stills-arrow{position:absolute!important;top:50%!important;z-index:3!important;display:grid!important;place-items:center!important;width:34px!important;height:42px!important;border:1px solid rgba(148,163,184,.42)!important;border-radius:8px!important;background:rgba(255,255,255,.92)!important;color:#172033!important;font-size:24px!important;line-height:1!important;font-weight:800!important;cursor:pointer!important;transform:translateY(-50%)!important;box-shadow:0 8px 18px rgba(15,23,42,.14)!important;transition:transform .18s ease,background .18s ease,border-color .18s ease!important;touch-action:manipulation!important}.jav-stills-arrow:hover{background:#ffffff!important;border-color:rgba(37,99,235,.45)!important;transform:translateY(-50%) scale(1.04)!important}.jav-stills-arrow-prev{left:8px!important}.jav-stills-arrow-next{right:8px!important}.jav-stills-rail>a,.jav-stills-rail>.tile-item,.jav-stills-rail>.preview-video-container{flex:0 0 auto!important;display:block!important;position:relative!important;width:172px!important;height:104px!important;margin:0!important;padding:0!important;border:1px solid rgba(148,163,184,.28)!important;border-radius:8px!important;background:#e2e8f0!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)!important;overflow:hidden!important;box-sizing:border-box!important;text-decoration:none!important}.jav-stills-rail img{display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center!important;border:0!important}.jav-stills-rail .photo-frame{width:100%!important;height:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important}.jav-stills-rail>video,.jav-stills-rail video[style*="display:none"],.jav-stills-rail video[style*="display:none"]{display:none!important;flex:0 0 auto!important}.jav-stills-javdb .preview-video-container span{position:absolute!important;left:8px!important;bottom:7px!important;z-index:2!important;padding:3px 7px!important;border-radius:6px!important;background:rgba(15,23,42,.68)!important;color:#ffffff!important;font-size:11px!important;line-height:1!important;font-weight:800!important}.jav-stills-javlib .jav-stills-rail>a{width:150px!important;height:100px!important}.javdb-stills-column-clean,.javdb-stills-panel-clean,.javdb-stills-panel-clean>.message-body,.javdb-stills-body-clean{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.javdb-stills-column-clean{flex:1 1 0!important;overflow:hidden!important;padding-left:.75rem!important;padding-right:.75rem!important}.javdb-stills-panel-clean{margin:16px 0 18px!important}.jav-stills-javdb{width:auto!important;max-width:min(100%,calc(100vw - 34px))!important;max-inline-size:min(100%,calc(100vw - 34px))!important}.javdb-stills-panel-clean .jav-stills-shell{margin:0!important}.jav-stills-viewer{position:fixed!important;inset:0!important;z-index:2147483647!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;background:rgba(8,13,25,.9)!important;backdrop-filter:blur(5px)!important;color:#ffffff!important;cursor:zoom-out!important}.jav-stills-viewer-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:54px!important;padding:12px 16px!important;box-sizing:border-box!important;pointer-events:none!important}.jav-stills-viewer-count{min-width:64px!important;padding:6px 10px!important;border-radius:8px!important;background:rgba(15,23,42,.72)!important;color:#e5edf8!important;font-size:13px!important;font-weight:800!important;text-align:center!important;pointer-events:auto!important}.jav-stills-viewer-close,.jav-stills-viewer-nav{display:grid!important;place-items:center!important;border:1px solid rgba(226,232,240,.22)!important;background:rgba(15,23,42,.72)!important;color:#ffffff!important;cursor:pointer!important;box-shadow:0 12px 26px rgba(0,0,0,.24)!important;touch-action:manipulation!important}.jav-stills-viewer-close{width:38px!important;height:38px!important;border-radius:10px!important;font-size:24px!important;line-height:1!important;pointer-events:auto!important}.jav-stills-viewer-close:hover,.jav-stills-viewer-nav:hover{background:rgba(30,41,59,.88)!important;border-color:rgba(255,255,255,.36)!important}.jav-stills-viewer-body{position:relative!important;display:grid!important;place-items:center!important;min-width:0!important;min-height:0!important;padding:0 68px!important;box-sizing:border-box!important;overflow:auto!important}.jav-stills-viewer-img{display:block!important;max-width:100%!important;max-height:calc(100vh - 118px)!important;width:auto!important;height:auto!important;object-fit:contain!important;border-radius:6px!important;background:#111827!important;box-shadow:0 18px 46px rgba(0,0,0,.45)!important;cursor:zoom-in!important}.jav-stills-viewer-img.is-zoomed{max-width:none!important;max-height:none!important;cursor:zoom-out!important}.jav-stills-viewer-nav{position:fixed!important;top:50%!important;z-index:2147483647!important;width:44px!important;height:58px!important;border-radius:12px!important;font-size:30px!important;line-height:1!important;transform:translateY(-50%)!important}.jav-stills-viewer-prev{left:18px!important}.jav-stills-viewer-next{right:18px!important}.jav-stills-viewer-caption{min-height:42px!important;padding:9px 18px 16px!important;box-sizing:border-box!important;color:rgba(226,232,240,.86)!important;font-size:13px!important;line-height:1.45!important;text-align:center!important;pointer-events:none!important}@media (max-width:720px){.jav-stills-shell{padding:10px 40px!important}.jav-stills-rail>a,.jav-stills-rail>.tile-item,.jav-stills-rail>.preview-video-container{width:150px!important;height:92px!important}.jav-stills-javlib .jav-stills-rail>a{width:138px!important;height:92px!important}.jav-stills-viewer-body{padding:0 52px!important}.jav-stills-viewer-nav{width:38px!important;height:52px!important}.jav-stills-viewer-prev{left:8px!important}.jav-stills-viewer-next{right:8px!important}}`);
        }
        function scrollRail(rail, dir) {
            const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
            if (maxLeft <= 1) return;
            const edge = 8;
            if (dir > 0 && rail.scrollLeft >= maxLeft - edge) {
                rail.scrollTo({ left: 0, behavior: 'smooth' });
                return;
            }
            if (dir < 0 && rail.scrollLeft <= edge) {
                rail.scrollTo({ left: maxLeft, behavior: 'smooth' });
                return;
            }
            rail.scrollBy({ left: dir * Math.max(220, rail.clientWidth * .72), behavior: 'smooth' });
        }
        function button(text, className, rail, dir) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `jav-stills-arrow ${className}`;
            btn.textContent = text;
            btn.setAttribute('aria-label', dir < 0 ? '向左滚动剧照' : '向右滚动剧照');
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                scrollRail(rail, dir);
            });
            return btn;
        }
        function toAbsUrl(value) {
            try {
                return new URL(value, location.href).href;
            } catch {
                return '';
            }
        }
        function isImageHref(value) {
            const url = String(value || '').split('#')[0].split('?')[0];
            return /\.(?:jpe?g|png|webp|gif|bmp)$/i.test(url);
        }
        function collectImages(rail) {
            return [...rail.querySelectorAll(':scope > a[href]')].map(anchor => {
                const href = anchor.getAttribute('href') || '';
                if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return null;
                const img = anchor.querySelector('img[src]');
                if (!img) return null;
                const url = toAbsUrl(href);
                const src = toAbsUrl(img.currentSrc || img.src || img.getAttribute('src') || '');
                if (!url || (!isImageHref(url) && !isImageHref(src))) return null;
                const title = anchor.getAttribute('data-caption') || img.getAttribute('title') || img.getAttribute('alt') || '';
                return { anchor, url, title: title.trim() };
            }).filter(Boolean);
        }
        function openViewer(items, startIndex = 0) {
            if (!items.length) return;
            activeViewerClose?.();
            const originalHtmlOverflow = document.documentElement.style.overflow;
            const originalBodyOverflow = document.body.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            let index = startIndex;
            const overlay = document.createElement('div');
            overlay.className = 'jav-stills-viewer';
            const top = document.createElement('div');
            top.className = 'jav-stills-viewer-top';
            const count = document.createElement('div');
            count.className = 'jav-stills-viewer-count';
            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'jav-stills-viewer-close';
            close.textContent = '×';
            close.setAttribute('aria-label', '关闭剧照预览');
            top.append(count, close);
            const body = document.createElement('div');
            body.className = 'jav-stills-viewer-body';
            const img = document.createElement('img');
            img.className = 'jav-stills-viewer-img';
            body.appendChild(img);
            const prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'jav-stills-viewer-nav jav-stills-viewer-prev';
            prev.textContent = '‹';
            prev.setAttribute('aria-label', '上一张剧照');
            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'jav-stills-viewer-nav jav-stills-viewer-next';
            next.textContent = '›';
            next.setAttribute('aria-label', '下一张剧照');
            const caption = document.createElement('div');
            caption.className = 'jav-stills-viewer-caption';
            const show = nextIndex => {
                index = (nextIndex + items.length) % items.length;
                const item = items[index];
                img.classList.remove('is-zoomed');
                img.src = item.url;
                img.alt = item.title || `剧照 ${index + 1}`;
                count.textContent = `${index + 1} / ${items.length}`;
                caption.textContent = item.title || '';
            };
            const closeViewer = (event = null) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation?.();
                }
                overlay.remove();
                document.documentElement.style.overflow = originalHtmlOverflow;
                document.body.style.overflow = originalBodyOverflow;
                document.removeEventListener('keydown', keyHandler, true);
                if (activeViewerClose === closeViewer) activeViewerClose = null;
            };
            const keyHandler = e => {
                if (e.key === 'Escape') {
                    closeViewer(e);
                    return;
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation?.();
                    show(index + (e.key === 'ArrowRight' ? 1 : -1));
                }
            };
            close.addEventListener('click', closeViewer, true);
            prev.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                show(index - 1);
            }, true);
            next.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                show(index + 1);
            }, true);
            img.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                img.classList.toggle('is-zoomed');
            }, true);
            overlay.addEventListener('click', e => {
                if (e.target === overlay || e.target === body) closeViewer(e);
            }, true);
            document.addEventListener('keydown', keyHandler, true);
            overlay.append(top, body, prev, next, caption);
            document.body.appendChild(overlay);
            activeViewerClose = closeViewer;
            show(index);
        }
        function bindViewer(rail) {
            if (rail.dataset.laosijiStillsViewerBound === '1') return;
            rail.dataset.laosijiStillsViewerBound = '1';
            rail.addEventListener('click', e => {
                const anchor = e.target?.closest?.('a[href]');
                if (!anchor || !rail.contains(anchor)) return;
                const items = collectImages(rail);
                const index = items.findIndex(item => item.anchor === anchor);
                if (index < 0) return;
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                openViewer(items, index);
            }, true);
        }
        function findConfig() {
            if (SiteJavBus.match()) {
                const container = document.querySelector('#sample-waterfall');
                if (!container?.querySelector('a, img')) return null;
                const heading = container.previousElementSibling?.matches?.('h4') ? container.previousElementSibling : null;
                return { site: 'javbus', container, heading };
            }
            if (SiteJavDB.match()) {
                const container = document.querySelector('.tile-images.preview-images');
                if (!container?.querySelector('a, img, video')) return null;
                return { site: 'javdb', container, heading: null };
            }
            if (SiteJavLib.match()) {
                const container = document.querySelector('.previewthumbs');
                if (!container?.querySelector('a, img')) return null;
                return { site: 'javlib', container, heading: null };
            }
            return null;
        }
        function cleanSiteShell(config) {
            if (config.site !== 'javdb') return;
            config.container.closest('.column')?.classList.add('javdb-stills-column-clean');
            config.container.closest('.message.video-panel, article.message')?.classList.add('javdb-stills-panel-clean');
            config.container.closest('.message-body')?.classList.add('javdb-stills-body-clean');
        }
        function sync() {
            const config = findConfig();
            if (!config?.container) return;
            ensureStyle();
            cleanSiteShell(config);
            bindViewer(config.container);
            if (config.container.closest('.jav-stills-shell')) return;
            const shell = document.createElement('div');
            shell.className = `jav-stills-shell jav-stills-${config.site}`;
            shell.dataset.laosijiStills = '1';
            const stage = document.createElement('div');
            stage.className = 'jav-stills-stage';
            config.container.classList.add('jav-stills-rail', `jav-stills-rail-${config.site}`);
            config.container.dataset.laosijiStillsRail = '1';
            const ref = config.heading || config.container;
            ref.parentNode?.insertBefore(shell, ref);
            if (config.heading) {
                config.heading.dataset.laosijiStillsHidden = '1';
                config.heading.style.display = 'none';
            }
            stage.append(
                button('‹', 'jav-stills-arrow-prev', config.container, -1),
                config.container,
                button('›', 'jav-stills-arrow-next', config.container, 1)
            );
            shell.append(stage);
        }
        return { sync };
    })();
    Core.expose('__LAOSIJI_SITE_MANAGER__', SiteManager);
    Core.expose('__LAOSIJI_SITE_JAVBUS__', SiteJavBus);
    Core.expose('__LAOSIJI_SITE_JAVDB__', SiteJavDB);
    Core.expose('__LAOSIJI_SITE_JAVLIB__', SiteJavLib);
    Core.expose('__LAOSIJI_STILLS_GALLERY__', StillsGallery);
    function mainRun() {
        SiteManager.initCurrent();
    }
    GM_addStyle(`.preview-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;overflow:auto;cursor:zoom-out;backdrop-filter:blur(5px)}.preview-img{border-radius:4px;margin:auto;cursor:zoom-in;max-width:95vw;max-height:95vh;object-fit:contain;display:block;box-shadow:0 0 20px rgba(0,0,0,0.5)}.preview-img.zoomed{max-width:none;max-height:none;cursor:zoom-out}a:focus:not(:focus-visible),button:focus:not(:focus-visible),[role="button"]:focus:not(:focus-visible),input[type="button"]:focus:not(:focus-visible),input[type="submit"]:focus:not(:focus-visible){outline:none!important}.jav-jump-btn-group{margin-top:8px;margin-bottom:4px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.emby-fix{width:100%!important;flex-basis:100%!important;clear:both!important;margin-top:8px!important;margin-bottom:4px!important}.mini-switch{width:40px;height:20px;appearance:none;background:#e0e0e0;border-radius:20px;position:relative;cursor:pointer;outline:none;transition:background 0.2s}.mini-switch:checked{background:#4CAF50}.mini-switch::before{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:white;top:2px;left:2px;transition:left 0.2s}.mini-switch:checked::before{left:calc(100% - 18px)}@keyframes btnSlideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}.jav-jump-btn-group a{transition:background .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease;animation:btnSlideIn 0.3s ease-out}.jav-jump-btn-group a:hover{background:var(--jav-btn-hover-bg,#f8fafc)!important;transform:translateY(-1px)!important;filter:none!important;box-shadow:0 5px 14px rgba(15,23,42,0.12),inset 0 1px 0 rgba(255,255,255,0.76)!important;text-decoration:none!important}@keyframes menuFadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.search-menu{position:relative;display:inline-block;border-radius:4px}.search-main-btn{padding-right:28px!important}.search-toggle-btn{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:16px;height:16px;padding:0!important;margin:0!important;display:inline-flex!important;align-items:center;justify-content:center;flex-shrink:0;font-size:10px!important;line-height:1;opacity:1;background:color-mix(in srgb,var(--jav-btn-accent,#64748b) 18%,#ffffff)!important;color:inherit!important;border:1px solid color-mix(in srgb,var(--jav-btn-accent,#64748b) 26%,#ffffff)!important;border-radius:999px!important;box-shadow:0 1px 2px rgba(15,23,42,0.12),inset 0 1px 0 rgba(255,255,255,0.7)!important;cursor:pointer}.search-toggle-btn:hover{filter:none;background:color-mix(in srgb,var(--jav-btn-accent,#64748b) 26%,#ffffff)!important}.search-toggle-btn .search-arrow{display:inline-block;transform:translateY(-1px);pointer-events:none}.search-submenu{position:absolute;top:calc(100%+4px);left:0;display:none;flex-direction:column;gap:4px;padding:4px;background:rgba(255,255,255,0.95);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:10000;min-width:120px;backdrop-filter:blur(5px)}.search-submenu.is-open{display:flex}.search-submenu a{transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1)!important}.search-submenu a:hover{transform:translateX(5px) scale(1.02);filter:brightness(1.1)}.jav-pan115-badge{display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:22px!important;padding:0 7px;margin-right:6px;position:static!important;top:auto!important;transform:none!important;border-radius:6px;background:#bbf7d0;border:1px solid #22c55e;color:#065f46;font-size:12px!important;font-weight:800;line-height:22px!important;text-decoration:none;box-sizing:border-box;vertical-align:middle;box-shadow:inset 0 1px 0 rgba(255,255,255,0.72)}.jav-pan115-badge:hover{background:#86efac;color:#064e3b;text-decoration:none;box-shadow:0 4px 12px rgba(15,23,42,0.12),inset 0 1px 0 rgba(255,255,255,0.76)}span.jav-pan115-badge{cursor:pointer}.jav-infinite-sentinel{width:100%;padding:14px 0;color:#64748b;font-size:13px;font-weight:700;text-align:center;clear:both}.jav-infinite-sentinel.is-loading{color:#2563eb}.jav-infinite-sentinel.is-done{color:#94a3b8}.jav-infinite-sentinel.is-error{color:#dc2626;cursor:pointer}.preview-toolbar{position:fixed;top:20px;right:20px;display:flex;gap:8px;z-index:2147483648;background:rgba(30,30,30,0.75);backdrop-filter:blur(10px);padding:6px 12px;border-radius:30px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 6px 18px rgba(0,0,0,0.25)}.preview-btn{border:none;color:#eee;font-size:13px;font-weight:450;cursor:pointer;padding:6px 14px;border-radius:24px;transition:all 0.2s ease;display:inline-flex;align-items:center;gap:6px;background:rgba(100,100,120,0.3);border:1px solid rgba(255,255,255,0.05);box-shadow:0 2px 4px rgba(0,0,0,0.1);letter-spacing:0.2px}.preview-btn:hover{background:rgba(140,140,160,0.4);transform:translateY(-2px);box-shadow:0 6px 12px rgba(0,0,0,0.2)}.preview-btn.javfree.active{background:#2ecc71;color:white;border-color:rgba(255,255,255,0.3);box-shadow:0 0 16px rgba(46,204,113,0.6);font-weight:500}.preview-btn.javstore.active{background:#e74c3c;color:white;border-color:rgba(255,255,255,0.3);box-shadow:0 0 16px rgba(231,76,60,0.6);font-weight:500}.preview-btn.action{background:rgba(100,100,120,0.3)}.preview-btn.action:hover{background:rgba(140,140,160,0.5)}.preview-btn:active{transform:translateY(0);box-shadow:0 2px 4px rgba(0,0,0,0.15)}.trailer-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:34px;background:radial-gradient(circle at 50% 18%,rgba(56,189,248,0.16),transparent 32%),linear-gradient(180deg,rgba(5,7,12,0.88),rgba(0,0,0,0.96));backdrop-filter:blur(16px) saturate(0.85);cursor:default}.trailer-modal{width:min(1120px,94vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;color:#f8fafc;background:#05070c;border:1px solid rgba(255,255,255,0.12);border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,0.68),0 0 0 1px rgba(255,255,255,0.04) inset;cursor:default;animation:trailerFadeIn .18s ease-out}@keyframes trailerFadeIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}.trailer-header{position:absolute;top:0;left:0;right:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px 34px;background:linear-gradient(180deg,rgba(0,0,0,0.66),rgba(0,0,0,0));border:0;pointer-events:none;opacity:1;transition:opacity .18s ease,transform .18s ease}.trailer-title{min-width:0;display:flex;align-items:center;gap:10px;font:700 15px/1.3 Arial,"Microsoft YaHei",sans-serif;pointer-events:auto}.trailer-code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.4px}.trailer-source{flex-shrink:0;padding:3px 9px;border-radius:999px;color:rgba(255,255,255,0.82);background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);font-size:12px;font-weight:500;backdrop-filter:blur(12px)}.jav-player-close{width:34px;height:34px;border:0;border-radius:50%;color:#fff;background:rgba(255,255,255,0.14);cursor:pointer;font-size:18px;line-height:34px;pointer-events:auto;box-shadow:0 8px 20px rgba(0,0,0,0.22);transition:transform .15s ease,background .15s ease,box-shadow .15s ease}.jav-player-close:hover{transform:scale(1.08);background:rgba(248,113,113,0.34);box-shadow:0 10px 24px rgba(0,0,0,0.28)}.trailer-screen{position:relative;aspect-ratio:16 / 9;width:100%;max-height:82vh;overflow:hidden;background:radial-gradient(circle at center,rgba(31,41,55,.75),#000 62%),#000}.trailer-screen:fullscreen{width:100vw;height:100vh;max-height:none;aspect-ratio:auto;display:flex;align-items:center;justify-content:center;background:#000}.trailer-screen:-webkit-full-screen{width:100vw;height:100vh;max-height:none;aspect-ratio:auto;display:flex;align-items:center;justify-content:center;background:#000}.trailer-screen::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,0.52),rgba(0,0,0,0) 30%),linear-gradient(0deg,rgba(0,0,0,0.62),rgba(0,0,0,0) 36%)}.trailer-screen.is-iframe::before{display:none}.trailer-screen video,.trailer-screen iframe{position:absolute;inset:0;width:100%;height:100%;display:block;border:0;background:#000;object-fit:contain}.trailer-volume-indicator{position:absolute;top:62px;right:26px;z-index:5;color:#f8fafc;font:750 24px/1 Arial,"Microsoft YaHei",sans-serif;text-shadow:0 2px 8px rgba(0,0,0,0.82);opacity:0;pointer-events:none;transition:opacity .14s ease}.trailer-volume-indicator.is-visible{opacity:1}.trailer-fallback-status{position:absolute;left:18px;top:58px;z-index:5;max-width:min(520px,calc(100% - 36px));padding:7px 10px;border-radius:8px;color:rgba(255,255,255,0.9);background:rgba(10,14,22,0.68);border:1px solid rgba(255,255,255,0.16);box-shadow:0 12px 28px rgba(0,0,0,0.28);backdrop-filter:blur(14px);font:12px/1.45 Arial,"Microsoft YaHei",sans-serif;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .16s ease,transform .16s ease}.trailer-fallback-status.is-visible{opacity:1;transform:translateY(0)}.trailer-quality-bar{display:flex;align-items:center;gap:8px;padding:0;background:transparent;border:none;border-radius:0;backdrop-filter:none}.trailer-quality-select{min-width:78px;max-width:140px;height:30px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.12);color:#f8fafc;outline:none;font-size:12px;line-height:28px;text-align:center;text-align-last:center;appearance:none;cursor:pointer}.trailer-quality-select option{background:#0b1020;color:#f8fafc}.trailer-footer{position:absolute;left:16px;right:16px;bottom:16px;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;color:rgba(255,255,255,0.78);background:rgba(10,14,22,0.62);border:1px solid rgba(255,255,255,0.16);border-radius:8px;box-shadow:0 18px 40px rgba(0,0,0,0.32);backdrop-filter:blur(16px) saturate(1.08);font:12px/1.4 Arial,"Microsoft YaHei",sans-serif;opacity:1;transform:translateY(0);transition:opacity .18s ease,transform .18s ease}.trailer-screen.is-controls-hidden{cursor:none}.trailer-screen.is-controls-hidden .trailer-header{opacity:0;transform:translateY(-8px);pointer-events:none}.trailer-screen.is-controls-hidden .trailer-footer{opacity:0;transform:translateY(10px);pointer-events:none}.trailer-control-left,.trailer-control-right{display:flex;align-items:center;gap:9px;min-width:0}.trailer-control-left{flex:1 1 auto}.trailer-control-right{flex:0 0 auto}.trailer-control-btn{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;padding:0;border:0;border-radius:999px;color:#fff;background:rgba(255,255,255,0.14);cursor:pointer;font:700 13px/1 Arial,"Microsoft YaHei",sans-serif;transition:background .15s ease,transform .15s ease}.trailer-control-btn:hover{background:rgba(255,255,255,0.24);transform:translateY(-1px)}.trailer-volume-wrap{position:relative;display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.trailer-volume-wrap::before{content:"";position:absolute;left:50%;bottom:100%;width:46px;height:18px;transform:translateX(-50%)}.trailer-volume-popover{position:absolute;left:50%;bottom:calc(100% + 10px);width:36px;height:126px;display:flex;align-items:center;justify-content:center;padding:12px 0;border-radius:999px;background:rgba(10,14,22,0.76);border:1px solid rgba(255,255,255,0.16);box-shadow:0 14px 32px rgba(0,0,0,0.34);backdrop-filter:blur(16px) saturate(1.08);opacity:0;pointer-events:none;transform:translate(-50%,6px);transition:opacity .15s ease,transform .15s ease}.trailer-volume-wrap:hover .trailer-volume-popover{opacity:1;pointer-events:auto;transform:translate(-50%,0)}.trailer-volume-rail{position:absolute;left:50%;top:16px;bottom:16px;width:4px;transform:translateX(-50%);border-radius:999px;background:rgba(255,255,255,0.32);pointer-events:none}.trailer-volume-fill{position:absolute;left:0;right:0;bottom:0;height:var(--volume-percent,35%);border-radius:999px;background:#38bdf8}.trailer-volume-thumb{position:absolute;left:50%;bottom:var(--volume-percent,35%);width:16px;height:16px;transform:translate(-50%,50%);border-radius:50%;background:#38bdf8;border:2px solid rgba(255,255,255,0.92);box-shadow:0 2px 8px rgba(0,0,0,0.38)}.trailer-volume-slider{position:absolute;top:10px;bottom:10px;left:50%;width:16px;height:calc(100% - 20px);margin:0;transform:translateX(-50%);appearance:none;-webkit-appearance:none;writing-mode:vertical-lr;direction:rtl;background:transparent;cursor:pointer}.trailer-volume-slider::-webkit-slider-runnable-track{width:100%;height:100%;background:transparent}.trailer-volume-slider::-moz-range-track{width:100%;height:100%;background:transparent}.trailer-volume-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:16px;background:transparent;border:0;box-shadow:none}.trailer-volume-slider::-moz-range-thumb{width:24px;height:16px;background:transparent;border:0;box-shadow:none}.trailer-time{flex:0 0 auto;min-width:36px;color:rgba(255,255,255,0.78);font:11px/1.3 Arial,"Microsoft YaHei",sans-serif;white-space:nowrap;text-align:center}.trailer-progress{flex:1 1 160px;min-width:120px;height:4px;margin:0;border-radius:999px;accent-color:#38bdf8;cursor:pointer}.jav-jump-toast{position:fixed;left:50%;top:72px;z-index:2147483647;display:flex;align-items:flex-start;gap:12px;width:min(420px,calc(100vw - 32px));padding:14px 16px;color:#f8fafc;background:rgba(15,23,42,0.94);border:1px solid rgba(148,163,184,0.28);border-left:4px solid #38bdf8;border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,0.34),0 0 0 1px rgba(255,255,255,0.04) inset;backdrop-filter:blur(14px) saturate(1.1);font-family:Arial,"Microsoft YaHei",sans-serif;transform:translate(-50%,-12px);opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}.jav-jump-toast.show{opacity:1;transform:translate(-50%,0)}.jav-jump-toast.hide{opacity:0;transform:translate(-50%,-12px)}.jav-jump-toast-icon{flex:0 0 auto;width:24px;height:24px;border-radius:999px;color:#082f49;background:#7dd3fc;font-size:16px;font-weight:800;line-height:24px;text-align:center}.jav-jump-toast-title{margin:0 0 4px;font-size:14px;font-weight:700;line-height:1.35}.jav-jump-toast-message{margin:0;color:#cbd5e1;font-size:13px;line-height:1.45}@media (max-width:720px){.trailer-overlay{padding:12px}.trailer-modal{width:100%;border-radius:8px}.trailer-header{padding:12px 12px 30px}.trailer-title{gap:7px;font-size:13px}.trailer-source{max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.trailer-footer{left:8px;right:8px;bottom:8px;flex-direction:column;align-items:stretch;gap:7px;padding:8px}.trailer-control-left,.trailer-control-right{width:100%;justify-content:center}.trailer-progress{min-width:80px}.jav-jump-toast{top:18px;width:calc(100vw - 24px);padding:13px 14px}}`);
    const Utils = {
        normalizeCode(code) {
            const raw = String(code || '').trim();
            if (!raw) return '';
            const normalized = raw
                .replace(/\s+/g, '-')
                .replace(/^FC2[-_]?PPV[-_]?/i, 'FC2-')
                .toUpperCase();
            const uncensoredNumeric = normalized.match(/(\d{6})[-_](\d{2,3})/);
            if (uncensoredNumeric) {
                const sep = uncensoredNumeric[0].includes('_') ? '_' : '-';
                return `${uncensoredNumeric[1]}${sep}${uncensoredNumeric[2]}`;
            }
            const compact = normalized.match(/^([A-Z]{2,10})(\d{3,6})$/);
            if (compact) {
                const number = compact[2].replace(/^0+(?=\d{3})/, '');
                return `${compact[1]}-${number}`;
            }
            const trimmed = normalized.match(/^([A-Z0-9]{2,15}[-_]\d{2,9})/);
            if (trimmed) return trimmed[1];
            return normalized;
        },
        extractCode(text, options = {}) {
            if (!text) return null;
            const uncensoredHit = String(text).match(/(?:(PACOPACOMAMA|PACO|10MUSUME|10MU|1PONDO|CARIBBEANCOM|CARIB|HEYZO)[-_\s]*)?(\d{6})([-_])(\d{2,3})/i);
            if (uncensoredHit) {
                const code = Utils.normalizeCode(`${uncensoredHit[2]}${uncensoredHit[3]}${uncensoredHit[4]}`);
                if (options.keepUncensoredSource && uncensoredHit[1]) {
                    return `${uncensoredHit[1].toUpperCase()}_${code}`;
                }
                return code;
            }
            const mgstageFull = String(text).match(/\b(\d{3}[A-Z]{2,10})[-_\s](\d{2,6})\b/i);
            if (mgstageFull) {
                return Utils.normalizeCode(`${mgstageFull[1]}-${mgstageFull[2]}`);
            }
            const patterns = [
                { regex: /([A-Z]{2,15})[-_\s]([A-Z]{1,2}\d{2,10})/i, type: 'alphanum' },
                { regex: /FC2[-\s_]?(?:PPV)?[-\s_]?(\d{6,9})/i, type: 'fc2' },
                { regex: /([A-Z]{2,15})[-_\s](\d{2,10})(?:[-_](\d{1,3}))?/i, type: 'standard' },
                { regex: /(\d{6})([-_\s]?)(\d{2,3})/, type: 'numeric' },
                { regex: /\b([A-Z]{2,10})(\d{3,6})\b/i, type: 'compactStandard' },
                { regex: /([A-Z]{1,2})(\d{3,4})/i, type: 'compact' }
            ];
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
                    return Utils.normalizeCode(match[3] ? `${prefix}-${match[2]}-${match[3]}` : `${prefix}-${match[2]}`);
                } else if (type === 'fc2') {
                    return Utils.normalizeCode(`FC2-PPV-${match[1]}`);
                } else if (type === 'numeric') {
                    if (match[2] === '_') return Utils.normalizeCode(`${match[1]}_${match[3]}`);
                    return Utils.normalizeCode(`${match[1]}-${match[3]}`);
                } else if (type === 'compactStandard') {
                    const prefix = match[1].toUpperCase();
                    if (ignoreList.includes(prefix)) continue;
                    const number = match[2].replace(/^0+(?=\d{3})/, '');
                    return Utils.normalizeCode(`${prefix}-${number}`);
                } else if (type === 'compact') {
                    return Utils.normalizeCode(match[0].toUpperCase());
                }
            }
            return null;
        },
        hexToRgb(color) {
            const hex = String(color || '').trim().replace(/^#/, '');
            if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return { r: 100, g: 116, b: 139 };
            const full = hex.length === 3 ? hex.split('').map(ch => ch + ch).join('') : hex;
            return {
                r: parseInt(full.slice(0, 2), 16),
                g: parseInt(full.slice(2, 4), 16),
                b: parseInt(full.slice(4, 6), 16),
            };
        },
        mixColor(color, target = '#ffffff', weight = 0.12) {
            const from = Utils.hexToRgb(color);
            const to = Utils.hexToRgb(target);
            const mix = key => Math.round(from[key] * weight + to[key] * (1 - weight));
            return `rgb(${mix('r')}, ${mix('g')}, ${mix('b')})`;
        },
        getModernBtnStyle(color) {
            const accent = color || '#64748b';
            const bg = Utils.mixColor(accent, '#ffffff', 0.10);
            const border = Utils.mixColor(accent, '#dbe3ef', 0.28);
            const text = Utils.mixColor(accent, '#111827', 0.72);
            const hoverBg = Utils.mixColor(accent, '#ffffff', 0.16);
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
            ].join(';');
        },
        createLinkBtn(text, color, url) {
            const btn = document.createElement('a');
            btn.textContent = text;
            btn.href = url || '#';
            if (url) btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
            btn.style.cssText = Utils.getModernBtnStyle(color);
            return btn;
        },
        createJumpLinkBtn(text, color, url) {
            const btn = Utils.createLinkBtn(text, color, url);
            btn.addEventListener('click', e => {
                e.stopImmediatePropagation();
            }, true);
            return btn;
        },
        createBtn(text, color, handler, useCapture = false) {
            const btn = document.createElement('a');
            btn.textContent = text;
            btn.style.cssText = Utils.getModernBtnStyle(color);
            if (useCapture) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handler();
                }, true);
            } else {
                btn.onclick = (e) => {
                    e.preventDefault();
                    handler();
                };
            }
            return btn;
        },
        request(url) {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: 30000,
                    onload: (r) => resolve(r.responseText)
                });
            });
        },
        showToast(title, message = '', duration = 2000) {
            document.querySelector('.jav-jump-toast')?.remove();
            const toast = document.createElement('div');
            toast.className = 'jav-jump-toast';
            const icon = document.createElement('div');
            icon.className = 'jav-jump-toast-icon';
            icon.textContent = '!';
            const body = document.createElement('div');
            const titleEl = document.createElement('p');
            titleEl.className = 'jav-jump-toast-title';
            titleEl.textContent = title;
            const messageEl = document.createElement('p');
            messageEl.className = 'jav-jump-toast-message';
            messageEl.textContent = message;
            body.appendChild(titleEl);
            if (message) body.appendChild(messageEl);
            toast.appendChild(icon);
            toast.appendChild(body);
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 220);
            }, duration);
        },
        showOverlay(imgUrl, code, source = null) {
            const originalHtmlOverflow = document.documentElement.style.overflow;
            const originalBodyOverflow = document.body.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            const container = document.createElement('div');
            container.className = 'preview-overlay';
            const img = document.createElement('img');
            img.className = 'preview-img zoomed';
            img.onclick = (e) => {
                e.stopPropagation();
                img.classList.toggle('zoomed');
            };
            let currentBlobUrl = null;
            const loadImg = (url, src) => {
                if (currentBlobUrl) {
                    URL.revokeObjectURL(currentBlobUrl);
                    currentBlobUrl = null;
                }
                if (src === 'projectjav') {
                    img.src = '';
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url,
                        responseType: 'blob',
                        headers: {
                            'Referer': 'https://projectjav.com/',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        },
                        onload: r => {
                            if (r.response) {
                                currentBlobUrl = URL.createObjectURL(r.response);
                                img.src = currentBlobUrl;
                            }
                        },
                        onerror: () => { img.src = url; }
                    });
                } else {
                    img.src = url;
                }
            };
            loadImg(imgUrl, source);
            const toolbar = document.createElement('div');
            toolbar.className = 'preview-toolbar';
            toolbar.style.cssText = `position:fixed;top:20px;right:20px;display:flex;gap:12px;z-index:2147483648;`;
            const createButton = (text, icon, className, onClick) => {
                const btn = document.createElement('button');
                btn.className = `preview-btn ${className}`;
                btn.innerHTML = `${icon}${text}`;
                btn.onclick = onClick;
                return btn;
            };
            const setActiveSource = (activeSource) => {
                javfreeBtn.classList.toggle('active', activeSource === 'javfree');
                projectjavBtn.classList.toggle('active', activeSource === 'projectjav');
                javstoreBtn.classList.toggle('active', activeSource === 'javstore');
            };
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
                e.stopPropagation();
                window.open(img.src);
            });
            const downloadBtn = createButton('下载', '⬇️', 'action', (e) => {
                e.stopPropagation();
                GM_download(img.src, `${code}.jpg`);
            });
            if (source === 'javfree') javfreeBtn.classList.add('active');
            else if (source === 'projectjav') projectjavBtn.classList.add('active');
            else if (source === 'javstore') javstoreBtn.classList.add('active');
            toolbar.appendChild(javfreeBtn);
            toolbar.appendChild(projectjavBtn);
            toolbar.appendChild(javstoreBtn);
            toolbar.appendChild(newWindowBtn);
            toolbar.appendChild(downloadBtn);
            container.appendChild(img);
            const closeOverlay = () => {
                if (container.parentNode) {
                    container.remove();
                    toolbar.remove();
                    document.documentElement.style.overflow = originalHtmlOverflow;
                    document.body.style.overflow = originalBodyOverflow;
                    if (currentBlobUrl) {
                        URL.revokeObjectURL(currentBlobUrl);
                        currentBlobUrl = null;
                    }
                }
            };
            container.onclick = closeOverlay;
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeOverlay();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            document.body.appendChild(container);
            document.body.appendChild(toolbar);
        },
        showTrailerOverlay({ code, url, type = 'video', source = '预告片', qualities = null, quality = null, urls = null, fallbackResolver = null, javxySource = null }) {
            document.querySelector('.trailer-overlay')?.remove();
            const isIframe = type === 'iframe';
            const originalHtmlOverflow = document.documentElement.style.overflow;
            const originalBodyOverflow = document.body.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            const overlay = document.createElement('div');
            overlay.className = 'trailer-overlay';
            const modal = document.createElement('div');
            modal.className = 'trailer-modal';
            modal.onclick = (e) => e.stopPropagation();
            const header = document.createElement('div');
            header.className = 'trailer-header';
            const title = document.createElement('div');
            title.className = 'trailer-title';
            title.innerHTML = `<span>🎞️</span><span class="trailer-code"> ${code} </span><span class="trailer-source"> ${source} </span>`;
            const sourceBadge = title.querySelector('.trailer-source');
            const closeBtn = document.createElement('button');
            closeBtn.className = 'jav-player-close';
            closeBtn.type = 'button';
            closeBtn.textContent = '×';
            header.appendChild(title);
            header.appendChild(closeBtn);
            const screen = document.createElement('div');
            screen.className = 'trailer-screen';
            if (isIframe) screen.classList.add('is-iframe');
            const fallbackStatus = document.createElement('div');
            fallbackStatus.className = 'trailer-fallback-status';
            const volumeIndicator = document.createElement('div');
            volumeIndicator.className = 'trailer-volume-indicator';
            const playBtn = document.createElement('button');
            playBtn.className = 'trailer-control-btn';
            playBtn.type = 'button';
            playBtn.textContent = '⏸';
            playBtn.title = '播放/暂停';
            const volumeBtn = document.createElement('button');
            volumeBtn.className = 'trailer-control-btn';
            volumeBtn.type = 'button';
            volumeBtn.textContent = '🔊';
            volumeBtn.title = '静音/取消静音';
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
            volumeSlider.className = 'trailer-volume-slider';
            volumeSlider.type = 'range';
            volumeSlider.min = '0';
            volumeSlider.max = '100';
            volumeSlider.step = '1';
            volumeSlider.value = '35';
            volumeSlider.title = '音量';
            volumeRail.appendChild(volumeFill);
            volumeRail.appendChild(volumeThumb);
            volumePopover.appendChild(volumeRail);
            volumePopover.appendChild(volumeSlider);
            volumeWrap.appendChild(volumeBtn);
            volumeWrap.appendChild(volumePopover);
            const currentTimeText = document.createElement('span');
            currentTimeText.className = 'trailer-time';
            currentTimeText.textContent = '00:00';
            const durationText = document.createElement('span');
            durationText.className = 'trailer-time';
            durationText.textContent = '00:00';
            const progress = document.createElement('input');
            progress.className = 'trailer-progress';
            progress.type = 'range';
            progress.min = '0';
            progress.max = '1000';
            progress.step = '1';
            progress.value = '0';
            progress.title = '播放进度';
            const fullscreenBtn = document.createElement('button');
            fullscreenBtn.className = 'trailer-control-btn';
            fullscreenBtn.type = 'button';
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = '全屏';
            let video = null;
            let activeUrl = url;
            let activeType = type;
            let activeSource = source;
            let activeJavxySource = javxySource || source;
            let activeQuality = quality;
            let volumeIndicatorTimer = null;
            let controlsHideTimer = null;
            let fallbackStatusTimer = null;
            let playbackReadyTimer = null;
            let sourceFallbackInProgress = false;
            let overlayClosed = false;
            let playbackStarted = false;
            let qualityBar = null;
            const failedSources = new Set();
            let seekingByProgress = false;
            let fallbackUrls = Array.isArray(urls)
                ? [...new Set(urls.filter(Boolean))]
                : [url].filter(Boolean);
            let fallbackIndex = Math.max(0, fallbackUrls.indexOf(url));
            const sourceLink = { href: activeUrl };
            const playbackKey = (value = activeUrl) => `trailer_playback_${String(code || '').trim().toUpperCase()}_${String(value || '').slice(0, 160)}`;
            let playbackKeyBase = playbackKey(activeUrl);
            const readPlaybackTime = (key = playbackKeyBase) => {
                const value = Number(sessionStorage.getItem(key) || 0);
                return Number.isFinite(value) && value > 0 ? value : 0;
            };
            const writePlaybackTime = (time = video?.currentTime || 0, key = playbackKeyBase) => {
                if (!Number.isFinite(time) || time < 3) return;
                const duration = Number(video?.duration || 0);
                if (Number.isFinite(duration) && duration > 0 && duration - time < 3) {
                    sessionStorage.removeItem(key);
                    return;
                }
                sessionStorage.setItem(key, String(Math.floor(time)));
            };
            const clearPlaybackTime = (key = playbackKeyBase) => sessionStorage.removeItem(key);
            const restorePlaybackTime = (key = playbackKeyBase) => {
                if (!video || video.dataset.playbackRestored === '1') return;
                const savedTime = readPlaybackTime(key);
                if (!savedTime) return;
                const duration = Number(video.duration || 0);
                if (Number.isFinite(duration) && duration > 0 && savedTime < duration - 3) {
                    video.currentTime = savedTime;
                    video.dataset.playbackRestored = '1';
                    syncTrailerControls();
                }
            };
            const setFallbackStatus = (message, autoHide = false) => {
                clearTimeout(fallbackStatusTimer);
                fallbackStatus.textContent = message || '';
                fallbackStatus.classList.toggle('is-visible', Boolean(message));
                if (message && autoHide) {
                    fallbackStatusTimer = setTimeout(() => {
                        fallbackStatus.classList.remove('is-visible');
                    }, 1800);
                }
            };
            const markPlaybackReady = () => {
                playbackStarted = true;
                clearTimeout(playbackReadyTimer);
                setFallbackStatus('', false);
            };
            const destroyActiveHls = () => {
                if (video?._hls) {
                    try { video._hls.destroy(); } catch {}
                    video._hls = null;
                }
            };
            const normalizedSourceName = (value = activeJavxySource) => {
                const raw = String(value || '').trim().toLowerCase();
                if (raw.includes('mgstage')) return 'MGStage';
                if (raw.includes('javdb')) return 'JavDB';
                if (raw.includes('avwikidb')) return 'AVWikiDB';
                if (raw.includes('javdatabase')) return 'JAVDatabase';
                if (raw.includes('dmm')) return 'DMM';
                return String(value || activeSource || '').replace(/^Javxy\s*\|\s*/i, '').trim();
            };
            const schedulePlaybackGuard = (reason = 'timeout') => {
                clearTimeout(playbackReadyTimer);
                const timeout = /\.m3u8(?:[?#].*)?$/i.test(activeUrl) || activeType === 'hls' ? 8000 : 4000;
                playbackReadyTimer = setTimeout(() => {
                    if (overlayClosed || playbackStarted || !video || !video.isConnected) return;
                    handlePlaybackFailure(reason);
                }, timeout);
            };
            const useResultSource = (result) => {
                activeUrl = result.url;
                activeType = result.type || 'video';
                activeSource = result.source || '预告片';
                activeJavxySource = result.javxySource || result.source || activeSource;
                activeQuality = result.quality || null;
                playbackStarted = false;
                fallbackUrls = Array.isArray(result.urls) && result.urls.length
                    ? [...new Set(result.urls.filter(Boolean))]
                    : [activeUrl].filter(Boolean);
                fallbackIndex = Math.max(0, fallbackUrls.indexOf(activeUrl));
                sourceLink.href = activeUrl;
                playbackKeyBase = playbackKey(activeUrl);
                if (sourceBadge) sourceBadge.textContent = activeSource;
                if (qualityBar) qualityBar.style.display = 'none';
            };
            const handlePlaybackFailure = async (reason = 'error') => {
                if (overlayClosed || !video || sourceFallbackInProgress) return;
                if (playbackStarted && reason !== 'timeout') return;
                if (fallbackIndex < fallbackUrls.length - 1) {
                    fallbackIndex += 1;
                    activeUrl = fallbackUrls[fallbackIndex];
                    sourceLink.href = activeUrl;
                    destroyActiveHls();
                    setFallbackStatus('当前画质加载失败，正在切换备用画质...');
                    attachVideoSrc(activeUrl);
                    video.load?.();
                    video.play().catch(() => {});
                    schedulePlaybackGuard(reason);
                    return;
                }
                if (typeof fallbackResolver !== 'function') return;
                const failedSource = normalizedSourceName();
                if (!failedSource || failedSources.has(failedSource)) return;
                failedSources.add(failedSource);
                sourceFallbackInProgress = true;
                setFallbackStatus(`${failedSource} 加载失败，正在切换备用来源...`);
                destroyActiveHls();
                try {
                    const result = await fallbackResolver([...failedSources]);
                    if (!result?.url) {
                        setFallbackStatus('备用来源暂不可用', true);
                        return;
                    }
                    useResultSource(result);
                    setFallbackStatus(`已切换到 ${normalizedSourceName(result.javxySource || result.source) || '备用来源'}`, true);
                    attachVideoSrc(activeUrl);
                    video.load?.();
                    video.play().catch(() => {});
                    schedulePlaybackGuard('fallback');
                } catch (error) {
                    errorLog('TrailerResolver 播放失败回落异常', error);
                    setFallbackStatus('备用来源切换失败', true);
                } finally {
                    sourceFallbackInProgress = false;
                }
            };
            const formatTime = (seconds) => {
                if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
                const total = Math.floor(seconds);
                const h = Math.floor(total / 3600);
                const m = Math.floor((total % 3600) / 60);
                const s = total % 60;
                return h
                    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            };
            const syncTrailerControls = () => {
                if (!video) return;
                playBtn.textContent = video.paused ? '▶' : '⏸';
                volumeBtn.textContent = video.muted || video.volume <= 0 ? '🔇' : '🔊';
                volumeSlider.value = String(Math.round((video.muted ? 0 : video.volume) * 100));
                volumeRail.style.setProperty('--volume-percent', `${volumeSlider.value}%`);
                currentTimeText.textContent = formatTime(video.currentTime || 0);
                durationText.textContent = formatTime(video.duration || 0);
                if (!seekingByProgress && Number.isFinite(video.duration) && video.duration > 0) {
                    progress.value = String(Math.round(((video.currentTime || 0) / video.duration) * 1000));
                }
            };
            const showVolumeIndicator = () => {
                if (!video) return;
                volumeIndicator.textContent = `${Math.round(video.volume * 100)}%`;
                volumeIndicator.classList.add('is-visible');
                clearTimeout(volumeIndicatorTimer);
                volumeIndicatorTimer = setTimeout(() => {
                    volumeIndicator.classList.remove('is-visible');
                }, 820);
            };
            const showTrailerControls = () => {
                screen.classList.remove('is-controls-hidden');
                clearTimeout(controlsHideTimer);
                if (!video || video.paused) return;
                controlsHideTimer = setTimeout(() => {
                    if (!footer.matches(':hover') && document.activeElement !== volumeSlider) {
                        screen.classList.add('is-controls-hidden');
                    }
                }, 2000);
            };
            const scheduleHideTrailerControls = () => {
                clearTimeout(controlsHideTimer);
                if (!video || video.paused) {
                    screen.classList.remove('is-controls-hidden');
                    return;
                }
                controlsHideTimer = setTimeout(() => {
                    screen.classList.add('is-controls-hidden');
                }, 2000);
            };
            const toggleTrailerFullscreen = () => {
                if (document.fullscreenElement) document.exitFullscreen?.();
                else screen.requestFullscreen?.();
            };
            const isM3U8 = /\.m3u8(?:[?#].*)?$/i.test(url);
            const HLS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';
            const getHlsClass = () => {
                const HlsClass = window.Hls || globalThis.Hls || (typeof Hls !== 'undefined' ? Hls : null);
                return HlsClass?.isSupported?.() ? HlsClass : null;
            };
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
                                } catch (err) {
                                    errorLog('TrailerResolver:HLS hls.js 执行失败', err);
                                }
                            }
                            resolve(getHlsClass());
                        },
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
                        return;
                    }
                    const hlsScript = document.createElement('script');
                    hlsScript.src = HLS_SCRIPT_URL;
                    hlsScript.async = true;
                    hlsScript.dataset.laosijiHls = '1';
                    hlsScript.onload = () => resolve(getHlsClass());
                    hlsScript.onerror = () => loadByGm().then(resolve);
                    document.head.appendChild(hlsScript);
                }).then(HlsClass => {
                    if (!HlsClass) hlsLoadPromise = null;
                    return HlsClass;
                });
                return hlsLoadPromise;
            };
            const createHlsLoader = () => class GMHlsLoader {
                constructor(config) {
                    this.config = config;
                    this.context = null;
                    this.callbacks = null;
                    this.loader = null;
                    this.stats = this.createStats();
                }
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
                            end: 0
                        },
                        parsing: {
                            start: 0,
                            end: 0
                        },
                        buffering: {
                            start: 0,
                            first: 0,
                            end: 0
                        }
                    };
                }
                destroy() {
                    this.abort();
                }
                abort() {
                    if (this.stats) this.stats.aborted = true;
                    this.loader?.abort?.();
                    this.loader = null;
                }
                load(context, config, callbacks) {
                    this.context = context;
                    this.callbacks = callbacks;
                    const requestUrl = context.url;
                    const wantsArrayBuffer = context.responseType === 'arraybuffer'
                        || /\.(?:ts|m4s|mp4|key)(?:[?#]|$)/i.test(requestUrl);
                    const startedAt = performance.now();
                    const stats = this.stats = this.createStats();
                    stats.trequest = startedAt;
                    stats.tfirst = startedAt;
                    stats.tload = startedAt;
                    stats.loading.start = startedAt;
                    this.loader = GM_xmlhttpRequest({
                        method: 'GET',
                        url: requestUrl,
                        responseType: wantsArrayBuffer ? 'arraybuffer' : 'text',
                        timeout: config?.timeout || 20000,
                        headers: {
                            Accept: wantsArrayBuffer
                                ? '*/*'
                                : 'application/vnd.apple.mpegurl, application/x-mpegURL, */*'
                        },
                        onprogress: (event) => {
                            stats.loaded = Number(event?.loaded || stats.loaded || 0);
                            stats.total = Number(event?.total || stats.total || stats.loaded || 0);
                            if (!stats.loading.first && stats.loaded > 0) stats.loading.first = performance.now();
                        },
                        onload: (r) => {
                            const status = Number(r.status || 0);
                            const response = {
                                code: status,
                                text: r.statusText || '',
                                url: r.finalUrl || requestUrl,
                            };
                            stats.tfirst = stats.tfirst || performance.now();
                            stats.tload = performance.now();
                            stats.loading.first = stats.loading.first || stats.tload;
                            stats.loading.end = stats.tload;
                            if (status < 200 || status >= 300) {
                                callbacks.onError?.(response, context, null, stats);
                                return;
                            }
                            const data = wantsArrayBuffer ? r.response : (r.responseText || '');
                            stats.loaded = data?.byteLength || data?.length || stats.loaded || 0;
                            stats.total = stats.total || stats.loaded;
                            stats.bwEstimate = stats.loading.end > stats.loading.first
                                ? Math.round((stats.total * 8000) / (stats.loading.end - stats.loading.first))
                                : 0;
                            callbacks.onSuccess?.({ data, url: response.url }, stats, context, response);
                        },
                        onerror: () => callbacks.onError?.({ code: 0, text: 'network error', url: requestUrl }, context, null, stats),
                        ontimeout: () => {
                            stats.tload = performance.now();
                            stats.loading.end = stats.tload;
                            callbacks.onTimeout?.(stats, context, null);
                        }
                    });
                }
            };
            const attachMp4Src = (src) => {
                if (!src) return;
                video.src = src;
            };
            const attachM3u8Src = (src) => {
                if (!src) return;
                const HlsClass = getHlsClass();
                if (!HlsClass) {
                    video.src = src;
                    video.load?.();
                    return;
                }
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
                    markPlaybackReady();
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
                            return;
                        }
                    }
                    if (overlayClosed) return;
                    handlePlaybackFailure('hls');
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                video._hls = hls;
            };
            const attachVideoSrc = (src) => {
                if (!src) return;
                setFallbackStatus(`正在加载 ${normalizedSourceName() || '预告片'}...`);
                if (/\.m3u8(?:[?#].*)?$/i.test(src)) attachM3u8Src(src);
                else attachMp4Src(src);
                schedulePlaybackGuard('timeout');
            };
            const initTrailerVideo = (src) => {
                if (isM3U8 && !getHlsClass()) {
                    loadHlsLibrary().then(HlsClass => {
                        if (!video || !video.isConnected) return;
                        if (HlsClass) attachM3u8Src(src);
                        else attachMp4Src(src);
                    });
                } else {
                    attachVideoSrc(src);
                }
            };
            if (isIframe) {
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
                iframe.allowFullscreen = true;
                screen.appendChild(iframe);
            } else {
                video = document.createElement('video');
                video.controls = false;
                video.autoplay = true;
                video.loop = true;
                video.playsInline = true;
                const savedVolume = Number(GM_getValue('trailer_volume', 0.35));
                const savedMuted = GM_getValue('trailer_muted', false);
                video.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.35;
                video.muted = Boolean(savedMuted);
                initTrailerVideo(fallbackUrls[fallbackIndex] || url);
                video.preload = 'auto';
                video.addEventListener('volumechange', () => {
                    GM_setValue('trailer_volume', video.volume);
                    GM_setValue('trailer_muted', video.muted);
                    syncTrailerControls();
                });
                video.addEventListener('play', () => {
                    syncTrailerControls();
                    scheduleHideTrailerControls();
                });
                video.addEventListener('playing', markPlaybackReady);
                video.addEventListener('pause', () => {
                    syncTrailerControls();
                    screen.classList.remove('is-controls-hidden');
                    clearTimeout(controlsHideTimer);
                });
                video.addEventListener('timeupdate', () => {
                    if ((video.currentTime || 0) > 0.15) markPlaybackReady();
                    syncTrailerControls();
                    writePlaybackTime();
                });
                video.addEventListener('durationchange', () => {
                    syncTrailerControls();
                    restorePlaybackTime();
                });
                video.addEventListener('loadedmetadata', () => {
                    syncTrailerControls();
                    restorePlaybackTime();
                });
                video.addEventListener('ended', () => clearPlaybackTime());
                video.addEventListener('error', () => {
                    handlePlaybackFailure('video');
                });
                screen.appendChild(video);
                screen.appendChild(fallbackStatus);
                screen.appendChild(volumeIndicator);
                playBtn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!video) return;
                    if (video.paused) video.play().catch(() => {});
                    else video.pause();
                    syncTrailerControls();
                });
                volumeBtn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!video) return;
                    video.muted = !video.muted;
                    if (!video.muted && video.volume <= 0) video.volume = 0.35;
                    showVolumeIndicator();
                    syncTrailerControls();
                });
                volumeSlider.addEventListener('input', e => {
                    e.stopPropagation();
                    if (!video) return;
                    screen.classList.remove('is-controls-hidden');
                    clearTimeout(controlsHideTimer);
                    const nextVolume = Math.min(1, Math.max(0, Number(volumeSlider.value) / 100));
                    video.volume = nextVolume;
                    video.muted = nextVolume <= 0;
                    showVolumeIndicator();
                    syncTrailerControls();
                });
                volumeSlider.addEventListener('change', scheduleHideTrailerControls);
                video.addEventListener('click', e => {
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
                        writePlaybackTime(video.currentTime);
                    }
                    seekingByProgress = false;
                    syncTrailerControls();
                });
                fullscreenBtn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    fullscreenBtn.blur();
                    toggleTrailerFullscreen();
                });
                setTimeout(() => {
                    video.play().catch(() => {});
                    syncTrailerControls();
                    scheduleHideTrailerControls();
                }, 120);
            }
            qualityBar = document.createElement('div');
            const qualityMap = qualities && typeof qualities === 'object' ? qualities : null;
            if (!isIframe && qualityMap && Object.keys(qualityMap).length > 1) {
                const qualityOrder = ['4k', 'hhb', 'hmb', 'mhb', 'mmb', 'dm', 'sm'];
                const qualityLabels = {
                    '4k': '4K',
                    hhb: '1080P',
                    hmb: '720P',
                    mhb: '576P',
                    mmb: '432P'
                };
                const sortedKeys = Object.keys(qualityMap)
                    .filter(key => qualityMap[key])
                    .sort((a, b) => qualityOrder.indexOf(a) - qualityOrder.indexOf(b));
                qualityBar.className = 'trailer-quality-bar';
                const select = document.createElement('select');
                select.className = 'trailer-quality-select';
                const setActiveQuality = (key) => {
                    activeQuality = key;
                    activeUrl = qualityMap[key];
                    select.value = key;
                };
                sortedKeys.forEach(key => {
                    select.add(new Option(qualityLabels[key] || key, key));
                });
                select.addEventListener('change', async () => {
                    const key = select.value;
                    if (!video || !qualityMap[key] || activeQuality === key) return;
                    const currentTime = video.currentTime || 0;
                    const shouldPlay = !video.paused;
                    writePlaybackTime(currentTime);
                    destroyActiveHls();
                    playbackStarted = false;
                    video.dataset.playbackRestored = '1';
                    fallbackIndex = Math.max(0, fallbackUrls.indexOf(qualityMap[key]));
                    video.currentTime = currentTime;
                    setActiveQuality(key);
                    sourceLink.href = activeUrl;
                    attachVideoSrc(activeUrl);
                    video.load();
                    video.currentTime = currentTime;
                    if (shouldPlay) {
                        await video.play().catch(() => {});
                    }
                });
                qualityBar.appendChild(select);
                setActiveQuality(activeQuality && qualityMap[activeQuality] ? activeQuality : sortedKeys[0]);
            }
            const footer = document.createElement('div');
            footer.className = 'trailer-footer';
            const footerLeft = document.createElement('div');
            footerLeft.className = 'trailer-control-left';
            if (!isIframe) {
                footerLeft.appendChild(playBtn);
                footerLeft.appendChild(volumeWrap);
                footerLeft.appendChild(currentTimeText);
                footerLeft.appendChild(progress);
                footerLeft.appendChild(durationText);
            }
            const footerRight = document.createElement('div');
            footerRight.className = 'trailer-control-right';
            footerRight.appendChild(qualityBar);
            footer.appendChild(footerLeft);
            footerRight.appendChild(fullscreenBtn);
            footer.appendChild(footerRight);
            modal.appendChild(screen);
            screen.appendChild(header);
            if (!isIframe) screen.appendChild(footer);
            overlay.appendChild(modal);
            if (!isIframe) {
                screen.addEventListener('mousemove', showTrailerControls);
                screen.addEventListener('mouseenter', showTrailerControls);
                screen.addEventListener('mouseleave', () => {
                    if (video && !video.paused) screen.classList.add('is-controls-hidden');
                });
                footer.addEventListener('mouseenter', () => {
                    screen.classList.remove('is-controls-hidden');
                    clearTimeout(controlsHideTimer);
                });
                footer.addEventListener('mouseleave', scheduleHideTrailerControls);
            }
            const closeOverlay = (event = null) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation?.();
                }
                overlayClosed = true;
                const video = overlay.querySelector('video');
                if (video) {
                    writePlaybackTime(video.currentTime || 0);
                    if (video._hls) {
                        try { video._hls.destroy(); } catch {}
                        video._hls = null;
                    }
                    video.pause();
                    video.removeAttribute('src');
                    video.load();
                }
                overlay.remove();
                document.documentElement.style.overflow = originalHtmlOverflow;
                document.body.style.overflow = originalBodyOverflow;
                window.removeEventListener('pointerdown', overlayCloseGuard, true);
                window.removeEventListener('mousedown', overlayCloseGuard, true);
                window.removeEventListener('click', overlayCloseGuard, true);
                document.removeEventListener('keydown', escHandler, true);
                clearTimeout(volumeIndicatorTimer);
                clearTimeout(controlsHideTimer);
                clearTimeout(fallbackStatusTimer);
                clearTimeout(playbackReadyTimer);
            };
            const overlayCloseGuard = (event) => {
                if (!overlay.contains(event.target)) return;
                const shouldClose = event.target === overlay || event.target.closest('.jav-player-close');
                if (!shouldClose) return;
                if (event.type === 'click') {
                    closeOverlay(event);
                    return;
                }
                event.stopPropagation();
                event.stopImmediatePropagation?.();
            };
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeOverlay();
                    return;
                }
                if (isIframe) return;
                const key = e.key;
                const shouldCapture = [' ', 'Spacebar', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key);
                if (shouldCapture) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation?.();
                }
                if (key === 'Enter') {
                    toggleTrailerFullscreen();
                    showTrailerControls();
                    return;
                }
                if (!video) return;
                if (key === ' ' || key === 'Spacebar') {
                    if (video.paused) video.play().catch(() => {});
                    else video.pause();
                    syncTrailerControls();
                    showTrailerControls();
                } else if (key === 'ArrowLeft') {
                    video.currentTime = Math.max(0, (video.currentTime || 0) - 2);
                } else if (key === 'ArrowRight') {
                    const nextTime = (video.currentTime || 0) + 2;
                    video.currentTime = Number.isFinite(video.duration)
                        ? Math.min(video.duration, nextTime)
                        : nextTime;
                } else if (key === 'ArrowUp' || key === 'ArrowDown') {
                    const delta = key === 'ArrowUp' ? 0.05 : -0.05;
                    video.volume = Math.min(1, Math.max(0, Math.round((video.volume + delta) * 100) / 100));
                    if (video.volume > 0) video.muted = false;
                    showVolumeIndicator();
                }
            };
            closeBtn.addEventListener('click', closeOverlay, true);
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeOverlay(e);
            }, true);
            window.addEventListener('pointerdown', overlayCloseGuard, true);
            window.addEventListener('mousedown', overlayCloseGuard, true);
            window.addEventListener('click', overlayCloseGuard, true);
            document.addEventListener('keydown', escHandler, true);
            document.body.appendChild(overlay);
        },
        getJavBusUrl(code) {
            const codeLower = code.toLowerCase();
            const isUncensored =
                /^\d{6}[-_\s]\d{3}$/.test(code) ||
                codeLower.startsWith('heyzo') ||
                codeLower.startsWith('carib') ||
                codeLower.startsWith('1pondo') ||
                codeLower.startsWith('tokyo') ||
                codeLower.startsWith('cat') ||
                codeLower.startsWith('paco') ||
                codeLower.startsWith('10mu') ||
                codeLower.startsWith('muram') ||
                codeLower.startsWith('gach') ||
                codeLower.startsWith('real') ||
                codeLower.startsWith('juku') ||
                codeLower.startsWith('aka') ||
                codeLower.startsWith('s-cute') ||
                codeLower.startsWith('n_') ||
                /^n\d{4}$/.test(codeLower) ||
                codeLower.startsWith('k_') ||
                /^k\d{4}$/.test(codeLower);
            if (isUncensored) {
                return `https://www.javbus.com/uncensored/search/${encodeURIComponent(code)}&type=1`;
            }
            return `https://www.javbus.com/search/${encodeURIComponent(code)}&type=&parent=ce`;
        }
    };
    const Thumbnail = {
        sources: ['javfree', 'projectjav', 'javstore'],
        cacheKey(code) {
            return `thumb_cache_v3_${code}`;
        },
        lookupCode(code) {
            const text = String(code || '').trim();
            const fc2 = text.match(/^(?:FC2[-_\s]?(?:PPV[-_\s]?)?)?(\d{6,9})$/i);
            return fc2 ? fc2[1] : text;
        },
        sourceOrder() {
            const savedOrder = Settings.getSourceOrder();
            const ordered = Array.isArray(savedOrder) ? savedOrder : [];
            const seen = new Set();
            return [...ordered, ...this.sources].filter(src => {
                if (seen.has(src) || typeof this[src] !== 'function') return false;
                seen.add(src);
                return true;
            });
        },
        async fetchFromSource(source, code) {
            try {
                return await this[source](this.lookupCode(code));
            } catch (e) {
                debugLog(`Thumbnail[${source}] 异常:`, e.message);
                return null;
            }
        },
        normalizeForCompare(text) {
            return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        },
        isCodeMatched(text, code) {
            const normalizedText = this.normalizeForCompare(text);
            const normalizedCode = this.normalizeForCompare(code);
            return !!normalizedCode && normalizedText.includes(normalizedCode);
        },
        isDetailMatched(doc, url, code) {
            const title = doc?.querySelector('title')?.textContent || '';
            const headings = [...(doc?.querySelectorAll('h1,h2,h3,.entry-title,.movie-title,.post-title') || [])]
                .map(el => el.textContent || '')
                .join(' ');
            const bodyText = (doc?.body?.textContent || '').slice(0, 5000);
            return this.isCodeMatched([url, title, headings, bodyText].join(' '), code);
        },
        normalizePreviewUrl(url, baseUrl = '') {
            if (!url) return '';
            const absolute = /^https?:\/\//i.test(url)
                ? url
                : (baseUrl ? new URL(url, baseUrl).href : url);
            return absolute.replace(/^http:/, 'https:');
        },
        isJavfreePreviewImage(url, code) {
            const cleanUrl = String(url || '').split('?')[0];
            const lookupCode = this.lookupCode(code);
            const isFc2Numeric = /^\d{6,9}$/.test(lookupCode);
            const fc2ShotPattern = isFc2Numeric
                ? new RegExp(`${lookupCode}_\\d+\\.(?:jpe?g|png|webp)$`, 'i')
                : null;
            return this.isCodeMatched(cleanUrl, code) &&
                (
                    /-(?:1080p|demosaic)\.(?:jpe?g|png|webp)$/i.test(cleanUrl) ||
                    (isFc2Numeric && fc2ShotPattern.test(cleanUrl))
                );
        },
        selectJavfreePreviewUrl(doc, detailUrl, code) {
            const urls = [...doc.querySelectorAll('p > img[src]')]
                .map(img => this.normalizePreviewUrl(img.getAttribute('src') || img.src || '', detailUrl))
                .filter(url => this.isJavfreePreviewImage(url, code));
            return urls.find(url => /-1080p\./i.test(url)) ||
                urls.find(url => /-demosaic\./i.test(url)) ||
                urls.find(url => /_1\.(?:jpe?g|png|webp)$/i.test(url)) ||
                '';
        },
        async javfree(code) {
            code = this.lookupCode(code);
            const cacheKey = this.cacheKey(code);
            const cacheEnabled = Settings.getPreviewCacheEnabled();
            if (cacheEnabled) {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) return cached;
            }
            try {
                const html = await Utils.request(`https://javfree.me/search/${code}`);
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const link = [...doc.querySelectorAll('.entry-title>a')]
                    .find(a => this.isCodeMatched([a.href, a.textContent].join(' '), code))?.href;
                if (!link) return null;
                const dHtml = await Utils.request(link);
                const dDoc = new DOMParser().parseFromString(dHtml, 'text/html');
                if (!this.isDetailMatched(dDoc, link, code)) return null;
                const url = this.selectJavfreePreviewUrl(dDoc, link, code);
                if (url && cacheEnabled) {
                    sessionStorage.setItem(cacheKey, url);
                    return url;
                }
                if (url) return url;
                return null;
            } catch {
                return null;
            }
        },
        async javstore(code) {
            code = this.lookupCode(code);
            try {
                const normalizedCode = code.replace(/^fc2-?/i, '').replace(/-/g, '').toLowerCase();
                debugLog(`javstore: searching for code=${code}, normalized=${normalizedCode}`);
                const searchUrl = `https://javstore.net/search?q=${encodeURIComponent(code)}`;
                const searchHtml = await Utils.request(searchUrl);
                const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');
                const candidateLinks = searchDoc.querySelectorAll('a[href*="/"]');
                const detailUrls = [];
                for (const link of candidateLinks) {
                    const href = link.getAttribute('href');
                    if (!href) continue;
                    if (href.startsWith('http') && !href.includes('javstore.net')) continue;
                    const urlObj = new URL(href, searchUrl);
                    if (!/javstore\.net$/i.test(urlObj.hostname)) continue;
                    if (/^\/search(?:[/?#]|$)/i.test(urlObj.pathname)) continue;
                    const fullUrl = urlObj.href;
                    const pathLastPart = decodeURIComponent(urlObj.pathname.split('/').pop() || '');
                    const normalizedPath = pathLastPart.toLowerCase().replace(/-/g, '');
                    const looksLikeDetail = /\.html$/i.test(urlObj.pathname) || /^\/\d+[-/]/.test(urlObj.pathname);
                    if (looksLikeDetail && normalizedPath.includes(normalizedCode) && !detailUrls.includes(fullUrl)) {
                        detailUrls.push(fullUrl);
                        debugLog(`javstore: 候选链接 [${detailUrls.length}]: ${fullUrl}`);
                    }
                }
                if (detailUrls.length === 0) {
                    debugLog('javstore: 未找到匹配的详情页');
                    return null;
                }
                for (const detailUrl of detailUrls) {
                    debugLog(`javstore: 尝试详情页: ${detailUrl}`);
                    const imgUrl = await this._extractImgFromDetail(detailUrl, code);
                    if (imgUrl) {
                        debugLog(`javstore: 找到预览图: ${imgUrl}`);
                        return imgUrl;
                    }
                    debugLog(`javstore: 该页无预览图，尝试下一个`);
                }
                debugLog('javstore: 所有候选页均无预览图');
                return null;
            } catch (e) {
                debugLog('javstore 获取失败', e);
                return null;
            }
        },
        async _extractImgFromDetail(detailUrl, code) {
            try {
                const detailHtml = await Utils.request(detailUrl);
                const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
                if (!this.isDetailMatched(detailDoc, detailUrl, code)) {
                    debugLog('javstore: 详情页番号不匹配，跳过', detailUrl);
                    return null;
                }
                for (const link of detailDoc.querySelectorAll('a')) {
                    if (link.textContent.includes('CLICK HERE')) {
                        const imgUrl = link.href || link.getAttribute('href') || '';
                        if (imgUrl) return this.normalizePreviewUrl(imgUrl, detailUrl);
                    }
                }
                const img = detailDoc.querySelector('img[src*="_s.jpg"]');
                if (img) {
                    let src = img.getAttribute('src') || '';
                    if (!src.startsWith('http')) src = new URL(src, detailUrl).href;
                    return this.normalizePreviewUrl(src.replace(/_s\.jpg$/, '_l.jpg'), detailUrl);
                }
                return null;
            } catch (e) {
                debugLog('javstore: 详情页请求失败', detailUrl, e.message);
                return null;
            }
        },
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
                            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                        },
                        onload: r => {
                            debugLog(`[projectjav] ${url} → HTTP ${r.status}, final=${r.finalUrl || url}, 长度 ${r.responseText?.length}`);
                            if (r.status >= 200 && r.status < 400) resolve(r);
                            else reject(new Error(`HTTP ${r.status}`));
                        },
                        onerror: (e) => { debugLog('[projectjav] 网络错误', e); reject(new Error('请求失败')); },
                        ontimeout: () => { debugLog('[projectjav] 请求超时'); reject(new Error('请求超时')); }
                    });
                });
                const searchUrl = `https://projectjav.com/?searchTerm=${encodeURIComponent(code)}`;
                debugLog('[projectjav] 搜索页:', searchUrl);
                const searchRes = await request(searchUrl);
                const searchHtml = searchRes.responseText || '';
                const finalSearchUrl = searchRes.finalUrl || searchUrl;
                const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');
                let detailUrl = /\/movie\//i.test(new URL(finalSearchUrl).pathname)
                    ? finalSearchUrl
                    : '';
                if (!detailUrl) {
                    const allMovieLinks = [...searchDoc.querySelectorAll('a[href*="/movie/"]')];
                    debugLog(`[projectjav] /movie/ 链接数: ${allMovieLinks.length}`);
                    allMovieLinks.slice(0, 5).forEach(a => debugLog('  ', a.getAttribute('href')));
                    const firstLink = allMovieLinks[0]?.getAttribute('href') || '';
                    if (!firstLink) {
                        debugLog('[projectjav] 无结果，页面标题:', searchDoc.title);
                        debugLog('[projectjav] 页面前800字符:', searchHtml.slice(0, 800));
                        return null;
                    }
                    detailUrl = firstLink.startsWith('http') ? firstLink : `https://projectjav.com${firstLink}`;
                }
                debugLog('[projectjav] 详情页:', detailUrl);
                const detailRes = finalSearchUrl === detailUrl ? searchRes : await request(detailUrl);
                const detailHtml = detailRes.responseText || '';
                const finalDetailUrl = detailRes.finalUrl || detailUrl;
                const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
                const screenshotLink = [...detailDoc.querySelectorAll('.col-md-12.thumbnail a[data-featherlight="image"], .thumbnail a[data-featherlight="image"]')]
                    .find(a => this.isCodeMatched([
                        a.outerHTML,
                        a.closest('.thumbnail')?.outerHTML,
                        finalDetailUrl
                    ].join(' '), code));
                debugLog('[projectjav] screenshotLink matched:', !!screenshotLink, 'href:', screenshotLink?.getAttribute('href'));
                if (screenshotLink) {
                    const thumbImg = screenshotLink.querySelector('img');
                    const href = screenshotLink.getAttribute('href') || '';
                    if (href) return this.normalizePreviewUrl(href, finalDetailUrl);
                    if (thumbImg) {
                        const src = (thumbImg.getAttribute('src') || '').replace(/\?.*$/, '');
                        if (src) return this.normalizePreviewUrl(src, finalDetailUrl);
                    }
                }
                debugLog('[projectjav] 详情页未找到图片，页面标题:', detailDoc.title);
                return null;
            } catch (e) {
                debugLog('[projectjav] 异常:', e.message);
                return null;
            }
        },
        async get(code) {
            const cacheEnabled = Settings.getPreviewCacheEnabled();
            const cacheKey = this.cacheKey(code);
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
            debugLog('预览图最终结果:', url ? `有图 (${source})` : '无图');
            if (url && cacheEnabled) {
                sessionStorage.setItem(cacheKey, url);
            }
            return { url, source };
        },
        async show(code) {
            const result = await this.get(code);
            if (result.url) {
                Utils.showOverlay(result.url, code, result.source);
            } else {
                alert('未找到预览图');
            }
        }
    };
    const ListPreview = (() => {
        let magnetOverlay = null;
        const ACTIONS = [
            { key: 'magnet', name: 'magnet', title: '磁力', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="tool-svg" viewBox="0 0 1000 1000"><path d="M420 80c-160 18-300 88-410 200v210h230V300c55-45 120-72 200-80h140v-140H420zM760 80v140h140V80H760zM10 510v210c110 112 250 182 410 200h160V780H440c-80-8-145-35-200-80V510H10zM760 780v140h140V780H760z"/></svg>' },
            { key: 'trailer', name: 'trailer', title: '预告片', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="tool-svg" viewBox="0 0 16 16"><path d="M2 2.8A1.8 1.8 0 0 1 3.8 1h8.4A1.8 1.8 0 0 1 14 2.8v10.4a1.8 1.8 0 0 1-1.8 1.8H3.8A1.8 1.8 0 0 1 2 13.2V2.8zm1 1.7h10V2.8a.8.8 0 0 0-.8-.8H3.8a.8.8 0 0 0-.8.8v1.7zm10 1H3v5h10v-5zm0 6H3v1.7c0 .44.36.8.8.8h8.4c.44 0 .8-.36.8-.8v-1.7zM6.4 6.45a.45.45 0 0 1 .47.02l2.35 1.35a.45.45 0 0 1 0 .78L6.87 9.95A.45.45 0 0 1 6.2 9.56V6.84c0-.17.08-.32.2-.39z"/></svg>' },
            { key: 'preview', name: 'picture', title: '预览图', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="tool-svg" viewBox="0 0 16 16"><path d="M6 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path><path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v6.5l-3.78-1.95a.5.5 0 0 0-.57.1l-3.71 3.7-2.66-1.77a.5.5 0 0 0-.63.06L1 12V3a1 1 0 0 1 1-1h12z"></path></svg>' },
        ];
        function enabled() {
            return GM_getValue('list_preview_quick_enabled', true);
        }
        function ensureStyle() {
            injectStyle('jav-list-preview-style', `.jav-card-quick-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;flex:0 0 auto!important;margin-left:auto!important}.jav-card-quick-btn{width:26px;height:26px;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 24px!important;border:0!important;border-radius:4px!important;background:transparent!important;color:#64748b!important;box-shadow:none!important;fill:currentColor!important;line-height:1!important;text-decoration:none!important;cursor:pointer!important;user-select:none!important;opacity:.74!important;transition:transform .14s ease,color .14s ease,opacity .14s ease!important}.jav-card-quick-btn:hover{transform:translateY(-1px)!important;background:transparent!important;color:#2563eb!important;opacity:1!important}.jav-card-quick-btn:active{transform:scale(.96)!important}.jav-card-quick-btn:focus-visible{outline:2px solid rgba(37,99,235,.35)!important;outline-offset:2px!important}.jav-card-quick-btn .tool-svg{width:20px!important;height:20px!important;display:block!important;fill:currentColor!important}.javbus-card-title .item-tag,.javdb-card-tags,.javlib-card-footer{align-items:center!important}.javbus-card-title .item-tag,.javdb-card-tags{display:flex!important}.javlib-card-footer .jav-card-quick-actions{margin-left:auto!important}html.jav-card-portrait-mode .javdb-card-meta{display:flex!important;align-items:center!important;gap:6px!important}.jav-card-magnet-overlay{position:fixed;inset:0;z-index:10000035;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.58);backdrop-filter:blur(5px)}.jav-card-magnet-panel{width:min(760px,94vw);max-height:86vh;display:flex;flex-direction:column;overflow:hidden;border-radius:10px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.38)}.jav-card-magnet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #e5e7eb}.jav-card-magnet-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#111827;font-size:15px;font-weight:850}.jav-card-magnet-close{width:30px;height:30px;border:0;border-radius:7px;background:#f1f5f9;color:#334155;font-size:22px;line-height:1;cursor:pointer}.jav-card-magnet-body{padding:12px;overflow:auto}.jav-card-magnet-body .jav-nong-wrapper{width:100%!important;display:block!important;box-sizing:border-box!important}`);
        }
        function isListPage() {
            return !SiteManager.isDetailPage();
        }
        function cardSite(card) {
            if (card?.classList?.contains('javbus-grid-card')) return 'javbus';
            if (card?.classList?.contains('javdb-grid-card')) return 'javdb';
            if (card?.classList?.contains('javlib-grid-card')) return 'javlib';
            return CardColumns.detectCurrentSite();
        }
        function targetSlot(card) {
            const site = cardSite(card);
            if (site === 'javbus') return card.querySelector('.item-tag');
            if (site === 'javdb') {
                return PortraitCards.effective('javdb')
                    ? card.querySelector('.javdb-card-meta, .meta')
                    : card.querySelector('.javdb-card-tags, .tags.has-addons, .tags');
            }
            if (site === 'javlib') {
                const title = card.querySelector('.javlib-card-title, .title');
                let footer = title?.querySelector('.javlib-card-footer');
                if (!footer && title) {
                    footer = document.createElement('span');
                    footer.className = 'javlib-card-footer';
                    title.appendChild(footer);
                }
                return footer;
            }
            return null;
        }
        function closeMagnetPopup() {
            magnetOverlay?.remove();
            magnetOverlay = null;
        }
        function openMagnetPopup(code) {
            if (!code) return;
            closeMagnetPopup();
            ensureStyle();
            const overlay = document.createElement('div');
            overlay.className = 'jav-card-magnet-overlay';
            overlay.innerHTML = `<div class="jav-card-magnet-panel" role="dialog" aria-modal="true"><div class="jav-card-magnet-head"><div class="jav-card-magnet-title">磁力 ${code}</div><button class="jav-card-magnet-close" type="button">×</button></div><div class="jav-card-magnet-body"></div></div>`;
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeMagnetPopup();
            });
            overlay.querySelector('.jav-card-magnet-close')?.addEventListener('click', closeMagnetPopup);
            overlay.querySelector('.jav-card-magnet-body')?.appendChild(Magnet.createMagnetWidget(code));
            document.body.appendChild(overlay);
            magnetOverlay = overlay;
        }
        async function runAction(action, code, btn) {
            if (!code || btn.dataset.loading === '1') return;
            if (action === 'magnet') {
                openMagnetPopup(code);
                return;
            }
            btn.dataset.loading = '1';
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '.72';
            try {
                if (action === 'trailer') await Trailer.show(code);
                else await Thumbnail.show(code);
            } finally {
                delete btn.dataset.loading;
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
            }
        }
        function createButton(meta, code, card) {
            const btn = document.createElement('span');
            btn.className = `tool-span jav-card-quick-btn jav-card-quick-${meta.key}`;
            btn.setAttribute('name', meta.name);
            btn.setAttribute('avid', code);
            btn.dataset.action = meta.key;
            btn.dataset.code = code;
            btn.title = `${meta.title} ${code}`;
            btn.innerHTML = meta.svg;
            btn.setAttribute('role', 'button');
            btn.tabIndex = 0;
            const handler = e => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                runAction(meta.key, btn.dataset.code || SiteManager.getCardCode(card), btn);
            };
            btn.addEventListener('click', handler, true);
            btn.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                handler(e);
            }, true);
            return btn;
        }
        function attachToCard(card) {
            if (!card) return;
            card.querySelectorAll('.jav-list-preview-btn').forEach(el => el.remove());
            const existing = card.querySelector('.jav-card-quick-actions');
            if (!enabled()) {
                existing?.remove();
                return;
            }
            const code = SiteManager.getCardCode(card);
            const slot = targetSlot(card);
            if (!code || !slot) {
                existing?.remove();
                return;
            }
            if (existing) {
                existing.dataset.code = code;
                existing.querySelectorAll('.jav-card-quick-btn').forEach(btn => {
                    const meta = ACTIONS.find(item => item.key === btn.dataset.action);
                    btn.setAttribute('avid', code);
                    btn.dataset.code = code;
                    if (meta) btn.title = `${meta.title} ${code}`;
                });
                if (existing.parentNode !== slot) slot.appendChild(existing);
                return;
            }
            const actions = document.createElement('span');
            actions.className = 'toolbar-b jav-card-quick-actions';
            actions.dataset.code = code;
            ACTIONS.forEach(meta => actions.appendChild(createButton(meta, code, card)));
            slot.appendChild(actions);
        }
        function removeAll() {
            document.querySelectorAll('.jav-card-quick-actions, .jav-list-preview-btn').forEach(el => el.remove());
            closeMagnetPopup();
        }
        function sync() {
            if (!isListPage()) {
                removeAll();
                return;
            }
            ensureStyle();
            if (!enabled()) {
                removeAll();
                return;
            }
            SiteManager.getListCards().forEach(attachToCard);
        }
        return { sync, removeAll, attach: attachToCard, closeMagnetPopup };
    })();
    Core.expose('__LAOSIJI_LIST_PREVIEW__', ListPreview);
    const CoverHoverPreview = (() => {
        let active = false;
        let timer = null;
        let popup = null;
        let lastEvent = null;
        const titleStore = new Map();
        function enabled() {
            return !!CFG.coverHoverPreview && !SiteManager.isDetailPage();
        }
        function ensureStyle() {
            injectStyle('jav-cover-hover-preview-style', `.jav-cover-hover-preview{position:fixed;z-index:2147483000;pointer-events:none;padding:4px;border-radius:6px;background:rgba(15,23,42,.84);box-shadow:0 18px 42px rgba(15,23,42,.34);opacity:0;transform:translateY(4px);transition:opacity .12s ease,transform .12s ease}.jav-cover-hover-preview.is-visible{opacity:1;transform:translateY(0)}.jav-cover-hover-preview img{display:block;width:auto;border-radius:4px;object-fit:contain;background:#0f172a}`);
        }
        function clearTimer() {
            if (!timer) return;
            clearTimeout(timer);
            timer = null;
        }
        function hide() {
            clearTimer();
            popup?.remove();
            popup = null;
            lastEvent = null;
            restoreTitles();
        }
        function coverFromEvent(target) {
            const cover = target?.closest?.('.jav-card-cover');
            if (!cover || !cover.closest?.('.jav-card')) return null;
            return cover;
        }
        function imageSrc(cover) {
            const img = cover?.querySelector?.('img[src]');
            if (!img) return '';
            return img.dataset.laosijiLandscapeSrc ||
                img.dataset.laosijiCoverSrc ||
                img.currentSrc ||
                img.src ||
                '';
        }
        function titleTargets(cover) {
            return [
                cover,
                cover?.querySelector?.('img[title]'),
                cover?.closest?.('a[title]'),
                cover?.closest?.('.jav-card')?.querySelector?.('a[title]'),
            ].filter(Boolean);
        }
        function suppressTitles(cover) {
            titleTargets(cover).forEach(el => {
                if (!el.hasAttribute?.('title') || titleStore.has(el)) return;
                titleStore.set(el, el.getAttribute('title') || '');
                el.removeAttribute('title');
            });
        }
        function restoreTitles() {
            titleStore.forEach((title, el) => {
                el.setAttribute('title', title);
            });
            titleStore.clear();
        }
        function position(box, event = lastEvent) {
            if (!box || !event) return;
            const gap = 16;
            const rect = box.getBoundingClientRect();
            let left = event.clientX + gap;
            let top = event.clientY + gap;
            if (left + rect.width > window.innerWidth - 8) left = event.clientX - rect.width - gap;
            if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8;
            if (top < 8) top = 8;
            if (left < 8) left = 8;
            box.style.left = `${Math.round(left)}px`;
            box.style.top = `${Math.round(top)}px`;
        }
        function show(src, event) {
            if (!src || !active) return;
            ensureStyle();
            popup?.remove();
            const box = document.createElement('div');
            const img = document.createElement('img');
            box.className = 'jav-cover-hover-preview';
            img.decoding = 'async';
            img.loading = 'eager';
            img.src = src;
            img.addEventListener('load', () => {
                position(box, event);
                requestAnimationFrame(() => box.classList.add('is-visible'));
            }, { once: true });
            img.addEventListener('error', hide, { once: true });
            box.appendChild(img);
            document.body.appendChild(box);
            popup = box;
            position(box, event);
        }
        function onOver(event) {
            if (!enabled()) return;
            const cover = coverFromEvent(event.target);
            if (!cover) return;
            const src = imageSrc(cover);
            if (!src) return;
            suppressTitles(cover);
            lastEvent = event;
            clearTimer();
            timer = setTimeout(() => show(src, lastEvent), 500);
        }
        function onMove(event) {
            if (!popup && !timer) return;
            lastEvent = event;
            if (popup) position(popup, event);
        }
        function onOut(event) {
            const cover = coverFromEvent(event.target);
            if (!cover) return;
            const next = event.relatedTarget;
            if (next && cover.contains(next)) return;
            hide();
        }
        function sync() {
            const shouldEnable = enabled();
            if (shouldEnable === active) {
                if (!shouldEnable) hide();
                return;
            }
            active = shouldEnable;
            if (active) {
                document.addEventListener('mouseover', onOver, true);
                document.addEventListener('mousemove', onMove, true);
                document.addEventListener('mouseout', onOut, true);
            } else {
                document.removeEventListener('mouseover', onOver, true);
                document.removeEventListener('mousemove', onMove, true);
                document.removeEventListener('mouseout', onOut, true);
                hide();
            }
        }
        return { sync, hide };
    })();
    Core.expose('__LAOSIJI_COVER_HOVER_PREVIEW__', CoverHoverPreview);
    const DetailPreviewInline = (() => {
        let lastToken = 0;
        let state = { code: '', status: '' };
        function enabled() {
            return GM_getValue('detail_preview_inline_enabled', true);
        }
        function ensureStyle() {
            injectStyle('jav-detail-preview-inline-style', `.jav-nong-slot.has-detail-preview-inline{display:flex!important;align-items:flex-start!important;gap:12px!important;overflow:visible!important}.jav-detail-preview-standalone{display:flex!important;align-items:flex-start!important;gap:12px!important;min-width:0!important;align-self:flex-start!important;overflow:visible!important}.row.movie>.jav-detail-preview-standalone{flex:0 0 180px!important}.jav-flex-container>.jav-detail-preview-standalone{flex:0 0 180px!important}#video_jacket_info tr>.jav-detail-preview-standalone{flex:0 0 180px!important;min-width:160px!important;vertical-align:top!important}.javlib-nong-slot.has-detail-preview-inline{width:100%!important}.jav-nong-slot.has-detail-preview-inline .jav-nong-wrapper{flex:1 1 auto!important;min-width:0!important}.javlib-nong-slot.has-detail-preview-inline>div:not(.jav-detail-preview-wrap){flex:1 1 0!important;min-width:0!important;display:block!important}.javlib-nong-slot.has-detail-preview-inline>.jav-detail-preview-wrap{flex:0 0 180px!important;width:180px!important;max-width:180px!important;min-width:160px!important;height:480px!important;max-height:480px!important;overflow:hidden!important;display:block!important}.jav-detail-preview-wrap{flex:0 0 180px;width:180px;max-width:180px;min-width:150px;align-self:flex-start;position:relative;box-sizing:border-box;overflow:hidden}.jav-detail-preview-inline{display:block;width:100%;height:auto;max-width:100%;max-height:480px;object-fit:contain;border-radius:6px;cursor:zoom-in}.javlib-nong-slot.has-detail-preview-inline .jav-detail-preview-inline{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important}.jav-detail-preview-loading{position:absolute;inset:0;display:grid;place-items:center;color:#475569;font-size:12px;font-weight:700;white-space:nowrap;pointer-events:none}@media (max-width:900px){.jav-nong-slot.has-detail-preview-inline{flex-wrap:wrap!important}.jav-detail-preview-standalone{flex-basis:100%!important}.jav-detail-preview-wrap{flex-basis:100%;width:100%;max-width:100%}.jav-detail-preview-inline{max-width:100%;max-height:480px;margin:0 auto}.javlib-nong-slot.has-detail-preview-inline>.jav-detail-preview-wrap{flex-basis:100%!important;width:100%!important;max-width:100%!important;height:480px!important;max-height:480px!important}}`);
        }
        function remove() {
            SiteManager.clearDetailPreviewInline();
        }
        async function sync() {
            if (!enabled() || !SiteManager.isDetailPage()) {
                lastToken++;
                remove();
                state = { code: '', status: '' };
                return;
            }
            ensureStyle();
            const code = SiteManager.getDetailCode();
            if (!code) {
                lastToken++;
                remove();
                state = { code: '', status: '' };
                return;
            }
            if (state.code === code && state.status === 'missing') return;
            const existingWrap = document.querySelector('.jav-detail-preview-wrap');
            if (existingWrap?.dataset.code === code && existingWrap.dataset.state === 'loaded') return;
            if (existingWrap?.dataset.code === code && existingWrap.dataset.state === 'loading') return;
            const token = ++lastToken;
            state = { code, status: 'loading' };
            if (existingWrap && existingWrap.dataset.code !== code) existingWrap.remove();
            const target = SiteManager.getDetailPreviewTarget();
            if (!target) {
                return;
            }
            if (!target.standalone) target.slot.classList.add('has-detail-preview-inline');
            let wrap = document.querySelector('.jav-detail-preview-wrap');
            if (!wrap) {
                wrap = document.createElement('div');
                wrap.className = 'jav-detail-preview-wrap';
                wrap.dataset.code = code;
                wrap.dataset.state = 'loading';
                const loading = document.createElement('span');
                loading.className = 'jav-detail-preview-loading';
                loading.textContent = '预览图加载中...';
                wrap.appendChild(loading);
                if (target.anchor?.parentElement === target.slot) {
                    target.slot.insertBefore(wrap, target.anchor);
                } else {
                    target.slot.insertBefore(wrap, target.slot.firstChild);
                }
            } else {
                wrap.dataset.code = code;
                wrap.dataset.state = 'loading';
                wrap.innerHTML = '<span class="jav-detail-preview-loading">预览图加载中...</span>';
            }
            const result = await Thumbnail.get(code);
            if (token !== lastToken || !wrap.isConnected) return;
            if (!result?.url) {
                wrap.remove();
                if (!target.standalone) target.slot.classList.remove('has-detail-preview-inline');
                state = { code, status: 'missing' };
                return;
            }
            state = { code, status: 'loaded' };
            wrap.dataset.state = 'loaded';
            wrap.innerHTML = '';
            const img = document.createElement('img');
            img.className = 'jav-detail-preview-inline';
            img.dataset.code = code;
            img.src = result.url;
            img.alt = code;
            img.loading = 'lazy';
            img.title = '点击查看预览图';
            img.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                Utils.showOverlay(result.url, code, result.source);
            });
            wrap.appendChild(img);
        }
        return { sync, remove };
    })();
    Core.expose('__LAOSIJI_DETAIL_PREVIEW_INLINE__', DetailPreviewInline);
    const Trailer = {
        normalize(code) {
            return Utils.normalizeCode(code);
        },
        cacheKey(code) {
            return `trailer_cache_v10_${this.normalize(code)}`;
        },
        isDynamicTrailer(result) {
            const url = String(result?.url || '');
            return String(result?.type || '').toLowerCase() === 'hls' || /\.m3u8(?:[?#].*)?$/i.test(url);
        },
        debug(...args) {
            if (DEBUG_LOG) console.log('[TrailerResolver]', ...args);
        },
        resolverChain() {
            return [
                'fromJavxyCcCd'
            ].map(name => ({ name, fn: this[name] })).filter(item => typeof item.fn === 'function');
        },
        async show(code) {
            const result = await this.get(code);
            if (result?.url) {
                this.debug('打开播放器', { code: this.normalize(code), source: result.source, type: result.type || 'video', url: result.url });
                const normalizedCode = this.normalize(code);
                const rawCode = String(code || '').trim();
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
                        if (failed.includes('DMM')) this.markJpSourceTemporarilyFailed('DMM');
                        return this.fallbackJavxyResult(normalizedCode, rawCode, failed);
                    }
                });
            } else {
                this.debug('最终未找到可用视频源', { code: this.normalize(code) });
                Utils.showToast('未找到可用的视频源。', '节点不可用，请将DMM域名分流到日本ip', 3000);
            }
        },
        async get(code) {
            const rawCode = String(code || '').trim();
            const id = this.normalize(code);
            const cacheEnabled = Settings.getTrailerCacheEnabled();
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
                                return cachedResult;
                            }
                        }
                    } catch {
                    }
                    this.debug('缓存无效，已移除');
                    sessionStorage.removeItem(this.cacheKey(id));
                }
            }
            for (const resolver of this.resolverChain()) {
                const resolverName = resolver.name || 'anonymous';
                try {
                    this.debug('尝试来源', resolverName);
                    const options = resolverName === 'fromJavxyCcCd' && this.isJpSourceTemporarilyFailed('DMM')
                        ? { skip: ['DMM'] }
                        : {};
                    const result = await resolver.fn.call(this, id, rawCode, options);
                    if (result?.url) {
                        this.debug('来源命中', resolverName, { source: result.source, type: result.type || 'video', url: result.url, qualities: result.qualities ? Object.keys(result.qualities) : [] });
                        if (cacheEnabled && !this.isDynamicTrailer(result)) sessionStorage.setItem(this.cacheKey(id), JSON.stringify(result));
                        return result;
                    }
                    this.debug('来源无结果', resolverName);
                } catch (e) {
                    errorLog(`TrailerResolver 来源异常: ${resolverName}`, e);
                }
            }
            return null;
        },
        request(url, options = {}) {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url,
                    data: options.data,
                    headers: options.headers || {},
                    timeout: options.timeout || 15000,
                    onload: (r) => resolve(r),
                    onerror: () => resolve(null),
                    ontimeout: () => resolve(null)
                });
            });
        },
        javxyToken() {
            return [118,119,112,71,97,110,28,84,124,65,76,102,65,16,77,109,64,82,85,83,67,92,125,108,83,65,124,107,84,104,71,84,17,124,118,125,104,8,125,96,112,103,29,18,82,83,87,84]
                .map(v => String.fromCharCode(v ^ 0x25))
                .join('');
        },
        normalizeJavxySource(value) {
            const raw = String(value || '').trim().toLowerCase();
            if (raw.includes('mgstage')) return 'MGStage';
            if (raw.includes('javdb')) return 'JavDB';
            if (raw.includes('avwikidb')) return 'AVWikiDB';
            if (raw.includes('javdatabase')) return 'JAVDatabase';
            if (raw.includes('dmm')) return 'DMM';
            return String(value || '').trim();
        },
        jpSourceFailedKey(source = 'DMM') {
            return `javxy_jp_source_failed_until_${String(source || '').toUpperCase()}`;
        },
        isJpSourceTemporarilyFailed(source = 'DMM') {
            const until = Number(sessionStorage.getItem(this.jpSourceFailedKey(source)) || 0);
            if (!Number.isFinite(until) || until <= Date.now()) {
                sessionStorage.removeItem(this.jpSourceFailedKey(source));
                return false;
            }
            return true;
        },
        markJpSourceTemporarilyFailed(source = 'DMM') {
            sessionStorage.setItem(this.jpSourceFailedKey(source), String(Date.now() + 30 * 60 * 1000));
        },
        async fallbackJavxyResult(code, rawCode = '', failedSources = [], options = {}) {
            const skip = [...new Set((failedSources || []).map(source => this.normalizeJavxySource(source)).filter(Boolean))];
            if (!skip.length) return null;
            if (!options.silent) {
                this.debug('Javxy 播放失败回落查询', {
                    code,
                    skip,
                    rule: '仅跳过失败来源，后续顺序按服务端后台设置'
                });
            }
            return this.fromJavxyCcCd(code, rawCode, { skip });
        },
        installFallbackDebugHelper() {
            const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : globalThis;
            targetWindow.__javxyFailDMMFor30m = globalThis.__javxyFailDMMFor30m = () => {
                this.markJpSourceTemporarilyFailed('DMM');
                this.debug('已手动标记 DMM 30 分钟内跳过');
            };
            targetWindow.__javxyClearDMMFail = globalThis.__javxyClearDMMFail = () => {
                sessionStorage.removeItem(this.jpSourceFailedKey('DMM'));
                this.debug('已清除 DMM 跳过标记');
            };
        },
        result(url, source, type = 'video', extra = {}) {
            return { url, source, type, ...extra };
        },
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
            { quality: '240p', text: '240p' }
        ],
        selectHighestQuality(qualityMap) {
            return this.sortQualityKeys(qualityMap)[0] || null;
        },
        sortQualityKeys(qualityMap) {
            const rank = new Map(this.qualityOptions.map((item, index) => [item.quality, index]));
            return Object.keys(qualityMap || {})
                .filter(key => qualityMap[key])
                .sort((a, b) => (rank.get(a) ?? -1) - (rank.get(b) ?? -1));
        },
        javxySourceLabels: {
            DMM: 'Javxy | dmm',
            JavDB: 'Javxy | Javdb',
            HEYZO: 'Javxy | Heyzo',
            PACO: 'Javxy | Paco',
            '10MU': 'Javxy | 10mu',
            Caribbean: 'Javxy | 加勒比',
            '1Pondo': 'Javxy | 一本道'
        },
        async fromJavxyCcCd(id, rawCode = '', options = {}) {
            const query = String(id || rawCode || '').trim();
            if (!query) {
                this.debug('Javxy 跳过：查询词为空');
                return null;
            }
            const $j = (a, k) => a.map(v => String.fromCharCode(v ^ k)).join('');
            const endpoints = [
                { host: $j([35,40,63,49,48,103,42,42,103,42,45], 73), label: $j([85,126,105,103,102], 31) },
                { host: $j([35,59,38,63,49,38,122,62,53,34,44,45,122,55,55,122,55,48], 84), label: $j([96,75,92,82,83,10,125,69,88,65,79,88], 42) }
            ];
            for (const endpoint of endpoints) {
                const params = new URLSearchParams({ [$j([70,73,76,64,75,81], 37)]: $j([46,35,45,49,43,40,43,111,44,39,53], 66) });
                if (Array.isArray(options.skip) && options.skip.length) params.set($j([73,81,83,74], 58), options.skip.join(','));
                if (Array.isArray(options.prefer) && options.prefer.length) params.set($j([99,97,118,117,118,97], 19), options.prefer.join(','));
                if (Array.isArray(options.source) && options.source.length) params.set($j([24,4,30,25,8,14], 107), options.source.join(','));
                const apiUrl = (endpoint.protocol || $j([116,104,104,108,111], 28)) + '://' + endpoint.host + '/' + $j([21,19,0,8,13,4,19,18], 97) + '/' + encodeURIComponent(query) + '?' + params;
                this.debug('Javxy \u8bf7\u6c42 API', { query, apiUrl, endpoint: endpoint.label });
                const r = await this.request(apiUrl, {
                    timeout: 15000,
                    headers: {
                        [$j([118,84,84,82,71,67], 55)]: $j([57,40,40,52,49,59,57,44,49,55,54,119,50,43,55,54,116,44,61,32,44,119,40,52,57,49,54,116,114,119,114], 88),
                        [$j([86,35,68,111,120,118,119,35,90,97,101,107,96], 14)]: this.javxyToken()
                    }
                });
                if (!r) {
                    this.debug('Javxy API 网络失败，尝试下一个节点', { endpoint: endpoint.label });
                    continue;
                }
                if (r.status >= 500 || r.status === 0) {
                    this.debug('Javxy API 服务异常，尝试下一个节点', { endpoint: endpoint.label, status: r.status });
                    continue;
                }
                if ([401, 403, 429].includes(r.status)) {
                    this.debug('Javxy API 被拒绝或限流，尝试下一个节点', { endpoint: endpoint.label, status: r.status });
                    continue;
                }
                if (r.status < 200 || r.status >= 400) {
                    this.debug('Javxy API 无结果，停止查询', { endpoint: endpoint.label, status: r.status });
                    return null;
                }
                if (!r.responseText) {
                    this.debug('Javxy API 响应为空，停止查询', { endpoint: endpoint.label, status: r.status });
                    return null;
                }
                let data;
                try {
                    data = JSON.parse(r.responseText);
                } catch {
                    this.debug('Javxy JSON 解析失败，尝试下一个节点', { endpoint: endpoint.label });
                    continue;
                }
                const trailerUrl = String(data?.trailer || '').trim();
                if (!trailerUrl) {
                    this.debug('Javxy 无 trailer 字段，停止查询', { endpoint: endpoint.label, keys: Object.keys(data || {}) });
                    return null;
                }
                const qualityMap = data?.qualities && typeof data.qualities === 'object' ? data.qualities : {};
                const quality = data?.quality && qualityMap[data.quality] ? data.quality : this.selectHighestQuality(qualityMap);
                const sourceBase = this.javxySourceLabels[data?.source] || `Javxy | ${data?.source || 'dmm'}`;
                const source = sourceBase;
                this.debug('Javxy 返回结果', { endpoint: endpoint.label, source: data?.source, quality, qualities: Object.keys(qualityMap) });
                const resultType = String(data?.type || '').trim() || 'video';
                return this.result(qualityMap[quality] || trailerUrl, source, resultType, {
                    qualities: qualityMap,
                    quality,
                    code: this.normalize(query),
                    rawCode,
                    javxySource: String(data?.source || '').trim(),
                    requiresJP: Boolean(data?.requiresJP),
                    fallbackSources: Array.isArray(data?.fallback) ? data.fallback.filter(Boolean) : [],
                    fallbackQuery: {
                        skip: Array.isArray(options.skip) ? options.skip.filter(Boolean) : [],
                        prefer: Array.isArray(options.prefer) ? options.prefer.filter(Boolean) : []
                    },
                    urls: Array.isArray(data?.urls) && data.urls.length
                        ? data.urls
                        : this.sortQualityKeys(qualityMap).map(key => qualityMap[key])
                });
            }
            return null;
        },
    };
    const Settings = {
        getPreviewCacheEnabled() {
            return true;
        },
        getTrailerCacheEnabled() {
            return true;
        },
        getDefaultSearchEngine() {
            const index = GM_getValue('default_search_engine', 2);
            return SearchEngines[index] || SearchEngines[0];
        },
        getDefaultVideoEngine() {
            return GM_getValue('default_video_engine', 'missav');
        },
        getVideoEngines() {
            return VIDEO_ENGINES;
        },
        getSourceOrder() {
            return GM_getValue('thumb_source_order', ['javfree', 'projectjav', 'javstore']);
        }
    };
    const SearchEngines = [
        { name: 'BTDigg', color: '#F60', url: (code) => `https://btdig.com/search?q=${code}` },
        { name: 'Taocili', color: '#DE5833', url: (code) => `https://taocili.com/search?q=${code}` },
        { name: 'Google', color: '#4285F4', url: (code) => `https://www.google.com/search?q=${code}` },
        { name: 'Bing', color: '#008373', url: (code) => `https://www.bing.com/search?q=${code}` },
        { name: 'DuckGo', color: '#DE5833', url: (code) => `https://duckduckgo.com/?q=${code}` }
    ];
    const Pan115 = {
        api: 'https://webapi.115.com/files/search',
        videoExts: new Set(['mp4', 'mkv', 'avi', 'wmv', 'mov', 'm4v', 'ts', 'flv', 'rmvb', 'webm']),
        pending: new Map(),
        cachePrefix: 'pan115_cache_v6_',
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
            OERO: '892OERO',
        },
        sourceAliases: {
            PACO: ['PACO', 'PACOPACOMAMA'],
            PACOPACOMAMA: ['PACO', 'PACOPACOMAMA'],
            '10MU': ['10MU', '10MUSUME'],
            '10MUSUME': ['10MU', '10MUSUME'],
            '1PON': ['1PON', '1PONDO'],
            '1PONDO': ['1PON', '1PONDO'],
            CARIB: ['CARIB', 'CARIBBEANCOM'],
            CARIBBEANCOM: ['CARIB', 'CARIBBEANCOM'],
            HEYZO: ['HEYZO'],
        },
        enabled() {
            return GM_getValue('btn_show_pan115', false);
        },
        normalizeCode(code) {
            return String(code || '').trim().toUpperCase().replace(/[_\s]+/g, '-');
        },
        normalizeKeepSeparator(code) {
            return String(code || '').trim().toUpperCase().replace(/\s+/g, '-');
        },
        playUrl(pickcode) {
            const encoded = encodeURIComponent(pickcode);
            const playerMode = GM_getValue('pan115_player_mode', 'official');
            if (playerMode === '115master') {
                return `https://115.com/web/lixian/master/video/?pick_code=${encoded}`;
            }
            return `https://115vod.com/?pickcode=${encoded}&share_id=0`;
        },
        cacheKey(code) {
            return `${this.cachePrefix}${this.normalizeKeepSeparator(code)}`;
        },
        getCached(code) {
            try {
                const raw = sessionStorage.getItem(this.cacheKey(code));
                if (!raw) return undefined;
                return JSON.parse(raw);
            } catch {
                return undefined;
            }
        },
        setCached(code, value) {
            try {
                sessionStorage.setItem(this.cacheKey(code), JSON.stringify(value || null));
            } catch {}
        },
        sourcePattern() {
            return Object.keys(this.sourceAliases).sort((a, b) => b.length - a.length).join('|');
        },
        sourceGroup(source) {
            return this.sourceAliases[String(source || '').toUpperCase()] || [String(source || '').toUpperCase()].filter(Boolean);
        },
        uncensoredParts(code) {
            const normalized = this.normalizeKeepSeparator(code);
            const match = normalized.match(/^(\d{6})([-_])(\d{2,3})(?:[-_]([A-Z0-9]+))?$/);
            return match ? { date: match[1], sep: match[2], num: match[3], source: match[4] || '' } : null;
        },
        uncensoredDigitKey(code) {
            const parts = this.uncensoredParts(code);
            return parts ? `${parts.date}${parts.sep}${parts.num}` : '';
        },
        fc2Number(code) {
            const normalized = this.normalizeKeepSeparator(code);
            const match = normalized.match(/^FC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})$/i);
            return match ? match[1] : '';
        },
        extractCode(text, fallbackCode = '') {
            const fc2 = String(text || '').match(/\bFC2[-_\s]?(?:PPV[-_\s]?)?(\d{6,9})\b/i);
            if (fc2) return `FC2-PPV-${fc2[1]}`;
            const sourcePattern = this.sourcePattern();
            const tail = String(text || '').match(new RegExp(`\\b(\\d{6})([-_])(\\d{2,3})[-_\\s]*(${sourcePattern})\\b`, 'i'));
            if (tail) {
                const source = tail[4].toUpperCase();
                const sep = tail[2] === '_' ? '_' : '-';
                return `${tail[1]}${sep}${tail[3]}-${source}`;
            }
            const head = String(text || '').match(new RegExp(`\\b(${sourcePattern})[-_\\s]*(\\d{6})([-_])(\\d{2,3})\\b`, 'i'));
            if (head) {
                const source = head[1].toUpperCase();
                const sep = head[3] === '_' ? '_' : '-';
                return `${head[2]}${sep}${head[4]}-${source}`;
            }
            return fallbackCode || Utils.extractCode(text);
        },
        searchKeyword(code) {
            const fc2 = this.fc2Number(code);
            if (fc2) return fc2;
            return String(code || '').trim().toLowerCase().replace(/^fc2-(?:ppv-)?/, '');
        },
        searchVariants(code) {
            const normalized = this.normalizeKeepSeparator(code);
            const variants = [normalized];
            const fc2 = this.fc2Number(normalized);
            if (fc2) {
                variants.push(`FC2-${fc2}`, `FC2-PPV-${fc2}`, fc2);
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
                    });
                }
            }
            return [...new Set(variants.filter(Boolean))];
        },
        codeRegex(code) {
            const fc2 = this.fc2Number(code);
            if (fc2) {
                return new RegExp(`(^|[^A-Z0-9])(?:FC2[-_\\s]?(?:PPV[-_\\s]?)?${fc2}|${fc2})([^A-Z0-9]|$)`, 'i');
            }
            const digitKey = this.uncensoredDigitKey(code);
            if (digitKey) {
                const parts = this.uncensoredParts(code);
                const sep = parts.sep === '_' ? '_' : '-';
                return new RegExp(`(^|[^0-9])${parts.date}${sep}${parts.num}([^0-9]|$)`, 'i');
            }
            const patterns = [];
            const add = value => {
                const normalized = this.normalizeCode(value);
                if (!normalized) return;
                const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-_]/g, '[-_\\s]?');
                patterns.push(escaped, normalized.replace(/[-_]/g, ''));
            };
            this.searchVariants(code).forEach(add);
            return new RegExp(`(?:${[...new Set(patterns)].join('|')})`, 'i');
        },
        isVideoName(name) {
            const ext = String(name || '').split('.').pop().toLowerCase();
            return this.videoExts.has(ext);
        },
        flattenFiles(payload) {
            const candidates = [
                payload?.data,
                payload?.data?.list,
                payload?.data?.files,
                payload?.data?.items,
                payload?.files,
                payload?.list,
            ];
            const arr = candidates.find(Array.isArray) || [];
            return arr.map(item => ({
                name: item.n || item.name || item.file_name || item.filename || item.title || '',
                pickcode: item.pc || item.pickcode || item.pick_code || item.pickCode || item.pick || '',
                raw: item,
            })).filter(item => item.name);
        },
        async requestSearch(keyword) {
            const query = new URLSearchParams({
                search_value: keyword,
                limit: '30',
                offset: '0',
            });
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${this.api}?${query}`,
                    timeout: 15000,
                    anonymous: false,
                    headers: { Accept: 'application/json, text/plain, */*' },
                    onload: r => {
                        try {
                            resolve(JSON.parse(r.responseText));
                        } catch (err) {
                            reject(new Error('115返回不是JSON，可能未登录'));
                        }
                    },
                    onerror: () => reject(new Error('115请求失败')),
                    ontimeout: () => reject(new Error('115请求超时')),
                });
            });
        },
        async search(code) {
            const matcher = this.codeRegex(code);
            const seen = new Set();
            const keywords = [...new Set(this.searchVariants(code).map(item => this.searchKeyword(item)).filter(Boolean))];
            for (const keyword of keywords) {
                const payload = await this.requestSearch(keyword);
                const state = payload?.state ?? payload?.success;
                if (state === false) {
                    const msg = payload?.error || payload?.message || payload?.errno || '115查询失败';
                    throw new Error(String(msg));
                }
                for (const item of this.flattenFiles(payload)) {
                    const key = item.pickcode || item.name;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    if (matcher.test(item.name) && this.isVideoName(item.name)) return item;
                }
            }
            return null;
        },
        async searchCached(code) {
            const normalized = this.normalizeKeepSeparator(code);
            if (!normalized) return null;
            const cached = this.getCached(normalized);
            if (cached !== undefined) return cached;
            if (this.pending.has(normalized)) return this.pending.get(normalized);
            const task = this.search(normalized)
                .then(hit => {
                    this.setCached(normalized, hit || null);
                    return hit || null;
                })
                .finally(() => this.pending.delete(normalized));
            this.pending.set(normalized, task);
            return task;
        },
    };
    function closeAllJumpMenus(exceptMenu = null) {
        document.querySelectorAll('.search-submenu.is-open').forEach(menu => {
            if (menu !== exceptMenu) menu.classList.remove('is-open');
        });
    }
    function bindJumpMenu(menuDiv, toggleBtn, subMenu, mainBtn = null) {
        let closeTimer = null;
        const clearCloseTimer = () => {
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
        };
        const closeMenu = () => {
            clearCloseTimer();
            subMenu.classList.remove('is-open');
        };
        const scheduleClose = () => {
            clearCloseTimer();
            if (subMenu.classList.contains('is-open')) closeTimer = setTimeout(closeMenu, 1000);
        };
        toggleBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const willOpen = !subMenu.classList.contains('is-open');
            closeAllJumpMenus(subMenu);
            clearCloseTimer();
            subMenu.classList.toggle('is-open', willOpen);
            if (willOpen && !menuDiv.matches(':hover')) scheduleClose();
        });
        menuDiv.addEventListener('mouseenter', clearCloseTimer);
        menuDiv.addEventListener('mouseleave', scheduleClose);
        if (mainBtn) mainBtn.addEventListener('click', closeMenu);
        subMenu.addEventListener('click', e => {
            if (e.target.closest('a')) closeMenu();
        });
        document.addEventListener('click', e => {
            if (!menuDiv.contains(e.target)) closeMenu();
        });
    }
    function addNyaaBtn(code, container, useCapture = false) {
        if (!GM_getValue('btn_show_nyaa', true)) return;
        if (/sukebei\.nyaa/i.test(location.hostname)) return;
        const btn = Utils.createJumpLinkBtn('🔍 Sukebei', '#17a2b8', `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(code)}`);
        container.appendChild(btn);
    }
    function addJavbusBtn(code, container, useCapture = false) {
        if (!GM_getValue('btn_show_javbus', true)) return;
        if (/javbus\.com/i.test(location.hostname)) return;
        const url = Utils.getJavBusUrl(code);
        const btn = Utils.createJumpLinkBtn('🎬 JavBus', '#007bff', url);
        container.appendChild(btn);
    }
    function addJavdbBtn(code, container, useCapture = false) {
        if (!GM_getValue('btn_show_javdb', true)) return;
        if (/javdb\.com/i.test(location.hostname)) return;
        const btn = Utils.createJumpLinkBtn('📀 JavDB', '#6f42c1', `https://javdb.com/search?q=${encodeURIComponent(code)}`);
        container.appendChild(btn);
    }
    function addMissAVBtn(code, container, useCapture = false) {
        const showMissav = GM_getValue('btn_show_missav', true);
        if (!showMissav) return;
        const codeLower = code.toLowerCase();
        const codeCompactLower = codeLower.replace(/-/g, '');
        const videoUrlMap = {
            missav: `https://missav.ws/${codeLower}`,
            jable: `https://jable.tv/videos/${codeLower}/`,
            '123av': `https://123av.com/zh/v/${codeLower}`,
            javday: `https://javday.app/videos/${codeCompactLower}/`,
            supjav: `https://supjav.com/zh/?s=${encodeURIComponent(code)}`,
            javrate: `https://www.javrate.com/search/${encodeURIComponent(codeLower)}`,
        };
        const enabledVideoKeys = new Set([
            ...(showMissav ? ['missav', 'jable', '123av', 'javday', 'supjav', 'javrate'] : []),
        ]);
        const videoButtons = Settings.getVideoEngines()
            .filter(item => enabledVideoKeys.has(item.key) && !item.host.test(location.hostname))
            .map(item => ({ ...item, url: videoUrlMap[item.key] }))
            .filter(item => item.url);
        if (!videoButtons.length) return;
        const defaultKey = Settings.getDefaultVideoEngine();
        const mainItem = videoButtons.find(item => item.key === defaultKey) || videoButtons[0];
        const subItems = videoButtons.filter(item => item !== mainItem);
        const createVideoBtn = item => Utils.createJumpLinkBtn(`🎬 ${item.label}`, item.color, item.url);
        if (!subItems.length) {
            container.appendChild(createVideoBtn(mainItem));
            return;
        }
        const menuDiv = document.createElement('div');
        menuDiv.className = 'search-menu missav-menu';
        menuDiv.style.setProperty('--jav-btn-accent', mainItem.color);
        const mainBtn = createVideoBtn(mainItem);
        mainBtn.classList.add('search-main-btn');
        menuDiv.appendChild(mainBtn);
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'search-toggle-btn';
        toggleBtn.title = '展开同类站点';
        toggleBtn.innerHTML = '<span class="search-arrow">▼</span>';
        menuDiv.appendChild(toggleBtn);
        const subMenu = document.createElement('div');
        subMenu.className = 'search-submenu';
        subItems.forEach(item => {
            const subBtn = createVideoBtn(item);
            subBtn.style.margin = '2px 0';
            subBtn.style.width = '100%';
            subBtn.style.textAlign = 'left';
            subMenu.appendChild(subBtn);
        });
        menuDiv.appendChild(subMenu);
        bindJumpMenu(menuDiv, toggleBtn, subMenu, mainBtn);
        container.appendChild(menuDiv);
    }
    function addDmmBtn(code, container, useCapture = false) {
        if (!GM_getValue('btn_show_fanza', true)) return;
        const btn = Utils.createBtn('▶ FANZA', '#c0392b', () => {
            window.open(`https://www.dmm.co.jp/mono/-/search/=/searchstr=${encodeURIComponent(code)}/`);
        }, useCapture);
        container.appendChild(btn);
    }
    function addTrailerBtn(code, container, useCapture = false) {
        if (!GM_getValue('btn_show_trailer', true)) return;
        const btn = Utils.createBtn('🎞️ 预告片', '#111827', async () => {
            const oldText = btn.textContent;
            btn.textContent = '🎞️ 解析中...';
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.72';
            try {
                await Trailer.show(code);
            } finally {
                btn.textContent = oldText;
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
            }
        }, useCapture);
        btn.classList.add('jav-trailer-btn');
        container.appendChild(btn);
    }
    function addPreviewBtn(code, container, useCapture = false) {
        if (!GM_getValue('btn_show_preview', true)) return;
        const btn = Utils.createBtn('🖼️ 预览图', '#28a745', async () => {
            await Thumbnail.show(code);
        }, useCapture);
        btn.classList.add('jav-preview-btn');
        container.appendChild(btn);
    }
    function addPan115PlayBtn(code, container, useCapture = false) {
        if (!Pan115.enabled() || !code || !container) return;
        const normalized = Pan115.normalizeKeepSeparator(code);
        if (!normalized || container.dataset.pan115PlayCode === normalized) return;
        container.dataset.pan115PlayCode = normalized;
        const marker = document.createComment('pan115-play');
        const anchor = container.querySelector('.jav-trailer-btn, .jav-preview-btn, .jav-settings-btn');
        container.insertBefore(marker, anchor || null);
        Pan115.searchCached(normalized).then(hit => {
            const pickcode = hit?.pickcode;
            if (!Pan115.enabled() || !pickcode || !marker.parentNode) return;
            const btn = Utils.createJumpLinkBtn('115播放', '#00a85a', Pan115.playUrl(pickcode));
            btn.classList.add('jav-pan115-play-btn');
            btn.dataset.pickcode = pickcode;
            btn.title = hit.name || `115播放：${normalized}`;
            marker.parentNode.insertBefore(btn, marker);
        }).catch(err => {
            errorLog('115自动查询失败:', err);
        }).finally(() => {
            marker.remove();
        });
    }
    function addSearchMenu(code, container, useCapture = false) {
        if (!GM_getValue('btn_show_search', true)) return;
        const defaultEngine = Settings.getDefaultSearchEngine();
        const menuDiv = document.createElement('div');
        menuDiv.className = 'search-menu';
        menuDiv.style.setProperty('--jav-btn-accent', defaultEngine.color);
        const mainBtn = Utils.createBtn(`🔍 ${defaultEngine.name}`, defaultEngine.color, () => {
            window.open(defaultEngine.url(code));
        }, useCapture);
        mainBtn.classList.add('search-main-btn');
        menuDiv.appendChild(mainBtn);
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'search-toggle-btn';
        toggleBtn.title = '展开搜索引擎';
        toggleBtn.innerHTML = '<span class="search-arrow">▼</span>';
        menuDiv.appendChild(toggleBtn);
        const subMenu = document.createElement('div');
        subMenu.className = 'search-submenu';
        SearchEngines.forEach(engine => {
            if (engine.name === defaultEngine.name) return;
            const subBtn = Utils.createBtn(`🔍 ${engine.name}`, engine.color, () => {
                window.open(engine.url(code));
                subMenu.classList.remove('is-open');
            }, useCapture);
            subBtn.style.margin = '2px 0';
            subBtn.style.width = '100%';
            subBtn.style.textAlign = 'left';
            subMenu.appendChild(subBtn);
        });
        menuDiv.appendChild(subMenu);
        bindJumpMenu(menuDiv, toggleBtn, subMenu, mainBtn);
        container.appendChild(menuDiv);
    }
    function addSettingsBtn(container, useCapture = false) {
        if (!container || container.querySelector('.jav-settings-btn')) return;
        const btn = Utils.createBtn('⚙️ 设置', '#475569', () => {
            SettingsPanel.open();
        }, useCapture);
        btn.classList.add('jav-settings-btn');
        btn.title = '打开老司机设置';
        container.appendChild(btn);
    }
    function createPan115Badge(hit, code, asAnchor = true) {
        const url = Pan115.playUrl(hit.pickcode);
        const badge = document.createElement(asAnchor ? 'a' : 'span');
        badge.className = 'jav-pan115-badge';
        badge.textContent = '115匹配';
        badge.title = hit.name || `115播放：${Pan115.normalizeKeepSeparator(code)}`;
        badge.dataset.pickcode = hit.pickcode;
        if (asAnchor) {
            badge.href = url;
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            badge.addEventListener('click', e => {
                e.stopImmediatePropagation();
            }, true);
        } else {
            badge.setAttribute('role', 'link');
            badge.tabIndex = 0;
            const open = e => {
                e.preventDefault();
                e.stopImmediatePropagation();
                window.open(Pan115.playUrl(badge.dataset.pickcode), '_blank', 'noopener,noreferrer');
            };
            badge.addEventListener('click', open, true);
            badge.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') open(e);
            }, true);
        }
        return badge;
    }
    let pan115ListRunning = false;
    async function renderPan115ListBadges() {
        if (!Pan115.enabled() || pan115ListRunning || SiteManager.isDetailPage()) return;
        pan115ListRunning = true;
        const targets = SiteManager.collectPan115ListTargets().slice(0, 36);
        try {
            targets.forEach(({ anchor }) => {
                anchor.dataset.pan115Checked = '1';
            });
            await Promise.all(targets.map(async ({ anchor, code }) => {
                try {
                    const hit = await Pan115.searchCached(code);
                    SiteManager.insertPan115ListBadge(anchor, hit, code);
                } catch (err) {
                    errorLog('115列表单项查询失败:', err);
                }
            }));
        } catch (err) {
            errorLog('115列表自动查询失败:', err);
        } finally {
            pan115ListRunning = false;
            if (Pan115.enabled() && SiteManager.collectPan115ListTargets().length) schedulePan115ListBadges();
        }
    }
    function removePan115Ui() {
        clearTimeout(pan115ListTimer);
        document.querySelectorAll('.jav-pan115-badge, .jav-pan115-play-btn').forEach(el => el.remove());
        document.querySelectorAll('[data-pan115-checked], [data-pan115-has-badge]').forEach(el => {
            delete el.dataset.pan115Checked;
            delete el.dataset.pan115HasBadge;
        });
        document.querySelectorAll('[data-pan115-play-code]').forEach(el => {
            delete el.dataset.pan115PlayCode;
        });
    }
    function refreshPan115PlayerLinks() {
        document.querySelectorAll('.jav-pan115-badge[data-pickcode], .jav-pan115-play-btn[data-pickcode]').forEach(el => {
            const url = Pan115.playUrl(el.dataset.pickcode);
            if (el.tagName === 'A') el.href = url;
        });
    }
    function forceRenderPan115Ui() {
        refreshPan115PlayerLinks();
        if (SiteManager.isDetailPage()) {
            JumpButtons.render();
        } else {
            schedulePan115ListBadges();
        }
    }
    function syncPan115AfterSettingsSave(enabled = Pan115.enabled()) {
        if (!enabled) {
            removePan115Ui();
            return;
        }
        setTimeout(forceRenderPan115Ui, 0);
    }
    Core.expose('__LAOSIJI_SYNC_PAN115__', syncPan115AfterSettingsSave);
    function addJumpLineBreak(container) {
        const lineBreak = document.createElement('span');
        lineBreak.className = 'jav-jump-line-break';
        lineBreak.style.cssText = 'flex-basis:100%;height:0;padding:0;margin:0;';
        container.appendChild(lineBreak);
    }
    const JumpSites = [
        {
            id: 'sukebei',
            name: 'Sukebei',
            match: (url) => /nyaa\.si/.test(url) && url.includes('/view/'),
            titleSelector: '.panel-title'
        },
        {
            id: '169bbs',
            name: '169bbs',
            match: (url) => /169bbs\.(com|net|org)/.test(url) && url.includes('mod=viewthread'),
            titleSelector: '#thread_subject, h1'
        },
        {
            id: 'supjav',
            name: 'SupJav',
            match: (url) => /supjav\.com/.test(url) && /\/\d+\.html$/.test(url),
            titleSelector: '.clearfix.post-meta > h2'
        },
        {
            id: 'emby',
            name: 'Emby',
            match: (url) => {
                try {
                    const u = new URL(url);
                    if (!/\/web\/index\.html/.test(u.pathname)) return false;
                    return /emby|jellyfin/i.test(u.hostname) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname);
                } catch {
                    return false;
                }
            },
            titleSelector: 'h1'
        },
        {
            id: 'javbus',
            name: 'JavBus',
            match: (url) => /javbus\.com/.test(url) && !/search|genre|actresses|uncensored|forum|page|series|studio|label|director|star/.test(url),
            titleSelector: 'h3'
        },
        {
            id: 'javdb',
            name: 'JavDB',
            match: (url) => /javdb\d*\.com/.test(url) && (/\/v\/\w+/.test(url) || /[?&]laosiji_detail=fc2\b/.test(url)),
            titleSelector: 'h2.title, .javdb-api-detail-title'
        },
        {
            id: 'javlibrary',
            name: 'JAVLibrary',
            match: (url) => /(javlibrary|javlib|r86m|s87n)/i.test(url) && /\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?jav\w+\.html/i.test(new URL(url).pathname),
            titleSelector: '.post-title'
        },
        {
            id: 'javrate',
            name: 'Javrate',
            match: (url) => /javrate\.com/.test(url) && /\/movie\/detail\//i.test(url),
            titleSelector: 'h1'
        },
        {
            id: 'sehuatang',
            name: 'Sehuatang',
            match: (url) => /sehuatang\.(net|org|com)/.test(url) && url.includes('mod=viewthread'),
            titleSelector: '#thread_subject, h1'
        },
        {
            id: 'hjd2048',
            name: 'HJD2048',
            match: (url) => /hjd2048\.com/.test(url) && /\/2048\//.test(url),
            titleSelector: 'h1#subject_tpc, h1'
        },
        {
            id: 'missav',
            name: 'MissAV',
            match: (url) => {
                if (!/missav\.(ws|com)/.test(url)) return false;
                const pathname = new URL(url).pathname;
                if (/^\/$|\/search|\/tags|\/actresses|\/genres/.test(pathname)) return false;
                return /\/[a-z]{2,10}-\d+/i.test(pathname);
            },
            titleSelector: 'h1[class*="text-nord6"], h1'
        },
        {
            id: 'jable',
            name: 'Jable',
            match: (url) => /jable\.tv/.test(url) && /\/videos\/[a-z0-9-]+\/?/i.test(new URL(url).pathname),
            titleSelector: '.header-left > h4'
        }
    ];
    Core.expose('__LAOSIJI_JUMP_SITES__', JumpSites);
    const TitleTranslate = (() => {
        const CACHE_PREFIX = 'title_translate_pa_v1_';
        function ensureStyle() {
            injectStyle('jav-title-translate-style', `.jav-title-translation{margin:6px 0 8px!important;padding:7px 10px!important;border-left:3px solid #60a5fa!important;background:#eff6ff!important;color:#1e3a8a!important;font-size:20px!important;font-weight:700!important;line-height:1.5!important;word-break:break-word!important;border-radius:0 6px 6px 0!important}.jav-title-translation.is-loading{color:#64748b!important;background:#f8fafc!important;border-left-color:#cbd5e1!important}.jav-title-translation.is-error{color:#be123c!important;background:#fff1f2!important;border-left-color:#fb7185!important}#video_title .jav-title-translation{margin-right:72px!important}`);
        }
        function escapeRegExp(value) {
            return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        function titleWithoutCode(text) {
            const raw = String(text || '').replace(/\s+/g, ' ').trim();
            const code = Utils.extractCode(raw);
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
                return { site: site.id, text, anchor: current.closest('h2') || current };
            }
            if (site.id === 'javbus') {
                const title = document.querySelector('h3[data-enhanced="1"]') || SiteManager.getJumpTitleElement(site);
                if (!title) return null;
                return { site: site.id, text: titleWithoutCode(title.textContent), anchor: title };
            }
            const title = document.querySelector('#video_title .post-title.text a, #video_title .post-title.text, .post-title a, .post-title');
            if (!title) return null;
            return { site: site.id, text: titleWithoutCode(title.textContent), anchor: title.closest('h3') || title };
        }
        function readJavbusLang() {
            const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            const direct = pageWindow?.lang || window.lang || '';
            if (direct) return direct;
            for (const script of document.scripts || []) {
                const hit = (script.textContent || '').match(/\bvar\s+lang\s*=\s*['"]([^'"]+)/i);
                if (hit) return hit[1];
            }
            return '';
        }
        function targetLanguage(siteId) {
            let lang = '';
            if (siteId === 'javdb') {
                lang = document.documentElement.dataset.lang || document.body?.dataset.lang || new URL(location.href).searchParams.get('locale') || '';
                const lower = String(lang).toLowerCase();
                if (lower === 'en') return 'en';
                if (lower === 'zh') return 'zh-TW';
                return 'zh-CN';
            }
            if (siteId === 'javbus') {
                lang = readJavbusLang();
                const lower = String(lang).toLowerCase();
                if (lower === 'ja') return '';
                if (lower === 'en') return 'en';
                if (lower === 'ko') return 'ko';
                return 'zh-CN';
            }
            if (siteId === 'javlibrary' || siteId === 'javlib') {
                lang = document.documentElement.lang || '';
                const lower = String(lang).toLowerCase();
                if (lower.startsWith('ja')) return '';
                if (lower.startsWith('en')) return '';
                if (lower.includes('tw') || lower === 'zh') return 'zh-TW';
                return 'zh-CN';
            }
            return 'zh-CN';
        }
        function translateMessage(target, type) {
            const lang = String(target || '').toLowerCase();
            if (lang === 'en') return type === 'error' ? 'Title translation failed' : 'Translating title...';
            if (lang === 'ko') return type === 'error' ? '제목 번역 실패' : '제목 번역 중...';
            if (lang === 'zh-tw') return type === 'error' ? '翻譯標題失敗' : '翻譯標題中...';
            return type === 'error' ? '翻译标题失败' : '翻译标题中...';
        }
        function cacheKey(text, target) {
            return `${CACHE_PREFIX}${target || 'zh-CN'}_${encodeURIComponent(String(text || '').slice(0, 180))}`;
        }
        async function translate(text, target) {
            const key = cacheKey(text, target);
            const cached = sessionStorage.getItem(key);
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
            if (!r.loadstuts || r.status < 200 || r.status >= 400) throw new Error(`HTTP ${r.status || 0}`);
            const json = JSON.parse(r.responseText || '{}');
            const result = String(json.translation || '').trim();
            if (!result) throw new Error('empty translation');
            sessionStorage.setItem(key, result);
            return result;
        }
        function clear() {
            document.querySelectorAll('.jav-title-translation').forEach(el => el.remove());
        }
        async function sync() {
            if (!CFG.titleTranslate) {
                clear();
                return;
            }
            const info = getInfo();
            if (!info?.text || !info.anchor) {
                clear();
                return;
            }
            const target = targetLanguage(info.site);
            if (!target) {
                clear();
                return;
            }
            ensureStyle();
            let row = Array.from(info.anchor.parentNode?.children || []).find(el => el.classList?.contains('jav-title-translation'));
            if (!row) {
                row = document.createElement('div');
                row.className = 'jav-title-translation is-loading';
                info.anchor.insertAdjacentElement('afterend', row);
            }
            const id = `${info.site}:${target}:${info.text}`;
            if (row.dataset.translateId === id && row.dataset.state === 'loaded') return;
            row.dataset.translateId = id;
            row.dataset.state = 'loading';
            row.className = 'jav-title-translation is-loading';
            row.textContent = translateMessage(target);
            try {
                const translated = await translate(info.text, target);
                if (!CFG.titleTranslate || row.dataset.translateId !== id) return;
                row.dataset.state = 'loaded';
                row.className = 'jav-title-translation';
                row.textContent = translated;
            } catch (err) {
                if (row.dataset.translateId !== id) return;
                row.dataset.state = 'error';
                row.className = 'jav-title-translation is-error';
                row.textContent = translateMessage(target, 'error');
                errorLog('翻译标题失败:', err);
            }
        }
        return { sync, clear };
    })();
    Core.expose('__LAOSIJI_TITLE_TRANSLATE__', TitleTranslate);
    function isCurrentDetailPage() {
        if (/javbus\.com/i.test(location.hostname)) {
            return /^\/(?:[a-z]{2}\/)?(?:[A-Z]{2,15}-?\d{2,10}(?:-\d{1,3})?|[A-Z]{2,10}\d{3,6}|FC2(?:-PPV)?-\d{6,9})\/?$/i.test(location.pathname);
        }
        return JumpSites.some(site => site.match(window.location.href));
    }
    function isElemVisible(el) {
        if (!el) return false;
        if (el.closest('.hide, [hidden], [aria-hidden="true"]')) return false;
        const rects = el.getClientRects();
        if (!rects || rects.length === 0) return false;
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        return true;
    }
    function resolveEmbyTitleElem() {
        const nodes = Array.from(document.querySelectorAll(
            'h1, h2, h3.itemName, .itemName-primary, .pageTitle, .nameContainer h3, [class*="itemName"]'
        ));
        let firstVisible = null;
        for (const el of nodes) {
            const txt = (el.textContent || '').trim();
            if (!txt) continue;
            if (!isElemVisible(el)) continue;
            if (!firstVisible) firstVisible = el;
            if (Utils.extractCode(txt)) return el;
        }
        return firstVisible;
    }
    function renderButtonsForCurrentPage() {
        const site = SiteManager.getJumpSite();
        if (!site) return;
        let titleElem = SiteManager.getJumpTitleElement(site);
        if (!titleElem) return;
        if (site.id === 'emby' && !Utils.extractCode(titleElem.textContent || '')) return;
        const existingBtnGroup = document.querySelector('.jav-jump-btn-group[data-laosiji-jump="1"]');
        if (site.id === 'emby') {
            const renderKey = SiteManager.getEmbyRenderKey(titleElem);
            const existingKey = existingBtnGroup?.dataset.embyRenderKey || '';
            if (existingBtnGroup) {
                if ((existingKey && existingKey !== renderKey) || !existingBtnGroup.isConnected) {
                    existingBtnGroup.remove();
                } else {
                    const anchor = SiteManager.getEmbyInsertAnchor(titleElem);
                    if (anchor.nextElementSibling !== existingBtnGroup) {
                        anchor.insertAdjacentElement('afterend', existingBtnGroup);
                    }
                    return;
                }
            }
            delete titleElem.dataset.enhanced;
        }
        if (existingBtnGroup) {
            if (site.id === 'emby') {
            } else {
            const code = Utils.extractCode(titleElem.textContent);
            const pan115Code = Pan115.extractCode(titleElem.textContent, code);
            if (pan115Code) addPan115PlayBtn(pan115Code, existingBtnGroup);
            addSettingsBtn(existingBtnGroup);
            placeJumpButtonGroup(site, titleElem, existingBtnGroup);
            return;
            }
        }
        if (titleElem.dataset.enhanced === '1') return;
        titleElem.dataset.enhanced = '1';
        const titleText = titleElem.textContent;
        const code = Utils.extractCode(titleText);
        if (!code) return;
        const trailerCode = Utils.extractCode(titleText, { keepUncensoredSource: true }) || code;
        const btnGroup = document.createElement('div');
        btnGroup.className = 'jav-jump-btn-group';
        btnGroup.dataset.laosijiJump = '1';
        if (site.id === 'javlibrary') {
            addNyaaBtn(code, btnGroup);
            addJavbusBtn(code, btnGroup);
            addJavdbBtn(code, btnGroup);
            addMissAVBtn(code, btnGroup);
            addDmmBtn(code, btnGroup);
            addSearchMenu(code, btnGroup);
            addJumpLineBreak(btnGroup);
            addPan115PlayBtn(Pan115.extractCode(titleText, code), btnGroup);
            addTrailerBtn(trailerCode, btnGroup);
            addPreviewBtn(code, btnGroup);
            addSettingsBtn(btnGroup);
            btnGroup.querySelectorAll('a').forEach(btn => {
                let style = btn.getAttribute('style') || '';
                style = style.replace(/background:\s*([^;]+);/g, 'background: $1 !important;');
                style = style.replace(/color:\s*([^;]+);/g, 'color: $1 !important;');
                btn.setAttribute('style', style);
            });
            placeJumpButtonGroup(site, titleElem, btnGroup);
        } else if (site.id === 'missav') {
            addNyaaBtn(code, btnGroup);
            addJavbusBtn(code, btnGroup);
            addJavdbBtn(code, btnGroup);
            addMissAVBtn(code, btnGroup);
            const defaultEngine = Settings.getDefaultSearchEngine();
            const searchMenuDiv = document.createElement('div');
            searchMenuDiv.className = 'search-menu';
            searchMenuDiv.style.setProperty('--jav-btn-accent', defaultEngine.color);
            const mainSearchBtn = Utils.createLinkBtn(`🔍 ${defaultEngine.name}`, defaultEngine.color, defaultEngine.url(code));
            mainSearchBtn.classList.add('search-main-btn');
            searchMenuDiv.appendChild(mainSearchBtn);
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'search-toggle-btn';
            toggleBtn.title = '展开搜索引擎';
            toggleBtn.innerHTML = '<span class="search-arrow">▼</span>';
            searchMenuDiv.appendChild(toggleBtn);
            const subMenu = document.createElement('div');
            subMenu.className = 'search-submenu';
            SearchEngines.forEach(engine => {
                if (engine.name === defaultEngine.name) return;
                const subBtn = Utils.createLinkBtn(`🔍 ${engine.name}`, engine.color, engine.url(code));
                subBtn.style.margin = '2px 0';
                subMenu.appendChild(subBtn);
            });
            searchMenuDiv.appendChild(subMenu);
            bindJumpMenu(searchMenuDiv, toggleBtn, subMenu, mainSearchBtn);
            btnGroup.appendChild(searchMenuDiv);
            addPan115PlayBtn(Pan115.extractCode(titleText, code), btnGroup);
            addTrailerBtn(trailerCode, btnGroup);
            addPreviewBtn(code, btnGroup);
            addSettingsBtn(btnGroup);
            btnGroup.style.cssText = `margin:10px 0 6px 0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;position:relative;z-index:9999;`;
            placeJumpButtonGroup(site, titleElem, btnGroup);
        } else {
            addNyaaBtn(code, btnGroup);
            addJavbusBtn(code, btnGroup);
            addJavdbBtn(code, btnGroup);
            addMissAVBtn(code, btnGroup);
            addDmmBtn(code, btnGroup);
            addSearchMenu(code, btnGroup);
            if (['javbus', 'javdb', 'supjav', 'jable'].includes(site.id)) addJumpLineBreak(btnGroup);
            addPan115PlayBtn(Pan115.extractCode(titleText, code), btnGroup);
            addTrailerBtn(trailerCode, btnGroup);
            addPreviewBtn(code, btnGroup);
            addSettingsBtn(btnGroup);
            if (site.id === 'emby') {
                btnGroup.classList.add('emby-fix');
                btnGroup.dataset.embyRenderKey = SiteManager.getEmbyRenderKey(titleElem);
                SiteManager.getEmbyInsertAnchor(titleElem).insertAdjacentElement('afterend', btnGroup);
            } else {
                placeJumpButtonGroup(site, titleElem, btnGroup);
            }
        }
    }
    function getJhsLikeJumpTarget(site) {
        if (site.id === 'javdb') return document.querySelector('.movie-panel-info');
        if (site.id === 'javbus') return document.querySelector('.container .info');
        if (site.id === 'javlibrary') return document.querySelector('#video_info');
        return null;
    }
    function placeJumpButtonGroup(site, titleElem, btnGroup) {
        if (site.id === 'supjav') {
            btnGroup.style.marginTop = '8px';
            if (btnGroup.parentElement !== titleElem.parentElement || btnGroup.previousElementSibling !== titleElem) {
                titleElem.insertAdjacentElement('afterend', btnGroup);
            }
            return;
        }
        if (site.id === 'jable') {
            btnGroup.style.marginTop = '8px';
            btnGroup.style.display = 'flex';
            btnGroup.style.flexWrap = 'wrap';
            if (btnGroup.parentElement !== titleElem) {
                titleElem.appendChild(btnGroup);
            }
            return;
        }
        const target = getJhsLikeJumpTarget(site);
        if (target) {
            allowJumpMenuOverflow(target);
            if (site.id === 'javlibrary') {
                if (btnGroup.parentElement !== target || btnGroup.nextElementSibling) target.appendChild(btnGroup);
            } else if (btnGroup.parentElement !== target) {
                target.appendChild(btnGroup);
            }
        } else if (btnGroup.parentElement !== titleElem.parentElement || btnGroup.previousElementSibling !== titleElem) {
            titleElem.insertAdjacentElement('afterend', btnGroup);
        }
    }
    function allowJumpMenuOverflow(target) {
        const elements = [
            target,
            target.closest('td'),
            target.closest('tr'),
            target.closest('#video_jacket_info'),
            target.closest('.movie-panel-info'),
            target.closest('.container .info'),
            target.closest('.col-md-3.info'),
            target.closest('.jav-flex-container'),
            target.closest('.row.movie'),
            target.closest('.video-info'),
            target.closest('.info-header')
        ];
        [...new Set(elements.filter(Boolean))].forEach(el => {
            el.style.setProperty('overflow', 'visible', 'important');
            el.style.setProperty('overflow-x', 'visible', 'important');
            el.style.setProperty('overflow-y', 'visible', 'important');
        });
    }
    const JumpButtons = {
        render: renderButtonsForCurrentPage,
        refresh: renderButtonsForCurrentPage,
    };
    Core.expose('__LAOSIJI_JUMP_BUTTONS__', JumpButtons);
    const InfiniteScroll = {
        cachePrefix: 'laosiji_infinite_v1_',
        maxSnapshotItems: 240,
        snapshotTimer: null,
        enabled() {
            return GM_getValue('infinite_scroll_enabled', false);
        },
        state: null,
        init() {
            if (!this.enabled() || SiteManager.isDetailPage() || this.state) return;
            const config = this.getConfig();
            if (!config?.container || !config.nextUrl) return;
            this.state = {
                ...config,
                loading: false,
                done: false,
                emptyStreak: 0,
                seen: new Set([...config.container.querySelectorAll('a[href]')].map(a => a.href)),
            };
            this.restoreSnapshot(this.state);
            this.hidePagination();
            this.createSentinel();
            this.observe();
            this.restoreScroll();
        },
        destroy() {
            this.rememberScroll();
            this.saveSnapshot();
            clearTimeout(this.snapshotTimer);
            this.snapshotTimer = null;
            if (this.state?.observer) {
                this.state.observer.disconnect();
            }
            this.state = null;
            document.querySelectorAll('.jav-infinite-sentinel').forEach(el => el.remove());
            document.querySelectorAll('#next, .pagination, nav.pagination').forEach(el => {
                el.style.display = '';
            });
        },
        getConfig(doc = document, baseUrl = location.href) {
            return SiteManager.getInfiniteScrollConfig(doc, baseUrl);
        },
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
                return null;
            }
        },
        itemKey(item) {
            const href = item?.querySelector?.('a[href]')?.getAttribute('href') || '';
            return href ? new URL(href, location.href).href : (item?.textContent || '').trim().slice(0, 80);
        },
        sanitizeSnapshotItem(item) {
            if (!item) return null;
            const clone = item.cloneNode(true);
            clone.querySelectorAll('.emby-badge, .emby-btn, .emby-button-group, .emby-javlibrary-list-badge, .jav-card-quick-actions, .jav-list-preview-btn').forEach(el => el.remove());
            clone.querySelectorAll('a[href]').forEach(anchor => {
                anchor.querySelectorAll('a[href]').forEach(child => child.replaceWith(...child.childNodes));
            });
            return clone;
        },
        restoreSnapshot(config) {
            const snapshot = this.readSnapshot(config);
            if (!snapshot?.items?.length) return false;
            const liveKeys = new Set([...config.container.querySelectorAll(config.itemSelector)]
                .map(item => this.itemKey(item))
                .filter(Boolean));
            const frag = document.createDocumentFragment();
            let restored = 0;
            snapshot.items.forEach(html => {
                const tpl = document.createElement('template');
                tpl.innerHTML = html;
                const item = tpl.content.firstElementChild;
                const key = this.itemKey(item);
                if (!item || !key || liveKeys.has(key)) return;
                liveKeys.add(key);
                item.dataset.laosijiInfiniteItem = '1';
                item = this.sanitizeSnapshotItem(item) || item;
                SiteManager.decorateInfiniteScrollItem(config.site, item);
                frag.appendChild(item);
                restored += 1;
            });
            if (!restored) return false;
            config.container.appendChild(frag);
            snapshot.items.forEach(html => {
                const tpl = document.createElement('template');
                tpl.innerHTML = html;
                const item = tpl.content.firstElementChild;
                const key = this.itemKey(item);
                if (key) config.seen.add(key);
            });
            if (snapshot.nextUrl) config.nextUrl = snapshot.nextUrl;
            config.restoredScrollY = Number(snapshot.scrollY) || 0;
            this.hidePagination();
            return true;
        },
        saveSnapshot() {
            if (!this.state?.container) return;
            const key = this.cacheKey();
            if (!key) return;
            const allItems = [...this.state.container.querySelectorAll(this.state.itemSelector)];
            const items = allItems
                .filter(item => item.dataset.laosijiInfiniteItem === '1')
                .slice(-this.maxSnapshotItems)
                .map(item => this.sanitizeSnapshotItem(item)?.outerHTML || item.outerHTML);
            const payload = {
                site: this.state.site,
                nextUrl: this.state.nextUrl || '',
                done: !!this.state.done,
                scrollY: window.scrollY || 0,
                items,
                savedAt: Date.now(),
            };
            try {
                sessionStorage.setItem(key, JSON.stringify(payload));
            } catch (err) {
                errorLog('瀑布流快照保存失败:', err);
            }
        },
        scheduleSnapshotSave() {
            if (!this.state) return;
            clearTimeout(this.snapshotTimer);
            this.snapshotTimer = setTimeout(() => this.saveSnapshot(), 180);
        },
        rememberScroll() {
            const snapshot = this.readSnapshot();
            if (!snapshot) return;
            snapshot.scrollY = window.scrollY || 0;
            snapshot.savedAt = Date.now();
            try {
                sessionStorage.setItem(this.cacheKey(), JSON.stringify(snapshot));
            } catch {
            }
        },
        restoreScroll() {
            const y = Number(this.state?.restoredScrollY) || 0;
            if (y <= 0) return;
            setTimeout(() => window.scrollTo(window.scrollX || 0, y), 0);
            setTimeout(() => window.scrollTo(window.scrollX || 0, y), 120);
        },
        createSentinel() {
            const sentinel = document.createElement('div');
            sentinel.className = 'jav-infinite-sentinel';
            sentinel.textContent = '继续滚动加载下一页';
            sentinel.addEventListener('click', () => {
                if (sentinel.classList.contains('is-error')) this.loadNext();
            });
            this.state.sentinel = sentinel;
            this.state.container.insertAdjacentElement('afterend', sentinel);
        },
        observe() {
            this.state.observer = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) this.loadNext();
            }, { rootMargin: '900px 0px' });
            this.state.observer.observe(this.state.sentinel);
        },
        hidePagination() {
            document.querySelectorAll('#next, .pagination, nav.pagination').forEach(el => {
                el.style.display = 'none';
            });
        },
        setStatus(text, className = '') {
            const sentinel = this.state?.sentinel;
            if (!sentinel) return;
            sentinel.className = `jav-infinite-sentinel ${className}`.trim();
            sentinel.textContent = text;
        },
        async fetchDoc(url) {
            const r = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    timeout: 20000,
                    onload: resolve,
                    onerror: () => reject(new Error('加载失败')),
                    ontimeout: () => reject(new Error('加载超时')),
                });
            });
            return new DOMParser().parseFromString(r.responseText, 'text/html');
        },
        appendItems(doc) {
            const items = [...doc.querySelectorAll(this.state.itemSelector)];
            let container = this.state.container;
            const live = SiteManager.getInfiniteScrollContainer(this.state.site);
            if (live) container = this.state.container = live;
            let added = 0;
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
                    SiteManager.decorateInfiniteScrollItem(this.state.site, adopted);
                    added += 1;
                } catch (err) {
                    errorLog('追加单项失败:', err);
                }
            });
            return added;
        },
        async loadNext() {
            if (!this.state || this.state.loading || this.state.done || !this.state.nextUrl) return;
            this.state.loading = true;
            this.setStatus('正在加载下一页...', 'is-loading');
            try {
                const currentUrl = this.state.nextUrl;
                const doc = await this.fetchDoc(currentUrl);
                if (!this.state) return;
                const added = this.appendItems(doc);
                const nextConfig = this.getConfig(doc, currentUrl);
                if (!this.state) return;
                const resolvedNext = nextConfig?.nextUrl || '';
                this.state.nextUrl = (resolvedNext && resolvedNext !== currentUrl) ? resolvedNext : '';
                this.hidePagination();
                this.reflow();
                Runtime.refreshListDecorations();
                this.saveSnapshot();
                setTimeout(() => {
                    Runtime.refreshListPage();
                }, 80);
                this.state.emptyStreak = added ? 0 : (this.state.emptyStreak + 1);
                if (!this.state.nextUrl || this.state.emptyStreak >= 3) {
                    this.state.done = true;
                    this.state.observer?.disconnect();
                    this.setStatus('已经到底了', 'is-done');
                    this.saveSnapshot();
                } else {
                    this.setStatus('继续滚动加载下一页');
                }
            } catch (err) {
                errorLog('瀑布流加载失败:', err);
                this.setStatus('加载失败，点击重试', 'is-error');
            } finally {
                if (this.state) this.state.loading = false;
            }
        },
        reflow() {
            try {
                this.state.container = SiteManager.reflowInfiniteScroll(this.state.site, this.state.container);
            } catch (err) {
                errorLog('瀑布流重排失败:', err);
            }
            window.dispatchEvent(new Event('resize'));
        },
    };
    Core.expose('__LAOSIJI_INFINITE_SCROLL__', InfiniteScroll);
    let pan115ListTimer = null;
    function schedulePan115ListBadges() {
        if (!Pan115.enabled() || SiteManager.isDetailPage()) return;
        clearTimeout(pan115ListTimer);
        pan115ListTimer = setTimeout(renderPan115ListBadges, 300);
    }
    Core.expose('__LAOSIJI_SCHEDULE_PAN115__', schedulePan115ListBadges);
    Core.expose('__LAOSIJI_RENDER_BUTTONS__', () => JumpButtons.render());
    const Runtime = {
        refresh(options = {}) {
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
            if (stillsGallery) StillsGallery.sync();
            if (coverHoverPreview) CoverHoverPreview.sync();
            if (pan115) schedulePan115ListBadges();
            if (infiniteScroll) InfiniteScroll.init();
            if (titleTranslate) TitleTranslate.sync();
        },
        refreshListPage() {
            this.refresh({ detailPreview: false, infiniteScroll: false });
        },
        refreshListDecorations() {
            if (SiteJavDB.match()) {
                SiteJavDB._stripNativeLayoutParam();
                document.querySelectorAll('.movie-list, .movies, .grid').forEach(list => SiteJavDB._neutralizeNativeListLayout(list));
                SiteJavDB._hideNativeLayoutSwitcher();
            }
            ListPreview.sync();
            ListOpenNewTab.sync();
            PortraitCards.apply();
            CoverHoverPreview.sync();
            schedulePan115ListBadges();
        },
        syncPan115(enabled = Pan115.enabled()) {
            syncPan115AfterSettingsSave(enabled);
        },
        syncInfiniteScroll(enabled = CFG.infiniteScroll) {
            if (enabled) {
                InfiniteScroll.init();
            } else {
                InfiniteScroll.destroy();
            }
        },
        syncListPreview() {
            ListPreview.sync();
        },
        syncCoverHoverPreview() {
            CoverHoverPreview.sync();
        },
        syncDetailPreview() {
            DetailPreviewInline.sync();
        },
        syncTitleTranslate() {
            TitleTranslate.sync();
        },
        syncListOpenNewTab() {
            ListOpenNewTab.sync();
        },
        syncPortraitCards(enabled = CFG.portraitCards) {
            PortraitCards.set(enabled);
            ListPreview.sync();
        },
        syncCardFx(enabled = CFG.cardFx) {
            CardFx.apply(enabled);
        },
    };
    Core.expose('__LAOSIJI_RUNTIME__', Runtime);
    const CardFx = (() => {
        function ensureStyle() {
            injectStyle('jav-card-fx-style', `html[data-laosiji-card-fx="off"] .jav-card{transition:none!important;will-change:auto!important;transform:none!important}html[data-laosiji-card-fx="off"] .jav-card:hover{transform:none!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important;border-color:rgba(148,163,184,.35)!important}.jav-card{content-visibility:auto;contain-intrinsic-size:auto 320px}.jav-card-cover .jav-card-image{transition:opacity .18s ease!important;transform:none!important;will-change:auto!important}html[data-laosiji-card-fx="off"] .jav-card-cover .jav-card-image{transition:transform .22s ease,opacity .18s ease!important}html[data-laosiji-card-fx="off"] .jav-card-cover:hover .jav-card-image,html[data-laosiji-card-fx="off"] .jav-card-link:hover .jav-card-image,html[data-laosiji-card-fx="off"] .jav-card:hover .jav-card-image{transform:scale(1.06)!important}html:not([data-laosiji-card-fx="off"]) .jav-card-cover:hover .jav-card-image,html:not([data-laosiji-card-fx="off"]) .jav-card-link:hover .jav-card-image,html:not([data-laosiji-card-fx="off"]) .jav-card:hover .jav-card-image,html:not([data-laosiji-card-fx="off"]) .movie-list .javdb-grid-card .box:hover .cover img,html:not([data-laosiji-card-fx="off"]) .movies .javdb-grid-card .box:hover .cover img,html:not([data-laosiji-card-fx="off"]) .grid .javdb-grid-card .box:hover .cover img{transform:none!important}`);
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
        document.querySelectorAll('h1[data-enhanced="1"]').forEach(el => delete el.dataset.enhanced);
    }
    let mutationSyncTimer = null;
    const runIdle = window.requestIdleCallback
        ? (fn) => window.requestIdleCallback(fn, { timeout: 600 })
        : (fn) => setTimeout(fn, 0);
    const isOwnNode = (node) => {
        if (!node || node.nodeType !== 1) return false;
        try {
            return !!(node.matches?.('[class*="jav-"],[class*="laosiji"],[data-laosiji-grid-card],[data-laosiji-jump]')
                || node.closest?.('[class*="jav-"],[data-laosiji-grid-card]'));
        } catch (e) {
            return false;
        }
    };
    const hasMeaningfulMutation = (records) => {
        try {
            return records.some(r => {
                for (const n of r.addedNodes) { if (!isOwnNode(n)) return true; }
                for (const n of r.removedNodes) { if (!isOwnNode(n)) return true; }
                return false;
            });
        } catch (e) {
            return true;
        }
    };
    const observer = new MutationObserver((records) => {
        if (!hasMeaningfulMutation(records)) return;
        clearTimeout(mutationSyncTimer);
        mutationSyncTimer = setTimeout(() => {
            runIdle(() => Runtime.refresh());
        }, 350);
    });
    let lastEmbyLoc = location.href;
    function embyButtonsPresent() {
        const g = document.querySelector('.jav-jump-btn-group[data-laosiji-jump="1"]');
        return !!(g && g.isConnected);
    }
    let embyRetryTimers = [];
    function clearEmbyRetries() {
        embyRetryTimers.forEach(t => clearTimeout(t));
        embyRetryTimers = [];
    }
    function embyRenderWithRetry() {
        clearEmbyRetries();
        const delays = [0, 80, 200, 400, 700, 1100, 1700, 2500, 3500, 5000, 6500];
        delays.forEach(d => {
            embyRetryTimers.push(setTimeout(() => {
                JumpButtons.render();
                if (embyButtonsPresent()) clearEmbyRetries();
            }, d));
        });
    }
    function onEmbyNavigate() {
        if (location.href === lastEmbyLoc) return;
        lastEmbyLoc = location.href;
        const isEmby = SiteManager.isEmbyPage();
        if (isEmby) {
            resetEmbyButtonState();
            embyRenderWithRetry();
        } else {
            JumpButtons.render();
        }
    }
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
            window.addEventListener('pagehide', () => InfiniteScroll.saveSnapshot());
            window.addEventListener('beforeunload', () => InfiniteScroll.saveSnapshot());
            window.addEventListener('pageshow', e => {
                if (e.persisted) setTimeout(() => InfiniteScroll.init(), 0);
            });
            window.addEventListener('hashchange', onEmbyNavigate);
            window.addEventListener('popstate', onEmbyNavigate);
            (function hookHistory() {
                const wrap = (type) => {
                    const orig = history[type];
                    if (typeof orig !== 'function') return;
                    history[type] = function () {
                        const ret = orig.apply(this, arguments);
                        setTimeout(onEmbyNavigate, 0);
                        return ret;
                    };
                };
                wrap('pushState');
                wrap('replaceState');
            })();
        },
        init() {
            if (this.started) return;
            this.started = true;
            CardFx.apply();
            Trailer.installFallbackDebugHelper();
            this.initRuntimeObserver();
            this.initNavigationHooks();
            SiteManager.setupJavDbGuards();
            if (location.hostname.includes('javdb') && location.pathname.startsWith('/v/')) {
                setTimeout(mainRun, 600);
            } else {
                mainRun();
            }
            if (SiteManager.isEmbyPage()) {
                embyRenderWithRetry();
                Runtime.refresh({ jump: false });
            } else {
                Runtime.refresh();
                [600, 1500, 3000].forEach(d => setTimeout(() => Runtime.refresh(), d));
            }
        },
    };
    Core.expose('__LAOSIJI_APP__', App);
    App.init();
})();
