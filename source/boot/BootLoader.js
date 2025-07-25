"use strict";

/**
 * @module boot
 * @class BootLoader
 * @extends Object
 * @description Manages the loading of JavaScript files in a specific order during the boot process.
 * Files are loaded in parallel and then evaluated sequentially.
 */

class BootLoader extends Object {

  static _files = [
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
  ];
  static _bootPath = "strvct/source/boot";
  static _promiseCompleted = null;

  static fullPaths () {
    const fullPaths = this._files.map(filePath => {
      return this._bootPath
        ? `${this._bootPath}/${filePath.replace(/^\//, '')}`
        : filePath;
    });
    return fullPaths;
  }

  static async asyncRun () {
    if (this._promiseCompleted === null) {
      this._promiseCompleted = new Promise((resolve, reject) => {
        this.asyncBegin().then(() => {
          resolve();
        }).catch(reject);
      });
    }
    return this._promiseCompleted;
  }

  static async asyncBegin () {
    await SvPlatform.promiseReady();

    /*
    if (SvPlatform.isBrowserPlatform()) {
      console.log("document.body.style.backgroundColor = ", document.body.style.backgroundColor);
      document.body.style.backgroundColor = "black";
    }
    */
    await SvPlatform.asyncWaitForNextRender(); // let the background color get rendered first?
    //debugger;
    await StrvctFile.asyncLoadAndSequentiallyEvalPaths(this.fullPaths());
    await ResourceManager.shared().setupAndRun();
  }

}

SvGlobals.set("BootLoader", BootLoader);

//await BootLoader.asyncRun();
