"use strict";

/**
 * @module library.ideal.proxies
 * @class ObservableProxy
 * @extends ProtoClass
 * @classdesc
 * A class for wrapping a reference in a proxy which can
 * send proxy trap notifications to observers.
 *
 * WARNING:
 *
 * Proxies are ~10x slower that direct getter/setters or wrappers around them,
 * so they may not be appropraite for high frequency use objects.
 *
 * MOTIVATION:
 *
 * The motivation for this class was originally as an access tripwire
 * for lazy loading of persistent objects.
 *
 * POTENITAIL USES:
 *
 * https://exploringjs.com/es6/ch_proxies.html
 *
 * Example:
 *
 *     const myObject = ["a", "b", "c"]
 *     const proxyRef = ObservableProxy.newProxyFor(myObject)
 *     proxyRef.observable().addObserver(myObserver)
 *
 *     now if we call:
 *
 *         proxyRef.length
 *
 *     it will trigger the "get" trap and send an "onGetObserved" message to myObserver.
 */
(class ObservableProxy extends ProtoClass {

    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots() {
        {
            /**
             * @property {Array} observers
             * @description An array to store the observers.
             */
            const slot = this.newSlot("observers", null);
            slot.setSlotType("Array");
        }
        {
            /**
             * @property {Object} target
             * @description The target object to be observed.
             */
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }
        {
            /**
             * @property {Object} revocable
             * @description The revocable proxy object.
             */
            const slot = this.newSlot("revocable", null);
            slot.setSlotType("Object");
        }
        {
            /**
             * @property {Array} trapNames
             * @description An array of trap names for the proxy.
             */
            const slot = this.newSlot("trapNames", [
                "apply",
                "construct",
                "defineProperty", // Object.defineProperty
                "deleteProperty", // Object.deleteProperty
                "get", // obj.x or obj[x]
                "getOwnPropertyDescriptor", // Object.getOwnPropertyDescriptor
                "getPrototypeOf", // Object.getPrototypeOf
                "has", // x in obj
                "isExtensible", // Reflect.isExtensible(target)
                "ownKeys", // Reflect.ownKeys(target)
                "preventExtensions", //  Reflect.preventExtensions(target);
                "set", // obj.x = y or obj[x] = y
                "setPrototypeOf", // Reflect.setPrototypeOf()
            ]);
            slot.setSlotType("Array");
        }
        {
            /**
             * @property {Object} noteNamesDict
             * @description An object dictionary to store the note names for each trap name.
             */
            const slot = this.newSlot("noteNamesDict", null);
            slot.setSlotType("Object"); // JSON Object
        }
    }

    /**
     * @description Initializes the prototype.
     */
    initPrototype() {
        this.setIsDebugging(false);
    }

    /**
     * @description Initializes the instance.
     * @returns {ObservableProxy} The initialized instance.
     */
    init() {
        super.init();
        this.setObservers([]);
        this.setupNoteNames();
        return this;
    }

    /**
     * @description Creates a new proxy for the given target object.
     * @param {Object} aTarget - The target object to wrap in a proxy.
     * @returns {Proxy} The created proxy object.
     */
    newProxyFor(aTarget) {
        const handler = this.thisClass().clone();
        handler.setTarget(aTarget);
        //const proxy = new Proxy(aTarget, handler)
        this.setRevocable(Proxy.revocable(aTarget, handler));
        return this.proxy();
    }

    /**
     * @description Returns the proxy object.
     * @returns {Proxy} The proxy object.
     */
    proxy() {
        return this.revocable().proxy;
    }

    /**
     * @description Revokes the proxy object.
     * @returns {ObservableProxy} The current instance.
     */
    revoke() {
        this.postForTrap("revoke", null);
        this._revocable.revoke();
        return this;
    }

    /**
     * @description Sets up the note names dictionary for the trap names.
     * @returns {ObservableProxy} The current instance.
     */
    setupNoteNames() {
        this._noteNamesDict = {};
        this.trapNames().map((name) => {
            // examples: "onObservedGet", "onObservedSet"
            const noteName = "onObserved" + name.capitalized();
            this._noteNamesDict[name] = noteName;
        })
        return this;
    }

    /**
     * @description Adds an observer to the observers array.
     * @param {Object} obs - The observer object to add.
     * @returns {Object} The added observer object.
     */
    addObserver(obs) {
        this.observers().appendIfAbsent(obs);
        return obs
    }

    /**
     * @description Removes an observer from the observers array.
     * @param {Object} obs - The observer object to remove.
     * @returns {Object} The removed observer object.
     */
    removeObserver(obs) {
        this.observers().remove(obs);
        return obs;
    }

    /**
     * @description Posts a notification for the given trap and property name.
     * @param {string} trapName - The name of the trap.
     * @param {string} propertyName - The name of the property.
     * @returns {boolean} True if the notification was posted.
     */
    postForTrap(trapName, propertyName) {
        const noteName = this.noteNamesDict()[trapName];

        this._observers.forEach((obs) => {
            if (obs[noteName]) {
                if (this.isDebugging()) {
                    this.debugLog(" posting " + noteName);
                }
                obs[noteName].call(obs, this.target(), propertyName);
            }
        })
        return true;
    }

    // --- proxy trap methods ---

    /*

    apply (target, thisArg, argumentsList) {
        this.postForTrap("apply", propertyName);
        return target[propertyName].apply(target, argumentsList);
    }

    construct (target) {

    }

    */

    /**
     * @description Defines a new property on the target object.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property to define.
     * @param {Object} descriptor - The property descriptor.
     * @returns {Object} The result of defining the property.
     */
    defineProperty(target, propertyName, descriptor) {
        this.postForTrap("defineProperty", propertyName);
        return Object.defineProperty(target, propertyName, descriptor);
    }

    /**
     * @description Deletes a property from the target object.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property to delete.
     * @returns {boolean} True if the property was successfully deleted.
     */
    deleteProperty(target, propertyName) {
        this.postForTrap("deleteProperty", propertyName);
        return delete target[propertyName];
    }

    /**
     * @description Gets the value of a property from the target object.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property to get.
     * @returns {*} The value of the property.
     */
    get(target, propertyName) {
        if (propertyName === "observable") {
            const self = this;
            return () => { return self; }
        }

        /*
        const proxyMethods = { "methodName": true }
        if (proxyMethods.hasOwnProperty(propertyName)) {
            let self = this
            return () => {
                return self[propertyName].apply(self, arguments)
            }
        }
        */

        this.postForTrap("get", propertyName);
        return Reflect.get(target, propertyName, target);
    }

    /**
     * @description Gets the property descriptor for a property on the target object.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property.
     * @returns {Object} The property descriptor.
     */
    getOwnPropertyDescriptor(target, propertyName) {
        this.postForTrap("getOwnPropertyDescriptor", propertyName);
        return Object.getOwnPropertyDescriptor(target, propertyName);
    }

    /**
     * @description Gets the prototype of the target object.
     * @param {Object} target - The target object.
     * @returns {Object} The prototype of the target object.
     */
    getPrototypeOf(target) {
        this.postForTrap("getPrototypeOf", null);
        return Object.getPrototypeOf(target);
    }

    /**
     * @description Checks if the target object is extensible.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property.
     * @returns {boolean} True if the target object is extensible.
     */
    isExtensible(target, propertyName) {
        this.postForTrap("isExtensible", propertyName);
        return Reflect.isExtensible(target);
    }

    /**
     * @description Checks if the target object has a property.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property.
     * @returns {boolean} True if the target object has the property.
     */
    has(target, propertyName) {
        this.postForTrap("has", propertyName);
        return Reflect.has( target, propertyName );
    }

    /**
     * @description Gets the own property keys of the target object.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property.
     * @returns {Array} An array of the own property keys of the target object.
     */
    ownKeys(target, propertyName) {
        this.postForTrap("ownKeys", propertyName);
        return Reflect.ownKeys(target);
    }

    /**
     * @description Prevents the target object from being extended.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property.
     * @returns {boolean} True if the target object is now non-extensible.
     */
    preventExtensions(target, propertyName) {
        this.postForTrap("preventExtensions", propertyName);
        return Reflect.preventExtensions(target);
    }

    /**
     * @description Sets the value of a property on the target object.
     * @param {Object} target - The target object.
     * @param {string} propertyName - The name of the property.
     * @param {*} newValue - The new value to set for the property.
     * @returns {boolean} True if the property was successfully set.
     */
    set(target, propertyName, newValue) {
        this.postForTrap("set", propertyName);
        return Reflect.set(target, propertyName, newValue);
    }

    /**
     * @description Sets the prototype of the target object.
     * @param {Object} target - The target object.
     * @param {Object} prototype - The new prototype object.
     * @returns {Object} The target object with the new prototype.
     */
    setPrototypeOf(target, prototype) {
        this.postForTrap("setPrototypeOf", null);
        return Object.setPrototypeOf(target, prototype);
    }

    // ---------------

    /**
     * @description Performs a self-test of the ObservableProxy class.
     * @returns {boolean} True if the self-test passed.
     */
    static selfTest() {
        const resultsDict = {};

        const noteNamesDict = ObservableProxy.clone().noteNamesDict();

        assert("need to fix this to assign to method name");
        const eventMethod = (target, propertyName) => {
            resultsDict[propertyName] = true;
            console.log("got note " + propertyName);
        }

        const testObserver = {};

        Object.values(noteNamesDict).forEach((name) => {
            testObserver[name] = eventMethod;
        })


        const testArray = ["a", "b", "c"];
        const arrayProxy = ObservableProxy.newProxyFor(testArray);
        arrayProxy.observable().addObserver(testObserver);

        const length = arrayProxy.length; // get
        arrayProxy[0] = 1; // set
        const v = arrayProxy[0]; // get
        1 in arrayProxy; // has

        Reflect.ownKeys(arrayProxy);
        Object.getOwnPropertyDescriptor(arrayProxy, "clone");
        delete arrayProxy[0];
        //new arrayProxy
        arrayProxy.observable().revoke();

        try {
            arrayProxy.length;
        } catch (e) {
            console.log("proxy properly revoked");
        }

        return true;
    }

}.initThisClass());

//ObservableProxy.selfTest()