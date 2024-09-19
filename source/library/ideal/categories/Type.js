"use strict";

/** 
 * @module library.ideal
 * @class Type
 * @description Value/reference type related functions.

    Example use:

        if (Type.isNullOrUndefined(value)) { ...}


    Known types:

        Literals:

            null
            undefined
            string
            symbol
            number

        Other types:

            object
            array

            Int8Array
            Uint8Array
            Uint8ClampedArray
            Int16Array
            Uint16Array
            Int32Array
            Uint32Array
            Float32Array
            Float64Array
            BigInt64Array
            BigUint64Array


    More example uses:

        const i8a = new Int8Array(6);   
        console.log("is a Int8Array: ", Type.isInt8Array(i8a))

*/


getGlobalThis().Type = (class Type extends Object {

    /**
     * Returns an array of all type names supported by this class.
     * @returns {string[]} An array of type names.
     */
    static allTypeNames () {
        return [
            "Array",
            "Boolean",
            "Blob",
            "Map",
            "Null",
            "Number",
            "Set",
            "String",
            "Symbol",
            "Int8Array",
            "Uint8Array",
            "Uint8ClampedArray",
            "Int16Array",
            "Uint16Array",
            "Int32Array",
            "Uint32Array",
            "Float32Array",
            "Float64Array",
            "BigInt64Array",
            "BigUint64Array",
            //"TypedArray",
            "Undefined",
            "Object", // put object last so other types have preference
        ]
    }

    /**
     * Returns an array of typed array type names.
     * @returns {string[]} An array of typed array type names.
     */
    static typedArrayTypeNames () {
        return [
            "Int8Array",
            "Uint8Array",
            "Uint8ClampedArray",
            "Int16Array",
            "Uint16Array",
            "Int32Array",
            "Uint32Array",
            "Float32Array",
            "Float64Array",
            "BigInt64Array",
            "BigUint64Array",
        ]
    }

    /**
     * Checks if the given value is a class.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a class, false otherwise.
     */
    static isClass (v) {
        const result = typeof(v) === "function"
            && /^class\s/.test(Function.prototype.toString.call(v));

        return result
    }

    /**
     * Checks if the given value is a Promise.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Promise, false otherwise.
     */
    static isPromise (v) {
        return v instanceof Promise;
    }

    /**
     * Checks if the given value is a literal (string, number, boolean, null, or undefined).
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a literal, false otherwise.
     */
    static isLiteral (v) {
        return  Type.isString(v) ||
                Type.isNumber(v) ||
                Type.isBoolean(v) ||
                Type.isNull(v) ||
                Type.isUndefined(v);
    }

    /**
     * Checks if the given value is an array.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an array, false otherwise.
     */
    static isArray (value) {
        return !Type.isNull(value) && 
                Type.isObject(value) && 
                value.__proto__ === ([]).__proto__ &&
                !Type.isUndefined(value.length)
    }

    /**
     * Checks if the given value is a Set.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a Set, false otherwise.
     */
    static isSet (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === Set.prototype 
    }

    /**
     * Checks if the given value is a Map.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a Map, false otherwise.
     */
    static isMap (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === Map.prototype 
    }  

    /**
     * Checks if the given value is an iterator.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an iterator, false otherwise.
     */
    static isIterator (value) {
        return !Type.isNull(value) && 
                Type.isObject(value) && 
                typeof(value[Symbol.iterator]) === "function";
    }

    /**
     * Checks if the given value is a boolean.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a boolean, false otherwise.
     */
    static isBoolean (value) {
        return typeof(value) === "boolean"
    }   

    /**
     * Checks if the given value is a function.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a function, false otherwise.
     */
    static isFunction (value) {
        return typeof(value) === "function"
    }  

    /**
     * Checks if the given value is undefined.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is undefined, false otherwise.
     */
    static isUndefined (value) {
        return value === undefined // safe in modern browsers, even safe in older browsers if undefined is not redefined
    }

    /**
     * Checks if the given value is null.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is null, false otherwise.
     */
    static isNull (value) {
        return value === null
    }

    /**
     * Checks if the given value is null or undefined.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is null or undefined, false otherwise.
     */
    static isNullOrUndefined (value) {
        return this.isUndefined(value) || this.isNull(value)
    }

    /**
     * Checks if the given value is NaN.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is NaN, false otherwise.
     */
    static isNaN (value) {
        return isNaN(value)
    }

    /**
     * Checks if the given value is a number.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a number, false otherwise.
     */
    static isNumber (value) {
        return typeof(value) === "number"
    }

    /**
     * Checks if the given value is an integer.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an integer, false otherwise.
     */
    static isInteger (value) {
        return this.isNumber(value) && (value % 1 === 0);
    }

    /**
     * Checks if the given value is an object.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an object, false otherwise.
     */
    static isObject (value) { 
        // WARNING: true for array and dictionary too!
        return typeof(value) === "object" 
    }

    /**
     * Checks if the given value is a dictionary.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a dictionary, false otherwise.
     */
    static isDictionary (value) {
        if (Type.isNullOrUndefined(value)) {
            return false;
        }
        // WARNING: a good guess for our use cases, but not always correct!
        // e.g. 3rd party libraries and code may use Object instances as or like Objects instead of as Dictionaries (such as in JSON)
        return this.isObject(value) && (value.constructor === Object) 
    }

    /**
     * Checks if the given value is a string.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a string, false otherwise.
     */
    static isString (value) {
        return typeof(value) === "string"
    } 

    /**
     * Checks if the given value is a symbol.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a symbol, false otherwise.
     */
    static isSymbol (value) {
        return typeof(value) === "symbol"
    } 

    /**
     * Checks if the given value is an ArrayBuffer.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an ArrayBuffer, false otherwise.
     */
    static isArrayBuffer (value) {
        return Type.valueHasConstructor(value, ArrayBuffer);
    }

    /**
     * Checks if the given value is a Blob.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a Blob, false otherwise.
     */
    static isBlob (value) {
        return value instanceof Blob;
    }

    /**
     * Checks if the given value is a simple type (number, string, boolean, undefined, or null).
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a simple type, false otherwise.
     */
    static isSimpleType (v) {
        return Type.isNumber(v) || Type.isString(v) || Type.isBoolean(v) || Type.isUndefined(v) || Type.isNull(v);
    }

    // typed arrays 

    /**
     * Checks if the given value has the specified constructor.
     * @param {*} v - The value to check.
     * @param {Function} constructor - The constructor to check against.
     * @returns {boolean} True if the value has the specified constructor, false otherwise.
     * @private
     */
    static valueHasConstructor (v, constructor) {  // private
        return !Type.isNullOrUndefined(v) && (Object.getPrototypeOf(v) === constructor.prototype);
    }

    /**
     * Checks if the given value is an Int8Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is an Int8Array, false otherwise.
     */
    static isInt8Array (v) {
        return Type.valueHasConstructor(v, Int8Array);
    }

    /**
     * Checks if the given value is a Uint8Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint8Array, false otherwise.
     */
    static isUint8Array (v) {
        return Type.valueHasConstructor(v, Uint8Array);
    }

    /**
     * Checks if the given value is a Uint8ClampedArray.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint8ClampedArray, false otherwise.
     */
    static isUint8ClampedArray (v) {
        return Type.valueHasConstructor(v, Uint8ClampedArray);
    }

    /**
     * Checks if the given value is an Int16Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is an Int16Array, false otherwise.
     */
    static isInt16Array (v) {
        return Type.valueHasConstructor(v, Int16Array);
    }

    /**
     * Checks if the given value is a Uint16Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint16Array, false otherwise.
     */
    static isUint16Array (v) {
        return Type.valueHasConstructor(v, Uint16Array);
    }

    /**
     * Checks if the given value is an Int32Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is an Int32Array, false otherwise.
     */
    static isInt32Array (v) {
        return Type.valueHasConstructor(v, Int32Array);
    }

    /**
     * Checks if the given value is a Uint32Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint32Array, false otherwise.
     */
    static isUint32Array (v) {
        return Type.valueHasConstructor(v, Uint32Array);
    }
    
    /**
     * Checks if the given value is a Float32Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Float32Array, false otherwise.
     */
    static isFloat32Array (v) {
        return Type.valueHasConstructor(v, Float32Array);
    }

    /**
     * Checks if the given value is a Float64Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Float64Array, false otherwise.
     */
    static isFloat64Array (v) {
        return Type.valueHasConstructor(v, Float64Array);
    }

    /**
     * Checks if the given value is a BigInt64Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a BigInt64Array, false otherwise.
     */
    static isBigInt64Array (v) {
        return Type.valueHasConstructor(v, BigInt64Array);
    }

    /**
     * Checks if the given value is a BigUint64Array.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a BigUint64Array, false otherwise.
     */
    static isBigUint64Array (v) {
        return Type.valueHasConstructor(v, BigUint64Array);
    }

    
    /**
     * Checks if the given value is a TypedArray.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a TypedArray, false otherwise.
     */
    static isTypedArray (v) {
        return Type.valueHasConstructor(v, TypedArray);
    }
    

    // type name

    /**
     * Returns the type name of the given value.
     * @param {*} value - The value to get the type name for.
     * @returns {string} The type name of the value.
     * @throws {Error} If unable to identify the type of the value.
     */
    static typeName (value) {
        if (value === null) {
            return "Null";
        }

        if (Type.isObject(value)) {
            //return value.type()
            return value.constructor.name;
        }

        if (Type.isFunction(value)) {
            return "function";
        }

        /*
        {
            const type = Object.prototype.toString.call(value);
            return type.slice(8, -1);
        }
        */

        const typeNames = this.allTypeNames();
        for (let i = 0; i < typeNames.length; i++) {
            const typeName = typeNames[i];
            const methodName = "is" + typeName;
            if (this[methodName].call(this, value)) {
                return typeName;
            }
        }
        throw new Error("unable to identify type for value: ", value);
    }

    /**
     * Returns an array of type names that match the given value.
     * @param {*} value - The value to check.
     * @returns {string[]} An array of matching type names.
     */
    static typeNamesForValue (value) {
        const matches = [];
        const typeNames = this.allTypeNames();
        for (let i = 0; i < typeNames.length; i++) {
            const typeName = typeNames[i];
            const methodName = "is" + typeName;
            if (this[methodName].apply(this, [value])) {
                matches.push(typeName);
            }
        }
        return matches;
    }

    /**
     * Asserts that the given value matches the specified valid type names.
     * @param {*} v - The value to check.
     * @param {string[]} validTypeNames - An array of valid type names.
     * @throws {Error} If the value's type names don't match the valid type names.
     */
    static assertValueTypeNames (v, validTypeNames) {
        let doesMatch = true
        const foundTypeNames = this.typeNamesForValue(v)
        if (foundTypeNames.length === validTypeNames.length) {
            for (let i = 0; i < foundTypeNames.length; i ++) {
                const name = foundTypeNames[i]
                if (!validTypeNames.includes(name)) {
                    doesMatch = false;
                    break;
                }
            }
        } else {
            doesMatch = false
        }
        if (!doesMatch) {
            throw new Error(JSON.stringify(validTypeNames) + " != " + JSON.stringify(foundTypeNames) )
        }
    }

    // --- type id ---

    /**
     * Checks if the given value is a JSON-compatible type.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a JSON-compatible type, false otherwise.
     */
    static isJsonType (value) {
        // Note: this doesn't walk the collection types to see if their values are also JSON
        const jsonTypes = new Set(["String", "Number", "Object", "Array", "Boolean", "Null"]);
        return jsonTypes.has(Type.typeName(value));
    }

    /**
     * Checks if the given value is a deep JSON-compatible type.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a deep JSON-compatible type, false otherwise.
     */
    static isDeepJsonType (value) {
        const seen = new Set();
      
        function checkValue(v) {
          if (v === null) return true;
      
          const type = typeof v;
      
          if (['string', 'number', 'boolean'].includes(type)) return true;
      
          if (type === 'object') {
            if (seen.has(v)) return false; // Circular reference
            seen.add(v);
      
            if (Array.isArray(v)) {
              return v.every(checkValue);
            } else {
              return Object.keys(v).every(key => {
                if (typeof key !== 'string') return false;
                return checkValue(v[key]);
              });
            }
          }
      
          return false; // Functions, undefined, symbols, etc.
        }
      
        return checkValue(value);
    }


    /**
     * Generates a unique identifier for the given value based on its type.
     * @param {*} value - The value to generate an identifier for.
     * @returns {string} A unique identifier for the value.
     * @throws {Error} If the value's type is not handled.
     */
    static typeUniqueId (value) {

        if (Type.isUndefined(value)) {
            return "u";
        }

        if (Type.isNull(value)) {
            return "n";
        }

        if (Type.isObject(value)) {
            // Array, Set, {}, Object, etc but not numbers, strings, null, or undefined
            return "O" + value.puuid();
        }

        if (Type.isNumber(value)) {
            return "N" + value;
        }

        if (Type.isString(value)) {
            return "S" + value.hashCode64();
            //return "S" + String_simpleHash(value)
        }

        throw new Error("unhandled type '" + Type.typeName(value) + "'");
    }

    // --- copying ---

    /**
     * Creates a deep copy of the given value.
     * @param {*} v - The value to copy.
     * @param {Map} [refMap=new Map()] - A map to track object references for circular references.
     * @returns {*} A deep copy of the value.
     * @throws {Error} If the value is not a simple type or doesn't have a deepCopy method.
     */
    static deepCopyForValue (v, refMap = new Map()) {
        if (refMap.has(v)) {
            return refMap.get(v);
        }

        if (Type.isSimpleType(v)) {
            return v;
        } else if (Type.isObject(v)) {
            if (v.deepCopy) {
                const newValue = v.deepCopy(refMap);
                refMap.set(v, newValue);
                return newValue;
            } else {
                throw new Error("deepCopyForValue() error: value is object but has no deepCopy() method");
            }
        }

        throw new Error("deepCopyForValue() error: value is not a simple type: " + Type.typeName(v));
    }


    // --- testing ---

    /**
     * Runs tests for the Type class methods.
     * @private
     */
    static test () { // private
        this.assertValueTypeNames(null, ["Null", "Object"])
        this.assertValueTypeNames(undefined, ["Undefined"])
        this.assertValueTypeNames("foo", ["String"])
        this.assertValueTypeNames(1, ["Number"])
        this.assertValueTypeNames([], ["Array", "Object"])
        this.assertValueTypeNames({} ["Object"])
        this.assertValueTypeNames(new Int8Array(), ["Int8Array", "Object"])
        this.assertValueTypeNames(new Blob(), ["Blob", "Object"])

        // extras
        //assert(Type.isNullOrUndefined(undefined))
        //assert(Type.isNullOrUndefined(null))
    }

});


//Type.test()