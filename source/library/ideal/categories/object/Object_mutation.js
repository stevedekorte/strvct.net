"use strict";

/**
 * Object category to support observing slot value changes (i.e. "mutations").
 * 
 * @module ideal.object
 * @class Object_mutation
 * @extends Object
 */
(class Object_mutation extends Object {

    /**
     * Returns a Set of mutator method names that should be hooked.
     * @throws {Error} If not implemented by the subclass.
     * @returns {Set<string>} A Set of mutator method names.
     */
    mutatorMethodNamesSet () {
        throw new Error("undefined mutatorMethodNamesSet on '" + this.type() + "' class")
    }

    /**
     * Sets up mutator hooks for the prototype.
     * This method copies each slot whose name is in mutatorMethodNamesSet
     * to unhooked_<slotName>, and implements a slot which calls the
     * unhooked version after calling this.willMutate(slotName).
     */
    setupMutatorHooks () {
        // this is to be called on a prototype
        // it copies each slot whose name is in mutatorMethodNamesSet
        // to unhooked_<slotName>, and implements a slot which calls the
        // unhooked version after calling this.willMutate(slotName)
        
        this.mutatorMethodNamesSet().forEach((slotName) => {
            const unhookedName = "unhooked_" + slotName
            const unhookedFunction = this[slotName]
    
            Object.defineSlot(this, unhookedName, unhookedFunction)
    
            const hookedFunction = function () {
                this.willMutate(slotName, arguments)
                const result = this[unhookedName].apply(this, arguments)
                this.didMutate(slotName)
    
                //let argsString = []
                //for (let i=0; i < arguments.length; i++) {
                //    if (i !== 0) { argsString += ", " }
                //    argsString += String(arguments[i])
                //}
                //console.log("hooked Array " + slotName + "(" + argsString + ")") 
                //console.log("result = " + result)
    
                return result
            }
    
            Object.defineSlot(this, slotName, hookedFunction)
        })
    }

    // -----------------------------------------

    /**
     * Sets the mutation observers for this object.
     * @param {Set} aSet - A Set of mutation observers.
     * @returns {Object_mutation} This object.
     */
    setMutationObservers (aSet) {
        this._mutationObservers = aSet
        return this
    }

    /**
     * Gets the mutation observers for this object.
     * @returns {Set} A Set of mutation observers.
     */
    mutationObservers () {
        if (!this._mutationObservers) {
            this.setMutationObservers(new Set())
        }
        return this._mutationObservers
    }

    /**
     * Checks if this object has any mutation observers.
     * @returns {boolean} True if there are mutation observers, false otherwise.
     */
    hasMutationObservers () {
        const mos = this._mutationObservers
        return mos && mos.size > 0
    }

    /**
     * Adds a mutation observer to this object.
     * @param {Object} anObserver - The observer to add.
     * @returns {Object_mutation} This object.
     */
    addMutationObserver (anObserver) {
        this.mutationObservers().add(anObserver)
        return this
    }

    /**
     * Removes a mutation observer from this object.
     * @param {Object} anObserver - The observer to remove.
     * @returns {Object_mutation} This object.
     */
    removeMutationObserver (anObserver) {
        assert(anObserver)
        this.mutationObservers().delete(anObserver)
        return this
    }

    // ------

    /**
     * Called before a mutation occurs.
     * This method is currently empty but can be overridden or extended.
     */
    willMutate () {
        /*
        const mos = this._mutationObservers
        if (mos) {
            mos.forEach(v => { 
                v.onWillMutateObject(this)
            })
        }
        */
    }

    /**
     * Called after a mutation occurs.
     * Notifies all mutation observers.
     * @param {string} [optionalSlotName] - The name of the slot that was mutated, if applicable.
     */
    didMutate (optionalSlotName) {
        const mos = this._mutationObservers
        if (mos) {
            //console.log("" + this.debugTypeId() + ".didMutate()")
            mos.forEach(obs => {
                obs.onDidMutateObject(this, optionalSlotName)
            })
        }
    }

}).initThisCategory();
