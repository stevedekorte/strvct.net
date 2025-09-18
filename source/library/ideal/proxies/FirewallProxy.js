"use strict";

/**
 * @module library.ideal.proxies
 * @class FirewallProxy
 * @extends ObservableProxy
 * @classdesc
 * FirewallProxy
 *
 * Useful for passing references to objects but limiting
 * how it can be accessed e.g. which methods can be called on it.
 *
 * An example use case would be an immutable proxy for an array.
 * So an object that owns the array can share an immutable proxy for it
 * that doesn't allow others to mutate it.
 *
 * Example:
 *
 *     const array = ["a", "b", "c"]
 *     const proxyRef = FirewallProxy.newProxyFor(array)
 *     proxyRef.observable().setProtectedMethodNames(new Set([...]))
 *     proxyRef.observable().setProtectedTrapNames(new Set([...]))
 */
(class FirewallProxy extends ObservableProxy {
    /**
     * @description Initializes prototype slots
     * @category Initialization
     */
    initPrototypeSlots() {
        {
            /**
             * @member protectedTraps
             * @type {Set}
             * @description Set of protected traps
             * @category Configuration
             */
            const slot = this.newSlot("protectedTraps", null);
            slot.setSlotType("Set");
        }
        {
            /**
             * @member protectedMethods
             * @type {Set}
             * @description Set of protected methods
             * @category Configuration
             */
            const slot = this.newSlot("protectedMethods", null);
            slot.setSlotType("Set");
        }
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype() {
    }

    /**
     * @description Initializes the instance
     * @returns {FirewallProxy} The initialized instance
     * @category Initialization
     */
    init() {
        super.init()
        this.setProtectedTraps(this.defaultProtectedTraps().shallowCopy())
        this.setProtectedMethods(this.defaultProtectedMethods().shallowCopy())
        this.setIsDebugging(false)
        return this
    }

    /**
     * @description Returns the default set of protected traps
     * @returns {Set} The set of protected traps
     * @category Configuration
     */
    defaultProtectedTraps() {
        return new Set([
            "defineProperty", // Object.defineProperty
            "deleteProperty", // Object.deleteProperty
            "preventExtensions", //  Reflect.preventExtensions(target);
            "set", // obj.x = y or obj[x] = y
            "setPrototypeOf", // Reflect.setPrototypeOf()
        ])
    }

    /**
     * @description Returns the default set of protected methods
     * @returns {Set} The set of protected methods
     * @category Configuration
     */
    defaultProtectedMethods() {
        return new Set([
        ])
    }

    /**
     * @description Post processing for a trap
     * @param {string} trapName - The name of the trap
     * @param {string} propertyName - The name of the property
     * @returns {boolean} True if the trap is not protected, false otherwise
     * @category Trap Handling
     */
    postForTrap(trapName, propertyName) {
        // instead of posting to observers,
        // just check if it's a protected trap and, if so, raise an exception
        // TODO: abstract non posting behavior from ObservableProxy and
        // use as parent class of both ObservableProxy and Firewall
        if (this.protectedTraps().has(trapName)) {
            const msg = " blocked proxy trap '" + trapName + "' on property '" + propertyName + "'"
            this.logDebug(msg)
            throw new Error(this.svTypeId() + msg)
            return false
        }

        return true
    }

    /**
     * @description Called when a protected method is called
     * @param {string} propertyName - The name of the method
     * @param {Arguments} argsList - The arguments passed to the method
     * @category Error Handling
     */
    onProtectedMethodCall(propertyName, argsList) {
        const msg = " blocked method call '" + propertyName + "' "
        this.logDebug(msg)
        throw new Error(this.svTypeId() + msg)
    }

    /**
     * @description The `get` trap for the proxy
     * @param {Object} target - The target object
     * @param {string} propertyName - The name of the property
     * @returns {*} The value of the property
     * @category Trap Handling
     */
    get(target, propertyName) {
        if (propertyName === "observable") {
            const self = this
            return () => { return self }
        }

        this.postForTrap("get", propertyName)

        // if it's a protected method, we'll return a special function
        // that calls onProtectedMethodCall to raise an exception
        const isProtected = this.protectedMethods().has(propertyName)
        if (isProtected) {
            const isFunction = Type.isFunction(target[propertyName])
            if (isFunction) {
                const self = this
                return () => {
                    return self.onProtectedMethodCall(propertyName, arguments)
                }
            }
        }

        return Reflect.get(target, propertyName, target);
    }

    /**
     * @description Self-test for FirewallProxy
     * @category Testing
     */
    static selfTest() {
        // test array
        const array = ["a", "b", "c"]
        const ap = array.asReadOnly()
        assertThrows(() => ap.atPut(0, "foo"))
        assertThrows(() => ap[0] = "bar")
        assertThrows(() => ap.pop())
        assertThrows(() => ap.reverse())
        assertThrows(() => ap.shift())
        assertThrows(() => ap.sort())

        // test set
        const set = new Set(["foo", "bar"])
        const sp = set.asReadOnly()
        assertThrows(() => sp.add(1))
        assertThrows(() => sp.clear())
        assertThrows(() => sp.delete("foo"))

        // test map
        const map = new Map([["foo", 1], ["bar", 2]])
        const mp = set.asReadOnly()
        assertThrows(() => mp.clear())
        assertThrows(() => mp.delete("foo"))
        assertThrows(() => mp.set("foo", 2))

        // test date
        const date = new Date()
        const dp = date.asReadOnly()
        assertThrows(() => dp.setYear(1999))

        console.log(this.svType() + " - self test passed")
    }
}.initThisClass());


// ------------------------------------------------------------------
// Use FirewallProxy to implement asReadOnly methods on basic types
// ------------------------------------------------------------------

Object.defineSlots(Object.prototype, {
    /**
     * @description Returns a set of mutator method names
     * @returns {Set} A set of mutator method names
     * @category Configuration
     */
    mutatorMethodNamesSet() {
        return new Set([
            "__defineGetter__",
            "__defineSetter__",
        ])
    }

})

Object.defineSlots(Set.prototype, {
    /**
     * @description Returns a set of mutator method names
     * @returns {Set} A set of mutator method names
     * @category Configuration
     */
    mutatorMethodNamesSet() {
        return new Set([
            "add",
            "clear",
            "delete"
        ])
    }

})

Object.defineSlots(Map.prototype, {

    /**
     * @description Returns a set of mutator method names
     * @returns {Set} A set of mutator method names
     * @category Configuration
     */
    mutatorMethodNamesSet() {
        return new Set([
            "clear",
            "delete",
            "set",
        ])
    }

})

Object.defineSlots(Array.prototype, {

    /**
     * @description Returns a set of mutator method names
     * @returns {Set} A set of mutator method names
     * @category Configuration
     */
    mutatorMethodNamesSet() {
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

})

Object.defineSlots(Date.prototype, {
    
    /**
     * @description Returns a set of mutator method names
     * @returns {Set} A set of mutator method names
     * @category Configuration
     */
    mutatorMethodNamesSet() {
        return new Set([
            "setDate",
            "setFullYear",
            "setHours",
            "setMilliseconds",
            "setMinutes",
            "setMonth",
            "setSeconds",
            "setTime",
            "setUTCDate",
            "setUTCFullYear",
            "setUTCHours",
            "setUTCMilliseconds",
            "setUTCMinutes",
            "setUTCMonth",
            "setUTCSeconds",
            "setYear",
        ])
    }

})

Object.defineSlots(Object.prototype, {

    /**
     * @description Creates a read-only proxy for the object
     * @returns {FirewallProxy} A read-only proxy for the object
     * @category Proxy Creation
     */
    asReadOnly() {
        const obj = FirewallProxy.newProxyFor(this)
        obj.observable().setProtectedMethods(this.mutatorMethodNamesSet())
        return obj
    }

})


//FirewallProxy.selfTest()