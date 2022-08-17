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
            debugger;
            // kinda weird dealing with shared in clone like this
            // do we do this to deal with deserialization of singletons?
            return this.shared() 
        }

        const obj = new this()
        obj.init()

        if (this.isSingleton()) {
            this.setShared(obj)
        }

        return obj
    }

    // --- shared ---

    static hasShared () {
        return !Type.isNullOrUndefined(this._shared)
    }

    static shared () {
        if (!this.hasShared()) {
            this.setShared(this.clone())
        }
        return this._shared
    }

    static setShared (v) {
        this._shared = v
        return this
    }

    // --- init ---

    static initClass () {
        //console.log(this.type() + " initThisClass")
        Object.defineSlot(this, "_shared", undefined)
        //this.newClassSlot("shared", undefined)
        this.newClassSlot("isSingleton", false)
        this.newClassSlot("setterNameMap", new Map())
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

    static isClass () {
        return true
    }

    static isInstance () {
        return false
    }

    static isPrototype () {
        return false
    }

    // --- instance ---


    initPrototype () {
        this.newSlot("isDebugging", false)
    }

    superClass () {
        return this.thisClass().superClass()
    }

    thisPrototype () {
        assert(this.isInstance())
        const prototype = this.__proto__
        assert(prototype.isPrototype)
        return prototype
    }

    thisClass () {
        if (this.isPrototype()) {
            // it's an prototype
            return this.constructor
        }

        // otherwise, it's an instance
        return this.__proto__.constructor
    }

    isPrototype () {
        return this.constructor.prototype === this 
    }
    
    isInstance () {
        return !this.isPrototype()
    }

    isClass () {
        return false
    }

    type () {
        return this.constructor.name
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

    allSlotsMap (m = new Map()) {
        //assert(this.isPrototype())

        if (this.__proto__ && this.__proto__.allSlotsMap) {
            this.__proto__.allSlotsMap(m)
        }
        
        this.slotsMap().forEachKV((k, v) => m.set(k, v))
        //this.slotsMap().mergeInto(m)
        return m
    }

    /*
    allSlotsRawValueMap () { // what about action slots?
        const map = new Map()
        this.allSlotsMap().forEachKV((slotName, slot) => map.set(slot.name(), slot.onInstanceRawGetValue(this)))
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
        const slot = this.allSlotsMap().get(slotName)
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

        if (this.allSlotsMap().has(slotName)) {
            const msg = this.type() + " newSlot('" + slotName + "') - slot already exists"
            console.log(msg)
            throw new Error(msg)
        }
        return this.justNewSlot(slotName, initialValue, allowOnInstance)
    }

    overrideSlot (slotName, initialValue, allowOnInstance=false) {
        const oldSlot = this.allSlotsMap().get(slotName)
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
        slot.autoSetGetterSetterOwnership()
        slot.setupInOwner()
        this.slotsMap().set(slotName, slot)
        return slot
    }

    // --- weak slot ---

    getWeakSlotValue (aSlot) {
        const privateName = aSlot.privateName()  // fix this value
        const weakRef = this[privateName]

        if (weakRef) {
            const v = weakRef.deref()
            if (v === undefined) {
                return null 
                // return null so we know when undefined is returned, 
                // that the slot has never been set
            }
            return v
        }

        return undefined
    }

    setWeakSlotValue (aSlot, newValue) {
        const privateName = aSlot.privateName()  // fix this value
        const weakRef = this[privateName]
        const oldValue = weakRef ? weakRef.deref() : undefined;
        //const oldValue = this.getWeakSlotValue(aSlot);
        if (newValue !== oldValue) {
            this[privateName] = new WeakRef(newValue)
        }
        return this
    }

    // --- base getter setter ---


    baseGetSlotValue (aSlot) {
        if (aSlot.isWeak()) {
            return this.getWeakSlotValue(aSlot)
        } else {
            const privateName = aSlot.privateName() 
            return this[privateName]
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

        if (v === undefined) {
            this.onUndefinedGetSlot(aSlot)
        }

        this.willGetSlot(aSlot)

        return this.baseGetSlotValue(aSlot)
    }

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
            m.apply(this, [oldValue, newValue])
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
        const allSlots = this.__proto__.allSlotsMap()
        allSlots.forEachV(slot => slot.onInstanceInitSlot(this)) // TODO: use slot cache
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

}.initThisClass());


