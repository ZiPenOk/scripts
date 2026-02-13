// ==UserScript==
// @name         Emby 页面增强
// @namespace    https://github.com/ZiPenOk
// @version      5.1
// @description  给emby页面增加番号跳转按钮,以及预览图功能,自动区分有码/无码路径，支持标准、FC2、下划线、日期番号。
// @author       ZiPenOk
// @match        *://10.10.10.*:*/web/index.html*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/emby_enhance.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/emby_enhance.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG_OPTIONS = [
        { id: 'JavBus', label: '显示 JavBus 按钮', color: '#007bff' },
        { id: 'JavDB',  label: '显示 JavDB 按钮',  color: '#6f42c1' },
        { id: 'Nyaa',   label: '显示 Nyaa 按钮',   color: '#17a2b8' },
        { id: 'Google', label: '显示 Google 按钮', color: '#ea4335' },
        { id: 'Preview', label: '显示预览图按钮',  color: '#28a745' }
    ];

    const BUTTON_URLS = {
        JavBus: (code) => {
            // === 核心：有码/无码自动路径切换 ===
            // 逻辑：如果是 日期_编号 (如 013123_001) 或 日期-编号 (如 122725-001)
            // 通常属于加勒比或一本道，在 JavBus 属于无码类目
            const isUncensored = /^\d{6}[-_\s]\d{3}$/.test(code) || code.toLowerCase().startsWith('n') || code.toLowerCase().startsWith('k');

            if (isUncensored) {
                return `https://www.javbus.com/uncensored/search/${encodeURIComponent(code)}&type=1`;
            }
            // 其他标准格式走常规搜索
            return `https://www.javbus.com/search/${encodeURIComponent(code)}&type=&parent=ce`;
        },
        JavDB:  (code) => `https://javdb.com/search?q=${encodeURIComponent(code)}`,
        Nyaa:   (code) => `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(code)}`,
        Google: (code) => `https://www.google.com/search?q=${encodeURIComponent(code)}`
    };

    GM_addStyle(`
        #emby-config-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2147483647; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); font-family: sans-serif; }
        .emby-config-modal { background: #2d2d2d; border: 1px solid #444; border-radius: 12px; width: 320px; padding: 25px; color: white; box-shadow: 0 10px 50px rgba(0,0,0,0.9); }
        .emby-config-header { font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #00a4dc; border-bottom: 1px solid #444; padding-bottom: 12px; }
        .emby-config-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; cursor: pointer; user-select: none; }
        .emby-config-item input { width: 18px; height: 18px; cursor: pointer; }
        .emby-config-footer { margin-top: 25px; display: flex; gap: 12px; }
        .emby-config-btn { flex: 1; padding: 10px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; font-size: 14px; }
        .emby-config-save { background: #00a4dc; color: white; }
        .emby-config-cancel { background: #444; color: #ccc; }

        /* --- 修复后的预览图样式 --- */
        .preview-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            z-index: 2147483647;
            display: flex; /* 保持 Flex */
            overflow: auto; /* 允许滚动 */
            cursor: zoom-out;
            backdrop-filter: blur(5px);
            /* 关键修改：去掉了 align-items: center 和 justify-content: center */
        }

        .preview-img {
            border-radius: 4px;
            margin: auto; /* 关键修改：使用 auto margin 实现安全居中 */
            cursor: zoom-in;
            max-width: 95vw; /* 默认显示时稍微大一点 */
            max-height: 95vh;
            object-fit: contain;
            display: block;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }

        .preview-img.zoomed {
            max-width: none; /* 移除宽度限制 */
            max-height: none; /* 移除高度限制 */
            cursor: zoom-out;
            /* 移除 transform: scale(1)，因为它不影响布局流，导致滚动条不正常 */
        }
    `);

    // --- 配置面板 ---
    function showConfigPanel() {
        if (document.getElementById('emby-config-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'emby-config-overlay';
        let itemsHtml = CONFIG_OPTIONS.map(opt => `
            <label class="emby-config-item"><span>${opt.label}</span>
            <input type="checkbox" id="cfg-${opt.id}" ${GM_getValue('enable_'+opt.id, true) ? 'checked' : ''}></label>
        `).join('');
        overlay.innerHTML = `<div class="emby-config-modal"><div class="emby-config-header">脚本配置中心</div>
            <div class="emby-config-body">${itemsHtml}</div>
            <div class="emby-config-footer"><button class="emby-config-btn emby-config-cancel" id="emby-cfg-cancel">取消</button>
            <button class="emby-config-btn emby-config-save" id="emby-cfg-save">保存设置</button></div></div>`;
        document.body.appendChild(overlay);
        document.getElementById('emby-cfg-save').onclick = () => {
            CONFIG_OPTIONS.forEach(opt => GM_setValue('enable_' + opt.id, document.getElementById(`cfg-${opt.id}`).checked));
            overlay.remove(); scanPage(true);
        };
        document.getElementById('emby-cfg-cancel').onclick = () => overlay.remove();
    }
    GM_registerMenuCommand("⚙️ 脚本配置中心", showConfigPanel);

    // --- 预览图逻辑 ---
    function showOverlay(imgUrl) {
        const container = document.createElement('div');
        container.className = 'preview-overlay';
        const img = document.createElement('img');
        img.className = 'preview-img';
        img.src = imgUrl;
        img.onclick = (e) => {
            e.stopPropagation();
            if (img.classList.contains('zoomed')) img.classList.remove('zoomed');
            else img.classList.add('zoomed');
        };
        container.onclick = () => container.remove();
        container.appendChild(img);
        document.body.appendChild(container);
    }

    async function request(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url, timeout: 15000,
                onload: (res) => (res.status === 200) ? resolve(res.responseText) : reject(),
                onerror: reject
            });
        });
    }

    const ReqThumbnail = {
        async javfree(code) {
            try {
                const searchHtml = await request(`https://javfree.me/search/${code}`);
                const doc = new DOMParser().parseFromString(searchHtml, 'text/html');
                const link = doc.querySelector('.entry-title>a')?.href;
                if (!link) return null;
                const detailHtml = await request(link);
                const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
                const imgs = detailDoc.querySelectorAll('p>img');
                return imgs?.[1]?.src || imgs?.[0]?.src || null;
            } catch (e) { return null; }
        }
    };

    // --- 核心处理逻辑 ---
    function processTitle(titleElem, force = false) {
        if (window.location.href.includes('videoosd.html')) {
            const oldBox = titleElem.parentNode.querySelector('.search-buttons');
            if (oldBox) oldBox.remove();
            return;
        }
        if (!titleElem.offsetParent) return;

        const text = titleElem.textContent.trim();
        let code = null;

        const fc2Match = text.match(/FC2[-\s_]?(?:PPV)?[-\s_]?(\d{6,9})/i);
        if (fc2Match) {
            code = `FC2-PPV-${fc2Match[1]}`;
        } else {
            const standardMatch = text.match(/([a-zA-Z0-9]{2,15})([-\s_])(\d{2,10})/i);
            if (standardMatch) {
                const prefix = standardMatch[1].toUpperCase();
                const separator = standardMatch[2];
                const suffix = standardMatch[3];
                const ignoreList = ['FULLHD', 'H264', 'H265', '1080P', '720P', 'PART', 'DISC', '10BIT'];
                if (!ignoreList.includes(prefix)) {
                    code = `${prefix}${separator}${suffix}`;
                }
            }
        }

        if (!code) return;

        let btnBox = titleElem.parentNode.querySelector('.search-buttons');
        if (!btnBox) {
            btnBox = document.createElement('div');
            btnBox.className = 'search-buttons';
            btnBox.style = "margin-top:10px; display:flex; flex-wrap:wrap; gap:8px;";
            titleElem.parentNode.insertBefore(btnBox, titleElem.nextSibling);
        }

        if (!force && btnBox.dataset.code === code) return;
        btnBox.innerHTML = '';
        btnBox.dataset.code = code;

        CONFIG_OPTIONS.forEach(opt => {
            if (!GM_getValue('enable_' + opt.id, true)) return;
            const btn = document.createElement('a');
            btn.style = `padding:6px 12px; background:${opt.color}; color:#fff; border-radius:4px; text-decoration:none; font-size:13px; font-weight:bold; cursor:pointer;`;
            btn.textContent = (opt.id === 'Preview' ? '预览图' : opt.id);

            if (opt.id === 'Preview') {
                btn.onclick = async (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const oldText = btn.textContent;
                    btn.textContent = '⏳...';
                    const url = await ReqThumbnail.javfree(code);
                    if (url) showOverlay(url); else alert('未找到预览图: ' + code);
                    btn.textContent = oldText;
                };
            } else {
                btn.href = BUTTON_URLS[opt.id](code);
                btn.target = '_blank';
                btn.onclick = e => e.stopPropagation();
            }
            btnBox.appendChild(btn);
        });
    }

    function scanPage(force = false) {
        document.querySelectorAll('h1').forEach(h1 => processTitle(h1, force));
    }

    setInterval(() => scanPage(), 1000);
    const observer = new MutationObserver(() => scanPage());
    observer.observe(document.body, { childList: true, subtree: true });
})();