/**
 * @module library.view.webbrowser
 */

/**
 * @class WbCookieManager
 * @extends ProtoClass
 * @classdesc Manages a collection of browser cookies.
 * Provides methods for reading and managing multiple cookies.
 * 
 * Usage examples:
 * 
 * // simple example
 * WbCookieManager.shared().setValueOfCookieNamed("returnUrl", window.location.href);
 * 
 * // more complex example
 * const cookie = WbCookieManager.shared().cookieNamed("myCookie");
 * if (cookie) {
 *     cookie.setValue("myValue");
 *     cookie.setPath("/");
 *     cookie.setDomain("mydomain.com");
 *     cookie.setMaxAge(3600);
 *     cookie.setSecure(true);
 *     cookie.setHttpOnly(true);
 *     cookie.save();
 * }
 *
 * WbCookieManager.shared().removeCookieNamed("myCookie");
 *
 * WbCookieManager.shared().clear();
 *
 * WbCookieManager.shared().cookieCount();
 * 
 * const newCookie = WbCookieManager.shared().newCookieNamed("myCookie");
 * newCookie.setPath("/");
 * newCookie.setDomain("mydomain.com");
 * newCookie.setMaxAge(3600);
 * newCookie.setSecure(true);
 * newCookie.setHttpOnly(true);
 * newCookie.save();
 * 
 */

