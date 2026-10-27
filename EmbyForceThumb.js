// ==UserScript==
// @name         Emby 媒体库显示模式管理器
// @namespace    https://github.com/ZiPenOk/scripts
// @version      2.3.1
// @description  为 Emby Web 指定媒体库设置默认显示模式和默认排序，支持锁定、会话临时切换和完全跟随 Emby 原设置，并提供前台设置面板管理媒体库 ID。
// @author       ZiPenOk
// @license      MIT
// @icon         https://emby.media/favicon.ico
// @include      /^http:\/\/10\.10\.10\.[^/]+:8096\/web\/.*/
// @include      /^http:\/\/10\.10\.10\.[^/]+:8097\/web\/.*/
// @include      /^http:\/\/10\.10\.10\.[^/]+:8016\/web\/.*/
// @include      /^http:\/\/10\.10\.10\.[^/]+:8017\/web\/.*/
// @include      /^https:\/\/emby\.[^/]+\/web\/.*/
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @homepageURL  https://github.com/ZiPenOk/scripts
// @supportURL   https://github.com/ZiPenOk/scripts/issues
// @downloadURL  https://github.com/ZiPenOk/scripts/raw/refs/heads/main/EmbyForceThumb.js
// @updateURL    https://github.com/ZiPenOk/scripts/raw/refs/heads/main/EmbyForceThumb.js
// ==/UserScript==

