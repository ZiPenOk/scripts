// ==UserScript==
// @name         番号跳转加预览图
// @namespace    https://github.com/ZiPenOk
// @version      2.1.0
// @description  支持多站点（新增 SupJav），表格布局滑动开关面板，新增Google搜索，经典灰白配色，手动关闭。
// @author       ZiPenOk
// @match        *://sukebei.nyaa.si/*
// @match        *://169bbs.com/*
// @match        *://supjav.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      *
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/jav_jump.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/jav_jump.js
// ==/UserScript==

(function() {
    'use strict';

    // ============================ 核心工具模块 ============================
    const Utils = {
        extractCode(text) {
            if (!text) return null;
            const m = text.match(/\b([A-Z0-9]{2,6}-\d{3,7})\b/i);
            return m ? m[1].toUpperCase() : null;
        },

        createBtn(text, color, handler) {
            const btn = document.createElement('a');
            btn.textContent = text;
            btn.style.cssText =
                "margin-left:8px;padding:4px 12px;background:" +
                color +
                ";color:white;border-radius:4px;font-size:12px;cursor:pointer;text-decoration:none;display:inline-block;";
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
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position:fixed;
                inset:0;
                background:rgba(0,0,0,0.85);
                z-index:10000000;
                display:flex;
                justify-content:center;
                align-items:center;
                cursor:pointer;
                overflow:auto;
                padding:20px;
            `;

            const img = document.createElement('img');
            img.src = imgUrl;
            img.style.cssText = `
                max-width:92%;
                max-height:92%;
                border:5px solid white;
                border-radius:10px;
                cursor:zoom-in;
            `;

            let isZoomed = false;
            img.onclick = (e) => {
                e.stopPropagation();
                if (!isZoomed) {
                    overlay.style.alignItems = 'flex-start';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                    img.style.cursor = 'zoom-out';
                    isZoomed = true;
                    overlay.scrollTo(0, 0);
                } else {
                    overlay.style.alignItems = 'center';
                    img.style.maxWidth = '92%';
                    img.style.maxHeight = '92%';
                    img.style.cursor = 'zoom-in';
                    isZoomed = false;
                }
            };

            overlay.onclick = () => overlay.remove();
            overlay.appendChild(img);
            document.body.appendChild(overlay);
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
            '169bbs':  { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true },
            'supjav':  { jumpNyaa: true, jumpJavbus: true, jumpJavdb: true, jumpGoogle: true, preview: true }  // 新增站点默认配置
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

    // ============================ 站点定义模块 ============================
    const Sites = [
        {
            id: 'sukebei',
            name: 'Sukebei',
            match: (url) => /nyaa\.si/.test(url) && url.includes('/view/'),
            titleSelector: '.panel-title',
            enhance: (code, settings, titleElem) => {
                if (settings.jumpNyaa) addNyaaBtn(code, titleElem);
                if (settings.jumpJavbus) addJavbusBtn(code, titleElem);
                if (settings.jumpJavdb) addJavdbBtn(code, titleElem);
                if (settings.jumpGoogle) addGoogleBtn(code, titleElem);
                if (settings.preview) addPreviewBtn(code, titleElem);
            }
        },
        {
            id: '169bbs',
            name: '169bbs',
            match: (url) => /169bbs\.(com|net|org)/.test(url) && url.includes('mod=viewthread'),
            titleSelector: '#thread_subject, h1',
            enhance: (code, settings, titleElem) => {
                if (settings.jumpNyaa) addNyaaBtn(code, titleElem);
                if (settings.jumpJavbus) addJavbusBtn(code, titleElem);
                if (settings.jumpJavdb) addJavdbBtn(code, titleElem);
                if (settings.jumpGoogle) addGoogleBtn(code, titleElem);
                if (settings.preview) addPreviewBtn(code, titleElem);
            }
        },
        // 新增 SupJav 站点
        {
            id: 'supjav',
            name: 'SupJav',
            match: (url) => /supjav\.com/.test(url) && /\/\d+\.html$/.test(url), // 匹配文章详情页
            titleSelector: '.archive-title h1',
            enhance: (code, settings, titleElem) => {
                if (settings.jumpNyaa) addNyaaBtn(code, titleElem);
                if (settings.jumpJavbus) addJavbusBtn(code, titleElem);
                if (settings.jumpJavdb) addJavdbBtn(code, titleElem);
                if (settings.jumpGoogle) addGoogleBtn(code, titleElem);
                if (settings.preview) addPreviewBtn(code, titleElem);
            }
        }
    ];

    // ============================ 按钮创建辅助函数 ============================
    function addNyaaBtn(code, parent) {
        const btn = Utils.createBtn('🔍 Sukebei', '#17a2b8', () => {
            window.open(`https://sukebei.nyaa.si/?f=0&c=0_0&q=${code}`);
        });
        parent.appendChild(btn);
    }

    function addJavbusBtn(code, parent) {
        const btn = Utils.createBtn('🎬 JavBus', '#007bff', () => {
            window.open(`https://www.javbus.com/search/${code}`);
        });
        parent.appendChild(btn);
    }

    function addJavdbBtn(code, parent) {
        const btn = Utils.createBtn('📀 JavDB', '#6f42c1', () => {
            window.open(`https://javdb.com/search?q=${code}`);
        });
        parent.appendChild(btn);
    }

    function addGoogleBtn(code, parent) {
        const btn = Utils.createBtn('🔎 Google', '#4285F4', () => {
            window.open(`https://www.google.com/search?q=${code}`);
        });
        parent.appendChild(btn);
    }

    function addPreviewBtn(code, parent) {
        const btn = Utils.createBtn('🖼️ 预览图', '#28a745', async () => {
            await Thumbnail.show(code);
        });
        parent.appendChild(btn);
    }

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
        site.enhance(code, settings, titleElem);
    }

    // ============================ 管理面板模块（2.1.0经典灰白，手动关闭） ============================
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

        // 经典灰白样式（2.1.0版本）
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

        // 禁止点击遮罩关闭（手动关闭）
        // 不设置 overlay.onclick

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