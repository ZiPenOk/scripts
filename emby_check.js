// ==UserScript==
// @name         跳转到Emby播放(改)
// @namespace    https://github.com/ZiPenOk
// @version      3.7
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
// @match        *://*169bbs*.*/*
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

    // 全局配置对象（多服务器版）—— 新增 darkMode 配置
    const Config = {
        // 服务器列表
        get embyServers() {
            return GM_getValue('embyServers', []);
        },
        set embyServers(val) {
            GM_setValue('embyServers', val);
        },
        // 当前活动服务器索引
        get activeServerIndex() {
            return GM_getValue('activeServerIndex', 0);
        },
        set activeServerIndex(val) {
            GM_setValue('activeServerIndex', val);
        },

        // 兼容原有单服务器属性（从当前活动服务器读取）
        get embyBaseUrl() {
            const servers = this.embyServers;
            if (servers.length > 0 && this.activeServerIndex < servers.length) {
                return servers[this.activeServerIndex].baseUrl;
            }
            return '';
        },
        get embyAPI() {
            const servers = this.embyServers;
            if (servers.length > 0 && this.activeServerIndex < servers.length) {
                return servers[this.activeServerIndex].apiKey;
            }
            return '';
        },
        // 设置时更新当前活动服务器
        set embyBaseUrl(val) {
            let servers = this.embyServers;
            if (servers.length === 0) {
                servers = [{ name: '默认服务器', baseUrl: val, apiKey: '' }];
                this.embyServers = servers;
                this.activeServerIndex = 0;
            } else if (this.activeServerIndex < servers.length) {
                servers[this.activeServerIndex].baseUrl = val;
                this.embyServers = servers;
            }
        },
        set embyAPI(val) {
            let servers = this.embyServers;
            if (servers.length === 0) {
                servers = [{ name: '默认服务器', baseUrl: '', apiKey: val }];
                this.embyServers = servers;
                this.activeServerIndex = 0;
            } else if (this.activeServerIndex < servers.length) {
                servers[this.activeServerIndex].apiKey = val;
                this.embyServers = servers;
            }
        },

        // 徽章相关配置
        get highlightColor() {
            return GM_getValue('highlightColor', '#52b54b');
        },
        get maxConcurrentRequests() {
            return GM_getValue('maxConcurrentRequests', 50);
        },
        get badgeColor() {
            return GM_getValue('badgeColor', '#2ecc71');
        },
        get badgeTextColor() {
            return GM_getValue('badgeTextColor', '#fff');
        },
        get badgeSize() {
            return GM_getValue('badgeSize', 'medium');
        },
        get enabledSites() {
            return GM_getValue('enabledSites', {
                javbus: { list: true, detail: true },
                javdb: { list: true, detail: true },
                supjav: { list: true, detail: true },
                sehuatang: { list: false, detail: true },
                sukebeiNyaa: { list: true, detail: true },
                javlibrary: { list: false, detail: true },
                madou: { list: false, detail: true },
                javrate: { list: false, detail: true },
                '169bbs': { list: true, detail: true }
            });
        },
        // ===== 新增深色模式配置 =====
        get darkMode() {
            return GM_getValue('darkMode', false);
        },
        set darkMode(val) {
            GM_setValue('darkMode', val);
        },

        // Setters
        set highlightColor(val) { GM_setValue('highlightColor', val); },
        set maxConcurrentRequests(val) { GM_setValue('maxConcurrentRequests', val); },
        set badgeColor(val) { GM_setValue('badgeColor', val); },
        set badgeTextColor(val) { GM_setValue('badgeTextColor', val); },
        set badgeSize(val) { GM_setValue('badgeSize', val); },
        set enabledSites(val) { GM_setValue('enabledSites', val); },

        // 迁移旧数据（如果存在）
        _migrateOldConfig() {
            const oldBaseUrl = GM_getValue('embyBaseUrl', '');
            const oldApiKey = GM_getValue('embyAPI', '');
            const servers = this.embyServers;
            if ((oldBaseUrl || oldApiKey) && servers.length === 0) {
                this.embyServers = [{
                    name: '默认服务器',
                    baseUrl: oldBaseUrl,
                    apiKey: oldApiKey
                }];
                this.activeServerIndex = 0;
            }
        },

        isValid() {
            const servers = this.embyServers;
            return servers.length > 0 &&
                   this.activeServerIndex < servers.length &&
                   !!servers[this.activeServerIndex].baseUrl &&
                   !!servers[this.activeServerIndex].apiKey;
        }
    };

    // 立即执行迁移
    Config._migrateOldConfig();

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
            background-color: rgba(40, 167, 69, 0.9) !important;
        }
        .emby-jump-status-indicator.error {
            background-color: rgba(220, 53, 69, 0.9) !important;
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

        /* 现代化设置面板 */
        .emby-jump-settings-panel.modern {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            background: #eef2f5;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            padding: 0;
            width: 900px;
            max-width: 95vw;
            overflow: hidden;
        }

        .modern .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: #ffffffd9;
            backdrop-filter: blur(4px);
            border-bottom: 1px solid #d0d7dd;
        }

        .modern .settings-header h3 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            color: #1e2a3a;
        }

        .modern .settings-header .close-btn {
            background: none;
            border: none;
            font-size: 26px;
            cursor: pointer;
            color: #6c7a8a;
            line-height: 1;
        }

        .modern .settings-content {
            padding: 20px;
            max-height: 70vh;
            overflow-y: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .modern .left-column,
        .modern .right-column {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .modern .settings-card {
            background: #ffffffde;
            backdrop-filter: blur(2px);
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
            border: 1px solid #d9e1e8;
        }

        .modern .card-title {
            font-weight: 600;
            margin-bottom: 12px;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 18px;
        }

        .modern .card-title.collapsible {
            cursor: pointer;
            user-select: none;
            justify-content: space-between;
            margin-bottom: 0;
        }

        .modern .card-body.two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .modern .field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .modern .field label {
            font-size: 16px;
            font-weight: 500;
            color: #4a5a6e;
        }

        .modern .field input,
        .modern .field select {
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.15s;
            box-sizing: border-box;
            background-color: #ffffff;
        }

        .modern .field input:focus,
        .modern .field select:focus {
            outline: none;
            border-color: #52b54b;
            box-shadow: 0 0 0 3px rgba(82,181,75,0.15);
        }

        .modern .field small {
            font-size: 14px;
            color: #7c8b9c;
        }

        .modern .color-field {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
        }

        .modern .color-field label {
            width: 70px;
            flex-shrink: 0;
            font-size: 16px;
        }

        .modern .color-field input[type="color"] {
            width: 60px;
            height: 36px;
            padding: 2px;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
        }

        .modern .test-btn {
            background: #e2e8f0;
            border: 1px solid #b9c7d9;
            border-radius: 30px;
            padding: 8px 16px;
            font-size: 15px;
            cursor: pointer;
            color: #1e293b;
        }

        .modern .test-btn:hover {
            background: #d1dbe8;
        }

        /* 服务器管理表格 */
        .modern .servers-table {
            width: 100%;
            margin-top: 8px;
        }

        .modern .servers-table-header {
            display: flex;
            font-weight: 600;
            background-color: #e6edf5;
            border-bottom: 2px solid #b9c7d9;
            padding: 8px 12px;
        }

        .modern .servers-table-header > div:first-child {
            flex: 2;
        }
        .modern .servers-table-header > div:last-child {
            flex: 1;
            text-align: center;
        }

        .modern .server-row {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #d9e1e8;
        }

        .modern .server-info {
            flex: 2;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .modern .server-name {
            font-weight: 500;
            color: #1e293b;
            font-size: 16px;
        }

        .modern .server-url {
            font-size: 14px;
            color: #5a6f88;
            word-break: break-all;
        }

        .modern .server-api {
            font-size: 14px;
            color: #5a6f88;
            font-family: monospace;
        }

        .modern .server-actions {
            flex: 1;
            display: flex;
            justify-content: center;
            gap: 8px;
        }

        .modern .server-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            line-height: 1;
        }

        .modern .server-btn:hover:not(:disabled) {
            background-color: #d9e1e8;
        }

        .modern .server-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .modern .active-badge {
            font-size: 1.2rem;
            color: #52b54b;
            padding: 4px;
        }

        .modern .btn.secondary {
            background: #e2e8f0;
            color: #1e293b;
            border: 1px solid #b9c7d9;
            padding: 8px 16px;
            border-radius: 30px;
            font-weight: 500;
            cursor: pointer;
            font-size: 15px;
        }

        .modern .btn.secondary:hover {
            background: #d1dbe8;
        }

        /* 滑动开关 */
        .modern .switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }

        .modern .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .modern .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #b9c7d9;
            transition: .2s;
            border-radius: 24px;
        }

        .modern .slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .2s;
            border-radius: 50%;
        }

        .modern input:checked + .slider {
            background-color: #52b54b;
        }

        .modern input:checked + .slider:before {
            transform: translateX(20px);
        }

        /* 站点表格 */
        .modern .sites-table {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }

        .modern .sites-table-header {
            display: table-row;
            font-weight: 600;
            background-color: #e6edf5;
            border-bottom: 2px solid #b9c7d9;
        }

        .modern .sites-table-header > div {
            display: table-cell;
            padding: 8px 12px;
            font-size: 16px;
        }

        .modern .sites-row {
            display: table-row;
            border-bottom: 1px solid #d9e1e8;
        }

        .modern .sites-row > div {
            display: table-cell;
            padding: 10px 12px;
            vertical-align: middle;
        }

        .modern .site-name {
            font-weight: 500;
            color: #2c3e50;
            font-size: 16px;
        }

        .modern .site-toggle {
            text-align: center;
        }

        .modern .settings-footer {
            padding: 16px 20px;
            background: #ffffffd9;
            backdrop-filter: blur(4px);
            border-top: 1px solid #d0d7dd;
            display: flex;
            justify-content: space-between;  /* 改为 space-between 使左右分离 */
            align-items: center;
            gap: 12px;
        }

        .modern .btn {
            padding: 8px 20px;
            border-radius: 30px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            font-size: 15px;
        }

        .modern .btn.cancel {
            background: #e2e8f0;
            color: #1e293b;
            border: 1px solid #b9c7d9;
        }

        .modern .btn.save {
            background: #52b54b;
            color: white;
        }

        .modern .btn.save:hover {
            background: #3e9e37;
        }

        /* ===== 新增深色模式切换图标样式 ===== */
        .modern .dark-mode-toggle {
            font-size: 26px;
            cursor: pointer;
            line-height: 1;
            padding: 0 4px;
            user-select: none;
            transition: transform 0.2s;
        }
        .modern .dark-mode-toggle:hover {
            transform: scale(1.1);
        }

        /* ===== 深色模式样式定义 ===== */
        .emby-jump-settings-panel.modern.dark-mode {
            background: #1a1a2a;
            color: #c0c0d0;
        }
        .modern.dark-mode .settings-header {
            background: #242435;
            border-bottom-color: #3a3a50;
        }
        .modern.dark-mode .settings-header h3 {
            color: #fff;
        }
        .modern.dark-mode .settings-card {
            background: #242435;
            border-color: #3a3a50;
        }
        .modern.dark-mode .card-title {
            color: #d0d0e0;
        }
        .modern.dark-mode .field label {
            color: #b0b0c0;
        }
        .modern.dark-mode .field input,
        .modern.dark-mode .field select {
            background-color: #1e1e30;
            border-color: #4a4a60;
            color: #e0e0f0;
        }
        .modern.dark-mode .field input:focus,
        .modern.dark-mode .field select:focus {
            border-color: #52b54b;
        }
        .modern.dark-mode .servers-table-header {
            background-color: #2a2a40;
            border-bottom-color: #4a4a60;
            color: #ccc;
        }
        .modern.dark-mode .server-row {
            border-bottom-color: #3a3a50;
        }
        .modern.dark-mode .server-name {
            color: #d0d0e0;
        }
        .modern.dark-mode .server-url,
        .modern.dark-mode .server-api {
            color: #a0a0b8;
        }
        .modern.dark-mode .server-btn:hover:not(:disabled) {
            background-color: #3a3a50;
        }
        .modern.dark-mode .btn.secondary {
            background: #2e2e42;
            border-color: #5a5a78;
            color: #ddd;
        }
        .modern.dark-mode .btn.secondary:hover {
            background: #3e3e58;
        }
        .modern.dark-mode .test-btn {
            background: #2e2e42;
            border-color: #5a5a78;
            color: #ddd;
        }
        .modern.dark-mode .test-btn:hover {
            background: #3e3e58;
        }
        .modern.dark-mode .settings-footer {
            background: #242435;
            border-top-color: #3a3a50;
        }
        .modern.dark-mode .btn.cancel {
            background: #3a3a50;
            color: #ddd;
            border-color: #5a5a78;
        }
        .modern.dark-mode .btn.save {
            background: #3e9e37;
        }
        .modern.dark-mode .close-btn {
            color: #aaa;
        }
        .modern.dark-mode .sites-table-header {
            background-color: #2a2a40;
        }
        .modern.dark-mode .sites-row {
            border-bottom-color: #3a3a50;
        }
        .modern.dark-mode .site-name {
            color: #d0d0e0;
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

    // 设置面板 - 多服务器版（新增深色模式切换）
    const SettingsUI = {
        show() {
            let panel = document.getElementById('emby-jump-settings-panel');
            if (panel) {
                panel.style.display = 'block';
                return;
            }

            panel = document.createElement('div');
            panel.id = 'emby-jump-settings-panel';
            panel.className = 'emby-jump-settings-panel modern';
            // 根据保存的深色模式设置初始类
            if (Config.darkMode) {
                panel.classList.add('dark-mode');
            }

            // 读取当前配置
            const currentConfig = {
                embyServers: Config.embyServers,
                activeServerIndex: Config.activeServerIndex,
                highlightColor: Config.highlightColor,
                maxConcurrentRequests: Config.maxConcurrentRequests,
                badgeSize: Config.badgeSize,
                badgeColor: Config.badgeColor,
                badgeTextColor: Config.badgeTextColor,
                enabledSites: Config.enabledSites,
                darkMode: Config.darkMode
            };

            // 生成服务器列表HTML
            function generateServersHTML() {
                const servers = Config.embyServers;
                if (!servers || servers.length === 0) {
                    return '<div style="padding: 12px; text-align: center; color: #999;">暂无服务器，请添加</div>';
                }
                let rows = '';
                servers.forEach((server, index) => {
                    const isActive = index === Config.activeServerIndex;
                    rows += `
                        <div class="server-row" data-index="${index}">
                            <div class="server-info">
                                <span class="server-name">${server.name || '未命名'}</span>
                                <span class="server-url">${server.baseUrl}</span>
                                <span class="server-api">${server.apiKey ? '••••••' + server.apiKey.slice(-4) : '未设置'}</span>
                            </div>
                            <div class="server-actions">
                                ${!isActive ? '<button class="server-btn set-active" title="设为默认">⭐</button>' : '<span class="active-badge" title="当前默认">✅</span>'}
                                <button class="server-btn edit-server" title="编辑">✏️</button>
                                <button class="server-btn delete-server" title="删除" ${servers.length === 1 ? 'disabled' : ''}>🗑️</button>
                            </div>
                        </div>
                    `;
                });
                return rows;
            }

            // 生成站点开关表格行
            function generateSitesRows() {
                const sites = currentConfig.enabledSites;
                let rows = '';
                for (const site in sites) {
                    rows += `
                        <div class="sites-row">
                            <div class="site-name">${site}</div>
                            <div class="site-toggle">
                                <label class="switch">
                                    <input type="checkbox" data-site="${site}" data-type="list" ${sites[site].list ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="site-toggle">
                                <label class="switch">
                                    <input type="checkbox" data-site="${site}" data-type="detail" ${sites[site].detail ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    `;
                }
                return rows;
            }

            // 图标显示：深色模式开启时显示☀️（点击切回浅色），关闭时显示🌙（点击切深色）
            const darkModeIcon = Config.darkMode ? '☀️' : '🌙';
            const darkModeTitle = Config.darkMode ? '切换浅色模式' : '切换深色模式';

            panel.innerHTML = `
                <div class="settings-header">
                    <h3><span class="icon">⚙️</span> Emby 设置</h3>
                    <span class="close-btn">&times;</span>
                </div>
                <div class="settings-content">
                    <!-- 服务器管理卡片（跨列，默认折叠） -->
                    <div class="settings-card" style="grid-column: 1 / -1;">
                        <div class="card-title collapsible" id="servers-toggle-header">
                            <span>🖥️ 服务器管理</span>
                            <span class="toggle-icon" id="servers-toggle-icon">▶</span>
                        </div>
                        <div class="card-body" id="servers-grid" style="display: none;">
                            <div class="servers-table">
                                <div class="servers-table-header">
                                    <div>服务器列表</div>
                                    <div>操作</div>
                                </div>
                                <div id="servers-list-container">
                                    ${generateServersHTML()}
                                </div>
                            </div>
                            <div style="margin-top: 12px; display: flex; gap: 8px; align-items: center;">
                                <button class="btn secondary" id="add-server-btn">➕ 添加服务器</button>
                                <span style="flex:1;"></span>
                                <button class="test-btn" id="test-connection" type="button">测试当前连接</button>
                                <span id="test-result" style="font-size: 0.9rem;"></span>
                            </div>
                        </div>
                    </div>

                    <!-- 左列 -->
                    <div class="left-column">
                        <!-- 外观设置卡片 -->
                        <div class="settings-card">
                            <div class="card-title">🎨 外观设置</div>
                            <div class="card-body two-columns">
                                <div class="field color-field">
                                    <label for="highlight-color">高亮颜色</label>
                                    <input type="color" id="highlight-color" value="${currentConfig.highlightColor}">
                                </div>
                                <div class="field color-field">
                                    <label for="badge-color">徽章背景</label>
                                    <input type="color" id="badge-color" value="${currentConfig.badgeColor}">
                                </div>
                                <div class="field color-field">
                                    <label for="badge-text-color">徽章文字颜色</label>
                                    <input type="color" id="badge-text-color" value="${currentConfig.badgeTextColor}">
                                </div>
                                <div class="field color-field">
                                    <label for="badge-size">徽章大小</label>
                                    <select id="badge-size">
                                        <option value="small" ${currentConfig.badgeSize === 'small' ? 'selected' : ''}>小</option>
                                        <option value="medium" ${currentConfig.badgeSize === 'medium' ? 'selected' : ''}>中</option>
                                        <option value="large" ${currentConfig.badgeSize === 'large' ? 'selected' : ''}>大</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- 高级选项卡片 -->
                        <div class="settings-card">
                            <div class="card-title">⚡ 高级选项</div>
                            <div class="card-body">
                                <div class="field">
                                    <label for="max-requests">最大并发请求数</label>
                                    <input type="number" id="max-requests" min="1" max="100" value="${currentConfig.maxConcurrentRequests}">
                                    <small>建议 20-50</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右列 -->
                    <div class="right-column">
                        <!-- 站点开关卡片（始终展开，内部滚动） -->
                        <div class="settings-card">
                            <div class="card-title">🌐 站点开关</div>
                            <div class="card-body" id="sites-grid" style="display: block; max-height: 300px; overflow-y: auto; padding-right: 4px;">
                                <div class="sites-table">
                                    <div class="sites-table-header">
                                        <div>站点</div>
                                        <div>列表页</div>
                                        <div>详情页</div>
                                    </div>
                                    ${generateSitesRows()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="settings-footer">
                    <!-- 左侧：深色模式切换图标 -->
                    <div class="dark-mode-toggle" id="dark-mode-toggle" title="${darkModeTitle}">${darkModeIcon}</div>
                    <!-- 右侧：按钮组 -->
                    <div>
                        <button class="btn cancel">取消</button>
                        <button class="btn save">保存</button>
                    </div>
                </div>
            `;

            document.body.appendChild(panel);

            // 服务器卡片折叠/展开功能
            const serversHeader = panel.querySelector('#servers-toggle-header');
            const serversGrid = panel.querySelector('#servers-grid');
            const serversIcon = panel.querySelector('#servers-toggle-icon');
            let serversVisible = false; // 默认折叠

            serversHeader.addEventListener('click', () => {
                if (serversVisible) {
                    serversGrid.style.display = 'none';
                    serversIcon.textContent = '▶';
                } else {
                    serversGrid.style.display = 'block';
                    serversIcon.textContent = '▼';
                }
                serversVisible = !serversVisible;
            });

            // 服务器管理功能
            const serversListContainer = panel.querySelector('#servers-list-container');

            function refreshServersList() {
                serversListContainer.innerHTML = generateServersHTML();
                attachServerEvents();
            }

            function attachServerEvents() {
                // 设为默认
                panel.querySelectorAll('.set-active').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const row = e.target.closest('.server-row');
                        const index = parseInt(row.dataset.index);
                        Config.activeServerIndex = index;
                        refreshServersList();
                    });
                });

                // 编辑服务器
                panel.querySelectorAll('.edit-server').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const row = e.target.closest('.server-row');
                        const index = parseInt(row.dataset.index);
                        const servers = Config.embyServers;
                        const server = servers[index];
                        const newName = prompt('请输入服务器名称', server.name || '');
                        if (newName === null) return;
                        const newUrl = prompt('请输入服务器地址 (以/结尾)', server.baseUrl);
                        if (newUrl === null) return;
                        const newApi = prompt('请输入API密钥', server.apiKey);
                        if (newApi === null) return;

                        servers[index] = {
                            name: newName.trim() || '未命名',
                            baseUrl: newUrl.trim(),
                            apiKey: newApi.trim()
                        };
                        Config.embyServers = servers;
                        refreshServersList();
                    });
                });

                // 删除服务器
                panel.querySelectorAll('.delete-server').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if (btn.disabled) return;
                        const row = e.target.closest('.server-row');
                        const index = parseInt(row.dataset.index);
                        const servers = Config.embyServers;
                        if (servers.length <= 1) {
                            alert('至少保留一个服务器');
                            return;
                        }
                        if (!confirm(`确定删除服务器 "${servers[index].name}" 吗？`)) return;
                        servers.splice(index, 1);
                        if (Config.activeServerIndex === index) {
                            Config.activeServerIndex = 0;
                        } else if (Config.activeServerIndex > index) {
                            Config.activeServerIndex--;
                        }
                        Config.embyServers = servers;
                        refreshServersList();
                    });
                });
            }

            panel.querySelector('#add-server-btn').addEventListener('click', () => {
                const name = prompt('请输入服务器名称', '新服务器');
                if (!name) return;
                const url = prompt('请输入服务器地址 (以/结尾)', 'http://');
                if (!url) return;
                const api = prompt('请输入API密钥', '');
                if (api === null) return;

                const servers = Config.embyServers;
                servers.push({
                    name: name.trim(),
                    baseUrl: url.trim(),
                    apiKey: api.trim()
                });
                Config.embyServers = servers;
                refreshServersList();
            });

            attachServerEvents();

            // 测试连接按钮
            panel.querySelector('#test-connection').addEventListener('click', async () => {
                const url = Config.embyBaseUrl;
                const apiKey = Config.embyAPI;
                const testResultSpan = panel.querySelector('#test-result');

                testResultSpan.textContent = '';
                if (!url || !apiKey) {
                    testResultSpan.textContent = '❌ 当前服务器配置不完整';
                    testResultSpan.style.color = '#dc3545';
                    return;
                }

                const testBtn = panel.querySelector('#test-connection');
                testBtn.disabled = true;
                testResultSpan.textContent = '⏳ 测试中...';
                testResultSpan.style.color = '#6c757d';

                try {
                    const response = await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: `${url}emby/System/Info?api_key=${apiKey}`,
                            timeout: 10000,
                            onload: (res) => {
                                if (res.status >= 200 && res.status < 300) {
                                    resolve(res);
                                } else {
                                    reject(new Error(`HTTP ${res.status}`));
                                }
                            },
                            onerror: () => reject(new Error('网络错误')),
                            ontimeout: () => reject(new Error('请求超时'))
                        });
                    });

                    let serverName = 'Emby服务器';
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.ServerName) serverName = data.ServerName;
                    } catch (e) {}

                    testResultSpan.textContent = `✅ 连接成功 (${serverName})`;
                    testResultSpan.style.color = '#28a745';
                } catch (error) {
                    testResultSpan.textContent = `❌ 连接失败: ${error.message}`;
                    testResultSpan.style.color = '#dc3545';
                } finally {
                    testBtn.disabled = false;
                }
            });

            // ===== 深色模式切换逻辑 =====
            const darkModeToggle = panel.querySelector('#dark-mode-toggle');
            darkModeToggle.addEventListener('click', () => {
                const isDark = panel.classList.contains('dark-mode');
                if (isDark) {
                    panel.classList.remove('dark-mode');
                    darkModeToggle.textContent = '🌙';
                    Config.darkMode = false;
                    darkModeToggle.title = '切换深色模式';   // 切换后为浅色，提示可切回深色
                } else {
                    panel.classList.add('dark-mode');
                    darkModeToggle.textContent = '☀️';
                    Config.darkMode = true;
                    darkModeToggle.title = '切换浅色模式';   // 切换后为深色，提示可切回浅色
                }
            });

            // 关闭面板
            const closePanel = () => {
                panel.style.display = 'none';
            };
            panel.querySelector('.close-btn').addEventListener('click', closePanel);
            panel.querySelector('.btn.cancel').addEventListener('click', closePanel);

            // 保存设置
            panel.querySelector('.btn.save').addEventListener('click', () => {
                Config.highlightColor = document.getElementById('highlight-color').value;
                Config.maxConcurrentRequests = parseInt(document.getElementById('max-requests').value, 10);
                Config.badgeSize = document.getElementById('badge-size').value;
                Config.badgeColor = document.getElementById('badge-color').value;
                Config.badgeTextColor = document.getElementById('badge-text-color').value;

                const updatedSites = { ...Config.enabledSites };
                panel.querySelectorAll('[data-site]').forEach(input => {
                    const site = input.dataset.site;
                    const type = input.dataset.type;
                    if (!updatedSites[site]) {
                        updatedSites[site] = { list: false, detail: false };
                    }
                    updatedSites[site][type] = input.checked;
                });
                Config.enabledSites = updatedSites;

                closePanel();
                alert('设置已保存！请刷新页面以应用更改。');
            });

            panel.style.display = 'block';
        }
    };

    /* ========= Emby 查询缓存 ========= */
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

        /**
         * 检查指定番号在 Emby 中是否存在，返回最佳匹配项（或 null）
         */
        async checkExists(code) {
            if (!code) return null;

            const clean = code.trim().toUpperCase();

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
                        const checkUrl = `${Config.embyBaseUrl}emby/Items/${cached.itemId}?api_key=${Config.embyAPI}`;
                        const res = await this.request(checkUrl);
                        const item = JSON.parse(res.responseText);
                        return item;
                    } catch {
                        EmbyCache.remove(c);
                    }
                }
            }

            // 缓存未命中，执行搜索
            for (const c of tryCodes) {
                try {
                    const url = `${Config.embyBaseUrl}emby/Users/${Config.embyAPI}/Items` +
                        `?api_key=${Config.embyAPI}` +
                        `&Recursive=true&IncludeItemTypes=Movie` +
                        `&SearchTerm=${encodeURIComponent(c)}` +
                        `&Fields=Name,Id,ServerId`;

                    const response = await this.request(url);
                    const data = JSON.parse(response.responseText);
                    const items = data.Items || [];

                    if (items.length) {
                        const best = this.findBestMatch(items, c);
                        if (best) {
                            EmbyCache.set(c, best);
                            return best;
                        }
                    }
                } catch (e) {
                    console.error(`Emby 查询失败 ${c}`, e);
                }
            }

            return null;
        }

        async batchQuery(codes) {
            if (!codes || codes.length === 0) return [];

            this.total = codes.length;
            this.completed = 0;
            this.active = 0;
            this.waiting = [];

            const results = new Array(this.total);

            return new Promise(resolve => {
                const checkComplete = () => {
                    if (this.completed >= this.total && this.active === 0) {
                        const found = results.filter(r => r !== null).length;
                        Status.success(`查询完成: 找到 ${found} 个匹配项`, true);
                        resolve(results);
                    }
                };

                const processRequest = (index) => {
                    const code = codes[index];
                    this.active++;

                    Status.updateProgressDebounced(this.completed, this.total);

                    this.checkExists(code).then(best => {
                        results[index] = best;
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

        // 创建跳转链接（内联样式强制覆盖）
        createLink(item) {
            if (!item) return null;

            const embyUrl = `${Config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

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

        createBadge(item) {
            if (!item) return null;

            const embyUrl = `${Config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

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
            const mainTarget = target.replace(/-\d+$/, '');

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
                const bestItems = await this.api.batchQuery(codes);
                const operations = [];

                for (let i = 0; i < bestItems.length; i++) {
                    if (bestItems[i]) {
                        const { item, imgContainer } = toProcess[i];
                        const badge = this.api.createBadge(bestItems[i]);

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
                const bestItems = await this.api.batchQuery(codes);
                const processedElements = [];

                for (let i = 0; i < bestItems.length; i++) {
                    if (bestItems[i]) {
                        const { element } = toProcess[i];
                        const item = items[i];

                        if (item) item.classList.add('emby-processed');

                        const link = this.api.createLink(bestItems[i]);

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

            const siteConfig = this.__siteConfig;
            if (!siteConfig) return;

            /* 列表页控制 */
            if (siteConfig.list && this.listSelector) {
                const items = document.querySelectorAll(this.listSelector);
                if (items.length > 0) {
                    await this.processItemsWithBadge(items);
                }
            }

            /* 详情页控制 */
            if (siteConfig.detail && this.processDetailPage) {
                await this.processDetailPage();
            }

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

                if (!this.__siteConfig || !this.__siteConfig.list) {
                    pending = [];
                    timer = null;
                    return;
                }
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
                        const bestItem = await this.api.checkExists(code);
                        if (bestItem) {
                            const link = this.api.createLink(bestItem);

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
                    const bestItem = await this.api.checkExists(code);
                    if (bestItem) {
                        const link = this.api.createLink(bestItem);

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
                return match ? match[0] : null;
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
                    const bestItem = await this.api.checkExists(code);
                    if (bestItem) {
                        const link = this.api.createLink(bestItem);

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
                const siteConfig = this.__siteConfig;
                if (!siteConfig || !siteConfig.detail) return;
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const title = document.title.trim();
                const codes = this.extractCodes(title);

                if (codes.length > 0) {
                    Status.show(`找到 ${codes.length} 个可能的番号，开始查询...`);

                    const bestItems = await this.api.batchQuery(codes);
                    let foundAny = false;

                    const container = document.querySelector('#thread_subject') ||
                                      document.querySelector('h1.ts') ||
                                      document.querySelector('h1');
                    if (!container) return;

                    for (const bestItem of bestItems) {
                        if (bestItem) {
                            const link = this.api.createLink(bestItem);
                            if (link) {
                                container.parentNode.insertBefore(link, container.nextSibling);
                                foundAny = true;
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

            listSelector: 'table tbody tr',

            async process() {

                const siteConfig = this.__siteConfig;
                if (!siteConfig) return;

                if (location.pathname.startsWith('/view/')) {
                    if (siteConfig.detail) {
                        await this.processDetailPage();
                    }
                    return;
                }

                if (siteConfig.list) {
                    await this.processListPage();
                }
            },

            async processDetailPage() {

                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const titleElement = document.querySelector('.panel-heading .panel-title');
                if (!titleElement) return;

                const titleText = titleElement.textContent;
                const match = titleText.match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);

                if (!match) return;

                const code = match[0].toUpperCase();

                Status.show(`查询番号 ${code} 中...`);

                const bestItem = await this.api.checkExists(code);
                if (bestItem) {
                    const link = this.api.createLink(bestItem);

                    if (!link) {
                        Status.error('未找到精确匹配', true);
                        return;
                    }

                    const container = document.createElement('span');
                    container.style.marginLeft = '10px';
                    container.appendChild(link);

                    titleElement.appendChild(container);

                    Status.success('Emby 找到匹配项', true);

                } else {
                    Status.error('Emby 未找到匹配项', true);
                }
            },

            async processListPage() {

                const rows = document.querySelectorAll(this.listSelector);

                let foundCount = 0;
                let totalChecked = 0;
                let completed = 0;

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

                    this.api.checkExists(code).then(bestItem => {
                        if (bestItem) {
                            foundCount++;
                            pendingHighlight.push(linkEl);
                        }
                    }).catch(() => {}).finally(() => {
                        completed++;
                    });
                }

                const startTime = Date.now();
                const checker = setInterval(() => {

                    const timeoutReached = Date.now() - startTime > 5000;

                    if (completed >= totalChecked || timeoutReached) {

                        clearInterval(checker);

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

        javlibrary: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig || !siteConfig.detail) return;

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
                    const bestItem = await this.api.checkExists(code);
                    if (bestItem) {
                        const link = this.api.createLink(bestItem);
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

        madou: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig || !siteConfig.detail) return;

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
                    const bestItem = await this.api.checkExists(code);
                    if (bestItem) {
                        const link = this.api.createLink(bestItem);
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

        javrate: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig || !siteConfig.detail) return;

                await this.processDetailPage();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge')) return;

                const keywords = document.querySelector('meta[name="keywords"]')?.content || "";
                const match = keywords.match(/[A-Z]{2,10}-\d+(?:-\d+)?/i);
                const code = match ? match[0].toUpperCase() : null;

                if (code) {
                    Status.show(`查询番号 ${code} 中...`);
                    const bestItem = await this.api.checkExists(code);
                    if (bestItem) {
                        const link = this.api.createLink(bestItem);
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

                const siteConfig = this.__siteConfig;
                if (!siteConfig) return;

                if (siteConfig.list) {
                    const items = document.querySelectorAll(this.listSelector);
                    if (items.length > 0) {
                        await this.processItemsWithLink(items);
                    }
                }

                if (siteConfig.detail) {
                    const titleEl = document.querySelector('#thread_subject');
                    if (titleEl) {
                        const match = titleEl.textContent.match(this.codeRegex);
                        if (match) {
                            Status.show('正在查询 Emby...');
                            const code = match[0].toUpperCase();
                            const bestItem = await this.api.checkExists(code);
                            if (bestItem) {
                                const link = this.api.createLink(bestItem);
                                if (link) {
                                    titleEl.after(link);
                                    Status.success(`已找到: ${code}`, true);
                                }
                            } else {
                                Status.error('未找到匹配项', true);
                            }
                        }
                    }
                }

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

        const siteConfig = Config.enabledSites[site];
        if (!siteConfig) return;

        const processor = Processors[site].init(new EmbyAPI());
        if (processor) {
            processor.__siteConfig = siteConfig;
            await processor.process();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();