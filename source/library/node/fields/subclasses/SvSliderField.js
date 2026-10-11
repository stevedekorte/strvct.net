"use strict";

/**
 * @module library.node.fields.subclasses
 */

/**
 * @class SvSliderField
 * @extends SvNumberField
 * @classdesc A number field shown as a slider (SvSliderFieldTile) between
 * its limits (SvNumberField's minValue and maxValue; 0–100 by default), in
 * steps — a volume, a level. Use it for a slot with
 * setFieldInspectorClassName("SvSliderField").
 */
(class SvSliderField extends SvNumberField {

    initPrototypeSlots () {
        {
            const slot = this.overrideSlot("maxValue", 100); // SvNumberField's limits, a percent by default
            slot.setSlotType("Number");
        }
        {
            const slot = this.overrideSlot("hasLimits", true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("stepValue", 1);
            slot.setSlotType("Number");
        }
    }

}.initThisClass());
