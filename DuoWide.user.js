// ==UserScript==
// @name         DuoWide
// @namespace    https://github.com/hyungchulc/duowide
// @version      1.6.5
// @description  Lets web pages use the whole iPhone Duo outer screen in Safari, under the side strip, and keeps what you tap clear of the strip.
// @author       hyungchulc
// @homepageURL  https://github.com/hyungchulc/duowide
// @supportURL   https://github.com/hyungchulc/duowide/issues
// @updateURL    https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js
// @downloadURL  https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js
// @license      MIT
// @match        *://*/*
// @run-at       document-start
// @noframes
// @inject-into  content
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

(() => {
  "use strict";

  // Settings. An update replaces this file, so set them again after one.
  // 설정. 업데이트하면 이 파일이 새로 바뀌니 다시 정해 주세요.
  const CONFIG = {
    skip: [],          // Sites to leave as they are, e.g. "example.com" (its subdomains too). 넓히지 않을 사이트(하위 도메인도 같이).
    landscape: false,  // Widen in landscape too; not supported yet. 가로에서도 넓힐지(아직 지원 전).
    left: false,       // With landscape on, widen when the strip is on the left too. 가로를 켰을 때 버튼 줄이 왼쪽이어도 넓힐지.
    bar: true,         // Hide iOS's sideways scroll bar and draw the up-and-down one in its place. 아래 가로 스크롤 막대를 없앨지.
  };

  if (window.top !== window.self || window.__duoWideLoaded) return;
  window.__duoWideLoaded = true;
  const site = location.hostname.replace(/^www\./, "");
  if (CONFIG.skip.some((d) => site === d || site.endsWith("." + d))) return;
  // Safari keeps its controls in a side strip only on a phone's screen.
  if (!matchMedia("(pointer: coarse)").matches || !/iPhone/.test(navigator.userAgent)) return;

  const STRIP = [40, 120];  // a gap this wide is Safari's control strip; a wider one is a window beside another app
  const TAP = 28;           // how much of a control has to stay clear of the strip to be tapped: Apple's smallest button
  const MARK = "data-duowide";
  const BAR = MARK + "-bar";  // on <html> while the page's scroll bars are ours
  const RATIO = MARK + "-ratio";  // on <html> while widened: the whole screen over the part shown (see scriptWidth)
  const dbg = window.__duoWideDebug;  // tests: { strip: { side, gap, full } } stands in for the measured strip
  // DuoWide-WideText.user.js, while it is on in the Userscripts menu, asks for lines of words to run on under the strip
  // too (see fitLines). Userscripts runs it in this same content world, before or after this script.
  const wideText = () => window.__duoWideText === "wide";

  const store = {
    async get(key, fallback) {
      try { if (typeof GM !== "undefined" && GM && GM.getValue) return await GM.getValue(key, fallback); } catch (e) { /* fall through */ }
      try { const v = localStorage.getItem("duoWide:" + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    async set(key, value) {
      try { if (typeof GM !== "undefined" && GM && GM.setValue) return await GM.setValue(key, value); } catch (e) { /* fall through */ }
      try { localStorage.setItem("duoWide:" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
  };

  // ---------- where Safari's strip is ----------

  let stripPhone = false;  // this phone has shown the strip upright, so a landscape gap is the strip too (not a notch)

  // Safari's page zoom (aA in the address bar, or Settings > Apps > Safari > Page Zoom: 50% to 300%) lays a page out in
  // that many fewer or more CSS pixels and shows it scaled by as much, so the page's lengths are no longer points: at
  // 115% it counts 332 where the strip leaves 382 points clear, and a page laid out 466 wide would run 70 points past
  // the screen. visualViewport.scale counts the zoom, the scale the viewport tag asks for and a pinch together, and
  // 100vw counts the clear part over the first two only: a pinch is how much wider 100vw is than the part shown
  // (visualViewport.width), and what is left of the scale after the pinch and the tag's is the zoom. (A zoom made with
  // CSS zoom instead, as an app's WKWebView pageZoom does, leaves the scale alone and multiplies the pixel ratio: 3.45
  // at 115% on the phone's 3x screen.) `shown` is the width of the part shown, in points.
  function scales() {
    const v = window.visualViewport, w = viewWidth(), r = devicePixelRatio;
    const css = Math.abs(r - Math.round(r)) > 0.01 ? r / 3 : 1;
    if (!v) return { zoom: css, view: 1, pinch: 1, shown: innerWidth * css };
    const shown = v.width * v.scale * css;
    if (!w) return { zoom: css, view: 1, pinch: v.scale, shown };  // (100vw not read: as if Safari did not zoom)
    const pinch = w / v.width, view = v.scale / pinch / tagScale();
    return { zoom: view * css, view, pinch, shown };
  }
  // 100vw in CSS pixels, read off a length property of ours that our sheet sets to it on <html> (see wholeScreen).
  const VIEW = "--duowide-view";
  try { CSS.registerProperty({ name: VIEW, syntax: "<length>", inherits: false, initialValue: "0px" }); } catch (e) { /* (there already) */ }
  function viewWidth() {
    const v = getComputedStyle(document.documentElement).getPropertyValue(VIEW).trim();
    return v.endsWith("px") ? parseFloat(v) : 0;
  }
  // The scale the viewport tag Safari goes by asks for: the page's own, or ours (1).
  function tagScale() {
    const t = own || meta || viewportTag();
    const k = parseFloat(parse(t && t.getAttribute("content")).get("initial-scale"));
    return k > 0 ? k : 1;
  }

  // Safari reports the part of the page it shows as the visual viewport and the folded screen as screen.width/height,
  // before and after the page is widened. The strip sits on the camera side: right when upright or turned with the
  // camera down, left when turned the other way. Pinched, or on the way back out, the page is left as it is (see
  // passing). What this returns is in the page's CSS pixels, but `width`, the width for the viewport tag.
  const zoomed = () => !!window.visualViewport && Math.abs(scales().pinch - 1) > 0.01;
  function detect() {
    if (zoomed()) return null;
    if (dbg && dbg.strip) return { zoom: 1, width: dbg.strip.full, ...dbg.strip };
    const type = (screen.orientation && screen.orientation.type) || "";
    const o = innerWidth > innerHeight ? "landscape" : "portrait";
    if (!type.startsWith(o)) return null;  // a window beside another app on an unfolded screen
    if (o === "landscape" && !CONFIG.landscape) return null;  // turned sideways: Safari's own layout unless asked for
    const side = type === "portrait-primary" || type === "landscape-secondary" ? "right" : type === "landscape-primary" ? "left" : null;
    // A strip on the left hides where lines begin, and keeping them clear of it would push the whole page back over:
    // Safari's own layout, which starts after it, is left as it is unless asked for.
    if (!side || (side === "left" && !CONFIG.left)) return null;
    const full = o === "landscape" ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    const { zoom, view, shown } = scales();
    const gap = full - shown;
    if (gap < STRIP[0] || gap > STRIP[1]) return null;
    if (o === "portrait" && !stripPhone) { stripPhone = true; store.set("stripPhone", true); }
    if (o === "landscape" && !stripPhone) return null;
    // The tag gives the screen over the scale Safari zooms the view by (a CSS zoom takes the tag's numbers as points),
    // and the visible page's height, which Safari's bars change.
    const width = Math.round(full / view);
    return { side, gap: gap / zoom, full: (width * view) / zoom, width, zoom, height: innerHeight * tagScale() };
  }

  // ---------- the viewport tag ----------

  function parse(content) {
    const map = new Map();
    for (const part of String(content || "").split(/[,;]/)) {
      const [k, v = ""] = part.split("=").map((s) => s.trim().toLowerCase());
      if (k) map.set(k, v);
    }
    return map;
  }

  // Pages laid out to the phone's width. Pages with a desktop width are left alone.
  function fitsPhone(content) {
    const m = parse(content);
    const w = m.get("width");
    return w === "device-width" || (!w && m.has("initial-scale"));
  }

  // The page laid out across the whole screen at its own scale; Safari draws what falls under the strip there. Given
  // only the width, Safari makes the page as much taller as it is wider than the visible part (708 for 580 upright),
  // and fixed boxes then sit against that taller box: a bottom bar starts 128 points below the screen and only comes
  // up as the page scrolls down. So the height is the visible page's.
  function widened(content, s) {
    const m = parse(content);
    m.set("width", String(s.width));
    if (s.height) m.set("height", String(Math.round(s.height)));
    m.set("initial-scale", "1");
    m.set("minimum-scale", "1");
    return [...m].map(([k, v]) => (v ? `${k}=${v}` : k)).join(", ");
  }

  const viewportTag = () => [...document.querySelectorAll('meta[name="viewport" i]')].filter((t) => t !== own).pop() || null;

  // ---------- state ----------

  let meta = null;    // the page's viewport tag
  let orig = null;    // its own content while ours is in place
  let ours = "";      // the content we wrote
  const others = new Map();  // the page's other viewport tags -> their own content, while they carry ours too
  let own = null;     // a viewport tag of ours, read after the page's, while those keep the page's own content
  let strip = null;   // { side, gap, full, width, zoom, height } while the page is widened (see detect)
  let rewrites = [];  // when the page put its own content back while ours was in place
  let yielded = false;
  let shape = "";     // the screen's size when the page was widened
  let scaled = false; // the reader has zoomed the page, so WebKit keeps its scale itself (see sleep)
  let asleep = false; // the page's own viewport is back while it is hidden (see sleep)

  // n points in the page's CSS pixels (see scales); TAP, EDGE and the scroll bar's TRACK are in points.
  const pt = (n) => n / (strip ? strip.zoom : 1);
  // Another side, screen or zoom than the page was widened for.
  const refit = (s) => s.side !== strip.side || s.width !== strip.width || Math.abs(s.gap - strip.gap) > 0.5;

  const screenShape = () => Math.min(screen.width, screen.height) + "x" + Math.max(screen.width, screen.height);
  // A size the same screen can't show: the phone partway through turning (its orientation and the window's shape
  // still disagree), or a window wider than the screen itself (as Safari goes to the background, iOS lays the page
  // out for a moment the other way round to picture it for the app switcher). The page keeps its layout through it;
  // the size after it settles what to do. So it does while it is hidden (Safari in the background, the switcher
  // picturing it) and while it is zoomed into: changing the page's layout under a zoom leaves it zoomed.
  function passing() {
    if (strip && (zoomed() || document.visibilityState === "hidden")) return true;
    if ((dbg && dbg.strip) || !strip || screenShape() !== shape) return false;
    const type = (screen.orientation && screen.orientation.type) || "";
    const o = innerWidth > innerHeight ? "landscape" : "portrait";
    const side = o === "landscape" ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    return !type.startsWith(o) || scales().shown > side + 1;
  }

  const sameTag = (a, b) => [...parse(a)].sort().join() === [...parse(b)].sort().join();

  function consider() {
    if (yielded || (asleep && document.visibilityState === "hidden")) return;
    const tag = viewportTag();
    if (own) {
      // (see ownTag) The page's tags keep what it writes in them, and ours carries the page's own content widened.
      if ((!own.isConnected || own.getAttribute("content") !== ours) && !rewrote()) return;  // (the page took ours, or wrote on it)
      if (tag !== meta) { meta = tag; if (meta) metaWatch.observe(meta, { attributes: true, attributeFilter: ["content"] }); }
      const content = meta ? meta.getAttribute("content") || "" : "";
      if (!meta || !fitsPhone(content)) { restore(); return; }
      if (content !== orig) { orig = content; ours = widened(orig, strip); }
      const s = passing() ? strip : detect();
      if (!s) { restore(); return; }
      if (refit(s)) { apply(orig, s); return; }
      if (s.height && Math.abs(s.height - strip.height) > 0.5) { strip.height = s.height; ours = widened(orig, strip); }
      lastOurs();
      return;
    }
    if (tag !== meta) {
      // A page that renders its head again (a framework taking the page over as it starts) puts in a new tag saying
      // what the old one said: ours goes on it at once, and what was fitted stays. Taken down and put back, the bars
      // showed unfitted for a moment (the top of mlb.com flashing, openai.com jolting once loaded).
      const again = !!(meta && orig !== null && tag && sameTag(tag.getAttribute("content"), orig));
      if (meta && orig !== null && !again) restore();
      if (again && meta.isConnected) others.set(meta, orig);  // (still there: it carries ours, and gets its own back)
      meta = tag;
      if (meta) metaWatch.observe(meta, { attributes: true, attributeFilter: ["content"] });
      if (again) meta.setAttribute("content", ours);
    }
    if (!meta) return;
    const content = meta.getAttribute("content") || "";
    if (orig !== null && content === ours) {
      // A page may have more than one viewport tag (one in the page, one its script adds or rewrites later), and Safari
      // goes by the one it read last: each of them carries ours, and one the page writes to again gets ours back.
      for (const [t] of others) if (!t.isConnected) others.delete(t);
      for (const t of document.querySelectorAll('meta[name="viewport" i]')) {
        const c = t.getAttribute("content") || "";
        if (t === meta || c === ours) continue;
        if (others.has(t) && !rewrote()) return;
        if (!others.has(t)) metaWatch.observe(t, { attributes: true, attributeFilter: ["content"] });
        others.set(t, c);
        t.setAttribute("content", ours);
      }
      if (passing()) return;
      const s = detect();
      if (!s) restore();
      else if (refit(s)) apply(orig, s);
      else if (s.height && Math.abs(s.height - strip.height) > 0.5) {
        // Safari's bars grew or shrank: the page keeps its width and follows the height.
        const was = ours;
        strip.height = s.height;
        ours = widened(orig, strip);
        meta.setAttribute("content", ours);
        for (const [t] of others) if (t.getAttribute("content") === was) t.setAttribute("content", ours);
      }
      return;
    }
    if (orig !== null && content === orig) {
      // The page put its own content back (some do whenever the window resizes): ours goes straight back, before
      // Safari lays the page out again, and what was fitted to it stays.
      if (rewrote()) meta.setAttribute("content", ours);
      return;
    }
    if (orig !== null) {
      // The page rewrote its tag (single-page apps do): that is its own content now.
      orig = null;
      unfix();
    }
    if (!fitsPhone(content)) return;
    const s = detect();
    if (s) apply(content, s);
  }

  // A page that keeps putting its own content back on its tag, over and over at once, gets it to keep (see ownTag):
  // false once it has. One that keeps writing on ours as well is left as it wants rather than the two going back and
  // forth without end.
  function rewrote() {
    const now = performance.now();
    rewrites = rewrites.filter((t) => now - t < 1000).concat(now);
    if (rewrites.length < (own ? 5 : 3)) return true;
    if (!own && meta && strip) { ownTag(); return false; }
    yielded = true;
    if (own) {
      own.remove();
      own = null;
      if (meta) meta.setAttribute("content", meta.getAttribute("content") || "");  // (the page's own, read again)
    }
    for (const [t, c] of others) if (t.getAttribute("content") === ours) t.setAttribute("content", c);
    others.clear();
    orig = null;
    ours = "";
    strip = null;
    unfix();
    wholeScreen();
    guardEdge();
    ownBar(false);
    document.documentElement.removeAttribute(MARK);
    scriptWidth(null);
    return false;
  }

  // A page that writes its own content back on its tag as soon as it finds ours there (a script that looks at the tag
  // whenever the window resizes, sets it again and has the page resize once more, as samsung.com's does) would go back
  // and forth with us without end: its tags keep its own content, and ours goes on a tag of our own that Safari reads
  // after them.
  function ownTag() {
    rewrites = [];
    for (const [t, c] of others) if (t.getAttribute("content") === ours) t.setAttribute("content", c);
    others.clear();
    if (meta.getAttribute("content") === ours) meta.setAttribute("content", orig);
    own = document.createElement("meta");
    own.setAttribute("name", "viewport");
    own.setAttribute(MARK, "viewport");
    lastOurs();
    metaWatch.observe(own, { attributes: true, attributeFilter: ["content"] });
  }

  // Ours is read last: after the page's tags, and again each time the page writes one of them.
  function lastOurs() {
    const all = document.querySelectorAll('meta[name="viewport" i]');
    if (!own.isConnected || all[all.length - 1] !== own) (document.head || document.documentElement).appendChild(own);
    own.setAttribute("content", ours);
    metaWatch.takeRecords();  // (its own)
  }

  function apply(content, s) {
    unfix();
    orig = content;
    strip = s;
    shape = screenShape();
    const was = ours;
    ours = widened(content, s);
    if (own) lastOurs();
    else {
      meta.setAttribute("content", ours);
      for (const t of document.querySelectorAll('meta[name="viewport" i]')) {
        const c = t.getAttribute("content") || "";
        if (t === meta || c === ours) continue;
        if (!others.has(t)) { others.set(t, c); metaWatch.observe(t, { attributes: true, attributeFilter: ["content"] }); }
        else if (c !== was) others.set(t, c);  // (the page's own, written since)
        t.setAttribute("content", ours);
      }
    }
    document.documentElement.setAttribute(MARK, s.side);
    scriptWidth(s);
    wholeScreen();
    guardEdge();
    pin();
    settle();
  }

  function restore() {
    if (own) {
      own.remove();
      own = null;
      if (meta && meta.isConnected) meta.setAttribute("content", meta.getAttribute("content") || "");  // (the page's own, read again)
    } else if (meta && orig !== null && meta.getAttribute("content") === ours) meta.setAttribute("content", orig);
    for (const [t, c] of others) if (t.getAttribute("content") === ours) t.setAttribute("content", c);
    others.clear();
    orig = null;
    ours = "";
    strip = null;
    unfix();
    wholeScreen();
    guardEdge();
    ownBar(false);
    document.documentElement.removeAttribute(MARK);
    scriptWidth(null);
  }

  // Once the reader has zoomed a page (a pinch, or a double tap, which Safari answers on a page whose viewport tag
  // gives its width as a number, as a widened page's does), WebKit no longer puts it back at the scale its tag asks for
  // when the window changes size: it keeps the same share of the page's width in view, and a page Safari loads again
  // from where it was (after dropping it in the background, say) keeps that too. Widened, that share is only the part
  // the strip leaves clear, 382 of 466 upright, and as Safari goes to the background iOS lays the page out at other
  // sizes to picture it for the app switcher; kept across those, the share can bring the page back zoomed in, by up to
  // the screen over that part. So a page the reader has zoomed gets its own viewport back while it is hidden, in view
  // as wide as it is laid out, and is widened again as it shows (see shows).
  function sleep() {
    if (!strip || !scaled || zoomed()) return;
    asleep = true;
    restore();
  }

  // ---------- the screen's width in CSS units ----------

  // Safari counts vw (and dvw, svw, lvw) in the part of the screen its strip leaves clear, 382 upright, not in the page
  // it lays out under the strip: what a page sizes to the screen's width with them (an app's frame at 100vw, a grid's
  // column that may grow to 100vw, a pager's panes) stays that much narrower, and the strip's part of the screen is
  // left empty (LinkedIn's feed, mlb.com) or a pane never lines up (chatgpt.com pulling sideways). While the page is
  // widened its lengths in those units count the whole screen instead: each becomes calc(N * var(--duowide-vw, 1vw)), the
  // variable set in a sheet of ours, and gone when the page is not widened, the page's own unit back. They are
  // rewritten where they are, in the page's own sheets and style attributes; a sheet from another site, which the page
  // may not read, is fetched again where that site allows it, and those of its rules are laid over it in our sheet.
  const VW = /(?<![\w.#/"'-])(-?(?:\d*\.)?\d+)([dsl]?vw)\b/gi;
  const hasVW = (s) => { VW.lastIndex = 0; return VW.test(s); };
  const inScreen = (value) => value.replace(VW, (_, n, unit) => `calc(${n} * var(--duowide-vw, 1${unit}))`);
  const counted = new WeakSet();     // rules rewritten (or with nothing to rewrite)
  const sheetSizes = new WeakMap();  // sheet -> how many rules it had when last read
  const fetched = new WeakSet();     // sheets the page may not read, fetched again (or being, or not to be had)
  const laidOver = [];               // [sheet, its rules in vw, rewritten]
  let screenSheet = null, screenStyle = null, screenText = null;

  // A rule's or an element's declarations, [property, value, priority], from its CSS text.
  function declarations(css) {
    const out = [];
    let depth = 0, quote = "", from = 0;
    for (let i = 0; i <= css.length; i++) {
      const ch = css[i];
      if (quote) { if (ch === quote && css[i - 1] !== "\\") quote = ""; continue; }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (i === css.length || (ch === ";" && depth <= 0)) {
        const d = css.slice(from, i), c = d.indexOf(":");
        from = i + 1;
        if (c < 1) continue;
        const v = d.slice(c + 1).trim(), important = /!\s*important$/i.test(v);
        out.push([d.slice(0, c).trim(), important ? v.replace(/!\s*important$/i, "").trim() : v, important ? "important" : ""]);
      }
    }
    return out;
  }
  // (Not a picture's address: relative to a sheet from elsewhere, it would point somewhere else from ours. Nor the size
  // of words: they are laid out in the part the strip leaves clear, so a title sized in vw keeps the size Safari gives
  // it rather than growing with the whole screen, and breaking onto more lines there.)
  const rewritable = (p, v) => hasVW(v) && !/^(font|font-size|line-height|letter-spacing|word-spacing)$/i.test(p) && !v.includes("--duowide-vw") && !/url\(/i.test(v);

  function wholeWidth(style) {
    const css = style.cssText;
    if (!hasVW(css)) return;
    for (const [p, v, important] of declarations(css)) if (rewritable(p, v)) style.setProperty(p, inScreen(v), important);
  }

  function countRules(rules) {
    for (const r of rules) {
      if (r.style && !counted.has(r)) { counted.add(r); wholeWidth(r.style); }
      if (r.cssRules) countRules(r.cssRules);
      else if (r.styleSheet) countSheet(r.styleSheet);  // (@import)
    }
  }

  function countSheet(sheet) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { refetch(sheet); return; }
    if (!rules || sheetSizes.get(sheet) === rules.length) return;  // (a page's script adds rules to its sheets as it goes)
    sheetSizes.set(sheet, rules.length);
    countRules(rules);
  }

  // The rules among these that hold lengths in vw, with only those declarations, rewritten, in the conditions they had.
  function overText(rules) {
    let css = "";
    for (const r of rules) {
      if (r.type === 6) continue;  // (@page)
      if (r.type === 7) { if (hasVW(r.cssText)) css += inScreen(r.cssText); continue; }  // (@keyframes go whole: the last of a name counts)
      let own = "";
      if (r.style) for (const [p, v, important] of declarations(r.style.cssText)) if (rewritable(p, v)) own += `${p}:${inScreen(v)}${important ? " !important" : ""};`;
      const inner = r.cssRules ? overText(r.cssRules) : "";
      if (!own && !inner) continue;
      css += `${r.selectorText !== undefined ? r.selectorText : r.cssText.slice(0, r.cssText.indexOf("{")).trim()}{${own}${inner}}`;
    }
    return css;
  }

  function refetch(sheet) {
    if (fetched.has(sheet) || !sheet.href || !/^https?:/i.test(sheet.href)) return;
    fetched.add(sheet);
    fetch(sheet.href, { mode: "cors", credentials: "omit" }).then((r) => (r.ok ? r.text() : "")).then((text) => {
      if (!hasVW(text)) return;
      const copy = new CSSStyleSheet();
      copy.replaceSync(text);
      const over = overText(copy.cssRules);
      if (!over) return;
      laidOver.push([sheet, over]);
      wholeScreen();
    }).catch(() => {});
  }

  // Our sheet: 100vw to read as a length (see scales), the variable while the page is widened, and the rules laid over
  // sheets that are still there. With them, the scroll bars made clear while we draw our own (see ownBar), and words
  // kept at the size the page gives them: as Safari goes to the background, iOS lays the page out for a moment twice as
  // wide to picture it for the app switcher, and Safari enlarges the words of a page that hasn't said otherwise
  // (-webkit-text-size-adjust) in boxes wider than the screen, half again as big; enlarged like that, a page came back
  // with its words bigger than it left. (Each yields to the page's own setting.)
  function wholeScreen() {
    const live = new Set(document.styleSheets);
    const unit = dbg && dbg.vw ? dbg.vw : strip && strip.full / 100;  // (tests: a vw as Safari counts it, to see the difference)
    const text = `:root{${VIEW}:100vw}` + (strip ? `:root{--duowide-vw:${unit}px !important}:where(html[${MARK}]){-webkit-text-size-adjust:100%}` +
      `:where(html[${BAR}]){scrollbar-color:transparent transparent}:where(html[${BAR}]>body){scrollbar-color:auto}` : "") +
      laidOver.filter(([s]) => live.has(s)).map(([, over]) => over).join("");
    if (text !== screenText) {
      screenText = text;
      try {
        if (!screenSheet) screenSheet = new CSSStyleSheet();
        screenSheet.replaceSync(text);
      } catch (e) { screenSheet = null; }
    }
    try {
      if (screenSheet && !document.adoptedStyleSheets.includes(screenSheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, screenSheet];
    } catch (e) { screenSheet = null; }
    if (!screenSheet) {  // (a browser that can't take a sheet that way gets an element)
      if (!screenStyle) { screenStyle = document.createElement("style"); screenStyle.setAttribute(MARK, "vw"); }
      if (screenStyle.textContent !== text) screenStyle.textContent = text;
      if (!screenStyle.isConnected && document.documentElement) document.documentElement.appendChild(screenStyle);
    }
    if (!strip) return;
    for (const sheet of document.styleSheets) countSheet(sheet);
    if (document.adoptedStyleSheets) for (const sheet of document.adoptedStyleSheets) if (sheet !== screenSheet) countSheet(sheet);
    for (const el of document.querySelectorAll("[style*='vw' i]")) if (!el.hasAttribute(MARK)) wholeWidth(el.style);
  }

  // ---------- the screen's width in scripts ----------

  // Safari counts innerWidth too in the part of the screen its strip leaves clear, so a page's script that lays things
  // out by it goes by that part while the page's sheets, widened, go by the whole screen: at 75% zoom the sheets of
  // m.naver.com's feed set out two columns in the 621 pixels it is laid out in, and its script, reading 509, filled
  // only the first. While the page is widened, its scripts read innerWidth across the whole screen too. They run apart
  // from ours (Userscripts runs ours in a world of its own), so a few lines go into the page itself, as Userscripts
  // puts in a script that asks to run there, where the page lets inline scripts run: they scale the page's innerWidth
  // by the whole screen over the part shown, kept on <html>. A change of that is told to the page as a resize, as
  // Safari tells its own.
  const PAGE_WIDTH = `(() => {
    let o = window, d;
    while (o && !(d = Object.getOwnPropertyDescriptor(o, "innerWidth"))) o = Object.getPrototypeOf(o);
    if (!d || !d.get) return;
    Object.defineProperty(window, "innerWidth", { configurable: true, enumerable: d.enumerable, set: d.set, get() {
      const w = d.get.call(this), r = parseFloat(document.documentElement?.getAttribute("${RATIO}"));
      return r > 1 ? Math.round(w * r) : w;
    } });
  })();`;
  let inPage = false, telling = false, tellTimer = 0;
  function scriptWidth(s) {
    const root = document.documentElement;
    const r = s ? (s.full * s.zoom) / scales().shown : 1;
    const v = Number.isFinite(r) && r > 1.001 ? r.toFixed(5) : null;  // (none where all of it shows, as in Chromium)
    if (v === root.getAttribute(RATIO)) return;
    if (v && !inPage) {
      inPage = true;
      try {
        const el = document.createElement("script");
        el.setAttribute(MARK, "width");
        el.textContent = PAGE_WIDTH;
        (document.head || root).appendChild(el);
        el.remove();
      } catch (e) { /* (a page that takes only scripts made trusted, see Trusted Types) */ }
    }
    if (v) root.setAttribute(RATIO, v);
    else root.removeAttribute(RATIO);
    clearTimeout(tellTimer);
    tellTimer = setTimeout(() => {  // (once Safari has laid the page out again, see settle)
      telling = true;
      try { dispatchEvent(new Event("resize")); } finally { telling = false; }
    }, 120);
  }

  const metaWatch = new MutationObserver(() => consider());

  // Safari applies a viewport change on its next layout; fit the page's bars and controls after that.
  let settleTimer = 0, pinTimer = 0;
  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { pin(); refix(true); }, 120);
  }

  // The page is wider than the part Safari counts as visible, so Safari lets it slide sideways by the strip's width.
  // Keep it where it lines up with the screen: at the left edge, or past the strip when the strip is on the left.
  const pinX = () => (strip && strip.side === "left" ? strip.gap : 0);
  // A sideways drag would only slide the page by the strip's width and back, so it pans nothing at all: carousels the
  // browser scrolls still swipe (each starts afresh), and the page's own carousels still get the touches. A page that
  // already limits what a touch does keeps its own setting.
  // A page wider than the screen itself (a header laid out for a bigger screen) still pans to what is past its edge.
  const HOLD = "pan-y pinch-zoom";
  let wide = false;
  function pin() {
    if (!strip) return;
    const root = document.documentElement;
    if (wide || zoomed()) {  // zoomed in: the reader is panning on purpose
      if ("touch-action" in (fixed.get(root) || {})) unsetProps(root, ["touch-action"]);
      for (const el of holds) unsetProps(el, ["touch-action"]);
      holds.clear();
      holdFrames(false);
      ownBar(false);
      return;
    }
    ownBar(true);
    // A page's own setting that still lets a touch slide it sideways (manipulation, which pages set to tap at once)
    // gives way to ours, keeping whether it lets a pinch zoom. Otherwise each slide would be put back while the finger
    // still pushes it, and the page shook from side to side.
    const own = getComputedStyle(root).touchAction, hold = /^(auto|manipulation)$|pinch-zoom/.test(own) ? HOLD : "pan-y";
    if (root.style.getPropertyValue("touch-action") !== hold && (/^(auto|manipulation)$/.test(own) || /pan-x/.test(own))) setProp(root, "touch-action", hold);
    // (Under a finger it is put back once the finger lifts.)
    const x = pinX();
    if (Math.abs(scrollX - x) > 0.5 && !touching) scrollTo(x, scrollY);
  }

  // Held at the left edge, the page is still wider than the part Safari counts as visible by the strip's width, and
  // iOS shows its sideways scroll bar along the bottom whenever the page scrolls at all. WebKit hides the page's scroll
  // bars only both together (scrollbar-color on <html> colors both; a box that scrolls by itself takes its own), so
  // while the page is held they are made clear (see wholeScreen) and the one that goes up and down is drawn instead,
  // where iOS has it and as it looks there (Safari 27.1 on the folded screen, measured): 2.7pt wide and 3.3pt in from
  // the screen's edge, moving along the screen's height less 62pt at each end, as much of that as the screen is of the
  // page with what Safari's bars cover and at least 36pt, half black or half white as the page is light or dark. Like
  // iOS's, it shows only as the reader scrolls the page (a finger on it, then the glide after it, whose first move may
  // come most of a second after the finger lifts), not as the page's script scrolls it, and goes half a second after
  // the page stops. Zoomed in, or on a page wider than the screen, the page does go sideways, and iOS's own come back.
  // A page that colors its own scroll bars keeps them, the one along the bottom too, and one that hides them has none
  // drawn; so also when it does that only later.
  const TRACK = { width: 8 / 3, edge: 10 / 3, ends: 62, min: 36 };
  const CLEAR = "rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)";  // (scrollbar-color as ours leaves it)
  let bar = null, barShown = 0, barFrame = 0, barColor = "", barUntil = 0;
  function ownBar(on) {
    const root = document.documentElement, ours = root.hasAttribute(BAR);
    if (!CONFIG.bar || (!on && !ours)) return;
    const cs = on && getComputedStyle(root);
    if (on && cs.scrollbarWidth !== "none" && cs.scrollbarColor === (ours ? CLEAR : "auto")) {
      if (!ours) root.setAttribute(BAR, "");
      return;
    }
    if (!ours) return;
    root.removeAttribute(BAR);
    hideBar();
  }

  function scrolledBar() {
    if (!touching && performance.now() >= barUntil) return;
    if (!touching) barUntil = performance.now() + 1000;
    showBar();
  }

  function liftBar() {
    barUntil = performance.now() + 1000;
    if (barShown) { clearTimeout(barShown); barShown = setTimeout(hideBar, 500); }
  }

  function showBar() {
    if (barFrame || !document.documentElement.hasAttribute(BAR)) return;
    barFrame = requestAnimationFrame(() => {
      barFrame = 0;
      const root = document.documentElement, z = strip ? strip.zoom : 1;  // (worked out in points, as iOS draws it)
      const H = innerWidth > innerHeight ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
      const track = H - 2 * TRACK.ends, page = root.scrollHeight * z, seen = innerHeight * z, max = root.scrollHeight - innerHeight;
      if (!root.hasAttribute(BAR) || max < 1 || track < TRACK.min) return;
      const over = Math.max(0, -scrollY, scrollY - max) * z;  // (pulled past either end, it shortens, as iOS's does)
      const len = Math.max(Math.max(TRACK.min, (track * H) / (page + H - seen)) - over, 2 * TRACK.width);
      const top = TRACK.ends + (track - len) * Math.min(1, Math.max(0, scrollY / max));
      if (!barShown) barColor = pageIsDark() ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
      if (!bar) {
        bar = document.createElement("div");
        bar.setAttribute(MARK, "bar");
        bar.setAttribute("aria-hidden", "true");
      }
      bar.style.cssText = cssOf({ position: "fixed", top: "0", right: `${pt(TRACK.edge)}px`, left: "auto", bottom: "auto",
        width: `${pt(TRACK.width)}px`, height: `${pt(len)}px`, margin: "0", padding: "0", border: "0", "border-radius": `${pt(TRACK.width / 2)}px`,
        background: barColor, transform: `translateY(${pt(top)}px)`, display: "block", visibility: "visible", opacity: "1",
        transition: "none", "pointer-events": "none", "z-index": "2147483647" });
      if (bar.parentNode !== root) root.appendChild(bar);
      clearTimeout(barShown);
      barShown = touching ? -1 : setTimeout(hideBar, 500);  // (kept while a finger is on the page)
    });
  }

  function hideBar() {
    clearTimeout(barShown);
    barShown = 0;
    if (!bar) return;
    bar.style.setProperty("transition", "opacity 0.25s", "important");
    bar.style.setProperty("opacity", "0", "important");
  }

  // Dark or light as WebKit tells the page's background for its own: the root's color, else the body's, else the page's
  // color scheme.
  function pageIsDark() {
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      const c = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || []).map(Number);
      if (c.length < 3 || c[3] === 0) continue;
      return Math.max(c[0], c[1], c[2]) + Math.min(c[0], c[1], c[2]) <= 255;  // (lightness half or less)
    }
    return /dark/.test(getComputedStyle(document.documentElement).colorScheme) && matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // WebKit starts a touch's touch-action afresh in a box that scrolls by itself (overflow auto or scroll), whether or
  // not it has anything to scroll: the page's setting above doesn't reach a touch that lands in one, and a sideways
  // drag there slides the whole page by the strip's width, its scroll bar showing along the bottom (a wiki's tables,
  // each in a box of its own). One that can't scroll sideways itself gets the page's setting too, and still scrolls up
  // and down; one that can keeps its own, and loses ours once it can. A few screens around this one, as a look does.
  const holds = new Set();  // boxes given the page's touch-action
  let flat = new WeakSet();  // boxes seen not to scroll by themselves: not looked at again
  const sideways = (el, cs) => /auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
  function holdBoxes() {
    for (const el of holds) {
      if (el.isConnected && !sideways(el, getComputedStyle(el))) continue;
      unsetProps(el, ["touch-action"]);
      holds.delete(el);
    }
    if (!document.body || wide || zoomed()) return;
    holdFrames(true);
    const holdIf = (el, cs) => {
      if (!/auto|scroll/.test(cs.overflowX + cs.overflowY) || sideways(el, cs) || !/^(auto|manipulation)$/.test(cs.touchAction)) return;
      setProp(el, "touch-action", HOLD);  // (over a sheet that puts every part of a notice back to auto, important and all)
      holds.add(el);
    };
    // The body as well, looked at every time (a menu that opens holds the page still by its body's overflow): a page
    // that cuts its body off sideways (overflow-x hidden) has it scroll up and down by itself as WebKit counts, though
    // the page scrolls, and every touch on the page started afresh there.
    if (!holds.has(document.body)) holdIf(document.body, getComputedStyle(document.body));
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode(el) {
        if (el.hasAttribute(MARK)) return NodeFilter.FILTER_REJECT;
        const r = el.getBoundingClientRect();
        // (Nothing of a part the page hides shows to be touched: a wiki's folded sections and its notes, thousands of
        // parts, passed over whole. A box that only hands its parts on, laid out as they are, isn't one.)
        if (!r.width && !r.height) return getComputedStyle(el).display === "none" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        if (r.width && r.height && (r.bottom < -innerHeight || r.top > 3 * innerHeight)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      if (holds.has(el) || flat.has(el)) continue;
      // (Words and links laid in lines have no box of their own to scroll: most of a page, passed over unread.)
      if (!el.clientHeight || !el.clientWidth) continue;
      const cs = getComputedStyle(el);
      if (!/auto|scroll/.test(cs.overflowX + cs.overflowY)) { flat.add(el); continue; }
      holdIf(el, cs);
    }
  }

  // A touch that lands in a frame laid in from elsewhere (an ad, an embedded video) goes by that frame's own page's
  // touch-action, which none of the above reaches: DuoWide-Frames.user.js, running in frames, holds a frame's page
  // the same way while the page it is laid in is held. Told when that changes; a frame asks as its page starts.
  let framesHeld = false;
  function holdFrames(on) {
    if (on === framesHeld) return;
    framesHeld = on;
    for (const f of document.querySelectorAll("iframe, frame")) {
      try { if (f.contentWindow) f.contentWindow.postMessage(on ? "duowide:hold" : "duowide:free", "*"); } catch (e) { /* gone */ }
    }
  }

  // ---------- keeping the page's bars and controls clear of the strip ----------

  const fixed = new Map();  // element -> { prop: [value, priority] } as the page had them

  // While the script looks a page over, what it restyles changes at once: a page's own transition (a sheet easing to
  // its width) would leave it reading the old size, as if the box were already clear of the strip. Each one gets its
  // transitions back once its new size has been laid out.
  let frozen = null;
  function freeze(el) {
    if (!frozen || frozen.has(el)) return;
    frozen.set(el, [el.style.getPropertyValue("transition"), el.style.getPropertyPriority("transition")]);
    el.style.setProperty("transition", "none", "important");
  }
  function thaw() {
    if (!frozen) return;
    const els = frozen;
    frozen = null;
    if (els.size) document.documentElement.getBoundingClientRect();  // lay out the new sizes before transitions return
    for (const [el, [value, priority]] of els) {
      if (value) el.style.setProperty("transition", value, priority);
      else el.style.removeProperty("transition");
    }
  }

  function setProp(el, prop, value, priority = "important") {
    freeze(el);
    let saved = fixed.get(el);
    if (!saved) fixed.set(el, (saved = {}));
    if (!(prop in saved)) saved[prop] = [el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)];
    el.style.setProperty(prop, value, priority);
  }

  function unsetProps(el, props) {
    const saved = fixed.get(el);
    if (!saved) return;
    freeze(el);
    for (const prop of props) {
      if (!(prop in saved)) continue;
      const [value, priority] = saved[prop];
      if (value) el.style.setProperty(prop, value, priority);
      else el.style.removeProperty(prop);
      delete saved[prop];
    }
    if (!Object.keys(saved).length) fixed.delete(el);
  }

  function unfix() {
    for (const [el, saved] of fixed) unsetProps(el, Object.keys(saved));
    fixed.clear();
    movers = [];
    bars.clear();
    holds.clear();
    holdFrames(false);
    flat = new WeakSet();
    insets.clear();
    shades.clear();
    shadeSizes.disconnect();
    ends.clear();
    painting.clear();
  }

  // What a box's padding and borders add to the width it is given, unless that width counts them already.
  const besides = (cs) => (cs.boxSizing === "border-box" ? 0 :
    ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((s, k) => s + (parseFloat(cs[k]) || 0), 0));

  // What a box keeps from the screen's edge on the strip's side, up to 16px: it keeps as much from the strip once inside.
  const margin = (r) => { const { min, max } = clearBand(); return Math.max(0, Math.min(16, strip.side === "right" ? max - r.right : r.left - min)); };

  // The part of the screen the strip leaves clear [lo, hi] and the whole screen [min, max], in the coordinates the
  // page's boxes report. Safari counts only the clear part as the visible page (innerWidth) starting at x = 0, so the
  // strip lies past its right end, or before x = 0 when the page is held scrolled by the strip's width.
  function clearBand() {
    const W = document.documentElement.clientWidth, g = strip.gap, v = innerWidth;
    if (v < W - 1) return strip.side === "left" ? { lo: 0, hi: v, min: -g, max: v } : { lo: 0, hi: v, min: 0, max: v + g };
    // A browser that lays the strip inside the visible page (the Chromium test harness).
    return strip.side === "left" ? { lo: g, hi: W, min: 0, max: W } : { lo: 0, hi: W - g, min: 0, max: W };
  }

  // Fixed boxes on the page, outermost only, hidden ones too (a bar that appears once the page scrolls). Safari does not
  // hit-test under its strip, so they are found by walking the page: a fixed box has no offsetParent, and a box with no
  // offsetParent and no boxes at all is not rendered. Widgets a page takes from elsewhere keep theirs inside a component
  // of their own (a shop's overseas-cart bar): its open inside is walked as well. The open insides the walk goes through
  // are kept for the look that follows, which finds players in them too (see scanMovers), and watched for players
  // coming into them (a video's picture that turns into its frame when pressed).
  const holderOf = new WeakMap();  // fixed box -> the fixed box it is in, if any
  let shadows = [];  // the open insides of components the last walk went through
  const shadowsWatched = new WeakSet();
  const shadowAdds = new MutationObserver((records) => {
    if (strip && records.some((rec) => [...rec.addedNodes].some((n) => n.nodeType === Node.ELEMENT_NODE && (n.matches(MEDIA) || !!n.querySelector(MEDIA))))) refixAllSoon();
  });
  function fixedBoxes() {
    const found = [], roots = [];
    const walk = (root) => {
      let within = null;  // the fixed box the walk is in
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode(el) {
          const inside = () => { if (el.shadowRoot) { roots.push(el.shadowRoot); walk(el.shadowRoot); } };
          while (within && !within.contains(el)) within = holderOf.get(within) || null;
          // A fixed box in one that slides as a whole (a menu coming in from the side, its close button placed past
          // its edge) is placed against that one, which then counts as its offsetParent: it is known by its style.
          if (el.offsetParent !== null && !(within && getComputedStyle(el).position === "fixed")) { inside(); return NodeFilter.FILTER_SKIP; }
          if (!el.getClientRects().length) {
            if (getComputedStyle(el).display !== "contents") return NodeFilter.FILTER_REJECT;
            inside();
            return NodeFilter.FILTER_SKIP;
          }
          inside();
          const cs = getComputedStyle(el);
          if (cs.position !== "fixed") return NodeFilter.FILTER_SKIP;
          found.push(el);
          holderOf.set(el, within);
          within = el;
          // What sits inside a fixed box moves with it, except a fixed box in it, which is placed on the screen by
          // itself (a message's own close button bar inside a fixed layer).
          return NodeFilter.FILTER_SKIP;
        },
      });
      while (walker.nextNode());
    };
    walk(document.body);
    shadows = roots;
    for (const s of roots) if (!shadowsWatched.has(s)) {
      shadowsWatched.add(s);
      shadowAdds.observe(s, { childList: true, subtree: true });
      for (const type of ["load", "play"]) s.addEventListener(type, noteMedia, true);
    }
    return found;
  }

  // The box a box is laid in, out of a component's open inside into the page as well.
  const up = (e) => e.parentElement || (e.parentNode && e.parentNode.host) || null;
  const inFixed = (el, boxes) => { for (let e = el; e && e !== document.body; e = up(e)) if (boxes.has(e)) return true; return false; };

  const watched = new WeakSet();
  const sizes = new ResizeObserver(() => { if (strip) refixSoon(60); });
  // Pictures that load, and other changes in the page's height, move rows up and down the page.
  const pageSize = new ResizeObserver(() => { if (strip) refixAllSoon(400); });
  let pageWatched = false;

  // Safari paints its whole strip in one solid color, hiding the page under it (a white strip over a post, a black one
  // beside a video), whenever it finds a fixed or sticky box at the middle of the strip's edge: a bar across the page
  // as it scrolls past the middle of the screen, a player held at the top, a layer over the page. It looks at that one
  // point, through what is there first, and passes over a small fixed box. A small one of ours sits there above
  // everything, showing nothing and taking no touches, so the strip stays glass. It goes in as soon as the page is
  // widened, before the page's own boxes are drawn.
  let edge = null, edgeCss = "";
  const cssOf = (css) => Object.entries(css).map(([k, v]) => `${k}:${v}!important`).join(";");
  function guardEdge() {
    if (!strip || strip.side !== "right") { if (edge) edge.remove(); return; }
    if (!edge) {
      edge = document.createElement("div");
      edge.setAttribute(MARK, "edge");
      edge.setAttribute("aria-hidden", "true");
      edge.appendChild(document.createElement("div"));  // (an empty box with no color counts as nothing there)
    }
    const { hi, max } = clearBand();
    const css = cssOf({ position: "fixed", top: "25%", height: "50%", right: "0", left: "auto", width: `${max - hi + 8}px`, margin: "0",
      padding: "0", border: "0", display: "block", opacity: "1", visibility: "visible", background: "none", transform: "none",
      "pointer-events": "none", "z-index": "2147483647" });
    if (css !== edgeCss || !edge.style.cssText) { edge.style.cssText = css; edgeCss = css; }
    if (edge.parentNode === document.documentElement) return;
    document.documentElement.appendChild(edge);
    if (document.body) release();
  }

  // A page may take it out (a framework putting <html> back the way it rendered it, as mlb.com's does once it starts):
  // it goes back at once, before Safari draws the page without it, so no color is taken that the full-page layer would
  // have to let go of, flashing the top of the screen. A page that keeps taking it out gets it back at the next look.
  let edgeTakes = [];
  function edgeTaken() {
    if (!strip || !edge || edge.isConnected || strip.side !== "right") return;
    const now = performance.now();
    edgeTakes = edgeTakes.filter((t) => now - t < 1000).concat(now);
    if (edgeTakes.length > 5) return;
    document.documentElement.appendChild(edge);
    if (changes) changes.takeRecords();  // its own
  }

  // Safari keeps the color of the box it last painted its strip from for as long as that box shows, even with ours in
  // front of it: one it found before ours went in (a page drawn before the script came, or one that took ours away)
  // would keep the strip painted. A layer of ours over the whole page, all but clear, takes its place for a frame
  // (Safari takes it for the page dimmed under a sheet and keeps the color) and then goes, and the color goes with it.
  function release() {
    const stand = document.createElement("div");
    stand.setAttribute(MARK, "edge");
    stand.setAttribute("aria-hidden", "true");
    stand.style.cssText = cssOf({ position: "fixed", inset: "0", margin: "0", padding: "0", border: "0", display: "block", opacity: "1",
      visibility: "visible", background: "rgba(128, 128, 128, 0.01)", transform: "none", "pointer-events": "none", "z-index": "2147483647" });
    document.documentElement.appendChild(stand);
    requestAnimationFrame(() => requestAnimationFrame(() => stand.remove()));
  }

  function refix(all = false) {
    if (!strip || !document.body || passing()) return;
    const band = clearBand();
    if (!pageWatched) { pageWatched = true; pageSize.observe(document.body); }
    frozen = new Map();
    try {
      guardEdge();
      const boxes = new Set(fixedBoxes()), was = bars;
      bars = new Set(boxes);
      pages = new Set();
      for (const box of [...boxes]) {
        if (getComputedStyle(box).visibility !== "hidden" && clearBar(box, band)) { boxes.delete(box); pages.add(box); }  // (the page itself)
        // Safari settles fixed boxes against the wider page a moment after the page itself; look again when they do.
        if (!watched.has(box)) { watched.add(box); sizes.observe(box); }
      }
      // A box the page fixed for a while and lets go of again (the page held still under a sheet, scrolling once more as
      // the sheet closes) gets back what it had: still narrowed, the page would end at the strip, white beside it.
      for (const el of was) {
        if (bars.has(el) || !el.isConnected) continue;
        if (el.getClientRects().length) { unsetProps(el, BAR_PROPS); painting.delete(el); } else bars.add(el);  // (hidden: seen to once it shows)
      }
      if (all) {
        lastFull = performance.now();
        wholeScreen();  // (sheets and rules the page added since)
        const clips = (e) => !!e && /hidden|clip/.test(getComputedStyle(e).overflowX);
        wide = document.documentElement.scrollWidth > strip.full + 8 && !clips(document.documentElement) && !clips(document.body);
        pin();
        scanMovers(band, boxes);
        holdBoxes();
        if (dbg && dbg.log) dbg.log.push([Math.round(lastFull), Math.round(performance.now() - lastFull)]);  // tests: when looks ran, how long
      }
    } finally { thaw(); }
    if (changes) changes.takeRecords();  // its own restyling
  }

  const painted = (c) => !!c && !/^(transparent|rgba\(.*,\s*0\))$/.test(c);

  // The color a bar shows: its own background, or that of a layer covering it that carries the paint (a pseudo-element,
  // or a child the size of the bar, as Apple's navigation bar has).
  function paintOf(box) {
    const own = getComputedStyle(box).backgroundColor;
    if (painted(own)) return own;
    const r = box.getBoundingClientRect();
    for (const pe of ["::before", "::after"]) {
      const cs = getComputedStyle(box, pe);
      if (cs.content !== "none" && /absolute|fixed/.test(cs.position) && painted(cs.backgroundColor) &&
        parseFloat(cs.width) >= r.width - 1 && parseFloat(cs.height) >= r.height - 1) return cs.backgroundColor;
    }
    for (const c of box.querySelectorAll(":scope > *, :scope > * > *")) {
      const b = c.getBoundingClientRect();
      if (Math.abs(b.left - r.left) > 1 || Math.abs(b.right - r.right) > 1 || Math.abs(b.top - r.top) > 1 || Math.abs(b.bottom - r.bottom) > 1) continue;
      const bg = getComputedStyle(c).backgroundColor;
      if (painted(bg)) return bg;
    }
    return null;
  }

  // A bar painted with a fade (a gradient of its own, or on a layer covering it): its paint can't carry on under the
  // strip in one color.
  function fades(box) {
    if (/gradient\(/.test(getComputedStyle(box).backgroundImage)) return true;
    const r = box.getBoundingClientRect();
    return ["::before", "::after"].some((pe) => {
      const cs = getComputedStyle(box, pe);
      return cs.content !== "none" && /absolute|fixed/.test(cs.position) && /gradient\(/.test(cs.backgroundImage) && parseFloat(cs.width) >= r.width - 1;
    });
  }

  // The paint a bar carries on under the strip, `gap` wide: its own color, and over it each row inside it that runs to
  // its edge in a color of its own (a colored line with an offer above a white header) and a line along its top or
  // bottom, at their own heights. Shadows draw it: the bar's shape shrunk to a row's height and moved beside the bar,
  // at the row's place (a thin row in a tall box can't reach across the strip that way, and is left out). Null when it
  // shows no color there.
  function underOf(box, gap) {
    const right = strip.side === "right", r = box.getBoundingClientRect(), cs = getComputedStyle(box);
    const bg = paintOf(box), rows = [];
    if (r.height < innerHeight * 0.8) {
      // (A row that reaches the edge sits in boxes that do.)
      const walk = (e, depth) => {
        for (const c of e.children) {
          const q = c.getBoundingClientRect();
          if (q.width < r.width / 2 || Math.abs(right ? q.right - r.right : q.left - r.left) > 1 || q.bottom <= r.top || q.top >= r.bottom) continue;
          const color = getComputedStyle(c).backgroundColor;
          if (painted(color) && color !== bg) rows.push([Math.max(q.top, r.top) - r.top, Math.min(q.bottom, r.bottom) - r.top, color]);
          if (depth < 4 && rows.length < 12) walk(c, depth + 1);
        }
      };
      walk(box, 1);
      for (const k of ["Top", "Bottom"]) {
        const w = parseFloat(cs[`border${k}Width`]) || 0, color = cs[`border${k}Color`];
        if (w > 0 && cs[`border${k}Style`] !== "none" && painted(color)) rows.push(k === "Top" ? [0, w, color] : [r.height - w, r.height, color]);
      }
    }
    const out = [];
    for (const [top, bottom, color] of rows.reverse()) {  // (the first shadow is drawn on top)
      const s = (r.height - (bottom - top)) / 2;
      if (bottom - top < 0.5 || gap + 2 * s > r.width) continue;
      out.push(`${right ? gap + s : -gap - s}px ${top - s}px 0 ${-s}px ${color}`);
    }
    if (bg) out.push(`${right ? gap : -gap}px 0 0 0 ${bg}`);
    return out.length ? out.join(", ") : null;
  }

  // What plays a video or shows a page laid in from elsewhere with buttons the script can't move: the frame itself, or a
  // video with the browser's own buttons. The buttons a page draws over its video move like any others, the picture
  // keeping its size (a preview playing over a list's thumbnail would show the thumbnail beside it). A video that loops
  // (a moving picture at the top of a page, even one with buttons), one in a link, and what takes no touches are
  // pictures: null.
  const MEDIA = "video, iframe, embed, object";
  function playerOf(el) {
    if (getComputedStyle(el).pointerEvents === "none") return null;
    if (el.localName !== "video") return el;
    return el.controls && !el.loop && !el.closest("a[href]") ? el : null;
  }
  const holdsMedia = (box, r) => [...box.querySelectorAll(MEDIA)].some((m) => {
    const q = m.getBoundingClientRect();
    return q.width >= r.width * 0.5 && q.height >= 80;
  });

  // A player is left as it is until it is pressed or plays: a picture under the strip with its play button in the
  // middle, as a wiki's video component shows one before it lays in its frame. Then it ends before the strip (see
  // scanMovers), where its own buttons can be pressed. A video with the browser's own buttons shows only that button
  // until it first plays. A frame's page tells whether it holds a video and when it is first pressed or plays
  // (DuoWide-Frames.user.js); a frame holding none (a map), or one that can't tell, ends before the strip once its
  // page has loaded, as before, and one in a component's inside at once (it may have loaded before a look found it).
  const frameSaid = new WeakMap();  // a frame's window -> what its page last told: "page" (it is there), "video", "plain", "used"
  const framesLoaded = new WeakSet();
  function waits(player) {
    if (player.localName === "video") return player.paused && !player.played.length;
    if (!/^i?frame$/.test(player.localName)) return false;
    const said = player.contentWindow && frameSaid.get(player.contentWindow);
    if (said) return said === "video" || said === "page";
    return player.getRootNode() === document && !framesLoaded.has(player);
  }
  // (A frame whose page loaded, a player that started.)
  function noteMedia(e) {
    const el = e.target;
    if (!(el instanceof Element)) return;
    const frame = e.type === "load" && /^i?frame$/.test(el.localName);
    if (frame) framesLoaded.add(el);
    if (strip && (frame || (e.type === "play" && el.localName === "video" && playerOf(el)))) refixAllSoon(frame ? 300 : 0);
  }


  // A fixed box that reaches into the strip: Safari takes every touch on its strip, empty parts included, so bars and
  // buttons that stay on screen keep clear of all of it. It is measured afresh each time, as the page lays it out now:
  // boxes settle after turning the phone, and pages move them (a notice sliding up, a bar hiding while scrolling).
  const BAR_PROPS = ["width", "min-width", "translate", "margin-left", "margin-right", "box-shadow", "padding-left", "padding-right", "box-sizing",
    "padding-top", "padding-bottom", "background-color", "--duowide-vw"];
  let bars = new Set();  // the fixed boxes at the last look, and what was fitted in place of one
  let pages = new Set(); // those of them that are the page itself (see clearBar)

  // Moves a fixed box sideways: by translate, or by its margins where the page translates it itself (a bar that slides
  // away while scrolling, a button that pops in).
  function nudge(box, dx) {
    const cs = getComputedStyle(box);
    if (cs.translate === "none") { setProp(box, "translate", `${dx}px 0px`); return; }
    const was = box.getBoundingClientRect().left;
    for (const [p, sign] of [["margin-left", 1], ["margin-right", -1]]) {
      setProp(box, p, `${(parseFloat(cs.getPropertyValue(p)) || 0) + sign * dx}px`);
      if (Math.abs(box.getBoundingClientRect().left - (was + dx)) < 1) return;
      unsetProps(box, [p]);
    }
  }

  // A page that writes its own style back over a bar (a notice it keeps exactly as it was) gets it: after it has done
  // so twice the bar is left alone, rather than restyled back and forth against the page.
  const wipes = new WeakMap();
  function wiped(box) {
    const saved = fixed.get(box);
    if (saved && Object.keys(saved).some((p) => box.style.getPropertyPriority(p) !== "important")) {
      wipes.set(box, (wipes.get(box) || 0) + 1);
      fixed.delete(box);  // what the page wrote stands
    }
    return (wipes.get(box) || 0) >= 2;
  }

  // How much of a box shows, through its own opacity and its holders' (a layer faded out, or not faded in yet).
  function opacityOf(el) {
    let o = 1;
    for (let e = el; e && o > 0.01; e = e.parentElement || (e.getRootNode().host || null)) o *= parseFloat(getComputedStyle(e).opacity) || 0;
    return o;
  }

  function framesPage(box, r, full) {
    if (r.width < full * 0.9 || r.height < innerHeight * 0.8 || document.documentElement.scrollHeight > innerHeight * 1.25) return false;
    const scrolls = (e, depth) => {
      const q = e.getBoundingClientRect();
      if (q.height < innerHeight * 0.5 || q.width < r.width * 0.8) return false;
      if (/auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + innerHeight / 2) return true;
      return depth < 6 && [...e.children].some((c) => scrolls(c, depth + 1));
    };
    return scrolls(box, 0);
  }

  // The color a bar ended at the strip carries on under the strip (see underOf), after the bar's own shadow. A bar may
  // change its color as the page moves (a clear header over a cover picture turns solid further down): the color under
  // the strip follows it a frame later, rather than once the page is still again.
  const painting = new Map();  // bar ended at the strip -> { gap, own, last }: the strip's width past it, its own shadow, ours
  function paint(box) {
    const p = painting.get(box), under = underOf(box, p.gap);
    const want = under && (p.own && p.own !== "none" ? `${p.own}, ${under}` : under);
    if (want === p.last) return;
    p.last = want;
    if (want) setProp(box, "box-shadow", want);
    else unsetProps(box, ["box-shadow"]);
  }
  let painter = 0;
  function repaintSoon() {
    if (painter || !painting.size) return;
    painter = requestAnimationFrame(() => {
      painter = 0;
      if (!strip || passing()) return;
      for (const box of [...painting.keys()]) if (box.isConnected) paint(box); else painting.delete(box);
      if (changes) changes.takeRecords();  // its own restyling
    });
  }

  function clearBar(box, band) {
    const { lo, hi, min, max } = band;
    painting.delete(box);
    bars.add(box);
    if (wiped(box)) return;
    unsetProps(box, BAR_PROPS);
    const r = box.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) {
      // A fixed box with no size of its own shows what it holds in boxes placed against it (a bottom bar's floating
      // "back to top" and menu buttons): those are fitted instead.
      for (const c of box.children) if (getComputedStyle(c).position === "absolute") clearBar(c, band);
      return;
    }
    if (r.left >= max - 0.5 || r.right <= min + 0.5) return;  // parked off the screen, like a closed drawer
    // Safari paints its strip in the color of a fixed box it finds at the strip's edge (see guardEdge). One that shows
    // nothing (faded out, or not faded in yet) would have it painted in a color seen nowhere, over the page under it:
    // it keeps a point clear of the edge as well, where Safari doesn't look.
    const keep = opacityOf(box) < 0.05 ? 1 : 0, l = strip.side === "left" ? lo + keep : lo, h = strip.side === "right" ? hi - keep : hi;
    if (r.right <= h + 0.5 && r.left >= l - 0.5) return;
    const cs = getComputedStyle(box);
    if (r.width >= (max - min) * 0.5) {
      // A box held over the whole screen that scrolls what it holds, while the page itself stays still, is the page in
      // a frame of its own (a feed scrolled inside a box): it runs under the strip as a page does, and what is pressed in
      // it comes in as anywhere on the page (true).
      if (framesPage(box, r, max - min)) return true;
      // So is the page itself held still under a sheet or a menu: the box holding all of it fixed where it was scrolled
      // to, taller than the screen. Ended at the strip, the whole page would be laid out again behind the layer.
      if (r.width >= (max - min) * 0.9 && r.top <= 1 && r.bottom >= innerHeight - 1 && r.height > innerHeight * 1.5) return true;
      // A bar, panel, player or dimming layer across the page: end it at the strip, so what is on it is inside (a video
      // held on the screen is seen whole, its buttons shown once tapped are inside), and let its own color carry on
      // under the strip.
      const left = Math.max(r.left, l), right = Math.min(r.right, h);
      // A fade keeps running under the strip, and what is on it keeps clear of the strip by the bar's own padding,
      // if that brings all of it in.
      if (!paintOf(box) && fades(box)) {
        const side = strip.side === "right" ? "padding-right" : "padding-left";
        setProp(box, side, `${(parseFloat(cs.getPropertyValue(side)) || 0) + (strip.side === "right" ? r.right - right : left - r.left)}px`);
        setProp(box, "box-sizing", "border-box");
        const a = box.getBoundingClientRect();
        const clear = [...box.querySelectorAll(CONTROL)].every((c) => { const q = c.getBoundingClientRect(); return q.width < 1 || (q.right <= hi + 0.5 && q.left >= lo - 0.5); });
        if (clear && Math.abs(a.left - r.left) < 1 && Math.abs(a.right - r.right) < 1) return;
        unsetProps(box, [side, "box-sizing"]);
      }
      const extra = besides(cs);
      setProp(box, "width", Math.max(0, right - left - extra) + "px");
      setProp(box, "min-width", "0px");
      const moved = box.getBoundingClientRect();
      const dx = left - moved.left;
      if (Math.abs(dx) > 0.5) nudge(box, dx);  // one with auto margins centres itself in the room it had
      // A player keeps its height, its picture narrower in the middle of it on the player's color: the page keeps room
      // under it as tall as it was on the whole screen's width, which would show empty below a shorter one.
      const short = r.height - moved.height;
      if (short > 1 && holdsMedia(box, moved)) {
        const pc = paintOf(box) || "rgb(0, 0, 0)";
        for (const k of ["top", "bottom"]) setProp(box, `padding-${k}`, `${(parseFloat(cs.getPropertyValue(`padding-${k}`)) || 0) + short / 2}px`);
        if (!painted(cs.backgroundColor)) setProp(box, "background-color", pc);
      }
      if (strip.side === "right" ? r.right >= max - 1 : r.left <= min + 1) {  // only bars that ran to the screen's edge
        painting.set(box, { gap: strip.side === "right" ? max - right : left - min, own: cs.boxShadow, last: null });
        paint(box);
      }
    } else {
      // A button placed past the edge of a layer by the screen's width (a menu 80% of the screen wide, its close button
      // out in the rest): the layer is laid out by the width Safari counts as the screen's, as without the script, and
      // what it places by it comes beside the strip with it.
      const layer = holderOf.get(box), q = layer && layer.isConnected && layer.getBoundingClientRect();
      if (q && q.right <= hi + 0.5 && q.left >= lo - 0.5) {
        setProp(layer, "--duowide-vw", `${(hi - lo) / 100}px`);
        const a = box.getBoundingClientRect();
        if (a.right <= h + 0.5 && a.left >= l - 0.5) return;
        unsetProps(layer, ["--duowide-vw"]);
      }
      // A button or badge in the strip: move it out, as far from the strip as it was from the screen's edge.
      nudge(box, r.right > h ? h - r.right - margin(r) : l - r.left + margin(r));
    }
  }

  // ---------- text and controls under the strip ----------

  // Links, buttons and fields stay inside at every height: Safari takes every touch on its strip, so under it they
  // can't be pressed. Their row makes room on the strip's side; where that would change the row (an extra line, a
  // title re-wrapped), or they sit in no row, they slide over as a group. Left where the page put them: what a swipe
  // brings out from under the strip (a carousel the browser scrolls, and its arrows), and a link to the page a wider one
  // beside it opens (a list's comment count beside its title).
  //
  // Words and pictures run under a strip on the right as they are: Safari's strip is glass they show through, and
  // scrolling brings any line past the empty height between its buttons. Only a sentence with a link under the strip
  // gives up the strip's width, once, so the link comes in with its lines. A strip on the left hides where lines begin,
  // so there every line keeps clear of it, given the room once when first seen (stepping in and out while scrolling
  // would re-wrap it, words jumping between lines). Pictures, backgrounds and bars still run under it.
  const CONTROL = "a[href],button,input:not([type=hidden]),select,textarea,label,summary,[role=button],[role=link],[role=tab]," +
    "[role=menuitem],[role=checkbox],[role=switch],[role=option],[onclick],[tabindex]:not([tabindex='-1'])";
  // What acts on the page where it is, rather than going somewhere.
  const ACTS = "button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=checkbox],[role=switch],[role=tab],[role=menuitem],[role=option]";
  // Fields show what is typed or picked in them, so all of one belongs in the clear part, not just enough to tap.
  const FIELD = "input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=image],[type=submit],[type=button],[type=reset]),select,textarea";
  const fieldFrames = new WeakSet();  // boxes a page draws a field's frame on, just around it

  let movers = [];          // { el, props }: what the script moved inside, and how
  const insets = new Map(); // block -> its text nodes, given room for good: lines on the left, words around a link, rows for a control
  // A block given room for good by ending before the strip carries its color and border lines under the strip (see
  // underOf) for the height it had then: one that grows (a page's categories opened out) carries them again for its
  // new height, or its border's lines would paint a block of their color under the strip.
  const shades = new Map(); // block -> { gap, h }: the room it gave, and its height when its lines were drawn
  const shadeSizes = new ResizeObserver((entries) => {
    if (!strip) return;
    for (const { target } of entries) {
      const s = shades.get(target);
      if (!s || !target.isConnected) continue;
      const h = target.getBoundingClientRect().height;
      if (Math.abs(h - s.h) < 0.5) continue;
      s.h = h;
      unsetProps(target, ["box-shadow"]);
      const own = getComputedStyle(target).boxShadow, under = underOf(target, s.gap);
      if (under) setProp(target, "box-shadow", own && own !== "none" ? `${own}, ${under}` : under, "");
    }
    if (changes) changes.takeRecords();  // its own
  });
  const ends = new Set();   // carousels given room at their far end
  let scanY = 0;            // scrollY at the last look, which covered a few screens around it
  let scanTops = new WeakMap();  // the same for a box that scrolls a page of its own (see framesPage): its scrollTop

  // A link inside running text moves with its sentence.
  function inText(el) {
    if (el.localName !== "a") return false;
    const p = el.parentElement;
    if (!p || getComputedStyle(el).display !== "inline") return false;
    for (const n of p.childNodes) if (n !== el && n.nodeType === 3 && /[^\s·|,/\-–—•]{2,}/.test(n.data)) return true;
    return false;
  }

  // The box something slides sideways in (a carousel, scrolled natively or by the page's script). The reader swipes
  // things out from under the strip, so only its far end needs room, and what is in it keeps its place: a carousel the
  // page's script slides may copy its slides to loop round, styles and all, which would leave copies moved for good.
  // A box that only cuts off the end of its row (a menu a little too wide) is no carousel: one the page's script slides
  // has its slides moved (translated, or the box scrolled), or holds a good part of a screen more than it shows.
  function carouselOf(el) {
    for (let e = up(el); e && e !== document.body; e = up(e)) {
      if (e.scrollWidth <= e.clientWidth + 1) continue;
      const cs = getComputedStyle(e);
      if (/auto|scroll/.test(cs.overflowX)) return e;
      // (Not a whole page's wrapper: one taller than most of a screen, measured the same way the phone is held.)
      if (!/hidden|clip/.test(cs.overflowX) || e.getBoundingClientRect().height >= Math.max(innerWidth, innerHeight) * 0.8) continue;
      if (e.scrollLeft > 0 || e.scrollWidth > e.clientWidth * 1.5) return e;
      for (let s = el; s && s !== e; s = up(s)) {
        const ss = getComputedStyle(s);
        if (ss.transform !== "none" || ss.translate !== "none") return e;
      }
    }
    return null;
  }

  // The box the browser scrolls sideways that a carousel's own arrow is laid over or beside, the arrow sitting in the
  // carousel's frame rather than in the box: a swipe brings every slide out from under the strip, so the arrow may
  // stay there.
  function scrollerBeside(el) {
    const r = el.getBoundingClientRect(), y = (r.top + r.bottom) / 2;
    const near = (q) => q.top <= y && q.bottom >= y && q.left <= r.right + 1 && q.right >= r.left - 1;
    for (let e = el.parentElement, i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) {
      const walk = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
        acceptNode(n) {
          if (n === el) return NodeFilter.FILTER_REJECT;
          const q = n.getBoundingClientRect();
          if (!near(q)) return NodeFilter.FILTER_REJECT;
          // (A row of slides, not a whole page's wrapper.)
          return n.clientWidth >= 3 * r.width && n.scrollWidth > n.clientWidth + 1 && q.height < 1.5 * q.width &&
            /auto|scroll/.test(getComputedStyle(n).overflowX) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        },
      });
      const s = walk.nextNode();
      if (s) return s;
    }
    return null;
  }

  // Whether something rides with a carousel's slides, rather than being one of its own buttons (arrows, dots, pause)
  // that stay put while they slide: in one the browser scrolls everything rides along; in one the page's script
  // slides, what sits in the strip of slides (moved by the script, or far wider than the carousel), or in one of a row
  // of slides (alike in tag and class, and together wider than it; a row of dots is not).
  function inSlides(el, c) {
    if (/auto|scroll/.test(getComputedStyle(c).overflowX)) return true;
    const room = c.clientWidth + 1;
    for (let e = el; e && e !== c; e = e.parentElement) {
      if (e.getBoundingClientRect().width > room * 1.5) return true;
      if (e !== el) {  // its own turn or nudge is how it is drawn
        const cs = getComputedStyle(e);
        if (cs.transform !== "none" || cs.translate !== "none") return true;
      }
      const alike = e.parentElement ? [...e.parentElement.children].filter((x) => x.localName === e.localName && x.className === e.className) : [];
      if (alike.length > 1 && alike.reduce((w, x) => w + x.getBoundingClientRect().width, 0) > room) return true;
    }
    return false;
  }

  // The left and right ends of some text and how many lines it takes, from the boxes of its lines. Inside a block that
  // clips its text (a title cut short with an ellipsis), only the part the block shows counts.
  function textBox(nodes, block) {
    const range = document.createRange();
    const boxes = [];
    for (const n of nodes) {
      if (!n.isConnected) continue;
      range.selectNodeContents(n);
      for (const q of range.getClientRects()) if (q.width >= 0.5 && q.height >= 0.5) boxes.push(q);
    }
    if (!boxes.length) return null;
    boxes.sort((a, b) => a.top - b.top);
    let lines = 1, bottom = boxes[0].bottom, left = Infinity, right = -Infinity;  // a box starting below the line so far starts a new line
    for (const q of boxes) {
      if (q.top >= bottom - 2) { lines++; bottom = q.bottom; } else bottom = Math.max(bottom, q.bottom);
      left = Math.min(left, q.left);
      right = Math.max(right, q.right);
    }
    const top = boxes[0].top;
    const cs = block && getComputedStyle(block);
    if (cs && cs.overflowX !== "visible") {
      const b = block.getBoundingClientRect();
      left = Math.max(left, b.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0));
      right = Math.min(right, b.right - (parseFloat(cs.borderRightWidth) || 0) - (parseFloat(cs.paddingRight) || 0));
    }
    return { left, right, lines, top, bottom };
  }

  // Text held to a few lines (clamped, or cut off below by its own box): its width changes which of its words show,
  // not its height.
  function heldText(block) {
    const cs = getComputedStyle(block), clamp = cs.webkitLineClamp || cs.getPropertyValue("-webkit-line-clamp");
    return (!!clamp && clamp !== "none") || (/hidden|clip/.test(cs.overflowY) && block.scrollHeight > block.clientHeight + 1);
  }

  // Words held on one line (a list's title cut short with an ellipsis where its box ends): they can't wrap, or their
  // box is clamped to the one line. Room taken out of the box doesn't bring them onto another line, only cuts more of
  // them off.
  function oneLine(block, nodes) {
    const cs = getComputedStyle(block), clamp = cs.webkitLineClamp || cs.getPropertyValue("-webkit-line-clamp");
    if (clamp === "1") return true;
    return nodes.every((n) => { const s = getComputedStyle(n.parentElement); return /^(nowrap|pre)$/.test(s.whiteSpace) || s.textWrapMode === "nowrap"; });
  }

  // A block of running text, rather than a box that also holds other blocks, which giving it room would squeeze too.
  function textOnly(block) {
    for (const c of block.children) {
      const d = getComputedStyle(c).display;
      if (d === "none" || d === "contents" || d.startsWith("inline") || c.localName === "br") continue;
      if (c.getBoundingClientRect().height > 30) return false;
    }
    return true;
  }

  // Blocks whose text runs into the strip, with the text nodes that flow in them: on one line, or on several.
  function lineBlocks(hidden, onScreen) {
    const display = new Map();
    const blockOf = (el) => {
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        let d = display.get(e);
        if (d === undefined) display.set(e, (d = getComputedStyle(e).display));
        if (d !== "inline" && d !== "contents") return e;
      }
      return null;
    };
    const byBlock = new Map(), rects = new Map();
    const rectOf = (e) => { let r = rects.get(e); if (!r) rects.set(e, (r = e.getBoundingClientRect())); return r; };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.nodeType !== Node.ELEMENT_NODE) return /\S/.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        if (/^(script|style|noscript|textarea|select|option|title|template|svg)$/.test(n.localName)) return NodeFilter.FILTER_REJECT;
        // A box off the screen, or clear of the strip with nothing sticking out of it, holds no words running under
        // the strip: the walk skips what is inside it, which on a long page is most of it.
        const r = rectOf(n);
        if (r.width >= 1 && r.height >= 1 && (!onScreen(r) || (!hidden(r.left, r.right) && n.scrollWidth <= n.clientWidth + 1))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_SKIP;
      },
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const p = n.parentElement;
      if (!p) continue;
      const pr = rectOf(p);
      if (!onScreen(pr) || !hidden(pr.left, pr.right)) continue;
      const block = blockOf(p);
      if (!block || insets.has(block)) continue;
      if (!byBlock.has(block)) byBlock.set(block, []);
      byBlock.get(block).push(n);
    }
    const single = new Map(), multi = new Map(), long = new Map();
    for (const [block, nodes] of byBlock) {
      const b = block.getBoundingClientRect();
      if (b.height < 6) continue;  // text kept for screen readers
      const t = textBox(nodes, block);
      if (!t || !hidden(t.left, t.right)) continue;
      if (t.lines === 1) { if (b.height <= 160) single.set(block, nodes); continue; }
      // Running text is wide and stays inside its block; words stacked in a narrow box or pushed out of it are an
      // icon's label kept for screen readers. Many lines of it around pictures are an article's body.
      if (b.width < 100 || t.left < b.left - 2 || t.right > b.right + 2) continue;
      if (textOnly(block)) multi.set(block, nodes);
      else if (t.lines >= 4) long.set(block, nodes);
    }
    return { single, multi, long };
  }

  // Gives a block `px` more padding on the strip's side, out of its own width. Returns what it set and the page's own
  // value, or undoes it and returns null when the block's box moved or grew instead (or changed height, if it may not).
  // With `cut`, a line of words that would wrap onto another line is cut short with an ellipsis instead.
  const CUT = { "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" };
  function makeRoom(block, px, keepHeight, cut, narrow, tall) {
    if (narrow) return narrowRoom(block, px, keepHeight, tall);
    const side = strip.side === "right" ? "padding-right" : "padding-left";
    const b = block.getBoundingClientRect();
    const own = parseFloat(getComputedStyle(block).getPropertyValue(side)) || 0;
    const props = { [side]: `${own + px}px` };
    setProp(block, side, props[side], "");
    let a = block.getBoundingClientRect();
    if (Math.abs(a.width - b.width) > 0.5 && getComputedStyle(block).boxSizing !== "border-box") {
      props["box-sizing"] = "border-box";  // sized to its parent: give up the room from inside instead of growing
      setProp(block, "box-sizing", "border-box", "");
      a = block.getBoundingClientRect();
    }
    if (a.width > b.width + 0.5) {  // sized by its contents: held to the width it had, it gives up the room inside
      props["max-width"] = `${b.width}px`;
      setProp(block, "max-width", props["max-width"], "");
      a = block.getBoundingClientRect();
    }
    const same = () => Math.abs(a.left - b.left) < 1 && Math.abs(a.right - b.right) < 1 && (!keepHeight || Math.abs(a.height - b.height) < 1);
    if (!same() && cut && Math.abs(a.left - b.left) < 1 && Math.abs(a.right - b.right) < 1) {
      for (const [p, v] of Object.entries(CUT)) { props[p] = v; setProp(block, p, v, ""); }
      a = block.getBoundingClientRect();
    }
    if (same()) return { props };
    unsetProps(block, Object.keys(props));
    return null;
  }

  // A bar whose padding moves nothing has its parts placed against its own edge (a menu's "all" button laid over the
  // end of its tabs): the bar ends before the strip instead, as on a narrower phone, and its color carries on under
  // the strip. Only a bar one line tall (a menu, tabs, a header), so that a banner keeps running under the strip, or,
  // `tall`, words held to a few lines with a "more" laid over their end; and only if that changes nothing but its width.
  function narrowRoom(block, px, keepHeight, tall) {
    const right = strip.side === "right", side = right ? "margin-right" : "margin-left";
    const b = block.getBoundingClientRect(), cs = getComputedStyle(block);
    if (b.height > (tall ? 160 : 64)) return null;
    const own = parseFloat(cs.getPropertyValue(side)) || 0;
    const extra = besides(cs);
    // A margin narrows a bar sized by its parent; one given a width of its own is held to a narrower one.
    const kept = () => {
      const a = block.getBoundingClientRect();
      return (right ? Math.abs(a.left - b.left) < 1 && Math.abs(a.right - (b.right - px)) < 1
        : Math.abs(a.right - b.right) < 1 && Math.abs(a.left - (b.left + px)) < 1) && (!keepHeight || Math.abs(a.height - b.height) < 1);
    };
    let props = null;
    // (Held to a narrower width, a box on the left strip's side keeps to the far edge by an automatic margin.)
    const held = right ? { "max-width": `${b.width - px - extra}px` } : { "max-width": `${b.width - px - extra}px`, "margin-left": "auto" };
    // A field is held to its narrower width first: what it sits in may end before the strip too (a search form with its
    // button), and it then fills that, rather than keeping a gap of its own before the button.
    const field = block.matches(FIELD) || fieldFrames.has(block);
    for (const p of field ? [held, { [side]: `${own + px}px` }] : [{ [side]: `${own + px}px` }, held]) {
      for (const [k, v] of Object.entries(p)) setProp(block, k, v, "");
      if (kept()) { props = p; break; }
      unsetProps(block, Object.keys(p));
    }
    if (!props) return null;
    const under = !block.matches(FIELD) && !fieldFrames.has(block) && underOf(block, px);  // (a field comes in whole)
    if (under) {
      props["box-shadow"] = cs.boxShadow && cs.boxShadow !== "none" ? `${cs.boxShadow}, ${under}` : under;
      setProp(block, "box-shadow", props["box-shadow"], "");
    }
    return { props };
  }

  // Blocks around something (itself included), innermost first, that could make room for it: no taller than a row,
  // reaching into the strip, with as much of their width clear of it as they would give up.
  function* rowsOf(el, lo, hi, tallest = 160) {
    const right = strip.side === "right";
    let tries = 0;
    for (let e = el; e && e !== document.body && e !== document.documentElement && tries < 4; e = e.parentElement) {
      const b = e.getBoundingClientRect();
      if (b.height > tallest) return;
      if (b.height < 6 || insets.has(e)) continue;  // a wrapper with no height places its contents by itself
      const into = right ? b.right - hi : lo - b.left;
      const room = right ? hi - b.left : b.right - lo;
      if (into > 1 && room >= Math.min(strip.gap, into) && getComputedStyle(e).display !== "inline") { tries++; yield e; }
    }
  }

  // The cluster something sits in: the widest box around it that is still narrow (under half the screen), short, and
  // reaching into the strip itself.
  function groupOf(el, lo, hi, full) {
    let group = el;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const b = e.getBoundingClientRect();
      if (b.width >= full * 0.5 || b.height > 160) break;
      if (strip.side === "right" ? b.right <= hi + 0.5 : b.left >= lo - 0.5) break;
      group = e;
    }
    return group;
  }

  function clipOf(el) {
    for (let e = el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
      if (getComputedStyle(e).overflowX !== "visible") return e.getBoundingClientRect();
    }
    return null;
  }

  const before = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  // What the reader tells apart on screen, as boxes of a kind: lines of words ("text"); pictures (images, drawings,
  // background pictures) and controls that show no words, small ones as icons ("icon") and big ones as pictures
  // ("photo": a photo, or a link laid over a whole card or title to tap anywhere on it). A control that shows words is
  // where its words are, not all of its box, which may span a whole card. Only those level with [top, bottom]; past
  // `cap` nodes it gives up (null) rather than read a whole page.
  function marks(scope, top, bottom, cap = 800) {
    const out = [], seen = new Map(), range = document.createRange();
    const shown = (el) => {
      let v = seen.get(el);
      if (v === undefined) {
        const r = el.getBoundingClientRect();  // text kept for screen readers sits in a box a pixel wide
        v = r.width > 2 && r.height > 2 && !(el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
        seen.set(el, v);
      }
      return v;
    };
    // Where the boxes around an element let it show: one that cuts off what overflows it hides what is past its edges
    // (a row kept to one line, the items that don't fit wrapped onto a line below it).
    const cuts = new Map();
    const room = (el) => {
      if (!el || el === document.body || el === document.documentElement) return null;
      if (cuts.has(el)) return cuts.get(el);
      const cs = getComputedStyle(el);
      let r = cs.position === "fixed" ? null : room(el.parentElement);  // (placed on the screen by itself)
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        const b = el.getBoundingClientRect();
        r = !r ? b : new DOMRect(Math.max(r.left, b.left), Math.max(r.top, b.top), Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left)),
          Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)));
      }
      cuts.set(el, r);
      return r;
    };
    const level = (q, holder) => {
      if (!(q.width > 2 && q.height > 2 && q.bottom > top && q.top < bottom)) return false;
      const r = room(holder);
      return !r || (Math.min(q.right, r.right) - Math.max(q.left, r.left) > 2 && Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top) > 2);
    };
    // The lines a text shows: inside its own box (text kept for screen readers is pushed out of it), and cut where
    // the box cuts it off: at its padding, or where a title ends in an ellipsis, at its content's edge.
    const lines = (t) => {
      let p = t.parentElement;
      if (!p || !/\S/.test(t.data) || !shown(p)) return [];
      while (p.parentElement && /^(inline|contents)$/.test(getComputedStyle(p).display)) p = p.parentElement;  // the box its lines run in
      const ps = getComputedStyle(p), cut = ps.overflowX !== "visible", dots = cut && ps.textOverflow === "ellipsis";
      const b = p.getBoundingClientRect(), side = (k) => (parseFloat(ps[`border${k}Width`]) || 0) + (dots ? parseFloat(ps[`padding${k}`]) || 0 : 0);
      const pr = cut ? new DOMRect(b.left + side("Left"), b.top, b.width - side("Left") - side("Right"), b.height) : b;
      range.selectNodeContents(t);
      const out = [];
      for (const q of range.getClientRects()) {
        if (q.width <= 2 || q.height <= 2 || q.right <= pr.left || q.left >= pr.right || q.bottom <= pr.top - 2 || q.top >= pr.bottom + 2) continue;
        out.push(cut ? new DOMRect(Math.max(q.left, pr.left), q.top, Math.min(q.right, pr.right) - Math.max(q.left, pr.left), q.height) : q);
      }
      return out;
    };
    const kind = (q) => (q.width > 64 || q.height > 64 ? "photo" : "icon");
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_ACCEPT;
        if (/^(script|style|noscript|template)$/.test(node.localName) || node.ownerSVGElement) return NodeFilter.FILTER_REJECT;
        if (node.checkVisibility && !node.checkVisibility()) return NodeFilter.FILTER_REJECT;  // not displayed
        const r = node.getBoundingClientRect();  // a box well above or below holds nothing level with it
        return r.height >= 1 && (r.bottom < top - 200 || r.top > bottom + 200) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    let n = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (++n > cap) return null;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        for (const q of lines(node)) if (level(q, node.parentElement)) out.push({ q, node, kind: "text" });
        continue;
      }
      const control = node.matches(CONTROL);
      const picture = /^(img|svg|video|canvas|iframe|embed|object)$/.test(node.localName) || /url\(/.test(getComputedStyle(node).backgroundImage);
      // A component that draws its insides where they can't be read: all of its box counts, as words if it is big.
      const sealed = !!node.shadowRoot || (node.localName.includes("-") && !node.firstElementChild && !/\S/.test(node.textContent));
      if (sealed && !control) {
        const q = node.getBoundingClientRect();
        if (level(q, node.parentElement) && shown(node)) out.push({ q, node, kind: q.width > 64 || q.height > 64 ? "text" : "icon" });
        continue;
      }
      if (!control && !picture) continue;
      const q = node.getBoundingClientRect();
      if (!level(q, node.parentElement) || !shown(node)) continue;
      // Where it is pressed, too: two of these on top of each other take each other's taps.
      if (control) out.push({ q, node, kind: "tap" });
      if (control) {
        const words = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let shows = false;
        for (let t = words.nextNode(); t && !shows; t = words.nextNode()) shows = lines(t).length > 0;
        if (shows) continue;
      }
      out.push({ q, node, kind: kind(q), picture });
    }
    return out;
  }

  // Two of them on top of each other: across more than a sliver, and level by a good part of a line.
  const covers = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.height, b.height) * 0.4;

  // Two places to press on top of each other so much that one takes a good part of the other's taps (a tile slid
  // half over the next), or at all when they are of a size (a pause button on the page count beside it): not a small
  // button on a picture or card that is pressed everywhere else.
  const crowds = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    const big = Math.max(a.width * a.height, b.width * b.height), small = Math.min(a.width * a.height, b.width * b.height);
    return w > 2 && h > 2 && (w * h > 0.25 * big || big < 4 * small);
  };

  // The pairs of them that sit on top of each other (a control and its own words aside, and an icon on a picture):
  // any two, or one inside `part` and one outside it. A change may keep the pairs there were, not make new ones.
  // With `whole`, what lies on a carousel from outside it is left out: the slides pass under what the page lays over
  // them (a menu's "all" button at the end of its tabs) and are swiped out from under it.
  const ids = new WeakMap();
  let lastId = 0;
  const idOf = (n) => { let i = ids.get(n); if (!i) ids.set(n, (i = ++lastId)); return i; };
  function overlaps(list, part, whole) {
    const out = new Set(), cars = new Map(), ctl = new Map();
    const pressed = (t) => {
      let c = ctl.get(t);
      if (c === undefined) ctl.set(t, (c = !!(t.parentElement && t.parentElement.closest(CONTROL))));
      return c;
    };
    const carOf = (n) => {
      const el = n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement;
      let c = cars.get(el);
      if (c === undefined) cars.set(el, (c = el ? carouselOf(el) : null));
      return c;
    };
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.node.contains(b.node) || b.node.contains(a.node) || (part && part.contains(a.node) === part.contains(b.node))) continue;
        if ((a.kind === "tap") !== (b.kind === "tap")) {
          // Where one is pressed counts against the words of another one, which it would take the taps of.
          const w = a.kind === "tap" ? b : a;
          if (w.kind !== "text" || !pressed(w.node)) continue;
        } else if (a.kind === "tap" && !crowds(a.q, b.q)) continue;
        if ((a.kind === "photo" && b.kind !== "text") || (b.kind === "photo" && a.kind !== "text")) continue;  // icons may sit on pictures, words not
        if (!covers(a.q, b.q) || (whole && carOf(a.node) !== carOf(b.node))) continue;
        out.add(Math.min(idOf(a.node), idOf(b.node)) + ":" + Math.max(idOf(a.node), idOf(b.node)));
      }
    }
    return out;
  }
  const worse = (before, after) => [...after].some((k) => !before.has(k));

  // Words that sat on one line and now break onto more: a label squeezed down to a letter a line. Making room may carry
  // whole parts of a row onto another line, never split one.
  function lineCounts(list) {
    const rects = new Map();
    for (const m of list) if (m.kind === "text") { if (!rects.has(m.node)) rects.set(m.node, []); rects.get(m.node).push(m.q); }
    const out = new Map();
    for (const [node, qs] of rects) {
      qs.sort((a, b) => a.top - b.top);
      let n = 0, last = -Infinity;
      for (const q of qs) if (q.top > last + q.height / 2) { n++; last = q.top; }
      out.set(node, n);
    }
    return out;
  }
  const broken = (before, after) => { const was = lineCounts(before); return [...lineCounts(after)].some(([node, n]) => n > 1 && was.get(node) === 1); };
  // Photos that came out narrower. Making room for a control keeps every photo its size: a photo with a button on its
  // corner keeps its width, and the button moves over it instead. Pictures a third of the page wide or less may give a
  // little (a menu's grid of tiles brought inside).
  const shrunk = (before, after) => {
    const was = new Map(), big = (strip.full - strip.gap) / 3;
    for (const m of before) if (m.picture && m.q.width > big) was.set(m.node, m.q.width);
    return after.some((m) => was.has(m.node) && m.q.width < was.get(m.node) - 1);
  };
  // Something not seen in the row at all any more, that no swipe brings back: a row of the page's own that keeps to one
  // line hides what no longer fits on it (a greeting and an account button wrapping onto a line their box cuts off).
  const gone = (before, after) => {
    const have = new Set(after.map((m) => m.node));
    return before.some((m) => !have.has(m.node) && !carouselOf(m.node.nodeType === 1 ? m.node : m.node.parentElement));
  };
  // tests: the pairs a change would add, by name
  const newPairs = (seen, now, part, whole) => {
    const names = new Map();
    for (const m of [...seen, ...now]) names.set(String(idOf(m.node)), m.kind + ":" + (m.node.nodeType === 3 ? m.node.data.trim().slice(0, 16) : m.node.localName + "." + String(m.node.className).slice(0, 16)));
    const before = overlaps(seen, part, whole);
    return [...overlaps(now, part, whole)].filter((k) => !before.has(k)).map((k) => k.split(":").map((i) => names.get(i)).join(" / "));
  };

  // Something on screen to hold in place while text above it re-wraps. At the top of the page there is none: the page
  // stays at its top, where the reader starts (words fitted before they show would open it scrolled down).
  function anchorNow() {
    if (scrollY < 1) return null;
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 3);
    return el && el !== document.documentElement && el !== document.body ? { el, top: el.getBoundingClientRect().top } : null;
  }
  function keepAnchor(a) {
    if (!a || !a.el.isConnected) return;
    const d = a.el.getBoundingClientRect().top - a.top;
    if (Math.abs(d) > 0.5) scrollTo(pinX(), scrollY + d);
  }

  // How a look measures things against the strip.
  function reach({ lo, hi, min, max }) {
    const right = strip.side === "right";
    // A few screens around this one, more of them ahead, so things are in place before they scroll into view.
    const near = (r) => r.bottom > -3 * innerHeight && r.top < 6 * innerHeight;
    const onScreen = (r) => r.width >= 1 && r.height >= 1 && r.right > min && r.left < max && near(r);
    const hidden = (l, r) => (right ? r > hi + 1 : l < lo - 1);
    // How far a box gives way to clear the strip: what it keeps from the screen's edge (up to 16px) it keeps from the
    // strip, rather than ending against it.
    const need = (b) => Math.min(strip.gap, right ? b.right - hi + margin(b) : lo - b.left + margin(b));
    // A place to press that shows too little of itself beside the strip to be pressed (see stuckControl).
    const covered = (r) => Math.min(r.right, hi) - Math.max(r.left, lo) < Math.min(pt(TAP), r.width * 0.7) - 0.5;
    return { right, onScreen, hidden, need, covered };
  }

  // Text first: on the left it changes the page's height, so the rest is measured after it. A strip on the left hides
  // where lines begin, and a title stepping in beside lines that stay put would leave a ragged edge: every line there
  // keeps clear of it for good. So do the words on the right that are read from line to line, which would end their
  // lines under Safari's buttons, all alike: a post's or an article's paragraphs, a comment, a notice of a line or
  // two, a title in a list that wraps (held to a few lines, it shows fewer words). Left as they are: a table's cells,
  // code, a bar of links or buttons (they move by themselves, below), a short label at the end of a row (a nickname, a
  // time), which starts under the strip or is too short to be a line of words, words held on one line, which room
  // would only cut shorter, and a box that would squeeze its pictures. With DuoWide-WideText on, the reader would
  // rather have more words on a line: those on the right run on under the strip as pictures do, all but the ones
  // around a link of theirs that it covers, which come in for the link to be pressed.
  // Returns the blocks of words it found, on one line and on several, and how it gives one room.
  function fitLines(band, usable) {
    const { lo, hi } = band, { right, onScreen, hidden, need, covered } = reach(band);
    const { single, multi, long } = lineBlocks(hidden, onScreen);
    const wide = right && wideText();
    let lasting = new Map([...multi, ...single]);
    if (right) {
      const reads = (b, nodes) => {
        if (b.closest("table, pre, [role=table], [role=grid]")) return false;
        // (Words held on one line run on under the strip, where the wider screen is there to show more of them: given
        // room, Clien's list titles ended in "…" well short of their comment counts, which stay under the strip.)
        if (oneLine(b, nodes)) return false;
        const t = textBox(nodes, b);
        if (!t || t.left > hi - pt(TAP) || (t.lines === 1 && t.right - t.left < Math.min(160, (hi - lo) / 2))) return false;
        let own = 0, all = 0;
        for (const n of nodes) {
          const len = n.data.trim().length, c = n.parentElement.closest(CONTROL);
          all += len;
          if (!c || c === b || !b.contains(c)) own += len;
        }
        // (A box that also holds other boxes is read as lines when its own words fill them, as an article's do around
        // its pictures: not a card's scattered labels. Its pictures would be squeezed.)
        if (long.has(b) && (all / t.lines < 20 || [...b.querySelectorAll("img, picture, video, iframe, canvas, svg, table")].some((m) => m.getBoundingClientRect().height > 40))) return false;
        // (A bar: two controls or more, holding most of its words, on one line. Links that run on over several lines,
        // as words do (a page's categories or tags), wrap as words do: placed one by one instead, each would land on
        // the next.)
        return own >= all / 2 || b.querySelectorAll(CONTROL).length < 2 || t.lines > 1;
      };
      const linkUnder = (b, nodes) => nodes.some((n) => {
        const c = n.parentElement.closest(CONTROL), r = c && c.getBoundingClientRect();
        return !!c && c !== b && b.contains(c) && onScreen(r) && covered(r);
      });
      lasting = new Map([...multi, ...long, ...single].filter(([b, nodes]) => reads(b, nodes) && (!wide || linkUnder(b, nodes))));
      // (The outer box first: a paragraph inside one that made room is clear of the strip already.)
      const depth = (e) => { let d = 0; for (let p = e.parentElement; p; p = p.parentElement) d++; return d; };
      lasting = new Map([...lasting].sort((a, b) => depth(a[0]) - depth(b[0])));
    }
    const giveRoom = (block, nodes, link) => {
      if (!usable(block)) return;
      const b = block.getBoundingClientRect(), was = textBox(nodes, block), held = heldText(block);
      const px = need(b);
      // Words held to a few lines end before the strip as a narrower box: a page places the "more" laid over their
      // end by the box's width, which room taken inside it would not change (LinkedIn's feed).
      const room = px >= 1 && ((held && makeRoom(block, px, false, false, true, true)) || makeRoom(block, px, false));
      if (!room) return;
      // Held to its width, a label that sizes its box would break up rather than come in; words that can't wrap (held
      // on one line) don't come in at all. On the right, neither do words that would wrap onto a line their box cuts
      // off (a title in a box one line high), unless the room is to bring a link in.
      const now = textBox(nodes, block);
      if (("max-width" in room.props && single.has(block) && (now || { lines: 1 }).lines > 1) || (right && !link && !held && heldText(block)) ||
        (was && now && (right ? now.right > was.right - 0.5 : now.left < was.left + 0.5))) { unsetProps(block, Object.keys(room.props)); return; }
      insets.set(block, nodes);
      if ("box-shadow" in room.props) { shades.set(block, { gap: px, h: block.getBoundingClientRect().height }); shadeSizes.observe(block); }
    };
    const anchor = lasting.size ? anchorNow() : null;
    for (const [block, nodes] of lasting) giveRoom(block, nodes, wide);
    keepAnchor(anchor);
    return { single, multi, giveRoom };
  }

  function scanMovers(band, boxes) {
    const { lo, hi, min, max } = band, { right, onScreen, hidden, need, covered } = reach(band), full = max - min;
    const trace = dbg && dbg.trace ? (el, ...why) => dbg.trace.push([el, ...why]) : () => {};  // tests: why something stayed
    for (const m of movers) unsetProps(m.el, Object.keys(m.props));
    movers = [];
    scanY = scrollY;
    scanTops = new WeakMap();
    // A field shows all of itself, its frame as well where the page draws that on a box just around it rather than on the
    // field (a border round a sign-in form's field): that box comes inside whole.
    const frameOf = (el) => {
      const r = el.getBoundingClientRect();
      let frame = el;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const b = p.getBoundingClientRect();
        if (b.left < r.left - 4 || b.right > r.right + 4 || b.top < r.top - 4 || b.bottom > r.bottom + 4) break;
        const cs = getComputedStyle(p);
        if (parseFloat(cs.borderRightWidth) || parseFloat(cs.borderBottomWidth) || painted(cs.backgroundColor) || cs.boxShadow !== "none") frame = p;
      }
      if (frame !== el) fieldFrames.add(frame);
      return frame;
    };
    const stuckControl = (el) => {
      const r = el.getBoundingClientRect();
      // It is pressed on the part that shows, if that is as wide as the smallest button (a big one half under the strip,
      // a grid's last column, is pressed beside it) or most of a small one; a wide one shows its end (a row's ›, a
      // team's logo) under the strip with the words.
      return onScreen(r) && (el.matches(FIELD) || fieldFrames.has(el) ? hidden(r.left, r.right) : covered(r));
    };
    const visible = (el) => !(el.checkVisibility && !el.checkVisibility({ visibilityProperty: true }));
    const usable = (el) => !inFixed(el, boxes) && !carouselOf(el) && visible(el);

    // Players first, as they may get shorter. One under the strip ends before it for good once it is pressed or plays
    // (see waits), its picture a little narrower, as on a phone without the strip: its full screen and sound buttons
    // sit on its own edges where the script can't move them (see playerOf). Pictures that move run under the strip; one
    // in a fixed box goes with it. A component may lay one in its own open inside: a wiki's video is a picture with a
    // play button that turns into its frame there when pressed, under the strip until the next look.
    for (const el of [document, ...shadows].flatMap((root) => [...root.querySelectorAll(MEDIA)])) {
      const player = playerOf(el);
      if (!player || insets.has(player) || !usable(player)) continue;
      const pr = player.getBoundingClientRect();
      if (pr.width < 120 || pr.height < 80 || !onScreen(pr) || !hidden(pr.left, pr.right)) continue;
      if (waits(player)) { trace(player, "player", "waits to be pressed"); continue; }
      // One laid over a box that keeps its shape (an embed filling a box as tall as a share of its width) narrows with
      // the boxes around it that hold nothing else, the outermost first, so that it keeps its shape too; failing that,
      // on its own.
      const tries = [player];
      if (getComputedStyle(player).position === "absolute") {
        for (let p = up(player), i = 0; p && p !== document.body && i < 4; p = up(p), i++) {
          const q = p.getBoundingClientRect();
          if (/^table/.test(getComputedStyle(p).display) || [q.left - pr.left, q.right - pr.right, q.top - pr.top, q.bottom - pr.bottom].some((d) => Math.abs(d) > 1)) break;
          tries.unshift(p);
        }
      }
      for (const box of tries) {
        const r = box.getBoundingClientRect();
        const cs = getComputedStyle(box);
        const extra = besides(cs);
        const end = hi - margin(r);
        const props = { "max-width": `${(right ? end - r.left : r.right - lo - margin(r)) - extra}px` };
        if (!right) props["margin-left"] = "auto";  // (held to a narrower width, it keeps to the far edge)
        // (One placed against the right edge of its box keeps its left edge instead, as does one its box centers.)
        else if (cs.position === "absolute") Object.assign(props, { left: `${box.offsetLeft - (parseFloat(cs.marginLeft) || 0)}px`, right: "auto" });
        else if (!/^inline/.test(cs.display)) props["margin-left"] = cs.marginLeft;
        const around = [];  // the boxes around it, where they started
        for (let p = up(box), i = 0; right && p && p !== document.body && i < 8; p = up(p), i++) around.push([p, p.getBoundingClientRect().left]);
        for (const [p, v] of Object.entries(props)) setProp(box, p, v);
        let a = box.getBoundingClientRect(), held = null;
        if (right && a.right > hi + 0.5 && a.left > r.left + 0.5) {
          // A box around it that narrows with it and is centered in its own came in with it (a wiki's table holding a
          // video): that box keeps its left edge instead.
          let moved = null;
          for (const [p, left] of around) { if (p.getBoundingClientRect().left > left + 0.5) moved = p; else break; }
          if (moved && !/^inline/.test(getComputedStyle(moved).display)) {
            held = moved;
            setProp(held, "margin-left", `${parseFloat(getComputedStyle(held).marginLeft) - (held.getBoundingClientRect().left - around.find(([p]) => p === held)[1])}px`);
            a = box.getBoundingClientRect();
            if (a.right > hi + 0.5 || Math.abs(a.left - r.left) > 0.5) { unsetProps(held, ["margin-left"]); held = null; a = box.getBoundingClientRect(); }
          }
        }
        if (right && !held && a.right > hi + 0.5 && a.left > r.left + 0.5) {
          // Laid in a centered line, it narrows from both sides: narrower by twice what still lies under the strip.
          const w = parseFloat(props["max-width"]) - 2 * (a.right - end);
          if (w >= 120) { props["max-width"] = `${w}px`; setProp(box, "max-width", props["max-width"]); a = box.getBoundingClientRect(); }
        }
        // (It stays within where it was, only ending before the strip.)
        if (right ? a.right <= hi + 0.5 && a.left >= r.left - 0.5 : a.left >= lo - 0.5 && Math.abs(a.right - r.right) < 1) { insets.set(box, []); trace(box, "player"); break; }
        else {
          unsetProps(box, Object.keys(props));
          if (held) unsetProps(held, ["margin-left"]);
          trace(box, "player", "would not narrow");
        }
      }
    }

    // Text first (see fitLines).
    const { single, multi, giveRoom } = fitLines(band, usable);

    // Read everything first and write afterwards, so the page lays out a few times per look, not once per item.
    // linked: words around a link under the strip; tabled: what is under the strip in a table
    const stuck = new Set(), carousels = new Set(), linked = new Map(), tabled = [];
    // A link to the page a wider one in its row opens (a list's comment count beside its title, or its picture): the
    // wider one gets the reader there. Links that only act on this page (#, a script's) don't count.
    const here = location.origin + location.pathname + location.search;
    const pageOf = (a) => {
      try {
        const u = new URL(a.href), k = u.origin + u.pathname + u.search;
        return /^https?:$/.test(u.protocol) && k !== here ? k : null;
      } catch (e) { return null; }
    };
    const sideDoor = (el) => {
      const k = el.localName === "a" && pageOf(el);
      if (!k) return false;
      const w = el.getBoundingClientRect().width;
      // (Its row: the nearest box around it that holds another link.)
      for (let e = el.parentElement, i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) {
        const others = [...e.querySelectorAll("a[href]")].filter((a) => !a.contains(el) && !el.contains(a));
        if (others.length) return others.some((a) => pageOf(a) === k && a.getBoundingClientRect().width >= 2 * w && !stuckControl(a));
      }
      return false;
    };
    for (const el of document.querySelectorAll(CONTROL)) {
      // Most are clear of the strip: that is the quickest thing to look at.
      if (!stuckControl(el)) continue;
      // One inside another stuck one moves with it. Inside one that shows (a card that is a link), a button of its own
      // on its edge (a "more" over its clamped lines, a bookmark) is pressed on its own; a link in it (a list row's
      // nickname) stays with it, as the small words at the end of a row do.
      const outer = el.parentElement && el.parentElement.closest(CONTROL);
      if (outer && (stuckControl(outer) || !el.matches(ACTS))) { trace(el, "inside", outer); continue; }
      if (inText(el) || inFixed(el, boxes) || !visible(el)) {
        trace(el, inText(el) ? "in text" : inFixed(el, boxes) ? "in a fixed box" : "hidden");
        // A link in a sentence comes in with its lines: on the right, the words around it are given room after all.
        if (right && inText(el) && visible(el)) {
          if (el.closest("table")) tabled.push(el);
          for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
            const nodes = multi.get(e) || single.get(e);
            if (nodes) { linked.set(e, nodes); break; }
          }
        }
        continue;
      }
      if (sideDoor(el)) { trace(el, "side door"); continue; }
      const c = carouselOf(el) || scrollerBeside(el);
      if (c) carousels.add(c);
      if (c) trace(el, "carousel", c, inSlides(el, c) ? "swiped" : "its button");
      if (!c || !inSlides(el, c)) {
        stuck.add(el.matches(FIELD) ? frameOf(el) : el);
        if (right && el.closest("table")) tabled.push(el);
      }
    }
    // A table keeps its cells in their columns: one with a place to press under the strip comes inside whole, laid out
    // as on a phone without the strip, its words wrapping onto more lines and its pictures smaller if they must (a
    // wiki's table of a tournament's rounds, the last one under the strip). A cell given room squeezes the ones beside
    // it, and one slid over lands on the next one and takes its taps.
    if (tabled.length || linked.size) {
      const at = anchorNow(), seenTables = new Set(), tablesIn = new Set();
      // One too wide to come in that is laid in a box scrolling sideways (a wiki's) slides in it instead, as on a phone
      // without the strip: the box ends before the strip, and the reader swipes the rest out from under it.
      const slide = (t, el) => {
        for (let s = t.parentElement, i = 0; s && s !== document.body && i < 3; s = s.parentElement, i++) {
          const cs = getComputedStyle(s);
          if (!/auto|scroll/.test(cs.overflowX)) continue;
          const b = s.getBoundingClientRect(), px = need(b);
          // (A box for the table, not one a whole page or article scrolls in.)
          if (px < 1 || b.width - px < b.width / 2 || b.height > t.getBoundingClientRect().height + 40) return false;
          const props = { "max-width": `${b.width - px - besides(cs)}px` };
          if (!/^inline/.test(cs.display)) props["margin-left"] = cs.marginLeft;
          for (const [p, v] of Object.entries(props)) setProp(s, p, v, "");
          const a = s.getBoundingClientRect(), slides = a.right <= hi + 0.5 && Math.abs(a.left - b.left) < 1 && s.scrollWidth > s.clientWidth + 1;
          trace(el, "table", s, slides ? "slides" : "would not slide");
          if (slides) { insets.set(s, []); return true; }
          unsetProps(s, Object.keys(props));
          return false;
        }
        return false;
      };
      for (const el of tabled) {
        if (!stuckControl(el)) continue;  // its table came in already
        let outer = null;  // the outermost one reaching under the strip
        for (let t = el.closest("table"); t && !insets.has(t); t = t.parentElement && t.parentElement.closest("table")) {
          if (seenTables.has(t)) continue;
          seenTables.add(t);
          if (!usable(t)) break;
          const b = t.getBoundingClientRect(), cs = getComputedStyle(t), px = need(b);
          if (b.right <= hi + 0.5 || b.width - px < b.width / 2) continue;  // (one around it may)
          outer = t;
          const extra = besides(cs);
          const block = !/^inline/.test(cs.display), was = parseFloat(cs.marginLeft) || 0;
          const props = { "max-width": `${b.width - px - extra}px` };
          if (block) props["margin-left"] = `${was}px`;  // (a centered one keeps its left edge)
          const seen = marks(t, b.top, b.bottom);
          for (const [p, v] of Object.entries(props)) setProp(t, p, v, "");
          let a = t.getBoundingClientRect();
          // One that can't be that narrow (pictures side by side) and stands away from the left of the box it is in (a
          // centered one) goes over to the left as well, as far as that box lets it.
          if (block && a.right > b.right - px + 0.5) {
            const hb = t.parentElement.getBoundingClientRect(), hs = getComputedStyle(t.parentElement);
            const left = Math.max(hb.left + (parseFloat(hs.borderLeftWidth) || 0) + (parseFloat(hs.paddingLeft) || 0), a.left - (a.right - (b.right - px)));
            if (left < a.left - 0.5) { props["margin-left"] = `${Math.round((was - (a.left - left)) * 100) / 100}px`; setProp(t, "margin-left", props["margin-left"], ""); a = t.getBoundingClientRect(); }
          }
          const now = seen && marks(t, a.top, a.bottom), lost = !!(now && gone(seen, now));
          const inside = a.right <= hi + 0.5 && a.left <= b.left + 0.5;
          trace(el, "table", t, !inside ? "can't narrow" : lost ? "gone from sight" : stuckControl(el) ? "still stuck" : "in");
          if (inside && !lost && !stuckControl(el)) { insets.set(t, []); tablesIn.add(t); outer = null; break; }
          unsetProps(t, Object.keys(props));
        }
        if (outer && slide(outer, el)) tablesIn.add(outer);
      }
      for (const [block, nodes] of linked) if (![...tablesIn].some((t) => t.contains(block))) giveRoom(block, nodes, true);
      keepAnchor(at);
    }
    const items = [...stuck].sort(before);
    // Not stuck any more once a row made room for it, or once it rides in a carousel (a row of tabs that ended before the
    // strip now slides them): it is swiped out from under the strip.
    const stillStuck = (el) => {
      const c = carouselOf(el);
      if (c && inSlides(el, c)) return false;
      return stuckControl(el);
    };
    // The end of something that faces the strip, to see whether making room moved it.
    const edge = (el) => { const r = el.getBoundingClientRect(); return right ? r.right : r.left; };
    // Running text inside a row, which must not re-wrap when the row makes room for a control: all of it on the right,
    // given room already on the left. Text held to a few lines may, keeping its height: a "more" laid over the end of
    // its last line comes in with its lines rather than off them.
    const running = right ? new Map([...multi, ...insets]) : insets;
    // (Once it was given room of its own, it keeps its lines as they are.)
    const wrapped = (row) => [...running].filter(([b]) => row.contains(b)).map(([b, n]) => [b, n, textBox(n, b), heldText(b) && !insets.has(b) ? b.getBoundingClientRect().height : 0]);
    const sameText = (t, u) => (!t && !u) || (t && u && t.lines === u.lines && Math.abs(t.left - u.left) < 1 && Math.abs(t.right - u.right) < 1);
    const unchanged = ([b, n, t, held]) => (held ? Math.abs(b.getBoundingClientRect().height - held) < 1 : sameText(textBox(n, b), t));

    // The nearest row that can make room does, if that moves the thing in and leaves the row's own box as it was (no
    // extra line, no growing past its edge), its running text as it was, and nothing in it squeezed on top of anything
    // else (words of a tab bar running into each other).
    const pads = [], padded = new Set(), lossy = new Map();  // lossy: a control -> room that would hide some of its row
    for (const el of items) {
      if (!stillStuck(el)) continue;  // a row made room for it already
      for (const row of rowsOf(el, lo, hi)) {
        if (padded.has(row)) break;
        const b = row.getBoundingClientRect();
        const was = edge(el), kept = wrapped(row), seen = marks(row, b.top, b.bottom);
        if (!seen) { trace(el, "pad", row, "too much to read"); continue; }
        const px = need(b);
        // Padding first. Where that moves nothing, or squeezes its parts onto each other (a logo onto a link placed
        // beside it), the row ends before the strip as a whole instead, the parts placed against it coming along.
        // (Words held to a few lines take new places under what is laid over their end: those are left out.)
        const held = kept.filter(([, , , h]) => h).map(([bl]) => bl), tall = held.length > 0 && seen.every((m) => m.kind !== "photo");
        const loose = (list) => list && list.filter((m) => !held.some((bl) => bl.contains(m.node)));
        let done = false;
        for (const narrow of [false, true]) {
          const room = makeRoom(row, px, true, false, narrow, tall);
          if (!room) { trace(el, "pad", row, narrow ? "can't narrow" : "row would change"); continue; }
          const now = marks(row, b.top, b.bottom);
          const moved = Math.abs(edge(el) - was) > 0.5, same = kept.every(unchanged);
          const fresh = now && worse(overlaps(loose(seen), null, true), overlaps(loose(now), null, true)), split = now && broken(loose(seen), loose(now)), small = now && shrunk(seen, now);
          const lost = now && gone(loose(seen), loose(now));
          trace(el, "pad", row, narrow ? "narrowed" : "padded", moved ? "moved" : "not moved", same ? "" : "text rewrapped", split ? "words broken" : "", small ? "picture shrunk" : "", lost ? "gone from sight" : "", now && (fresh ? "new overlap" : "no new overlap"), dbg && dbg.trace && now && fresh ? newPairs(seen, now, null, true) : "");
          if (moved && same && now && !fresh && !split && !small && !lost) {
            pads.push({ el: row, ...room });
            padded.add(row);
            done = true;
            break;
          }
          if (moved && same && now && !fresh && !split && !small && !lossy.has(el)) lossy.set(el, { row, again: () => makeRoom(row, need(row.getBoundingClientRect()), true, false, narrow, tall) });
          unsetProps(row, Object.keys(room.props));
        }
        if (done) break;
      }
    }

    // Items of one list look alike (a notification list's cards): where room in some brings their controls in while the
    // controls of others still lie under the strip (room there would re-wrap or hide some of their words), those give
    // their room back and all of them slide their controls over, below, rather than every other card ending before the
    // strip. One that then can't slide over takes its room again. Items are boxes one under another in one box, of one
    // tag and kind (their first class, or list items), starting at one left edge.
    const itemOf = (el) => {
      for (let a = el; a.parentElement && a.parentElement !== document.body; a = a.parentElement) {
        const kind = a.classList[0];
        if (!kind && a.localName !== "li") continue;
        const left = a.getBoundingClientRect().left;
        if ([...a.parentElement.children].some((s) => s !== a && s.localName === a.localName && s.classList[0] === kind && Math.abs(s.getBoundingClientRect().left - left) < 1)) return a;
      }
      return null;
    };
    const lists = new Map();  // a list -> its items here with their controls, whether room brought some in, whether some are out
    for (const el of items) {
      const item = itemOf(el);
      if (!item) continue;
      const list = lists.get(item.parentElement) || { els: [], roomy: false, out: false };
      list.els.push([el, item]);
      if (stillStuck(el)) list.out = true;
      else if (pads.some((m) => item.contains(m.el) && m.el.contains(el))) list.roomy = true;
      lists.set(item.parentElement, list);
    }
    const alike = new Map();  // a control that slides over with the rest of its list -> the room its item gave back
    for (const { els, roomy, out } of lists.values()) {
      if (!roomy || !out) continue;
      for (const [el, item] of els) {
        const i = pads.findIndex((m) => item.contains(m.el) && m.el.contains(el));
        alike.set(el, i < 0 ? null : pads[i]);
        if (i < 0) continue;
        trace(el, "pad", pads[i].el, "given back: others of its list slide over");
        unsetProps(pads[i].el, Object.keys(pads[i].props));
        padded.delete(pads[i].el);
        pads.splice(i, 1);
      }
    }

    // A control no row can make room for without growing taller gets room for good from the nearest box around it
    // that can give it, its lines wrapping onto more lines if they must (a grid of buttons with one fewer to a row), as
    // running text does: controls stay inside at every height, so this changes the page once, not while scrolling.
    const held = anchorNow();
    let grew = false;
    for (const el of items) {
      if (!stillStuck(el) || alike.has(el)) continue;
      for (const row of rowsOf(el, lo, hi, innerHeight)) {
        if (padded.has(row)) break;
        const b = row.getBoundingClientRect();
        const kept = wrapped(row), seen = marks(row, b.top, b.bottom);
        if (!seen) continue;
        let room = makeRoom(row, need(b), false);
        // A row of buttons held on one line (page numbers up to "next") may run onto a second one instead.
        const rs = getComputedStyle(row);
        if ((!room || stillStuck(el)) && /flex/.test(rs.display) && rs.flexWrap === "nowrap" && !/column/.test(rs.flexDirection)) {
          if (room) unsetProps(row, Object.keys(room.props));
          setProp(row, "flex-wrap", "wrap", "");
          room = makeRoom(row, need(b), false);
          if (room) room.props["flex-wrap"] = "wrap";
          else unsetProps(row, ["flex-wrap"]);
        }
        if (!room) { trace(el, "room for good", row, "row would change"); continue; }
        const a = row.getBoundingClientRect(), now = marks(row, a.top, a.bottom);
        trace(el, "room for good", row, stillStuck(el) ? "still stuck" : "in", kept.every(unchanged) ? "" : "text rewrapped",
          now && broken(seen, now) ? "words broken" : "", now && shrunk(seen, now) ? "picture shrunk" : "", now && gone(seen, now) ? "gone from sight" : "",
          now ? (worse(overlaps(seen, null, true), overlaps(now, null, true)) ? "new overlap" : "no new overlap") : "too much to read");
        if (!stillStuck(el) && kept.every(unchanged) && now && !broken(seen, now) && !shrunk(seen, now) && !gone(seen, now) && !worse(overlaps(seen, null, true), overlaps(now, null, true))) {
          insets.set(row, []);
          grew = true;
          break;
        }
        unsetProps(row, Object.keys(room.props));
      }
    }
    if (grew) keepAnchor(held);

    // What still sits under the strip slides over with its group, so icons that sit together keep their places.
    const groups = new Set(items.filter(stillStuck).map((el) => groupOf(el, lo, hi, full)));
    // A group may only land where it covers nothing it did not cover before: no title under an icon, no tab on top of
    // the next tab, no card of a carousel on top of the one beside it. Where it would, the row around it may slide
    // over whole instead; otherwise it keeps its place. Each one is checked with those before it in place.
    const shifts = [], tried = new Set();
    const shiftOf = (g, cs, dx) => {
      // Text-level elements ignore translate, so they are offset in place instead.
      if (cs.display !== "inline") return { props: { translate: `${dx}px 0px` } };
      if (cs.position === "static") return { props: { position: "relative", left: `${dx}px` } };
      return { props: { left: `${(parseFloat(cs.left) || 0) + dx}px` } };
    };
    // A box takes the taps where it lies, words on it or not: one slid over may not lie on a good part of a place to
    // press that it didn't lie on before (a table's cell slid onto the next one took the taps of that one's link).
    const liesOn = (els, list) => list.filter((m) => m.kind === "tap" && !els.some((e) => e.contains(m.node) || m.node.contains(e)) &&
      els.some((e) => [...e.getClientRects()].some((q) => Math.max(0, Math.min(q.right, m.q.right) - Math.max(q.left, m.q.left)) *
        Math.max(0, Math.min(q.bottom, m.q.bottom) - Math.max(q.top, m.q.top)) > 0.25 * m.q.width * m.q.height)));
    for (const g0 of groups) {
      if ([...groups].some((o) => o !== g0 && o.contains(g0))) continue;
      // (A table's cell keeps its column: it doesn't slide, and what slides inside one stays in it.)
      const cell = g0.closest("td, th"), cellBox = cell && cell.getBoundingClientRect();
      for (let g = g0, steps = 0; g && g !== document.body && steps < 4 && !tried.has(g); g = g.parentElement, steps++) {
        if (cell && g.contains(cell)) { trace(g0, "shift", g, "a table's cell"); break; }
        tried.add(g);
        const cs = getComputedStyle(g);
        if (cs.translate !== "none") { trace(g0, "shift", g, "page moves it"); break; }  // the page moves it itself
        const r = g.getBoundingClientRect();
        // (A carousel's tall side arrow is narrow, and placed by itself: it moves like any button.)
        if (r.height > 160 && !(r.width <= 64 && /absolute|fixed/.test(cs.position))) { trace(g0, "shift", g, "too tall"); break; }
        const dx = r.right > hi ? hi - r.right - margin(r) : r.left < lo ? lo - r.left + margin(r) : 0;
        if (Math.abs(dx) < 0.5) break;
        // too wide to fit beside the strip: it keeps its place
        if (r.left + dx < lo - 0.5 || r.right + dx > hi + 0.5) { trace(g0, "shift", g, "too wide"); break; }
        const clip = clipOf(g);  // nor may it slide out of a card that would cut it off
        if (clip && (r.left + dx < clip.left - 0.5 || r.right + dx > clip.right + 0.5)) { trace(g0, "shift", g, "clipped"); break; }
        if (cell && (r.left + dx < cellBox.left - 0.5 || r.right + dx > cellBox.right + 0.5)) { trace(g0, "shift", g, "out of its cell"); break; }
        // What it might land on: the nearest box around it that spans the way it would go, and all of its height (an
        // icon that hangs below its row reaches the next one). Not words around it: their box takes in all the lines
        // they run over, not the place it would land (a list's next item beside it on its line).
        let scope = g.parentElement;
        for (; scope && scope !== document.body; scope = scope.parentElement) {
          if (/^(inline|contents)$/.test(getComputedStyle(scope).display)) continue;
          const b = scope.getBoundingClientRect();
          if (b.left <= Math.min(r.left, r.left + dx) + 1 && b.right >= Math.max(r.right, r.right + dx) - 1 && b.top <= r.top + 1 && b.bottom >= r.bottom - 1) break;
        }
        const seen = marks(scope || document.body, r.top, r.bottom);
        if (!seen) { trace(g0, "shift", g, "too much to read", scope); break; }
        // One laid over the end of words (a "more" on the last line of text held to a few lines) hides them on purpose:
        // slid over alone, it would leave them showing and lie on others, so the words it then lies on make way too.
        const laid = seen.some((m) => m.kind === "text" && !g.contains(m.node) && seen.some((i) => g.contains(i.node) && i.kind !== "tap" && covers(i.q, m.q)));
        const under = liesOn([g], seen);
        const shift = shiftOf(g, cs, dx);
        for (const [p, v] of Object.entries(shift.props)) setProp(g, p, v, "");
        let now = marks(scope || document.body, r.top, r.bottom);
        // Buttons it lands on beside it on its line, its size or a little bigger (a carousel's page count beside its
        // pause button), come along by as much: they keep their places beside each other, and none ends on another.
        const along = [];
        const unit = { contains: (n) => g.contains(n) || along.some((a) => a.el.contains(n)) };
        if (now && worse(overlaps(seen, unit), overlaps(now, unit))) {
          const q = g.getBoundingClientRect(), sb = (scope || document.body).getBoundingClientRect();
          for (const m of now) {
            if (m.kind !== "tap" || unit.contains(m.node) || m.node.contains(g)) continue;
            const p = m.node, pr = m.q, ps = getComputedStyle(p);
            if (pr.width > 3 * Math.max(q.width, pt(TAP)) || pr.height > 2 * q.height + 8 || ps.translate !== "none" || !covers(q, pr)) continue;
            if (Math.min(pr.bottom, q.bottom) - Math.max(pr.top, q.top) < 0.6 * Math.min(pr.height, q.height)) continue;  // not on its line
            if (pr.left + dx < Math.max(lo, sb.left) - 0.5 || pr.right + dx > Math.min(hi, sb.right) + 0.5) continue;
            const s = shiftOf(p, ps, dx);
            for (const [k, v] of Object.entries(s.props)) setProp(p, k, v, "");
            along.push({ el: p, ...s });
          }
          if (along.length) now = marks(scope || document.body, r.top, r.bottom);
        }
        // Words it lands on may make way, as a title does for an icon beside it: the nearest box around them that
        // can end before the icon does so, if that keeps its height (a title cut short rather than wrapped onto
        // another line).
        const made = [];
        if (now && (laid || worse(overlaps(seen, unit), overlaps(now, unit)))) {
          const inside = now.filter((m) => unit.contains(m.node) && m.kind !== "tap");
          const edgeOf = right ? Math.min(...inside.map((m) => m.q.left)) - 4 : Math.max(...inside.map((m) => m.q.right)) + 4;
          for (const m of now) {
            if (m.node.nodeType !== Node.TEXT_NODE || unit.contains(m.node) || made.includes(null)) continue;
            const hit = () => {
              const rg = document.createRange();
              rg.selectNodeContents(m.node);
              return [...rg.getClientRects()].some((q) => q.width > 2 && q.height > 2 && inside.some((i) => covers(i.q, q)));
            };
            if (!hit()) continue;  // a box that made way already moved it
            let done = false;
            for (let b = m.node.parentElement, tries = 0; b && b !== document.body && !b.contains(g) && !along.some((a) => b.contains(a.el)) && tries < 4 && !done; b = b.parentElement) {
              const bs = getComputedStyle(b);
              if (/^(inline|contents)$/.test(bs.display)) continue;
              tries++;
              const box = b.getBoundingClientRect();
              const px = right ? box.right - (parseFloat(bs.borderRightWidth) || 0) - (parseFloat(bs.paddingRight) || 0) - edgeOf
                : edgeOf - box.left - (parseFloat(bs.borderLeftWidth) || 0) - (parseFloat(bs.paddingLeft) || 0);
              if (px < 1 || px > strip.gap + pt(TAP)) continue;
              const room = makeRoom(b, px, true, tries === 1 && textOnly(b));  // the words' own line may be cut
              if (!room) continue;
              if (hit()) { unsetProps(b, Object.keys(room.props)); continue; }
              made.push({ el: b, ...room });
              done = true;
            }
            if (!done) made.push(null);
          }
          now = made.includes(null) ? null : marks(scope || document.body, r.top, r.bottom);
        }
        const takes = now ? liesOn([g, ...along.map((a) => a.el)], now).filter((m) => !under.some((u) => u.node === m.node)) : [];
        trace(g0, "shift", g, now ? (worse(overlaps(seen, unit), overlaps(now, unit)) ? "new overlap" : "no new overlap") : "words would not make way", scope, along.length ? "along " + along.length : "",
          now && now.filter((m) => !unit.contains(m.node) && now.some((i) => unit.contains(i.node) && covers(i.q, m.q))).map((m) => m.kind + ":" + (m.node.nodeType === 3 ? m.node.data.trim().slice(0, 20) : m.node.localName + "." + String(m.node.className).slice(0, 20))),
          takes.length ? "takes the taps of " + takes.map((m) => m.node.localName + "." + String(m.node.className).slice(0, 20)).join(", ") : "");
        if (now && !takes.length && !worse(overlaps(seen, unit), overlaps(now, unit)) && !broken(seen, now)) {
          shifts.push({ el: g, ...shift }, ...along);
          for (const m of made) pads.push({ ...m, by: g });  // they make way for it
          break;
        }
        for (const m of made) if (m) unsetProps(m.el, Object.keys(m.props));
        for (const a of along) unsetProps(a.el, Object.keys(a.props));
        unsetProps(g, Object.keys(shift.props));
      }
    }
    // (One of a list that could not slide over after all takes its room again.)
    for (const [el, pad] of alike) {
      if (!pad || !stillStuck(el) || padded.has(pad.el)) continue;
      for (const [p, v] of Object.entries(pad.props)) setProp(pad.el, p, v, "");
      trace(el, "pad", pad.el, "taken again: it can't slide over");
      pads.push(pad);
      padded.add(pad.el);
    }
    // Room that hides some of its row (see gone) is the last resort, for a control nothing else brought in: the page
    // itself hides those on a phone that narrow, and the control can be pressed.
    for (const [el, { row, again }] of lossy) {
      if (!stillStuck(el) || padded.has(row)) continue;
      const room = again();
      if (!room) continue;
      trace(el, "pad", row, "hiding some of it: nothing else brings it in");
      pads.push({ el: row, ...room });
      padded.add(row);
    }
    for (const m of shifts) unsetProps(m.el, Object.keys(m.props));

    // A carousel gets room past the strip at its far end, so its last ones can be swiped fully inside, and one that
    // snaps lines things up with the clear part of the screen rather than its edge. One in a bar that now ends before
    // the strip for good needs none.
    for (const m of pads) if (m.by) unsetProps(m.el, Object.keys(m.props));
    for (const c of carousels) {
      if (ends.has(c) || insets.has(c)) continue;  // (room it was given for good lets its last ones in already)
      const b = c.getBoundingClientRect();
      const px = Math.min(strip.gap, right ? b.right - hi : lo - b.left);
      if (px < 1 || !makeRoom(c, px, true)) continue;
      ends.add(c);
      const snap = right ? "scroll-padding-right" : "scroll-padding-left";
      setProp(c, snap, `${(parseFloat(getComputedStyle(c).getPropertyValue(snap)) || 0) + px}px`, "");
    }

    // Back to the page's own layout, then in place for good. A group that slides over carries the rows inside it along,
    // so those no longer make room as well (they would move twice).
    for (const m of pads) unsetProps(m.el, Object.keys(m.props));
    const rows = pads.filter((m) => !shifts.some((s) => s.el.contains(m.el)));
    for (const m of [...rows, ...shifts]) {
      for (const [p, v] of Object.entries(m.props)) setProp(m.el, p, v, "");
      movers.push({ el: m.el, props: m.props });
    }
  }

  // ---------- watching ----------

  let changes = null;        // watches the page for new parts and switched classes
  let refixTimer = 0, fullTimer = 0, lastScroll = 0, lastFull = -Infinity, touching = false, touchedAt = -Infinity;
  const refixSoon = (ms = 250) => { clearTimeout(refixTimer); refixTimer = setTimeout(() => refix(false), ms); };
  // Looking the page over lays it out a few times, which would hitch a scroll in motion: it waits until the page is
  // still and no finger is on it. A page that keeps changing (tickers, live scores) gets looked at once a second at
  // most, and once in a while rather than never. The first look comes as soon as the page is still: an article's
  // lines given room only a second after it showed would be seen to re-wrap.
  function refixAllSoon(ms = 300) {
    if (fullTimer) return;
    fullTimer = setTimeout(function run() {
      const now = performance.now();
      const wait = Math.max(touching ? 250 : 250 - (now - lastScroll), lastFull + 1000 - now);
      if (wait > 0) { fullTimer = setTimeout(run, wait); return; }
      fullTimer = 0;
      refix(true);
    }, ms);
  }

  // Words that come in run under the strip until that look, and would be seen to re-wrap once it comes (an article
  // shown wide for a moment, then fitted): the lines among them that are read from line to line get their room in the
  // frame they come in, before Safari draws them. Only the words; the rest waits for the look. Only when something that
  // came in reaches under the strip near the screen: a ticker clear of it costs nothing.
  let linesFrame = 0;
  const fresh = new Set();  // what came in since the last frame
  function fitLinesSoon(nodes) {
    for (const n of nodes) if (n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !n.hasAttribute(MARK))) fresh.add(n);
    if (linesFrame || !fresh.size) return;
    linesFrame = requestAnimationFrame(() => {
      linesFrame = 0;
      const came = [...fresh];
      fresh.clear();
      if (dbg && dbg.lines) dbg.lines.push([Math.round(performance.now()), came.length, !!strip, !!document.body, strip ? passing() : null]);  // tests: when it ran
      if (!strip || !document.body || passing() || touching || performance.now() - lastScroll < 250) return;
      const band = clearBand();
      const reaches = (n) => {
        const e = n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement;
        if (!e || !e.isConnected) return false;
        const r = e.getBoundingClientRect();
        return (strip.side === "right" ? r.right > band.hi + 1 : r.left < band.lo - 1) && r.bottom > -innerHeight && r.top < 2 * innerHeight;
      };
      if (!came.some(reaches)) return;
      // (Words in a bar are fitted with it at the look; a fixed box that is the page itself is the page.)
      const inBar = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (!pages.has(e) && getComputedStyle(e).position === "fixed") return true; return false; };
      const shows = (el) => !(el.checkVisibility && !el.checkVisibility({ visibilityProperty: true }));
      frozen = new Map();
      try { fitLines(band, (el) => !inBar(el) && !carouselOf(el) && shows(el)); } finally { thaw(); }
      if (changes) changes.takeRecords();  // its own restyling
    });
  }

  function watch() {
    // A bar or notice that was there all along may show by a switched class or style (a cookie notice fading in, a
    // "back to top" button once the page has scrolled): the bars are fitted again shortly after, not while a finger or
    // a scroll is moving the page, and no more than every so often on a page that keeps changing (a rolling banner).
    // The script's own restyling is not counted (see refix).
    let shown = 0;
    const fitShown = () => {
      if (touching || performance.now() - lastScroll < 250) { shown = setTimeout(fitShown, 300); return; }
      shown = 0;
      refix(false);
    };
    changes = new MutationObserver((records) => {
      // (Not the scroll bar we draw, moved as the page scrolls.)
      records = records.filter((rec) => rec.target !== bar && !(rec.type === "childList" && [...rec.addedNodes, ...rec.removedNodes].every((n) => n === bar)));
      if (!records.length) return;
      if (records.some((rec) => [...rec.addedNodes, ...rec.removedNodes].some((n) => n.nodeName === "META"))) consider();
      if (!strip) return;
      edgeTaken();
      if (records.some((rec) => [...rec.addedNodes].some((n) => n.nodeName === "STYLE"))) wholeScreen();
      if (records.some((rec) => rec.addedNodes.length)) { refixAllSoon(); fitLinesSoon(records.flatMap((rec) => [...rec.addedNodes])); }
      if (!records.some((rec) => rec.type === "attributes")) return;
      repaintSoon();
      if (!shown) shown = setTimeout(fitShown, 600);
    });
    changes.observe(document.documentElement || document, { childList: true, subtree: true, attributes: true });
    addEventListener("resize", () => {
      if (telling) return;  // (ours, see scriptWidth)
      if (orig === null) { consider(); return; }
      if (passing()) return;
      // Safari's bars growing or shrinking changes only the height: the tag follows it and the bars are fitted again,
      // and the text and rows that were given room keep it.
      const s = detect();
      if (s && strip && !refit(s)) { consider(); refixSoon(300); return; }
      // Turning or folding the phone moves or removes the strip: start again from the page's own layout.
      unfix(); consider(); if (strip) settle();
    });
    addEventListener("scroll", (e) => {
      if (!strip) return;
      lastScroll = performance.now();
      repaintSoon();
      const el = e.target;
      if (el === document) {
        scrolledBar();
        // (Slid by a finger the page never saw, one that came down on a frame from elsewhere, or still gliding: put
        // back once it is still, not against the finger, which shook the page from side to side, nor the glide.)
        clearTimeout(pinTimer);
        pinTimer = setTimeout(pin, 150);
        // A few screens on, look for the next ones once it stops.
        if (Math.abs(scrollY - scanY) > 2 * innerHeight) refixAllSoon(0);
        refixSoon(300);
        return;
      }
      // A box that scrolls a page of its own up and down (see framesPage) brings its next ones the same way.
      if (!(el instanceof Element) || el.scrollHeight <= el.clientHeight + 1 || el.clientHeight < innerHeight / 2) return;
      if (!scanTops.has(el)) scanTops.set(el, el.scrollTop);
      else if (Math.abs(el.scrollTop - scanTops.get(el)) > 2 * innerHeight) { scanTops.set(el, el.scrollTop); refixAllSoon(0); }
      refixSoon(300);
    }, { passive: true, capture: true });  // (a box's own scrolling reaches the window only on the way down)
    addEventListener("transitionend", (e) => { if (strip && e.target !== bar) repaintSoon(); }, { passive: true, capture: true });
    // A frame asks whether to hold itself as its page starts, and tells whether that page holds a video (see waits).
    addEventListener("message", (e) => {
      if (!e.source || typeof e.data !== "string") return;
      if (e.data === "duowide:ask") { e.source.postMessage(framesHeld ? "duowide:hold" : "duowide:free", "*"); frameSaid.set(e.source, "page"); return; }
      const told = /^duowide:(video|plain|used)$/.exec(e.data);
      if (!told || frameSaid.get(e.source) === "used") return;
      frameSaid.set(e.source, told[1]);
      if (strip && told[1] !== "video") refixAllSoon(told[1] === "used" ? 0 : 300);
    });
    for (const type of ["load", "play"]) document.addEventListener(type, noteMedia, true);
    // A style sheet that comes in may size things in vw (see wholeScreen).
    document.addEventListener("load", (e) => { if (strip && e.target instanceof Element && e.target.localName === "link") wholeScreen(); }, true);
    addEventListener("touchstart", () => { touching = true; touchedAt = performance.now(); }, { passive: true, capture: true });
    // touch-action (see pin) keeps Safari from sliding the page sideways, but a sideways swipe that drifts up or down a
    // little still scrolls the page by that much: a carousel the page slides itself crept the page up or down with
    // every swipe. A swipe on one that starts out sideways moves the page not at all; the carousel keeps getting the
    // touches. Nothing else is held back: once a touch is, Safari does nothing more with it, so a pinch whose first
    // finger moved before the second came down zoomed nothing, and a swipe from the page's edge went neither back nor
    // forward. On a carousel too, left alone: whatever scrolls sideways itself under the finger and still can, fields,
    // players, a press held before moving (selecting text), two fingers, a page zoomed in or wider than the screen,
    // and a swipe from either edge of the page.
    let swipe = null;
    const EDGE = 32;
    const nearEdge = (x) => { const { lo, hi } = clearBand(); return x < lo + pt(EDGE) || x > hi - pt(EDGE); };
    const sideways = (path, dx) => path.some((n) => {
      if (!(n instanceof Element) || n === document.documentElement || n === document.body) return false;
      if (n.matches("input, textarea, select, [contenteditable], video, audio")) return true;
      if (n.scrollWidth <= n.clientWidth + 1 || !/auto|scroll/.test(getComputedStyle(n).overflowX)) return false;
      return dx < 0 ? n.scrollLeft < n.scrollWidth - n.clientWidth - 1 : n.scrollLeft > 0;
    });
    addEventListener("touchstart", (e) => {
      swipe = null;
      if (!strip || wide || e.touches.length !== 1 || zoomed() || nearEdge(e.touches[0].clientX)) return;
      if (!(e.target instanceof Element) || !carouselOf(e.target)) return;
      swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY, at: e.timeStamp, way: "", path: e.composedPath() };
    }, { passive: true, capture: true });
    addEventListener("touchmove", (e) => {
      if (!swipe || e.touches.length !== 1) { swipe = null; return; }
      if (!swipe.way) {
        // (Far enough that a second finger landing for a pinch has come down, and short of where Safari starts to
        // scroll.)
        const dx = e.touches[0].clientX - swipe.x, dy = e.touches[0].clientY - swipe.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < pt(6)) return;
        swipe.way = Math.abs(dx) > Math.abs(dy) && e.timeStamp - swipe.at < 400 && !sideways(swipe.path, dx) ? "x" : "y";
      }
      if (swipe.way === "x" && e.cancelable) e.preventDefault();
    }, { passive: false });
    // A swipe may have slid a carousel the page's script moves: look again once it settles.
    for (const type of ["touchend", "touchcancel"]) {
      addEventListener(type, (e) => { touching = e.touches.length > 0; if (strip && !touching) { liftBar(); pin(); refixAllSoon(400); } }, { passive: true, capture: true });
    }
    // Taps open menus and drawers by switching a class, which adds no nodes.
    addEventListener("click", () => { if (strip) { refixSoon(350); refixAllSoon(900); } }, true);
    document.addEventListener("DOMContentLoaded", () => { consider(); if (strip) settle(); });
    addEventListener("load", () => { consider(); if (strip) settle(); });
    // A page Safari loaded ahead while its address was typed, or kept from before, shows without loading again and may
    // have been laid out at another size: it is looked at again when it shows. Web fonts that arrive after the page was
    // looked over change how wide its words are. A page that slept while hidden is widened again (see sleep).
    const shows = () => { if (document.visibilityState !== "visible") return; asleep = false; consider(); if (strip) settle(); };
    // (A finger still down as Safari went to the background is never seen to lift: the page would stay where it slid.)
    document.addEventListener("visibilitychange", () => { touching = false; barUntil = 0; if (document.visibilityState === "hidden") sleep(); });
    document.addEventListener("visibilitychange", shows);
    addEventListener("pageshow", shows);
    document.addEventListener("prerenderingchange", shows);
    if (document.fonts) document.fonts.addEventListener("loadingdone", () => { if (strip) refixAllSoon(300); });
    // Zooming in lets the page pan sideways again, and zooming back out holds it. Back at its own scale, the page is
    // looked at again, as what changed while it was zoomed into was left alone (see passing). The reader zooms with a
    // finger on the page or just off it (a double tap); a page that shows zoomed from the start was brought back so
    // (see sleep). Safari's page zoom moving to another step can look like a zoom for a moment, the scale changed
    // before the part shown, and is no reader's.
    let zoomedIn = zoomed();
    if (zoomedIn) scaled = true;
    if (window.visualViewport) visualViewport.addEventListener("resize", () => {
      if (strip) pin();
      if (zoomed() === zoomedIn) return;
      zoomedIn = !zoomedIn;
      if (!zoomedIn) { consider(); if (strip) settle(); }
      else if (touching || performance.now() - touchedAt < 1500) scaled = true;
    });
    // Safari slides the page when a field takes the keyboard; put it back once it has.
    addEventListener("focusin", () => { if (strip) setTimeout(pin, 400); });
  }

  async function start() {
    stripPhone = (await store.get("stripPhone", false)) === true;
    const begin = () => { wholeScreen(); watch(); consider(); };  // (our sheet first: it gives 100vw to read)
    if (!document.documentElement) {
      new MutationObserver((_, obs) => { if (document.documentElement) { obs.disconnect(); begin(); } }).observe(document, { childList: true });
    } else begin();
  }

  if (dbg) dbg.refix = () => refix(true);
  if (dbg) dbg.state = () => ({ orig, ours, own: !!own, strip, stripPhone, yielded, scaled, asleep, rewrites: rewrites.length, others: others.size, edge: !!(edge && edge.isConnected), bar: document.documentElement.hasAttribute(BAR), fixed: fixed.size, movers: movers.length, insets: insets.size, content: meta?.getAttribute("content") || null });
  if (dbg) dbg.movers = () => movers.map((m) => ({ el: m.el.id || m.el.localName, cls: String(m.el.className).slice(0, 40), text: (m.el.textContent || "").trim().slice(0, 30), props: m.props }));
  if (dbg) dbg.insets = () => [...insets.keys()].map((e) => ({ el: e.id || e.localName, cls: String(e.className).slice(0, 40), text: (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30) }));
  start();
})();
