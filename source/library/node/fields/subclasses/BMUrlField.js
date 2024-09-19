"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMUrlField
 * @extends BMField
 * @classdesc BMUrlField is a specialized field for handling URL data.
 */
(class BMUrlField extends BMField {
    
    /**
     * @static
     * @returns {boolean} True if the field is available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @static
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the field can open the given MIME type.
     */
    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("text/uri-list")
    }

    /**
     * @static
     * @param {Object} dataChunk - The data chunk to open.
     * @returns {BMUrlField} A new BMUrlField instance with the opened data.
     */
    static openMimeChunk (dataChunk) {
        const newNode = this.clone()
        const uris = dataChunk.decodedData().split("\n")
        const uri = uris.first()

        try {
            const url = new URL(uri)
            newNode.setKey(url.hostname)
            const path = url.pathname
            const p = path.fileName()
            if (p) {
                newNode.setKey(p)
            }
        } catch (error) {
            newNode.setKey("?")
        }

        newNode.setValue(uri)
        newNode.setValueIsVisible(false)

        return newNode
    }

    /**
     * @description Initializes the prototype slots for the BMUrlField.
     */
    initPrototypeSlots () {
        // scheme : // userinfo @host : port / path ? query # fragment
        /**
         * @property {string} href - The full URL.
         */
        this.newStringSlotNamed("href", "");
        /**
         * @property {string} protocol - The URL protocol.
         */
        this.newStringSlotNamed("protocol", "http");
        /**
         * @property {string} username - The URL username.
         */
        this.newStringSlotNamed("username", "");
        /**
         * @property {string} password - The URL password.
         */
        this.newStringSlotNamed("password", "");
        /**
         * @property {string} hostname - The URL hostname.
         */
        this.newStringSlotNamed("hostname", "hostname");
        /**
         * @property {string} port - The URL port.
         */
        this.newStringSlotNamed("port", "");
        /**
         * @property {string} pathname - The URL pathname.
         */
        this.newStringSlotNamed("pathname", "");
        /**
         * @property {string} search - The URL search query.
         */
        this.newStringSlotNamed("search", "");
        /**
         * @property {string} hash - The URL hash.
         */
        this.newStringSlotNamed("hash", "");

        {
            /**
             * @property {boolean} isUpdatingHref - Flag to indicate if href is being updated.
             */
            const slot = this.newSlot("isUpdatingHref", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype.
     */
    initPrototype () {
    }

    /**
     * @description Creates a new string slot with the given name and default value.
     * @param {string} slotName - The name of the slot.
     * @param {string} defaultValue - The default value for the slot.
     * @returns {Object} The created slot.
     */
    newStringSlotNamed (slotName, defaultValue) {
        const slot = this.newSlot(slotName, defaultValue)
        slot.setOwnsSetter(true)
        slot.setDoesHookSetter(true)
        slot.setDuplicateOp("copyValue")
        slot.setCanInspect(true)
        slot.setSlotType("String")
        slot.setLabel(slotName.capitalized())
        slot.setInspectorPath("URL")

        if (slotName !== "href") {
            //slot.setCanEditInspection(false)
        }
        return slot
    }

    /**
     * @description Initializes the BMUrlField.
     */
    init () {
        super.init()

        this.setKey("Link")
        this.setKeyIsVisible(true)
        this.setKeyIsEditable(true)

        this.setValueIsEditable(true)
        this.setValueIsVisible(true)

        this.setCanDelete(true)

        this.setNodeCanInspect(true)
    }

    /**
     * @description Returns the node inspector.
     * @returns {Object} The node inspector.
     */
    nodeInspector () {
        return super.nodeInspector()
    }

    /**
     * @description Creates a URL object from the current value.
     * @returns {URL|null} The URL object or null if invalid.
     */
    urlFromValue () {
        const s = this.value()
        if (s.trim() === "") {
            return null
        }
        
        try {
            const url = new URL(s)
            return url
        } catch (e) {
            //this.setError(e.message)
        }
        return null
    }

    /**
     * @description Called when a slot value is updated.
     */
    didUpdateSlotValue () {
        this.parseValue()
    }

    /**
     * @description Called when the href slot is updated.
     */
    didUpdateSlotHref () {
        this.setIsUpdatingHref(true)
        this.setValue(this.href())
        this.parseValue()
        this.setIsUpdatingHref(false)
    }

    /**
     * @description Schedules the unparse operation.
     */
    scheduleUnparse () {
        if (this.hasDoneInit()) {
            this.unparseValue()
        }
    }
    
    /**
     * @description Called when the protocol slot is updated.
     */
    didUpdateSlotProtocol () {
        this.scheduleUnparse()
    }

    /**
     * @description Called when the username slot is updated.
     */
    didUpdateSlotUsername () {
        this.scheduleUnparse()
    }

    /**
     * @description Called when the password slot is updated.
     */
    didUpdateSlotPassword () {
        this.scheduleUnparse()
    }

    /**
     * @description Called when the hostname slot is updated.
     */
    didUpdateSlotHostName () {
        this.scheduleUnparse()
    }

    /**
     * @description Called when the port slot is updated.
     */
    didUpdateSlotPort () {
        this.scheduleUnparse()
    }

    /**
     * @description Called when the pathname slot is updated.
     */
    didUpdateSlotPathname () {
        this.scheduleUnparse()
    }

    /**
     * @description Called when the search slot is updated.
     */
    didUpdateSlotSearch () {
        this.scheduleUnparse()
    }

    /**
     * @description Called when the hash slot is updated.
     */
    didUpdateSlotHash () {
        this.scheduleUnparse()
    }
    
    /**
     * @description Parses the current value and updates the individual URL components.
     * @returns {BMUrlField} This instance.
     */
    parseValue () {
        const url = this.urlFromValue()
        if (!url) {
            return this
        }
        
        this.directSetProtocol(url.protocol)
        this.directSetUsername(url.username)
        this.directSetPassword(url.password)
        this.directSetHostname(url.hostname)
        this.directSetPort(url.port)
        this.directSetPathname(url.pathname)
        this.directSetSearch(url.search)
        this.directSetHash(url.hash)
        this.directSetHref(url.href)
        
        return this
    }

    /**
     * @description Creates a URL object from the current component values.
     * @returns {URL} The constructed URL object.
     */
    urlFromComponents () {
        const url = new URL("http://test.com")
        url.protocol = this.protocol()
        url.username = this.username()
        url.password = this.password()
        url.hostname = this.hostname()
        url.port = this.port()
        url.pathname = this.pathname()
        url.search = this.search()
        url.hash = this.hash()
        return url 
    }

    /**
     * @description Updates the href value based on the current component values.
     * @returns {BMUrlField} This instance.
     */
    unparseValue () {
        const url = this.urlFromComponents()
        this.directSetHref(url.href)
        return this
    }

    /**
     * @description Returns the URL link for the node.
     * @returns {string} The URL link.
     */
    nodeUrlLink () {
        return this.value()
    }

    /**
     * @description Validates the current URL value.
     * @returns {boolean} True if the URL is valid, false otherwise.
     */
    validate () {
        const isValid = this.valueIsValidUrl()
		
        if (!isValid) {
            this.setValueError("Invalid URL")
        } else {
            this.setValueError(null)
        } 
		
        return isValid
    }

    /**
     * @description Checks if the current value is a valid URL.
     * @returns {boolean} True if the URL is valid, false otherwise.
     */
    valueIsValidUrl () {
        if (Type.isNullOrUndefined(this.value())) {
            this.setValue("")
        }
        
        const url = this.value()
        try {
            const urlObject = new URL(url)
            return true
        } catch (error) {
            return false
        }
    }
    
}.initThisClass());