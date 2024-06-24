"use strict";

/*

    BMFileResources


    BMFileResources.shared().setupSubnodesIfNeeded();

    const fileOrFolderResource = BMFileResources.shared().rootFolder().resourceAtPath("path/to/resource");

    const resources = MResourceFiles.shared().rootFolder().allResourceFiles().resourcesWithName(aName);

    BMFileResources.shared().rootFolder().allResourceFiles().forEach(file => {
        ...
    });
*/

(class BMFileResources extends BMResourceGroup {
    
    initPrototypeSlots () {
        this.newSlot("rootPath", ".");
        this.newSlot("hasSetupSubnodes", false);
    }

    initPrototype () {
        this.setTitle("FileResources");
        this.setNoteIsSubnodeCount(true);
    }

    init () {
        super.init()
        //this.registerForAppDidInit() // BMResourceGroup does this
        //this.onFinishInit()
        return this
    }

    /*
    setup () {
        // subclasses need to use this to set ResourceClasses
        this.setResourceClasses([BMResourceFile]);
        this.setSubnodeClasses([BMResourceFile]);
    }
    */

    appDidInit () {
        //this.debugLog(".appDidInit()");
        //debugger;
        //this.setupSubnodes();
        //debugger;
        this.setupSubnodesIfNeeded();
        //debugger;
        /*
        const paths = this.rootFolder().allResourceFiles().map(file => file.path());
        console.log("paths = ", paths.join("\n"));
        debugger;
        */
        return this;
    }

    /*
    prepareForFirstAccess () {
        debugger;
        this.setupSubnodesIfNeeded()
        return this
    }
    */
    
    setupSubnodesIfNeeded () {
        if (!this.hasSetupSubnodes()) {
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
            this.setHasSetupSubnodes(true)
        }
        return this;
    }

    rootFolder () {
        this.setupSubnodesIfNeeded();
        //debugger
        return this.subnodes().first();
    }

}.initThisClass());
