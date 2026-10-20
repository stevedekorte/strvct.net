"use strict";

/**
 * @module library.node.fields.subclasses
 */

/**
 * @class SvSwitchField
 * @extends SvBooleanField
 * @classdesc A Boolean field shown as a sliding switch (SvBooleanView's
 * "switch" style, colored by the theme's --sv-switch-* tokens) rather than a
 * checkbox. Use it for a slot with setFieldInspectorClassName("SvSwitchField").
 */
(class SvSwitchField extends SvBooleanField {

    nodeBooleanStyle () {
        return "switch";
    }

}.initThisClass());
