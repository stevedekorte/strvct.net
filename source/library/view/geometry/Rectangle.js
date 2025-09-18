"use strict";

/**
 * @module library.view.geometry
 */

/**
 * @class Rectangle
 * @extends ProtoClass
 * @classdesc Class to represent a rectangle.
 * 
 * NOTES
 * 
 * For top & bottom, we assume we are using screen coordinates so:
 * 
 *     top = x
 * 
 * and:
 * 
 *     bottom = x + height
 */
(class Rectangle extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the Rectangle class.
     */
    initPrototypeSlots () {
        /**
         * @member {Point} origin - The origin point of the rectangle.
         * @category Geometry
         */
        {
            const slot = this.newSlot("origin", null);
            slot.setSlotType("Point");
        }
        /**
         * @member {Point} size - The size of the rectangle.
         * @category Geometry
         */
        {
            const slot = this.newSlot("size", null);
            slot.setSlotType("Point");
        }
    }

    /**
     * @description Initializes a new Rectangle instance.
     * @returns {Rectangle} The initialized Rectangle instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setOrigin(Point.clone())
        this.setSize(Point.clone())
        return this
    }

    /**
     * @description Creates a duplicate of the current Rectangle instance.
     * @returns {Rectangle} A new Rectangle instance with copied properties.
     * @category Utility
     */
    duplicate () {
        return this.thisClass().clone().copyFrom(this)
    }

    /**
     * @description Copies properties from another Rectangle instance.
     * @param {Rectangle} aRect - The Rectangle instance to copy from.
     * @returns {Rectangle} This Rectangle instance.
     * @category Utility
     */
    copyFrom (aRect) {
        this.origin().copyFrom(aRect.origin())
        this.size().copyFrom(aRect.size())
        return this
    }
    
    /**
     * @description Checks if the Rectangle contains a given point.
     * @param {Point} p - The point to check.
     * @returns {boolean} True if the point is contained within the Rectangle, false otherwise.
     * @category Geometry
     */
    containsPoint (p) {
        const a = p.isGreaterThanOrEqualTo(this.origin()) 
        const b = p.isLessThanOrEqualTo(this.maxPoint())
        return a && b
    }

    /**
     * @description Checks if the Rectangle contains another Rectangle.
     * @param {Rectangle} r - The Rectangle to check.
     * @returns {boolean} True if the Rectangle contains the other Rectangle, false otherwise.
     * @category Geometry
     */
    containsRectangle (r) {
        return r.origin().isGreaterThanOrEqualTo(this.origin()) && r.maxPoint().isLessThanOrEqualTo(this.maxPoint())
    }

    /**
     * @description Creates a new Rectangle that is the union of this Rectangle and another.
     * @param {Rectangle} r - The Rectangle to union with.
     * @returns {Rectangle} A new Rectangle representing the union.
     * @category Geometry
     */
    unionWith (r) {
        const u = Rectangle.clone()
        const o1 = this.origin()
        const o2 = r.origin()
        const m1 = this.maxPoint()
        const m2 = r.maxPoint()
        const minX = Math.min(o1.x(), o2.x())
        const minY = Math.min(o1.y(), o2.y())
        u.origin().setX(minX)
        u.origin().setY(minY)
        const maxX = Math.max(m1.x(), m2.x())
        const maxY = Math.max(m1.y(), m2.y())
        u.setWidth(maxX - minX)
        u.setHeight(maxY - minY)
        return u
    }

    /**
     * @description Gets the maximum point of the Rectangle.
     * @returns {Point} The maximum point of the Rectangle.
     * @category Geometry
     */
    maxPoint () {
        return this.origin().add(this.size())
    }

    /**
     * @description Returns a string representation of the Rectangle.
     * @returns {string} A string representation of the Rectangle.
     * @category Utility
     */
    asString () {
        return this.svType() + "(" + this.origin().asString() + ", " + this.size().asString() + ")"
    }

    /**
     * @description Gets the x-coordinate of the Rectangle's origin.
     * @returns {number} The x-coordinate of the Rectangle's origin.
     * @category Geometry
     */
    x () {
        return this.origin().x();
    }

    /**
     * @description Gets the y-coordinate of the Rectangle's origin.
     * @returns {number} The y-coordinate of the Rectangle's origin.
     * @category Geometry
     */
    y () {
        return this.origin().y();
    }

    /**
     * @description Gets the minimum x-coordinate of the Rectangle.
     * @returns {number} The minimum x-coordinate of the Rectangle.
     * @category Geometry
     */
    minX () {
        return this.x()
    }

    /**
     * @description Gets the minimum y-coordinate of the Rectangle.
     * @returns {number} The minimum y-coordinate of the Rectangle.
     * @category Geometry
     */
    minY () {
        return this.y()
    }

    /**
     * @description Gets the maximum x-coordinate of the Rectangle.
     * @returns {number} The maximum x-coordinate of the Rectangle.
     * @category Geometry
     */
    maxX () {
        return this.x() + this.width()
    }

    /**
     * @description Gets the maximum y-coordinate of the Rectangle.
     * @returns {number} The maximum y-coordinate of the Rectangle.
     * @category Geometry
     */
    maxY () {
        return this.y() + this.height()
    }
    
    /**
     * @description Sets the maximum x-coordinate of the Rectangle.
     * @param {number} mx - The new maximum x-coordinate.
     * @returns {Rectangle} This Rectangle instance.
     * @category Geometry
     */
    setMaxX (mx) {
        const w = mx - this.x()
        this.setWidth(w)
        return this
    }

    /**
     * @description Sets the maximum y-coordinate of the Rectangle.
     * @param {number} my - The new maximum y-coordinate.
     * @returns {Rectangle} This Rectangle instance.
     * @category Geometry
     */
    setMaxY (my) {
        const h = my - this.y()
        this.setHeight(h)
        return this
    }

    /**
     * @description Sets the width of the Rectangle.
     * @param {number} w - The new width.
     * @returns {Rectangle} This Rectangle instance.
     * @category Geometry
     */
    setWidth (w) {
        assert(w >= 0)
        this.size().setX(w)
        return this
    }

    /**
     * @description Gets the width of the Rectangle.
     * @returns {number} The width of the Rectangle.
     * @category Geometry
     */
    width () {
        return this.size().x();
    }

    /**
     * @description Sets the height of the Rectangle.
     * @param {number} h - The new height.
     * @returns {Rectangle} This Rectangle instance.
     * @category Geometry
     */
    setHeight (h) {
        assert(h >= 0)
        this.size().setY(h)
        return this
    }

    /**
     * @description Gets the height of the Rectangle.
     * @returns {number} The height of the Rectangle.
     * @category Geometry
     */
    height () {
        return this.size().y();
    }

    /**
     * @description Gets the top coordinate of the Rectangle.
     * @returns {number} The top coordinate of the Rectangle.
     * @category Geometry
     */
    top () {
        return this.y() 
    }

    /**
     * @description Gets the bottom coordinate of the Rectangle.
     * @returns {number} The bottom coordinate of the Rectangle.
     * @category Geometry
     */
    bottom () {
        return this.y() + this.height() 
    }

    /**
     * @description Gets the left coordinate of the Rectangle.
     * @returns {number} The left coordinate of the Rectangle.
     * @category Geometry
     */
    left () {
        return this.x() 
    }

    /**
     * @description Gets the right coordinate of the Rectangle.
     * @returns {number} The right coordinate of the Rectangle.
     * @category Geometry
     */
    right () {
        return this.x() + this.width() 
    }

    /**
     * @description Sets the bounds of the Rectangle based on a set of points.
     * @param {Point[]} points - An array of Points to determine the bounds.
     * @returns {Rectangle} This Rectangle instance.
     * @category Geometry
     */
    makeBoundsOfPoints (points) {
        const firstPoint = points[0]
        let minX = firstPoint.x()
        let maxX = firstPoint.x()
        let minY = firstPoint.y()
        let maxY = firstPoint.y()
        points.forEach(p => {
            const x = p.x()
            const y = p.y()

            // faster than using Math.min/max
            if (x < minX) {
                minX = x
            } else if (x > maxX) {
                maxX = x 
            }

            if (y < minY) {
                minY = y 
            } else if (y > maxY) {
                maxY = y
            }
        })
        this.origin().setX(minX).setY(minY)
        this.setMaxX(maxX)
        this.setMaxY(maxY)
        return this
    }

}.initThisClass());