"use strict";

/**
 * A subclass of Array that hooks the base mutation methods so we can
 * track mutations to the array and call willMutate and didMutate hooks.
 * 
 * For this to work, you need to use method alternatives to the non-method
 * array operations:
 * 
 *   - a[i] -> instead use a.at(i) 
 *   - a[i] = b -> instead use a.atPut(i, b)
 *   - delete a[i] -> instead use a.removeAt(i)
 * 
 * To do this without using method alternatives, we would need to use
 * a Proxy to intercept the array operations, which would be safer, 
 * but also slower and more memory intensive.
 * 
 * @module ideal.collections
 * @class HookedArray
 * @extends Array
 */

(class HookedArray extends Array {

    /**
     * Initializes prototype slots and sets up mutator hooks.
     */
    initPrototypeSlots () {
        //Object.defineSlot(this, "_allowsNulls", false)

        this.setupMutatorHooks()
        //Array.prototype.setupMutatorHooks()
    }

    // ------------------------------

    /**
     * @returns {Set<string>} A set of method names that mutate the array
     */
    mutatorMethodNamesSet () {
        // we can't hook []= or delete[] but we can hook these
        // and use hooked methods instead of operators for those
        return new Set([
            "copyWithin",
            "pop",
            "push",
            "reverse",
            "shift",
            "sort",
            "splice",
            "unshift"
        ])
    }

    /**
     * @returns {HookedArray} A read-only shallow copy of the array
     */
    asReadOnlyShalowCopy () {
        const obj = this.thisClass().withArray(this)
        obj.willMutate = () => {
            throw new Error("attempt to mutate a read only array")
        }
        return obj
    }

    /**
     * Performs a self-test of the HookedArray class
     * @returns {typeof HookedArray} The HookedArray class
     */
    static selfTest () {
        const a = this.clone()

        let gotWillMutate = false
        let gotDidMutate = false

        a.willMutate = () => {
            gotWillMutate = true
        }
        a.didMutate = () => {
            gotDidMutate = true
        }
        a.push("b")
        assert(gotWillMutate)
        assert(gotDidMutate)

        const b = a.asReadOnlyShalowCopy()

        let caughtReadOnlyMutate = false
        try {
            b.pop()
        } catch (e) {
            caughtReadOnlyMutate = true
        }
        assert(caughtReadOnlyMutate)

        console.log(this.type() + " - passed self test")
        return this
    }

}.initThisClass()); //.selfTest()

/*
(class Array_mutator extends Array {
    mutatorMethodNamesSet () {
        // we can't hook []= or delete[] but we can hook these
        // and use hooked methods instead of operators for those
        return new Set([
            "pop",
            "push",
            "reverse",
            "shift",
            "sort",
            "splice",
            "unshift"
        ])
    }
}).initThisCategory();

Array.prototype.setupMutatorHooks();
*/
