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

    // --- watch once ---

    watchOnceForNote (aNoteName) {
        const obs = BMNotificationCenter.shared().newObservation()
        obs.setName(aNoteName)
        obs.setObserver(this)
        obs.setIsOneShot(true)
        obs.startWatching()
        //this.debugLog(".watchOnceForNote('" + aNoteName + "')")
        return obs
    }

    watchOnceForNoteFrom (aNoteName, sender) {
        return this.watchOnceForNote(aNoteName).setSender(sender) // does it work to set sender aftert it's started watching?
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

}).initThisCategory();
