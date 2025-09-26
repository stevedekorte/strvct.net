/**
 * @module library.resources.files
 */

"use strict";

/**
 * @class SvResourceFolder
 * @extends BaseNode
 * @classdesc An abstraction for an individual file folder.
 * SvFileResources will setup all SvResourceFolders.
 */
(class SvResourceFolder extends BaseNode {
    
    /**
     * @description Initializes prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("path", null);
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype with default values.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("SvFileSystemFolder");
        this.setNoteIsSubnodeCount(true);
    }

    /**
     * @description Initializes the instance.
     * @returns {SvResourceFolder} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Gets the name of the folder.
     * @returns {string} The folder name.
     * @category Information
     */
    name () {
        return this.path().lastPathComponent()
    }

    /**
     * @description Gets the title of the folder.
     * @returns {string} The folder title.
     * @category Information
     */
    title () {
        return this.name();
    }

    /**
     * @description Sets up subnodes for the folder.
     * @returns {SvResourceFolder} The current instance.
     * @category Node Management
     */
    setupSubnodes () {
        return this;
    }

    /**
     * @description Checks if the folder is a parent of the given path.
     * @param {string} aPath - The path to check.
     * @returns {boolean} True if the folder is a parent of the path, false otherwise.
     * @category Path Management
     */
    isParentOfPath (aPath) {
        const checkPath = this.path() + "/";
        return (checkPath.indexOf(aPath) === 0);
    }

    /**
     * @description Adds a relative resource path to the folder.
     * @param {string} aPath - The relative path to add.
     * @returns {SvResourceFolder|SvResourceFile} The added resource.
     * @category Resource Management
     */
    addRelativeResourcePath (aPath) {
        return this.addRelativeResourcePathArray(aPath.split("/"))
    }

    /**
     * @description Adds a relative resource path array to the folder.
     * @param {string[]} pathArray - The relative path array to add.
     * @returns {SvResourceFolder|SvResourceFile} The added resource.
     * @category Resource Management
     */
    addRelativeResourcePathArray (pathArray) {
        pathArray = pathArray.slice();

        //const fullPath = this.path() + "/" + pathArray.join("/")

        if (pathArray.length === 1) { // it's a file
            const fileName = pathArray.first();
            const oldFile = this.fileWithName(fileName);
            if (oldFile) {
                return oldFile;
            }

            return this.addSubnodeForFileName(fileName); // we assume all paths are to files, not folders
        } else {

            // must be a folder
            const subfolderName = pathArray.first();
            const subfolder = this.addSubnodeForFolderNameCreateIfAbsent(subfolderName);
            pathArray.shift();
            const file = subfolder.addRelativeResourcePathArray(pathArray);
            return file
        }
    }

    /**
     * @description Checks if the folder has a subfolder with the given name.
     * @param {string} aName - The name of the subfolder to check.
     * @returns {boolean} True if the subfolder exists, false otherwise.
     * @category Node Management
     */
    hasSubfolderNamed (aName) {
        const subfolder = this.subfolderWithName(aName);
        return subfolder !== null;
    }

    /**
     * @description Adds a subfolder with the given name, or returns an existing one.
     * @param {string} subfolderName - The name of the subfolder to add or retrieve.
     * @returns {SvResourceFolder} The subfolder.
     * @category Node Management
     */
    addSubnodeForFolderNameCreateIfAbsent (subfolderName) {
        const subfolder = this.subfolderWithName(subfolderName);
        if (subfolder) {
            return subfolder;
        }
        return this.addSubnodeForFolderName(subfolderName);
    }

    /**
     * @description Adds a new subfolder with the given name.
     * @param {string} aName - The name of the subfolder to add.
     * @returns {SvResourceFolder} The newly added subfolder.
     * @throws {Error} If the folder name is empty or contains a slash.
     * @category Node Management
     */
    addSubnodeForFolderName (aName) {
        if (aName.length === 0) {
            throw new Error("empty folder name");
        }
        if (aName.indexOf("/") !== -1) {
            throw new Error("folder name contains /");
        }
        const fullPath = this.path() + "/" + aName;
        const subfolder = SvResourceFolder.clone().setPath(fullPath);
        this.addSubnode(subfolder);
        return subfolder;
    }

    /**
     * @description Logs the folder's path and its subnodes' names.
     * @category Debugging
     */
    show () {
        const subnodeNames = this.subnodes().map(sn => sn.name())
        this.log(" '" + this.path() + "': " +  JSON.stringify(subnodeNames))
    }

    /**
     * @description Gets the class name for folders.
     * @returns {string} The folder class name.
     * @category Information
     */
    folderClassName () {
        return "SvResourceFolder";
    }

    /**
     * @description Gets all subfolders.
     * @returns {SvResourceFolder[]} An array of subfolders.
     * @category Node Management
     */
    subfolders () {
        return this.subnodes().filter(node => node.svType() === this.folderClassName())
    }

    /**
     * @description Alias for subfolders().
     * @returns {SvResourceFolder[]} An array of subfolders.
     * @category Node Management
     */
    folders () {
        return this.subfolders();
    }

    /**
     * @description Gets a subfolder with the given name.
     * @param {string} aName - The name of the subfolder to retrieve.
     * @returns {SvResourceFolder|null} The subfolder, or null if not found.
     * @category Node Management
     */
    subfolderWithName (aName) {
        return this.subfolders().detect(subnode => subnode.name() === aName)
    }

    /**
     * @description Alias for subfolderWithName().
     * @param {string} aName - The name of the subfolder to retrieve.
     * @returns {SvResourceFolder|null} The subfolder, or null if not found.
     * @category Node Management
     */
    folderAt (aName) {
        return this.subfolderWithName(aName);
    }

    /**
     * @description Adds a new file with the given name.
     * @param {string} fileName - The name of the file to add.
     * @returns {SvResourceFile} The newly added file.
     * @category Node Management
     */
    addSubnodeForFileName (fileName) {
        const file = SvResourceFile.clone().setPath(this.path() + "/" + fileName);
        this.addSubnode(file);
        return file;
    }

    /**
     * @description Gets the class name for files.
     * @returns {string} The file class name.
     * @category Information
     */
    fileClassName () {
        return "SvResourceFile";
    }

    /**
     * @description Gets all files in the folder.
     * @returns {SvResourceFile[]} An array of files.
     * @category Node Management
     */
    files () {
        return this.subnodes().filter(sn => sn.thisClass().isKindOf(SvResourceFile));
    }
    
    /**
     * @description Gets the names of all files in the folder.
     * @returns {string[]} An array of file names.
     * @category Information
     */
    fileNames () {
        return this.files().map(file => file.name());
    }

    /**
     * @description Gets a file with the given name.
     * @param {string} aName - The name of the file to retrieve.
     * @returns {SvResourceFile|null} The file, or null if not found.
     * @category Node Management
     */
    fileWithName (aName) {
        return this.subnodes().detect(sn => sn.name() === aName)
    }

    /**
     * @description Alias for fileWithName().
     * @param {string} aName - The name of the file to retrieve.
     * @returns {SvResourceFile|null} The file, or null if not found.
     * @category Node Management
     */
    fileAt (aName) {
        return this.subnodes().detect(sn => sn.name() === aName);
    }

    /**
     * @description Gets all resource files in the folder and its subfolders.
     * @returns {SvResourceFile[]} An array of all resource files.
     * @category Resource Management
     */
    allResourceFiles () {
        return this.leafSubnodes().filter(node => node.thisClass().isKindOf(SvResourceFile));
    }

    /**
     * @description Gets a resource at the given path.
     * @param {string} aPath - The path of the resource to retrieve.
     * @returns {SvResourceFile|SvResourceFolder|null} The resource, or null if not found.
     * @category Resource Management
     */
    resourceAtPath (aPath) {
        const pathArray = aPath.split("/");
        const first = pathArray.shift();
        const localResource = this.fileWithName(first);

        if (pathArray.length === 0) {
            return localResource;
        }

        return localResource.resourceAtPath(pathArray.join("/"));
    }

    /**
     * @description Gets all resources with the given name.
     * @param {string} aName - The name of the resources to retrieve.
     * @returns {SvResourceFile[]} An array of resources with the given name.
     * @category Resource Management
     */
    resourcesWithName (aName) {
        return this.allResourceFiles().filter(file => file.name() === aName);
    }

    /**
     * @description Gets a single resource with the given name.
     * @param {string} aName - The name of the resource to retrieve.
     * @returns {SvResourceFile} The resource with the given name.
     * @throws {Error} If more than one resource is found with the given name.
     * @category Resource Management
     */
    resourceWithName (aName) {
        const files = this.resourcesWithName(aName)
        assert(files.length === 1, "expected one file with name '" + aName + "', got: " + files.length);
        return files.first();
    }

    /**
     * @description Precaches resources where appropriate.
     * @returns {Promise<void>} A promise that resolves when precaching is complete.
     * @category Resource Management
     */
    async prechacheWhereAppropriate () {
       // this.log(".prechacheWhereAppropriate() " + this.path());
        await this.subnodes().promiseParallelMap(async (node) => node.prechacheWhereAppropriate());
    }

}.initThisClass());