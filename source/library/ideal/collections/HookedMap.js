"use strict";

/*

    HookedMap

    A subclass of Map that maintains that hooks the base mutation methods.

    (the JS Map object holds key-value pairs and remembers the original insertion order of the keys)

    For this to work, you need to use method alternatives to the non-method
    (operator) operations.

*/

(class HookedMap extends Map {

    initPrototypeSlots () {
        this.setupMutatorHooks()
    }

    mutatorMethodNamesSet () {
        return new Set([
            "clear",
            "delete",
            "set",
        ])
    }


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

        a.clear()
        assert(gotWillMutate)
        assert(gotDidMutate)

        console.log(this.type() + " - passed self test")
        return this
    }

}.initThisClass()); //.selfTest()

