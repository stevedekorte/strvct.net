// test
"use strict";

/** * @module boot
 */

/** * @class SvBootLoader
 * @extends Object
 * @description Manages the loading of JavaScript files in a specific order during the boot process.
 * Files are loaded in parallel and then evaluated sequentially.
 
 
 */


/** * @class SvBootPerf
 * @extends Object
 * @description Records named timing marks across the boot sequence and prints
 * one consolidated table when the app finishes initializing. Marks are stored
 * as {name, t} pairs from performance.now() so the recorder works identically
 * in the browser and headless Node (where performance may be a polyfill with
 * only now()). Native performance.mark() entries are also emitted when
 * available so the phases show up in browser profiler timelines.
 */
class SvBootPerf extends Object {

    static _marks = [];
    static _didReport = false;

    static now () {
        return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    }

    static mark (name) {
        this._marks.push({ name: name, t: this.now() });
        if (typeof performance !== "undefined" && typeof performance.mark === "function") {
            try {
                performance.mark("boot." + name);
            } catch (e) {
                // timing must never break boot
            }
        }
    }

    static report () {
        if (this._didReport || this._marks.length === 0) {
            return;
        }
        this._didReport = true;

        // In the browser performance.now() is already relative to page start,
        // so the first row's "took" covers HTML parse + synchronous scripts.
        // Under Node the polyfill returns epoch ms; rebase to the first mark.
        const base = (this._marks[0].t > 1e9) ? this._marks[0].t : 0;

        let prev = base;
        const rows = this._marks.map((m) => {
            const row = {
                phase: m.name,
                "took (ms)": Math.round(m.t - prev),
                "at (ms)": Math.round(m.t - base)
            };
            prev = m.t;
            return row;
        });

        const total = this._marks[this._marks.length - 1].t - base;
        console.log("[SvBootPerf] boot completed in " + (Math.round(total / 100) / 10) + "s");
        // Prefixed per-row lines so a console filter on "SvBootPerf" shows the
        // whole breakdown (console.table output doesn't match text filters).
        const nameWidth = Math.max(...rows.map(r => r.phase.length));
        rows.forEach(r => {
            console.log("[SvBootPerf] " + r.phase.padEnd(nameWidth) + "  took " + String(r["took (ms)"]).padStart(6) + "ms  (at " + r["at (ms)"] + "ms)");
        });
        if (typeof console.table === "function") {
            console.table(rows);
        }
    }

}

SvGlobals.set("SvBootPerf", SvBootPerf);


class SvBootLoader extends Object {

    static _files = [
        "SvWindowErrorPanel.js",
        "categories/Object_categorySupport.js",
        "categories/Object_boot.js",
        "SvHelpers.js",
        "categories/URL_promises.js",
        "categories/Array_promises.js",
        "categories/ArrayBuffer_sha256.js",
        "categories/Uint8Array_sha256.js",
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
                ? `${this._bootPath}/${filePath.replace(/^\//, "")}`
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
        SvBootPerf.mark("bootModulesLoaded");
        await SvPlatform.promiseReady();
        SvBootPerf.mark("pageReady");

        /*
        if (SvPlatform.isBrowserPlatform()) {
            console.log("document.body.style.backgroundColor = ", document.body.style.backgroundColor);
            document.body.style.backgroundColor = "black";
        }
        */
        await SvPlatform.asyncWaitForNextRender(); // let the background color get rendered first?
        SvBootPerf.mark("firstRender");
        await StrvctFile.asyncLoadAndSequentiallyEvalPaths(this.fullPaths());
        SvBootPerf.mark("bootFilesEvaled");
        await SvResourceManager.shared().setupAndRun();
    }

}

SvGlobals.set("SvBootLoader", SvBootLoader);

//await SvBootLoader.asyncRun();
