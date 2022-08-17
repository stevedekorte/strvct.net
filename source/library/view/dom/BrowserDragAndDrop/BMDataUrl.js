"use strict";

/*
    BMDataUrl

    exmaples of setting up a dataTransfer for a drag out of browser event:

        event.dataTransfer.setData("DownloadURL", "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
        event.dataTransfer.setData("DownloadURL", "text/plain:hello.txt:data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D");
*/

(class BMDataUrl extends ProtoClass {
    
    initPrototypeSlots () {
        this.newSlot("dataUrl", null) // for drop
        this.newSlot("transferMimeType", "DownloadURL") // for drag
        this.newSlot("fileName", "file.txt") // for drag
        this.newSlot("mimeType", null)
        this.newSlot("decodedData", "") // non-base64 version
    }

    mimeTypeDescription () {
        const mimeType = this.mimeType()
        if (mimeType) {
            const name = this.mimeTypeToFileSuffixDict()[mimeType]
            if (name) {
                return name
            }
            return mimeType
        }
        return null
    }

    isXml () {
        return this.mimeType() === "application/xml"
    }

    isJson () {
        return this.mimeType() === "application/json"
    }

    isText () {
        return this.mimeType() === "text/plain"
    }

    isHtml () {
        return this.mimeType() === "text/html"
    }

    mimeTypeToFileSuffixDict () {
        return {
            "application/json" : "json",
            "application/xml" : "xml",
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

   dataUrlString () {
        // e.g.: "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
        const header = this.mimeType() + ":" + this.fileName() + ":data:" + this.mimeType() + ";base64,"  
        const content = btoa(this.decodedData())
        const s = header + content
        return s
    }

    setDataUrlString (dataUrl) {
        const type = dataUrl.before(":")
        assert(type === "data")
        const afterData = dataUrl.after("data:")
        const mimeType = afterData.before(";")
        const encodedData = afterData.after("base64,")
        const decodedData = encodedData.base64Decoded()
        
        this.setDataUrl(dataUrl)
        this.setMimeType(mimeType)
        this.setDecodedData(decodedData)
        return this
    }

    /*
    attachToEvent (event) {
        event.dataTransfer.setData(this.transferMimeType(), this.dataUrlString())
    }
    */

}.initThisClass());
