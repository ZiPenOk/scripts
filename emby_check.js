// ==UserScript==
// @name         跳转到Emby播放(改)
// @namespace    https://github.com/ZiPenOk
// @version      1.0.1
// @description  👆👆👆在 ✅JavBus✅Javdb✅Sehuatang ✅supjav ✅Sukebei ✅ 169bbs 高亮emby存在的视频，并提供标注一键跳转功能
// @author       ZiPenOk
// @match        *://www.javbus.com/*
// @match        *://javdb*.com/v/*
// @match        *://javdb*.com/search?q=*
// @match        *://www.javdb.com/*
// @match        *://javdb.com/*
// @match        *://supjav.com/*
// @match        *://*.nyaa.si/view/*
// @match        *://*.nyaa.si/*
// @match        *://www.javlibrary.com/*/?v=*
// @match        *://madou.com/archives/*
// @match        *://*.madou.com/archives/*
// @match        *://javrate.com/movie/*
// @match        *://*.javrate.com/movie/*
// @match        *://javrate.com/Movie/*
// @match        *://*.javrate.com/Movie/*
// @match        *://169bbs.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// @supportURL   https://github.com/ZiPenOk/scripts/issues
// @homepageURL  https://github.com/ZiPenOk/scripts
// @icon         https://img.icons8.com/fluency/96/emby.png
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/emby_check.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/emby_check.js

// ==/UserScript==

