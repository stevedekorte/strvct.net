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
