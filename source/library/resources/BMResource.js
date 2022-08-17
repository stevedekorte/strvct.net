"use strict";

/*

    BMResource

*/

(class BMResource extends BaseNode {
    
    // --- mime types ---

    /*
    static supportedMimeTypes () {
        return new Set(["audio/ogg", "audio/wave", "audio/mp3"])
    }

    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType)
    }

    static openMimeChunk (dataChunk) {
        const aNode = this.clone()
        //setValue(dataChunk)
        console.log(dataChunk.mimeType() + " data.length: " + dataChunk.decodedData().length)
        return aNode
    }

    static supportedExtensions () {
        return this.supportedMimeTypes().map(mimeType => MimeExtensions.shared().pathExtensionsForMimeType(mimeType)).flat()
    }
    */

    static supportedExtensions () {
        return []
    }

    static canHandleExtension (extension) {
        return this.supportedExtensions().contains(extension)
    }

    // ---

    initPrototype () {
        this.newSlot("path", "")
        this.newSlot("isLoaded", false)
    }

    /*
    init () {
        super.init()
    }
    */

    title () {
        return this.name()
    }

    subtitle () {
        return this.path().pathExtension()
    }

    name () {
        return this.path().lastPathComponent().sansExtension()
    }

    didLoad () {
        this.setIsLoaded(true)
        this.postNoteNamed("didLoad")
    }

}.initThisClass());
