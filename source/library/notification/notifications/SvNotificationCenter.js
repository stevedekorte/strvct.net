
 /**
  * @module library.notification.notifications
  */

"use strict";

/**
 * @class SvNotificationCenter
 * @extends ProtoClass
 * @description 
    
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
        this._obs = SvNotificationCenter.shared().newObservation().setName("changed").setObserver(this).setSender(sender).startWatching();
    
        // start watching for "changedStoredSlot" message from any sender object
        this._obs = SvNotificationCenter.shared().newObservation().setName("changedStoredSlot").setObserver(this).startWatching();

        // stop watching this observation
        this._obs.stopWatching();
        
        // stop watching all
        SvNotificationCenter.shared().removeObserver(this);

        // watch only for first note named "appDidInit"
        this.watchOnceForNote("appDidInit");
        // WARNING: in this case, if app has already done init, this will never be called!

    If the source object has an accessor for a notification it uses, we can do:

        sourceObject.didLoadNote().newObservation().setObserver(this).startWatching();
        
    Posting notifications:

        // post a notification
        const note = this.newNoteNamed("hello").post();

        // repost same notification
        note.post();

    Broadcasting notifications:

        For use cases where the overhead of creating post objects would be costly, 
        it's possible to send a direct message to all name listeners without waiting
        until the event loop to end. These will pass the sender itself instead of a Notification object.

        See Broadcaster class.

    Helper methods available to subclasses of SvNode:

        this.postNoteNamed("hello");
        this.watchOnceForNote("hello");
        this.watchOnceForNoteFrom("hello", sourceObject);

        this.observeNote(aFileLoader.doneNote()); // still need to handle observation removal
        this.observeNoteOnce(aFileLoader.doneNote());

        note: I think nodes try remove their observations when removed?

    Pause and resume:

        The NotificationCenter can be paused and resumed. When paused, it will not process any notifications.
        This can be useful when you want to prevent notifications from being processed while doing things like
        app initialization.

        Example use:

        SvNotificationCenter.shared().pause();
        SvNotificationCenter.shared().resume();
*/

