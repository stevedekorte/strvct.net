"use strict";

/* 

    BMNotificationCenter
    
    A notification system that queues notifications and waits for the 
    app to return to the event loop (using a timeout) to post them. 
    It filters out duplicate notifications (posted on the same event loop) 
    and duplicate observations (same object registering the same observation again).
        
    WeakRefs: 

        The Observation class holds sender and observer references as weakrefs,
        and when either is collected, it will automatically call Observation.stopWatching()
        and remove itself from the NotificationCenter.

        It's still good policy from an observer to explicilty call stopWatching as
        soon as it no longer needs to observe, unless it wants to observer for it's entire
        lifetime.

    Example use:
 
    Observing notifications:

        // start watching for "changed" message from sender object
        this._obs = BMNotificationCenter.shared().newObservation().setName("changed").setObserver(this).setSender(sender).startWatching()
    
        // start watching for "changedStoredSlot" message from any sender object
        this._obs = BMNotificationCenter.shared().newObservation().setName("changedStoredSlot").setObserver(this).startWatching()

        // stop watching this observation
        this._obs.stopWatching()
        
        // stop watching all
        BMNotificationCenter.shared().removeObserver(this)

        // watch only for first note named "appDidInit"
        this.watchOnceForNote("appDidInit")
        // WARNING: in this case, if app has already done init, this will never be called!

    If the source object has an accessor for a notification it uses, we can do:

        sourceObject.didLoadNote().newObservation().setObserver(this).startWatching()
        
    Posting notifications:

        // post a notification
        const note = this.newNoteNamed("hello").post()

        // repost same notification
        note.post()

    Broadcasting notifications:

        For use cases where the overhead of creating post objects would be costly, 
        it's possible to send a direct message to all name listeners without waiting
        until the event loop to end. These will pass the sender itself instead of a Notification object.

        See Broadcaster class.

    Helper methods available to subclasses of BMNode:

        this.postNoteNamed("hello")
        this.watchOnceForNote("hello")
        this.watchOnceForNoteFrom("hello", sourceObject)

        this.observeNote(aFileLoader.doneNote()) // still need to handle observation removal
        this.observeNoteOnce(aFileLoader.doneNote()) 

        note: I think nodes try remove their observations when removed?

*/

(class BMNotificationCenter extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true)
    }
    
    initPrototypeSlots () {
        this.newSlot("observations", null) // array 
        this.newSlot("notifications", null) // array 
        this.newSlot("debugNoteName", "appDidInit")
        this.newSlot("currentNote", null)
        this.newSlot("isProcessing", false)
        this.newSlot("nameIndex", null) // dict of dicts
        this.newSlot("obsHighwaterCount", 100) // used
        this.newSlot("noteSet", null) // Set used for fast lookup for matching note
    }

    initPrototype () {
    }

    init () {
        super.init()
        this.setObservations([]);
        this.setNotifications([]);
        this.setNameIndex({});
        this.setNoteSet(new Set());
    }

    shortDescription () {
        return "NotificationCenter " + this.notifications().length + " notes, " + this.observations().length + " obs";
    }

    // --- observations ----

    /*
    cleanIfNeeded () {
        if (this.observations().count() < this.obsHighwaterCount()) {
            this.cleanObservations()
            this.setObsHighwaterCount(this.observations().count() * 2)
        }
    }

    cleanObservations () {
        // remove observations whose senders or observers have been collected
        this.observations().shallowCopy().forEach(obs => {
            obs.clean()
        })
    }
    */
    
    hasObservation (obs) {
        return this.observations().canDetect(ob => ob.isEqual(obs)) 
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

    observationsWithSender (sender) {
        return this.observations().filter(obs => obs.sender() === sender).map(obs => obs.observer());
    }

    hasObservationsForSender (sender) {
        return this.observationsWithSender(sender).length > 0;
    }

    observationsWithObserver (observer) {
        return this.observations().filter(obs => obs.observer() === observer)
    }

    /*
    observationsForSender (sender) {
        const matches = this.observations().filter(obs => obs.sender() === sender)
        return matches
    }
    */
    
    removeObservation (anObservation) {
        const filtered = this.observations().filter(obs => !obs.isEqual(anObservation))
        //const filtered = this.observations().filter(obs => obs !== anObservation)
        this.setObservations(filtered)
        return this
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
        if (this.noteSet().has(note)) {
            // quick check to see if we have an exact match
            // reusing notes can help make these lookups more efficient
            return true
        }
        return this.notifications().canDetect(n => n.isEqual(note))
    }
    
    addNotification (note) {
        if (!this.hasNotification(note)) {
            /*
            if (note.sender().title && note.sender().title === "STRVCTapp") {
                console.log("NotificationCenter '" + note.sender().title() + "' " + note.name())
            }
            */
            this.noteSet().add(note)
            this.notifications().push(note)
		    SyncScheduler.shared().scheduleTargetAndMethod(this, "processPostQueue", -1)
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
            notes.forEach(note => {
                this.noteSet().delete(note)
                this.postNotificationNow(note)
            })
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
        return note.isDebugging() || (this.isDebugging() === true && (this.debugNoteName() === null || this.debugNoteName() === note.name()));
    }
    
    postNotificationNow (note) {
        // use a copy of the observations list in 
        // case any are added while we are posting 
        //
        // TODO: add an dictionary index for efficiency

        this.setCurrentNote(note)
        
        const showDebug = this.shouldDebugNote(note)

        if (showDebug) {
            console.log(" >>> " + this.type() + " senderId " + note.senderId() + " posting " + note.name())
            //this.showObservers()
        }
        
        const matching = this.observationsMatchingNotification(note);

        matching.forEach(obs => {
            if (showDebug) {
                //console.log(" >>> " + this.type() + " " + note.name() + " matches obs: " + obs.description());
                if (obs.observer.type() === "HwChatInputTile") {
                    console.log(" >>> " +this.type() + " sending ", note.name() + " to observer " + obs.observer().typeId());
                }
            }
        
            obs.sendNotification(note);
            //obs.tryToSendNotification(note);  
        });       
        
        this.setCurrentNote(null);
    }

    observationsMatchingNotification (note) {
        return this.observations().filter(obs => obs.matchesNotification(note));
    }

    show () {
        console.log(this.type() + ":")
        console.log("  posting notes:")
        console.log(this.notesDescription())
        console.log("  observations:")
        console.log(this.observersDescription())
    }

    notesDescription () {
        return this.notifications().map(note => "    " + note.description()).join("\n")
    }

    observersDescription () {
        return this.observations() .map(obs => "    " + obs.description()).join("\n") 
    }
    
    showCurrentNoteStack () {
        if (this.currentNote() === null) {
            //console.log("BMNotificationCenter.showCurrentNoteStack() warning - no current post")
        } else {
            console.log("current post sender stack: ", this.currentNote().senderStack())
        }
    }

}.initThisClass());
