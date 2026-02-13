// ==UserScript==
// @name         磁力&电驴链接助手
// @namespace    https://github.com/ZiPenOk
// @version      2.4
// @description  点击按钮显示绿色勾，同组按钮点击时互斥切换。
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

    // 各种图标定义
    const ICONS = {
        copy: `<svg viewBox="0 0 24 24" width="15" height="15" fill="#666"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
        qb: `<svg viewBox="0 0 24 24" width="15" height="15" fill="#0078d4"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
        u115: `<svg viewBox="0 0 24 24" width="17" height="17"><circle cx="12" cy="12" r="11" fill="#2777F8"/><text x="12" y="17" font-family="Arial" font-size="12" font-weight="900" fill="white" text-anchor="middle">5</text></svg>`,
        // 绿色的 √ 图标
        check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#28a745"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
    };

    // ================= 2. 注入 CSS =================
    const style = document.createElement('style');
    style.innerHTML = `
        .mag-btn-group {
            display: inline-flex !important;
            vertical-align: middle !important;
            margin-left: 8px !important;
            gap: 4px !important;
            background: #f1f3f5 !important;
            padding: 3px 4px !important;
            border-radius: 5px !important;
            border: 1px solid #e0e4e8 !important;
        }
        .mag-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 26px !important;
            height: 22px !important;
            background: #fff !important;
            border: 1px solid #d1d5da !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
        }
        .mag-btn:hover {
            background: #f8f9fa !important;
            border-color: #0078d4 !important;
        }
        /* 选中状态的边框颜色微调 */
        .mag-btn.active {
            border-color: #28a745 !important;
            background: #f0fff4 !important;
        }
    `;
    document.head.appendChild(style);

    // ================= 3. 核心功能 =================
    function showToast(msg, success = true) {
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:50px;right:30px;background:${success?'#28a745':'#dc3545'};color:white;padding:10px 20px;border-radius:8px;z-index:100000;font-size:14px;`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // 更新按钮状态逻辑
    function setBtnActive(clickedBtn, group) {
        // 1. 恢复同组所有按钮的原始图标
        group.querySelectorAll('.mag-btn').forEach(btn => {
            btn.innerHTML = btn.dataset.origIcon;
            btn.classList.remove('active');
        });
        // 2. 设置当前按钮为勾选图标
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
            btn.dataset.origIcon = icon; // 保存原始图标
            btn.onclick = () => {
                setBtnActive(btn, group); // 切换图标显示
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

    // 其他网络请求函数 (pushToQb, pushTo115) 与之前一致，此处略去以节省篇幅
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

    // ================= 4. 扫描与启动逻辑 (保留之前的防循环修复) =================
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

    // ================= 5. 设置界面 (省略，与原版一致) =================
    // ... 设置界面代码 ...
    function showSettingsModal() {
        const mask = document.createElement('div');
        mask.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;font-family:sans-serif;';
        const modal = document.createElement('div');
        modal.style.cssText = 'background:white;padding:25px;border-radius:12px;width:350px;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
        modal.innerHTML = `
            <h3 style="margin:0 0 20px 0;text-align:center;color:#333;">脚本综合设置</h3>
            <div style="margin-bottom:15px;">
                <label style="display:flex;align-items:center;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="sw_copy" ${config.enableCopy?'checked':''}> <span style="margin-left:8px;">显示复制按钮</span></label>
                <label style="display:flex;align-items:center;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="sw_qb" ${config.enableQb?'checked':''}> <span style="margin-left:8px;">显示 qB 推送按钮</span></label>
                <label style="display:flex;align-items:center;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="sw_115" ${config.enable115?'checked':''}> <span style="margin-left:8px;">显示 115 离线按钮</span></label>
            </div>
            <div id="qb_configs" style="display:${config.enableQb?'block':'none'};border-top:1px solid #eee;padding-top:15px;margin-bottom:15px;">
                <input id="in_host" type="text" placeholder="qB 地址" value="${config.qbtHost}" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;">
                <div style="display:flex;gap:5px;">
                    <input id="in_user" type="text" placeholder="账号" value="${config.qbtUser}" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;width:10px;">
                    <input id="in_pass" type="password" placeholder="密码" value="${config.qbtPass}" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;width:10px;">
                </div>
            </div>
            <div id="u115_configs" style="display:${config.enable115?'block':'none'};border-top:1px solid #eee;padding-top:15px;margin-bottom:15px;">
                <input id="in_uid" type="text" placeholder="115 UID" value="${config.u115Uid}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;">
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;">
                <button id="btn_cancel" style="padding:8px 15px;border:1px solid #ccc;background:#eee;border-radius:4px;cursor:pointer;">取消</button>
                <button id="btn_save" style="padding:8px 15px;border:none;background:#0078d4;color:white;border-radius:4px;cursor:pointer;">保存设置</button>
            </div>
        `;
        mask.appendChild(modal);
        document.body.appendChild(mask);
        document.getElementById('sw_qb').onchange = (e) => document.getElementById('qb_configs').style.display = e.target.checked ? 'block' : 'none';
        document.getElementById('sw_115').onchange = (e) => document.getElementById('u115_configs').style.display = e.target.checked ? 'block' : 'none';
        document.getElementById('btn_cancel').onclick = () => mask.remove();
        document.getElementById('btn_save').onclick = () => {
            GM_setValue('enableCopy', document.getElementById('sw_copy').checked);
            GM_setValue('enableQb', document.getElementById('sw_qb').checked);
            GM_setValue('enable115', document.getElementById('sw_115').checked);
            GM_setValue('qbtHost', document.getElementById('in_host').value.trim());
            GM_setValue('qbtUser', document.getElementById('in_user').value.trim());
            GM_setValue('qbtPass', document.getElementById('in_pass').value.trim());
            GM_setValue('u115Uid', document.getElementById('in_uid').value.trim());
            mask.remove();
            showToast('✅ 设置已保存，刷新页面生效');
            setTimeout(() => location.reload(), 1000);
        };
    }

    // ================= 6. 启动 =================
    let timer = null;
    function lazyRun() { if (timer) clearTimeout(timer); timer = setTimeout(processPage, 500); }
    processPage();
    const observer = new MutationObserver(lazyRun);
    observer.observe(document.body, { childList: true, subtree: true });

})();