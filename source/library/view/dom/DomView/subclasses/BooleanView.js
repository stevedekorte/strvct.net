"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class BooleanView
 * @extends StyledDomView
 * @classdesc BooleanView represents a checkbox component.
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
(class BooleanView extends StyledDomView {
    
    /**
     * @description Initializes the prototype slots for the BooleanView.
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
         * @member {DomView} innerCheckView
         * @category View Components
         */
        {
            const slot = this.newSlot("innerCheckView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} outerCheckView
         * @category View Components
         */
        {
            const slot = this.newSlot("outerCheckView", null);
            slot.setSlotType("DomView");
        }
    }

    /**
     * @description Initializes the BooleanView.
     * @returns {BooleanView}
     * @category Initialization
     */
    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setFilter("blur(0.2px)")
        this.flexCenterContent()
        //this.setBorder("1px dashed red")
       
        this.turnOffUserSelect()
        this.setSpellCheck(false)
        this.setContentEditable(false)

        const size = this.checkboxSize()
        this.setMinAndMaxWidthAndHeight(size)
        //this.setMinAndMaxWidthAndHeight("fit-content")

        this.setOverflow("hidden")

        /*
        const iconSetView = DomView.clone().setElementClassName("IconSetView")
        //this.setBorder("1px dashed white")
        iconSetView.setDisplay("flex")
        iconSetView.setPosition("relative")
        //iconSetView.setWidth("fit-content").setHeight("fit-content")
        iconSetView.setMinAndMaxWidthAndHeight(size)
        this.addSubview(iconSetView)
        */

        {
            const inner = SvgIconView.clone().setIconName("inner-checkbox")
            //inner.setBorder("1px dashed blue")
            inner.setDisplay("flex")
            inner.setPosition("absolute")
            inner.setTopPx(0)
            inner.setLeftPx(0)
            inner.setMinAndMaxWidthAndHeight(size)
            inner.setStrokeColor("transparent")
            this.setInnerCheckView(inner)
            this.addSubview(inner)
        }

        {
            const outer = SvgIconView.clone().setIconName("outer-checkbox")
            //outer.setBorder("1px dashed green")
            outer.setDisplay("flex")
            outer.setPosition("absolute")
            outer.setTopPx(0)
            outer.setLeftPx(0)
            outer.setMinAndMaxWidthAndHeight(size)
            outer.setFillColor("transparent")
            this.setOuterCheckView(outer)
            this.addSubview(outer)
        }
        
        this.setIsEditable(this.isEditable())

        return this
    }

    /**
     * @description Returns the size of the checkbox.
     * @returns {string}
     * @category Layout
     */
    checkboxSize () {
        return "1em"
    }

    /**
     * @description Sets whether the checkbox is editable.
     * @param {boolean} aBool - Whether the checkbox should be editable.
     * @returns {BooleanView}
     * @category State
     */
    setIsEditable (aBool) {        
        this._isEditable = aBool
        
        if (this._isEditable) {
            const g = this.addDefaultTapGesture()
            g.setShouldRequestActivation(false) // so the tile doesn't block the initial tap
        } else {
            this.removeDefaultTapGesture()
        }
        
        this.updateAppearance()
        
        return this
    }
    
    /**
     * @description Toggles the checkbox state.
     * @returns {BooleanView}
     * @category User Interaction
     */
    toggle () {
        this.setValue(!this.value())
        this.didEdit()
        return this
    }
    
    /**
     * @description Activates the checkbox.
     * @returns {BooleanView}
     * @category User Interaction
     */
    activate () {
        this.toggle()
        return this
    }
    
    /**
     * @description Sets the value of the checkbox.
     * @param {boolean} v - The value to set.
     * @returns {BooleanView}
     * @category State
     */
    setValue (v) {
        if (Type.isNullOrUndefined(v)) {
            v = false;
        }
        
	    this._value = v

        this.updateAppearance()
        return this
    }
	
    /**
     * @description Gets the value of the checkbox.
     * @returns {boolean}
     * @category State
     */
    value () {
	    return this._value
    }
	
    /**
     * @description Checks if the checkbox is checked.
     * @returns {boolean}
     * @category State
     */
    isChecked () {
	    return this.value()
    }
    
    /**
     * @description Sets the background color.
     * @param {string} s - The color to set.
     * @returns {BooleanView}
     * @category Appearance
     */
    setBackgroundColor (s) {
        // needed?
        return this
    }
	
    /**
     * @description Updates the appearance of the checkbox.
     * @returns {BooleanView}
     * @category Appearance
     */
    updateAppearance () {
        // sent by superview when it changes or syncs to a node
        // so we can update our appearance to match changes to the parent view's style

        //const color = this.getComputedCssProperty("color") // this can cause a reflow, so avoid it
        const color = "white"

        this.outerCheckView().setStrokeColor(color)
        this.innerCheckView().setFillColor(this.value() ? color : "transparent")
        
        return this
    }

    /**
     * @description Handles the tap complete event.
     * @param {Object} aGesture - The gesture object.
     * @returns {boolean}
     * @category User Interaction
     */
    onTapComplete (aGesture) {
        super.sendActionToTarget()
        this.toggle()
        return false
    }
    
}.initThisClass());