(function () {
    'use strict';

    // 全局配置对象
    const Config = {
        get embyAPI() {
            return GM_getValue('embyAPI', '');
        },
        get embyBaseUrl() {
            return GM_getValue('embyBaseUrl', '');
        },
        get highlightColor() {
            return GM_getValue('highlightColor', '#52b54b');
        },
        get maxConcurrentRequests() {
            return GM_getValue('maxConcurrentRequests', 50);
        },

        // 徽章相关配置
        get badgeColor() {
            return GM_getValue('badgeColor', '#2ecc71');
        },
        get badgeTextColor() {
            return GM_getValue('badgeTextColor', '#fff');
        },
        get badgeSize() {
            return GM_getValue('badgeSize', 'medium'); // small, medium, large
        },

        set embyAPI(val) {
            GM_setValue('embyAPI', val);
        },
        set embyBaseUrl(val) {
            GM_setValue('embyBaseUrl', val);
        },
        set highlightColor(val) {
            GM_setValue('highlightColor', val);
        },
        set maxConcurrentRequests(val) {
            GM_setValue('maxConcurrentRequests', val);
        },

        set badgeColor(val) {
            GM_setValue('badgeColor', val);
        },
        set badgeTextColor(val) {
            GM_setValue('badgeTextColor', val);
        },
        set badgeSize(val) {
            GM_setValue('badgeSize', val);
        },

        isValid() {
            return !!this.embyAPI && !!this.embyBaseUrl;
        }
    };

    // 获取徽章尺寸样式
    function getBadgeSizeStyle() {
        switch (Config.badgeSize) {
            case 'small':
                return { fontSize: '10px', padding: '1px 4px' };
            case 'large':
                return { fontSize: '14px', padding: '3px 7px' };
            case 'medium':
            default:
                return { fontSize: '12px', padding: '2px 5px' };
        }
    }

    // 初始化 DOM 样式
    const badgeSize = getBadgeSizeStyle();

    GM_addStyle(`
        .emby-jump-settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 10000;
            width: 400px;
            max-width: 90%;
            display: none;
        }
        .emby-jump-settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .emby-jump-settings-close {
            cursor: pointer;
            font-size: 18px;
            color: #999;
        }
        .emby-jump-settings-field {
            margin-bottom: 15px;
        }
        .emby-jump-settings-field label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .emby-jump-settings-field input,
        .emby-jump-settings-field select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .emby-jump-settings-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
        }
        .emby-jump-settings-buttons button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .emby-jump-settings-save {
            background-color: #52b54b;
            color: white;
        }
        .emby-jump-settings-cancel {
            background-color: #f0f0f0;
            color: #333;
        }

        .emby-jump-status-indicator {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 9999;
            transition: opacity 0.3s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            display: flex;
            align-items: center;
            opacity: 0;
        }
        .emby-jump-status-indicator .progress {
            display: inline-block;
            margin-left: 10px;
            width: 100px;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
        }
        .emby-jump-status-indicator .progress-bar {
            height: 100%;
            background: #52b54b;
            border-radius: 3px;
            transition: width 0.3s;
        }
        .emby-jump-status-indicator.success {
            background-color: rgba(40, 167, 69, 0.9) !important; /* 确认为绿色 */
        }
        .emby-jump-status-indicator.error {
            background-color: rgba(220, 53, 69, 0.9) !important; /* 确认为红色 */
        }
        .emby-jump-status-indicator .close-btn {
            margin-left: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        }

        /* 徽章样式 */
        .emby-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            color: ${Config.badgeTextColor};
            padding: ${badgeSize.padding};
            font-size: ${badgeSize.fontSize};
            font-weight: bold;
            z-index: 10;
            border: 2px solid transparent;
            border-radius: 4px;
            background-origin: border-box;
            background-clip: padding-box, border-box;
            background-image:
                linear-gradient(${Config.badgeColor} 0 0),
                linear-gradient(50deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#8b00ff);
        }
        .emby-badge:hover {
            color: #000;
            background-clip: padding-box, border-box;
            background-image:
                linear-gradient(#fff 0 0),
                linear-gradient(50deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#8b00ff);
        }
        .emby-highlight {
            outline: 4px solid ${Config.highlightColor} !important;
            position: relative;
        }
        /* 列表页已存在样式 */
        .emby-exists {
            color: #28a745 !important;
            font-weight: bold !important;
            border-left: 4px solid #28a745;
            padding-left: 4px;
            opacity: 0;
            animation: embyFadeIn 0.2s ease forwards;
        }

        @keyframes embyFadeIn {
            to { opacity: 1; }
        }
    `);

    // 单例状态指示器
    const Status = (() => {
        let el, bar, timeout;

        const debounce = (fn, ms) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), ms);
            };
        };

        const createUI = () => {
            if (el) return;
            el = document.createElement('div');
            el.className = 'emby-jump-status-indicator';
            el.innerHTML = `
                <span class="status-text">准备中...</span>
                <div class="progress">
                    <div class="progress-bar"></div>
                </div>
                <span class="close-btn">&times;</span>
            `;
            document.body.appendChild(el);
            bar = el.querySelector('.progress-bar');
            el.querySelector('.close-btn').addEventListener('click', hide);
        };

        const show = (msg, type = '') => {
            createUI();
            if (timeout) clearTimeout(timeout);
            // 关键修复：确保切换时移除旧的颜色类，添加新的类
            el.classList.remove('success', 'error');
            if (type) el.classList.add(type);

            el.querySelector('.status-text').textContent = msg;
            el.style.opacity = '1';
        };

        const hide = () => {
            if (!el) return;
            el.style.opacity = '0';
            timeout = setTimeout(() => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
                el = bar = null;
            }, 300);
        };

        const updateProgress = (current, total) => {
            const percent = Math.min(Math.round((current / total) * 100), 100);
            if (bar) bar.style.width = `${percent}%`;
            show(`查询中: ${current}/${total} (${percent}%)`);
        };

        return {
            show,
            success: (msg, autoHide) => {
                show(msg, 'success');
                if (autoHide) setTimeout(hide, 5000);
            },
            error: (msg, autoHide) => {
                show(msg, 'error');
                if (autoHide) setTimeout(hide, 5000);
            },
            updateProgress,
            updateProgressDebounced: debounce(updateProgress, 100),
            hide
        };
    })();

    // 设置面板
    const SettingsUI = {
        show() {
            let panel = document.getElementById('emby-jump-settings-panel');
            if (panel) {
                panel.style.display = 'block';
                return;
            }

            panel = document.createElement('div');
            panel.id = 'emby-jump-settings-panel';
            panel.className = 'emby-jump-settings-panel';
            panel.innerHTML = `
                <div class="emby-jump-settings-header">
                    <h3 style="margin:0">Emby 设置</h3>
                    <span class="emby-jump-settings-close">&times;</span>
                </div>

                <div class="emby-jump-settings-field">
                    <label for="emby-url">Emby 服务器地址</label>
                    <input type="text" id="emby-url"
                        placeholder="例如: http://192.168.1.100:8096/"
                        value="${Config.embyBaseUrl}">
                    <small style="color:#666">
                        请确保包含 http:// 或 https:// 前缀和最后的斜杠 /
                    </small>
                </div>

                <div class="emby-jump-settings-field">
                    <label for="emby-api">Emby API 密钥</label>
                    <input type="text" id="emby-api"
                        placeholder="在 Emby 设置中获取 API 密钥"
                        value="${Config.embyAPI}">
                </div>

                <div class="emby-jump-settings-field">
                    <label for="highlight-color">高亮颜色</label>
                    <input type="color" id="highlight-color" value="${Config.highlightColor}">
                </div>

                <div class="emby-jump-settings-field">
                    <label for="max-requests">最大并发请求数</label>
                    <input type="number" id="max-requests" min="1" max="100"
                        value="${Config.maxConcurrentRequests}">
                    <small style="color:#666">因为是本地请求，可以设置较大值</small>
                </div>

                <div class="emby-jump-settings-field">
                    <label for="badge-size">徽章大小</label>
                    <select id="badge-size">
                        <option value="small" ${Config.badgeSize === 'small' ? 'selected' : ''}>小</option>
                        <option value="medium" ${Config.badgeSize === 'medium' ? 'selected' : ''}>中</option>
                        <option value="large" ${Config.badgeSize === 'large' ? 'selected' : ''}>大</option>
                    </select>
                </div>

                <div class="emby-jump-settings-field">
                    <label for="badge-color">徽章背景颜色</label>
                    <input type="color" id="badge-color" value="${Config.badgeColor}">
                    <small style="color:#666">背景颜色将与彩虹边框一起显示</small>
                </div>

                <div class="emby-jump-settings-field">
                    <label for="badge-text-color">徽章文字颜色</label>
                    <input type="color" id="badge-text-color" value="${Config.badgeTextColor}">
                </div>

                <div class="emby-jump-settings-buttons">
                    <button class="emby-jump-settings-cancel">取消</button>
                    <button class="emby-jump-settings-save">保存</button>
                </div>
            `;

            document.body.appendChild(panel);

            const closePanel = () => {
                panel.style.display = 'none';
            };

            panel.querySelector('.emby-jump-settings-close')
                .addEventListener('click', closePanel);
            panel.querySelector('.emby-jump-settings-cancel')
                .addEventListener('click', closePanel);

            panel.querySelector('.emby-jump-settings-save')
                .addEventListener('click', () => {
                    const url = document.getElementById('emby-url').value;
                    if (!url.match(/^https?:\/\/.+\/$/)) {
                        alert('请输入有效的 Emby 服务器地址，包含 http:// 或 https:// 前缀和最后的斜杠 /');
                        return;
                    }

                    Config.embyBaseUrl = url;
                    Config.embyAPI = document.getElementById('emby-api').value;
                    Config.highlightColor = document.getElementById('highlight-color').value;
                    Config.maxConcurrentRequests = parseInt(
                        document.getElementById('max-requests').value,
                        10
                    );
                    Config.badgeSize = document.getElementById('badge-size').value;
                    Config.badgeColor = document.getElementById('badge-color').value;
                    Config.badgeTextColor = document.getElementById('badge-text-color').value;

                    closePanel();
                    alert('设置已保存！请刷新页面以应用更改。');
                });

            panel.style.display = 'block';
        }
    };

    /* ========= Emby 查询缓存（工业级） ========= */
    const EmbyCache = {
        KEY: 'emby_query_cache_v1',
        TTL: 7 * 24 * 60 * 60 * 1000, // 7天

        load() {
            return GM_getValue(this.KEY, {});
        },

        save(data) {
            GM_setValue(this.KEY, data);
        },

        get(code) {
            const cache = this.load();
            return cache[code] || null;
        },

        set(code, item) {
            const cache = this.load();
            cache[code] = {
                itemId: item.Id,
                serverId: item.ServerId,
                time: Date.now()
            };
            this.save(cache);
        },

        remove(code) {
            const cache = this.load();
            delete cache[code];
            this.save(cache);
        },

        clear() {
            GM_setValue(this.KEY, {});
        },

        isExpired(entry) {
            return Date.now() - entry.time > this.TTL;
        }
    };

    // Emby API 和请求控制
    class EmbyAPI {
        constructor() {
            this.active = 0;
            this.waiting = [];
            this.total = 0;
            this.completed = 0;
        }

        async fetchData(code) {
            if (!code) return { Items: [] };

            const clean = code.trim().toUpperCase();

            // 自动降级搜索：MDSR-0005-2 → 先搜自己 → 再搜 MDSR-0005
            const tryCodes = [clean];
            const mainMatch = clean.match(/^([A-Z]+-\d+)/);
            if (mainMatch && mainMatch[1] !== clean) {
                tryCodes.push(mainMatch[1]);
            }

            // 先查缓存
            for (const c of tryCodes) {
                const cached = EmbyCache.get(c);
                if (cached && !EmbyCache.isExpired(cached)) {
                    try {
                        const checkUrl =
                            `${Config.embyBaseUrl}emby/Items/${cached.itemId}?api_key=${Config.embyAPI}`;
                        const res = await this.request(checkUrl);
                        const item = JSON.parse(res.responseText);
                        return { Items: [item], _searchCode: c, _fromCache: true };
                    } catch {
                        EmbyCache.remove(c);
                    }
                }
            }

            // 正式搜索
            for (const c of tryCodes) {
                try {
                    const url =
                        `${Config.embyBaseUrl}emby/Users/${Config.embyAPI}/Items`
                        + `?api_key=${Config.embyAPI}`
                        + `&Recursive=true&IncludeItemTypes=Movie`
                        + `&SearchTerm=${encodeURIComponent(c)}`
                        + `&Fields=Name,Id,ServerId`;

                    const response = await this.request(url);
                    const data = JSON.parse(response.responseText);
                    data._searchCode = c;

                    if (data.Items?.length) {
                        const best = this.findBestMatch(data.Items, c);
                        if (best) EmbyCache.set(c, best);
                        return data;
                    }
                } catch (e) {
                    console.error(`Emby 查询失败 ${c}`, e);
                }
            }

            return { Items: [] };
        }

        async batchQuery(codes) {
            if (!codes || codes.length === 0) return [];

            this.total = codes.length;
            this.completed = 0;

            const results = new Array(this.total);

            return new Promise(resolve => {
                const checkComplete = () => {
                    if (this.completed >= this.total && this.active === 0) {
                        const found = results.filter(r => r?.Items?.length > 0).length;
                        Status.success(`查询完成: 找到 ${found} 个匹配项`, true);
                        resolve(results);
                    }
                };

                const processRequest = (index) => {
                    const code = codes[index];
                    this.active++;

                    Status.updateProgressDebounced(this.completed, this.total);

                    this.fetchData(code).then(result => {
                        results[index] = result;
                        this.active--;
                        this.completed++;

                        if (this.waiting.length > 0) processRequest(this.waiting.shift());
                        checkComplete();
                    }).catch(() => {
                        results[index] = null;
                        this.active--;
                        this.completed++;

                        if (this.waiting.length > 0) processRequest(this.waiting.shift());
                        checkComplete();
                    });
                };

                for (let i = 0; i < this.total; i++) {
                    if (this.active < Config.maxConcurrentRequests) processRequest(i);
                    else this.waiting.push(i);
                }
            });
        }

        request(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url,
                    headers: { accept: "application/json" },
                    timeout: 10000,
                    onload: res =>
                        res.status >= 200 && res.status < 300
                            ? resolve(res)
                            : reject(new Error(`HTTP 错误: ${res.status}`)),
                    onerror: () => reject(new Error("请求错误")),
                    ontimeout: () => reject(new Error("请求超时"))
                });
            });
        }

        // 核心修改：使用内联样式强制覆盖，并优化边距适应新位置
        createLink(data) {
            if (!data?.Items?.length) return null;

            const item = this.findBestMatch(data.Items, data._searchCode);
            if (!item) return null;

            const embyUrl =
                `${Config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

            const el = document.createElement('div');
            el.className = 'emby-jump-link';

            el.style.cssText = `
                background: ${Config.highlightColor} !important;
                border-radius: 3px !important;
                padding: 3px 8px !important;
                margin: 10px 0 !important;
                display: inline-block !important;
                vertical-align: middle !important;
                line-height: normal !important;
                border: none !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            `;

            el.innerHTML = `
                <a href="${embyUrl}" target="_blank"
                    style="
                        color: #ffffff !important;
                        text-decoration: none !important;
                        display: block !important;
                        font-weight: bold !important;
                        font-size: 13px !important;
                        background: transparent !important;
                    ">
                    <b>跳转到emby</b>
                </a>
            `;

            return el;
        }

        createBadge(data) {
            if (!data?.Items?.length) return null;

            const item = this.findBestMatch(data.Items, data._searchCode);
            if (!item) return null;

            const embyUrl =
                `${Config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

            const el = document.createElement('a');
            el.className = 'emby-badge';
            el.href = embyUrl;
            el.target = '_blank';
            el.textContent = 'Emby';

            return el;
        }

        findBestMatch(items, code) {
            if (!items || items.length === 0) return null;

            const target = code.trim().toUpperCase();
            const targetClean = target.replace(/[-_]/g, '');
            const mainTarget = target.replace(/-\d+$/, ''); // MDSR-0005

            const cleanStr = s => (s || '').toUpperCase().replace(/[-_]/g, '');

            let best = null;
            let bestScore = 0;

            for (const it of items) {
                const name = (it.Name || '').toUpperCase();
                const nameClean = cleanStr(name);

                let score = 0;

                if (name === target) score = 100;
                else if (nameClean === targetClean) score = 95;
                else if (name === mainTarget) score = 92;
                else if (nameClean === cleanStr(mainTarget)) score = 90;
                else if (name.includes(mainTarget)) score = 85;
                else if (nameClean.includes(cleanStr(mainTarget))) score = 80;

                if (score > bestScore) {
                    bestScore = score;
                    best = it;
                }
            }

            return bestScore >= 80 ? best : null;
        }
    }

    const BaseProcessor = {
        init(api) {
            this.api = api;
            this.processed = new WeakSet();
            return this;
        },

        async processItemsWithBadge(items) {
            if (!items?.length) return;

            Status.show(`正在收集番号: 共${items.length}个项目`);

            const toProcess = [];
            const codes = [];

            for (const item of items) {
                if (this.processed.has(item)) continue;
                this.processed.add(item);

                const code = this.extractCode(item);
                if (!code) continue;

                const imgContainer = this.findImgContainer(item);
                if (!imgContainer) continue;

                toProcess.push({ item, code, imgContainer });
                codes.push(code);
            }

            if (codes.length > 0) {
                const results = await this.api.batchQuery(codes);
                const operations = [];

                for (let i = 0; i < results.length; i++) {
                    if (
                        i < toProcess.length &&
                        this.api.findBestMatch(results[i].Items, results[i]._searchCode)
                    ) {
                        const { item, imgContainer } = toProcess[i];
                        const badge = this.api.createBadge(results[i]);

                        if (badge) {
                            operations.push(() => {
                                if (window.getComputedStyle(imgContainer).position === 'static') {
                                    imgContainer.style.position = 'relative';
                                }
                                item.classList.add('emby-highlight');
                                imgContainer.appendChild(badge);
                            });
                        }
                    }
                }

                if (operations.length > 0) {
                    requestAnimationFrame(() => {
                        operations.forEach(op => op());
                    });
                }
            }
        },

        async processItemsWithLink(items) {
            if (!items?.length) return;

            Status.show(`正在收集番号: 共${items.length}个项目`);

            const toProcess = [];
            const codes = [];

            for (const item of items) {
                if (this.processed.has(item)) continue;
                this.processed.add(item);

                const code = this.extractCode(item);
                const element = this.getElement(item);

                if (code && element) {
                    toProcess.push({ element, code });
                    codes.push(code);
                }
            }

            if (codes.length > 0) {
                const results = await this.api.batchQuery(codes);
                const processedElements = [];

                for (let i = 0; i < results.length; i++) {
                    if (
                        i < toProcess.length &&
                        this.api.findBestMatch(results[i].Items, results[i]._searchCode)
                    ) {
                        const { element } = toProcess[i];
                        const item = items[i];

                        if (item) item.classList.add('emby-processed');

                        const link = this.api.createLink(results[i]);

                        if (link) {
                            const target = element.parentNode || element;
                            let current = element;

                            const containerClasses = [
                                'item',
                                'masonry-brick',
                                'grid-item',
                                'movie-list',
                                'post'
                            ];

                            while (current && current !== document.body) {
                                for (const className of containerClasses) {
                                    if (current.classList?.contains(className)) {
                                        current.style.cssText += `
                                            border:3px solid ${Config.highlightColor};
                                            background-color:${Config.highlightColor}22;
                                        `;
                                        break;
                                    }
                                }
                                current = current.parentElement;
                            }

                            processedElements.push({
                                target,
                                link,
                                position: element.nextSibling
                            });
                        }
                    }
                }

                requestAnimationFrame(() => {
                    processedElements.forEach(({ target, link, position }) => {
                        target.insertBefore(link, position);
                    });
                });
            }
        },

        async process() {
            const items = document.querySelectorAll(this.listSelector);

            if (items.length > 0) {
                await this.processItemsWithBadge(items);
            }

            await this.processDetailPage();
            this.setupObserver();
        },

        findImgContainer(item) {
            const imgSelectors = ['.img', 'a.movie-box', '.cover', 'img'];

            for (const selector of imgSelectors) {
                const imgContainer = item.querySelector(selector);
                if (imgContainer) return imgContainer;
            }

            return item.querySelector('a') || item;
        },

        setupObserver() {
            let pending = [];
            let timer = null;

            const processMutations = () => {
                const newElements = [];

                for (const mutation of pending) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType !== 1) continue;

                            if (node.matches?.(this.listSelector)) {
                                newElements.push(node);
                            }

                            if (node.querySelectorAll) {
                                node.querySelectorAll(this.listSelector).forEach(el => newElements.push(el));
                            }
                        }
                    }
                }

                if (newElements.length > 0) {
                    this.processItemsWithBadge(newElements);
                }

                pending = [];
                timer = null;
            };

            new MutationObserver(mutations => {
                pending.push(...mutations);
                if (!timer) timer = setTimeout(processMutations, 300);
            }).observe(document.body, { childList: true, subtree: true });
        }
    };

    const Processors = {
        javbus: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.item.masonry-brick, #waterfall .item',

            extractCode: item =>
                item.querySelector('.item date')?.textContent?.trim(),

            getElement: item =>
                item.querySelector('.item date'),

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const infoElement = document.querySelector('.col-md-3.info p');
                if (!infoElement) return;

                const spans = infoElement.querySelectorAll('span');
                if (spans.length > 1) {
                    const code = spans[1].textContent?.trim();
                    if (code) {
                        Status.show('查询中...');
                        const data = await this.api.fetchData(code);

                        if (data.Items?.length > 0) {
                            const link = this.api.createLink(data);
                            if (link) {
                                spans[1].parentNode.insertBefore(link, spans[1].nextSibling);
                                Status.success('找到匹配项', true);
                            }
                        } else {
                            Status.error('未找到匹配项', true);
                        }
                    }
                }
            }
        }),

        javdb: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.movie-list .item, .grid-item',

            extractCode: item =>
                item.querySelector('.video-title strong')?.textContent?.trim(),

            getElement: item =>
                item.querySelector('.video-title strong'),

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const detailElement =
                    document.querySelector('body > section > div > div.video-detail > h2 > strong') ||
                    document.querySelector('.video-detail h2 strong');

                if (!detailElement) return;

                const codeMatch = detailElement.textContent.trim().match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);
                const code = codeMatch ? codeMatch[0] : detailElement.textContent.trim().split(' ')[0];

                if (code) {
                    Status.show('查询中...');
                    const data = await this.api.fetchData(code);

                    if (data.Items?.length > 0) {
                        const link = this.api.createLink(data);
                        if (link) {
                            detailElement.parentNode.insertBefore(link, detailElement.nextSibling);
                            Status.success('找到匹配项', true);
                        }
                    } else {
                        Status.error('未找到匹配项', true);
                    }
                }
            }
        }),

        supjav: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.post',

            extractCode(item) {
                const title = item.querySelector('h3 a')?.textContent?.trim();
                if (!title) return null;

                const match = title.match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);
                return match ? match[1] : null;
            },

            getElement(item) {
                return item.querySelector('h3 a');
            },

            async processDetailPage() {
                if (document.querySelector('.video-wrap .emby-jump-link, .video-wrap .emby-badge')) return;

                const titleElement = document.querySelector('.video-wrap .archive-title h1');
                if (!titleElement) return;

                const title = titleElement.textContent.trim();
                const match = title.match(/([a-zA-Z0-9]+-\d+)/i);
                if (!match) return;

                const code = match[1];

                if (code) {
                    Status.show('查询中...');
                    const data = await this.api.fetchData(code);

                    if (data.Items?.length > 0) {
                        const link = this.api.createLink(data);
                        if (link) {
                            titleElement.parentNode.insertBefore(link, titleElement.nextSibling);
                            Status.success('找到匹配项', true);
                        }
                    } else {
                        Status.error('未找到匹配项', true);
                    }
                }
            }
        }),

        sehuatang: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const title = document.title.trim();
                const codes = this.extractCodes(title);

                if (codes.length > 0) {
                    Status.show(`找到 ${codes.length} 个可能的番号，开始查询...`);

                    const results = await this.api.batchQuery(codes);
                    let foundAny = false;

                    for (const data of results) {
                        if (data?.Items?.length > 0) {
                            const container =
                                document.querySelector('#thread_subject') ||
                                document.querySelector('h1.ts') ||
                                document.querySelector('h1');

                            if (container) {
                                const link = this.api.createLink(data);
                                if (link) {
                                    container.parentNode.insertBefore(link, container.nextSibling);
                                    foundAny = true;
                                }
                            }
                        }
                    }

                    if (foundAny) Status.success('找到匹配项', true);
                    else Status.error('未找到匹配项', true);
                }
            },

            extractCodes(title) {
                if (!title) return [];

                const patterns = [
                    /([a-zA-Z]{2,15})[-\s]?(\d{2,15})/i,
                    /FC2[-\s]?PPV[-\s]?(\d{6,7})/i
                ];

                const results = [];

                for (const pattern of patterns) {
                    const match = title.match(pattern);
                    if (match) {
                        if (match[2]) results.push(`${match[1]}-${match[2]}`);
                        else if (match[1]) results.push(match[0]);
                    }
                }

                return results;
            }
        }),

        sukebeiNyaa: Object.assign(Object.create(BaseProcessor), {

            // 列表页每一行
            listSelector: 'table tbody tr',

            async process() {

                // 详情页
                if (location.pathname.startsWith('/view/')) {
                    await this.processDetailPage();
                    return;
                }

                // 列表页
                await this.processListPage();
            },

            // =====================
            // 详情页
            // =====================
            async processDetailPage() {

                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const titleElement = document.querySelector('.panel-heading .panel-title');
                if (!titleElement) return;

                const titleText = titleElement.textContent;
                const match = titleText.match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);

                if (!match) return;

                const code = match[0].toUpperCase();

                Status.show(`查询番号 ${code} 中...`);

                const data = await this.api.fetchData(code);

                if (data.Items?.length > 0) {

                    const link = this.api.createLink(data);
                    if (!link) return;

                    const container = document.createElement('span');
                    container.style.marginLeft = '10px';
                    container.appendChild(link);

                    titleElement.appendChild(container);

                    Status.success('Emby 找到匹配项', true);

                } else {
                    Status.error('Emby 未找到匹配项', true);
                }
            },

            // =====================
            // 列表页
            // =====================
            async processListPage() {

                const rows = document.querySelectorAll(this.listSelector);

                let foundCount = 0;
                let totalChecked = 0;
                let completed = 0;

                // 👇 用来收集要变色的元素
                const pendingHighlight = [];

                for (const row of rows) {

                    const linkEl = row.querySelector('td:nth-child(2) a');
                    if (!linkEl) continue;

                    if (linkEl.dataset.embyChecked) continue;
                    linkEl.dataset.embyChecked = "1";

                    const text = linkEl.textContent;
                    const match = text.match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);
                    if (!match) continue;

                    totalChecked++;

                    const code = match[0].toUpperCase();

                    this.api.fetchData(code).then(data => {

                        if (data.Items?.length > 0) {
                            foundCount++;
                            pendingHighlight.push(linkEl); // 👈 不立即渲染
                        }

                    }).catch(() => {}).finally(() => {
                        completed++;
                    });
                }

                // 等待结束（软收尾）
                const startTime = Date.now();
                const checker = setInterval(() => {

                    const timeoutReached = Date.now() - startTime > 5000;

                    if (completed >= totalChecked || timeoutReached) {

                        clearInterval(checker);

                        // 👇 批量一次性渲染
                        requestAnimationFrame(() => {
                            for (const el of pendingHighlight) {
                                el.classList.add('emby-exists');
                                el.title = "Emby 已存在";
                            }
                        });

                        if (foundCount > 0) {
                            Status.success(`列表查询完成，找到 ${foundCount} 项`, true);
                        } else {
                            Status.error("列表查询完成，未找到匹配项", true);
                        }
                    }

                }, 300);
            }

        }),

        // JavLibrary
        javlibrary: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                await this.processDetailPage();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const idContainer = document.querySelector('#video_id');
                const idCodeElement = document.querySelector('#video_id .text');

                if (!idContainer || !idCodeElement) return;

                const code = idCodeElement.textContent.trim();

                if (code) {
                    Status.show(`查询番号 ${code} 中...`);
                    const data = await this.api.fetchData(code);

                    if (data.Items?.length > 0) {
                        const link = this.api.createLink(data);
                        if (link) {
                            idContainer.insertAdjacentElement('afterend', link);
                            Status.success('Emby 找到匹配项', true);
                        }
                    } else {
                        Status.error('Emby 未找到匹配项', true);
                    }
                }
            }
        }),

        // Madou
        madou: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                await this.processDetailPage();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                let code = null;

                const keywords = document.querySelector('meta[name="keywords"]')?.content || "";
                let match = keywords.match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);

                if (match) {
                    code = match[0].toUpperCase();
                }

                if (!code) {
                    const info = document.querySelector('.vd-infos');
                    if (info) {
                        const ps = info.querySelectorAll('p');
                        for (const p of ps) {
                            const text = p.textContent || '';
                            const m = text.match(/番号[:：]\s*([A-Z]{2,10}-\d+(?:-\d+)?)/i);
                            if (m) {
                                code = m[1].toUpperCase();
                                break;
                            }
                        }
                    }
                }

                if (code) {
                    Status.show(`查询番号 ${code} 中...`);
                    const data = await this.api.fetchData(code);

                    if (data.Items?.length > 0) {
                        const link = this.api.createLink(data);
                        if (link) {
                            const titleElement = document.querySelector('h1');
                            if (titleElement) {
                                titleElement.parentNode.insertBefore(link, titleElement.nextSibling);
                                Status.success('Emby 找到匹配项', true);
                            }
                        }
                    } else {
                        Status.error('Emby 未找到匹配项', true);
                    }
                }
            }
        }),

        // JavRate
        javrate: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                await this.processDetailPage();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const keywords = document.querySelector('meta[name="keywords"]')?.content || "";
                const match = keywords.match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);
                const code = match ? match[0].toUpperCase() : null;

                if (code) {
                    Status.show(`查询番号 ${code} 中...`);
                    const data = await this.api.fetchData(code);

                    if (data.Items?.length > 0) {
                        const link = this.api.createLink(data);
                        if (link) {
                            const titleElement = document.querySelector('h1');
                            if (titleElement) {
                                titleElement.parentNode.insertBefore(link, titleElement.nextSibling);
                                Status.success('Emby 找到匹配项', true);
                            }
                        }
                    } else {
                        Status.error('Emby 未找到匹配项', true);
                    }
                }
            }
        }),

        '169bbs': Object.assign(Object.create(BaseProcessor), {
            listSelector: 'tbody[id^="normalthread_"]',
            codeRegex: /[A-Z]{2,10}-\d+/i,

            extractCode: function(item) {
                const link = item.querySelector('a.xst');
                if (!link) return null;
                const match = link.textContent.match(this.codeRegex);
                return match ? match[0].toUpperCase() : null;
            },

            getElement: item => item.querySelector('a.xst'),

            async process() {
                // 1. 列表模式：直接查找页面是否存在帖子列表
                const items = document.querySelectorAll(this.listSelector);
                if (items.length > 0) {
                    await this.processItemsWithLink(items);
                }

                // 2. 详情页模式：直接查找页面是否存在标题 ID
                const titleEl = document.querySelector('#thread_subject');
                if (titleEl) {
                    const match = titleEl.textContent.match(this.codeRegex);
                    if (match) {
                        Status.show('正在查询 Emby...');
                        const code = match[0].toUpperCase();
                        const data = await this.api.fetchData(code);

                        if (data && data.Items && data.Items.length > 0) {
                            const link = this.api.createLink(data);
                            if (link) {
                                titleEl.after(link);
                                Status.success(`已找到: ${code}`, true);
                            }
                        } else {
                            Status.error('未找到匹配项', true);
                        }
                    }
                }

                // 3. 开启观察器（应对 Discuz 的异步加载或翻页）
                this.setupObserver();
            }
        })
    };

    // 站点自动识别
    function detectSite() {
        const host = location.hostname;
        const url = location.href;

        if (host.includes('javbus')) return 'javbus';
        if (host.includes('javdb')) return 'javdb';
        if (host.includes('supjav')) return 'supjav';
        if (host.includes('sehuatang')) return 'sehuatang';
        if (host.includes('nyaa.si')) return 'sukebeiNyaa';
        if (host.includes('javlibrary')) return 'javlibrary';
        if (host.includes('madou')) return 'madou';
        if (host.includes('javrate')) return 'javrate';
        if (host.includes('169bbs')) return '169bbs';

        return null;
    }

    // 菜单：设置 & 清除缓存
    GM_registerMenuCommand('⚙️ Emby 设置', () => SettingsUI.show());
    GM_registerMenuCommand('🧹 清除 Emby 查询缓存', () => {
        if (confirm('确定要清除缓存吗？')) {
            EmbyCache.clear();
            alert('缓存已清除！');
        }
    });

    // 主入口
    async function main() {
        const currentUrl = location.href;
        const currentPath = location.pathname.toLowerCase();

        const site = detectSite();

        const isJavBusForum = currentUrl.includes('javbus.com/forum');
        const skipPaths = ['/genre', '/actresses', '/uncensored/actresses'];

        if (!site || isJavBusForum || skipPaths.some(path => currentPath.includes(path))) {
            return;
        }

        if (!Config.isValid()) {
            Status.error('配置无效', true);
            setTimeout(() => {
                alert('请先设置您的 Emby 服务器地址和 API 密钥');
                SettingsUI.show();
            }, 500);
            return;
        }

        console.log('Emby 跳转脚本启动，识别站点:', site);

        const processor = Processors[site].init(new EmbyAPI());
        if (processor) await processor.process();
    }

    // 确保这部分在脚本最底部
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();