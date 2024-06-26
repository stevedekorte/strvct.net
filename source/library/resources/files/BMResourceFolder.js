"use strict";

/*

    BMResourceFolder

    An abstraction for an individual file folder.

    BMFileResources will setup all BMResourceFolders.

*/

(class BMResourceFolder extends BaseNode {
    
    initPrototypeSlots () {
        this.newSlot("path", null);
    }

    initPrototype () {
        this.setTitle("BMFileSystemFolder");
        this.setNoteIsSubnodeCount(true);
    }

    init () {
        super.init()
        //this.registerForAppDidInit()
        return this
    }

    name () {
        return this.path().lastPathComponent()
    }

    title () {
        return this.name()
    }

    setupSubnodes () {
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
        return this.subnodes().filter(sn => sn.thisClass().isKindOf(BMResourceFile));
    }

    fileWithName (aName) {
        return this.subnodes().detect(sn => sn.name() === aName)
    }

    fileAt (aName) {
        return this.subnodes().detect(sn => sn.name() === name)
    }

    allResourceFiles () {
        return this.leafSubnodes().filter(node => node.thisClass().isKindOf(BMResourceFile));
    }

    resourceAtPath (aPath) {
        const pathArray = aPath.split("/");
        // remove first component 
        const first = pathArray.shift();
        const localResource = this.fileWithName(first);

        if (pathArray.length === 0) {
            return localResource;
        }

        return localResource.resourceAtPath(pathArray.join("/"));
        //return this.allResourceFiles().detect(file => file.path() === aPath);
    }

    resourcesWithName (aName) {
        return this.allResourceFiles().filter(file => file.name() === aName);
    }

    async prechacheWhereAppropriate() {
        console.log(this.type() + ".prechacheWhereAppropriate() " + this.path());
        await this.subnodes().promiseParallelMap(async (node) => node.prechacheWhereAppropriate());
    }

}.initThisClass());
