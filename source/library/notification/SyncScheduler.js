"use strict";

/**
 * @module library.notification
 */

/**
 * @class SyncScheduler
 * @extends ProtoClass
 * @classdesc SyncScheduler is sort of a lower level NotificationCenter.
 * 
 * SyncScheduler essentially:
 * - receives requests of the form "send targetA messageB" (Note: often, the sender is also the target)
 * - and at the end of the event loop (via a timeout):
 *   -- coaleses them (so the same message isn't sent twice to the same target)
 *   -- sends them
 * 
 * The NotificationCenter could be used to do this, but it would be heavier:
 * - overhead of every receiver registering observations
 * - overhead of matching observations with posts
 * - potential garbage collection issues (may already be solved with weak references now)
 * 
 * Motivation:
 * 
 * Many state changes can cause the need to synchronize a given object 
 * with others within a given event loop, but we only want synchronization to 
 * happen at the end of an event loop, so a shared SyncScheduler instance is used to
 * track which sync actions should be sent at the end of the event loop and only sends each one once.
 * 
 * SyncScheduler should be used to replace most cases where this.addTimeout() would otherwise be used.
 * 
 * Example use:
 * 
 * SyncScheduler.shared().scheduleTargetAndMethod(this, "syncToNode");
 * 
 * Automatic sync loop detection:
 * 
 * It will throw an error if a sync action is scheduled while another is being performed,
 * which ensures sync loops are avoided.
 * 
 * Ordering:
 * 
 * Scheduled actions can also be given a priority via an optional 3rd argument:
 * 
 * SyncScheduler.shared().scheduleTargetAndMethod(this, "syncToNode", 1);
 * 
 * Higher priorities will be performed *later* than lower ones. 
 * 
 * Some typical sync methods:
 * 
 * // view
 * syncToNode	
 * syncFromNode
 * 
 * When to run:
 * 
 * When a UI event is handled, SyncSchedule.fullSyncNow should be called just before
 * control is returned to the browser to ensure that another UI event won't occur
 * before syncing as that could leave the node and view out of sync.
 * For example:
 * - edit view #1
 * - sync to node
 * - node posts didUpdateNode
 * - edit view #2
 * - view gets didUpdateNode and does syncFromNode which overwrites view state #2 causing an error!
 * But the above would have been ok if the didUpdateNode was posted once at the end of the event loop.
 * 
 * Pause and Resume:
 * 
 * SyncScheduler can be paused and resumed to prevent syncing from happening.
 * An example of when this is useful is when initializing the application (e.g. appDidInit) 
 * and you don't want any syncing to happen until the app is fully initialized.
 * Example use:
 * 
 * SyncScheduler.shared().pause()
 * SyncScheduler.shared().resume()
 */
