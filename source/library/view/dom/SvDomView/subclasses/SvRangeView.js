"use strict";

/**
 * @module library.view.dom.SvDomView.subclasses
 */

/**
 * @class SvRangeView
 * @extends SvStyledDomView
 * @classdesc A slider: a native range input between a minimum and a maximum
 * in steps. Its value is a Number. Each move tells the parent views
 * (didEdit), so a field tile writes it to its node as it moves. Input arrives
 * through the framework's keyboard listener (onInput), not a raw listener.
 * While it has focus the arrow keys are the slider's, not the column's
 * navigation (as SvTextView).
 */
(class SvRangeView extends SvStyledDomView {

    initPrototypeSlots () {
        {
            const slot = this.overrideSlot("elementType", "input");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("minValue", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("maxValue", 100);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("stepValue", 1);
            slot.setSlotType("Number");
        }
    }

    init () {
        super.init();
        this.element().type = "range";
        this.setElementClassName("SvRangeView");
        this.setWidth("100%");
        this.setCursor("pointer");
        this.setCssProperty("accent-color", "currentColor"); // the theme's text color, not the browser's
        this.syncRangeAttributes();
        this.setIsRegisteredForKeyboard(true); // delivers the input's "input" events as onInput
        return this;
    }

    didUpdateSlotMinValue () {
        this.syncRangeAttributes();
    }

    didUpdateSlotMaxValue () {
        this.syncRangeAttributes();
    }

    didUpdateSlotStepValue () {
        this.syncRangeAttributes();
    }

    syncRangeAttributes () {
        this.setAttribute("min", String(this.minValue()));
        this.setAttribute("max", String(this.maxValue()));
        this.setAttribute("step", String(this.stepValue()));
        return this;
    }

    /**
     * @description Sets the slider's position (a Number; others are ignored).
     * @param {Number} v
     * @returns {SvRangeView}
     * @category Value
     */
    setValue (v) {
        const n = Number(v);
        if (Number.isFinite(n) && this.element().value !== String(n)) {
            this.element().value = String(n);
        }
        return this;
    }

    value () {
        return Number(this.element().value);
    }

    setIsEditable (aBool) {
        this.element().disabled = !aBool;
        return this;
    }

    isEditable () {
        return !this.element().disabled;
    }

    onInput (/*event*/) {
        this.didEdit();
        return false; // handled here: not a keystroke for the views above
    }

    // --- arrow keys move the slider while it has focus, not the column ---
    // (a handler's result is whether the key travels on to the views above)

    onLeftArrowKeyUp (/*event*/) {
        return !this.isFocused();
    }

    onRightArrowKeyUp (/*event*/) {
        return !this.isFocused();
    }

    onUpArrowKeyDown (/*event*/) {
        return !this.isFocused();
    }

    onDownArrowKeyDown (/*event*/) {
        return !this.isFocused();
    }

}.initThisClass());
