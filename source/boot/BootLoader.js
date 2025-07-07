"use strict";

/**
 * @module boot
 * @class BootLoader
 * @extends Object
 * @description Manages the loading of JavaScript files in a specific order during the boot process.
 * Files are loaded in parallel and then evaluated sequentially.
 */

if (SvGlobals === undefined) {
    throw new Error("SvGlobals is not defined");
}

class BootLoader extends Object {
  /**
   * @constructor
   * @description Initializes the BootLoader _files and _bootPath ivars.
   */
  constructor () {
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
   * @returns {BootLoader} The current BootLoader instance for chaining.
   */
  setFiles (filePaths) {
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
   * @returns {BootLoader} The current BootLoader instance for chaining.
   */
  setBootPath (path) {
    if (typeof path !== 'string') {
      throw new Error('Boot path must be a string');
    }
    this._bootPath = path.replace(/\/$/, ''); // Remove trailing slash if present
    return this;
  }


  /**
   * @method loadAndEvalAllFiles
   * @category File Loading
   * @description Loads all files in the _files array and evaluates them using StrvctFile methods.
   * @returns {Promise<void>} A promise that resolves when all files are loaded and evaluated.
   */
  async loadAndEvalAllFiles () {
    console.log('Starting boot file loading and evaluation...');
    
    // Build full paths
    const fullPaths = this._files.map(filePath => {
      return this._bootPath
        ? `${this._bootPath}/${filePath.replace(/^\//, '')}`
        : filePath;
    });
    
    try {
      // Use StrvctFile's batch loading method
      await StrvctFile.asyncLoadAndSequentiallyEvalPaths(fullPaths);
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
   * @description Initializes and runs the boot sequence.
   * @returns {Promise<void>} A promise that resolves when the boot sequence is complete.
   */
  static boot () {
    console.log("BootLoader.boot: starting boot sequence");
    //debugger;
    const bootLoader = new BootLoader();
    bootLoader.setBootPath("strvct/source/boot/");
    bootLoader.setFiles([
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
      "HashCache.js" // important that this be after IndexedDBFolder/Tx so it can be used
      //"pako.js" // loaded lazily first time UrlResource is asked to load a .zip file
    ]);
    return bootLoader.loadAndEvalAllFiles();
  }

  // start when ready

  static isOnNodeJs () {
    return typeof process !== 'undefined';
  }

  static async startWhenReady () {
    if (this.isOnNodeJs()) {
      await this.startWhenReadyOnNode();
    } else {
      await this.startWhenReadyInBrowser();
    }
  }

  static async startWhenReadyOnNode () {
    //console.log("startWhenReadyOnNode: starting BootLoader on Node");
    // In Node.js, we can start immediately since the process is already ready
    // Wait for next tick to ensure all modules are loaded
    process.nextTick(() => {
      //debugger;
      //console.log("Node.js ready: starting BootLoader");
      this.justStart();
    });
  }


  static async startWhenReadyInBrowser () {
    console.log("startWhenReadyInBrowser: starting BootLoader in browser");
    window.addEventListener('load', () => {
      // This event is fired when the entire page, including all dependent resources such as stylesheets and images, is fully loaded.
      //console.log('window.load event: other resources finished loading, starting ResourcesManager now.');
       this.justStart();
    });
  }

  static async justStart () {
    return BootLoader.boot().then(async () => {
      console.log("Boot sequence complete. Starting ResourceManager.");
      await ResourceManager.shared().setupAndRun()
    });
  }
}

SvGlobals.set("BootLoader", BootLoader);

BootLoader.startWhenReady();
