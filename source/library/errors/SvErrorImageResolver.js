"use strict";

/**
 * @class SvErrorImageResolver
 * @extends ProtoClass
 * @classdesc Resolves error image paths by searching in priority order:
 * 1. Application directory (app/resources/images/errors/)
 * 2. Framework directory (strvct/resources/images/errors/)
 * 3. Default fallback image
 *
 * This allows app-specific custom images while providing sensible defaults.
 */
(class SvErrorImageResolver extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true);
        return this;
    }

    /**
     * @description Initialize the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Array} searchPaths
         * @category Configuration
         */
        {
            const slot = this.newSlot("searchPaths", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {String} defaultImageName
         * @category Configuration
         */
        {
            const slot = this.newSlot("defaultImageName", "default-error.svg");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initialize the instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setupSearchPaths();
        return this;
    }

    /**
     * @description Configure the search paths in priority order
     * @category Configuration
     */
    setupSearchPaths () {
        this.setSearchPaths([
            "app/resources/images/errors/deferred/",
            "strvct/resources/images/errors/"
        ]);
        return this;
    }

    /**
     * @description Resolves an image filename to a full path
     * @param {String} imageName - The image filename (e.g., "auth-lock.svg")
     * @returns {String|null} The resolved path or null if not found
     * @category Resolution
     */
    resolveImagePath (imageName) {
        if (!imageName) {
            return this.resolveDefaultImage();
        }

        // Try each search path in order
        for (const basePath of this.searchPaths()) {
            const fullPath = basePath + imageName;
            if (this.doesImageExist(fullPath)) {
                return fullPath;
            }
        }

        // Fall back to default image
        return this.resolveDefaultImage();
    }

    /**
     * @description Resolve the default fallback image
     * @returns {String|null} The path to the default image or null
     * @category Resolution
     */
    resolveDefaultImage () {
        const defaultPath = "strvct/resources/images/errors/" + this.defaultImageName();
        if (this.doesImageExist(defaultPath)) {
            return defaultPath;
        }
        return null;
    }

    /**
     * @description Check if an image exists at the given path
     * @param {String} path - The path to check
     * @returns {Boolean} True if the image exists
     * @category Utilities
     */
    doesImageExist (path) {
        // In the browser environment, we use the resource manager to check if a resource exists
        if (SvGlobals.has("SvResourceManager")) {
            const resourceManager = SvResourceManager.shared();
            const resource = resourceManager.resourceForPath(path);
            return resource !== null && resource !== undefined;
        }

        // Fallback: assume path exists (will fail gracefully during load)
        return true;
    }

    /**
     * @description Get the full URL for an image path
     * @param {String} path - The relative path to the image
     * @returns {String} The full URL to the image
     * @category Utilities
     */
    urlForPath (path) {
        if (!path) {
            return null;
        }

        // If running in browser, construct URL relative to site root
        if (SvPlatform.isBrowserPlatform()) {
            const baseUrl = window.location.origin;
            return baseUrl + "/" + path;
        }

        return path;
    }

    /**
     * @description Resolve an image name to a full URL
     * @param {String} imageName - The image filename
     * @returns {String|null} The full URL to the image or null
     * @category Resolution
     */
    resolveImageUrl (imageName) {
        const path = this.resolveImagePath(imageName);
        return this.urlForPath(path);
    }

}).initThisClass();
