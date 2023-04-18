"use strict";

/*

    ProtoClass
    
    A place for adding Smalltalk like features to the base object
    that we don't want to add to all Object (and Object decendants) yet,
    as I'm not sure how they might effect the rest of the system.

*/

(class ProtoClass extends Object {

   // --- clone ---

    static clone () {
        if (this.isSingleton() && this.hasShared()) {
            // kinda weird dealing with shared in clone like this
            // do we do this to deal with deserialization of singletons?
            return this.shared() 
        }

        const obj = new this()
        assert(obj._initArguments === null)
        obj._initArguments = arguments

        obj.init(arguments)

        if (this.isSingleton()) {
            this.setShared(obj)
        }
        obj.afterInit()

        obj._initArguments = null

        //this.allInstancesWeakSet().add(obj)

        return obj
    }

    // --- shared ---

    static sharedContext () {
        return this
    }

    static hasShared () {
        return !Type.isNullOrUndefined(this.sharedContext()._shared)
    }

    static shared () {
        if (!this.hasShared()) {
            this.setShared(this.clone())
        }
        return this._shared
    }

    static setShared (v) {
        this.sharedContext()._shared = v
        return this
    }

    // --- init ---

    static initClass () { // called only once when class is created

        //console.log(this.type() + " initThisClass")
        Object.defineSlot(this, "_shared", undefined)
        //this.newClassSlot("shared", undefined)
        this.newClassSlot("isSingleton", false)
        this.newClassSlot("setterNameMap", new Map()) // TODO: share this between all classes
        this.newClassSlot("allProtoSlotsMap", new Map())

        //this.newClassSlot("allInstancesWeakSet", new EnumerableWeakSet())
        return this
    }

    // --- class slots and variables ---


    static ancestorClassesTypesIncludingSelf () {
        return this.ancestorClassesIncludingSelf().map(c => c.type())
    }

    static ancestorClassesTypes () {
        return this.ancestorClasses().map(c => c.type())
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

    static isSubclassOf (aClass) {
        assert(aClass.isClass())
        return this.ancestorClassesIncludingSelf().contains(aClass)
    }

    static ancestorClassesIncludingSelf () {
        const results = this.ancestorClasses().shallowCopy()
        results.atInsert(0, this)
        return results
    }

    static descendantClasses (results = []) {
        const children = this.childClasses()
        children.forEach(child => {
            results.push(child)
            child.descendantClasses(results)
        })
        return results
    }

    static superClass () {
        return Object.getPrototypeOf(this)
    }

    static subclassesDescription (level, traversed) {

        if (Type.isUndefined(level)) {
            level = 0
        }

        if (Type.isUndefined(traversed)) {
            traversed = new Set()
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

        const prefix = ""
        const postfix = ""

        const spacer = "  ".repeat(level)
        const lines = []
        if (level === 1) {
            //lines.append("----")
        }
        const path = ""
        lines.append(prefix + spacer + this.type() + " " + path + postfix)
        const sortedSubclasses = this.subclasses().sort((a, b) => a.type().localeCompare(b.type()))
        const subclassLines = sortedSubclasses.map((subclass) => {
            //return spacer + subclass.subclassesDescription(level + 1, traversed) 
            return subclass.subclassesDescription(level + 1, traversed) 
        })
        lines.appendItems(subclassLines)
        return lines.join("\n")
    }

    // --- instance ---

    initPrototypeSlots () {
        this.newSlot("isDebugging", false)
        this.newSlot("lazyRefsMap", null)
        Object.defineSlot(this, "_timeoutNameToIdMap", null)
    }

    lazyRefsMap () {
        if (!this._lazyRefsMap) {
            this._lazyRefsMap = new Map()
        }
        return this._lazyRefsMap
    }



    setType (aString) {
        this.constructor.name = aString
        return this
    }

    // --- slots ---

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
        return this.getSlot(slotName) !== undefined
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

    newSlotIfAbsent (slotName, initialValue) {
        const slot = this.getSlot(slotName)
        if (slot) {
            return slot
        }
        return this.justNewSlot(slotName, initialValue)
    }

    newSlot (slotName, initialValue, allowOnInstance=false) {
        /*
        if (Reflect.ownKeys(this).contains(slotName)) {
            const msg = "WARNING: " + this.type() + "." + slotName + " slot already exists"
            throw new Error(msg)
        }
        */

        if (this.hasSlot(slotName)) {
            const msg = this.type() + " newSlot('" + slotName + "') - slot already exists"
            console.log(msg)
            throw new Error(msg)
        }
        return this.justNewSlot(slotName, initialValue, allowOnInstance)
    }

    overrideSlot (slotName, initialValue, allowOnInstance=false) {
        const oldSlot = this.getSlot(slotName)
        if (Type.isUndefined(oldSlot)) {
            const msg = this.type() + " newSlot('" + slotName + "') - no existing slot to override"
            console.log(msg)
            throw new Error(msg)
        }
        const slot = this.justNewSlot(slotName, initialValue, allowOnInstance)
        slot.copyFrom(oldSlot)
        slot.setInitValue(initialValue)
        slot.setOwner(this)
        return slot
    }

    justNewSlot (slotName, initialValue, allowOnInstance=false) { // private
        if (!allowOnInstance) {
            assert(this.isPrototype())
        }
        assert(Type.isString(slotName))

        /*
        // TODO: we want to create the private slots and initial value on instances
        // but ONLY create method slots on classes, not instances...
        const privateName = "_" + slotName
        this[privateName] = initialValue
        */

        const slot = ideal.Slot.clone().setName(slotName).setInitValue(initialValue)
        slot.setOwner(this)
        this.slotsMap().set(slotName, slot)
        this.allSlotsMap().set(slotName, slot)
        return slot
    }

    newWeakSlot (slotName, initialValue) {
        const slot = this.newSlot(slotName, initialValue)
        slot.setIsWeak(true)
        return slot;
    }

    // --- weak slot ---

    onFinalizedSlot (aSlot) {
        this[aSlot.privateName()] = undefined

        // only called on weak slot
        const k = aSlot.methodForOnFinalized()
        const m = this[k]
        if (m) {
            m.apply(this)
        }
    }

    getWeakSlotValue (aSlot) {
        const privateName = aSlot.privateName()  // fix this value
        const weakRef = this[privateName]

        if (weakRef === null) {
            return null
        }

        if (weakRef === undefined) {
            return undefined
        }

        // if we got here, it's a weakref
        const v = weakRef.deref()
        if (v === undefined) {
            // it must have been collected
            this.onFinalizedSlot(aSlot)
        }
        return v
    }

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
            return this.getWeakSlotValue(aSlot)
        } else {
            //const privateName = aSlot.privateName() 
            //return this[privateName]
            return this[aSlot._privateName]
        }
    }

    baseSetSlotValue (aSlot, newValue) {
        const privateName = aSlot.privateName() 
        if (aSlot.isWeak()) {
            this.setWeakSlotValue(aSlot, newValue)
        } else {
            this[privateName] = newValue
        }
        this[privateName]
        return this
    }

    // --- auto getter setter ---

    getSlotValue (aSlot) { //testing this
        const v = this.baseGetSlotValue(aSlot)

        /*
        if (v === undefined) {
            this.onUndefinedGetSlot(aSlot)
        }
        */

        this.willGetSlot(aSlot)

        return this.baseGetSlotValue(aSlot)
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
        const s = aSlot.methodForWillGet()
        const f = this[s]
        if (f) {
            f.apply(this)
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
        const m = this[aSlot.methodForDidUpdate()]
        if (m) {
            m.call(this, oldValue, newValue)
        }
        /*
        if (aSlot.shouldStoreSlot()) {
            this.didMutate(aSlot.name())
        }
        */
    }

    init () { 
        super.init()
        // subclasses should override to do initialization
        //assert(this.isInstance())
        this.initializeSlots()
    }

    initializeSlots () {
        this.thisPrototype().allSlotsMap().forEach(slot => slot.onInstanceInitSlot(this)) 
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

    respondsTo (methodName) {
        const f = this[methodName] 
        return typeof(f) === "function";
    }

    performWithArgList (message, argList) {
        return this[message].apply(this, argList);
    }

    perform (message) { // will apply any extra arguments to call
        if (this[message] && this[message].apply) {
            return this[message].apply(this, this.argsAsArray(arguments).slice(1));
        }

        throw new Error(this, ".perform(" + message + ") missing method")
        return this;
    }

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

    debugLog (s) {
        if (this.isDebugging()) {
            if (Type.isFunction(s)) {
                s = s()
            }
            if (arguments.length == 1) {
                console.log(this.debugTypeId() + " " + s)
            } else {
                console.log(this.debugTypeId() + " ", arguments[0], arguments[1])
            }
        }
        return this
    }

    // --- other ---

    freeze () {
        Object.freeze(this)
        return this
    }

}.initThisClass());



