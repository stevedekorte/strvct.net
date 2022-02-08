"use strict";

/*
   IndexBuilder.js
   
   This script builds a index.html file for the app
   containing all the css and js file content.
  
   The resulting index.html (with the font and icon folders) 
   should be able to run the app on it's own.
   
*/

//global.window = global

const path = require("path");
const fs = require("fs")
require("./helpers.js")
//require("../getGlobalThis.js")
require("../BootLoader.js")

BootLoader.shared().loadWithRequire()

//debugger

getGlobalThis().isBuildingIndex = true

getGlobalThis().IndexBuilder = class IndexBuilder { 
    constructor() {
        this._jsPaths = []
        this._cssPaths = []
        this._resourceFilePaths = []
    }

    jsPaths () {
        return this._jsPaths
    }

    cssPaths () {
        return this._cssPaths
    }
    
    run () {
        const r = ResourceLoader.shared()
        r.setFinalCallback(() => this.start())
        r.run()
    }

    start () {
        this.addJsPaths(BootLoader.shared().absolutePathFiles())
        this.addJsPaths(ResourceLoader.shared().jsFilesLoaded())
        this.addCssPaths(ResourceLoader.shared().cssFilesLoaded())
        this.createIndex()
    }

    // --- js ---

    addJsPaths (paths) {
        paths.forEach(path => this.addJsPath(path))
        return this
    }

    addJsPath(aFullPath) {
        this.jsPaths().push(aFullPath)
    }

    // --- css ---

    addCssPaths (paths) {
        paths.forEach(path => this.addCssPath(path))
        return this
    }

    addCssPath(aPath) {
        this.cssPaths().push(aPath)
    }

    // --- reading files ---

    /*
    addResourceFilePath(aPath) {
        // since indexbuilder isn't on top level, but index.html will be,
        // we need to fix the path
        aPath = aPath.replaceAll("../", "./") 
        this._resourceFilePaths.push(aPath)
    }
    */

    stringForPath (path) {
        const s = fs.readFileSync(path,  "utf8")
        const extension = path.split(".").pop().toLowerCase()
        if (extension === "js") {
            return "{\n" + s + "\n};\n"
        }
        return s
    }

    stringForPaths(paths) {
        return paths.map(path =>  this.stringForPath(path)).join("\n")
    }

    // --- index ---

    isInBrowser () {
        return (typeof (document) !== 'undefined')
    }

    sourceFolderPath () {
        if (this.isInBrowser()) {
            const script = document.currentScript;
            const fullUrl = script.src;
            const parts = fullUrl.split("/")
            parts.pop()
            const folder = parts.join("/")
            return folder
        } else { // we're in node
            return __dirname
        }
    }

    createIndex() {
        console.log("IndexBuilder: inserting imports between templates to create index.html")
        console.log(this.jsPaths().join("\n"))

        const css = this.stringForPaths(this.cssPaths())
        let script = this.stringForPaths(this.jsPaths()) 
        script += "\nResourceLoader.shared().setResourceFilePaths(" + JSON.stringify(this._resourceFilePaths) + ");\n"
        let index = this.stringForPaths([this.sourceFolderPath() + "/template.html"])
        index = index.replaceAll("/* INSERT CSS HERE */", css)
        index = index.replaceAll("/* INSERT SCRIPT HERE */", script)

        //console.log(index)
        fs.writeFileSync(this.outputFilePath(), index, "utf8")
        console.log("IndexBuilder: SUCCESS: created '" + this.outputFilePath() + "'")
    }

    outputFilePath () {
        return process.cwd() + "/index.html"
    }
}

