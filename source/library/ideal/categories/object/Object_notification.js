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
        return this.watchOnceForNote(aNoteName).setSender(sender)
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
