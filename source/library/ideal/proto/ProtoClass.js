"use strict";

/**
 * @module library.ideal.proto
 * @class ProtoClass
 * @extends Object
 * @classdesc A place for adding Smalltalk-like features to the base object
 * that we don't want to add to all Object (and Object descendants) yet,
 * as I'm not sure how they might affect the rest of the system.
 */

(class ProtoClass extends Object {

    prototypeChain () { // returns an array of prototypes from most specific to most ancestral
        const chain = [this]; // include the receiver in the chain
        let currentProto = Object.getPrototypeOf(this); // does this apply to an instance or a class?
        while (currentProto !== null) {
            chain.push(currentProto);
            currentProto = Object.getPrototypeOf(currentProto);
        }
        return chain;
    }

    getInheritedMethodSet () {
        const methodSet = new Set();
        const processedMethods = new Set();

        const prototypeChain = this.prototypeChain();

        // Process the chain from top to bottom (most ancestral to most specific)
        for (let i = prototypeChain.length - 1; i >= 0; i--) {
            const proto = prototypeChain[i];

            // Get all property descriptors in the current prototype
            const descriptors = Object.getOwnPropertyDescriptors(proto);

            for (const [name, descriptor] of Object.entries(descriptors)) {
                if (processedMethods.has(name)) continue;
                if (typeof descriptor.value === 'function') {
                    methodSet.add(descriptor.value);
                }
                processedMethods.add(name);
            }
        }
        return methodSet;
    }

    /**
     * Creates a new subclass with the given name.
     * @param {string} newClassName - The name of the new subclass.
     * @returns {Class} The newly created subclass.
     * @category Class Creation
     * @static
     */
    static newSubclassWithName (newClassName) {
        const newClass = class extends this {
          constructor (...args) {
            super(...args);
          }
        };
        Object.defineProperty(newClass, 'name', { value: newClassName });
        //getGlobalThis()[newClassName] = newClass; // initThisClass() will do this, don't do it here so it doesn't throw an error

        // NOTE: the caller will need to add any slots (or add an initPrototype method) and then call initThisClass() on the new class
        return newClass;
      }

   // --- clone ---

   /**
    * Performs pre-clone operations.
    * @returns {ProtoClass} The pre-cloned object.
    * @category Cloning
    * @static
    */
   static preClone () {
        if (this.isSingleton() && this.hasShared()) {
            // kinda weird dealing with shared in clone like this
            // do we do this to deal with deserialization of singletons?
            return this.shared();
        }

        const obj = new this();
        if (this.isSingleton()) {
            this.setShared(obj);
        }

        return obj;
    }
    
    /**
     * Creates a clone of this class instance.
     * @returns {ProtoClass} The cloned object.
     * @category Cloning
     * @static
     */
    static clone () {
        const obj = this.preClone();
        obj.init();
        obj.finalInit();
        obj.afterInit();
        //this.allInstancesWeakSet().add(obj)
        return obj;
    }

    // --- shared ---

    /**
     * Gets the shared context for this class.
     * @returns {Class} The shared context.
     * @category Shared State
     * @static
     */
    static sharedContext () {
        return this
    }

    /**
     * Checks if this class has a shared instance.
     * @returns {boolean} True if the class has a shared instance.
     * @category Shared State
     * @static
     */
    static hasShared () {
        return Object.hasOwn(this.sharedContext(), "_shared")
        //return !Type.isNullOrUndefined(this.sharedContext()._shared)
    }
    
    /**
     * Gets the shared instance of this class.
     * @returns {ProtoClass} The shared instance.
     * @throws {Error} If the class is not declared as a singleton.
     * @category Shared State
     * @static
     */
    static shared () {
        if (!this.isSingleton()) {
            console.warn("WARNING: called " + this.type() + ".shared() but class not declared a singleton!");
            /*
                // to properly declare a singleton, add this to the class declaration (must be a subclass of ProtoClass):
                
                static initClass () {
                    this.setIsSingleton(true)
                    return this
                }
            */
            debugger;
        }

        if (!this.hasShared()) {
            this.setShared(this.clone())
        }
        //assert(this.isKindOf(this._shared.thisClass()), this.type() + ".shared() not a kind of existing shared instance class " + this._shared.thisClass().type());
        return this._shared;
    }

    /**
     * Sets the shared instance of this class.
     * @param {ProtoClass} v - The instance to set as shared.
     * @returns {Class} This class.
     * @category Shared State
     * @static
     */
    static setShared (v) {
        this.sharedContext()._shared = v;
        return this;
    }

    // --- init ---

    /**
     * Initializes the class.
     * @returns {Class} The initialized class.
     * @category Class Initialization
     * @static
     */
    static initClass () { // called only once when class is created

        //console.log(this.type() + " initThisClass");
        Object.defineSlot(this, "_shared", undefined);
        //this.newClassSlot("shared", undefined);
        this.newClassSlot("isSingleton", false);
        this.newClassSlot("setterNameMap", new Map()); // TODO: share this between all classes
        this.newClassSlot("jsonSchemaDescription", null);

        //this.newClassSlot("allInstancesWeakSet", new EnumerableWeakSet());
    }

    // --- class slots and variables ---


    /**
     * Gets all ancestor class types including this class.
     * @returns {Array<string>} Array of class type names.
     * @category Class Hierarchy
     * @static
     */
    static ancestorClassesTypesIncludingSelf () {
        return this.ancestorClassesIncludingSelf().map(c => c.type());
    }

    /**
     * Gets all ancestor class types excluding this class.
     * @returns {Array<string>} Array of class type names.
     * @category Class Hierarchy
     * @static
     */
    static ancestorClassesTypes () {
        return this.ancestorClasses().map(c => c.type());
    }

    /*
    static ancestorClassesIncludingSelf (results = []) {
        results.push(this)

        const parent = this.parentClass()
        if (parent && parent.ancestorClasses) {
            //assert(!results.contains(parent))
            parent.ancestorClassesIncludingSelf(results)
        }
        return results
    }
    */

    /**
     * Checks if this class is a subclass of the given class.
     * @param {Class} aClass - The class to check against.
     * @returns {boolean} True if this class is a subclass of aClass, false otherwise.
     * @category Class Hierarchy
     * @static
     */
    static isSubclassOf (aClass) {
        //assert(aClass.isClass())
        return this.ancestorClassesIncludingSelf().contains(aClass);
    }

    /**
     * Gets all ancestor classes including this class.
     * @returns {Array<Class>} An array of ancestor classes.
     * @category Class Hierarchy
     * @static
     */
    static ancestorClassesIncludingSelf () {
        const results = this.ancestorClasses().shallowCopy();
        results.atInsert(0, this);
        return results;
    }

    /**
     * Gets all descendant classes.
     * @param {Array<Class>} [results=[]] - An array to store the results.
     * @returns {Array<Class>} An array of descendant classes.
     * @category Class Hierarchy
     * @static
     */
    static descendantClasses (results = []) {
        const children = this.childClasses();
        children.forEach(child => {
            results.push(child);
            child.descendantClasses(results);
        })
        return results;
    }

    /**
     * Gets the superclass of this class.
     * @returns {Class} The superclass.
     */
    static superClass () {
        return Object.getPrototypeOf(this);
    }

    /**
     * Generates a description of the class hierarchy.
     * @param {number} [level=0] - The current level in the hierarchy.
     * @param {Set} [traversed=new Set()] - A set of already traversed classes.
     * @returns {string} A string representation of the class hierarchy.
     * @category Class Hierarchy
     * @static
     */
    static subclassesDescription (level, traversed) {

        if (Type.isUndefined(level)) {
            level = 0;
        }

        if (Type.isUndefined(traversed)) {
            traversed = new Set();
        }

        /*
        if (traversed.has(this)) {
            throw new Error("already traversed ", this.type())
        } else {
            console.log("newly traversing ", this.type())
        }
        traversed.add(this)
        */
        //const prefix = "<div class=level" + level + ">"
        //const postfix = "</div>"

        const prefix = "";
        const postfix = "";

        const spacer = "  ".repeat(level);
        const lines = [];
        if (level === 1) {
            //lines.append("----")
        }
        const path = "";
        lines.append(prefix + spacer + this.type() + " " + path + postfix);
        /*
        if (this.parentClass()) { // for UML diagram
            lines.append("[" + this.type() + "] -> [" + this.parentClass().type() + "]")
        }
        */
        const sortedSubclasses = this.subclasses().sort((a, b) => a.type().localeCompare(b.type()));
        const subclassLines = sortedSubclasses.map((subclass) => {
            return subclass.subclassesDescription(level + 1, traversed);
        })
        lines.appendItems(subclassLines);
        return lines.join("\n");
    }

    // --- instance ---

    /**
     * Checks if the superclass has a method by name.
     * @param {string} methodName - The name of the method to check.
     * @returns {boolean} True if the method exists, false otherwise.
     * @category Instance Methods
     */
    superHasMethodName (methodName) {
        const superProto = Object.getPrototypeOf(Object.getPrototypeOf(this));
        return typeof superProto?.[methodName] === 'function';
    }

    /**
     * Initializes the prototype slots.
     * IMPORTANT: This method should NEVER call super as each class is responsible for
     * initializing only its own slots. The framework handles slot inheritance automatically.
     * @category Slots
     */
    initPrototypeSlots () {
        {
            /**
             * @member {boolean} isDebugging - Whether debugging is enabled.
             * @category Slots
             */
            const slot = this.newSlot("isDebugging", false);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {Map} lazyRefsMap - A map of lazy references.
             * @category Slots
             */
            const slot = this.newSlot("lazyRefsMap", null);
            slot.setSlotType("Map");
        }
        {
            /**
             * @member {Set} protocols - A set of protocols.
             */
            const slot = this.newSlot("protocols", new Set());
            slot.setSlotType("Set");
        }

        {
            /**
             * @member {Map} timeoutNameToIdMap - A map of timeout names to IDs.
             * @category Slots
             */
            //const slot = this.newSlot("_timeoutNameToIdMap", null);
            //slot.setSlotType("Map");
            Object.defineSlot(this, "_timeoutNameToIdMap", null);
        }
    }

    /**
     * Gets the lazy references map.
     * @returns {Map} The lazy references map.
     * @category Slots
     */
    lazyRefsMap () {
        if (!this._lazyRefsMap) {
            this._lazyRefsMap = new Map();
        }
        return this._lazyRefsMap;
    }

    /**
     * Sets the type of the instance.
     * @param {string} aString - The type name.
     * @returns {ProtoClass} This instance.
     * @category Slots
     */
    setType (aString) {
        this.constructor.name = aString;
        return this;
    }

    // --- slots ---

    /**
     * Gets slots with a specific annotation.
     * @param {string} key - The annotation key.
     * @param {*} value - The annotation value.
     * @returns {Array<Slot>} An array of slots with the specified annotation.
     * @category Finding Slot
     */
    slotsWithAnnotation (key, value) {
        assert(this.isPrototype());
        return this.allSlotsMap().valuesArray().select(slot => slot.getAnnotation(key) === value);
    }

    /**
     * Gets a slot by name, including inherited slots.
     * @param {string} slotName - The name of the slot.
     * @returns {Slot|null} The slot object or null if not found.
     * @category FindingSlots
     */
    slotNamed (slotName) {
        assert(this.isPrototype());

        const slot = this.ownSlotNamed(slotName);
        
        if (slot) {
            return slot;
        }

        // look in parent
        const p = this.__proto__;
        if (p && p.ownSlotNamed) {
            return p.slotNamed(slotName);
        }

        return null;
    }

    /**
     * Gets an own slot by name, not including inherited slots.
     * @param {string} slotName - The name of the slot.
     * @returns {Slot|null} The slot object or null if not found.
     * @category Finding Slots
     */
    ownSlotNamed (slotName) {
        assert(this.isPrototype());

        const slot = this.slotsMap().at(slotName);
        if (slot) {
            return slot;
        }
        
        return null;
    }

    // slot objects

    /**
     * Gets a slot by name.
     * @param {string} slotName - The name of the slot.
     * @returns {Slot|undefined} The slot object or undefined if not found.
     * @category Finding Slots
     */
    getSlot (slotName) {
        return this.allSlotsMap().get(slotName); // this.allSlotsMap().keysArray().sort()
    }

    /**
     * Checks if the instance has a slot by name.
     * @param {string} slotName - The name of the slot.
     * @returns {boolean} True if the slot exists, false otherwise.
     * @category Finding Slots
     */
    hasSlot (slotName) {
        //return Object.hasOwn(this, slotName);
        return this.getSlot(slotName) !== undefined;
    }

    /**
     * Detects a slot that matches a given condition.
     * @param {Function} fn - The condition function.
     * @returns {Slot|undefined} The matching slot or undefined if no match.
     * @category Finding Slots
     */
    detectSlot (fn) { // returns undefined if no match
        // TODO: Optimize - this should stop search on match
        let matchingSlot = undefined
        this.forEachSlot(slot =>  {
            if (matchingSlot === undefined && fn(slot)) {
                matchingSlot = slot;
            }
        })
        return matchingSlot;
    }

    /*
    allSlotsRawValueMap () { // what about action slots?
        const map = new Map();
        this.forEachSlotKV((slotName, slot) => map.set(slot.name(), slot.onInstanceRawGetValue(this)))
        return map;
    }

    isEqual (anObject) {
        // Should this test Type equality?
        if (this.type() !== obj2.type()) {
            return false;
        }
        const sm1 = this.allSlotsRawValueMap();
        const sm2 = anObject.allSlotsRawValueMap();
        return sm1.isEqual(sm2);
    }
    */

    // -------------------------------------

    /**
     * Creates a new slot if it doesn't already exist.
     * @param {string} slotName - The name of the slot.
     * @param {*} initialValue - The initial value of the slot.
     * @returns {Slot} The new or existing slot.
     * @category Slot Creation
     */
    newSlotIfAbsent (slotName, initialValue) {
        const slot = this.getSlot(slotName);
        if (slot) {
            return slot;
        }
        return this.justNewSlot(slotName, initialValue);
    }

    /**
     * Creates a new slot.
     * @param {string} slotName - The name of the slot.
     * @param {*} initialValue - The initial value of the slot.
     * @param {boolean} [allowOnInstance=false] - Whether to allow creating the slot on an instance.
     * @returns {Slot} The newly created slot.
     * @throws {Error} If the slot already exists.
     * @category Slot Creation
     */
    newSlot (slotName, initialValue, allowOnInstance=false) {
        /*
        if (Reflect.ownKeys(this).contains(slotName)) {
            const msg = "WARNING: " + this.type() + "." + slotName + " slot already exists"
            throw new Error(msg)
        }
        */

        if (this.hasSlot(slotName)) {
            // hack to avoid error for methods like Set isSubsetOf, which exist on only on some browsers
            // so we define ourselves.
            if(typeof(initialValue) === "function" && this[slotName + "_isOptional"] !== undefined) {
                return null;
            }
            const msg = this.type() + " newSlot('" + slotName + "') - slot already exists";
            console.log(msg);
            debugger;
            this.hasSlot(slotName);
            throw new Error(msg);
        }
        const slot = this.justNewSlot(slotName, initialValue, allowOnInstance);
        if (Type.isNull(initialValue)) {
            slot.setAllowsNullValue(true);
        }
        return slot;
    }


    /**
     * Overrides an existing slot.
     * @param {string} slotName - The name of the slot to override.
     * @param {*} initialValue - The new initial value of the slot.
     * @param {boolean} [allowOnInstance=false] - Whether to allow overriding the slot on an instance.
     * @returns {Slot} The overridden slot.
     * @throws {Error} If the slot doesn't exist to be overridden.
     * @category Slot Creation
     */
    overrideSlot (slotName, initialValue, allowOnInstance=false) {
        const oldSlot = this.getSlot(slotName);
        if (Type.isUndefined(oldSlot)) {
            const msg = this.type() + " newSlot('" + slotName + "') - no existing slot to override";
            console.log(msg);
            throw new Error(msg);
        }
        const slot = this.justNewSlot(slotName, initialValue, allowOnInstance);
        slot.copyFrom(oldSlot);
        slot.setInitValue(initialValue);
        slot.setOwner(this);
        return slot;
    }

    /**
     * Creates a new slot.
     * @param {string} slotName - The name of the slot.
     * @param {*} initialValue - The initial value of the slot.
     * @param {boolean} [allowOnInstance=false] - Whether to allow creating the slot on an instance.
     * @returns {Slot} The newly created slot.
     * @category Slot Creation
     */
    justNewSlot (slotName, initialValue, allowOnInstance=false) { // private
        if (!allowOnInstance) {
            assert(this.isPrototype());
        }
        assert(Type.isString(slotName));

        /*
        // TODO: we want to create the private slots and initial value on instances
        // but ONLY create method slots on classes, not instances...
        const privateName = "_" + slotName;
        this[privateName] = initialValue;
        */

        const slot = ideal.Slot.clone().setName(slotName).setInitValue(initialValue);
        slot.setOwner(this);
        this.slotsMap().set(slotName, slot);
        this.allSlotsMap().set(slotName, slot);

        return slot;
    }

    /**
     * Asserts that the prototype slots have a type.
     * @category Assertions
     */
    assertProtoSlotsHaveType () {
        this.slotsMap().forEachKV((slotName, slot) => {
            assert(Type.isString(slot.slotType()), () => { return this.type() + " slot " + slotName + " has no type" });
        });
    }

    /**
     * Creates a new weak slot.
     * @param {string} slotName - The name of the slot.
     * @param {*} initialValue - The initial value of the slot.
     * @returns {Slot} The newly created weak slot.
     * @category Weak Slots
     */
    newWeakSlot (slotName, initialValue) {
        const slot = this.newSlot(slotName, initialValue);
        slot.setIsWeak(true);
        return slot;
    }

    // --- weak slot ---

    /**
     * Handles finalization of a weak slot.
     * @param {Slot} aSlot - The slot being finalized.
     * @category Weak Slots
     */
    onFinalizedSlot (aSlot) {
        this[aSlot.privateName()] = undefined; // replace the weak ref with undefined

        // only called on weak slot
        const k = aSlot.methodForOnFinalized();
        const m = this[k];
        if (m) {
            m.apply(this);
        }
    }

    /**
     * Gets the value of a weak slot.
     * @param {Slot} aSlot - The weak slot.
     * @returns {*} The value of the weak slot.
     * @category Weak Slots
     */
    getWeakSlotValue (aSlot) {
        const privateName = aSlot.privateName(); // fix this value
        const weakRef = this[privateName];

        if (weakRef === null) {
            return null;
        }

        if (weakRef === undefined) {
            return undefined;
        }

        // if we got here, it's a weakref
        const v = weakRef.deref();
        if (v === undefined) {
            // it must have been collected
            this.onFinalizedSlot(aSlot);
        }
        return v;
    }

    /**
     * Sets the value of a weak slot.
     * @param {Slot} aSlot - The weak slot.
     * @param {*} newValue - The new value to set.
     * @returns {ProtoClass} This instance.
     * @category Slots
     */
    setWeakSlotValue (aSlot, newValue) {
        const privateName = aSlot.privateName();  // fix this value
        const oldValue = this.getWeakSlotValue(aSlot); // doesn't trigger willGetSlot() but may call onFinalizedSlot()

        if (newValue !== oldValue) {
            if (newValue === null) {
                this[privateName] = null;
            } else {
                this[privateName] = new WeakRef(newValue);
            }
        }
        return this;
    }

    // --- base getter setter ---

    /**
     * Gets the value of a slot.
     * @param {Slot} aSlot - The slot being accessed.
     * @returns {*} The value of the slot.
     * @category Getter Construction
     */
    baseGetSlotValue (aSlot) {
        if (aSlot.isWeak()) {
            return this.getWeakSlotValue(aSlot);
        } else {
            //const privateName = aSlot.privateName();
            //return this[privateName];
            return this[aSlot._privateName];
        }
    }

    /**
     * Sets the value of a slot.
     * @param {Slot} aSlot - The slot being set.
     * @param {*} newValue - The new value to set.
     * @returns {ProtoClass} This instance.
     * @category Setter Construction
     */
    baseSetSlotValue (aSlot, newValue) {
        const privateName = aSlot.privateName();
        if (aSlot.isWeak()) {
            this.setWeakSlotValue(aSlot, newValue);
        } else {
            this[privateName] = newValue;
        }
        //this[privateName];
        return this;
    }

    // --- auto getter setter ---

    /**
     * Gets the value of a slot.
     * @param {Slot} aSlot - The slot being accessed.
     * @returns {*} The value of the slot.
     * @category Getter Construction
     */
    getSlotValue (aSlot) { //testing this
        //const v = this.baseGetSlotValue(aSlot);

        /*
        if (v === undefined) {
            this.onUndefinedGetSlot(aSlot);
        }
        */

        this.willGetSlot(aSlot);
        return this.baseGetSlotValue(aSlot);
    }

    /*
    onUndefinedGetSlot (aSlot) {
        // get undefined hook
        // e.g.: slot "subnodes" -> onUndefinedGetSubnodes();

        if (aSlot.isLazy()) {
            aSlot.onInstanceLoadRef(this);
        }

        const undefHook = aSlot.methodForUndefinedGet();
        const m = this[undefHook];
        if (m) {
            m.apply(this);
        }
    }
    */
   
    /**
     * Handles the will get slot event.
     * @category Slot Hooks
     * @param {Slot} aSlot - The slot being accessed.
     */
    willGetSlot (aSlot) {
        // e.g.: slot "subnodes" -> willGetSlotSubnodes()
        const s = aSlot.methodForWillGet();
        const f = this[s];
        if (f) {
            f.apply(this);
        }
    }

    // --- setter ---

    /**
     * Sets the value of a slot.
     * @param {Slot} aSlot - The slot being set.
     * @param {*} newValue - The new value to set.
     * @returns {ProtoClass} This instance.
     * @category Setter Construction
     */
    setSlotValue (aSlot, newValue) {
        const oldValue = this.baseGetSlotValue(aSlot); // handles unwrapping weak slots
        if (oldValue !== newValue) {
            this.baseSetSlotValue(aSlot, newValue); // handles unwrapping weak slots
            this.didUpdateSlot(aSlot, oldValue, newValue); // StorableNode overrides this to call didMutate which sends onDidMutateObject to mutation observers
        }
        return this;
    }

    // ----

    /**
     * Handles the did update slot event.
     * @param {Slot} aSlot - The slot being updated.
     * @param {*} oldValue - The old value.
     * @param {*} newValue - The new value.
     * @category Slot Hooks
     */
    didUpdateSlot (aSlot, oldValue, newValue) {
        const methodName = aSlot.methodForDidUpdate();
        const method = this[methodName];

        if (method) {
            method.call(this, oldValue, newValue);
        }
        /*
        if (aSlot.shouldStoreSlot()) {
            this.didMutate(aSlot.name())
        }
        */
    }

    /**
     * Initializes the instance.
     * @category Initialization
     */
    init () { 
        super.init();
        // subclasses should override to do initialization
        //assert(this.isInstance());
        this.initializeSlots();
    }

    /**
     * Initializes the slots of the instance.
     * @category Initialization
     */
    initializeSlots () {
        //debugger;
        this.thisPrototype().allSlotsMap().forEach(slot => {
            /*
            if (slot.name() === "subnodes") {
                debugger;
            }
            */
            slot.onInstanceInitSlot(this);
        });
    }

    /**
     * Performs final initialization of the instance.
     */
    finalInit () {
        super.finalInit();
        this.finalInitSlots();
    }

    /**
     * Performs final initialization of the slots of the instance.
     * @category Initialization
     */
    finalInitSlots () {
        /*
        const keys = this.thisPrototype().allSlotsMap().keysArray();
        keys.forEach((slotName) => {
            const slot = this.thisPrototype().allSlotsMap().get(slotName);
            if (keys.includes("sessions") && keys.includes("subnodes")) {
                if (["sessions", "subnodes"].includes(slotName)) {
                    debugger;
                }
            }
            slot.onInstanceFinalInitSlot(this);
        });
        */
       this.thisPrototype().allSlotsMap().forEach(slot => slot.onInstanceFinalInitSlot(this));
    }

    /**
     * Checks if the instance owns a given slot.
     * @param {string} name - The name of the slot.
     * @returns {boolean} True if the instance owns the slot, false otherwise.
     * @category Information
     */
    ownsSlot (name) {
        return Object.hasOwn(this, name);
    }

    /**
     * Converts arguments to an array.
     * @param {Array} args - The arguments to convert.
     * @returns {Array} The array of arguments.
     * @category Internal Helpers
     */
    argsAsArray (args) {
        return Array.prototype.slice.call(args);
    }

    /**
     * Checks if the instance responds to a given method.
     * @param {string} methodName - The name of the method.
     * @returns {boolean} True if the instance responds to the method, false otherwise.
     * @category Information
     */
    respondsTo (methodName) {
        const f = this[methodName];
        return typeof(f) === "function";
    }

    /**
     * Performs a method with an array of arguments.
     * @param {string} message - The name of the method to perform.
     * @param {Array} argList - An array of arguments to pass to the method.
     * @returns {*} The result of the method call.
     * @category Helpers
     */
    performWithArgList (message, argList) {
        return this[message].apply(this, argList);
    }

    /**
     * Performs a method with variable arguments.
     * @param {string} message - The name of the method to perform.
     * @param {...*} args - Arguments to pass to the method.
     * @returns {*} The result of the method call.
     * @throws {Error} If the method doesn't exist.
     * @category Helpers
     */
    perform (message) { // will apply any extra arguments to call
        if (this[message] && this[message].apply) {
            return this[message].apply(this, this.argsAsArray(arguments).slice(1));
        }

        throw new Error(this, ".perform(" + message + ") missing method");
    }

    /**
     * Gets the setter name for a given slot.
     * @param {string} name - The name of the slot.
     * @returns {string} The setter name for the slot.
     * @category Helpers
     */
    setterNameForSlot (name) {
        return "set" + name.capitalized();
        /*
        // cache these as there aren't too many and it will avoid extra string operations
        if (!m.has(name)) {
            m.set(name, "set" + name.capitalized());
        }
        return m.get(name);
        */
    }

    /**
     * Converts the instance to a string.
     * @returns {string} The string representation of the instance.
     * @category Information
     */
    toString () {
        return this.typeId();
    }

    // --- ancestors ---

    /**
     * Finds the first ancestor class with a given postfix.
     * @param {string} aPostfix - The postfix to search for.
     * @returns {Class|null} The first ancestor class with the given postfix, or null if not found.
     */
    firstAncestorClassWithPostfix (aPostfix) {
        // not a great name but this walks back the ancestors (including self) and tries to find an
        // existing class with the same name as the ancestor + the given postfix
        // useful for things like type + "View" or type + "Tile", etc
        //this.debugLog(" firstAncestorClassWithPostfix(" + aPostfix + ")")
        const classes = this.thisClass().ancestorClassesIncludingSelf();
        for (let i = 0; i < classes.length; i++) {
            const aClass = classes[i];

            const name = aClass.type() + aPostfix;
            const proto = Object.getClassNamed(name);
            if (proto) {
                return proto;
            }
            const sansName = name.sansPrefix("Sv"); // TODO: remove this hack
            //console.log("sansName:", sansName)
            const sansProto = Object.getClassNamed(sansName); // hack to deal with nodeViewClass issues
            if (sansProto) {
              //  debugger;
                return sansProto;
            }
        }
        return null;
    }

    // debugging

    /**
     * Logs a debug message if debugging is enabled.
     * @param {string|Function} s - The message to log or a function that returns the message.
     * @returns {ProtoClass} This instance.
     * @category Debugging
     */
    debugLog (s) {
        if (this.isDebugging()) {
            if (Type.isFunction(s)) {
                s = s();
            }

            //const tid = this.thisClass().hasShared() ? this.type() + "(shared)" : this.debugTypeId();
            const tid = this.thisClass().hasShared() ? this.debugTypeId() + "(shared)" : this.debugTypeId();

            if (arguments.length == 1) {
                console.log(tid + " " + s);
            } else {
                console.log(tid + " ", arguments[0], arguments[1]);
            }
        }
        return this;
    }

    // --- other ---

    /**
     * Freezes the object, preventing further modifications.
     * @returns {ProtoClass} This instance.
     * @category Immutability
     */
    freeze () {
        Object.freeze(this);
        return this;
    }

    /**
     * Returns a 64-bit hash code for the proto class.
     * This uses the puuid as the hash code, not the properties, so it compares identities, not values.
     * @returns {number} A 64-bit hash code
     * @category Information
     */
    hashCode64 () {
        return this.puuid().hashCode64();
    }

    /**
     * Gets the shared instance of this class.
     * @returns {ProtoClass} The shared instance.
     * @throws {Error} If the class is not declared as a singleton.
     * @category Singletons
     */
    shared () {
        if (!this.isSingleton()) {
            console.warn("WARNING: called " + this.type() + ".shared() but class not declared a singleton!");
            /*
                // to properly declare a singleton, add this to the class declaration (must be a subclass of ProtoClass):
                
                static initClass () {
                    this.setIsSingleton(true)
                    return this
                }
            */
            debugger;
        }

        if (!this.hasShared()) {
            this.setShared(this.clone());
        }
        //assert(this.isKindOf(this._shared.thisClass()), this.type() + ".shared() not a kind of existing shared instance class " + this._shared.thisClass().type());
        return this._shared;
    }

    /**
     * Gets the shared context for this class.
     * @returns {Class} The shared context.
     * @category Singletons
     */
    sharedContext () {
        return this;
    }

    /**
     * Checks if this class has a shared instance.
     * @returns {boolean} True if the class has a shared instance.
     * @category Shared State
     */
    hasShared () {
        return Object.hasOwn(this.sharedContext(), "_shared");
        //return !Type.isNullOrUndefined(this.sharedContext()._shared);
    }

    /**
     * Sets the shared instance of this class.
     * @param {ProtoClass} v - The instance to set as shared.
     * @returns {Class} This class.
     * @category Shared State
     */
    setShared (v) {
        this.sharedContext()._shared = v;
        return this;
    }

    /**
     * Gets all ancestor class types including this class.
     * @returns {Array<string>} Array of class type names.
     * @category Class Hierarchy
     */
    ancestorClassesTypesIncludingSelf () {
        return this.ancestorClassesIncludingSelf().map(c => c.type());
    }

    /**
     * Gets all ancestor class types excluding this class.
     * @returns {Array<string>} Array of class type names.
     * @category Class Hierarchy
     */
    ancestorClassesTypes () {
        return this.ancestorClasses().map(c => c.type());
    }

    /**
     * Gets all ancestor classes including this class.
     * @returns {Array<Class>} Array of ancestor classes.
     * @category Class Hierarchy
     */
    ancestorClassesIncludingSelf () {
        const results = this.ancestorClasses().shallowCopy();
        results.atInsert(0, this);
        return results;
    }

    /**
     * Gets the timeout name to ID map.
     * @returns {Map} The map of timeout names to IDs.
     * @category Timeouts
     */
    timeoutNameToIdMap () {
        if (!this._timeoutNameToIdMap) {
            this._timeoutNameToIdMap = new Map();
        }
        return this._timeoutNameToIdMap;
    }

    /**
     * Gets the type of this instance.
     * @returns {string} The type name.
     * @category Information
     */
    type () {
        return this.constructor.name;
    }

    /**
     * Gets a method by name.
     * @param {string} methodName - The name of the method.
     * @returns {Function} The method.
     * @category Methods
     */
    methodNamed (methodName) {
        // create a slot named methodName
        const value = this[methodName];
        if (!value) {
            throw new Error("Method " + methodName + " not found on " + this.type());
        }
        if (!Type.isFunction(value)) {
            throw new Error("Method " + methodName + " is not a function on " + this.type());
        }
        return value;
    } 

    /**
     * Gets the methods map.
     * @returns {Map} Map of methods.
     * @category Methods
     */
    methodsMap () {
        if (!this._methodsMap) {
            this._methodsMap = new Map();
        }
        return this._methodsMap;
    }

    registerMethodNamed (name) {
        const method = this.methodNamed(name);
        assert(method, "Method " + name + " not found on " + this.type());
        method.setMetaProperty("name", name);
        method.setMetaProperty("ownerObject", this);
        this.methodsMap().set(name, method);
        return method;
    }

    /**
     * Gets the slots map.
     * @returns {Map} Map of slots.
     * @category Slots
     */
    slotsMap () {
        if (!this._slotsMap) {
            this._slotsMap = new Map();
        }
        return this._slotsMap;
    }

    /**
     * Checks if this is a prototype.
     * @returns {boolean} True if this is a prototype.
     * @category Information
     */
    isPrototype () {
        return this.constructor.prototype === this;
    }

    /**
     * Gets the prototype of this instance.
     * @returns {ProtoClass} The prototype.
     * @category Information
     */
    thisPrototype () {
        return Object.getPrototypeOf(this);
    }

    /**
     * Gets the class of this instance.
     * @returns {Class} The class.
     * @category Information
     */
    thisClass () {
        return this.constructor;
    }

    /**
     * Gets a unique identifier for debugging.
     * @returns {string} The debug type ID.
     * @category Debugging
     */
    debugTypeId () {
        return this.type() + "_" + this.shortId();
    }

    /**
     * Gets a short identifier.
     * @returns {string} The short ID.
     * @category Information
     */
    shortId () {
        return this.puuid().slice(-4);
    }

}.initThisClass());
