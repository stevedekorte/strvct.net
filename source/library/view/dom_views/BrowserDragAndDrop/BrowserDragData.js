"use strict"

/*
    BrowserDragData

    exmaples of setting up a dataTransfer for a drag out of browser event:

        event.dataTransfer.setData("DownloadURL", "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
        event.dataTransfer.setData("DownloadURL", "text/plain:hello.txt:data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D");
*/

window.BrowserDragData = class BrowserDragData extends ProtoClass {
    
    initPrototype () {
        this.newSlot("transferMimeType", "DownloadURL")
        this.newSlot("fileName", "file.txt")
        this.newSlot("mimeType", "text/plain")
        this.newSlot("payload", "") // non-base64 version
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    validMimeTypeSet () {
        return new Set([
            "application/json",
            //"application/x-javascript",
            "text/javascript",
            //"text/x-javascript",
            //"text/x-json", 
            "text/plain", 
            "text/html", 
            "text/uri-list" 
        ])
    }

    transferData () {
        // e.g.: "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
        const header = this.mimeType() + ":" + this.fileName() + ":data:" + this.mimeType() + ";base64,"  
        const content = btoa(this.payload())
        const td = header + content
        return td
    }

    /*
    setupForJson (json) {
        //const bdd = BrowserDragData.clone()
        this.setMimeType("application/json")
        //bdd.setFileName(this.title() + ".json")
        this.setPayload(JSON.stringify(json, null, 4))
        return this
    }
    */

}.initThisClass()
