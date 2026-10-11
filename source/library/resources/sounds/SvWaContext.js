/**
 * @module library.resources.sounds
 */

"use strict";

/**
 * @class SvWaContext
 * @extends SvBaseNode
 * @classdesc A WebAudioContext wrapper.
 * This is used with SvWaSound for decoding and playing sounds.
 *
 * Notes:
 *
 * Browsers don't allow sounds to be played until a user interacts (using certain events) with the page,
 * so this class registers to listen for "onFirstUserEvent" notification, and sets up the WebAudioContext after when it's received.
 */
(class SvWaContext extends SvBaseNode {

    /**
     * @static
     * @description Initializes the class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
        SvBroadcaster.shared().addListenerForName(this, "firstUserEvent");
        //this.watchOnceForNote("onFirstUserEvent")
    }

    /**
     * @static
     * @description Handles the first user event
     * @param {Object} anEventListener - The event listener object
     * @category Event Handling
     */
    static firstUserEvent (/*anEventListener*/) {
        SvBroadcaster.shared().removeListenerForName(this, "firstUserEvent");
        SvWaContext.shared().setupIfNeeded(); // need user input to do this
    }

    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {AudioContext} - audioContext
         * @category Audio
         */
        {
            const slot = this.newSlot("audioContext", null);
            slot.setSlotType("AudioContext");
        }
        /**
         * @member {Promise} - setupPromise
         * @category Setup
         */
        {
            const slot = this.newSlot("setupPromise", null);
            slot.setSlotType("Promise");
        }
        {
            const slot = this.newSlot("masterLevel", 1); // the overall level, 0–1
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("channelLevels", null); // Map channel name -> level, 0–1
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("masterGainNode", null); // every channel passes through it to the speakers
            slot.setSlotType("GainNode");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("channelGainNodes", null); // Map channel name -> GainNode
            slot.setSlotType("Map");
        }
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Initializes the instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setSetupPromise(Promise.clone());
        this.setChannelLevels(new Map());
        this.setChannelGainNodes(new Map());
    }

    // --- levels: an overall level and one per named channel ---

    /**
     * @description Where a sound on a channel connects: the channel's gain
     * (made on first use), which passes through the overall gain to the
     * speakers. No channel: straight to the overall gain.
     * @param {String|null} channelName
     * @returns {AudioNode}
     * @category Levels
     */
    outputNodeForChannel (channelName) {
        if (!channelName) {
            return this.masterNode();
        }
        if (!this.channelGainNodes().has(channelName)) {
            const gain = this.audioContext().createGain();
            gain.gain.value = this.levelForChannel(channelName);
            gain.connect(this.masterNode());
            this.channelGainNodes().set(channelName, gain);
        }
        return this.channelGainNodes().get(channelName);
    }

    masterNode () {
        if (!this.masterGainNode()) {
            const gain = this.audioContext().createGain();
            gain.gain.value = this.masterLevel();
            gain.connect(this.audioContext().destination);
            this.setMasterGainNode(gain);
        }
        return this.masterGainNode();
    }

    levelForChannel (channelName) {
        const level = this.channelLevels().get(channelName);
        return (typeof level === "number") ? level : 1;
    }

    /**
     * @description The level a channel actually plays at (its own times the
     * overall), for audio that cannot pass through these nodes (a player
     * with its own volume).
     * @param {String} channelName
     * @returns {Number}
     * @category Levels
     */
    effectiveLevelForChannel (channelName) {
        return this.masterLevel() * this.levelForChannel(channelName);
    }

    didUpdateSlotMasterLevel (/*oldValue, newValue*/) {
        this.applyLevel(this.masterGainNode(), this.masterLevel());
        this.postNoteNamed("onAudioLevelsChanged");
    }

    /**
     * @description Sets a channel's level (0–1); playing sounds follow at once.
     * @param {String} channelName
     * @param {Number} level
     * @returns {SvWaContext}
     * @category Levels
     */
    setLevelForChannel (channelName, level) {
        this.channelLevels().set(channelName, level);
        this.applyLevel(this.channelGainNodes().get(channelName), level);
        this.postNoteNamed("onAudioLevelsChanged");
        return this;
    }

    applyLevel (gainNode, level) {
        if (gainNode) {
            gainNode.gain.setTargetAtTime(level, gainNode.context.currentTime, 0.02); // a short glide, no click
        }
        return this;
    }

    /**
     * @description Returns the title of the context
     * @returns {string} The title
     * @category Metadata
     */
    title () {
        return "WebAudio Context";
    }

    /**
     * @description Returns the subtitle of the context
     * @returns {null} Always returns null
     * @category Metadata
     */
    subtitle () {
        return null;
    }

    /**
     * @description Checks if the context is set up
     * @returns {boolean} True if set up, false otherwise
     * @category Setup
     */
    isSetup () {
        return !Type.isNull(this.audioContext());
    }

    /**
     * @description Sets up the context if needed
     * @returns {SvWaContext} The instance
     * @category Setup
     */
    setupIfNeeded () {
        if (!this.isSetup()) {
            this.setAudioContext(new window.AudioContext());
            this.setupPromise().callResolveFunc();
            SvBroadcaster.shared().broadcastNameAndArgument("didSetupSvWaContext", this);
            //console.warn("can't get audio context until user gesture e.g. tap");
        }
        return this;
    }

    /**
     * @description Decodes an array buffer
     * @param {ArrayBuffer} audioArrayBuffer - The audio array buffer to decode
     * @returns {Promise} A promise that resolves with the decoded buffer
     * @category Audio Processing
     */
    async promiseDecodeArrayBuffer (audioArrayBuffer) {
        // NOTE: may mutate audioArrayBuffer!!!!!!!!!!
        await this.setupPromise(); // should we throw an error instead?

        const promise = Promise.clone();
        assert(audioArrayBuffer instanceof ArrayBuffer, "audioArrayBuffer must be an ArrayBuffer");
        // what else should we assert to ensure it can be decoded?
        // assert correct length
        assert(audioArrayBuffer.byteLength > 0, "audioArrayBuffer must have a byteLength");
        // assert correct format
        //assert(audioArrayBuffer.format === "audio/wav", "audioArrayBuffer must be a WAV file"); // this may not be true

        // let's log a bunch of info about the buffer
        // console.log(this.logPrefix(), "audioArrayBuffer: " + JSON.stringify(this.jsonInfoForBuffer(audioArrayBuffer), null, 2));

        this.audioContext().decodeAudioData(audioArrayBuffer,
            (decodedBuffer) => {
                //assert(audioArrayBuffer.byteLength);
                promise.callResolveFunc(decodedBuffer);
            },
            (error) => {
                console.log(this.logPrefix(), "error decodingaudioArrayBuffer: ", error.message);

                promise.callRejectFunc(error);
            }
        );
        return promise;
    }

    jsonInfoForBuffer (audioArrayBuffer) {
        return {
            byteLength: audioArrayBuffer.byteLength,
            format: audioArrayBuffer.format,
            sampleRate: audioArrayBuffer.sampleRate,
            channels: audioArrayBuffer.channels
        };
    }

    /*
    connectSource (webAudioSource) {
        this.setupIfNeeded();
        webAudioSource.connect(this.audioContext().destination);
    }

    disconnectSource (webAudioSource) {

    }
    */

}.initThisClass());
