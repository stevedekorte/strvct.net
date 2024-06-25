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

    async appDidInit () {
        await this.setupSubnodesIfNeeded();
        //this.cacheJsonFiles(); // this won't work in appDidInit as it's async and other appDidInit notifications may be sent before it's done
    }

    showPaths () {
        const paths = this.rootFolder().allResourceFiles().map(file => file.path());
        console.log("paths = ", paths.join("\n"));
    }

    /*
    prepareForFirstAccess () {
        debugger;
        this.setupSubnodesIfNeeded()
        return this
    }
    */
    
    async setupSubnodesIfNeeded () {
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

    jsonFiles () {
        const jsonFiles = this.rootFolder().allResourceFiles().select(file => file.pathExtension() === "json");
        return jsonFiles;
    }

    async prechacheWhereAppropriate () {
        //debugger;
        this.setupSubnodesIfNeeded();
        await this.rootFolder().allResourceFiles().promiseSerialForEach(async (file) => await file.prechacheWhereAppropriate());
        //this.subnodes().promiseSerialForEach(async (node) => node.prechacheWhereAppropriate());
        //debugger;
    }

}.initThisClass());
