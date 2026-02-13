// ==UserScript==
// @name         M3U8 视频嗅探下载 + MediaGo 投喂
// @namespace    https://github.com/ZiPenOk
// @version      3.0.0
// @description  严格保持 1.js 原始 UI 布局。增加：1.番号正则提取；2.投喂失败详细检测；3.UI 越界找回。
// @author       ZiPenOk
// @match        *://*/*
// @allframes    true
// @run-at       document-start
// @license      MIT
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @supportURL   https://github.com/ZiPenOk/scripts/issues
// @homepageURL  https://github.com/ZiPenOk/scripts
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/m3u8_download.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/m3u8_download.js
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. 变量 ---
    let MEDIAGO_URL = GM_getValue('mediago_url', '');
    let theme = GM_getValue('theme', 'dark');
    let mode = GM_getValue('mode', 'api');
    let target = GM_getValue('target', 'nas');
    let folderType = GM_getValue('folder_type', 'domain');
    let counter = GM_getValue('counter', {});
    let isMinimized = true;
    let savedPos = GM_getValue('panel_pos', { top: '20px', left: 'auto', right: '20px' });
    let uiInitialized = false;

    let detectedUrls = new Set();
    let memoryVault = [];
    let panel = null;
    let gearIcon = null;

    const isBiliPage = location.hostname.includes('bilibili.com');

    // --- 2. 增强网络请求函数 ---
    function requestMediaGo(url, data) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                headers: { "Content-Type": "application/json", "accept": "application/json" },
                data: JSON.stringify(data),
                timeout: 10000,
                onload: res => {
                    if (res.status >= 200 && res.status < 300) {
                        resolve(res);
                    } else {
                        const err = `投喂失败: 服务器返回代码 ${res.status}`;
                        alert(err);
                        reject(new Error(err));
                    }
                },
                onerror: () => {
                    const err = "投喂失败: 无法连接服务器。\n请检查：Docker是否启动或地址是否填错。";
                    alert(err);
                    reject(new Error(err));
                },
                ontimeout: () => {
                    alert("投喂超时，请检查网络连接！");
                    reject(new Error("超时"));
                }
            });
        });
    }

    // --- 3. 番号提取与命名 ---
    function getCleanName(customTitle) {
        const bodyText = document.body.innerText;
        const match = bodyText.match(/[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*-\d+/i);
        const prefix = match ? `[${match[0].toUpperCase()}] ` : "";

        let rawTitle = (customTitle || document.title).split('｜')[0].split('|')[0].split('_')[0].trim();
        let base = (prefix + rawTitle).replace(/[\\/:\*\?"<>\|]/g, "_").trim();

        if(!counter[base]) counter[base] = 0;
        counter[base]++;
        GM_setValue('counter', counter);

        return `${base.substring(0,60)}_${counter[base]}_${new Date().getTime().toString().slice(-4)}`;
    }

    // --- 4. UI (防止面板在不同屏幕下消失) ---
    function ensureInViewport(el) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.left > window.innerWidth || rect.top > window.innerHeight || (rect.left + rect.width < 0) || (rect.top + rect.height < 0)) {
            el.style.left = 'auto'; el.style.right = '20px'; el.style.top = '20px';
            GM_setValue('panel_pos', { top: '20px', left: 'auto', right: '20px' });
        }
    }

    // --- 5. 嗅探逻辑 ---
    function getResTag(u) {
        u=u.toLowerCase();
        if(u.includes('8k') || u.includes('4320')) return '<span style="color:#ffa502;font-weight:bold;">[👑 8K]</span> ';
        if(u.includes('4k') || u.includes('2160')) return '<span style="color:#ff4757;font-weight:bold;">[💎 4K]</span> ';
        if(u.includes('1080') || u.includes('1920')) return '<span style="color:#e67e22;font-weight:bold;">[🔥 1080P]</span> ';
        if(u.includes('720')) return '<span style="color:#2ed573;font-weight:bold;">[🎬 720P]</span> ';
        return '';
    }

    function addUrl(url, customTitle = null, isBiliBatch = false) {
        if (typeof url !== 'string') return;
        const fingerprint = url.split('?')[0];
        if (detectedUrls.has(fingerprint)) return;
        if (!isBiliBatch && !/\.m3u8(\?|$)/i.test(url)) return;
        if (!isBiliBatch && url.includes('fragment') && (url.includes('.ts') || url.includes('seg-'))) return;

        if (window.self !== window.top) {
            window.top.postMessage({ type: 'VIDEO_MSG_V256', url, customTitle, isBiliBatch }, '*');
            return;
        }
        detectedUrls.add(fingerprint);
        memoryVault.push({ url, customTitle, isBiliBatch });
        if (!uiInitialized) {
            uiInitialized = true;
            if (isMinimized) createGear(); else createPanel();
        }
        if (panel) renderSingleItem({ url, customTitle, isBiliBatch });
    }

    function renderSingleItem(item) {
        const list = document.getElementById('m3u8-list');
        if (!list) return;
        const li = document.createElement('li');
        li.className = 'm3u8-item';
        let tag = item.isBiliBatch ? '<span style="color:#fb7299;font-weight:bold;">[🎬 选集]</span> ' : getResTag(item.url);
        const name = item.customTitle ? `${tag}${item.customTitle}` : `${tag}${item.url.split('?')[0].substring(0, 55)}...`;

        li.innerHTML = `<input type="checkbox" class="checkbox" data-url="${item.url}" data-title="${item.customTitle || ''}"><div class="url-content"><div class="url-text" title="${item.url}">${name}</div><button class="single-send">${target==='nas'?'投喂docker':'投喂本地'}</button></div>`;
        li.onclick = (e) => { if (e.target.tagName !== 'BUTTON') { const cb = li.querySelector('.checkbox'); cb.checked = !cb.checked; li.classList.toggle('selected', cb.checked); isBiliPage ? updateBiliBtnText() : updateBatchBtnText(); } };
        list.prepend(li);
        li.querySelector('.single-send').onclick = (e) => { e.stopPropagation(); sendTask(item.url, e.target, item.customTitle, item.isBiliBatch); };
    }

    // --- 6. UI 面板  ---
    function createPanel() {
        if (document.getElementById('mediago-panel')) return;
        if (gearIcon) { gearIcon.remove(); gearIcon = null; }
        panel = document.createElement('div');
        panel.id = 'mediago-panel';
        panel.className = theme;
        applyPos(panel);
        panel.innerHTML = `
            <div id="p-header"><span id="min-btn" style="cursor:pointer;margin-right:8px;">➖</span>🔍 m3u8资源嗅探器 <span id="theme-toggle" style="float:right;cursor:pointer;margin-left:12px;">🌓</span><span id="set-btn" style="float:right;cursor:pointer;">⚙️</span></div>
            <div class="top-bar">
                <button id="sel-all">全选</button>
                ${isBiliPage ? '<button id="scan-bili" style="background:#e67e22 !important;">🔍 扫描可见选集</button><button id="bili-main-btn" style="background:#fb7299 !important;">🚀 投喂b站直链</button>' : '<button id="batch-btn" style="background:#fd7e14 !important;">🚀 一键投喂</button>'}
            </div>
            <ul id="m3u8-list"></ul>
            <div id="p-footer">
                <div class="ctrl-row">目标: <label><input type="radio" name="target" value="nas" ${target==='nas'?'checked':''}> docker</label> <label><input type="radio" name="target" value="local" ${target==='local'?'checked':''}> 本地</label> <span style="margin:0 5px;opacity:0.3">|</span> 模式: <label><input type="radio" name="mode" value="api" ${mode==='api'?'checked':''}> API</label> <label><input type="radio" name="mode" value="url" ${mode==='url'?'checked':''}> URL</label></div>
                <div class="ctrl-row">归类: <label><input type="radio" name="folder" value="domain" ${folderType==='domain'?'checked':''}> 域名文件夹</label> <label><input type="radio" name="folder" value="default" ${folderType==='default'?'checked':''}> 默认根目录</label></div>
                <div class="tutorial-box"><a href="https://blog.zhecydn.asia/archives/1962" target="_blank" class="mg-blog-link">📖 脚本使用教程</a></div>
            </div>`;
        (document.body || document.documentElement).appendChild(panel);
        memoryVault.forEach(item => renderSingleItem(item));
        setupEvents(panel);
        ensureInViewport(panel);
    }

    function createGear() {
        if (document.getElementById('mediago-gear')) return;
        if (panel) { panel.remove(); panel = null; }
        gearIcon = document.createElement('div');
        gearIcon.id = 'mediago-gear';
        gearIcon.innerHTML = '⚙️';
        applyPos(gearIcon);
        (document.body || document.documentElement).appendChild(gearIcon);
        setupEvents(gearIcon);
        ensureInViewport(gearIcon);
    }

    function toggleMin(toMin) {
        isMinimized = toMin;
        GM_setValue('is_minimized', isMinimized);
        if (isMinimized) createGear(); else createPanel();
    }

    // --- 7. 交互逻辑  ---
    function setupEvents(el) {
        if (el.id === 'mediago-panel') {
            document.getElementById('min-btn').onclick = () => toggleMin(true);
            document.getElementById('theme-toggle').onclick = () => { theme=(theme==='dark'?'light':'dark'); GM_setValue('theme', theme); panel.className=theme; };
            document.getElementById('set-btn').onclick = () => { let u=prompt('mediago docker地址:', MEDIAGO_URL); if(u){ MEDIAGO_URL=u.trim().replace(/\/+$/, ''); GM_setValue('mediago_url', MEDIAGO_URL); } };
            document.getElementById('sel-all').onclick = () => {
                const cbs = panel.querySelectorAll('.checkbox'), all = Array.from(cbs).every(c => c.checked);
                cbs.forEach(c => { c.checked = !all; c.closest('.m3u8-item').classList.toggle('selected', !all); });
                isBiliPage ? updateBiliBtnText() : updateBatchBtnText();
            };
            panel.querySelectorAll('input[name="target"]').forEach(r => r.onchange = e => { target=e.target.value; GM_setValue('target', target); updateBtnLabels(); });
            panel.querySelectorAll('input[name="mode"]').forEach(r => r.onchange = e => { mode=e.target.value; GM_setValue('mode', mode); });
            panel.querySelectorAll('input[name="folder"]').forEach(r => r.onchange = e => { folderType=e.target.value; GM_setValue('folder_type', folderType); });
        }

        let isDrag = false, startX, startY, ox, oy;
        const dragHeader = el.id==='mediago-panel' ? document.getElementById('p-header') : el;

        dragHeader.onmousedown = e => {
            if(e.target.tagName==='SPAN' || e.target.tagName==='INPUT' || e.target.tagName==='LABEL') return;
            isDrag = false; startX = e.clientX; startY = e.clientY;
            ox = e.clientX - el.offsetLeft; oy = e.clientY - el.offsetTop;
            document.onmousemove = moveE => {
                if (Math.abs(moveE.clientX - startX) > 5 || Math.abs(moveE.clientY - startY) > 5) {
                    isDrag = true;
                    el.style.left = (moveE.clientX - ox) + 'px'; el.style.top = (moveE.clientY - oy) + 'px'; el.style.right = 'auto';
                }
            };
            document.onmouseup = () => {
                document.onmousemove = null; document.onmouseup = null;
                if (isDrag) {
                    savedPos = { top: el.style.top, left: el.style.left, right: 'auto' };
                    GM_setValue('panel_pos', savedPos);
                } else if (el.id === 'mediago-gear') {
                    toggleMin(false);
                }
            };
        };
    }

    function applyPos(el) { el.style.top = savedPos.top; el.style.left = savedPos.left; el.style.right = savedPos.right; }
    function updateBtnLabels() { document.querySelectorAll('.single-send').forEach(b => b.innerText = target==='nas'?'投喂docker':'投喂本地'); }
    function updateBiliBtnText() { const btn=document.getElementById('bili-main-btn'); if(btn){ const n=panel.querySelectorAll('.checkbox:checked').length; btn.innerText=n>0?`🚀 投喂 ${n} 个` : `🚀 投喂b站直链`; } }
    function updateBatchBtnText() { const btn=document.getElementById('batch-btn'); if(btn){ const n=panel.querySelectorAll('.checkbox:checked').length; btn.innerText=n>0?`🚀 投喂 ${n} 个` : `🚀 一键投喂`; } }

    async function sendTask(url, btn, customTitle = null, forceBili = false) {
        const isBili = forceBili || url.includes('bilibili.com');
        const finalType = isBili ? 'bilibili' : 'm3u8';
        const finalName = getCleanName(customTitle);
        const folder = folderType === 'domain' ? location.hostname.split('.')[0] : '';

        if (btn) { btn.innerText = "⏳ 投喂中..."; btn.style.background = "#f1c40f"; btn.style.pointerEvents = "none"; }

        try {
            if (target === 'local') {
                window.open(`mediago://index.html/?n=true&name=${encodeURIComponent(finalName)}&url=${encodeURIComponent(url)}&type=${finalType}&silent=true${folder?'&folder='+folder:''}`, '_blank');
            } else {
                if (!MEDIAGO_URL) throw new Error("未设置地址");
                await requestMediaGo(`${MEDIAGO_URL}/api/download-now`, { name: finalName, url, type: finalType, folder });
            }
            if (btn) { btn.innerText = "✅ 已成功投喂"; btn.style.background = "#27ae60"; }
        } catch (e) {
            if (btn) { btn.innerText = "❌ 失败"; btn.style.background = "#e74c3c"; btn.style.pointerEvents = "auto"; }
        }
    }

    // --- 8. 样式  ---
    GM_addStyle(`
        #mediago-panel { position: fixed !important; width: 380px !important; z-index: 2147483647 !important; border-radius: 12px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important; display: flex !important; flex-direction: column !important; padding: 10px !important; font-family: sans-serif !important; border: 1px solid rgba(128,128,128,0.3) !important; font-size: 13px !important; }
        #mediago-panel.dark { background: rgba(30,30,30,0.95) !important; color: #fff !important; }
        #mediago-panel.light { background: rgba(255,255,255,0.98) !important; color: #111 !important; }
        #mediago-gear { position: fixed !important; width: 42px !important; height: 42px !important; background: rgba(30,30,30,0.9) !important; color: #fb7299 !important; border-radius: 50% !important; z-index: 2147483647 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; font-size: 24px !important; box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important; border: 1px solid rgba(251,114,153,0.4) !important; }
        #p-header { cursor: move !important; padding: 8px !important; background: rgba(128,128,128,0.2) !important; border-radius: 8px !important; font-weight: bold !important; font-size: 13px !important; margin-bottom: 6px !important; }
        .top-bar { display: flex !important; gap: 4px !important; margin-bottom: 8px !important; }
        .top-bar button { flex: 1 !important; padding: 6px 2px !important; border: none !important; border-radius: 6px !important; cursor: pointer !important; font-size: 11px !important; font-weight: bold !important; color: #fff !important; background: #555 !important; }
        #m3u8-list { list-style: none !important; padding: 0 !important; margin: 0 !important; overflow-y: auto !important; flex: 1 !important; max-height: 350px !important; }
        .m3u8-item { display: flex !important; align-items: center !important; padding: 8px !important; background: rgba(128,128,128,0.1) !important; margin-bottom: 4px !important; border-radius: 8px !important; cursor: pointer !important; border-left: 4px solid #a55eea !important; }
        .url-text { font-size: 12px !important; word-break: break-all !important; line-height: 1.3 !important; }
        .url-content { display: flex; align-items: center; width: 100%; justify-content: space-between; }
        .single-send { width: 100% !important; background: #27ae60 !important; border: none !important; color: #fff !important; padding: 4px !important; border-radius: 5px !important; cursor: pointer !important; font-size: 11px !important; font-weight: bold !important; margin-top: 4px !important; transition: 0.2s !important; }
        #p-footer { border-top: 1px solid rgba(128,128,128,0.2) !important; padding-top: 8px !important; }
        .ctrl-row { display: flex !important; justify-content: center !important; align-items: center !important; gap: 6px !important; margin-bottom: 4px !important; font-size: 11px !important; }
        .tutorial-box { text-align: center !important; margin-top: 6px !important; padding-top: 4px !important; border-top: 1px dashed rgba(128,128,128,0.3) !important; }
        .mg-blog-link { color: #a55eea !important; text-decoration: none !important; font-size: 12px !important; font-weight: bold !important; }
    `);

    // --- 拦截钩子 ---
    const oX = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function(m, u) { try { addUrl(new URL(u, location.href).href); } catch(e){} return oX.apply(this, arguments); };
    const oF = window.fetch; window.fetch = function(r) { let u = typeof r === 'string' ? r : (r && r.url); if(u){ try { addUrl(new URL(u, location.href).href); } catch(e){} } return oF.apply(this, arguments); };
    window.addEventListener('message', e => { if (e.data && e.data.type === 'VIDEO_MSG_V256') addUrl(e.data.url, e.data.customTitle, e.data.isBiliBatch); });

    // 适配 动态视频
    setInterval(() => {
        document.querySelectorAll('video').forEach(v => {
            if (v.src && v.src.includes('.m3u8')) {
                addUrl(v.src, document.title);
            }
        });
    }, 3000);

    /* ======== 强制兜底捕获补丁 ======== */
    (function forceCaptureM3U8() {

        const oOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url) {
            try {
                if (typeof url === 'string' && /\.m3u8(\?|$)/i.test(url)) {
                    addUrl(new URL(url, location.href).href, document.title);
                }
            } catch (e) {}
            return oOpen.apply(this, arguments);
        };

        const oFetch = window.fetch;
        window.fetch = function (input, init) {
            try {
                const url = typeof input === 'string'
                    ? input
                    : (input && input.url);

                if (url && /\.m3u8(\?|$)/i.test(url)) {
                    addUrl(new URL(url, location.href).href, document.title);
                }
            } catch (e) {}
            return oFetch.apply(this, arguments);
        };

        const scanDom = () => {
            document.querySelectorAll('video, source, iframe, img').forEach(el => {
                const src = el.src || el.getAttribute('src');
                if (src && /\.m3u8(\?|$)/i.test(src)) {
                    addUrl(new URL(src, location.href).href, document.title);
                }
            });
        };
        scanDom();
        setInterval(scanDom, 1500);

        if (window !== window.top) {
            const rawAddUrl = window.addUrl;
            window.addUrl = function () {
                try {
                    window.top.postMessage({
                        type: '__M3U8_FORCE_RELAY__',
                        args: arguments
                    }, '*');
                } catch (e) {}
                return rawAddUrl.apply(this, arguments);
            };
        }

        window.addEventListener('message', function (e) {
            if (e.data && e.data.type === '__M3U8_FORCE_RELAY__') {
                addUrl.apply(null, e.data.args);
            }
        });

    })();

})();