"use strict";

/*

    BMFileResources

*/

(class BMResourceFile extends BaseNode {

    initPrototypeSlots () {
        this.newSlot("path", ".")
        
        this.newSlot("data", null)
        this.newSlot("encoding", "utf8")
        this.newSlot("request", null) // this set back to null after request is successfully completed
        this.newSlot("error", null) 
        this.newSlot("isLoading", null) // true while async reading from URL request or indexedDB

        // notifications
        this.newSlot("isLoaded", false)
        this.newSlot("loadNote", null) 
        this.newSlot("loadErrorNote", null) 

        this.newSlot("resourceHash", null) 
        this.newSlot("resourceSize", null) 
    }

    init () {
        super.init()
        this.setTitle("File")
        this.setNoteIsSubnodeCount(true)

        // notifications
        this.setLoadNote(this.newNoteNamed("resourceFileLoaded"))
        this.setLoadErrorNote(this.newNoteNamed("resourceFileLoadError"))
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

    /*
    asObject () {
        const sound = BMSoundResources.shared().resources().detect(r => r.path() == this.path())
        return sound
    }
    */

    // move this loading code to parent BMResource?

    hasData () {
        return this.data() !== null
    }

    loadIfNeeded () { 
        /* sender should subscribe to loadNote and loadErrorNote */

        if (!this.isLoading() && !this.hasData()) {
            this.setIsLoading(true)
            this.load() 
        }
        return this
    }

    load () {
        const path = this.path().sansPrefix("./")
        const camValue = ResourceManager.shared().camValueForPath(path)
        if (camValue) {
            console.log("loaded via cam for path: ", path)
            this.setData(camValue)
            this.postLoad()
        } else {
            this.loadFromUrl()
        }
        return this
    }

    loadRequestType () {
        return "arraybuffer"
        //return 'application/json'; // need to change for binary files?
    }

    loadFromUrl () {
        debugger;
        console.log("loaded via url fetch for path: ", this.path())

        const path = this.path()
        const request = new XMLHttpRequest();
        request.open('GET', path, true);
        if (this.loadRequestType()) {
            request.responseType = this.loadRequestType();
        }

        request.onload  = (event) => { this.onUrlLoad(event) }
        request.onerror = (event) => { this.onUrlLoadError(event) }
        request.send();
        this.setRequest(request)
        return this
    }

    onUrlLoad () {
        const data = this.request().response
        this.setData(data)
        this.postLoad()
        this.setIsLoading(false)
        return this
    }

    onUrlLoadError (event) {
        this.setError(event.error)
        this.postLoadError()
        this.setIsLoading(false)
        return this
    }

    postLoad () {
        this.loadNote().post()
        return this
    }

    postLoadError () {
        this.loadErrorNote().post()
        return this
    }

}.initThisClass());
