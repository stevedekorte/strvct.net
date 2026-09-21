"use strict";

/**
 * @module boot
 */

/**
 * @class SvUrlResource
 * @extends Object
 * @classdesc Represents a resource identified by a URL. Supports automatic
 * loading from network or cache, and unzipping of zip files. To use the cache,
 * the resourceHash must be specified.
 */

(class SvUrlResource extends Object {

    static initThisClass () {
        /** Total bytes loaded across all instances */
        this._totalBytesLoaded = 0;

        /** Total number of URLs loaded across all instances */
        this._totalUrlsLoaded = 0;

        SvGlobals.globals().SvUrlResource = SvUrlResource;
    }

    /**
     * Creates a new SvUrlResource instance with the given URL.
     * @param {string} url - The URL of the resource.
     * @returns {SvUrlResource} A new SvUrlResource instance.
     * @category Factory Methods
     */
    static with (url) {
        return this.clone().setPath(url);
    }

    /**
     * Creates a clone of the SvUrlResource class.
     * @returns {SvUrlResource} A new instance of SvUrlResource.
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
    svType () {
        return "SvUrlResource";
    }

    logPrefix () {
        return "[" + this.svType() + "] ";
    }

    /**
     * Initializes the SvUrlResource instance.
     * @returns {SvUrlResource} The initialized instance.
     * @category Lifecycle
     */
    init () {
        this._path = null;
        this._resourceHash = null;
        this._request = null;
        this._data = null;
        this._didEval = false;
        this._canDefer = false;
        return this;
    }

    /**
     * Sets the path of the resource.
     * @param {string} aPath - The path to set.
     * @returns {SvUrlResource} The instance for chaining.
     * @category Path Management
     */
    setPath (aPath) {
        this._path = aPath;
        this._canDefer = aPath.split("/").includes("deferred");
        return this;
    }

    setDidEval (didEval) {
        this._didEval = didEval;
        return this;
    }

    didEval () {
        return this._didEval;
    }

    canDefer () {
        return this._canDefer;
    }

    /**
     * Gets the path of the resource.
     * @returns {string|null} The path of the resource.
     * @category Path Management
     */
    path () {
        return this._path;
    }

    fileName () {
        return this.path().split("/").pop();
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
     * @returns {SvUrlResource} The instance for chaining.
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
     * @returns {Promise<SvUrlResource>} A promise that resolves with the loaded resource.
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
    logDebug (s) {
        if (this.isDebugging()) {
            console.log(this.logPrefix() + s);
        }
    }

    /**
     * Loads the resource from the cache if available, otherwise loads it from the network.
     * @returns {Promise<SvUrlResource>} A promise that resolves with the loaded resource.
     * @category Loading
     */
    async asyncLoadFromCache () {
        if (this._data) {
            return this;
        }
        SvResourceManager.shared().updateBar();

        //console.log(this.logPrefix() + ".asyncLoadFromCache() " + this.path())
        const h = this.resourceHash();
        if (h && SvGlobals.has("SvHashCache")) {
            const hc = SvHashCache.shared();
            //await hc.promiseClear(); // clear cache for now

            if (this.path().split("/").includes("deferred")) {
                console.log(this.logPrefix() + "loading a deferred resource: " + this.path());
            }

            // Single read instead of a has-check followed by a get — each was
            // its own IndexedDB transaction, doubling the per-resource cost.
            const data = await hc.promiseAt(h, this.path());
            if (data !== undefined) {
                this._data = data;
                return this;
            } else {
                // otherwise, load normally and cache result
                this.logDebug("no cache for '" + this.resourceHash() + "' " + this.path());
                this.logDebug("asyncLoadFromCache (over NETWORK) " + this.path());

                assert(this.data() === null, "this.data() should be null");

                await this.promiseJustLoadVerified(h); // data is ArrayBuffer, proven to be the index's version

                try {
                    await hc.promiseAtPut(h, this.data());
                } catch (error) {
                    console.error("error writing hash/value pair from path '" + this.path() + "' error: " + error.message);
                    throw error;
                }
                //console.log(this.logPrefix()+ " stored cache for ", this.resourceHash() + " " + this.path());
                return this;
            }
        } else {
            /*
            if (!h) {
                console.log("  no hash for " + this.path())

            }
            if (!SvGlobals.globals().SvHashCache) {
                console.log("  no SvHashCache")
            }
            console.log("loading normally " + this.path() + " " + h)
            */
            return this.promiseJustLoad();
        }
    }

    /**
     * Loads the resource from the network.
     * @returns {Promise<SvUrlResource>} A promise that resolves with the loaded resource.
     * @category Loading
     */
    setUrlQuery (query) {
        this._urlQuery = query;
        return this;
    }

    setFetchCacheMode (mode) {
        this._fetchCacheMode = mode;
        return this;
    }

    /**
     * Loads over the network and proves the bytes are the version the index
     * names before they are cached under that hash. A browser HTTP cache
     * answers by URL: after a deploy it can hand back the previous version of
     * a file for as long as the hosting's max-age, and storing those bytes
     * under the new hash poisoned the hash cache until the file's next change
     * (seen in production 2026-09-21: a new UoBookPage.js evaluated against a
     * stale Slot.js). The URL now carries the hash, so it cannot be answered
     * from an older entry; a mismatch anyway refetches bypassing every cache,
     * and a second mismatch throws rather than caching wrong bytes.
     * @param {string} hash - the index's sha256 hex of the resource
     * @category Loading
     */
    async promiseJustLoadVerified (hash) {
        this.setUrlQuery("h=" + hash);
        await this.promiseJustLoad();
        if (await this.dataMatchesHash(hash)) {
            return this;
        }
        console.warn(this.logPrefix() + "content of '" + this.path() + "' does not match its index hash (a stale HTTP cache?) — refetching, bypassing caches");
        this._data = null;
        this.setFetchCacheMode("reload");
        await this.promiseJustLoad();
        if (await this.dataMatchesHash(hash)) {
            return this;
        }
        throw new Error("resource '" + this.path() + "' does not match its index hash after a cache-bypassing fetch — the served build is inconsistent; not caching it");
    }

    async dataMatchesHash (hash) {
        const subtle = globalThis.crypto && globalThis.crypto.subtle;
        if (!subtle || !this._data) {
            return true; // no digest available here (an old runtime): trust the fetch, as before
        }
        const digest = await subtle.digest("SHA-256", this._data);
        const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
        return hex === hash;
    }

    async promiseJustLoad () {
        try {
            const file = StrvctFile.with(this.path());
            if (this._urlQuery) {
                file.setUrlQuery(this._urlQuery);
            }
            if (this._fetchCacheMode) {
                file.setFetchCacheMode(this._fetchCacheMode);
            }
            const data = await file.asyncLoadArrayBuffer();
            this._data = data;
            this.constructor._totalBytesLoaded += data.byteLength;
            this.constructor._totalUrlsLoaded += 1;
        } catch (error) {
            this._error = error;
            error.cause = error;
            throw error;
        }
        return this;
    }

    /**
     * Loads the resource from the network and evaluates it.
     * @returns {Promise<SvUrlResource>} A promise that resolves with the loaded resource.
     * @category Loading and Evaluation
     */
    async promiseLoadAndEval () {
        console.log(this.logPrefix() + "promiseLoadAndEval " + this.path());
        await this.promiseLoad();
        this.eval();
    }

    /**
     * Evaluates the resource as javascript or CSS.
     * @returns {SvUrlResource} The instance for chaining.
     * @category Evaluation
     */
    eval () {
        if (this._didEval) {
            console.warn(this.logPrefix() + "already evaluated: " + this.path());
            return this;
        }

        if (this.pathExtension() === "js") {
            this.evalDataAsJS();
        } else if (this.pathExtension() === "css") {
            this.evalDataAsCss();
        }
        this.setDidEval(true);
    }

    /**
     * Evaluates the resource as javascript.
     * @returns {SvUrlResource} The instance for chaining.
     * @category Evaluation
     */
    evalDataAsJS () {
        //console.log(this.logPrefix() + "eval ", this.path());
        evalStringFromSourceUrl(this.dataAsText(), this.path());
        return this;
    }

    /**
     * Evaluates the resource as CSS.
     * @returns {SvUrlResource} The instance for chaining.
     * @category Evaluation
     */
    evalDataAsCss () {
        // Skip CSS evaluation in Node.js since there's no DOM
        if (SvPlatform.isNodePlatform()) {
            // console.log(this.logPrefix() + "⏭️  Skipping CSS evaluation in Node.js:", this.path());
            return;
        }

        const cssString = this.dataAsText(); // default decoding is to utf8
        // Use relative path for VSCode compatibility (no leading slash)
        // URL encode the path to handle spaces and special characters
        const encodedPath = encodeURI(this.path());
        const sourceUrl = `\n//# sourceURL=${encodedPath}`;
        const debugCssString = cssString + sourceUrl;
        //console.log(this.logPrefix() + "eval css: " +  entry.path)
        const element = document.createElement("style");
        element.type = "text/css";
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
        let data = this.data();
        if (typeof(data) === "string") {
            return data;
        }

        if (this.isZipFile()) {
            data = this.unzippedData();
        }

        // Handle invalid data types in Node.js gracefully

        if (SvPlatform.isNodePlatform()) {
            if (!data || (typeof data !== "object") || (!data.constructor || (data.constructor.name !== "Uint8Array" && data.constructor.name !== "ArrayBuffer"))) {
                // Gracefully handle non-ArrayBuffer data in Node.js
                if (typeof data === "object" && data !== null) {
                    return JSON.stringify(data);
                }
                return String(data || "");
            }
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
        const pako = SvGlobals.globals().pako;
        if (!pako) {
            throw new Error("pako library not loaded - call promiseLoadUnzipIfNeeded() first");
        }
        return pako.inflate(this.data());
    }

    /**
     * Loads the unzip library if needed.
     * @returns {Promise<void>} A promise that resolves when the unzip library is loaded.
     * @category Zip Handling
     */
    async promiseLoadUnzipIfNeeded () {
        if (!SvGlobals.globals().pako) {
            await SvUrlResource.clone().setPath(SvResourceManager.bootPath() + "/external-libs/pako.js").promiseLoadAndEval();
        }
    }

    isLoaded () {
        return this._data !== null;
    }

}).initThisClass();