(function () {
  'use strict';

  var TAG = '[EmbyViewMode]';
  var CONFIG_KEY = 'EmbyViewModeConfigV2';
  var SESSION_KEY = 'EmbyViewModeSessionPrefsV2';
  var LEGACY_SESSION_KEY = 'EmbyForceThumbTempPrefs';
  var PANEL_ID = 'emby-view-mode-panel';
  var PAGE = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;

  var MODE_OPTIONS = [
    { id: 'primary', classic: 'Poster', label: '海报', note: '竖向封面' },
    { id: 'banner', classic: 'Banner', label: '横幅图', note: '宽横幅' },
    { id: 'disc', classic: 'Poster', label: '光盘封面', note: '方形光盘图' },
    { id: 'logo', classic: 'Thumb', label: '徽标', note: 'Logo/标题图' },
    { id: 'thumb', classic: 'Thumb', label: '缩略图', note: '横向剧照' },
    { id: 'list', classic: 'List', label: '列表', note: '文本列表' },
    { id: 'table', classic: 'List', label: '表格', note: '按列表兼容' }
  ];

  var POLICY_OPTIONS = [
    { id: 'locked', label: '锁定', note: '不可更改' },
    { id: 'session', label: '临时', note: '重启恢复' },
    { id: 'free', label: '解锁', note: '自由保存' }
  ];

  var SORT_OPTIONS = [
    { id: 'none', value: '', order: '', label: '不指定', note: '跟随 Emby' },
    { id: 'dateAdded', value: 'DateCreated,SortName', order: 'Descending', label: '加入日期', note: '新的在前' },
    { id: 'releaseDate', value: 'ProductionYear,PremiereDate,SortName', order: 'Descending', label: '发行日期', note: '新的在前' }
  ];

  var config = loadConfig();
  var sessionPrefs = loadSessionPrefs();
  var refreshTimer;
  var patchedUserSettings;

  function log() {
    console.log.apply(console, [TAG].concat([].slice.call(arguments)));
  }

  function cloneDefaultLibraries() {
    return [
      { id: '565027', name: 'wm', mode: 'thumb', sort: 'none', policy: 'session', enabled: true },
      { id: '565031', name: 'gc', mode: 'thumb', sort: 'none', policy: 'session', enabled: true },
      { id: '565033', name: 'om', mode: 'thumb', sort: 'none', policy: 'session', enabled: true }
    ];
  }

  function getDefaultConfig() {
    return {
      version: 2,
      libraries: cloneDefaultLibraries()
    };
  }

  function normalizeConfig(value) {
    var defaults = getDefaultConfig();
    var next = value && typeof value === 'object' ? value : defaults;

    if (!Array.isArray(next.libraries)) {
      next.libraries = defaults.libraries;
    }

    next.version = 2;
    next.libraries = next.libraries.map(function (library) {
      return normalizeLibrary(library);
    }).filter(function (library) {
      return library.id;
    });

    return next;
  }

  function normalizeLibrary(library) {
    library = library || {};

    return {
      id: String(library.id || '').trim(),
      name: String(library.name || '').trim(),
      mode: getModeOption(library.mode) ? library.mode : 'thumb',
      sort: getSortOption(library.sort) ? library.sort : 'none',
      policy: getPolicyOption(library.policy) ? library.policy : 'session',
      enabled: library.enabled !== false
    };
  }

  function loadConfig() {
    try {
      if (typeof GM_getValue === 'function') {
        var gmSaved = GM_getValue(CONFIG_KEY, null);
        if (gmSaved) return normalizeConfig(typeof gmSaved === 'string' ? JSON.parse(gmSaved) : gmSaved);
      }
    } catch (e) {}

    try {
      var saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        var migrated = normalizeConfig(JSON.parse(saved));
        saveConfigValue(migrated);
        log('migrated config from localStorage to userscript storage');
        return migrated;
      }
    } catch (e) {}

    return getDefaultConfig();
  }

  function saveConfig() {
    saveConfigValue(config);
  }

  function saveConfigValue(value) {
    try {
      if (typeof GM_setValue === 'function') {
        GM_setValue(CONFIG_KEY, JSON.stringify(value));
        return;
      }
    } catch (e) {}

    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(value));
    } catch (e) {}
  }

  function loadSessionPrefs() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || sessionStorage.getItem(LEGACY_SESSION_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveSessionPrefs() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPrefs));
    } catch (e) {}
  }

  function getModeOption(id) {
    for (var i = 0; i < MODE_OPTIONS.length; i++) {
      if (MODE_OPTIONS[i].id === id) return MODE_OPTIONS[i];
    }
    return null;
  }

  function getPolicyOption(id) {
    for (var i = 0; i < POLICY_OPTIONS.length; i++) {
      if (POLICY_OPTIONS[i].id === id) return POLICY_OPTIONS[i];
    }
    return null;
  }

  function getSortOption(id) {
    for (var i = 0; i < SORT_OPTIONS.length; i++) {
      if (SORT_OPTIONS[i].id === id) return SORT_OPTIONS[i];
    }
    return null;
  }

  function getHashParams() {
    var query = (location.hash.split('?')[1] || '');
    return new URLSearchParams(query);
  }

  function getCurrentParentId() {
    var params = getHashParams();
    return params.get('parentId') || params.get('topParentId') || '';
  }

  function getCurrentLibraryRule() {
    var parentId = getCurrentParentId();
    if (!parentId) return null;

    for (var i = 0; i < config.libraries.length; i++) {
      var library = config.libraries[i];
      if (library.enabled && library.id === parentId) return library;
    }

    return null;
  }

  function isImageTypeKey(key) {
    return typeof key === 'string' && /-imageType$/.test(key);
  }

  function isClassicViewKey(key) {
    return typeof key === 'string' && (/-_view$/.test(key) || /-view$/.test(key));
  }

  function isSortByKey(key) {
    return typeof key === 'string' && /-sortby$/.test(key);
  }

  function isSortOrderKey(key) {
    return typeof key === 'string' && /-sortorder$/.test(key);
  }

  function isSortKey(key) {
    return isSortByKey(key) || isSortOrderKey(key);
  }

  function isControlledKey(key) {
    return isImageTypeKey(key) || isClassicViewKey(key) || isSortKey(key);
  }

  function scopedKey(parentId, key) {
    return parentId + '::' + key;
  }

  function valueForKey(rule, key) {
    var mode = getModeOption(rule.mode) || getModeOption('thumb');
    if (isImageTypeKey(key)) return mode.id === 'table' ? 'list' : mode.id;
    if (isClassicViewKey(key)) return mode.classic;
    if (isSortByKey(key)) return (getSortOption(rule.sort) || getSortOption('none')).value;
    if (isSortOrderKey(key)) return (getSortOption(rule.sort) || getSortOption('none')).order;
    return null;
  }

  function shouldControlKey(rule, key) {
    if (!rule || rule.policy === 'free') return false;
    if (isSortKey(key)) return rule.sort !== 'none';
    return isImageTypeKey(key) || isClassicViewKey(key);
  }

  function patchUserSettings(userSettings) {
    if (!userSettings || userSettings.__embyViewModePatched) return;
    userSettings.__embyViewModePatched = true;
    patchedUserSettings = userSettings;

    var oldGet = userSettings.get.bind(userSettings);
    var oldSet = userSettings.set.bind(userSettings);

    userSettings.get = function (key, enableOnServer) {
      var rule = getCurrentLibraryRule();
      if (!shouldControlKey(rule, key)) {
        return oldGet(key, enableOnServer);
      }

      if (rule.policy === 'session') {
        var sessionKey = scopedKey(rule.id, key);
        if (Object.prototype.hasOwnProperty.call(sessionPrefs, sessionKey)) {
          return sessionPrefs[sessionKey];
        }
      }

      return valueForKey(rule, key);
    };

    userSettings.set = function (key, value, enableOnServer) {
      var rule = getCurrentLibraryRule();
      if (!shouldControlKey(rule, key)) {
        return oldSet(key, value, enableOnServer);
      }

      if (rule.policy === 'locked') {
        log('locked:', rule.id, key, '=>', valueForKey(rule, key));
        scheduleRefresh(true);
        return valueForKey(rule, key);
      }

      sessionPrefs[scopedKey(rule.id, key)] = value == null ? valueForKey(rule, key) : value.toString();
      saveSessionPrefs();
      log('session only:', rule.id, key, '=>', sessionPrefs[scopedKey(rule.id, key)]);
      scheduleRefresh(true);
      return value;
    };

    log('patched userSettings');
    scheduleRefresh();
  }

  function patchLibraryBrowser(libraryBrowser) {
    if (!libraryBrowser || libraryBrowser.__embyViewModePatched) return;
    libraryBrowser.__embyViewModePatched = true;

    var oldGetSavedView = libraryBrowser.getSavedView ? libraryBrowser.getSavedView.bind(libraryBrowser) : null;
    var oldSaveViewSetting = libraryBrowser.saveViewSetting ? libraryBrowser.saveViewSetting.bind(libraryBrowser) : null;

    libraryBrowser.getSavedView = function (key) {
      var rule = getCurrentLibraryRule();
      if (!rule || rule.policy === 'free') return oldGetSavedView ? oldGetSavedView(key) : null;

      var classicKey = key ? key + '-_view' : '';
      if (rule.policy === 'session' && Object.prototype.hasOwnProperty.call(sessionPrefs, scopedKey(rule.id, classicKey))) {
        return sessionPrefs[scopedKey(rule.id, classicKey)];
      }

      return valueForKey(rule, classicKey);
    };

    libraryBrowser.saveViewSetting = function (key, value) {
      var rule = getCurrentLibraryRule();
      if (!rule || rule.policy === 'free') {
        return oldSaveViewSetting ? oldSaveViewSetting(key, value) : undefined;
      }

      var classicKey = key ? key + '-_view' : '';
      if (rule.policy === 'locked') {
        scheduleRefresh(true);
        return valueForKey(rule, classicKey);
      }

      sessionPrefs[scopedKey(rule.id, classicKey)] = value == null ? valueForKey(rule, classicKey) : value.toString();
      saveSessionPrefs();
      scheduleRefresh(true);
      return value;
    };

    log('patched libraryBrowser');
  }

  function patch() {
    var req = PAGE.require || PAGE.requirejs;
    if (!req) return;

    try {
      req(['userSettings'], patchUserSettings);
      if (PAGE.LibraryBrowser) {
        patchLibraryBrowser(PAGE.LibraryBrowser);
      }
    } catch (e) {
      log('patch failed', e);
    }
  }

  function scheduleRefresh(force) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      refreshCurrentPage(!!force);
    }, 300);
  }

  function refreshCurrentPage(force) {
    var rule = getCurrentLibraryRule();
    if (!rule || rule.policy === 'free') return;

    var changed = false;

    document.querySelectorAll('.itemsContainer').forEach(function (container) {
      if (rule.mode === 'list' || rule.mode === 'table') {
        if (!container.classList.contains('vertical-list') || container.classList.contains('vertical-wrap')) {
          changed = true;
        }
        container.classList.add('vertical-list');
        container.classList.remove('vertical-wrap');
      } else {
        if (container.classList.contains('vertical-list') || !container.classList.contains('vertical-wrap')) {
          changed = true;
        }
        container.classList.remove('vertical-list');
        container.classList.add('vertical-wrap');
      }

      if (force && typeof container.refreshItems === 'function') {
        try {
          container.refreshItems();
        } catch (e) {}
      }
    });

    if (!changed && !force) return;

    document.querySelectorAll('.btnSelectView,.btnChangeLayout').forEach(function (button) {
      button.dispatchEvent(new PAGE.CustomEvent('layoutchange', {
        bubbles: true,
        detail: { viewStyle: valueForKey(rule, 'current-_view') }
      }));
    });

    log(force ? 'refresh requested' : 'layout applied', rule.id, rule.mode, rule.policy, location.href);
  }

  function injectStyles() {
    if (document.getElementById('emby-view-mode-style')) return;

    var style = document.createElement('style');
    style.id = 'emby-view-mode-style';
    style.textContent = [
      '#' + PANEL_ID + '{position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.46);display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '#' + PANEL_ID + ' .evm-dialog{width:min(1080px,96vw);max-height:86vh;overflow:auto;background:#202020;color:#eee;border-radius:8px;box-shadow:0 18px 70px rgba(0,0,0,.55);}',
      '#' + PANEL_ID + ' .evm-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.12);}',
      '#' + PANEL_ID + ' h2{margin:0;font-size:20px;font-weight:650;}',
      '#' + PANEL_ID + ' .evm-body{padding:18px 20px 20px;}',
      '#' + PANEL_ID + ' .evm-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;}',
      '#' + PANEL_ID + ' .evm-list{display:grid;gap:10px;}',
      '#' + PANEL_ID + ' .evm-row{display:grid;grid-template-columns:28px minmax(92px,.7fr) minmax(78px,.58fr) minmax(124px,.9fr) minmax(132px,.95fr) minmax(210px,1.5fr) 36px;gap:8px;align-items:center;padding:10px;background:#2a2a2a;border:1px solid rgba(255,255,255,.08);border-radius:8px;}',
      '#' + PANEL_ID + ' .evm-label{font-size:12px;color:#aaa;margin-bottom:4px;}',
      '#' + PANEL_ID + ' input,' + '#' + PANEL_ID + ' select{width:100%;box-sizing:border-box;background:#151515;color:#eee;border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:8px 9px;font-size:13px;}',
      '#' + PANEL_ID + ' select[data-field="policy"]{font-size:12px;padding-left:8px;padding-right:6px;}',
      '#' + PANEL_ID + ' input[type="checkbox"]{width:18px;height:18px;}',
      '#' + PANEL_ID + ' button{background:#3a3a3a;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:6px;padding:8px 12px;cursor:pointer;font-size:13px;}',
      '#' + PANEL_ID + ' button:hover{background:#484848;}',
      '#' + PANEL_ID + ' .evm-primary{background:#0078d4;border-color:#0078d4;}',
      '#' + PANEL_ID + ' .evm-danger{background:#5b2525;border-color:#7f3333;}',
      '#' + PANEL_ID + ' .evm-close{width:34px;height:34px;padding:0;font-size:20px;line-height:1;}',
      '#' + PANEL_ID + ' .evm-footer{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-top:18px;color:#aaa;font-size:12px;line-height:1.55;}',
      '#' + PANEL_ID + ' .evm-help{max-width:680px;}',
      '#' + PANEL_ID + ' .evm-help div{margin:2px 0;}',
      '#' + PANEL_ID + ' .evm-empty{padding:20px;text-align:center;color:#aaa;background:#282828;border-radius:8px;}',
      '@media (max-width:760px){#' + PANEL_ID + ' .evm-row{grid-template-columns:1fr;}#' + PANEL_ID + ' .evm-label{display:block;}}'
    ].join('\n');

    document.documentElement.appendChild(style);
  }

  function openPanel() {
    if (!document.documentElement) return;

    closePanel();
    injectStyles();

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = buildPanelHtml();
    panel.addEventListener('click', function (event) {
      if (event.target === panel) closePanel();
    });

    document.documentElement.appendChild(panel);
    bindPanel(panel);
  }

  function closePanel() {
    var oldPanel = document.getElementById(PANEL_ID);
    if (oldPanel && oldPanel.parentNode) oldPanel.parentNode.removeChild(oldPanel);
  }

  function buildPanelHtml() {
    return [
      '<div class="evm-dialog">',
      '<div class="evm-header"><h2>Emby 显示模式设置</h2><button type="button" class="evm-close" data-action="close">×</button></div>',
      '<div class="evm-body">',
      '<div class="evm-toolbar">',
      '<button type="button" class="evm-primary" data-action="add-current">添加当前库</button>',
      '<button type="button" data-action="add-empty">新增空配置</button>',
      '<button type="button" data-action="clear-session">清空临时切换</button>',
      '<button type="button" data-action="export-config">导出配置</button>',
      '<button type="button" data-action="import-config">导入配置</button>',
      '</div>',
      '<div class="evm-list">',
      buildLibraryRows(),
      '</div>',
      '<div class="evm-footer"><div class="evm-help"><div>锁定：媒体库按“默认显示”和“默认排序”打开，前台不能改成别的设置</div><div>临时：媒体库按默认设置打开，可以临时切换，重启浏览器后恢复脚本的设置</div><div>解锁：脚本不再参与显示控制，交由 Emby 与浏览器设置控制</div><div>默认排序选“不指定”时，排序不受脚本控制。</div><div>配置保存在脚本管理器里；换打包环境前可先导出配置，换好后再导入。</div></div><button type="button" class="evm-primary" data-action="save">保存设置</button></div>',
      '</div>',
      '</div>'
    ].join('');
  }

  function buildLibraryRows() {
    if (!config.libraries.length) {
      return '<div class="evm-empty">还没有配置媒体库。打开目标库后点“添加当前库”。</div>';
    }

    return config.libraries.map(function (library, index) {
      return [
        '<div class="evm-row" data-index="' + index + '">',
        '<label title="启用"><span class="evm-label">启用</span><input data-field="enabled" type="checkbox" ' + (library.enabled ? 'checked' : '') + '></label>',
        '<label><span class="evm-label">媒体库 ID</span><input data-field="id" value="' + escapeHtml(library.id) + '" placeholder="parentId"></label>',
        '<label><span class="evm-label">备注</span><input data-field="name" value="' + escapeHtml(library.name) + '" placeholder="例如 电影"></label>',
        '<label><span class="evm-label">默认显示</span>' + buildSelect('mode', MODE_OPTIONS, library.mode) + '</label>',
        '<label><span class="evm-label">默认排序</span>' + buildSelect('sort', SORT_OPTIONS, library.sort) + '</label>',
        '<label><span class="evm-label">控制方式</span>' + buildSelect('policy', POLICY_OPTIONS, library.policy) + '</label>',
        '<button type="button" class="evm-danger" title="删除" data-action="remove">删</button>',
        '</div>'
      ].join('');
    }).join('');
  }

  function buildSelect(field, options, selected) {
    var html = '<select data-field="' + field + '">';
    options.forEach(function (option) {
      html += '<option value="' + option.id + '" ' + (option.id === selected ? 'selected' : '') + '>' + escapeHtml(option.label + ' - ' + option.note) + '</option>';
    });
    html += '</select>';
    return html;
  }

  function bindPanel(panel) {
    panel.querySelector('[data-action="close"]').addEventListener('click', closePanel);
    panel.querySelector('[data-action="save"]').addEventListener('click', function () {
      readPanel(panel);
      saveConfig();
      sessionPrefs = {};
      saveSessionPrefs();
      closePanel();
      scheduleRefresh(true);
      log('config saved', config);
    });
    panel.querySelector('[data-action="add-empty"]').addEventListener('click', function () {
      readPanel(panel);
      config.libraries.push(normalizeLibrary({ id: '', name: '', mode: 'thumb', sort: 'none', policy: 'session', enabled: true }));
      rerenderPanel();
    });
    panel.querySelector('[data-action="add-current"]').addEventListener('click', function () {
      readPanel(panel);
      addCurrentLibrary();
      rerenderPanel();
    });
    panel.querySelector('[data-action="clear-session"]').addEventListener('click', function () {
      sessionPrefs = {};
      saveSessionPrefs();
      scheduleRefresh(true);
      log('session prefs cleared');
    });
    panel.querySelector('[data-action="export-config"]').addEventListener('click', function () {
      readPanel(panel);
      exportConfig();
    });
    panel.querySelector('[data-action="import-config"]').addEventListener('click', function () {
      importConfig();
    });
    panel.querySelectorAll('[data-action="remove"]').forEach(function (button) {
      button.addEventListener('click', function () {
        readPanel(panel);
        var row = button.closest('.evm-row');
        var index = parseInt(row.getAttribute('data-index'), 10);
        config.libraries.splice(index, 1);
        rerenderPanel();
      });
    });
  }

  function readPanel(panel) {
    var rows = panel.querySelectorAll('.evm-row');
    var nextLibraries = [];

    rows.forEach(function (row) {
      var library = {
        id: row.querySelector('[data-field="id"]').value,
        name: row.querySelector('[data-field="name"]').value,
        mode: row.querySelector('[data-field="mode"]').value,
        sort: row.querySelector('[data-field="sort"]').value,
        policy: row.querySelector('[data-field="policy"]').value,
        enabled: row.querySelector('[data-field="enabled"]').checked
      };
      library = normalizeLibrary(library);
      nextLibraries.push(library);
    });

    config.libraries = nextLibraries;
  }

  function addCurrentLibrary() {
    var parentId = getCurrentParentId();
    if (!parentId) {
      PAGE.alert('当前页面没有检测到 parentId，请先进入目标媒体库。');
      return;
    }

    for (var i = 0; i < config.libraries.length; i++) {
      if (config.libraries[i].id === parentId) return;
    }

    config.libraries.push(normalizeLibrary({
      id: parentId,
      name: document.title.replace(/\s*-\s*Emby.*$/i, '').trim(),
      mode: 'thumb',
      sort: 'none',
      policy: 'session',
      enabled: true
    }));
  }

  function exportConfig() {
    var text = JSON.stringify(normalizeConfig(config), null, 2);
    PAGE.prompt('复制下面的配置 JSON，换环境后用“导入配置”粘贴即可。', text);
  }

  function importConfig() {
    var text = PAGE.prompt('粘贴从“导出配置”复制的 JSON：');
    if (!text) return;

    try {
      config = normalizeConfig(JSON.parse(text));
      saveConfig();
      sessionPrefs = {};
      saveSessionPrefs();
      rerenderPanel();
      scheduleRefresh(true);
      log('config imported', config);
    } catch (e) {
      PAGE.alert('导入失败：配置 JSON 格式不正确。');
      log('import failed', e);
    }
  }

  function rerenderPanel() {
    closePanel();
    openPanel();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    GM_registerMenuCommand('打开 Emby 显示模式设置', function () {
      openPanel();
    });
  }

  log('loaded:', location.href);

  var timer = setInterval(patch, 500);
  setTimeout(function () {
    clearInterval(timer);
  }, 20000);

  registerMenu();

  document.addEventListener('viewshow', function () {
    patch();
    scheduleRefresh();
  }, true);

  window.addEventListener('hashchange', function () {
    setTimeout(function () {
      patch();
      scheduleRefresh();
    }, 500);
  });
})();
