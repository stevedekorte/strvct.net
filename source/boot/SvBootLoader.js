// test
"use strict";

/**
 * @module boot
 * @class SvBootLoader
 * @extends Object
 * @description Manages the loading of JavaScript files in a specific order during the boot process.
 * Files are loaded in parallel and then evaluated sequentially.
 */

class SvBootLoader extends Object {

  static _files = [
    "SvWindowErrorPanel.js",
    "categories/Object_categorySupport.js",
    "categories/Object_boot.js",
    "SvHelpers.js",
    "categories/URL_promises.js",
    "categories/Array_promises.js",
    "categories/ArrayBuffer_ideal.js",
    "SvUrlResource.js",
    "SvBootLoadingView.js",
    "SvResourceManager.js",
    "SvBase.js",
    "categories/Promise_ideal.js",
    "browser-only/SvIndexedDbFolder.js",
    "browser-only/SvIndexedDbTx.js",
    "server-only/SvIndexedDbFolder.js",
    "server-only/SvIndexedDbTx.js",
    "SvHashCache.js" // important that this be after SvIndexedDbFolder/Tx so it can be used
    //"pako.js" // loaded lazily first time SvUrlResource is asked to load a .zip file
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
    //await SvHashCache.shared().promiseClear(); console.log("🔍 Cleared SvHashCache");

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
    await StrvctFile.asyncLoadAndSequentiallyEvalPaths(this.fullPaths());
    await SvResourceManager.shared().setupAndRun();
  }

}

SvGlobals.set("SvBootLoader", SvBootLoader);

//await SvBootLoader.asyncRun();
