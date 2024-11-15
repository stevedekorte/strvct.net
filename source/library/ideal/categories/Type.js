"use strict";

/** 
 * @module library.ideal
 * @class Type
 * @description A collection of functions for type checking and type name related functions.

    Example use:

        if (Type.isNullOrUndefined(value)) { ...}

    Another example:

        const i8a = new Int8Array(6);   
        console.log("is a Int8Array: ", Type.isInt8Array(i8a))

    JS built-in objects:

   [
    "Array",
    "ArrayBuffer",
    "AsyncFunction",
    "BigInt",
    "Boolean",
    "DataView",
    "Date",
    "Error",
    "EvalError",
    "Function",
    "Generator",
    "GeneratorFunction",
    "Intl",
    "JSON",
    "Map",
    "Math",
    "Number",
    "Object",
    "Promise",
    "Proxy",
    "RangeError",
    "ReferenceError",
    "Reflect",
    "RegExp",
    "Set",
    "SharedArrayBuffer",
    "String",
    "Symbol",
    "SyntaxError",
    "TypeError",
    "URIError",
    "WeakMap",
    "WeakSet",
    "WebAssembly"
    ]


*/


getGlobalThis().Type = (class Type extends Object {

    /**
     * A typeName is a string that describes the "type" of a value.
     * For a class, this is the class name.
     * For an instance, this is the class name with " instance" appended.
     * Built-ins and primitives work the same way except for null and undefined are special cases as they are not objects.
     * For null and undefined, the typeName is the string "null" and "undefined" respectively.
     * For protocols, the typeName is the protocol name with " protocol" appended.
     * @category Type Names 
     * @param {*} value - The value to get the type name for.
     * @returns {string} The type name of the value.
     * @throws {Error} If unable to identify the type of the value.
     */
    static typeName (value) {
        // Handle null case first since typeof null is 'object'
        if (value === null) {
          return 'null';
        }
      
        // Handle undefined explicitly
        if (value === undefined) {
          return 'undefined';
        }
        const baseType = typeof(value);
      
        /*
        // Handle functions
        if (baseType === 'function') { // true for both Function class and Function instances

            function isFunctionClassReference(value) {
                if (typeof value !== 'function') return false;
                if (value === Function) return true;
                
                let proto = Object.getPrototypeOf(value);
                while (proto) {
                  if (proto === Function) return true;
                  proto = Object.getPrototypeOf(proto);
                }
                
                return false;
            }

            if (isFunctionClassReference(value)) {
                return value.name;
            }

            // When you create an instance of a Function subclass, the Object.bind(this) in the constructor returns a new function object...
            return 'Function instance'; // TODO: add support for Function subclasses
        }
        */
      

        // ok, now it must be a class or class instance
        // Handle class instances
        if (Type.isClass(value)) {
            const className = value.name;
            if (className === "" || className === "anonymous") { 
                // it's an Function instance
                return Object.typeNameForInstanceOfClassName("Function");
            }
            return Object.typeNameForClassName(className);
        }

        if (Type.isInstance(value)) {
            // Handle class instances
            const className = value.constructor.name;
            return Object.typeNameForInstanceOfClassName(className);
        }
      
        throw new Error("Unable to identify the type of value: " + value);
    }

    static typeNameIsClass (typeName) {
        return typeName.split(" ")[1] === "class";
    }

    static typeNameIsProtocol (typeName) {
        return typeName.split(" ")[1] === "protocol";
    }

    static classForClassTypeName (typeName) {
        const className = typeName.split(" ")[0];
        let aClass = getGlobalThis()[className];
        if (aClass === undefined) {
            console.warn("Type.classForClassTypeName: unable to find class for type name: " + typeName + " using Object instead");
            aClass = Object;
        }
        return aClass;
    }

    static classForInstanceTypeName (typeName) {
        //const className = typeName.split(" ")[0];
        const className = typeName;
        return getGlobalThis()[className];
    }

    static classNameIsKindOfClassName (typeA, typeB) {
        const aClass = this.classForClassTypeName(typeA);
        const bClass = this.classForClassTypeName(typeB);
        if (Type.isNullOrUndefined(aClass) || Type.isNullOrUndefined(bClass)) {
            return false;
        }
        return aClass.isKindOf(bClass);
    };
    
    static typeNameIsKindOf (typeA, typeB) {
        assert(Type.isString(typeA));
        assert(Type.isString(typeB));

        if (typeA === typeB) {
            return true;
        }

        // we know they aren't equal, and null and undefined don't have subclasses,
        // so we can return false early for those

        if (typeA === "undefined" || typeB === "undefined") {
            return false;
        }

        if (typeA === "null" || typeB === "null") {
            return false;
        }

        // now we need to check for subsclass of classes and instances 
        const aIsClass = this.typeNameIsClass(typeA);
        const bIsClass = this.typeNameIsClass(typeB);

        if (aIsClass && bIsClass) {
            return this.classNameIsKindOfClassName(typeA, typeB);
        } else if (!aIsClass && !bIsClass) {
            const aClassName = this.classNameForInstanceName(typeA);
            const bClassName = this.classNameForInstanceName(typeB);
            return this.classNameIsKindOfClassName(aClassName, bClassName);
        }

        // typeB is not a type of typeA
        return false;
    }

    static instanceNameForClassName (className) {
        // need to lowercase the first character
        const instanceName = className.slice(0, 1).toLowerCase() + className.slice(1);
        return instanceName;
    }

    static classNameForInstanceName (instanceName) {
        // need to capitalize the first character
        const className = instanceName.slice(0, 1).toUpperCase() + instanceName.slice(1);
        return className;
    }


    /**
     * Returns an array of primitive type names.
     * @category Type Names
     * @static
     * @returns {string[]} An array of primitive type names.
     */
    static primitiveTypeNameSet () {
        return new Set([
            "bigint",
            "boolean", 
            "number", 
            "null", 
            "string", 
            "symbol",
            "undefined"
        ]); 
    }

    static isPrimitive (value) {
        return this.primitiveTypeNameSet().has(Type.typeName(value));
    }

    /**
     * Returns an array of all type names supported by this class.
     * @category Type Names
     * @static
     * @returns {string[]} An array of type names.
     */
    static builtInTypeNamesSet () {
        return new Set([
            "Array",
            "ArrayBuffer",
            "BigInt",
            "Boolean",
            "DataView",
            "Date",
            "Error",
            "EvalError",
            "Float32Array",
            "Float64Array",
            "Function",
            "Int16Array",
            "Int32Array",
            "Int8Array",
            "Map",
            "Number",
            "Object",
            "Promise",
            "RangeError",
            "ReferenceError",
            "RegExp",
            "Set",
            "SharedArrayBuffer",
            "String",
            "Symbol",
            "SyntaxError",
            "TypeError",
            "Uint16Array",
            "Uint32Array",
            "Uint8Array",
            "Uint8ClampedArray",
            "URIError",
            "WeakMap",
            "WeakSet"
        ]);
        
        /*
        return [
            "Array",
            "Boolean",
            "BigInt",
            "Blob",
            "Map",
            "Null",
            "Number",
            "Promise",
            "RegExp",
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
            "Object" // put object last so other types have preference
        ];
        */
    }

    /**
     * Returns an array of typed array type names.
     * @category Type Names
     * @static
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
            "BigUint64Array"
        ];
    }

    /**
     * Checks if the given value is a class.
     * @category Type Checking
     * @static
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a class, false otherwise.
     */
    static isClass (v) {
        if (typeof v !== "function") {
            return false;
        }

        if (v.prototype) {
            if (typeof(v.prototype.constructor) === "function") {
                return true;
            }
        }

        return false;
    }

    /**
     * Compares two values for equality.
     * @category Utilities
     * @static
     * @param {*} a - First value to compare
     * @param {*} b - Second value to compare
     * @returns {boolean} True if the values are equal
     */
    static valuesAreEqual (a, b) {
        if (a === b) {
            return true;
        }

        if (Type.isNullOrUndefined(a) || Type.isNullOrUndefined(b)) {
            return a === b;
        }

        if (a.isEqual && b.isEqual) {
            return a.isEqual(b);
        }

        throw new Error("valuesAreEqual does not know how to compare values of type " + Type.typeName(a) + " and " + Type.typeName(b));
    }

    /**
     * Checks if the given value is a Promise.
     * @category Type Checking
     * @static
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Promise, false otherwise.
     */
    static isPromise (v) {
        return v instanceof Promise;
    }

    /**
     * Checks if the given value is a literal (string, number, boolean, null, or undefined).
     * @category Type Checking / Abstract Types
     * @static
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
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an array, false otherwise.
     */
    static isArray (value) {
        return Array.isArray(value);
    }

    /**
     * Checks if the given value is a Set.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a Set, false otherwise.
     */
    static isSet (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === Set.prototype;
    }

    /**
     * Checks if the given value is a RegExp.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a RegExp, false otherwise.
     */
    static isRegExp (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === RegExp.prototype;
    }

    /**
     * Checks if the given value is a BigInt.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a BigInt, false otherwise.
     */
    static isBigInt (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === BigInt.prototype;
    }


    /**
     * Checks if the given value is a Map.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a Map, false otherwise.
     */
    static isMap (value) {
        return !Type.isNull(value) && 
            Type.isObject(value) && 
            value.__proto__ === Map.prototype;
    }  

    /**
     * Checks if the given value is an iterator.
     * @category Type Checking
     * @static
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
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a boolean, false otherwise.
     */
    static isBoolean (value) {
        return typeof(value) === "boolean";
    }   

    /**
     * Checks if the given value is a function.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a function, false otherwise.
     */
    static isFunction (value) {
        return typeof(value) === "function";
    }  

    /**
     * Checks if the given value is undefined.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is undefined, false otherwise.
     */
    static isUndefined (value) {
        return value === undefined; // safe in modern browsers, even safe in older browsers if undefined is not redefined
    }

    /**
     * Checks if the given value is null.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is null, false otherwise.
     */
    static isNull (value) {
        return value === null;
    }

    /**
     * Checks if the given value is null or undefined.
     * @category Type Checking / Abstract Types
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is null or undefined, false otherwise.
     */
    static isNullOrUndefined (value) {
        return this.isUndefined(value) || this.isNull(value);
    }

    /**
     * Checks if the given value is NaN.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is NaN, false otherwise.
     */
    static isNaN (value) {
        return isNaN(value);
    }

    /**
     * Checks if the given value is a number.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a number, false otherwise.
     */
    static isNumber (value) {
        return typeof(value) === "number";
    }

    /**
     * Checks if the given value is an integer.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an integer, false otherwise.
     */
    static isInteger (value) {
        return Number.isInteger(value) 
    }

    /**
     * Checks if the given value is an object.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an object, false otherwise.
     */
    static isObject (value) { 
        // WARNING: true for array and dictionary too!
        return typeof(value) === "object";
    }

    /**
     * Checks if the given value is an instance.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an instance, false otherwise.
     */
    static isInstance (value) {
        if (Type.isNullOrUndefined(value)) {
            return false;
         }
        const proto = Object.getPrototypeOf(value);
        return !Type.isNullOrUndefined(proto);
    }

    /**
     * Checks if the given value is a "dictionary", that is, an object used as dictionary, not a instance of a class designed to be used as a dictionary.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a dictionary, false otherwise.
     */
    static isDictionary (value) {
        // this is more for objects used as dictionaries
        if (Type.isNullOrUndefined(value)) {
            return false;
        }
        // WARNING: a good guess for our use cases, but not always correct!
        // e.g. 3rd party libraries and code may use Object instances as or like Objects instead of as Dictionaries (such as in JSON)
        return this.isObject(value) && (value.constructor === Object);
    }

    /**
     * Checks if the given value is a string.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a string, false otherwise.
     */
    static isString (value) {
        return typeof(value) === "string";
    } 

    /**
     * Checks if the given value is a symbol.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a symbol, false otherwise.
     */
    static isSymbol (value) {
        return typeof(value) === "symbol";
    } 

    /**
     * Checks if the given value is an ArrayBuffer.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is an ArrayBuffer, false otherwise.
     */
    static isArrayBuffer (value) {
        return Type.valueHasConstructor(value, ArrayBuffer);
    }

    /**
     * Checks if the given value is a Blob.
     * @category Type Checking
     * @static
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a Blob, false otherwise.
     */
    static isBlob (value) {
        return value instanceof Blob;
    }

    /**
     * Checks if the given value is a simple type (number, string, boolean, undefined, or null).
     * @category Type Checking / Abstract Types
     * @static
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a simple type, false otherwise.
     */
    static isSimpleType (v) {
        return Type.isNumber(v) || Type.isString(v) || Type.isBoolean(v) || Type.isUndefined(v) || Type.isNull(v);
    }

    // typed arrays 

    /**
     * Checks if the given value has the specified constructor.
     * @category Information
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
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is an Int8Array, false otherwise.
     */
    static isInt8Array (v) {
        return Type.valueHasConstructor(v, Int8Array);
    }

    /**
     * Checks if the given value is a Uint8Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint8Array, false otherwise.
     */
    static isUint8Array (v) {
        return Type.valueHasConstructor(v, Uint8Array);
    }

    /**
     * Checks if the given value is a Uint8ClampedArray.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint8ClampedArray, false otherwise.
     */
    static isUint8ClampedArray (v) {
        return Type.valueHasConstructor(v, Uint8ClampedArray);
    }

    /**
     * Checks if the given value is an Int16Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is an Int16Array, false otherwise.
     */
    static isInt16Array (v) {
        return Type.valueHasConstructor(v, Int16Array);
    }

    /**
     * Checks if the given value is a Uint16Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint16Array, false otherwise.
     */
    static isUint16Array (v) {
        return Type.valueHasConstructor(v, Uint16Array);
    }

    /**
     * Checks if the given value is an Int32Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is an Int32Array, false otherwise.
     */
    static isInt32Array (v) {
        return Type.valueHasConstructor(v, Int32Array);
    }

    /**
     * Checks if the given value is a Uint32Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Uint32Array, false otherwise.
     */
    static isUint32Array (v) {
        return Type.valueHasConstructor(v, Uint32Array);
    }
    
    /**
     * Checks if the given value is a Float32Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Float32Array, false otherwise.
     */
    static isFloat32Array (v) {
        return Type.valueHasConstructor(v, Float32Array);
    }

    /**
     * Checks if the given value is a Float64Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a Float64Array, false otherwise.
     */
    static isFloat64Array (v) {
        return Type.valueHasConstructor(v, Float64Array);
    }

    /**
     * Checks if the given value is a BigInt64Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a BigInt64Array, false otherwise.
     */
    static isBigInt64Array (v) {
        return Type.valueHasConstructor(v, BigInt64Array);
    }

    /**
     * Checks if the given value is a BigUint64Array.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a BigUint64Array, false otherwise.
     */
    static isBigUint64Array (v) {
        return Type.valueHasConstructor(v, BigUint64Array);
    }

    
    /**
     * Checks if the given value is a TypedArray.
     * @category Type Checking / Typed Arrays
     * @param {*} v - The value to check.
     * @returns {boolean} True if the value is a TypedArray, false otherwise.
     */
    static isTypedArray (v) {
        return Type.valueHasConstructor(v, TypedArray);
    }


    // --- type id ---

    /**
     * Checks if the given value is a JSON-compatible type.
     * @category Type Checking / JSON
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a JSON-compatible type, false otherwise.
     */
    static isJsonType (value) {
        const vType = typeof(value);
        return (
            value === null ||
            vType === 'string' ||
            vType === 'number' ||
            vType === 'boolean' ||
            (Array.isArray(value) && value.every(Type.isJsonType)) ||
            (vType === 'object' && Object.values(value).every(v => Type.isJsonType(v)))
        );
    }

    /**
     * Checks if the given value is a deep JSON-compatible type.
     * @category Type Checking / JSON
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is a deep JSON-compatible type, false otherwise.
     */
    static isDeepJsonType (value) {
        const seen = new Set();
      
        function checkValue(v) {
          if (v === null) return true;
      
          const type = typeof(v);
      
          if (['string', 'number', 'boolean'].includes(type)) {
            return true;
          }
      
          if (type === 'object') {
            if (seen.has(v)) {
                return false; // Circular reference
            }
            seen.add(v);
      
            if (Array.isArray(v)) {
              return v.every(checkValue);
            } else {
              return Object.keys(v).every(key => {
                if (typeof key !== 'string') {
                    return false;
                }
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
     * @category Utilities
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

    /**
     * Generates a 64-bit hash code for the given value.
     * @category Utilities
     * @static
     * @param {*} value - The value to generate a hash code for.
     * @returns {number} A 64-bit hash code for the value.
     * @throws {TypeError} If the value type is not supported for hashing or doesn't implement hashCode64().
     */
    static hashCode64 (value) {
        // null and undefined can't respond to hashCode64(), so we need to handle them first
        if (Type.isUndefined(value)) {
            return 0xdeadbeef;
        }

        if (Type.isNull(value)) {
            return 0xabad1dea;
        }

        if (value.hashCode64) {
            // Note: For objects used as dictionaries, we want hashes to test equality, not identity.
            // But for non-dictionary objects, we typically(? want identity comparison.
            return value.hashCode64();
        }

        throw new TypeError("Unsupported type for hashing");
    }

    // --- copying ---

    /**
     * Creates a deep copy of the given value.
     * @category Utilities
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
     * Returns an array of type names that match the given value.
     * @category Type Names
     * @param {*} value - The value to check.
     * @returns {string[]} An array of matching type names.
     */
        static typeNamesForValue (value) {
            const matches = [];
            const typeNames = this.builtInTypeNames();
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
     * @category Type Names
     * @param {*} v - The value to check.
     * @param {string[]} validTypeNames - An array of valid type names.
     * @throws {Error} If the value's type names don't match the valid type names.
     */
        static assertValueTypeNames (v, validTypeNames) {
            const foundTypeNames = this.typeNamesForValue(v);
            const foundTypeNamesSet = new Set(foundTypeNames);
            const doesMatch = foundTypeNamesSet.isSubsetOf(new Set(validTypeNames)) && foundTypeNamesSet.size === validTypeNames.length;
            if (!doesMatch) {
                throw new Error(JSON.stringify(validTypeNames) + " != " + JSON.stringify(foundTypeNames) );
            }
        }
    /**
     * Runs tests for the Type class methods.
     * @category Testing
     * @private
     */
    static test () { // private
        this.assertValueTypeNames(null, ["Null", "Object"]);
        this.assertValueTypeNames(undefined, ["Undefined"]);
        this.assertValueTypeNames("foo", ["String"]);
        this.assertValueTypeNames(1, ["Number"]);
        this.assertValueTypeNames([], ["Array", "Object"]);
        this.assertValueTypeNames({}, ["Object"]);
        this.assertValueTypeNames(new Int8Array(), ["Int8Array", "Object"]);
        this.assertValueTypeNames(new Blob(), ["Blob", "Object"]);

        // extras
        //assert(Type.isNullOrUndefined(undefined));
        //assert(Type.isNullOrUndefined(null));
    }

    static test () {
        // Helper function to run a single test
        function test(value, expected, description = '') {
          const result = Type.typeName(value);
          console.log(`Testing ${description}:`);
          console.log(`  Input:    ${String(value).slice(0, 100)}`);  // Convert to string safely and limit length
          console.log(`  Expected: ${expected}`);
          console.log(`  Got:      ${result}`);
          console.log('');
          
          if (result !== expected) {
            throw new Error(
              `Test failed${description ? ` (${description})` : ''}\n` +
              `Expected: ${expected}\n` +
              `Got: ${result}\n` +
              `Input: ${value}`
            );
          }
        }
      
        // Original examples from the problem statement
        test([], 'Array', 'empty array');
        test(Array, 'Array class', 'Array class');
        test(undefined, 'undefined', 'undefined value');
        test(Function, 'Function class', 'Function constructor');
        test(function() {}, 'Function', 'function expression');
      
        // Additional basic cases
        test(null, 'null', 'null value');
        test({}, 'Object', 'empty object');
        test(42, 'Number', 'number value');
        test('hello', 'String', 'string value');
        test(true, 'Boolean', 'boolean value');
        test(Symbol(), 'Symbol', 'symbol value');
        test(BigInt(42), 'BigInt', 'bigint value');
        test(BigInt, 'BigInt class', 'BigInt constructor');
      
        // Built-in constructors
        test(Object, 'Object class', 'Object');
        test(String, 'String class', 'String');
        test(Number, 'Number class', 'Number');
        test(Boolean, 'Boolean class', 'Boolean');
        test(Date, 'Date class', 'Date');
        test(RegExp, 'RegExp class', 'RegExp');
      
        // Built-in instances
        test(new Date(), 'Date', 'Date instance');
        test(new RegExp(''), 'RegExp', 'RegExp instance');
        test(new String(''), 'String', 'String instance');
        test(new Number(1), 'Number', 'Number instance');
        test(new Boolean(true), 'Boolean', 'Boolean instance');
      
        // Array subclass cases
        class MyArray extends Array {}
        const myArr = new MyArray();
        test(myArr, 'MyArray', 'Array subclass instance');
        test(MyArray, 'MyArray class', 'Array subclass constructor');
        test(new Array(), 'Array', 'Array instance');
      
        // Function cases
        test(() => {}, 'Function', 'arrow function');
        test(function() {}, 'Function', 'function expression');
        test(new Function(), 'Function', 'Function instance');
        test(Function, 'Function class', 'Function constructor');
      
        // Note: We can't meaningfully subclass Function because the instances
        // are always anonymous functions. Keeping the constructor test only.
        class MyFunction extends Function {}
        test(MyFunction, 'MyFunction class', 'Function subclass constructor');
      
        // Regular class cases
        class MyClass {}
        test(MyClass, 'MyClass class', 'class declaration');
        test(new MyClass(), 'MyClass', 'class instance');
      
        console.log('All tests passed!');
      }

});


Type.test();