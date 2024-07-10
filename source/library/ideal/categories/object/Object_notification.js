"use strict";

/*

    Object_notification

*/


(class Object_notification extends Object {

    prepareToRetire () { 
        // opportunity to remove notification observers, event listeners, etc
        //this.assertNotRetired()
        this.removeAllNotificationObservations()
        this.removeScheduledActions()
    }

    // -------------------------------------------------
 
    removeAllNotificationObservations () {
        if (getGlobalThis()["BMNotificationCenter"]) {
            BMNotificationCenter.shared().removeObserver(this)
        }
    }
 
    removeScheduledActions () {
        if (getGlobalThis()["SyncScheduler"]) {
            SyncScheduler.shared().unscheduleTarget(this)
        }
    }

    // --- notification helpers --- 

    // --- watch ---

    watchSender (sender) {
        const obs = BMNotificationCenter.shared().newObservation()
        obs.setObserver(this)
        obs.setIsOneShot(false)
        obs.setSender(sender)
        obs.startWatching()
        return obs
    }

    watchForNoteFrom (aNoteName, sender) {
        const obs = BMNotificationCenter.shared().newObservation()
        obs.setObserver(this)
        //obs.setIsOneShot(false)
        obs.setSender(sender)
        obs.setName(aNoteName)
        obs.startWatching()
        return obs
    }

    watchForNote (aNoteName) {
        const obs = BMNotificationCenter.shared().newObservation()
        obs.setName(aNoteName)
        obs.setObserver(this)
        obs.startWatching()
        return obs
    }

    // --- watch once ---

    watchOnceForNote (aNoteName) {
        return this.watchForNote(aNoteName).setIsOneShot(true)
    }

    watchOnceForNoteFrom (aNoteName, sender) {
        return this.watchOnceForNote(aNoteName).setSender(sender) // does it work to set sender after it's started watching?
    }

    newNoteNamed (aNoteName) {
        const note = BMNotificationCenter.shared().newNote()
        note.setSender(this)
        note.setName(aNoteName)
        return note
    }

    postNoteNamed (aNoteName) {
        const note = this.newNoteNamed(aNoteName)
        note.post()
        //this.debugLog(".postNoteNamed('" + aNoteName + "')")
        return note
    }

    scheduleSelfFor (aMethodName, milliseconds) {
        return SyncScheduler.shared().scheduleTargetAndMethod(this, aMethodName, milliseconds)
    }

    // --- who's watching who ---

    watchers () {
        // objects we are watching for notifications from 
        return BMNotificationCenter.shared().observersOfSender(this);
    }

    ourObservations () {
        // observations we have registered
        return BMNotificationCenter.shared().observationsWithObserver(this);
    }

    specificSendersWatched () {
        // senders we are watching
        return this.ourObservations().map(obs => obs.sender()).unique();
    }

}).initThisCategory();
