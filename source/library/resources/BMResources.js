/**
 * @module library.resources
 */

"use strict";

/**
 * @class BMResources
 * @extends BMStorableNode
 * @classdesc BMResources class for managing various resource types.
 * 
 * Usage example:
 * BMResources.shared().files().resourceForPath("./app/info/.../data.txt")
 */
(class BMResources extends BMStorableNode {
    
    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("themes", null);
            slot.setSlotType("BMThemeResources");
        }
        */
        /**
         * @member {BMFontResources} fonts
         * @category Resources
         */
        {
            const slot = this.newSlot("fonts", null);
            slot.setSlotType("BMFontResources");
        }
        /**
         * @member {BMSoundResources} sounds
         * @category Resources
         */
        {
            const slot = this.newSlot("sounds", null);
            slot.setSlotType("BMSoundResources");
        }
        /**
         * @member {BMImageResources} images
         * @category Resources
         */
        {
            const slot = this.newSlot("images", null);
            slot.setSlotType("BMImageResources");
        }
        /**
         * @member {BMIconResources} icons
         * @category Resources
         */
        {
            const slot = this.newSlot("icons", null);
            slot.setSlotType("BMIconResources");
        }
        /**
         * @member {BMJsonResources} json
         * @category Resources
         */
        {
            const slot = this.newSlot("json", null);
            slot.setSlotType("BMJsonResources");
        }
        /**
         * @member {BMFileResources} files
         * @category Resources
         */
        {
            const slot = this.newSlot("files", null);
            slot.setSlotType("BMFileResources");
        }
    }

    /**
     * @description Initializes the prototype with default values.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(false);
        this.setTitle("Resources");
        this.setSubtitle("");
    }

    /**
     * @description Initializes the instance and sets up subnodes.
     * @category Initialization
     */
    init () {
        super.init();
        this.setupSubnodes(); // don't need to wait for appDidInit?
        //this.watchOnceForNote("appDidInit");
    }

    /**
     * @description Sets up the subnodes for various resource types.
     * @returns {BMResources} The current instance.
     * @category Setup
     */
    setupSubnodes () {
        //const themes = this.defaultStore().rootSubnodeWithTitleForProto("Themes", BMThemeResources);
        //themes.setNodeCanReorderSubnodes(true);
        //this.addSubnode(themes);
        //let link = this.addLinkSubnode(themes);
        //this.setThemes(themes);
        //console.log("themes link = ", link.debugTypeId());

        this.setFiles(BMFileResources.shared());
        this.addSubnode(this.files());

        this.setFonts(BMFontResources.shared());
        this.addSubnode(this.fonts());

        this.setSounds(BMSoundResources.shared());
        this.addSubnode(this.sounds());

        this.setImages(BMImageResources.shared());
        this.addSubnode(this.images());

        this.setIcons(BMIconResources.shared());
        this.addSubnode(this.icons());

        this.setJson(BMJsonResources.shared());
        this.addSubnode(this.json());

        return this;
    }

    /**
     * @description Returns an array of resource classes for a given file extension.
     * @param {string} extension - The file extension.
     * @returns {Array} An array of resource classes.
     * @category Resource Lookup
     */
    resourceClassesForFileExtension (extension) {
        return this.subnodes().map(sn => sn.resourceClassesForFileExtension(extension)).flat()
    }

    /**
     * @description Returns the first resource class for a given file extension.
     * @param {string} extension - The file extension.
     * @returns {Function|null} The resource class or null if not found.
     * @category Resource Lookup
     */
    resourceClassForFileExtension (extension) {
        return this.resourceClassesForFileExtension(extension).first()
    }

    /**
     * @description Returns a resource for a given path.
     * @param {string} aPath - The path to the resource.
     * @returns {Object|null} The resource object or null if not found.
     * @category Resource Lookup
     */
    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension())
        /*
        if (!rClass) {
            // do we want this behavior?
            // What's the typical use case for this method
            rClass = BMResourceFile; 
        }
        */
        if (rClass) {
            const aResource = rClass.clone().setPath(aPath).load()
            return aResource
        }
        return null
    }

    /**
     * @description Precaches resources where appropriate.
     * @returns {Promise} A promise that resolves when precaching is complete.
     * @category Caching
     */
    async prechacheWhereAppropriate () {
        console.log(this.type() + ".prechacheWhereAppropriate()");
        await this.subnodes().promiseParallelMap(async (node) => node.prechacheWhereAppropriate());
    }

}.initThisClass());