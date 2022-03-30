"use strict";

/*

   IndexBuilder.js
   
   This script builds a index.html file for the app
   containing all the css and js file content.
  
   The resulting index.html (with the font and icon folders) 
   should be able to run the app on it's own.

   source map comments are used so the debugger can refer to the 
   original files instead of the packaged code.
   
*/

// ------------------------------------------------------
// See: https://developer.chrome.com/blog/sourcemappingurl-and-sourceurl-syntax-changed/
// See: https://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
/*
String.prototype.base64Encoded = function () {
    return this.toString("base64");
}

String.prototype.base64UrlEncoded = function () {
    return this.base64Encoded().replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ",");
}
*/

/*
String.prototype.pathAsSourceMapUrl = function () {
    return "\n//# sourceURL=" + this + " \n"
}
*/

// --------------------------------------------------

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
    }

    resourceFilePaths () {
        const paths = ResourceLoader.shared().resourceFilePaths().slice()
        const rPaths = paths.filter(path => {
            const ext = path.split(".").pop().toLowerCase()
            return ["css", "js"].indexOf(ext) === -1
        })
        const results = rPaths.map(path => this.pathRelativetoCwd(path))
        return results
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

    // --- path ---

    pathRelativetoCwd (aFullPath) {
        const relativeToCwd = path.relative(process.cwd(), aFullPath)
        return "./" + relativeToCwd
    }

    // --- js ---

    addJsPaths (paths) {
        paths.forEach(path => this.addJsPath(path))
        return this
    }

    addJsPath(aFullPath) {
        this.jsPaths().push(this.pathRelativetoCwd(aFullPath))
    }

    // --- css ---

    addCssPaths (paths) {
        paths.forEach(path => this.addCssPath(path))
        return this
    }

    addCssPath(aFullPath) {
        this.cssPaths().push(this.pathRelativetoCwd(aFullPath))
    }

    // --- reading files ---

    /*
    addResourceFilePath (aPath) {
        // since indexbuilder isn't on top level, but index.html will be,
        // we need to fix the path
        aPath = aPath.replaceAll("../", "./") 
        this._resourceFilePaths.push(aPath)
    }
    */

    stringForPath (path) {
        return fs.readFileSync(path,  "utf8")
    }

    stringForCssPath (path) {
        const s = fs.readFileSync(path,  "utf8")
        //const comment = this.sourceMapStringForUrl(path)
        //const out = "\n" + s + comment + "\n"
        return s
    }

    stringForJsPath (path) {
        const sourceCode = fs.readFileSync(path,  "utf8")
        const sourceUrl = "\n//# sourceURL=" + path + " \n"
        const code = sourceCode + sourceUrl 
        let out = "    // " + path + "\n"
        //out += "    eval(" +  JSON.stringify(code) + ")\n"
        out += "    Function(" +  JSON.stringify(code) + ")()\n"
        return out
    }



    // --- index ---

    isInBrowser () {
        return (typeof(document) !== 'undefined')
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

    // --- component strings ---

    templateString () {
        const template = this.stringForPath(this.sourceFolderPath() + "/template.html")
        return template
    }

    cssString () {
        const css = this.cssPaths().map(path => this.stringForCssPath(path)).join("\n")
        return css
    }

    jsonForJsPath (path) {
        const sourceCode = fs.readFileSync(path,  "utf8")
        const sourceUrl = "\n//# sourceURL=" + path.slice(2) + " \n"
        const code = sourceCode + sourceUrl 
        const dict = { path: path, code: code }
        return dict
    }

    jsString () {
        const json = this.jsPaths().map(path => this.jsonForJsPath(path))
        let script = "const json = " + JSON.stringify(json, 2, 2) + ";\n\n"
        script += "json.forEach(dict => eval(dict.code));\n" // evals in global context
        //script += "json.forEach(dict => eval(dict.code));\n" // evals in global context
        script += "ResourceLoader.shared().setResourceFilePaths(" + JSON.stringify(this.resourceFilePaths(), 2, 2) + ");\n"
        return script
    }

    // --- build ---

    createIndex() {
        console.log("IndexBuilder: inserting imports between templates to create index.html")
        //console.log(this.jsPaths().join("\n"))

        let index = this.templateString()
        index = index.replaceAll("/* INSERT CSS HERE */", "\n" + this.cssString())
        index = index.replaceAll("/* INSERT SCRIPT HERE */", "\n" + this.jsString())

        fs.writeFileSync(this.outputFilePath(), index, "utf8")
        console.log("IndexBuilder: SUCCESS: created '" + this.outputFilePath() + "'")
    }

    outputFilePath () {
        return process.cwd() + "/index.html"
    }
}

