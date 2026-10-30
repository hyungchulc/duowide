// ==UserScript==
// @name         DuoWide-WideText
// @namespace    https://github.com/hyungchulc/duowide
// @version      2.0.0
// @description  Optional part of DuoWide: lets lines of text run on under the side strip too, so more words fit on a line. A paragraph with a link the strip would cover still ends before it. Turn it off in the Userscripts menu to wrap text before the strip again.
// @author       hyungchulc
// @homepageURL  https://github.com/hyungchulc/duowide
// @supportURL   https://github.com/hyungchulc/duowide/issues
// @updateURL    https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js
// @downloadURL  https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js
// @license      MIT
// @match        *://*/*
// @run-at       document-start
// @noframes
// @inject-into  content
// ==/UserScript==

// A switch, and nothing else: DuoWide.user.js reads it at each look (see wideText there). Both run in Userscripts'
// content world, which they share, in either order; on in the Userscripts menu, it takes effect as a page loads.
window.__duoWideText = "wide";
