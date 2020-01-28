"use strict"

/* 

    BMNotificationCenter
    
    A notification system that queues notifications and waits for the 
    app to return to the event loop (using a timeout) to post them. 
    It filters out duplicate notifications (posted on the same event loop) 
    and duplicate observations (same object registering the same observation again).
        
    Warning about Weak links: 
    
        As Javascript doesn't support weak links, you'll need to be careful
        about having your observers tell the NotificationCenter when they 
        are done observing, otherwise, it will hold a reference to them that
        will prevent them from being garbage collected and they'll continue
        to receive matching notifications. 
    
    Weak links solution (for target/sender):
    
        Instead of passing an object reference for: 
        
            BMObservation.setTargetId() and 
            BMNotification.setSender()
        
        you can pass a typeId string/number for the object. e.g. the ideal.js 
        assigns each instance a unique typeId.
        
        This should work assuming:
            - notification receiver doesn't already have a reference to the sender
            - observer can remove it's observation appropriately
        

    Example use:
 
        // start watching for "changed" message from target object
        this._obs = BMNotificationCenter.shared().newObservation().setName("changed").setObserver(this).setTarget(target).watch()
    
        // start watching for "changedStoredSlot" message from any target object
        this._obs = BMNotificationCenter.shared().newObservation().setName("changedStoredSlot").setObserver(this).watch()

        // stop watching this observation
        this._obs.stopWatching()
        
        // stop watching all
        BMNotificationCenter.shared().removeObserver(this)
        
        // post a notification
        const note = BMNotificationCenter.shared().newNote().setSender(this).setName("hello").post()

        // repost same notification
        note.post()

    Broadcast notifications:

        For use cases where the overhead of creating post objects would be costly, 
        it's possible to send a direct message to all name listeners without waiting
        until the event loop to end. These will pass the target itself instead of a Notification object.

        // call's changedStoredSlot(target) on all listeners for "changedStoredSlot"
        BMNotificationCenter.shared().broadcastTargetAndName(this, "changedStoredSlot")

*/

