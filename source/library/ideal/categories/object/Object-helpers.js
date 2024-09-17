
"use strict"; 

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
        Blob,
        Date, 
        Error, 
        Image, 
        Set, 
        Map, 
        Number,
        Range,
        String,
        ArrayBuffer
    ]
    classesToFix.forEach(aClass => aClass.__proto__ = Object)
}

/*

    Object-helpers
    
    Some functions to help us implement categories.

*/

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
        /*
        if (typeof (slotValue) === "function") {
            let objType = null
            try {
                //if (obj.type) {
                    objType = obj.type()
                //}
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
        */

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
        let name = "?";
        try {
            if (obj.hasOwnProperty("name")) {
                name = obj.name + "";
            } else {
                name = obj.constructor.name + ".prototype";
            }
        } catch (e) {
            name = "[error getting name]";
        }
        return name;
    }

    if (obj.hasOwnProperty(slotName) && !slotName.startsWith("_")) {
        if(typeof(slotValue) === "function" && obj[slotName + "_isOptional"] !== undefined) {
            return null;
        }
        const msg = nameForObj(obj) + "." + slotName + " slot already exists";
        console.log(msg);
        throw new Error(msg);
    } else {
        //const msg = nameForObj(obj) + "." + slotName + " DEFINED";
        //console.log(msg);
        Object.defineSlot(obj, slotName, slotValue);
    }
};

Object.defineSlotsSafelyFromMap = function (obj, aMap) {
    for (const [slotName, slotValue] of aMap) {
        Object.defineSlotSafely(obj, slotName, slotValue);
    }
};

// --- category related methods --------------------------------------------


// --- type ---

Object.defineSlotSafely(Object, "type", function () { 
    return this.name;
});

Object.defineSlotSafely(Object.prototype, "type", function () { 
    return this.constructor.name;
});

// --- isClass ---

Object.defineSlotSafely(Object, "isClass", function () { 
    return true;
});

Object.defineSlotSafely(Object.prototype, "isClass", function () { 
    return false;
});

// --- isPrototype ---

Object.defineSlotSafely(Object, "isPrototype", function () { 
    return false;
});

Object.defineSlotSafely(Object.prototype, "isPrototype", function () { 
    return this.constructor.prototype === this;
});

// --- isInstance ---

Object.defineSlotSafely(Object, "isInstance", function () { 
    return false;
});

Object.defineSlotSafely(Object.prototype, "isInstance", function () { 
    return !this.isPrototype();
});


// --- slot enumeration -----------------------------------------------------

Object.defineSlotSafely(Object.prototype, "forEachPrototype", function (fn) { 
    let proto = this;

    if (this.isInstance()) {
        proto = this.__proto__;
    }

    while (proto) {
        fn(proto);
        //console.log("proto is ", proto.type())
        if (proto === proto.__proto__) {
            throw new Error("__proto__ loop detected in " + proto.type());
            break;
        } else {
            proto = proto.__proto__;
        }
    }
});

Object.defineSlot(Object.prototype, "forEachSlot", function (fn) { 
    this.forEachPrototype(proto => {
        if (Object.hasOwn(proto, "_slotsMap")) {
            proto._slotsMap.forEach((slot, key, map) => {
                fn(slot);
            })
        }
    });
});

Object.defineSlot(Object.prototype, "setupAllSlotsMap", function () { 
    if (!this.isPrototype()) {
        throw new Error("setupAllSlotsMap called on non-prototype");
    }

    const m = this._allSlotsMap;
    //console.log("*** " + this.type() + " setupAllSlotsMap");

    //assert(this.isPrototype())
    this.forEachSlot(slot => {
        const k = slot.name();
        if (!m.has(k)) { // to handle overrides 
            m.set(k, slot);
        }
    });
});

Object.defineSlot(Object.prototype, "allSlotsMap", function () { 
    return this._allSlotsMap;
});

Object.defineSlot(Object.prototype, "slotsMap", function () { 
    return this._slotsMap;
});

Object.defineSlot(Object.prototype, "initSlots", function () { // setup property, getter, setter for each slot
    assert(this.isPrototype());
    //console.log(this.type() + " this.slotsMap().size = " + this.slotsMap().size);

    this.slotsMap().forEach((slot) => {
        slot.setupInOwner();
        assert(this.hasOwnProperty([slot.name()]) && this.hasOwnProperty(["_" + slot.name()]), this.type() + " missing " + slot.name() + " slot");
    });
});

