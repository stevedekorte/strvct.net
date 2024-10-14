"use strict";

class BootLoader {
  constructor() {
    this._files = [];
    this._bootPath = '';
  }

  setFiles(filePaths) {
    if (!Array.isArray(filePaths)) {
      throw new Error('filePaths must be an array');
    }
    this._files = filePaths;
    return this;
  }

  setBootPath(path) {
    if (typeof path !== 'string') {
      throw new Error('Boot path must be a string');
    }
    this._bootPath = path.replace(/\/$/, ''); // Remove trailing slash if present
    return this;
  }

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

  static boot() {
    const bootLoader = new BootLoader();
    bootLoader.setBootPath("strvct/source/boot/");
    bootLoader.setFiles([
      "getGlobalThis.js",
      "Object-helpers.js",
      "Helpers.js",
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
}



window.addEventListener('load', function() {
  // This event is fired when the entire page, including all dependent resources such as stylesheets and images, is fully loaded.
  //console.log('window.load event: other resources finished loading, starting ResourcesManager now.');

  BootLoader.boot().then(() => {
    console.log("Boot sequence complete");
    ResourceManager.shared().setupAndRun()
  });
});