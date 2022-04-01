"use strict";

/*

    BMResourceFolder

*/

(class BMResourceFolder extends BMNode {
    
    initPrototype () {
        this.newSlot("path", null)
    }

    init () {
        super.init()

        this.setTitle("BMFileSystemFolder")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        //this.watchOnceForNote("appDidInit")
        return this
    }

    name () {
        return this.path().lastPathComponent()
    }

    title () {
        return this.name()
    }

    setupSubnodes () {
        //this.resourcePaths().forEach(path => this.addFontWithPath(path))
        return this
    }

    isParentOfPath (aPath) {
        const checkPath = this.path() + "/"
        return (checkPath.indexOf(aPath) === 0)
    }

    addRelativeResourcePath (aPath) {
        return this.addRelativeResourcePathArray(aPath.split("/"))
    }

    addRelativeResourcePathArray (pathArray) {
        pathArray = pathArray.slice()

        const fullPath = this.path() + "/" + pathArray.join("/")
        //console.log("'" + this.path() + "' addRelativeResourcePathArray(", pathArray, ")")

        if (pathArray.length === 1) { // it's a file
            const fileName = pathArray.first()
            const oldFile = this.fileWithName(fileName)
            if (oldFile) {
                return oldFile
            }

            return this.addSubnodeForFileName(fileName) // we assume all paths are to files, not folders
        } else {

            // must be a folder
            const subfolderName = pathArray.first()
            const subfolder = this.addSubnodeForFolderNameCreateIfAbsent(subfolderName)
            pathArray.shift()
            const file = subfolder.addRelativeResourcePathArray(pathArray)
            return file
        }
    }

    // subfolders

    hasSubfolderNamed (aName) {
        const subfolder = this.subfolderWithName(subfolderName)
        return subfolder !== null
    }

    addSubnodeForFolderNameCreateIfAbsent (subfolderName) {
        const subfolder = this.subfolderWithName(subfolderName)
        if (subfolder) {
            return subfolder
        }
        return this.addSubnodeForFolderName(subfolderName)
    }

    addSubnodeForFolderName (aName) {
        if (aName.length === 0) {
            throw new Error("empty folder name")
        }
        if (aName.indexOf("/") !== -1) {
            throw new Error("folder name contains /")
        }
        //console.log("'" + this.path() + "' addSubnodeForFolderName '" + aName + "'")
        const fullPath = this.path() + "/" + aName
        const subfolder = BMResourceFolder.clone().setPath(fullPath)
        this.addSubnode(subfolder)
        //this.show()
        return subfolder
    }

    show () {
        const subnodeNames = this.subnodes().map(sn => sn.name())
        console.log(this.type() + " '" + this.path() + "': " +  JSON.stringify(subnodeNames))
    }

    folderClassName () {
        return "BMResourceFolder"
    }

    subfolders () {
        return this.subnodes().filter(node => node.type() === this.folderClassName())
    }

    folders () {
        return this.subfolders()
    }

    subfolderWithName (aName) {
        return this.subfolders().detect(subnode => subnode.name() === aName)
    }

    folderAt (aName) {
        return this.subfolderWithName(aName)
    }

    // files

    addSubnodeForFileName (fileName) {
        const file = BMResourceFile.clone().setPath(this.path() + "/" + fileName)
        this.addSubnode(file)
        return file
    }

    fileClassName () {
        return "BMResourceFile"
    }

    files () {
        return this.subnodes().filter(node => node.type() === this.fileClassName())
    }

    fileWithName (aName) {
        return this.subfolders().detect(subnode => subnode.name() === aName)
    }

    fileAt (aName) {
        return this.fileWithName(aName)
    }


}.initThisClass());
