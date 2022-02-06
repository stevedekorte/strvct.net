"use strict";

/*
   IndexBuilder.js
   
   This script builds a index.html file for the app
   containing all the css and js file content.
  
   The resulting index.html (with the font and icon folders) 
   should be able to run the app on it's own.
   
*/

const path = require("path");
const fs = require("fs")
require("./helpers.js")
require("./SourceFolder.js")


class IndexBuilder { 
    constructor() {
        this._filePaths = []
        this._importPaths = []
        this._cssPaths = []
        this._resourceFilePaths = []
    }

    filePaths() {
        return this._filePaths
    }

    importPaths() {
        return this._importPaths
    }

    cssPaths() {
        return this._cssPaths
    }

    run() {
        console.log("IndexBuilder: finding imports")
        this.addImportPath("../_imports.js")
        //this.readImports()
        this.createIndex()
    }

    addFilePath(aFullPath) {
        this.filePaths().push(aFullPath)
    }

    addImportPath(aPath) {
        this.addFilePath(aPath)
        const folder = new SourceFolder()
        folder.setFullPath(aPath)
        folder.setIndexBuilder(this)
        folder.open()

        //this.importPaths().push(aPath)
    }

    addCssPath(aPath) {
        this.cssPaths().push(aPath)
    }

    addResourceFilePath(aPath) {
        // since indexbuilder isn't on top level, but index.html will be,
        // we need to fix the path
        aPath = aPath.replaceAll("../", "./") 
        this._resourceFilePaths.push(aPath)
    }

    stringForPath (path) {
        const s = fs.readFileSync(path,  "utf8")
        const extension = path.split(".").pop().toLowerCase()
        if (extension === "js") {
            return "{\n" + s + "\n};\n"
        }
        return s
    }

    stringForPaths(filePaths) {
        return filePaths.map(path =>  this.stringForPath(path)).join("\n")
    }

    allScriptPaths() {
        const scriptPaths =  []
        scriptPaths.push("../source/boot/getGlobalThis.js")
        scriptPaths.push("../source/boot/Base.js")
        scriptPaths.push("../source/boot/CssLink.js")
        scriptPaths.push("../source/boot/JsScript.js")
        scriptPaths.push("../source/boot/ResourceLoaderPanel.js")
        scriptPaths.push("../source/boot/ResourceLoader.js")
        scriptPaths.appendItems(this.filePaths())
        return scriptPaths
    }

    createIndex() {
        console.log("IndexBuilder: inserting imports between templates to create index.html")
        console.log(this.filePaths().join("\n"))

        const css      = this.stringForPaths(this.cssPaths())
        const script   = this.stringForPaths(this.allScriptPaths()) + "\nResourceLoader.shared().setResourceFilePaths(" + JSON.stringify(this._resourceFilePaths) + ");\n"
        let index = this.stringForPaths(["template.html"])
        index = index.replaceAll("/* INSERT CSS HERE */", css)
        index = index.replaceAll("/* INSERT SCRIPT HERE */", script)

        //console.log(index)
        fs.writeFileSync("../index.html", index, "utf8")
        console.log("IndexBuilder: SUCCESS: created index.html")
    }
}


new IndexBuilder().run() 

