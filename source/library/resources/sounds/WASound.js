"use strict";

/*

    WASound

    Note: 
    
    AudioBufferSourceNode can't be paused and later resumed. Use AudioWorklet instead.

    Usage:

        const sound = WASound.clone();
        sound.shouldPlayOnLoad(true);
        sound.setData(data);
        sound.play(); // returns a promise

*/

(class WASound extends BMResource {

    static supportedExtensions () {
        return ["aac", "alac", "amr", "flac", "mp3", "mp4", "3gp",  "opus", "oga", "ogg", "ogv", "wav"];
    }

    // ---

    initPrototypeSlots () {

        // decoding 
        this.newSlot("decodePromise", null);
        this.newSlot("decodedBuffer", null);
        //this.newSlot("decodeError", false);

        // playing
        this.newSlot("shouldPlayOnLoad", false);
        this.newSlot("shouldPlayOnAccess", true);
        this.newSlot("playPromise", null);
        this.newSlot("source", null); // AudioBufferSourceNode 


        // source attributes
        this.newSlot("loop", false);
        this.newSlot("playbackRate", 1);

        this.newSlot("whenToPlay", 0);
        this.newSlot("offsetInSeconds", 0);
        this.newSlot("durationInSeconds", undefined);

        //this.newSlot("loopStart", null);
        //this.newSlot("loopEnd", null);
    }

    init () {
        super.init();
        this.setDecodePromise(Promise.clone());
    }

    title () {
        return this.name();
    }

    name () {
        return this.path().lastPathComponent().sansExtension();
    }

    // --- attributes ---

    duration () {
        if (this.decodedBuffer()) {
            return this.decodedBuffer().duration;
        }
        return 0;
    }

    length () { // sample count
        if (this.decodedBuffer()) {
            return this.decodedBuffer().length;
        }
        return 0;
    }

    numberOfChannels () { // sample count
        if (this.decodedBuffer()) {
            return this.decodedBuffer().numberOfChannels;
        }
        return 0;
    }

    // ---

    audioCtx () {
        return WAContext.shared().setupIfNeeded().audioContext();
    }

    didLoad () {
        this.promiseToDecode();
        return this;
    }

    hasDecoded () {
        return this.decodedBuffer() !== null;
    }

    hasData () {
        return this.data() !== null;
    }

    async promiseToDecode () {
        if (this.hasDecoded()) {
            return Promise.resolve();
        }

        if (!this.hasData()) {
            throw new Error("no data for sound");
        }

        return WAContext.shared().setupPromise().then(
            () => { this.decodeBuffer(this.data()); }
        );
    }

    decodeBuffer (aBuffer) {
        assert(!Type.isNullOrUndefined(aBuffer));
        this.audioCtx().decodeAudioData(aBuffer,
            decodedBuffer => { 
                this.onDecode(decodedBuffer); // wrap in try?
                this.decodePromise().callResolveFunc();
            },
            error => { 
                this.onDecodeError(error); 
                this.decodePromise().callRejectFunc(error);
            }
        );
        this.setLoadState("decoding");
    }

    // --- decode ---

    onDecode (decodedBuffer) {
        assert(!Type.isNullOrUndefined(decodedBuffer));
        this.setDecodedBuffer(decodedBuffer);
        this.setLoadState("loaded");
        //console.log(this.type() + " didDecode " + this.path())
        if (this.shouldPlayOnLoad()) {
            this.play();
        }
        //this.didLoad()
    }

    onDecodeError (e) {
        console.warn(this.type() + " onDecodeError ", e.error, " " + this.path());
        this.setError(e.error);
    }

    // --- audio source ---

    newAudioSource () { 
        // a AudioBufferSourceNode can only be used once
        const ctx = this.audioCtx();
        const source = ctx.createBufferSource();
        source.buffer = this.decodedBuffer();
        source.connect(ctx.destination);
        this.syncToSource(source);
        source.addEventListener("ended", (event) => { this.onEnded(event) })
        return source
    }

    syncToSource (source) {
        source.playbackRate.value = this.playbackRate();
        source.loop = this.loop();
        source.onended = () => { this.onEnded() };
        return this;
    }

    onEnded () {
        // playback ended
        this.playPromise().callResolveFunc();
        this.setSource(null);
        this.postNoteNamed("onSoundEnded");
    }

    // --- play ---

    async play () {
        return this.promiseToDecode().then(() => {
            this.setPlayPromise(Promise.clone());
            this.setSource(this.newAudioSource());
            this.syncToSource(this.source());
            this.source().start(this.whenToPlay(), this.offsetInSeconds(), this.durationInSeconds());
            this.postNoteNamed("onSoundStarted");
            return this.playPromise();
        })
    }

    stop () {
        this.source().stop();
        this.setSource(null);
        this.setPlayPromise(null);
        return this;
    }

    /*
    NOTE: AudioBufferSourceNode can't be paused and later resumed. Use AudioWorklet instead.
    pause () 
    resume ()
    */

    prepareToAccess () {
        super.prepareToAccess();
        if (this.shouldPlayOnAccess()) {
            this.play();
        }
    }

    sourceState () {
        // valid states: ["suspended", "running", "closed"]
        return this.source() ? this.source().state : "no source";
    }

}.initThisClass());
