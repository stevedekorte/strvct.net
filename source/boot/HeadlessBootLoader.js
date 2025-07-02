"use strict";

/**
 * @module boot
 * @class HeadlessBootLoader  
 * @extends Object
 * @description Cross-platform version of BootLoader that works in both browser and Node.js.
 * Uses StrvctFile abstraction for unified file loading.
 */

// Load dependencies
require('./StrvctFile.js');

class HeadlessBootLoader extends Object {
  /**
   * @constructor
   * @description Initializes the HeadlessBootLoader _files and _bootPath ivars.
   */
  constructor() {
    super();
    /**
     * @private
     * @type {string[]}
     * @description An array of file paths to be loaded.
     */
    this._files = [];

    /**
     * @private
     * @type {string}
     * @description The base path for loading files.
     */
    this._bootPath = '';
  }

  /**
   * @method setFiles
   * @category Configuration
   * @param {string[]} filePaths - An array of file paths to be loaded.
   * @throws {Error} If filePaths is not an array.
   * @returns {HeadlessBootLoader} The current HeadlessBootLoader instance for chaining.
   */
  setFiles(filePaths) {
    if (!Array.isArray(filePaths)) {
      throw new Error('filePaths must be an array');
    }
    this._files = filePaths;
    return this;
  }

  /**
   * @method setBootPath
   * @category Configuration
   * @param {string} path - The base path for loading files.
   * @throws {Error} If path is not a string.
   * @returns {HeadlessBootLoader} The current HeadlessBootLoader instance for chaining.
   */
  setBootPath(path) {
    if (typeof path !== 'string') {
      throw new Error('Boot path must be a string');
    }
    this._bootPath = path.replace(/\/$/, ''); // Remove trailing slash if present
    return this;
  }

  /**
   * @method loadFile
   * @category File Loading
   * @param {string} filePath - The path of the file to load.
   * @returns {Promise<{path: string, content: string}>} A promise that resolves with the file path and content.
   */
  async loadFile(filePath) {
    const fullPath = this._bootPath
      ? `${this._bootPath}/${filePath.replace(/^\//, '')}`
      : filePath;
    
    try {
      const content = await StrvctFile.loadFile(fullPath);
      return { path: filePath, fullPath: fullPath, content: content };
    } catch (error) {
      console.error(`Failed to load: ${fullPath}`, error);
      throw error;
    }
  }

  /**
   * @method loadParallelEvalSequential
   * @category File Loading
   * @description Loads all files in the _files array in parallel, then evaluates them sequentially.
   * @returns {Promise<void>} A promise that resolves when all files are loaded and evaluated.
   */
  async loadParallelEvalSequential() {
    console.log('Starting parallel file loading...');
    
    // Load all files in parallel
    const loadPromises = this._files.map(filePath => this.loadFile(filePath));
    
    try {
      const fileContents = await Promise.all(loadPromises);
      console.log('All files loaded successfully, starting sequential evaluation...');
      
      // Evaluate files sequentially
      for (const { path, fullPath, content } of fileContents) {
        console.log(`Evaluating file: ${path}`);
        StrvctFile.evalWithSourceUrl(content, fullPath);
      }
      
      console.log('All boot files loaded and evaluated successfully');
    } catch (error) {
      console.error('Error during file loading or evaluation:', error);
      throw error;
    }
  }

  /**
   * @static
   * @method boot
   * @category Boot Process
   * @description Initializes and runs the boot sequence for both browser and Node.js.
   * @returns {Promise<void>} A promise that resolves when the boot sequence is complete.
   */
  static async boot() {
    const bootLoader = new HeadlessBootLoader();
    
    // Set appropriate boot path for environment
    if (StrvctFile.isNodeEnvironment()) {
      bootLoader.setBootPath("source/boot");
    } else {
      bootLoader.setBootPath("strvct/source/boot");
    }
    
    bootLoader.setFiles([
      "getGlobalThis.js",
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
    
    return bootLoader.loadParallelEvalSequential();
  }

  /**
   * @static
   * @method bootForNode
   * @category Boot Process
   * @description Boots the framework in Node.js environment and optionally loads additional resources.
   * @param {string} [importsPath] - Optional path to _imports.json for loading additional framework files
   * @returns {Promise<void>} A promise that resolves when boot sequence is complete.
   */
  static async bootForNode(importsPath = null) {
    if (!StrvctFile.isNodeEnvironment()) {
      throw new Error('bootForNode() can only be called in Node.js environment');
    }

    console.log('Booting STRVCT framework for Node.js...');
    
    // Boot the essential framework files
    await this.boot();
    
    // Optionally load additional framework files via imports
    if (importsPath) {
      console.log(`Loading additional framework files from: ${importsPath}`);
      
      // Use HeadlessBoot for imports walking if available
      if (typeof HeadlessBoot !== 'undefined') {
        const boot = HeadlessBoot.shared();
        await boot.loadFromPath(importsPath);
      } else {
        console.warn('HeadlessBoot not available for imports loading');
      }
    }
    
    console.log('STRVCT framework boot complete');
  }

  /**
   * @static
   * @method bootOnWindowLoad
   * @category Boot Process
   * @description Sets up an event listener to start the boot sequence when the window is fully loaded.
   * Only works in browser environment.
   */
  static async bootOnWindowLoad() {
    if (!StrvctFile.isBrowserEnvironment()) {
      console.warn('bootOnWindowLoad() can only be called in browser environment');
      return;
    }

    window.addEventListener('load', () => {
      return HeadlessBootLoader.boot().then(async () => {
        console.log("Boot sequence complete");
        if (typeof ResourceManager !== 'undefined') {
          await ResourceManager.shared().setupAndRun();
        }
      });
    });
  }
}

// Make HeadlessBootLoader globally available
if (typeof global !== 'undefined') {
    global.HeadlessBootLoader = HeadlessBootLoader;
} else if (typeof window !== 'undefined') {
    window.HeadlessBootLoader = HeadlessBootLoader;
}

module.exports = HeadlessBootLoader;