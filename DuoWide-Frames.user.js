// ==UserScript==
// @name         DuoWide-Frames
// @namespace    https://github.com/hyungchulc/duowide
// @version      2.0.1
// @description  Part of DuoWide: keeps a widened page from sliding sideways when a swipe starts in a frame laid into it, such as an ad or an embedded video, and tells the page when a video in a frame is pressed.
// @author       hyungchulc
// @homepageURL  https://github.com/hyungchulc/duowide
// @supportURL   https://github.com/hyungchulc/duowide/issues
// @updateURL    https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js
// @downloadURL  https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js
// @license      MIT
// @match        *://*/*
// @run-at       document-start
// @inject-into  content
// ==/UserScript==

(() => {
  "use strict";

  // Only inside frames. A widened page (DuoWide.user.js) is wider than the part Safari counts as visible and holds
  // itself still sideways with touch-action, but WebKit takes a touch's touch-action from the page that is under the
  // finger: one that lands in a frame laid in from elsewhere (an ad, an embedded video) goes by that frame's own page,
  // and a sideways drag there slid the widened page by the strip's width, its scroll bar along the bottom. The page
  // tells its frames while it is widened; each holds its own page still sideways the same way and tells its own frames.
  if (window.top === window.self || window.__duoWideFrame) return;
  window.__duoWideFrame = true;

  const HOLD = "pan-y pinch-zoom";
  let on = false;
  let held = [];  // what was given the hold here

  function hold() {
    for (const el of held) el.style.removeProperty("touch-action");
    held = [];
    const html = document.documentElement;
    // (A frame whose own page scrolls sideways keeps it: its reader swipes it.)
    if (!on || !html || html.scrollWidth > innerWidth + 1) return;
    for (const el of [html, document.body]) {
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (!/^(auto|manipulation)$/.test(cs.touchAction)) continue;  // (one it sets itself stays)
      // (Its body only when it scrolls by itself as WebKit counts, cut off sideways: there the touch starts afresh.)
      if (el !== html && !/auto|scroll/.test(cs.overflowX + cs.overflowY)) continue;
      el.style.setProperty("touch-action", HOLD, "important");
      held.push(el);
    }
  }

  function tell() {
    for (const f of document.querySelectorAll("iframe, frame")) {
      try { if (f.contentWindow) f.contentWindow.postMessage(on ? "duowide:hold" : "duowide:free", "*"); } catch (e) { /* gone */ }
    }
  }

  // A frame playing a video (an embedded player) is left as it is by the page until it is pressed or plays, a picture
  // under the strip with its play button in the middle, and then ends before the strip, where its own buttons can be
  // pressed (see waits in DuoWide.user.js). The page is told whether this page holds a video, as soon as one is there or
  // once it has loaded (or a few seconds after it was read, should loading go on), and when it is first pressed or
  // plays. What its own frames tell of their videos goes on up.
  let said = "";
  function say(what) {
    if (said === what || said === "used" || (what === "plain" && said)) return;
    said = what;
    parent.postMessage("duowide:" + what, "*");
  }
  const look = (last) => { if (document.querySelector("video")) say("video"); else if (last) say("plain"); };
  const read = () => { look(false); setTimeout(() => look(true), 3000); };
  for (const type of ["click", "play"]) document.addEventListener(type, () => say("used"), true);

  addEventListener("message", (e) => {
    if (e.data === "duowide:ask" && e.source) { e.source.postMessage(on ? "duowide:hold" : "duowide:free", "*"); return; }
    if (e.source !== parent && (e.data === "duowide:video" || e.data === "duowide:used")) { say(e.data.slice(8)); return; }
    if (e.source !== parent || (e.data !== "duowide:hold" && e.data !== "duowide:free")) return;
    on = e.data === "duowide:hold";
    hold();
    tell();
  });
  // (Its page laid out, its body there.)
  document.addEventListener("DOMContentLoaded", () => { hold(); read(); });
  addEventListener("load", () => { hold(); look(true); });
  parent.postMessage("duowide:ask", "*");
  if (document.readyState === "interactive") read();
  else if (document.readyState === "complete") look(true);
})();
