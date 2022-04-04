"use strict";

/*

    BMFileResources

*/

(class BMResourceFile extends BMNode {

    initPrototype () {
        this.newSlot("path", ".")
        this.newSlot("data", null)
        this.newSlot("encoding", "utf8")
        this.newSlot("request", null) // this set back to null after request is successfully completed
        this.newSlot("error", null) 
        this.newSlot("isLoading", null) // true while async reading from URL request or indexedDB
    }

    init () {
        super.init()
        this.setTitle("File")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        return this
    }

    name () {
        return this.path().lastPathComponent()
    }

    title () {
        return this.name()
    }

    setupSubnodes () {
        //this.resourcePaths().forEach(path => this.addFontWithPath(path))
        return this
    }

    asObject () {
        const sound = BMSoundResources.shared().resources().detect(r => r.path() == this.path())
        return sound
    }

    hasData () {
        return this.data() !== null
    }

    loadIfNeeded () { 
        /* sender should subscribe to resourceFileLoaded before calling this
        */

        if (!this.isLoading() && !this.hasData()) {
            this.load() 
        }
        return this
    }

    load () {
        this.loadFromUrl()
        return this
    }

    loadFromUrl () {
        const path = this.path()
        const request = new XMLHttpRequest();
        request.open('GET', path, true);
        //request.responseType = 'application/json'; // need to change for binary files?
        request.onload  = (event) => { this.onUrlLoad(event) }
        request.onerror = (event) => { this.onUrlLoadError(event) }
        request.send();
        this.setRequest(request)
        return this
    }

    onUrlLoad () {
        const data = this.request().response
        this.setData(data)
        BMNotificationCenter.shared().newNote().setSender(this).setName("resourceFileLoaded").post()
        return this
    }

    onUrlLoadError (event) {
        this.setError(event.error)
        // post error note
        return this
    }

    postError () {
        BMNotificationCenter.shared().newNote().setSender(this).setName("resourceFileLoadError").post()
        return this
    }

}.initThisClass());
