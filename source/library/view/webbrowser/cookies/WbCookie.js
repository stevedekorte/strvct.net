/**
 * @module library.view.webbrowser
 */

/**
 * @class WbCookie
 * @extends ProtoClass
 * @classdesc Represents a single browser cookie with all its attributes.
 * Provides methods for serializing to and parsing from cookie strings.
 */
(class WbCookie extends ProtoClass {
    
    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("value", "");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("maxAge", 34560000);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("expires", null);
            slot.setSlotType("Date");
        }
        {
            const slot = this.newSlot("path", "/");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("domain", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("secure", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("sameSite", "Lax");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("httpOnly", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("cookieManager", null);
            slot.setSlotType("WbCookieManager");
        }
    }
    
    /**
     * @description Initializes the WbCookie instance.
     * @returns {WbCookie} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    setMaxAgeToMax () {
        const maxAgeSeconds = 34560000; // 400 days (maximum allowed by modern browsers)
        this.setMaxAge(maxAgeSeconds);
        return this;
    }

    /**
     * @description Composes and returns a cookie string based on the slots.
     * @returns {string} The formatted cookie string.
     * @category Cookie Serialization
     */
    cookieString () {
        let cookieStr = `${encodeURIComponent(this.name())}=${encodeURIComponent(this.value())}`;
        
        if (this.maxAge() !== null) {
            cookieStr += `; Max-Age=${this.maxAge()}`;
        }
        
        if (this.expires() !== null) {
            cookieStr += `; Expires=${this.expires().toUTCString()}`;
        }
        
        if (this.path()) {
            cookieStr += `; Path=${this.path()}`;
        }
        
        if (this.domain()) {
            cookieStr += `; Domain=${this.domain()}`;
        }
        
        if (this.secure()) {
            cookieStr += `; Secure`;
        }
        
        if (this.sameSite()) {
            cookieStr += `; SameSite=${this.sameSite()}`;
        }
        
        if (this.httpOnly()) {
            cookieStr += `; HttpOnly`;
        }
        
        return cookieStr;
    }

    /**
     * @description Parses a cookie string and sets the slots from it.
     * @param {string} cookieString - The cookie string to parse.
     * @returns {WbCookie} The current instance.
     * @category Cookie Parsing
     */
    setCookieString (cookieString) {
        const parts = cookieString.split(';').map(part => part.trim());
        
        // First part is always name=value
        if (parts.length > 0) {
            const [name, ...valueParts] = parts[0].split('=');
            this.setName(decodeURIComponent(name));
            this.setValue(decodeURIComponent(valueParts.join('=')));
        }
        
        // Parse additional attributes
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            const [key, ...valueParts] = part.split('=');
            const value = valueParts.join('=');
            
            switch (key.toLowerCase()) {
                case 'max-age':
                    this.setMaxAge(parseInt(value));
                    break;
                case 'expires':
                    this.setExpires(new Date(value));
                    break;
                case 'path':
                    this.setPath(value);
                    break;
                case 'domain':
                    this.setDomain(value);
                    break;
                case 'secure':
                    this.setSecure(true);
                    break;
                case 'samesite':
                    this.setSameSite(value);
                    break;
                case 'httponly':
                    this.setHttpOnly(true);
                    break;
            }
        }
        
        return this;
    }

    /**
     * @description Creates a new WbCookie instance from a cookie string.
     * @param {string} cookieString - The cookie string to parse.
     * @returns {WbCookie} A new WbCookie instance.
     * @category Cookie Parsing
     */
    static fromCookieString (cookieString) {
        
        const cookie = this.clone();
        cookie.setCookieString(cookieString);
        return cookie;
    }

    /**
     * @description Saves the cookie to the browser's cookie storage.
     * @returns {WbCookie} The current instance.
     * @category Cookie Management
     */
    save () {
        this.cookieManager().requestSaveCookie(this);
        return this;
    }


    deleteCookieString () {
        // To delete a cookie, we need to set it with an expired date
        // We'll preserve the path and domain to ensure we're deleting the right cookie

        let deleteStr = `${encodeURIComponent(this.name())}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        if (this.path()) {
            deleteStr += `; Path=${this.path()}`;
        }
        
        if (this.domain()) {
            deleteStr += `; Domain=${this.domain()}`;
        }
        
        return deleteStr;
    }

    /**
     * @description Deletes the cookie from the browser's cookie storage.
     * @returns {WbCookie} The current instance.
     * @category Cookie Management
     */
    delete () {
        // To delete a cookie, we need to set it with an expired date
        // We'll preserve the path and domain to ensure we're deleting the right cookie

        this.cookieManager().requestDeleteCookie(this);
        return this;
    }

    asJson () {
        return {
            name: this.name(),
            value: this.value(),
            maxAge: this.maxAge(),
            expires: this.expires(),
            path: this.path(),
            domain: this.domain(),
            secure: this.secure(),
            sameSite: this.sameSite(),
            httpOnly: this.httpOnly(),
        };
    }

    static fromJson (json) {
        const cookie = this.clone();
        cookie.setName(json.name);
        cookie.setValue(json.value);
        cookie.setMaxAge(json.maxAge);
        cookie.setExpires(json.expires);
        cookie.setPath(json.path);
        cookie.setDomain(json.domain);
        cookie.setSecure(json.secure);
        cookie.setSameSite(json.sameSite);
        cookie.setHttpOnly(json.httpOnly);
        return cookie;
    }

}.initThisClass());