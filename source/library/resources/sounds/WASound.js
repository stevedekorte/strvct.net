"use strict";

/*

    WASound

   WebAudioSound

*/

(class WASound extends BMNode {

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
        this.newSlot("request", null)
        this.newSlot("path", null)
        this.newSlot("loadState", "unloaded") // "unloaded", "loading", "decoding", "loaded"
        //this.newSlot("downloadBuffer", null)
        this.newSlot("decodedBuffer", null)
        this.newSlot("source", null)
        this.newSlot("shouldPlayOnLoad", false)
        this.newSlot("error", false)

        this.newSlot("loop", false)
        this.newSlot("playbackRate", 1)

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

    loadIfNeeded () {
        if (this.loadState() === "unloaded") {
            this.load()
        }
        return this
    }

    load () {
        this.setLoadState("loading")

        const request = new XMLHttpRequest();
        request.open('GET', this.path(), true);
        request.responseType = 'arraybuffer';
        request.onload = (event) => { this.onLoad(event) }
        request.onerror = (event) => { this.onLoadError(event) }
        request.send();
        return this
    }

    onLoadError (event) {
        console.log(this.type() + " onLoadError ", error, " " + this.path())
        this.setError(error)
    }

    duration () {
        if (this.buffer()) {
            return this.buffer().duration
        }
        return 0
    }

    audioCtx () {
        return WAContext.shared().setupIfNeeded().audioContext()
    }

    onLoad (event) {
        const request = event.currentTarget;
        const downloadedBuffer = request.response;
        //this.setDownloadedBuffer(downloadedBuffer) // array buffer

        this.audioCtx().decodeAudioData(downloadedBuffer,
            (decodedBuffer) => { this.onDecode(decodedBuffer) },
            (e) => { this.onDecodeError(e) }
        );
        this.setLoadState("decoding")
    }

    onDecode (decodedBuffer) {
        this.setDecodedBuffer(decodedBuffer)
        this.setLoadState("loaded")
        if (this.shouldPlayOnLoad()) {
            this.play()
        }
    }

    newAudioSource () {
        const audioCtx = this.audioCtx()
        const source = audioCtx.createBufferSource();
        source.buffer = this.decodedBuffer();
        source.connect(audioCtx.destination);
        this.syncToSource(source)
        return source
    }

    syncToSource (source) {
        source.playbackRate.value = this.playbackRate();
        source.loop = this.loop();
        return this
    }

    onDecodeError (e) {
        console.log(this.type() + " onDecodeError ", e.error, " " + this.path())
    }

    play () {
        const source = this.newAudioSource()
        source.start(0);
        return this
    }

    prepareToAccess () {
        super.prepareToAccess()
        this.play() // not a good way to do this?
    }

}.initThisClass());
