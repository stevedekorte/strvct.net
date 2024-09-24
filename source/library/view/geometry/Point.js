/**
 * @module library.view.geometry
 */

/**
 * @class Point
 * @extends ProtoClass
 * @classdesc Class to represent a 2d or 3d point, optionally with a time.
 * 
 * TODO: 
 *     Move internal representation to array e.g.
 * 
 *     const slot = this.newSlot("valueArray", new Array(0, 0, 0, 0))
 * 
 *     x () {
 *         return this._valueArray[0]
 *     }
 * 
 *     isEqual (other) {
 *         return this._valueArray == other.valueArray()
 *     }
 */

"use strict";

(class Point extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the Point class.
     */
    initPrototypeSlots () {
        const dimensionNames = ["x", "y", "z", "t"];
        dimensionNames.forEach(slotName => {
            /**
             * @property {Number} x - The x coordinate
             * @property {Number} y - The y coordinate
             * @property {Number} z - The z coordinate
             * @property {Number} t - The time value
             */
            const slot = this.newSlot(slotName, 0);
            slot.setSlotType("Number");
        });
    }

    /**
     * @description Returns an array of the x, y, and z values.
     * @returns {Array} The array of values
     */
    valueArray () {
        return [this._x, this._y, this._z]
    }

    /**
     * @description Sets the time value to the current timestamp.
     * @returns {Point} The current Point instance
     */
    setTimeToNow () {
        const d = new Date();
        this._t = d.getTime();
        return this
    }

    /**
     * @description Copies values from another Point instance.
     * @param {Point} p - The Point to copy from
     * @param {Object} copyDict - Copy dictionary (unused)
     * @returns {Point} The current Point instance
     */
    copyFrom (p, copyDict) {
        this._x = p._x
        this._y = p._y
        this._z = p._z
        this._t = p._t
        return this
    }

    /**
     * @description Sets the x and y coordinates.
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @returns {Point} The current Point instance
     */
    setXY (x, y) {
        this._x = x;
        this._y = y;
        return this
    }
    
    /**
     * @description Sets the x, y, z, and t values.
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @param {Number} z - The z coordinate (optional)
     * @param {Number} t - The time value (optional)
     * @returns {Point} The current Point instance
     */
    set (x, y, z, t) {
        this._x = x;
        this._y = y;
        if (Type.isNumber(z)) {
            this._z = z
        }
        if (Type.isNumber(t)) {
            this._t = t
        }
        return this
    }

    /**
     * @description Adds another Point's values to this Point in place.
     * @param {Point} p - The Point to add
     * @returns {Point} The current Point instance
     */
    addInPlace (p) {
        this._x += p._x
        this._y += p._y
        this._z += p._z
        this._t += p._t
        return this
    }

    /**
     * @description Subtracts another Point's values from this Point in place.
     * @param {Point} p - The Point to subtract
     * @returns {Point} The current Point instance
     */
    subtractInPlace (p) {
        this._x -= p._x
        this._y -= p._y
        this._z -= p._z
        this._t -= p._t
        return this
    }

    /**
     * @description Applies Math.floor() to x, y, and z values in place.
     * @returns {Point} The current Point instance
     */
    floorInPlace () {
        this._x = Math.floor(this._x)
        this._y = Math.floor(this._y)
        this._z = Math.floor(this._z)
        return this
    }

    /**
     * @description Creates a copy of this Point.
     * @returns {Point} A new Point instance with the same values
     */
    copy () {
        return this.thisClass().clone().copyFrom(this)
    }

    /**
     * @description Adds another Point's values to a copy of this Point.
     * @param {Point} p - The Point to add
     * @returns {Point} A new Point instance with the sum
     */
    add (p) {
        return this.copy().addInPlace(p)
    }

    /**
     * @description Subtracts another Point's values from a copy of this Point.
     * @param {Point} p - The Point to subtract
     * @returns {Point} A new Point instance with the difference
     */
    subtract (p) {
        return this.copy().subtractInPlace(p)
    }

    /**
     * @description Returns a string representation of the Point.
     * @returns {string} The string representation
     */
    asString () {
        let s = this.type() + "(" + this._x + ", " + this._y 

        if (this._z) { 
            s += ", " + this._z
        }

        /*
        if (this._t) { 
            s += ", " + this._t + "t" 
        }
        */

        return s + ")"
    }

    /**
     * @description Calculates the distance from the origin (0, 0, 0).
     * @returns {number} The distance from the origin
     */
    distanceFromOrigin () {
        const ds = Math.pow(this.x(), 2) + Math.pow(this.y(), 2) + Math.pow(this.z(), 2)
        return Math.sqrt(ds)
    }

    /**
     * @description Calculates the difference in x coordinate from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in x coordinate
     */
    dxFrom (p) {
        return this.x() - p.x()
    }

    /**
     * @description Calculates the difference in y coordinate from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in y coordinate
     */
    dyFrom (p) {
        return this.y() - p.y()
    }

    /**
     * @description Calculates the difference in z coordinate from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in z coordinate
     */
    dzFrom (p) {
        return this.z() - p.z()
    }

    /**
     * @description Calculates the difference in time value from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in time value
     */
    dtFrom (p) {
        return this.t() - p.t()
    }

    /**
     * @description Calculates the distance from another Point.
     * @param {Point} p - The Point to calculate distance to
     * @returns {number} The distance between the two Points
     */
    distanceFrom (p) {
        const dx = this.dxFrom(p)
        const dy = this.dyFrom(p)
        const dz = this.dzFrom(p)
        return Math.sqrt(dx*dx + dy*dy + dz*dz)
    }

    /**
     * @description Checks if this Point is equal to another Point (excluding time).
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if the Points are equal, false otherwise
     */
    isEqual (p) {
        return (this.x() === p.x()) && (this.y() === p.y()) && (this.z() === p.z()) // && (this.t() === p.t())
    }

    /**
     * @description Checks if this Point is equal to another Point (including time).
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if the Points are equal, false otherwise
     */
    isEqualWithTime (p) { // not ideal
        return (this.x() === p.x()) && (this.y() === p.y()) && (this.z() === p.z()) && (this.t() === p.t())
    }

    /**
     * @description Checks if this Point is greater than another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is greater, false otherwise
     */
    isGreaterThan (p) {
        return this.x() > p.x() && this.y() > p.y()
    }

    /**
     * @description Checks if this Point is less than another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is less, false otherwise
     */
    isLessThan (p) {
        return this.x() < p.x() && this.y() < p.y()
    }

    /**
     * @description Checks if this Point is greater than or equal to another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is greater or equal, false otherwise
     */
    isGreaterThanOrEqualTo (p) {
        return this.x() >= p.x() && this.y() >= p.y()
    }

    /**
     * @description Checks if this Point is less than or equal to another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is less or equal, false otherwise
     */
    isLessThanOrEqualTo (p) {
        return this.x() <= p.x() && this.y() <= p.y()
    }

    /**
     * @description Calculates the angle in radians from the origin to this Point.
     * @returns {number} The angle in radians
     */
    angleInRadians () {
        return Math.atan2(y, x);
    }

    /**
     * @description Calculates the angle in degrees from the origin to this Point.
     * @returns {number} The angle in degrees
     */
    angleInDegrees () {
        return this.angleInRadians() * 180 / Math.PI;
    }

    /**
     * @description Calculates the angle in radians from this Point to another Point.
     * @param {Point} p - The Point to calculate the angle to
     * @returns {number} The angle in radians
     */
    angleInRadiansTo (p) {
        return p.subtract(this).angleInRadians()
    }

    /**
     * @description Calculates the angle in degrees from this Point to another Point.
     * @param {Point} p - The Point to calculate the angle to
     * @returns {number} The angle in degrees
     */
    angleInDegreesTo (p) {
        return p.subtract(this).angleInDegrees()
    }

    /**
     * @description Calculates the midpoint between this Point and another Point.
     * @param {Point} p - The other Point
     * @returns {Point} The midpoint
     */
    midpointTo (p) {
        return this.add(p).divideByScalar(2)
    }

    /**
     * @description Multiplies this Point's coordinates by a scalar value.
     * @param {number} v - The scalar value
     * @returns {Point} A new Point with scaled coordinates
     */
    multiplyByScalar (v) {
        const p = Point.clone()
        p.set(this.x() * v, this.y() * v, this.z() * v)
        return p
    }

    /**
     * @description Divides this Point's coordinates by a scalar value.
     * @param {number} v - The scalar value
     * @returns {Point} A new Point with divided coordinates
     */
    divideByScalar (v) {
        return this.multiplyByScalar(1/v)
    }

    /**
     * @description Returns the negation of this Point.
     * @returns {Point} A new Point with negated coordinates
     */
    negated (p) {
        return this.multiplyByScalar(-1)
    }

    /**
     * @description Generates a CSS string representation with a unit suffix.
     * @param {string} name - The CSS function name
     * @param {string} unitSuffix - The unit suffix to append (default: "")
     * @returns {string} The CSS string representation
     */
    asCssStringWithUnitSuffix (name, unitSuffix) {
        if (!unitSuffix) { 
            unitSuffix = ""
        }

        const us = unitSuffix;
        return name + "(" + this._x + us + "," + this._y + us + "," + this._z + us + ")"
        //const s = this.valueArray().map(v => v + unitSuffix).join(",")
        //return name + "(" + s + ")"
    }

    /**
     * @description Generates a CSS translate3d string.
     * @returns {string} The CSS translate3d string
     */
    asCssTranslate3dString () {
        return this.asCssStringWithUnitSuffix("translate3d", "px")
    }

    /**
     * @description Generates a CSS rotate3d string in degrees.
     * @returns {string} The CSS rotate3d string
     */
    asCssRotate3dDegreesString () {
        return this.asCssStringWithUnitSuffix("rotate3d", "deg")
    }

    /**
     * @description Generates a CSS scale3d string.
     * @returns {string} The CSS scale3d string
     */
    asCssScale3dString () {
        return this.asCssStringWithUnitSuffix("scale3d", "")
    }

    /**
     * @description Gets the width (x coordinate).
     * @returns {number} The width
     */
    width () {
        return this.x()
    }

    /**
     * @description Gets the height (y coordinate).
     * @returns {number} The height
     */
    height () {
        return this.y()
    }
    
}.initThisClass());