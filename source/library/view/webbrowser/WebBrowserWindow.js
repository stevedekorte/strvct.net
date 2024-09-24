/**
 * @module library.view.webbrowser
 */

/**
 * @class WebBrowserWindow
 * @extends ProtoClass
 * @classdesc Abstraction for the main web browser window. 
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
     */
    static initClass () {
        this.setIsSingleton(true)
    }
    
    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots () {
        /**
         * @property {WindowListener} windowListener
         */
        {
            const slot = this.newSlot("windowListener", null);
            slot.setSlotType("WindowListener");
        }

        /**
         * @property {Range} storedSelectionRange
         */
        {
            const slot = this.newSlot("storedSelectionRange", null);
            slot.setSlotType("Range");
        }
    }
    
    /**
     * @description Initializes the WebBrowserWindow instance.
     * @returns {WebBrowserWindow} The initialized instance.
     */
    init () {
        super.init()
        this.setupWindowListener()
        return this
    }

    /**
     * @description Sets up the window listener.
     * @returns {WebBrowserWindow} The current instance.
     */
    setupWindowListener () {
        this.setWindowListener(WindowListener.clone().setDelegate(this).setIsListening(true))
        return this
    }

    /**
     * @description Gets the shared DocumentBody instance.
     * @returns {DocumentBody} The shared DocumentBody instance.
     */
    documentBody () {
        return DocumentBody.shared()
    }
    
    /**
     * @description Gets the width of the window.
     * @returns {number} The width of the window.
     */
    width () {
        return window.innerWidth
    }

    /**
     * @description Gets the height of the window.
     * @returns {number} The height of the window.
     */
    height () {
        return window.innerHeight
    }
    
    /**
     * @description Calculates the aspect ratio of the window.
     * @returns {number} The aspect ratio of the window.
     */
    aspectRatio () {
        return this.width() / this.height()
    }
    
    /**
     * @description Sets the width of the window (unavailable in browser).
     * @param {number} w - The width to set.
     * @returns {WebBrowserWindow} The current instance.
     */
    setWidth (w) {
        console.warn("warning: WebBrowserWindow.setWidth() unavailable in browser")
        return this
    }
    
    /**
     * @description Sets the height of the window (unavailable in browser).
     * @param {number} h - The height to set.
     * @returns {WebBrowserWindow} The current instance.
     */
    setHeight (h) {
        console.warn("warning: WebBrowserWindow.setHeight() unavailable in browser")
        return this
    }
    
    /**
     * @description Logs the window size to the console.
     */
    show () {
        console.log("Window size " + this.width() + "x" + this.height())
    }

    /**
     * @description Logs agent information to the console.
     */
    showAgent () {
        console.log("navigator.userAgent = ", navigator.userAgent);
        console.log("   agentIsSafari: ", this.agentIsSafari())
        console.log("   agentIsChrome: ", this.agentIsChrome())
        console.log("  agentIsFirefox: ", this.agentIsFirefox())
        console.log("      isOnMobile: ", this.isOnMobile())
        console.log("   isTouchDevice: ", this.isTouchDevice())
    }
    
    /**
     * @description Gets an array of mobile device names.
     * @returns {string[]} An array of mobile device names.
     */
    mobileNames () {
        return ["android", "webos", "iphone", "ipad", "ipod", "blackBerry", "windows phone"]  
    }

    /**
     * @description Gets the user agent string.
     * @returns {string} The user agent string.
     */
    agent () {
        return navigator.userAgent.toLowerCase()
    }

    /**
     * @description Gets the vendor string.
     * @returns {string} The vendor string.
     */
    vendor () {
        return navigator.vendor.toLowerCase()
    }

    /**
     * @description Checks if the agent is Firefox.
     * @returns {boolean} True if the agent is Firefox, false otherwise.
     */
    agentIsFirefox () {
        const agent = navigator.userAgent;
        return agent.contains("Firefox")
    }

    /**
     * @description Checks if the agent is Safari.
     * @returns {boolean} True if the agent is Safari, false otherwise.
     */
    agentIsSafari () {
        const vendor = navigator.vendor;
        const agent = navigator.userAgent;
        
        const isSafari = !Type.isNullOrUndefined(vendor) && 
                vendor.contains("Apple") &&
                !Type.isNullOrUndefined(agent) &&
                !agent.contains("CriOS") &&
                !agent.contains("FxiOS");
        return isSafari
    }

    /**
     * @description Checks if the agent is Chrome.
     * @returns {boolean} True if the agent is Chrome, false otherwise.
     */
    agentIsChrome () {
        const isChrome = Boolean(window.chrome)
        return isChrome
    }
    
    /**
     * @description Checks if the device is a mobile device.
     * @returns {boolean} True if the device is mobile, false otherwise.
     */
    isOnMobile () { 
        const agent = this.agent();
        const match = this.mobileNames().detect((name) => { return agent.contains(name); })
        return match !== null
    }

    /**
     * @description Checks if the device is a touch device.
     * @returns {boolean} True if the device is a touch device, false otherwise.
     */
    isTouchDevice () {
        let result = false 
        if ("ontouchstart" in window) { result = true; }
        if (navigator.maxTouchPoints) { result = true; }
        return result
    }

    /**
     * @description Gets the URL hash.
     * @returns {string} The decoded URL hash.
     */
    urlHash () {
        return decodeURI(window.location.hash.substr(1))
    }
    
    /**
     * @description Sets the URL hash.
     * @param {string} aString - The string to set as the URL hash.
     * @returns {WebBrowserWindow} The current instance.
     */
    setUrlHash (aString) {
        if (this.urlHash() !== aString) {
            window.location.hash = encodeURI(aString)
        }
        return this
    }
    
    /**
     * @description Gets a description dictionary of the browser window.
     * @returns {Object} A dictionary containing agent, size, and isOnMobile information.
     */
    descriptionDict () {
        const dict = {
            agent: this.agent(),
            size: this.width() + "x" + this.height(),
            isOnMobile: this.isOnMobile()
        }
        return dict
    }

    /**
     * @description Gets the full page URL including path and query.
     * @returns {URL} The full page URL.
     */
    pageUrl () {
        return new URL(window.location.href)
    }

    /**
     * @description Gets the root URL without path or query.
     * @returns {string} The root URL.
     */
    rootUrl () {
        const urlWithoutPathOrQuery = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        return urlWithoutPathOrQuery
    }

    /**
     * @description Gets the base URL without parameters or hash.
     * @returns {string} The base URL.
     */
    baseUrl () {
        const url = new URL(window.location.href);
        let basePath = url.pathname;

        if (basePath.endsWith('/index.html')) {
            basePath = basePath.substring(0, basePath.lastIndexOf('index.html'));
        }

        return url.origin + basePath;
    }

    /**
     * @description Gets the URL hostname.
     * @returns {string} The URL hostname.
     */
    urlHostname () {
        const parser = document.createElement("a")
        parser.href = window.location.href
        let name = parser.hostname
        if (!name) {
		    name = ""
        }
        return name
    }

    /**
     * @description Sets the document title.
     * @param {string} aName - The title to set.
     * @returns {WebBrowserWindow} The current instance.
     */
    setTitle (aName) {
        document.title = aName
        return this
    }

    /**
     * @description Gets the document title.
     * @returns {string} The document title.
     */
    title () {
        return document.title
    }
    
    /**
     * @description Gets the active DOM view.
     * @returns {DOMView|null} The active DOM view or null if not found.
     */
    activeDomView () {
        const e = document.activeElement
        if (e && e.domView()) {
            return e.domView()
        }
        return null
    }

    /**
     * @description Handles the document beforeunload event.
     * @param {Event} event - The beforeunload event.
     */
    onDocumentBeforeUnload (event) {
        this.postNoteNamed("onDocumentBeforeUnload")
    }

    /**
     * @description Handles the document unload event.
     * @param {Event} event - The unload event.
     */
    onDocumentUnload (event) {
        this.postNoteNamed("onDocumentUnload")
    }

    /**
     * @description Handles the page show event.
     * @param {Event} event - The page show event.
     */
    onPageShow (event) {
        this.postNoteNamed("onPageShow")
    }
    
    /**
     * @description Handles the page hide event.
     * @param {Event} event - The page hide event.
     */
    onPageHide (event) {
        this.postNoteNamed("onPageHide")
    }

    /**
     * @description Handles the form submit event.
     * @param {Event} event - The form submit event.
     */
    onFormSubmit (event) {
        this.postNoteNamed("onFormSubmit")
    }

    /**
     * @description Handles the browser online event.
     * @param {Event} event - The online event.
     */
    onBrowserOnline (event) {
        this.postNoteNamed("onBrowserOnline")
    }

    /**
     * @description Handles the browser offline event.
     * @param {Event} event - The offline event.
     */
    onBrowserOffline (event) {
        this.postNoteNamed("onBrowserOffline")
    }

    /**
     * @description Checks if the browser is online.
     * @returns {boolean} True if the browser is online, false otherwise.
     */
    isOnline () {
        return navigator.onLine
    }

    /**
     * @description Gets the current selection range.
     * @returns {Range|null} The current selection range or null if not available.
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
     */
    storeSelectionRange () {
        const range = this.getSelectionRange();
        if (range) {
            console.log(this.typeId() + "--- storing selection ---")
            this.setStoredSelectionRange(range);
            return true;
        }
        return false;
    }

    /**
     * @description Restores the stored selection range.
     * @returns {boolean} True if a selection range was restored, false otherwise.
     */
    restoreSelectionRange () {
        if (this.storedSelectionRange()) {
            console.log(this.typeId() + "--- restoring selection ---");
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
     */
    safelyRunBlockWhileRestoringSelection (aBlock) {
        this.storeSelectionRange()
        try {
            aBlock()
        } catch (error) {
            this.restoreSelectionRange()
            console.error("error running block while restoring selection:", error);
            error.rethrow();
        }
        return this
    }

}.initThisClass());