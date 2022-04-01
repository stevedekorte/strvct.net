
const fs = require("fs")
const path = require("path")
const args = process.argv
const dirPath = args[2]

class Folder {
    init () {
        this._path = null
    }

    path () {
        return this._path
    }

    setPath (aString) {
        this._path = aString
        return this
    }

    resourceFiles () {
        let files = fs.readdirSync(dirPath)
        files = files.filter(name => name.indexOf(".") !== 0) // doesn't begin with dot
        files = files.filter(name => name.indexOf(".") !== -1) // does have a dot
        files = files.filter(name => name.indexOf("_") !== 0) // doesn't begin with _
        return files
    }

    writeImportFile () {
        const jsonString = JSON.stringify(this.resourceFiles(), 2, 2)
        fs.writeFileSync(path.join(this.path(), "_imports.js"), jsonString);
    }

}

const folder = new Folder()
folder.setPath(dirPath)
folder.writeImportFile()
