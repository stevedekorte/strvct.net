"use strict";

/**
 * @module boot
 */

/**
 * @class ResourceManager
 * @extends Object
 * @classdesc Singleton that supports loading, caching and evaluation of resources for the application.
 * Resources are primarily JS and CSS files, but can also include images, JSON, SVG, and other assets.
 */

(class ResourceManager extends Object {

    /**
     * @category Initialization
     * @description Initializes the ResourceManager class.
     * @returns {ResourceManager} The initialized class.
     */
    static initThisClass () {
        getGlobalThis().ResourceManager = ResourceManager;
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
     * @category Instance Methods
     * @description Returns the type of the manager.
     * @returns {string} The type "ResourceManager".
     */
    type () {
        return "ResourceManager";
    }

    /**
     * @category Instance Methods
     * @description Returns the boot path for this instance.
     * @returns {string} The boot path.
     */
    bootPath () {
        return ResourceManager.bootPath();
    }

    /**
     * @category Static Methods
     * @description Returns a shared instance of ResourceManager.
     * @returns {ResourceManager} The shared instance.
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
        return (typeof(document) !== 'undefined');
    }

    /**
     * @category Initialization
     * @description Initializes the ResourceManager instance.
     * @returns {ResourceManager} The initialized instance.
     */
    init () {
        this._index = null;
        this._indexResources = null;
        this._idb = null;
        this._evalCount = 0;
        this._doneTime = null;
        this._promiseForLoadCam = null;
        this._camContent = null; // Store CAM content in memory for sync access
        return this;
    }

    /**
     * @category Core Functionality
     * @description Runs the resource loading and evaluation process.
     * @returns {Promise<ResourceManager>} A promise that resolves with the ResourceManager instance.
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
        const resource = await UrlResource.with(path).promiseLoad();
        this._index = resource.dataAsJson();
        this._indexResources = this._index.map((entry) => {
            const resource = UrlResource.clone().setPath(entry.path).setResourceHash(entry.hash);
            assert(resource.path() === entry.path);
            assert(resource.resourceHash() === entry.hash);
            return resource;
        });
    }

    /**
     * @category Resource Access
     * @description Returns the index resources.
     * @returns {Array<UrlResource>} The index resources.
     */
    indexResources () {
        return this._indexResources;
    }

    /**
     * @category Resource Loading
     * @description Loads the CAM (Compressed Asset Manager) if needed.
     * @returns {Promise<void>}
     */
    async promiseLoadCamIfNeeded () {
        const count = await HashCache.shared().promiseCount();
        if (!count) {
            await this.promiseLoadCam();
        }
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
                const resource = await UrlResource.clone().setPath(path).promiseLoad();
                const cam = resource.dataAsJson();
                
                // Store CAM content in memory for synchronous access
                this._camContent = cam;
                
                // Also store in HashCache for async access
                await Reflect.ownKeys(cam).promiseSerialForEach((k) => {
                    const v = cam[k];
                    return HashCache.shared().promiseAtPut(k, v);
                });
                this._promiseForLoadCam.callResolveFunc();
            } catch (error) {
                this._promiseForLoadCam.callRejectFunc();
            }
        }
        return this._promiseForLoadCam;
    }

    /**
     * @category Resource Access
     * @description Finds a resource for a given path.
     * @param {string} path - The path to search for.
     * @returns {UrlResource|undefined} The found resource or undefined.
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
     * @returns {Array<UrlResource>} Filtered resources.
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
        const resourceUrl = UrlResource.clone().setPath(ResourceManager.bootPath() + "/" + path);
        await resourceUrl.promiseLoad();
        return resourceUrl.data();
    }

    /**
     * @category Resource Access
     * @description Returns all JavaScript resources.
     * @returns {Array<UrlResource>} JavaScript resources.
     */
    jsResources () {
        return this.resourcesWithExtension("js");
    }

    /**
     * @category Resource Access
     * @description Returns all CSS resources.
     * @returns {Array<UrlResource>} CSS resources.
     */
    cssResources () {
        return this.resourcesWithExtension("css");
    }

    /**
     * @category Resource Evaluation
     * @description Evaluates all index resources (CSS and JS).
     * @returns {Promise<void>}
     */
    async evalIndexResources () {
        let count = 0;

        await this.cssResources().promiseSerialForEach(async (r) => {
            return await r.promiseLoadAndEval();
        });

        await this.jsResources().promiseSerialForEach(async (r) => {
            count++;
            bootLoadingView.setBarToNofM(count, this.jsResources().length);
            return await r.promiseLoadAndEval();
        });

        this.onDone();
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
        getGlobalThis().bootLoadingView = bootLoadingView;
        this.markPageLoadTime();
    }

    /**
     * @category Performance Tracking
     * @description Marks the page load time.
     */
    markPageLoadTime () {
        this._pageLoadTime = new Date().getTime() - performance.timing.navigationStart;
    }

    /**
     * @category Performance Tracking
     * @description Returns a description of the load time.
     * @returns {string} A formatted string describing the load time and resources.
     */
    loadTimeDescription () {
        return "" + 
            Math.round(this._pageLoadTime/100)/10 + "s, " + 
            Math.round(UrlResource._totalBytesLoaded/1000) + "k, " + 
            UrlResource._totalUrlsLoaded + " files";
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
     * @returns {Array<UrlResource>} Filtered URL resources.
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
     * @description Sets up and runs the ResourceManager.
     * @returns {Promise<ResourceManager>} A promise that resolves with the ResourceManager instance.
     */
    async setupAndRun () {
        await this.run();
        return this;
    }

}).initThisClass();


