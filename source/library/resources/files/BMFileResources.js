/**
 * @module library.resources.files
 */

"use strict";

/**
 * @class BMFileResources
 * @extends BMResourceGroup
 * @classdesc
 * BMFileResources is a class for managing file resources.
 * 
 * Usage examples:
 * 
 * BMFileResources.shared().setupSubnodesIfNeeded();
 * 
 * const fileOrFolderResource = BMFileResources.shared().rootFolder().resourceAtPath("path/to/resource");
 * 
 * const resources = MResourceFiles.shared().rootFolder().allResourceFiles().resourcesWithName(aName);
 * 
 * BMFileResources.shared().rootFolder().allResourceFiles().forEach(file => {
 *     ...
 * });
 */
(class BMFileResources extends BMResourceGroup {
    
    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots () {
        /**
         * @property {String} rootPath - The root path for file resources.
         */
        {
            const slot = this.newSlot("rootPath", ".");
            slot.setSlotType("String");
        }

        /**
         * @property {Boolean} hasSetupSubnodes - Indicates whether subnodes have been set up.
         */
        {
            const slot = this.newSlot("hasSetupSubnodes", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype of the class.
     */
    initPrototype () {
        this.setTitle("FileResources");
        this.setNoteIsSubnodeCount(true);
    }

    /**
     * @description Initializes the instance.
     * @returns {BMFileResources} The initialized instance.
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Handles the app initialization.
     */
    async appDidInit () {
        await this.setupSubnodesIfNeeded();
    }

    /**
     * @description Shows the paths of all resource files.
     */
    showPaths () {
        const paths = this.rootFolder().allResourceFiles().map(file => file.path());
        console.log("paths = ", paths.join("\n"));
    }
    
    /**
     * @description Sets up subnodes if they haven't been set up yet.
     * @returns {Promise<BMFileResources>} A promise that resolves to the instance.
     */
    async setupSubnodesIfNeeded () {
        if (!this.hasSetupSubnodes()) {
            const rootFolder = BMResourceFolder.clone().setPath(this.rootPath())
            this.addSubnode(rootFolder)

            const entries = ResourceManager.shared().entries()
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
            })
            this.setHasSetupSubnodes(true)
        }
        return this;
    }

    /**
     * @description Gets the root folder.
     * @returns {BMResourceFolder} The root folder.
     */
    rootFolder () {
        this.setupSubnodesIfNeeded();
        return this.subnodes().first();
    }

    /**
     * @description Gets all JSON files.
     * @returns {Array} An array of JSON files.
     */
    jsonFiles () {
        const jsonFiles = this.rootFolder().allResourceFiles().select(file => file.pathExtension() === "json");
        return jsonFiles;
    }

    /**
     * @description Precaches resources where appropriate.
     * @returns {Promise<void>} A promise that resolves when precaching is complete.
     */
    async prechacheWhereAppropriate () {
        this.setupSubnodesIfNeeded();
        await this.rootFolder().allResourceFiles().promiseParallelMap(async (file) => file.prechacheWhereAppropriate());
    }

}.initThisClass());