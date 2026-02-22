// ==UserScript==
// @name         番号跳转加预览图
// @namespace    https://github.com/ZiPenOk
// @version      3.6.0
// @description  所有站点统一使用强番号逻辑 + JavBus 智能路径，表格开关，手动关闭，按钮统一在标题下方新行显示。新增 JavBus、JAVLibrary、JavDB 支持。
// @author       ZiPenOk
// @match        *://sukebei.nyaa.si/*
// @match        *://169bbs.com/*
// @match        *://supjav.com/*
// @match        http://10.10.10.60:8097/web/index.html*
// @match        https://emby.sh1nyan.fun/web/index.html*
// @match        *://10.10.10.*:*/web/index.html*
// @match        *://www.javbus.com/*
// @match        *://javbus.com/*
// @match        *://javdb.com/v/*
// @match        *://www.javlibrary.com/*
// @match        *://javlibrary.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      *
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/jav_jump.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/jav_jump.js
// ==/UserScript==

(function() {
    'use strict';

    // ============================ 全局样式 ============================
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

        .preview-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            z-index: 2147483647;
            display: flex;
            overflow: auto;
            cursor: zoom-out;
            backdrop-filter: blur(5px);
        }
        .preview-img {
            border-radius: 4px;
            margin: auto;
            cursor: zoom-in;
            max-width: 95vw;
            max-height: 95vh;
            object-fit: contain;
            display: block;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .preview-img.zoomed {
            max-width: none;
            max-height: none;
            cursor: zoom-out;
        }

        /* 统一按钮组样式 */
        .jav-jump-btn-group {
            margin-top: 8px;
            margin-bottom: 4px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
        }

        /* JAVLibrary 专用修复 - 只影响该站点的按钮组 */
        body.main .javlibrary-fix {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            margin: 15px 0 10px !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            width: 100% !important;
            position: relative !important;
            z-index: 9999 !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        body.main .javlibrary-fix a {
            display: inline-block !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            font-weight: bold !important;
            font-family: Arial, "Microsoft YaHei", sans-serif !important;
            text-decoration: none !important;
            border: none !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            box-sizing: border-box !important;
            line-height: normal !important;
            /* 背景和颜色由内联样式控制，此处不覆盖 */
        }
    `);

    // ============================ 核心工具模块 ============================
    const Utils = {
        extractCode(text) {
            if (!text) return null;
            const fc2Match = text.match(/FC2[-\s_]?(?:PPV)?[-\s_]?(\d{6,9})/i);
            if (fc2Match) {
                return `FC2-PPV-${fc2Match[1]}`;
            }
            const standardMatch = text.match(/([a-zA-Z0-9]{2,15})([-\s_])(\d{2,10})/i);
            if (standardMatch) {
                const prefix = standardMatch[1].toUpperCase();
                const separator = standardMatch[2];
                const suffix = standardMatch[3];
                const ignoreList = ['FULLHD', 'H264', 'H265', '1080P', '720P', 'PART', 'DISC', '10BIT'];
                if (!ignoreList.includes(prefix)) {
                    return `${prefix}${separator}${suffix}`;
                }
            }
            return null;
        },

        createBtn(text, color, handler) {
            const btn = document.createElement('a');
            btn.textContent = text;
            btn.style.cssText = `
                padding:4px 8px;
                background: ${color};
                color: white;
                border-radius: 4px;
                font-size: 13px;
                font-weight: bold;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                border: none;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                box-sizing: border-box;
            `;
            btn.onclick = (e) => {
                e.preventDefault();
                handler();
            };
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

        showOverlay(imgUrl) {
            const container = document.createElement('div');
            container.className = 'preview-overlay';
            const img = document.createElement('img');
            img.className = 'preview-img';
            img.src = imgUrl;
            img.onclick = (e) => {
                e.stopPropagation();
                img.classList.toggle('zoomed');
            };
            container.onclick = () => container.remove();
            container.appendChild(img);
            document.body.appendChild(container);
        },

        getJavBusUrl(code) {
            const isUncensored = /^\d{6}[-_\s]\d{3}$/.test(code) || code.toLowerCase().startsWith('n') || code.toLowerCase().startsWith('k');
            if (isUncensored) {
                return `https://www.javbus.com/uncensored/search/${encodeURIComponent(code)}&type=1`;
            }
            return `https://www.javbus.com/search/${encodeURIComponent(code)}&type=&parent=ce`;
        }
    };

    // ============================ 预览图模块 ============================
    const Thumbnail = {
        async get(code) {
            const cacheKey = `thumb_cache_${code}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) return cached;

            try {
                const html = await Utils.request(`https://javfree.me/search/${code}`);
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const link = doc.querySelector('.entry-title>a')?.href;
                if (!link) return null;

                const dHtml = await Utils.request(link);
                const dDoc = new DOMParser().parseFromString(dHtml, 'text/html');
                const url = dDoc.querySelectorAll('p>img')[1]?.src || dDoc.querySelectorAll('p>img')[0]?.src;

                if (url) {
                    sessionStorage.setItem(cacheKey, url);
                    return url;
                }
                return null;
            } catch {
                return null;
            }
        },

        async show(code) {
            const url = await this.get(code);
            if (url) {
                Utils.showOverlay(url);
            } else {
                alert('未找到预览图');
            }
        }
    };

    // ============================ 设置管理模块 ============================
    const Settings = {
        defaults: {
            'sukebei':    { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true },
            '169bbs':     { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true },
            'supjav':     { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true },
            'emby':       { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true },
            'javbus':     { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true },
            'javdb':      { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true }, 
            'javlibrary': { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true }
        },

        get(siteId) {
            const saved = GM_getValue(`settings_${siteId}`, null);
            if (saved) {
                return JSON.parse(saved);
            }
            return this.defaults[siteId] ? { ...this.defaults[siteId] } : {};
        },

        set(siteId, settings) {
            GM_setValue(`settings_${siteId}`, JSON.stringify(settings));
        },

        getAllFeatures() {
            return ['jumpJavbus', 'jumpJavdb', 'jumpNyaa', 'jumpGoogle', 'preview'];
        },

        getFeatureName(feature) {
            const map = {
                jumpJavbus: 'JavBus跳转',
                jumpJavdb: 'JavDB跳转',
                jumpNyaa: 'Sukebei跳转',
                jumpGoogle: 'Google搜索',
                preview: '预览图'
            };
            return map[feature] || feature;
        }
    };

    // ============================ 按钮创建辅助函数 ============================
    function addNyaaBtn(code, container) {
        const btn = Utils.createBtn('🔍 Sukebei', '#17a2b8', () => {
            window.open(`https://sukebei.nyaa.si/?f=0&c=0_0&q=${code}`);
        });
        container.appendChild(btn);
    }

    function addJavbusBtn(code, container) {
        const url = Utils.getJavBusUrl(code);
        const btn = Utils.createBtn('🎬 JavBus', '#007bff', () => {
            window.open(url);
        });
        container.appendChild(btn);
    }

    function addJavdbBtn(code, container) {
        const btn = Utils.createBtn('📀 JavDB', '#6f42c1', () => {
            window.open(`https://javdb.com/search?q=${code}`);
        });
        container.appendChild(btn);
    }

    function addGoogleBtn(code, container) {
        const btn = Utils.createBtn('🔎 Google', '#4285F4', () => {
            window.open(`https://www.google.com/search?q=${code}`);
        });
        container.appendChild(btn);
    }

    function addPreviewBtn(code, container) {
        const btn = Utils.createBtn('🖼️ 预览图', '#28a745', async () => {
            await Thumbnail.show(code);
        });
        container.appendChild(btn);
    }

    // ============================ 站点定义模块 ============================
    const Sites = [
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
            titleSelector: '.archive-title h1'
        },
        {
            id: 'emby',
            name: 'Emby',
            match: (url) => /10\.10\.10\.\d+:\d+\/web\/index\.html/.test(url) || /emby\.sh1nyan\.fun\/web\/index\.html/.test(url),
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
            // 匹配 javdb.com 或 javdb*.com 的详情页，路径包含 /v/ 后跟字母数字
            match: (url) => /javdb\d*\.com/.test(url) && /\/v\/\w+/.test(url),
            titleSelector: 'h2.title' // 详情页标题为 h2.title
        }, 
        {
            id: 'javlibrary',
            name: 'JAVLibrary',
            match: (url) => /javlibrary\.com/.test(url) && /\/cn\/jav\w+\.html/.test(url),
            titleSelector: '.post-title'
        }
    ];

    // ============================ UI 渲染模块 ============================
    function renderButtonsForCurrentPage() {
        const site = Sites.find(s => s.match(window.location.href));
        if (!site) return;

        const titleElem = document.querySelector(site.titleSelector);
        if (!titleElem) return;

        if (titleElem.dataset.enhanced === '1') return;
        titleElem.dataset.enhanced = '1';

        const code = Utils.extractCode(titleElem.textContent);
        if (!code) return;

        const settings = Settings.get(site.id);

        const btnGroup = document.createElement('div');
        btnGroup.className = 'jav-jump-btn-group';

        // 区分 JAVLibrary 特殊处理
        if (site.id === 'javlibrary') {
            // 强制添加所有按钮（忽略设置，确保显示；若希望受设置控制，可改为 settings.jumpXxx）
            addNyaaBtn(code, btnGroup);
            addJavbusBtn(code, btnGroup);
            addJavdbBtn(code, btnGroup);
            addGoogleBtn(code, btnGroup);
            addPreviewBtn(code, btnGroup);

            // 为按钮内联样式添加 !important 防止被覆盖
            btnGroup.querySelectorAll('a').forEach(btn => {
                let style = btn.getAttribute('style') || '';
                style = style.replace(/background:\s*([^;]+);/g, 'background: $1 !important;');
                style = style.replace(/color:\s*([^;]+);/g, 'color: $1 !important;');
                btn.setAttribute('style', style);
            });

            btnGroup.classList.add('javlibrary-fix');

            // 插入到 #rightcolumn 顶部
            const rightColumn = document.querySelector('#rightcolumn');
            if (rightColumn) {
                rightColumn.prepend(btnGroup);
            } else {
                titleElem.insertAdjacentElement('afterend', btnGroup);
            }
        } else {
            // 其他站点按设置添加按钮
            if (settings.jumpNyaa) addNyaaBtn(code, btnGroup);
            if (settings.jumpJavbus) addJavbusBtn(code, btnGroup);
            if (settings.jumpJavdb) addJavdbBtn(code, btnGroup);
            if (settings.jumpGoogle) addGoogleBtn(code, btnGroup);
            if (settings.preview) addPreviewBtn(code, btnGroup);

            // 直接插入到标题之后
            titleElem.insertAdjacentElement('afterend', btnGroup);
        }
    }

    // ============================ 管理面板模块 ============================
    function createSettingsPanel() {
        const existing = document.getElementById('jav-jump-settings-panel');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'jav-jump-settings-overlay';
        overlay.style.cssText = `
            position:fixed;
            top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.5);
            z-index:10000001;
            display:flex;
            justify-content:center;
            align-items:center;
        `;

        const panel = document.createElement('div');
        panel.id = 'jav-jump-settings-panel';
        panel.style.cssText = `
            background:#fff;
            color:#333;
            border-radius:8px;
            padding:20px 30px;
            max-width:950px;
            width:90%;
            max-height:80vh;
            overflow:auto;
            box-shadow:0 4px 20px rgba(0,0,0,0.3);
            font-family:Arial,sans-serif;
        `;

        panel.innerHTML = '<h2 style="margin-top:0; text-align:center;">⚙️ 番号跳转设置</h2>';

        const style = document.createElement('style');
        style.textContent = `
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            input:checked + .toggle-slider {
                background-color: #2196F3;
            }
            input:checked + .toggle-slider:before {
                transform: translateX(26px);
            }
            .settings-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .settings-table th {
                background-color: #f2f2f2;
                padding: 12px 8px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #ddd;
            }
            .settings-table td {
                padding: 10px 8px;
                text-align: center;
                border: 1px solid #ddd;
            }
            .settings-table td:first-child {
                font-weight: bold;
                background-color: #f9f9f9;
            }
        `;
        panel.appendChild(style);

        const table = document.createElement('table');
        table.className = 'settings-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const siteTh = document.createElement('th'); siteTh.textContent = '站点'; headerRow.appendChild(siteTh);

        const features = Settings.getAllFeatures();
        features.forEach(feature => {
            const th = document.createElement('th');
            th.textContent = Settings.getFeatureName(feature);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        Sites.forEach(site => {
            const row = document.createElement('tr');
            const siteCell = document.createElement('td');
            siteCell.textContent = site.name;
            row.appendChild(siteCell);

            const settings = Settings.get(site.id);

            features.forEach(feature => {
                const cell = document.createElement('td');
                const label = document.createElement('label');
                label.className = 'toggle-switch';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.site = site.id;
                checkbox.dataset.feature = feature;
                const defaultValue = Settings.defaults[site.id] ? Settings.defaults[site.id][feature] : true;
                checkbox.checked = settings.hasOwnProperty(feature) ? settings[feature] : defaultValue;

                const slider = document.createElement('span');
                slider.className = 'toggle-slider';

                label.appendChild(checkbox);
                label.appendChild(slider);
                cell.appendChild(label);
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        panel.appendChild(table);

        const btnDiv = document.createElement('div');
        btnDiv.style.display = 'flex';
        btnDiv.style.justifyContent = 'center';
        btnDiv.style.gap = '20px';
        btnDiv.style.marginTop = '20px';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存设置';
        saveBtn.style.cssText = 'padding:8px 20px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;';
        saveBtn.onmouseover = () => saveBtn.style.background = '#218838';
        saveBtn.onmouseout = () => saveBtn.style.background = '#28a745';
        saveBtn.onclick = () => {
            const checkboxes = panel.querySelectorAll('input[type="checkbox"]');
            const newSettingsMap = {};

            checkboxes.forEach(cb => {
                const siteId = cb.dataset.site;
                const feature = cb.dataset.feature;
                if (!newSettingsMap[siteId]) newSettingsMap[siteId] = {};
                newSettingsMap[siteId][feature] = cb.checked;
            });

            Object.keys(newSettingsMap).forEach(siteId => {
                Settings.set(siteId, newSettingsMap[siteId]);
            });

            overlay.remove();
            location.reload();
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = 'padding:8px 20px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;';
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#5a6268';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#6c757d';
        cancelBtn.onclick = () => overlay.remove();

        btnDiv.appendChild(saveBtn);
        btnDiv.appendChild(cancelBtn);
        panel.appendChild(btnDiv);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    // ============================ 初始化 ============================
    const observer = new MutationObserver(() => {
        renderButtonsForCurrentPage();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    renderButtonsForCurrentPage();

    GM_registerMenuCommand('⚙️ 番号跳转设置', createSettingsPanel);
})();