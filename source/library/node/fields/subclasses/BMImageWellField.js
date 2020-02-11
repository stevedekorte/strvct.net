"use strict"

/*

    BMImageWellField

*/
        
window.BMImageWellField = class BMImageWellField extends BMField {

    static supportedMimeTypes () {
        return new Set(["image/jpeg", "image/gif", "image/png"])
    }

    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType)
    }

    static fromMimeTypeAndData (mimeType, data) {
        const newNode = this.clone()
        newNode.setValue(data)
        newNode.setKeyIsEditable(true)
        newNode.setValueIsEditable(true)
        newNode.setCanDelete(true)
        return newNode
    }

    initPrototype () {
        this.newSlot("onlyShowsKeyWhenEmpty", false)
        this.newSlot("isEditable", true)
        
        this.protoAddStoredSlot("nodeMinRowHeight")

        this.setKey("Image title")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
        //this.protoAddStoredSlot("imageDataUrl") // stored in value
        this.setNodeCanEditRowHeight(true)
    }

    init () {
        super.init()
    }

    /*
    setValue (v) {
        super.setValue(v)
        //this.debugLog(" setValue " + v)
        //this.updateKey()
        return this
    }
    */
   
}.initThisClass()
