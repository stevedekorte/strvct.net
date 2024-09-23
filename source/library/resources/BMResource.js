/**
 * @module library.resources
 */

/**
 * @class BMResource
 * @extends BaseNode
 * @classdesc Represents a resource with loading and decoding capabilities.
 */
"use strict";

(class BMResource extends BaseNode {
    
    // --- supported mime types ---

    /**
     * @static
     * @description Returns a set of supported MIME types.
     * @returns {Set} A set of supported MIME types.
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
     */
    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType);
    }

    /**
     * @static
     * @description Opens a data chunk with the given MIME type.
     * @param {Object} dataChunk - The data chunk to open.
     * @throws {Error} Throws an error if not implemented by subclasses.
     */
    static openMimeChunk (dataChunk) {
         throw new Error("subclasses should override this method");
        //const aNode = this.clone();
        //setValue(dataChunk);
        //console.log(dataChunk.mimeType() + " data.length: " + dataChunk.decodedData().length);
        //return aNode;
    }

    // --- supported extension types ---

    /**
     * @static
     * @description Returns an array of supported file extensions.
     * @returns {Array} An array of supported file extensions.
     * @throws {Error} Throws an error if not implemented by subclasses.
     */
    static supportedExtensions () {
        throw new Error("subclasses should override this method");
        return [];
    }

    /**
     * @static
     * @description Checks if the given file extension is supported.
     * @param {string} extension - The file extension to check.
     * @returns {boolean} True if the extension is supported, false otherwise.
     */
    static canHandleExtension (extension) {
        return this.supportedExtensions().contains(extension);
    }

    // ---

    /**
     * @description Initializes the prototype slots for the BMResource class.
     */
    initPrototypeSlots () {
        {
            /**
             * @property {string} path - The path of the resource.
             */
            const slot = this.newSlot("path", "");
            slot.setSlotType("String");
        }
        {
            /**
             * @property {Object} data - The data of the resource.
             */
            const slot = this.newSlot("data", null);
            slot.setSlotType("Object");
        }

        {
            /**
             * @property {Error} error - Any error that occurred during resource handling.
             */
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }
        {
            /**
             * @property {string} loadState - The current load state of the resource.
             */
            const slot = this.newSlot("loadState", "unloaded"); // "unloaded", "loading", "decoding", "loaded"
            slot.setSlotType("String");
        }
        {
            /**
             * @property {boolean} isLoaded - Indicates if the resource is loaded.
             */
            const slot = this.newSlot("isLoaded", false);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @property {BMUrlResource} urlResource - The URL resource associated with this resource.
             */
            const slot = this.newSlot("urlResource", null);
            slot.setSlotType("BMUrlResource");
        }

        {
            /**
             * @property {Promise} loadDataPromise - Promise for loading data.
             */
            const slot = this.newSlot("loadDataPromise", null);
            slot.setSlotType("Promise");
        }

        {
            /**
             * @property {Promise} decodeDataPromise - Promise for decoding data.
             */
            const slot = this.newSlot("decodeDataPromise", null);
            slot.setSlotType("Promise");
        }

        {
            /**
             * @property {Object} value - The value of the resource.
             */
            const slot = this.newSlot("value", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Initializes the prototype.
     */
    initPrototype () {
    }

    /**
     * @description Gets the title of the resource.
     * @returns {string} The title of the resource.
     */
    title () {
        return this.name();
    }

    /**
     * @description Gets the subtitle of the resource.
     * @returns {string} The subtitle of the resource.
     */
    subtitle () {
        return this.path().pathExtension();
    }

    /**
     * @description Gets the subtitle of the resource including the load state.
     * @returns {string} The subtitle of the resource.
     */
    subtitle () {
        return this.path().pathExtension() + ", " + this.loadState();
    }

    /**
     * @description Gets the name of the resource.
     * @returns {string} The name of the resource.
     */
    name () {
        return this.path().lastPathComponent().sansExtension();
    }

    // --- promises ---

    /**
     * @description Gets the promise for loading data.
     * @returns {Promise} The promise for loading data.
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
        return BMFileResources.shared().rootFolder().nodeAtSubpathString(this.path());
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

    // --- load ---

    /**
     * @description Loads the resource if it hasn't been loaded yet.
     * @returns {BMResource} The resource instance.
     */
    loadIfNeeded () {
        if (this.loadState() === "unloaded") {
            this.load();
        }
        return this;
    }

    /**
     * @description Loads the resource.
     * @throws {Error} Throws an error indicating that asyncLoad should be used instead.
     */
    load () {
        throw new Error("deprecated - use asyncLoad instead");
    }

    /**
     * @description Asynchronously loads and decodes the resource.
     * @returns {Promise<BMResource>} A promise that resolves to the resource instance.
     */
    async asyncLoad () {
        try {
            this.setLoadState("loading");
            await this.asyncLoadUrlResource();
            this.setLoadState("loaded");
            this.postNoteNamed("resourceLoaded");
        } catch (error) {
            this.setError(error);
            this.postNoteNamed("loadError");
            throw error;
        }

        try {
            this.setLoadState("decoding");
            await this.asyncDecodeData();
            this.setLoadState("decoded");
            this.postNoteNamed("resourceDecoded");
        } catch (error) {
            this.setError(error);
            this.postNoteNamed("decodeError");
            throw error;
        }
        return this;
    }

    /**
     * @description Asynchronously loads the URL resource.
     * @returns {Promise<void>} A promise that resolves when the URL resource is loaded.
     */
    async asyncLoadUrlResource () {
        const url = this.urlResource()
        await url.promiseLoad();
        const data = url.data();
        assert(data.byteLength);
        this.setData(data);
        await this.onDidLoad();
    }
    
    /**
     * @description Called when the resource has finished loading.
     * @returns {Promise<void>} A promise that resolves when post-load operations are complete.
     */
    async onDidLoad () {
        this.setIsLoaded(true);
        this.postNoteNamed("didLoad");
    }

    /**
     * @description Asynchronously decodes the data.
     * @returns {Promise<BMResource>} A promise that resolves to the resource instance.
     */
    async asyncDecodeData () {
        // for subclasses to override
        return this;
    }

    /**
     * @description Precaches the resource where appropriate.
     * @returns {Promise<void>} A promise that resolves when precaching is complete.
     */
    async prechacheWhereAppropriate () {
    }

}.initThisClass());