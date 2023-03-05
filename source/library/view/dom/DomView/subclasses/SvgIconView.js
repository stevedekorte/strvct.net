"use strict";

/*

    SvgIconView

    A view to render scalable SVG within a view that can be 
    synced to match the color of the parent view's text color by
    getting the computed color and applying it to the fill or stroke of the
    svg views.

    TODO: support disabled/uneditable color style?


    Example use:

    SvgIconView.clone().setIconName("add")

*/

(class SvgIconView extends FlexDomView {
    
    static initClass () {
        this.newClassSlot("sharedSvgMap", new Map()) // svgStringHash -> hidden svg element defined in document
		return this
    }

    initPrototypeSlots () {
        this.newSlot("svgElement", null)
        this.newSlot("svgString", "")
        this.newSlot("url", null)
        this.newSlot("iconName", null)
        
        this.newSlot("doesMatchParentColor", false).setDoesHookSetter(true)
        this.newSlot("strokeColor", "white").setDoesHookSetter(true)
        this.newSlot("fillColor", "white").setDoesHookSetter(true)
        this.newSlot("strokeWidth", 1).setDoesHookSetter(true)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setElementClassName("SvgIconView")
        this.turnOffUserSelect()
        this.setOverflow("hidden")

        //this.setPosition("absolute")
        //this.setTopPx(0)
        //this.setLeftPx(0)

        this.setPadding("0em")
        this.setMargin("0em")
        
        // /this.setOverflow("hidden")
        this.setOverflow("visible")
        //this.setBorder("1px yellow dashed")
        this.syncColors()

        return this
    }

    debugTypeId () {
        const name = this.iconName()
        return  super.debugTypeId() + (name ? " '" + name + "'" : "")
    }

    clear () {
        this.setSvgString(null)
        this.hideDisplay()
    }

    setIconName (name) {
        if (this._iconName !== name) {
            this._iconName = name

            if (name === null) {
                this.clear()
                return this
            }

            const icons = BMIconResources.shared()
            const iconNode = icons.firstSubnodeWithTitle(name)

            if (iconNode) {
                this.setSvgString(iconNode.svgString())
                this.unhideDisplay()
            } else {
                const error = "can't find icon '" + name + "'"
                console.log(error)
                debugger;
                //throw new Error(error) 
                this.clear()
                return this
            }

            this.setElementId(this.debugTypeId() + " '" + this.svgId() + "'")
        }

        return this
    }

    svgId () {
        return "svgid-" + this.iconName() 
        //return "svgid-" + this.svgString().hashCode()
    }

    setSvgString (s) {
        this._svgString = s

        if (s) {
            // remove and old svg element
            while (this.element().lastChild) {
                this.element().removeChild(this.element().lastChild);
            }

            // add svg element
            const e = SvgIconCache.shared().newLinkElementForSvgString(s)
            this.element().appendChild(e)
            this.setSvgElement(e)
            //e.style.border = "1px blue dashed"
        }

        return this
    }

    // --- color ---

    setColor (aColor) {
        this.setFillColor(aColor)
        this.setStrokeColor(aColor)
        return this
    }
        
    // --- didUpdateSlot hooks ---

    syncColors () {
        const style = this.element().style
        style.setProperty("--fillColor", this.fillColor())
        style.setProperty("--strokeColor", this.strokeColor())
        style.setProperty("--strokeWidth", this.strokeWidth())
    }

    didUpdateSlotFillColor (oldValue, newValue) {
        this.setCssProperty("--fillColor", newValue)
    }

    didUpdateSlotStrokeColor (oldValue, newValue) {
        this.setCssProperty("--strokeColor", newValue)
    }

    didUpdateSlotStrokeWidth (oldValue, newValue) {
        this.setCssProperty("--strokeWidth", newValue)
    }

    // --- variable maps ---
    
    variableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--fillColor)")
        m.set("stroke", "var(--strokeColor)")
        m.set("strokeWidth", "var(--strokeWidth)")
        m.set("transition", "var(--transition)")
        return m
    }

    parentVariableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--color)")
        m.set("stroke", "var(--color)")
        m.set("strokeWidth", "var(--strokeWidth)")
        m.set("transition", "var(--transition)")
        return m
    }

}.initThisClass());
