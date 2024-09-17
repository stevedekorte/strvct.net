"use strict";

/**
 * HookedMap is a subclass of Map that hooks the base mutation methods.
 * 
 * The JS Map object holds key-value pairs and remembers the original insertion order of the keys.
 * For this to work, you need to use method alternatives to the non-method (operator) operations.
 *
 * @module ideal.collections
 * @class HookedMap
 * @extends Map
 */

(class HookedMap extends Map {

    /**
     * Initializes the prototype slots and sets up mutator hooks.
     */
    initPrototypeSlots () {
        this.setupMutatorHooks()
    }

    /**
     * Returns a Set of mutator method names that should be hooked.
     * @returns {Set<string>} A Set containing the names of mutator methods.
     */
    mutatorMethodNamesSet () {
        return new Set([
            "clear",
            "delete",
            "set",
        ])
    }

    /**
     * Performs a self-test of the HookedMap class.
     * @returns {HookedMap} Returns the class itself after the test.
     */
    static selfTest () {
        const a = this.clone()
        
        let gotWillMutate = false
        let gotDidMutate = false

        /**
         * Hook called before a mutation occurs.
         * @method willMutate
         */
        a.willMutate = () => {
            gotWillMutate = true
        }

        /**
         * Hook called after a mutation occurs.
         * @method didMutate
         */
        a.didMutate = () => {
            gotDidMutate = true
        }

        a.clear()
        assert(gotWillMutate)
        assert(gotDidMutate)

        console.log(this.type() + " - passed self test")
        return this
    }

}.initThisClass()); //.selfTest()

