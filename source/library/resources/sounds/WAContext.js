"use strict";

/*

    WAContext

   WebAudioContext

*/

(class WAContext extends BaseNode {

    // in JS, do we need user input first to play audio?
    
    static initThisClass () {
        super.initThisClass()
        Broadcaster.shared().addListenerForName(this, "firstUserEvent")
        //this.watchOnceForNote("firstUserEvent")
        return this
    }

    static firstUserEvent (anEventListener) {
        Broadcaster.shared().removeListenerForName(this, "firstUserEvent")
        WAContext.shared().setupIfNeeded() // need user input to do this
    }

    initPrototype () {
        this.newSlot("audioContext", null)
    }

    init () {
        super.init()
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
            this.setAudioContext(new window.AudioContext())
            Broadcaster.shared().broadcastNameAndArgument("didSetupWAContext", this)
            //console.warn("can't get audio context until user gesture e.g. tap")
        }
        return this
    }
    
    /*
    connectSource (webAudioSource) {
        this.setupIfNeeded()
        webAudioSource.connect(this.audioContext().destination);
    }

    disconnectSource (webAudioSource) {
        
    }
    */

    /*
    prepareToAccess () {
        super.prepareToAccess()
    }
    */

}.initThisClass());

