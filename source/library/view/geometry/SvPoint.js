/**
 * @module library.view.geometry
 */

/**
 * @class SvPoint
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

(class SvPoint extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the SvPoint class.
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
        return [this._x, this._y, this._z];
    }

    /**
     * @description Sets the time value to the current timestamp.
     * @returns {SvPoint} The current SvPoint instance
     * @category Time
     */
    setTimeToNow () {
        const d = new Date();
        this._t = d.getTime();
        return this;
    }

    /**
     * @description Copies values from another SvPoint instance.
     * @param {SvPoint} p - The SvPoint to copy from
     * @param {Object} copyDict - Copy dictionary (unused)
     * @returns {SvPoint} The current SvPoint instance
     * @category Data Manipulation
     */
    copyFrom (p/*, copyDict*/) {
        this._x = p._x;
        this._y = p._y;
        this._z = p._z;
        this._t = p._t;
        return this;
    }

    /**
     * @description Sets the x and y coordinates.
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @returns {SvPoint} The current SvPoint instance
     * @category Coordinates
     */
    setXY (x, y) {
        this._x = x;
        this._y = y;
        return this;
    }

    /**
     * @description Sets the x, y, z, and t values.
     * @param {Number} x - The x coordinate
     * @param {Number} y - The y coordinate
     * @param {Number} z - The z coordinate (optional)
     * @param {Number} t - The time value (optional)
     * @returns {SvPoint} The current SvPoint instance
     * @category Coordinates
     */
    set (x, y, z, t) {
        this._x = x;
        this._y = y;
        if (Type.isNumber(z)) {
            this._z = z;
        }
        if (Type.isNumber(t)) {
            this._t = t;
        }
        return this;
    }

    /**
     * @description Adds another SvPoint's values to this SvPoint in place.
     * @param {SvPoint} p - The SvPoint to add
     * @returns {SvPoint} The current SvPoint instance
     * @category Arithmetic
     */
    addInPlace (p) {
        this._x += p._x;
        this._y += p._y;
        this._z += p._z;
        this._t += p._t;
        return this;
    }

    /**
     * @description Subtracts another SvPoint's values from this SvPoint in place.
     * @param {SvPoint} p - The SvPoint to subtract
     * @returns {SvPoint} The current SvPoint instance
     * @category Arithmetic
     */
    subtractInPlace (p) {
        this._x -= p._x;
        this._y -= p._y;
        this._z -= p._z;
        this._t -= p._t;
        return this;
    }

    /**
     * @description Applies Math.floor() to x, y, and z values in place.
     * @returns {SvPoint} The current SvPoint instance
     * @category Arithmetic
     */
    floorInPlace () {
        this._x = Math.floor(this._x);
        this._y = Math.floor(this._y);
        this._z = Math.floor(this._z);
        return this;
    }

    /**
     * @description Creates a copy of this SvPoint.
     * @returns {SvPoint} A new SvPoint instance with the same values
     * @category Data Manipulation
     */
    copy () {
        return this.thisClass().clone().copyFrom(this);
    }

    /**
     * @description Adds another SvPoint's values to a copy of this SvPoint.
     * @param {SvPoint} p - The SvPoint to add
     * @returns {SvPoint} A new SvPoint instance with the sum
     * @category Arithmetic
     */
    add (p) {
        return this.copy().addInPlace(p);
    }

    /**
     * @description Subtracts another SvPoint's values from a copy of this SvPoint.
     * @param {SvPoint} p - The SvPoint to subtract
     * @returns {SvPoint} A new SvPoint instance with the difference
     * @category Arithmetic
     */
    subtract (p) {
        return this.copy().subtractInPlace(p);
    }

    /**
     * @description Returns a string representation of the SvPoint.
     * @returns {string} The string representation
     * @category Data Representation
     */
    asString () {
        let s = this.svType() + "(" + this._x + ", " + this._y ;

        if (this._z) {
            s += ", " + this._z;
        }

        /*
        if (this._t) {
            s += ", " + this._t + "t"
        }
        */

        return s + ")";
    }

    /**
     * @description Calculates the distance from the origin (0, 0, 0).
     * @returns {number} The distance from the origin
     * @category Geometry
     */
    distanceFromOrigin () {
        const ds = Math.pow(this.x(), 2) + Math.pow(this.y(), 2) + Math.pow(this.z(), 2);
        return Math.sqrt(ds);
    }

    /**
     * @description Calculates the difference in x coordinate from another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {number} The difference in x coordinate
     * @category Geometry
     */
    dxFrom (p) {
        return this.x() - p.x();
    }

    /**
     * @description Calculates the difference in y coordinate from another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {number} The difference in y coordinate
     * @category Geometry
     */
    dyFrom (p) {
        return this.y() - p.y();
    }

    /**
     * @description Calculates the difference in z coordinate from another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {number} The difference in z coordinate
     * @category Geometry
     */
    dzFrom (p) {
        return this.z() - p.z();
    }

    /**
     * @description Calculates the difference in time value from another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {number} The difference in time value
     * @category Time
     */
    dtFrom (p) {
        return this.t() - p.t();
    }

    /**
     * @description Calculates the distance from another SvPoint.
     * @param {SvPoint} p - The SvPoint to calculate distance to
     * @returns {number} The distance between the two Points
     * @category Geometry
     */
    distanceFrom (p) {
        const dx = this.dxFrom(p);
        const dy = this.dyFrom(p);
        const dz = this.dzFrom(p);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * @description Checks if this SvPoint is equal to another SvPoint (excluding time).
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {boolean} True if the Points are equal, false otherwise
     * @category Comparison
     */
    isEqual (p) {
        if (Type.isNullOrUndefined(p)) {
            return false;
        }
        return (this.x() === p.x()) && (this.y() === p.y()) && (this.z() === p.z()); // && (this.t() === p.t())
    }

    /**
     * @description Checks if this SvPoint is equal to another SvPoint (including time).
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {boolean} True if the Points are equal, false otherwise
     * @category Comparison
     */
    isEqualWithTime (p) { // not ideal
        return (this.x() === p.x()) && (this.y() === p.y()) && (this.z() === p.z()) && (this.t() === p.t());
    }

    /**
     * @description Checks if this SvPoint is greater than another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {boolean} True if this SvPoint is greater, false otherwise
     * @category Comparison
     */
    isGreaterThan (p) {
        return this.x() > p.x() && this.y() > p.y();
    }

    /**
     * @description Checks if this SvPoint is less than another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {boolean} True if this SvPoint is less, false otherwise
     * @category Comparison
     */
    isLessThan (p) {
        return this.x() < p.x() && this.y() < p.y();
    }

    /**
     * @description Checks if this SvPoint is greater than or equal to another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {boolean} True if this SvPoint is greater or equal, false otherwise
     * @category Comparison
     */
    isGreaterThanOrEqualTo (p) {
        return this.x() >= p.x() && this.y() >= p.y();
    }

    /**
     * @description Checks if this SvPoint is less than or equal to another SvPoint.
     * @param {SvPoint} p - The SvPoint to compare with
     * @returns {boolean} True if this SvPoint is less or equal, false otherwise
     * @category Comparison
     */
    isLessThanOrEqualTo (p) {
        return this.x() <= p.x() && this.y() <= p.y();
    }

    /**
     * @description Calculates the angle in radians from the origin to this SvPoint.
     * @returns {number} The angle in radians
     * @category Geometry
     */
    angleInRadians () {
        return Math.atan2(y, x);
    }

    /**
     * @description Calculates the angle in degrees from the origin to this SvPoint.
     * @returns {number} The angle in degrees
     * @category Geometry
     */
    angleInDegrees () {
        return this.angleInRadians() * 180 / Math.PI;
    }

    /**
     * @description Calculates the angle in radians from this SvPoint to another SvPoint.
     * @param {SvPoint} p - The SvPoint to calculate the angle to
     * @returns {number} The angle in radians
     * @category Geometry
     */
    angleInRadiansTo (p) {
        return p.subtract(this).angleInRadians();
    }

    /**
     * @description Calculates the angle in degrees from this SvPoint to another SvPoint.
     * @param {SvPoint} p - The SvPoint to calculate the angle to
     * @returns {number} The angle in degrees
     * @category Geometry
     */
    angleInDegreesTo (p) {
        return p.subtract(this).angleInDegrees();
    }

    /**
     * @description Calculates the midpoint between this SvPoint and another SvPoint.
     * @param {SvPoint} p - The other SvPoint
     * @returns {SvPoint} The midpoint
     * @category Geometry
     */
    midpointTo (p) {
        return this.add(p).divideByScalar(2);
    }

    /**
     * @description Multiplies this SvPoint's coordinates by a scalar value.
     * @param {number} v - The scalar value
     * @returns {SvPoint} A new SvPoint with scaled coordinates
     * @category Arithmetic
     */
    multiplyByScalar (v) {
        const p = SvPoint.clone();
        p.set(this.x() * v, this.y() * v, this.z() * v);
        return p;
    }

    /**
     * @description Divides this SvPoint's coordinates by a scalar value.
     * @param {number} v - The scalar value
     * @returns {SvPoint} A new SvPoint with divided coordinates
     * @category Arithmetic
     */
    divideByScalar (v) {
        return this.multiplyByScalar(1 / v);
    }

    /**
     * @description Returns the negation of this SvPoint.
     * @returns {SvPoint} A new SvPoint with negated coordinates
     * @category Arithmetic
     */
    negated () {
        return this.multiplyByScalar(-1);
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
            unitSuffix = "";
        }

        const us = unitSuffix;
        return name + "(" + this._x + us + "," + this._y + us + "," + this._z + us + ")";
        //const s = this.valueArray().map(v => v + unitSuffix).join(",")
        //return name + "(" + s + ")"
    }

    /**
     * @description Generates a CSS translate3d string.
     * @returns {string} The CSS translate3d string
     * @category CSS
     */
    asCssTranslate3dString () {
        return this.asCssStringWithUnitSuffix("translate3d", "px");
    }

    /**
     * @description Generates a CSS rotate3d string in degrees.
     * @returns {string} The CSS rotate3d string
     * @category CSS
     */
    asCssRotate3dDegreesString () {
        return this.asCssStringWithUnitSuffix("rotate3d", "deg");
    }

    /**
     * @description Generates a CSS scale3d string.
     * @returns {string} The CSS scale3d string
     * @category CSS
     */
    asCssScale3dString () {
        return this.asCssStringWithUnitSuffix("scale3d", "");
    }

    /**
     * @description Gets the width (x coordinate).
     * @returns {number} The width
     * @category Dimensions
     */
    width () {
        return this.x();
    }

    /**
     * @description Gets the height (y coordinate).
     * @returns {number} The height
     * @category Dimensions
     */
    height () {
        return this.y();
    }

}.initThisClass());
