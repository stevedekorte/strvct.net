/**
 * @module library.resources
 */

/**
 * @class BMResourceGroup
 * @extends BaseNode
 * @classdesc Represents a group of resources.
 */
(class BMResourceGroup extends BaseNode {
    
    /**
     * @static
     * @description Initializes the class.
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes prototype slots.
     */
    initPrototypeSlots () {
        /**
         * @property {Array} resourceClasses - Array of resource classes.
         */
        {
            const slot = this.newSlot("resourceClasses", []);
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Initializes the prototype.
     */
    initPrototype () {
        this.setNoteIsSubnodeCount(true);
    }

    /**
     * @description Initializes the instance.
     */
    init () {
        super.init();
        this.setTitle(this.type());
        this.setResourceClasses([]);
        this.setup();
        this.registerForAppDidInit();
    }

    /**
     * @description Sets up the instance. Subclasses should override this to set ResourceClasses.
     */
    setup () {
        // subclasses should override this to set ResourceClasses
    }

    /**
     * @description Handles app initialization.
     * @returns {Promise<void>}
     */
    async appDidInit () {
        await this.setupSubnodes();
    }

    /**
     * @description Gets the supported extensions.
     * @returns {Array} Array of supported extensions.
     */
    extensions () {
        const exts = this.resourceClasses().map(rClass => rClass.supportedExtensions()).flat().unique();
        return exts;
    }

    /**
     * @description Gets the resource paths.
     * @returns {Array} Array of resource paths.
     */
    resourcePaths () {
        return ResourceManager.shared().resourceFilePathsWithExtensions(this.extensions());
    }

    /**
     * @description Gets the URL resources.
     * @returns {Array} Array of URL resources.
     */
    urlResources () {
        return ResourceManager.shared().urlResourcesWithExtensions(this.extensions());
    }

    /**
     * @description Sets up the subnodes.
     * @returns {Promise<BMResourceGroup>}
     */
    async setupSubnodes () {
        await this.urlResources().promiseParallelMap(async (r) => {
            const rClass = this.resourceClassForFileExtension(r.pathExtension());
            const aResource = rClass.clone().setPath(r.path());
            aResource.setUrlResource(r);
            aResource.asyncLoad(); // do this in parallel
            this.addResource(aResource);
        })

        return this
    }

    /**
     * @description Gets resource classes for a file extension.
     * @param {string} ext - The file extension.
     * @returns {Array} Array of resource classes.
     */
    resourceClassesForFileExtension (ext) {
        const extension = ext.toLowerCase();
        return this.resourceClasses().select(rClass => rClass.canHandleExtension(ext));
    }

    /**
     * @description Gets the resource class for a file extension.
     * @param {string} ext - The file extension.
     * @returns {Object|null} The resource class or null if not found.
     */
    resourceClassForFileExtension (ext) {
        return this.resourceClassesForFileExtension(ext).first();
    }

    /**
     * @description Gets a resource for a given path.
     * @param {string} aPath - The path.
     * @returns {Object|null} The resource or null if not found.
     */
    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension());
        if (!rClass) {
            debugger;
            this.resourceClassForFileExtension(aPath.pathExtension());
            return null;
        };
        const aResource = rClass.clone().setPath(aPath);
        return aResource;
    }

    /**
     * @description Adds a resource.
     * @param {Object} aResource - The resource to add.
     * @returns {BMResourceGroup}
     */
    addResource (aResource) {
        this.addSubnode(aResource);
        return this;
    }

    /**
     * @description Gets all resources.
     * @returns {Array} Array of resources.
     */
    resources () {
        return this.subnodes();
    }

    /**
     * @description Gets a resource by name.
     * @param {string} name - The name of the resource.
     * @returns {Object|undefined} The resource if found, undefined otherwise.
     */
    resourceNamed (name) {
        return this.resources().detect(r => r.name() == name);
    }

    /**
     * @description Precaches resources where appropriate.
     * @returns {Promise<void>}
     */
    async prechacheWhereAppropriate () {
        await this.resources().promiseParallelMap(this.resources(), async (r) => r.prechacheWhereAppropriate());
    }

}.initThisClass());