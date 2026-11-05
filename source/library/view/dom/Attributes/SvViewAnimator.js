"use strict";

/**
 * @module library.view.dom.Attributes
 */

/**
 * @class SvViewAnimator
 * @extends ProtoClass
 * @classdesc Handles view animation by manipulating a specific property of a view over time.
 */
(class SvViewAnimator extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the SvViewAnimator class.
     */
    initPrototypeSlots () {
        /**
         * @member {Number} startValue - The initial value of the animation.
         * @category Animation
         */
        {
            const slot = this.newSlot("startValue", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} targetValue - The final value of the animation.
         * @category Animation
         */
        {
            const slot = this.newSlot("targetValue", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {String} viewProperty - The name of the view property to animate.
         * @category Animation
         */
        {
            const slot = this.newSlot("viewProperty", "");
            slot.setSlotType("String");
        }
        /**
         * @member {Number} duration - The duration of the animation in milliseconds.
         * @category Animation
         */
        {
            const slot = this.newSlot("duration", 200);
            slot.setComment("milliseconds");
            slot.setSlotType("Number");
        }
        /**
         * @member {String} easing - The easing function to use for the animation.
         * @category Animation
         */
        {
            const slot = this.newSlot("easing", "linear");
            slot.setSlotType("String");
        }
        /**
         * @member {SvDomView} view - The view to animate.
         * @category Animation
         */
        {
            const slot = this.newSlot("view", null);
            slot.setSlotType("SvDomView");
        }
    }

    /**
     * @description Gets the current value of the animated property.
     * @returns {*} The current value of the animated property.
     * @category Animation
     */
    currentValue () {
        const view = this.view();
        return view[this.viewProperty()].apply(view);
    }

    /**
     * @description Starts the animation.
     * @returns {SvViewAnimator} The SvViewAnimator instance.
     * @category Animation
     */
    start () {
        this.setStartValue(this.currentValue());
        this.setStartTime(new Date().getTime());
        this.nextFrame();
        return this;
    }

    /**
     * @description Calculates the ratio of time elapsed in the animation.
     * @returns {number} A value between 0 and 1 representing the progress of the animation.
     * @category Animation
     */
    timeRatioDone () {
        const now = new Date().getTime();
        return Math.min(1, ((now - this.startTime()) / this.duration()));
    }

    /**
     * @description Gets the setter name for the animated property.
     * @returns {string} The setter name.
     * @category Utility
     */
    setterName () {
        if (!this._setterName) {
            this._setterName = this.viewProperty().asSetter();
        }
        return this._setterName;
    }

    /**
     * @description Sets the value of the animated property.
     * @param {*} v - The value to set.
     * @returns {SvViewAnimator} The SvViewAnimator instance.
     * @category Animation
     */
    setValue (v) {
        view[this.setterName()].call(view, v);
        return this;
    }

    /**
     * @description Processes the next animation frame.
     * @returns {SvViewAnimator} The SvViewAnimator instance.
     * @category Animation
     */
    nextFrame () {
        const tr = this.timeRatioDone();
        const newValue = Math.ceil((this.timeRatioDone() * (this.currentValue() - this.startValue())) + this.startValue());
        this.setValue(newValue);

        if (tr !== 1) {
            requestAnimationFrame(() => { this.nextFrame(); });
        } else {
            this.didComplete();
        }
        return this;
    }

    /**
     * @description Called when the animation completes.
     * @category Animation
     */
    didComplete () {

    }

}.initThisClass());
