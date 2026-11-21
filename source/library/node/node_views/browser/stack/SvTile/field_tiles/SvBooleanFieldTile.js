"use strict";

/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/** * @class SvBooleanFieldTile
 * @extends SvFieldTile
 * @classdesc Represents a boolean field tile in the browser stack.


 */

(class SvBooleanFieldTile extends SvFieldTile {

    /*
    initPrototypeSlots () {
    }
    */

    /**
     * @description Initializes the SvBooleanFieldTile.
     * @returns {SvBooleanFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();

        this.turnOffUserSelect();
        this.keyView().setTransition("color 0.3s");
        this.keyView().setPaddingLeft("0.5em");

        this.valueView().parentView().flexCenterContent();
        this.valueView().setPaddingBottom("0em");

        this.keyView().setPaddingTop("0em");
        this.keyView().setPaddingBottom("0.35em");

        //this.contentView().debugBorders();
        this.kvSection().subviews().at(1).flexCenterContent();
        //this.contentView().setFlexDirection("column");
        this.kvSection().setFlexDirection("row").makeSubviewsReverseOrdered();
        //this.kvSection().subviews().forEach(sv => sv.setAlignItems("center"));
        this.kvSection().subviews().forEach(sv => sv.flexCenterContent());
        //this.keyView().parentView().swapSubviews(this.keyView(), this.valueView());

        this.setValueEditableBorder("none");
        this.setValueUneditableBorder("none");

        return this;
    }

    /**
     * @description Creates and returns a SvBooleanView for the value.
     * @returns {SvBooleanView} The created SvBooleanView instance.
     * @category View Creation
     */
    createValueView () {
        const bv = SvBooleanView.clone();
        // Ensure the view starts with the field's initial value
        if (this.node() && this.node().value !== undefined) {
            bv.setValue(this.node().value());
        }
        return bv;
    }

    /**
     * @description Returns the SvBooleanView used for the value.
     * @returns {SvBooleanView} The SvBooleanView instance.
     * @category Accessors
     */
    booleanView () {
        return this.valueView();
    }

    /**
     * @description Synchronizes the tile with its associated node and updates the appearance.
     * @returns {SvBooleanFieldTile} The current instance.
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode();
        const node = this.node();
        const style = node && node.nodeBooleanStyle ? node.nodeBooleanStyle() : "checkbox";
        this.booleanView().setBooleanStyle(style); // a checkbox, or a switch (SvSwitchField)
        this.syncSwitchSide(style === "switch");
        this.booleanView().updateAppearance();

        // Accessibility: reflect checked state
        this.setAriaChecked(this.ariaIsChecked());

        return this;
    }

    /**
     * @description A checkbox sits before its label; a switch after it, at
     * the row's right edge (the label takes the room between). Order and
     * flex writes only; same-value writes are skipped.
     * @param {Boolean} isSwitch
     * @returns {SvBooleanFieldTile}
     * @category Layout
     */
    syncSwitchSide (isSwitch) {
        const sections = this.kvSection().subviews();
        const count = sections.length;
        sections.forEachKV((i, sv) => sv.setOrder(isSwitch ? i : count - 1 - i));
        this.keyView().setPaddingLeft(isSwitch ? "0em" : "0.5em"); // a switch's label lines up with its neighbours' titles
        const label = sections.at(0);
        if (label) {
            label.setFlexGrow(isSwitch ? 1 : null);
            label.setFlexShrink(isSwitch ? 1 : null);
            label.setMinWidth(isSwitch ? "0px" : null); // so a long label wraps instead of pushing the switch
            label.setJustifyContent(isSwitch ? "flex-start" : null);
        }
        if (isSwitch && this.node().keyWhiteSpace() === null) {
            this.keyView().setWhiteSpace("normal"); // a switch's label is a sentence: it wraps, it isn't cut short
        }
        return this;
    }

    // --- taps ---

    /**
     * @description A tap anywhere on the row switches the value, as a tap on
     * a label does for a checkbox. A tap on the boolean view itself is left
     * to its own gesture (so it isn't switched twice), and a row whose label
     * is edited in place keeps its taps for the editing.
     * @param {SvTapGestureRecognizer} aGesture
     * @returns {SvBooleanFieldTile}
     * @category Gesture
     */
    onTapComplete (aGesture) {
        super.onTapComplete(aGesture);
        if (this.tapSwitchesValue(aGesture)) {
            this.booleanView().activate();
        }
        return this;
    }

    /**
     * @description Whether a tap on this row should switch the value.
     * @param {SvTapGestureRecognizer} aGesture
     * @returns {Boolean}
     * @category Gesture
     */
    tapSwitchesValue (aGesture) {
        const node = this.node();
        const bv = this.booleanView();
        if (!node || !bv.isEditable() || node.keyIsEditable()) {
            return false;
        }
        const event = aGesture.upEvent();
        const target = event ? event.target : null;
        return !(target && bv.element().contains(target));
    }

    // --- ARIA accessibility getters ---

    /**
     * @description Returns the ARIA role for this boolean field tile.
     * @returns {string} The ARIA role.
     * @category Accessibility
     */
    ariaRole () {
        return "checkbox";
    }

    /**
     * @description Returns the ARIA checked state from the boolean value.
     * @returns {boolean} The checked state.
     * @category Accessibility
     */
    ariaIsChecked () {
        return this.booleanView().value() ? true : false;
    }

}.initThisClass());
