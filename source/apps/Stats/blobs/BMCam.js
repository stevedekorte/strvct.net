"use strict"

/*

    BMCam

    A record in a BMCams

    readyState:

    uninitialized - Has not started loading yet
    loading - Is loading
    loaded - Has been loaded
    interactive - Has loaded enough and the user can interact with it
    complete - Fully loaded

*/

window.BMCam = class BMCam extends BMNode {
    
    initPrototype () {
        this.newSlot("hash", null).setShouldStoreSlot(true)
        this.newSlot("size", 0).setShouldStoreSlot(true)
        this.newSlot("value", null).setShouldStoreSlot(false).setDoesHookGetter(true)
        this.newSlot("readyState", 0).setShouldStoreSlot(false)
    }

    init () {
        super.init()
        this.setTitle("Cam")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(false)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        return this
    }

    prepareForFirstAccess() {
        super.prepareForFirstAccess()
        this.setupValueField()
    }

    setupValueField() {
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value")
        field.setValueIsEditable(false)
        field.setIsMono(true)
        field.setTarget(this)
        field.getValueFromTarget()
        this.addSubnode(field)
    }

    title () {
        return this.hash()
    }

    subtitle () {
        if (this.size()) {
            return this.size().byteSizeDescription() 
        }
        return null
    }

    cams () {
        return this.parentNode()
    }

    async asyncComputeHash () {
        const digest = await this.value().asyncSha256Digest()
        const hash = digest.base64Encoded()
        this.setHash(hash)
        this.didComputeHash()
    }

    didComputeHash () {
        console.log("didComputeHash: ", this.hash())
    }

    asyncReadValue (successCallback) {
        assert(this.hash())
        if (!this.value()) {
            this.cams().store().asyncAt(this.hash(), (value) => {
                this.setValue(value)
                successCallback()         
            })
        }
    }

    didUpdateSlotValue (oldValue, newValue) {
        console.log("didUpdateSlotValue")
        this.setSize(newValue.length)
        this.asyncWriteValue()
    }

    async asyncWriteValue () {
        assert(this.value())
        if (!this.hash()) {
            await this.asyncComputeHash()
        }
        this.setSize(this.value().length)
        return new Promise((resolve, reject) => {
            this.cams().store().asyncAtPut(this.hash(), this.value(), resolve, reject)
        })
    }

    async exists () {
        this.cams().store().asyncHasKey(this.hash(), this.value(), resolve, reject)

    }


}.initThisClass()



