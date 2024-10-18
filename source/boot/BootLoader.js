"use strict";

/**
 * @module boot
 * @class BootLoader
 * @extends Object
 * @description Manages the loading of JavaScript files in a specific order during the boot process.
 * Files are loaded in parallel and then evaluated sequentially.
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
   * @category Configuration
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
   * @category Configuration
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
   * @category File Loading
   * @param {string} filePath - The path of the file to load.
   * @returns {Promise<{path: string, content: string}>} A promise that resolves with the file path and content.
   */
  loadFile(filePath) {
    const fullPath = this._bootPath
      ? `${this._bootPath}/${filePath.replace(/^\//, '')}`
      : filePath;
    
    console.log(`Attempting to load: ${fullPath}`);
    
    return fetch(fullPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load file: ${fullPath}`);
        }
        return response.text();
      })
      .then(content => {
        console.log(`Successfully loaded: ${fullPath}`);
        return { path: filePath, content: content };
      })
      .catch(error => {
        console.error(`Failed to load: ${fullPath}`, error);
        throw error;
      });
  }

  /**
   * @method loadParallelEvalSequential
   * @category File Loading
   * @description Loads all files in the _files array in parallel, then evaluates them sequentially.
   * @returns {Promise<void>} A promise that resolves when all files are loaded and evaluated.
   */
  loadParallelEvalSequential() {
    console.log('Starting parallel file loading...');
    
    // Load all files in parallel
    const loadPromises = this._files.map(filePath => this.loadFile(filePath));
    
    return Promise.all(loadPromises)
      .then(fileContents => {
        console.log('All files loaded successfully, starting sequential evaluation...');
        
        // Evaluate files sequentially
        return fileContents.reduce((promise, { path, content }) => {
          return promise.then(() => {
            console.log(`Evaluating file: ${path}`);
            const evalFunc = new Function(content);
            evalFunc.call(window); // Execute in the global scope
            console.log(`Finished evaluating: ${path}`);
          });
        }, Promise.resolve());
      })
      .then(() => {
        console.log('All files loaded and evaluated successfully');
      })
      .catch((error) => {
        console.error('Error during file loading or evaluation:', error);
        throw error;
      });
  }

  /**
   * @static
   * @method boot
   * @category Boot Process
   * @description Initializes and runs the boot sequence.
   * @returns {Promise<void>} A promise that resolves when the boot sequence is complete.
   */
  static boot() {
    const bootLoader = new BootLoader();
    bootLoader.setBootPath("strvct/source/boot/");
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
      "HashCache.js" // important that this be after IndexedDBFolder/Tx so it can be used
      //"pako.js" // loaded lazily first time UrlResource is asked to load a .zip file
    ]);
    return bootLoader.loadParallelEvalSequential();
  }

  /**
   * @static
   * @method bootOnWindowLoad
   * @category Boot Process
   * @description Sets up an event listener to start the boot sequence when the window is fully loaded.
   */
  static async bootOnWindowLoad() {
    window.addEventListener('load', () => {
      // This event is fired when the entire page, including all dependent resources such as stylesheets and images, is fully loaded.
      //console.log('window.load event: other resources finished loading, starting ResourcesManager now.');

      return BootLoader.boot().then(async () => {
        console.log("Boot sequence complete");
        await ResourceManager.shared().setupAndRun()
      });
    });
  }
}

BootLoader.bootOnWindowLoad();
