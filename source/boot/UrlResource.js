"use strict";

/**
 * @module boot
 */

/**
 * @class UrlResource
 * @extends Object
 * @classdesc Represents a resource identified by a URL. Supports automatic
 * loading from network or cache, and unzipping of zip files. To use the cache, 
 * the resourceHash must be specified.
 */

(class UrlResource extends Object {

    static initThisClass () {
        /** @type {number} Total bytes loaded across all instances */
        this._totalBytesLoaded = 0;

        /** @type {number} Total number of URLs loaded across all instances */
        this._totalUrlsLoaded = 0;

        getGlobalThis().UrlResource = UrlResource;
    }

    /**
     * Creates a new UrlResource instance with the given URL.
     * @param {string} url - The URL of the resource.
     * @returns {UrlResource} A new UrlResource instance.
     * @category Factory Methods
     */
    static with (url) {
        return this.clone().setPath(url);
    }

    /**
     * Creates a clone of the UrlResource class.
     * @returns {UrlResource} A new instance of UrlResource.
     * @category Factory Methods
     */
    static clone () {
        const obj = new this();
        obj.init();
        return obj;
    }
	
    /**
     * Returns the type of the resource.
     * @returns {string} The type of the resource.
     * @category Metadata
     */
    type () {
        return "UrlResource";
    }

    /**
     * Initializes the UrlResource instance.
     * @returns {UrlResource} The initialized instance.
     * @category Lifecycle
     */
    init () {
        this._path = null;
        this._resourceHash = null;
        this._request = null;
        this._data = null;
        return this;
    }

    /**
     * Sets the path of the resource.
     * @param {string} aPath - The path to set.
     * @returns {UrlResource} The instance for chaining.
     * @category Path Management
     */
    setPath (aPath) {
        this._path = aPath;
        return this;
    }

    /**
     * Gets the path of the resource.
     * @returns {string|null} The path of the resource.
     * @category Path Management
     */
    path () {
        return this._path;
    }

    /**
     * Gets the file extension of the resource path.
     * @returns {string} The file extension.
     * @category Path Management
     */
    pathExtension () {
        return this.path().split(".").pop();
    }

    /**
     * Sets the resource hash.
     * @param {string} h - The hash to set.
     * @returns {UrlResource} The instance for chaining.
     * @category Hash Management
     */
    setResourceHash (h) {
        this._resourceHash = h;
        return this;
    }

    /**
     * Gets the resource hash.
     * @returns {string|null} The resource hash.
     * @category Hash Management
     */
    resourceHash () {
        return this._resourceHash;
    }

    /**
     * Loads the resource asynchronously.
     * @returns {Promise<UrlResource>} A promise that resolves with the loaded resource.
     * @category Loading
     */
    async promiseLoad () {
        // load unzipper if needed
        if (this.isZipFile()) {
            await this.promiseLoadUnzipIfNeeded();
        }
        return await this.asyncLoadFromCache();
    }

    /**
     * Checks if debugging is enabled.
     * @returns {boolean} True if debugging is enabled, false otherwise.
     * @category Debugging
     */
    isDebugging () {
        return false;
    }

    /**
     * Logs a debug message if debugging is enabled.
     * @param {string} s - The message to log.
     * @category Debugging
     */
    debugLog (s) {
        if (this.isDebugging()) {
            console.log(s);
        }
    }

    /**
     * Loads the resource from the cache if available, otherwise loads it from the network.
     * @returns {Promise<UrlResource>} A promise that resolves with the loaded resource.
     * @category Loading
     */
    async asyncLoadFromCache () {
        if (this._data) {
            return this;
        }

        //console.log("UrlResource.asyncLoadFromCache() " + this.path())
        const h = this.resourceHash();
        if (h && getGlobalThis().HashCache) {
            const hc = HashCache.shared();
            //await hc.promiseClear(); // clear cache for now
            const hasKey = await hc.promiseHasKey(h);
            //const data = await hc.promiseAt(h); // this seems to be not returning undefined for some absent keys???

            //if (data !== undefined) {
            if (hasKey) {
                // if hashcache is available and has data, use it
                const data = await hc.promiseAt(h);
                assert(data !== undefined, "hashcache has undefined data for " + h);
                this._data = data;
                //console.log("UrlResource.asyncLoadFromCache() (from cache) " + this.path())
                return this;
            } else {
                // otherwise, load normally and cache result
                this.debugLog(this.type() + " no cache for '" + this.resourceHash() + "' " + this.path());
                console.log("UrlResource.asyncLoadFromCache() (over NETWORK) " + this.path())
                await this.promiseJustLoad();
                await hc.promiseAtPut(h, this.data());
                console.log(this.type() + " stored cache for ", this.resourceHash() + " " + this.path());
                return this;
            }
        } else {
            /*
            if (!h) {
                console.log("  no hash for " + this.path())
                //debugger;
            }
            if (!getGlobalThis().HashCache) {
                console.log("  no HashCache")
            }
            console.log("loading normally " + this.path() + " " + h)
            */
            return this.promiseJustLoad();
        }
    }

    /**
     * Loads the resource from the network.
     * @returns {Promise<UrlResource>} A promise that resolves with the loaded resource.
     * @category Loading
     */
    async promiseJustLoad () {
        try {
            const data = await URL.with(this.path()).promiseLoad();
            this._data = data;
            this.constructor._totalBytesLoaded += data.byteLength;
            this.constructor._totalUrlsLoaded += 1;
        } catch (error) {
            debugger
            this._error = error;
            error.cause = error;
            throw error;
        }
        return this;
    }

    /**
     * Loads the resource from the network and evaluates it.
     * @returns {Promise<UrlResource>} A promise that resolves with the loaded resource.
     * @category Loading and Evaluation
     */
    async promiseLoadAndEval () {
        //console.log("promiseLoadAndEval " + this.path())
        await this.promiseLoad();
        this.eval();
    }

    /**
     * Evaluates the resource as javascript or CSS.
     * @returns {UrlResource} The instance for chaining.
     * @category Evaluation
     */
    eval () {
        if (this.pathExtension() === "js") {
            this.evalDataAsJS();
        } else if (this.pathExtension() === "css") {
            this.evalDataAsCss();
        }
    }

    /**
     * Evaluates the resource as javascript.
     * @returns {UrlResource} The instance for chaining.
     * @category Evaluation
     */
    evalDataAsJS () {
        console.log("UrlResource eval ", this.path())
        evalStringFromSourceUrl(this.dataAsText(), this.path());
        return this;
    }

    /**
     * Evaluates the resource as CSS.
     * @returns {UrlResource} The instance for chaining.
     * @category Evaluation
     */
    evalDataAsCss () {
        const cssString = this.dataAsText(); // default decoding is to utf8
        const sourceUrl = "\n\n//# sourceURL=" + this.path() + " \n";
        const debugCssString = cssString + sourceUrl;
        //console.log("eval css: " +  entry.path)
        const element = document.createElement('style');
        element.type = 'text/css';
        element.appendChild(document.createTextNode(debugCssString));
        document.head.appendChild(element);
    }

    /**
     * Gets the data of the resource.
     * @returns {Uint8Array} The data of the resource.
     * @category Data Access
     */
    data () {
        return this._data;
    }

    /**
     * Gets the data of the resource as a text string.
     * @returns {string} The data of the resource as a text string.
     * @category Data Access
     */
    dataAsText () {
        let data = this.data()
        if (typeof(data) === "string") {
            return data;
        }

        if (this.isZipFile()) {
            data = this.unzippedData();
        } 

        return new TextDecoder().decode(data); // default decoding is to utf8
    }

    /**
     * Gets the data of the resource as a JSON object.
     * @returns {object} The data of the resource as a JSON object.
     * @category Data Access
     */
    dataAsJson () {
        return JSON.parse(this.dataAsText());
    }

    /**
     * Checks if the resource is a zip file.
     * @returns {boolean} True if the resource is a zip file, false otherwise.
     * @category Zip Handling
     */
    isZipFile () {
        return this.pathExtension() === "zip";
    }

    /**
     * Unzips the data of the resource.
     * @returns {Uint8Array} The unzipped data.
     * @category Zip Handling
     */
    unzippedData () {
        return pako.inflate(this.data());
    }

    /**
     * Loads the unzip library if needed.
     * @returns {Promise<void>} A promise that resolves when the unzip library is loaded.
     * @category Zip Handling
     */
    async promiseLoadUnzipIfNeeded () {
        if (!getGlobalThis().pako) {
            await UrlResource.clone().setPath(ResourceManager.bootPath() + "/external-libs/pako.js").promiseLoadAndEval();
        }
    }
}).initThisClass();
