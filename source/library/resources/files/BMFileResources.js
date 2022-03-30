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

        this.setTitle("FileResources")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        this.watchOnceForNote("appDidInit")
        return this
    }

    appDidInit () {
        //this.debugLog(".appDidInit()")
        //this.setupSubnodes()
        this.setupSubnodes()
        return this
    }
    
    setupSubnodes () {
        const rootFolder = BMResourceFolder.clone().setPath(this.rootPath())
        this.addSubnode(rootFolder)
        const allPaths = ResourceLoader.shared().resourceFilePaths()
        allPaths.forEach(aPath => {
            const pathArray = aPath.split("/")
            while (pathArray.first() === ".") {
                pathArray.shift()
            }
            const file = rootFolder.addRelativeResourcePathArray(pathArray)
            if (!file) {
                throw new Error("no file added")
            }
        }) // will find path to last folder and insert resource
        return this
    }

    rootFolder () {
        return this.subnodes().first()
    }


}.initThisClass());
