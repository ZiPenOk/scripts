// ==UserScript==
// @name         跳转到Emby播放(改)
// @namespace    https://github.com/ZiPenOk
// @version      5.7.2
// @description  👆👆👆在 ✅JavBus✅Javdb✅Sehuatang ✅supjav ✅Sukebei ✅✅javrate ✅ 169bbs 高亮emby存在的视频，并提供标注一键跳转功能
// @author       ZiPenOk
// @match        *://www.javbus.com/*
// @match        *://javdb*.com/v/*
// @match        *://javdb*.com/search?q=*
// @match        *://www.javdb.com/*
// @match        *://javdb.com/*
// @match        *://supjav.com/*
// @match        *://sehuatang.net/*
// @match        *://sukebei.nyaa.si/view/*
// @match        *://sukebei.nyaa.si/*
// @match        *://www.javlibrary.com/*/*
// @match        *://javrate.com/*
// @match        *://*.javrate.com/*
// @match        *://169bbs.com/*
// @match        *://*169bbs*.com/*
// @match        *://hjd2048.com/2048/*
// @match        *://missav.ws/*
// @match        *://jable.tv/videos/*
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

    const cloneJSON = (value) => JSON.parse(JSON.stringify(value));

    const parseStoredValue = (value, fallback) => {
        if (typeof value !== 'string') {
            return value ?? fallback;
        }

        const trimmed = value.trim();
        if (!trimmed) return fallback;

        try {
            return JSON.parse(trimmed);
        } catch (error) {
            return fallback;
        }
    };

    const normalizeServerList = (value) => {
        const parsed = parseStoredValue(value, []);
        const list = Array.isArray(parsed)
            ? parsed
            : (parsed && typeof parsed === 'object' && ('baseUrl' in parsed || 'apiKey' in parsed) ? [parsed] : []);

        return list
            .filter(server => server && typeof server === 'object')
            .map((server, index) => ({
                name: String(server.name || '').trim() || `服务器 ${index + 1}`,
                baseUrl: String(server.baseUrl || '').trim(),
                apiKey: String(server.apiKey || '').trim()
            }))
            .filter(server => server.baseUrl || server.apiKey);
    };

    const normalizeActiveServerIndex = (value, servers = []) => {
        const index = Number.parseInt(value, 10);
        if (!Number.isFinite(index) || index < 0) return 0;
        return servers.length > 0 ? Math.min(index, servers.length - 1) : 0;
    };

    const setStoredValue = (key, value) => Promise.resolve(GM_setValue(key, value));

    // 全局配置对象
    const Config = {
        // 服务器列表
        get embyServers() {
            const servers = normalizeServerList(GM_getValue('embyServers', []));
            if (servers.length > 0) return servers;

            const legacyServer = normalizeServerList({
                name: '默认服务器',
                baseUrl: GM_getValue('embyBaseUrl', ''),
                apiKey: GM_getValue('embyAPI', '')
            });
            return legacyServer;
        },
        set embyServers(val) {
            setStoredValue('embyServers', normalizeServerList(val));
        },
        get activeServerIndex() {
            return normalizeActiveServerIndex(GM_getValue('activeServerIndex', 0), this.embyServers);
        },
        set activeServerIndex(val) {
            setStoredValue('activeServerIndex', normalizeActiveServerIndex(val, this.embyServers));
        },
        get activeServer() {
            const servers = this.embyServers;
            return servers[this.activeServerIndex] || servers[0] || null;
        },

        get embyBaseUrl() {
            return this.activeServer?.baseUrl || '';
        },
        get embyAPI() {
            return this.activeServer?.apiKey || '';
        },
        set embyBaseUrl(val) {
            let servers = this.embyServers;
            if (servers.length === 0) {
                servers = [{ name: '默认服务器', baseUrl: val, apiKey: '' }];
                this.embyServers = servers;
                this.activeServerIndex = 0;
            } else {
                const index = normalizeActiveServerIndex(this.activeServerIndex, servers);
                servers[index].baseUrl = val;
                this.embyServers = servers;
            }
        },
        set embyAPI(val) {
            let servers = this.embyServers;
            if (servers.length === 0) {
                servers = [{ name: '默认服务器', baseUrl: '', apiKey: val }];
                this.embyServers = servers;
                this.activeServerIndex = 0;
            } else {
                const index = normalizeActiveServerIndex(this.activeServerIndex, servers);
                servers[index].apiKey = val;
                this.embyServers = servers;
            }
        },

        get highlightColor() {
            return GM_getValue('highlightColor', '#52b54b');
        },
        get maxConcurrentRequests() {
            const value = Number(GM_getValue('maxConcurrentRequests', 50));
            return Number.isFinite(value) && value > 0 ? Math.min(100, Math.max(1, Math.floor(value))) : 50;
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
            const saved = GM_getValue('enabledSites', {});
            const defaults = {
                javbus: { list: true, detail: true },
                javdb: { list: true, detail: true },
                supjav: { list: true, detail: true },
                sehuatang: { list: true, detail: true },
                sukebei: { list: true, detail: true },
                javlibrary: { list: true, detail: true },
                javrate: { list: true, detail: true },
                '169bbs': { list: true, detail: true },
                'hjd2048': { list: true, detail: true },
                'missav': { list: true, detail: true },
                'jable': { list: true, detail: true }
            };
            for (let site in saved) {
                if (!(site in defaults)) {
                    delete saved[site];
                }
            }
            for (let site in defaults) {
                if (!(site in saved)) {
                    saved[site] = defaults[site];
                }
            }
            return saved;
        },
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

        _migrateOldConfig() {
            const oldBaseUrl = GM_getValue('embyBaseUrl', '');
            const oldApiKey = GM_getValue('embyAPI', '');
            const servers = normalizeServerList(GM_getValue('embyServers', []));
            if ((oldBaseUrl || oldApiKey) && servers.length === 0) {
                this.embyServers = [{
                    name: '默认服务器',
                    baseUrl: oldBaseUrl,
                    apiKey: oldApiKey
                }];
                this.activeServerIndex = 0;
            }
        },

        async saveServers(servers, activeIndex) {
            const normalizedServers = normalizeServerList(servers);
            const normalizedIndex = normalizeActiveServerIndex(activeIndex, normalizedServers);
            const activeServer = normalizedServers[normalizedIndex] || {};

            await Promise.all([
                setStoredValue('embyServers', normalizedServers),
                setStoredValue('activeServerIndex', normalizedIndex),
                setStoredValue('embyBaseUrl', activeServer.baseUrl || ''),
                setStoredValue('embyAPI', activeServer.apiKey || '')
            ]);
        },

        isValid() {
            const server = this.activeServer;
            return !!(server?.baseUrl && server?.apiKey);
        }
    };

    Config._migrateOldConfig();

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

    const badgeSize = getBadgeSizeStyle();

    GM_addStyle(`
        :root {
            --primary: #52b54b;
            --success: #28a745;
            --danger: #dc3545;
            --border: #d9e1e8;
            --bg-light: #eef2f5;
            --text-dark: #1e2a3a;
        }

        .emby-jump-settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            z-index: 10000;
            display: none;
        }

        .emby-jump-status-indicator {
            position: fixed; bottom: 20px; right: 20px;
            background: rgba(0,0,0,0.7); color: white;
            padding: 8px 12px; border-radius: 4px; font-size: 14px;
            z-index: 9999; transition: opacity 0.3s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); max-width: 300px;
            display: flex; align-items: center; opacity: 0;
        }
        .emby-jump-status-indicator .progress {
            display: inline-block; margin-left: 10px;
            width: 100px; height: 6px; background: rgba(255,255,255,0.3);
            border-radius: 3px;
        }
        .emby-jump-status-indicator .progress-bar {
            height: 100%; background: var(--primary); border-radius: 3px;
            transition: width 0.3s;
        }
        .emby-jump-status-indicator.success { background-color: rgba(40,167,69,0.9) !important; }
        .emby-jump-status-indicator.error { background-color: rgba(220,53,69,0.9) !important; }
        .emby-jump-status-indicator .close-btn { margin-left: 10px; cursor: pointer; font-size: 16px; font-weight: bold; }

        .emby-badge {
            position: absolute; top: 5px; right: 5px;
            color: ${Config.badgeTextColor}; padding: ${badgeSize.padding}; font-size: ${badgeSize.fontSize};
            font-weight: bold; z-index: 10; border: 2px solid transparent; border-radius: 4px;
            background-origin: border-box; background-clip: padding-box, border-box;
            background-image: linear-gradient(${Config.badgeColor} 0 0), linear-gradient(50deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#8b00ff);
        }
        .emby-badge:hover {
            color: #000;
            background-image: linear-gradient(#fff 0 0), linear-gradient(50deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#8b00ff);
        }
        .emby-highlight { outline: 4px solid ${Config.highlightColor} !important; position: relative; }
        .emby-exists {
            font-weight: bold !important;
            border-left: 4px solid var(--success);
            padding-left: 4px;
            opacity: 0;
            animation: embyFadeIn 0.2s ease forwards;
        }
        .emby-exists:link {
            color: var(--success) !important;
        }
        @keyframes embyFadeIn { to { opacity: 1; } }

        .emby-jump-settings-panel.modern {
            font-family: system-ui, sans-serif;
            background: var(--bg-light); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            padding: 0; width: 900px; max-width: 95vw; overflow: hidden;
        }
        .modern .settings-header,
        .modern .settings-footer {
            background: #ffffffd9; backdrop-filter: blur(4px); border-bottom: 1px solid #d0d7dd;
        }
        .modern .settings-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 20px;
        }
        .modern .settings-header h3 { margin: 0; font-size: 22px; font-weight: 600; color: var(--text-dark); }
        .modern .settings-header .close-btn {
            background: none; border: none; font-size: 26px; cursor: pointer; color: #6c7a8a; line-height: 1;
        }
        .modern .settings-content {
            padding: 20px; max-height: 70vh; overflow-y: auto;
            display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
            align-items: stretch;
        }
        .modern .left-column, .modern .right-column { display: flex; flex-direction: column; gap: 16px; }
        .modern .left-column .settings-card:last-child { flex: 1; }
        .modern .right-column { flex: 1; }
        .modern .right-column .settings-card { flex: 1; display: flex; flex-direction: column; }
        .modern .right-column .settings-card .card-body { flex: 1; }
        .modern .settings-card {
            background: #ffffffde; backdrop-filter: blur(2px); border-radius: 12px; padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid var(--border);
        }
        .modern .card-title {
            font-weight: 600; margin-bottom: 12px; color: #2c3e50;
            display: flex; align-items: center; gap: 6px; font-size: 18px;
        }
        .modern .card-title.collapsible {
            cursor: pointer; user-select: none; justify-content: space-between; margin-bottom: 0;
        }
        .modern .card-body.two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .modern .field { display: flex; flex-direction: column; gap: 4px; }
        .modern .field label { font-size: 13px; font-weight: 500; color: #4a5a6e; }
        .modern .field input, .modern .field select {
            padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 8px;
            font-size: 13px; transition: border-color 0.15s; box-sizing: border-box; background: #fff;
        }
        .modern .field input:focus, .modern .field select:focus {
            outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(82,181,75,0.15);
        }
        .modern .field small { font-size: 14px; color: #7c8b9c; }
        .modern .color-field { display: flex; flex-direction: row; align-items: center; gap: 10px; }
        .modern .color-field label { width: 70px; flex-shrink: 0; font-size: 16px; }
        .modern .color-field input[type="color"] {
            width: 60px; height: 36px; padding: 2px; border-radius: 6px; border: 1px solid #cbd5e1;
        }
        .modern .test-btn {
            background: #e2e8f0; border: 1px solid #b9c7d9; border-radius: 999px;
            padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; color: #1e293b;
            line-height: 1.2;
        }
        .modern .test-btn:hover { background: #d1dbe8; }

        .modern .servers-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
            align-items: start;
        }
        .modern .servers-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
            max-height: 220px;
            overflow: auto;
            padding-right: 4px;
        }
        .modern .servers-empty {
            padding: 14px;
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            text-align: center;
            color: #7c8b9c;
            background: rgba(255,255,255,0.55);
        }
        .modern .server-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 10px 12px;
            background: #fff;
            transition: border-color .15s ease, box-shadow .15s ease;
        }
        .modern .server-row:hover {
            box-shadow: 0 4px 12px rgba(15,23,42,0.05);
            border-color: #b9c7d9;
        }
        .modern .server-row.editing {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(82,181,75,0.12);
        }
        .modern .server-main { min-width: 0; flex: 1; }
        .modern .server-topline {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 3px;
            flex-wrap: wrap;
        }
        .modern .server-name { font-weight: 700; color: #1e293b; font-size: 14px; }
        .modern .server-meta {
            font-size: 12px;
            color: #64748b;
            word-break: break-all;
            line-height: 1.35;
        }
        .modern .server-meta.api { margin-top: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .modern .server-actions {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
            min-width: 0;
            justify-content: flex-end;
        }
        .modern .server-btn {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            color: #1e293b;
            padding: 7px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all .15s ease;
        }
        .modern .server-btn:hover:not(:disabled) { background: #edf4ff; border-color: #94a3b8; }
        .modern .server-btn.danger:hover:not(:disabled) { background: #fff1f2; border-color: #fda4af; color: #be123c; }
        .modern .server-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .modern .server-chip {
            display: inline-flex;
            align-items: center;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            background: #e2e8f0;
            color: #334155;
        }
        .modern .server-chip.active { background: rgba(82,181,75,0.14); color: var(--primary); }
        .modern .server-chip.editing { background: rgba(59,130,246,0.14); color: #2563eb; }
        .modern .server-menu-wrap { position: relative; }
        .modern .server-menu {
            position: absolute;
            right: 0;
            top: calc(100% + 6px);
            z-index: 10002;
            min-width: 180px;
            background: #fff;
            border: 1px solid #d6e1ee;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(15,23,42,0.12);
            padding: 6px;
            display: none;
        }
        .modern .server-menu.open { display: block; }
        .modern .server-menu button {
            width: 100%;
            text-align: left;
            border: 0;
            background: transparent;
            padding: 8px 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            color: #1e293b;
        }
        .modern .server-menu button:hover { background: #edf4ff; }
        .modern .server-menu button.danger:hover { background: #fff1f2; color: #be123c; }
        .modern .server-form-popover {
            border: 1px solid #d6e1ee;
            border-radius: 12px;
            padding: 10px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
            box-shadow: 0 8px 18px rgba(15,23,42,0.06);
        }
        .modern .server-form-popover[hidden] { display: none !important; }
        .modern .server-form-card {
            display: block;
        }
        .modern .server-form-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        .modern .server-form-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .modern .server-form-subtitle { margin-top: 2px; font-size: 11px; color: #64748b; line-height: 1.35; }
        .modern .server-form-grid { display: grid; gap: 8px; }
        .modern .server-api-field small { margin-top: 0; font-size: 11px; }
        .modern .server-form-actions {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        .modern .server-form-actions-right { display: flex; gap: 6px; flex-wrap: wrap; }
        .modern .btn.secondary {
            background: #e2e8f0; color: #1e293b; border: 1px solid #b9c7d9;
            padding: 6px 12px; border-radius: 999px; font-weight: 500; cursor: pointer; font-size: 13px;
        }
        .modern .btn.secondary:hover { background: #d1dbe8; }

        /* 滑动开关 */
        .modern .settings-footer {
            padding: 16px 20px; background: #ffffffd9; backdrop-filter: blur(4px);
            border-top: 1px solid #d0d7dd; display: flex; justify-content: space-between;
            align-items: center; gap: 12px;
        }
        .modern .btn {
            padding: 6px 12px; border-radius: 999px; border: none;
            font-weight: 500; cursor: pointer; font-size: 13px;
            line-height: 1.2;
        }
        .modern .btn.cancel { background: #e2e8f0; color: #1e293b; border: 1px solid #b9c7d9; }
        .modern .btn.save { background: var(--primary); color: white; }
        .modern .btn.save:hover { background: #3e9e37; }

        .modern .dark-mode-toggle { font-size: 26px; cursor: pointer; line-height: 1; padding: 0 4px; user-select: none; transition: transform 0.2s; }
        .modern .dark-mode-toggle:hover { transform: scale(1.1); }

        .emby-jump-settings-panel.modern.dark-mode,
        .modern.dark-mode .settings-header,
        .modern.dark-mode .settings-footer,
        .modern.dark-mode .settings-card,
        .modern.dark-mode .servers-table-header,
        .modern.dark-mode .server-row {
            background: #242435; border-color: #3a3a50; color: #c0c0d0;
        }
        .modern.dark-mode .settings-header h3 { color: #fff; }
        .modern.dark-mode .card-title { color: #d0d0e0; }
        .modern.dark-mode .field label { color: #b0b0c0; }
        .modern.dark-mode .field input,
        .modern.dark-mode .field select { background: #1e1e30; border-color: #4a4a60; color: #e0e0f0; }
        .modern.dark-mode .field input:focus { border-color: var(--primary); }
        .modern.dark-mode .server-row,
        .modern.dark-mode .server-form-popover { background: #1e1e30; border-color: #40405a; }
        .modern.dark-mode .servers-empty { background: rgba(255,255,255,0.03); border-color: #40405a; color: #a0a0b8; }
        .modern.dark-mode .server-name { color: #f8fafc; }
        .modern.dark-mode .server-form-title { color: #f4f4ff; }
        .modern.dark-mode .server-url,
        .modern.dark-mode .server-meta,
        .modern.dark-mode .server-form-subtitle { color: #a0a0b8; }
        .modern.dark-mode .server-menu { background: #1e1e30; border-color: #40405a; }
        .modern.dark-mode .server-menu button { color: #e5e7eb; }
        .modern.dark-mode .server-menu button:hover { background: #2e2e42; }
        .modern.dark-mode .server-btn:hover:not(:disabled) { background: #2e2e42; border-color: #5a5a78; }
        .modern.dark-mode .server-form-title { color: #f8fafc; }
        .modern.dark-mode .server-btn.danger:hover:not(:disabled) { background: #3a2230; border-color: #7c2d43; color: #fecdd3; }
        .modern.dark-mode .btn.secondary,
        .modern.dark-mode .test-btn { background: #2e2e42; border-color: #5a5a78; color: #ddd; }
        .modern.dark-mode .btn.secondary:hover,
        .modern.dark-mode .test-btn:hover { background: #3e3e58; }
        .modern.dark-mode .btn.cancel { background: #3a3a50; color: #ddd; border-color: #5a5a78; }
        .modern.dark-mode .btn.save { background: #3e9e37; }
        .modern.dark-mode .close-btn { color: #aaa; }

        .video.emby-javlibrary-hit,
        .videothumblist .video.javlib-grid-card.emby-javlibrary-hit {
            position: relative !important;
            overflow: hidden !important;
            vertical-align: top !important;
            outline: none !important;
        }
        .video.emby-javlibrary-hit::after {
            content: '' !important;
            position: absolute !important;
            inset: 0 !important;
            pointer-events: none !important;
            box-shadow: inset 0 0 0 4px ${Config.highlightColor} !important;
            z-index: 19 !important;
        }
        .video > a.emby-javlibrary-list-badge,
        .videothumblist .video.javlib-grid-card > a.emby-javlibrary-list-badge {
            all: unset !important;
            position: absolute !important;
            top: 5px !important;
            right: 5px !important;
            bottom: auto !important;
            left: auto !important;
            display: inline-flex !important;
            flex: 0 0 auto !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: center !important;
            align-self: auto !important;
            justify-self: auto !important;
            width: auto !important;
            height: auto !important;
            min-width: 0 !important;
            min-height: 0 !important;
            max-width: max-content !important;
            max-height: max-content !important;
            margin: 0 !important;
            padding: ${badgeSize.padding} !important;
            box-sizing: border-box !important;
            aspect-ratio: auto !important;
            float: none !important;
            clear: none !important;
            overflow: visible !important;
            color: ${Config.badgeTextColor} !important;
            font: 700 ${badgeSize.fontSize}/1.15 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            letter-spacing: 0 !important;
            text-align: center !important;
            text-decoration: none !important;
            white-space: nowrap !important;
            text-indent: 0 !important;
            border: 2px solid transparent !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            z-index: 20 !important;
            pointer-events: auto !important;
            background-origin: border-box !important;
            background-clip: padding-box, border-box !important;
            background-image: linear-gradient(${Config.badgeColor} 0 0), linear-gradient(50deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#8b00ff) !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
        }
        .video > a.emby-javlibrary-list-badge:hover {
            color: #000 !important;
            text-decoration: none !important;
            background-image: linear-gradient(#fff 0 0), linear-gradient(50deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#8b00ff) !important;
        }

        .emby-btn {
            display: inline-flex; align-items: center; justify-content: center;
            border-radius: 6px; font-weight: 600; cursor: pointer;
            line-height: 1; box-sizing: border-box; white-space: nowrap;
            transition: all .18s ease; vertical-align: middle;
            text-decoration: none !important;
            border: none; user-select: none;
        }
        .emby-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 10px rgba(0,0,0,.25);
            text-decoration: none !important;
        }
        .emby-btn:visited {
            color: inherit !important;
            background: inherit !important;
        }
        .emby-btn-small { font-size: 11px; padding: 3px 8px; }
        .emby-btn-medium { font-size: 13px; padding: 6px 10px; }
        .emby-btn-large { font-size: 15px; padding: 6px 14px; }
        .emby-btn-jump { background: ${Config.highlightColor}; color: #fff; }
        .emby-btn-jump:visited { background: ${Config.highlightColor} !important; color: #fff !important; }
        .emby-btn-copy { background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; }
        .emby-btn-copy:visited { background: linear-gradient(135deg,#667eea,#764ba2) !important; color: #fff !important; }
        .emby-button-group { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; }

        .sukebei-list-td {
            display: flex !important;
            align-items: center !important;
            white-space: nowrap !important;
            overflow: visible !important;
        }
        .sukebei-list-td a:first-child {
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1 1 auto;
            min-width: 0;
        }
        .sukebei-list-td .emby-btn-jump {
            flex-shrink: 0;
            margin-left: 8px;
        }

        .thumbnail.group.emby-missav-hit {
            outline: none !important;
            background: transparent !important;
        }
        .thumbnail.group .emby-missav-cover-hit {
            position: relative !important;
        }
        .thumbnail.group .emby-missav-cover-hit::after {
            content: '' !important;
            position: absolute !important;
            inset: 0 !important;
            pointer-events: none !important;
            box-shadow: inset 0 0 0 4px ${Config.highlightColor} !important;
            border-radius: 4px !important;
            z-index: 19 !important;
        }
        .thumbnail.group .emby-missav-overlay {
            position: absolute !important;
            inset: 0 !important;
            z-index: 20 !important;
            pointer-events: none !important;
        }
        .thumbnail.group .emby-missav-overlay > .emby-badge {
            position: absolute !important;
            top: 5px !important;
            right: 5px !important;
            bottom: auto !important;
            left: auto !important;
            width: auto !important;
            height: auto !important;
            min-width: 0 !important;
            min-height: 0 !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            pointer-events: auto !important;
            z-index: 20 !important;
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
            hide
        };
    })();

    // 统一提示管理
    const Prompt = {
        queryStart(code) { Status.show(`⏳ 查询番号 ${code} 中...`); },
        querySuccess(code) { Status.success(`✅ Emby 找到匹配项: ${code}`, true); },
        queryNotFound(code) { Status.error(`❌ Emby未找到匹配项: ${code}`, true); },
        queryError(code, errMsg) { Status.error(`❌ Emby查询失败: ${errMsg}`, true); },
        batchStart(count) { Status.show(`⏳ 正在查询 ${count} 个番号...`); },
        batchComplete(foundCount) { Status.success(`✅ Emby查询完成，找到 ${foundCount} 项`, true); }
    };

    function normalizeCode(code) {
        const raw = String(code || '').trim();
        if (!raw) return '';

        const normalized = raw
            .replace(/\s+/g, '-')
            .replace(/^FC2[-_]?PPV[-_]?/i, 'FC2-')
            .toUpperCase();

        const uncensoredHit = normalized.match(/(?:PACOPACOMAMA|1PONDO|CARIBBEANCOM|CARIB|HEYZO)?[-_\s]*(\d{6})([-_])(\d{2,3})/i);
        if (uncensoredHit) {
            return `${uncensoredHit[1]}${uncensoredHit[2]}${uncensoredHit[3]}`;
        }

        const compact = normalized.match(/^([A-Z]{2,10})(\d{3,6})$/);
        if (compact) {
            const number = compact[2].replace(/^0+(?=\d{3})/, '');
            return `${compact[1]}-${number}`;
        }

        const trimmed = normalized.match(/^([A-Z0-9]{2,15}[-_]\d{2,9})/);
        if (trimmed) return trimmed[1];

        return normalized;
    }

    function extractCodeFromText(text) {
        if (!text) return null;

        // 欧美厂商日期番号：BangBus.19.07.03 / blacked.22.02.05
        // 格式：字母组成的厂商名 + 点 + YY.MM.DD（两位年月日各两位）
        const westernHit = String(text).match(/\b([A-Za-z]{2,20})\.(\d{2})\.(\d{2})\.(\d{2})\b/);
        if (westernHit) {
            return `${westernHit[1]}.${westernHit[2]}.${westernHit[3]}.${westernHit[4]}`;
        }

        const mgstageHit = String(text).match(/\b(\d{3}[A-Z]{2,10})[-_\s](\d{2,6})\b/i);
        if (mgstageHit) return normalizeCode(`${mgstageHit[1]}-${mgstageHit[2]}`);

        const uncensoredHit = String(text).match(/(?:PACOPACOMAMA|1PONDO|CARIBBEANCOM|CARIB|HEYZO)?[-_\s]*(\d{6})([-_])(\d{2,3})/i);
        if (uncensoredHit) {
            return normalizeCode(`${uncensoredHit[1]}${uncensoredHit[2]}${uncensoredHit[3]}`);
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

        for (const { regex, type } of patterns) {
            const match = String(text).match(regex);
            if (!match) continue;

            if (type === 'alphanum') {
                return normalizeCode(match[0].trim());
            } else if (type === 'standard') {
                const prefix = match[1].toUpperCase();
                if (ignoreList.includes(prefix)) continue;
                return normalizeCode(match[3] ? `${prefix}-${match[2]}-${match[3]}` : `${prefix}-${match[2]}`);
            } else if (type === 'fc2') {
                return normalizeCode(`FC2-PPV-${match[1]}`);
            } else if (type === 'numeric') {
                return normalizeCode(match[2] === '_' ? `${match[1]}_${match[3]}` : `${match[1]}-${match[3]}`);
            } else if (type === 'compactStandard') {
                const prefix = match[1].toUpperCase();
                if (ignoreList.includes(prefix)) continue;
                const number = match[2].replace(/^0+(?=\d{3})/, '');
                return normalizeCode(`${prefix}-${number}`);
            } else if (type === 'compact') {
                return normalizeCode(match[0].toUpperCase());
            }
        }

        return null;
    }

    function getUncensoredFamilyFromParts(sep, tail) {
        if (sep === '_' && tail === '100') return 'paco';
        if (sep === '_' && tail === '001') return '1pondo';
        if (sep === '-' && tail === '001') return 'carib';
        return sep === '_' ? 'underscore' : 'hyphen';
    }

    function parseUncensoredCode(code) {
        const value = String(code || '').toUpperCase();
        const hit = value.match(/(\d{6})([-_])(\d{2,3})/);
        if (!hit) return null;
        return {
            digits: hit[1],
            sep: hit[2],
            tail: hit[3],
            core: `${hit[1]}${hit[3]}`,
            code: `${hit[1]}${hit[2]}${hit[3]}`,
            family: getUncensoredFamilyFromParts(hit[2], hit[3])
        };
    }

    function getUncensoredFamily(code) {
        return parseUncensoredCode(code)?.family || null;
    }

    const SettingsUI = {
        show() {
            let panel = document.getElementById('emby-jump-settings-panel');
            if (panel) {
                panel.remove();
            }

            panel = document.createElement('div');
            panel.id = 'emby-jump-settings-panel';
            panel.className = 'emby-jump-settings-panel modern';
            if (Config.darkMode) {
                panel.classList.add('dark-mode');
            }

            const currentConfig = {
                embyServers: Config.embyServers,
                activeServerIndex: Config.activeServerIndex,
                highlightColor: Config.highlightColor,
                maxConcurrentRequests: Config.maxConcurrentRequests,
                badgeSize: Config.badgeSize,
                badgeColor: Config.badgeColor,
                badgeTextColor: Config.badgeTextColor,
                darkMode: Config.darkMode
            };
            const initialServers = normalizeServerList(cloneJSON(Config.embyServers));
            const initialActiveIndex = Config.activeServerIndex;
            let draftServers = normalizeServerList(cloneJSON(initialServers));
            let draftActiveIndex = normalizeActiveServerIndex(initialActiveIndex, draftServers);

            const escapeHtml = (str) => String(str ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            const normalizeServer = (server = {}) => ({
                name: (server.name || '').trim() || '未命名服务器',
                baseUrl: (server.baseUrl || '').trim(),
                apiKey: (server.apiKey || '').trim()
            });

            const emptyServer = () => ({ name: '', baseUrl: '', apiKey: '' });

            let editingServerIndex = -1;
            let draftServer = emptyServer();

            function generateServersHTML() {
                const servers = draftServers;
                if (!servers || servers.length === 0) {
                    return '<div class="servers-empty">暂无服务器，请先在下方添加</div>';
                }
                return servers.map((server, index) => {
                    const isActive = index === draftActiveIndex;
                    const apiTail = server.apiKey ? `•••• ${server.apiKey.slice(-4)}` : '未设置';
                    return `
                        <div class="server-row ${index === editingServerIndex ? 'editing' : ''}" data-index="${index}">
                            <div class="server-main">
                                <div class="server-topline">
                                    <span class="server-name">${escapeHtml(server.name || '未命名服务器')}</span>
                                    ${isActive ? '<span class="server-chip active">当前默认</span>' : ''}
                                </div>
                                <div class="server-meta">${escapeHtml(server.baseUrl || '未填写地址')}</div>
                                <div class="server-meta api">API：${escapeHtml(apiTail)}</div>
                            </div>
                            <div class="server-actions">
                                <button class="server-btn set-active" title="设为默认" ${isActive ? 'disabled' : ''}>设为默认</button>
                                <button class="server-btn edit-server" title="编辑">编辑</button>
                                <button class="server-btn delete-server danger" title="删除" ${servers.length === 1 ? 'disabled' : ''}>删除</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            function renderServerForm() {
                const isEditing = editingServerIndex >= 0;
                const title = isEditing ? '编辑服务器' : '添加新服务器';
                const btnText = isEditing ? '保存修改' : '添加服务器';
                const cancelText = isEditing ? '取消编辑' : '清空';
                return `
                    <div class="server-form-card ${isEditing ? 'editing' : ''}">
                        <div class="server-form-header">
                            <div>
                                <div class="server-form-title">${title}</div>
                                <div class="server-form-subtitle">直接在面板中完成添加、编辑和删除</div>
                            </div>
                            ${isEditing ? '<span class="server-chip editing">编辑中</span>' : '<span class="server-chip">新建模式</span>'}
                        </div>
                        <div class="server-form-grid">
                            <div class="field">
                                <label for="server-name">服务器名称</label>
                                <input id="server-name" type="text" placeholder="例如：家庭影院" value="${escapeHtml(draftServer.name)}">
                            </div>
                            <div class="field">
                                <label for="server-url">服务器地址</label>
                                <input id="server-url" type="text" placeholder="https://emby.example.com/" value="${escapeHtml(draftServer.baseUrl)}">
                            </div>
                            <div class="field server-api-field">
                                <label for="server-api-key">API 密钥</label>
                                <input id="server-api-key" type="password" placeholder="Emby API Key" value="${escapeHtml(draftServer.apiKey)}">
                                <small>建议填写完整的 Emby API Key，支持粘贴后立即保存。</small>
                            </div>
                        </div>
                        <div class="server-form-actions">
                            <button class="btn secondary" id="server-form-reset">${cancelText}</button>
                            <div class="server-form-actions-right">
                                <button class="btn secondary" id="server-form-fill-current">填入当前默认</button>
                                <button class="btn save" id="server-form-submit">${btnText}</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            const darkModeIcon = Config.darkMode ? '☀️' : '🌙';
            const darkModeTitle = Config.darkMode ? '切换浅色模式' : '切换深色模式';

            panel.innerHTML = `
                <div class="settings-header">
                    <h3><span class="icon">⚙️</span> Emby 设置</h3>
                    <span class="close-btn">&times;</span>
                </div>
                <div class="settings-content">
                    <div class="settings-card" style="grid-column: 1 / -1;">
                        <div class="card-title">
                            <span>服务器管理</span>
                            <span style="font-size: 13px; color: #7c8b9c; font-weight: 500;">管理多个 Emby 服务端</span>
                        </div>
                        <div class="card-body">
                            <div class="servers-grid">
                                <div class="servers-list" id="servers-list-container">
                                    ${generateServersHTML()}
                                </div>
                            </div>
                            <div class="server-form-popover" id="server-form-popover" hidden>
                                <div id="server-form-container">
                                    ${renderServerForm()}
                                </div>
                            </div>
                            <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                    <button class="btn secondary" id="add-server-btn">新建服务器</button>
                                    <button class="test-btn" id="test-connection" type="button">测试当前连接</button>
                                </div>
                                <span id="test-result" style="font-size: 0.9rem;"></span>
                            </div>
                        </div>
                    </div>

                    <div class="left-column">
                        <div class="settings-card">
                            <div class="card-title">外观设置</div>
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
                                    <label for="badge-text-color">徽章文字</label>
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
                    </div>

                    <div class="right-column">
                        <div class="settings-card">
                            <div class="card-title">运行设置</div>
                            <div class="card-body">
                                <div class="field">
                                    <label for="max-requests">最大并发请求数</label>
                                    <input type="number" id="max-requests" min="1" max="100" value="${currentConfig.maxConcurrentRequests}">
                                    <small>建议 20-50，网络较慢时可适当调低。</small>
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
                        <button class="btn cancel" id="panel-cancel-btn">取消</button>
                        <button class="btn save" id="panel-save-btn">保存</button>
                    </div>
                </div>
                <div id="save-message" style="display:none; position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:#52b54b; color:white; padding:8px 16px; border-radius:4px; z-index:10001; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.2);"></div>
            `;

            document.body.appendChild(panel);

            const serverFormContainer = panel.querySelector('#server-form-container');
            const serverFormPopover = panel.querySelector('#server-form-popover');
            const serversListContainer = panel.querySelector('#servers-list-container');

            function syncDraftFromInputs() {
                const nameInput = panel.querySelector('#server-name');
                const urlInput = panel.querySelector('#server-url');
                const apiInput = panel.querySelector('#server-api-key');
                draftServer = {
                    name: nameInput?.value ?? '',
                    baseUrl: urlInput?.value ?? '',
                    apiKey: apiInput?.value ?? ''
                };
            }

            function setDraft(server = emptyServer(), index = -1) {
                editingServerIndex = index;
                draftServer = normalizeServer(server);
                refreshServerForm();
                if (serverFormPopover) serverFormPopover.hidden = false;
            }

            function refreshServersList() {
                serversListContainer.innerHTML = generateServersHTML();
                attachServerEvents();
                updateServerRowStates();
            }

            function refreshServerForm() {
                serverFormContainer.innerHTML = renderServerForm();
                attachFormEvents();
                updateServerRowStates();
            }

            function hideServerEditor() {
                if (serverFormPopover) serverFormPopover.hidden = true;
            }

            function showServerEditor() {
                if (serverFormPopover) serverFormPopover.hidden = false;
            }

            function resetDraft() {
                setDraft(emptyServer(), -1);
                hideServerEditor();
            }

            function updateServerRowStates() {
                panel.querySelectorAll('.server-row').forEach(row => {
                    row.classList.toggle('editing', parseInt(row.dataset.index, 10) === editingServerIndex);
                });
            }

            function commitVisibleServerDraft() {
                if (!serverFormPopover || serverFormPopover.hidden) return true;

                syncDraftFromInputs();
                const hasDraftValue = [draftServer.name, draftServer.baseUrl, draftServer.apiKey]
                    .some(value => String(value || '').trim());
                if (editingServerIndex < 0 && !hasDraftValue) {
                    resetDraft();
                    return true;
                }

                const payload = normalizeServer(draftServer);
                if (!payload.baseUrl || !payload.apiKey) {
                    alert('请填写服务器地址和 API 密钥');
                    showServerEditor();
                    return false;
                }

                const servers = draftServers.slice();
                if (editingServerIndex >= 0 && editingServerIndex < servers.length) {
                    servers[editingServerIndex] = payload;
                } else {
                    servers.push(payload);
                    editingServerIndex = servers.length - 1;
                }
                draftServers = normalizeServerList(servers);
                if (draftActiveIndex >= draftServers.length) draftActiveIndex = 0;
                return true;
            }

            function attachFormEvents() {
                const nameInput = panel.querySelector('#server-name');
                const urlInput = panel.querySelector('#server-url');
                const apiInput = panel.querySelector('#server-api-key');

                [nameInput, urlInput, apiInput].forEach(input => {
                    if (!input) return;
                    input.addEventListener('input', syncDraftFromInputs);
                });

                panel.querySelector('#server-form-reset')?.addEventListener('click', () => {
                    resetDraft();
                    refreshServerForm();
                });

                panel.querySelector('#server-form-fill-current')?.addEventListener('click', () => {
                    const current = draftServers[draftActiveIndex] || draftServers[0] || emptyServer();
                    setDraft(current, editingServerIndex);
                });

                panel.querySelector('#server-form-submit')?.addEventListener('click', () => {
                    if (!commitVisibleServerDraft()) return;
                    refreshServersList();
                    hideServerEditor();
                    refreshServerForm();
                });
            }

            function attachServerEvents() {
                panel.querySelectorAll('.set-active').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const row = e.target.closest('.server-row');
                        const index = parseInt(row.dataset.index, 10);
                        draftActiveIndex = normalizeActiveServerIndex(index, draftServers);
                        refreshServersList();
                        refreshServerForm();
                    });
                });

                panel.querySelectorAll('.edit-server').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const row = e.target.closest('.server-row');
                        const index = parseInt(row.dataset.index, 10);
                        const server = draftServers[index];
                        setDraft(server, index);
                        showServerEditor();
                        serverFormPopover?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    });
                });

                panel.querySelectorAll('.delete-server').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if (btn.disabled) return;
                        const row = e.target.closest('.server-row');
                        const index = parseInt(row.dataset.index, 10);
                        const servers = draftServers.slice();
                        if (servers.length <= 1) {
                            alert('至少保留一个服务器');
                            return;
                        }
                        if (!confirm(`确定删除服务器 "${servers[index].name}" 吗？`)) return;
                        servers.splice(index, 1);
                        if (draftActiveIndex === index) {
                            draftActiveIndex = 0;
                        } else if (draftActiveIndex > index) {
                            draftActiveIndex--;
                        }
                        draftServers = normalizeServerList(servers);
                        if (editingServerIndex === index) {
                            resetDraft();
                            if (serverFormPopover) serverFormPopover.hidden = true;
                        } else {
                            refreshServerForm();
                        }
                        refreshServersList();
                    });
                });
            }

            panel.querySelector('#add-server-btn').addEventListener('click', () => {
                resetDraft();
                refreshServerForm();
                showServerEditor();
                serverFormPopover?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            refreshServersList();
            refreshServerForm();

            // 测试连接按钮
            panel.querySelector('#test-connection').addEventListener('click', async () => {
                const activeServer = draftServers[draftActiveIndex] || draftServers[0] || emptyServer();
                const url = activeServer.baseUrl;
                const apiKey = activeServer.apiKey;
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
                            timeout: 5000,
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

            const darkModeToggle = panel.querySelector('#dark-mode-toggle');
            darkModeToggle.addEventListener('click', () => {
                const isDark = panel.classList.contains('dark-mode');
                if (isDark) {
                    panel.classList.remove('dark-mode');
                    darkModeToggle.textContent = '🌙';
                    currentConfig.darkMode = false;
                    darkModeToggle.title = '切换深色模式';   // 切换后为浅色，提示可切回深色
                } else {
                    panel.classList.add('dark-mode');
                    darkModeToggle.textContent = '☀️';
                    currentConfig.darkMode = true;
                    darkModeToggle.title = '切换浅色模式';   // 切换后为深色，提示可切回浅色
                }
            });

            const closePanel = () => {
                hideServerEditor();
                panel.remove();
            };
            panel.querySelector('.close-btn').addEventListener('click', closePanel);
            panel.querySelector('#panel-cancel-btn').addEventListener('click', closePanel);

            panel.querySelector('#panel-save-btn').addEventListener('click', async () => {
                if (!commitVisibleServerDraft()) return;
                hideServerEditor();

                const savedServers = normalizeServerList(draftServers);
                const savedActiveIndex = normalizeActiveServerIndex(draftActiveIndex, savedServers);
                const activeServer = savedServers[savedActiveIndex];
                if (!activeServer?.baseUrl || !activeServer?.apiKey) {
                    alert('请至少保留一个完整的默认 Emby 服务器');
                    showServerEditor();
                    return;
                }

                refreshServersList();
                refreshServerForm();
                hideServerEditor();

                const saveBtn = panel.querySelector('#panel-save-btn');
                if (saveBtn) saveBtn.disabled = true;

                try {
                    await Promise.all([
                        Config.saveServers(savedServers, savedActiveIndex),
                        setStoredValue('highlightColor', panel.querySelector('#highlight-color').value),
                        setStoredValue('maxConcurrentRequests', parseInt(panel.querySelector('#max-requests').value, 10)),
                        setStoredValue('badgeSize', panel.querySelector('#badge-size').value),
                        setStoredValue('badgeColor', panel.querySelector('#badge-color').value),
                        setStoredValue('badgeTextColor', panel.querySelector('#badge-text-color').value),
                        setStoredValue('darkMode', currentConfig.darkMode)
                    ]);
                } catch (error) {
                    if (saveBtn) saveBtn.disabled = false;
                    alert(`保存设置失败：${error?.message || error}`);
                    return;
                }

                const msgEl = document.getElementById('save-message');
                if (msgEl) {
                    msgEl.textContent = '✅ 设置已保存';
                    msgEl.style.display = 'block';
                }

                const serversChanged = JSON.stringify(initialServers) !== JSON.stringify(savedServers) ||
                                       initialActiveIndex !== savedActiveIndex;

                if (serversChanged) {
                    setTimeout(() => location.reload(), 600);
                } else {
                    setTimeout(() => {
                        if (msgEl) msgEl.style.display = 'none';
                        panel.remove();
                    }, 500);
                }
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

    // 复制工具函数
    function copyToClipboard(text, element) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showCopySuccess(element);
            }).catch(() => {
                fallbackCopyTextToClipboard(text, element);
            });
        } else {
            fallbackCopyTextToClipboard(text, element);
        }
    }

    function showCopySuccess(element) {
        const originalText = element.innerHTML;
        const originalBg = element.style.background;

        element.innerHTML = '✓ 已复制到剪切板';
        element.style.background = 'linear-gradient(135deg, #52b54b 0%, #3d9142 100%)';

        setTimeout(() => {
            element.innerHTML = originalText;
            element.style.background = originalBg;
        }, 1500);
    }

    function fallbackCopyTextToClipboard(text, element) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position: fixed; top: 0; left: 0; width: 2em; height: 2em; padding: 0; border: none; outline: none; box-shadow: none; background: transparent;';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            if (document.execCommand('copy')) {
                showCopySuccess(element);
            }
        } catch (err) {
            console.error('复制失败:', err);
        }
        document.body.removeChild(textArea);
    }

    // Emby API 和请求控制
    class EmbyAPI {
        constructor() {
            this.active = 0;
            this.waiting = [];
            this.total = 0;
            this.completed = 0;
        }

        getBtnSizeClass() {
            switch (Config.badgeSize) {
                case 'small': return 'emby-btn-small';
                case 'large': return 'emby-btn-large';
                default: return 'emby-btn-medium';
            }
        }

        async fetchData(code) {
            if (!code) return { Items: [] };

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
                        const checkUrl =
                            `${Config.embyBaseUrl}emby/Items/${cached.itemId}?api_key=${Config.embyAPI}`;
                        const res = await this.request(checkUrl);
                        const item = JSON.parse(res.responseText);
                        if (parseUncensoredCode(clean)) {
                            const best = this.findBestMatch([item], c, clean);
                            if (!best) {
                                EmbyCache.remove(c);
                                continue;
                            }
                            return { Items: [best], _searchCode: c, _fromCache: true };
                        }
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
                        const best = this.findBestMatch(data.Items, c, clean);
                        if (best) EmbyCache.set(c, best);
                        return data;
                    }
                } catch (e) {
                    console.error(`Emby 查询失败 ${c}`, e);
                }
            }

            return { Items: [] };
        }

        async checkExists(code) {
            if (!code) return null;

            const clean = code.trim().toUpperCase();
            const tryCodes = [];
            const addCode = (value) => {
                const v = String(value || '').trim().toUpperCase();
                if (!v || tryCodes.includes(v)) return;
                tryCodes.push(v);
            };

            addCode(clean);

            // 欧美厂商日期番号（BangBus.19.07.03）：直接查询，不做任何降级处理
            if (/^[A-Z]{2,20}\.\d{2}\.\d{2}\.\d{2}$/i.test(clean)) {
                // tryCodes 只含原始番号，直接跳到搜索阶段
            } else {
            const isUncensored = /^\d{6}[-_]\d{2,3}$/i.test(clean);
            const uncensoredFamily = getUncensoredFamily(clean);
            const isUncensoredWithPrefix = /(?:PACOPACOMAMA|PACO|1PONDO|CARIBBEANCOM|CARIB|HEYZO)[-_ ]+\d{6}[-_]\d{2,3}/i.test(clean);

            const fc2PPVMatch = clean.match(/^FC2-PPV-(\d+)$/i);
            const fc2Match = clean.match(/^FC2-(\d+)$/i);
            if (fc2PPVMatch) {
                addCode(`FC2-${fc2PPVMatch[1]}`);
            } else if (fc2Match) {
                addCode(`FC2-PPV-${fc2Match[1]}`);
            }

            const mainMatch = clean.match(/^([A-Z]+-\d+)/);
            if (mainMatch && mainMatch[1] !== clean && !isUncensored) {
                addCode(mainMatch[1]);
            }

            if (isUncensored || isUncensoredWithPrefix) {
                const core = clean.match(/(\d{6})[-_](\d{2,3})/);
                if (core) {
                    const head = core[1];
                    const tail = core[2];
                    const sep = clean.match(/[-_]/)?.[0] || '_';

                    addCode(`${head}${sep}${tail}`);
                    addCode(`${head}${tail}`);
                }

                const prefixMatch = clean.match(/^(PACOPACOMAMA|PACO|1PONDO|CARIBBEANCOM|CARIB|HEYZO)[-_ ]+(\d{6}[-_]\d{2,3})/i);
                if (prefixMatch) {
                    addCode(prefixMatch[2]);
                    addCode(prefixMatch[2].replace(/[-_]/g, ''));
                }
            }

            const suffixDigitMatch = clean.match(/^(\d{6})([-_])(\d{2,3})[-_][A-Z0-9]+$/i);
            if (suffixDigitMatch) {
                const base = `${suffixDigitMatch[1]}${suffixDigitMatch[2]}${suffixDigitMatch[3]}`;
                addCode(base);
                addCode(base.replace(/[-_]/, ''));
            }

            } // end of JP-specific normalization else block

            for (const c of tryCodes) {
                const cached = EmbyCache.get(c);
                if (cached && !EmbyCache.isExpired(cached)) {
                    try {
                        const checkUrl = `${Config.embyBaseUrl}emby/Items/${cached.itemId}?api_key=${Config.embyAPI}`;
                        const res = await this.request(checkUrl);
                        const item = JSON.parse(res.responseText);

                        if (parseUncensoredCode(clean)) {
                            const best = this.findBestMatch([item], c, code);
                            if (best) return best;
                            EmbyCache.remove(c);
                            continue;
                        }

                        return item;
                    } catch {
                        EmbyCache.remove(c);
                    }
                }
            }

            for (let i = 0; i < tryCodes.length; i++) {
                const c = tryCodes[i];
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
                        const best = this.findBestMatch(items, c, code);
                        if (best) {
                            EmbyCache.set(c, best);
                            return best;
                        }
                    }
                } catch (e) {
                    console.error(`Emby 查询失败 ${c}`, e);
                    if (i === 0) {
                        Prompt.queryError(code, e.message);
                    }
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
            const maxConcurrent = Number.isFinite(Number(Config.maxConcurrentRequests))
                ? Math.min(100, Math.max(1, Math.floor(Number(Config.maxConcurrentRequests))))
                : 50;

            return new Promise(resolve => {
                const checkComplete = () => {
                    if (this.completed >= this.total && this.active === 0) {
                        const found = results.filter(r => r !== null).length;
                        Prompt.batchComplete(found);
                        resolve(results);
                    }
                };

                const processRequest = (index) => {
                    const code = codes[index];
                    this.active++;

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
                    if (this.active < maxConcurrent) processRequest(i);
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

        createLink(item) {
            if (!item) return null;

            const embyUrl = `${Config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

            const link = document.createElement('a');
            link.href = embyUrl;
            link.target = '_blank';
            link.className = `emby-btn emby-btn-jump ${this.getBtnSizeClass()}`;
            link.textContent = '🎬 跳转到Emby';

            return link;
        }

        createCopyButton(code) {
            if (!code) return null;

            const btn = document.createElement('span');
            btn.className = `emby-btn emby-btn-copy ${this.getBtnSizeClass()}`;
            btn.textContent = `📀 ${code}`;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(code, btn);
            });

            return btn;
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

        findBestMatch(items, queryCode, originalCode) {
            if (!items || items.length === 0) return null;

            const target = queryCode.trim().toUpperCase();

            // 欧美厂商日期番号精确匹配（BangBus.19.07.03）
            // Emby 库里命名与番号完全一致，直接做大小写不敏感的完整包含匹配即可
            const isWestern = /^[A-Z]{2,20}\.\d{2}\.\d{2}\.\d{2}$/i.test(queryCode);
            if (isWestern) {
                const exact = items.find(it => (it.Name || '').toUpperCase() === target);
                if (exact) return exact;
                // 次选：名称里包含完整番号（有时 Emby 名称带有额外描述）
                const contains = items.find(it => (it.Name || '').toUpperCase().includes(target));
                if (contains) return contains;
                return null;
            }
            const targetClean = target.replace(/[-_]/g, '');
            const mainTarget = target.replace(/-\d+$/, '');
            const cleanStr = s => (s || '').toUpperCase().replace(/[-_]/g, '');
            const targetAlphaNum = target.replace(/[^A-Z0-9]/g, '');
            const targetPrefix = target.split(/[-_\s]/)[0];

            const targetNumPart = target.match(/(\d+)$/)?.[1] || '';
            const targetParsed = parseUncensoredCode(target);
            const originalParsed = parseUncensoredCode(originalCode);
            const effectiveUncensored = targetParsed || originalParsed;
            const targetFamily = targetParsed?.family || originalParsed?.family || null;

            const hasSuffix = /^\d{6}[-_]\d{2,3}[-_][A-Z0-9]+$/i.test(originalCode) && !/^\d{6}[-_]\d{2,3}$/.test(originalCode);
            const originalFamily = originalParsed?.family || null;
            const originalSep = originalParsed?.sep || originalCode.match(/[-_]/)?.[0] || '';
            let originalSuffix = null;
            if (hasSuffix) {
                originalSuffix = originalCode.replace(/^\d{6}[-_]\d{2,3}[-_]/, '').toUpperCase();
            }

            let best = null;
            let bestScore = 0;

            for (const it of items) {
                const name = (it.Name || '').toUpperCase();
                const nameClean = cleanStr(name);
                const nameAlphaNum = name.replace(/[^A-Z0-9]/g, '');
                const namePrefix = name.split(/[-_\s]/)[0];

                let nameSuffix = null;
                if (/^\d{6}[-_]\d{2,3}[-_][A-Z0-9]+$/i.test(name)) {
                    nameSuffix = name.replace(/^\d{6}[-_]\d{2,3}[-_]/, '').toUpperCase();
                }

                let score = 0;

                const normalizedName = name.replace(/_/g, '-');
                const normalizedTarget = target.replace(/_/g, '-');
                const nameParsed = parseUncensoredCode(name);
                const targetSep = targetParsed?.sep || target.match(/[-_]/)?.[0] || '';
                const nameSep = nameParsed?.sep || name.match(/[-_]/)?.[0] || '';

                if (targetFamily) {
                    const targetDigits = effectiveUncensored?.digits || '';
                    const targetTail = effectiveUncensored?.tail || '';
                    const expectedSep = effectiveUncensored?.sep || targetSep;
                    const nameDigits = nameParsed?.digits || '';
                    const nameTail = nameParsed?.tail || '';
                    if (targetDigits && nameDigits === targetDigits && nameTail === targetTail && name === target) {
                        score = 100;
                    } else if (targetDigits && nameDigits === targetDigits && nameTail === targetTail) {
                        if (expectedSep && expectedSep !== nameSep) {
                            score = 60;
                        } else {
                            score = 98;
                        }
                    }
                }

                if (score === 0 && name === target) score = 100;
                else if (score === 0 && nameClean === targetClean) score = 95;
                else if (score === 0 && normalizedName.includes(normalizedTarget) && target.includes('_') === name.includes('_')) score = 92;
                else if (score === 0 && name === mainTarget) score = 90;
                else if (score === 0 && nameClean === cleanStr(mainTarget)) score = 88;
                else if (score === 0 && normalizedName.includes(normalizedTarget) && targetPrefix === namePrefix) score = 85;
                else if (score === 0 && nameClean.includes(targetClean) && targetPrefix === namePrefix) score = 80;
                else if (score === 0 && nameAlphaNum === targetAlphaNum) score = 75;
                if (score === 75 && queryCode === originalCode) {
                    const targetHasUnderscore = target.includes('_');
                    const nameHasUnderscore = name.includes('_');
                    if (targetHasUnderscore !== nameHasUnderscore) {
                        score = 60;
                    }
                }

                if (hasSuffix && score > 0 && nameSuffix && nameSuffix !== originalSuffix) {
                    score = 50;
                }

                if (targetFamily) {
                    const nameFamily = nameParsed?.family || getUncensoredFamily(name);
                    const targetCore = effectiveUncensored?.core || target.replace(/[^0-9]/g, '');
                    const nameCore = nameParsed?.core || name.replace(/[^0-9]/g, '');
                    if (nameFamily && nameFamily !== targetFamily) score = 0;
                    else if (nameCore && targetCore && nameCore !== targetCore) score = 0;
                    else if (!nameFamily && originalFamily && originalFamily !== targetFamily) score = 0;
                    else if (originalSep && nameSep && originalSep === nameSep && name === target) score = 100;
                    else if (originalSep && nameSep && originalSep !== nameSep && nameCore === targetCore) score = Math.min(score, 90);
                }

                if (score >= 75 && score < 95 && targetNumPart && !targetFamily) {
                    if (!nameClean.includes(targetClean)) {
                        score = 0;
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    best = it;
                }
            }

            return bestScore >= 70 ? best : null;
        }
    }

    const BaseProcessor = {
        init(api) {
            this.api = api;
            this.processed = new WeakSet();
            return this;
        },

        appendToSharedRow(link, copyBtn, fallbackAnchor) {
            if (!link && !copyBtn) return;

            const doAppend = () => {
                const jumpGroup = document.querySelector('.jav-jump-btn-group');
                if (jumpGroup) {
                    const sep = document.createElement('span');
                    sep.style.cssText = 'display:inline-block;width:1px;height:16px;background:rgba(128,128,128,0.35);margin:0 4px;align-self:center;flex-shrink:0;';
                    jumpGroup.appendChild(sep);
                    if (link) jumpGroup.appendChild(link);
                    if (copyBtn) jumpGroup.appendChild(copyBtn);
                    return true;
                }
                return false;
            };

            if (doAppend()) return;

            setTimeout(() => {
                if (doAppend()) return;
                const container = document.createElement('span');
                container.className = 'emby-button-group';
                container.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-left:8px;';
                if (link) container.appendChild(link);
                if (copyBtn) container.appendChild(copyBtn);
                if (fallbackAnchor && fallbackAnchor.parentNode) {
                    fallbackAnchor.parentNode.insertBefore(container, fallbackAnchor.nextSibling);
                }
            }, 600);
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

            extractCode: item => {
                const text = item.querySelector('.item date')?.textContent?.trim();
                return extractCodeFromText(text);
            },

            getElement: item =>
                item.querySelector('.item date'),

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                const infoElement = document.querySelector('.col-md-3.info p');
                if (!infoElement) return;

                const spans = infoElement.querySelectorAll('span');
                if (spans.length > 1) {
                    const code = extractCodeFromText(spans[1].textContent);
                    if (code) {
                        Prompt.queryStart(code);
                        const bestItem = await this.api.checkExists(code);
                        const link = bestItem ? this.api.createLink(bestItem) : null;
                        const copyBtn = this.api.createCopyButton(code);
                        this.appendToSharedRow(link, copyBtn, spans[1]);
                        if (bestItem) Prompt.querySuccess(code);
                        else Prompt.queryNotFound(code);
                    }
                }
            }
        }),

        javdb: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.movie-list .item, .grid-item',

            extractCode: item => {
                const text = item.querySelector('.video-title strong')?.textContent?.trim();
                return extractCodeFromText(text);
            },

            getElement: item =>
                item.querySelector('.video-title strong'),

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                const detailElement =
                    document.querySelector('body > section > div > div.video-detail > h2 > strong') ||
                    document.querySelector('.video-detail h2 strong');

                if (!detailElement) return;

                const code = extractCodeFromText(detailElement.textContent);
                if (code) {
                    Prompt.queryStart(code);
                    const bestItem = await this.api.checkExists(code);
                    const link = bestItem ? this.api.createLink(bestItem) : null;
                    const copyBtn = this.api.createCopyButton(code);
                    this.appendToSharedRow(link, copyBtn, detailElement.parentNode);
                    if (bestItem) Prompt.querySuccess(code);
                    else Prompt.queryNotFound(code);
                }
            }
        }),

        supjav: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.post',

            extractCode(item) {
                const text = item.querySelector('h3 a')?.textContent?.trim();
                return extractCodeFromText(text);
            },

            getElement(item) {
                return item.querySelector('h3 a');
            },

            async processDetailPage() {
                const titleElement = document.querySelector('.video-wrap .archive-title h1');
                if (!titleElement) return;

                if (titleElement.dataset.embyInjected === '1') return;
                titleElement.dataset.embyInjected = '1';

                const title = titleElement.textContent.trim();
                const code = extractCodeFromText(title);
                if (!code) return;

                Prompt.queryStart(code);
                const bestItem = await this.api.checkExists(code);
                const link = bestItem ? this.api.createLink(bestItem) : null;
                const copyBtn = this.api.createCopyButton(code);
                this.appendToSharedRow(link, copyBtn, titleElement);
                if (bestItem) Prompt.querySuccess(code);
                else Prompt.queryNotFound(code);
            }
        }),

        sehuatang: Object.assign(Object.create(BaseProcessor), {
            listSelector: 'tbody[id^="normalthread_"]',

            extractCode: function(item) {
                const link = item.querySelector('a.xst');
                return link ? extractCodeFromText(link.textContent) : null;
            },

            getElement: item => item.querySelector('a.xst'),

            async processListPage() {
                const items = document.querySelectorAll(this.listSelector);
                if (!items.length) return;

                Status.show(`正在收集番号: 共${items.length}个项目`);

                const toProcess = [];
                const codes = [];

                for (const item of items) {
                    if (this.processed.has(item)) continue;
                    this.processed.add(item);

                    const code = this.extractCode(item);
                    const element = this.getElement(item);

                    if (code && element) {
                        toProcess.push({ element, code, item });
                        codes.push(code);
                    }
                }

                if (codes.length === 0) {
                    Status.hide();
                    return;
                }

                const bestItems = await this.api.batchQuery(codes);
                const operations = [];

                for (let i = 0; i < bestItems.length; i++) {
                    const { element, item } = toProcess[i];
                    const bestItem = bestItems[i];

                    if (bestItem) {
                        element.classList.add('emby-exists');
                        if (item) item.classList.add('emby-processed');

                        const jumpBtn = this.api.createLink(bestItem);
                        if (jumpBtn) {
                            jumpBtn.style.marginLeft = '8px';
                            operations.push(() => {
                                element.parentNode.insertBefore(jumpBtn, element.nextSibling);
                            });
                        }
                    }
                }

                if (operations.length > 0) {
                    requestAnimationFrame(() => {
                        operations.forEach(op => op());
                    });
                }
            },

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig) return;

                if (siteConfig.list) {
                    await this.processListPage();
                }

                if (siteConfig.detail) {
                    if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                    const titleEl = document.querySelector('#thread_subject') ||
                                    document.querySelector('h1.ts') ||
                                    document.querySelector('h1');
                    if (!titleEl) return;

                    const title = document.title.trim();
                    const codes = this.extractCodes(title);

                    if (codes.length > 0) {
                        Prompt.batchStart(codes.length);
                        const bestItems = await this.api.batchQuery(codes);
                        let foundAny = false;

                        for (let i = 0; i < codes.length; i++) {
                            const code = codes[i];
                            const bestItem = bestItems[i];
                            const link = bestItem ? this.api.createLink(bestItem) : null;
                            const copyBtn = this.api.createCopyButton(code);
                            this.appendToSharedRow(link, copyBtn, titleEl);
                            if (bestItem) foundAny = true;
                        }

                        Prompt.batchComplete(foundAny ? bestItems.filter(Boolean).length : 0);
                    }
                }

                this.setupObserver();
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

        sukebei: Object.assign(Object.create(BaseProcessor), {
            listSelector: 'table tbody tr',

            extractCode(item) {
                const linkEl = item.querySelector('td:nth-child(2) a:not(.comments)');
                return linkEl ? extractCodeFromText(linkEl.textContent) : null;
            },

            getElement(item) {
                return item.querySelector('td:nth-child(2) a:not(.comments)');
            },

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig) return;

                if (location.pathname.startsWith('/view/')) {
                    if (siteConfig.detail) await this.processDetailPage();
                    return;
                }

                if (siteConfig.list) await this.processListPage();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                const titleElement = document.querySelector('.panel-heading .panel-title');
                if (!titleElement) return;

                const code = extractCodeFromText(titleElement.textContent);
                if (!code) return;

                Prompt.queryStart(code);
                const bestItem = await this.api.checkExists(code);
                const link = bestItem ? this.api.createLink(bestItem) : null;
                const copyBtn = this.api.createCopyButton(code);
                this.appendToSharedRow(link, copyBtn, titleElement);
                if (bestItem) Prompt.querySuccess(code);
                else Prompt.queryNotFound(code);
            },

            async processListPage() {
                    const rows = document.querySelectorAll(this.listSelector);
                    const items = [];

                    for (const row of rows) {
                        const linkEl = row.querySelector('td:nth-child(2) a:not(.comments)');
                        if (!linkEl || linkEl.dataset.embyChecked) continue;

                        linkEl.dataset.embyChecked = "1";

                        const code = extractCodeFromText(linkEl.textContent);
                        if (!code) continue;

                        const td = linkEl.parentNode;
                        if (!td) continue;

                        items.push({ linkEl, td, code });
                    }

                    if (items.length === 0) return;

                    const codes = items.map(item => item.code);
                    const bestItems = await this.api.batchQuery(codes);

                    let foundCount = 0;
                    for (let i = 0; i < bestItems.length; i++) {
                        const bestItem = bestItems[i];
                        if (!bestItem) continue;

                        foundCount++;
                        const { linkEl, td } = items[i];
                        if (td.dataset.embyBtnAdded) continue;
                        td.dataset.embyBtnAdded = '1';

                        linkEl.classList.add('emby-exists');

                        const icon = td.querySelector('[data-lmt]');

                        const wrapper = document.createElement('span');
                        wrapper.style.display = 'flex';
                        wrapper.style.alignItems = 'center';
                        wrapper.style.width = '100%';
                        wrapper.style.minWidth = '0';

                        if (icon) {
                            icon.parentNode.removeChild(icon);
                            wrapper.appendChild(icon);
                            icon.style.flexShrink = '0';
                            icon.style.marginRight = '4px';
                        }

                        linkEl.parentNode.removeChild(linkEl);
                        wrapper.appendChild(linkEl);

                        linkEl.style.flex = '1';
                        linkEl.style.minWidth = '0';
                        linkEl.style.overflow = 'hidden';
                        linkEl.style.textOverflow = 'ellipsis';
                        linkEl.style.whiteSpace = 'nowrap';

                        const embyUrl = `${Config.embyBaseUrl}web/index.html#!/item?id=${bestItem.Id}&serverId=${bestItem.ServerId}`;
                        const btn = document.createElement('a');
                        btn.href = embyUrl;
                        btn.target = '_blank';
                        btn.className = `emby-btn emby-btn-jump ${this.api.getBtnSizeClass()}`;
                        btn.textContent = '🎬跳转到Emby';
                        btn.style.flexShrink = '0';
                        btn.style.marginLeft = '8px';
                        wrapper.appendChild(btn);

                        td.innerHTML = '';
                        td.appendChild(wrapper);
                    }

                    Prompt.batchComplete(foundCount);
                }
            }),

        javlibrary: (function() {
            const embyItemMap = new Map();

            function hasListBadge(video) {
                return Array.from(video.children).some(el => el.classList?.contains('emby-javlibrary-list-badge'));
            }

            function renderListHit(video, item) {
                if (!video || !item) return;

                video.classList.add('emby-javlibrary-hit');
                if (hasListBadge(video)) return;

                const embyUrl = `${Config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;
                const badge = document.createElement('a');
                badge.className = 'emby-javlibrary-list-badge';
                badge.href = embyUrl;
                badge.target = '_blank';
                badge.rel = 'noopener noreferrer';
                badge.textContent = 'Emby';
                badge.addEventListener('click', e => e.stopPropagation());
                video.appendChild(badge);
            }

            function maintainDetailPage(api) {
                const siteConfig = typeof GM_getValue !== 'undefined' ? Config.enabledSites.javlibrary : { detail: true };
                if (!siteConfig || !siteConfig.detail) return;

                const idContainer = document.querySelector('#video_id');
                const idCodeElement = document.querySelector('#video_id .text');
                if (!idContainer || !idCodeElement) return;

                const code = extractCodeFromText(idCodeElement.textContent);
                if (!code) return;

                if (idContainer.dataset.embyCode === code) return;
                if (idContainer.dataset.embyProcessing === 'true') return;

                idContainer.dataset.embyProcessing = 'true';
                const copyBtn = api.createCopyButton(code);

                let item = embyItemMap.get(code);
                if (item) {
                    const link = api.createLink(item);
                    BaseProcessor.appendToSharedRow(link, copyBtn, idContainer);
                    if (link) Prompt.querySuccess(code);
                    idContainer.dataset.embyCode = code;
                    delete idContainer.dataset.embyProcessing;
                    return;
                }

                Prompt.queryStart(code);
                api.checkExists(code).then(bestItem => {
                    if (bestItem) {
                        embyItemMap.set(code, bestItem);
                        const link = api.createLink(bestItem);
                        BaseProcessor.appendToSharedRow(link, copyBtn, idContainer);
                        if (link) Prompt.querySuccess(code);
                        else Status.error('❌ 创建链接失败', true);
                    } else {
                        BaseProcessor.appendToSharedRow(null, copyBtn, idContainer);
                        Prompt.queryNotFound(code);
                    }
                }).catch(e => {
                    console.error('Emby查询失败', e);
                    Prompt.queryError(code, e.message);
                }).finally(() => {
                    if (idContainer && idContainer.dataset) {
                        idContainer.dataset.embyCode = code;
                        delete idContainer.dataset.embyProcessing;
                    }
                });
            }

            return Object.assign(Object.create(BaseProcessor), {
                listSelector: '.video',

                extractCode: function(item) {
                    const idEl = item.querySelector('div.id');
                    return idEl ? extractCodeFromText(idEl.textContent) : null;
                },

                async processListItems(items) {
                    const videos = [];
                    const codes = [];

                    items.forEach(video => {
                        const code = this.extractCode(video);
                        if (!code) return;

                        const cachedItem = embyItemMap.get(code);
                        if (cachedItem) {
                            renderListHit(video, cachedItem);
                            return;
                        }

                        if (this.processed.has(video)) return;
                        this.processed.add(video);

                        videos.push(video);
                        codes.push(code);
                    });

                    if (!codes.length) return;

                    const bestItems = await this.api.batchQuery(codes);
                    for (let i = 0; i < bestItems.length; i++) {
                        if (!bestItems[i]) continue;
                        const video = videos[i];
                        const code = codes[i];
                        embyItemMap.set(code, bestItems[i]);
                        renderListHit(video, bestItems[i]);
                    }
                },

                async process() {
                    const siteConfig = this.__siteConfig;
                    if (!siteConfig) return;

                    // 列表页处理
                    if (siteConfig.list) {
                        const items = document.querySelectorAll(this.listSelector);
                        if (items.length > 0) await this.processListItems(Array.from(items));
                    }

                    // 详情页处理
                    if (siteConfig.detail) {
                        this.startDetailMaintenance();
                        maintainDetailPage(this.api);
                    }

                    this.setupObserver();
                },

                setupObserver() {
                    let pending = [], timer = null;
                    const processMutations = () => {
                        const newItems = [];
                        pending.forEach(m => {
                            if (m.type === 'childList') {
                                m.addedNodes.forEach(node => {
                                    if (node.nodeType !== 1) return;
                                    if (node.matches?.(this.listSelector)) newItems.push(node);
                                    node.querySelectorAll?.(this.listSelector).forEach(el => newItems.push(el));
                                });
                            }
                        });
                        if (newItems.length) this.process();
                        pending = []; timer = null;
                    };
                    new MutationObserver(mutations => {
                        pending.push(...mutations);
                        if (!timer) timer = setTimeout(processMutations.bind(this), 300);
                    }).observe(document.body, { childList: true, subtree: true });
                },

                startDetailMaintenance() {
                    if (this._detailMaintenanceStarted) return;
                    this._detailMaintenanceStarted = true;
                    setInterval(() => maintainDetailPage(this.api), 2000);
                }
            });
        })(),

        javrate: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.mgn-item',

            extractCode: item => {
                const strong = item.querySelector('strong.fg-main');
                return strong ? extractCodeFromText(strong.textContent) : null;
            },

            findImgContainer: item => {
                return item.querySelector('.mgn-box') || item;
            },

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig) return;

                if (siteConfig.list && this.listSelector) {
                    const items = document.querySelectorAll(this.listSelector);
                    if (items.length > 0) {
                        await this.processItemsWithBadge(items);
                    }
                }

                if (siteConfig.detail) {
                    await this.processDetailPage();
                }

                this.setupObserver();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                let code = null;
                const h1Strong = document.querySelector('h1 strong.fg-main');
                if (h1Strong) code = extractCodeFromText(h1Strong.textContent);
                if (!code) {
                    const keywords = document.querySelector('meta[name="keywords"]')?.content || "";
                    code = extractCodeFromText(keywords);
                }
                if (!code) { console.log('[Emby] 未找到番号'); return; }

                code = code.toUpperCase();
                Prompt.queryStart(code);
                const bestItem = await this.api.checkExists(code);
                const link = bestItem ? this.api.createLink(bestItem) : null;
                const copyBtn = this.api.createCopyButton(code);
                const titleElement = document.querySelector('h1');
                this.appendToSharedRow(link, copyBtn, titleElement || document.body);
                if (bestItem) Prompt.querySuccess(code);
                else Prompt.queryNotFound(code);
            }
        }),

        '169bbs': Object.assign(Object.create(BaseProcessor), {
            listSelector: 'tbody[id^="normalthread_"]',
            codeRegex: /[A-Z]{2,10}-\d+/i,

            extractCode: function(item) {
                const link = item.querySelector('a.xst');
                if (!link) return null;
                return extractCodeFromText(link.textContent);
            },

            getElement: item => item.querySelector('a.xst'),

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
                        toProcess.push({ element, code, item });
                        codes.push(code);
                    }
                }

                if (codes.length > 0) {
                    const bestItems = await this.api.batchQuery(codes);
                    const processedElements = [];

                    for (let i = 0; i < bestItems.length; i++) {
                        if (bestItems[i]) {
                            const { element, item } = toProcess[i];

                            element.classList.add('emby-exists');
                            if (item) item.classList.add('emby-processed');

                            const link = this.api.createLink(bestItems[i]);
                            if (link) {
                                link.style.marginLeft = '8px';

                                let current = element;
                                const containerClasses = ['item', 'masonry-brick', 'grid-item', 'movie-list', 'post'];
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
                                    target: element.parentNode || element,
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
                } else {
                    Status.hide();
                }
            },

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
                        const code = extractCodeFromText(titleEl.textContent);
                        if (code) {
                            Prompt.queryStart(code);
                            const bestItem = await this.api.checkExists(code);
                            const link = bestItem ? this.api.createLink(bestItem) : null;
                            const copyBtn = this.api.createCopyButton(code);
                            this.appendToSharedRow(link, copyBtn, titleEl);
                            if (bestItem) Prompt.querySuccess(code);
                            else Prompt.queryNotFound(code);
                        }
                    }
                }

                this.setupObserver();
            }
        }),

        'hjd2048': Object.assign(Object.create(BaseProcessor), {
            listSelector: 'tr.tr3.t_one',

            extractCode: function(item) {
                const link = item.querySelector('a.subject');
                return link ? extractCodeFromText(link.textContent) : null;
            },

            getElement: item => item.querySelector('a.subject'),

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
                        toProcess.push({ element, code, item });
                        codes.push(code);
                    }
                }

                if (codes.length === 0) {
                    Status.hide();
                    return;
                }

                const bestItems = await this.api.batchQuery(codes);
                const operations = [];

                for (let i = 0; i < bestItems.length; i++) {
                    const { element, item } = toProcess[i];
                    const bestItem = bestItems[i];

                    if (bestItem) {
                        element.classList.add('emby-exists');
                        if (item) item.classList.add('emby-processed');

                        const jumpBtn = this.api.createLink(bestItem);
                        if (jumpBtn) {
                            jumpBtn.style.marginLeft = '8px';
                            operations.push(() => {
                                element.parentNode.insertBefore(jumpBtn, element.nextSibling);
                            });
                        }
                    }
                }

                if (operations.length > 0) {
                    requestAnimationFrame(() => {
                        operations.forEach(op => op());
                    });
                }
            },

            async processListPage() {
                const items = document.querySelectorAll(this.listSelector);
                if (items.length) {
                    await this.processItemsWithLink(items);
                }
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                const titleEl = document.querySelector('h1#subject_tpc');
                if (!titleEl) return;

                const code = extractCodeFromText(titleEl.textContent);
                if (!code) return;

                Prompt.queryStart(code);
                const bestItem = await this.api.checkExists(code);
                const link = bestItem ? this.api.createLink(bestItem) : null;
                const copyBtn = this.api.createCopyButton(code);
                this.appendToSharedRow(link, copyBtn, titleEl);
                if (bestItem) Prompt.querySuccess(code);
                else Prompt.queryNotFound(code);
            },

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig) return;

                if (siteConfig.list) {
                    await this.processListPage();
                }

                if (siteConfig.detail) {
                    await this.processDetailPage();
                }

                this.setupObserver();
            }
        }),

        missav: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.thumbnail.group',

            extractCode: item => {
                const titleEl = item.querySelector('.my-2 a') ||
                               item.querySelector('a[alt]') ||
                               item.querySelector('a');
                return titleEl ? extractCodeFromText(titleEl.textContent || titleEl.getAttribute('alt') || '') : null;
            },

            findCoverElement(item) {
                return item.querySelector(':scope > .relative.aspect-w-16.aspect-h-9') ||
                       item.querySelector('.aspect-w-16.aspect-h-9') ||
                       item.querySelector('img')?.closest('.relative') ||
                       null;
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

                    const coverEl = this.findCoverElement(item);
                    if (!coverEl) continue;

                    toProcess.push({ item, code, coverEl });
                    codes.push(code);
                }

                if (codes.length === 0) return;

                const bestItems = await this.api.batchQuery(codes);

                const operations = [];
                for (let i = 0; i < bestItems.length; i++) {
                    if (bestItems[i]) {
                        const { item, coverEl } = toProcess[i];
                        item.classList.add('emby-missav-hit');
                        coverEl.classList.add('emby-missav-cover-hit');

                        const badge = this.api.createBadge(bestItems[i]);
                        if (badge) {
                            badge.style.fontSize = '11px';
                            operations.push(() => {
                                // 把徽章插入到标题链接旁边
                                if (!coverEl.querySelector('.emby-badge')) {
                                    let overlay = coverEl.querySelector('.emby-missav-overlay');
                                    if (!overlay) {
                                        overlay = document.createElement('span');
                                        overlay.className = 'emby-missav-overlay';
                                        coverEl.appendChild(overlay);
                                    }
                                    overlay.appendChild(badge);
                                }
                            });
                        }
                    }
                }

                if (operations.length > 0) {
                    requestAnimationFrame(() => operations.forEach(op => op()));
                }
            },

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig) return;

                if (siteConfig.list && this.listSelector) {
                    const items = document.querySelectorAll(this.listSelector);
                    if (items.length > 0) {
                        await this.processItemsWithBadge(items);
                    }
                }

                if (siteConfig.detail) {
                    await this.processDetailPage();
                }

                this.setupObserver();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                const titleElement = document.querySelector('h1') || document.querySelector('title');
                if (!titleElement) return;

                const titleText = typeof titleElement === 'string' ? document.title : titleElement.textContent || document.title;
                const code = extractCodeFromText(titleText);
                if (!code) return;

                Prompt.queryStart(code);
                const bestItem = await this.api.checkExists(code);
                const link = bestItem ? this.api.createLink(bestItem) : null;
                const copyBtn = this.api.createCopyButton(code);
                this.appendToSharedRow(link, copyBtn, titleElement);
                if (bestItem) Prompt.querySuccess(code);
                else Prompt.queryNotFound(code);
            }
        }),

        jable: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                const siteConfig = this.__siteConfig;
                if (!siteConfig || !siteConfig.detail) return;

                await this.processDetailPage();
            },

            async processDetailPage() {
                if (document.querySelector('.emby-jump-link, .emby-badge, .emby-copy-btn')) return;

                const titleElement = document.querySelector('.header-left h4');
                if (!titleElement) return;

                const code = extractCodeFromText(titleElement.textContent);
                if (!code) return;

                Prompt.queryStart(code);
                const bestItem = await this.api.checkExists(code);
                const link = bestItem ? this.api.createLink(bestItem) : null;
                const copyBtn = this.api.createCopyButton(code);
                this.appendToSharedRow(link, copyBtn, titleElement);
                if (bestItem) Prompt.querySuccess(code);
                else Prompt.queryNotFound(code);
            }
        }),
    };

    function detectSite() {
        const host = location.hostname;
        const url = location.href;

        if (host.includes('javbus')) return 'javbus';
        if (host.includes('javdb')) return 'javdb';
        if (host.includes('supjav')) return 'supjav';
        if (host.includes('sehuatang')) return 'sehuatang';
        if (host.includes('nyaa.si')) return 'sukebei';
        if (host.includes('javlibrary')) return 'javlibrary';
        if (host.includes('javrate')) return 'javrate';
        if (host.includes('169bbs')) return '169bbs';
        if (host.includes('hjd2048.com')) return 'hjd2048';
        if (host.includes('missav.ws')) return 'missav';
        if (host.includes('jable.tv')) return 'jable';

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
