/**
 * @module library.resources.files
 */

"use strict";

/**
 * @class SvFileResources
 * @extends SvResourceGroup
 * @classdesc
 * SvFileResources is a class for managing file resources.
 * 
 * Usage examples:
 * 
 * SvFileResources.shared().setupSubnodesIfNeeded();
 * 
 * const fileOrFolderResource = SvFileResources.shared().rootFolder().resourceAtPath("path/to/resource");
 * 
 * const resources = MResourceFiles.shared().rootFolder().allResourceFiles().resourcesWithName(aName);
 * 
 * SvFileResources.shared().rootFolder().allResourceFiles().forEach(file => {
 *     ...
 * });
 */
(class SvFileResources extends SvResourceGroup {
    
    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots () {
        /**
         * @member {String} rootPath - The root path for file resources.
         * @category File System
         */
        {
            const slot = this.newSlot("rootPath", ".");
            slot.setSlotType("String");
        }

        /**
         * @member {Boolean} hasSetupSubnodes - Indicates whether subnodes have been set up.
         * @category Initialization
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

    finalInit () {
        super.finalInit();
        this.setTitle("Files");
        return this;
    }

    /**
     * @description Initializes the instance.
     * @returns {SvFileResources} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Handles the app initialization.
     * @category Initialization
     */
    async appDidInit () {
        await this.setupSubnodesIfNeeded();
    }

    /**
     * @description Shows the paths of all resource files.
     * @category Debugging
     */
    showPaths () {
        const paths = this.rootFolder().allResourceFiles().map(file => file.path());
        console.log(this.logPrefix(), "paths = ", paths.join("\n"));
    }
    
    /**
     * @description Sets up subnodes if they haven't been set up yet.
     * @returns {Promise<SvFileResources>} A promise that resolves to the instance.
     * @category Initialization
     */
    async setupSubnodesIfNeeded () {
        if (!this.hasSetupSubnodes()) {
            const rootFolder = SvResourceFolder.clone().setPath(this.rootPath());
            this.addSubnode(rootFolder);

            const entries = SvResourceManager.shared().entries();
            entries.forEach(entry => {
                const aPath = entry.path;
                const pathArray = aPath.split("/");
                while (pathArray.first() === ".") {
                    pathArray.shift();
                }
                const file = rootFolder.addRelativeResourcePathArray(pathArray);
                file.setResourceHash(entry.hash);
                file.setResourceSize(entry.size);
                if (!file) {
                    throw new Error("no file added");
                }
            });
            this.setHasSetupSubnodes(true);
        }
        return this;
    }

    /**
     * @description Gets the root folder.
     * @returns {SvResourceFolder} The root folder.
     * @category File System
     */
    rootFolder () {
        this.setupSubnodesIfNeeded();
        return this.subnodes().first();
    }

    /**
     * @description Gets all JSON files.
     * @returns {Array} An array of JSON files.
     * @category File System
     */
    jsonFiles () {
        const jsonFiles = this.rootFolder().allResourceFiles().select(file => file.pathExtension() === "json");
        return jsonFiles;
    }

    /**
     * @description Precaches resources where appropriate.
     * @returns {Promise<void>} A promise that resolves when precaching is complete.
     * @category Caching
     */
    async prechacheWhereAppropriate () {
        this.setupSubnodesIfNeeded();
        
        await this.rootFolder().allResourceFiles().promiseParallelMap(async (file) => {
            //console.log(this.logPrefix(), "file: " + file.svType() + ".prechacheWhereAppropriate()");
            await file.prechacheWhereAppropriate();
        });
        return this;
    }

    /**
     * @description Gets a resource by name.
     * @param {string} name - The name of the resource.
     * @returns {Object|undefined} The resource if found, undefined otherwise.
     * @category Resource Management
     */
    resourceWithName (name) {
        const resource = this.resourcesWithName(name).first();
        return resource;
    }

    /**
     * @description Gets resources with a given name.
     * @param {string} name - The name of the resources.
     * @returns {Array} Array of resources.
     * @category Resource Management
     */
    resourcesWithName (name) {
        return this.recursiveFilter(r => r.name() == name);
    }

}.initThisClass());