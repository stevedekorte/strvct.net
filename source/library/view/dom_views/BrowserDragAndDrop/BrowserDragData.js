"use strict"

/*
    BrowserDragData

    exmaples of setting up a dataTransfer for a drag out of browser event:

        event.dataTransfer.setData("DownloadURL", "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
        event.dataTransfer.setData("DownloadURL", "text/plain:hello.txt:data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D");
*/

window.BrowserDragData = class BrowserDragData extends ProtoClass {
    
    initPrototype () {
        this.newSlot("dataUrl", null) // for drop
        this.newSlot("transferMimeType", "DownloadURL") // for drag
        this.newSlot("fileName", "file.txt") // for drag
        this.newSlot("mimeType", "text/plain")
        this.newSlot("decodedData", "") // non-base64 version
    }

    mimeTypeToFileSuffixDict () {
        return {
            "application/json" : "json",
            "text/javascript" : "js",
            "text/plain" : "txt", 
            "text/html" : "html", 
            //"text/uri-list" 
        }
    }

    /*
    validMimeTypeSet () {
        return new Set([
            "application/json",
            "text/javascript",
            "text/plain", 
            "text/html", 
            "text/uri-list" 
        ])
    }
    */

    transferData () {
        // e.g.: "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
        const header = this.mimeType() + ":" + this.fileName() + ":data:" + this.mimeType() + ";base64,"  
        const content = btoa(this.decodedData())
        const td = header + content
        return td
    }

    setTransferData (mimeTypeHint, dataUrl) {
        
        const type = dataUrl.before(":")
        assert(type === "data")
        const afterData = dataUrl.after("data:")
        const mimeType = afterData.before(";")
        const afterComma = afterData.after(";")
        const encodedData = afterData.after("base64,")
        
        this.setDataUrl(dataUrl)
        this.setMimeType(mimeType)
        /*
        const header = "data:" + mimeType + ";base64,"
        assert(dataUrl.indexOf(header) === 0)
        const encodedData = dataUrl.after(header)
        */
        const decodedData = encodedData.base64Decoded()
        this.setDecodedData(decodedData)
        return this
    }

    attachToEvent (event) {
        event.dataTransfer.setData(this.transferMimeType(), this.transferData())
    }

}.initThisClass()
