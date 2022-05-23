"use strict";

/*

    WASound

   WebAudioSound

*/

(class WASound extends BMResource {

    static supportedExtensions () {
        return ["aac", "alac", "amr", "flac", "mp3", "mp4", "3gp",  "opus", "oga", "ogg", "ogv", "wav"]
    }

    // ---

    initPrototype () {
        this.newSlot("request", null)
        //this.newSlot("path", null)
        this.newSlot("loadState", "unloaded") // "unloaded", "loading", "decoding", "loaded"
        //this.newSlot("downloadBuffer", null)
        this.newSlot("decodedBuffer", null)
        this.newSlot("source", null)
        this.newSlot("shouldPlayOnLoad", false)
        this.newSlot("error", false)
        //this.newSlot("downloadError", false)
        //this.newSlot("decodeError", false)

        // source attributes
        this.newSlot("loop", false)
        this.newSlot("playbackRate", 1)
        //this.newSlot("loopStart", null)
        //this.newSlot("loopEnd", null)
    }

    init () {
        super.init()
    }

    title () {
        return this.name() 
    }

    subtitle () {
        return this.path().pathExtension() + ", " + this.loadState()
    }

    name () {
        return this.path().lastPathComponent().sansExtension()
    }

    // --- attributes ---

    duration () {
        if (this.decodedBuffer()) {
            return this.decodedBuffer().duration
        }
        return 0
    }

    length () { // sample count
        if (this.decodedBuffer()) {
            return this.decodedBuffer().length
        }
        return 0
    }

    numberOfChannels () { // sample count
        if (this.decodedBuffer()) {
            return this.decodedBuffer().numberOfChannels
        }
        return 0
    }

    // --- load ---

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

    // --- decode ---

    onDecode (decodedBuffer) {
        this.setDecodedBuffer(decodedBuffer)
        this.setLoadState("loaded")
        //console.log(this.type() + " didDecode " + this.path())
        if (this.shouldPlayOnLoad()) {
            this.play()
        }
        this.didLoad()
    }

    onDecodeError (e) {
        console.warn(this.type() + " onDecodeError ", e.error, " " + this.path())
        this.setError(e.error)
    }

    // --- audio source ---

    newAudioSource () {
        const ctx = this.audioCtx()
        const source = ctx.createBufferSource();
        source.buffer = this.decodedBuffer();
        source.connect(ctx.destination);
        this.syncToSource(source)
        source.addEventListener("ended", (event) => { this.onEnded(event) })
        return source
    }

    onEnded (event) {

    }

    syncToSource (source) {
        source.playbackRate.value = this.playbackRate();
        source.loop = this.loop();
        return this
    }

    // --- play ---

    play () {
        debugger;
        const source = this.newAudioSource()
        source.start();
        return this
    }

    pause () {
        //source.stop()
    }

    prepareToAccess () {
        super.prepareToAccess()
        this.play() // not a good way to do this?
    }

}.initThisClass());
