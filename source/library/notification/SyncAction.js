/**
 * @module library.notification
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
     * @category Key Generation
     */
    static actionKeyForTargetAndMethod (target, method) {
        assert(target, "target is null");
        assert(target.svTypeId, Type.typeName(target) + " class missing svTypeId");
        return target.svTypeId() + "." + method;
    }

    /**
     * @description Initializes the prototype slots for the SyncAction class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Object} target
         * @description The target object for the action.
         * @category Action Properties
         */
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {string} method
         * @description The method name to be called on the target.
         * @category Action Properties
         */
        {
            const slot = this.newSlot("method", null);
            slot.setSlotType("String");
        }
        /**
         * @member {number} order
         * @description The execution order of the action.
         * @category Action Properties
         */
        {
            const slot = this.newSlot("order", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Array} args
         * @description The arguments to be passed to the method.
         * @category Action Properties
         */
        {
            const slot = this.newSlot("args", null);
            slot.setSlotType("Array");
        }
        /**
         * @member {boolean} isUnscheduled
         * @description Indicates if the action is unscheduled.
         * @category Action State
         */
        {
            const slot = this.newSlot("isUnscheduled", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Error} error
         * @description Stores any error that occurs during action execution.
         * @category Error Handling
         */
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }
    }

    /**
     * @description Initializes the prototype of the SyncAction class.
     * @category Initialization
     */
    initPrototype () {
    }
	
    /**
     * @description Attempts to send the action, catching and handling any errors.
     * @returns {Error|null} The caught error or null if successful.
     * @category Action Execution
     */
    tryToSend () {
        try {
            this.send();
        } catch(error) {
            console.warn(this.svTypeId() + ".tryToSend(" + this.description() + ") caught exception: ");
            error.show();
            this.setError(error);
            return error;
        }
        return null;
    }
	
    /**
     * @description Sends the action by calling the specified method on the target.
     * @returns {null}
     * @category Action Execution
     */
    send () {
        //this.logDebug(() => "   <- sending " + this.description())
        const t = this.target();
        const m = this.method();
        const a = this.args();
        t[m].apply(t, a ? a : []);
        return null;
    }
	
    /**
     * @description Generates the actions key for this action.
     * @returns {string} The actions key.
     * @category Key Generation
     */
    actionsKey () {
        return SyncAction.actionKeyForTargetAndMethod(this.target(), this.method());;
    }
	
    /**
     * @description Checks if this action equals another action.
     * @param {SyncAction} anAction - The action to compare with.
     * @returns {boolean} True if the actions are equal, false otherwise.
     * @category Comparison
     */
    equals (anAction) {
        return anAction !== null && 
               (this.target() === anAction.target()) && 
               (this.method() === anAction.method());
    }
	
    /**
     * @description Generates a description of this action.
     * @returns {string} The action description.
     * @category Utility
     */
    description () {
        const t = this.target() ? this.target().debugTypeId() : "null";
        const o = this.order() === 0 ? "" : " order:" + this.order();
        return this.svTypeId() + " " + t + " " + this.method() + "" + o;
    }

}.initThisClass());