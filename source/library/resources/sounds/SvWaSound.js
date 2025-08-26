"use strict";

/**
 * @module library.resources.sounds
 * @class SvWaSound
 * @extends SvResource
 * @description A sound resource.

    Note: 
    
    AudioBufferSourceNode can't be paused and later resumed. Use AudioWorklet instead.

    Usage:

        const sound = WASound.clone();
        sound.shouldPlayOnLoad(true);
        sound.setData(data);
        sound.play(); // returns a promise

*/

(class SvWaSound extends SvResource {

    /**
     * @static
     * @description returns the supported extensions for sound files
     * @returns {Array} the supported extensions
     */
    static supportedExtensions () {
        return ["aac", "alac", "amr", "flac", "mp3", "mp4", "3gp",  "opus", "oga", "ogg", "ogv", "wav"];
    }

    // ---

    /**
     * @description initializes the prototype slots
     * @returns {SvWaSound} the sound
     */
    initPrototypeSlots () {

        // converting blob to ArrayBuffer, arrayBuffer is stored in data slot

        /**
         * @member arrayBufferPromise
         * @description the promise for the array buffer
         * @type {Promise}
         */
        {
            const slot = this.newSlot("arrayBufferPromise", null);
            slot.setSlotType("Promise");
        }

        // fetching

        /**
         * @member fetchPromise
         * @description the promise for the fetch
         * @type {Promise}
         */
        {
            const slot = this.newSlot("fetchPromise", null);
            slot.setSlotType("Promise");
        }

        // decoding 

        /**
         * @member decodePromise
         * @description the promise for the decode
         * @type {Promise}
         */
        {
            const slot = this.newSlot("decodePromise", null);
            slot.setSlotType("Promise");
        }

        /**
         * @member decodedBuffer
         * @description the decoded buffer
         * @type {AudioBuffer}
         */
        {
            const slot = this.newSlot("decodedBuffer", null);
            slot.setSlotType("AudioBuffer");
        }

        // playing

        /**
         * @member shouldPlayOnLoad
         * @description should play on load
         * @type {Boolean}
         */
        {
            const slot = this.newSlot("shouldPlayOnLoad", false);
            slot.setSlotType("Boolean");
        }
        
        /**
         * @member shouldPlayOnAccess
         * @description should play on access
         * @type {Boolean}
         */
        {
            const slot = this.newSlot("shouldPlayOnAccess", true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member playPromise
         * @description the promise for the play
         * @type {Promise}
         */
        {
            const slot = this.newSlot("playPromise", null);
            slot.setSlotType("Promise");
        }

        /**
         * @member source
         * @description the source
         * @type {AudioBufferSourceNode}
         */
        {
            const slot = this.newSlot("source", null); // AudioBufferSourceNode 
            slot.setSlotType("AudioBufferSourceNode");
        }

        // source attributes

        /**
         * @member loop
         * @description loop
         * @type {Boolean}
         */
        {
            const slot = this.newSlot("loop", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member playbackRate
         * @description playback rate
         * @type {Number}
         */
        {
            const slot = this.newSlot("playbackRate", 1);
            slot.setSlotType("Number");
        }

        /**
         * @member whenToPlay
         * @description when to play
         * @type {Number}
         */
        {
            const slot = this.newSlot("whenToPlay", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member offsetInSeconds
         * @description offset in seconds
         * @type {Number}
         */
        {
            const slot = this.newSlot("offsetInSeconds", 0);
            slot.setSlotType("Number");
        }

        /*
        {
            const slot = this.newSlot("durationInSeconds", undefined);
        }
        */

        /**
         * @member isPlaying
         * @description is playing
         * @type {Boolean}
         */
        {
            const slot = this.newSlot("isPlaying", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member delegateSet
         * @description the delegate set
         * @type {Set}
         */
        {
            const slot = this.newSlot("delegateSet", null);
            slot.setSlotType("Set");
        }

        // optional info

        /**
         * @member label
         * @description label
         * @type {String}
         */
        {
            const slot = this.newSlot("label", null);
            slot.setShouldJsonArchive(true);
            slot.setSlotType("String");
        }

        /**
         * @member transcript
         * @description transcript
         * @type {String}
         */
        {
            const slot = this.newSlot("transcript", null);
            slot.setShouldJsonArchive(true);
            slot.setSlotType("String");
        }

        /*
        {
            const slot = this.newSlot("loopStart", null);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("loopEnd", null);
            slot.setSlotType("Number");
        }
        */
    }

    initPrototype () {
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

    /**
     * @description sets the array buffer
     * @param {ArrayBuffer} arrayBuffer the array buffer
     * @returns {SvWaSound} the sound
     */
    setArrayBuffer (arrayBuffer) {
        this.setData(arrayBuffer);
        return this;
    }

    /**
     * @description returns the title
     * @returns {String} the title
     */
    title () {
        return this.name();
    }

    /**
     * @description returns the name
     * @returns {String} the name
     */
    name () {
        return this.path().lastPathComponent().sansExtension();
    }

    // --- blob ---

    /**
     * @static
     * @description creates a sound from a blob
     * @param {Blob} audioBlob the blob
     * @returns {SvWaSound} the sound
     */
    static fromBlob (audioBlob) {
        const sound = this.clone();
        sound.asyncLoadFromDataBlob(audioBlob); // don't await as we want to return the sound instance immediately
        return sound;
    }

    /**
     * @async
     * @description loads the sound from a blob
     * @param {Blob} audioBlob the blob
     * @returns {Promise} the promise
     */
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

    /**
     * @description returns the duration
     * @returns {Number} the duration
     */
    duration () {
        if (this.decodedBuffer()) {
            return this.decodedBuffer().duration; // in seconds
        }
        return 0;
    }

    /**
     * @description returns the sample count
     * @returns {Number} the sample count
     */
    sampleCount () { 
        if (this.decodedBuffer()) {
            return this.decodedBuffer().length;
        }
        return 0;
    }

    /**
     * @description returns the length
     * @returns {Number} the length
     */
    length () { 
        throw new Error("use sampleCount method instead");
        //return this.sampleCount();
    }

    /**
     * @description returns the number of channels
     * @returns {Number} the number of channels
     */
    numberOfChannels () { // sample count
        if (this.decodedBuffer()) {
            return this.decodedBuffer().numberOfChannels;
        }
        return 0;
    }

    // ---

    /**
     * @description returns the audio context
     * @returns {AudioContext} the audio context
     */
    audioCtx () {
        return SvWaContext.shared().setupIfNeeded().audioContext();
    }

    /**
     * @description on did load
     * @returns {SvWaSound} the sound
     */
    onDidLoad () {
        this.promiseToDecode();
        return this;
    }

    /**
     * @description returns if has decoded
     * @returns {Boolean} if has decoded
     */
    hasDecoded () {
        return this.decodedBuffer() !== null;
    }

    /**
     * @description returns if has data
     * @returns {Boolean} if has data
     */
    hasData () {
        return this.data() !== null;
    }

    /**
     * @async
     * @description promises to decode
     * @returns {Promise} the promise
     */
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
            const decodedBuffer = await SvWaContext.shared().promiseDecodeArrayBuffer(arrayBufferCopy);
            assert(this.data().byteLength);
            this.onDecode(decodedBuffer);
        } catch (error) {
            this.onError(error);
            error.rethrow();
        }
    }

    /**
     * @description on error
     * @param {Error} e the error
     * @returns {SvWaSound} the sound
     */
    onError (e) {
        console.warn(this.type() + " onDecodeError ", e.message, " " + this.path());
        this.setError(e);
    }

    // --- decode ---

    /**
     * @description on decode
     * @param {AudioBuffer} decodedBuffer the decoded buffer
     * @returns {SvWaSound} the sound
     */
    onDecode (decodedBuffer) {
        assert(!Type.isNullOrUndefined(decodedBuffer));
        this.setDecodedBuffer(decodedBuffer);
        this.setLoadState("loaded");
        //console.log(this.type() + " didDecode " + this.path())
        if (this.shouldPlayOnLoad()) {
            this.play();
        }
    }

    /**
     * @description on decode error
     * @param {Error} e the error
     * @returns {SvWaSound} the sound
     */
    onDecodeError (e) {
        console.warn(this.type() + " onDecodeError ", e.message, " " + this.path());
        this.setError(e);
    }

    // --- audio source ---

    /**
     * @description new audio source
     * @returns {AudioBufferSourceNode} the audio source
     */
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

    /**
     * @description sync to source
     * @param {AudioBufferSourceNode} source the source
     * @returns {SvWaSound} the sound
     */
    syncToSource (source) {
        // TODO: do this work if it's already playing?
        source.playbackRate.value = this.playbackRate();
        source.loop = this.loop();
        return this;
    }

    // --- play ---

    /**
     * @async
     * @description plays the sound
     * @returns {Promise} the promise
     */
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

    /**
     * @description returns the description
     * @returns {String} the description
     */
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

    /**
     * @description on started
     * @returns {SvWaSound} the sound
     */
    onStarted () {
        //console.log("Sound.onStarted() " + this.description());
        this.post("onSoundStarted");
    }

    /**
     * @description on ended
     * @returns {SvWaSound} the sound
     */
    onEnded () {
        //console.log("Sound.onEnded() " + this.description());
        this.setIsPlaying(false);
        this.setSource(null);
        this.playPromise().callResolveFunc();
        this.post("onSoundEnded");
    }

    /**
     * @description stops the sound
     * @returns {SvWaSound} the sound
     */
    stop () {
        if (this.isPlaying()) {
            this.source().stop();
            this.onEnded(); // needed?
            //this.setSource(null);
            //this.setPlayPromise(null);
        }
        return this;
    }

    /*
    NOTE: AudioBufferSourceNode can't be paused and later resumed. Use AudioWorklet instead.
    pause () 
    resume ()
    */

    /**
     * @description prepares to access
     * @returns {SvWaSound} the sound
     */
    prepareToAccess () {
        super.prepareToAccess();
        if (this.shouldPlayOnAccess()) {
            this.play();
        }
    }

    /**
     * @description source state
     * @returns {String} the source state
     */
    sourceState () {
        // valid states: ["suspended", "running", "closed"]
        return this.source() ? this.source().state : "no source";
    }

    /**
     * @description posts a note
     * @param {String} methodName the method name
     * @returns {SvWaSound} the sound
     */
    post (methodName) {
        this.postNoteNamed(methodName);
        this.sendDelegate(methodName);
        return this;
    }

    /**
     * @description adds a delegate
     * @param {Object} d the delegate
     * @returns {SvWaSound} the sound
     */
    addDelegate (d) {
        this.delegateSet().add(d);
        return this;
    }

    /**
     * @description removes a delegate
     * @param {Object} d the delegate
     * @returns {SvWaSound} the sound
     */
    removeDelegate (d) {
        this.delegateSet().delete(d);
        return this;
    }

    /**
     * @description sends a delegate
     * @param {String} methodName the method name
     * @param {Array} args the arguments
     * @returns {SvWaSound} the sound
     */
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

    /**
     * @async
     * @description promises the data url
     * @returns {Promise} the promise
     */
    async promiseDataUrl () {
        // Step 1: Convert ArrayBuffer to Blob
        const arrayBuffer = this.data();
        assert(arrayBuffer);
        //console.log(this.typeId() + " promiseDataUrl byte count " + arrayBuffer.byteLength);
        assert(arrayBuffer.byteLength > 0);
        const mimeType = 'audio/*';
        const dataUrl = await arrayBuffer.promiseAsDataUrlWithMimeType(mimeType);
        console.log("dataUrl: ", dataUrl.clipWithEllipsis(20));
        return dataUrl;
    }


}.initThisClass());
