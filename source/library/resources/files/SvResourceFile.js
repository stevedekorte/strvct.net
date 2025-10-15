"use strict";

/**
 * @module library.resources.files
 */

/**
 * @class SvResourceFile
 * @extends BaseNode
 * @classdesc Represents a resource file with methods for loading and managing file data.
 */
(class SvResourceFile extends BaseNode {

    /**
     * @description Initializes the prototype slots for the SvResourceFile class.
     */
    initPrototypeSlots () {
        /**
         * @member {String} path - Path from _index.json entry
         * @category File Properties
         */
        {
            const slot = this.newSlot("path", ".");
            slot.setSlotType("String");
        }

        /**
         * @member {String} resourceHash - Hash from _index.json entry
         * @category File Properties
         */
        {
            const slot = this.newSlot("resourceHash", null);
            slot.setSlotType("String");
        }

        /**
         * @member {Number} resourceSize - Size from _index.json entry
         * @category File Properties
         */
        {
            const slot = this.newSlot("resourceSize", null);
            slot.setSlotType("Number");
        }

        /**
         * @member {Object} data - Raw data of the resource
         * @category Data Management
         */
        {
            const slot = this.newSlot("data", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {Object} value - The value decoded from the data, e.g., value = JSON.parse(data)
         * @category Data Management
         */
        {
            const slot = this.newSlot("value", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {Error} error - Error object if any error occurs during processing
         * @category Error Handling
         */
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }

        /**
         * @member {Promise} promiseForLoad - Holds promise used for reading from URL request or indexedDB
         * @category Loading
         */
        {
            const slot = this.newSlot("promiseForLoad", null);
            slot.setDescription("holds promise used for reading from URL request or indexedDB");
            slot.setSlotType("Promise");
        }

        /**
         * @member {Boolean} isLoading - Indicates if the resource is currently loading
         * @category Loading
         */
        {
            const slot = this.newSlot("isLoading", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} isLoaded - Indicates if the resource has been loaded
         * @category Loading
         */
        {
            const slot = this.newSlot("isLoaded", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {String} loadState - Represents the current load state of the resource
         * @category Loading
         */
        {
            const slot = this.newSlot("loadState", null);
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype properties.
     */
    initPrototype () {
        this.setTitle("File");
        this.setNoteIsSubnodeCount(true);
        this.setIsDebugging(true);
    }

    /**
     * @description Initializes the SvResourceFile instance.
     * @returns {SvResourceFile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Gets the name of the resource file.
     * @returns {String} The file name.
     * @category File Properties
     */
    name () {
        return this.path().lastPathComponent();
    }

    nameWithoutExtension () {
        return this.name().before(".");
    }

    /**
     * @description Gets the title of the resource file.
     * @returns {String} The file name as the title.
     * @category File Properties
     */
    title () {
        return this.name();
    }

    /**
     * @description Gets the file extension of the resource file.
     * @returns {String} The file extension.
     * @category File Properties
     */
    pathExtension () {
        return this.path().pathExtension();
    }

    /**
     * @description Sets up subnodes for the resource file.
     * @returns {SvResourceFile} The current instance.
     * @category Initialization
     */
    setupSubnodes () {
        return this;
    }

    /**
     * @description Checks if the resource file has data.
     * @returns {Boolean} True if data is present, false otherwise.
     * @category Data Management
     */
    hasData () {
        return this.data() !== null;
    }

    /**
     * @description Gets the URL resource for the file.
     * @returns {SvUrlResource} The URL resource object.
     * @category Loading
     */
    urlResource () {
        return SvUrlResource.with(this.path());
    }

    /**
     * @description Synchronously gets the value from the file data.
     * @returns {*} The parsed value from the file data.
     * @category Data Management
     */
    syncValueFromData () {
        const ext = this.pathExtension();
        const data = this.data();
        if (ext === "json") {
            const jsonString = data.asString();
            return JSON.parse(jsonString);
        } else if (["js", "css", "txt"].includes(ext)) {
            const textString = data.asString();
            return textString;
        }
        return this.data();
    }

    /**
     * @description Loads the resource file asynchronously.
     * @returns {Promise<SvResourceFile>} A promise that resolves with the current instance after loading.
     * @category Loading
     */
    async promiseLoad () {
        if (this.promiseForLoad()) {
            return this.promiseForLoad();
        }
        const promise = Promise.clone();
        this.setPromiseForLoad(promise);

        try {
            const url = this.urlResource();
            url.setResourceHash(this.resourceHash());
            const r = await url.promiseLoad();
            this._data = r.data();
            this.setValue(await this.asyncValueFromData());
            promise.callResolveFunc();
        } catch (error) {
            promise.callRejectFunc(error);
            throw error;
        }
        this.setIsLoading(false);
        this.setIsLoaded(true);
        return this;
    }

    /**
     * @description Gets a promise that resolves with the file data.
     * @returns {Promise<Object>} A promise that resolves with the file data.
     * @category Data Management
     */
    async promiseData () {
        if (!this.hasData()) {
            await this.promiseLoad();
        }
        return this.data();
    }

    /**
     * @description Gets the list of file extensions to precache.
     * @returns {String[]} An array of file extensions to precache.
     * @category Caching
     */
    precacheExtensions () {
        return [
            "html",
            "json",
            "txt",
            "otf", "ttf", "woff", "woff2" // font formats
            //"svg"
            //"js", // needed? should already be loaded at this point
            //"css" // needed? should already be loaded at this point
        ];
        // not loading: wav, png, jpg, svg
    }

    canDeferLoad () {
        return this.path().split("/").includes("deferred");
    }

    /**
     * @description Precaches the resource file if appropriate based on its extension.
     * @returns {Promise<SvResourceFile>} A promise that resolves with the current instance after precaching.
     * @category Caching
     */
    async prechacheWhereAppropriate () {
        if (this.precacheExtensions().includes(this.pathExtension())) {
            if (!this.canDeferLoad()) {
                await this.promiseLoad();
                assert(this.hasData(), "no data found for " + this.path());
            } else {
                //console.log(this.logPrefix(), " deferring: " + this.path());
            }
        } else {
            //console.log(this.logPrefix(), "------------------- file: " + this.path() + "  - not precaching");
        }
        return this;
    }

    /**
     * @description Asynchronously gets the value from the file data.
     * @returns {Promise<*>} A promise that resolves with the parsed value from the file data.
     * @category Data Management
     */
    async asyncValueFromData () {
        try {
            const ext = this.pathExtension();
            const data = this.data();
            if (ext === "json") {
                const jsonString = data.asString();
                return JSON.parse(jsonString);
            } else if (["js", "css", "txt", "html"].includes(ext)) {
                const textString = data.asString();
                return textString;
            }
            return this.data();
        } catch (error) {
            const errorMessage = this.svType() + ".asyncValueFromData() error loading value from data for " + this.path() + " : " + error.message;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

}.initThisClass());
