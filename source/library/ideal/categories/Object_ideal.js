//"use strict";

/*

    Object-ideal
    
    Object isn't a prototype or class, it's more like a namespace to organize
    some functions that take an object as an argument. JS ugliness.

*/


/*
    
    Weird JS things:

    Some of the primitives such as Array, Set, Map have constructors which 
    do not inherit from Object (they and the Object constructor all inherit 
    from constructor named "") but their constructor prototypes *do* inherit 
    from Object.prototype.

    To make this consistent (so we can inherit class methods) we do
    the following:

*/

{
    const classesToFix = [
        Array, 
        Boolean, 
        Date, 
        Error, 
        Image, 
        Set, 
        Map, 
        Number, 
        String,
        ArrayBuffer
    ]
    classesToFix.forEach(aClass => aClass.__proto__ = Object)
}


Object.defineSlot = function (obj, slotName, slotValue) {
    if (Object.getOwnPropertyDescriptor(slotName)) {
        // TODO: raise exception if it exists? Safer for categories?
        this[slotName] = slotValue
    } else {
        const descriptor = {
            configurable: true,
            enumerable: false,
            value: slotValue,
            writable: true,
        }

        // this breaks on prototypes
        if (typeof (slotValue) === "function") {
            let objType = null
            try {
                objType = obj.type()
            } catch (e) {
                //console.warn("can't get type on ", obj)
            }

            if (objType) {
                //  debugger;
                slotValue.displayName = objType + "." + slotName
                //console.log("slotValue.displayName: ", slotValue.displayName)
            } else {
                slotValue.displayName = slotName
            }
        }

        Object.defineProperty(obj, slotName, descriptor)
    }
}

/*
Test = class Test {
    setup () {
        this._foo = 123
    }
}
 
Object.defineSlot(Test.prototype, "_foo", "bar")
 
let test = new Test()
test.setup()
 
console.log(test)
let d = Reflect.getOwnPropertyDescriptor(test, "_foo")
console.log(d)
 
if (d.enumerable) {
    console.log("is enumerable")
} else {
    console.log("is not enumberable")
}
*/

Object.defineSlots = function (obj, dict) {
    Object.keys(dict).forEach((slotName) => {
        const slotValue = dict[slotName]
        Object.defineSlot(obj, slotName, slotValue)
    })
};


Object.defineSlotSafely = function(obj, slotName, slotValue) {
    const nameForObj = function (obj) {
        let name = "?" 
        try {
            if (obj.hasOwnProperty("name")) {
                name = obj.name + ""
            } else {
                name = obj.constructor.name + ".prototype"
            }
        } catch (e) {
            name = "[error getting name]"
        }
        return name
    }

    if (obj.hasOwnProperty(slotName)) {
        const msg = nameForObj(obj) + "." + slotName + " slot already exists"
        console.log(msg)
        throw new Error(msg)
    } else {
        //const msg = nameForObj(obj) + "." + slotName + " DEFINED"
        //console.log(msg)
        Object.defineSlot(obj, slotName, slotValue)
    }
};

Object.defineSlotsSafely = function (obj, dict) {
    Object.keys(dict).forEach((slotName) => {
        const slotValue = dict[slotName]
        Object.defineSlotSafely(obj, slotName, slotValue)

    })
};




Object.defineSlot(Object, "initThisCategory", function () {
    // define this first, so we can use it to more cleanly define our
    // Object categories.
    //
    // This is a bit of a hack to implement class categories in Javascript
    // sanity check: check name to ensure we're only using this on a category

    const hasTwoPartName = this.name.split("_").length === 2
    if (!hasTwoPartName) {
        const msg = "category class name '" + this.type() + "' doesn't match expected pattern of ClassName-categoryName."
        throw new Error(msg)
    }

    // copy category methods to parent class

    const getSlotsDictOn = (obj) => {
        const keys = Reflect.ownKeys(obj)
        const dict = {}
        keys.forEach(k => {
            const v = obj[k]
            dict[k] = v
            if (typeof (v) === "function") {
                v._categoryName = this.name // add a comment for category source
            }
        })
        return dict
    }

    const parent = this.__proto__ //superClass()

    const classSlotsDict = getSlotsDictOn(this)
    delete classSlotsDict["length"] // FIXME: hack for collection types
    delete classSlotsDict["name"]
    delete classSlotsDict["prototype"]
    Object.defineSlotsSafely(parent, classSlotsDict) // this should throw on collision?

    const instanceSlotsDict = getSlotsDictOn(this.prototype)
    delete instanceSlotsDict["constructor"]
    delete instanceSlotsDict["prototype"]
    Object.defineSlotsSafely(parent.prototype, instanceSlotsDict) // this should throw on collision?
    return this
});

Object.defineSlot(Object, "_allClassesSet", new Set());


