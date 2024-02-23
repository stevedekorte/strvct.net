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

        // converting blob to ArrayBuffer, arrayBuffer is stored in data slot

        {
            const slot = this.newSlot("arrayBufferPromise", null);
        }

        // fetching

        {
            const slot = this.newSlot("fetchPromise", null);
        }

        // decoding 

        {
            const slot = this.newSlot("decodePromise", null);
        }

        {
            const slot = this.newSlot("decodedBuffer", null);
        }

        // playing

        {
            const slot = this.newSlot("shouldPlayOnLoad", false);
        }
        
        {
            const slot = this.newSlot("shouldPlayOnAccess", true);
        }

        {
            const slot = this.newSlot("playPromise", null);
        }

        {
            const slot = this.newSlot("source", null); // AudioBufferSourceNode 
        }

        // source attributes

        {
            const slot = this.newSlot("loop", false);
        }

        {
            const slot = this.newSlot("playbackRate", 1);
        }

        {
            const slot = this.newSlot("whenToPlay", 0);
        }

        {
            const slot = this.newSlot("offsetInSeconds", 0);
        }

        //this.newSlot("durationInSeconds", undefined);

        {
            const slot = this.newSlot("isPlaying", false);
        }

        {
            const slot = this.newSlot("delegateSet", null);
        }

        // optional info
        {
            const slot = this.newSlot("label", null);
            slot.setAnnotation("shouldJsonArchive", true);
        }

        {
            const slot = this.newSlot("transcript", null);
            slot.setAnnotation("shouldJsonArchive", true);
        }

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

    /*
    setData (data) {
        console.log(this.typeId() + ".setData(", data, ")");
        this._data = data;
        return this;
    }
    */

    setArrayBuffer (arrayBuffer) {
        this.setData(arrayBuffer);
        return this;
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
        //console.log(this.typeId() + " setData " + arrayBuffer.byteLength);
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

        try {
            if (this.path()) {
                //debugger;
                //console.log(this.typeId() + " path: ", this.path());
            } else {
                if (!this.fetchPromise()) {
                    this.setFetchPromise(Promise.resolve());
                }

                await this.fetchPromise();
                await this.arrayBufferPromise();
            }

            if (!this.hasData()) {
                throw new Error("no data for sound");
            }

            assert(this.data().byteLength);
            const arrayBufferCopy = this.data().slice(0);
            const decodedBuffer = await WAContext.shared().promiseDecodeArrayBuffer(arrayBufferCopy);
            assert(this.data().byteLength);
            this.onDecode(decodedBuffer);
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    onError (e) {
        console.warn(this.type() + " onDecodeError ", e.error, " " + this.path());
        this.setError(e.error);
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
        this.setSource(this.newAudioSource()); // setups source with decoded buffer
        this.syncToSource(this.source());
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

    // ----

    async promiseDataUrl () {
        // Step 1: Convert ArrayBuffer to Blob
        const arrayBuffer = this.data();
        assert(arrayBuffer);
        console.log(this.typeId() + " promiseDataUrl byte count " + arrayBuffer.byteLength);
        assert(arrayBuffer.byteLength > 0);
        const mimeType = 'audio/*';
        const dataUrl = await arrayBuffer.promiseAsDataUrlWithMimeType(mimeType);
        console.log("dataUrl: ", dataUrl.clipWithEllipsis(20));
        return dataUrl;
    }


}.initThisClass());
