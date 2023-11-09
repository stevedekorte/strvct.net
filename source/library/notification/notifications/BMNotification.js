"use strict";

/*

    BMNotification

*/

(class BMNotification extends ProtoClass {

    initPrototypeSlots () {
        this.newSlot("name", null)
        this.newSlot("sender", null)
        this.newSlot("info", null)
        this.newSlot("center", null) // NotificationCenter that owns this
        this.newSlot("senderStack", null)
        this.newSlot("noteHash", null)
    }

    /*
    init () {
        super.init()
    }
    */

    senderId () {
        return this.sender().debugTypeId()
    }

    setSender (obj) {
        assert(Type.isObject(obj))
        this._sender = obj
        //this._senderId = obj.typeId())
        this.clearNoteHash()
        return this
    }

    setName (aName) {
        this._name = aName;
        this.clearNoteHash()
        return this
    }
    
    isEqual (obs) {
        if (this === obs) { 
            return true 
        }

        //return (this.name() === obs.name()) && (this.sender() === obs.sender())

        return this.noteHash() === obs.noteHash()
    }

    // --- note hash ---

    clearNoteHash () {
        this._noteHash = null;
        return this
    }

    noteHash () {
        if (!this._noteHash) {
            this._noteHash = Type.typeUniqueId(this.name()) + Type.typeUniqueId(this.sender())
        }
        return this._noteHash
    }

    // --- ---

    isPosted () {
        return this.center().hasNotification(this)
    }
    
    post () {
        if (this.center().isDebugging()) {
            //console.log(typeof(this.senderId()) + "." + this.senderId() + " posting note " + this.name() + " and recording stack for debug")
            const e = new Error()
            e.name = "" //"Notification Post Stack"
            e.message = this.senderId() + " posting note '" + this.name() + "'" 
            this.setSenderStack(e.stack);
        }

        //console.log("   queuing post " + this.senderId() + " '" + this.name() + "'" )
       
        this.center().addNotification(this)
        return this
    }
    
    /*
    schedulePost () {
	     SyncScheduler.shared().scheduleTargetAndMethod(this, "post")
    }
    */

    description () {
        const s = this.senderId() ? this.senderId() : "null"
        const n = this.name() ? this.name() : "null"
        return s + " " + n
    }

    newObservation () {
        /*
            this avoids note name typos and helps runtime check/debug note name changes as note name isn't hardcoded as string in multiple places
            example use:

                aFileLoader.doneNote().newObservation().setObserver(this).setIsOneShot(true).startWatching()

                how about:

                (in Node)

                this.observeNote(aFileLoader.doneNote())
                this.observeNoteOnce(aFileLoader.doneNote())
        */
        return BMNotificationCenter.shared().newObservation().setName(this.name()).setSender(this.sender())
    }

}.initThisClass());

