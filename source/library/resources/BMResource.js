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
        {
            const slot = this.newSlot("path", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("data", null);
            slot.setSlotType("Object");
        }

        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }
        {
            const slot = this.newSlot("loadState", "unloaded"); // "unloaded", "loading", "decoding", "loaded"
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("isLoaded", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("urlResource", null);
            slot.setSlotType("BMUrlResource");
        }

        {
            const slot = this.newSlot("loadDataPromise", null);
            slot.setSlotType("Promise");
        }

        {
            const slot = this.newSlot("decodeDataPromise", null);
            slot.setSlotType("Promise");
        }

        {
            const slot = this.newSlot("value", null);
            slot.setSlotType("Object");
        }
    }

    initPrototype () {
    }

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

    // --- promises ---

    loadDataPromise () {
        if (!this._loadDataPromise) {
            this.setLoadDataPromise(Promise.clone());
        }
        return this._loadDataPromise;
    }

    decodeDataPromise () {
        if (!this._decodeDataPromise) {
            this.setDecodeDataPromise(Promise.clone());
        }
        return this._decodeDataPromise;
    }

    // --- resource file ---

    /*
    fileResource () {
        return BMFileResources.shared().rootFolder().nodeAtSubpathString(this.path());
    }

    async asyncLoadFileResource () {        
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

    load () {
        throw new Error("deprecated - use asyncLoad instead");
    }

    async asyncLoad () {
        try {
            this.setLoadState("loading");
            await this.asyncLoadUrlResource();
            this.setLoadState("loaded");
            this.postNoteNamed("resourceLoaded");
        } catch (error) {
            this.setError(error);
            this.postNoteNamed("loadError");
            throw error;
        }

        try {
            this.setLoadState("decoding");
            await this.asyncDecodeData();
            this.setLoadState("decoded");
            this.postNoteNamed("resourceDecoded");
        } catch (error) {
            this.setError(error);
            this.postNoteNamed("decodeError");
            throw error;
        }
        return this;
    }

    async asyncLoadUrlResource () {
        const url = this.urlResource()
        await url.promiseLoad();
        const data = url.data();
        assert(data.byteLength);
        this.setData(data);
        await this.onDidLoad();
    }
    
    async onDidLoad () {
        this.setIsLoaded(true);
        this.postNoteNamed("didLoad");
    }

    async asyncDecodeData () {
        // for subclasses to override
        return this;
    }

    async prechacheWhereAppropriate () {
    }

}.initThisClass());
