// ==UserScript==
// @name         磁力&电驴链接助手
// @namespace    https://github.com/ZiPenOk
// @version      3.2.0
// @description  点击按钮显示绿色勾（验车按钮除外），支持复制（自动精简链接，仅保留xt和dn，且dn解码为明文）、推送到qB/115，新增磁力信息验车功能，截图支持轮播（点击遮罩关闭）。完美整合 laosiji.js，仅在操作列插入一次。
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      *
// @connect      whatslink.info
// @require      https://cdn.jsdelivr.net/npm/vue@3.5.27/dist/vue.global.prod.js
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/Magnetic_Assistant.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/Magnetic_Assistant.js
// ==/UserScript==

(function (vue) {
    'use strict';

    // ================= 1. 基础配置 =================
    const config = {
        enableCopy: GM_getValue('enableCopy', true),
        enableQb: GM_getValue('enableQb', true),
        enable115: GM_getValue('enable115', false),
        enableCheck: GM_getValue('enableCheck', true),
        qbtHost: GM_getValue('qbtHost', 'http://127.0.0.1:8080'),
        qbtUser: GM_getValue('qbtUser', 'admin'),
        qbtPass: GM_getValue('qbtPass', 'adminadmin'),
        u115Uid: GM_getValue('u115Uid', '')
    };

    GM_registerMenuCommand("⚙️ 脚本综合设置", showSettingsModal);

    // 图标定义
    const ICONS = {
        copy: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#666"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
        qb: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#0078d4"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
        u115: `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#2777F8"/><text x="12" y="17" font-family="Arial" font-size="12" font-weight="900" fill="white" text-anchor="middle">5</text></svg>`,
        car: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#ff9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z"/></svg>`,
        checkActive: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#28a745"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
    };

    // ================= 2. 注入CSS =================
    const style = document.createElement('style');
    style.innerHTML = `
        .mag-btn-group {
            display: inline-flex !important;
            vertical-align: middle !important;
            margin-left: 6px !important;
            gap: 4px !important;
            background: #f8f9fa !important;
            padding: 2px 3px !important;
            border-radius: 6px !important;
            border: 1px solid #dee2e6 !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
            transition: box-shadow 0.2s;
        }
        .mag-btn-group:hover {
            box-shadow: 0 2px 4px rgba(0,0,0,0.08) !important;
        }
        .mag-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 24px !important;
            height: 20px !important;
            background: #ffffff !important;
            border: 1px solid #ced4da !important;
            border-radius: 5px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 1px rgba(0,0,0,0.03) !important;
            position: relative;
            overflow: hidden;
        }
        .mag-btn:hover {
            background: #e9ecef !important;
            border-color: #0078d4 !important;
            transform: translateY(-1px);
            box-shadow: 0 2px 3px rgba(0,120,212,0.15) !important;
        }
        .mag-btn.active {
            border-color: #28a745 !important;
            background: #f0fff4 !important;
            box-shadow: 0 0 0 2px rgba(40,167,69,0.2) !important;
        }
        /* 涟漪效果 */
        .mag-btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(0,120,212,0.3);
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s;
        }
        .mag-btn:active::after {
            width: 80px;
            height: 80px;
        }
        /* 绿色勾弹入动画 */
        @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
        }
        .mag-btn.active svg {
            animation: popIn 0.2s ease-out;
        }
        /* 验车弹窗样式 */
        .check-car-mask {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.35);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 999998;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: maskFadeIn 0.25s ease;
        }
        @keyframes maskFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        .check-car-panel {
            animation: panelPop 0.25s ease;
            position: relative;
            width: 90%;
            max-width: 500px;
            max-height: 80%;
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            background-color: rgba(255,255,255,0.95);
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.2) transparent;
            color: #000;
        }
        .check-car-panel::-webkit-scrollbar {
            width: 6px;
        }
        .check-car-panel::-webkit-scrollbar-track {
            background: transparent;
        }
        .check-car-panel::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.18);
            border-radius: 6px;
        }
        .check-car-panel h3 {
            color: #ff4080;
            font-size: 1.2rem;
            margin: 0;
        }
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .check-car-close {
            cursor: pointer;
            color: #888;
            font-weight: bold;
            font-size: 1.4rem;
            transition: color 0.2s;
        }
        .check-car-close:hover {
            color: #ff4080;
        }
        .info div {
            background: #fff;
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            font-size: 1rem;
            margin: 8px 0;
            word-wrap: break-word;
        }
        .screenshots p {
            font-size: 1rem;
            margin-bottom: 6px;
        }
        .screenshots ul {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 6px;
            padding: 0;
            list-style: none;
        }
        .screenshots img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.2s;
            cursor: pointer;
        }
        .screenshots img:hover {
            transform: scale(1.05);
        }
        /* 图片轮播弹窗（无X按钮） */
        .gallery-mask {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .gallery-container {
            position: relative;
            max-width: 90%;
            max-height: 90%;
            cursor: default;
        }
        .gallery-img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
        }
        .gallery-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.3);
            color: white;
            border: none;
            font-size: 2rem;
            padding: 0 15px;
            cursor: pointer;
            border-radius: 4px;
            user-select: none;
            backdrop-filter: blur(4px);
        }
        .gallery-nav:hover {
            background: rgba(255,255,255,0.5);
        }
        .gallery-prev {
            left: 10px;
        }
        .gallery-next {
            right: 10px;
        }
        @media (max-width: 768px) {
            .check-car-panel { padding: 12px; }
            .info div { font-size: 0.95rem; padding: 6px 10px; }
        }
        /* 深色模式 */
        @media (prefers-color-scheme: dark) {
            .mag-btn-group {
                background: #2d2d2d !important;
                border-color: #404040 !important;
            }
            .mag-btn {
                background: #3a3a3a !important;
                border-color: #555 !important;
            }
            .mag-btn:hover {
                background: #4a4a4a !important;
                border-color: #3399ff !important;
            }
            .mag-btn.active {
                background: #1e3a2a !important;
                border-color: #34ce57 !important;
            }
            .check-car-panel {
                background-color: #2d2d2d;
                color: #e0e0e0;
            }
            .info div {
                background: #3a3a3a;
                color: #e0e0e0;
            }
        }
    `;
    document.head.appendChild(style);

    // ================= 3. 工具函数 =================
    function showToast(msg, success = true) {
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:50px;right:30px;background:${success?'#28a745':'#dc3545'};color:white;padding:10px 20px;border-radius:8px;z-index:100000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    function setBtnActive(clickedBtn, group) {
        group.querySelectorAll('.mag-btn').forEach(btn => {
            btn.innerHTML = btn.dataset.origIcon;
            btn.classList.remove('active');
        });
        clickedBtn.innerHTML = ICONS.checkActive;
        clickedBtn.classList.add('active');
    }

    function highlightBtn(btn) {
        const originalBg = btn.style.backgroundColor;
        btn.style.backgroundColor = '#ffb74d';
        btn.style.transition = 'background-color 0.2s';
        setTimeout(() => {
            btn.style.backgroundColor = originalBg;
        }, 200);
    }

    function hasOtherMagnetButtons(target) {
        const parent = target.parentElement;
        if (!parent) return false;
        const otherSelectors = [
            '.magnet-combined-button',
            '.magnet-button-part',
            '.magnet-loading-btn',
            '.check-car-panel'
        ];
        return otherSelectors.some(sel => parent.querySelector(sel));
    }

    // ================= 4. 番号提取 =================
    function extractCodeFromText(text) {
        if (!text) return null;

        const patterns = [
            // 标准格式：字母-数字（可带后缀）如 ABF-319, IPZZ-777, IPZZ-777-2
            /([A-Z]{2,15})-(\d{2,10})(?:-(\d+))?/i,
            // FC2-PPV 特殊格式
            /FC2[-\s_]?(?:PPV)?[-\s_]?(\d{6,9})/i,
            // 纯数字番号：如 010521-001, 010521_001, 010521001
            /(\d{6})[_-]?(\d{3})/
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                if (pattern === patterns[0]) {
                    return match[3] ? `${match[1]}-${match[2]}-${match[3]}` : `${match[1]}-${match[2]}`;
                } else if (pattern === patterns[1]) {
                    return `FC2-PPV-${match[1]}`;
                } else if (pattern === patterns[2]) {
                    return `${match[1]}-${match[2]}`;
                }
            }
        }
        return null;
    }

    // ================= 5. 图片轮播函数 =================
    function showImageGallery(images, startIndex = 0) {
        if (!images || images.length === 0) return;

        let currentIndex = startIndex;
        const mask = document.createElement('div');
        mask.className = 'gallery-mask';
        mask.addEventListener('click', (e) => {
            if (e.target === mask) mask.remove();
        });

        const updateImage = () => {
            img.src = images[currentIndex];
        };

        const img = document.createElement('img');
        img.className = 'gallery-img';
        img.src = images[currentIndex];

        const container = document.createElement('div');
        container.className = 'gallery-container';

        if (images.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'gallery-nav gallery-prev';
            prevBtn.innerHTML = '‹';
            prevBtn.onclick = (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                updateImage();
            };

            const nextBtn = document.createElement('button');
            nextBtn.className = 'gallery-nav gallery-next';
            nextBtn.innerHTML = '›';
            nextBtn.onclick = (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex + 1) % images.length;
                updateImage();
            };

            container.appendChild(prevBtn);
            container.appendChild(nextBtn);
        }

        container.appendChild(img);
        mask.appendChild(container);
        document.body.appendChild(mask);
    }

    // ================= 6. 验车功能（使用 Vue 组件）=================
    const MagnetPanel = {
        name: 'MagnetPanel',
        props: {
            show: { type: Boolean, required: true },
            magnet: { type: String, required: true },
            info: { type: Object, required: false, default: () => ({}) }
        },
        emits: ['close'],
        setup(props, { emit }) {
            const formatSize = (bytes) => {
                if (!bytes) return '0 B';
                const units = ['B', 'KB', 'MB', 'GB', 'TB'];
                let i = 0;
                let size = bytes;
                while (size >= 1024 && i < units.length - 1) {
                    size /= 1024;
                    i++;
                }
                return size.toFixed(2) + ' ' + units[i];
            };

            const decodeMagnetLink = (magnet) => {
                return magnet.replace(/([?&])([^=]+)=([^&]*)/g, (match, sep, key, value) => {
                    try {
                        return `${sep}${key}=${decodeURIComponent(value)}`;
                    } catch (e) {
                        return match;
                    }
                });
            };

            const preview = (src) => {
                const shots = props.info.screenshots || [];
                const urls = shots.map(s => s.screenshot || s);
                const currentIndex = urls.indexOf(src);
                showImageGallery(urls, currentIndex !== -1 ? currentIndex : 0);
            };

            return () => vue.h('div', {
                class: 'check-car-mask',
                onClick: (e) => { if (e.target === e.currentTarget) emit('close'); }
            }, [
                vue.h('div', { class: 'check-car-panel' }, [
                    vue.h('div', { class: 'panel-header' }, [
                        vue.h('h3', null, [
                            vue.h('span', { style: { fontSize: '22px' } }, '🚗'),
                            ' ',
                            vue.h('b', null, '磁力信息')
                        ]),
                        vue.h('span', { class: 'check-car-close', onClick: () => emit('close') }, '✖')
                    ]),
                    vue.h('div', { class: 'panel-body' }, [
                        props.info ? vue.h('div', { class: 'info' }, [
                            vue.h('div', { class: 'magnet' }, [
                                vue.h('b', null, '磁力链接：'),
                                vue.h('a', { href: props.magnet, target: '_blank' }, decodeMagnetLink(props.magnet))
                            ]),
                            vue.h('div', null, [vue.h('b', null, '名称：'), ' ', props.info.name || '未知']),
                            vue.h('div', null, [vue.h('b', null, '文件类型：'), ' ', props.info.file_type || '未知']),
                            vue.h('div', null, [vue.h('b', null, '大小：'), ' ', formatSize(props.info.size)]),
                            vue.h('div', null, [vue.h('b', null, '文件数量：'), ' ', props.info.count || 0]),
                            props.info.screenshots && props.info.screenshots.length ? vue.h('div', { class: 'screenshots' }, [
                                vue.h('p', null, [vue.h('b', null, '截图：')]),
                                vue.h('ul', null, props.info.screenshots.map((shot, idx) =>
                                    vue.h('li', { key: idx }, [
                                        vue.h('img', {
                                            src: shot.screenshot,
                                            onClick: () => preview(shot.screenshot),
                                            alt: '截图 ' + (idx + 1)
                                        })
                                    ])
                                ))
                            ]) : null
                        ]) : vue.h('div', null, '等待获取...')
                    ])
                ])
            ]);
        }
    };

    function GM_Request({ method = "GET", url, data = null, headers = {} }) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                data: data && typeof data === "object" ? JSON.stringify(data) : data,
                onload: (res) => {
                    try {
                        const contentType = res.responseHeaders || "";
                        if (contentType.includes("application/json")) {
                            resolve(JSON.parse(res.responseText));
                        } else {
                            resolve(res.responseText);
                        }
                    } catch (err) {
                        reject(err);
                    }
                },
                onerror: (err) => reject(err)
            });
        });
    }

    async function getMagnetInfo(magnet) {
        const url = `https://whatslink.info/api/v1/link?url=${encodeURIComponent(magnet)}`;
        try {
            return await GM_Request({ method: "GET", url, headers: { "Accept": "application/json" } });
        } catch (err) {
            console.error("获取磁力信息失败", err);
            return null;
        }
    }

    async function handleCheckCar(link, btn) {
        highlightBtn(btn);
        showToast('🔍 正在查询磁力信息...', true);
        const info = await getMagnetInfo(link);
        if (!info) {
            showToast('❌ 查询失败', false);
            return;
        }

        const mountPoint = document.createElement('div');
        document.body.appendChild(mountPoint);

        const app = vue.createApp({
            render: () => vue.h(MagnetPanel, {
                show: true,
                magnet: link,
                info: info,
                onClose: () => {
                    app.unmount();
                    mountPoint.remove();
                }
            })
        });
        app.mount(mountPoint);
    }

    // ================= 7. 精简磁力链接（含番号提取）=================
    function simplifyMagnetLink(link) {
        if (!link.startsWith('magnet:?')) return link;
        try {
            const paramRegex = /[?&]([^=]+)=([^&]*)/g;
            let match;
            let xt = null;
            let dn = null;
            while ((match = paramRegex.exec(link)) !== null) {
                const key = match[1];
                const value = match[2];
                if (key === 'xt') {
                    xt = value;
                } else if (key === 'dn') {
                    dn = value;
                }
            }
            if (!xt) return link;

            let newLink = `magnet:?xt=${xt}`;
            if (dn) {
                let decodedDn = null;
                try {
                    decodedDn = decodeURIComponent(dn);
                } catch (e) {
                    decodedDn = dn;
                }
                const code = extractCodeFromText(decodedDn);
                if (code) {
                    newLink += `&dn=${code}`;
                } else {
                    newLink += `&dn=${decodedDn}`;
                }
            }
            return newLink;
        } catch (e) {
            console.warn('精简磁力链接失败，使用原始链接', e);
            return link;
        }
    }

    // ================= 8. 按钮组构建 =================
    function createBtnGroup(link) {
        const group = document.createElement('span');
        group.className = 'mag-btn-group';
        group.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };

        const addBtn = (type, icon, title, action) => {
            const btn = document.createElement('div');
            btn.className = 'mag-btn';
            btn.innerHTML = icon;
            btn.title = title;
            btn.dataset.origIcon = icon;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (type === 'check') {
                    action(btn);
                } else {
                    setBtnActive(btn, group);
                    action();
                }
            };
            group.appendChild(btn);
        };

        if (config.enableCopy) {
            addBtn('copy', ICONS.copy, '复制链接', () => {
                const processedLink = simplifyMagnetLink(link);
                GM_setClipboard(processedLink, 'text');
                if (processedLink !== link) {
                    showToast('📋 精简链接已复制');
                } else {
                    showToast('📋 链接已复制');
                }
            });
        }
        if (config.enableQb) {
            addBtn('qb', ICONS.qb, '推送至 qB', () => pushToQb(link));
        }
        if (config.enable115) {
            addBtn('115', ICONS.u115, '115 离线', () => pushTo115(link));
        }
        if (config.enableCheck) {
            addBtn('check', ICONS.car, '验车', (btn) => handleCheckCar(link, btn));
        }

        return group;
    }

    // ================= 9. 推送函数 =================
    function pushToQb(link) {
        GM_xmlhttpRequest({
            method: "POST",
            url: `${config.qbtHost}/api/v2/auth/login`,
            data: `username=${config.qbtUser}&password=${config.qbtPass}`,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            onload: (res) => {
                if (res.status === 200) {
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: `${config.qbtHost}/api/v2/torrents/add`,
                        data: `urls=${encodeURIComponent(link)}`,
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        onload: (r) => {
                            if (r.status === 200) showToast('✅ 已推送到 qB');
                            else showToast('❌ 推送失败', false);
                        },
                        onerror: () => showToast('❌ 推送请求失败', false)
                    });
                } else showToast('🚫 qB 登录失败', false);
            },
            onerror: () => showToast('❌ 无法连接到 qB', false)
        });
    }

    function pushTo115(link) {
        if (!config.u115Uid) { showToast('⚠️ 未设置 115 UID', false); return; }
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://115.com/web/lixian/?ct=lixian&ac=add_task_url',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: `url=${encodeURIComponent(link)}&uid=${config.u115Uid}`,
            onload: (response) => {
                try {
                    const res = JSON.parse(response.responseText);
                    if (res.state) showToast('✅ 已发送到 115');
                    else showToast('❌ 115错误: ' + res.error_msg, false);
                } catch(e) { showToast('❌ 115 响应解析失败', false); }
            }
        });
    }

    // ================= 10. 特殊处理：laosiji.js 表格 =================
    function handleLaosijiTable() {
        const table = document.getElementById('nong-table-new');
        if (!table) return;

        // 遍历每一行（跳过表头）
        const rows = table.querySelectorAll('tr.jav-nong-row:not(#jav-nong-head)');
        rows.forEach(row => {
            const cells = row.cells;
            if (cells.length < 3) return;
            const operationCell = cells[2]; // 操作列（第三列，索引2）
            // 获取磁力链接：优先从第一个单元格的a标签获取
            const magnetLink = row.querySelector('td:first-child a[href^="magnet:"]')?.href;
            if (!magnetLink) return;

            // 避免重复添加
            if (operationCell.querySelector('.mag-btn-group')) return;

            // 创建我们的按钮组
            const btnGroup = createBtnGroup(magnetLink);

            // 移除原有的复制按钮（如果有）
            const oldCopy = operationCell.querySelector('.nong-copy');
            if (oldCopy) oldCopy.remove();

            // 插入按钮组
            operationCell.appendChild(btnGroup);
        });
    }

    // ================= 11. 页面扫描（整合 laosiji 处理）=================
    function processPage() {
        const regex = /(magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}|ed2k:\/\/\|file\|[^|]+\|\d+\|[a-fA-F0-9]{32}\|)/gi;

        // 先处理 laosiji 表格
        handleLaosijiTable();

        // 收集已处理的磁力链接（避免重复）
        const processedHrefs = new Set();
        document.querySelectorAll('a[data-mag-processed="true"]').forEach(a => {
            if (a.href) processedHrefs.add(a.href);
        });

        // 处理 <a> 标签（排除 laosiji 表格内的链接，它们已被特殊处理）
        document.querySelectorAll('a').forEach(a => {
            // 跳过 laosiji 表格内的所有 a 标签
            if (a.closest('#nong-table-new')) return;
            if (a.closest('.check-car-panel')) return;
            if (a.dataset.magProcessed) return;
            if (a.classList.contains('magnet-link')) return;
            const href = a.href || '';
            if (href.match(regex)) {
                if (a.nextElementSibling?.classList?.contains('mag-btn-group')) return;
                if (hasOtherMagnetButtons(a)) return;
                a.after(createBtnGroup(href));
                a.dataset.magProcessed = 'true';
                processedHrefs.add(href);
            }
        });

        // 处理文本节点（同样跳过 laosiji 表格内的节点）
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        const textNodes = [];
        while (node = walker.nextNode()) {
            const parent = node.parentElement;
            if (!parent || parent.closest('#nong-table-new') || parent.closest('.check-car-panel') || parent.closest('.mag-btn-group') || parent.closest('[data-mag-processed]') ||
                ['SCRIPT', 'STYLE', 'A', 'TEXTAREA', 'INPUT'].includes(parent.tagName)) continue;
            if (node.nodeValue.match(regex)) textNodes.push(node);
        }

        textNodes.forEach(node => {
            const parent = node.parentElement;
            if (!parent) return;
            const content = node.nodeValue;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0, match;

            while ((match = regex.exec(content)) !== null) {
                fragment.appendChild(document.createTextNode(content.substring(lastIndex, match.index)));
                const link = match[0];
                const span = document.createElement('span');
                span.textContent = link;
                span.dataset.magProcessed = 'true';
                fragment.appendChild(span);

                const yancheLinkExists = Array.from(document.querySelectorAll('a.magnet-link[href="' + link.replace(/"/g, '\\"') + '"]')).length > 0;
                if (!processedHrefs.has(link) && !yancheLinkExists && !hasOtherMagnetButtons(parent)) {
                    fragment.appendChild(createBtnGroup(link));
                }
                lastIndex = regex.lastIndex;
            }
            fragment.appendChild(document.createTextNode(content.substring(lastIndex)));
            try { parent.replaceChild(fragment, node); } catch (e) {}
        });
    }

    // ================= 12. 设置面板 =================
    function showSettingsModal() {
        const mask = document.createElement('div');
        mask.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;font-family:sans-serif;';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:white;padding:25px;border-radius:12px;width:450px;box-shadow:0 10px 25px rgba(0,0,0,0.2);';

        modal.innerHTML = `
            <div class="tab-header" style="display:flex;border-bottom:1px solid #ddd;margin-bottom:20px;">
                <div class="tab" data-tab="general" style="padding:8px 16px;cursor:pointer;border-bottom:2px solid #0078d4;">常规</div>
                <div class="tab" data-tab="qb" style="padding:8px 16px;cursor:pointer;">qBittorrent</div>
                <div class="tab" data-tab="115" style="padding:8px 16px;cursor:pointer;">115网盘</div>
                <div class="tab" data-tab="advanced" style="padding:8px 16px;cursor:pointer;">高级</div>
            </div>
            <div id="tab-content" style="min-height:150px;"></div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:25px;">
                <button id="btn_cancel" style="padding:8px 15px;border:1px solid #ccc;background:#eee;border-radius:4px;cursor:pointer;">取消</button>
                <button id="btn_save" style="padding:8px 15px;border:none;background:#0078d4;color:white;border-radius:4px;cursor:pointer;">保存设置</button>
            </div>
        `;

        mask.appendChild(modal);
        document.body.appendChild(mask);

        const header = modal.querySelector('.tab-header');
        const contentDiv = modal.querySelector('#tab-content');

        const panels = {
            general: `
                <div style="margin-bottom:15px;">
                    <label style="display:flex;align-items:center;margin-bottom:10px;"><input type="checkbox" id="sw_copy" ${config.enableCopy?'checked':''}> <span style="margin-left:8px;">显示复制按钮</span></label>
                    <label style="display:flex;align-items:center;margin-bottom:10px;"><input type="checkbox" id="sw_qb" ${config.enableQb?'checked':''}> <span style="margin-left:8px;">显示 qB 推送按钮</span></label>
                    <label style="display:flex;align-items:center;margin-bottom:10px;"><input type="checkbox" id="sw_115" ${config.enable115?'checked':''}> <span style="margin-left:8px;">显示 115 离线按钮</span></label>
                    <label style="display:flex;align-items:center;margin-bottom:10px;"><input type="checkbox" id="sw_check" ${config.enableCheck?'checked':''}> <span style="margin-left:8px;">显示验车按钮</span></label>
                </div>
            `,
            qb: `
                <div style="border-top:1px solid #eee;padding-top:15px;">
                    <input id="in_host" type="text" placeholder="qB 地址 (如 http://127.0.0.1:8080)" value="${config.qbtHost}" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;">
                    <div style="display:flex;gap:5px;margin-bottom:8px;">
                        <input id="in_user" type="text" placeholder="用户名" value="${config.qbtUser}" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;">
                        <input id="in_pass" type="password" placeholder="密码" value="${config.qbtPass}" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;">
                    </div>
                    <button id="test_qb" style="padding:8px 15px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:5px;">测试连接</button>
                    <span id="qb_test_result" style="margin-left:10px;font-size:13px;"></span>
                </div>
            `,
            '115': `
                <div style="border-top:1px solid #eee;padding-top:15px;">
                    <input id="in_uid" type="text" placeholder="115文件夹识别码（离线任务保存目录）" value="${config.u115Uid}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;">
                    <button id="test_115" style="padding:8px 15px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">检查115登录状态</button>
                    <span id="u115_test_result" style="margin-left:10px;font-size:13px;"></span>
                    <p style="font-size:12px;color:#666;margin-top:8px;">需要先在浏览器中登录115官网，然后点击检查状态。</p>
                </div>
            `,
            advanced: `
                <div style="border-top:1px solid #eee;padding-top:15px;">
                    <button id="export_config" style="padding:8px 15px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:5px;">导出配置</button>
                    <button id="import_config" style="padding:8px 15px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;">导入配置</button>
                    <input type="file" id="import_file" accept=".json" style="display:none;">
                    <p style="font-size:12px;color:#666;margin-top:10px;">导出文件为 JSON 格式，可在其他浏览器中导入。</p>
                </div>
            `
        };

        contentDiv.innerHTML = panels.general;

        header.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;

            header.querySelectorAll('.tab').forEach(t => t.style.borderBottom = '2px solid transparent');
            tab.style.borderBottom = '2px solid #0078d4';

            const tabName = tab.dataset.tab;
            contentDiv.innerHTML = panels[tabName];

            if (tabName === 'qb') {
                modal.querySelector('#test_qb')?.addEventListener('click', testQbConnection);
            } else if (tabName === '115') {
                modal.querySelector('#test_115')?.addEventListener('click', test115Connection);
            } else if (tabName === 'advanced') {
                modal.querySelector('#export_config')?.addEventListener('click', exportConfig);
                modal.querySelector('#import_config')?.addEventListener('click', () => modal.querySelector('#import_file').click());
                modal.querySelector('#import_file')?.addEventListener('change', importConfig);
            }
        });

        function testQbConnection() {
            const host = modal.querySelector('#in_host').value.trim();
            const user = modal.querySelector('#in_user').value.trim();
            const pass = modal.querySelector('#in_pass').value.trim();
            const resultSpan = modal.querySelector('#qb_test_result');
            resultSpan.textContent = '测试中...';
            GM_xmlhttpRequest({
                method: 'POST',
                url: host + '/api/v2/auth/login',
                data: `username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                onload: (res) => {
                    if (res.status === 200) {
                        resultSpan.innerHTML = '✅ 连接成功';
                    } else {
                        resultSpan.innerHTML = '❌ 连接失败（状态码 ' + res.status + '）';
                    }
                },
                onerror: () => {
                    resultSpan.innerHTML = '❌ 网络错误或地址不可达';
                }
            });
        }

        function test115Connection() {
            const resultSpan = modal.querySelector('#u115_test_result');
            resultSpan.textContent = '检查登录状态...';
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://115.com/web/lixian/?ct=lixian&ac=task_lists&t=' + Date.now(),
                anonymous: false,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://115.com/web/lixian/'
                },
                onload: (res) => {
                    try {
                        if (res.finalUrl && res.finalUrl.includes('login.115.com')) {
                            resultSpan.innerHTML = '❌ 未登录，请先登录115官网';
                            return;
                        }
                        const text = res.responseText;
                        let json = null;
                        try { json = JSON.parse(text); } catch (_) {}
                        if (json) {
                            if (json.state === true || json.errno === 0) {
                                resultSpan.innerHTML = '✅ 已登录115';
                            } else {
                                resultSpan.innerHTML = '❌ 未登录或登录已过期';
                            }
                        } else {
                            if (text.includes('登录') || text.includes('login') || text.includes('passport')) {
                                resultSpan.innerHTML = '❌ 未登录，请先登录115官网';
                            } else {
                                resultSpan.innerHTML = '❌ 无法判断登录状态（未知响应）';
                            }
                        }
                    } catch (e) {
                        resultSpan.innerHTML = '❌ 检查失败：' + e.message;
                    }
                },
                onerror: () => {
                    resultSpan.innerHTML = '❌ 网络错误';
                }
            });
        }

        function exportConfig() {
            const currentConfig = {
                enableCopy: modal.querySelector('#sw_copy')?.checked ?? config.enableCopy,
                enableQb: modal.querySelector('#sw_qb')?.checked ?? config.enableQb,
                enable115: modal.querySelector('#sw_115')?.checked ?? config.enable115,
                enableCheck: modal.querySelector('#sw_check')?.checked ?? config.enableCheck,
                qbtHost: modal.querySelector('#in_host')?.value.trim() ?? config.qbtHost,
                qbtUser: modal.querySelector('#in_user')?.value.trim() ?? config.qbtUser,
                qbtPass: modal.querySelector('#in_pass')?.value.trim() ?? config.qbtPass,
                u115Uid: modal.querySelector('#in_uid')?.value.trim() ?? config.u115Uid
            };
            const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'magnet-assistant-config.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        function importConfig(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (modal.querySelector('#sw_copy')) modal.querySelector('#sw_copy').checked = imported.enableCopy ?? true;
                    if (modal.querySelector('#sw_qb')) modal.querySelector('#sw_qb').checked = imported.enableQb ?? true;
                    if (modal.querySelector('#sw_115')) modal.querySelector('#sw_115').checked = imported.enable115 ?? false;
                    if (modal.querySelector('#sw_check')) modal.querySelector('#sw_check').checked = imported.enableCheck ?? true;
                    if (modal.querySelector('#in_host')) modal.querySelector('#in_host').value = imported.qbtHost || 'http://127.0.0.1:8080';
                    if (modal.querySelector('#in_user')) modal.querySelector('#in_user').value = imported.qbtUser || 'admin';
                    if (modal.querySelector('#in_pass')) modal.querySelector('#in_pass').value = imported.qbtPass || 'adminadmin';
                    if (modal.querySelector('#in_uid')) modal.querySelector('#in_uid').value = imported.u115Uid || '';
                    showToast('✅ 配置导入成功，请检查后保存');
                } catch (err) {
                    showToast('❌ 配置文件格式错误', false);
                }
            };
            reader.readAsText(file);
        }

        modal.querySelector('#btn_save').onclick = () => {
            GM_setValue('enableCopy', modal.querySelector('#sw_copy')?.checked ?? config.enableCopy);
            GM_setValue('enableQb', modal.querySelector('#sw_qb')?.checked ?? config.enableQb);
            GM_setValue('enable115', modal.querySelector('#sw_115')?.checked ?? config.enable115);
            GM_setValue('enableCheck', modal.querySelector('#sw_check')?.checked ?? config.enableCheck);
            GM_setValue('qbtHost', modal.querySelector('#in_host')?.value.trim() ?? config.qbtHost);
            GM_setValue('qbtUser', modal.querySelector('#in_user')?.value.trim() ?? config.qbtUser);
            GM_setValue('qbtPass', modal.querySelector('#in_pass')?.value.trim() ?? config.qbtPass);
            GM_setValue('u115Uid', modal.querySelector('#in_uid')?.value.trim() ?? config.u115Uid);
            mask.remove();
            showToast('✅ 设置已保存，刷新页面生效');
            setTimeout(() => location.reload(), 1000);
        };

        modal.querySelector('#btn_cancel').onclick = () => mask.remove();
    }

    // ================= 13. 启动监听 =================
    let timer = null;
    function lazyRun() { if (timer) clearTimeout(timer); timer = setTimeout(processPage, 500); }
    processPage();
    const observer = new MutationObserver(lazyRun);
    observer.observe(document.body, { childList: true, subtree: true });

})(Vue);
