"use strict";

/*

    WAContext

    A WebAudioContext wrapper. 
    This is used with WASound for decoding and playing sounds.

    Notes:

    Browsers don't allow sounds to be played until a user interacts (using certain events) with the page,
    so this class registers to listen for "onFirstUserEvent" notification, and sets up the WebAudioContext after when it's received.

*/

(class WAContext extends BaseNode {
    
    static initClass () {
        this.setIsSingleton(true)
        Broadcaster.shared().addListenerForName(this, "firstUserEvent")
        //this.watchOnceForNote("onFirstUserEvent")
        return this
    }

    static firstUserEvent (anEventListener) {
        Broadcaster.shared().removeListenerForName(this, "firstUserEvent")
        WAContext.shared().setupIfNeeded() // need user input to do this
    }

    initPrototypeSlots () {
        this.newSlot("audioContext", null)
        this.newSlot("setupPromise", null)
    }

    init () {
        super.init();
        this.setSetupPromise(Promise.clone());
    }

    title () {
        return "WebAudio Context"
    }

    subtitle () {
        return null
    }

    isSetup () {
        return !Type.isNull(this.audioContext())
    }

    setupIfNeeded () {
        if (!this.isSetup()) {
            //debugger;
            this.setAudioContext(new window.AudioContext());
            this.setupPromise().callResolveFunc();
            Broadcaster.shared().broadcastNameAndArgument("didSetupWAContext", this);
            //console.warn("can't get audio context until user gesture e.g. tap");
        }
        return this
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

