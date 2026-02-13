// ==UserScript==
// @name         番号跳转加预览图
// @namespace    https://github.com/ZiPenOk
// @version      1.0.2
// @description  给sukebei 169bbs添加番号跳转到javbus javdb 按钮,以及预览图功能
// @author       ZiPenOk
// @match        https://*.nyaa.si/*
// @match        *://169bbs.com/*
// @match        *://*169bbs*.*/*
// @grant        GM_xmlhttpRequest
// @connect      *
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/jav_jump.js
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/jav_jump.js

// ==/UserScript==

(function () {
'use strict';

/* =============================
   工具
============================= */

function extractCode(text) {
    if (!text) return null;
    const m = text.match(/\b([A-Z0-9]{2,6}-\d{3,7})\b/i);
    return m ? m[1].toUpperCase() : null;
}

function createBtn(text, color, handler) {
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
}

/* =============================
   预览图
============================= */

const request = (url) => new Promise((res) =>
    GM_xmlhttpRequest({
        method:'GET',
        url,
        timeout:30000,
        onload:(r)=>res(r.responseText)
    })
);

async function getThumbnail(code) {

    const cacheKey = `thumb_cache_${code}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
        const html = await request(`https://javfree.me/search/${code}`);
        const doc = new DOMParser().parseFromString(html,'text/html');
        const link = doc.querySelector('.entry-title>a')?.href;
        if (!link) return null;

        const dHtml = await request(link);
        const dDoc = new DOMParser().parseFromString(dHtml,'text/html');

        const url =
            dDoc.querySelectorAll('p>img')[1]?.src ||
            dDoc.querySelectorAll('p>img')[0]?.src;

        if (url) {
            sessionStorage.setItem(cacheKey, url);
            return url;
        }

        return null;

    } catch {
        return null;
    }
}

function showOverlay(imgUrl) {

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

/* =============================
   Sukebei 页面增强
============================= */

function enhanceSukebeiPage(){

    if(!location.pathname.includes('/view/')) return;

    const title = document.querySelector('.panel-title');
    if(!title) return;

    if (title.dataset.enhanced) return;
    title.dataset.enhanced = "1";

    const code = extractCode(title.textContent);
    if(!code) return;

    title.appendChild(createBtn('🔍 Nyaa','#17a2b8',
        ()=>window.open(`https://sukebei.nyaa.si/?f=0&c=0_0&q=${code}`)));

    title.appendChild(createBtn('🎬 JavBus','#007bff',
        ()=>window.open(`https://www.javbus.com/search/${code}`)));

    title.appendChild(createBtn('📀 JavDB','#6f42c1',
        ()=>window.open(`https://javdb.com/search?q=${code}`)));

    title.appendChild(createBtn('🖼️ 预览图','#28a745',
        async ()=>{
            const url = await getThumbnail(code);
            if(url) showOverlay(url);
        }));
}

/* =============================
   169bbs Discuz 适配
============================= */

function enhance169bbsPage(){

    if (!location.href.includes('mod=viewthread')) return;

    const title =
        document.querySelector('#thread_subject') ||
        document.querySelector('h1');

    if (!title) return;

    if (title.dataset.enhanced) return;
    title.dataset.enhanced = "1";

    const code = extractCode(title.textContent);
    if (!code) return;

    title.appendChild(createBtn('🔍 Nyaa','#17a2b8',
        ()=>window.open(`https://sukebei.nyaa.si/?f=0&c=0_0&q=${code}`)));

    title.appendChild(createBtn('🎬 JavBus','#007bff',
        ()=>window.open(`https://www.javbus.com/search/${code}`)));

    title.appendChild(createBtn('📀 JavDB','#6f42c1',
        ()=>window.open(`https://javdb.com/search?q=${code}`)));

    title.appendChild(createBtn('🖼️ 预览图','#28a745',
        async ()=>{
            const url = await getThumbnail(code);
            if(url) showOverlay(url);
        }));
}

/* =============================
   启动
============================= */

enhanceSukebeiPage();
enhance169bbsPage();

})();
