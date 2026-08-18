// ==UserScript==
// @name         Nyaa.si - 自动加载预览图 (改)
// @namespace    https://github.com/ZiPenOk
// @description  Load image from cover/screenshot links.
// @description:zh-CN  从封面/截图链接加载图片并显示。基于York Wang 0.9.8版本自用修改, 添加更多站点支持
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sukebei.nyaa.si
// @version      2.2.2
// @license      MIT
// @author       ZiPenOk
// @include      /^https://(?:[^/]+\.)?nyaa\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentai-covers\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?dlsite\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?e-hentai\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?dmm\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?javtenshi\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?3xplanet\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?4up\.pics/.*$/
// @include      /^https://(?:[^/]+\.)?xpic\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgrock\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?picrok\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?picbaron\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgbaron\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?kvador\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?kropic\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgsto\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgsen\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgstar\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?picdollar\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?pics4you\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?silverpic\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?fotokiz\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?premalo\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?piczhq\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?trypicz\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imglord\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?croea\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgtaxi\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgadult\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgdrive\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?xxxwebdlxxx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?uvonahaze\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?firm\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgdawgknuttz\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imagetwist\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imagexport\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imagenimage\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imagehaha\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentai4free\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?pixhost\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgair\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgfrost\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgblaze\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?pig69\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?ai18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?porn4f\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentai4f\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?javball\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?ovabee\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?javbee\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?idol69\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?sweetie-fox\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?javsunday\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cnpics\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?fikfok\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cnxx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cosplay18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?kin8-av\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?555fap\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?4fuk\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentaipig\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?3minx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?fc2ppv\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?xcamcovid\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentaicovid\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?chinese-pics\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?kr-av\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cn-av\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?anime-jav\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentai-sub\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cosplay-xxx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?porn-pig\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?javtele\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?gofile\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?xxpics\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentaixnx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?blackwidof\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentai-manga\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?1minx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cnxxx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cosplaytele\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?kin8-jav\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?old-young\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?imgo\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?sht-link\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?shentai-anime\.[^/]+/.*$/

// @run-at       document-end
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      *
// @supportURL   https://github.com/ZiPenOk/scripts/issues
// @homepageURL  https://github.com/ZiPenOk/scripts
// @downloadURL  https://raw.githubusercontent.com/ZiPenOk/scripts/main/sukebei_Thumbnail.js
// @updateURL    https://raw.githubusercontent.com/ZiPenOk/scripts/main/sukebei_Thumbnail.js
// ==/UserScript==

