"use strict"

/*

    BMTextAreaField
    
*/

window.BMTextAreaField = class BMTextAreaField extends BMField {
    
    static canOpenMimeType (mimeType) {
        return mimeType.beginsWith("text/")
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
        this.newSlot("isMono", false)
    }

    init () {
        super.init()
        this.setKeyIsVisible(false)
    }
    
}.initThisClass()
