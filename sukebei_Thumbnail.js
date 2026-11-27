// ==UserScript==
// @name         Nyaa.si - 自动加载预览图 (改)
// @namespace    https://github.com/ZiPenOk
// @description  Load image from cover/screenshot links.
// @description:zh-CN  从封面/截图链接加载图片并显示。基于York Wang 0.9.8版本自用修改, 添加更多站点支持
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sukebei.nyaa.si
// @version      2.6.12
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
// @include      /^https://(?:[^/]+\.)?skrepics\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?orangepix\.[^/]+/.*$/
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
// @include      /^https://(?:[^/]+\.)?ria-kurumi\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cn1min\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?kr1min\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?jav1min\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?misa\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?xxxfans\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?myfirsttime\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?stits\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?nudestreet\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?girlxxx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?bbcuck\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?italian18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?french18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?german18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?colombian18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?spanish18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?brazilian18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?2minx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?thaiav\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?hentaishine\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?russian18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?xteen18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?aixxx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?homexxx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?tight-pussy\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?3sporn\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?housewife\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cute-porn\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?indianx\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?african18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?xvintage\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cowgirl18\.[^/]+/.*$/
// @include      /^https://(?:[^/]+\.)?cumshotvid\.[^/]+/.*$/

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
    const imgBobHosts = /^(?:[^/]+\.)?(?:ria-kurumi|cn1min|kr1min|jav1min|misa|xxxfans|myfirsttime|stits|nudestreet|girlxxx|bbcuck|african18|brazilian18|british18|colombian18|cowgirl18|cumshotvid|french18|german18|italian18|spanish18|2minx|thaiav|hentaishine|russian18|xteen18|xvintage|aixxx|homexxx|tight-pussy|3sporn|housewife|cute-porn|indianx|javtele|cn-av|porn-pig|porn4f|hentai4f|javball|ovabee|javbee|idol69|sweetie-fox|javsunday|cnpics|fikfok|cnxx|cosplay18|kin8-av|555fap|4fuk|hentaipig|3minx|fc2ppv|xcamcovid|hentaicovid|chinese-pics|kr-av|anime-jav|hentai-sub|cosplay-xxx|gofile|xxpics|hentaixnx|blackwidof|hentai-manga|1minx|cnxxx|cosplaytele|kin8-jav|old-young|imgo|sht-link|shentai-anime)\.[a-z]+$/i

    const imgBobDirectUrl = url => {
        if(!url) return null
        let parsed
        try { parsed = new URL(url) } catch (e) { return null }
        if(!/^https?:$/.test(parsed.protocol) || !imgBobHosts.test(parsed.hostname)) return null
        const match = parsed.pathname.match(/^\/(upload|t|s|h|c|i|m|img|b|f|g|a|x)\/(?:en\/)?([^/]+\.(?:jpe?g|png|gif|webp))$/i)
        if(!match) return null
        parsed.pathname = '/' + match[1] + '/ib/' + match[2]
        parsed.hash = ''
        return parsed.href
    }

    const isPreviewThumb = url => /(?:_s|-s|_th|\.th)\.(?:jpe?g|png|gif|webp)(?:[?#]|$)/i.test(url || '')
    const isDirectImageUrl = url => /\.(?:jpe?g|png|gif|webp)(?:[?#].*)?$/i.test(url || '')
    const looksLikeImagePageUrl = url => {
        try {
            const path = new URL(url).pathname.toLowerCase()
            return /(?:^|\/)(?:image|images|upload|img|view|viewimage|g|i|m|s|f|b|c|h|t)(?:\/|$)/.test(path)
        } catch(e) {
            return false
        }
    }
    const failureHostFromUrl = url => {
        try {
            return new URL(url).hostname.toLowerCase()
        } catch(e) {
            return ''
        }
    }
    const isKnownDirectImageHost = url => /^https?:\/\/(?:[^/]+\.)?(?:googleusercontent\.com|dmm\.co\.jp|shkong\.com|imgccc\.com|dh666\.top|oceanveil\.net|fumodub\.com)(?:\/|$)/i.test(url || '')
    const preferThumbUrl = (existing, incoming) => {
        if(!incoming) return false
        if(!existing || existing === '__NO_THUMB__') return true
        return isPreviewThumb(existing) && !isPreviewThumb(incoming)
    }
    const sortFullSizeFirst = urls => urls.slice().sort((a, b) => Number(isPreviewThumb(a)) - Number(isPreviewThumb(b)))
    const extractHttpUrls = text => {
        const source = String(text || '')
        const starts = /https?:\/\//gi
        const urls = []
        let found

        while((found = starts.exec(source))) {
            const start = found.index
            let pos = start
            let depth = 0
            while(pos < source.length) {
                const ch = source[pos]
                if(/\s/.test(ch) || ch === '"' || ch === "'" || ch === '<' || ch === '>' || ch === ']') break
                if(ch === '(') depth++
                else if(ch === ')') {
                    if(depth === 0) break
                    depth--
                }
                pos++
            }
            const url = source.slice(start, pos).replace(/[.,;:*]+$/, '')
            if(url && !urls.includes(url)) urls.push(url)
            starts.lastIndex = Math.max(pos, found.index + 1)
        }
        return urls
    }
    const calculatePreviewLayout = (naturalWidth, naturalHeight, maxWidth, maxHeight) => {
        const width = Math.max(1, Number(naturalWidth) || 1)
        const height = Math.max(1, Number(naturalHeight) || 1)
        const availableWidth = Math.max(1, Number(maxWidth) || 1)
        const availableHeight = Math.max(1, Number(maxHeight) || 1)
        const long = height / width >= 1.6

        if(long) {
            return {
                width: Math.round(Math.min(availableWidth, Math.max(280, width))),
                height: Math.round(availableHeight),
                long: true
            }
        }

        const scale = Math.min(1, availableWidth / width, availableHeight / height)
        return {
            width: Math.round(Math.max(1, width * scale)),
            height: Math.round(Math.max(1, height * scale)),
            long: false
        }
    }

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

        const match = html.match(/<img[^>]+src=["'](https?:\/\/(?:[a-z0-9-]+\.)+(?:imagetwist|imagexport|imagenimage|imagehaha)\.[^"']+)["'][^>]*>/i) ||
                      html.match(/<a[^>]+href=["'](https?:\/\/(?:[a-z0-9-]+\.)+(?:imagetwist|imagexport|imagenimage|imagehaha)\.[^"']+)["'][^>]*data-fancybox/i)
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
        const src = img && (toAbsoluteUrl(img.getAttribute('data-src'), base) || toAbsoluteUrl(img.getAttribute('src'), base))
        if(src) return src

        const match = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\/Application\/storage\/app\/public\/uploads\/users\/[^"']+)["']/i) ||
                      html.match(/<img[^>]+src=["']((?:\/[^"']+)?\/Application\/storage\/app\/public\/uploads\/users\/[^"']+)["']/i)
        return match ? toAbsoluteUrl(match[1], base) : null
    }

    const getDirectImageUrl = url => new Promise(resolve => {
        GM_xmlhttpRequest({
            method: 'HEAD',
            url,
            timeout: 5000,
            onload: response => {
                const header = (response.responseHeaders || '').match(/^content-type:\s*([^\r\n]+)/im)
                const contentType = (header && header[1]) || ''
                const finalUrl = response.finalUrl || ''
                resolve(response.status >= 200 && response.status < 300 &&
                    /^image\//i.test(contentType) && /^https?:\/\//i.test(finalUrl) &&
                    (/\/Application\/storage\/app\/public\/uploads\/users\//i.test(finalUrl) ||
                     /\/ib\/[^?#]+\.(?:jpe?g|png|gif|webp)(?:[?#].*)?$/i.test(finalUrl)) ? finalUrl : null)
            },
            onerror: () => resolve(null),
            ontimeout: () => resolve(null)
        })
    })

    const resolveImgBobPage = async (url, callback, attempt = 0) => {
        const direct = imgBobDirectUrl(url)
        if(direct) {
            const imageUrl = await getDirectImageUrl(direct)
            if(imageUrl) {
                callback(imageUrl)
                return
            }
        }
        const html = await doGetHtml(url)
        const src = parseStorageImage(html, url)
        if(src) {
            callback(src)
            return
        }
        const refresh = getMetaRefreshUrl(html, url)
        if(refresh && refresh !== url && attempt < 1) {
            await resolveImgBobPage(refresh, callback, attempt + 1)
        }
    }

    const parseHentaiCoversImage = (html, base) => {
        if(!html) return null

        const doc = new DOMParser().parseFromString(html, 'text/html')
        const meta = doc.querySelector('meta[property="og:image"]')
        const image = doc.querySelector('img[data-media="image"]') ||
                      doc.querySelector('#image-main')
        const src = (meta && meta.getAttribute('content')) ||
                    (image && image.getAttribute('src'))
        return toAbsoluteUrl(src, base)
    }

    const parseSkrepicsImage = (html, base) => {
        if(!html) return null

        const doc = new DOMParser().parseFromString(html, 'text/html')
        const meta = doc.querySelector('meta[property="og:image"]') ||
                     doc.querySelector('meta[name="og:image"]')
        const image = doc.querySelector('img[data-load="full"]')
        const src = (meta && meta.getAttribute('content')) ||
                    (image && image.getAttribute('src'))
        if(src) return toAbsoluteUrl(src, base)

        const match = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        return match ? toAbsoluteUrl(match[1], base) : null
    }

    addHandler(/^https?:\/\/(hentai-covers\.site)\/image\/\w+/, null, async (url, callback) => {
        callback(parseHentaiCoversImage(await doGetHtml(url), url))
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
        const redirect = await doGet(document.location.href, /<center><a href="(https?:\/\/imagetwist\.com(\/[\w-]+)+\.(?:jpe?g|png|gif|webp))"/i)
        document.location.href = redirect + '#' + document.location.href
    })
    addHandler(/^https?:\/\/(imagetwist\.com|imagexport\.com|imagenimage\.com|imagehaha\.com)(\/[\w-.]+)+\.(?:jpe?g|png|gif|webp)#https?:\/\/(imagetwist\.netlify\.app)(\/[\w-]+)+\.(?:jpe?g|png|gif|webp)$/i, callback => {
        const img = document.querySelector('.img-responsive')
        if(img) {
            const referer = document.location.href.split('#')[1]
            callback(img.src, referer)
        }
    })
    addHandler(/^https?:\/\/(imagetwist\.com|imagexport\.com|imagenimage\.com|imagehaha\.com)(\/[\w-.]+)+\.(?:jpe?g|png|gif|webp)$/i, callback => {
        const img = document.querySelector('.img-responsive')
        if(img) {
            callback(img.src)
        }
    }, async (url, callback) => {
        const src = parseImageTwistImage(await doGetHtml(url), url)
        if(src) callback(src)
    })
    addHandler(/^https?:\/\/(?:[^/]+\.)?skrepics\.[^/]+\/image\/[^/?#]+/i, callback => {
        const src = parseSkrepicsImage(document.documentElement.innerHTML, document.location.href)
        if(src) callback(src)
    }, async (url, callback) => {
        const src = parseSkrepicsImage(await doGetHtml(url), url)
        if(src) callback(src)
    })
    addHandler(/^https?:\/\/(?:[^/]+\.)?orangepix\.[^/]+\/image\/[^/?#]+/i, callback => {
        const src = parseSkrepicsImage(document.documentElement.innerHTML, document.location.href)
        if(src) callback(src)
    }, async (url, callback) => {
        const src = parseSkrepicsImage(await doGetHtml(url), url)
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

    // imgbob 系图床（ria-kurumi.vip、cn1min.com、kr1min.com、jav1min.com、misa.homes、xxxfans.org、myfirsttime.vip、stits.vip、nudestreet.vip、girlxxx.vip、bbcuck.com、british18.com、italian18.com、french18.com、german18.com、colombian18.com、spanish18.vip、brazilian18.com 等）：
    // /<route>/ib/<file> 会 301 跳到原图，或直接返回图片；/<route>/<file> 与 /<route>/en/<file> 是查看页，需要抓页面解析出原图。tight-pussy.com 使用 /t/ 路由，3sporn.com、stits.vip、spanish18.vip 使用 /s/ 路由，housewife.homes 使用 /h/ 路由，cute-porn.com、colombian18.com 使用 /c/ 路由，indianx.vip、italian18.com 使用 /i/ 路由，myfirsttime.vip 使用 /m/ 路由，nudestreet.vip 使用 /img/ 路由，british18.com、brazilian18.com 使用 /b/ 路由，french18.com 使用 /f/ 路由，german18.com 使用 /g/ 路由。
    addHandler(/^https?:\/\/(?:[^\/]+\.)?(?:ria-kurumi|cn1min|kr1min|jav1min|misa|xxxfans|myfirsttime|stits|nudestreet|girlxxx|bbcuck|brazilian18|british18|colombian18|french18|german18|italian18|spanish18|2minx|thaiav|hentaishine|russian18|xteen18|aixxx|homexxx|tight-pussy|3sporn|housewife|cute-porn|indianx|javtele|cn-av)\.[a-z]+\/(?:upload|t|s|h|c|i|m|img|b|f|g)\/ib\/[^\/?#]+(?:[?#].*)?$/i, null, async (url, callback) => {
        const imageUrl = await getDirectImageUrl(url)
        if(imageUrl) callback(imageUrl)
    })
    addHandler(/^https?:\/\/(?:[^\/]+\.)?(?:ria-kurumi|cn1min|kr1min|jav1min|misa|xxxfans|myfirsttime|stits|nudestreet|girlxxx|bbcuck|brazilian18|british18|colombian18|french18|german18|italian18|spanish18|2minx|thaiav|hentaishine|russian18|xteen18|aixxx|homexxx|tight-pussy|3sporn|housewife|cute-porn|indianx|javtele|cn-av)\.[a-z]+\/(?:upload|t|s|h|c|i|m|img|b|f|g)\/(?:en\/)?[^\/?#]+(?:[?#].*)?$/i, callback => {
        const img = document.querySelector('.fileviewer-file img') ||
                    document.querySelector('#fileOriginalModal img')
        if(img && img.src) callback(img.src)
    }, async (url, callback) => {
        await resolveImgBobPage(url, callback)
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
        'shentai-anime\\.[a-z]+',
        'african18\\.[a-z]+',
        'xvintage\\.[a-z]+',
        'cowgirl18\\.[a-z]+',
        'cumshotvid\\.[a-z]+'
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
                await resolveImgBobPage(url, callback)
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
        const SEEN_PREFIX = 'lmt_seen_'
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
        const seenKeys = () => {
            const keys = []
            for(let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if(k && k.indexOf(SEEN_PREFIX) === 0) keys.push(k)
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
            const viewed = seenKeys()
            keys.forEach(k => localStorage.removeItem(k))
            viewed.forEach(k => localStorage.removeItem(k))
            alert('已清空缩略图缓存和查看状态，共 ' + keys.length + ' 条')
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
        const markerIDFromAnchor = a => {
            const match = String(a && a.href || '').match(/\/view\/([A-Za-z0-9_-]+)/)
            return match ? match[1] : ''
        }
        const isThumbSeen = id => {
            if(!id) return false
            try { return localStorage.getItem(SEEN_PREFIX + id) === '1' } catch(e) { return false }
        }
        const markThumbSeen = id => {
            if(!id) return
            try { localStorage.setItem(SEEN_PREFIX + id, '1') } catch(e) {}
        }
        const paintThumbMarker = (span, id) => {
            const seen = isThumbSeen(id)
            span.textContent = seen ? '✅' : '🖼️'
            span.title = seen ? '已查看预览，点击再次打开图片' : '悬停预览，点击查看图片'
            span.setAttribute('aria-label', seen ? '已查看图片，再次打开' : '查看图片')
            span.dataset.viewed = seen ? '1' : '0'
        }
        const upsertThumbMarker = (a, url) => {
            if(!a || !url) return
            const oldUrl = a.dataset.lmt
            const id = markerIDFromAnchor(a)
            a.dataset.lmt = url
            clearTimeout(a._lmtFallbackTimer)
            a._lmtFallbackTimer = null

            let span = oldUrl ? document.querySelector(`span[data-lmt="${decodeURI(oldUrl)}"]`) : null
            if(!span && a.previousElementSibling && a.previousElementSibling.dataset && a.previousElementSibling.dataset.lmt) {
                span = a.previousElementSibling
            }
            if(!span) {
                span = document.createElement("span")
                span.style.cursor = 'pointer'
                span.style.userSelect = 'none'
                span.setAttribute('role', 'button')
                span.addEventListener('click', e => {
                    e.preventDefault()
                    e.stopPropagation()
                    markThumbSeen(span.dataset.lmtId)
                    paintThumbMarker(span, span.dataset.lmtId)
                    if(span.dataset.lmt) openLightbox(span.dataset.lmt)
                })
                a.before(span)
            }
            span.dataset.lmtId = id
            span.dataset.lmt = url
            paintThumbMarker(span, id)
        }

        let LMT_Wrap, LMT_Frame, LMT_Loading, LMT_panel, LMT_img, LMT_Status, LMT_Hint
        let LMT_resolveLink = null
        let LMT_mouseX = 0
        let LMT_mouseY = 0
        let panelWidth = 480
        let panelHeight = 600
        let LMT_previewPan = 0
        const previewViewportBounds = () => ({
            width: Math.max(160, Math.min(480, windowWidth - 20)),
            height: Math.max(160, Math.min(600, windowHeight - 40))
        })
        const fitPreviewPanel = (naturalWidth, naturalHeight) => {
            const bounds = previewViewportBounds()
            const layout = calculatePreviewLayout(naturalWidth, naturalHeight, bounds.width, bounds.height)
            panelWidth = layout.width
            panelHeight = layout.height
            LMT_panel.style.width = `${panelWidth}px`
            LMT_panel.style.height = `${panelHeight}px`
            LMT_panel.dataset.long = layout.long ? '1' : '0'
            LMT_panel.dataset.naturalWidth = String(naturalWidth || 0)
            LMT_panel.dataset.naturalHeight = String(naturalHeight || 0)
            LMT_img.style.objectFit = layout.long ? 'cover' : 'contain'
            LMT_img.style.objectPosition = layout.long ? `center ${LMT_previewPan}%` : 'center'
            LMT_Hint.textContent = layout.long
                ? '长图 · 滚轮浏览 · 点击 🖼️ 看完整图片'
                : '点击 🖼️ 查看图片'
            LMT_Hint.style.display = 'block'
            movePreviewPanel()
        }
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
            LMT_panel.style.backgroundRepeat = 'no-repeat'
            LMT_panel.style.backgroundPosition = 'center'
            LMT_panel.style.border = '1px solid #ddd'
            LMT_panel.style.borderRadius = '6px'
            LMT_panel.style.boxShadow = '0 2px 12px rgba(0,0,0,.18)'
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
                if(LMT_Hint) LMT_Hint.style.display = 'none'
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
            LMT_Status.style.zIndex = '2'
            LMT_panel.appendChild(LMT_Status)

            LMT_Hint = document.createElement('div')
            LMT_Hint.style.position = 'absolute'
            LMT_Hint.style.right = '8px'
            LMT_Hint.style.bottom = '8px'
            LMT_Hint.style.maxWidth = 'calc(100% - 16px)'
            LMT_Hint.style.padding = '4px 7px'
            LMT_Hint.style.borderRadius = '4px'
            LMT_Hint.style.background = 'rgba(0,0,0,.72)'
            LMT_Hint.style.color = '#fff'
            LMT_Hint.style.fontSize = '11px'
            LMT_Hint.style.lineHeight = '1.35'
            LMT_Hint.style.display = 'none'
            LMT_Hint.style.zIndex = '3'
            LMT_panel.appendChild(LMT_Hint)

            LMT_Frame = document.createElement('iframe')
            LMT_Frame.id = 'LMT_Frame'
            LMT_Frame.sandbox = 'allow-forms allow-scripts allow-same-origin'
            LMT_Frame.style.display = 'none'
            document.body.appendChild(LMT_Frame)
        }

        let LMT_lightbox, LMT_lightboxShadow, LMT_lightboxImg, LMT_lightboxStage, LMT_lightboxMeta
        let LMT_lightboxLink, LMT_lightboxLoading, LMT_lightboxError
        let LMT_lightboxSeq = 0
        let LMT_lightboxNaturalWidth = 0
        let LMT_lightboxNaturalHeight = 0
        let LMT_lightboxMode = null
        let LMT_bodyOverflowBeforeLightbox = ''
        const lightboxFont = '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif'

        function ensureLightbox() {
            if(LMT_lightbox) return

            LMT_lightbox = document.createElement('div')
            LMT_lightbox.id = 'LMT_Lightbox'
            LMT_lightbox.style.position = 'fixed'
            LMT_lightbox.style.inset = '0'
            LMT_lightbox.style.zIndex = '2147483647'
            LMT_lightbox.style.display = 'none'
            LMT_lightboxShadow = LMT_lightbox.attachShadow({ mode: 'open' })
            LMT_lightboxShadow.innerHTML = `
                <style>
                    :host { all: initial; }
                    * { box-sizing: border-box; }
                    .backdrop { position: fixed; inset: 0; background: rgba(6, 8, 11, .92); backdrop-filter: blur(3px); }
                    .shell { position: fixed; inset: 0; display: flex; flex-direction: column; color: #f3f4f6; font-family: ${lightboxFont}; }
                    .bar { position: relative; z-index: 2; flex: 0 0 56px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 16px 0 20px; background: rgba(18, 21, 26, .96); border-bottom: 1px solid rgba(255,255,255,.1); }
                    .title-wrap { min-width: 0; }
                    .title { font-size: 14px; font-weight: 650; line-height: 1.3; }
                    .meta { margin-top: 3px; color: #aab3c0; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .actions { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; }
                    .actions button, .actions a { appearance: none; height: 31px; padding: 0 10px; border: 1px solid rgba(255,255,255,.14); border-radius: 6px; background: #252a32; color: #e9edf2; font: 12px/29px ${lightboxFont}; text-decoration: none; cursor: pointer; }
                    .actions button:hover, .actions a:hover { background: #343b46; }
                    .stage { position: relative; flex: 1 1 auto; overflow: auto; padding: 24px; text-align: center; overscroll-behavior: contain; scrollbar-color: #5c6572 #12151a; }
                    img { display: none; max-width: none; margin: 0 auto; border-radius: 4px; box-shadow: 0 12px 50px rgba(0,0,0,.52); user-select: none; }
                    .loading, .error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #aeb7c4; font-size: 13px; pointer-events: none; }
                    .error { display: none; color: #ffb4b4; }
                    .footer { flex: 0 0 28px; display: flex; align-items: center; justify-content: center; color: #8f99a7; background: rgba(12, 14, 18, .92); font-size: 11px; }
                </style>
                <div class="backdrop"></div>
                <div class="shell" role="dialog" aria-modal="true" aria-label="图片预览">
                    <div class="bar">
                        <div class="title-wrap">
                            <div class="title">图片预览</div>
                            <div class="meta">正在加载...</div>
                        </div>
                        <div class="actions">
                            <a data-open href="#" target="_blank" rel="noopener noreferrer">新标签打开</a>
                        </div>
                    </div>
                    <div class="stage"><img alt="预览图" title="单击切换整图与 1:1"><div class="loading">加载中...</div><div class="error">图片加载失败</div></div>
                    <div class="footer">单击图片切换整图 / 1:1 · 滚轮滚动查看 · Esc 关闭</div>
                </div>
            `
            document.body.appendChild(LMT_lightbox)

            LMT_lightboxStage = LMT_lightboxShadow.querySelector('.stage')
            LMT_lightboxStage.tabIndex = -1
            LMT_lightboxImg = LMT_lightboxShadow.querySelector('img')
            LMT_lightboxMeta = LMT_lightboxShadow.querySelector('.meta')
            LMT_lightboxLink = LMT_lightboxShadow.querySelector('[data-open]')
            LMT_lightboxLoading = LMT_lightboxShadow.querySelector('.loading')
            LMT_lightboxError = LMT_lightboxShadow.querySelector('.error')

            LMT_lightboxImg.onload = () => {
                if(!LMT_lightboxImg.naturalWidth || !LMT_lightboxImg.naturalHeight) return
                LMT_lightboxNaturalWidth = LMT_lightboxImg.naturalWidth
                LMT_lightboxNaturalHeight = LMT_lightboxImg.naturalHeight
                LMT_lightboxImg.style.display = 'block'
                LMT_lightboxLoading.style.display = 'none'
                LMT_lightboxError.style.display = 'none'
                LMT_lightboxMeta.textContent = `${LMT_lightboxNaturalWidth} × ${LMT_lightboxNaturalHeight}`
                if(!LMT_lightboxMode) LMT_lightboxMode = 'actual'
                applyLightboxMode(LMT_lightboxMode)
            }
            LMT_lightboxImg.onerror = () => {
                if(LMT_lightbox.style.display === 'none') return
                LMT_lightboxImg.style.display = 'none'
                LMT_lightboxLoading.style.display = 'none'
                LMT_lightboxError.style.display = 'flex'
            }
            LMT_lightboxImg.addEventListener('click', e => {
                if(e.detail > 1) return
                toggleLightboxZoom()
            })

            LMT_lightboxShadow.querySelector('.backdrop').addEventListener('click', closeLightbox)
            LMT_lightboxStage.addEventListener('click', e => {
                if(e.target === LMT_lightboxStage) closeLightbox()
            })
            unsafeWindow.addEventListener('resize', () => {
                if(LMT_lightbox.style.display !== 'none' && LMT_lightboxNaturalWidth) applyLightboxMode(LMT_lightboxMode)
            })
            document.addEventListener('keydown', e => {
                if(LMT_lightbox.style.display === 'none') return
                if(e.key === 'Escape') {
                    e.preventDefault()
                    closeLightbox()
                }
            }, true)
        }

        function applyLightboxMode(mode) {
            if(!LMT_lightboxImg || !LMT_lightboxNaturalWidth || !LMT_lightboxNaturalHeight) return
            LMT_lightboxMode = mode === 'actual' ? 'actual' : 'fit'
            const availableWidth = Math.max(120, LMT_lightboxStage.clientWidth - 48)
            const availableHeight = Math.max(120, LMT_lightboxStage.clientHeight - 48)
            LMT_lightboxImg.style.maxWidth = 'none'
            LMT_lightboxImg.style.maxHeight = 'none'
            LMT_lightboxImg.style.cursor = LMT_lightboxMode === 'actual' ? 'zoom-out' : 'zoom-in'

            if(LMT_lightboxMode === 'actual') {
                LMT_lightboxImg.style.width = `${LMT_lightboxNaturalWidth}px`
                LMT_lightboxImg.style.height = 'auto'
            } else {
                LMT_lightboxImg.style.width = 'auto'
                LMT_lightboxImg.style.height = 'auto'
                LMT_lightboxImg.style.maxWidth = `${availableWidth}px`
                LMT_lightboxImg.style.maxHeight = `${availableHeight}px`
            }

            LMT_lightboxStage.scrollTop = 0
            LMT_lightboxStage.scrollLeft = 0
        }

        function toggleLightboxZoom() {
            if(!LMT_lightboxNaturalWidth || !LMT_lightboxNaturalHeight) return
            applyLightboxMode(LMT_lightboxMode === 'actual' ? 'fit' : 'actual')
        }

        function openLightbox(url) {
            if(!url) return
            ensureLightbox()
            hidePreviewPanel()

            if(LMT_lightbox.style.display === 'none') {
                LMT_bodyOverflowBeforeLightbox = document.body.style.overflow
            }
            LMT_lightbox.style.display = 'block'
            document.body.style.overflow = 'hidden'

            const seq = ++LMT_lightboxSeq
            LMT_lightboxMode = null
            LMT_lightboxNaturalWidth = 0
            LMT_lightboxNaturalHeight = 0
            LMT_lightboxMeta.textContent = '正在加载...'
            LMT_lightboxImg.style.display = 'none'
            LMT_lightboxImg.style.width = 'auto'
            LMT_lightboxImg.style.height = 'auto'
            LMT_lightboxImg.style.maxWidth = 'none'
            LMT_lightboxImg.style.maxHeight = 'none'
            LMT_lightboxLoading.style.display = 'flex'
            LMT_lightboxError.style.display = 'none'
            LMT_lightboxLink.href = url
            LMT_lightboxImg.src = url

            setTimeout(() => {
                if(seq === LMT_lightboxSeq) LMT_lightboxStage.focus()
            }, 0)
        }

        function closeLightbox() {
            if(!LMT_lightbox) return
            LMT_lightboxSeq++
            LMT_lightbox.style.display = 'none'
            document.body.style.overflow = LMT_bodyOverflowBeforeLightbox
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
                img.style.cursor = 'zoom-in'
                img.title = '点击查看图片'
                img.addEventListener('click', () => openLightbox(img.src))
                LMT_Wrap.appendChild(img)
            }
            if(e.data.LMT_SRC) {
                const url_src = e.data.LMT_SRC.toLowerCase()
                imgPending.delete(url_src)
                const a = document.querySelector(`a[data-lmt-src="${decodeURI(url_src)}"]`)
                if(a) {
                    delete a.dataset.lmtStale
                    delete a.dataset.lmtNoThumb
                    upsertThumbMarker(a, e.data.LMT)

                    // 详情页按当前种子 ID 回写云端；已有真实缩略图时不覆盖
                    const detailMatch = document.location.href.match(/^https?:\/\/(?:[^/]+\.)?sukebei\.nyaa\.si\/view\/(\d+)/i)
                    if(detailMatch) {
                        const id = detailMatch[1]
                        const existing = getLocalThumb(id)
                        if(preferThumbUrl(existing, e.data.LMT)) {
                            saveThumb(id, e.data.LMT)
                            setLocalThumb(id, e.data.LMT)
                        }
                    } else if(/^https?:\/\/(sukebei\.nyaa\.si\/view\/).+/g.test(a.href)) {
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
            if(LMT_panel.dataset.visible === '1' && LMT_panel.dataset.naturalWidth) {
                fitPreviewPanel(Number(LMT_panel.dataset.naturalWidth), Number(LMT_panel.dataset.naturalHeight))
            }
        })
        const movePreviewPanel = e => {
            if(e) {
                LMT_mouseX = e.clientX
                LMT_mouseY = e.clientY
            }
            if(LMT_panel.dataset.visible === '1') {
                const offset = 20
                const currentWidth = LMT_panel.offsetWidth || panelWidth
                const currentHeight = LMT_panel.offsetHeight || panelHeight
                const panelRightEdge = LMT_mouseX + offset + currentWidth
                const panelBottomEdge = LMT_mouseY + offset + currentHeight

                let newLeft = LMT_mouseX + offset
                if(panelRightEdge > windowWidth) {
                    newLeft = LMT_mouseX - offset - currentWidth
                }
                newLeft = Math.max(5, Math.min(newLeft, windowWidth - currentWidth - 5))

                let newTop = LMT_mouseY + offset
                if(panelBottomEdge > windowHeight) {
                    newTop = LMT_mouseY - offset - currentHeight
                }
                newTop = Math.max(5, Math.min(newTop, windowHeight - currentHeight - 5))

                LMT_panel.style.left = newLeft + 'px'
                LMT_panel.style.top = newTop + 'px'
            }
        }
        const hidePreviewPanel = () => {
            LMT_panel.dataset.visible = '0'
            LMT_panel.style.top = '-1000px'
            LMT_panel.style.left = '-1000px'
            LMT_panel.style.backgroundImage = ''
            LMT_img.style.display = 'none'
            LMT_img.style.objectPosition = 'center'
            LMT_previewPan = 0
            if(LMT_Status) LMT_Status.style.display = 'none'
            if(LMT_Hint) LMT_Hint.style.display = 'none'
        }
        const showPreview = (a, e) => {
            if(!a || !a.dataset.lmt) return
            if(!a.href && a.nextElementSibling && a.nextElementSibling.dataset && a.nextElementSibling.dataset.lmt) {
                a = a.nextElementSibling
            }

            const url = a.dataset.lmt
            const seq = String(Date.now()) + Math.random()
            LMT_previewPan = 0
            LMT_panel.dataset.visible = '1'
            LMT_panel.dataset.seq = seq
            LMT_panel.dataset.activeHref = a.href || ''
            LMT_panel.dataset.src = url
            LMT_panel.style.backgroundImage = ''
            LMT_img.style.display = 'none'
            LMT_img.style.objectPosition = 'center'
            LMT_Hint.style.display = 'none'
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
                fitPreviewPanel(probe.naturalWidth, probe.naturalHeight)
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
                LMT_Hint.style.display = 'none'
                requestStaleRefresh()
            }
            const refreshTimer = setTimeout(() => {
                if(probeDone) return
                if(LMT_panel.dataset.seq !== seq || LMT_panel.dataset.src !== url) return
                a.dataset.lmtStale = '1'
                LMT_Status.innerText = 'Refreshing...'
                LMT_Status.style.display = 'flex'
                LMT_Hint.style.display = 'none'
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
        unsafeWindow.addEventListener('wheel', function (e) {
            if(e.ctrlKey || LMT_panel.dataset.visible !== '1' || LMT_panel.dataset.long !== '1') return
            const naturalWidth = Number(LMT_panel.dataset.naturalWidth || 0)
            const naturalHeight = Number(LMT_panel.dataset.naturalHeight || 0)
            if(!naturalWidth || !naturalHeight) return

            const renderedHeight = LMT_panel.clientWidth * naturalHeight / naturalWidth
            const overflow = renderedHeight - LMT_panel.clientHeight
            if(overflow <= 1) return

            let delta = e.deltaY
            if(e.deltaMode === 1) delta *= 16
            else if(e.deltaMode === 2) delta *= LMT_panel.clientHeight
            LMT_previewPan = Math.max(0, Math.min(100, LMT_previewPan + delta / overflow * 100))
            LMT_img.style.objectPosition = `center ${LMT_previewPan}%`
            e.preventDefault()
        }, { passive: false })

        const CLOUD_URLS = [
            'https://sukebei.cfyan.cc.cd'
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
        const saveImageFailure = (id, host, reason) => {
            if(!id || !host) return
            CLOUD_URLS.forEach(cloudUrl => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${cloudUrl}/failure/${encodeURIComponent(id)}`,
                    data: JSON.stringify({ host: host, reason: reason || 'unsupported image host' }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
            })
        }
        const reportedImageFailures = new Set()
        const reportImageFailure = (id, url) => {
            const host = failureHostFromUrl(url)
            if(!id || !host) return
            const key = id + '\x00' + host
            if(reportedImageFailures.has(key)) return
            reportedImageFailures.add(key)
            saveImageFailure(id, host, 'unsupported image host')
        }

        if(/^https?:\/\/(sukebei\.nyaa\.si\/view\/).+/g.test(href)) {
            const desc = document.querySelector('#torrent-description')
            if(!desc) return

            const links = desc.querySelectorAll('a')
            const detailID = href.substr(href.lastIndexOf('/')+1)
            const externalUrls = extractHttpUrls(desc.innerHTML)
                .filter(url => url.indexOf('nyaa.si') < 0)
            if(!externalUrls.length) {
                const alreadyNoThumb = getLocalThumb(detailID) === NO_THUMB
                setLocalThumb(detailID, NO_THUMB)
                if(!alreadyNoThumb) saveThumb(detailID, NO_THUMB)
            }

            const linkList = sortFullSizeFirst(Array.apply(null, links).filter(link => link.href))
            linkList.forEach(link => {
                link.dataset.lmtSrc = decodeURI(link.href)
                handlers.forEach(h => {
                    if(h.canHandle(link.href)) {
                        link.dataset.lmtSrc = link.href.toLowerCase()
                        addToImgQueue({href:link.href,handler:h})
                    }
                })
            })
            const hasSupportedCandidate = externalUrls.some(url =>
                handlers.some(h => h.canHandle(url)) || isDirectImageUrl(url))
            if(!hasSupportedCandidate) {
                externalUrls.forEach(url => {
                    if(!isDirectImageUrl(url) && looksLikeImagePageUrl(url)) {
                        reportImageFailure(detailID, url)
                    }
                })
            }

            if(!LMT_Frame) {
                createWrap(desc)
            }
            createPanel()
        } else {
            const links = document.querySelectorAll('.torrent-list>tbody>tr>td:nth-child(2) a[href^="/view/"]')
            const linksArr = Array.apply(null, links)
            const idOf = a => a.href.substr(a.href.lastIndexOf('/')+1)
            const isResolvedImageUrl = url => {
                return /^data:image\//i.test(url) ||
                       /\/Application\/storage\/app\/public\/uploads\/users\//i.test(url) ||
                       /\/ib\/[^?#]+\.(?:jpe?g|png|gif|webp)(?:[?#].*)?$/i.test(url)
            }
            const handlerFor = url => {
                for(let i in handlers) {
                    if(handlers[i].canHandle(url)) return handlers[i]
                }
                return null
            }
            const markNoThumb = (link, id, report = false) => {
                if(!link || !id) return
                link.dataset.lmtSrc = '#'
                link.dataset.lmtNoThumb = '1'
                setLocalThumb(id, NO_THUMB)
                if(report) saveThumb(id, NO_THUMB)
            }
            const acceptDirectImage = (a, url) => {
                a.dataset.lmtSrc = url.toLowerCase()
                if(/^data:image\//i.test(url)) {
                    unsafeWindow.top.postMessage({"LMT": url, "LMT_SRC": url}, '*')
                    return
                }
                preloadImage(url, 4500).then(ok => {
                    if(!ok || a.dataset.lmtSrc !== url.toLowerCase()) return
                    unsafeWindow.top.postMessage({"LMT": url, "LMT_SRC": url}, '*')
                })
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
                    acceptDirectImage(a, url)
                    return true
                }

                if(isDirectImageUrl(url)) {
                    acceptDirectImage(a, url)
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
            // 查找顺序：本地缓存 → 云端；云端未命中时保持空白，等待 hover 按需解析
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
                getThumbs(ids).then(thumbs => {
                    thumbs = thumbs || []
                    cloudLinks.forEach((link, i) => {
                        const url = thumbs[i]
                        if(url) tryPlace(link, url, idOf(link))
                        // 云端未命中时不主动爬取，等待用户 hover 后按需解析
                    })
                })
            }

            // 按需解析单个种子：抓详情页 → 匹配图床链接 → 入队加载
            const resolveLink = async (a, force = false) => {
                if(!a || !a.href || a.dataset.lmtPending || a._lmtFallbackTimer) return
                if(a.dataset.lmtNoThumb === '1') return
                if(!force && a.dataset.lmt) return
                if(!force && a.dataset.lmtSrc === '#') return
                if(!force && a.dataset.lmtSrc && imgPending.has(a.dataset.lmtSrc)) return
                if(!/.*\/view\/\d+$/.test(a.href)) return

                a.dataset.lmtPending = '1'
                const unlock = await lock()
                if(a.dataset.lmtNoThumb === '1') { unlock(); delete a.dataset.lmtPending; return }
                if(!force && a.dataset.lmt) { unlock(); delete a.dataset.lmtPending; return }
                if(!force && a.dataset.lmtSrc === '#') { unlock(); delete a.dataset.lmtPending; return }
                if(!force && a.dataset.lmtSrc && imgPending.has(a.dataset.lmtSrc)) { unlock(); delete a.dataset.lmtPending; return }

                let detail
                try { detail = await getDetail(a.href) } catch(err) { unlock(); delete a.dataset.lmtPending; return }
                unlock()
                delete a.dataset.lmtPending
                if(a.dataset.lmtNoThumb === '1') return
                if(!force && a.dataset.lmt) return
                if(!force && a.dataset.lmtSrc === '#') return
                if(!force && a.dataset.lmtSrc && imgPending.has(a.dataset.lmtSrc)) return

                let candidates = []
                let imgs = detail.responseText.match(/]\((https?:\/\/[^\s]+)/)
                if(imgs) {
                    const imageUrls = extractHttpUrls(imgs[1])
                    if(imageUrls[0] && imageUrls[0].indexOf('nyaa.si') < 0) candidates.push(imageUrls[0])
                }

                let desc = detail.responseText.match(/<div\b[^>]*id=["']torrent-description["'][^>]*>([\s\S]*?)<\/div>/i)
                desc = (desc ? desc[1] : detail.responseText)
                    .replaceAll('&#10;', '\n')
                    .replaceAll(')]', ' )]')
                    .replaceAll('\*\*', ' \*\* ')
                let hrefs = extractHttpUrls(desc)
                let info = detail.responseText.match(/noopener noreferrer nofollow" href="(https?:\/\/.+?)"/)
                if(info) hrefs = [...hrefs, info[1]]
                let comments = detail.responseText.match(/id="torrent-comment\d+">(https?:\/\/.+?)(&#10;.*)*<\/div>/)
                if(comments) hrefs = [...hrefs, comments[1]]
                for (let href of hrefs) {
                    if (href.indexOf('nyaa.si') >= 0) continue
                    if (href.trim() === 'https://manko.fun') {
                        const match = desc.match(/(https?:\/\/.+?)\)\]\(https:\/\/manko\.fun\)/)
                        if(!match) continue
                        href = 'https://manko.fun|' + match[1].trim()
                    }
                    candidates.push(href)
                }
                candidates = sortFullSizeFirst([...new Set(candidates)])

                let supportedCandidateCount = 0
                const unsupportedImageUrls = []
                candidates.forEach(url => {
                    const looksLikePage = looksLikeImagePageUrl(url)
                    if(handlerFor(url) || isResolvedImageUrl(url) || isKnownDirectImageHost(url) || (isDirectImageUrl(url) && !looksLikePage)) {
                        supportedCandidateCount++
                    } else if(looksLikePage) {
                        unsupportedImageUrls.push(url)
                    }
                })

                const finishCandidates = link => {
                    if(unsupportedImageUrls.length) {
                        unsupportedImageUrls.forEach(url => reportImageFailure(idOf(link), url))
                        link.dataset.lmtSrc = '#'
                        return
                    }
                    if(supportedCandidateCount > 0 || candidates.length === 0) {
                        markNoThumb(link, idOf(link), true)
                    } else {
                        link.dataset.lmtSrc = '#'
                    }
                }

                const tryCandidate = index => {
                    if(index >= candidates.length) {
                        finishCandidates(a)
                        return
                    }
                    if(!resolveCandidateUrl(a, candidates[index], force)) {
                        tryCandidate(index + 1)
                        return
                    }
                    a._lmtFallbackTimer = setTimeout(() => {
                        a._lmtFallbackTimer = null
                        if(a.dataset.lmt) return
                        tryCandidate(index + 1)
                    }, 5000)
                }
                tryCandidate(0)
            }
            // hover 时按需抓取详情页并解析图床（与原版一致）
            LMT_resolveLink = resolveLink
            document.querySelector('.torrent-list').addEventListener('mouseover', (e) => resolveLink(e.target))
            createPanel()

            // 与原版一致：详情页请求串行化，避免同时触发大量请求
            let isLock = false
            const lockList = []
            async function lock() {
                function unlock() {
                    const waitFunc = lockList.shift()
                    if(waitFunc) {
                        waitFunc.resolve(unlock)
                    } else {
                        isLock = false
                    }
                }
                if(isLock) {
                    return new Promise(resolve => {
                        lockList.push({ resolve })
                    })
                }
                isLock = true
                return unlock
            }
            const getDetail = url => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        timeout: 8000,
                        onload: res => {
                            if(res.status === 429) {
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
