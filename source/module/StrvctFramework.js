"use strict";

/**
 * @module framework
 * @class StrvctFramework
 * @description Main entry point for the STRVCT framework when used as an npm module
 * Allows consumers to import/require the framework through a single entry point
 */

class StrvctFramework {
  /**
   * @constructor
   * @description Initializes a new StrvctFramework instance
   * @param {Object} [options={}] - Configuration options for the framework
   * @param {string} [options.rootPath='strvct'] - Path to the strvct directory
   * @param {boolean} [options.autoInitialize=true] - Whether to automatically initialize the framework
   */
  constructor(options = {}) {
    this._options = Object.assign({
      rootPath: 'strvct',
      autoInitialize: true
    }, options);
    
    this._isInitialized = false;
    this._bootLoader = null;
    this._resourceManager = null;
    
    if (this._options.autoInitialize) {
      this.initialize();
    }
  }
  
  /**
   * @method initialize
   * @description Initializes the framework, loading core files and resources
   * @returns {Promise<StrvctFramework>} A promise that resolves with the framework instance
   */
  async initialize() {
    if (this._isInitialized) {
      console.warn('StrvctFramework is already initialized');
      return this;
    }
    
    // Load the BootLoader
    this._bootLoader = await this._initializeBootLoader();
    
    // Load core files
    await this._bootLoader.loadParallelEvalSequential();
    
    // Initialize ResourceManager
    this._resourceManager = SvGlobals.globals().ResourceManager.shared();
    await this._resourceManager.setupAndRun();
    
    this._isInitialized = true;
    return this;
  }
  
  /**
   * @private
   * @method _initializeBootLoader
   * @description Creates and initializes the BootLoader
   * @returns {Promise<BootLoader>} A promise that resolves with the BootLoader instance
   */
  async _initializeBootLoader() {
    // We need to manually load the BootLoader class
    const bootLoaderScript = await fetch(`${this._options.rootPath}/source/boot/BootLoader.js`).then(r => r.text());
    const getGlobalThisScript = await fetch(`${this._options.rootPath}/source/boot/getGlobalThis.js`).then(r => r.text());
    
    // Evaluate getGlobalThis first, as BootLoader depends on it
    const evalGetGlobalThis = new Function(getGlobalThisScript);
    evalGetGlobalThis.call(window);
    
    // Now evaluate the BootLoader
    const evalBootLoader = new Function(bootLoaderScript);
    evalBootLoader.call(window);
    
    // Create and configure the BootLoader
    const bootLoader = new BootLoader();
    bootLoader.setBootPath(`${this._options.rootPath}/source/boot/`);
    bootLoader.setFiles([
      "SvGlobals.js", // Include again for completeness
      "Object_categorySupport.js",
      "Object_boot.js",
      "Helpers.js",
      "URL_promises.js",
      "Array_promises.js",
      "UrlResource.js",
      "BootLoadingView.js",
      "ResourceManager.js",
      "Base.js",
      "Promise_ideal.js",
      "IndexedDBFolder.js", 
      "IndexedDBTx.js",
      "HashCache.js"
    ]);
    
    return bootLoader;
  }
  
  /**
   * @method isInitialized
   * @description Returns whether the framework has been initialized
   * @returns {boolean} True if the framework is initialized, false otherwise
   */
  isInitialized() {
    return this._isInitialized;
  }
  
  /**
   * @method resourceManager
   * @description Returns the ResourceManager instance
   * @returns {ResourceManager|null} The ResourceManager instance, or null if not initialized
   */
  resourceManager() {
    return this._resourceManager;
  }
  
  /**
   * @method bootLoader
   * @description Returns the BootLoader instance
   * @returns {BootLoader|null} The BootLoader instance, or null if not initialized
   */
  bootLoader() {
    return this._bootLoader;
  }
}

// Handle both CommonJS and ES module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StrvctFramework;
} else if (typeof define === 'function' && define.amd) {
  define([], function() { return StrvctFramework; });
} else {
  window.StrvctFramework = StrvctFramework;
}