

//"use strict"; // comment out temporarily in order to debug super call on category methods

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
            /*
            // this doesn't seem to get the correct .name(?)
            if (typeof (v) === "function" && k !== "constructor") {
                //v._categoryName = this.name // add a comment for category source 
            }
            */
        })
        return dict
    }



    const parent = this.__proto__ //superClass()

    // copy instance slots
    const instanceSlotsDict = getSlotsDictOn(this.prototype)
    delete instanceSlotsDict["constructor"]
    delete instanceSlotsDict["prototype"]
    Object.defineSlotsSafely(parent.prototype, instanceSlotsDict)

    // copy class slots
    const classSlotsDict = getSlotsDictOn(this)
    delete classSlotsDict["length"] // FIXME: hack for collection types
    delete classSlotsDict["name"]
    delete classSlotsDict["prototype"]
    Object.defineSlotsSafely(parent, classSlotsDict)

    /*
    console.log("this.name = '" + this.name + "'")
    console.log("this.__proto__.name = '" + this.__proto__.name + "'")
    console.log("this.__proto__.__proto__.name = '" + this.__proto__.__proto__.name + "'")
    */
    
    if (this.__proto__ !== Object) { // don't need to call super on base class
        // fix super in instance methods
        Object.setPrototypeOf(this.prototype, this.__proto__.__proto__.prototype); 

        // fix super in static/class methods
        // need to do this *after* instance methods super fix as it changes __proto__
        Object.setPrototypeOf(this, parent.__proto__); 

        // related to super, see:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super
    }

    return this
});


