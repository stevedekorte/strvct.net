"use strict"; 

/**
 * @module boot
 */

/** 
 * @class Object_categorySupport
 * @extends Object
 * @classdesc This class adds support for defining slots in classes and prototypes,
 * and adds a initThisCategory for setting up categories. A category is a way to add 
 * class and instance methods to another class and its prototype. Calling initThisCategory
 * on a class will copy the class's class and instance methods to the class's 
 * superclass and superclass prototype.
*/

(class Object_categorySupport extends Object {

    /**
     * @method initThisClass
     * @description This method is called to initialize the class. It makes the 
     * primitives inherit from Object and defines the slots for defining slots.
    */
    static initThisClass () {
        this.makePrimitivesInheritFromObject();

        // We'll need these to be able to define slots in categories
        Object.defineSlot = this.defineSlot;
        Object.defineSlots = this.defineSlots;
        Object.defineSlotSafely = this.defineSlotSafely;
        Object.defineSlotsSafelyFromMap = this.defineSlotsSafelyFromMap;
        Object.initThisCategory = this.initThisCategory; // we can't use initThisCategory as it with throw an error because defineSlot etc already exist
    }

    /**
     * @method makePrimitivesInheritFromObject
     * @description This method makes a number of primitive types inherit from Object.
     * @returns {void}
    */
    static makePrimitivesInheritFromObject() {

        /*
            Weird JS things:

            Some of the primitives such as Array, Set, Map have constructors which 
            do not inherit from Object (they and the Object constructor all inherit 
            from constructor named "") but their constructor prototypes *do* inherit 
            from Object.prototype.

            To make this consistent (so we can inherit class methods) we do
            the following:

        */
        const classesToFix = [
            Array, 
            ArrayBuffer,
            Boolean, 
            Blob,
            Date, 
            Error, 
            Image, 
            Map, 
            Number,
            Promise,
            Range,
            Set, 
            String,
            URL,
        ];
        classesToFix.forEach(aClass => aClass.__proto__ = Object);
        return this;
    }

    /**
     * @method defineSlot
     * @description This method defines a slot on an object.
     * @param {Object} obj - The object to define the slot on.
     * @param {string} slotName - The name of the slot to define.
     * @param {any} slotValue - The value of the slot to define.
     * @returns {void}
    */
    static defineSlot (obj, slotName, slotValue) {
        if (Object.getOwnPropertyDescriptor(obj, slotName)) {
            // TODO: raise exception if it exists? Safer for categories?
            this[slotName] = slotValue;
        } else {
            const descriptor = {
                configurable: true,
                enumerable: false,
                value: slotValue,
                writable: true,
            };

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

            Object.defineProperty(obj, slotName, descriptor);
        }
    }

    /**
     * @method defineSlots
     * @description This method defines multiple slots on an object.
     * @param {Object} obj - The object to define the slots on.
     * @param {Object} dict - An object where the keys are the slot names and the values are the slot values.
     * @returns {void}
    */
    static defineSlots (obj, dict) {
        Object.keys(dict).forEach((slotName) => {
            const slotValue = dict[slotName];
            Object.defineSlot(obj, slotName, slotValue);
        });
    }

    /**
     * @method defineSlotSafely
     * @description This method defines a slot on an object, but throws an error if the slot already exists.
     * @param {Object} obj - The object to define the slot on.
     * @param {string} slotName - The name of the slot to define.
     * @param {any} slotValue - The value of the slot to define.
     * @returns {void}
    */
    static defineSlotSafely (obj, slotName, slotValue) {
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
    }

    /**
     * @method defineSlotsSafelyFromMap
     * @description This method defines multiple slots on an object from a map.
     * @param {Object} obj - The object to define the slots on.
     * @param {Map} aMap - A map where the keys are the slot names and the values are the slot values.
     * @returns {void}
    */
    static defineSlotsSafelyFromMap (obj, aMap) {
        for (const [slotName, slotValue] of aMap) {
            Object.defineSlotSafely(obj, slotName, slotValue);
        }
    }

    /**
     * @method initThisCategory
     * @description This method is called to initialize the category. It makes the 
     * class and its prototype inherit from the superclass and superclass prototype.
    */
    static initThisCategory () { 
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
        //this.prototype.setupPrototype(); /////////////////////////////////// FIXME: we should be able to do this and be able to support initPrototypeSlots & initPrototype in categories, right?
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

        return this;
    }

}).initThisClass();

