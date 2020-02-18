"use strict"

/*

    BMTextAreaField
    
*/

window.BMTextAreaField = class BMTextAreaField extends BMField {
    
    static canOpenMimeType (mimeType) {
        return mimeType.beginsWith("text/")
    }

    static fromDataChunk (dataChunk) {
        const newNode = this.clone()
        newNode.setValue(dataChunk.decodedData())
        newNode.setKeyIsEditable(true)
        newNode.setValueIsEditable(true)
        newNode.setCanDelete(true)
        return newNode
    }

    initPrototype () {
        this.newSlot("isMono", false)
    }

    init () {
        super.init()
        this.setKeyIsVisible(false)
    }
    
}.initThisClass()
