"use strict"

/*

    BMUrlField
    
*/

window.BMUrlField = class BMUrlField extends BMField {
    
    static canOpenMimeType (mimeType) {
        return mimeType.beginsWith("text/uri-list")
    }

    static fromDataChunk (dataChunk) {
        const newNode = this.clone()
        const uris = dataChunk.decodedData().split("\n")
        const uri = uris.first()
        
        newNode.setKey("Link")
        newNode.setValue(uri)
        newNode.setKeyIsEditable(true)
        newNode.setKeyIsEditable(true)
        newNode.setValueIsEditable(true)
        newNode.setCanDelete(true)
        return newNode
    }

    initPrototype () {

    }

    init () {
        super.init()
        this.setKeyIsVisible(false)
    }

    nodeUrlLink () {
        return this.value()
    }
    
}.initThisClass()
