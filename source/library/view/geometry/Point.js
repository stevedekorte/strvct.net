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
     * @category Initialization
     */
    initPrototypeSlots () {
        const dimensionNames = ["x", "y", "z", "t"];
        dimensionNames.forEach(slotName => {
            /**
             * @member {Number} x - The x coordinate
             * @category Coordinates
             * @member {Number} y - The y coordinate
             * @category Coordinates
             * @member {Number} z - The z coordinate
             * @category Coordinates
             * @member {Number} t - The time value
             * @category Time
             */
            const slot = this.newSlot(slotName, 0);
            slot.setSlotType("Number");
        });
    }

    /**
     * @description Returns an array of the x, y, and z values.
     * @returns {Array} The array of values
     * @category Data Representation
     */
    valueArray () {
        return [this._x, this._y, this._z]
    }

    /**
     * @description Sets the time value to the current timestamp.
     * @returns {Point} The current Point instance
     * @category Time
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
     * @category Data Manipulation
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
     * @category Coordinates
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
     * @category Coordinates
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
     * @category Arithmetic
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
     * @category Arithmetic
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
     * @category Arithmetic
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
     * @category Data Manipulation
     */
    copy () {
        return this.thisClass().clone().copyFrom(this)
    }

    /**
     * @description Adds another Point's values to a copy of this Point.
     * @param {Point} p - The Point to add
     * @returns {Point} A new Point instance with the sum
     * @category Arithmetic
     */
    add (p) {
        return this.copy().addInPlace(p)
    }

    /**
     * @description Subtracts another Point's values from a copy of this Point.
     * @param {Point} p - The Point to subtract
     * @returns {Point} A new Point instance with the difference
     * @category Arithmetic
     */
    subtract (p) {
        return this.copy().subtractInPlace(p)
    }

    /**
     * @description Returns a string representation of the Point.
     * @returns {string} The string representation
     * @category Data Representation
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
     * @category Geometry
     */
    distanceFromOrigin () {
        const ds = Math.pow(this.x(), 2) + Math.pow(this.y(), 2) + Math.pow(this.z(), 2)
        return Math.sqrt(ds)
    }

    /**
     * @description Calculates the difference in x coordinate from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in x coordinate
     * @category Geometry
     */
    dxFrom (p) {
        return this.x() - p.x()
    }

    /**
     * @description Calculates the difference in y coordinate from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in y coordinate
     * @category Geometry
     */
    dyFrom (p) {
        return this.y() - p.y()
    }

    /**
     * @description Calculates the difference in z coordinate from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in z coordinate
     * @category Geometry
     */
    dzFrom (p) {
        return this.z() - p.z()
    }

    /**
     * @description Calculates the difference in time value from another Point.
     * @param {Point} p - The Point to compare with
     * @returns {number} The difference in time value
     * @category Time
     */
    dtFrom (p) {
        return this.t() - p.t()
    }

    /**
     * @description Calculates the distance from another Point.
     * @param {Point} p - The Point to calculate distance to
     * @returns {number} The distance between the two Points
     * @category Geometry
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
     * @category Comparison
     */
    isEqual (p) {
        return (this.x() === p.x()) && (this.y() === p.y()) && (this.z() === p.z()) // && (this.t() === p.t())
    }

    /**
     * @description Checks if this Point is equal to another Point (including time).
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if the Points are equal, false otherwise
     * @category Comparison
     */
    isEqualWithTime (p) { // not ideal
        return (this.x() === p.x()) && (this.y() === p.y()) && (this.z() === p.z()) && (this.t() === p.t())
    }

    /**
     * @description Checks if this Point is greater than another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is greater, false otherwise
     * @category Comparison
     */
    isGreaterThan (p) {
        return this.x() > p.x() && this.y() > p.y()
    }

    /**
     * @description Checks if this Point is less than another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is less, false otherwise
     * @category Comparison
     */
    isLessThan (p) {
        return this.x() < p.x() && this.y() < p.y()
    }

    /**
     * @description Checks if this Point is greater than or equal to another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is greater or equal, false otherwise
     * @category Comparison
     */
    isGreaterThanOrEqualTo (p) {
        return this.x() >= p.x() && this.y() >= p.y()
    }

    /**
     * @description Checks if this Point is less than or equal to another Point.
     * @param {Point} p - The Point to compare with
     * @returns {boolean} True if this Point is less or equal, false otherwise
     * @category Comparison
     */
    isLessThanOrEqualTo (p) {
        return this.x() <= p.x() && this.y() <= p.y()
    }

    /**
     * @description Calculates the angle in radians from the origin to this Point.
     * @returns {number} The angle in radians
     * @category Geometry
     */
    angleInRadians () {
        return Math.atan2(y, x);
    }

    /**
     * @description Calculates the angle in degrees from the origin to this Point.
     * @returns {number} The angle in degrees
     * @category Geometry
     */
    angleInDegrees () {
        return this.angleInRadians() * 180 / Math.PI;
    }

    /**
     * @description Calculates the angle in radians from this Point to another Point.
     * @param {Point} p - The Point to calculate the angle to
     * @returns {number} The angle in radians
     * @category Geometry
     */
    angleInRadiansTo (p) {
        return p.subtract(this).angleInRadians()
    }

    /**
     * @description Calculates the angle in degrees from this Point to another Point.
     * @param {Point} p - The Point to calculate the angle to
     * @returns {number} The angle in degrees
     * @category Geometry
     */
    angleInDegreesTo (p) {
        return p.subtract(this).angleInDegrees()
    }

    /**
     * @description Calculates the midpoint between this Point and another Point.
     * @param {Point} p - The other Point
     * @returns {Point} The midpoint
     * @category Geometry
     */
    midpointTo (p) {
        return this.add(p).divideByScalar(2)
    }

    /**
     * @description Multiplies this Point's coordinates by a scalar value.
     * @param {number} v - The scalar value
     * @returns {Point} A new Point with scaled coordinates
     * @category Arithmetic
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
     * @category Arithmetic
     */
    divideByScalar (v) {
        return this.multiplyByScalar(1/v)
    }

    /**
     * @description Returns the negation of this Point.
     * @returns {Point} A new Point with negated coordinates
     * @category Arithmetic
     */
    negated (p) {
        return this.multiplyByScalar(-1)
    }

    /**
     * @description Generates a CSS string representation with a unit suffix.
     * @param {string} name - The CSS function name
     * @param {string} unitSuffix - The unit suffix to append (default: "")
     * @returns {string} The CSS string representation
     * @category CSS
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
     * @category CSS
     */
    asCssTranslate3dString () {
        return this.asCssStringWithUnitSuffix("translate3d", "px")
    }

    /**
     * @description Generates a CSS rotate3d string in degrees.
     * @returns {string} The CSS rotate3d string
     * @category CSS
     */
    asCssRotate3dDegreesString () {
        return this.asCssStringWithUnitSuffix("rotate3d", "deg")
    }

    /**
     * @description Generates a CSS scale3d string.
     * @returns {string} The CSS scale3d string
     * @category CSS
     */
    asCssScale3dString () {
        return this.asCssStringWithUnitSuffix("scale3d", "")
    }

    /**
     * @description Gets the width (x coordinate).
     * @returns {number} The width
     * @category Dimensions
     */
    width () {
        return this.x()
    }

    /**
     * @description Gets the height (y coordinate).
     * @returns {number} The height
     * @category Dimensions
     */
    height () {
        return this.y()
    }
    
}.initThisClass());