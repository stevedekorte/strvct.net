/**
 * @module library.ideal.categories
*/

/**
 * @class Mirror
 * @extends Object
 * @classdesc An object wrapper for the Reflect functions.
 */
SvGlobals.globals().Mirror = class Mirror extends Object {

    /**
     * Creates a Mirror instance for the given target.
     * @param {*} aTarget - The target object to reflect on.
     * @returns {Mirror} A new Mirror instance.
     * @category Initialization
     */
    static reflectOn (aTarget) {
        return this.clone().setTarget(aTarget);
    }

    /**
     * Sets the target object for this Mirror instance.
     * @param {*} aTarget - The target object to set.
     * @returns {Mirror} This Mirror instance.
     * @category Initialization
     */
    setTarget (aTarget) {
        this._target = aTarget;
        return this;
    }

    /**
     * Gets the current target object of this Mirror instance.
     * @returns {*} The current target object.
     * @category Accessor
     */
    target () {
        return this._target;
    }

    /**
     * Defines a new property on the target object.
     * @param {string|symbol} propertyKey - The property key.
     * @param {PropertyDescriptor} attributes - The property attributes.
     * @returns {boolean} True if the property was successfully defined, false otherwise.
     * @category Property Manipulation
     */
    defineProperty (propertyKey, attributes) {
        return Reflect.defineProperty(this.target(), propertyKey, attributes);
    }

    /**
     * Deletes a property from the target object.
     * @param {string|symbol} propertyKey - The property key to delete.
     * @returns {boolean} True if the property was successfully deleted, false otherwise.
     * @category Property Manipulation
     */
    deleteProperty (propertyKey) {
        return Reflect.deleteProperty(this.target(), propertyKey);
    }

    /**
     * Gets the value of a property on the target object.
     * @param {string|symbol} propertyKey - The property key to get.
     * @param {*} [optionalReceiver] - The value of `this` provided for the call to the getter.
     * @returns {*} The value of the property.
     * @category Property Access
     */
    get (propertyKey, optionalReceiver) {
        return Reflect.get(this.target(), propertyKey, optionalReceiver);
    }

    /**
     * Gets the own property descriptor of a property on the target object.
     * @param {string|symbol} propertyKey - The property key to get the descriptor for.
     * @returns {PropertyDescriptor|undefined} The property descriptor, or undefined if the property doesn't exist.
     * @category Property Access
     */
    getOwnPropertyDescriptor (propertyKey) {
        return Reflect.getOwnPropertyDescriptor(this.target(), propertyKey);
    }

    /**
     * Gets the prototype of the target object.
     * @returns {Object|null} The prototype of the target object.
     * @category Object Inspection
     */
    getPrototype () {
        return Reflect.getPrototypeOf(this.target());
    }

    /**
     * Checks if the target object has a property.
     * @param {string|symbol} propertyKey - The property key to check.
     * @returns {boolean} True if the property exists, false otherwise.
     * @category Property Access
     */
    has (propertyKey) {
        return Reflect.has(this.target(), propertyKey);
    }

    /**
     * Checks if the target object is extensible.
     * @returns {boolean} True if the object is extensible, false otherwise.
     * @category Object Inspection
     */
    isExtensible () {
        return Reflect.isExtensible(this.target());
    }

    /**
     * Gets an array of the target object's own property keys.
     * @returns {Array<string|symbol>} An array of the target object's own property keys.
     * @category Object Inspection
     */
    ownKeys () {
        return Reflect.ownKeys(this.target());
    }

    /**
     * Prevents new properties from being added to the target object.
     * @returns {boolean} True if the object was made non-extensible, false otherwise.
     * @category Object Manipulation
     */
    preventExtensions () {
        return Reflect.preventExtensions(this.target());
    }

    /**
     * Sets the value of a property on the target object.
     * @param {string|symbol} propertyKey - The property key to set.
     * @param {*} value - The value to set.
     * @param {*} [optionalReceiver] - The value of `this` provided for the call to the setter.
     * @returns {boolean} True if the property was set successfully, false otherwise.
     * @category Property Manipulation
     */
    set (propertyKey, value, optionalReceiver) {
        return Reflect.set(this.target(), propertyKey, value, optionalReceiver);
    }

    /**
     * Sets the prototype of the target object.
     * @param {Object|null} prototype - The object's new prototype or null.
     * @returns {boolean} True if the prototype was successfully set, false otherwise.
     * @category Object Manipulation
     */
    setPrototype (prototype) {
        return Reflect.setPrototypeOf(this.target(), prototype);
    }

};
