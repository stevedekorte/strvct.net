"use strict";

/*

    BMFileResources

*/

(class BMFileResources extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("rootPath", ".")
    }

    init () {
        super.init()

        this.setTitle("FileSystem")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        this.watchOnceForNote("appDidInit")
        return this
    }

    appDidInit () {
        //this.debugLog(".appDidInit()")
        //this.setupSubnodes()
        this.setup()
        return this
    }
    
    setupSubnodes () {
        this.addSubnode(BMFileSystemFolder.clone())
        return this
    }

    setup () {
        window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

        window.requestFileSystem(
            window.PERSISTENT, 
            1*1000*1000, 
            (fileSystem) => this.onOpen(fileSystem), 
            (error) => this.onOpenError(error)
        )

        return this
    }

    onOpen (fileSystem) {
        console.log("opened filesystem")

    }

    onOpenError (error) {
        console.log(error)
    }


}.initThisClass())