(class Object_ideal extends Object {

    static clone () {
        const obj = new this()
        obj.init()
        return obj
    }
 
    static type () {
        return this.name
    }
 
    static isClass () {
        return true
    }
 
    static getClassNamed (aName) {
        if (Type.isNullOrUndefined(aName)) {
            return undefined
        }
        return getGlobalThis()[aName]
    }
 
    static globals () {
        return getGlobalThis()
    }
 
    static initThisClass () {
        this.globals()[this.type()] = this
        //console.log("Prototype " + this.type() + " initThisClass")
        if (this.prototype.hasOwnProperty("initPrototype")) {
            this.prototype.initPrototype.apply(this.prototype)
        }
        this.addToAllClasses()
        return this
    }
 
    static superClass () {
        return this.__proto__
    }
 
    static addToAllClasses () {
        const allClassesSet = Object._allClassesSet
        if (allClassesSet.has(this)) {
            throw new Error("attempt to call initThisClass twice on the same class")
        }
        allClassesSet.add(this)
        return this
    }
 
    static allSubclasses () {
        return this._allClassesSet.select(aClass => aClass.hasAncestorClass(this))
    }
 
    static subclasses () {
        return this._allClassesSet.select(aClass => aClass.superClass() === this)
    }
 
    static hasAncestorClass (aClass) {
        const sc = this.superClass()
 
        if (sc === aClass) {
            return true
        }
 
        if (sc === Object || !sc.hasAncestorClass) {
            return false
        }
 
        return sc.hasAncestorClass(aClass)
    }
 
    static eachSlot (obj, fn) {
        Object.keys(obj).forEach(k => fn(k, obj[k]))
    }
 
    /*
    static slotValues (obj) {
        const values = [];
        obj.ownForEachKV((k, v) => values.push(v))
        return values;
    }
    */
 
    static asValueKeyDict (obj) {
        const dict = {}
        obj.ownForEachKV((k, v) => dict[v] = k)
        return dict
    }
 
    static isKindOf (aClass) {
        //assert(this.isClass())
        //assert(aClass.isClass())
 
        if (this.name === "") {
            // anything touching the root "" class seems to crash Chrome,
            // so let's be carefull to leave it along
            return false
        }
 
        if (this === aClass) {
            return true
        }
 
        let proto = this.__proto__
        if (proto && proto.name !== "") {
            return proto.isKindOf.apply(proto, [aClass])
        }
 
        return false
    }
 
    initPrototype () {
        Object.defineSlot(this, "_hasDoneInit", false)
        //Object.defineSlot(this, "_hasRetired", false) 
        Object.defineSlot(this, "_mutationObservers", null)
        Object.defineSlot(this, "_shouldStore", true)
        //Object.defineSlot(this, "_isObjectRetired", false)
    }
 
    /*
    clone () {
        const obj = new this()
        //let aClass = this.thisClass()
        //assert(aClass !== this)
        //let obj = aClass.clone()
        return obj
    }
    */
 
    init () {
        this.scheduleDidInit()
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
 
    thisClass () {
        if (this.isPrototype()) {
            return this.constructor
        }
        return this.__proto__.constructor
    }
 
    thisPrototype () {
        assert(this.isInstance())
        const prototype = this.__proto__
        assert(prototype.isPrototype)
        return prototype
    }
 
    type () {
        return this.constructor.name
    }
 
 
    // --- mutation ---
 
    mutatorMethodNamesSet () {
        throw new Error("undefined mutatorMethodNamesSet on '" + this.type() + "' class")
    }
 
    setupMutatorHooks () {
        this.mutatorMethodNamesSet().forEach((slotName) => {
            const unhookedName = "unhooked_" + slotName
            const unhookedFunction = this[slotName]
 
            Object.defineSlot(this, unhookedName, unhookedFunction)
 
            const hookedFunction = function () {
                this.willMutate(slotName)
                const result = this[unhookedName].apply(this, arguments)
                this.didMutate(slotName)
 
                //let argsString = []
                //for (let i=0; i < arguments.length; i++) {
                //    if (i !== 0) { argsString += ", " }
                //    argsString += String(arguments[i])
                //}
                //console.log("hooked Array " + slotName + "(" + argsString + ")") 
                //console.log("result = " + result)
 
                return result
            }
 
            Object.defineSlot(this, slotName, hookedFunction)
        })
    }
 
    // -------------------
 
    perform (methodName, arg1, arg2, arg3) {
        const f = this[methodName]
        if (f) {
            return f.call(this, arg1, arg2, arg3)
        }
        throw new Error(this.typeId() + " does not repsond to '" + methodName + "'")
    }
 
    performIfResponding (methodName, arg1, arg2, arg3) {
        const f = this[methodName]
        if (f) {
            return f.call(this, arg1, arg2, arg3)
        }
    }
 
    // -------------------
 
    shallowCopy () {
        const copy = Object.assign({}, this);
        return copy
    }
 
    
    // normal at() etc names would conflict with Array etc

    atSlot (key) {
        return this[key]
    }
 
    atSlotPut (key, value) {
        this[key] = value
        return this
    }
 
    removeSlotAt (key) {
        delete this[key]
        return this
    }
    
    // ----
 
    ownKVMap (fn) {
        return Object.keys(this).map(k => fn(k, this[k]))
    }
 
    ownForEachValue (fn) {
        Object.keys(this).forEach(k => fn(this[k]))
        return this
    }
 
    ownForEachKey(fn) {
        Object.keys(this).forEach(k => fn(k))
        return this
    }
 
    ownForEachKV (fn) {
        Object.keys(this).forEach(k => fn(k, this[k]))
        return this
    }
 
    isEqual (anObject) {
        // compare like we would two dictionaries
        // only checks enumerable properties
        const keys = Object.keys(this)
        const otherKeys = Object.keys(anObject)
        if (keys.length !== otherKeys.length) {
            return false
        }
 
        const foundInequality = keys.detect(k => this.getOwnProperty(k) !== anObject.getOwnProperty(k))
        return !foundInequality
    }
 
    getOwnProperty (key) {
        if (this.hasOwnProperty(key)) {
            return this[key]
        }
        return undefined
    }
 
    isKindOf (aClass) {
        //assert(!this.isClass())
        return this.thisClass().isKindOf(aClass)
    }
 
    // --- didInit ---
    //
    //  we don't want to scheduleSyncToStore while the object is initializing
    // (e.g. while it's being unserialized from a store)
    // so only scheduleSyncToStore if hasDoneInit is true, and set it to true
    // when didInit is called by the ObjectStore after 
 
 
    hasDoneInit () {
        return this.getOwnProperty("_hasDoneInit") === true
    }
 
    setHasDoneInit (aBool) {
        Object.defineSlot(this, "_hasDoneInit", aBool)
        return this
    }
 
    didInit () {
        assert(!this.hasDoneInit())
        // for subclasses to override if needed
        this.setHasDoneInit(true)
    }
 
    scheduleDidInit () {
        //SyncScheduler.shared().scheduleTargetAndMethod(this, "didInit")
        this.didInit()
    }

    typeCategory () {
        if (this.isInstance()) {
            return "instance"
        } else if (this.isPrototype()) {
            return "prototype"
        } else if (this.isClass()) {
            return "class"
        }
        throw new Error("unable to identify")
    }
 
    fullTypeName () {
        return this.type() + " " + this.typeCategory()
    }
 
    slotValuePath (slotName, entries = []) {
        const entry = [this.fullTypeName(), this.getOwnProperty(slotName)]
        entries.push(entry)
 
        const proto = this.__proto__
        if (proto) { // Object.prototype.__proto__ = null
            //proto.constructor.name !== "") {
            return proto.slotValuePath.apply(proto, [slotName, entries])
        }
 
        return entries
    }
 
    duplicate () {
        assert(this.isInstance())
        const instance = this.thisClass().clone().copyFrom(this)
        instance.duplicateSlotValuesFrom(this) // TODO: what about lazy slots?
 
        //const storeSlots = Object.slotValues(this.allSlots()).filter(slot => slot.shouldStoreSlot())
        //storeSlots.forEach((slot) => {
        //    const v = slot.onInstanceGetValue(this)
        //    slot.onInstanceSetValue(instance, v)
        //})
 
        return instance
    }
 
    copy () {
        return this.duplicate()
    }
 
    copyFrom (anObject) {
        // WARNING: subclasses will need to customize this
        this.duplicateSlotValuesFrom(anObject)
        return this
    }
 
    duplicateSlotValuesFrom (otherObject) {
        // TODO: add a type check of some kind?
 
        this.thisPrototype().allSlots().ownForEachKV((slotName, mySlot) => {
            const otherSlot = otherObject.thisPrototype().ownSlotNamed(slotName)
            const v = otherSlot.onInstanceGetValue(otherObject) // TODO: what about lazzy slots?
            const dop = otherSlot.duplicateOp()
 
            if (dop === "copyValue") {
                mySlot.onInstanceSetValue(this, v)
            } else if (dop === "duplicate" && v && v.duplicate) {
                const dup = v.duplicate()
                mySlot.onInstanceSetValue(this, dup)
            }
        })
        return this
    }
 
    copySlotValuesFrom(otherObject) {
        this.thisPrototype().allSlots().ownForEachKV((slotName, mySlot) => {
            const otherSlot = otherObject.thisPrototype().ownSlotNamed(slotName)
            const v = otherSlot.onInstanceGetValue(otherObject)
            mySlot.onInstanceSetValue(this, v)
        })
        return this
    }
    

}).initThisCategory();

Object.initThisClass();
