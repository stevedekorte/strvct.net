"use strict";

/*

    Object_mutation 

    Object category to support observing slot value changes (i.e. "mutations").

*/

(class Object_mutation extends Object {

    mutatorMethodNamesSet () {
        throw new Error("undefined mutatorMethodNamesSet on '" + this.type() + "' class")
    }

    
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

    setMutationObservers (aSet) {
        this._mutationObservers = aSet
        return this
    }

    mutationObservers () {
        if (!this._mutationObservers) {
            this.setMutationObservers(new Set())
        }
        return this._mutationObservers
    }

    hasMutationObservers () {
        const mos = this._mutationObservers
        return mos && mos.size > 0
    }

    addMutationObserver (anObserver) {
        this.mutationObservers().add(anObserver)
        return this
    }

    removeMutationObserver (anObserver) {
        assert(anObserver)
        this.mutationObservers().delete(anObserver)
        return this
    }

    // ------

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
