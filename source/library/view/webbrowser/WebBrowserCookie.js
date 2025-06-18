/**
 * @module library.view.webbrowser
 */

/**
 * @class WebBrowserCookie
 * @extends ProtoClass
 * @classdesc Abstraction for browser cookie management.
 * Provides methods for getting, setting, and deleting cookies with proper domain handling.
 * 
 * Usage example:
 * WebBrowserCookie.shared().setCookie("authToken", token, 400 * 24 * 60 * 60);
 * const token = WebBrowserCookie.shared().getCookie("authToken");
 * WebBrowserCookie.shared().deleteCookie("authToken");
 */
(class WebBrowserCookie extends ProtoClass {
    
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
        // No additional slots needed for this utility class
    }
    
    /**
     * @description Initializes the WebBrowserCookie instance.
     * @returns {WebBrowserCookie} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Gets a cookie value by name.
     * @param {string} name - The name of the cookie to retrieve.
     * @returns {string|null} The cookie value or null if not found.
     * @category Cookie Management
     */
    getCookie (name) {
        if (!document.cookie) return null;
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [key, ...valParts] = cookie.trim().split('=');
            if (key === name) {
                return decodeURIComponent(valParts.join('='));
            }
        }
        return null;
    }

    /**
     * @description Sets a cookie with the given name, value, and options.
     * @param {string} name - The name of the cookie.
     * @param {string} value - The value of the cookie.
     * @param {number} maxAgeSeconds - The maximum age of the cookie in seconds.
     * @param {Object} options - Additional cookie options.
     * @param {string} options.path - The path for the cookie (default: "/").
     * @param {string} options.sameSite - The SameSite attribute (default: "Lax").
     * @param {boolean} options.secure - Whether the cookie should be secure (default: auto-detected).
     * @param {string} options.domain - The domain for the cookie (default: auto-detected).
     * @returns {WebBrowserCookie} The current instance.
     * @category Cookie Management
     */
    setCookie (name, value, maxAgeSeconds, options = {}) {
        const {
            path = "/",
            sameSite = "Lax",
            secure = this.shouldUseSecureFlag(),
            domain = this.detectDomain()
        } = options;

        let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        cookieStr += `; Max-Age=${maxAgeSeconds}`;
        cookieStr += `; Path=${path}`;
        cookieStr += `; SameSite=${sameSite}`;
        
        if (domain) {
            cookieStr += `; Domain=${domain}`;
        }
        
        if (secure) {
            cookieStr += `; Secure`;
        }
        
        document.cookie = cookieStr;
        return this;
    }

    /**
     * @description Deletes a cookie by setting its expiration to the past.
     * @param {string} name - The name of the cookie to delete.
     * @param {Object} options - Additional cookie options.
     * @param {string} options.path - The path for the cookie (default: "/").
     * @param {string} options.domain - The domain for the cookie (default: auto-detected).
     * @returns {WebBrowserCookie} The current instance.
     * @category Cookie Management
     */
    deleteCookie (name, options = {}) {
        const {
            path = "/",
            domain = this.detectDomain()
        } = options;

        let cookieStr = `${encodeURIComponent(name)}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}`;
        
        if (domain) {
            cookieStr += `; Domain=${domain}`;
        }
        
        document.cookie = cookieStr;
        return this;
    }

    /**
     * @description Detects the appropriate domain for cookies based on the current hostname.
     * @returns {string|null} The domain to use for cookies, or null for default behavior.
     * @category Domain Detection
     */
    detectDomain () {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'localhost';
        } else if (hostname.endsWith('.undreamedof.ai') || hostname === 'undreamedof.ai') {
            return '.undreamedof.ai';
        }
        
        // For other domains, let the browser handle it
        return null;
    }

    /**
     * @description Determines whether to use the Secure flag for cookies.
     * @returns {boolean} True if cookies should be secure, false otherwise.
     * @category Security
     */
    shouldUseSecureFlag () {
        // Use secure flag for HTTPS connections
        return window.location.protocol === 'https:';
    }

    /**
     * @description Gets the current hostname.
     * @returns {string} The current hostname.
     * @category URL Management
     */
    hostname () {
        return window.location.hostname;
    }

    /**
     * @description Gets the current protocol.
     * @returns {string} The current protocol (http: or https:).
     * @category URL Management
     */
    protocol () {
        return window.location.protocol;
    }

    /**
     * @description Checks if the current connection is secure (HTTPS).
     * @returns {boolean} True if the connection is secure, false otherwise.
     * @category Security
     */
    isSecureConnection () {
        return this.protocol() === 'https:';
    }

    /**
     * @description Checks if we're running on localhost.
     * @returns {boolean} True if running on localhost, false otherwise.
     * @category Environment Detection
     */
    isLocalhost () {
        const hostname = this.hostname();
        return hostname === 'localhost' || hostname === '127.0.0.1';
    }

    /**
     * @description Gets all cookies as a dictionary.
     * @returns {Object} A dictionary of all cookies.
     * @category Cookie Management
     */
    getAllCookies () {
        const cookies = {};
        if (document.cookie) {
            document.cookie.split(';').forEach(cookie => {
                const [key, ...valParts] = cookie.trim().split('=');
                if (key) {
                    cookies[key] = decodeURIComponent(valParts.join('='));
                }
            });
        }
        return cookies;
    }

    /**
     * @description Gets a description dictionary of the cookie environment.
     * @returns {Object} A dictionary containing hostname, protocol, and domain information.
     * @category Debugging
     */
    descriptionDict () {
        const dict = {
            hostname: this.hostname(),
            protocol: this.protocol(),
            isSecure: this.isSecureConnection(),
            isLocalhost: this.isLocalhost(),
            detectedDomain: this.detectDomain(),
            cookieCount: Object.keys(this.getAllCookies()).length
        };
        return dict;
    }

}.initThisClass()); 