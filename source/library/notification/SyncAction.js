/**
 * @module library.notification.SyncAction
 */

"use strict";

/**
 * @class SyncAction
 * @extends ProtoClass
 * @classdesc An action managed by the SyncScheduler.
 */
(class SyncAction extends ProtoClass {
    /**
     * @static
     * @description Generates a unique action key for a target and method combination.
     * @param {Object} target - The target object.
     * @param {string} method - The method name.
     * @returns {string} The generated action key.
     */
    static ActionKeyForTargetAndMethod(target, method) {
        return target.typeId() + "." + method;
    }

    /**
     * @description Initializes the prototype slots for the SyncAction class.
     */
    initPrototypeSlots() {
        /**
         * @member {Object} target
         * @description The target object for the action.
         */
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {string} method
         * @description The method name to be called on the target.
         */
        {
            const slot = this.newSlot("method", null);
            slot.setSlotType("String");
        }
        /**
         * @member {number} order
         * @description The execution order of the action.
         */
        {
            const slot = this.newSlot("order", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Array} args
         * @description The arguments to be passed to the method.
         */
        {
            const slot = this.newSlot("args", null);
            slot.setSlotType("Array");
        }
        /**
         * @member {boolean} isUnscheduled
         * @description Indicates if the action is unscheduled.
         */
        {
            const slot = this.newSlot("isUnscheduled", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Error} error
         * @description Stores any error that occurs during action execution.
         */
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }
    }

    /**
     * @description Initializes the prototype of the SyncAction class.
     */
    initPrototype() {
    }
	
    /**
     * @description Attempts to send the action, catching and handling any errors.
     * @returns {Error|null} The caught error or null if successful.
     */
    tryToSend() {
        try {
            this.send();
        } catch(error) {
            console.warn(this.typeId() + ".tryToSend(" + this.description() + ") caught exception: ");
            error.show();
            this.setError(error);
            return error;
        }
        return null;
    }
	
    /**
     * @description Sends the action by calling the specified method on the target.
     * @returns {null}
     */
    send() {
        //this.debugLog(() => "   <- sending " + this.description())
        const t = this.target();
        const m = this.method();
        const a = this.args();
        t[m].apply(t, a ? a : []);
        return null
    }
	
    /**
     * @description Generates the actions key for this action.
     * @returns {string} The actions key.
     */
    actionsKey() {
        return SyncAction.ActionKeyForTargetAndMethod(this.target(), this.method())
    }
	
    /**
     * @description Checks if this action equals another action.
     * @param {SyncAction} anAction - The action to compare with.
     * @returns {boolean} True if the actions are equal, false otherwise.
     */
    equals(anAction) {
        return anAction !== null && 
               (this.target() === anAction.target()) && 
               (this.method() === anAction.method())
    }
	
    /**
     * @description Generates a description of this action.
     * @returns {string} The action description.
     */
    description() {
        const t = this.target() ? this.target().debugTypeId() : "null"
        const o = this.order() === 0 ? "" : " order:" + this.order()
        return this.typeId() + " " + t + " " + this.method() + "" + o
    }

}.initThisClass());