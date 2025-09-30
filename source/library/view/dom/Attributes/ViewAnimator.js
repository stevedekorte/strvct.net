"use strict";

/**
 * @module library.view.dom.Attributes
 */

/**
 * @class ViewAnimator
 * @extends ProtoClass
 * @classdesc Handles view animation by manipulating a specific property of a view over time.
 */
(class ViewAnimator extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the ViewAnimator class.
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
         * @member {DomView} view - The view to animate.
         * @category Animation
         */
        {
            const slot = this.newSlot("view", null);
            slot.setSlotType("DomView");
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
     * @returns {ViewAnimator} The ViewAnimator instance.
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
     * @returns {ViewAnimator} The ViewAnimator instance.
     * @category Animation
     */
    setValue (v) {
        view[this.setterName()].call(view, v);
        return this;
    }

    /**
     * @description Processes the next animation frame.
     * @returns {ViewAnimator} The ViewAnimator instance.
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

    /*
    EasingsFunctions () {
        linear(t) {
            return t;
        }
        easeInQuad(t) {
            return t * t;
        }
        easeOutQuad(t) {
            return t * (2 - t);
        }
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
        easeInCubic(t) {
            return t * t * t;
        }
        easeOutCubic(t) {
            return (--t) * t * t + 1;
        }
        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }
        easeInQuart(t) {
            return t * t * t * t;
        }
        easeOutQuart(t) {
            return 1 - (--t) * t * t * t;
        }
        easeInOutQuart(t) {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        }
        easeInQuint(t) {
            return t * t * t * t * t;
        }
        easeOutQuint(t) {
            return 1 + (--t) * t * t * t * t;
        }
        easeInOutQuint(t) {
            return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
        }
    }
    */
}.initThisClass());
