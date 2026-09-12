"use strict";

/**
 * @module library.view.dom.Helpers
 */

/**
 * @class SvRenderedText
 * @extends ProtoClass
 * @classdesc What a reader actually sees, as text — for tests, probes and
 * diagnostics. Not used by the app at runtime; it changes nothing about
 * rendering.
 *
 * WHY THIS EXISTS. `innerText` answers "what text nodes are here", which is a
 * different question from "what does the reader see", and the two diverge in
 * exactly the ways that matter when diagnosing a UI report:
 *
 *   - CSS generated content (`::before` / `::after`) is invisible to it. A rule
 *     as small as `sentence::after { content: ' ' }` makes every sentence in a
 *     narration appear run together — "survivor.Next" — in a captured dump
 *     while the page renders it correctly.
 *   - Visibility is state-dependent. Some content is shown only while a
 *     response streams; some only in developer mode. A capture is meaningless
 *     without knowing which state produced it.
 *
 * Both produced false bug reports (2026-09-11) before this existed.
 *
 * The mode stamp is the point. This class deliberately does NOT try to decide
 * what is "player-visible" — "what is rendered" is legitimately different in
 * developer mode, and both answers are valid. It reports what is rendered AND
 * the mode that produced it, so a capture is self-describing and the reader
 * infers nothing. To answer a player-visibility question, capture with
 * developer mode off (the default).
 *
 * example use:
 *   SvRenderedText.captureJson()          // { developerMode, text } for the page
 *   SvRenderedText.of(someElement)        // just the string
 */
(class SvRenderedText extends ProtoClass {

    /**
     * @description The rendered text of an element and its descendants:
     * generated content included, non-rendered subtrees skipped.
     * @param {Element} [element] - defaults to document.body
     * @returns {String}
     * @category Capture
     */
    static of (element) {
        const root = element || (SvGlobals.globals().document && document.body);
        if (!root) {
            return "";
        }
        return this.normalized(this.textOfNode(root));
    }

    /**
     * @description A self-describing capture: the text plus the app state that
     * decided what was rendered. Prefer this over of() when the capture will be
     * read by someone who was not present when it was taken.
     * @param {Element} [element]
     * @returns {Object} { developerMode, text }
     * @category Capture
     */
    static captureJson (element) {
        return {
            developerMode: this.developerModeOrNull(),
            text: this.of(element)
        };
    }

    /**
     * @description The app's developer-mode flag, or null when there is no app
     * to ask (a bare page, or a headless test with no SvApp).
     * @returns {Boolean|null}
     * @category Capture
     */
    static developerModeOrNull () {
        const appClass = SvGlobals.globals().SvApp;
        if (!appClass || !appClass.shared) {
            return null;
        }
        try {
            return appClass.shared().developerMode();
        } catch {
            return null;
        }
    }

    /**
     * @description Whether this element contributes anything visible. Mirrors
     * the two ways the app hides things: display (the CSS-variable gating used
     * for developer-only content) and visibility.
     * @param {Element} element
     * @returns {Boolean}
     * @category Capture
     */
    static isRendered (element) {
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
    }

    /**
     * @description The text a pseudo-element contributes. `content` comes back
     * quoted ("' '"), and as the keywords "none"/"normal" when there is none.
     * Non-string values (counters, attr(), url()) are skipped rather than
     * guessed at.
     * @param {Element} element
     * @param {String} pseudo - "::before" or "::after"
     * @returns {String}
     * @category Capture
     */
    static pseudoTextOf (element, pseudo) {
        const raw = getComputedStyle(element, pseudo).content;
        if (!raw || raw === "none" || raw === "normal") {
            return "";
        }
        const match = raw.match(/^"((?:[^"\\]|\\.)*)"$|^'((?:[^'\\]|\\.)*)'$/);
        if (!match) {
            return ""; // counter(), attr(), url(), image-set(), … not text
        }
        return (match[1] !== undefined ? match[1] : match[2]).replace(/\\(.)/g, "$1");
    }

    /**
     * @description Recursive walk. Block-level elements contribute a newline so
     * the result reads like the page rather than one long line.
     * @param {Node} node
     * @returns {String}
     * @category Capture
     */
    static textOfNode (node) {
        const TEXT_NODE = 3;
        const ELEMENT_NODE = 1;

        if (node.nodeType === TEXT_NODE) {
            return node.nodeValue;
        }
        if (node.nodeType !== ELEMENT_NODE) {
            return "";
        }
        const tag = node.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEMPLATE") {
            return "";
        }
        if (!this.isRendered(node)) {
            return "";
        }

        let out = this.pseudoTextOf(node, "::before");
        node.childNodes.forEach((child) => {
            out += this.textOfNode(child);
        });
        out += this.pseudoTextOf(node, "::after");

        return this.isBlockLevel(node) ? "\n" + out + "\n" : out;
    }

    /**
     * @param {Element} element
     * @returns {Boolean}
     * @category Capture
     */
    static isBlockLevel (element) {
        const display = getComputedStyle(element).display;
        return display.startsWith("block") || display.startsWith("flex")
            || display.startsWith("grid") || display === "list-item"
            || display.startsWith("table");
    }

    /**
     * @description Collapse the runs of blank lines the block-level newlines
     * produce, and trim trailing spaces, without touching intentional spacing
     * inside a line.
     * @param {String} text
     * @returns {String}
     * @category Capture
     */
    static normalized (text) {
        return text
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

}.initThisClass());
