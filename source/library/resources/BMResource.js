"use strict";

/*

    BMResource

*/

(class BMResource extends BaseNode {
    
    // --- supported mime types ---

    static supportedMimeTypes () {
        //throw new Error("subclasses should override this method")
        return new Set();
    }

    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType);
    }

    static openMimeChunk (dataChunk) {
         throw new Error("subclasses should override this method");
        //const aNode = this.clone();
        //setValue(dataChunk);
        //console.log(dataChunk.mimeType() + " data.length: " + dataChunk.decodedData().length);
        //return aNode;
    }

    // --- supported extension types ---

    static supportedExtensions () {
        throw new Error("subclasses should override this method");
        return [];
    }

    static canHandleExtension (extension) {
        return this.supportedExtensions().contains(extension);
    }

    // ---

    initPrototypeSlots () {
        this.newSlot("path", "");
        this.newSlot("data", null);
        this.newSlot("error", null);
        this.newSlot("loadState", "unloaded"); // "unloaded", "loading", "decoding", "loaded"
        this.newSlot("loadProgress", null); // null or a number 0 to 100
        this.newSlot("isLoaded", false);
        this.newSlot("urlResource", null);
    }

    /*
    init () {
        super.init()
    }
    */

    title () {
        return this.name();
    }

    subtitle () {
        return this.path().pathExtension();
    }

    subtitle () {
        return this.path().pathExtension() + ", " + this.loadState();
    }

    name () {
        return this.path().lastPathComponent().sansExtension();
    }

    // --- resource file ---

    /*
    fileResource () {
        const rootFolder = BMFileResources.shared().rootFolder();
        const fileResource = rootFolder.nodeAtSubpathString(this.path());
        return fileResource;
    }

    async promiseLoadFileResource () {        
        this.setTitle(this.path().lastPathComponent().sansExtension());
        
        const fileResource = this.fileResource();
        if (!fileResource) {
          const error = "no index for file resource at path '" + this.path() + "'"
          this.setError(error);
          throw new Error(error);
        }
        await fileResource.promiseLoad();
        this.onFileResourceLoaded(fileResource);
    }
    
    onFileResourceLoaded (fileResource) {
        this.setData(fileResource.data());
        this.postNoteNamed("resourceLoaded");
        this.setLoadState("loaded");
        this.didLoad();
        return this;
    }
    */

    // --- load ---

    loadIfNeeded () {
        if (this.loadState() === "unloaded") {
            this.load();
        }
        return this;
    }

    async load () {
        await this.promiseLoadUrlResource();
        //this.promiseLoadFileResource()
        return this;
    }

    async promiseLoadUrlResource () {
        const urlResource = await this.urlResource().promiseLoad();
        this.setData(this.urlResource().data());
        this.postNoteNamed("resourceLoaded");
        this.setLoadState("loaded");
        this.didLoad();
    }
    
    didLoad () {
        this.setIsLoaded(true);
        this.postNoteNamed("didLoad");
    }

}.initThisClass());