window.BMNotificationCenter = class BMNotificationCenter extends ProtoClass {
    initPrototype () {
        this.newSlot("observations", null) // array 
        this.newSlot("notifications", null) // array 
        this.newSlot("debugNoteName", "appDidInit")
        this.newSlot("currentNote", null)
        this.newSlot("isProcessing", false)
        this.newSlot("nameIndex", null) // dict of dicts
    }

    init() {
        super.init()
        this.setObservations([]);
        this.setNotifications([]);
        this.setNameIndex({});
        //this.setIsDebugging(true)
    }

    // --- observations ----
    
    hasObservation (obs) {
        return this.observations().detect(ob => ob.isEqual(obs))
    }
    
    addObservation (obs) {
        if (!this.hasObservation(obs)) {
            this.observations().push(obs)
        }
        return this
    }

    newObservation () {
        return BMObservation.clone().setCenter(this);
    }

    hasObservationsForTargetId (targetId) {
        const obs = this.observations().detect(obs => obs.targetId() === targetId)
        return !Type.isNullOrUndefined(obs)
    }

    countOfObservationsForTargetId (targetId) {
        const matches = this.observations().filter(obs => obs.targetId() === targetId)
        return matches.length
    }
    
    removeObservation (anObservation) {
        if (true) {
            const filtered = this.observations().filter(obs => !obs.isEqual(anObservation))
            this.setObservations(filtered)
        } else {
            // If possible, we want to send onNoObservers listen targets when 
            // their last observer is removed, so track these

            const targetId = anObservation.targetId()
            let removedMatchingTargetId = false
            let stillHasMatchingTargetId = false

            const filtered = this.observations().filter((obs) => {
                if(obs.isEqual(anObservation)) {
                    if (obs.targetId() === targetId) {
                        removedMatchingTargetId = true
                    }
                    return false
                }
                if (obs.targetId() === targetId) {
                    stillHasMatchingTargetId = true
                }
                return true
            })
            this.setObservations(filtered)

            if (removedMatchingTargetId && !stillHasMatchingTargetId) {
                const target = this.targetForTargetId(targetId) // looks through obs listeners 
                if(target && target.onNoObservers) {
                    target.onNoObservers(this)
                }
            }
        }

        return this
    }

    targetForTargetId (targetId) {
        if (Type.isNullOrUndefined(targetId)) {
            return false
        }

        // this only works if there's an observation whose observer is the target
        // which works, for example, if the target is observing onNoObservers

        const matchObservation = this.observations().detect(obs => obs.observerId() === targetId)
        if (matchObservation) {
            const target = matchObservation.observer()
            return target
        }
        return null
    }
    
    removeObserver (anObserver) {        
        const filtered = this.observations().filter(obs => obs.observer() !== anObserver)
        this.setObservations(filtered)
        return this;
    }

    // --- helpers ---

    observersForName (name) {
        return this.nameToObservers()[name] // returns a set
    }

    // --- notifying ----
    
    hasNotification (note) {
        return this.notifications().detect(n => n.isEqual(note))
    }
    
    addNotification (note) {
        if (!this.hasNotification(note)) {
            if (note.sender().title && note.sender().title === "STRVCTapp") {
                console.log("NotificationCenter '" + note.sender().title() + "' " + note.name())
            }
            this.notifications().push(note)
		    window.SyncScheduler.shared().scheduleTargetAndMethod(this, "processPostQueue", -1)
        }
        return this
    }

    newNote () {
        return BMNotification.clone().setCenter(this)
    }
    
    // --- timeout & posting ---
    
    processPostQueue () {
        // TODO: for performance, we could make an observationName->observations dictionary
        // but only worthwhile if observation list is sufficiently large

        // keep local ref of notifications and set 
        // notifications to empty array in case any are
        // added while we process them

        /*
        console.log(" --- " + this.type() + " processPostQueue BEGIN ---")
        this.show()
        console.log(" ")
        */
        this.setCurrentNote(null)

        if (!this.isProcessing()) {
            this.setIsProcessing(true)
            //console.log("processPostQueue " + this.notifications().length)
            const notes = this.notifications()
            this.setNotifications([])
            notes.forEach(note => this.postNotificationNow(note))
            //notes.forEach(note => this.tryToPostNotificationNow(note))
            this.setIsProcessing(false)
        } else {
            Error.showCurrentStack()
            console.warn("WARNING: attempt to call processPostQueue recursively while on note: ", this._currentNote)
        }

        //console.log(" --- " + this.type() + " processPostQueue END ---")

        return this
    }

    tryToPostNotificationNow (note) {
        try { 
            this.postNotificationNow(note)
            //this.debugLog("   <- posting " + note.description() )
        } catch (error) {
            console.log(this.type() + " caught exception while posting: " + note.description())
            return error
        }
        return null
    }

    shouldDebugNote (note) {
        return this.isDebugging() === true && (this.debugNoteName() === null || this.debugNoteName() === note.name());
    }
    
    postNotificationNow (note) {
        // use a copy of the observations list in 
        // case any are added while we are posting 
        //
        // TODO: add an dictionary index for efficiency

        this.setCurrentNote(note)
        
        const showDebug = this.shouldDebugNote(note)

        if (showDebug) {
            this.debugLog(" senderId " + note.senderId() + " posting " + note.name())
            this.showObservers()
        }
        
        const observations = this.observations().shallowCopy()  
      
        observations.forEach( (obs) => {
            if (obs.matchesNotification(note)) {
                if (showDebug) {
                    this.debugLog(" " + note.name() + " matches obs ", obs)
                    this.debugLog(" sending ", note.name() + " to obs " + obs.type())
                }
            
                obs.sendNotification(note)    
                //obs.tryToSendNotification(note)   
            }
        })        
        
        this.setCurrentNote(null)
    }

    show () {
        console.log(this.type() + ":")
        console.log("  posting notes:")
        console.log(this.notesDescription())
        console.log("  observations:")
        console.log(this.observersDescription())
    }

    notesDescription() {
        return this.notifications().map(note => "    " + note.description()).join("\n")
    }

    observersDescription() {
        return this.observations() .map(obs => "    " + obs.description()).join("\n") 
    }
    
    showCurrentNoteStack () {
        if (this.currentNote() === null) {
            //console.log("BMNotificationCenter.showCurrentNoteStack() warning - no current post")
        } else {
            console.log("current post sender stack: ", this.currentNote().senderStack())
        }
    }
}.initThisClass()
