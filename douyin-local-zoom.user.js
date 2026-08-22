// ==UserScript==
// @name         抖音视频局部放大
// @namespace    https://github.com/ZiPenOk/scripts
// @version      1.0.0
// @description  抖音网页版视频局部放大、缩小、八方向导航移动、按住导航连续微调、当前视频自动切换、可拖动记忆导航面板
// @author       ZiPenOk
// @icon         https://www.douyin.com/favicon.ico
// @match        *://douyin.com/*
// @match        *://*.douyin.com/*
// @match        *://iesdouyin.com/*
// @match        *://*.iesdouyin.com/*
// @run-at       document-idle
// @grant        none
// @license      GPL-3.0
// @homepageURL  https://github.com/ZiPenOk/scripts
// @supportURL   https://github.com/ZiPenOk/scripts/issues
// @downloadURL  https://github.com/ZiPenOk/scripts/raw/refs/heads/main/douyin-local-zoom.user.js
// @updateURL    https://github.com/ZiPenOk/scripts/raw/refs/heads/main/douyin-local-zoom.user.js
// ==/UserScript==

(function () {
  "use strict";

  if (window.__dyLocalZoomCleanup) {
    window.__dyLocalZoomCleanup();
  }

  const STYLE_ID = "__dy-local-zoom-style";
  const TOGGLE_CLASS = "dy-local-toggle";
  const PANEL_CLASS = "dy-local-panel";
  const POSITION_KEY = "dy-local-panel-position";

  document.querySelectorAll("." + TOGGLE_CLASS + ",." + PANEL_CLASS).forEach((node) => node.remove());
  document.getElementById(STYLE_ID)?.remove();

  const clickStep = 30;
  const repeatStep = 5;
  const zoomClickStep = 0.1;
  const zoomRepeatStep = 0.02;
  const repeatMs = 40;
  const idleDelay = 1200;
  const idleOpacity = "0.28";

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    video[data-dy-local-zoom="1"] {
      transform: translate3d(var(--dy-x, 0px), var(--dy-y, 0px), 0)
        scale(var(--dy-scale, 1)) !important;
      transform-origin: center center !important;
      filter: none !important;
      will-change: transform;
    }

    .${TOGGLE_CLASS} {
      box-sizing: border-box !important;
      width: 44px !important;
      height: 44px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 44px !important;
      margin: 0 4px 0 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 50% !important;
      color: #fff !important;
      background: rgba(0, 0, 0, .34) !important;
      font-size: 22px !important;
      line-height: 1 !important;
      cursor: pointer !important;
      z-index: 999999 !important;
    }

    .${TOGGLE_CLASS}:hover {
      background: rgba(15, 139, 255, .88) !important;
    }

    .${PANEL_CLASS} {
      position: fixed !important;
      right: 8px !important;
      bottom: 8px !important;
      z-index: 2147483647 !important;
      display: none;
      flex-direction: column;
      align-items: stretch;
      box-sizing: border-box !important;
      width: max-content !important;
      height: max-content !important;
      min-width: 0 !important;
      max-width: calc(100vw - 16px) !important;
      padding: 6px !important;
      overflow: visible !important;
      border-radius: 8px !important;
      background: rgba(20, 20, 20, .86) !important;
      user-select: none;
      transition: opacity .2s ease;
    }

    .${PANEL_CLASS} .dy-panel-header {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      width: 100%;
      height: 21px;
      min-height: 21px;
      margin: 0 0 4px;
      padding: 0;
      gap: 4px;
    }

    .${PANEL_CLASS} .dy-panel-drag-handle {
      box-sizing: border-box;
      flex: 1 1 auto;
      width: auto;
      height: 21px;
      min-height: 21px;
      margin: 0;
      padding: 0;
      border-radius: 4px;
      color: rgba(255, 255, 255, .65);
      background: rgba(255, 255, 255, .08);
      font: 12px/21px sans-serif;
      text-align: center;
      cursor: move;
      user-select: none;
    }

    .${PANEL_CLASS} .dy-panel-minimize {
      box-sizing: border-box;
      flex: 0 0 21px;
      width: 21px;
      height: 21px;
      min-width: 21px;
      min-height: 21px;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 6px;
      color: #fff;
      background: #333;
      font: 16px/21px sans-serif;
      text-align: center;
      cursor: pointer;
      user-select: none;
    }

    .${PANEL_CLASS} .dy-panel-minimize:hover {
      background: #666;
    }

    .${PANEL_CLASS} .zoom-row,
    .${PANEL_CLASS} .direction-grid {
      display: grid;
      grid-template-columns: repeat(3, 36px);
      gap: 4px;
    }

    .${PANEL_CLASS} .zoom-row {
      margin-bottom: 4px;
    }

    .${PANEL_CLASS} button {
      box-sizing: border-box;
      width: 36px;
      height: 33px;
      padding: 0;
      border: 0;
      border-radius: 5px;
      color: #fff;
      background: #333;
      font: 18px/33px sans-serif;
      text-align: center;
      cursor: pointer;
    }

    .${PANEL_CLASS} button:hover {
      background: #666;
    }

    .${PANEL_CLASS}.dy-panel-minimized .zoom-row,
    .${PANEL_CLASS}.dy-panel-minimized .direction-grid {
      display: none;
    }
  `;
  document.head.appendChild(style);

  let activeVideo = null;
  let repeatTimer = null;
  let activeButton = null;
  let mountTimer = null;
  let switchTimer = null;
  let idleTimer = null;
  let dragMoveHandler = null;
  let dragUpHandler = null;
  let resizeHandler = null;
  let viewportResizeHandler = null;

  function isVisible(video) {
    const rect = video.getBoundingClientRect();
    return rect.width > 100 && rect.height > 100 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight;
  }

  function getCurrentVideo() {
    const videos = Array.from(document.querySelectorAll("video")).filter(isVisible);
    videos.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const ac = Math.abs(ar.top + ar.height / 2 - window.innerHeight / 2);
      const bc = Math.abs(br.top + br.height / 2 - window.innerHeight / 2);
      const as = (a.paused ? 0 : 100000) - ac + ar.width * ar.height / 1000;
      const bs = (b.paused ? 0 : 100000) - bc + br.width * br.height / 1000;
      return bs - as;
    });
    return videos[0] || null;
  }

  function resetVideo(video) {
    if (!video) return;
    video.removeAttribute("data-dy-local-zoom");
    video.style.setProperty("--dy-scale", "1");
    video.style.setProperty("--dy-x", "0px");
    video.style.setProperty("--dy-y", "0px");
  }

  function activateVideo(video) {
    if (!video) return null;

    document.querySelectorAll('video[data-dy-local-zoom="1"]').forEach((item) => {
      if (item !== video) resetVideo(item);
    });

    if (!video.hasAttribute("data-dy-local-zoom")) {
      video.setAttribute("data-dy-local-zoom", "1");
      video.style.setProperty("--dy-scale", "1");
      video.style.setProperty("--dy-x", "0px");
      video.style.setProperty("--dy-y", "0px");
      if (video.parentElement) {
        video.parentElement.style.overflow = "hidden";
        video.parentElement.style.contain = "paint";
      }
    }

    activeVideo = video;
    return video;
  }

  function getPlayer(video) {
    return video && (video.closest(".xgplayer") || video.closest(".basePlayerContainer") || video.parentElement);
  }

  function getRightGrid(video) {
    const player = getPlayer(video);
    if (!player) return document.querySelector("xg-right-grid");
    return player.querySelector("xg-right-grid") || player.querySelector(".xg-right-grid");
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = TOGGLE_CLASS;
  toggle.innerHTML = "&#9673;";
  toggle.title = "局部放大";

  const panel = document.createElement("div");
  panel.className = PANEL_CLASS;
  panel.innerHTML =
    '<div class="dy-panel-header">' +
    '<div class="dy-panel-drag-handle">:::</div>' +
    '<span class="dy-panel-minimize" title="收起">-</span>' +
    '</div>' +
    '<div class="zoom-row">' +
    '<button data-action="zoom-out">-</button>' +
    '<button data-action="reset-scale">1x</button>' +
    '<button data-action="zoom-in">+</button>' +
    '</div>' +
    '<div class="direction-grid">' +
    '<button data-dx="-1" data-dy="-1">&#8598;</button>' +
    '<button data-dx="0" data-dy="-1">&#8593;</button>' +
    '<button data-dx="1" data-dy="-1">&#8599;</button>' +
    '<button data-dx="-1" data-dy="0">&#8592;</button>' +
    '<button data-action="reset-pan">&#10227;</button>' +
    '<button data-dx="1" data-dy="0">&#8594;</button>' +
    '<button data-dx="-1" data-dy="1">&#8601;</button>' +
    '<button data-dx="0" data-dy="1">&#8595;</button>' +
    '<button data-dx="1" data-dy="1">&#8600;</button>' +
    '</div>';

  document.body.append(toggle, panel);

  function getClipNestButton(grid) {
    return grid && grid.querySelector(".clipnest-player-push-btn");
  }

  function mountToggle() {
    const grid = getRightGrid(getCurrentVideo());
    if (!grid) return;

    const clipNestButton = getClipNestButton(grid);
    if (clipNestButton) {
      if (toggle !== clipNestButton.previousElementSibling) grid.insertBefore(toggle, clipNestButton);
    } else if (toggle !== grid.firstElementChild) {
      grid.insertBefore(toggle, grid.firstElementChild);
    }
  }

  function savePosition(left, top) {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ left, top }));
    } catch (_) {}
  }

  function fitPanel() {
    if (getComputedStyle(panel).display === "none") return;
    const rect = panel.getBoundingClientRect();
    const width = panel.offsetWidth || rect.width;
    const height = panel.offsetHeight || rect.height;
    let left = parseFloat(panel.style.left);
    let top = parseFloat(panel.style.top);
    if (Number.isNaN(left)) left = rect.left;
    if (Number.isNaN(top)) top = rect.top;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    left = Math.max(8, Math.min(maxLeft, left));
    top = Math.max(8, Math.min(maxTop, top));
    panel.style.left = left + "px";
    panel.style.top = top + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    savePosition(left, top);
  }

  function loadPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || "null");
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        panel.style.left = saved.left + "px";
        panel.style.top = saved.top + "px";
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      }
    } catch (_) {}
  }

  function clearIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
    panel.style.opacity = "1";
  }

  function scheduleIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { panel.style.opacity = idleOpacity; }, idleDelay);
  }

  function togglePanel(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!getCurrentVideo()) return;
    panel.style.display = panel.style.display === "flex" ? "none" : "flex";
    if (panel.style.display === "flex") {
      clearIdle();
      requestAnimationFrame(fitPanel);
    }
  }

  function toggleMinimize(event) {
    event.preventDefault();
    event.stopPropagation();
    const minimized = !panel.classList.contains("dy-panel-minimized");
    panel.classList.toggle("dy-panel-minimized", minimized);
    event.currentTarget.textContent = minimized ? "+" : "-";
    requestAnimationFrame(fitPanel);
  }

  function changeButton(button, repeating) {
    const video = activateVideo(getCurrentVideo());
    if (!video) return;

    const action = button.getAttribute("data-action");
    if (action === "zoom-in" || action === "zoom-out") {
      let scale = parseFloat(video.style.getPropertyValue("--dy-scale")) || 1;
      let amount = repeating ? zoomRepeatStep : zoomClickStep;
      if (action === "zoom-out") amount = -amount;
      video.style.setProperty("--dy-scale", Math.max(1, Math.min(5, scale + amount)));
      return;
    }

    if (action === "reset-scale") {
      video.style.setProperty("--dy-scale", "1");
      return;
    }

    if (action === "reset-pan") {
      video.style.setProperty("--dy-x", "0px");
      video.style.setProperty("--dy-y", "0px");
      return;
    }

    const dx = Number(button.getAttribute("data-dx"));
    const dy = Number(button.getAttribute("data-dy"));
    const amount = repeating ? repeatStep : clickStep;
    const x = parseFloat(video.style.getPropertyValue("--dy-x")) || 0;
    const y = parseFloat(video.style.getPropertyValue("--dy-y")) || 0;
    video.style.setProperty("--dy-x", x + dx * amount + "px");
    video.style.setProperty("--dy-y", y + dy * amount + "px");
  }

  function stopRepeat() {
    if (repeatTimer) clearInterval(repeatTimer);
    repeatTimer = null;
    activeButton = null;
  }

  function startRepeat(event) {
    const button = event.target.closest("button");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    stopRepeat();
    activeButton = button;
    const action = button.getAttribute("data-action");
    changeButton(button, false);
    if (action !== "reset-scale" && action !== "reset-pan") {
      repeatTimer = setInterval(() => {
        if (activeButton) changeButton(activeButton, true);
      }, repeatMs);
    }
    if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
  }

  function startDrag(event) {
    if (event.target.closest("button") || event.target.closest(".dy-panel-minimize")) return;
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;
    dragMoveHandler = (moveEvent) => {
      const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
      const left = Math.max(8, Math.min(maxLeft, startLeft + moveEvent.clientX - startX));
      const top = Math.max(8, Math.min(maxTop, startTop + moveEvent.clientY - startY));
      panel.style.left = left + "px";
      panel.style.top = top + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    };
    dragUpHandler = () => {
      window.removeEventListener("pointermove", dragMoveHandler, true);
      window.removeEventListener("pointerup", dragUpHandler, true);
      savePosition(panel.getBoundingClientRect().left, panel.getBoundingClientRect().top);
      dragMoveHandler = null;
      dragUpHandler = null;
    };
    window.addEventListener("pointermove", dragMoveHandler, true);
    window.addEventListener("pointerup", dragUpHandler, true);
  }

  function checkVideoSwitch() {
    const current = getCurrentVideo();
    if (current === activeVideo) return;
    resetVideo(activeVideo);
    stopRepeat();
    panel.style.display = "none";
    panel.style.opacity = "1";
    activeVideo = current;
  }

  toggle.addEventListener("click", togglePanel, true);
  panel.querySelector(".dy-panel-minimize").addEventListener("click", toggleMinimize, true);
  panel.querySelector(".dy-panel-drag-handle").addEventListener("pointerdown", startDrag, true);
  panel.addEventListener("pointerdown", startRepeat, true);
  panel.addEventListener("pointerup", stopRepeat, true);
  panel.addEventListener("pointercancel", stopRepeat, true);
  panel.addEventListener("lostpointercapture", stopRepeat, true);
  panel.addEventListener("mouseenter", clearIdle, true);
  panel.addEventListener("mouseleave", scheduleIdle, true);

  loadPosition();
  mountToggle();
  fitPanel();

  mountTimer = setInterval(mountToggle, 500);
  switchTimer = setInterval(checkVideoSwitch, 150);
  resizeHandler = fitPanel;
  window.addEventListener("resize", resizeHandler, true);
  if (window.visualViewport) {
    viewportResizeHandler = fitPanel;
    window.visualViewport.addEventListener("resize", viewportResizeHandler, true);
  }

  window.__dyLocalZoomCleanup = function () {
    stopRepeat();
    if (mountTimer) clearInterval(mountTimer);
    if (switchTimer) clearInterval(switchTimer);
    if (idleTimer) clearTimeout(idleTimer);
    if (dragMoveHandler) window.removeEventListener("pointermove", dragMoveHandler, true);
    if (dragUpHandler) window.removeEventListener("pointerup", dragUpHandler, true);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler, true);
    if (window.visualViewport && viewportResizeHandler) {
      window.visualViewport.removeEventListener("resize", viewportResizeHandler, true);
    }
    document.querySelectorAll('video[data-dy-local-zoom="1"]').forEach(resetVideo);
    toggle.remove();
    panel.remove();
    style.remove();
    delete window.__dyLocalZoomCleanup;
  };
})();
