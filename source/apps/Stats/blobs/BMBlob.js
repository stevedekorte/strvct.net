"use strict"

/*

    BMBlob

*/

window.BMBlob = class BMBlob extends BMNode {
    
    initPrototype () {
        // title is the key
        this.newSlot("hashValue", null).setSyncsToView(true).setShouldStoreSlot(true)
        this.newSlot("value", null).setSyncsToView(true).setShouldStoreSlot(false)
    }

    init () {
        super.init()
        this.setNodeMinWidth(600)
        this.setShouldStore(true)
        return this
    }

    setupValueField () {
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value")
        field.setValueIsEditable(false)
        field.setIsMono(true)
        field.setTarget(this) 
        field.getValueFromTarget()
        this.addSubnode(field)        
    }

    blobs () {
        return this.parentNode()
    }

    setKey (key) {
        this.setTitle(key)
        return this
    }

    key () {
        return this.title()
    }

    hash () {
        // for blobs subnode search
        return this.key()
    }

    subtitle () {
        return this.size()
    }

    didUpdateSlotValue (oldValue, newValue) {
        if (newValue) {
            this.setSize(newValue.length)
        } else {
            this.setSize(0)
        }
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setupValueField()     
    }

    value () {

    }

    fetchIfAvailable (callback) {

    }

    exists () {
        //this.blobs().asyncDict().hasKey(this.key(), callback)
    }

}.initThisClass()

