"use strict";

/**
 * @module boot
 */

/**
 * @class SvResourceManager
 * @extends Object
 * @classdesc Singleton that supports loading, caching and evaluation of resources for the application.
 * Resources are primarily JS and CSS files, but can also include images, JSON, SVG, and other assets.
 */

(class SvResourceManager extends Object {

    /**
     * @category Initialization
     * @description Initializes the SvResourceManager class.
     * @returns {SvResourceManager} The initialized class.
     */
    static initThisClass () {
        SvGlobals.set("SvResourceManager", SvResourceManager);
        return this;
    }

    /**
     * @category Configuration
     * @description Returns the boot path for resources.
     * @returns {string} The boot path.
     */
    static bootPath () {
        return "strvct/source/boot/";
    }

    /**
     * @category Configuration
     * @description Returns the set of file extensions eligible for CAM storage.
     * @returns {Set<string>} The CAM-eligible extensions.
     */
    static camExtensions () {
        return new Set(["js", "css", "svg", "json", "txt"]);
    }

    /**
     * @category Configuration
     * @description Returns the missing-bytes ratio above which the full CAM bundle is loaded.
     * @returns {number} The threshold ratio (0 to 1).
     */
    static camLoadThreshold () {
        return 0.3;
    }

    /**
     * @category Instance Methods
     * @description Returns the type of the manager.
     * @returns {string} The type "SvResourceManager".
     */
    svType () {
        return "SvResourceManager";
    }

    /**
     * @category Instance Methods
     * @description Returns the boot path for this instance.
     * @returns {string} The boot path.
     */
    bootPath () {
        return SvResourceManager.bootPath();
    }

    /**
     * @category Static Methods
     * @description Returns a shared instance of SvResourceManager.
     * @returns {SvResourceManager} The shared instance.
     */
    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            const obj = new this();
            this._shared = obj;
            obj.init();
        }
        return this._shared;
    }

    /**
     * @category Utility Methods
     * @description Checks if the code is running in a browser environment.
     * @returns {boolean} True if in a browser, false otherwise.
     */
    isInBrowser () {
        return (typeof(document) !== "undefined");
    }

    /**
     * @category Initialization
     * @description Initializes the SvResourceManager instance.
     * @returns {SvResourceManager} The initialized instance.
     */
    init () {
        this._index = null;
        this._indexResources = null;
        this._idb = null;
        this._evalCount = 0;
        this._doneTime = null;
        this._promiseForLoadCam = null;
        this._camContent = null; // Store CAM content in memory for sync access
        this._filteredJsResources = null; // Cache filtered JS resources
        this._filteredCssResources = null; // Cache filtered CSS resources
        this._promiseCompleted = Promise.clone();
        return this;
    }

    promiseCompleted () {
        return this._promiseCompleted;
    }

    /**
     * @category Core Functionality
     * @description Runs the resource loading and evaluation process.
     * @returns {Promise<SvResourceManager>} A promise that resolves with the SvResourceManager instance.
     */
    async run () {
        this.onProgress("", 0);
        await this.promiseLoadIndex();
        await this.promiseLoadCamIfNeeded();
        await this.evalIndexResources();
        return this;
    }

    /**
     * @category Resource Loading
     * @description Loads the resource index.
     * @returns {Promise<void>}
     */
    async promiseLoadIndex () {
        const path = "build/_index.json";
        const resource = await SvUrlResource.with(path).promiseLoad();
        this._index = resource.dataAsJson();
        this._indexResources = this._index.map((entry) => {
            const resource = SvUrlResource.clone().setPath(entry.path).setResourceHash(entry.hash);
            assert(resource.path() === entry.path);
            assert(resource.resourceHash() === entry.hash);
            return resource;
        });
        this.updateUndeferredResourceCount();
    }

    undeferredResources () {
        return this._indexResources.filter(r => !r.canDefer());
    }

    updateUndeferredResourceCount () {
        return this._undeferredResourceCount = this.undeferredResources().length;
    }

    undeferredResourceCount () {
        return this._undeferredResourceCount;
    }

    /**
     * @category Resource Access
     * @description Returns the index resources.
     * @returns {Array<SvUrlResource>} The index resources.
     */
    indexResources () {
        return this._indexResources;
    }

    logPrefix () {
        return "[SvResourceManager]";
    }

    /**
     * @category Resource Access
     * @description Returns index entries whose file extensions are eligible for CAM storage.
     * @returns {Array<Object>} The CAM-eligible index entries.
     */
    camEligibleEntries () {
        const exts = SvResourceManager.camExtensions();
        return this._index.filter(entry => {
            const ext = entry.path.split(".").pop().toLowerCase();
            return exts.has(ext);
        });
    }

    /**
     * @category Resource Loading
     * @description Loads the full CAM bundle if the ratio of missing cached bytes exceeds the threshold.
     * Also garbage-collects stale cache entries regardless of which path is taken.
     * @returns {Promise<void>}
     */
    async promiseLoadCamIfNeeded () {
        if (SvPlatform.isNodePlatform()) {
            console.log("\n" + this.logPrefix(), "Clearing SvHashCache on Node.js...");
            await SvHashCache.shared().promiseClear();
        }

        const camEntries = this.camEligibleEntries();
        if (camEntries.length === 0) {
            return;
        }

        const hc = SvHashCache.shared();
        const totalBytes = camEntries.reduce((sum, e) => sum + e.size, 0);
        let missingBytes = 0;

        await camEntries.promiseParallelForEach(async (entry) => {
            const hasKey = await hc.promiseHasKey(entry.hash);
            if (!hasKey) {
                missingBytes += entry.size;
            }
        });

        const missingRatio = totalBytes > 0 ? missingBytes / totalBytes : 1;

        if (missingRatio > SvResourceManager.camLoadThreshold()) {
            await this.promiseLoadCam();
        }

        // Garbage collect stale cache entries regardless of which path was taken
        const validHashes = new Set(camEntries.map(e => e.hash));
        await hc.promiseRemoveKeysNotInSet(validHashes);
    }

    /**
     * @category Resource Loading
     * @description Loads the CAM.
     * @returns {Promise<void>}
     */
    async promiseLoadCam () {
        if (!this._promiseForLoadCam) {
            this._promiseForLoadCam = Promise.clone();
            try {
                const path = "build/_cam.json.zip";
                const resource = await SvUrlResource.clone().setPath(path).promiseLoad();
                const cam = resource.dataAsJson();

                // Store CAM content in memory for synchronous access
                this._camContent = cam;

                // Also store in SvHashCache for async access
                const camKeys = Reflect.ownKeys(cam);
                await camKeys.promiseParallelForEach(async (k) => {
                    const v = cam[k];
                    return SvHashCache.shared().promiseAtPut(k, v);
                });
                this._promiseForLoadCam.callResolveFunc();
            } catch (error) {
                console.error("❌ Error in promiseLoadCam:", error);
                this._promiseForLoadCam.callRejectFunc(error);
            }
        }
        return this._promiseForLoadCam;
    }

    /**
     * @category Resource Access
     * @description Finds a resource for a given path.
     * @param {string} path - The path to search for.
     * @returns {SvUrlResource|undefined} The found resource or undefined.
     */
    resourceForPath (path) {
        return this.indexResources().find(r => r.path() === path);
    }

    /**
     * @category Resource Access
     * @description Synchronously gets content from the CAM by hash.
     * @param {string} hash - The hash of the content.
     * @returns {string|null} The content or null if not in CAM.
     */
    syncContentForHash (hash) {
        if (!this._camContent) {
            return null;
        }
        return this._camContent[hash] || null;
    }

    /**
     * @category Resource Access
     * @description Synchronously gets content from the CAM by path.
     * @param {string} path - The path of the resource.
     * @returns {string|null} The content or null if not in CAM.
     */
    syncContentForPath (path) {
        const entry = this._index ? this._index.find(e => e.path === path) : null;
        if (!entry || !entry.hash) {
            return null;
        }
        return this.syncContentForHash(entry.hash);
    }

    /**
     * @category Resource Access
     * @description Filters resources by file extension.
     * @param {string} ext - The file extension to filter by.
     * @returns {Array<SvUrlResource>} Filtered resources.
     */
    resourcesWithExtension (ext) {
        return this.indexResources().filter(r => r.pathExtension() === ext);
    }

    /**
     * @category Resource Loading
     * @description Asynchronously retrieves data for a resource at a given path.
     * @param {string} path - The path of the resource.
     * @returns {Promise<*>} The data of the resource.
     */
    async asyncDataForResourceAtPath (path) {
        const resourceUrl = SvUrlResource.clone().setPath(SvResourceManager.bootPath() + "/" + path);
        await resourceUrl.promiseLoad();
        return resourceUrl.data();
    }

    /**
     * @category Resource Access
     * @description Returns all JavaScript resources filtered by environment.
     * @returns {Array<SvUrlResource>} JavaScript resources.
     */
    jsResources () {
        if (!this._filteredJsResources) {
            this._filteredJsResources = this.resourcesWithExtension("js").filter(r => this.shouldLoadResourceInCurrentEnvironment(r));
        }
        return this._filteredJsResources;
    }

    /**
     * @category Resource Access
     * @description Returns all CSS resources filtered by environment.
     * @returns {Array<SvUrlResource>} CSS resources.
     */
    cssResources () {
        if (!this._filteredCssResources) {
            this._filteredCssResources = this.resourcesWithExtension("css").filter(r => this.shouldLoadResourceInCurrentEnvironment(r));
        }
        return this._filteredCssResources;
    }

    /**
     * @category Resource Filtering
     * @description Determines if a resource should be loaded in the current environment using StrvctFile.
     * @param {SvUrlResource} resource - The resource to check.
     * @returns {boolean} True if the resource should be loaded.
     */
    shouldLoadResourceInCurrentEnvironment (resource) {
        const path = resource.path();
        const canUse = StrvctFile.with(path).canUseInCurrentEnv();

        /*
        if (!canUse) {
            const envName = SvPlatform.isNodePlatform() ? 'Node.js' : 'browser';
            const skipReason = SvPlatform.isNodePlatform() ? 'browser-only' : 'server-only';
            console.log(`⏭️  Skipping ${skipReason} resource in ${envName}: ${path}`);
        }
        */

        return canUse;
    }

    /**
     * @category Resource Evaluation
     * @description Evaluates all index resources (CSS and JS).
     * @returns {Promise<void>}
     */
    async evalIndexResources () {
        SvBootLoadingView.shared().setTitle("Loading...");
        SvBootLoadingView.shared().setSubtitle("fetching resources");

        const undeferredPromises = this.undeferredResources().map(r => r.promiseLoad());
        await Promise.all(undeferredPromises);

        /*
        // Load CSS resources in parallel
        const cssLoadPromises = this.cssResources().map(r => r.promiseLoad());

        // Load JS resources in parallel
        const jsLoadPromises = this.jsResources().map(r => r.promiseLoad());

        // Wait for all loads to complete
        await Promise.all([...cssLoadPromises, ...jsLoadPromises]);
        const cssCount = this.cssResources().length;
        //console.log("✅ All CSS and JS resources loaded");

        */

        //const cssCount = this.cssResources().length;
        // Now evaluate CSS in sequence (order matters for cascading)
        SvBootLoadingView.shared().setSubtitle("compiling");
        console.log("\n--- Evaluating CSS and JS ---");

        //SvBootLoadingView.shared().setTitle("Evaluating CSS...");
        this.cssResources().promiseSerialForEach(async (r /*, index*/) => {
            this.updateBar();
            r.eval();
        });

        const jsResources = this.jsResources().slice();
        // Now evaluate JS resources in sequence (order matters for dependencies)
        //await jsResources.promiseSerialTimeoutsForEach(async (r /*, index*/) => { // very slow this way!
        await jsResources.promiseSerialForEach(async (r /*, index*/) => {
            //this.updateBar();
            //SvBootLoadingView.shared().setSubtitle(n + " / " + SvResourceManager.shared().updateUndeferredResourceCount());
            r.eval();
        });
        SvBootLoadingView.shared().setSubtitle("running app");
        console.log("\n--- Running App ---"); // _init.js has scheduled a timer to start the app when we return to event loop
        this.onDone();
    }

    countOfEvaledUndeferredResources () {
        let count = 0;
        this.undeferredResources().forEach(r => {
            if (r.didEval()) {
                count ++;
            }
        });
        return count;
    }

    updateBar () {
        if (this._indexResources === null) {
            return;
        }
        const n = this.countOfEvaledUndeferredResources();
        const m = this.undeferredResourceCount();
        SvBootLoadingView.shared().setBarRatio(n / m);
        //SvBootLoadingView.shared().setSubtitle(n + " / " + m);
    }

    /**
     * @category Event Handling
     * @description Handles progress updates during resource loading.
     * @param {string} path - The path of the current resource being loaded.
     */
    onProgress (/*path*/) {
        this._evalCount++;
    }

    /**
     * @category Event Handling
     * @description Handles errors during resource loading.
     * @param {Error} error - The error that occurred.
     */
    onError (/*error*/) {
        //this.postEvent("resourceLoaderError", { error: error });
    }

    /**
     * @category Event Handling
     * @description Handles completion of resource loading.
     */
    onDone () {
        this.markPageLoadTime();
        this._promiseCompleted.callResolveFunc();
    }

    /**
     * @category Performance Tracking
     * @description Marks the page load time.
     */
    markPageLoadTime () {
        if (SvPlatform.isNodePlatform()) {
            return;
        }

        try {
            //console.log("markPageLoadTime: performance =", !!performance);
            //console.log("markPageLoadTime: performance.timing =", !!performance.timing);
            //console.log("markPageLoadTime: navigationStart =", performance.timing.navigationStart);
            this._pageLoadTime = new Date().getTime() - performance.timing.navigationStart;
            //console.log("markPageLoadTime: calculated pageLoadTime =", this._pageLoadTime);
        } catch (error) {
            console.error("❌ Error in markPageLoadTime:", error);
            console.error("Error type:", typeof error);
            this._pageLoadTime = 0; // fallback
            throw error;
        }
    }

    /**
     * @category Performance Tracking
     * @description Returns a description of the load time.
     * @returns {string} A formatted string describing the load time and resources.
     */
    loadTimeDescription () {
        if (SvPlatform.isNodePlatform()) {
            return "N/A";
        }

        return "" +
            Math.round(this._pageLoadTime / 100) / 10 + "s, " +
            Math.round(SvUrlResource._totalBytesLoaded / 1000) + "k, " +
            SvUrlResource._totalUrlsLoaded + " files";
    }

    /**
     * @category Resource Access
     * @description Returns the index entries.
     * @returns {Array<Object>} The index entries.
     */
    entries () {
        return this._index;
    }

    /**
     * @category Resource Access
     * @description Returns all resource file paths.
     * @returns {Array<string>} The resource file paths.
     */
    resourceFilePaths () {
        return this._index.map(entry => entry.path);
    }

    /**
     * @category Resource Access
     * @description Filters URL resources by multiple file extensions.
     * @param {Array<string>} extensions - The file extensions to filter by.
     * @returns {Array<SvUrlResource>} Filtered URL resources.
     */
    urlResourcesWithExtensions (extensions) {
        const extSet = extensions.asSet();
        return this.indexResources().filter(r => extSet.has(r.pathExtension()));
    }

    /**
     * @category Resource Access
     * @description Returns resource file paths filtered by multiple file extensions.
     * @param {Array<string>} extensions - The file extensions to filter by.
     * @returns {Array<string>} Filtered resource file paths.
     */
    resourceFilePathsWithExtensions (extensions) {
        return this.urlResourcesWithExtensions(extensions).map(r => r.path());
    }

    /**
     * @category Core Functionality
     * @description Sets up and runs the SvResourceManager.
     * @returns {Promise<SvResourceManager>} A promise that resolves with the SvResourceManager instance.
     */
    async setupAndRun () {
        await this.run();
        return this;
    }

}).initThisClass();

