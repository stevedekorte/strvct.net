"use strict";

/**
 * @module library.view.dom.SvDomView.subclasses
 */

/**
 * @class SvBooleanView
 * @extends SvStyledDomView
 * @classdesc SvBooleanView represents a checkbox component.
 *
 * The checkbox is composed of 2 overlapping inner views,
 * one for the inner check itself, and one for the outer border around.
 * The check components are rendered with scalable SVG and
 * are synced to match the color of the parent view's text color by
 * getting the computed color and applying it to the fill or stroke of the
 * svg views.
 *
 * TODO: support disabled/uneditable color style?
 */
(class SvBooleanView extends SvStyledDomView {

    /**
     * @description Initializes the prototype slots for the SvBooleanView.
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} doesClearOnReturn
         * @category Configuration
         */
        {
            const slot = this.newSlot("doesClearOnReturn", false); // needed?
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} doesHoldFocusOnReturn
         * @category Configuration
         */
        {
            const slot = this.newSlot("doesHoldFocusOnReturn", false);  // needed?
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} value
         * @category State
         */
        {
            const slot = this.newSlot("value", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} isEditable
         * @category State
         */
        {
            const slot = this.newSlot("isEditable", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {String} booleanStyle - "checkbox" (the default) or
         * "switch": a sliding switch in SVG, colored by the theme's
         * --sv-switch-* tokens. Set by the field tile from its node
         * (SvBooleanField.nodeBooleanStyle).
         * @category Appearance
         */
        {
            const slot = this.newSlot("booleanStyle", "checkbox");
            slot.setSlotType("String");
        }
        /**
         * @member {SvDomView} switchView - the switch's SVG, made when the
         * style first becomes "switch"
         * @category View Components
         */
        {
            const slot = this.newSlot("switchView", null);
            slot.setSlotType("SvDomView");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {SvDomView} innerCheckView
         * @category View Components
         */
        {
            const slot = this.newSlot("innerCheckView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} outerCheckView
         * @category View Components
         */
        {
            const slot = this.newSlot("outerCheckView", null);
            slot.setSlotType("SvDomView");
        }
    }

    /**
     * @description Initializes the SvBooleanView.
     * @returns {SvBooleanView}
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        // (no filter: a blur(0.2px) softening made every checkbox a filtered
        // compositing layer — dozens on a character sheet, slow in Safari)
        this.flexCenterContent();
        //this.setBorder("1px dashed red")

        this.turnOffUserSelect();
        this.setSpellCheck(false);
        this.setContentEditable(false);

        const size = this.checkboxSize();
        this.setMinAndMaxWidthAndHeight(size);
        //this.setMinAndMaxWidthAndHeight("fit-content")

        this.setOverflow("hidden");

        /*
        const iconSetView = SvDomView.clone().setElementClassName("IconSetView")
        //this.setBorder("1px dashed white")
        iconSetView.setDisplay("flex")
        iconSetView.setPosition("relative")
        //iconSetView.setWidth("fit-content").setHeight("fit-content")
        iconSetView.setMinAndMaxWidthAndHeight(size)
        this.addSubview(iconSetView)
        */

        {
            const inner = SvgIconView.clone().setIconName("inner-checkbox");
            //inner.setBorder("1px dashed blue")
            inner.setDisplay("flex");
            inner.setPosition("absolute");
            inner.setTopPx(0);
            inner.setLeftPx(0);
            inner.setMinAndMaxWidthAndHeight(size);
            inner.setStrokeColor("transparent");
            this.setInnerCheckView(inner);
            this.addSubview(inner);
        }

        {
            const outer = SvgIconView.clone().setIconName("outer-checkbox");
            //outer.setBorder("1px dashed green")
            outer.setDisplay("flex");
            outer.setPosition("absolute");
            outer.setTopPx(0);
            outer.setLeftPx(0);
            outer.setMinAndMaxWidthAndHeight(size);
            outer.setFillColor("transparent");
            this.setOuterCheckView(outer);
            this.addSubview(outer);
        }

        this.setIsEditable(this.isEditable());

        // Ensure initial appearance is updated with the default value
        this.updateAppearance();

        return this;
    }

    /**
     * @description Returns the size of the checkbox.
     * @returns {string}
     * @category Layout
     */
    checkboxSize () {
        return "1em";
    }

    /**
     * @description Sets whether the checkbox is editable.
     * @param {boolean} aBool - Whether the checkbox should be editable.
     * @returns {SvBooleanView}
     * @category State
     */
    setIsEditable (aBool) {
        this._isEditable = aBool;
        this.syncSwitchEditableLook();

        if (this._isEditable) {
            const g = this.addDefaultTapGesture();
            g.setShouldRequestActivation(false); // so the tile doesn't block the initial tap
        } else {
            this.removeDefaultTapGesture();
        }

        this.updateAppearance();

        return this;
    }

    /**
     * @description Toggles the checkbox state.
     * @returns {SvBooleanView}
     * @category User Interaction
     */
    toggle () {
        this.setValue(!this.value());
        this.didEdit();
        return this;
    }

    /**
     * @description Activates the checkbox.
     * @returns {SvBooleanView}
     * @category User Interaction
     */
    activate () {
        this.toggle();
        return this;
    }

    /**
     * @description Sets the value of the checkbox.
     * @param {boolean} v - The value to set.
     * @returns {SvBooleanView}
     * @category State
     */
    setValue (v) {
        if (Type.isNullOrUndefined(v)) {
            v = false;
        }

	    this._value = v;

        this.updateAppearance();
        return this;
    }

    /**
     * @description Gets the value of the checkbox.
     * @returns {boolean}
     * @category State
     */
    value () {
	    return this._value;
    }

    /**
     * @description Checks if the checkbox is checked.
     * @returns {boolean}
     * @category State
     */
    isChecked () {
	    return this.value();
    }

    /**
     * @description Sets the background color.
     * @param {string} s - The color to set.
     * @returns {SvBooleanView}
     * @category Appearance
     */
    setBackgroundColor (s) {
        // needed?
        return this;
    }

    /**
     * @description Updates the appearance of the checkbox.
     * @returns {SvBooleanView}
     * @category Appearance
     */
    updateAppearance () {
        // sent by superview when it changes or syncs to a node
        // so we can update our appearance to match changes to the parent view's style

        //const color = this.getComputedCssProperty("color") // this can cause a reflow, so avoid it
        if (this.isSwitch()) {
            this.switchView().element().setAttribute("data-on", this.value() ? "true" : "false"); // CSS slides the knob
            return this;
        }
        const color = "white";

        this.outerCheckView().setStrokeColor(color);
        this.innerCheckView().setFillColor(this.value() ? color : "transparent");

        return this;
    }

    // --- the switch style ---

    isSwitch () {
        return this.booleanStyle() === "switch";
    }

    /**
     * @description The style changed: show the value as a sliding switch, or
     * as the checkbox. The switch's SVG is made on first use.
     * @category Appearance
     */
    didUpdateSlotBooleanStyle (/*oldValue, newValue*/) {
        const isSwitch = this.isSwitch();
        if (isSwitch) {
            this.setupSwitchViewIfNeeded();
        }
        this.innerCheckView().setDisplay(isSwitch ? "none" : "flex");
        this.outerCheckView().setDisplay(isSwitch ? "none" : "flex");
        if (this.switchView()) {
            this.switchView().setDisplay(isSwitch ? "block" : "none");
        }
        const w = isSwitch ? this.thisClass().switchWidth() : this.checkboxSize();
        const h = isSwitch ? this.thisClass().switchHeight() : this.checkboxSize();
        this.setMinAndMaxWidth(w);
        this.setMinAndMaxHeight(h);
        this.setOverflow(isSwitch ? "visible" : "hidden"); // the knob's shadow falls outside the track
        this.syncSwitchEditableLook();
        this.updateAppearance();
    }

    syncSwitchEditableLook () {
        this.setOpacity(this.isSwitch() && !this.isEditable() ? 0.5 : null); // a read-only switch reads as one
        return this;
    }

    static switchWidth () {
        return 36; // the drawing is 46×28 (its viewBox), shown smaller
    }

    static switchHeight () {
        return 22;
    }

    setupSwitchViewIfNeeded () {
        if (!this.switchView()) {
            this.thisClass().ensureSwitchCss();
            const v = SvDomView.clone();
            v.setPointerEvents("none"); // the boolean view takes the tap
            v.setMinAndMaxWidth(this.thisClass().switchWidth()); // the switch's own size, unclipped (the knob's shadow overhangs)
            v.setMinAndMaxHeight(this.thisClass().switchHeight());
            v.setOverflow("visible");
            v.setInnerHtml("<svg class=\"SvSwitch\" viewBox=\"0 0 46 28\" width=\"" + this.thisClass().switchWidth() + "\" height=\"" + this.thisClass().switchHeight() + "\" aria-hidden=\"true\">"
                + "<rect class=\"SvSwitchTrack\" x=\"0.5\" y=\"0.5\" width=\"45\" height=\"27\" rx=\"13.5\"/>"
                + "<circle class=\"SvSwitchKnob\" cx=\"14\" cy=\"14\" r=\"11.5\"/></svg>");
            this.addSubview(v);
            this.setSwitchView(v);
        }
        return this;
    }

    /**
     * @description The switch's look, installed once. Colors are theme
     * tokens (--sv-switch-on, -off, -knob, -edge, -shadow; defaults in
     * _css.css); the knob slides and the track's color changes by CSS
     * transition when the wrapper's data-on flips — nothing measured.
     * @category Appearance
     */
    static ensureSwitchCss () {
        if (this._hasSwitchCss) {
            return;
        }
        this._hasSwitchCss = true;
        SvWebDocument.shared().addStyleSheetString(`
            .SvSwitch { display: block; overflow: visible; }
            .SvSwitch .SvSwitchTrack {
                fill: var(--sv-switch-off);
                stroke: var(--sv-switch-edge);
                stroke-width: 1;
                transition: fill 0.22s ease;
            }
            [data-on="true"] > .SvSwitch .SvSwitchTrack { fill: var(--sv-switch-on); stroke: transparent; }
            .SvSwitch .SvSwitchKnob {
                fill: var(--sv-switch-knob);
                filter: drop-shadow(0 1.5px 1.5px var(--sv-switch-shadow));
                transition: transform 0.22s cubic-bezier(.2,.8,.2,1);
            }
            [data-on="true"] > .SvSwitch .SvSwitchKnob { transform: translateX(18px); }
        `);
    }

    /**
     * @description Handles the tap complete event.
     * @param {Object} aGesture - The gesture object.
     * @returns {boolean}
     * @category User Interaction
     */
    onTapComplete (aGesture) {
        super.sendActionToTarget();
        this.toggle();
        return false;
    }

}.initThisClass());
