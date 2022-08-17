"use strict";

/*

    Object_class
    
    Some added state and behavior on Object class. 

*/


(class Object_class extends Object {

    // --- class methods ---

    static clone () {
        const obj = new this()
        obj.init()
        obj.afterInit()
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

    static parentClass () {
        const p = this.__proto__

        if (p && p.type) {
            return p
        }

        return null
    }

    static addChildClass (aClass) {
        this.childClasses().add(aClass)
        return this
    }

    static globals () {
        return getGlobalThis()
    }

    static initClass () {
        this.newClassSlot("allClassesSet", new Set())
    }

    static findAncestorClasses () {
        const results = []
        let aClass = this.parentClass()
        while (aClass && aClass.parentClass) {
            results.push(aClass)
            aClass = aClass.parentClass()
        }
        return results
    }


    static newClassSlot (slotName, slotValue) {
        const ivarName = "_" + slotName
        const assert = function (aBool) {
            if (!aBool) {
                throw new Error("failed assert")
            }
        }

        // define ivar
        {
            const hasIvar = !Type.isUndefined(Object.getOwnPropertyDescriptor(this, ivarName))
            assert(!hasIvar)
            const descriptor = {
                configurable: true,
                enumerable: false,
                value: slotValue,
                writable: true,
            }
            Object.defineProperty(this, ivarName, descriptor)
        }

        // define getter
        {
            const hasGetter = !Type.isUndefined(Object.getOwnPropertyDescriptor(this, slotName))
            assert(!hasGetter)
            //const getterFunc = eval('function () { return this.' + ivarName + '; }');
            const getterFunc = function () { return this[ivarName]; };
            const descriptor = {
                configurable: true,
                enumerable: false,
                value: getterFunc,
                writable: true,
            }
            Object.defineProperty(this, slotName, descriptor)
        }

        // define setter
        {

            const setterName = "set" + slotName.capitalized()
            const setterFunc = function (v) { this[ivarName] = v; return this };
            const descriptor = {
                configurable: true,
                enumerable: false,
                value: setterFunc,
                writable: true,
            }
            Object.defineProperty(this, setterName, descriptor)
        }

        return this
    }


    static initThisClass () { // called on every class which we create
        this.defineClassGlobally()

        // setup ancestor list
        // could become invalid if class structure dynamically changes
        this.newClassSlot("ancestorClasses", this.findAncestorClasses())
        this.newClassSlot("childClasses", new Set())

        // add as class to parent
        const p = this.parentClass()
        if (p && p.addChildClass) {
            p.addChildClass(this)
        }

        if (this.hasOwnProperty("initClass")) {
            // Only called if method defined on this class.
            // This method should *not* call super.initClass().
            this.initClass()
        }

        const proto = this.prototype

        //proto.justNewSlot("slots", new Map()) // each proto has it's own set of slots - us justNewSlot as newSlot needs to check the slots list
        Object.defineSlot(proto, "_slotsMap", new Map)

        if (proto.hasOwnProperty("initPrototype")) {
            // Only called if method defined on this class.
            // This method should *not* call super.initPrototype()
            proto.initPrototype()
        }

        this.addToAllClasses()
        return this
    }


    slotsMap () {
        return this._slotsMap
    }

    static defineClassGlobally () {
        const className = this.type()
        if (Type.isUndefined(this.globals()[className])) {
            this.globals()[className] = this
            //console.log(this.type() + ".initThisClass()")
        } else if (this.type() !== "Object") {
            const msg = "WARNING: Attempt to redefine getGlobalThis()['" + className + "']"
            console.warn(msg)
            throw new Error(msg)
        }
    }

    static superClass () {
        return this.__proto__
    }

    static addToAllClasses () {
        //console.log("addToAllClasses '" + this.type() + "'")
        if (this.allClassesSet().has(this)) {
            throw new Error("attempt to call initThisClass twice on class '" + this.type() + "'")
        }
        this.allClassesSet().add(this)
        return this
    }

    static allSubclasses () {
        return this.allClassesSet().select(aClass => aClass.hasAncestorClass(this))
    }

    static subclasses () {
        return this.allClassesSet().select(aClass => aClass.superClass() === this)
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

    static isKindOf (aClass) {
        //assert(this.isClass())
        //assert(aClass.isClass())

        if (this.name === "") {
            // anything touching the root "" class seems to crash Chrome,
            // so let's be carefull to leave it alone
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

}).initThisCategory();

Object.initThisClass();
