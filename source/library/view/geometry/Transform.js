"use strict";

/**
 * @module library.view.geometry
 */

/**
 * @class Transform
 * @extends ProtoClass
 * @classdesc Represents a transformation in 3D space, including position, rotation, and scale.
 */
(class Transform extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the Transform class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Point} position - The position of the transform in px units.
         * @category Geometry
         */
        {
            const slot = this.newSlot("position", null);
            slot.setComment("in px units");
            slot.setSlotType("Point");
        }
        /**
         * @member {Point} rotation - The rotation of the transform in degrees units.
         * @category Geometry
         */
        {
            const slot = this.newSlot("rotation", null);
            slot.setComment("in degrees units");
            slot.setSlotType("Point");
        }
        /**
         * @member {Point} scale - The scale of the transform.
         * @category Geometry
         */
        {
            const slot = this.newSlot("scale", null);
            slot.setSlotType("Point");
        }
    }

    /**
     * @description Initializes the Transform instance.
     * @returns {Transform} The initialized Transform instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setPosition(Point.clone());
        this.setRotation(Point.clone());
        this.setScale(Point.clone().setX(1).setY(1).setZ(1));
        return this;
    }

    /**
     * @description Generates a CSS string representation of the transform.
     * @returns {string} The CSS transform string.
     * @category Rendering
     */
    cssString () {
        // NOTE: multiple transform one line directives are applied from right to left
        const s =
          this.scale().asCssScale3dString() + " "
        + this.position().asCssTranslate3dString() + " "
        + this.rotation().asCssRotate3dDegreesString(); // is this the expected order?
        return s;
    }

    /**
     * @description Creates a copy of the current Transform instance.
     * @returns {Transform} A new Transform instance with copied values.
     * @category Utility
     */
    copy () {
        const t = Transform.clone();
        t.position().copy(this.position());
        t.rotation().copy(this.rotation());
        t.scale().copy(this.scale());
        return t;
    }

    /**
     * @description Adds another Transform to this Transform in place.
     * @param {Transform} otherTransform - The Transform to add.
     * @returns {Transform} This Transform instance after addition.
     * @category Geometry
     */
    addInPlace (otherTransform) {
        this.position().addInPlace(otherTransform.position());
        this.rotation().addInPlace(otherTransform.rotation());
        this.scale().addInPlace(otherTransform.scale());
        return this;
    }

    /*
    add (aTransform) {
        const t = this.copy()
        t.position().addInPlace(aTransform.position())
        t.rotation().addInPlace(aTransform.rotation())
        t.scale().addInPlace(aTransform.scale())
        return t
    }


    subtract (aTransform) {
        const t = this.copy()
        t.position().subtractInPlace(aTransform.position())
        t.rotation().subtractInPlace(aTransform.rotation())
        t.scale().subtractInPlace(aTransform.scale())
        return t
    }
    */

}.initThisClass());
