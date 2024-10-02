/**
 * @module library.resources.sounds
 */

"use strict";

/**
 * @class WAContext
 * @extends BaseNode
 * @classdesc A WebAudioContext wrapper. 
 * This is used with WASound for decoding and playing sounds.
 * 
 * Notes:
 * 
 * Browsers don't allow sounds to be played until a user interacts (using certain events) with the page,
 * so this class registers to listen for "onFirstUserEvent" notification, and sets up the WebAudioContext after when it's received.
 */
(class WAContext extends BaseNode {
    
    /**
     * @static
     * @description Initializes the class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true)
        Broadcaster.shared().addListenerForName(this, "firstUserEvent")
        //this.watchOnceForNote("onFirstUserEvent")
    }

    /**
     * @static
     * @description Handles the first user event
     * @param {Object} anEventListener - The event listener object
     * @category Event Handling
     */
    static firstUserEvent (anEventListener) {
        Broadcaster.shared().removeListenerForName(this, "firstUserEvent")
        WAContext.shared().setupIfNeeded() // need user input to do this
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
    }

    /**
     * @description Returns the title of the context
     * @returns {string} The title
     * @category Metadata
     */
    title () {
        return "WebAudio Context"
    }

    /**
     * @description Returns the subtitle of the context
     * @returns {null} Always returns null
     * @category Metadata
     */
    subtitle () {
        return null
    }

    /**
     * @description Checks if the context is set up
     * @returns {boolean} True if set up, false otherwise
     * @category Setup
     */
    isSetup () {
        return !Type.isNull(this.audioContext())
    }

    /**
     * @description Sets up the context if needed
     * @returns {WAContext} The instance
     * @category Setup
     */
    setupIfNeeded () {
        if (!this.isSetup()) {
            this.setAudioContext(new window.AudioContext());
            this.setupPromise().callResolveFunc();
            Broadcaster.shared().broadcastNameAndArgument("didSetupWAContext", this);
            //console.warn("can't get audio context until user gesture e.g. tap");
        }
        return this
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
        //assert(audioArrayBuffer.byteLength);
        this.audioContext().decodeAudioData(audioArrayBuffer,
            decodedBuffer => { 
                //assert(audioArrayBuffer.byteLength);
                promise.callResolveFunc(decodedBuffer);
            },
            error => { 
                promise.callRejectFunc(error);
            }
        );
        return promise;
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