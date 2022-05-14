"use strict";

/*

   ImportsIndexer.js  (runs in node.js)

   Recursively walks _imports.json files
   to construct top level _imports_index.json file with format:

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


class IndexBuilder { 
    constructor () {
        this._paths = [] 
    }

    paths () {
        return this._paths
    }

    // --- build ---

    run () {
        this.readImports()
        this.makeBuildFolder()
        this.writeIndex()
        this.writeCam()
        this.compressCam()
    }

    // --- imports ---

    importsFileName () {
        return "_imports.json"
    }

    readImports () {
        this.readImportsPath(this.importsFileName())
    }

    readImportsPath (importsPath) {
        const folder = nodePath.dirname(importsPath)
        const s = fs.readFileSync(importsPath,  "utf8")
        const json = JSON.parse(s)
        const fullPaths = json.map(path => nodePath.join(folder, path))

        // put all paths in the list of paths

        // add any _imports.json files (in reverse order) to head of queue
        fullPaths.forEach(fullPath => {
            //this.paths().push(fullPath)
            if (nodePath.basename(fullPath) === this.importsFileName()) {
                this.readImportsPath(fullPath)
            } else {
                this.paths().push(fullPath)
            }
        })
    }

    // --- out files ---

    buildFolderPath () {
        return nodePath.join(process.cwd(), "build")
    }

    makeBuildFolder () {
        const path = this.buildFolderPath()
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }
        return this
    }

    // --- index ---

    indexFileName () {
        return "_index.json"
    }

    outIndexPath () {
        return nodePath.join(this.buildFolderPath(), this.indexFileName())
    }

    writeIndex () {
        const outPath = this.outIndexPath()
        const index = this.paths().map(path => this.indexEntryForPath(path))
        const data = JSON.stringify(index, 2, 2)
        fs.writeFileSync(outPath, data, "utf8")
    }

    hashForString (data) {
        const secret = ""
        const sha256Hasher = crypto.createHmac("sha256", secret);
        const hash = sha256Hasher.update(data).digest("base64");
        return hash
    }

    indexEntryForPath (path) {
        const fullPath = nodePath.join(process.cwd(), path)

        if (!fs.existsSync(path)) {
            throw new Error("missing path '" + path + "'")    
        }

        const data = fs.readFileSync(fullPath,  "utf8")
        const size = fs.statSync(fullPath).size
        const hash = this.hashForString(data)

        const entry = {
            path: path,
            size: size,
            hash: hash
        }
        return entry
    }

    // --- out cam file ---

    camFileName () {
        return "_cam.json"
    }

    outCamPath () {
        return nodePath.join(this.buildFolderPath(), this.camFileName())
    }

    writeCam () {
        const paths = this.pathsWithExtensions(["js", "css", "svg"])
        const cam = {}
        paths.forEach(path => {
            const fullPath = nodePath.join(process.cwd(), path)
            const value = fs.readFileSync(fullPath,  "utf8") // TODO: encode this in case it's binary?
            const hash = this.hashForString(value)
            cam[hash] = value
        })
        const data = JSON.stringify(cam, 2, 2)
        fs.writeFileSync(this.outCamPath(), data, "utf8")
    }

    pathsWithExtensions (exts) {
        return this.paths().filter(path => {
            const pathExt = path.split(".").pop().toLowerCase()
            return exts.indexOf(pathExt) !== -1
        })
    }

    compressCam () {
        const inputData = fs.readFileSync(this.outCamPath(),  "utf8")
        zlib.gzip(inputData, (error, zippedData) => {
            if (!error) {
                fs.writeFileSync(this.outCamPath() + ".zip", zippedData)
            } else {
                throw new Error(error)
            }
        });
    }
}

new IndexBuilder().run()

