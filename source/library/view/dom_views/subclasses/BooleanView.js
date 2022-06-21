"use strict";

/*

    BooleanView

    The checkbox is composed of 2 overlapping inner views,
    one for the inner check itself, and one for the outer border around.
    The check components are rendered with scalable SVG and 
    are synced to match the color of the parent view's text color by
    getting the computed color and applying it to the fill or stroke of the
    svg views.

    TODO: support disabled/uneditable color style?

*/

(class BooleanView extends DomStyledView {
    
    initPrototype () {
        this.newSlot("doesClearOnReturn", false)  // needed?
        this.newSlot("doesHoldFocusOnReturn", false)  // needed?
        this.newSlot("value", false)
        this.newSlot("isEditable", false)
        this.newSlot("innerCheckView", null)
        this.newSlot("outerCheckView", null)
    }

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
        const iconSetView = DomView.clone().setDivClassName("IconSetView")
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

    checkboxSize () {
        return "1em"
    }

    // editable
    
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
    
    toggle () {
        this.setValue(!this.value())
        this.didEdit()
        return this
    }
    
    activate () {
        this.toggle()
        return this
    }
    
    // ------------------
    
    setValue (v) {
        if (Type.isNullOrUndefined(v)) {
            v = false;
        }
        
	    this._value = v

        this.updateAppearance()
        return this
    }
	
    value () {
	    return this._value
    }
	
    isChecked () {
	    return this.value()
    }
    
    setBackgroundColor (s) {
        // needed?
        return this
    }
	
    // svg icon

    updateAppearance () {
        // sent by superview when it changes or syncs to a node
        // so we can update our appearance to match changes to the parent view's style

        const color = this.getComputedCssAttribute("color")

        this.outerCheckView().setStrokeColor(color)
        this.innerCheckView().setFillColor(this.value() ? color : "transparent")
        
        return this
    }

    onTapComplete (aGesture) {
        super.sendActionToTarget()
        this.toggle()
        return false
    }
    
}.initThisClass());
