//"use strict";

/*

    Object_notification

*/


(class Object_notification extends Object {
 
    assertNotRetired () {
        if (this._isObjectRetired) {
            throw new Error("object already retired")
        }
    }
 
    prepareToRetire () { // move this to Object_ideal and call willRetire if available and define that here?
        this.assertNotRetired()
        // called by user code when it expect object to stop being used
        // provides opportunity to remove notification observers, event listeners, etc
        this.removeAllNotificationObservations()
        this.removeScheduledActions()
        this._isObjectRetired = true
        //console.log("Object retiring " + this.debugTypeId())
    }
 
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
        obs.watch()
        //this.debugLog(".watchOnceForNote('" + aNoteName + "')")
        return obs
    }

    watchOnceForNoteFrom (aNoteName, sender) {
        return this.watchOnceForNote(aNoteName).setTarget(sender)
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