(class SyncScheduler extends ProtoClass {

    /**
     * @static
     * @description Initializes the class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Map} actions
         * @category State
         */
        {
            const slot = this.newSlot("actions", new Map());
            slot.setSlotType("Map");
        }

        /**
         * @member {Boolean} hasTimeout
         * @category State
         */
        {
            const slot = this.newSlot("hasTimeout", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} isProcessing
         * @category State
         */
        {
            const slot = this.newSlot("isProcessing", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {SyncAction} currentAction
         * @category State
         */
        {
            const slot = this.newSlot("currentAction", null);
            slot.setSlotType("SyncAction");
        }

        /**
         * @member {Boolean} isPaused
         * @category State
         */
        {
            const slot = this.newSlot("isPaused", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Pauses the scheduler
     * @returns {SyncScheduler} The instance
     * @category Control
     */
    pause () {
        this.setIsPaused(true);
        return this;
    }

    /**
     * @description Resumes the scheduler
     * @returns {SyncScheduler} The instance
     * @category Control
     */
    resume () {
        this.setIsPaused(false);
        this.setTimeoutIfNeeded();
        return this;
    }

    /**
     * @description Creates a new SyncAction
     * @param {Object} target - The target object
     * @param {string} syncMethod - The sync method name
     * @param {number} [order] - The order of execution
     * @returns {SyncAction} The new SyncAction instance
     * @category Action Management
     */
    newActionForTargetAndMethod (target, syncMethod, order) {
        return SyncAction.clone().setTarget(target).setMethod(syncMethod).setOrder(order ? order : 0)
    }
	
    /**
     * @description Schedules a target and method for sync
     * @param {Object} target - The target object
     * @param {string} syncMethod - The sync method name
     * @param {number} [optionalOrder] - The optional order of execution
     * @returns {boolean} True if scheduled, false if already scheduled
     * @category Scheduling
     */
    scheduleTargetAndMethod (target, syncMethod, optionalOrder) { // higher order performed last
        if (!this.hasScheduledTargetAndMethod(target, syncMethod)) {
            const newAction = this.newActionForTargetAndMethod(target, syncMethod, optionalOrder)

            this.debugLog(() => "    -> scheduling " + newAction.description())
            
            if (syncMethod !== "processPostQueue") {
                if (this.currentAction() && this.currentAction().equals(newAction)) {
                    const error = [
                        this.type() + " LOOP DETECTED: ",
                        "  scheduleTargetAndMethod: (" + newAction.description() + ")",
                        "  while processing: (" + this.currentAction().description() + ")"
                    ].join("\n")
                    console.log(error)
                    debugger
                    throw new Error(error)
                }
            }

            this.actions().atIfAbsentPut(newAction.actionsKey(), newAction)
	    	this.setTimeoutIfNeeded()
            return true
        }
		
        return false
    }

    /**
     * @description Checks if a target and method is syncing or scheduled
     * @param {Object} target - The target object
     * @param {string} syncMethod - The sync method name
     * @returns {boolean} True if syncing or scheduled, false otherwise
     * @category Query
     */
    isSyncingOrScheduledTargetAndMethod(target, syncMethod) {
        const sc = this.hasScheduledTargetAndMethod(target, syncMethod) 
        const sy = this.isSyncingTargetAndMethod(target, syncMethod) 
        return sc || sy;
    }

    /**
     * @description Checks if a target and method is scheduled
     * @param {Object} target - The target object
     * @param {string} syncMethod - The sync method name
     * @returns {boolean} True if scheduled, false otherwise
     * @category Query
     */
    hasScheduledTargetAndMethod (target, syncMethod) {
        const actionKey = SyncAction.ActionKeyForTargetAndMethod(target, syncMethod)
    	return this.actions().hasKey(actionKey)
    }

    /**
     * @description Checks if a target and method is currently syncing
     * @param {Object} target - The target object
     * @param {string} syncMethod - The sync method name
     * @returns {boolean} True if syncing, false otherwise
     * @category Query
     */
    isSyncingTargetAndMethod (target, syncMethod) {
        const ca = this.currentAction()
        if (ca) {
            const action = this.newActionForTargetAndMethod(target, syncMethod)
    		return ca.equals(action)
        }
        return false
    }
    
    /**
     * @description Gets all actions for a target
     * @param {Object} target - The target object
     * @returns {Array} An array of actions for the target
     * @category Query
     */
    actionsForTarget (target) {
        return this.actions().valuesArray().select(action => action.target() === target)
    }

    /**
     * @description Checks if there are actions for a target
     * @param {Object} target - The target object
     * @returns {boolean} True if there are actions, false otherwise
     * @category Query
     */
    hasActionsForTarget (target) {
        return this.actions().valuesArray().canDetect(action => action.target() === target)
    }

    /**
     * @description Unschedules all actions for a target
     * @param {Object} target - The target object
     * @returns {SyncScheduler} The instance
     * @category Scheduling
     */
    unscheduleTarget (target) {
        if (this.hasActionsForTarget(target)) {
            console.log("unscheduling target " + target.debugTypeId())

            if (this.isProcessing()) {
                console.warn("WARNING: SynScheduler unscheduleTarget while processing actions set - will unschedule action")
            }

            this.actionsForTarget(target).forEach(action => {
                this.removeActionKey(action.actionsKey())
            })
        }

        assert(!this.hasActionsForTarget()) // todo: remove this sanity check
        return this
    }

    /**
     * @description Unschedules a specific target and method
     * @param {Object} target - The target object
     * @param {string} syncMethod - The sync method name
     * @returns {SyncScheduler} The instance
     * @category Scheduling
     */
    unscheduleTargetAndMethod (target, syncMethod) {
        const k = this.newActionForTargetAndMethod(target, syncMethod).actionsKey()
        this.removeActionKey(k)
        return this
    }

    /**
     * @description Removes an action by its key
     * @param {string} k - The action key
     * @returns {SyncScheduler} The instance
     * @category Action Management
     */
    removeActionKey (k) {
        const action = this.actions().at(k)
        if (action) {
            action.setIsUnscheduled(true)
            this.actions().removeKey(k)
        }
        return this
    }
	
    /**
     * @description Sets a timeout if needed
     * @returns {SyncScheduler} The instance
     * @category Control
     */
    setTimeoutIfNeeded () {
	    if (!this.hasTimeout() && !this.isPaused() && this.actions().size > 0) {
            this.setHasTimeout(true);
	        this.addTimeout(() => { 
	            this.setHasTimeout(false);
	            this.processSets();
	        }, 1);
	    }
	    return this;
    }
	
    /**
     * @description Gets the ordered actions
     * @returns {Array} An array of ordered actions
     * @category Query
     */
    orderedActions () {
        const sorter = function (a1, a2) { return a1.order() - a2.order() }
        return this.actions().valuesArray().sort(sorter)
    }
	
    /**
     * @description Processes the sets of actions
     * @returns {SyncScheduler} The instance
     * @category Processing
     */
    processSets () {
        if (this.isPaused()) {
            return this;
        }

        if (this.isProcessing()) {
            console.warn("WARNING: SynScheduler attempt to processSets before last set is completed")
            return this
        }
        assert(!this.isProcessing())

        this.setIsProcessing(true)
        let error = null

        this.debugLog("Sync")
        
        const actions = this.orderedActions()
        this.actions().clear()
 
        actions.forEach((action) => {
            if (action.isUnscheduled()) {
               debugger;
            } else {
                this.setCurrentAction(action)
                const actionError = action.tryToSend()
                if (actionError) {
                    error = actionError
                }
                this.setCurrentAction(null)
            }
        })
        
        this.setCurrentAction(null)
        this.setIsProcessing(false)
        
        if (error) {
            error.rethrow();
        }

        return this
    }

    /**
     * @description Gets the count of actions
     * @returns {number} The number of actions
     * @category Query
     */
    actionCount () {
        return this.actions().size
    }

    /**
     * @description Performs a full sync now
     * @returns {SyncScheduler} The instance
     * @category Processing
     */
    fullSyncNow () {
        if (this.isPaused()) {
            return this
            
        }
        if (this.isProcessing()) {
            this.debugLog(() => "fullSyncNow called while isProcessing so SKIPPING")
            return this
        }

        if (this.actionCount()) {
            this.debugLog(" --- fullSyncNow start --- ")
            let count = 0
            const maxCount = 10

            while (this.actionCount()) {
                this.processSets()
                count ++

                if (count > 6) {
                    this.setIsDebugging(true)
                    console.log("\n\nSyncScheduler looped " + count + " times without resolving. Are we in a sync loop?")
                    console.log(" --- processSets # " + count + " --- ")
                    console.log("\nSyncActions (" + this.actionCount() + ") :\n" + this.actionsDescription())
                    console.log("\n" + BMNotificationCenter.shared().shortDescription() + ":\n" + BMNotificationCenter.shared().notesDescription())
                    console.log(" --- ")
                    debugger
                }
                assert (count < maxCount)
            }

            this.debugLog(" --- fullSyncNow end --- ")
        }

        return this
    }

    /**
     * @description Gets a description of the actions
     * @returns {string} A string describing the actions
     * @category Query
     */
    actionsDescription () {
        if (this.orderedActions().length === 0) {
            return "none";
        }
        return this.orderedActions().map(action => "    " + action.description() ).join("\n")
    }

    /**
     * @description Shows the scheduler's current state
     * @category Debugging
     */
    show () {
        console.log(this.type() + ":")
        console.log(this.actionsDescription())
    }

}.initThisClass());