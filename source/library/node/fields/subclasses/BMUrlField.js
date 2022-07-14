"use strict";

/*

    BMUrlField
    
*/

(class BMUrlField extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }

    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("text/uri-list")
    }

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

    initPrototype () {
        // scheme : // userinfo @host : port / path ? query # fragment
        this.newStringSlotNamed("href", "")
        
        this.newStringSlotNamed("protocol", "http")
        this.newStringSlotNamed("username", "")
        this.newStringSlotNamed("password", "")
        this.newStringSlotNamed("hostname", "hostname")
        this.newStringSlotNamed("port", "")
        this.newStringSlotNamed("pathname", "")
        this.newStringSlotNamed("search", "")
        this.newStringSlotNamed("hash", "")
        this.newSlot("isUpdatingHref", false)
    }

    newStringSlotNamed (slotName, defaultValue) {
        const slot = this.newSlot(slotName, defaultValue)
        //slot.setShouldStoreSlot(true)
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

    nodeInspector () {
        return super.nodeInspector()
    }

    urlFromValue () {
        const s = this.value()
        try {
            const url = new URL(s)
            return url
        } catch (e) {
            //this.setError(e.message)
        }
        return null
    }

    didUpdateSlotValue () {
        this.parseValue()
    }

    didUpdateSlotHref () {
        this.setIsUpdatingHref(true)
        this.setValue(this.href())
        this.parseValue()
        this.setIsUpdatingHref(false)
    }

    // slots

    scheduleUnparse () {
        if (this.hasDoneInit()) {
            //this.scheduleSelfFor("unparseValue")
            this.unparseValue()
        }
    }
    
    didUpdateSlotProtocol () {
        this.scheduleUnparse()
    }

    didUpdateSlotUsername () {
        this.scheduleUnparse()
    }

    didUpdateSlotPassword () {
        this.scheduleUnparse()
    }

    didUpdateSlotHostName () {
        this.scheduleUnparse()
    }

    didUpdateSlotPort () {
        this.scheduleUnparse()
    }

    didUpdateSlotPathname () {
        this.scheduleUnparse()
    }

    didUpdateSlotSearch () {
        this.scheduleUnparse()
    }

    didUpdateSlotHash () {
        this.scheduleUnparse()
    }
    
    // parse / unparse

    parseValue () {
        // set slots using the value
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

    unparseValue () {
        // set the value using the slots
        const url = this.urlFromComponents()
        this.directSetHref(url.href)
        //this.directSetValue(url.href)
        return this
    }

    nodeUrlLink () {
        return this.value()
    }

    validate () {
        const isValid = this.valueIsValidUrl()
		
        if (!isValid) {
            this.setValueError("Invalid URL")
        } else {
            this.setValueError(null)
        } 
		
        return isValid
    }

    valueIsValidUrl () {
        if (Type.isNullOrUndefined(this.value())) {
            this.setValue("")
        }
        
        const url = this.value()
        const result = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return result !== null
    }
    
}.initThisClass());
