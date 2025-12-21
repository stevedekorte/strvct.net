"use strict";

/** * @module library.node.fields.subclasses
 */

/** * @class SvUrlField
 * @extends SvField
 * @classdesc SvUrlField is a specialized field for handling URL data.
 
 
 */

/**

 */
(class SvUrlField extends SvField {

    /**
     * @static
     * @returns {boolean} True if the field is available as a node primitive.
     * @category Availability
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @static
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the field can open the given MIME type.
     * @category MIME Handling
     */
    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("text/uri-list");
    }

    /**
     * @static
     * @param {Object} dataChunk - The data chunk to open.
     * @returns {SvUrlField} A new SvUrlField instance with the opened data.
     * @category Data Opening
     */
    static openMimeChunk (dataChunk) {
        const newNode = this.clone();
        const uris = dataChunk.decodedData().split("\n");
        const uri = uris.first();

        try {
            const url = new URL(uri);
            newNode.setKey(url.hostname);
            const path = url.pathname;
            const p = path.fileName();
            if (p) {
                newNode.setKey(p);
            }
        } catch (error) {
            newNode.setKey("?");
        }

        newNode.setValue(uri);
        newNode.setValueIsVisible(false);

        return newNode;
    }

    /**
     * @description Initializes the prototype slots for the SvUrlField.
     * @category Initialization
     */
    initPrototypeSlots () {
        // scheme : // userinfo @host : port / path ? query # fragment
        /**
         * @member {string} href - The full URL.
         * @category URL Components
         */
        this.newStringSlotNamed("href", "");
        /**
         * @member {string} protocol - The URL protocol.
         * @category URL Components
         */
        this.newStringSlotNamed("protocol", "http");
        /**
         * @member {string} username - The URL username.
         * @category URL Components
         */
        this.newStringSlotNamed("username", "");
        /**
         * @member {string} password - The URL password.
         * @category URL Components
         */
        this.newStringSlotNamed("password", "");
        /**
         * @member {string} hostname - The URL hostname.
         * @category URL Components
         */
        this.newStringSlotNamed("hostname", "hostname");
        /**
         * @member {string} port - The URL port.
         * @category URL Components
         */
        this.newStringSlotNamed("port", "");
        /**
         * @member {string} pathname - The URL pathname.
         * @category URL Components
         */
        this.newStringSlotNamed("pathname", "");
        /**
         * @member {string} search - The URL search query.
         * @category URL Components
         */
        this.newStringSlotNamed("search", "");
        /**
         * @member {string} hash - The URL hash.
         * @category URL Components
         */
        this.newStringSlotNamed("hash", "");

        {
            /**
             * @member {boolean} isUpdatingHref - Flag to indicate if href is being updated.
             * @category State
             */
            const slot = this.newSlot("isUpdatingHref", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Creates a new string slot with the given name and default value.
     * @param {string} slotName - The name of the slot.
     * @param {string} defaultValue - The default value for the slot.
     * @returns {Object} The created slot.
     * @category Slot Management
     */
    newStringSlotNamed (slotName, defaultValue) {
        const slot = this.newSlot(slotName, defaultValue);
        slot.setOwnsSetter(true);
        slot.setDoesHookSetter(true);
        slot.setDuplicateOp("copyValue");
        slot.setCanInspect(true);
        slot.setSlotType("String");
        slot.setLabel(slotName.capitalized());
        slot.setInspectorPath("URL");

        if (slotName !== "href") {
            //slot.setCanEditInspection(false)
        }
        return slot;
    }

    /**
     * @description Initializes the SvUrlField.
     * @category Initialization
     */
    init () {
        super.init();

        this.setKey("Link");
        this.setKeyIsVisible(true);
        this.setKeyIsEditable(true);

        this.setValueIsEditable(true);
        this.setValueIsVisible(true);

        this.setCanDelete(true);

        this.setNodeCanInspect(true);
    }

    /**
     * @description Returns the node inspector.
     * @returns {Object} The node inspector.
     * @category Inspection
     */
    nodeInspector () {
        return super.nodeInspector();
    }

    /**
     * @description Creates a URL object from the current value.
     * @returns {URL|null} The URL object or null if invalid.
     * @category URL Manipulation
     */
    urlFromValue () {
        const s = this.value();
        if (s.trim() === "") {
            return null;
        }

        try {
            const url = new URL(s);
            return url;
        } catch (e) {
            //this.setError(e.message)
        }
        return null;
    }

    /**
     * @description Called when a slot value is updated.
     * @category Event Handling
     */
    didUpdateSlotValue () {
        this.parseValue();
    }

    /**
     * @description Called when the href slot is updated.
     * @category Event Handling
     */
    didUpdateSlotHref () {
        this.setIsUpdatingHref(true);
        this.setValue(this.href());
        this.parseValue();
        this.setIsUpdatingHref(false);
    }

    /**
     * @description Schedules the unparse operation.
     * @category URL Manipulation
     */
    scheduleUnparse () {
        if (this.hasDoneInit()) {
            this.unparseValue();
        }
    }

    /**
     * @description Called when the protocol slot is updated.
     * @category Event Handling
     */
    didUpdateSlotProtocol () {
        this.scheduleUnparse();
    }

    /**
     * @description Called when the username slot is updated.
     * @category Event Handling
     */
    didUpdateSlotUsername () {
        this.scheduleUnparse();
    }

    /**
     * @description Called when the password slot is updated.
     * @category Event Handling
     */
    didUpdateSlotPassword () {
        this.scheduleUnparse();
    }

    /**
     * @description Called when the hostname slot is updated.
     * @category Event Handling
     */
    didUpdateSlotHostName () {
        this.scheduleUnparse();
    }

    /**
     * @description Called when the port slot is updated.
     * @category Event Handling
     */
    didUpdateSlotPort () {
        this.scheduleUnparse();
    }

    /**
     * @description Called when the pathname slot is updated.
     * @category Event Handling
     */
    didUpdateSlotPathname () {
        this.scheduleUnparse();
    }

    /**
     * @description Called when the search slot is updated.
     * @category Event Handling
     */
    didUpdateSlotSearch () {
        this.scheduleUnparse();
    }

    /**
     * @description Called when the hash slot is updated.
     * @category Event Handling
     */
    didUpdateSlotHash () {
        this.scheduleUnparse();
    }

    /**
     * @description Parses the current value and updates the individual URL components.
     * @returns {SvUrlField} This instance.
     * @category URL Manipulation
     */
    parseValue () {
        const url = this.urlFromValue();
        if (!url) {
            return this;
        }

        this.directSetProtocol(url.protocol);
        this.directSetUsername(url.username);
        this.directSetPassword(url.password);
        this.directSetHostname(url.hostname);
        this.directSetPort(url.port);
        this.directSetPathname(url.pathname);
        this.directSetSearch(url.search);
        this.directSetHash(url.hash);
        this.directSetHref(url.href);

        return this;
    }

    /**
     * @description Creates a URL object from the current component values.
     * @returns {URL} The constructed URL object.
     * @category URL Manipulation
     */
    urlFromComponents () {
        const url = new URL("http://test.com");
        url.protocol = this.protocol();
        url.username = this.username();
        url.password = this.password();
        url.hostname = this.hostname();
        url.port = this.port();
        url.pathname = this.pathname();
        url.search = this.search();
        url.hash = this.hash();
        return url;
    }

    /**
     * @description Updates the href value based on the current component values.
     * @returns {SvUrlField} This instance.
     * @category URL Manipulation
     */
    unparseValue () {
        const url = this.urlFromComponents();
        this.directSetHref(url.href);
        return this;
    }

    /**
     * @description Returns the URL link for the node.
     * @returns {string} The URL link.
     * @category URL Manipulation
     */
    nodeUrlLink () {
        return this.value();
    }

    /**
     * @description Validates the current URL value.
     * @returns {boolean} True if the URL is valid, false otherwise.
     * @category Validation
     */
    validate () {
        const isValid = this.valueIsValidUrl();

        if (!isValid) {
            this.setValueError("Invalid URL");
        } else {
            this.setValueError(null);
        }

        return isValid;
    }

    /**
     * @description Checks if the current value is a valid URL.
     * @returns {boolean} True if the URL is valid, false otherwise.
     * @category Validation
     */
    valueIsValidUrl () {
        if (Type.isNullOrUndefined(this.value())) {
            this.setValue("");
        }

        const url = this.value();
        try {
            const urlObject = new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

}.initThisClass());
