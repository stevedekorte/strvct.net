"use strict";

/**
 * @module IndexBuilder
 * @class ImportsIndexer
 * @extends Object
 * @classdesc Builds an index of resources from _imports.json files.
 *  Runs in node.js.
 *  
 *  Recursively walks _imports.json files
 *  to construct top level _imports_index.json file with format:

       [
            {
                path: aString, // relative to root path
                size: aNumber, // useful for controlling loading behavior
                hash: aHash // used to look up contents in cam dictionary (see below)
            },
            ...
        ]

   Also builds a _cam.json (Content Addressable Memory) file with format:

    {
        "<aHash>": {
            data: aString,
            // room for meta data
        },
        ...
    }

    which only contains entries for JS and CSS files. 

    A zipped version of cam file is also produced.

    Use:

    The root index.html file just needs to run ResourceManager.js which 
    will load the above two files and eval the JS and CSS code to start
    the app.
   
*/

// --------------------------------------------------

const nodePath = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");
const process = require('process');


class ImportsIndexer { 
    /**
     * @constructor
     * @category Initialization
     */
    constructor () {
        this._paths = [];
        this._isDebugging = true;
    }

    /**
     * @returns {boolean}
     * @category Debugging
     */
    isDebugging () {
        return this._isDebugging;
    }

    /**
     * @param {string} s
     * @category Debugging
     */
    debugLog (s) {
        if (this.isDebugging()) {
            console.log(s);
        }
    }

    /**
     * @returns {string[]}
     * @category Data Access
     */
    paths () {
        return this._paths;
    }

    /**
     * @category Execution
     */
    run () {
        this.readImports();
        this.makeBuildFolder();
        this.writeIndex();
        this.writeCam();
        this.compressCam();
        //this.writePackage();
        process.exitCode = 0;  // vscode wants an explicit exit for prelaunch tasks
    }

    /**
     * @returns {string}
     * @category File Operations
     */
    importsFileName () {
        return "_imports.json";
    }

    /**
     * @category File Operations
     */
    readImports () {
        this.readImportsPath(this.importsFileName());
    }

    /**
     * @param {string} importsPath
     * @category File Operations
     */
    readImportsPath (importsPath) {
        const folder = nodePath.dirname(importsPath);
        // check if file exists
        if (!fs.existsSync(importsPath)) {
            // let's show the current working directory
            console.log("current working directory: " + process.cwd());
            console.log("file does not exist: " + importsPath);
            // and the full path
            console.log("full path: " + nodePath.join(process.cwd(), importsPath));
            throw new Error("file does not exist: " + importsPath);
        }
        const s = fs.readFileSync(importsPath,  "utf8");
        const json = JSON.parse(s);
        if (!Array.isArray(json)) {
            throw new Error("imports.json file at '" + importsPath + "' must contain an array");
        }
        const fullPaths = json.map(path => nodePath.join(folder, path));

        // put all paths in the list of paths

        // add any _imports.json files (in reverse order) to head of queue
        fullPaths.forEach(fullPath => {
            //this.paths().push(fullPath)
            if (nodePath.basename(fullPath) === this.importsFileName()) {
                this.readImportsPath(fullPath);
            } else {
                this.paths().push(fullPath);
            }
        })
    }

    /**
     * @returns {string}
     * @category File Operations
     */
    buildFolderPath () {
        return nodePath.join(process.cwd(), "build");
    }

    /**
     * @returns {ImportsIndexer}
     * @category File Operations
     */
    makeBuildFolder () {
        const path = this.buildFolderPath();
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        return this;
    }

    /**
     * @returns {string}
     * @category File Operations
     */
    indexFileName () {
        return "_index.json"
    }

    /**
     * @returns {string}
     * @category File Operations
     */
    outIndexPath () {
        return nodePath.join(this.buildFolderPath(), this.indexFileName());
    }

    /**
     * @returns {Object[]}
     * @category Data Processing
     */
    computeIndex () {
        return this.paths().map(path => this.indexEntryForPath(path));
    }

    /**
     * @category File Operations
     */
    writeIndex () {
        const outPath = this.outIndexPath();
        const index = this.computeIndex();
        const data = JSON.stringify(index, null, 2);
        fs.writeFileSync(outPath, data, "utf8");
        this.writeHashForPath(outPath);
    }

    /**
     * @param {string} path
     * @returns {Object}
     * @category Data Processing
     */
    indexEntryForPath (path) {
        const fullPath = nodePath.join(process.cwd(), path);

        if (!fs.existsSync(path)) {
            throw new Error("missing path '" + path + "'");
        }

        const data = fs.readFileSync(fullPath);
        const size = fs.statSync(fullPath).size;
        const hash = this.hashForData(data);

        const entry = {
            path: path,
            size: size,
            hash: hash
        };

        return entry;
    }

    /**
     * @returns {string}
     * @category File Operations
     */
    camFileName () {
        return "_cam.json";
    }

    /**
     * @returns {string}
     * @category File Operations
     */
    outCamPath () {
        return nodePath.join(this.buildFolderPath(), this.camFileName());
    }

    /**
     * @returns {Object}
     * @category Data Processing
     */
    computeCam () {
        const paths = this.pathsWithExtensions(["js", "css", "svg", "json", "txt"]); // file extensions to include in cam
        const cam = {};
        paths.forEach(path => {
            const fullPath = nodePath.join(process.cwd(), path);
            const value = fs.readFileSync(fullPath,  "utf8"); // TODO: encode this in case it's binary?
            const hash = this.hashForData(value);
            cam[hash] = value;
        });
        return cam;
    }

    /**
     * @category File Operations
     */
    writeCam () {
        const cam = this.computeCam();
        const data = JSON.stringify(cam, null, 2);
        fs.writeFileSync(this.outCamPath(), data, "utf8");
    }

    /**
     * @param {string[]} exts
     * @returns {string[]}
     * @category Data Processing
     */
    pathsWithExtensions (exts) {
        return this.paths().filter(path => {
            const pathExt = path.split(".").pop().toLowerCase();
            return exts.indexOf(pathExt) !== -1;
        })
    }

    /**
     * @returns {string}
     * @category File Operations
     */
    compressedCamPath () {
        return this.outCamPath() + ".zip";
    }

    /**
     * @category File Operations
     */
    compressCam () {
        this.compressPath(this.outCamPath());
    }

    /**
     * @param {string} path
     * @category File Operations
     */
    compressPath (path) {
        const outPath = path + ".zip";
        const inputData = fs.readFileSync(path,  "utf8");

        zlib.gzip(inputData, (error, zippedData) => {
            if (!error) {
                fs.writeFileSync(outPath, zippedData);
                this.writeHashForPath(outPath);
            } else {
                throw new Error(error);
            }
        });
    }

    /**
     * @param {string|Buffer} data
     * @returns {string}
     * @category Data Processing
     */
    hashForData (data) {
        //const hash = await crypto.subtle.digest("SHA-256", this);
        const hash = crypto.createHash('sha256').update(data).digest("base64");
        return hash;
    }

    /**
     * @param {string} path
     * @category File Operations
     */
    writeHashForPath (path) {
        const outPath = path + ".hash";
        const inputData = fs.readFileSync(path);
        const hash = this.hashForData(inputData);
        fs.writeFileSync(outPath, hash);
    }
}

new ImportsIndexer().run();
//process.exitCode = 0  // vscode wants an explicit exit for prelaunch tasks
//process.exit(); // this may stop process before file ops complete