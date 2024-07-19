"use strict";

/*

    Type-ideal

    Value/reference type related functions.

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

    static isClass (v) {
        const result = typeof(v) === "function"
            && /^class\s/.test(Function.prototype.toString.call(v));

        return result
    }

    static isPromise (v) {
        return v instanceof Promise;
    }

    static isLiteral (v) {
        return  Type.isString(v) ||
                Type.isNumber(v) ||
                Type.isBoolean(v) ||
                Type.isNull(v) ||
                Type.isUndefined(v);
    }

    static isArray (value) {
        return !Type.isNull(value) && 
                Type.isObject(value) && 
                value.__proto__ === ([]).__proto__ &&
                !Type.isUndefined(value.length)
    }

    static isSet (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === Set.prototype 
    }

    static isMap (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === Map.prototype 
    }  

    static isIterator (value) {
        return !Type.isNull(value) && 
                Type.isObject(value) && 
                typeof(value[Symbol.iterator]) === "function";
    }

    static isBoolean (value) {
        return typeof(value) === "boolean"
    }   

    static isFunction (value) {
        return typeof(value) === "function"
    }  

    static isUndefined (value) {
        return value === undefined // safe in modern browsers, even safe in older browsers if undefined is not redefined
    }

    static isNull (value) {
        return value === null
    }

    static isNullOrUndefined (value) {
        return this.isUndefined(value) || this.isNull(value)
    }

    static isNaN (value) {
        return isNaN(value)
    }

    static isNumber (value) {
        return typeof(value) === "number"
    }

    static isInteger (value) {
        return this.isNumber(value) && (value % 1 === 0);
    }

    static isObject (value) { 
        // WARNING: true for array and dictionary too!
        return typeof(value) === "object" 
    }

    static isDictionary (value) {
        if (Type.isNullOrUndefined(value)) {
            return false;
        }
        // WARNING: a good guess for our use cases, but not always correct!
        // e.g. 3rd party libraries and code may use Object instances as or like Objects instead of as Dictionaries (such as in JSON)
        return this.isObject(value) && (value.constructor === Object) 
    }

    static isString (value) {
        return typeof(value) === "string"
    } 

    static isSymbol (value) {
        return typeof(value) === "symbol"
    } 

    static isArrayBuffer (value) {
        return Type.valueHasConstructor(value, ArrayBuffer);
    }

    static isBlob (value) {
        return value instanceof Blob;
    }

    static isSimpleType (v) {
        return Type.isNumber(v) || Type.isString(v) || Type.isBoolean(v) || Type.isUndefined(v) || Type.isNull(v);
    }

    // typed arrays 

    static valueHasConstructor (v, constructor) {  // private
        return !Type.isNullOrUndefined(v) && (Object.getPrototypeOf(v) === constructor.prototype);
    }

    static isInt8Array (v) {
        return Type.valueHasConstructor(v, Int8Array);
    }

    static isUint8Array (v) {
        return Type.valueHasConstructor(v, Uint8Array);
    }

    static isUint8ClampedArray (v) {
        return Type.valueHasConstructor(v, Uint8ClampedArray);
    }

    static isInt16Array (v) {
        return Type.valueHasConstructor(v, Int16Array);
    }

    static isUint16Array (v) {
        return Type.valueHasConstructor(v, Uint16Array);
    }

    static isInt32Array (v) {
        return Type.valueHasConstructor(v, Int32Array);
    }

    static isUint32Array (v) {
        return Type.valueHasConstructor(v, Uint32Array);
    }
    
    static isFloat32Array (v) {
        return Type.valueHasConstructor(v, Float32Array);
    }

    static isFloat64Array (v) {
        return Type.valueHasConstructor(v, Float64Array);
    }

    static isBigInt64Array (v) {
        return Type.valueHasConstructor(v, BigInt64Array);
    }

    static isBigUint64Array (v) {
        return Type.valueHasConstructor(v, BigUint64Array);
    }

    
    static isTypedArray (v) {
        return Type.valueHasConstructor(v, TypedArray);
    }
    

    // type name

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

    static isJsonType (value) {
        // Note: this doesn't walk the collection types to see if their values are also JSON
        const jsonTypes = new Set(["String", "Number", "Object", "Array", "Boolean", "Null"]);
        return jsonTypes.has(Type.typeName(value));
    }

    static isDeepJsonType (value) {
        // Note: this doesn't walk the collection types to see if their values are also JSON
        const jsonTypes = new Set(["String", "Number", "Object", "Array", "Boolean", "Null"]);
        if (jsonTypes.has(Type.typeName(value))) {
            if (Type.isArray(value)) {
                return value.every(v => Type.isDeepJsonType(v));
            }
            if (Type.isObject(value)) {
                return Object.values(value).every(v => Type.isDeepJsonType(v));
            }
            return true;
        }
        return false;
    }

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