Object.defineSlot(Object.prototype, "setupPrototype", function () { 

    if (!this.isPrototype()) {
        throw new Error("setupPrototype called on non-prototype");
    }

    /// each proto has it's own set of slots - use justNewSlot as newSlot needs to check the slots list
    Object.defineSlot(this, "_slotsMap", new Map()); // slots for just this proto
    Object.defineSlot(this, "_allSlotsMap", new Map()); // slots for this proto and all protos in the proto chain
    this.setupAllSlotsMap();

    // We need to separate initPrototypeSlots, initSlots, initPrototype as
    // initializing some slots may depend on others already existing.
    
    // Slot init ordering may be important as well and why slots should be stored in 
    // an array with a name->slot map used as an index.

    
    if (this.hasOwnProperty("initPrototypeSlots")) {
        // Only called if method defined on this class.
        this.initPrototypeSlots();// This method should NOT call super
    }

    this.initSlots();

    if (this.hasOwnProperty("initPrototype")) {
        this.initPrototype(); // This method should NOT call super

        if (this.assertProtoSlotsHaveType) {
            this.assertProtoSlotsHaveType();
        } else {
            if (this.type() !== "Object") {
                console.log(this.type() + " missing assertProtoSlotsHaveType");
                debugger;
            }
        }
    } else {
        //debugger;
    }

    //console.log("\n\n" + this.type() + " allSlots: ", Array.from(this.allSlotsMap().keys()).sort() + "\n\n");
    return this;
});


Object.defineSlot(Object, "initThisCategory", function () { 
    // define this first, so we can use it to more cleanly define our
    // Object categories.
    //
    // This is a bit of a hack to implement class categories in Javascript
    // sanity check: check name to ensure we're only using this on a category

    const hasTwoPartName = this.name.split("_").length === 2;
    if (!hasTwoPartName) {
        const msg = "category class name '" + this.type() + "' doesn't match expected pattern of ClassName_categoryName.";
        throw new Error(msg);
    }

    // assert(this.isClass());
    // setup slots (would normally be done ny initThisClass)

    //////////////////////////////////////////////////////////////////////
    //this.prototype.setupPrototype(); /////////////////////////////////// FIXME: we should be able to do this and be able to support initPrototypeSlots&initPrototype in categories, right?
    //////////////////////////////////////////////////////////////////////

    // function to get a map of slots (usefull for copying slots from one object to another)

    const getSlotsMapOn = (obj) => {
        const keys = Reflect.ownKeys(obj);
        const map = new Map();
        keys.forEach(k => {
            const v = obj[k];
            map.set(k, v);
            /*
            // this doesn't seem to get the correct .name(?)
            if (typeof (v) === "function" && k !== "constructor") {
                //v._categoryName = this.name // add a comment for category source 
            }
            */
        })
        return map;
    }

    // get the parent class
    const parentClass = this.__proto__;

    //parentClass.addProtoCategory(this);

    // copy class slots to parent class
    const classSlotsMap = getSlotsMapOn(this);
    classSlotsMap.delete("length"); // FIXME: hack for collection types
    classSlotsMap.delete("name");
    classSlotsMap.delete("prototype");
    Object.defineSlotsSafelyFromMap(parentClass, classSlotsMap); // throws if slot already exists

    // copy prototype slots to parent prototype
    const protoSlotsMap = getSlotsMapOn(this.prototype);
    protoSlotsMap.delete("constructor");
    protoSlotsMap.delete("prototype");
    Object.defineSlotsSafelyFromMap(parentClass.prototype, protoSlotsMap); // throws if slot already exists

    /*
    console.log("this.name = '" + this.name + "'")
    console.log("parentClass.name = '" + parentClass.name + "'")
    console.log("parentClass.__proto__.name = '" + parentClass.__proto__.name + "'")
    */
    
    // bit of a hack to fix super in class and proto methods
    if (parentClass !== Object) { // don't need to call super on base class
        // fix super in instance methods
        Object.setPrototypeOf(this.prototype, parentClass.__proto__.prototype); 

        // fix super in static/class methods
        // need to do this *after* instance methods super fix as it changes __proto__
        Object.setPrototypeOf(this, parentClass.__proto__); 

        // related to super, see:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super
    }

    return this
});


