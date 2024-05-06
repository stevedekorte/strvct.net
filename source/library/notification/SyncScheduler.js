"use strict";

/*

    SyncScheduler

    SyncScheduler is sort of a lower level NotificationCenter.
    
    SyncScheduler essientially:
        - receives requests of the form "send targetA messageB"
        - and at the end of the event loop:
        -- coaleses them (so the same message isn't sent twice to the same target)
        -- sends them

    The NotificationCenter could be used to do this, but it would be heavier:
     - overhead of every receiver registering observations
     - overhead of matching observations with posts
     - potential garbage collection issues

    Motivation:

    Many state changes can cause the need to synchronize a given object 
    with others within a given event loop, but we only want synchronization to 
    happen at the end of an event loop, so a shared SyncScheduler instance is used to
    track which sync actions should be sent at the end of the event loop and only sends each one once.

    SyncScheduler should be used to replace most cases where this.addTimeout() would otherwise be used.

       example use:
    
        SyncScheduler.shared().scheduleTargetAndMethod(this, "syncToNode")

    Automatic sync loop detection

    It will throw an error if a sync action is scheduled while another is being performed,
    which ensures sync loops are avoided.

    Ordering

    Scheduled actions can also be given a priority via an optional 3rd argument:

        SyncScheduler.shared().scheduleTargetAndMethod(this, "syncToNode", 1)

    Higher priorities will be performed *later* than lower ones. 

    Some typical sync methods:

        // view
    	syncToNode	
        syncFromNode
        
    When to run

        When a UI event is handled, SyncSchedule.fullSyncNow should be called just before
        control is returned to the browser to ensure that another UI event won't occur
        before syncing as that could leave the node and view out of sync.
            For example:
                - edit view #1
                - sync to node
                - node posts didUpdateNode
                - edit view #2
                - view gets didUpdateNode and does syncFromNode which overwrites view state #2 causing an error!
            But the above would have been ok if the didUpdateNode was posted once at the end of the event loop.

    	
*/

(class SyncScheduler extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true)
        return this
    }
    
    initPrototypeSlots () {
        this.newSlot("actions", new Map())
        this.newSlot("hasTimeout", false)
        this.newSlot("isProcessing", false)
        this.newSlot("currentAction", null)
    }

    init () {
        super.init()
        //this.setIsDebugging(true)
    }

    newActionForTargetAndMethod (target, syncMethod, order) {
        return SyncAction.clone().setTarget(target).setMethod(syncMethod).setOrder(order ? order : 0)
    }
	
    scheduleTargetAndMethod (target, syncMethod, optionalOrder) { // higher order performed last
        if (!this.hasScheduledTargetAndMethod(target, syncMethod)) {
            const newAction = this.newActionForTargetAndMethod(target, syncMethod, optionalOrder)

            this.debugLog(() => "    -> scheduling " + newAction.description())

            /*
            if (this.isProcessing() && this.currentAction().method() !== "processPostQueue") {
                this.debugLog(() => "    - isProcessing " + this.currentAction().description() +  " while scheduling " + newAction.description())
            }
            */
            
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

    isSyncingOrScheduledTargetAndMethod(target, syncMethod) {
        const sc = this.hasScheduledTargetAndMethod(target, syncMethod) 
        const sy = this.isSyncingTargetAndMethod(target, syncMethod) 
        return sc || sy;
    }

    hasScheduledTargetAndMethod (target, syncMethod) {
        const actionKey = SyncAction.ActionKeyForTargetAndMethod(target, syncMethod)
    	return this.actions().hasKey(actionKey)
    }

    isSyncingTargetAndMethod (target, syncMethod) {
        const ca = this.currentAction()
        if (ca) {
            const action = this.newActionForTargetAndMethod(target, syncMethod)
    		return ca.equals(action)
        }
        return false
    }
    
    actionsForTarget (target) {
        return this.actions().valuesArray().select(action => action.target() === target)
    }

    hasActionsForTarget (target) {
        return this.actions().valuesArray().canDetect(action => action.target() === target)
    }

    unscheduleTarget (target) {
        if (this.hasActionsForTarget(target)) {
            console.log("unscheduling target " + target.debugTypeId())

            if (this.isProcessing()) {
                console.warn("WARNING: SynScheduler unscheduleTarget while processing actions set - will unschedule action")
                //debugger;
                //return this
            }

            this.actionsForTarget(target).forEach(action => {
                this.removeActionKey(action.actionsKey())
            })
        }

        assert(!this.hasActionsForTarget()) // todo: remove this sanity check
        return this
    }

    // return SyncScheduler.shared().isSyncingOrScheduledTargetAndMethod(this, "syncFromNode")


    unscheduleTargetAndMethod (target, syncMethod) {
        const k = this.newActionForTargetAndMethod(target, syncMethod).actionsKey()
        this.removeActionKey(k)
        return this
    }

    removeActionKey (k) {
        const action = this.actions().at(k)
        if (action) {
            action.setIsUnscheduled(true)
            this.actions().removeKey(k)
        }
        return this
    }
	
    setTimeoutIfNeeded () {
	    if (!this.hasTimeout()) {
            this.setHasTimeout(true)
	        this.addTimeout(() => { 
	            this.setHasTimeout(false)
	            this.processSets() 
	        }, 1)
	    }
	    return this
    }
	
    orderedActions () {
        const sorter = function (a1, a2) { return a1.order() - a2.order() }
        return this.actions().valuesArray().sort(sorter)
    }
	
    processSets () {
        if (this.isProcessing()) {
            console.warn("WARNING: SynScheduler attempt to processSets before last set is completed")
            return this
        }
        assert(!this.isProcessing())

        //console.log(" --- SyncScheduler BEGIN ---")
        //this.show()

        this.setIsProcessing(true)
        let error = null

        //this.debugLog(this.description())
        this.debugLog("Sync")
        
        const actions = this.orderedActions()
        this.actions().clear()
 
        actions.forEach((action) => {
            if (action.isUnscheduled()) {
               debugger;
            } else {
                this.setCurrentAction(action)
                const actionError = action.tryToSend()
                //const actionError = action.send()
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

        //console.log(" --- SyncScheduler END --- (END OF EVENT LOOP!)")

        return this
    }

    actionCount () {
        return this.actions().size
    }

    fullSyncNow () {
        if (this.isProcessing()) {
            this.debugLog(() => "fullSyncNow called while isProcessing so SKIPPING")
            return this
        }

        if (this.actionCount()) {
            this.debugLog(" --- fullSyncNow start --- ")
            let count = 0
            const maxCount = 10

            while (this.actionCount()) {
                /*
                if (count > -1) {
                    console.log("\nSyncScheduler looped " + count + " times, queue size is: " + this.actionCount() + "\n")
                }
                */

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

    actionsDescription () {
        if (this.orderedActions().length === 0) {
            return "none";
        }
        return this.orderedActions().map(action => "    " + action.description() ).join("\n")
    }

    show () {
        console.log(this.type() + ":")
        console.log(this.actionsDescription())
    }

}.initThisClass());