(function() {
    'use strict';

    function Handler(pattern, process, processNyaa) {
        this.pattern = (typeof pattern === 'string') ? new RegExp(pattern) : pattern
        this.process = process
        this.processNyaa = processNyaa
    }
    Handler.prototype.canHandle = function(url) {
        return this.pattern.test(url)
    }
    Handler.prototype.handle = function(url) {
        this.process && this.process((href, referer) => {
            document.location.href = href
            unsafeWindow.top.postMessage({"LMT": href, "LMT_SRC": referer||url}, '*')
        })
    }
    Handler.prototype.handleNyaa = function(url) {
        if(this.processNyaa) {
            this.processNyaa(url, href => {
                unsafeWindow.top.postMessage({"LMT": href, "LMT_SRC": url}, '*')
            })
        } else {
            unsafeWindow.LMT_Frame.src = url
        }
    }
    const handlers = []
    const addHandler = (pattern, process, processNyaa) => handlers.push(new Handler(pattern, process, processNyaa))

    const doGet = async (url, pattern) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: res => {
                    const src = res.responseText.match(pattern)
                    if(src && src.length > 1) resolve(src[1])
                    else resolve(null)
                },
                onerror: err => {
                    console.error(err)
                    resolve(null)
                },
                ontimeout: () => {
                    resolve(null)
                }
            })
        })
    }

    const doGetHtml = async url => {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: res => {
                    resolve(res.responseText || '')
                },
                onerror: err => {
                    console.error(err)
                    resolve('')
                },
                ontimeout: () => {
                    resolve('')
                }
            })
        })
    }

    const toAbsoluteUrl = (src, base) => {
        if(!src) return null
        if(/^https?:\/\//i.test(src)) return src
        if(/^\/\//.test(src)) return document.location.protocol + src
        try {
            return new URL(src, base).href
        } catch (e) {
            return null
        }
    }

    const parseImageTwistImage = (html, base) => {
        if(!html) return null

        const doc = new DOMParser().parseFromString(html, 'text/html')
        const img = doc.querySelector('img.pic.img.img-responsive') ||
                    doc.querySelector('img.img-responsive') ||
                    doc.querySelector('a[data-fancybox] img')
        const src = img && toAbsoluteUrl(img.getAttribute('src'), base)
        if(src) return src

        const match = html.match(/<img[^>]+src=["'](https?:\/\/img\d+\.(?:imagetwist|imagexport|imagenimage|imagehaha)\.[^"']+)["'][^>]*>/i) ||
                      html.match(/<a[^>]+href=["'](https?:\/\/img\d+\.(?:imagetwist|imagexport|imagenimage|imagehaha)\.[^"']+)["'][^>]*data-fancybox/i)
        return match ? match[1] : null
    }

    const getMetaRefreshUrl = (html, base) => {
        if(!html) return null

        const match = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["'][^"']*url=(.+?)["']/i)
        if(!match) return null

        const url = match[1].trim().replace(/^['"]|['"]$/g, '')
        return toAbsoluteUrl(url, base)
    }

    const parseStorageImage = (html, base) => {
        if(!html) return null

        const doc = new DOMParser().parseFromString(html, 'text/html')
        const img = doc.querySelector('.fileviewer-file img') ||
                    doc.querySelector('#fileOriginalModal img')
        const src = img && toAbsoluteUrl(img.getAttribute('src'), base)
        if(src) return src

        const match = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\/Application\/storage\/app\/public\/uploads\/users\/[^"']+)["']/i) ||
                      html.match(/<img[^>]+src=["']((?:\/uploads?)?\/Application\/storage\/app\/public\/uploads\/users\/[^"']+)["']/i)
        return match ? toAbsoluteUrl(match[1], base) : null
    }

    addHandler(/^https?:\/\/(hentai-covers\.site)\/image\/\w+/, null, async (url, callback) => {
        callback(await doGet(url, /id="image-main" src="(.+?)"/))
    })
    addHandler(/^https?:\/\/(www\.dlsite\.com)\/maniax\/work\/=\/product_id\/RJ\d+.html$/, null, async (url, callback) => {
        callback(await doGet(url, /twitter:image:src" content="(.+?)"/))
    })
    addHandler(/^https?:\/\/(e-hentai\.org)\/g\/\w+\/\w+\//, null, async (url, callback) => {
        callback(await doGet(url, /url\((https:\/\/.+?)\) no-repeat/))
    })
    addHandler(/^https?:\/\/c\.fantia\.jp\/uploads\/product\/image\/\d+\/[\w-]+\.webp/, null, (url, callback) => {
        callback(url)
    })
    addHandler(/^https?:\/\/(a.2img.org)/, null, (url, callback) => {
        callback(url)
    })
    addHandler(/^https?:\/\/(iwtf1\.caching\.ovh|i\.postimg\.cc|i\.imgur\.com|cdn\.faleno\.net|img169\.com|qpic\.ws|img\.blr844\.com|3xplanetimg2\.com|pics4you\.net|www\.javbus\.com|\w+\.turboimg\.net|cctv123456\.com|images\d\.imagebam\.com|files\.catbox\.moe|tezimg\.campus-av\.com|i\.97p\.org|(\w+\.)+steamstatic\.com|pics\.dmm\.co\.jp)(\/[\w-]+)+\.(jpg|png|gif)$/, null, (url, callback) => {
        callback(url)
    })
    addHandler(/^https?:\/\/(?:[^\/]+\.)?4up\.pics(?:\/[\w-]+)?\/[\w.-]+\.(jpg|png|gif|webp)$/i, callback => {
        const src = parseStorageImage(document.documentElement.innerHTML, document.location.href)
        if(src) {
            callback(src)
        }
    }, async (url, callback) => {
        let html = await doGetHtml(url)
        const redirect = getMetaRefreshUrl(html, url)
        if(redirect) {
            html = await doGetHtml(redirect)
            url = redirect
        }
        const src = parseStorageImage(html, url)
        if(src) callback(src)
    })
    addHandler(/^https?:\/\/(javtenshi\.com|3xplanet\.net|3xplanet\.com)\/viewimage\/\d+\.html/, null, async (url, callback) => {
        callback(await doGet(url, /scale\(this\);" src="(.+)/))
    })
    addHandler(/^https?:\/\/xpic\.org(\/\w+)+/, callback => {
        unsafeWindow.wuLu && unsafeWindow.wuLu()
        const img = document.querySelector('img.attachment-original.size-original')
        if(img) {
            callback(img.src)
        }
    }, async (url, callback) => {
        callback(await doGet(url, /src="(.*)" class="attachment-original size-original"/))
    })
    addHandler(/^https?:\/\/(imgrock\.pw)(\/[\w\-]+)+(\.[\w\-]+)+/, callback => {
        const iframe = document.querySelector('iframe')
        if(iframe && iframe.src.indexOf('captcha') > -1) return

        const img = document.querySelector('.picview')
        if(img) {
            callback(img.src)
        } else {
            const btns = document.querySelectorAll('input[name=fnext]')
            for(let i=0;i<btns.length;i++) {if(!btns[i].style.display) btns[i].click()}
            const forms = document.querySelectorAll('form')
            for(let i=0;i<forms.length;i++) {if(forms[i].hito) {forms[i].submit()}}
        }
    })
    addHandler(/^https?:\/\/(picrok\.com)(\/[\w\-]+)+\.php/, callback => {
        const iframe = document.querySelector('iframe')
        if(iframe && iframe.src.indexOf('captcha') > -1) return

        const img = document.querySelector('.picview')
        if(img) {
            callback(img.src)
        } else {
            unsafeWindow.setTimeout(() => {
              const forms = document.querySelectorAll('form')
              const btns = document.querySelectorAll('form>button')
            }, 5000)
        }
    })
    addHandler(/^https?:\/\/(picbaron\.com|imgbaron\.com|kvador\.com|kropic\.com|imgsto\.com|imgsen\.com|imgstar\.eu|picdollar\.com|pics4you\.net|silverpic\.com|fotokiz\.com|premalo\.com|piczhq\.com|trypicz\.com|imglord\.com)(\/.+)+(\.[\w\-]+)+/, callback => {
        const img = document.querySelector('.pic')
        if(img) {
            callback(img.src)
        } else {
            const form = document.querySelector('form')
            form && form.submit()
        }
    })
    addHandler(/^https?:\/\/(croea\.com)(\/\w+)+/, callback => {
        const img = document.querySelector('.pic')
        if(img) {
            callback(img.src)
        } else {
            const form = document.querySelector('form')
            form && form.submit()
        }
    }, async (url, callback) => {
        const src = await doGet(url, /src="(.*)" class="pic img img-responsive"/)
        if(src) {
            GM_xmlhttpRequest({
                method: 'GET',
                responseType: "blob",
                url: src,
                onload: res => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        callback(reader.result)
                    }
                    reader.readAsDataURL(res.response)
                }
            })
        }
    })
    addHandler(/^https?:\/\/(imgtaxi\.com|imgadult\.com|imgdrive\.net)(\/\w+)+/, callback => {
        unsafeWindow.ctipops = []
        unsafeWindow.adbctipops = []
        const img = document.querySelector('img.centred') || document.querySelector('img.centred_resized')
        if(img) {
            callback(img.src)
        } else {
            unsafeWindow.setTimeout(() => {
                const btn = document.querySelector('.overlay_ad_link')
              if(btn) {
                btn.focus()
                btn.click()
              }
            }, 1000)
        }
    }, async (url, callback) => {
        callback(await doGet(url, /og:image:secure_url" content="(.*)"/))
    })
    addHandler(/^https?:\/\/(xxxwebdlxxx\.org|xxxwebdlxxx\.top)(\/\w+)+/, callback => {
        unsafeWindow.ctipops = []
        unsafeWindow.adbctipops = []
        const img = document.querySelector('img.centred') || document.querySelector('img.centred_resized')
        if(img) {
            callback(img.src)
        } else {
            unsafeWindow.setTimeout(() => {
                const btn = document.querySelector('.overlay_ad_link')
              if(btn) {
                btn.focus()
                btn.click()
              }
            }, 1000)
        }
    })
    addHandler(/^https?:\/\/(uvonahaze\.xyz|trans\.firm\.in||imgdawgknuttz\.com)(\/\w+)+/, callback => {
        const img = document.querySelector('img.centred') || document.querySelector('img.centred_resized')
        if(img) {
            callback(img.src)
        } else {
            const btn = document.querySelector('input[name=imgContinue]')
            btn && btn.click()
        }
    })
    addHandler(/^https?:\/\/(imagetwist\.netlify\.app)(\/\w+)+/, async callback => {
        const redirect = await doGet(document.location.href, /<center><a href="(https?:\/\/imagetwist\.com(\/[\w-]+)+\.jpg)"/)
        document.location.href = redirect + '#' + document.location.href
    })
    addHandler(/^https?:\/\/(imagetwist\.com|imagexport\.com|imagenimage\.com|imagehaha\.com)(\/[\w-.]+)+\.jpg#https?:\/\/(imagetwist\.netlify\.app)(\/[\w-]+)+\.jpg/, callback => {
        const img = document.querySelector('.img-responsive')
        if(img) {
            const referer = document.location.href.split('#')[1]
            callback(img.src, referer)
        }
    })
    addHandler(/^https?:\/\/(imagetwist\.com|imagexport\.com|imagenimage\.com|imagehaha\.com)(\/[\w-.]+)+\.jpg$/, callback => {
        const img = document.querySelector('.img-responsive')
        if(img) {
            callback(img.src)
        }
    }, async (url, callback) => {
        const src = parseImageTwistImage(await doGetHtml(url), url)
        if(src) callback(src)
    })
    addHandler(/^https?:\/\/hentai4free\.net(\/\w+)+/, callback => {
        unsafeWindow.wuLu && unsafeWindow.wuLu()
        const img = document.querySelector('#image-viewer-container>img')
        if(img) {
            callback(img.src)
        }
    })
    addHandler(/^https?:\/\/pixhost\.to(\/\w+)+/, callback => {
        const img = document.querySelector('img.image-img')
        if(img) {
            callback(img.src)
        } else {
            const btn = document.querySelector('a.continue')
            btn && btn.click()
        }
    })
    addHandler(/^https?:\/\/(imgair\.net|imgfrost\.net|imgblaze\.net)(\/\w+)$/, callback => {
        unsafeWindow.wuLu && unsafeWindow.wuLu()
        const img = document.querySelector('#newImgE')
        if(img) {
            callback(img.src)
        }
    }, (url, callback) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url.replace(/^https?:\/\/(imgfrost\.net|imgblaze\.net)/, 'https://imgair.net'),
            onload: res => {
                const mat = res.responseText.match(/imgbg.src = "(.*)";/)
                if(!mat || mat.length<2) return false
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: mat[1],
                    responseType: 'blob',
                    headers: {'Referer': 'https://imgair.net'},
                    onload: res => {
                        const reader = new FileReader();
                        reader.onloadend = function () {
                            callback(reader.result)
                        };
                        reader.readAsDataURL(res.response);
                    }
                })
            }
        })
    })

    // ==================== 统一图床站点配置 ====================
    const imageHosts = [
        '1minx\\.[a-z]+',
        '3minx\\.[a-z]+',
        '4up\\.pics',
        '4fuk\\.[a-z]+',
        '555fap\\.[a-z]+',
        'ai18\\.[a-z]+',
        'anime-jav\\.[a-z]+',
        'blackwidof\\.[a-z]+',
        'chinese-pics\\.[a-z]+',
        'cn-av\\.[a-z]+',
        'cnpics\\.[a-z]+',
        'cnxx\\.[a-z]+',
        'cnxxx\\.[a-z]+',
        'cosplay-xxx\\.[a-z]+',
        'cosplay18\\.[a-z]+',
        'cosplaytele\\.[a-z]+',
        'fc2ppv\\.[a-z]+',
        'fikfok\\.[a-z]+',
        'gofile\\.[a-z]+',
        'hentai-sub\\.[a-z]+',
        'hentai-manga\\.[a-z]+',
        'hentai4f\\.[a-z]+',
        'hentaicovid\\.[a-z]+',
        'hentaipig\\.[a-z]+',
        'hentaixnx\\.[a-z]+',
        'idol69\\.[a-z]+',
        'imgo\\.[a-z]+',
        'javball\\.[a-z]+',
        'javbee\\.[a-z]+',
        'javsunday\\.[a-z]+',
        'javtele\\.[a-z]+',
        'kin8-av\\.[a-z]+',
        'kin8-jav\\.[a-z]+',
        'kr-av\\.[a-z]+',
        'old-young\\.[a-z]+',
        'ovabee\\.[a-z]+',
        'pig69\\.[a-z]+',
        'porn-pig\\.[a-z]+',
        'porn4f\\.[a-z]+',
        'sht-link\\.[a-z]+',
        'sweetie-fox\\.[a-z]+',
        'xcamcovid\\.[a-z]+',
        'xxpics\\.[a-z]+',
        'shentai-anime\\.[a-z]+'
    ];

    const imagePattern = new RegExp(`^https?://(${imageHosts.join('|')})(/\\w+)+`, 'i');

    addHandler(
        imagePattern,
        function (callback) {
            const img = document.querySelector('.fileviewer-file img') ||
                        document.querySelector('#fileOriginalModal img');
            if (img && img.src) {
                callback(img.src);
            } else {
                const btn = document.querySelector('a.continue');
                if (btn) btn.click();
            }
        },
        async (url, callback) => {
            try {
                const src = parseStorageImage(await doGetHtml(url), url)
                if (src) callback(src)
            } catch (e) {
            }
        }
    );

    addHandler(/^https:\/\/manko\.fun\|/, callback => {
        return false
    }, (url, callback) => {
        if(/^https:\/\/sukebei\.nyaa\.si\/(\?.*)?$/.test(href)) {
            callback(url.substr(18))
        }
    })
    // ==================== 统一图床配置结束 ====================

    const href = document.location.href
    if(/^https?:\/\/(sukebei\.nyaa\.si).+/g.test(href)) {

        // ==================== 本地缓存 + 预加载校验 ====================
        const CACHE_PREFIX = 'lmt_thumb_'
        const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 本地缓存有效期 7 天
        const CACHE_MAX = 2000 // 最多保留条数，超出淘汰最旧的
        const NO_THUMB = '__NO_THUMB__'
        const cacheKeys = () => {
            const keys = []
            for(let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if(k && k.indexOf(CACHE_PREFIX) === 0) keys.push(k)
            }
            return keys
        }
        const pruneCache = target => {
            try {
                const keys = cacheKeys()
                if(keys.length <= target) return
                const items = keys.map(k => {
                    let ts = 0
                    try { ts = (JSON.parse(localStorage.getItem(k)) || {}).ts || 0 } catch(e) {}
                    return { k, ts }
                })
                items.sort((a, b) => a.ts - b.ts) // 最旧的排前面
                for(let i = 0; i < items.length - target; i++) localStorage.removeItem(items[i].k)
            } catch(e) {}
        }
        const clearThumbCache = () => {
            const keys = cacheKeys()
            keys.forEach(k => localStorage.removeItem(k))
            alert('已清空缩略图缓存，共 ' + keys.length + ' 条')
        }
        const getLocalThumb = id => {
            try {
                const raw = localStorage.getItem(CACHE_PREFIX + id)
                if(!raw) return null
                const obj = JSON.parse(raw)
                if(!obj || !obj.url) return null
                if(Date.now() - obj.ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + id); return null }
                return obj.url
            } catch(e) { return null }
        }
        const setLocalThumb = (id, url) => {
            if(!id || !url) return
            const val = JSON.stringify({ url: url, ts: Date.now() })
            try {
                localStorage.setItem(CACHE_PREFIX + id, val)
            } catch(e) {
                // 写满则清理后重试一次
                pruneCache(Math.floor(CACHE_MAX * 0.8))
                try { localStorage.setItem(CACHE_PREFIX + id, val) } catch(e2) {}
            }
        }
        const delLocalThumb = id => { try { localStorage.removeItem(CACHE_PREFIX + id) } catch(e) {} }
        // 载入时按上限裁剪一次，并注册一键清理菜单
        pruneCache(CACHE_MAX)
        if(typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand('清空缩略图缓存', clearThumbCache)
        // 后台用 <img> 预加载校验：能加载出来才算有效（同时把图片暖进浏览器缓存，hover 秒出）
        const preloadImage = (url, timeout = 8000) => new Promise(resolve => {
            if(!url) return resolve(false)
            if(/^data:/i.test(url)) return resolve(true)
            const img = new Image()
            let done = false
            const finish = ok => { if(done) return; done = true; clearTimeout(t); resolve(ok) }
            const t = setTimeout(() => finish(false), timeout)
            img.onload = () => finish(img.naturalWidth > 0)
            img.onerror = () => finish(false)
            img.src = url
        })
        const upsertThumbMarker = (a, url) => {
            if(!a || !url) return
            const oldUrl = a.dataset.lmt
            a.dataset.lmt = url

            let span = oldUrl ? document.querySelector(`span[data-lmt="${decodeURI(oldUrl)}"]`) : null
            if(!span && a.previousElementSibling && a.previousElementSibling.dataset && a.previousElementSibling.dataset.lmt) {
                span = a.previousElementSibling
            }
            if(!span) {
                span = document.createElement("span")
                span.innerHTML='🖼️'
                span.style.cursor = 'pointer'
                a.before(span)
            }
            span.dataset.lmt = url
        }

        let LMT_Wrap, LMT_Frame, LMT_Loading, LMT_panel, LMT_img, LMT_Status
        let LMT_resolveLink = null
        let LMT_mouseX = 0
        let LMT_mouseY = 0
        const panelWidth = 480
        const panelHeight = 480
        function createWrap(parent) {
            parent.parentNode.insertAdjacentHTML('afterend', '<div class="panel panel-default"><div class="panel-body" id="LMT_Wrap"></div></div>')
            LMT_Wrap = document.querySelector('#LMT_Wrap')

            LMT_Loading = document.createElement('div')
            LMT_Loading.innerText = 'Loading Images...'
            LMT_Wrap.appendChild(LMT_Loading)
        }
        function createPanel() {
            LMT_panel = document.createElement('div')
            LMT_panel.style.position = 'fixed'
            LMT_panel.style.top = '-1000px'
            LMT_panel.style.left = '-1000px'
            LMT_panel.style.backgroundColor = '#f5f5f5'
            LMT_panel.style.backgroundSize = 'contain'
            LMT_panel.style.backgroundRepeat = 'no-repeat'
            LMT_panel.style.backgroundPosition = 'center'
            LMT_panel.style.border = '1px solid #ddd'
            LMT_panel.style.borderRadius = '6px'
            LMT_panel.style.boxShadow = '0 1px 1px rgba(0,0,0,.05)'
            LMT_panel.style.width = `${panelWidth}px`
            LMT_panel.style.height = `${panelHeight}px`
            LMT_panel.style.overflow = 'hidden'
            LMT_panel.style.zIndex = '9999'
            LMT_panel.style.pointerEvents = 'none'
            document.body.appendChild(LMT_panel)

            LMT_img = document.createElement('img')
            LMT_img.style.width = '100%'
            LMT_img.style.height = '100%'
            LMT_img.style.objectFit = 'contain'
            LMT_img.style.display = 'none'
            LMT_img.onerror = (e) => {
                LMT_img.style.display = 'none'
                const a = document.querySelector(`a[data-lmt="${decodeURI(e.target.src)}"]`)
                if(a) a.dataset.lmtStale = '1'
                if(LMT_Status) {
                    LMT_Status.innerText = 'Refreshing...'
                    LMT_Status.style.display = 'flex'
                }
            }
            LMT_panel.appendChild(LMT_img)

            LMT_Status = document.createElement('div')
            LMT_Status.style.position = 'absolute'
            LMT_Status.style.left = '0'
            LMT_Status.style.top = '0'
            LMT_Status.style.width = '100%'
            LMT_Status.style.height = '100%'
            LMT_Status.style.display = 'none'
            LMT_Status.style.alignItems = 'center'
            LMT_Status.style.justifyContent = 'center'
            LMT_Status.style.color = '#777'
            LMT_Status.style.fontSize = '14px'
            LMT_Status.style.background = '#f5f5f5'
            LMT_panel.appendChild(LMT_Status)

            LMT_Frame = document.createElement('iframe')
            LMT_Frame.id = 'LMT_Frame'
            LMT_Frame.sandbox = 'allow-forms allow-scripts allow-same-origin'
            LMT_Frame.style.display = 'none'
            document.body.appendChild(LMT_Frame)
        }

        const imgList = []
        const imgPending = new Set()
        function addToImgQueue(q) {
            const key = (q.href || '').toLowerCase()
            if(!key || imgPending.has(key)) return
            imgPending.add(key)
            setTimeout(() => imgPending.delete(key), 15000)

            if(q.handler && q.handler.processNyaa) {
                q.handler.handleNyaa(q.href)
                return
            }
            if(imgList.filter(a=>a.href===q.href).length === 0) imgList.push(q)
        }
        let running = false
        let timeoutCounter = 0
        const imgListConsumer = setInterval(() => {
            if(timeoutCounter > 500) {
                running = false
                timeoutCounter = 0
            }
            timeoutCounter++
            if(running) return
            timeoutCounter = 0
            if(imgList.length) {
                let url = imgList.shift()
                url.handler.handleNyaa(url.href)
                running = true
            } else if(LMT_Loading) {
                LMT_Loading.innerText = ''
            }
        }, 10)
        function process() {
            if(imgList.length) {
                let url = imgList.shift()
                url.handler.handleNyaa(url.href)
            } else {
                if(LMT_Wrap) {
                    LMT_Loading.innerText = ''
                    LMT_Frame.remove()

                    if(!Array.apply(null, document.querySelectorAll('#LMT_Wrap > img')).length) {
                        document.querySelector('.panel:has(#LMT_Wrap)').style.display = 'none'
                    }
                } else {
                    LMT_Frame.src = 'about:blank'
                }
            }
        }

        unsafeWindow.addEventListener('message', function (e) {
            if(!e.data.LMT) return false
            if(LMT_Wrap) {
                LMT_Frame.src = ''
                const img = document.createElement('img')
                img.src = e.data.LMT
                img.style['max-width'] = '100%'
                LMT_Wrap.appendChild(img)
            }
            if(e.data.LMT_SRC) {
                const url_src = e.data.LMT_SRC.toLowerCase()
                imgPending.delete(url_src)
                const a = document.querySelector(`a[data-lmt-src="${decodeURI(url_src)}"]`)
                if(a) {
                    delete a.dataset.lmtStale
                    upsertThumbMarker(a, e.data.LMT)

                    if(/^https?:\/\/(sukebei\.nyaa\.si\/view\/).+/g.test(a.href)) {
                        const id = a.href.substr(a.href.lastIndexOf('/')+1)
                        saveThumb(id, e.data.LMT)
                        setLocalThumb(id, e.data.LMT)
                    }
                    if(LMT_panel && LMT_panel.dataset.visible === '1' && LMT_panel.dataset.activeHref === a.href) {
                        showPreview(a)
                    }
                }
            }
            running = false
        })

        let windowWidth = unsafeWindow.innerWidth
        let windowHeight = unsafeWindow.innerHeight
        unsafeWindow.addEventListener('resize', function (e) {
            windowWidth = unsafeWindow.innerWidth
            windowHeight = unsafeWindow.innerHeight
        })
        const movePreviewPanel = e => {
            if(e) {
                LMT_mouseX = e.clientX
                LMT_mouseY = e.clientY
            }
            if(LMT_panel.dataset.visible === '1') {
                const offset = 20;
                const panelRightEdge = LMT_mouseX + offset + panelWidth;
                const panelBottomEdge = LMT_mouseY + offset + panelHeight;

                let newLeft = LMT_mouseX + offset;
                if(panelRightEdge > windowWidth) {
                    newLeft = LMT_mouseX - offset - panelWidth;
                }
                newLeft = Math.max(5, Math.min(newLeft, windowWidth - panelWidth - 5));

                let newTop = LMT_mouseY + offset;
                if(panelBottomEdge > windowHeight) {
                    newTop = LMT_mouseY - offset - panelHeight;
                }
                newTop = Math.max(5, Math.min(newTop, windowHeight - panelHeight - 5));

                LMT_panel.style.left = newLeft + 'px';
                LMT_panel.style.top = newTop + 'px';
            }
        }
        const hidePreviewPanel = () => {
            LMT_panel.dataset.visible = '0'
            LMT_panel.style.top = '-1000px'
            LMT_panel.style.left = '-1000px'
            LMT_panel.style.backgroundImage = ''
            LMT_img.style.display = 'none'
            if(LMT_Status) LMT_Status.style.display = 'none'
        }
        const showPreview = (a, e) => {
            if(!a || !a.dataset.lmt) return
            if(!a.href && a.nextElementSibling && a.nextElementSibling.dataset && a.nextElementSibling.dataset.lmt) {
                a = a.nextElementSibling
            }

            const url = a.dataset.lmt
            const seq = String(Date.now()) + Math.random()
            LMT_panel.dataset.visible = '1'
            LMT_panel.dataset.seq = seq
            LMT_panel.dataset.activeHref = a.href || ''
            LMT_panel.dataset.src = url
            LMT_panel.style.backgroundImage = ''
            LMT_img.style.display = 'none'
            LMT_Status.innerText = a.dataset.lmtStale ? 'Refreshing...' : 'Loading...'
            LMT_Status.style.display = 'flex'
            movePreviewPanel(e)

            const requestStaleRefresh = () => {
                const now = Date.now()
                const retryAt = Number(a.dataset.lmtRetryAt || 0)
                if(now < retryAt) return
                a.dataset.lmtRetryAt = String(now + 30000)
                if(LMT_resolveLink) LMT_resolveLink(a, true)
            }

            const probe = new Image()
            let probeDone = false
            probe.onload = () => {
                if(LMT_panel.dataset.seq !== seq || LMT_panel.dataset.src !== url) return
                probeDone = true
                clearTimeout(refreshTimer)
                delete a.dataset.lmtStale
                LMT_img.src = url
                LMT_img.style.display = 'block'
                LMT_Status.style.display = 'none'
            }
            probe.onerror = () => {
                if(LMT_panel.dataset.seq !== seq || LMT_panel.dataset.src !== url) return
                probeDone = true
                clearTimeout(refreshTimer)
                a.dataset.lmtStale = '1'
                LMT_Status.innerText = 'Refreshing...'
                LMT_Status.style.display = 'flex'
                requestStaleRefresh()
            }
            const refreshTimer = setTimeout(() => {
                if(probeDone) return
                if(LMT_panel.dataset.seq !== seq || LMT_panel.dataset.src !== url) return
                a.dataset.lmtStale = '1'
                LMT_Status.innerText = 'Refreshing...'
                LMT_Status.style.display = 'flex'
                requestStaleRefresh()
            }, 5000)
            probe.src = url
        }
        unsafeWindow.addEventListener('mouseover', function (e) {
            showPreview(e.target, e)
        })
        unsafeWindow.addEventListener('mousemove', function (e) {
            movePreviewPanel(e)
        })
        unsafeWindow.addEventListener('mouseout', function (e) {
            const a = e.target
            if(a.dataset.lmt) {
                hidePreviewPanel()
            }
        })

        const CLOUD_URLS = [
            'https://sukebei.cfyan.cc.cd',
            'https://oc1.bigsm.art'
        ]
        const getThumbsFrom = (cloudUrl, ids) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${cloudUrl}/thumbs/?ids=${encodeURIComponent(ids)}`,
                    timeout: 3000,
                    onload: res => {
                        try {
                            resolve(JSON.parse(res.responseText))
                        } catch(e) {
                            resolve([])
                        }
                    },
                    onerror: err => { console.log(err);resolve([]) },
                    ontimeout: () => { resolve([]) }
                })
            })
        }
        const getThumbs = async ids => {
            const responses = await Promise.all(CLOUD_URLS.map(cloudUrl => getThumbsFrom(cloudUrl, ids)))
            const merged = []
            responses.forEach(thumbs => {
                if(!thumbs || !thumbs.length) return
                for(let j = 0; j < thumbs.length; j++) {
                    if(!merged[j] && thumbs[j]) merged[j] = thumbs[j]
                }
            })
            return merged
        }
        const saveThumb = (id, thumb) => {
            CLOUD_URLS.forEach(cloudUrl => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${cloudUrl}/thumb/${id}`,
                    data: JSON.stringify({ url: thumb }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
            })
        }

        if(/^https?:\/\/(sukebei\.nyaa\.si\/view\/).+/g.test(href)) {
            const desc = document.querySelector('#torrent-description')
            if(!desc) return

            const links = desc.querySelectorAll('a')
            const detailID = href.substr(href.lastIndexOf('/')+1)
            const externalUrls = (desc.innerHTML.match(/https?:\/\/[^\s\)"'<]+/g) || [])
                .filter(url => url.indexOf('nyaa.si') < 0)
            if(!externalUrls.length) {
                const alreadyNoThumb = getLocalThumb(detailID) === NO_THUMB
                setLocalThumb(detailID, NO_THUMB)
                if(!alreadyNoThumb) saveThumb(detailID, NO_THUMB)
            }

            for(let i = 0; i < links.length; i++) {
                if(!links[i].href) continue
                links[i].dataset.lmtSrc = decodeURI(links[i].href)
                handlers.forEach(h => {
                    if(h.canHandle(links[i].href)) {
                        links[i].dataset.lmtSrc = links[i].href.toLowerCase()
                        addToImgQueue({href:links[i].href,handler:h})
                    }
                })
            }

            if(!LMT_Frame) {
                createWrap(desc)
            }
            createPanel()
        } else {
            const links = document.querySelectorAll('.torrent-list>tbody>tr>td:nth-child(2)>a:last-child')
            const linksArr = Array.apply(null, links)
            const idOf = a => a.href.substr(a.href.lastIndexOf('/')+1)
            const isResolvedImageUrl = url => {
                return /^data:image\//i.test(url) ||
                       /\/Application\/storage\/app\/public\/uploads\/users\//i.test(url)
            }
            const handlerFor = url => {
                for(let i in handlers) {
                    if(handlers[i].canHandle(url)) return handlers[i]
                }
                return null
            }
            let promoteDetailJob = () => {}
            let cancelDetailJob = () => false
            const markNoThumb = (link, id, report = false) => {
                if(!link || !id) return
                link.dataset.lmtSrc = '#'
                link.dataset.lmtNoThumb = '1'
                if(cancelDetailJob(link.href)) delete link.dataset.lmtQueued
                setLocalThumb(id, NO_THUMB)
                if(report) saveThumb(id, NO_THUMB)
            }
            const resolveCandidateUrl = (a, url, force = false) => {
                if(!a || !url || url.indexOf('nyaa.si') >= 0) return false

                const h = handlerFor(url)
                if(h && !isResolvedImageUrl(url)) {
                    a.dataset.lmtSrc = url.toLowerCase()
                    addToImgQueue({href: url, handler: h})
                    return true
                }

                if(h && isResolvedImageUrl(url)) {
                    a.dataset.lmtSrc = url.toLowerCase()
                    unsafeWindow.top.postMessage({"LMT": url, "LMT_SRC": url}, '*')
                    return true
                }

                if(/\.(jpe?g|png|gif|webp)(?:[?#].*)?$/i.test(url)) {
                    a.dataset.lmtSrc = url.toLowerCase()
                    unsafeWindow.top.postMessage({"LMT": url, "LMT_SRC": url}, '*')
                    return true
                }

                return false
            }
            const placeMarker = (link, url) => {
                upsertThumbMarker(link, url)
            }
            // 先挂标记，校验放后台；失效时刷新缓存，不让 UI 等图片探测超时。
            const tryPlace = (link, url, id) => {
                if(url === NO_THUMB) {
                    markNoThumb(link, id)
                    return
                }
                if(!isResolvedImageUrl(url) && handlerFor(url)) {
                    delLocalThumb(id)
                    resolveCandidateUrl(link, url, true)
                    return
                }
                if(cancelDetailJob(link.href)) delete link.dataset.lmtQueued
                placeMarker(link, url)
                setLocalThumb(id, url)
                preloadImage(url, 2500).then(ok => {
                    if(!ok) {
                        // 缓存命中但图片探测失败可能只是图床临时限流；不要立刻抓 Sukebei 详情页。
                        link.dataset.lmtStale = '1'
                    } else {
                        delete link.dataset.lmtStale
                        delete link.dataset.lmtRetryAt
                    }
                })
            }
            // 查找顺序：本地缓存 → 云端 → 自动实时解析（无需手动划过）
            const cloudLinks = []
            linksArr.forEach(link => {
                if(!link.href) return
                const id = idOf(link)
                const local = getLocalThumb(id)
                if(local) {
                    tryPlace(link, local, id)
                } else {
                    cloudLinks.push(link)
                }
            })
            if(cloudLinks.length) {
                const ids = cloudLinks.map(idOf).join(',')
                // 等云端查询自身超时后再回退，避免固定计时器抢跑造成重复详情请求。
                getThumbs(ids).then(thumbs => {
                    thumbs = thumbs || []
                    cloudLinks.forEach((link, i) => {
                        const url = thumbs[i]
                        if(url) {
                            tryPlace(link, url, idOf(link))
                        } else {
                            resolveLink(link) // 云端无缓存 → 自动实时解析
                        }
                    })
                })
            }

            // 实时解析单个种子：抓详情页 → 匹配图床链接 → 入队加载
            const resolveLink = async (a, force = false) => {
                if(!a || !a.href || a.dataset.lmtPending) return
                if(a.dataset.lmtNoThumb === '1') return
                if(a.dataset.lmtQueued) {
                    if(force) promoteDetailJob(a.href)
                    return
                }
                if(!force && a.dataset.lmt) return
                if(!force && a.dataset.lmtSrc === '#') return
                if(!force && a.dataset.lmtSrc && imgPending.has(a.dataset.lmtSrc)) return
                if(!/.*\/view\/\d+$/.test(a.href)) return

                a.dataset.lmtQueued = '1'
                const unlock = await lock(force, a.href)
                delete a.dataset.lmtQueued
                if(a.dataset.lmtNoThumb === '1') { unlock(); return }
                if(!force && a.dataset.lmt) { unlock(); return }
                if(!force && a.dataset.lmtSrc === '#') { unlock(); return }
                if(!force && a.dataset.lmtSrc && imgPending.has(a.dataset.lmtSrc)) { unlock(); return }

                a.dataset.lmtPending = '1'
                let detail
                try { detail = await getDetail(a.href) } catch(err) { unlock(); delete a.dataset.lmtPending; return }
                unlock()
                delete a.dataset.lmtPending
                if(a.dataset.lmtNoThumb === '1') return
                if(!force && a.dataset.lmt) return
                if(!force && a.dataset.lmtSrc === '#') return
                if(!force && a.dataset.lmtSrc && imgPending.has(a.dataset.lmtSrc)) return

                let hasExternalCandidate = false
                let imgs = detail.responseText.match(/]\((https?:\/\/[^)]+)/)
                if(imgs && imgs[1] && imgs[1].indexOf('nyaa.si') < 0) {
                    hasExternalCandidate = true
                    if(resolveCandidateUrl(a, imgs[1], force)) return
                }

                let desc = detail.responseText.match(/<div\b[^>]*id=["']torrent-description["'][^>]*>([\s\S]*?)<\/div>/i)
                desc = (desc ? desc[1] : detail.responseText)
                    .replaceAll('&#10;', '\n')
                    .replaceAll(')]', ' )]')
                    .replaceAll('\*\*', ' \*\* ')
                let hrefs = desc.match(/(https?:\/\/[^\s\)]+)/g) || []
                let info = detail.responseText.match(/noopener noreferrer nofollow" href="(https?:\/\/.+?)"/)
                if(info) hrefs = [...hrefs, info[1]]
                let comments = detail.responseText.match(/id="torrent-comment\d+">(https?:\/\/.+?)(&#10;.*)*<\/div>/)
                if(comments) hrefs = [...hrefs, comments[1]]
                console.log('found links:', hrefs)

                let flag = false
                for (let i in hrefs) {
                    let href = hrefs[i]
                    if (href.indexOf('nyaa.si') >= 0) {
                        continue
                    }
                    if (href.trim() === 'https://manko.fun') {
                        href = desc.match(/(https?:\/\/.+?)\)\]\(https:\/\/manko\.fun\)/)
                        if(href) {
                            href = 'https://manko.fun|' + href[1].trim()
                        } else {
                            continue
                        }
                    }

                    hasExternalCandidate = true
                    if(resolveCandidateUrl(a, href, force)) {
                        flag = true
                        break
                    }
                }
                if(!flag) {
                    if(hasExternalCandidate) {
                        a.dataset.lmtSrc = '#'
                    } else {
                        markNoThumb(a, idOf(a), true)
                    }
                }
            }
            // hover 仅作兜底（绝大多数已在载入时自动解析完成）
            LMT_resolveLink = resolveLink
            document.querySelector('.torrent-list').addEventListener('mouseover', (e) => resolveLink(e.target))
            createPanel()

            const LOCK_LIMIT = 5; // 详情页最大并发数
            const DETAIL_START_INTERVAL = 800; // 新请求启动间隔，避免列表页瞬间打爆 Sukebei
            let lockCount = 0;
            let lockSeq = 0;
            let lockLastStart = 0;
            let lockTimer = null;
            let detailBackoffUntil = 0;
            const lockList = [];

            const pumpLock = () => {
                if(lockTimer || lockCount >= LOCK_LIMIT || !lockList.length) return;

                const now = Date.now();
                const delay = Math.max(
                    0,
                    DETAIL_START_INTERVAL - (now - lockLastStart),
                    detailBackoffUntil - now
                );

                lockTimer = setTimeout(() => {
                    lockTimer = null;
                    if(lockCount >= LOCK_LIMIT || !lockList.length) {
                        pumpLock();
                        return;
                    }

                    const waitFunc = lockList.shift();
                    lockCount++;
                    lockLastStart = Date.now();
                    waitFunc.resolve(() => {
                        lockCount = Math.max(0, lockCount - 1);
                        pumpLock();
                    });
                    pumpLock();
                }, delay);
            };

            promoteDetailJob = key => {
                const index = lockList.findIndex(item => item.key === key);
                if(index < 0) return;

                const item = lockList.splice(index, 1)[0];
                item.priority = true;
                const insertAt = lockList.findIndex(job => !job.priority);
                if(insertAt < 0) lockList.push(item);
                else lockList.splice(insertAt, 0, item);
            };

            cancelDetailJob = key => {
                const index = lockList.findIndex(item => item.key === key);
                if(index < 0) return false;
                lockList.splice(index, 1);
                return true;
            };

            async function lock(priority = false, key = '') {
                return new Promise(resolve => {
                    const item = { resolve, key, priority, seq: ++lockSeq };
                    if(priority) {
                        const insertAt = lockList.findIndex(job => !job.priority);
                        if(insertAt < 0) lockList.push(item);
                        else lockList.splice(insertAt, 0, item);
                    } else {
                        lockList.push(item);
                    }
                    pumpLock();
                });
            }
            const getDetail = url => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        timeout: 8000,
                        onload: res => {
                            if(res.status === 429) {
                                detailBackoffUntil = Date.now() + 5000;
                                reject(new Error('getDetail 429'));
                                return;
                            }
                            resolve(res)
                        },
                        onerror: err => { reject(err) },
                        ontimeout: () => { reject(new Error('getDetail timeout')) }
                    })
                })
            }
        }
    } else {
        handlers.forEach(h=>{h.canHandle(href) && h.handle(document.location.href)})
    }
})();
