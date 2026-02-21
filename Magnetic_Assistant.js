// ==UserScript==
// @name         磁力&电驴链接助手
// @namespace    https://github.com/ZiPenOk
// @version      2.5.6
// @description  点击按钮显示绿色勾，同组按钮点击时互斥切换。支持复制、推送到qB/115，带现代化配置面板。
// @author       ZiPenOk
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      *
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/Magnetic_Assistant.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/Magnetic_Assistant.js
// ==/UserScript==

(function() {
    'use strict';

    // ================= 1. 基础配置 =================
    const config = {
        enableCopy: GM_getValue('enableCopy', true),
        enableQb: GM_getValue('enableQb', true),
        enable115: GM_getValue('enable115', false),
        qbtHost: GM_getValue('qbtHost', 'http://127.0.0.1:8080'),
        qbtUser: GM_getValue('qbtUser', 'admin'),
        qbtPass: GM_getValue('qbtPass', 'adminadmin'),
        u115Uid: GM_getValue('u115Uid', '')
    };

    GM_registerMenuCommand("⚙️ 脚本综合设置", showSettingsModal);

    // 图标定义
    const ICONS = {
        copy: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#666"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
        qb: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#0078d4"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
        u115: `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="11" fill="#2777F8"/><text x="12" y="17" font-family="Arial" font-size="12" font-weight="900" fill="white" text-anchor="middle">5</text></svg>`,
        check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#28a745"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
    };

    // ================= 2. 注入CSS（完整版）=================
    const style = document.createElement('style');
    style.innerHTML = `
        .mag-btn-group {
            display: inline-flex !important;
            vertical-align: middle !important;
            margin-left: 8px !important;
            gap: 6px !important;
            background: #f8f9fa !important;
            padding: 4px 5px !important;
            border-radius: 8px !important;
            border: 1px solid #dee2e6 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
            transition: box-shadow 0.2s;
        }
        .mag-btn-group:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
        }
        .mag-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 28px !important;
            height: 24px !important;
            background: #ffffff !important;
            border: 1px solid #ced4da !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
            position: relative;
            overflow: hidden;
        }
        .mag-btn:hover {
            background: #e9ecef !important;
            border-color: #0078d4 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,120,212,0.2) !important;
        }
        .mag-btn.active {
            border-color: #28a745 !important;
            background: #f0fff4 !important;
            box-shadow: 0 0 0 2px rgba(40,167,69,0.3) !important;
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
            width: 100px;
            height: 100px;
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
        clickedBtn.innerHTML = ICONS.check;
        clickedBtn.classList.add('active');
    }

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
                setBtnActive(btn, group);
                action();
            };
            group.appendChild(btn);
        };

        if (config.enableCopy) {
            addBtn('copy', ICONS.copy, '复制链接', () => {
                GM_setClipboard(link, 'text');
                showToast('📋 链接已复制');
            });
        }

        if (config.enableQb) {
            addBtn('qb', ICONS.qb, '推送至 qB', () => pushToQb(link));
        }

        if (config.enable115) {
            addBtn('115', ICONS.u115, '115 离线', () => pushTo115(link));
        }

        return group;
    }

    // ================= 4. 推送函数 =================
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
                        }
                    });
                } else showToast('🚫 qB 登录失败', false);
            }
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

    // ================= 5. 页面扫描 =================
    function processPage() {
        const regex = /(magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}|ed2k:\/\/\|file\|[^|]+\|\d+\|[a-fA-F0-9]{32}\|)/gi;

        document.querySelectorAll('a').forEach(a => {
            if (a.dataset.magProcessed) return;
            const href = a.href || '';
            if (href.match(regex)) {
                a.after(createBtnGroup(href));
                a.dataset.magProcessed = 'true';
            }
        });

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        const textNodes = [];
        while (node = walker.nextNode()) {
            const parent = node.parentElement;
            if (!parent || parent.closest('.mag-btn-group') || parent.closest('[data-mag-processed]') ||
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
                fragment.appendChild(createBtnGroup(link));
                lastIndex = regex.lastIndex;
            }
            fragment.appendChild(document.createTextNode(content.substring(lastIndex)));
            try { parent.replaceChild(fragment, node); } catch (e) {}
        });
    }

    // ================= 6. 设置面板（改进的115登录检查）=================
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

        // 改进的115登录状态检测（基于参考脚本，准确可靠）
        function test115Connection() {
            const resultSpan = modal.querySelector('#u115_test_result');
            resultSpan.textContent = '检查登录状态...';
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://115.com/web/lixian/?ct=lixian&ac=task_lists&t=' + Date.now(),
                anonymous: false, // 确保发送Cookie
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://115.com/web/lixian/'
                },
                onload: (res) => {
                    try {
                        // 检查是否被重定向到登录页
                        if (res.finalUrl && res.finalUrl.includes('login.115.com')) {
                            resultSpan.innerHTML = '❌ 未登录，请先登录115官网';
                            return;
                        }
                        const text = res.responseText;
                        let json = null;
                        try {
                            json = JSON.parse(text);
                        } catch (_) {}
                        if (json) {
                            // 如果state为true或errno为0，通常表示已登录
                            if (json.state === true || json.errno === 0) {
                                resultSpan.innerHTML = '✅ 已登录115';
                                return;
                            } else {
                                resultSpan.innerHTML = '❌ 未登录或登录已过期';
                                return;
                            }
                        } else {
                            // 非JSON，可能是登录页面
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

    // ================= 7. 启动监听 =================
    let timer = null;
    function lazyRun() { if (timer) clearTimeout(timer); timer = setTimeout(processPage, 500); }
    processPage();
    const observer = new MutationObserver(lazyRun);
    observer.observe(document.body, { childList: true, subtree: true });

})();