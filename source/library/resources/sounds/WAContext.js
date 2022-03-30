"use strict";

/*

    WAContext

   WebAudioContext

*/

(class WAContext extends BMNode {

    /*
    // in JS, do we need user input first to play audio?
    
    static initThisClass () {
        super.initThisClass()
        Broadcaster.shared().addListenerForName(this, "firstUserEvent")
        this.firstUserEvent()

                    //this.watchOnceForNote("firstUserEvent")

        return this
    }

    static firstUserEvent (anEventListener) {
        Broadcaster.shared().removeListenerForName(this, "firstUserEvent")
        //if (anEventListener.isUserInput()) {
            WAContext.shared().setupIfNeeded() // need user input to do this
        //}
    }
    */



    initPrototype () {
        this.newSlot("audioContext", null)
    }

    init () {
        super.init()
        this.setNodeMinWidth(270)
    }

    title () {
        return "WebAudio Context"
    }

    subtitle () {
        return null
    }

    setupIfNeeded () {
        if (Type.isNull(this.audioContext())) {
            this.setAudioContext(new window.AudioContext())
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

