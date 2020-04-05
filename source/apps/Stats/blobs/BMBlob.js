"use strict"

/*

    BMBlob

*/

window.BMBlob = class BMBlob extends BMNode {
    
    initPrototype () {
        this.newSlot("value", null).setSyncsToView(true).setShouldStoreSlot(true)
        this.newSlot("size", 0).setShouldStoreSlot(true)
        this.newSlot("blobs", null)
    }

    init () {
        super.init()
        this.setNodeMinWidth(600)
        this.setShouldStore(true)
        return this
    }

    setKey (key) {
        this.setTitle(key)
        return this
    }

    key () {
        return this.title()
    }

    hash () {
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
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value")
        field.setValueIsEditable(false)
        field.setIsMono(true)
        field.setTarget(this) 
        field.getValueFromTarget()
        this.addSubnode(field)        
    }

    value () {

    }

    fetchIfAvailable (callback) {

    }

    exists () {
        //this.blobs().asyncDict().hasKey(this.key(), callback)
    }

}.initThisClass()

