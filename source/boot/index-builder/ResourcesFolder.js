/**
 * @module IndexBuilder
 * @class ResourcesFolder
 * @extends Object
 * @classdesc A class to manage a folder containing resources.
*/

const fs = require("fs");
const nodePath = require("path");

class ResourcesFolder extends Object {
    /**
     * @category Initialization
     */
    init () {
        this._path = null
        this._isDebugging = true
    }

    /**
     * @category Debugging
     */
    isDebugging () {
        return this._isDebugging
    }

    /**
     * @category Debugging
     */
    debugLog (s) {
        if (this.isDebugging()) {
            console.log(s)
        }
    }

    /**
     * @category Path Management
     */
    path () {
        return this._path
    }

    /**
     * @category Path Management
     */
    setPath (aString) {
        this._path = aString
        return this
    }

    // --- general purpose ---

    /**
     * @category File Operations
     */
    fileNames () {
        const allNames = fs.readdirSync(this.path()).filter(name => name !== ".DS_Store")
        const names = allNames.filter(name => {
            const itemPath = nodePath.join(this.path(), name)
            return fs.statSync(itemPath).isFile()

        })
        return names
    }

    /**
     * @category Folder Operations
     */
    subfolderNames () {
        const allNames = fs.readdirSync(this.path()).filter(name => name !== ".DS_Store");
        const names = allNames.filter(name => {
            const itemPath = nodePath.join(this.path(), name);
            return fs.statSync(itemPath).isDirectory();
        });
        return names;
    }

    /**
     * @category Folder Operations
     */
    subfolders () {
        return this.subfolderNames().map(name => {
            const itemPath = nodePath.join(this.path(), name);
            const thisClass = this.constructor;
            const folder = new thisClass().setPath(itemPath);
            return folder;
        })
    }

    /*
    allSubfolders () {
        const subfolders = this.subfolders()
        let all = []
        subfolders.forEach(subfolder => {
            all.concat(subfolder.allSubfolders())
        })
        return all
    }

    selfAndAllSubfolders () {
        const all = this.allSubfolders()
        all.unshift(this)
        return all
    }
    */

    // -- imports specific ---

    /**
     * @category Resource Management
     */
    resourceFileNames () {
        let files = this.fileNames()
        files = files.filter(name => name.indexOf(".") !== 0); // doesn't begin with dot
        files = files.filter(name => name.indexOf(".") !== -1); // does have a dot
        files = files.filter(name => name.indexOf("_") !== 0);   // doesn't begin with _
        return files;
    }

    /**
     * @category Import Generation
     */
    recursivelyCreateImports () {
        const isRecursive = true;
        this.writeRecursiveImportFile();
        this.subfolders().forEach(folder => folder.recursivelyCreateImports());
        return this;
    }

    /*
    writeImportFile () {
        this.setImportsArray(this.resourceFileNames());
    }
    */

    /**
     * @category Import Generation
     */
    writeRecursiveImportFile () {
        const fileNames = this.resourceFileNames();
        const folderImports = this.subfolderNames().map(name => {
            return nodePath.join(name, "_imports.json");
        })
        const all = fileNames.concat(folderImports);
        this.setImportsArray(all);
        return this;
    }

    /**
     * @category Import Generation
     */
    setImportsArray (anArray) {
        const jsonString = JSON.stringify(anArray, null, 2);
        const path = nodePath.join(this.path(), "_imports.json");
        fs.writeFileSync(path, jsonString);
        return this
    }
}

module.exports = ResourcesFolder;