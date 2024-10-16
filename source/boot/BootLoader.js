"use strict";

/**
 * @module boot
 * @class BootLoader
 * @extends Object
 * @description Manages the loading of JavaScript files in a specific order during the boot process.
 */

class BootLoader extends Object {
  /**
   * @constructor
   * @description Initializes the BootLoader _files and _bootPath ivars.
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
   * @param {string[]} filePaths - An array of file paths to be loaded.
   * @throws {Error} If filePaths is not an array.
   * @returns {BootLoader} The current BootLoader instance for chaining.
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
   * @param {string} path - The base path for loading files.
   * @throws {Error} If path is not a string.
   * @returns {BootLoader} The current BootLoader instance for chaining.
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
   * @param {string} filePath - The path of the file to load.
   * @returns {Promise<void>} A promise that resolves when the file is loaded.
   */
  loadFile(filePath) {
    const fullPath = this._bootPath
      ? `${this._bootPath}/${filePath.replace(/^\//, '')}`
      : filePath;
    
    console.log(`Attempting to load: ${fullPath}`);
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = fullPath;
      script.onload = () => {
        console.log(`Successfully loaded: ${fullPath}`);
        resolve();
      };
      script.onerror = () => {
        console.error(`Failed to load: ${fullPath}`);
        reject(new Error(`Failed to load file: ${fullPath}`));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * @method loadSequentially
   * @description Loads all files in the _files array sequentially.
   * @returns {Promise<void>} A promise that resolves when all files are loaded.
   */
  loadSequentially() {
    console.log('Starting sequential file loading...');
    return this._files.reduce((promise, filePath) => {
      return promise.then(() => this.loadFile(filePath));
    }, Promise.resolve()).then(() => {
      console.log('All files loaded successfully');
    }).catch((error) => {
      console.error('Error during file loading:', error);
      throw error;
    });
  }

  /**
   * @static
   * @method boot
   * @description Initializes and runs the boot sequence.
   * @returns {Promise<void>} A promise that resolves when the boot sequence is complete.
   */
  static boot() {
    const bootLoader = new BootLoader();
    bootLoader.setBootPath("strvct/source/boot/");
    bootLoader.setFiles([
      "getGlobalThis.js",
      "Object-helpers.js",
      "Helpers.js",
      "URL_promises.js",
      "Array_promises.js",
      "UrlResource.js",
      "BootLoadingView.js",
      "ResourceManager.js"
      /*
      "Base.js",
      "Promise_ideal.js",
      "IndexedDBFolder.js",
      "IndexedDBTx.js",
      "HashCache.js" // important that this be after IndexedDBFolder/Tx so it can be used
      //"pako.js" // loaded lazily first time UrlResource is asked to load a .zip file
      */
    ]);
    return bootLoader.loadSequentially()
  }

  /**
   * @static
   * @method bootOnWindowLoad
   * @description Sets up an event listener to start the boot sequence when the window is fully loaded.
   */
  static bootOnWindowLoad() {
    window.addEventListener('load', () => {
      // This event is fired when the entire page, including all dependent resources such as stylesheets and images, is fully loaded.
      //console.log('window.load event: other resources finished loading, starting ResourcesManager now.');

      BootLoader.boot().then(() => {
        console.log("Boot sequence complete");
        ResourceManager.shared().setupAndRun()
      });
    });
  }
}

BootLoader.bootOnWindowLoad();
