"use strict";

const path = require("path");
const fs = require("fs")
require("./helpers.js")
require("./SourceFolder.js")


global.SourceFolder = class SourceFolder { 
    constructor() {
        this._fullPath = null
        /*
        this._importPaths = []
        this._filePaths = []
        this._cssPaths = []
        */
        this._indexBuilder = null
    }

    setFullPath(aString) {
        this._fullPath = aString
        return this
    }

    fullPath() {
        return this._fullPath
    }

    /*
    importPaths() {
        return this._importPaths
    }

    filePaths() {
        return this._filePaths
    }

    cssPaths() {
        return this._cssPaths
    }
    */

    setIndexBuilder(v) {
        this._indexBuilder = v
        return this
    }

    indexBuilder() {
        return this._indexBuilder
    }

    open() {
        const dirPath = this.fullPath().before("_imports.js")
        const data = fs.readFileSync(this.fullPath(),  "utf8");
        const s = data.between("resourceLoader.pushRelativePaths(", ")")
        const rPaths = eval(s)
        const builder = this.indexBuilder()

        rPaths.forEach((relativePath) => {
            const fullPath = path.join(dirPath, relativePath)

            if (fullPath.contains("_imports.js")) {
                builder.addImportPath(fullPath)
            } else if (fullPath.contains(".css")) {
                builder.addCssPath(fullPath)
            } else if (fullPath.contains(".js")) {
                builder.addFilePath(fullPath)
            } else {
                builder.addResourceFilePath(fullPath)
            }
        })
    }
}


