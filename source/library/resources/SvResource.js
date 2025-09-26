/**
 * @module library.resources
 */

/**
 * @class SvResource
 * @extends BaseNode
 * @classdesc Represents a resource with loading and decoding capabilities.
 */
"use strict";

(class SvResource extends BaseNode {
    
    // --- supported mime types ---

    /**
     * @static
     * @description Returns a set of supported MIME types.
     * @returns {Set} A set of supported MIME types.
     * @category MIME Types
     */
    static supportedMimeTypes () {
        //throw new Error("subclasses should override this method")
        return new Set();
    }

    /**
     * @static
     * @description Checks if the given MIME type is supported.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type is supported, false otherwise.
     * @category MIME Types
     */
    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType);
    }

    /**
     * @static
     * @description Opens a data chunk with the given MIME type.
     * @param {Object} dataChunk - The data chunk to open.
     * @throws {Error} Throws an error if not implemented by subclasses.
     * @category MIME Types
     */
    static openMimeChunk (/*dataChunk*/) {
         throw new Error("subclasses should override this method");
        //const aNode = this.clone();
        //setValue(dataChunk);
        //console.log(this.logPrefix(), dataChunk.mimeType() + " data.length: " + dataChunk.decodedData().length);
        //return aNode;
    }

    // --- supported extension types ---

    /**
     * @static
     * @description Returns an array of supported file extensions.
     * @returns {Array} An array of supported file extensions.
     * @throws {Error} Throws an error if not implemented by subclasses.
     * @category File Extensions
     */
    static supportedExtensions () {
        throw new Error("subclasses should override this method");
        //return [];
    }

    /**
     * @static
     * @description Checks if the given file extension is supported.
     * @param {string} extension - The file extension to check.
     * @returns {boolean} True if the extension is supported, false otherwise.
     * @category File Extensions
     */
    static canHandleExtension (extension) {
        return this.supportedExtensions().contains(extension);
    }

    // ---

    /**
     * @description Initializes the prototype slots for the SvResource class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {string} path - The path of the resource.
             * @category Resource Properties
             */
            const slot = this.newSlot("path", "");
            slot.setSlotType("String");
        }
        {
            /**
             * @member {Object} data - The data of the resource.
             * @category Resource Properties
             */
            const slot = this.newSlot("data", null);
            slot.setSlotType("Object");
        }

        {
            /**
             * @member {Error} error - Any error that occurred during resource handling.
             * @category Resource Properties
             */
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }
        {
            /**
             * @member {string} loadState - The current load state of the resource.
             * @category Resource Properties
             */
            const slot = this.newSlot("loadState", "unloaded"); 
            slot.setSlotType("String");
            slot.setValidValues([
                "unloaded", 
                "loading", 
                "loading failed",
                "decoding", 
                "decoding failed",
                "loaded"
            ]);
        }

        {
            /**
             * @member {SvSvUrlResource} urlResource - The URL resource associated with this resource.
             * @category Resource Properties
             */
            const slot = this.newSlot("urlResource", null);
            slot.setSlotType("SvUrlResource");
        }

        {
            /**
             * @member {Promise} loadDataPromise - Promise for loading data.
             * @category Resource Properties
             */
            const slot = this.newSlot("loadDataPromise", null);
            slot.setSlotType("Promise");
        }

        {
            /**
             * @member {Promise} decodeDataPromise - Promise for decoding data.
             * @category Resource Properties
             */
            const slot = this.newSlot("decodeDataPromise", null);
            slot.setSlotType("Promise");
        }

        {
            /**
             * @member {Object} value - The value of the resource.
             * @category Resource Properties
             */
            const slot = this.newSlot("value", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Gets the title of the resource.
     * @returns {string} The title of the resource.
     * @category Resource Information
     */
    title () {
        return this.name();
    }

    /**
     * @description Gets the subtitle of the resource including the load state.
     * @returns {string} The subtitle of the resource.
     * @category Resource Information
     */
    subtitle () {
        return this.path().pathExtension() + ", " + this.loadState();
    }

    /**
     * @description Gets the name of the resource.
     * @returns {string} The name of the resource.
     * @category Resource Information
     */
    name () {
        return this.path().lastPathComponent().sansExtension();
    }

    // --- promises ---

    /**
     * @description Gets the promise for loading data.
     * @returns {Promise} The promise for loading data.
     * @category Resource Loading
     */
    loadDataPromise () {
        if (!this._loadDataPromise) {
            this.setLoadDataPromise(Promise.clone());
        }
        return this._loadDataPromise;
    }

    /**
     * @description Gets the promise for decoding data.
     * @returns {Promise} The promise for decoding data.
     * @category Resource Loading
     */
    decodeDataPromise () {
        if (!this._decodeDataPromise) {
            this.setDecodeDataPromise(Promise.clone());
        }
        return this._decodeDataPromise;
    }


    // --- resource file ---

    /*
    fileResource () {
        return SvFileResources.shared().rootFolder().nodeAtSubpathString(this.path());
    }

    async asyncLoadFileResource () {        
        this.setTitle(this.path().lastPathComponent().sansExtension());
        
        const fileResource = this.fileResource();
        if (!fileResource) {
          const error = "no index for file resource at path '" + this.path() + "'"
          this.setError(error);
          throw new Error(error);
        }
        await fileResource.promiseLoad();
        this.onFileResourceLoaded(fileResource);
    }
    
    onFileResourceLoaded (fileResource) {
        this.setData(fileResource.data());
        this.postNoteNamed("resourceLoaded");
        this.setLoadState("loaded");
        this.didLoad();
        return this;
    }
    */

    // --- load states---

    isLoading () {
        return this.loadState() === "loading";
    }

    isDecoding () {
        return this.loadState() === "decoding";
    }

    isLoaded () {
        return this.loadState() === "loaded";
    }


    /**
     * @description Loads the resource.
     * @throws {Error} Throws an error indicating that asyncLoad should be used instead.
     * @category Resource Loading
     */
    load () {
        throw new Error("deprecated - use asyncLoad instead");
    }

    async asyncLoadIfNeeded () {
        if (!this.isLoaded()) {
            await this.asyncLoad();
        }
        return this;
    }

    /**
     * @description Asynchronously loads and decodes the resource.
     * @returns {Promise<SvResource>} A promise that resolves to the resource instance.
     * @category Resource Loading
     */
    async asyncLoad () {
        if (this.isLoaded()) {
            console.warn(this.logPrefix() + "asyncLoad called on loaded resource");
            return this;
        }
        //console.log(this.logPrefix(), "asyncLoad: " + this.path());
        try {
            this.setLoadState("loading");
            await this.asyncLoadSvUrlResource();
            //this.postNoteNamed("resourceLoaded");
            //console.log(this.logPrefix(), "asyncLoad: " + this.path() + " loaded");

        } catch (error) {
            this.setLoadState("loading failed");
            this.setError(error);
            //this.postNoteNamed("loadError");
            throw error;
        }

        try {
            this.setLoadState("decoding");
            await this.asyncDecodeData();
            //this.postNoteNamed("resourceDecoded");
        } catch (error) {
            this.setLoadState("decoding failed");
            this.setError(error);
            //this.postNoteNamed("decodeError");
            throw error;
        }
        this.setLoadState("loaded");
        return this;
    }

    /**
     * @description Asynchronously loads the URL resource.
     * @returns {Promise<void>} A promise that resolves when the URL resource is loaded.
     * @category Resource Loading
     */
    async asyncLoadSvUrlResource () {
        const url = this.urlResource();
        await url.promiseLoad();
        const data = url.data();
        assert(data.byteLength, "data.byteLength method not found");
        //assert(data.byteLength() > 0, "data.byteLength is not greater than 0");
        this.setData(data);
        await this.onDidLoad();
    }
    
    /**
     * @description Called when the resource has finished loading.
     * @returns {Promise<void>} A promise that resolves when post-load operations are complete.
     * @category Resource Loading
     */
    async onDidLoad () {
        this.setLoadState("loaded");
        this.postNoteNamed("didLoad");
    }


    /**
     * @description Asynchronously decodes the data.
     * @returns {Promise<SvResource>} A promise that resolves to the resource instance.
     * @category Resource Loading
     */
    async asyncDecodeData () {
        // for subclasses to override
        return this;
    }

    canDeferLoad () {
        return this.path().split("/").includes("deferred");
    }

    /**
     * @description Precaches the resource where appropriate.
     * @returns {Promise<void>} A promise that resolves when precaching is complete.
     * @category Resource Loading
     */
    async prechacheWhereAppropriate () {
        if (!this.isLoaded()) {
            if (!this.canDeferLoad()) {
                //console.log(this.logPrefix(), ".prechacheWhereAppropriate: " + this.path());
                await this.asyncLoad();
                //console.warn("---- " + this.svType() + " (subclass of SvResource) doesn't implement prechacheWhereAppropriate");
            }
        }
    }

}.initThisClass());