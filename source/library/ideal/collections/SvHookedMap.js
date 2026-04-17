"use strict";

/** * @module library.ideal.collections
 */

/** * @class SvHookedMap
 * @extends Map
 
 
 */

/**

 * SvHookedMap is a subclass of Map that hooks the base mutation methods.
 *
 * The JS Map object holds key-value pairs and remembers the original insertion order of the keys.
 * For this to work, you need to use method alternatives to the non-method (operator) operations.
 *
 */

(class SvHookedMap extends Map {

    /**
     * Initializes the prototype slots and sets up mutator hooks.
     * @category Initialization
     */
    initPrototypeSlots () {
        this.setupMutatorHooks();
    }

    /**
     * Returns a Set of mutator method names that should be hooked.
     * @returns {Set<string>} A Set containing the names of mutator methods.
     * @category Configuration
     */
    mutatorMethodNamesSet () {
        return new Set([
            "clear",
            "delete",
            "set",
        ]);
    }

    /**
     * Performs a self-test of the SvHookedMap class.
     * @returns {SvHookedMap} Returns the class itself after the test.
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
            gotDidMutate = true;
        };

        a.clear();
        assert(gotWillMutate);
        assert(gotDidMutate);

        console.log(this.svType() + " - passed self test");
        return this;
    }

}.initThisClass()); //.selfTest()
