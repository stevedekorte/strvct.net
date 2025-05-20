"use strict";

/**
 * Object category to support notification and observation functionality.
 * 
 * @module library.ideal.object
 * @class Object_notification
 * @extends Object
 */
(class Object_notification extends Object {

    /**
     * Prepares the object for retirement by removing notification observers and scheduled actions.
     * @category Lifecycle
     */
    prepareToRetire () { 
        // opportunity to remove notification observers, event listeners, etc
        //this.assertNotRetired()
        this.removeAllNotificationObservations()
        this.removeScheduledActions()
    }

    // -------------------------------------------------
 
    /**
     * Removes all notification observations for this object.
     * @category Notification
     */
    removeAllNotificationObservations () {
        if (getGlobalThis()["BMNotificationCenter"]) {
            BMNotificationCenter.shared().removeObserver(this)
        }
    }
 
    /**
     * Removes all scheduled actions for this object.
     * @category Scheduling
     */
    removeScheduledActions () {
        if (getGlobalThis()["SyncScheduler"]) {
            SyncScheduler.shared().unscheduleTarget(this)
        }
    }

    // --- notification helpers --- 

    /**
     * Watches a specific sender for all notifications.
     * @param {Object} sender - The sender to watch.
     * @returns {Object} The observation object.
     * @category Notification
     */
    watchSender (sender) {
        const obs = BMNotificationCenter.shared().newObservation()
        obs.setObserver(this)
        obs.setIsOneShot(false)
        obs.setSender(sender)
        obs.startWatching()
        return obs
    }

    /**
     * Watches for a specific notification from a specific sender.
     * @param {string} aNoteName - The name of the notification to watch for.
     * @param {Object} sender - The sender to watch.
     * @returns {Object} The observation object.
     * @category Notification
     */
    watchForNoteFrom (aNoteName, sender) {
        const obs = BMNotificationCenter.shared().newObservation()
        obs.setObserver(this)
        //obs.setIsOneShot(false)
        obs.setSender(sender)
        obs.setName(aNoteName)
        obs.startWatching()
        return obs
    }

    /**
     * Watches for a specific notification from any sender.
     * @param {string} aNoteName - The name of the notification to watch for.
     * @returns {Object} The observation object.
     * @category Notification
     */
    watchForNote (aNoteName) {
        const obs = BMNotificationCenter.shared().newObservation()
        obs.setName(aNoteName)
        obs.setObserver(this)
        obs.startWatching()
        return obs
    }

    // --- watch once ---

    /**
     * Watches for a specific notification once from any sender.
     * @param {string} aNoteName - The name of the notification to watch for.
     * @returns {Object} The observation object.
     * @category Notification
     */
    watchOnceForNote (aNoteName) {
        return this.watchForNote(aNoteName).setIsOneShot(true)
    }

    /**
     * Watches for a specific notification once from a specific sender.
     * @param {string} aNoteName - The name of the notification to watch for.
     * @param {Object} sender - The sender to watch.
     * @returns {Object} The observation object.
     * @category Notification
     */
    watchOnceForNoteFrom (aNoteName, sender) {
        return this.watchOnceForNote(aNoteName).setSender(sender) // does it work to set sender after it's started watching?
    }

    /**
     * Creates a new notification with this object as the sender.
     * @param {string} aNoteName - The name of the notification.
     * @returns {Object} The new notification object.
     * @category Notification
     */
    newNoteNamed (aNoteName) {
        const note = BMNotificationCenter.shared().newNote()
        note.setSender(this)
        note.setName(aNoteName)
        return note
    }

    /**
     * Posts a new notification with this object as the sender.
     * @param {string} aNoteName - The name of the notification.
     * @returns {Object} The posted notification object.
     * @category Notification
     */
    postNoteNamed (aNoteName) {
        const note = this.newNoteNamed(aNoteName)
        note.post()
        //this.debugLog(".postNoteNamed('" + aNoteName + "')")
        return note
    }

    /**
     * Schedules a method to be called after a specified delay.
     * @param {string} aMethodName - The name of the method to schedule.
     * @param {number} milliseconds - The delay in milliseconds.
     * @returns {*} The result of scheduling the method.
     * @category Scheduling
     */
    scheduleSelfFor (aMethodName, milliseconds) {
        return SyncScheduler.shared().scheduleTargetAndMethod(this, aMethodName, milliseconds)
    }

    // --- who's watching who ---

    /**
     * Gets the objects that are watching this object for notifications.
     * @returns {Array} An array of objects watching this object.
     * @category Notification
     */
    watchers () {
        // objects we are watching for notifications from 
        return BMNotificationCenter.shared().observersOfSender(this);
    }

    /**
     * Gets the observations registered by this object.
     * @returns {Array} An array of observations registered by this object.
     * @category Notification
     */
    ourObservations () {
        // observations we have registered
        return BMNotificationCenter.shared().observationsWithObserver(this);
    }

    /**
     * Gets the specific senders this object is watching.
     * @returns {Array} An array of unique senders this object is watching.
     * @category Notification
     */
    specificSendersWatched () {
        // senders we are watching
        return this.ourObservations().map(obs => obs.sender()).unique();
    }

}).initThisCategory();