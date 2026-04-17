"use strict";

/**
 * @module library.view.geometry
 */

/**
 * @class SvRectangle
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
(class SvRectangle extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the SvRectangle class.
     */
    initPrototypeSlots () {
        /**
         * @member {SvPoint} origin - The origin point of the rectangle.
         * @category Geometry
         */
        {
            const slot = this.newSlot("origin", null);
            slot.setSlotType("SvPoint");
        }
        /**
         * @member {SvPoint} size - The size of the rectangle.
         * @category Geometry
         */
        {
            const slot = this.newSlot("size", null);
            slot.setSlotType("SvPoint");
        }
    }

    /**
     * @description Initializes a new SvRectangle instance.
     * @returns {SvRectangle} The initialized SvRectangle instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setOrigin(SvPoint.clone());
        this.setSize(SvPoint.clone());
        return this;
    }

    /**
     * @description Creates a duplicate of the current SvRectangle instance.
     * @returns {SvRectangle} A new SvRectangle instance with copied properties.
     * @category Utility
     */
    duplicate () {
        return this.thisClass().clone().copyFrom(this);
    }

    /**
     * @description Copies properties from another SvRectangle instance.
     * @param {SvRectangle} aRect - The SvRectangle instance to copy from.
     * @returns {SvRectangle} This SvRectangle instance.
     * @category Utility
     */
    copyFrom (aRect) {
        this.origin().copyFrom(aRect.origin());
        this.size().copyFrom(aRect.size());
        return this;
    }

    /**
     * @description Checks if the SvRectangle contains a given point.
     * @param {SvPoint} p - The point to check.
     * @returns {boolean} True if the point is contained within the SvRectangle, false otherwise.
     * @category Geometry
     */
    containsPoint (p) {
        const a = p.isGreaterThanOrEqualTo(this.origin());
        const b = p.isLessThanOrEqualTo(this.maxPoint());
        return a && b;
    }

    /**
     * @description Checks if the SvRectangle contains another SvRectangle.
     * @param {SvRectangle} r - The SvRectangle to check.
     * @returns {boolean} True if the SvRectangle contains the other SvRectangle, false otherwise.
     * @category Geometry
     */
    containsRectangle (r) {
        return r.origin().isGreaterThanOrEqualTo(this.origin()) && r.maxPoint().isLessThanOrEqualTo(this.maxPoint());
    }

    /**
     * @description Creates a new SvRectangle that is the union of this SvRectangle and another.
     * @param {SvRectangle} r - The SvRectangle to union with.
     * @returns {SvRectangle} A new SvRectangle representing the union.
     * @category Geometry
     */
    unionWith (r) {
        const u = SvRectangle.clone();
        const o1 = this.origin();
        const o2 = r.origin();
        const m1 = this.maxPoint();
        const m2 = r.maxPoint();
        const minX = Math.min(o1.x(), o2.x());
        const minY = Math.min(o1.y(), o2.y());
        u.origin().setX(minX);
        u.origin().setY(minY);
        const maxX = Math.max(m1.x(), m2.x());
        const maxY = Math.max(m1.y(), m2.y());
        u.setWidth(maxX - minX);
        u.setHeight(maxY - minY);
        return u;
    }

    /**
     * @description Gets the maximum point of the SvRectangle.
     * @returns {SvPoint} The maximum point of the SvRectangle.
     * @category Geometry
     */
    maxPoint () {
        return this.origin().add(this.size());
    }

    /**
     * @description Returns a string representation of the SvRectangle.
     * @returns {string} A string representation of the SvRectangle.
     * @category Utility
     */
    asString () {
        return this.svType() + "(" + this.origin().asString() + ", " + this.size().asString() + ")";
    }

    /**
     * @description Gets the x-coordinate of the SvRectangle's origin.
     * @returns {number} The x-coordinate of the SvRectangle's origin.
     * @category Geometry
     */
    x () {
        return this.origin().x();
    }

    /**
     * @description Gets the y-coordinate of the SvRectangle's origin.
     * @returns {number} The y-coordinate of the SvRectangle's origin.
     * @category Geometry
     */
    y () {
        return this.origin().y();
    }

    /**
     * @description Gets the minimum x-coordinate of the SvRectangle.
     * @returns {number} The minimum x-coordinate of the SvRectangle.
     * @category Geometry
     */
    minX () {
        return this.x();
    }

    /**
     * @description Gets the minimum y-coordinate of the SvRectangle.
     * @returns {number} The minimum y-coordinate of the SvRectangle.
     * @category Geometry
     */
    minY () {
        return this.y();
    }

    /**
     * @description Gets the maximum x-coordinate of the SvRectangle.
     * @returns {number} The maximum x-coordinate of the SvRectangle.
     * @category Geometry
     */
    maxX () {
        return this.x() + this.width();
    }

    /**
     * @description Gets the maximum y-coordinate of the SvRectangle.
     * @returns {number} The maximum y-coordinate of the SvRectangle.
     * @category Geometry
     */
    maxY () {
        return this.y() + this.height();
    }

    /**
     * @description Sets the maximum x-coordinate of the SvRectangle.
     * @param {number} mx - The new maximum x-coordinate.
     * @returns {SvRectangle} This SvRectangle instance.
     * @category Geometry
     */
    setMaxX (mx) {
        const w = mx - this.x();
        this.setWidth(w);
        return this;
    }

    /**
     * @description Sets the maximum y-coordinate of the SvRectangle.
     * @param {number} my - The new maximum y-coordinate.
     * @returns {SvRectangle} This SvRectangle instance.
     * @category Geometry
     */
    setMaxY (my) {
        const h = my - this.y();
        this.setHeight(h);
        return this;
    }

    /**
     * @description Sets the width of the SvRectangle.
     * @param {number} w - The new width.
     * @returns {SvRectangle} This SvRectangle instance.
     * @category Geometry
     */
    setWidth (w) {
        assert(w >= 0);
        this.size().setX(w);
        return this;
    }

    /**
     * @description Gets the width of the SvRectangle.
     * @returns {number} The width of the SvRectangle.
     * @category Geometry
     */
    width () {
        return this.size().x();
    }

    /**
     * @description Sets the height of the SvRectangle.
     * @param {number} h - The new height.
     * @returns {SvRectangle} This SvRectangle instance.
     * @category Geometry
     */
    setHeight (h) {
        assert(h >= 0);
        this.size().setY(h);
        return this;
    }

    /**
     * @description Gets the height of the SvRectangle.
     * @returns {number} The height of the SvRectangle.
     * @category Geometry
     */
    height () {
        return this.size().y();
    }

    /**
     * @description Gets the top coordinate of the SvRectangle.
     * @returns {number} The top coordinate of the SvRectangle.
     * @category Geometry
     */
    top () {
        return this.y();
    }

    /**
     * @description Gets the bottom coordinate of the SvRectangle.
     * @returns {number} The bottom coordinate of the SvRectangle.
     * @category Geometry
     */
    bottom () {
        return this.y() + this.height();
    }

    /**
     * @description Gets the left coordinate of the SvRectangle.
     * @returns {number} The left coordinate of the SvRectangle.
     * @category Geometry
     */
    left () {
        return this.x();
    }

    /**
     * @description Gets the right coordinate of the SvRectangle.
     * @returns {number} The right coordinate of the SvRectangle.
     * @category Geometry
     */
    right () {
        return this.x() + this.width();
    }

    /**
     * @description Sets the bounds of the SvRectangle based on a set of points.
     * @param {SvPoint[]} points - An array of Points to determine the bounds.
     * @returns {SvRectangle} This SvRectangle instance.
     * @category Geometry
     */
    makeBoundsOfPoints (points) {
        const firstPoint = points[0];
        let minX = firstPoint.x();
        let maxX = firstPoint.x();
        let minY = firstPoint.y();
        let maxY = firstPoint.y();
        points.forEach(p => {
            const x = p.x();
            const y = p.y();

            // faster than using Math.min/max
            if (x < minX) {
                minX = x;
            } else if (x > maxX) {
                maxX = x;
            }

            if (y < minY) {
                minY = y;
            } else if (y > maxY) {
                maxY = y;
            }
        });
        this.origin().setX(minX).setY(minY);
        this.setMaxX(maxX);
        this.setMaxY(maxY);
        return this;
    }

}.initThisClass());
