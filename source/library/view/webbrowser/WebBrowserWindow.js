/**
 * @module library.view.webbrowser
 */

/**
 * @class WebBrowserWindow
 * @extends ProtoClass
 * @classdesc Abstraction for the main web browser window
 * Owns a DocumentBody view.
 *
 * Usage example:
 * WebBrowserWindow.shared().storeSelectionRange();
 * // do stuff
 * WebBrowserWindow.shared().restoreSelectionRange();
 */
(class WebBrowserWindow extends ProtoClass {

    /**
     * @static
     * @description Initializes the class as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {WindowListener} windowListener
         * @category Window Management
         */
        {
            const slot = this.newSlot("windowListener", null);
            slot.setSlotType("WindowListener");
        }

        /**
         * @member {Range} storedSelectionRange
         * @category Selection Management
         */
        {
            const slot = this.newSlot("storedSelectionRange", null);
            slot.setSlotType("Range");
        }
    }

    /**
     * @description Initializes the WebBrowserWindow instance.
     * @returns {WebBrowserWindow} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        if (SvPlatform.isBrowserPlatform()) {
            this.setupWindowListener();
        } else {
            console.log("🟡 WebBrowserWindow: init: not in browser environment - skipping setupWindowListener");
        }
        return this;
    }

    /**
     * @description Sets up the window listener.
     * @returns {WebBrowserWindow} The current instance.
     * @category Window Management
     */
    setupWindowListener () {
        this.setWindowListener(WindowListener.clone().setDelegate(this).setIsListening(true));
        return this;
    }

    /**
     * @description Gets the shared DocumentBody instance.
     * @returns {DocumentBody} The shared DocumentBody instance.
     * @category Document Management
     */
    documentBody () {
        return DocumentBody.shared();
    }

    /**
     * @description Gets the width of the window.
     * @returns {number} The width of the window.
     * @category Window Management
     */
    width () {
        return window.innerWidth;
    }

    /**
     * @description Gets the height of the window.
     * @returns {number} The height of the window.
     * @category Window Management
     */
    height () {
        return window.innerHeight;
    }

    /**
     * @description Calculates the aspect ratio of the window.
     * @returns {number} The aspect ratio of the window.
     * @category Window Management
     */
    aspectRatio () {
        return this.width() / this.height();
    }

    /**
     * @description Sets the width of the window (unavailable in browser).
     * @param {number} w - The width to set.
     * @returns {WebBrowserWindow} The current instance.
     * @category Window Management
     */
    setWidth (/*w*/) {
        console.warn("warning: WebBrowserWindow.setWidth() unavailable in browser");
        return this;
    }

    /**
     * @description Sets the height of the window (unavailable in browser).
     * @param {number} h - The height to set.
     * @returns {WebBrowserWindow} The current instance.
     * @category Window Management
     */
    setHeight (/*h*/) {
        console.warn("warning: WebBrowserWindow.setHeight() unavailable in browser");
        return this;
    }

    /**
     * @description Logs the window size to the console.
     * @category Debugging
     */
    show () {
        console.log("Window size " + this.width() + "x" + this.height());
    }

    /**
     * @description Logs agent information to the console.
     * @category Debugging
     */
    showAgent () {
        console.log("navigator.userAgent = ", navigator.userAgent);
        console.log("   agentIsSafari: ", this.agentIsSafari());
        console.log("   agentIsChrome: ", this.agentIsChrome());
        console.log("  agentIsFirefox: ", this.agentIsFirefox());
        console.log("      isOnMobile: ", this.isOnMobile());
        console.log("   isTouchDevice: ", this.isTouchDevice());
    }

    /**
     * @description Gets an array of mobile device names.
     * @returns {string[]} An array of mobile device names.
     * @category Device Detection
     */
    mobileNames () {
        return ["android", "webos", "iphone", "ipad", "ipod", "blackBerry", "windows phone"];
    }

    /**
     * @description Gets the user agent string.
     * @returns {string} The user agent string.
     * @category Device Detection
     */
    agent () {
        return navigator.userAgent.toLowerCase();
    }

    /**
     * @description Gets the vendor string.
     * @returns {string} The vendor string.
     * @category Device Detection
     */
    vendor () {
        return navigator.vendor.toLowerCase();
    }

    /**
     * @description Checks if the agent is Firefox.
     * @returns {boolean} True if the agent is Firefox, false otherwise.
     * @category Device Detection
     */
    agentIsFirefox () {
        const agent = navigator.userAgent;
        return agent.contains("Firefox");
    }

    /**
     * @description Checks if the agent is Safari.
     * @returns {boolean} True if the agent is Safari, false otherwise.
     * @category Device Detection
     */
    agentIsSafari () {
        const vendor = navigator.vendor;
        const agent = navigator.userAgent;

        const isSafari = !Type.isNullOrUndefined(vendor) &&
                vendor.contains("Apple") &&
                !Type.isNullOrUndefined(agent) &&
                !agent.contains("CriOS") &&
                !agent.contains("FxiOS");
        return isSafari;
    }

    /**
     * @description Checks if the agent is Chrome.
     * @returns {boolean} True if the agent is Chrome, false otherwise.
     * @category Device Detection
     */
    agentIsChrome () {
        const isChrome = Boolean(window.chrome);
        return isChrome;
    }

    /**
     * @description Checks if the device is a mobile device.
     * @returns {boolean} True if the device is mobile, false otherwise.
     * @category Device Detection
     */
    isOnMobile () {
        const agent = this.agent();
        const match = this.mobileNames().detect((name) => { return agent.contains(name); });
        return match !== null;
    }

    /**
     * @description Checks if the device is a touch device.
     * @returns {boolean} True if the device is a touch device, false otherwise.
     * @category Device Detection
     */
    isTouchDevice () {
        let result = false;
        if ("ontouchstart" in window) { result = true; }
        if (navigator.maxTouchPoints) { result = true; }
        return result;
    }

    /**
     * @description Gets the URL hash.
     * @returns {string} The decoded URL hash.
     * @category URL Management
     */
    urlHash () {
        return decodeURI(window.location.hash.substr(1));
    }

    /**
     * @description Sets the URL hash.
     * @param {string} aString - The string to set as the URL hash.
     * @returns {WebBrowserWindow} The current instance.
     * @category URL Management
     */
    setUrlHash (aString) {
        if (this.urlHash() !== aString) {
            window.location.hash = encodeURI(aString);
        }
        return this;
    }

    /**
     * @description Pushes the URL hash.
     * @param {string} aHash - The hash to push.
     * @returns {WebBrowserWindow} The current instance.
     * @category URL Management
     */
    pushUrlHash (aString) {
        if (this.urlHash() !== aString) {
            const hash = encodeURI(aString);
            const newUrl = `${window.location.pathname}#${hash}`;
            history.pushState(null, "", newUrl);
        }
        return this;
    }

    // --- search params ---

    searchParams () {
        return new URLSearchParams(window.location.search);
    }

    pushSearchParam (key, value) {
        const params = new URLSearchParams(window.location.search);
        params.set(key, value);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.replaceState(null, "", newUrl); // Or use pushState to keep history
        return this;
    }

    /**
     * @description Gets a description dictionary of the browser window.
     * @returns {Object} A dictionary containing agent, size, and isOnMobile information.
     * @category Debugging
     */
    descriptionDict () {
        const dict = {
            agent: this.agent(),
            size: this.width() + "x" + this.height(),
            isOnMobile: this.isOnMobile()
        };
        return dict;
    }

    /**
     * @description Gets the full page URL including path and query.
     * @returns {URL} The full page URL.
     * @category URL Management
     */
    pageUrl () {
        return new URL(window.location.href);
    }

    /**
     * @description Gets the root URL without path or query.
     * @returns {string} The root URL.
     * @category URL Management
     */
    rootUrl () {
        const urlWithoutPathOrQuery = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
        return urlWithoutPathOrQuery;
    }

    /**
     * @description Gets the base URL without parameters or hash.
     * @returns {string} The base URL.
     * @category URL Management
     */
    baseUrl () {
        const url = new URL(window.location.href);
        let basePath = url.pathname;

        if (basePath.endsWith("/index.html")) {
            basePath = basePath.substring(0, basePath.lastIndexOf("index.html"));
        }

        return url.origin + basePath;
    }

    /**
     * @description Gets the URL hostname.
     * @returns {string} The URL hostname.
     * @category URL Management
     */
    urlHostname () {
        const parser = document.createElement("a");
        parser.href = window.location.href;
        let name = parser.hostname;
        if (!name) {
            name = "";
        }
        return name;
    }

    /**
     * @description Sets the document title.
     * @param {string} aName - The title to set.
     * @returns {WebBrowserWindow} The current instance.
     * @category Document Management
     */
    setTitle (aName) {
        document.title = aName;
        return this;
    }

    /**
     * @description Gets the document title.
     * @returns {string} The document title.
     * @category Document Management
     */
    title () {
        return document.title;
    }

    /**
     * @description Gets the active DOM view.
     * @returns {DOMView|null} The active DOM view or null if not found.
     * @category DOM Management
     */
    activeDomView () {
        const e = document.activeElement;
        if (e && e.domView()) {
            return e.domView();
        }
        return null;
    }

    /**
     * @description Handles the document beforeunload event.
     * @param {Event} event - The beforeunload event.
     * @category Event Handling
     */
    onDocumentBeforeUnload (event) {
        this.postNoteNamed("onDocumentBeforeUnload", event);
    }

    /**
     * @description Handles the document unload event.
     * @param {Event} event - The unload event.
     * @category Event Handling
     */
    onDocumentUnload (event) {
        this.postNoteNamed("onDocumentUnload", event);
    }

    /**
     * @description Handles the page show event.
     * @param {Event} event - The page show event.
     * @category Event Handling
     */
    onPageShow (event) {
        this.postNoteNamed("onPageShow", event);
    }

    /**
     * @description Handles the page hide event.
     * @param {Event} event - The page hide event.
     * @category Event Handling
     */
    onPageHide (event) {
        this.postNoteNamed("onPageHide", event);
    }

    /**
     * @description Handles the form submit event.
     * @param {Event} event - The form submit event.
     * @category Event Handling
     */
    onFormSubmit (event) {
        this.postNoteNamed("onFormSubmit", event);
    }

    /**
     * @description Handles the browser online event.
     * @param {Event} event - The online event.
     * @category Event Handling
     */
    onBrowserOnline (event) {
        this.postNoteNamed("onBrowserOnline", event);
    }

    /**
     * @description Handles the browser offline event.
     * @param {Event} event - The offline event.
     * @category Event Handling
     */
    onBrowserOffline (event) {
        this.postNoteNamed("onBrowserOffline", event);
    }

    /**
     * @description Checks if the browser is online.
     * @returns {boolean} True if the browser is online, false otherwise.
     * @category Network Management
     */
    isOnline () {
        if (SvPlatform.isBrowserPlatform()) {
            return navigator.onLine;
        }
        // assume online for non-browser platforms?
        return true;
    }

    onHashChange (event) {
        this.postNoteNamed("onHashChange", event);
    }

    onPopState (event) {
        this.postNoteNamed("onPopState", event);
    }

    /**
     * @description Gets the current selection range.
     * @returns {Range|null} The current selection range or null if not available.
     * @category Selection Management
     */
    getSelectionRange () {
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                return sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }

    /**
     * @description Sets the selection range.
     * @param {Range} range - The range to set as the selection.
     * @returns {WebBrowserWindow} The current instance.
     * @category Selection Management
     */
    setSelectionRange (range) {
        if (range) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }

            assert(this.getSelectionRange().isEqual(range));
        }
        return this;
    }

    /**
     * @description Stores the current selection range.
     * @returns {boolean} True if a selection range was stored, false otherwise.
     * @category Selection Management
     */
    storeSelectionRange () {
        const range = this.getSelectionRange();
        if (range) {
            console.log(this.svTypeId() + "--- storing selection ---");
            this.setStoredSelectionRange(range);
            return true;
        }
        return false;
    }

    /**
     * @description Restores the stored selection range.
     * @returns {boolean} True if a selection range was restored, false otherwise.
     * @category Selection Management
     */
    restoreSelectionRange () {
        if (this.storedSelectionRange()) {
            console.log(this.svTypeId() + "--- restoring selection ---");
            this.setSelectionRange(this.storedSelectionRange());
            assert(this.storedSelectionRange().isEqual(this.getSelectionRange()));
            this.setStoredSelectionRange(null);
            return true;
        }
        return false;
    }

    /**
     * @description Safely runs a block while restoring the selection.
     * @param {Function} aBlock - The block to run.
     * @returns {WebBrowserWindow} The current instance.
     * @category Selection Management
     */
    safelyRunBlockWhileRestoringSelection (aBlock) {
        this.storeSelectionRange();
        try {
            aBlock();
        } catch (error) {
            this.restoreSelectionRange();
            console.error("error running block while restoring selection:", error);
            error.rethrow();
        }
        return this;
    }

    onWindowError (event) {
        this.postNoteNamed("onWindowError", event);
    }

    isFullScreen () {
        // Window is in fullscreen mode. Also see WebDocument.isFullscreen().
        // NOTE: This isn’t perfect—window borders, taskbars, or multiple monitors can cause false positives/negatives.
        return window.innerHeight === screen.height && window.innerWidth === screen.width;
    }

}.initThisClass());
