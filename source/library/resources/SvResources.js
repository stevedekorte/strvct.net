/**
 * @module library.resources
 */

"use strict";

/**
 * @class SvResources
 * @extends SvStorableNode
 * @classdesc SvResources class for managing various resource types.
 * 
 * Usage example:
 * SvResources.shared().files().resourceForPath("./app/info/.../data.txt")
 */
(class SvResources extends SvStorableNode {
    
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
            slot.setSlotType("SvThemeResources");
        }
        */
        /**
         * @member {SvFontResources} fonts
         * @category Resources
         */
        {
            const slot = this.newSlot("fonts", null);
            slot.setSlotType("SvFontResources");
        }
        /**
         * @member {SvSoundResources} sounds
         * @category Resources
         */
        {
            const slot = this.newSlot("sounds", null);
            slot.setSlotType("SvSoundResources");
        }
        /**
         * @member {SvImageResources} images
         * @category Resources
         */
        {
            const slot = this.newSlot("images", null);
            slot.setSlotType("SvImageResources");
        }
        /**
         * @member {SvIconResources} icons
         * @category Resources
         */
        {
            const slot = this.newSlot("icons", null);
            slot.setSlotType("SvIconResources");
        }
        /**
         * @member {SvJsonResources} json
         * @category Resources
         */
        {
            const slot = this.newSlot("json", null);
            slot.setSlotType("SvJsonResources");
        }
        /**
         * @member {SvFileResources} files
         * @category Resources
         */
        {
            const slot = this.newSlot("files", null);
            slot.setSlotType("SvFileResources");
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
     * @returns {SvResources} The current instance.
     * @category Setup
     */
    setupSubnodes () {
        //const themes = this.defaultStore().rootSubnodeWithTitleForProto("Themes", SvThemeResources);
        //themes.setNodeCanReorderSubnodes(true);
        //this.addSubnode(themes);
        //let link = this.addLinkSubnode(themes);
        //this.setThemes(themes);
        //console.log("themes link = ", link.debugTypeId());

        this.setFiles(SvFileResources.shared());
        this.addSubnode(this.files());

        this.setFonts(SvFontResources.shared());
        this.addSubnode(this.fonts());

        this.setSounds(SvSoundResources.shared());
        this.addSubnode(this.sounds());

        this.setImages(SvImageResources.shared());
        this.addSubnode(this.images());

        this.setIcons(SvIconResources.shared());
        this.addSubnode(this.icons());

        this.setJson(SvJsonResources.shared());
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
        return this.subnodes().map(sn => sn.resourceClassesForFileExtension(extension)).flat();
    }

    /**
     * @description Returns the first resource class for a given file extension.
     * @param {string} extension - The file extension.
     * @returns {Function|null} The resource class or null if not found.
     * @category Resource Lookup
     */
    resourceClassForFileExtension (extension) {
        return this.resourceClassesForFileExtension(extension).first();
    }

    /**
     * @description Returns a resource for a given path.
     * @param {string} aPath - The path to the resource.
     * @returns {Object|null} The resource object or null if not found.
     * @category Resource Lookup
     */
    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension());
        /*
        if (!rClass) {
            // do we want this behavior?
            // What's the typical use case for this method
            rClass = SvResourceFile; 
        }
        */
        if (rClass) {
            const aResource = rClass.clone().setPath(aPath).load();
            return aResource;
        }
        return null
    }

    /**
     * @description Precaches resources where appropriate.
     * @returns {Promise} A promise that resolves when precaching is complete.
     * @category Caching
     */
    async prechacheWhereAppropriate () {
        //console.log(this.type() + ".prechacheWhereAppropriate()");
        await this.subnodes().promiseParallelMap(async (node) => {
            //console.log("subnode: " + node.type() + ".prechacheWhereAppropriate()");
            //debugger;
            await node.prechacheWhereAppropriate();
        });
        return this;
    }

}.initThisClass());