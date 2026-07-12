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
        // Follow SvBootLoader's (overridable) boot path so standalone boots —
        // e.g. headless tests run from the strvct root — can relocate it.
        // Defaults to the submodule layout ("strvct/source/boot").
        const bootLoader = SvGlobals.globals().SvBootLoader;
        if (bootLoader && bootLoader._bootPath) {
            return bootLoader._bootPath + "/";
        }
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
        this._indexHash = null;
        this._indexResources = null;
        this._undeferredResources = null;
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
        // Start the single-transaction cache warm-load now so it overlaps the
        // index fetch; promiseLoadCamIfNeeded awaits the same shared promise.
        if (SvGlobals.has("SvHashCache")) {
            SvHashCache.shared().promiseWarmLoad();
        }
        await this.promiseLoadIndex();
        this.bootPerfMark("indexLoaded");
        await this.promiseLoadCamIfNeeded();
        this.bootPerfMark("camReady");
        await this.evalIndexResources();
        return this;
    }

    /**
     * @category Performance Tracking
     * @description Records a boot timing mark if the SvBootPerf recorder is present.
     * @param {string} name - The mark name.
     */
    bootPerfMark (name) {
        if (SvGlobals.has("SvBootPerf")) {
            SvGlobals.get("SvBootPerf").mark(name);
        }
    }

    /**
     * @category Resource Loading
     * @description Loads the resource index.
     * @returns {Promise<void>}
     */
    async promiseLoadIndex () {
        const path = "build/_index.json";

        // The index is ~half an MB and was re-fetched over the network every
        // boot. The build writes a 64-byte sidecar hash file; fetching that
        // first lets warm boots serve the index itself from the hash cache.
        let resource = null;
        if (SvGlobals.has("SvHashCache")) {
            try {
                const hashResource = await SvUrlResource.with(path + ".hash").promiseLoad();
                const hash = hashResource.dataAsText().trim();
                if (/^[0-9a-f]{64}$/.test(hash)) {
                    this._indexHash = hash;
                    resource = await SvUrlResource.clone().setPath(path).setResourceHash(hash).promiseLoad();
                }
            } catch (error) {
                console.warn(this.logPrefix(), "index hash sidecar unavailable (" + error.message + ") — fetching index directly");
            }
        }
        if (!resource) {
            resource = await SvUrlResource.with(path).promiseLoad();
        }

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
        // memoized — updateBar() calls this once per resource load, and the
        // filter over the full index allocated a fresh array every call
        if (!this._undeferredResources) {
            this._undeferredResources = this._indexResources.filter(r => !r.canDefer());
        }
        return this._undeferredResources;
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

        // Load the whole cache into memory with a single getAll() transaction.
        // Boot-time reads (~1000 resources) are then served from memory instead
        // of one IndexedDB transaction per key; released in onDone().
        const warmMap = await hc.promiseWarmLoad();
        const cachedKeys = new Set(warmMap.keys());
        this.bootPerfMark("cacheChecked");

        for (const entry of camEntries) {
            if (!cachedKeys.has(entry.hash)) {
                missingBytes += entry.size;
            }
        }

        const missingRatio = totalBytes > 0 ? missingBytes / totalBytes : 1;

        if (missingRatio > SvResourceManager.camLoadThreshold()) {
            await this.promiseLoadCam();
        }

        // Garbage collect stale cache entries regardless of which path was taken
        // Use ALL index entries (not just CAM-eligible) so non-CAM resources
        // (e.g. binary files cached after network fetch) aren't incorrectly evicted
        const validHashes = new Set(this._index.map(e => e.hash));
        if (this._indexHash) {
            // the cached copy of the index itself lives under its own hash —
            // without this it would be evicted every boot
            validHashes.add(this._indexHash);
        }
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
                this.bootPerfMark("camDownloaded");

                // Store CAM content in memory for synchronous access
                this._camContent = cam;

                // Also store in SvHashCache for async access. One bulk transaction
                // for just the missing entries — the CAM keys are the build's own
                // content hashes, so no per-entry re-hash verification is needed.
                const hc = SvHashCache.shared();
                const cachedKeys = new Set(await hc.promiseAllKeys());
                const missingEntries = new Map();
                Reflect.ownKeys(cam).forEach((k) => {
                    if (!cachedKeys.has(k)) {
                        missingEntries.set(k, cam[k]);
                    }
                });
                await hc.promiseBulkPut(missingEntries);
                this.bootPerfMark("camStored");
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
        this.bootPerfMark("resourcesLoaded");

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
        if (this.shouldChunkJsEval()) {
            this.evalJsResourcesInChunks(jsResources);
        } else {
            await jsResources.promiseSerialForEach(async (r /*, index*/) => {
                //this.updateBar();
                //SvBootLoadingView.shared().setSubtitle(n + " / " + SvResourceManager.shared().updateUndeferredResourceCount());
                r.eval();
            });
        }
        this.bootPerfMark("resourcesEvaled");
        SvBootLoadingView.shared().setSubtitle("running app");
        console.log("\n--- Running App ---"); // _init.js has scheduled a timer to start the app when we return to event loop
        this.onDone();
    }

    /**
     * @category Resource Evaluation
     * @description Whether JS resources are evaluated in concatenated chunks
     * (one eval per ~64 files) instead of one eval per file. Chunking removes
     * the per-file eval/sourceURL-registration overhead (~840 files at boot)
     * but costs per-file source mapping: each chunk registers a single
     * sourceURL (_bootEvalChunks/chunk_N.js), so debugger breakpoints AND
     * runtime error-report stack traces land in chunk pseudo-files instead
     * of original paths.
     *
     * DEFAULT: per-file eval (decision 2026-07-11) — proper debugging always
     * wins over the eval-overhead saving. Chunking is OPT-IN for boot-perf
     * measurement via ?chunkEval=1 or localStorage.SvChunkEval = "1", and
     * should only become the default again once chunks carry real source
     * maps that restore per-file mapping.
     * Node keeps per-file eval — it uses indirect global eval with different
     * scoping semantics, and headless boot speed isn't the bottleneck.
     * @returns {boolean}
     */
    shouldChunkJsEval () {
        if (SvPlatform.isNodePlatform()) {
            return false;
        }
        try {
            if (new URLSearchParams(window.location.search).get("chunkEval") === "1") {
                return true;
            }
            if (window.localStorage && localStorage.getItem("SvChunkEval") === "1") {
                return true;
            }
        } catch (e) {
            // flag parsing must never break boot
        }
        return false;
    }

    /**
     * @category Resource Evaluation
     * @description Evaluates JS resources in load order as concatenated chunks.
     * Each file is wrapped in an IIFE, which gives it the same isolation it has
     * under per-file strict direct eval today: declarations don't leak between
     * files, `this` is undefined, strictness is inherited. A cursor global is
     * advanced after each file so that if a chunk throws, the failing file is
     * re-evaluated individually — reproducing the error with its own per-file
     * sourceURL for a precise report.
     * @param {Array<SvUrlResource>} jsResources - Resources in dependency order.
     */
    evalJsResourcesInChunks (jsResources) {
        const chunkSize = 64;
        const cursorKey = "_bootEvalChunkCursor";

        for (let i = 0; i < jsResources.length; i += chunkSize) {
            const chunk = jsResources.slice(i, i + chunkSize);
            const parts = chunk.map((r, j) => {
                return "// ---- " + r.path() + " ----\n" +
                    ";(function () {\n" + r.dataAsText() + "\n})();\n" +
                    "SvGlobals.update(\"" + cursorKey + "\", " + (i + j) + ");\n"; // update, not set — set() is define-once and throws on reassignment
            });
            const chunkIndex = Math.floor(i / chunkSize) + 1;
            const chunkName = "_bootEvalChunks/chunk_" + chunkIndex + ".js";

            SvGlobals.update(cursorKey, i - 1);
            try {
                evalStringFromSourceUrl(parts.join("\n"), chunkName);
                chunk.forEach(r => r.setDidEval(true));
            } catch (error) {
                // Everything up to and including the cursor completed; the next
                // file is the one that threw. Log the ORIGINAL error against
                // that file, then try a per-file re-eval for a precise per-file
                // sourceURL — but never let the re-eval MASK the original: a
                // file that failed partway (e.g. after registering its class
                // globally) fails the re-eval differently (redefine guard).
                const lastCompleted = SvGlobals.get(cursorKey);
                jsResources.slice(i, lastCompleted + 1).forEach(r => r.setDidEval(true));
                const failed = jsResources[lastCompleted + 1];
                if (failed && !failed.didEval()) {
                    console.error(this.logPrefix(), "chunk " + chunkName + " failed at " + failed.path() + ": " + error.message);
                    try {
                        failed.eval();
                    } catch (reEvalError) {
                        if (reEvalError.message !== error.message) {
                            console.error(this.logPrefix(), "(re-eval of " + failed.path() + " failed differently — file partially executed; original error above is the real one):", reEvalError.message);
                        } else {
                            throw reEvalError; // same failure, now with per-file sourceURL
                        }
                    }
                }
                throw error;
            }
            this.updateBar();
        }
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
        // Free the boot-time in-memory cache copy (~14MB); post-boot deferred
        // resource loads go back to per-key IndexedDB reads.
        if (SvGlobals.has("SvHashCache")) {
            SvHashCache.shared().releaseWarmMap();
        }
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

