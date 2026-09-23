"use strict";

/**
 * @module library.view.webbrowser
 */

/**
 * @class SvThrashDetector
 * @extends ProtoClass
 * @classdesc The SvThrashDetector helps minimize DOM thrashing by warning when interleaving of read and write operations is detected.
 *
 * The DOM can be slow if (layout dependent) read and (layout modifying) write operations are interleaved,
 * as the read will require a re-layout or "reflow" of the DOM rendering engine.
 *
 * When possible, it's best to do all read operations first, then do any write operations
 * as this allows for a single reflow of the DOM at the end of the frame.
 *
 * USE:
 *
 * When doing DOM Node reads, call:
 *
 *     SvThrashDetector.shared().didRead("opName")
 *
 * and on DOM Node writes, call:
 *
 *     SvThrashDetector.shared().didWrite("opName")
 *
 * NOTES:
 *
 * See:
 * What forces layout / reflow
 * https://gist.github.com/paulirish/5d52fb081b3570c81e3a
 */
(class SvThrashDetector extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        /**
         * @member {Set} readOpSet - Set of read operations that can trigger a reflow
         * @category DOM Operations
         */
        {
            const slot = this.newSlot("readOpSet", new Set([
                // on Elements
                "offsetTop", "offsetLeft", "offsetWidth", "offsetHeight", "offsetParent", // offset
                "scrollTop", "scrollLeft", "scrollWidth", "scrollHeight", // scroll
                "scrollBy", "scrollTo", "scrollIntoView", "scrollIntoViewIfNeeded", // scroll animations
                "clientTop", "clientLeft", "clientWidth", "clientHeight", // client
                "getComputedStyle",
                "getClientRects", "getBoundingClientRect", // rects
                "computeRole", "computedName", "innerText",

                // on Window
                "scrollX", "scrollY", "innerHeight", "innerWidth", "visualViewPort", // window

                // on Document
                "scrollingElement", "elementFromPoint", // document

                // on SvMouse Event
                "layerX", "layerY", "offsetX", "offsetY",

                // on SVG
                "computeCTM", "getBBox", "getCharNumAtPosition", "getComputedTextLength",
                "getEndPositionOfChar", "getExtentOfChar", "getNumberOfChars", "getRotationOfChar",
                "getStartPositionOfChar", "getSubStringLength", "selectSubString", "instanceRoot"
            ]));
            slot.setSlotType("Set");
        }

        /**
         * @member {Set} writeOpSet - Set of write operations that can trigger a reflow
         * @category DOM Operations
         */
        {
            const slot = this.newSlot("writeOpSet", new Set([
                "focus",
                "appendChild",
                "atInsertElement",
                "removeChild",
                "className",
                "display",
                "position",
                "width",
                "height",
                "min-width",
                "min-height",
                "max-width",
                "max-height"
            ]));
            slot.setSlotType("Set");
        }

        /**
         * @member {Set} noReflowWriteOpSet - Set of write operations that do not trigger a reflow
         * @category DOM Operations
         */
        {
            // an ARRAY: new Set("color", …) was a set of the letters c/o/l/r,
            // so every paint-only write counted as dirtying layout
            const slot = this.newSlot("noReflowWriteOpSet", new Set([
                "color",
                "backface-visibility",
                "background",
                "background-attachment",
                "background-blend-mode",
                "background-clip",
                "background-color",
                "background-image",
                "background-origin",
                "background-position",
                "background-repeat",
                "background-size",
                "border-left-color",
                "border-left-style",
                "border-radius",
                "border-right",
                "border-right-color",
                "border-right-style",
                "border-style",
                "border-top-color",
                "border-top-left-radius",
                "border-top-right-radius",
                "border-top-style",
                "caret-color",
                "color",
                "filter",
                "outline-color",
                "scroll-behavior",
                "user-select"
            ]));
            slot.setSlotType("Set");
        }

        /**
         * @member {Boolean} needsReflow - Indicates if a reflow is needed
         * @category State
         */
        {
            const slot = this.newSlot("needsReflow", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} reflowCount - Count of reflows
         * @category State
         */
        {
            const slot = this.newSlot("reflowCount", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {Array} triggers - Array of triggers that caused reflows
         * @category State
         */
        {
            const slot = this.newSlot("triggers", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {String} lastWrite - The last write operation performed
         * @category State
         */
        {
            const slot = this.newSlot("lastWrite", null);
            slot.setSlotType("String");
        }

        /**
         * @member {Object} lastWriteView - The view of the last write; its
         * description is built only when a read then forces layout
         * @category State
         */
        {
            const slot = this.newSlot("lastWriteView", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Boolean} isVerbose - Log each frame's forced layouts with the
         * reading code's stack, and a heartbeat. Off by default: capturing a
         * stack per forced layout is itself costly. "?thrash=1" or a click on
         * the indicator turns it on.
         * @category Configuration
         */
        {
            const slot = this.newSlot("isVerbose", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} totalReflowCount - Forced layouts since the page loaded
         * @category State
         */
        {
            const slot = this.newSlot("totalReflowCount", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} indicatorWindowCount - Forced layouts since the
         * indicator last updated (its per-second rate)
         * @category State
         */
        {
            const slot = this.newSlot("indicatorWindowCount", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} indicatorUpdatedAt - When the indicator last updated (ms)
         * @category State
         */
        {
            const slot = this.newSlot("indicatorUpdatedAt", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {Element} indicatorElement - The top-right counter
         * @category Indicator
         */
        {
            const slot = this.newSlot("indicatorElement", null);
            slot.setSlotType("Element");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Boolean} enabled - Indicates if the SvThrashDetector is enabled
         * @category Configuration
         */
        {
            const slot = this.newSlot("enabled", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Whether instrumentation is live, as a STATIC check so the
     * hot path costs one boolean when it is off. The DOM read/write hooks fire
     * on nearly every view operation, so they must not pay for a singleton
     * lookup or a slot read when nobody is measuring.
     *
     * ON by default for now (counting only, shown by the top-right
     * indicator); "?thrash=0" turns it off, "?thrash=1" adds the per-frame
     * console report with stacks — a url is something you can type, and a
     * console paste may not be.
     * @returns {Boolean}
     * @category Configuration
     */
    static isInstrumenting () {
        if (this._isInstrumenting === undefined) {
            const href = this.pageHref();
            const on = href !== null && !href.includes("thrash=0");
            this._isInstrumenting = on;
            if (on) {
                this.shared().start(href.includes("thrash=1"));
            }
        }
        return this._isInstrumenting;
    }

    /**
     * @description The WHOLE page url, or null without a window. Not just
     * location.search: this app routes on the hash (/play#Uo/My%20Sessions/...),
     * so a "?thrash=1" typed at the end lands in the fragment.
     * @returns {String|null}
     * @category Configuration
     */
    static pageHref () {
        try {
            return (typeof window !== "undefined" && window.location) ? String(window.location.href || "") : null;
        } catch {
            return null;
        }
    }

    /**
     * @description Arms counting, the frame loop and the indicator.
     * @param {Boolean} verbose - also log each frame's forced layouts with stacks
     * @category Configuration
     */
    start (verbose) {
        this.setEnabled(true);
        this.beginFrame(); // reads land before the first tick's beginFrame; the trigger list must exist
        this.startFrameLoop();
        this.setVerbose(verbose);
        return this;
    }

    /**
     * @description Turns the per-frame console report on or off.
     * @param {Boolean} verbose
     * @category Configuration
     */
    setVerbose (verbose) {
        this.setIsVerbose(verbose);
        console.warn("[SvThrashDetector] counting forced layouts (top-right indicator; ?thrash=0 turns it off)."
            + (verbose ? " Logging each one with the reading code's stack, plus a heartbeat every "
                + (this.heartbeatMs() / 1000) + "s. Click the indicator to stop."
                : " Click the indicator (or load with ?thrash=1) to log each one with its stack."));
        return this;
    }

    /**
     * @description Reports once per animation frame, which is the unit that
     * matters: a write followed by a read INSIDE one frame is the interleaving
     * that forces synchronous layout. Nothing called beginFrame/endFrame before,
     * so the detector could never report.
     * @category Frame Management
     */
    startFrameLoop () {
        if (this._frameLoopStarted) {
            return this;
        }
        this._frameLoopStarted = true;
        const tick = () => {
            this.endFrame();
            this.beginFrame();
            window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
        return this;
    }

    /**
     * @description Begins a new frame for thrash detection
     * @category Frame Management
     */
    beginFrame () {
        this.setNeedsReflow(false);
        this.setReflowCount(0);
        this.setTriggers([]);
        this.setLastWrite(null);
        this.setLastWriteView(null);
    }

    /**
     * @description Records a read operation
     * @param {string} opName - The name of the read operation
     * @param {Object} optionalView - Optional view object
     * @returns {SvThrashDetector} - Returns this SvThrashDetector instance
     * @category DOM Operations
     */
    didRead (opName, optionalView) {
        if (this.needsReflow() && this.readOpSet().has(opName)) {
            this.setReflowCount(this.reflowCount() + 1);
            this.setNeedsReflow(false);
            if (this.isVerbose()) {
                this.recordTrigger(opName, optionalView);
            }
            this.onThrash();
        }
        return this;
    }

    /**
     * @description Describes one forced layout for the verbose report. The
     * stack is the point: "someView set height -> otherView get clientHeight"
     * tells you WHAT interleaved, but not which code did it; the frames above
     * this one name the caller of the read.
     * @param {String} opName - the read
     * @param {Object} optionalView - the view read from
     * @category Thrash Detection
     */
    recordTrigger (opName, optionalView) {
        const w = this.lastWriteView();
        const write = w ? w.svDebugId() + " set " + this.lastWrite() : this.lastWrite();
        const read = optionalView ? optionalView.svDebugId() + " get " + opName : opName;
        const frames = String(new Error().stack || "").split("\n").slice(3, 13)
            .map(f => f.trim()).join(" <- ");
        if (!this.triggers()) { this.beginFrame(); }
        this.triggers().push(write + " -> " + read + "\n         at " + frames);
        return this;
    }

    /**
     * @description Records a write operation
     * @param {string} opName - The name of the write operation
     * @param {Object} optionalView - Optional view object
     * @returns {SvThrashDetector} - Returns this SvThrashDetector instance
     * @category DOM Operations
     */
    didWrite (opName, optionalView) {
        if (!this.noReflowWriteOpSet().has(opName)) {
            this.setNeedsReflow(true);
            this.setLastWrite(opName);
            this.setLastWriteView(optionalView || null);
        }
        return this;
    }

    /**
     * @description Handles thrash detection
     * @private
     * @category Thrash Detection
     */
    onThrash () {
        //console.log(this.svType() + " reflowCount: ", this.reflowCount())
    }

    /**
     * @description Ends the current frame and logs thrash information if enabled
     * @category Frame Management
     */
    /**
     * @description How often the heartbeat reports while armed.
     * @returns {Number} milliseconds
     * @category Configuration
     */
    heartbeatMs () {
        return 5000;
    }

    /**
     * @description Periodic proof of life while armed.
     *
     * Without this, an armed detector and a broken one look identical: both print
     * nothing when the page is clean. The heartbeat says which — and a window
     * reporting 0 forced layouts is a real result, not a silence to wonder about.
     * @category Diagnostics
     */
    reportHeartbeatIfDue () {
        const now = Date.now();
        if (this._windowStartedAt === undefined) {
            this._windowStartedAt = now;
            this._windowFrames = 0;
            this._windowReflows = 0;
        }
        this._windowFrames = (this._windowFrames || 0) + 1;
        this._windowReflows = (this._windowReflows || 0) + this.reflowCount();
        if (now - this._windowStartedAt < this.heartbeatMs()) {
            return this;
        }
        const seconds = Math.round((now - this._windowStartedAt) / 100) / 10;
        const verdict = this._windowReflows === 0
            ? "no forced layouts — clean"
            : (this._windowReflows + " forced layout(s)");
        console.warn("[SvThrashDetector] alive: " + this._windowFrames + " frames in "
            + seconds + "s, " + verdict);
        this._windowStartedAt = now;
        this._windowFrames = 0;
        this._windowReflows = 0;
        return this;
    }

    endFrame () {
        if (!this.enabled()) {
            return;
        }
        this.setTotalReflowCount(this.totalReflowCount() + this.reflowCount());
        this.setIndicatorWindowCount(this.indicatorWindowCount() + this.reflowCount());
        this.updateIndicatorIfDue();
        if (!this.isVerbose()) {
            return;
        }
        this.reportHeartbeatIfDue();
        if (this.reflowCount()) {
            console.log(">>> " + this.svType() + " forced-layout count this frame: " + this.reflowCount());
            (this.triggers() || []).forEach((t, i) => console.log("      " + (i + 1) + ". " + t));
        }
    }

    /**
     * @description Refreshes the indicator about once a second (not per
     * frame: it must not become a cost of its own). Its DOM is written
     * directly, never through the instrumented view methods, so it never
     * counts itself.
     * @category Indicator
     */
    updateIndicatorIfDue () {
        const now = Date.now();
        if (now - this.indicatorUpdatedAt() < 1000) {
            return this;
        }
        const seconds = this.indicatorUpdatedAt() ? (now - this.indicatorUpdatedAt()) / 1000 : 1;
        this.setIndicatorUpdatedAt(now);
        const rate = Math.round(this.indicatorWindowCount() / seconds);
        this.setIndicatorWindowCount(0);
        this.renderIndicator(rate);
        return this;
    }

    /**
     * @description Writes the indicator's text and color: grey when quiet,
     * amber while forced layouts are happening, red when there are many.
     * @param {Number} rate - forced layouts per second just now
     * @category Indicator
     */
    renderIndicator (rate) {
        const el = this.indicatorElementCreateIfNeeded();
        if (!el) {
            return this;
        }
        const text = "reflow " + rate + "/s · " + this.totalReflowCount() + (this.isVerbose() ? " · logging" : "");
        if (el.textContent !== text) {
            el.textContent = text;
        }
        const background = rate === 0 ? "rgba(90,90,90,0.55)" : (rate < 20 ? "rgba(200,130,0,0.9)" : "rgba(200,30,30,0.95)");
        if (el.style.background !== background) {
            el.style.background = background;
        }
        return this;
    }

    /**
     * @description The top-right counter, created on first use once the
     * document has a body. A click toggles the per-frame console report.
     * @returns {Element|null}
     * @category Indicator
     */
    indicatorElementCreateIfNeeded () {
        if (!this.indicatorElement() && typeof document !== "undefined" && document.body) {
            const el = document.createElement("div");
            el.title = "Forced layouts (DOM reflows) per second · total since load. Click to log each with its stack.";
            el.style.cssText = "position:fixed; top:calc(env(safe-area-inset-top, 0px) + 2px); right:2px; z-index:2147483647;"
                + " padding:1px 6px; border-radius:8px; color:white; font:10px/14px ui-monospace, Menlo, monospace;"
                + " cursor:pointer; user-select:none; opacity:0.85; pointer-events:auto;";
            el.addEventListener("click", () => this.setVerbose(!this.isVerbose()));
            document.body.appendChild(el);
            this.setIndicatorElement(el);
        }
        return this.indicatorElement();
    }

}.initThisClass());
