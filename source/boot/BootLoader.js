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
      this._promiseCompleted = new Promise(async (resolve, reject) => {
        await SvPlatform.promiseReady();
        await StrvctFile.asyncLoadAndSequentiallyEvalPaths(this.fullPaths());
        await ResourceManager.shared().setupAndRun();
        resolve();
      });
    }
    return this._promiseCompleted;
  }

}

SvGlobals.set("BootLoader", BootLoader);

BootLoader.asyncRun();
