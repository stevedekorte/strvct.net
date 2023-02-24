"use strict";

/*

    BMFileResources

*/

(class BMFileResources extends BMResourceGroup {
    
    initPrototypeSlots () {
        this.newSlot("rootPath", ".")
    }

    init () {
        super.init()
        this.setTitle("FileResources")
        this.setNoteIsSubnodeCount(true)
        //this.registerForAppDidInit() // BMResourceGroup does this
        //this.onFinishInit()
        return this
    }

    appDidInit () {
        //this.debugLog(".appDidInit()")
        this.setupSubnodes()
        return this
    }
    
    setupSubnodes () {
        assert(this.subnodes().length === 0)
        //debugger;
        const rootFolder = BMResourceFolder.clone().setPath(this.rootPath())
        this.addSubnode(rootFolder)

        const entries = ResourceManager.shared().entries()
        //const allPaths = ResourceManager.shared().resourceFilePaths()
        entries.forEach(entry => {
            const aPath = entry.path
            const pathArray = aPath.split("/")
            while (pathArray.first() === ".") {
                pathArray.shift()
            }
            const file = rootFolder.addRelativeResourcePathArray(pathArray)
            file.setResourceHash(entry.hash)
            file.setResourceSize(entry.size)
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
