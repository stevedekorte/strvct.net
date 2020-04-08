"use strict"

/*

    BMBlob

*/

window.BMBlob = class BMBlob extends BMNode {

    initPrototype() {
        // title is the key
        this.newSlot("valueHash", null).setSyncsToView(true).setShouldStoreSlot(true)
        this.newSlot("cam", null).setSyncsToView(true).setShouldStoreSlot(false)
    }

    init() {
        super.init()
        this.setNodeMinWidth(600)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        return this
    }


    prepareForFirstAccess() {
        super.prepareForFirstAccess()
        //this.setupValueField()
        /*
        if (this.camRecord()) {
            this.addSubnode(this.camRecord())
        }
        */
    }

    /*
    setupValueField() {
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value")
        field.setValueIsEditable(false)
        field.setIsMono(true)
        field.setTarget(this)
        field.getValueFromTarget()
        this.addSubnode(field)
    }
    */

    blobs() {
        return this.parentNode()
    }

    // key

    setKey(key) {
        this.setTitle(key)
        return this
    }

    key() {
        return this.title()
    }

    hash() {
        // for blobs subnode search
        return this.key()
    }

    updateHashValue() {
    }

    cam () {
        return BMCams.shared().camWithHash(this.hashValue())
    }

    value () {
        const cam = this.cam()
        if (cam) {
            const v = cam.value()
            if (v) {
                return v
            }
        }
        return null
    }

    subtitle () {
        if (this.value()) {
            return this.value().size().byteSizeDescription() 
        }
        return null
    }

    async asyncRead() {
        this.setValue(await this.cam().asyncRead())
        return this.value()
    }

    async asyncWrite() {
        assert(this.value())
        this.cam().setValue(this.value())
        await camRecord.asyncWrite()
    }

    async asyncExists() {
        //this.blobs().asyncDict().hasKey(this.key(), callback)
    }

}.initThisClass()


