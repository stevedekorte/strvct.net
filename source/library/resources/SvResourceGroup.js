/**
 * @module library.resources.icons
 */

/**
 * @class SvResourceGroup
 * @extends BaseNode
 * @classdesc Represents a group of resources.
 */
(class SvResourceGroup extends BaseNode {
    
    /**
     * @static
     * @description Initializes the class.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Array} resourceClasses - Array of resource classes.
         * @category Resource Management
         */
        {
            const slot = this.newSlot("resourceClasses", []);
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setNoteIsSubnodeCount(true);
    }

    /**
     * @description Initializes the instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setTitle(this.svType());
        this.setResourceClasses([]);
        this.setup();
        //this.registerForAppDidInit();
    }

    /**
     * @description Sets up the instance. Subclasses should override this to set ResourceClasses.
     * @category Initialization
     */
    setup () {
        // subclasses should override this to set ResourceClasses
    }

    /**
     * @description Handles app initialization.
     * @returns {Promise<void>}
     * @category Initialization
     */
    /*
    async appDidInit () {
        await this.setupSubnodes();
    }
        */

    /**
     * @description Gets the supported extensions.
     * @returns {Array} Array of supported extensions.
     * @category Resource Management
     */
    extensions () {
        const exts = this.resourceClasses().map(rClass => rClass.supportedExtensions()).flat().unique();
        return exts;
    }

    /**
     * @description Gets the resource paths.
     * @returns {Array} Array of resource paths.
     * @category Resource Management
     */
    resourcePaths () {
        return SvResourceManager.shared().resourceFilePathsWithExtensions(this.extensions());
    }

    /**
     * @description Gets the URL resources.
     * @returns {Array} Array of URL resources.
     * @category Resource Management
     */
    urlResources () {
        return SvResourceManager.shared().urlResourcesWithExtensions(this.extensions());
    }

    /**
     * @description Sets up the subnodes.
     * @returns {Promise<SvResourceGroup>}
     * @category Resource Management
     */
    async setupSubnodes () {
        //this.log(".setupSubnodes begin with " + this.urlResources().length + " url resources");

        await this.urlResources().promiseParallelForEach(async (r) => {
            const rClass = this.resourceClassForFileExtension(r.pathExtension());
            const aResource = rClass.clone().setPath(r.path());
            aResource.setUrlResource(r);
            //this.log("loading resource: " + aResource.path());
            if (aResource.canDeferLoad()) {
                //aResource.asyncLoad(); // don't wait for this one
            } else {
                await aResource.asyncLoad(); // do this in parallel
                //this.log("asyncLoaded resource: " + aResource.path());
            }
            this.addResource(aResource);
        });
        
        //this.log(".setupSubnodes done");

        if (this.svType() !== "SvFileResources") {
            //assert(this.subnodes().length > 0, this.svType() + " subnodes should have subnodes");
            /*
            if (this.subnodes().length !== this.urlResources().length) {
                console.warn(this.svType() + " should have " + this.urlResources().length + " subnodes, but has " + this.subnodes().length);
                debugger;
            }
            */
        }

        return this;
    }

    /**
     * @description Gets resource classes for a file extension.
     * @param {string} ext - The file extension.
     * @returns {Array} Array of resource classes.
     * @category Resource Management
     */
    resourceClassesForFileExtension (ext) {
        const extension = ext.toLowerCase();
        return this.resourceClasses().select(rClass => rClass.canHandleExtension(extension));
    }

    /**
     * @description Gets the resource class for a file extension.
     * @param {string} ext - The file extension.
     * @returns {Object|null} The resource class or null if not found.
     * @category Resource Management
     */
    resourceClassForFileExtension (ext) {
        return this.resourceClassesForFileExtension(ext).first();
    }

    /**
     * @description Gets a resource for a given path.
     * @param {string} aPath - The path.
     * @returns {Object|null} The resource or null if not found.
     * @category Resource Management
     */
    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension());
        if (!rClass) {
            debugger;
            this.resourceClassForFileExtension(aPath.pathExtension());
            return null;
        }
        const aResource = rClass.clone().setPath(aPath);
        return aResource;
    }

    /**
     * @description Adds a resource.
     * @param {Object} aResource - The resource to add.
     * @returns {SvResourceGroup}
     * @category Resource Management
     */
    addResource (aResource) {
        this.addSubnode(aResource);
        return this;
    }

    /**
     * @description Gets all resources.
     * @returns {Array} Array of resources.
     * @category Resource Management
     */
    resources () {
        return this.subnodes();
    }

    /**
     * @description Gets a resource by name.
     * @param {string} name - The name of the resource.
     * @returns {Object|undefined} The resource if found, undefined otherwise.
     * @category Resource Management
     */
    resourceWithName (name) {
        return this.resources().detect(r => r.name() == name);
    }

    /*
    resourceNamed (name) {
        return this.resources().detect(r => r.name() == name);
    }
    */

    /**
     * @description Gets resources with a given name.
     * @param {string} name - The name of the resources.
     * @returns {Array} Array of resources.
     * @category Resource Management
     */
    resourcesWithName (name) {
        return this.resources().select(r => r.name() == name);
    }

    /**
     * @description Precaches resources where appropriate.
     * @returns {Promise<void>}
     * @category Resource Management
     */
    async prechacheWhereAppropriate () {
        //this.log("resource group: " + this.svType() + ".prechacheWhereAppropriate()");
        //debugger;
        await this.resources().promiseParallelMap(async (r) => {
            //this.log("resource: " + r.svType() + ".prechacheWhereAppropriate()");
            if (r.prechacheWhereAppropriate) {
                await r.prechacheWhereAppropriate();
            }
        });
        //this.log("resource group: " + this.svType() + ".prechacheWhereAppropriate() done");
        return this;
    }

}.initThisClass());