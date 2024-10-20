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

    /**
     * Creates a new subclass with the given name.
     * @param {string} newClassName - The name of the new subclass.
     * @returns {Class} The newly created subclass.
     */
    static newSubclassWithName (newClassName) {
        const newClass = class extends this {
          static name = newClassName;
          
          constructor(...args) {
            super(...args);
          }
        };
        //getGlobalThis()[newClassName] = newClass; // initThisClass() will do this, don't do it here so it doesn't throw an error

        // NOTE: the caller will need to add any slots (or add an initPrototype method) and then call initThisClass() on the new class
        return newClass;
      }

   // --- clone ---

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
    
    static clone () {
        const obj = this.preClone();
        obj.init();
        obj.finalInit();
        obj.afterInit();
        //this.allInstancesWeakSet().add(obj)
        return obj;
    }

    // --- shared ---

    static sharedContext () {
        return this
    }

    static hasShared () {
        return Object.hasOwn(this.sharedContext(), "_shared")
        //return !Type.isNullOrUndefined(this.sharedContext()._shared)
    }
    
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

    static setShared (v) {
        this.sharedContext()._shared = v;
        return this;
    }

    // --- init ---

    /**
     * Initializes the class.
     * @returns {Class} The initialized class.
     */
    static initClass () { // called only once when class is created

        //console.log(this.type() + " initThisClass");
        Object.defineSlot(this, "_shared", undefined);
        //this.newClassSlot("shared", undefined);
        this.newClassSlot("isSingleton", false);
        this.newClassSlot("setterNameMap", new Map()); // TODO: share this between all classes
        this.newClassSlot("allProtoSlotsMap", new Map());
        this.newClassSlot("jsonSchemaDescription", null);

        //this.newClassSlot("allInstancesWeakSet", new EnumerableWeakSet());
    }

    // --- class slots and variables ---


    static ancestorClassesTypesIncludingSelf () {
        return this.ancestorClassesIncludingSelf().map(c => c.type());
    }

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
     */
    static isSubclassOf (aClass) {
        //assert(aClass.isClass())
        return this.ancestorClassesIncludingSelf().contains(aClass);
    }

    static ancestorClassesIncludingSelf () {
        const results = this.ancestorClasses().shallowCopy();
        results.atInsert(0, this);
        return results;
    }

    /**
     * Gets all descendant classes.
     * @param {Array<Class>} [results=[]] - An array to store the results.
     * @returns {Array<Class>} An array of descendant classes.
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
     * Initializes the prototype slots.
     */
    initPrototypeSlots () {
        {
            /**
             * @member {boolean} isDebugging - Whether debugging is enabled.
             */
            const slot = this.newSlot("isDebugging", false);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {Map} lazyRefsMap - A map of lazy references.
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
             */
            //const slot = this.newSlot("_timeoutNameToIdMap", null);
            //slot.setSlotType("Map");
            Object.defineSlot(this, "_timeoutNameToIdMap", null);
        }
    }

    /**
     * Gets the lazy references map.
     * @returns {Map} The lazy references map.
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
     */
    slotsWithAnnotation (key, value) {
        assert(this.isPrototype());
        return this.allSlotsMap().valuesArray().select(slot => slot.getAnnotation(key) === value);
    }

    /**
     * Gets a slot by name, including inherited slots.
     * @param {string} slotName - The name of the slot.
     * @returns {Slot|null} The slot object or null if not found.
     */
    slotNamed (slotName) {
        assert(this.isPrototype())

        const slot = this.ownSlotNamed(slotName)
        
        if (slot) {
            return slot
        }

        // look in parent
        const p = this.__proto__ 
        if (p && p.ownSlotNamed) {
            return p.slotNamed(slotName)
        }

        return null
    }

    /**
     * Gets an own slot by name, not including inherited slots.
     * @param {string} slotName - The name of the slot.
     * @returns {Slot|null} The slot object or null if not found.
     */
    ownSlotNamed (slotName) {
        assert(this.isPrototype())

        const slot = this.slotsMap().at(slotName)
        if (slot) {
            return slot
        }
        
        return null
    }

    // slot objects

    getSlot (slotName) {
        return this.allSlotsMap().get(slotName)
    }

    hasSlot (slotName) {
        //return this.hasOwnProperty(slotName);
        return this.getSlot(slotName) !== undefined;
    }

    detectSlot (fn) { // returns undefined if no match
        // TODO: Optimize - this should stop search on match
        let matchingSlot = undefined
        this.forEachSlot(slot =>  {
            if (matchingSlot === undefined && fn(slot)) {
                matchingSlot = slot 
            }
        })
        return matchingSlot
    }

    /*
    allSlotsRawValueMap () { // what about action slots?
        const map = new Map()
        this.forEachSlotKV((slotName, slot) => map.set(slot.name(), slot.onInstanceRawGetValue(this)))
        return map
    }

    isEqual (anObject) {
        // Should this test Type equality?
        if (this.type() !== obj2.type()) {
            return false
        }
        const sm1 = this.allSlotsRawValueMap()
        const sm2 = anObject.allSlotsRawValueMap()
        return sm1.isEqual(sm2)
    }
    */

    // -------------------------------------

    /**
     * Creates a new slot if it doesn't already exist.
     * @param {string} slotName - The name of the slot.
     * @param {*} initialValue - The initial value of the slot.
     * @returns {Slot} The new or existing slot.
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
            throw new Error(msg);
        }
        return this.justNewSlot(slotName, initialValue, allowOnInstance);
    }


    /**
     * Overrides an existing slot.
     * @param {string} slotName - The name of the slot to override.
     * @param {*} initialValue - The new initial value of the slot.
     * @param {boolean} [allowOnInstance=false] - Whether to allow overriding the slot on an instance.
     * @returns {Slot} The overridden slot.
     * @throws {Error} If the slot doesn't exist to be overridden.
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
     */
    setWeakSlotValue (aSlot, newValue) {
        const privateName = aSlot.privateName()  // fix this value
        const oldValue = this.getWeakSlotValue(aSlot) // doesn't trigger willGetSlot() but may call onFinalizedSlot()

        if (newValue !== oldValue) {
            if (newValue === null) {
                this[privateName] = null
            } else {
                this[privateName] = new WeakRef(newValue)
            }
        }
        return this
    }

    // --- base getter setter ---

    baseGetSlotValue (aSlot) {
        if (aSlot.isWeak()) {
            return this.getWeakSlotValue(aSlot);
        } else {
            //const privateName = aSlot.privateName();
            //return this[privateName];
            return this[aSlot._privateName];
        }
    }

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

    getSlotValue (aSlot) { //testing this
        const v = this.baseGetSlotValue(aSlot);

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
        // e.g.: slot "subnodes" -> onUndefinedGetSubnodes()

        if (aSlot.isLazy()) {
            aSlot.onInstanceLoadRef(this)
        }

        const undefHook = aSlot.methodForUndefinedGet()
        const m = this[undefHook]
        if (m) {
            m.apply(this)
        }
    }
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

    setSlotValue (aSlot, newValue) {
        const oldValue = this.baseGetSlotValue(aSlot)
        if (oldValue !== newValue) {
            this.baseSetSlotValue(aSlot, newValue)
            this.didUpdateSlot(aSlot, oldValue, newValue)
        }
        return this
    }

    // ----

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
     */
    init () { 
        super.init();
        // subclasses should override to do initialization
        //assert(this.isInstance());
        this.initializeSlots();
    }

    initializeSlots () {
        this.thisPrototype().allSlotsMap().forEach(slot => slot.onInstanceInitSlot(this));
    }

    /**
     * Performs final initialization of the instance.
     */
    finalInit () {
        super.finalInit();
        this.finalInitSlots();
    }

    finalInitSlots () {
        this.thisPrototype().allSlotsMap().forEach(slot => slot.onInstanceFinalInitSlot(this));
    }

    toString () {
        return this.type();
    }

    ownsSlot (name) {
        return this.hasOwnProperty(name);
    }

    argsAsArray (args) {
        return Array.prototype.slice.call(args);
    }

    /**
     * Checks if the instance responds to a given method.
     * @param {string} methodName - The name of the method.
     * @returns {boolean} True if the instance responds to the method, false otherwise.
     */
    respondsTo (methodName) {
        const f = this[methodName] 
        return typeof(f) === "function";
    }

    /**
     * Performs a method with an array of arguments.
     * @param {string} message - The name of the method to perform.
     * @param {Array} argList - An array of arguments to pass to the method.
     * @returns {*} The result of the method call.
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
     */
    perform (message) { // will apply any extra arguments to call
        if (this[message] && this[message].apply) {
            return this[message].apply(this, this.argsAsArray(arguments).slice(1));
        }

        throw new Error(this, ".perform(" + message + ") missing method")
        return this;
    }

    /**
     * Gets the setter name for a given slot.
     * @param {string} name - The name of the slot.
     * @returns {string} The setter name for the slot.
     */
    setterNameForSlot (name) {
        return "set" + name.capitalized()
        /*
        // cache these as there aren't too many and it will avoid extra string operations
        if (!m.has(name)) {
            m.set(name, "set" + name.capitalized())
        }
        return m.get(name)
        */
    }

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
        const classes = this.thisClass().ancestorClassesIncludingSelf()
        for (let i = 0; i < classes.length; i++) {
            const aClass = classes[i]

            const name = aClass.type() + aPostfix
            const proto = Object.getClassNamed(name)
            if (proto) {
                return proto
            }
            const sansName = name.sansPrefix("BM") // TODO: remove this hack
            //console.log("sansName:", sansName)
            const sansProto = Object.getClassNamed(sansName) // hack to deal with nodeViewClass issues
            if (sansProto) {
              //  debugger;
                return sansProto
            }
        }
        return null
    }

    // debugging

    /**
     * Logs a debug message if debugging is enabled.
     * @param {string|Function} s - The message to log or a function that returns the message.
     * @returns {ProtoClass} This instance.
     */
    debugLog (s) {
        if (this.isDebugging()) {
            if (Type.isFunction(s)) {
                s = s()
            }

            //const tid = this.thisClass().hasShared() ? this.type() + "(shared)" : this.debugTypeId();
            const tid = this.thisClass().hasShared() ? this.debugTypeId() + "(shared)" : this.debugTypeId();

            if (arguments.length == 1) {
                console.log(tid + " " + s)
            } else {
                console.log(tid + " ", arguments[0], arguments[1])
            }
        }
        return this
    }

    // --- other ---

    /**
     * Freezes the object, preventing further modifications.
     * @returns {ProtoClass} This instance.
     */
    freeze () {
        Object.freeze(this)
        return this
    }

}.initThisClass());