(class SvNotificationCenter extends ProtoClass {

    /**
     * @static
     * @description sets up the class as a singleton
     */
    static initClass () {
        this.setIsSingleton(true)
    }
    
    /**
     * @description sets up the prototype slots for the class
     */
    initPrototypeSlots () {
        /**
         * @member observations
         * @type {Array}
         * @description an array of observations
         */
        {
            const slot = this.newSlot("observations", null); // array 
            slot.setSlotType("Array");
        }

        /**
         * @member observationsMap
         * @type {Map}
         * @description a map of observation hashes to observations
         */
        {
            const slot = this.newSlot("observationsMap", null); // map of obsHash to observation 
            slot.setSlotType("Map");
        }

        /**
         * @member notifications
         * @type {Array}
         * @description an array of notifications
         */
        {
            const slot = this.newSlot("notifications", null); // array 
            slot.setSlotType("Array");
        }

        /**
         * @member debugNoteName
         * @type {String}
         * @description the name of the note to debug
         */
        {
            const slot = this.newSlot("debugNoteName", "appDidInit");
            slot.setSlotType("String");
        }

        /**
         * @member currentNote
         * @type {SvNotification}
         * @description the current note being processed
         */
        {
            const slot = this.newSlot("currentNote", null);
            slot.setSlotType("SvNotification");
        }

        /**
         * @member isProcessing
         * @type {Boolean}
         * @description whether the notification center is processing notifications
         */
        {
            const slot = this.newSlot("isProcessing", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member obsHighwaterCount
         * @type {Number}
         * @description the highwater count for observations
         */
        {
            const slot = this.newSlot("obsHighwaterCount", 100); // used
            slot.setSlotType("Number");
        }

        /**
         * @member noteSet
         * @type {Set}
         * @description a set of notes used for fast lookup for matching note
         */
        {
            const slot = this.newSlot("noteSet", null); // Set used for fast lookup for matching note
            slot.setSlotType("Set");
        }

        /**
         * @member isPaused
         * @type {Boolean}
         * @description whether the notification center is paused
         */
        {
            const slot = this.newSlot("isPaused", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member senderIndex
         * @type {Map}
         * @description a map of sender to observations used for fast lookup for matching note
         */
        {
            const slot = this.newSlot("senderIndex", null);
            slot.setSlotType("Map");
        }

        /**
         * @member nameIndex
         * @type {Map}
         * @description a map of name to observations used for fast lookup for matching note
         */
        {
            const slot = this.newSlot("nameIndex", null);
            slot.setSlotType("Map");
        }

        /**
         * @member nullSenderMatchSet
         * @type {Set}
         * @description a set of observations with null sender used for fast lookup for matching note
         */
        {
            const slot = this.newSlot("nullSenderMatchSet", null);
            slot.setSlotType("Set");
        }

        /**
         * @member nullNameMatchSet
         * @type {Set}
         * @description a set of observations with null name used for fast lookup for matching note
         */
        {
            const slot = this.newSlot("nullNameMatchSet", null);
            slot.setSlotType("Set");
        }
    }

    initPrototype () {
    }

    /**
     * @description initializes the notification center
     */
    init () {
        super.init()
        this.setObservations([]);
        this.setObservationsMap(new Map());
        this.setNotifications([]);
        this.setNoteSet(new Set());
    }

    /**
     * @description returns the observations
     * @returns {Array} the observations
     */
    observations () {
       // debugger;
        return this.observationsMap().valuesArray();
    }

    /**
     * @description pauses the notification center
     * @returns {SvNotificationCenter} the notification center
     */
    pause () {
        this.setIsPaused(true);
        return this;
    }

    /**
     * @description resumes the notification center
     * @returns {SvNotificationCenter} the notification center
     */
    resume () {
        this.setIsPaused(false);
        return this;
    }

    /**
     * @description returns a short description of the notification center
     * @returns {String} the short description
     */
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
    
    /**
     * @description checks if the observation is in the observations map
     * @param {SvObservation} obs the observation to check
     * @returns {Boolean} whether the observation is in the observations map
     */
    hasObservation (obs) {
        return this.observationsMap().has(obs.obsHash());
        //return this.observations().canDetect(ob => ob.isEqual(obs));
    }
    
    /**
     * @description adds an observation to the observations map
     * @param {SvObservation} obs the observation to add
     * @returns {SvNotificationCenter} the notification center
     */
    addObservation (obs) {
        if (!this.hasObservation(obs)) {
            this.observationsMap().set(obs.obsHash(), obs);
            /*
            if (obs.sender() !== null && obs.sender().svType() === "FirestoreDatabaseService") {
                console.log("----------- " + obs.observer().svTypeId() + " now observing " + obs.sender().svTypeId());
                debugger;
            }
            */
            //this.observations().push(obs);
        }
        return this;
    }

    /**
     * @description creates a new observation
     * @returns {SvObservation} the new observation
     */
    newObservation () {
        return SvObservation.clone().setCenter(this);
    }

    /**
     * @description returns the observers of the sender
     * @param {SvNode} sender the sender
     * @returns {Array} the observers
     */
    observersOfSender (sender) {
        return this.observationsWithSender(sender).map(obs => obs.observer());
    }

    /**
     * @description returns the observations with the sender
     * @param {SvNode} sender the sender
     * @returns {Array} the observations
     */
    observationsWithSender (sender) {
        return this.observations().filter(obs => obs.sender() === sender);
    }

    /**
     * @description checks if the sender has observations
     * @param {SvNode} sender the sender
     * @returns {Boolean} whether the sender has observations
     */
    hasObservationsForSender (sender) {
        return this.observationsWithSender(sender).length > 0;
    }

    /**
     * @description returns the observations with the observer
     * @param {SvNode} observer the observer
     * @returns {Array} the observations
     */
    observationsWithObserver (observer) {
        return this.observations().filter(obs => obs.observer() === observer);
    }

    /**
     * @description checks if the observer has observations
     * @param {SvNode} observer the observer
     * @returns {Boolean} whether the observer has observations
     */
    hasObservationsForObserver (observer) {
        return this.observationsWithObserver(observer).length > 0;
    }
    
    /*
    observationsForSender (sender) {
        const matches = this.observations().filter(obs => obs.sender() === sender)
        return matches
    }
    */
    
    /**
     * @description removes an observation from the observations map
     * @param {SvObservation} anObservation the observation to remove
     * @returns {SvNotificationCenter} the notification center
     */
    removeObservation (anObservation) {
        this.observationsMap().delete(anObservation.obsHash());
        /*
        const filtered = this.observations().filter(obs => !obs.isEqual(anObservation))
        this.setObservations(filtered)
        */
        return this
    }
    
    /**
     * @description removes an observer from the observations map
     * @param {SvNode} anObserver the observer to remove
     * @returns {SvNotificationCenter} the notification center
     */
    removeObserver (anObserver) {        
        this.observationsMap().selectInPlaceKV((key, obs) => obs.observer() !== anObserver);
        return this;
    }

    // --- notifying ----
    
    /**
     * @description checks if the notification is in the note set
     * @param {SvNotification} note the notification to check
     * @returns {Boolean} whether the notification is in the note set
     */
    hasNotification (note) {
        if (this.noteSet().has(note)) {
            // quick check to see if we have an exact match
            // reusing notes can help make these lookups more efficient
            return true
        }
        return this.notifications().canDetect(n => n.isEqual(note))
    }
    
    /**
     * @description adds a notification to the note set
     * @param {SvNotification} note the notification to add
     * @returns {SvNotificationCenter} the notification center
     */
    addNotification (note) {
        if (!this.hasNotification(note)) {
            /*
            if (note.sender().title && note.sender().title === "STRVCTapp") {
                this.log("NotificationCenter '" + note.sender().title() + "' " + note.name())
            }
            */
            this.noteSet().add(note);
            this.notifications().push(note);
            SyncScheduler.shared().scheduleTargetAndMethod(this, "processPostQueue", -1);
        }
        return this;
    }

    /**
     * @description creates a new notification
     * @returns {SvNotification} the new notification
     */
    newNote () {
        return SvNotification.clone().setCenter(this);
    }
    
    // --- timeout & posting ---
    
    /**
     * @description processes the post queue
     * @returns {SvNotificationCenter} the notification center
     */
    processPostQueue () {
        if (this.isPaused()) {
            this.log("WARNING: SvNotificationCenter.processPostQueue() called while paused - SKIPPING");
            return this;
        }

        // TODO: for performance, we could make an observationName->observations dictionary
        // but only worthwhile if observation list is sufficiently large

        // keep local ref of notifications and set 
        // notifications to empty array in case any are
        // added while we process them

        /*
        this.log(" --- " + this.svType() + " processPostQueue BEGIN ---")
        this.show()
        this.log(" ")
        */
        this.setCurrentNote(null);

        if (!this.isProcessing()) {
            this.setIsProcessing(true);
            this.calcIndexes();
            //this.log("processPostQueue " + this.notifications().length);
            const notes = this.notifications();
            this.setNotifications([]);
            notes.forEach(note => {
                this.noteSet().delete(note);
                this.postNotificationNow(note);
            })
            //notes.forEach(note => this.tryToPostNotificationNow(note));
            this.setIsProcessing(false);
        } else {
            Error.showCurrentStack();
            console.warn("WARNING: attempt to call processPostQueue recursively while on note: ", this._currentNote);
        }

        //this.log(" --- processPostQueue END ---");

        return this;
    }

    /**
     * @description tries to post a notification now
     * @param {SvNotification} note the notification to post
     * @returns {SvNotificationCenter} the notification center
     */
    tryToPostNotificationNow (note) {
        try { 
            this.postNotificationNow(note);
            //this.logDebug("   <- posting " + note.description() )
        } catch (error) {
            this.log(" caught exception while posting: " + note.description());
            return error;
        }
        return null;
    }

    /**
     * @description checks if the note should be debugged
     * @param {SvNotification} note the notification to check
     * @returns {Boolean} whether the note should be debugged
     */
    shouldDebugNote (note) {
        return note.isDebugging() || (this.isDebugging() === true && (this.debugNoteName() === null || this.debugNoteName() === note.name()));
    }

    /**
     * @description calculates the indexes
     * @returns {SvNotificationCenter} the notification center
     */
    calcIndexes () {
        const senderIndex = this.observationsMap().indexedByMethod("sender");
        this.setSenderIndex(senderIndex);

        const nameIndex = this.observationsMap().indexedByMethod("name");
        this.setNameIndex(nameIndex);

        const emptySet = ImmutableSet.emptySet();

        const nullSenderMatchSet = this.senderIndex().get(null) || emptySet;
        this.setNullSenderMatchSet(nullSenderMatchSet);

        const nullNameMatchSet = this.nameIndex().get(null) || emptySet;
        this.setNullNameMatchSet(nullNameMatchSet);
    }
    
    /**
     * @description posts a notification now
     * @param {SvNotification} note the notification to post
     * @returns {SvNotificationCenter} the notification center
     */
    postNotificationNow (note) {
        // use a copy of the observations list in 
        // case any are added while we are posting 
        //
        // TODO: add an dictionary index for efficiency

        this.setCurrentNote(note);
        
        /*
        const showDebug = this.shouldDebugNote(note);

        if (showDebug) {
            this.log(" >>> " + this.svType() + " senderId " + note.senderId() + " posting " + note.name());
            //this.showObservers()
        }
        */

        const matching = this.observationsMatchingNotification(note);

        matching.forEach(obs => {
            /*
            if (showDebug) {
                //this.log(" >>> " + this.svType() + " " + note.name() + " matches obs: " + obs.description());
                if (obs.observer.svType() === "UoChatInputTile") {
                    this.log(" >>> " +this.svType() + " sending ", note.name() + " to observer " + obs.observer().svTypeId());
                }
            }
            */
        
            obs.sendNotification(note);
            //obs.tryToSendNotification(note);  
        });       
        
        this.setCurrentNote(null);
    }

    /**
     * @description returns the observations matching the notification
     * @param {SvNotification} note the notification to match
     * @returns {ImmutableSet} the observations matching the notification
     */
    observationsMatchingNotification (note) {
        // use our observation indexes for fast matching with the notification
        // IMPORTANT: assumes calcIndexes() has been called before modifying observations

        const emptySet = ImmutableSet.emptySet();

        const senderMatchSet = this.senderIndex().get(note.sender()) || emptySet;
        const nameMatchSet = this.nameIndex().get(note.name()) || emptySet;

        const fullSenderMatchSet = this.nullSenderMatchSet().union(senderMatchSet);
        const fullNameMatchSet = this.nullNameMatchSet().union(nameMatchSet);

        const matching = fullSenderMatchSet.intersection(fullNameMatchSet);
        return matching;
    }

    /*
    observationsMatchingNotification (note) {
        return this.observations().filter(obs => obs.matchesNotification(note));
    }
    */

    /**
     * @description shows the notification center
     * @returns {SvNotificationCenter} the notification center
     */
    show () {
        this.log("  posting notes:");
        this.log(this.notesDescription());
        this.log("  observations:");
        this.log(this.observersDescription());
    }

    /**
     * @description returns the notes description
     * @returns {String} the notes description
     */
    notesDescription () {
        return this.notifications().map(note => "    " + note.description()).join("\n");
    }

    /**
     * @description returns the observers description
     * @returns {String} the observers description
     */
    observersDescription () {
        return this.observations() .map(obs => "    " + obs.description()).join("\n");
    }
    
    /**
     * @description shows the current note stack
     * @returns {SvNotificationCenter} the notification center
     */
    showCurrentNoteStack () {
        if (this.currentNote() === null) {
            //this.log("SvNotificationCenter.showCurrentNoteStack() warning - no current post")
        } else {
            this.log("current post sender stack: ", this.currentNote().senderStack());
        }
    }

}.initThisClass());
