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

        // converting blob to ArrayBuffer
        this.newSlot("arrayBufferPromise", null);

        // fetching
        this.newSlot("fetchPromise", null);
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
        //this.newSlot("durationInSeconds", undefined);

        this.newSlot("isPlaying", false);
        this.newSlot("delegateSet", null);

        // optional info
        this.newSlot("label", null);
        this.newSlot("transcript", null);

        //this.newSlot("loopStart", null);
        //this.newSlot("loopEnd", null);
    }

    init () {
        super.init();
        //this.setFetchPromise(Promise.clone());
        this.setDecodePromise(Promise.clone());
        this.setArrayBufferPromise(Promise.resolve());
        this.setDelegateSet(new Set());
    }

    title () {
        return this.name();
    }

    name () {
        return this.path().lastPathComponent().sansExtension();
    }

    // --- blob ---

    static fromBlob (audioBlob) {
        const sound = this.clone();
        sound.asyncLoadFromDataBlob(audioBlob); // don't await as we want to return the sound instance immediately
        return sound;
    }

    async asyncLoadFromDataBlob (audioBlob) {
        // start the FileReader conversion to an array buffer
        const promise = audioBlob.asyncToArrayBuffer();
        this.setArrayBufferPromise(promise);
        const arrayBuffer = await promise;
        // set the result 
        this.setData(arrayBuffer);
    }

    // --- attributes ---

    duration () {
        if (this.decodedBuffer()) {
            return this.decodedBuffer().duration; // in seconds
        }
        return 0;
    }

    sampleCount () { 
        if (this.decodedBuffer()) {
            return this.decodedBuffer().length;
        }
        return 0;
    }

    length () { 
        throw new Error("use sampleCount method instead");
        return this.sampleCount();
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

        if (!this.fetchPromise()) {
            this.setFetchPromise(Promise.resolve());
        }

        await this.fetchPromise();
        await WAContext.shared().setupPromise();
        await this.arrayBufferPromise();

        if (!this.hasData()) {
            throw new Error("no data for sound");
        }
        return this.decodeBuffer(this.data());
    }

    decodeBuffer (audioArrayBuffer) {
        assert(!Type.isNullOrUndefined(audioArrayBuffer));
        this.audioCtx().decodeAudioData(audioArrayBuffer,
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
        return this.decodePromise()
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
        source.addEventListener("ended", (event) => { 
            this.onEnded(event);
        })
        return source
    }

    syncToSource (source) {
        // TODO: do this work if it's already playing?
        source.playbackRate.value = this.playbackRate();
        source.loop = this.loop();
        return this;
    }

    // --- play ---

    async play () {
        await this.promiseToDecode();
        this.setPlayPromise(Promise.clone());
        this.setSource(this.newAudioSource());
        this.syncToSource(this.source());
        assert(this.decodedBuffer());
        this.source().start(this.whenToPlay(), this.offsetInSeconds(), this.duration());
        this.setIsPlaying(true);
        this.onStarted();
        return this.playPromise();
    }

    description () {
        const parts = [this.type()];
        if (this.label()) {
            parts.push(this.label());
        }

        if (this.transcript()) {
            parts.push(this.transcript().clipWithEllipsis(15));
        }

        return parts.join(" ");
    }

    onStarted () {
        console.log("Sound.onStarted() " + this.description());
        this.post("onSoundStarted");
    }

    onEnded () {
        console.log("Sound.onEnded() " + this.description());
        this.setIsPlaying(false);
        this.setSource(null);
        this.playPromise().callResolveFunc();
        this.post("onSoundEnded");
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

    post (methodName) {
        this.postNoteNamed(methodName);
        this.sendDelegate(methodName);
        return this;
    }

    addDelegate (d) {
        this.delegateSet().add(d);
        return this;
    }

    removeDelegate (d) {
        this.delegateSet().delete(d);
        return this;
    }

    sendDelegate (methodName, args = [this]) {
        const sendDelegate = (d, methodName, args) => {
            const f = d[methodName]
            if (f) {
              f.apply(d, args)
            }
        };

        /*
        const d = this.delegate();
        if (d) {
          sendDelegate(d, methodName, args);
        } else {
          const error = this.type() + " delegate missing method '" + methodName + "'";
          console.log(error);
          debugger;
          throw new Error(error);
        }
        */

        this.delegateSet().forEach(d => { 
            sendDelegate(d, methodName, args); 
        });
    }

}.initThisClass());
