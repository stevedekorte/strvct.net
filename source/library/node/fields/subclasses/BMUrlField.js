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
        const url = this.value()
        const result = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return result !== null
    }
    
}.initThisClass()
