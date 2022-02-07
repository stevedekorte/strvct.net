"use strict";

/*

    BMImageWellField

*/
        
(class BMImageWellField extends BMField {

    static availableAsNodePrimitive() {
        return true
    }
    
    static supportedMimeTypes () {
        return new Set(["image/jpeg", "image/gif", "image/png"])
    }

    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType)
    }

    static openMimeChunk (dataChunk) {
        const newNode = this.clone()
        newNode.setValue(dataChunk.dataUrl())
        //newNode.setValue(dataChunk.decodedData())
        newNode.setKeyIsEditable(true)
        newNode.setValueIsEditable(true)
        newNode.setCanDelete(true)
        return newNode
    }

    initPrototype () {
        this.newSlot("onlyShowsKeyWhenEmpty", false)
        this.newSlot("isEditable", true)
        
        this.overrideSlot("nodeMinRowHeight").setShouldStoreSlot(true)

        this.setKey("Image title")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
        this.setNodeCanEditRowHeight(true)
    }

    init () {
        super.init()
    }

    summaryValue () {
        return ""
    }
   
}.initThisClass());