(class WbCookieManager extends ProtoClass {
    
    static valueOfCookieNamed (name) {
        const cookie = WbCookieManager.shared().cookieNamed(name);
        if (cookie) {
            return cookie.value();
        }
        return null;
    }

    static setValueOfCookieNamed (name, value) {
        assert(name.length < 100, "sanity check");
        const existingCookie = WbCookieManager.shared().cookieNamed(name);
        if (existingCookie) {
            if (Type.isNullOrUndefined(value)) {
                existingCookie.delete();
            } else {
                existingCookie.setValue(value);
                existingCookie.save();
            }
        } else {
            const newCookie = WbCookieManager.shared().newCookieNamed(name);
            newCookie.setName(name);
            newCookie.setValue(value);
            newCookie.save();
        }
        /*
        const newValue = WbCookieManager.valueOfCookieNamed(name);
        if(newValue !== value && value !== null) {
            this.logDebug("[" + newValue + "] != [" + value + "]");
            debugger;
            this.logDebug("let's debugg this!");
            WbCookieManager.valueOfCookieNamed(name);
            this.setValueOfCookieNamed(name, value);
        }
        */
        return this;
    }

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
        {
            const slot = this.newSlot("cookiesMap", null);
            slot.setSlotType("Map");
            slot.setFinalInitProto(Map);
        }

        {
            const slot = this.newSlot("idb", null);
            slot.setSlotType("SvIndexedDbFolder");
            //slot.setFinalInitProto(SvIndexedDbFolder);
        }
    }
    
    /**
     * @description Initializes the WbCookieManager instance.
     * @returns {WbCookieManager} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Final initialization that reads cookies from the browser.
     * @returns {WbCookieManager} The initialized instance.
     * @category Initialization
     */
    finalInit () {
        super.finalInit();
        this.readCookies();
        return this;
    }

    /**
     * @description Reads cookies from document.cookie and populates the cookies map.
     * @returns {WbCookieManager} The current instance.
     * @category Cookie Management
     */
    readCookies () {
        if (SvPlatform.isBrowserPlatform()) {
           this.readBrowserCookies();
        } else {
            this.loadFromIdb();
        }
        
        return this;
    }

    /**
     * @description Reads cookies from document.cookie and populates the cookies map.
     * @returns {WbCookieManager} The current instance.
     * @category Cookie Management
     */
    readBrowserCookies () {
        // Only access document.cookie in browser environment
        const cookiesMap = new Map();
        this.setCookiesMap(cookiesMap);
        const cookieStrings = document.cookie.split(';');
        
        for (let cookieString of cookieStrings) {
            const trimmedCookie = cookieString.trim();
            if (trimmedCookie) {
                const cookie = WbCookie.fromCookieString(trimmedCookie);
                cookie.setCookieManager(this);
                cookiesMap.set(cookie.name(), cookie);
            }
        }
        if (cookiesMap.keysArray().detect(key => key.length > 50)) {
            this.logWarn("found crazy cookie names: ", cookiesMap.keysArray());
            debugger;
            this.logWarn("cookie looks hosed - deleting all cookies");
            this.deleteAllCookies();
            this.readCookies();
        }
        this.setCookiesMap(cookiesMap);
    }

    /**
     * @description Finds a cookie by name.
     * @param {string} name - The name of the cookie to find.
     * @returns {WbCookie|null} The found cookie or null.
     * @category Cookie Management
     */
    cookieNamed (name) {
        const cookie =  this.cookiesMap().get(name) || null;
        return cookie;
    }

    /**
     * @description Creates a new cookie with the given name. If the cookie already exists, it returns the existing cookie.
     * @param {string} name - The name of the cookie to create.
     * @returns {WbCookie} The created cookie.
     * @category Cookie Management
     */
    newCookieNamed (name) {
        const existingCookie = this.cookieNamed(name);
        if (existingCookie) {
            return existingCookie;
        }
        const newCookie = WbCookie.clone();
        newCookie.setName(name);
        this.addCookie(newCookie);
        return newCookie;
    }

    /**
     * @description Adds a cookie to the collection.
     * @param {WbCookie} cookie - The cookie to add.
     * @returns {WbCookieManager} The current instance.
     * @category Cookie Management
     */
    addCookie (cookie) {
        cookie.setCookieManager(this);
        assert(cookie.name(), "Cookie name is required");
        this.cookiesMap().set(cookie.name(), cookie);
        cookie.save();
        return this;
    }

    /**
     * @description Removes a cookie by name.
     * @param {string} name - The name of the cookie to remove.
     * @returns {WbCookieManager} The current instance.
     * @category Cookie Management
     */
    removeCookieNamed (name) {
        const cookie = this.cookieNamed(name);
        if (cookie) {
            cookie.delete(); // will call onDidDeleteCookie() on us
        }
        return this;
    }

    /**
     * @description Returns all cookie names.
     * @returns {Array} An array of cookie names.
     * @category Cookie Management
     */
    cookieNames () {
        return Array.from(this.cookiesMap().keys());
    }

    /**
     * @description Returns all cookies as an array.
     * @returns {Array} An array of WbCookie objects.
     * @category Cookie Management
     */
    cookiesArray () {
        return Array.from(this.cookiesMap().values());
    }

    /**
     * @description Clears all cookies from the collection.
     * @returns {WbCookieManager} The current instance.
     * @category Cookie Management
     */
    deleteAllCookies () {
        this.cookiesArray().forEach(cookie => cookie.delete());
        assert(this.cookiesMap().size === 0, "cookiesMap should be empty");
        return this;
    }

    /**
     * @description Returns the number of cookies in the collection.
     * @returns {number} The cookie count.
     * @category Cookie Management
     */
    cookieCount () {
        return this.cookiesMap().size;
    }

    /**
     * @description Called when a cookie is deleted.
     * @param {WbCookie} cookie - The deleted cookie.
     * @category Cookie Management
     */
    onDidDeleteCookie (cookie) {
        this.cookiesMap().delete(cookie.name());
    }

    onDidSaveCookie (cookie) {
        const map = this.cookiesMap();
        const existingCookie = map.get(cookie.name());
        if (existingCookie) {
            assert(existingCookie === cookie, "Cookie already exists in map");
        } else {
            this.addCookie(cookie);
        }
        return this;
    }

    asJson () {
        return {
            type: "WbCookieManager",
            cookies: this.cookiesArray().map(cookie => cookie.asJson())
        };
    }

    setJson (json) {
        assert(json.type === "WbCookieManager", "Invalid JSON type");
        assert(Type.isArray(json.cookies), "cookies property must be an array");
        json.cookies.forEach(cookieJson => {
            const cookie = WbCookie.fromJson(cookieJson);
            this.addCookie(cookie);
        });
        return this;
    }

    requestDeleteCookie (wbCookie) {
        if (SvPlatform.isBrowserPlatform()) {
            document.cookie = wbCookie.deleteCookieString();
            this.logDebug("deleted cookie: ", wbCookie.name());   
        } else {
            this.idb().saveToIdb();
        }
        this.onDidDeleteCookie(wbCookie);
        return this;
    }

    requestSaveCookie (wbCookie) {
        if (SvPlatform.isBrowserPlatform()) {
            assert(wbCookie.name().length < 100, "sanity check");
            document.cookie = wbCookie.cookieString();
        }
        this.onDidSaveCookie(wbCookie);
        return this;
    }

    idb () {
        if (this._idb === null) {
            const idb = SvIndexedDbFolder.clone();
            idb.setIsDebugging(false);
            idb.setPath(this.type());
            this._idb = idb;
        }
        return this._idb;
    }

    async loadFromIdb () {
        const idb = this.idb();
        const data = await idb.promiseAt("cookies");
        if (data) {
            const json = JSON.parse(data);
            this.setJson(json);
        }
        return this;
    }

    async saveToIdb () {
        const idb = this.idb();
        const json = this.asJson();
        const data = JSON.stringify(json);
        await idb.promiseAtPut("cookies", data);
        return this;
    }

}.initThisClass());

WbCookieManager.shared();
assert(SvGlobals.has("WbCookieManager"), "WbCookieManager is not defined");
