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
        this.registerForAppDidInit()
        //this.onFinishInit()
        return this
    }

    appDidInit () {
        //this.debugLog(".appDidInit()")
        this.setupSubnodes()
        return this
    }
    
    setupSubnodes () {
        const rootFolder = BMResourceFolder.clone().setPath(this.rootPath())
        this.addSubnode(rootFolder)
        const allPaths = ResourceManager.shared().resourceFilePaths()
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
