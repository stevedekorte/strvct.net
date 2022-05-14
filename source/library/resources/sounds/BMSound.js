"use strict";

/*

    BMSound

    Managed by BMSoundResources.

*/

(class BMSound extends BMNode {
    
    // --- mime types ---

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

    // ---

    initPrototype () {
        this.newSlot("path", null)
    }

    init () {
        super.init()
        this.setNodeMinWidth(270)
    }

    title () {
        return this.name()
    }

    subtitle () {
        return this.path().pathExtension()
    }

    name () {
        return this.path().lastPathComponent().sansExtension()
    }

    play () {
        const audioPlayer = BMAudioPlayer.shared()
        audioPlayer.setPath(this.path())
        audioPlayer.play()
        return this
    }

    prepareToAccess () {
        super.prepareToAccess()
        this.play() // not a good way to do this
        //audio.src = 'data:audio/wav;base64,UklGR...;
    }

}.initThisClass());
