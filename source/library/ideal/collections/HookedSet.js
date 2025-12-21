"use strict";

/** * @module library.ideal.collections
 */

/** * @class HookedSet
 * @extends Set
 
 
 */

/**

 * A subclass of Set that hooks the base mutation methods.
 *
 * For this to work, you need to use method alternatives to the non-method
 * (operator) operations.
 */

(class HookedSet extends Set {

    /**
     * Sets up mutator hooks.
     * @category Initialization
     */
    initPrototypeSlots () {
        this.setupMutatorHooks();
    }

    // ------------------------------

    /**
     * Returns a Set of mutator method names that should be hooked.
     * These include add, clear, and delete.
     * @returns {Set<string>} A Set containing the names of mutator methods.
     * @category Configuration
     */
    mutatorMethodNamesSet () {
        return new Set([
            "add",
            "clear",
            "delete"
        ]);
    }

    /**
     * Performs a self-test of the HookedSet class.
     * @returns {boolean} True if the self-test passes, false otherwise.
     * @category Testing
     */
    static selfTest () {
        const a = this.clone();

        let gotWillMutate = false;
        let gotDidMutate = false;

        a.willMutate = () => {
            gotWillMutate = true;
        };

        a.didMutate = () => {
            assert(gotWillMutate);
            gotDidMutate = true;
        };

        a.add("b");
        assert(gotWillMutate);
        assert(gotDidMutate);

        console.log(this.svType() + " - passed self test");
        return true;
    }

}.initThisClass());

//HookedSet.selfTest()
